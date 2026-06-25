@echo off
title Update QR Gym
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0QR-Gym.ps1" -Action Update
echo.
pause
