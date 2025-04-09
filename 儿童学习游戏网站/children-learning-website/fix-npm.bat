@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo =====================================================
echo NPM环境修复工具
echo =====================================================
echo.

:: 检查Node.js是否安装
echo 正在检查Node.js环境...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未找到Node.js! 请先安装Node.js: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 显示Node和NPM版本
echo Node.js版本:
node -v
echo NPM版本:
npm -v
echo.

:: 清理NPM缓存
echo 正在清理NPM缓存...
call npm cache clean --force
echo.

:: 重置NPM配置
echo 正在重置NPM配置...
call npm config set registry https://registry.npmmirror.com
call npm config set loglevel info
call npm config set fetch-timeout 300000
call npm config set fetch-retry-mintimeout 20000
call npm config set fetch-retry-maxtimeout 120000
echo.

:: 检查和修复前端目录
echo 正在检查和修复前端目录...
cd frontend

if exist node_modules (
    echo 删除前端node_modules目录...
    rmdir /s /q node_modules
    if exist package-lock.json del package-lock.json
)

echo 正在尝试安装前端依赖...
call npm install --no-fund --no-audit --verbose
echo.

cd ..

:: 检查和修复后端目录
echo 正在检查和修复后端目录...
cd backend

if exist node_modules (
    echo 删除后端node_modules目录...
    rmdir /s /q node_modules
    if exist package-lock.json del package-lock.json
)

echo 正在尝试安装后端依赖...
call npm install --no-fund --no-audit --verbose
echo.

cd ..

echo =====================================================
echo NPM环境修复完成!
echo.
echo 如果以上步骤没有报错，请尝试运行fix-and-start.bat
echo 如果仍然有问题，请联系技术支持
echo =====================================================
echo.
pause 