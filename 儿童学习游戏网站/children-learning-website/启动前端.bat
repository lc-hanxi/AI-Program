@echo off
rem 设置为UTF-8编码
chcp 65001 > nul
title 前端服务器

cd frontend
npm run serve
pause 