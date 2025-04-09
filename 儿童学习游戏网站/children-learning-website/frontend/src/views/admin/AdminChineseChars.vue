<template>
  <div class="admin-chinese-chars">
    <h2>汉字字库管理</h2>

    <!-- 添加/编辑表单 -->
    <form @submit.prevent="saveChar" class="char-form" enctype="multipart/form-data">
      <h3>{{ isEditing ? '编辑汉字' : '添加新汉字' }}</h3>
      <input type="hidden" v-model="currentChar.id">
      <div class="form-group">
        <label for="character">汉字:</label>
        <input type="text" id="character" v-model="currentChar.character" required>
      </div>
      <div class="form-group">
        <label for="poem_or_song">儿歌/古诗:</label>
        <textarea id="poem_or_song" v-model="currentChar.poem_or_song" rows="3"></textarea>
      </div>
      <div class="form-group">
        <label for="image">图片:</label>
        <input type="file" id="image" @change="handleFileUpload($event, 'image')" accept="image/*">
        <img v-if="imagePreviewUrl" :src="imagePreviewUrl" alt="图片预览" class="preview-image">
        <img v-if="isEditing && currentChar.image_url && !imagePreviewUrl" :src="getServerFileUrl(currentChar.image_url)" alt="当前图片" class="preview-image">
      </div>
      <div class="form-group">
        <label for="poem_audio">儿歌/古诗音频:</label>
        <input type="file" id="poem_audio" @change="handleFileUpload($event, 'poem_audio')" accept="audio/*">
        <audio v-if="poemAudioPreviewUrl" :src="poemAudioPreviewUrl" controls class="preview-audio"></audio>
        <audio v-if="isEditing && currentChar.poem_audio_url && !poemAudioPreviewUrl" :src="getServerFileUrl(currentChar.poem_audio_url)" controls class="preview-audio"></audio>
      </div>
      <div class="form-group">
        <label for="char_audio">汉字读音音频:</label>
        <input type="file" id="char_audio" @change="handleFileUpload($event, 'char_audio')" accept="audio/*">
        <audio v-if="charAudioPreviewUrl" :src="charAudioPreviewUrl" controls class="preview-audio"></audio>
        <audio v-if="isEditing && currentChar.char_audio_url && !charAudioPreviewUrl" :src="getServerFileUrl(currentChar.char_audio_url)" controls class="preview-audio"></audio>
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">{{ isEditing ? '更新' : '添加' }}</button>
        <button type="button" @click="cancelEdit" v-if="isEditing" class="btn btn-secondary">取消</button>
      </div>
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    </form>

    <hr>

    <!-- 汉字列表 -->
    <h3>汉字列表</h3>
    <div v-if="loadingChars" class="loading">加载汉字中...</div>
    <table v-else-if="characters.length" class="chars-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>汉字</th>
          <th>儿歌/古诗</th>
          <th>图片</th>
          <th>诗歌音频</th>
          <th>读音音频</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="char in characters" :key="char.id">
          <td>{{ char.id }}</td>
          <td>{{ char.character }}</td>
          <td class="poem-cell">{{ char.poem_or_song }}</td>
          <td>
            <img v-if="char.image_url" :src="getServerFileUrl(char.image_url)" alt="汉字图片" class="table-image">
            <span v-else>-</span>
          </td>
          <td>
            <audio v-if="char.poem_audio_url" :src="getServerFileUrl(char.poem_audio_url)" controls class="table-audio"></audio>
            <span v-else>-</span>
          </td>
          <td>
            <audio v-if="char.char_audio_url" :src="getServerFileUrl(char.char_audio_url)" controls class="table-audio"></audio>
            <span v-else>-</span>
          </td>
          <td>
            <button @click="editChar(char)" class="btn btn-sm btn-warning">编辑</button>
            <button @click="deleteChar(char.id)" class="btn btn-sm btn-danger">删除</button>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-else>还没有添加任何汉字。</p>

    <hr>

    <!-- 语文关卡难度设置 -->
    <h3>语文关卡难度设置</h3>
    <div v-if="loadingLevels" class="loading">加载难度设置中...</div>
    <div v-else-if="chineseLevels.length">
      <table class="levels-table">
        <thead>
          <tr>
            <th>关卡</th>
            <th>气球速度 (像素/秒)</th>
            <th>每波气球数</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="level in editableChineseLevels" :key="level.level">
            <td>{{ level.level }}</td>
            <td>
              <input type="number" v-model.number="level.balloon_speed" min="0" step="1">
            </td>
            <td>
              <input type="number" v-model.number="level.balloons_per_wave" min="1" step="1">
            </td>
            <td>
              <button @click="saveChineseLevel(level)" class="btn btn-sm btn-success">保存</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="levelSaveMessage" :class="{'success-message': isLevelSaveSuccess, 'error-message': !isLevelSaveSuccess}">{{ levelSaveMessage }}</p>
    </div>
    <p v-else>未能加载语文关卡难度设置。</p>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const characters = ref([]);
