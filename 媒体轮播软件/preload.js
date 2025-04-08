// 预加载脚本可用于在渲染进程中安全地公开Node.js API和功能
// 由于我们启用了nodeIntegration和禁用了contextIsolation，此文件目前简单直接
// 未来如果需要更安全的配置，可以通过此文件使用contextBridge进行安全通信

const { contextBridge, ipcRenderer } = require('electron');

// 在窗口加载完成后执行
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM加载完成，预加载脚本执行');
}); 