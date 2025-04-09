@echo off
chcp 65001 > nul
title 修复中文乱码

echo ======================================
echo         修复中文乱码工具
echo ======================================
echo.

:: 确保在正确的目录
cd /d "%~dp0"
echo 当前目录: %cd%
echo.

echo 正在设置系统默认代码页为UTF-8...

:: 设置系统默认代码页为UTF-8
reg add "HKEY_CURRENT_USER\Console" /v CodePage /t REG_DWORD /d 65001 /f
echo 已将当前用户的命令行默认编码设置为UTF-8(代码页65001)
echo.

echo 正在修复启动脚本编码...
echo.

:: 重新创建PowerShell脚本，确保UTF-8编码
echo # 儿童学习网站启动脚本 > Start-App.ps1.new
echo # 使用方法: 在PowerShell中运行 .\Start-App.ps1 >> Start-App.ps1.new
echo. >> Start-App.ps1.new
echo # 显示标题 >> Start-App.ps1.new
echo Write-Host "=======================================" -ForegroundColor Cyan >> Start-App.ps1.new
echo Write-Host "     儿童学习网站 - 启动程序     " -ForegroundColor Cyan >> Start-App.ps1.new
echo Write-Host "=======================================" -ForegroundColor Cyan >> Start-App.ps1.new
echo Write-Host "" >> Start-App.ps1.new
echo. >> Start-App.ps1.new
echo # 设置工作目录为脚本所在目录 >> Start-App.ps1.new
echo $scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path >> Start-App.ps1.new
echo Set-Location -Path $scriptPath >> Start-App.ps1.new
echo. >> Start-App.ps1.new
echo # 检查Node.js环境 >> Start-App.ps1.new
echo try { >> Start-App.ps1.new
echo     $nodeVersion = node -v >> Start-App.ps1.new
echo     $npmVersion = npm -v >> Start-App.ps1.new
echo     Write-Host "Node.js版本: $nodeVersion" -ForegroundColor Green >> Start-App.ps1.new
echo     Write-Host "NPM版本: $npmVersion" -ForegroundColor Green >> Start-App.ps1.new
echo } >> Start-App.ps1.new
echo catch { >> Start-App.ps1.new
echo     Write-Host "错误: 未找到Node.js或NPM。请安装Node.js: https://nodejs.org/" -ForegroundColor Red >> Start-App.ps1.new
echo     Read-Host "按Enter键退出" >> Start-App.ps1.new
echo     exit >> Start-App.ps1.new
echo } >> Start-App.ps1.new
echo. >> Start-App.ps1.new
echo # 启动后端服务器 >> Start-App.ps1.new
echo Write-Host "`n启动后端服务器..." -ForegroundColor Yellow >> Start-App.ps1.new
echo Start-Process cmd -ArgumentList "/k cd backend ^&^& chcp 65001 ^&^& node server.js" >> Start-App.ps1.new
echo. >> Start-App.ps1.new
echo # 等待后端启动 >> Start-App.ps1.new
echo Write-Host "等待后端服务启动 (5秒)..." -ForegroundColor Yellow >> Start-App.ps1.new
echo Start-Sleep -Seconds 5 >> Start-App.ps1.new
echo. >> Start-App.ps1.new
echo # 启动前端服务 >> Start-App.ps1.new
echo Write-Host "`n启动前端服务..." -ForegroundColor Yellow >> Start-App.ps1.new
echo Start-Process cmd -ArgumentList "/k cd frontend ^&^& chcp 65001 ^&^& npm run serve" >> Start-App.ps1.new
echo. >> Start-App.ps1.new
echo Write-Host "`n=======================================" -ForegroundColor Cyan >> Start-App.ps1.new
echo Write-Host "应用启动成功!" -ForegroundColor Green >> Start-App.ps1.new
echo Write-Host "前端地址: http://localhost:8080" -ForegroundColor Green >> Start-App.ps1.new
echo Write-Host "后端地址: http://localhost:3000" -ForegroundColor Green >> Start-App.ps1.new
echo Write-Host "" >> Start-App.ps1.new
echo Write-Host "关闭此窗口不会停止应用。要停止应用，请关闭弹出的命令行窗口。" -ForegroundColor Yellow >> Start-App.ps1.new
echo Write-Host "=======================================" -ForegroundColor Cyan >> Start-App.ps1.new
echo. >> Start-App.ps1.new
echo Read-Host "按Enter键继续(应用将在后台运行)" >> Start-App.ps1.new

:: 使用临时文件替换原始文件
del Start-App.ps1
rename Start-App.ps1.new Start-App.ps1

echo 已修复PowerShell脚本编码问题
echo.

echo ======================================
echo         修复完成!
echo ======================================
echo.
echo 现在您可以运行以下任一脚本启动应用:
echo.
echo 1. 使用CMD双击运行: 一键安装和启动.bat
echo 2. 使用CMD双击运行: easy-start.bat
echo 3. 在PowerShell中输入: .\Start-App.ps1
echo.
echo 如果仍有问题，请尝试重启计算机后再试。
echo.
pause 