const currentChar = ref({
  id: null,
  character: '',
  poem_or_song: '',
  image_url: null,
  poem_audio_url: null,
  char_audio_url: null,
});
const isEditing = ref(false);
const loadingChars = ref(false);
const errorMessage = ref('');

const imageFile = ref(null);
const poemAudioFile = ref(null);
const charAudioFile = ref(null);
const imagePreviewUrl = ref(null);
const poemAudioPreviewUrl = ref(null);
const charAudioPreviewUrl = ref(null);

// const API_BASE_URL = 'http://localhost:3000/api/chinese'; // REMOVE THIS
// const SERVER_BASE_URL = 'http://localhost:3000'; // REMOVE THIS

const getServerFileUrl = (relativePath) => {
  // Just return the relative path
  return relativePath ? relativePath : null;
};

const handleFileUpload = (event, type) => {
  const file = event.target.files[0];
  if (type === 'image') {
    imageFile.value = null;
    imagePreviewUrl.value = null;
  } else if (type === 'poem_audio') {
    poemAudioFile.value = null;
    poemAudioPreviewUrl.value = null;
  } else if (type === 'char_audio') {
    charAudioFile.value = null;
    charAudioPreviewUrl.value = null;
  }

  if (!file) return;

  if (type === 'image') {
    imageFile.value = file;
    const reader = new FileReader();
    reader.onload = (e) => { imagePreviewUrl.value = e.target.result; };
    reader.readAsDataURL(file);
  } else if (type === 'poem_audio') {
    poemAudioFile.value = file;
    poemAudioPreviewUrl.value = URL.createObjectURL(file);
  } else if (type === 'char_audio') {
    charAudioFile.value = file;
    charAudioPreviewUrl.value = URL.createObjectURL(file);
  }
};

const fetchChars = async () => {
  loadingChars.value = true;
  errorMessage.value = '';
  try {
    // Change to relative path
    const response = await axios.get(`/api/chinese/chars`);
    characters.value = response.data;
  } catch (error) {
    console.error('Error fetching chinese characters:', error);
    errorMessage.value = `加载汉字列表失败: ${error.response?.data?.error || error.message}`;
    characters.value = [];
  } finally {
    loadingChars.value = false;
  }
};

const saveChar = async () => {
  errorMessage.value = '';
  const formData = new FormData();
  formData.append('character', currentChar.value.character);
  if (currentChar.value.poem_or_song) {
    formData.append('poem_or_song', currentChar.value.poem_or_song);
  }
  if (imageFile.value) {
    formData.append('image', imageFile.value);
  }
  if (poemAudioFile.value) {
    formData.append('poem_audio', poemAudioFile.value);
  }
  if (charAudioFile.value) {
    formData.append('char_audio', charAudioFile.value);
  }

  try {
    let response;
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
        // Add auth headers if needed: ...getAuthHeaders()
      }
    };
    // Change to relative paths
    if (isEditing.value) {
      response = await axios.put(`/api/chinese/chars/${currentChar.value.id}`, formData, config);
      const index = characters.value.findIndex(c => c.id === currentChar.value.id);
      if (index !== -1) {
        characters.value[index] = { ...characters.value[index], ...response.data };
      }
    } else {
      response = await axios.post(`/api/chinese/chars`, formData, config);
      characters.value.unshift(response.data);
    }
    resetForm();
  } catch (error) {
    console.error('Error saving chinese character:', error);
    errorMessage.value = `保存汉字失败: ${error.response?.data?.error || error.message}`;
  }
};

