# 使用正确编码的PowerShell启动脚本

# 设置输出编码为UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 显示标题
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "     儿童学习网站 - 启动程序     " -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# 检查Node.js环境
try {
    $nodeVersion = node -v
    $npmVersion = npm -v
    Write-Host "Node.js版本: $nodeVersion" -ForegroundColor Green
    Write-Host "NPM版本: $npmVersion" -ForegroundColor Green
}
catch {
    Write-Host "错误: 未找到Node.js或NPM。请安装Node.js: https://nodejs.org/" -ForegroundColor Red
    Read-Host "按Enter键退出"
    exit
}

# 启动后端服务器
Write-Host "`n启动后端服务器..." -ForegroundColor Yellow

# 创建启动后端的脚本
$backendScript = @"
cd backend
chcp 65001
title 后端服务器
node server.js
"@

$backendScriptPath = Join-Path -Path $PWD -ChildPath "temp_backend.bat"
$backendScript | Out-File -FilePath $backendScriptPath -Encoding utf8

# 启动后端进程
Start-Process -FilePath "cmd.exe" -ArgumentList "/c $backendScriptPath"

# 等待后端启动
Write-Host "等待后端服务启动 (5秒)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 启动前端服务
Write-Host "`n启动前端服务..." -ForegroundColor Yellow

# 创建启动前端的脚本
$frontendScript = @"
cd frontend
chcp 65001
title 前端服务器
npm run serve
"@

$frontendScriptPath = Join-Path -Path $PWD -ChildPath "temp_frontend.bat"
$frontendScript | Out-File -FilePath $frontendScriptPath -Encoding utf8

# 启动前端进程
Start-Process -FilePath "cmd.exe" -ArgumentList "/c $frontendScriptPath"

Write-Host "`n=======================================" -ForegroundColor Cyan
Write-Host "应用启动成功!" -ForegroundColor Green
Write-Host "前端地址: http://localhost:8080" -ForegroundColor Green
Write-Host "后端地址: http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "关闭此窗口不会停止应用。要停止应用，请关闭弹出的命令行窗口。" -ForegroundColor Yellow
Write-Host "=======================================" -ForegroundColor Cyan

# 尝试打开浏览器
try {
    Start-Process "http://localhost:8080"
}
catch {
    Write-Host "无法自动打开浏览器，请手动访问 http://localhost:8080" -ForegroundColor Yellow
}

Read-Host "按Enter键继续(应用将在后台运行)" 