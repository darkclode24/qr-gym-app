param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("Install", "Start", "Update", "Backup", "EnableAutoUpdate")]
  [string]$Action
)

$ErrorActionPreference = "Stop"
$DeploymentDirectory = $PSScriptRoot
$ComposeFile = Join-Path $DeploymentDirectory "compose.yaml"
$EnvironmentFile = Join-Path $DeploymentDirectory ".env"
$ContainerName = "qr-gym-app"
$DataVolume = "qr-gym_qr-gym-data"
$UploadsVolume = "qr-gym_qr-gym-uploads"
$DefaultImage = "ghcr.io/darkclode24/qr-gym-app:stable"
$BackupRoot = Join-Path ([Environment]::GetFolderPath("MyDocuments")) "QR-Gym-Backups"

Set-Location $DeploymentDirectory

function Invoke-Docker {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Arguments,
    [switch]$Capture
  )

  if ($Capture) {
    $output = & docker @Arguments 2>$null
    if ($LASTEXITCODE -ne 0) {
      throw "Docker command failed: docker $($Arguments -join ' ')"
    }
    return ($output | Out-String).Trim()
  }

  & docker @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Docker command failed: docker $($Arguments -join ' ')"
  }
}

function Test-Docker {
  if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "Docker Desktop is not installed. Install Docker Desktop, restart Windows, then try again."
  }

  & docker info *> $null
  return $LASTEXITCODE -eq 0
}

function Wait-ForDocker {
  if (Test-Docker) {
    return
  }

  $dockerDesktop = Join-Path $env:ProgramFiles "Docker\Docker\Docker Desktop.exe"
  if (Test-Path $dockerDesktop) {
    Start-Process $dockerDesktop
  }

  Write-Host "Waiting for Docker Desktop..."
  for ($attempt = 0; $attempt -lt 60; $attempt++) {
    Start-Sleep -Seconds 2
    if (Test-Docker) {
      return
    }
  }

  throw "Docker Desktop did not start within two minutes."
}

function Ensure-Environment {
  if (Test-Path $EnvironmentFile) {
    return
  }

  $bytes = New-Object byte[] 48
  $generator = [Security.Cryptography.RandomNumberGenerator]::Create()
  try {
    $generator.GetBytes($bytes)
  } finally {
    $generator.Dispose()
  }

  $secret = [Convert]::ToBase64String($bytes).TrimEnd("=").Replace("+", "-").Replace("/", "_")
  $contents = "AUTH_SECRET=$secret`r`nAUTH_TRUST_HOST=true`r`n"
  [IO.File]::WriteAllText($EnvironmentFile, $contents, (New-Object Text.UTF8Encoding($false)))
}

function Ensure-Volume {
  param([string]$Name)

  & docker volume inspect $Name *> $null
  if ($LASTEXITCODE -ne 0) {
    Invoke-Docker -Arguments @("volume", "create", $Name)
  }
}

function Ensure-Prerequisites {
  Wait-ForDocker
  Ensure-Environment
  Ensure-Volume $DataVolume
  Ensure-Volume $UploadsVolume
}

function Get-ContainerValue {
  param([string]$Template)

  $value = & docker inspect --format $Template $ContainerName 2>$null
  if ($LASTEXITCODE -ne 0) {
    return $null
  }
  return ($value | Out-String).Trim()
}

function Wait-ForHealthyApp {
  for ($attempt = 0; $attempt -lt 36; $attempt++) {
    $health = Get-ContainerValue "{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}"
    if ($health -eq "healthy") {
      return $true
    }
    if ($health -eq "exited" -or $health -eq "dead") {
      return $false
    }
    Start-Sleep -Seconds 5
  }
  return $false
}

function New-StoppedBackup {
  $timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
  $backupDirectory = Join-Path $BackupRoot $timestamp
  New-Item -ItemType Directory -Path $backupDirectory -Force | Out-Null

  Write-Host "Creating database and upload backup at $backupDirectory"
  Invoke-Docker -Arguments @("pull", "alpine:3.20")
  Invoke-Docker -Arguments @(
    "run", "--rm",
    "--mount", "source=$DataVolume,target=/source,readonly",
    "--mount", "type=bind,source=$backupDirectory,target=/backup",
    "alpine:3.20", "sh", "-c", "cd /source && tar -czf /backup/database.tar.gz ."
  )
  Invoke-Docker -Arguments @(
    "run", "--rm",
    "--mount", "source=$UploadsVolume,target=/source,readonly",
    "--mount", "type=bind,source=$backupDirectory,target=/backup",
    "alpine:3.20", "sh", "-c", "cd /source && tar -czf /backup/uploads.tar.gz ."
  )

  $databaseBackup = Join-Path $backupDirectory "database.tar.gz"
  $uploadsBackup = Join-Path $backupDirectory "uploads.tar.gz"
  if ((Get-Item $databaseBackup).Length -le 0 -or (Get-Item $uploadsBackup).Length -le 0) {
    throw "Backup verification failed. The application has not been updated."
  }

  return $backupDirectory
}

