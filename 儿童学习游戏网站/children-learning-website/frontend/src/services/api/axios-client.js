// 使用axios实现的API客户端
import axios from 'axios';

// 创建axios实例
const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10秒超时
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 可以在这里处理授权令牌等
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // 统一处理错误
    console.error('API请求失败:', error.message);
    
    // 如果后端服务不可用，使用本地存储作为备份
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      console.warn('后端服务不可用，使用本地存储作为备份');
      return Promise.reject({ useLocalStorage: true, originalError: error });
    }
    
    return Promise.reject(error);
  }
);

export default apiClient; 