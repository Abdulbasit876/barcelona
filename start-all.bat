@echo off
title Starting Barcelona Taxi Transfer (Production Mode)
echo ========================================================
echo   Starting Barcelona Taxi Transfer (All Portals)
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] Starting Unified NestJS Backend (Port 4001)...
start "BTT - Backend (Port 4001)" cmd.exe /k "npm --prefix backend run start"

echo [2/2] Starting Unified Next.js Frontend (Port 3000)...
start "BTT - Frontend (Port 3000)" cmd.exe /k "npm --prefix frontend run start"

echo.
echo Waiting 5 seconds for servers to initialize...
ping -n 6 127.0.0.1 > nul

echo.
echo Opening browser tabs...
start http://localhost:3000
start http://localhost:3000/admin
start http://localhost:3000/driver
start http://localhost:4001/api/docs

echo.
echo ========================================================
echo   Both applications are running!
echo   * Customer Website: http://localhost:3000
echo   * Admin Dashboard:  http://localhost:3000/admin
echo   * Driver Portal:    http://localhost:3000/driver
echo   * Backend Swagger:  http://localhost:4001/api/docs
echo ========================================================
pause
