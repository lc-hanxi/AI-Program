<template>
  <div class="english-words-admin">
    <h2>英语词库管理</h2>

    <button @click="showAddModal = true" class="add-btn">添加新单词</button>

    <div v-if="loading" class="loading-message">加载中...</div>
    <div v-if="error" class="error-message">{{ error }}</div>

    <table v-if="!loading && !error && words.length > 0" class="words-table">
      <thead>
        <tr>
          <th>单词</th>
          <th>图片</th>
          <th>读音</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="word in words" :key="word.id">
          <td>{{ word.word }}</td>
          <td>
            <img v-if="word.image_url" :src="getServerUrl(word.image_url)" :alt="word.word" class="preview-image">
            <span v-else>-</span>
          </td>
          <td>
            <audio v-if="word.audio_url" controls :src="getServerUrl(word.audio_url)" class="preview-audio"></audio>
            <span v-else>-</span>
          </td>
          <td>
            <button @click="editWord(word)" class="edit-btn">编辑</button>
            <button @click="deleteWord(word.id)" class="delete-btn">删除</button>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-if="!loading && !error && words.length === 0">词库为空，请添加新单词。</p>

    <!-- 添加/编辑单词模态框 -->
    <div v-if="showAddModal || editingWord" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <h3>{{ editingWord ? '编辑单词' : '添加新单词' }}</h3>
        <form @submit.prevent="saveWord">
          <div class="input-group">
            <label for="word">单词</label>
            <input type="text" id="word" v-model="currentWord.word" required>
          </div>
          <div class="input-group">
            <label for="image">图片文件 (可选)</label>
            <input type="file" id="image" @change="handleFileChange($event, 'image')" accept="image/*">
            <img v-if="currentWord.image_url && !currentWord.imageFile" :src="getServerUrl(currentWord.image_url)" class="form-preview-image">
            <span v-if="currentWord.imageFile">已选择: {{ currentWord.imageFile.name }}</span>
          </div>
          <div class="input-group">
            <label for="audio">读音文件 (可选)</label>
            <input type="file" id="audio" @change="handleFileChange($event, 'audio')" accept="audio/*">
             <span v-if="currentWord.audioFile">已选择: {{ currentWord.audioFile.name }}</span>
            <audio v-if="currentWord.audio_url && !currentWord.audioFile" controls :src="getServerUrl(currentWord.audio_url)"></audio>
          </div>

          <div class="modal-actions">
            <button type="submit" class="save-btn" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</button>
            <button type="button" @click="closeModal" class="cancel-btn">取消</button>
          </div>
          <p v-if="modalError" class="error-message">{{ modalError }}</p>
        </form>
      </div>
    </div>

    <hr>

    <!-- 英语关卡难度设置 (新增) -->
    <h3>英语关卡难度设置</h3>
    <div v-if="loadingLevels" class="loading">加载难度设置中...</div>
    <div v-else-if="englishLevels.length">
      <table class="levels-table">
        <thead>
          <tr>
            <th>关卡</th>
            <th>僵尸速度 (像素/秒)</th>
            <th>浣熊基础步长 (像素/字母)</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="level in editableEnglishLevels" :key="level.level">
            <td>{{ level.level }}</td>
            <td>
              <input type="number" v-model.number="level.zombie_speed" min="0" step="0.1">
            </td>
            <td>
              <input type="number" v-model.number="level.raccoon_step_base" min="0" step="0.1">
            </td>
            <td>
              <button @click="saveEnglishLevel(level)" class="btn btn-sm btn-success">保存</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="levelSaveMessage" :class="{'success-message': isLevelSaveSuccess, 'error-message': !isLevelSaveSuccess}">{{ levelSaveMessage }}</p>
    </div>
    <p v-else>未能加载英语关卡难度设置。</p>

  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import axios from 'axios';

const words = ref([]);
const loading = ref(true);
const error = ref(null);
const saving = ref(false);
const saveError = ref(null);
const modalError = ref(null);

const showAddModal = ref(false);
const editingWord = ref(null); // 存储正在编辑的单词对象
const currentWord = reactive({ // 用于表单绑定
    id: null,
    word: '',
    image_url: null,
    audio_url: null,
    imageFile: null, // 存储选择的图片文件
    audioFile: null  // 存储选择的音频文件
});

// 获取认证头
const getAuthHeaders = () => {
    const token = localStorage.getItem('admin_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// 拼接服务器 URL
const getServerUrl = (relativePath) => {
    // Just return the relative path, browser/proxy will handle it
    return relativePath ? relativePath : ''; 
}

// 获取单词列表
const fetchWords = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await axios.get('/api/english/words', {
      headers: getAuthHeaders()
    });
    words.value = response.data;
  } catch (err) {
    console.error('Error fetching english words:', err);
    handleApiError(err, '获取单词列表失败');
  } finally {
    loading.value = false;
  }
};

