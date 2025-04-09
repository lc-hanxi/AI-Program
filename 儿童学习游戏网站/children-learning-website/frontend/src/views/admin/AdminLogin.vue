<template>
  <div class="admin-login-container">
    <div class="login-card">
      <h2 class="title">后台管理登录</h2>
      <form @submit.prevent="handleLogin">
        <div class="input-group">
          <label for="username">用户名</label>
          <input type="text" id="username" v-model="username" required>
        </div>
        <div class="input-group">
          <label for="password">密码</label>
          <input type="password" id="password" v-model="password" required>
        </div>
        <button type="submit" class="login-btn" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
        <p v-if="error" class="error-message">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios'; // 确保已安装 axios: npm install axios

const username = ref('');
const password = ref('');
const loading = ref(false);
const error = ref(null);
const router = useRouter();

// 后端 API 地址 (根据你的实际设置修改)
// const API_BASE_URL = 'http://47.122.68.201:3000/api'; // REMOVE THIS

const handleLogin = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await axios.post('/api/auth/login', {
      username: username.value,
      password: password.value,
    });

    if (response.data && response.data.token) {
      // 登录成功
      localStorage.setItem('admin_token', response.data.token);
      // 可以在这里存储用户信息（如果API返回的话）
      // localStorage.setItem('admin_user', JSON.stringify(response.data.user));
      
      // 跳转到后台主面板 (假设路由名为 AdminDashboard)
      router.push({ name: 'AdminDashboard' }); 
    } else {
      // API 返回异常
      error.value = response.data.message || '登录失败';
    }

  } catch (err) {
    console.error('Login error:', err);
    if (err.response && err.response.data && err.response.data.message) {
      error.value = err.response.data.message;
    } else if (err.request) {
        error.value = '无法连接服务器';
    } else {
      error.value = '登录出错';
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.admin-login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  background-color: #f4f7f6; /* 淡灰色背景 */
}

.login-card {
  background-color: white;
  padding: 40px 50px;
  border-radius: 15px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.title {
  color: #333;
  margin-bottom: 30px;
  font-size: 1.8rem;
}

.input-group {
  margin-bottom: 20px;
  text-align: left;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: bold;
  font-size: 0.9rem;
}

.input-group input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-sizing: border-box;
  font-size: 1rem;
}

.input-group input:focus {
  outline: none;
  border-color: #4CAF50; /* Vue 绿色 */
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.login-btn {
  width: 100%;
  padding: 15px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: bold;
  transition: background-color 0.3s ease;
  margin-top: 10px;
}

.login-btn:hover:not(:disabled) {
  background-color: #45a049;
}

.login-btn:disabled {
  background-color: #a5d6a7;
  cursor: not-allowed;
}

.error-message {
  color: #f44336; /* 红色 */
  margin-top: 15px;
  font-size: 0.9rem;
  font-weight: bold;
}
</style> 