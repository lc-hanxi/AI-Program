@echo off
chcp 65001 > nul
echo 环境变量检查工具
echo ====================================
echo.

echo 当前工作路径:
echo %cd%
echo.

echo PATH 环境变量:
echo %PATH%
echo.

echo 系统临时目录:
echo %TEMP%
echo.

echo 执行模式检查:
echo %CMDCMDLINE%
echo 批处理脚本路径: %~dp0
echo 批处理完整路径: %~f0
echo.

echo Node.js 路径:
where node 2>nul
if %ERRORLEVEL% EQU 0 (
  echo Node.js 已找到
) else (
  echo Node.js 未找到
)

echo NPM 路径:
where npm 2>nul
if %ERRORLEVEL% EQU 0 (
  echo NPM 已找到
) else (
  echo NPM 未找到
)

echo.
echo ====================================
echo.
echo 检查PowerShell执行策略:
powershell -Command "Get-ExecutionPolicy"
echo.

echo 检查管理员权限:
net session >nul 2>&1
if %ERRORLEVEL% EQU 0 (
  echo 当前运行在管理员权限下
) else (
  echo 当前不是管理员权限运行
)

echo.
echo ====================================
echo.
echo 检查完成! 现在将测试直接执行Node.js:

node -e "console.log('Node.js测试: 运行正常'); process.exit(0);"
echo.

echo 正在测试NPM命令:
npm -v
echo.

pause 