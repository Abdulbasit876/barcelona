@echo off
title Starting Barcelona Taxi Transfer Portals
echo ========================================================
echo   Starting Barcelona Taxi Transfer (All Portals)
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Starting Admin Backend API (Port 4001)...
start "BTT - Admin API (Port 4001)" cmd.exe /k "npm --prefix admin/api run start"

echo [2/3] Starting Customer Website (Port 3000)...
start "BTT - Customer Web (Port 3000)" cmd.exe /k "npm --prefix apps/web run start"

echo [3/3] Starting Admin Dashboard & Driver Portal (Port 3001)...
start "BTT - Admin & Driver (Port 3001)" cmd.exe /k "npm --prefix admin/web run start"

echo.
echo Waiting 4 seconds for servers to initialize...
ping -n 5 127.0.0.1 > nul

echo.
echo Opening browser tabs...
start http://localhost:3000
start http://localhost:3001
start http://localhost:3001/driver

echo.
echo ========================================================
echo   All portals are running!
echo   * Customer Website: http://localhost:3000
echo   * Admin Dashboard:  http://localhost:3001
echo   * Driver Portal:    http://localhost:3001/driver
echo ========================================================
pause
