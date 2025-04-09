const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // 后端服务器地址
        changeOrigin: true, // 是否改变源地址
        ws: true, // 如果需要代理 WebSocket
        // 可选：如果后端 API 路径不包含 /api，可以用 pathRewrite
        // pathRewrite: { '^/api': '' } 
      },
      '/uploads': {
        target: 'http://localhost:3000', // Your backend server
        changeOrigin: true,
        pathRewrite: { '^/uploads': '/uploads' }, // Keep the /uploads path
      },
    }
  }
}); 
