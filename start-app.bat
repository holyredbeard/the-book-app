@echo off
title Book App Server
cd /d "%~dp0"

:: Check if server is already running on port 5173
netstat -ano | findstr :5173 >nul
if %errorlevel%==0 (
    echo Server already running, opening browser...
    start chrome http://localhost:5173
    exit
)

:: Start the dev server and open browser
start "" cmd /c "npm run dev"

:: Wait for server to start
timeout /t 3 /nobreak >nul

:: Open Chrome
start chrome http://localhost:5173
