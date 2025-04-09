@echo off
chcp 65001 > nul
title 启动儿童学习网站

:: 设置工作目录
cd /d "%~dp0"

:: 启动后端
echo 正在启动后端服务...
start cmd /k "cd backend & chcp 65001 & node server.js"

:: 等待5秒
echo 等待5秒...
ping 127.0.0.1 -n 6 > nul

:: 启动前端
echo 正在启动前端服务...
start cmd /k "cd frontend & chcp 65001 & npm run serve"

echo.
echo 启动完成！请访问：http://localhost:8080
echo.
pause 