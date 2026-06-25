@echo off
title Install QR Gym
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0QR-Gym.ps1" -Action Install
echo.
pause