// 处理文件选择
const handleFileChange = (event, type) => {
    const file = event.target.files[0];
    if (!file) return;
    if (type === 'image') {
        currentWord.imageFile = file;
    } else if (type === 'audio') {
        currentWord.audioFile = file;
    }
};

// 打开编辑模态框
const editWord = (word) => {
    editingWord.value = word;
    // 使用 Object.assign 避免直接修改响应式对象
    Object.assign(currentWord, { 
        ...word, 
        imageFile: null, // 重置文件选择
        audioFile: null 
    });
    modalError.value = null; // 清除之前的错误
};

// 关闭模态框并重置表单
const closeModal = () => {
    showAddModal.value = false;
    editingWord.value = null;
    Object.assign(currentWord, { 
        id: null, word: '', image_url: null, audio_url: null, imageFile: null, audioFile: null 
    });
    modalError.value = null;
};

// 保存单词 (添加或更新)
const saveWord = async () => {
    saving.value = true;
    modalError.value = null;

    const formData = new FormData();
    formData.append('word', currentWord.word);
    if (currentWord.imageFile) {
        formData.append('image', currentWord.imageFile);
    }
    if (currentWord.audioFile) {
        formData.append('audio', currentWord.audioFile);
    }

    const url = editingWord.value 
        ? `/api/english/words/${editingWord.value.id}` 
        : '/api/english/words';
    const method = editingWord.value ? 'put' : 'post';

    try {
        const response = await axios({ 
            method: method,
            url: url,
            data: formData,
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'multipart/form-data' // 必须设置
            }
         });
        
        await fetchWords(); // 刷新列表
        closeModal(); // 关闭模态框

    } catch (err) {
        console.error('Error saving english word:', err);
        handleApiError(err, '保存单词失败', 'modalError'); // 将错误显示在模态框内
    } finally {
        saving.value = false;
    }
};

// 删除单词
const deleteWord = async (id) => {
    if (!confirm('确定要删除这个单词吗？此操作不可恢复。')) return;
    
    saving.value = true; // 可以复用 saving 状态或添加 deleting 状态
    error.value = null; // 清除主页面的错误

    try {
        await axios.delete(`/api/english/words/${id}`, { headers: getAuthHeaders() });
        await fetchWords(); // 刷新列表
    } catch (err) {
        console.error('Error deleting english word:', err);
        handleApiError(err, '删除单词失败');
    } finally {
        saving.value = false;
    }
};

// 统一处理 API 错误
const handleApiError = (err, defaultMessage, errorRef = 'error') => {
    let message = defaultMessage;
    if (err.response && err.response.status === 401) {
        message = '未授权或登录已过期，请重新登录。';
        // router.push({ name: 'AdminLogin' });
    } else if (err.response && err.response.data && err.response.data.message) {
        message = `${defaultMessage}: ${err.response.data.message}`;
    } else if (err.request) {
         message = `${defaultMessage}：无法连接服务器。`;
    } else {
         message = `${defaultMessage}：发生未知错误。`;
    }

    if (errorRef === 'modalError') {
        modalError.value = message;
    } else {
        error.value = message;
    }
};

// --- 英语关卡难度设置部分 (新增) ---
const englishLevels = ref([]);
const editableEnglishLevels = ref([]); // 用于绑定的可编辑副本
const loadingLevels = ref(false);
const levelSaveMessage = ref('');
const isLevelSaveSuccess = ref(false);

// 获取英语关卡难度
const fetchEnglishLevels = async () => {
  loadingLevels.value = true;
  levelSaveMessage.value = ''; // 清除旧消息
  try {
    const response = await axios.get('/api/english/levels', {
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } // 添加认证
    });
    englishLevels.value = response.data;
    // 创建可编辑副本，防止直接修改原始数据触发不必要的更新
    editableEnglishLevels.value = JSON.parse(JSON.stringify(response.data));
  } catch (error) {
    console.error('Error fetching english levels:', error);
    levelSaveMessage.value = `加载英语关卡难度失败: ${error.response?.data?.message || error.message}`;
    isLevelSaveSuccess.value = false;
    englishLevels.value = [];
    editableEnglishLevels.value = [];
  } finally {
    loadingLevels.value = false;
  }
};

