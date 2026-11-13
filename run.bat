@echo off
setlocal EnableDelayedExpansion
title Geofencing and Real-Time Alert System Launcher

echo =========================================================
echo   Geofencing and Real-Time Alert System Launcher
echo =========================================================
echo.

set "SCRIPT_DIR=%~dp0"
if exist "%SCRIPT_DIR%backend" (
    set "PROJECT_DIR=%SCRIPT_DIR%"
) else if exist "%SCRIPT_DIR%Geofencing-Real-time-Alert-System\backend" (
    set "PROJECT_DIR=%SCRIPT_DIR%Geofencing-Real-time-Alert-System"
) else (
    set "PROJECT_DIR=%SCRIPT_DIR%"
)

set "BACKEND_DIR=%PROJECT_DIR%\backend"
set "FRONTEND_DIR=%PROJECT_DIR%\frontend"

echo [1/3] Starting Go Backend in a new PowerShell window...
start "Geofencing-Backend" powershell.exe -NoExit -ExecutionPolicy Bypass -Command "Set-Location '%BACKEND_DIR%'; Write-Host '==================================================' -ForegroundColor Cyan; Write-Host ' Geofencing Backend Server (Port 8080)' -ForegroundColor Green; Write-Host ' Swagger UI: http://localhost:8080/swagger' -ForegroundColor Yellow; Write-Host ' WebSocket:  ws://localhost:8080/ws/alerts' -ForegroundColor Yellow; Write-Host '==================================================' -ForegroundColor Cyan; if (Test-Path 'server.exe') { .\server.exe } else { go run cmd/server/main.go }"

timeout /t 2 /nobreak >nul

echo [2/3] Starting React Frontend in a new PowerShell window...
start "Geofencing-Frontend" powershell.exe -NoExit -ExecutionPolicy Bypass -Command "$env:BUN_TMPDIR = 'C:\Users\vishw\AppData\Local\Temp'; $env:Path += ';C:\Users\vishw\.bun\bin'; Set-Location '%FRONTEND_DIR%'; Write-Host '==================================================' -ForegroundColor Cyan; Write-Host ' Geofencing Frontend Dashboard (Port 3000)' -ForegroundColor Green; Write-Host ' URL: http://localhost:3000' -ForegroundColor Yellow; Write-Host '==================================================' -ForegroundColor Cyan; if (Get-Command bun -ErrorAction SilentlyContinue) { bun run dev } else { npm run dev }"

timeout /t 2 /nobreak >nul

echo [3/3] Opening Dashboard in default web browser...
start http://localhost:3000

echo.
echo =========================================================
echo   Both services are running in separate PowerShell windows!
echo   - Frontend Dashboard: http://localhost:3000
echo   - Backend Swagger UI: http://localhost:8080/swagger
echo   - WebSocket Feed:     ws://localhost:8080/ws/alerts
echo =========================================================
echo.
pause

