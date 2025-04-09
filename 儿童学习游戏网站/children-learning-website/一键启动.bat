@echo off
chcp 65001 > nul
title 一键启动

echo 正在启动后端服务...
start cmd /c 启动后端.bat

echo 正在启动前端服务...
start cmd /c 启动前端.bat

echo.
echo 启动完成！
echo 请访问：http://localhost:8080
echo.
pause 