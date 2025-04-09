@echo on
chcp 65001

REM 设置工作目录
cd /d %~dp0

REM 启动后端
echo 启动后端服务...
start cmd /k "cd backend && node server.js"

REM 等待后端启动
echo 等待5秒...
timeout /t 5

REM 启动前端
echo 启动前端服务...
start cmd /k "cd frontend && npm run serve"

echo.
echo 应用已启动! 请在浏览器中访问: http://localhost:8080
echo.
pause 