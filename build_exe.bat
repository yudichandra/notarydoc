@echo off
echo ========================================================
echo  Membangun Aplikasi Native Windows (Single File .exe)
echo  Generator Akta Pernyataan Keputusan Sirkuler Notaris
echo ========================================================
echo.

echo [1/2] Mengompilasi Aplikasi Standalone (Tauri Release)...
call npx tauri build --no-bundle
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Gagal kompilasi aplikasi!
    exit /b %ERRORLEVEL%
)

echo.
echo [2/2] Menyalin file executable tunggal...
copy /Y "src-tauri\target\release\generator_akta_sirkuler.exe" "GeneratorAktaSirkuler.exe"

echo.
echo ========================================================
echo  SELESAI! File EXE tunggal berhasil dibuat:
echo  File: GeneratorAktaSirkuler.exe
echo  Tinggal copy file ini ke komputer mana pun (Windows 10/11)
echo  dan langsung klik 2x untuk dijalankan!
echo ========================================================
pause
