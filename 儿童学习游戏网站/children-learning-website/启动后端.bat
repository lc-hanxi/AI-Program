@echo off
rem 设置为UTF-8编码
chcp 65001 > nul
title 后端服务器

cd backend
node server.js
pause 