const editChar = (char) => {
  isEditing.value = true;
  currentChar.value = { ...char };
  imageFile.value = null;
  poemAudioFile.value = null;
  charAudioFile.value = null;
  imagePreviewUrl.value = null;
  poemAudioPreviewUrl.value = null;
  charAudioPreviewUrl.value = null;
  errorMessage.value = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const deleteChar = async (id) => {
  if (!confirm('确定要删除这个汉字吗？此操作不可撤销。')) {
    return;
  }
  errorMessage.value = '';
  try {
    // Change to relative path
    await axios.delete(`/api/chinese/chars/${id}`);
    characters.value = characters.value.filter(c => c.id !== id);
    if (isEditing.value && currentChar.value.id === id) {
      resetForm();
    }
  } catch (error) {
    console.error('Error deleting chinese character:', error);
    errorMessage.value = `删除汉字失败: ${error.response?.data?.error || error.message}`;
  }
};

const resetForm = () => {
  isEditing.value = false;
  currentChar.value = {
    id: null,
    character: '',
    poem_or_song: '',
    image_url: null,
    poem_audio_url: null,
    char_audio_url: null,
  };
  imageFile.value = null;
  poemAudioFile.value = null;
  charAudioFile.value = null;
  imagePreviewUrl.value = null;
  poemAudioPreviewUrl.value = null;
  charAudioPreviewUrl.value = null;
  errorMessage.value = '';

  const clearInput = (id) => {
    const input = document.getElementById(id);
    if (input) input.value = null;
  };
  clearInput('image');
  clearInput('poem_audio');
  clearInput('char_audio');
};

const cancelEdit = () => {
  resetForm();
};

// 语文关卡难度设置部分
const chineseLevels = ref([]);
const editableChineseLevels = ref([]);
const loadingLevels = ref(false);
const levelSaveMessage = ref('');
const isLevelSaveSuccess = ref(false);

// const LEVEL_API_URL = 'http://localhost:3000/api/chinese/levels'; // REMOVE THIS

const fetchChineseLevels = async () => {
  loadingLevels.value = true;
  levelSaveMessage.value = '';
  try {
    // Change to relative path
    const response = await axios.get(`/api/chinese/levels`);
    chineseLevels.value = response.data;
    editableChineseLevels.value = JSON.parse(JSON.stringify(response.data));
  } catch (error) {
    console.error('Error fetching chinese levels:', error);
    levelSaveMessage.value = `加载语文关卡难度失败: ${error.response?.data?.error || error.message}`;
    isLevelSaveSuccess.value = false;
    chineseLevels.value = [];
    editableChineseLevels.value = [];
  } finally {
    loadingLevels.value = false;
  }
};

const saveChineseLevel = async (levelData) => {
  levelSaveMessage.value = '';
  const levelNum = levelData.level;
  const dataToSend = editableChineseLevels.value.find(l => l.level === levelNum);
  if (!dataToSend) return;

  if (dataToSend.balloon_speed === undefined || dataToSend.balloons_per_wave === undefined ||
      dataToSend.balloon_speed <= 0 || dataToSend.balloons_per_wave <= 0) {
      levelSaveMessage.value = `关卡 ${levelNum} 的输入值无效。`;
      isLevelSaveSuccess.value = false;
      return;
  }

  try {
    // Change to relative path
    const response = await axios.put(`/api/chinese/levels/${levelNum}`, {
      balloon_speed: dataToSend.balloon_speed,
      balloons_per_wave: dataToSend.balloons_per_wave
    });
    levelSaveMessage.value = response.data.message || `关卡 ${levelNum} 保存成功`;
    isLevelSaveSuccess.value = true;

    const index = chineseLevels.value.findIndex(l => l.level === levelNum);
    if (index !== -1) {
      chineseLevels.value[index] = { ...chineseLevels.value[index], ...response.data };
    }
    const editIndex = editableChineseLevels.value.findIndex(l => l.level === levelNum);
     if (editIndex !== -1) {
        editableChineseLevels.value[editIndex] = { ...dataToSend };
     }

  } catch (error) {
    console.error(`Error saving chinese level ${levelNum}:`, error);
    levelSaveMessage.value = `保存关卡 ${levelNum} 失败: ${error.response?.data?.error || error.message}`;
    isLevelSaveSuccess.value = false;
  } finally {
    setTimeout(() => { levelSaveMessage.value = ''; }, 5000);
  }
};

onMounted(() => {
  fetchChars();
  fetchChineseLevels();
});

</script>

<style scoped>
.admin-chinese-chars {
  padding: 20px;
}

.char-form {
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
  border: 1px solid #eee;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input[type="text"],
.form-group textarea,
.form-group input[type="file"] {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

.form-group textarea {
  min-height: 60px;
  resize: vertical;
}

.preview-image {
  max-width: 100px;
  max-height: 100px;
  margin-top: 10px;
  display: block;
  border: 1px solid #ddd;
}

.preview-audio {
  margin-top: 10px;
  display: block;
  max-width: 100%;
}

.form-actions {
  margin-top: 20px;
}

.btn {
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 10px;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-warning {
  background-color: #ffc107;
  color: #212529;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-sm {
  padding: 5px 10px;
  font-size: 0.875em;
}

.error-message {
  color: red;
  margin-top: 10px;
}

.success-message {
  color: green;
  margin-top: 10px;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
}

.chars-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.chars-table th,
.chars-table td {
  border: 1px solid #ddd;
  padding: 12px;
  text-align: left;
  vertical-align: middle;
}

.chars-table th {
  background-color: #f2f2f2;
  font-weight: bold;
}

.poem-cell {
  white-space: pre-wrap;
  word-break: break-word;
  max-width: 300px;
}

.table-image {
  max-width: 60px;
  max-height: 60px;
  display: block;
}

.table-audio {
  max-width: 200px;
  display: block;
}

.chars-table td:last-child .btn {
  margin-right: 5px;
  margin-bottom: 5px;
}

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
  width: 80px;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.levels-table td:last-child {
    text-align: right;
}

.btn-success {
  background-color: #28a745;
  color: white;
}

</style> 