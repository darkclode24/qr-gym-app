@echo off
title Backup QR Gym
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0QR-Gym.ps1" -Action Backup
echo.
pause
