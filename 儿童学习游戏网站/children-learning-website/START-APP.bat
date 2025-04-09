@echo off
rem Set UTF-8 encoding
chcp 65001 > nul
title START APP

rem Display welcome message
echo ==============================================
echo    Children Learning Website - Quick Start
echo ==============================================
echo.

rem Check for dependencies
echo Checking dependencies...
cd frontend

echo Checking axios...
if not exist node_modules\axios (
    echo Installing axios...
    call npm install axios --save --no-fund --no-audit
) else (
    echo Axios is already installed.
)

echo Checking ESLint parser...
if not exist node_modules\@babel\eslint-parser (
    echo Installing ESLint dependencies...
    call npm install --save-dev @babel/eslint-parser @babel/core --no-fund --no-audit
) else (
    echo ESLint parser is already installed.
)

cd ..
echo.

rem Start backend server
echo Starting backend server...
start cmd /c "cd backend && node server.js"

rem Wait 5 seconds
echo Waiting 5 seconds...
ping 127.0.0.1 -n 6 > nul

rem Start frontend service
echo Starting frontend service...
start cmd /c "cd frontend && npm run serve"

echo.
echo ==============================================
echo Application started successfully!
echo.
echo Frontend URL: http://localhost:8080
echo Backend URL: http://localhost:3000
echo.
echo Please open your browser and visit the URL above.
echo ==============================================
echo.
pause 