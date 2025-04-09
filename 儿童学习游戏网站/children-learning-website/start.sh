#!/bin/bash

echo "正在启动儿童学习网站..."
echo ""

echo "启动后端服务器..."
# 打开新终端并启动后端服务器
if [[ "$OSTYPE" == "darwin"* ]]; then
  # MacOS
  osascript -e 'tell app "Terminal" to do script "cd '$(pwd)'/backend && npm install && npm start"'
else
  # Linux
  gnome-terminal -- bash -c "cd '$(pwd)'/backend && npm install && npm start; exec bash"
fi

echo "等待3秒钟..."
sleep 3

echo "启动前端应用..."
# 打开新终端并启动前端服务器
if [[ "$OSTYPE" == "darwin"* ]]; then
  # MacOS
  osascript -e 'tell app "Terminal" to do script "cd '$(pwd)'/frontend && npm install && npm run serve"'
else
  # Linux
  gnome-terminal -- bash -c "cd '$(pwd)'/frontend && npm install && npm run serve; exec bash"
fi

echo ""
echo "应用启动中，请稍候..."
echo "前端页面将自动在浏览器中打开"
echo "如果没有自动打开，请手动访问: http://localhost:8080"
echo ""