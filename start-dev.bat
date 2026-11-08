@echo off
title Starting Barcelona Taxi Transfer (Development Mode)
echo ========================================================
echo   Starting Barcelona Taxi Transfer (Development Mode)
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] Starting Unified NestJS Backend in Dev Mode (Port 4001)...
start "BTT - Backend Dev (Port 4001)" cmd.exe /k "npm --prefix backend run start:dev"

echo [2/2] Starting Unified Next.js Frontend in Dev Mode (Port 3000)...
start "BTT - Frontend Dev (Port 3000)" cmd.exe /k "npm --prefix frontend run dev"

echo.
echo Waiting 5 seconds for dev servers to initialize...
ping -n 6 127.0.0.1 > nul

echo.
echo Opening browser tabs...
start http://localhost:3000
start http://localhost:3000/admin
start http://localhost:3000/driver
start http://localhost:4001/api/docs

echo.
echo ========================================================
echo   Both applications are running in Development Mode!
echo   * Customer Website: http://localhost:3000
echo   * Admin Dashboard:  http://localhost:3000/admin
echo   * Driver Portal:    http://localhost:3000/driver
echo   * Backend Swagger:  http://localhost:4001/api/docs
echo ========================================================
pause
