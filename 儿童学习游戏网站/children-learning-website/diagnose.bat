@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo ========== 诊断开始 ==========
echo 当前目录: %cd%
echo 时间: %date% %time%
echo.

echo --- 系统信息 ---
echo 操作系统: %OS%
systeminfo | findstr /B /C:"OS"
echo.

echo --- Node.js 和 NPM 信息 ---
where node
node -v
where npm
npm -v
echo.

echo --- 目录结构检查 ---
echo 当前目录文件:
dir /b
echo.

echo --- 后端目录检查 ---
if exist backend (
    echo 后端目录存在
    cd backend
    echo 后端目录文件:
    dir /b
    cd ..
) else (
    echo [错误] 后端目录不存在!
)
echo.

echo --- 前端目录检查 ---
if exist frontend (
    echo 前端目录存在
    cd frontend
    echo 前端目录文件:
    dir /b
    cd ..
) else (
    echo [错误] 前端目录不存在!
)
echo.

echo --- 脚本执行测试 ---
echo 测试 cd 命令:
cd backend
echo 切换后目录: %cd%
cd ..
echo 返回后目录: %cd%
echo.

echo --- NPM 配置检查 ---
npm config list
echo.

echo --- 详细错误测试 ---
echo 尝试运行修复脚本的命令:
echo 请注意观察输出，看是否有任何错误信息...
echo.

echo 1. 设置NPM配置
call npm config set registry https://registry.npmmirror.com
if %errorlevel% neq 0 echo [错误] NPM配置设置失败，错误码: %errorlevel%

echo 2. 进入后端目录
cd backend
if %errorlevel% neq 0 echo [错误] 切换到后端目录失败，错误码: %errorlevel%

echo 3. 安装一个测试包
call npm install express --no-save --no-fund --no-audit
if %errorlevel% neq 0 echo [错误] NPM安装测试失败，错误码: %errorlevel%

echo 4. 返回主目录
cd ..
if %errorlevel% neq 0 echo [错误] 返回主目录失败，错误码: %errorlevel%

echo.
echo ========== 诊断完成 ==========
echo.
echo 请将以上诊断信息发送给技术支持。
echo.

echo 接下来将以详细模式再次尝试运行启动脚本...
echo 按任意键继续，或关闭窗口取消...
pause > nul

echo.
echo 正在使用详细模式启动应用...
echo.

@echo on
:: 设置npm配置
call npm config set registry https://registry.npmmirror.com
call npm config set loglevel warn
call npm config set progress false

:: 安装和启动后端
cd backend
call npm install --no-fund --no-audit
start cmd /k "chcp 65001 && title 后端服务器 && node server.js"
cd ..

:: 等待后端启动
timeout /t 5 /nobreak 

:: 安装和启动前端
cd frontend
call npm install --no-fund --no-audit
start cmd /k "chcp 65001 && title 前端服务器 && npm run serve"
cd ..

echo 启动命令执行完毕。
pause 