// 保存单个英语关卡难度
const saveEnglishLevel = async (levelData) => {
  levelSaveMessage.value = '';
  const levelNum = levelData.level;
  // 从 editableEnglishLevels 中找到对应关卡的数据来发送
  const dataToSend = editableEnglishLevels.value.find(l => l.level === levelNum);
  if (!dataToSend) return; // 防御性编程

  // 简单前端验证
  if (dataToSend.zombie_speed === undefined || dataToSend.raccoon_step_base === undefined ||
      dataToSend.zombie_speed < 0 || dataToSend.raccoon_step_base < 0) {
      levelSaveMessage.value = `关卡 ${levelNum} 的输入值无效。`;
      isLevelSaveSuccess.value = false;
      return;
  }

  try {
    const response = await axios.put(`/api/english/levels/${levelNum}`, {
      zombie_speed: dataToSend.zombie_speed,
      raccoon_step_base: dataToSend.raccoon_step_base
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } // 添加认证
    });
    levelSaveMessage.value = response.data.message || `关卡 ${levelNum} 保存成功`;
    isLevelSaveSuccess.value = true;
    // 可选：更新原始 englishLevels 数据（如果需要与其他地方同步）
    const index = englishLevels.value.findIndex(l => l.level === levelNum);
    if (index !== -1) {
        englishLevels.value[index] = { ...englishLevels.value[index], ...response.data };
    }
     // 同时更新 editableEnglishLevels 中的对应项（理论上已经是最新）
     const editIndex = editableEnglishLevels.value.findIndex(l => l.level === levelNum);
     if (editIndex !== -1) {
        editableEnglishLevels.value[editIndex] = { ...dataToSend }; // 使用发送的数据更新
     }

  } catch (error) {
    console.error(`Error saving english level ${levelNum}:`, error);
    levelSaveMessage.value = `保存关卡 ${levelNum} 失败: ${error.response?.data?.message || error.message}`;
    isLevelSaveSuccess.value = false;
    // 可选：如果保存失败，可能需要从原始数据恢复该行的编辑状态
    // TBD: 更复杂的错误恢复逻辑
  } finally {
      // 可以在几秒后清除消息
      setTimeout(() => { levelSaveMessage.value = ''; }, 5000);
  }
};
// --- 结束 英语关卡难度设置部分 ---

onMounted(() => {
  fetchWords();
  fetchEnglishLevels(); // 获取难度设置
});
</script>

<style scoped>
h2 {
  margin-bottom: 20px;
}

.add-btn {
  margin-bottom: 20px;
  padding: 10px 15px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}
.add-btn:hover { background-color: #45a049; }

.words-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.words-table th, .words-table td {
  border: 1px solid #ddd;
  padding: 10px 12px;
  text-align: left;
  vertical-align: middle;
}

.words-table th {
  background-color: #f8f8f8;
  font-weight: bold;
}

.preview-image {
  max-width: 60px;
  max-height: 60px;
  object-fit: cover;
  border-radius: 4px;
}

.preview-audio {
  height: 30px; /* 控制播放器高度 */
}

.edit-btn, .delete-btn {
  padding: 5px 10px;
  margin-right: 5px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: white;
}
.edit-btn { background-color: #2196F3; }
.delete-btn { background-color: #f44336; }
.edit-btn:hover { background-color: #1976D2; }
.delete-btn:hover { background-color: #d32f2f; }

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh; /* 限制最大高度 */
  overflow-y: auto; /* 内容过多时滚动 */
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 25px;
}

.input-group {
  margin-bottom: 15px;
}
.input-group label {
  display: block;
  margin-bottom: 5px;
}
.input-group input[type="text"], 
.input-group input[type="file"] {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}
input[type="file"] { padding: 5px; }

.form-preview-image {
    max-width: 80px;
    max-height: 80px;
    margin-top: 5px;
    display: block;
}

.modal-actions {
  margin-top: 25px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.save-btn, .cancel-btn {
  padding: 10px 20px;
  border-radius: 5px;
  border: none;
  cursor: pointer;
}

.save-btn { background-color: #4CAF50; color: white; }
.cancel-btn { background-color: #ccc; color: #333; }
.save-btn:hover { background-color: #45a049; }
.cancel-btn:hover { background-color: #bbb; }

.error-message {
  /* 继承全局或添加特定样式 */
  margin-top: 10px;
}

/* 继承通用加载/错误/成功消息样式 */
.loading-message, .error-message, .success-message {
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 15px;
  text-align: center;
}
.loading-message { background-color: #e0e0e0; color: #555; }
.error-message { background-color: #ffcdd2; color: #c62828; font-weight: bold; }
.success-message { background-color: #c8e6c9; color: #2e7d32; font-weight: bold; }

/* 新增：难度设置表格样式 */
.levels-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.levels-table th,
.levels-table td {
  border: 1px solid #ddd;
  padding: 12px;
  text-align: left;
  vertical-align: middle;
}

.levels-table th {
  background-color: #f8f9fa;
  font-weight: bold;
}

.levels-table input[type="number"] {
  width: 80px; /* 调整输入框宽度 */
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

/* 让按钮靠右 */
.levels-table td:last-child {
    text-align: right;
}

.btn-success {
  background-color: #28a745;
  color: white;
}
</style> 