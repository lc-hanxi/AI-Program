# PowerShell专用启动脚本
# 使用方法: 右键点击此文件 -> 选择"使用PowerShell运行"

# 设置控制台编码为UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "     儿童学习网站 - PowerShell启动     " -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# 设置工作目录为脚本所在目录
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -Path $scriptPath
Write-Host "当前工作目录: $scriptPath" -ForegroundColor Yellow
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
$backendProcess = Start-Process cmd -ArgumentList "/k cd $scriptPath\backend && chcp 65001 && title 后端服务器 && node server.js" -PassThru

# 等待后端启动
Write-Host "等待后端启动 (5秒)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 启动前端服务
Write-Host "`n启动前端服务..." -ForegroundColor Yellow
$frontendProcess = Start-Process cmd -ArgumentList "/k cd $scriptPath\frontend && chcp 65001 && title 前端服务器 && npm run serve" -PassThru

Write-Host "`n=======================================" -ForegroundColor Cyan
Write-Host "应用启动成功!" -ForegroundColor Green
Write-Host "前端地址: http://localhost:8080" -ForegroundColor Green
Write-Host "后端地址: http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "关闭此窗口不会停止应用。要停止应用，请关闭弹出的命令行窗口。" -ForegroundColor Yellow
Write-Host "=======================================" -ForegroundColor Cyan

# 自动打开浏览器
try {
    Start-Process "http://localhost:8080"
    Write-Host "已自动打开浏览器" -ForegroundColor Green
}
catch {
    Write-Host "无法自动打开浏览器，请手动访问 http://localhost:8080" -ForegroundColor Yellow
}

Read-Host "按Enter键继续(应用将在后台运行)" 