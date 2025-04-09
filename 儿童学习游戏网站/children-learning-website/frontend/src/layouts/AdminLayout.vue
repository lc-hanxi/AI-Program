<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <h1 class="admin-title">后台管理</h1>
      <nav>
        <ul>
          <li><router-link :to="{ name: 'AdminDashboard' }" active-class="active-link">概览</router-link></li>
          <li><router-link :to="{ name: 'AdminMathSettings' }" active-class="active-link">数学设置</router-link></li>
          <!-- 恢复英语词库链接 -->
          <li><router-link :to="{ name: 'AdminEnglishWords' }" active-class="active-link">英语词库</router-link></li>
          <!-- 添加汉字字库链接 -->
          <li><router-link :to="{ name: 'AdminChineseChars' }" active-class="active-link">汉字字库</router-link></li>
          <!-- <li><router-link :to="{ name: 'AdminChineseChars' }" active-class="active-link">汉字字库</router-link></li> -->
        </ul>
      </nav>
      <button @click="logout" class="logout-btn">退出登录</button>
    </aside>
    <main class="content">
      <router-view /> <!-- 子路由视图将在这里渲染 -->
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const logout = () => {
  localStorage.removeItem('admin_token'); // 清除 token
  // 可以清除其他用户相关的 localStorage 数据
  router.push({ name: 'AdminLogin' }); // 跳转回登录页
};
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 220px;
  background-color: #2c3e50; /* 深蓝灰色 */
  color: #ecf0f1; /* 浅灰色文字 */
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.admin-title {
  font-size: 1.5rem;
  text-align: center;
  margin-bottom: 30px;
  color: #fff;
}

nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

nav li {
  margin-bottom: 15px;
}

nav a {
  text-decoration: none;
  color: #bdc3c7; /* 较浅的灰色 */
  font-size: 1rem;
  padding: 10px 15px;
  display: block;
  border-radius: 5px;
  transition: background-color 0.2s ease, color 0.2s ease;
}

nav a:hover {
  background-color: #34495e; /* 悬停时深一点的背景 */
  color: #fff;
}

.active-link {
  background-color: #4CAF50; /* Vue 绿色 */
  color: #fff;
  font-weight: bold;
}

.logout-btn {
  margin-top: auto; /* 将按钮推到底部 */
  padding: 10px;
  background-color: #e74c3c; /* 红色 */
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  text-align: center;
  transition: background-color 0.2s ease;
}

.logout-btn:hover {
  background-color: #c0392b; /* 深红色 */
}

.content {
  flex-grow: 1;
  padding: 30px;
  background-color: #f4f7f6;
  overflow-y: auto; /* 如果内容过长，允许滚动 */
}
</style> 