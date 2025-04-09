@echo off
chcp 65001 > nul
title 儿童学习网站 - 一键安装和启动

echo ======================================
echo     儿童学习网站 - 一键安装和启动
echo ======================================
echo.

:: 确保在正确的目录
cd /d "%~dp0"
echo 当前目录: %cd%
echo.

:: 检查Node.js环境
echo 检查Node.js环境...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未找到Node.js! 请先安装Node.js: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Node.js版本:
node -v
echo NPM版本:
npm -v
echo.

:: 安装后端依赖
echo 正在安装后端依赖...
cd backend
call npm install --no-fund --no-audit
if %errorlevel% neq 0 (
    echo [警告] 后端依赖安装可能有问题，但将继续尝试启动...
)
cd ..
echo.

:: 安装前端依赖
echo 正在安装前端依赖...
cd frontend
call npm install --no-fund --no-audit
if %errorlevel% neq 0 (
    echo [警告] 前端依赖安装可能有问题，但将继续尝试启动...
)
cd ..
echo.

:: 启动后端服务器
echo 正在启动后端服务...
start cmd /k "cd backend && chcp 65001 && title 后端服务器 && node server.js"

echo 等待后端启动 (3秒)...
ping 127.0.0.1 -n 4 > nul

:: 启动前端服务
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