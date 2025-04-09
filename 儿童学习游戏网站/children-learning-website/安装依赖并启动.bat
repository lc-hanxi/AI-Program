@echo off
rem Set UTF-8 encoding
chcp 65001 > nul
title Install and Start

echo =======================================
echo   Install Dependencies and Start App
echo =======================================
echo.

rem Make sure running from the right directory
cd /d "%~dp0"

rem Check Node.js
echo Checking Node.js...
node --version > nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js not found!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

rem Install backend dependencies
echo.
echo Installing backend dependencies...
cd backend
call npm install --no-fund --no-audit
cd ..

rem Install frontend dependencies
echo.
echo Installing frontend dependencies...
cd frontend
call npm install --no-fund --no-audit
echo.
echo Installing axios for HTTP requests...
call npm install axios --save --no-fund --no-audit
echo.
echo Installing ESLint dependencies...
call npm install --save-dev @babel/eslint-parser @babel/core --no-fund --no-audit
cd ..

rem Start backend server
echo.
echo Starting backend server...
start cmd /c "cd backend && node server.js"

rem Wait for backend to start
echo Waiting for backend to start...
ping 127.0.0.1 -n 6 > nul

rem Start frontend
echo.
echo Starting frontend...
start cmd /c "cd frontend && npm run serve"

echo.
echo =======================================
echo       Application Started!
echo.
echo Frontend URL: http://localhost:8080
echo Backend URL: http://localhost:3000
echo.
echo To stop the application, close the 
echo command windows that opened.
echo =======================================
echo.

rem Try to open browser
start http://localhost:8080

pause 