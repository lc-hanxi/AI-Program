@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo =====================================================
echo 儿童学习网站启动助手 (增强版)
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

:: 设置npm配置
echo 优化NPM设置...
call npm config set registry https://registry.npmmirror.com
call npm config set loglevel warn
call npm config set progress false
echo NPM设置完成
echo.

:: 验证目录存在
echo 验证目录结构...
if not exist backend (
    echo [错误] 后端目录不存在!
    pause
    exit /b 1
)
if not exist frontend (
    echo [错误] 前端目录不存在!
    pause
    exit /b 1
)
echo 目录结构正常
echo.

:: 安装和启动后端
echo 正在设置后端...
cd backend
echo 当前目录: %cd%

echo 安装后端依赖中...
call npm install --no-fund --no-audit
echo 后端依赖安装完成，错误码: %errorlevel%

:: 启动后端服务器
echo 启动后端服务器...
start cmd /k "chcp 65001 && title 后端服务器 && node server.js"
echo 后端服务器启动命令已执行
cd ..
echo 返回主目录: %cd%
echo.

:: 等待后端启动
echo 等待后端启动 (5秒)...
timeout /t 5 /nobreak > nul
echo 等待完成
echo.

:: 安装和启动前端
echo 正在设置前端...
cd frontend
echo 当前目录: %cd%

echo 安装前端依赖中...
call npm install --no-fund --no-audit
echo 前端依赖安装完成，错误码: %errorlevel%

:: 修复前端package.json中的firebase依赖
echo 更新前端依赖...
call npm uninstall firebase
call npm install axios --save
echo 前端依赖更新完成

:: 启动前端服务器
echo 启动前端服务器...
start cmd /k "chcp 65001 && title 前端服务器 && npm run serve"
echo 前端服务器启动命令已执行
cd ..
echo 返回主目录: %cd%
echo.

echo =====================================================
echo 启动完成！
echo.
echo 前端地址: http://localhost:8080
echo 后端地址: http://localhost:3000
echo.
echo 如果浏览器没有自动打开，请手动访问以上地址
echo =====================================================
echo.
echo 提示: 如需停止服务，请关闭命令行窗口或按Ctrl+C
echo.
pause 