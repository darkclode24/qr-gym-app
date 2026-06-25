@echo off
title Update QR Gym
echo ==========================================
echo      MENGUPDATE APLIKASI QR GYM
echo ==========================================
echo.
echo Sedang mendownload update dan membangun ulang server...
echo Proses ini memerlukan koneksi internet dan waktu beberapa menit.
echo.
docker-compose up -d --build
echo.
echo ------------------------------------------
echo BERHASIL! Aplikasi telah diperbarui ke versi terbaru.
echo Silakan buka browser dan akses:
echo.
echo    http://localhost:3000
echo ------------------------------------------
echo.
echo Tekan tombol apa saja untuk menutup jendela ini.
pause > nul
