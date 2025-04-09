@echo off
chcp 65001
echo 中文测试 - Chinese Test
echo 这是一个测试脚本，用于验证中文显示是否正常
echo.
echo 当前代码页:
chcp
echo.
echo 系统信息:
systeminfo | findstr /B /C:"OS"
echo.
echo 测试完成！请检查以上中文是否显示正常。
pause 