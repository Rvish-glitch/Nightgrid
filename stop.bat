@echo off
title Stop Geofencing Services
echo =========================================================
echo   Stopping Geofencing Backend & Frontend Services...
echo =========================================================
echo.

echo [1/2] Terminating Go backend processes...
taskkill /F /IM server.exe 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING 2^>nul') do (
    taskkill /F /PID %%a 2>nul
)

echo [2/2] Terminating Frontend processes (Port 3000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING 2^>nul') do (
    taskkill /F /PID %%a 2>nul
)

echo.
echo =========================================================
echo   All Geofencing processes stopped and ports 8080 & 3000 freed!
echo =========================================================
echo.
pause