function Start-App {
  Ensure-Prerequisites
  Invoke-Docker -Arguments @("compose", "-f", $ComposeFile, "up", "-d")
  if (-not (Wait-ForHealthyApp)) {
    throw "QR Gym failed to start. Run 'Update QR Gym.bat' or contact the developer."
  }
  Start-Process "http://localhost:3000"
}

function Backup-App {
  Ensure-Prerequisites
  $wasRunning = (Get-ContainerValue "{{.State.Running}}") -eq "true"

  if ($wasRunning) {
    Invoke-Docker -Arguments @("compose", "-f", $ComposeFile, "stop", "app")
  }

  try {
    $backupDirectory = New-StoppedBackup
  } finally {
    if ($wasRunning) {
      Invoke-Docker -Arguments @("compose", "-f", $ComposeFile, "up", "-d")
    }
  }

  Write-Host "Backup completed: $backupDirectory"
}

function Update-App {
  Ensure-Prerequisites

  $oldImage = Get-ContainerValue "{{.Image}}"
  Write-Host "Downloading the tested QR Gym release..."
  Invoke-Docker -Arguments @("compose", "-f", $ComposeFile, "pull", "app")

  $wasRunning = (Get-ContainerValue "{{.State.Running}}") -eq "true"
  if ($wasRunning) {
    Invoke-Docker -Arguments @("compose", "-f", $ComposeFile, "stop", "app")
  }

  try {
    $backupDirectory = New-StoppedBackup
  } catch {
    if ($wasRunning) {
      Invoke-Docker -Arguments @("compose", "-f", $ComposeFile, "up", "-d")
    }
    throw
  }

  Write-Host "Starting the new release..."
  Invoke-Docker -Arguments @("compose", "-f", $ComposeFile, "up", "-d", "--force-recreate")

  if (Wait-ForHealthyApp) {
    Write-Host "Update completed. Backup: $backupDirectory"
    return
  }

  Write-Warning "The new release failed its health check. Starting the previous application image."
  Invoke-Docker -Arguments @("compose", "-f", $ComposeFile, "stop", "app")

  if ($oldImage) {
    $rollbackImage = "qr-gym-app:rollback"
    Invoke-Docker -Arguments @("tag", $oldImage, $rollbackImage)
    $env:QR_GYM_IMAGE = $rollbackImage
    try {
      Invoke-Docker -Arguments @("compose", "-f", $ComposeFile, "up", "-d", "--force-recreate")
    } finally {
      Remove-Item Env:QR_GYM_IMAGE -ErrorAction SilentlyContinue
    }
  }

  throw "Update failed and was rolled back. Data was not deleted. Backup: $backupDirectory"
}

function Install-App {
  Ensure-Prerequisites

  if (Get-ContainerValue "{{.Id}}") {
    Update-App
  } else {
    Invoke-Docker -Arguments @("compose", "-f", $ComposeFile, "pull", "app")
    Invoke-Docker -Arguments @("compose", "-f", $ComposeFile, "up", "-d")
    if (-not (Wait-ForHealthyApp)) {
      throw "Installation failed. No existing database data was deleted."
    }
  }

  Start-Process "http://localhost:3000"
}

function Enable-AutoUpdate {
  Ensure-Prerequisites
  $taskAction = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`" -Action Update"
  $taskTrigger = New-ScheduledTaskTrigger -Daily -At 6am
  Register-ScheduledTask `
    -TaskName "QR Gym Safe Update" `
    -Action $taskAction `
    -Trigger $taskTrigger `
    -Description "Back up QR Gym and install the latest tested release." `
    -Force | Out-Null
  Write-Host "Automatic safe update enabled for 06:00 every day."
}

try {
  switch ($Action) {
    "Install" { Install-App }
    "Start" { Start-App }
    "Update" { Update-App }
    "Backup" { Backup-App }
    "EnableAutoUpdate" { Enable-AutoUpdate }
  }
  Write-Host ""
  Write-Host "Operation completed successfully."
  exit 0
} catch {
  Write-Host ""
  Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host "No command in this installer deletes Docker volumes or backup folders." -ForegroundColor Yellow
  exit 1
}
