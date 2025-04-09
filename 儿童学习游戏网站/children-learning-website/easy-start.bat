@echo off
chcp 65001 > nul
title 儿童学习网站 - 超简单启动器

echo ======================================
echo       儿童学习网站 - 超简单启动器
echo ======================================
echo.

:: 确保在正确的目录
cd /d "%~dp0"
echo 当前目录: %cd%
echo.

:: 直接启动，不安装依赖
echo 正在启动后端服务...
start cmd /k "cd backend && chcp 65001 && title 后端服务器 && node server.js"

echo 等待后端启动 (3秒)...
ping 127.0.0.1 -n 4 > nul

echo 正在启动前端服务...
start cmd /k "cd frontend && chcp 65001 && title 前端服务器 && npm run serve"

echo.
echo ======================================
echo 应用启动成功!
echo.
echo 前端地址: http://localhost:8080
echo 后端地址: http://localhost:3000
echo.
echo 提示: 要停止服务，请关闭弹出的命令行窗口
echo ======================================
echo.
echo 按任意键关闭此窗口...
pause > nul 