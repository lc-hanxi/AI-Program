<template>
  <div class="math-settings">
    <h2>数学游戏设置</h2>

    <div v-if="loading" class="loading-message">加载中...</div>
    <div v-if="error" class="error-message">{{ error }}</div>

    <form v-if="!loading && !error" @submit.prevent="saveSettings">
      <div v-for="(level, index) in levels" :key="level.level_number" class="level-card">
        <h3>关卡 {{ level.level_number }} {{ level.level_number === 4 ? '(BOSS)' : '' }}</h3>
        <div class="form-grid">
          <div class="input-group">
            <label :for="`max_number_${level.level_number}`">题目范围 (0-X)</label>
            <input type="number" :id="`max_number_${level.level_number}`" v-model.number="levels[index].max_number" min="1" required>
          </div>
          <div class="input-group">
            <label :for="`duration_${level.level_number}`">游戏时长 (秒)</label>
            <input type="number" :id="`duration_${level.level_number}`" v-model.number="levels[index].duration_seconds" min="10" required>
          </div>
        </div>
      </div>

      <button type="submit" class="save-btn" :disabled="saving">
        {{ saving ? '保存中...' : '保存全部更改' }}
      </button>
       <p v-if="saveSuccess" class="success-message">保存成功！</p>
       <p v-if="saveError" class="error-message">{{ saveError }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const levels = ref([]);
const loading = ref(true);
const error = ref(null);
const saving = ref(false);
const saveError = ref(null);
const saveSuccess = ref(false);

// 获取认证令牌的辅助函数
const getAuthHeaders = () => {
    const token = localStorage.getItem('admin_token');
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
};

// 获取关卡数据
const fetchLevels = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await axios.get('/api/math/levels', {
      headers: getAuthHeaders()
    });
    levels.value = response.data;
  } catch (err) {
    console.error('Error fetching math levels:', err);
    if (err.response && err.response.status === 401) {
        error.value = '未授权，请重新登录。';
        // router.push({ name: 'AdminLogin' }); // 可以选择跳转
    } else if (err.response && err.response.data && err.response.data.message) {
        error.value = `获取失败: ${err.response.data.message}`;
    } else {
        error.value = '获取数学关卡设置失败，请检查网络或后端服务。';
    }
  } finally {
    loading.value = false;
  }
};

// 保存设置
const saveSettings = async () => {
  saving.value = true;
  saveError.value = null;
  saveSuccess.value = false;
  try {
    const response = await axios.put('/api/math/levels', levels.value, {
      headers: getAuthHeaders()
    });
    saveSuccess.value = true;
    // 隐藏成功提示
    setTimeout(() => saveSuccess.value = false, 3000);

  } catch (err) {
    console.error('Error saving math levels:', err);
     if (err.response && err.response.status === 401) {
        saveError.value = '未授权，请重新登录。';
    } else if (err.response && err.response.data && err.response.data.message) {
        saveError.value = `保存失败: ${err.response.data.message}`;
    } else {
        saveError.value = '保存数学关卡设置失败，请检查网络或后端服务。';
    }
     // 隐藏错误提示
    setTimeout(() => saveError.value = null, 5000); 
  } finally {
    saving.value = false;
  }
};

// 组件挂载时获取数据
onMounted(fetchLevels);
</script>

<style scoped>
h2 {
  margin-bottom: 20px;
  color: #333;
  border-bottom: 2px solid #eee;
  padding-bottom: 10px;
}

.loading-message, .error-message, .success-message {
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 20px;
}

.loading-message { background-color: #e0e0e0; color: #555; }
.error-message { background-color: #ffcdd2; color: #c62828; font-weight: bold; }
.success-message { background-color: #c8e6c9; color: #2e7d32; font-weight: bold; }

.level-card {
  background-color: #fff;
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.level-card h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #4CAF50;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 10px; /* Add some space below grid */
}

.boss-settings {
    border-top: 1px dashed #ccc;
    margin-top: 15px;
    padding-top: 15px;
}

.input-group {
  display: flex;
  flex-direction: column; /* Labels above inputs */
}

.input-group label {
  margin-bottom: 5px;
  color: #555;
  font-weight: 500;
  font-size: 0.9rem;
}

.input-group input[type="number"] {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 1rem;
}

.checkbox-group {
    flex-direction: row; /* Checkbox and label side-by-side */
    align-items: center;
    padding-top: 20px; /* Align with other inputs */
}

.checkbox-group input[type="checkbox"] {
    margin-right: 8px;
    width: 18px;
    height: 18px;
}
.checkbox-group label {
    margin-bottom: 0; /* Reset margin */
    font-weight: normal;
}

.save-btn {
  padding: 12px 25px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  transition: background-color 0.3s ease;
  margin-top: 10px;
}

.save-btn:hover:not(:disabled) {
  background-color: #45a049;
}

.save-btn:disabled {
  background-color: #a5d6a7;
  cursor: not-allowed;
}
</style> 