@echo off
title Start QR Gym
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0QR-Gym.ps1" -Action Start
echo.
pause
