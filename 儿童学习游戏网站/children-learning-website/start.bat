@echo off
chcp 65001 > nul
echo 正在启动儿童学习网站...
echo.

echo 设置npm使用淘宝镜像源以加快下载速度...
call npm config set registry https://registry.npmmirror.com

echo 清理npm缓存...
call npm cache clean --force

echo 启动后端服务器...
start cmd /k "cd backend && chcp 65001 && npm install --registry=https://registry.npmmirror.com --no-fund --no-audit --loglevel=info && npm start"

echo 等待5秒钟...
timeout /t 5 /nobreak > nul

echo 启动前端应用...
start cmd /k "cd frontend && chcp 65001 && npm install --registry=https://registry.npmmirror.com --no-fund --no-audit --loglevel=info && npm run serve"

echo.
echo 应用启动中，请稍候...
echo 前端页面将自动在浏览器中打开
echo 如果没有自动打开，请手动访问: http://localhost:8080
echo.
echo 提示: 如果安装过程卡住，可以按Ctrl+C中断，然后手动在backend和frontend目录中分别执行npm install和npm start/npm run serve命令 