@echo off
title Enable QR Gym Automatic Updates
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0QR-Gym.ps1" -Action EnableAutoUpdate
echo.
pause
