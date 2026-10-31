@echo off
title Starting Barcelona Taxi Transfer Dev Mode
echo ========================================================
echo   Starting Barcelona Taxi Transfer (Dev Mode)
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Starting Admin Backend API (Port 4001)...
start "BTT - Admin API (Port 4001)" cmd.exe /k "npm --prefix admin/api run start:dev"

echo [2/3] Starting Customer Website (Port 3000)...
start "BTT - Customer Web (Port 3000)" cmd.exe /k "npm run dev:web"

echo [3/3] Starting Admin Dashboard & Driver (Port 3001)...
start "BTT - Admin & Driver (Port 3001)" cmd.exe /k "npm --prefix admin/web run dev"

echo.
echo Waiting 5 seconds...
ping -n 6 127.0.0.1 > nul

echo.
echo Opening browser tabs...
start http://localhost:3000
start http://localhost:3001
start http://localhost:3001/driver

pause
