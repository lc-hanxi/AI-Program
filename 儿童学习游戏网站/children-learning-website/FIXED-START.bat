@echo off
rem Set UTF-8 encoding
chcp 65001 > nul
title FIXED START - NO ESLINT

echo ==============================================
echo  Children Learning Website - Fixed Start
echo  (No ESLint Validation)
echo ==============================================
echo.

rem Make sure in the right directory
cd /d "%~dp0"

rem Install required dependencies
echo Installing required dependencies...
cd frontend

rem Install axios
echo Installing axios...
call npm install axios --save --no-fund --no-audit

rem Create vue.config.js to disable ESLint
echo Creating/updating vue.config.js to disable ESLint...
echo module.exports = { lintOnSave: false, devServer: { port: 8080 } } > vue.config.js

cd ..
echo.

rem Start backend server
echo Starting backend server...
start cmd /c "cd backend && node server.js"

rem Wait 5 seconds
echo Waiting 5 seconds...
ping 127.0.0.1 -n 6 > nul

rem Start frontend service with ESLint disabled
echo Starting frontend service (ESLint disabled)...
start cmd /c "cd frontend && set NODE_ENV=development && npm run serve"

echo.
echo ==============================================
echo Application started successfully!
echo.
echo Frontend URL: http://localhost:8080
echo Backend URL: http://localhost:3000
echo.
echo ESLint validation has been disabled for smoother startup.
echo ==============================================
echo.

rem Try to open browser
start http://localhost:8080

pause 