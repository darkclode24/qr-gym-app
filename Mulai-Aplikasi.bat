@echo off
title Memulai QR Gym
echo ==========================================
echo      MEMULAI APLIKASI QR GYM
echo ==========================================
echo.
echo Sedang menjalankan server...
docker-compose up -d
echo.
echo ------------------------------------------
echo BERHASIL! Aplikasi sudah berjalan.
echo Silakan buka browser dan akses:
echo.
echo    http://localhost:3000
echo ------------------------------------------
echo.
echo Jangan tutup jendela ini sampai Anda selesai menggunakan aplikasi.
echo Tekan tombol apa saja untuk menutup jendela ini (aplikasi tetap berjalan).
pause > nul
