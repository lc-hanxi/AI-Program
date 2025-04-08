// 全局变量
const { ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');
let currentConfig = null;
let currentPlaylist = [];
let specialMediaList = []; // 存储包屏专用的媒体列表
let selectedMediaIndex = -1;
let isPlaying = false;
let currentMediaElement = null;
let playTimer = null;
let weatherUpdateTimer = null;
let frequencyRules = []; // 存储播放频次规则
let mediaEnded = false; // 标记媒体是否正常结束（用于区分用户手动关闭和自然结束）
let currentPlayCount = 0; // 当前媒体已播放次数
let playTimeChecker = null; // 检查播放时间的定时器

// DOM元素加载完成后执行
document.addEventListener('DOMContentLoaded', async () => {
  // 初始化应用
  await initApp();
  
  // 设置事件监听器
  setupEventListeners();
});

// 初始化应用
async function initApp() {
  try {
    // 加载配置
    const config = await ipcRenderer.invoke('load-config');
    if (config) {
      currentConfig = config;
      console.log('配置加载成功:', currentConfig);
      
      // 禁用自动播放功能
      currentConfig.playback.autoStart = false;
    } else {
      console.log('无法加载配置，使用默认设置');
    }
    
    // 加载播放列表
    const playlist = await ipcRenderer.invoke('load-playlist');
    if (playlist && Array.isArray(playlist)) {
      currentPlaylist = playlist;
      console.log('播放列表加载成功，数量:', currentPlaylist.length);
      
      // 检查是否有需要下刊的媒体
      const today = new Date();
      let hasUnpublishedMedia = false;
      
      currentPlaylist = currentPlaylist.filter(media => {
        if (media.unpublishDate && media.autoUnpublish !== false) {
          const unpublishDate = new Date(media.unpublishDate);
          if (unpublishDate < today) {
            console.log(`媒体 ${media.fileName} 已过期，自动下刊`);
            hasUnpublishedMedia = true;
            return false;
          }
        }
        return true;
      });
      
      if (hasUnpublishedMedia) {
        savePlaylist();
      }
    } else {
      console.warn('播放列表为空或加载失败');
      currentPlaylist = [];
    }
    
    // 加载特殊媒体列表
    try {
      const specialMediaPath = path.join(ipcRenderer.sendSync('get-user-data-path'), 'special-media.json');
      if (fs.existsSync(specialMediaPath)) {
        specialMediaList = JSON.parse(fs.readFileSync(specialMediaPath, 'utf8'));
        console.log('特殊媒体列表加载成功，数量:', specialMediaList.length);
      } else {
        specialMediaList = [];
        fs.writeFileSync(specialMediaPath, JSON.stringify(specialMediaList, null, 2));
      }
    } catch (error) {
      console.error('加载特殊媒体列表失败:', error);
      specialMediaList = [];
    }
    
    // 更新界面
    updatePlaylistTable();
    
    // 启动天气服务（如果已启用）
    if (currentConfig.weather && currentConfig.weather.enabled) {
      startWeatherService();
    }
    
    // 设置事件监听器
    setupEventListeners();
    
    // 启动播放时间检查器
    startPlayTimeChecker();
    
    // 接收播放器错误
    ipcRenderer.on('player-error', (event, message) => {
      console.error('播放器错误:', message);
      alert(`播放器错误: ${message}`);
      stopPlayback();
    });
    
    // 移除自动播放代码
    console.log('自动播放功能已禁用');
  } catch (error) {
    console.error('初始化应用错误:', error);
    alert('初始化应用错误: ' + error.message);
  }
}

// 加载频次规则
function loadFrequencyRules() {
  try {
    const rulesPath = path.join(ipcRenderer.sendSync('get-user-data-path'), 'frequency-rules.json');
    if (fs.existsSync(rulesPath)) {
      const rulesData = fs.readFileSync(rulesPath, 'utf8');
      frequencyRules = JSON.parse(rulesData);
      console.log('加载播放频次规则:', frequencyRules);
    } else {
      frequencyRules = [];
    }
  } catch (error) {
    console.error('加载频次规则失败:', error);
    frequencyRules = [];
  }
}

// 保存频次规则
async function saveFrequencyRules() {
  try {
    const rulesPath = path.join(ipcRenderer.sendSync('get-user-data-path'), 'frequency-rules.json');
    fs.writeFileSync(rulesPath, JSON.stringify(frequencyRules, null, 2));
    console.log('保存播放频次规则成功');
    return true;
  } catch (error) {
    console.error('保存频次规则失败:', error);
    return false;
  }
}

// 更新频次规则表格
function updateFrequencyRulesTable() {
  const tbody = document.getElementById('frequency-rules-body');
  tbody.innerHTML = '';
  
  frequencyRules.forEach((rule, index) => {
    const row = document.createElement('tr');
    row.dataset.index = index;
    row.dataset.mediaName = rule.mediaName;
    row.innerHTML = `
      <td>${rule.mediaName}</td>
      <td>${rule.frequency}</td>
    `;
    
    tbody.appendChild(row);
    
    // 添加行点击事件（选中）
    row.addEventListener('click', () => {
      const selectedRow = tbody.querySelector('tr.table-primary');
      if (selectedRow) {
        selectedRow.classList.remove('table-primary');
      }
      row.classList.add('table-primary');
    });
  });
}

// 添加频次规则
function addFrequencyRule() {
  const mediaSelect = document.getElementById('frequency-media');
  const count = document.getElementById('frequency-count').value;
  
  if (!mediaSelect.value) {
    alert('请选择媒体文件');
    return;
  }
  
  const mediaIndex = parseInt(mediaSelect.value);
  const media = currentPlaylist[mediaIndex];
  
  // 检查是否已存在该媒体的规则
  const existingIndex = frequencyRules.findIndex(rule => rule.mediaName === media.fileName);
  
  if (existingIndex >= 0) {
    alert('该媒体已有频次规则，请先删除');
    return;
  }
  
  // 添加新规则
  frequencyRules.push({
    mediaName: media.fileName,
    frequency: parseInt(count)
  });
  
  // 更新UI
  updateFrequencyRulesTable();
  
  // 保存规则
  saveFrequencyRules();
}

// 删除频次规则
function deleteFrequencyRule() {
  const tbody = document.getElementById('frequency-rules-body');
  const selectedRow = tbody.querySelector('tr.table-primary');
  
  if (!selectedRow) {
    alert('请先选择要删除的规则');
    return;
  }
  
  const index = parseInt(selectedRow.dataset.index);
  frequencyRules.splice(index, 1);
  
  // 更新UI
  updateFrequencyRulesTable();
  
  // 保存规则
  saveFrequencyRules();
}

// 更新天气显示
function updateWeatherDisplay(weatherData) {
  let weatherContainer = document.getElementById('weather-container');
  
  if (!weatherContainer) {
    weatherContainer = document.createElement('div');
    weatherContainer.id = 'weather-container';
    document.body.appendChild(weatherContainer);
  }
  
  // 设置容器样式
  weatherContainer.style.position = 'fixed';
  weatherContainer.style.padding = '10px';
  weatherContainer.style.background = 'rgba(0, 0, 0, 0.5)';
  weatherContainer.style.color = 'white';
  weatherContainer.style.borderRadius = '5px';
  weatherContainer.style.zIndex = '2000';
  weatherContainer.style.fontFamily = 'Arial, sans-serif';
  weatherContainer.style.fontSize = '16px'; // 增大字体以提高可读性
  
  // 强制设置为右上角
  weatherContainer.style.top = '50px'; // 留出顶部导航栏的空间
  weatherContainer.style.right = '10px';
  
  // 设置内容
  weatherContainer.innerHTML = `
    <div style="margin-bottom: 5px; font-weight: bold;">${weatherData.city} 天气</div>
    <div>${weatherData.weather} ${weatherData.temperature}°C</div>
    <div>湿度: ${weatherData.humidity}%</div>
    <div style="font-size: 12px; margin-top: 5px;">${new Date().toLocaleTimeString()}</div>
  `;
}

// 设置事件监听器
function setupEventListeners() {
  console.log('设置事件监听器');
  try {
    // 导航菜单点击事件
    const navSettings = document.getElementById('nav-settings');
    if (navSettings) {
      console.log('找到设置按钮，添加点击事件');
      navSettings.addEventListener('click', openSettingsModal);
    }
    
    const navHelp = document.getElementById('nav-help');
    if (navHelp) {
      navHelp.addEventListener('click', showHelp);
    }
    
    // 播放列表操作按钮
    const btnAddFile = document.getElementById('btn-add-file');
    if (btnAddFile) {
      btnAddFile.addEventListener('click', addMediaFile);
    }
    
    const btnDelete = document.getElementById('btn-delete');
    if (btnDelete) {
      btnDelete.addEventListener('click', deleteSelectedMedia);
    }
    
    const btnUp = document.getElementById('btn-up');
    if (btnUp) {
      btnUp.addEventListener('click', moveMediaUp);
    }
    
    const btnDown = document.getElementById('btn-down');
    if (btnDown) {
      btnDown.addEventListener('click', moveMediaDown);
    }
    
    // 播放控制按钮
    const btnPlay = document.getElementById('btn-play');
    if (btnPlay) {
      console.log('找到播放按钮，添加点击事件');
      btnPlay.addEventListener('click', startPlayback);
    }
    
    const btnPause = document.getElementById('btn-pause');
    if (btnPause) {
      btnPause.addEventListener('click', pausePlayback);
    }
    
    const btnStop = document.getElementById('btn-stop');
    if (btnStop) {
      btnStop.addEventListener('click', stopPlayback);
    }
    
    // 设置保存按钮
    const btnSaveSettings = document.getElementById('btn-save-settings');
    if (btnSaveSettings) {
      btnSaveSettings.addEventListener('click', saveSettings);
    }
    
    // 亮度控制器
    const brightnessRange = document.getElementById('brightness-range');
    if (brightnessRange) {
      brightnessRange.addEventListener('input', updateBrightnessValue);
    }
    
    // 预览模态框关闭事件
    const previewModal = document.getElementById('preview-modal');
    if (previewModal) {
      previewModal.addEventListener('hidden.bs.modal', function() {
        const video = document.getElementById('preview-video');
        if (video) {
          video.pause();
          video.src = '';
        }
        const previewContainer = document.querySelector('.preview-container');
        if (previewContainer) previewContainer.innerHTML = '';
      });
    }
    
    // 设置模态框显示事件
    const settingsModal = document.getElementById('settings-modal');
    if (settingsModal) {
      settingsModal.addEventListener('shown.bs.modal', populateSettingsForm);
    }
    
    console.log('所有事件监听器设置完成');
  } catch (error) {
    console.error('设置事件监听器出错:', error);
  }
}

// 更新播放列表表格
function updatePlaylistTable() {
  const tableBody = document.getElementById('playlist-body');
  tableBody.innerHTML = '';
  
  if (currentPlaylist.length === 0) {
    // 空播放列表提示
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = '<td colspan="6" class="text-center">播放列表为空，请添加媒体文件</td>';
    tableBody.appendChild(emptyRow);
    return;
  }
  
  // 填充表格
  currentPlaylist.forEach((media, index) => {
    const row = document.createElement('tr');
    if (index === selectedMediaIndex) {
      row.classList.add('table-primary');
    }
    
    // 显示正确的播放时长
    let durationText;
    if (media.type === 'video' && (!media.duration || media.duration === 0)) {
      durationText = '完整播放';
    } else {
      const duration = media.duration ? media.duration : currentConfig.playback.defaultDuration;
      durationText = `${duration}秒`;
    }
    
    // 显示播放次数设置
    const maxPlayCount = media.maxPlayCount || 1;
    
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${media.fileName}</td>
      <td>${durationText}</td>
      <td>${maxPlayCount}次</td>
      <td>${media.publishDate || '无'}</td>
      <td>
        <button class="btn btn-sm btn-info me-1 btn-preview-item" data-index="${index}">预览</button>
        <button class="btn btn-sm btn-danger btn-delete-item" data-index="${index}">删除</button>
      </td>
    `;
    
    tableBody.appendChild(row);
    
    // 添加行点击事件
    row.addEventListener('click', () => {
      selectMedia(index);
    });
  });
  
  // 添加按钮事件
  document.querySelectorAll('.btn-preview-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.getAttribute('data-index'));
      previewMedia(index);
    });
  });
  
  document.querySelectorAll('.btn-delete-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.getAttribute('data-index'));
      deleteMedia(index);
    });
  });
  
  // 更新选择框
  updateMediaSelects();
}

// 选择媒体
function selectMedia(index) {
  // 选中之前的媒体
  const oldRow = document.querySelector(`#playlist-body tr.table-primary`);
  if (oldRow) {
    oldRow.classList.remove('table-primary');
  }
  
  // 选中新媒体
  selectedMediaIndex = index;
  const newRow = document.querySelector(`#playlist-body tr:nth-child(${index + 1})`);
  if (newRow) {
    newRow.classList.add('table-primary');
  }
  
  // 更新表单
  populateSettingsForm();
  
  // 显示媒体设置表单
  if (index !== -1) {
    document.getElementById('media-settings-form').style.display = 'block';
  } else {
    document.getElementById('media-settings-form').style.display = 'none';
  }
}

// 添加媒体文件
function addMediaFile() {
  console.log('添加媒体文件');
  // 创建文件选择对话框（在实际应用中使用electron的对话框API）
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*,video/*';
  input.multiple = true;
  
  input.onchange = async (e) => {
    if (e.target.files.length > 0) {
      // 获取当前日期作为默认上刊日期
      const today = new Date().toISOString().split('T')[0];
      
      // 计算默认下刊日期（3个月后）
      const unpublishDefault = new Date();
      unpublishDefault.setMonth(unpublishDefault.getMonth() + 3);
      const defaultUnpublishDate = unpublishDefault.toISOString().split('T')[0];
      
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        
        // 添加到播放列表
        const media = {
          fileName: file.name,
          filePath: file.path, // 在Electron中会获取完整路径
          type: file.type.startsWith('video/') ? 'video' : 'image',
          // 视频默认完整播放(duration=0)，图片用10秒
          duration: file.type.startsWith('video/') ? 0 : 10, 
          publishDate: today,
          unpublishDate: defaultUnpublishDate,
          autoUnpublish: true,
          maxPlayCount: 1, // 默认播放1次后切换到下一个
          currentPlayCount: 0 // 当前播放次数
        };
        
        console.log(`添加媒体: ${file.name}, 类型: ${media.type}, 设置的时长: ${media.duration === 0 ? '完整播放' : media.duration + '秒'}`);
        currentPlaylist.push(media);
      }
      
      // 更新界面和保存
      updatePlaylistTable();
      await savePlaylist();
    }
  };
  
  input.click();
}

// 删除选中的媒体
function deleteSelectedMedia() {
  if (selectedMediaIndex >= 0) {
    deleteMedia(selectedMediaIndex);
  } else {
    alert('请先选择要删除的媒体文件');
  }
}

// 删除指定索引的媒体
async function deleteMedia(index) {
  if (index >= 0 && index < currentPlaylist.length) {
    if (confirm(`确定要删除 "${currentPlaylist[index].fileName}" 吗？`)) {
      currentPlaylist.splice(index, 1);
      
      // 调整选中索引
      if (selectedMediaIndex === index) {
        selectedMediaIndex = -1;
      } else if (selectedMediaIndex > index) {
        selectedMediaIndex--;
      }
      
      // 更新界面和保存
      updatePlaylistTable();
      await savePlaylist();
    }
  }
}

// 上移媒体
async function moveMediaUp() {
  if (selectedMediaIndex > 0) {
    // 交换位置
    const temp = currentPlaylist[selectedMediaIndex];
    currentPlaylist[selectedMediaIndex] = currentPlaylist[selectedMediaIndex - 1];
    currentPlaylist[selectedMediaIndex - 1] = temp;
    
    // 调整选中索引
    selectedMediaIndex--;
    
    // 更新界面和保存
    updatePlaylistTable();
    await savePlaylist();
  }
}

// 下移媒体
async function moveMediaDown() {
  if (selectedMediaIndex >= 0 && selectedMediaIndex < currentPlaylist.length - 1) {
    // 交换位置
    const temp = currentPlaylist[selectedMediaIndex];
    currentPlaylist[selectedMediaIndex] = currentPlaylist[selectedMediaIndex + 1];
    currentPlaylist[selectedMediaIndex + 1] = temp;
    
    // 调整选中索引
    selectedMediaIndex++;
    
    // 更新界面和保存
    updatePlaylistTable();
    await savePlaylist();
  }
}

// 预览媒体
function previewMedia(index) {
  if (index < 0 || index >= currentPlaylist.length) {
    alert('请选择要预览的媒体文件');
    return;
  }
  
  const media = currentPlaylist[index];
  const previewContainer = document.querySelector('.preview-container');
  const previewModal = document.getElementById('preview-modal');
  
  // 清空预览容器
  previewContainer.innerHTML = '';
  
  // 根据媒体类型创建不同元素
  if (media.type === 'video') {
    const video = document.createElement('video');
    video.src = media.filePath;
    video.classList.add('media-player');
    video.controls = true;
    video.autoplay = true;
    video.id = 'preview-video';
    
    previewContainer.appendChild(video);
  } else {
    const img = document.createElement('img');
    img.src = media.filePath;
    img.classList.add('media-player');
    
    previewContainer.appendChild(img);
  }
  
  // 显示预览模态框
  const modal = new bootstrap.Modal(previewModal);
  modal.show();
  
  // 监听模态框关闭事件，确保停止媒体播放
  previewModal.addEventListener('hidden.bs.modal', function() {
    const video = document.getElementById('preview-video');
    if (video) {
      video.pause();
      video.src = '';
    }
    previewContainer.innerHTML = '';
  }, { once: true });
}

// 开始播放
function startPlayback() {
  console.log('开始播放，当前播放列表:', currentPlaylist);
  
  if (currentPlaylist.length === 0) {
    alert('播放列表为空，请先添加媒体文件');
    return;
  }
  
  // 检查是否在允许的播放时段
  if (!isWithinPlayTime()) {
    console.log('当前时间不在允许的播放时段内，不允许开始播放');
    document.getElementById('play-status').textContent = '当前播放状态: 非播放时段';
    return;
  }
  
  isPlaying = true;
  document.getElementById('play-status').textContent = '当前播放状态: 正在播放';
  console.log('开始播放流程');
  
  // 检查是否应该播放包屏内容
  const specialContent = checkSpecialContent();
  if (specialContent) {
    console.log('检测到特殊内容需要播放:', specialContent);
    playSpecialContent(specialContent);
  } else {
    console.log('播放普通内容，从索引0开始');
    // 从头开始播放第一个
    playMediaAtIndex(0);
  }
}

// 检查是否应该播放特殊内容（包屏内容）
function checkSpecialContent() {
  // 如果未启用包屏，直接返回null
  if (!currentConfig.specialContent.enableSpecialContent) {
    return null;
  }
  
  // 获取当前时间
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = hours * 60 + minutes; // 转换为分钟便于比较
  
  // 检查早间包屏
  const morningStart = parseTimeToMinutes(currentConfig.specialContent.morningStart);
  const morningEnd = parseTimeToMinutes(currentConfig.specialContent.morningEnd);
  
  if (currentTime >= morningStart && currentTime <= morningEnd && currentConfig.specialContent.morningContent) {
    console.log('当前时间在早间包屏时段内');
    return {
      type: 'morning',
      contentName: currentConfig.specialContent.morningContent
    };
  }
  
  // 检查晚间包屏
  const eveningStart = parseTimeToMinutes(currentConfig.specialContent.eveningStart);
  const eveningEnd = parseTimeToMinutes(currentConfig.specialContent.eveningEnd);
  
  if (currentTime >= eveningStart && currentTime <= eveningEnd && currentConfig.specialContent.eveningContent) {
    console.log('当前时间在晚间包屏时段内');
    return {
      type: 'evening',
      contentName: currentConfig.specialContent.eveningContent
    };
  }
  
  return null;
}

// 将HH:MM格式转换为分钟数
function parseTimeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// 播放特殊内容（包屏内容）
function playSpecialContent(specialContent) {
  console.log(`播放${specialContent.type === 'morning' ? '早间' : '晚间'}包屏内容: ${specialContent.contentName}`);
  
  // 查找对应的媒体（在特殊媒体列表中查找）
  const mediaIndex = specialMediaList.findIndex(media => media.fileName === specialContent.contentName);
  
  if (mediaIndex >= 0) {
    // 播放该媒体并设置循环
    playSpecialMedia(mediaIndex, specialContent.type === 'morning' ? 'morning' : 'evening');
  } else {
    console.warn(`找不到包屏内容: ${specialContent.contentName}，将播放常规内容`);
    playMediaAtIndex(0);
  }
}

// 播放特殊媒体
function playSpecialMedia(index, specialType) {
  if (!isPlaying || index < 0 || index >= specialMediaList.length) {
    return;
  }
  
  // 清除上一个计时器
  clearTimeout(playTimer);
  
  console.log(`播放特殊媒体: ${specialType}包屏, 索引:`, index);
  
  // 获取当前要播放的媒体
  const media = specialMediaList[index];
  document.getElementById('play-status').textContent = `当前播放状态: 正在播放${specialType === 'morning' ? '早间' : '晚间'}包屏 - ${media.fileName}`;
  
  // 发送特殊标记，表明这是包屏内容
  const specialFlag = specialType === 'morning' ? 'morning' : 'evening';
  
  // 创建新窗口播放内容
  ipcRenderer.send('open-player-window', {
    media: media,
    index: index,
    isSpecialContent: true,
    specialType: specialFlag,
    config: currentConfig
  });
  
  // 监听来自播放窗口的播放结束事件
  ipcRenderer.once('media-playback-ended', (event, data) => {
    console.log('收到特殊媒体播放结束事件:', data);
    if (isPlaying) {
      // 检查是否仍在包屏时段
      const specialContent = checkSpecialContent();
      if (specialContent && specialContent.type === specialType) {
        // 继续循环播放包屏内容
        playSpecialMedia(index, specialType);
      } else {
        // 不在包屏时段，切换回普通播放
        playMediaAtIndex(0);
      }
    }
  });
}

// 播放指定索引的媒体
function playMediaAtIndex(index, isSpecialContent = false) {
  if (!isPlaying || index < 0 || index >= currentPlaylist.length) {
    return;
  }
  
  // 清除上一个计时器和播放器
  clearTimeout(playTimer);
  const oldContainer = document.getElementById('media-player-container');
  if (oldContainer) {
    oldContainer.remove();
  }
  
  console.log('Playing media index:', index, isSpecialContent ? '(special content)' : '');
  
  // 获取当前要播放的媒体
  const media = currentPlaylist[index];
  selectedMediaIndex = index; // 更新选中的媒体索引，便于观察当前播放项
  document.getElementById('play-status').textContent = `当前播放状态: 正在播放 - ${media.fileName}`;
  
  // 创建新窗口播放内容
  openPlayerWindow(media, index, isSpecialContent);
  
  // 更新播放列表显示，高亮当前播放项
  updatePlaylistTable();
}

// 开启播放窗口
function openPlayerWindow(media, index, isSpecialContent) {
  console.log(`打开播放窗口，媒体文件:${media.fileName}，路径:${media.filePath}，索引:${index}，特殊内容:${isSpecialContent}`);
  
  if (!media.filePath) {
    console.error('媒体文件路径为空!', media);
    alert(`播放错误: 媒体文件"${media.fileName}"路径无效!`);
    stopPlayback();
    return;
  }
  
  // 检查文件是否存在
  if (!fs.existsSync(media.filePath)) {
    console.error(`媒体文件不存在: ${media.filePath}`);
    alert(`播放错误: 找不到媒体文件"${media.fileName}"!`);
    stopPlayback();
    return;
  }
  
  // 发送打开播放窗口的请求到主进程
  ipcRenderer.send('open-player-window', {
    media: media,
    index: index,
    isSpecialContent: isSpecialContent,
    config: currentConfig
  });
  
  // 重置媒体结束标志
  mediaEnded = false;

  // 确保每次只有一个监听器
  ipcRenderer.removeAllListeners('media-playback-ended');
  ipcRenderer.removeAllListeners('player-window-closed');
  
  // 监听来自播放窗口的播放结束事件
  ipcRenderer.on('media-playback-ended', handleMediaEnded);
  
  // 监听来自主窗口的关闭事件
  ipcRenderer.on('player-window-closed', handlePlayerWindowClosed);
}

// 处理媒体结束事件
function handleMediaEnded(event, data) {
  console.log('接收到媒体结束事件:', data);
  mediaEnded = true; // 设置媒体已经正常结束
  
  if (isPlaying) {
    // 移除旧的监听器，防止重复触发
    ipcRenderer.removeListener('media-playback-ended', handleMediaEnded);
    ipcRenderer.removeListener('player-window-closed', handlePlayerWindowClosed);
    
    // 播放下一个 - 使用更长的延迟确保窗口完全关闭
    setTimeout(() => {
      console.log(`开始播放索引 ${data.index} 之后的下一个媒体`);
      
      // 增加当前媒体的播放次数
      if (data.index >= 0 && data.index < currentPlaylist.length) {
        // 确保currentPlayCount是数字，且初始值为0
        if (typeof currentPlaylist[data.index].currentPlayCount !== 'number') {
          currentPlaylist[data.index].currentPlayCount = 0;
        }
        
        // 增加播放次数
        currentPlaylist[data.index].currentPlayCount += 1;
        console.log(`媒体 ${currentPlaylist[data.index].fileName} 播放次数: ${currentPlaylist[data.index].currentPlayCount}/${currentPlaylist[data.index].maxPlayCount || 1}`);
        
        // 保存播放列表以保留播放次数记录
        savePlaylist();
      }
      
      // 播放下一个媒体
      playNext(data.index, data.isSpecialContent);
    }, 1000); // 增加延迟时间到1秒
  }
}

// 处理播放窗口关闭事件
function handlePlayerWindowClosed() {
  console.log('Received player window closed event');
  
  // 如果媒体没有正常结束（用户手动关闭窗口）
  if (!mediaEnded) {
    console.log('Player window was manually closed, stopping playback');
    // 移除监听器
    ipcRenderer.removeListener('media-playback-ended', handleMediaEnded);
    ipcRenderer.removeListener('player-window-closed', handlePlayerWindowClosed);
    
    // 停止播放
    stopPlayback();
  } else {
    console.log('Player window closed after media ended, playback continuing');
  }
}

// 播放下一个媒体
function playNext(currentIndex, isSpecialContent = false) {
  if (!isPlaying) return;
  console.log(`Attempting to play next media, current index:${currentIndex}, isSpecial:${isSpecialContent}`);
  
  // 重新检查是否应该播放包屏内容
  const specialContent = checkSpecialContent();
  
  // 如果是包屏内容，且当前时间仍在包屏时段
  if (isSpecialContent && specialContent) {
    console.log('Still in special content period, continuing special content');
    // 继续播放同一个包屏内容（循环播放）
    playMediaAtIndex(currentIndex, true);
    return;
  }
  
  // 如果之前不是包屏内容，但当前时间进入了包屏时段
  if (!isSpecialContent && specialContent) {
    console.log('Entered special content period, switching to special content');
    playSpecialContent(specialContent);
    return;
  }
  
  // 检查是否需要再次播放当前媒体（根据最大播放次数）
  if (currentIndex >= 0 && currentIndex < currentPlaylist.length) {
    const currentMedia = currentPlaylist[currentIndex];
    
    // 确保maxPlayCount是数字，且至少为1
    const maxCount = typeof currentMedia.maxPlayCount === 'number' && currentMedia.maxPlayCount > 0 
        ? currentMedia.maxPlayCount 
        : 1;
    
    // 确保currentPlayCount是数字
    const currentCount = typeof currentMedia.currentPlayCount === 'number' 
        ? currentMedia.currentPlayCount 
        : 0;
    
    console.log(`检查播放次数: ${currentMedia.fileName}, 当前次数: ${currentCount}, 最大次数: ${maxCount}`);
    
    if (currentCount < maxCount) {
      console.log(`媒体 ${currentMedia.fileName} 已经播放 ${currentCount}/${maxCount} 次，继续播放`);
      // 还需要继续播放当前媒体
      playMediaAtIndex(currentIndex);
      return;
    } else {
      console.log(`媒体 ${currentMedia.fileName} 已达到最大播放次数 (${maxCount})，准备播放下一个`);
      // 重置当前播放次数，以便下次轮到它时重新计数
      currentMedia.currentPlayCount = 0;
      // 保存播放列表以保存更新后的播放次数
      savePlaylist();
    }
  }
  
  // 正常播放下一个媒体
  let nextIndex = currentIndex + 1;
  
  // 如果已达列表末尾
  if (nextIndex >= currentPlaylist.length) {
    if (currentConfig.playback.loopPlaylist) {
      console.log('End of playlist, looping back to start');
      nextIndex = 0; // 循环播放
    } else {
      console.log('End of playlist, stopping playback');
      // 停止播放
      stopPlayback();
      return;
    }
  }
  
  // 播放下一个
  console.log(`Playing next media, index:${nextIndex}`);
  playMediaAtIndex(nextIndex);
}

// 暂停播放
function pausePlayback() {
  console.log('尝试暂停播放');
  if (isPlaying) {
    ipcRenderer.send('pause-playback');
    document.getElementById('play-status').textContent = '当前播放状态: 已暂停';
  }
}

// 停止播放
function stopPlayback() {
  console.log('停止播放');
  isPlaying = false;
  document.getElementById('play-status').textContent = '当前播放状态: 已停止';
  
  // 通知播放窗口关闭
  ipcRenderer.send('stop-playback');
  
  // 清除计时器
  if (playTimer) {
    clearTimeout(playTimer);
    playTimer = null;
  }
  
  // 移除所有相关事件监听器，防止再次触发
  ipcRenderer.removeAllListeners('media-playback-ended');
  ipcRenderer.removeAllListeners('player-window-closed');
  
  // 重置媒体结束标志
  mediaEnded = false;
  
  console.log('已完全停止播放，清除所有监听器和定时器');
}

// 打开设置模态框
function openSettingsModal() {
  // 将配置填充到表单
  populateSettingsForm();
  
  // 显示设置模态框
  const settingsModal = new bootstrap.Modal(document.getElementById('settings-modal'));
  settingsModal.show();
}

// 填充设置表单
function populateSettingsForm() {
  console.log('填充设置表单');
  try {
    // 检查并设置屏幕位置和大小
    const screenTop = document.getElementById('screen-top');
    if (screenTop) screenTop.value = currentConfig.window.top;
    
    const screenLeft = document.getElementById('screen-left');
    if (screenLeft) screenLeft.value = currentConfig.window.left;
    
    const screenWidth = document.getElementById('screen-width');
    if (screenWidth) screenWidth.value = currentConfig.window.width;
    
    const screenHeight = document.getElementById('screen-height');
    if (screenHeight) screenHeight.value = currentConfig.window.height;
    
    // 检查并设置基础选项
    const startTime = document.getElementById('start-time');
    if (startTime) startTime.value = currentConfig.playback.startTime;
    
    const endTime = document.getElementById('end-time');
    if (endTime) endTime.value = currentConfig.playback.endTime;
    
    // 检查并设置包屏设置
    const enableSpecialContent = document.getElementById('enable-special-content');
    if (enableSpecialContent) enableSpecialContent.checked = currentConfig.specialContent.enableSpecialContent;
    
    const morningStart = document.getElementById('morning-start');
    if (morningStart) morningStart.value = currentConfig.specialContent.morningStart;
    
    const morningEnd = document.getElementById('morning-end');
    if (morningEnd) morningEnd.value = currentConfig.specialContent.morningEnd;
    
    const eveningStart = document.getElementById('evening-start');
    if (eveningStart) eveningStart.value = currentConfig.specialContent.eveningStart;
    
    const eveningEnd = document.getElementById('evening-end');
    if (eveningEnd) eveningEnd.value = currentConfig.specialContent.eveningEnd;
    
    // 检查并设置亮度设置
    const brightnessRange = document.getElementById('brightness-range');
    if (brightnessRange) brightnessRange.value = currentConfig.screen.brightness;
    
    const brightnessValue = document.getElementById('brightness-value');
    if (brightnessValue) brightnessValue.textContent = `${currentConfig.screen.brightness}%`;
    
    // 检查并设置天气设置
    const enableWeather = document.getElementById('enable-weather');
    if (enableWeather) enableWeather.checked = currentConfig.weather.enabled;
    
    const weatherCity = document.getElementById('weather-city');
    if (weatherCity) weatherCity.value = currentConfig.weather.city;
    
    const weatherInterval = document.getElementById('weather-interval');
    if (weatherInterval) weatherInterval.value = currentConfig.weather.updateInterval;
    
    const weatherPosition = document.getElementById('weather-position');
    if (weatherPosition) weatherPosition.value = currentConfig.weather.position;
    
    // 更新媒体选择框
    updateMediaSelects();
    
    // 媒体设置表单处理
    const mediaSettingsForm = document.getElementById('media-settings-form');
    if (!mediaSettingsForm) return;
    
    if (selectedMediaIndex === -1 || !currentPlaylist[selectedMediaIndex]) {
      // 隐藏表单
      mediaSettingsForm.style.display = 'none';
      return;
    }
    
    // 显示表单
    mediaSettingsForm.style.display = 'block';
    
    // 获取选中的媒体
    const media = currentPlaylist[selectedMediaIndex];
    
    // 填充表单字段
    const durationInput = document.getElementById('media-duration');
    const fullPlaybackCheck = document.getElementById('full-playback');
    
    if (durationInput && fullPlaybackCheck) {
      // 根据是否完整播放设置复选框状态和时长输入
      if (media.type === 'video' && (!media.duration || media.duration === 0)) {
        fullPlaybackCheck.checked = true;
        durationInput.value = '0';
        durationInput.disabled = true;
      } else {
        fullPlaybackCheck.checked = false;
        durationInput.disabled = false;
        durationInput.value = media.duration || 0;
      }
    }
    
    // 填充发布日期
    const publishDateInput = document.getElementById('media-publish-date');
    if (publishDateInput) {
      if (media.publishDate) {
        publishDateInput.value = media.publishDate;
      } else {
        const today = new Date().toISOString().split('T')[0];
        publishDateInput.value = today;
      }
    }
    
    // 填充下刊日期
    const unpublishDateInput = document.getElementById('media-unpublish-date');
    if (unpublishDateInput) {
      if (media.unpublishDate) {
        unpublishDateInput.value = media.unpublishDate;
      } else {
        // 默认设置为三个月后
        const threeMonthsLater = new Date();
        threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
        unpublishDateInput.value = threeMonthsLater.toISOString().split('T')[0];
      }
    }
    
    // 填充自动下刊选项
    const autoUnpublish = document.getElementById('auto-unpublish');
    if (autoUnpublish) {
      autoUnpublish.checked = media.autoUnpublish !== false;
    }
    
    // 填充播放次数
    const maxPlayCountInput = document.getElementById('max-play-count');
    if (maxPlayCountInput) {
      maxPlayCountInput.value = media.maxPlayCount || 1;
    }
    
    console.log('设置表单填充完成');
  } catch (error) {
    console.error('保存设置错误:', error);
    alert('保存设置失败: ' + error.message);
    return false;
  }
}

// 保存播放列表
async function savePlaylist() {
  try {
    const result = await ipcRenderer.invoke('save-playlist', currentPlaylist);
    return true;
  } catch (error) {
    console.error('保存播放列表错误:', error);
    alert('保存播放列表失败: ' + error.message);
    return false;
  }
}

// 保存特殊媒体列表
async function saveSpecialMediaList() {
  try {
    const specialMediaPath = path.join(ipcRenderer.sendSync('get-user-data-path'), 'special-media.json');
    fs.writeFileSync(specialMediaPath, JSON.stringify(specialMediaList, null, 2));
    console.log('保存特殊媒体列表成功');
    return true;
  } catch (error) {
    console.error('保存特殊媒体列表失败:', error);
    return false;
  }
}

// 处理文件菜单
function handleFileMenu() {
  alert('文件菜单: 可实现导入/导出配置、退出等功能');
}

// 显示帮助
function showHelp() {
  alert('XLD专用播放器 v1.0\n\n请参考使用说明文档获取详细帮助。');
}

// 更新亮度值显示
function updateBrightnessValue() {
  const brightnessRange = document.getElementById('brightness-range');
  if (brightnessRange) {
    const value = brightnessRange.value;
    const brightnessValue = document.getElementById('brightness-value');
    if (brightnessValue) {
      brightnessValue.textContent = `${value}%`;
    }
  }
}

// 开始天气服务
function startWeatherService() {
  // 立即获取一次天气
  fetchWeather();
  
  // 定时更新天气
  const updateInterval = currentConfig.weather.updateInterval * 60 * 1000; // 转换为毫秒
  if (weatherUpdateTimer) {
    clearInterval(weatherUpdateTimer);
  }
  
  weatherUpdateTimer = setInterval(() => {
    fetchWeather();
  }, updateInterval);
  
  console.log(`已启动天气服务，城市: ${currentConfig.weather.city}，更新间隔: ${currentConfig.weather.updateInterval}分钟`);
}

// 获取天气数据
function fetchWeather() {
  if (!currentConfig.weather.enabled) return;
  
  const city = currentConfig.weather.city;
  console.log(`获取${city}的天气数据`);
  
  // 创建或更新天气显示
  updateWeatherDisplay({
    city: city,
    temperature: getRandomInt(5, 35), // 模拟温度数据
    weather: getRandomWeather(), // 模拟天气状况
    humidity: getRandomInt(30, 95) // 模拟湿度
  });
}

// 获取随机整数（模拟数据用）
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 获取随机天气状况（模拟数据用）
function getRandomWeather() {
  const weathers = ['晴', '多云', '阴', '小雨', '中雨', '大雨', '雷阵雨', '小雪', '中雪', '大雪'];
  return weathers[Math.floor(Math.random() * weathers.length)];
}

// 启动播放时间检查器
function startPlayTimeChecker() {
  // 先清除可能存在的旧定时器
  if (playTimeChecker) {
    clearInterval(playTimeChecker);
  }
  
  // 立即检查一次
  checkPlayTime();
  
  // 每分钟检查一次播放时间
  playTimeChecker = setInterval(checkPlayTime, 60000);
  console.log('已启动播放时间检查器，每分钟检查一次');
}

// 检查播放时间
function checkPlayTime() {
  const inPlayTime = isWithinPlayTime();
  
  // 如果正在播放但不在播放时段，则停止播放
  if (isPlaying && !inPlayTime) {
    console.log('当前时间不在允许的播放时段内，停止播放');
    stopPlayback();
    document.getElementById('play-status').textContent = '当前播放状态: 非播放时段';
  }
  
  // 如果配置了自动开始播放，且当前不在播放，但在播放时段，则开始播放
  if (!isPlaying && inPlayTime && currentConfig.playback.autoStart) {
    console.log('当前时间在允许的播放时段内，自动开始播放');
    startPlayback();
  }
}

// 检查当前时间是否在允许的播放时段
function isWithinPlayTime() {
  if (!currentConfig.playback.startTime || !currentConfig.playback.endTime) {
    return true; // 如果没有设置开关播时间，则始终允许播放
  }
  
  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTimeMinutes = currentHours * 60 + currentMinutes;
  
  const [startHours, startMinutes] = currentConfig.playback.startTime.split(':').map(Number);
  const [endHours, endMinutes] = currentConfig.playback.endTime.split(':').map(Number);
  
  const startTimeMinutes = startHours * 60 + startMinutes;
  const endTimeMinutes = endHours * 60 + endMinutes;
  
  // 如果结束时间小于开始时间，表示跨天（例如22:00-08:00）
  if (endTimeMinutes < startTimeMinutes) {
    return currentTimeMinutes >= startTimeMinutes || currentTimeMinutes <= endTimeMinutes;
  } else {
    return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes;
  }
}

// 应用媒体设置
function applyMediaSettings() {
  if (selectedMediaIndex === -1 || !currentPlaylist[selectedMediaIndex]) {
    return false;
  }
  
  // 获取媒体对象
  const media = currentPlaylist[selectedMediaIndex];
  
  // 获取表单值
  const durationInput = document.getElementById('media-duration');
  const fullPlaybackCheck = document.getElementById('full-playback');
  const publishDateInput = document.getElementById('media-publish-date');
  const unpublishDateInput = document.getElementById('media-unpublish-date');
  const autoUnpublishCheck = document.getElementById('auto-unpublish');
  const maxPlayCountInput = document.getElementById('max-play-count');
  
  // 设置媒体时长
  if (media.type === 'video' && fullPlaybackCheck.checked) {
    media.duration = 0; // 0 表示完整播放
  } else {
    let duration = parseInt(durationInput.value);
    // 确保图片至少有10秒的显示时间
    if (media.type === 'image' && (!duration || duration < 10)) {
      duration = 10;
    }
    media.duration = duration;
  }
  
  // 设置日期
  media.publishDate = publishDateInput.value;
  media.unpublishDate = unpublishDateInput.value;
  media.autoUnpublish = autoUnpublishCheck.checked;
  
  // 设置播放次数
  const maxPlayCount = parseInt(maxPlayCountInput.value);
  media.maxPlayCount = maxPlayCount > 0 ? maxPlayCount : 1;
  
  // 重置当前播放次数
  media.currentPlayCount = 0;
  
  // 保存播放列表
  savePlaylist();
  
  // 更新表格
  updatePlaylistTable();
  
  console.log(`媒体设置已应用：${media.fileName}, 时长: ${media.duration === 0 ? '完整播放' : media.duration + '秒'}, 播放次数: ${media.maxPlayCount}次`);
  
  return true;
}

// 更新媒体选择框
function updateMediaSelects() {
  console.log('更新媒体选择框');
  try {
    const morningSelect = document.getElementById('morning-content');
    const eveningSelect = document.getElementById('evening-content');
    
    // 如果不存在选择框，直接返回
    if (!morningSelect || !eveningSelect) {
      console.log('找不到包屏内容选择框，跳过更新');
      return;
    }
    
    // 清空选择框
    morningSelect.innerHTML = '<option value="">-- 请选择素材 --</option>';
    eveningSelect.innerHTML = '<option value="">-- 请选择素材 --</option>';
    
    // 添加自定义选项
    const customOption = document.createElement('option');
    customOption.value = "custom";
    customOption.textContent = "-- 添加新素材 --";
    morningSelect.appendChild(customOption.cloneNode(true));
    eveningSelect.appendChild(customOption.cloneNode(true));
    
    // 填充特殊媒体素材
    specialMediaList.forEach((media, index) => {
      const option = document.createElement('option');
      option.value = `special:${index}`;
      option.textContent = media.fileName;
      
      morningSelect.appendChild(option.cloneNode(true));
      eveningSelect.appendChild(option.cloneNode(true));
    });
    
    // 设置选中值
    if (currentConfig.specialContent.morningContent) {
      // 在特殊媒体列表中查找对应的内容
      const morningMedia = specialMediaList.find(m => m.fileName === currentConfig.specialContent.morningContent);
      if (morningMedia) {
        const index = specialMediaList.indexOf(morningMedia);
        morningSelect.value = `special:${index}`;
      }
    }
    
    if (currentConfig.specialContent.eveningContent) {
      // 在特殊媒体列表中查找对应的内容
      const eveningMedia = specialMediaList.find(m => m.fileName === currentConfig.specialContent.eveningContent);
      if (eveningMedia) {
        const index = specialMediaList.indexOf(eveningMedia);
        eveningSelect.value = `special:${index}`;
      }
    }
    
    // 添加包屏素材选择变化事件
    morningSelect.addEventListener('change', function(e) {
      if (this.value === 'custom') {
        this.value = '';
        addSpecialContentMedia('morning');
      }
    });
    
    eveningSelect.addEventListener('change', function(e) {
      if (this.value === 'custom') {
        this.value = '';
        addSpecialContentMedia('evening');
      }
    });
    
    console.log('媒体选择框更新完成');
  } catch (error) {
    console.error('更新媒体选择框出错:', error);
  }
}

// 添加包屏素材
function addSpecialContentMedia(period) {
  console.log(`添加${period}包屏素材`);
  
  // 创建文件选择对话框
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'video/*,image/*';
  
  input.onchange = async (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // 获取当前日期作为默认上刊日期
      const today = new Date().toISOString().split('T')[0];
      
      // 计算默认下刊日期（3个月后）
      const unpublishDefault = new Date();
      unpublishDefault.setMonth(unpublishDefault.getMonth() + 3);
      const defaultUnpublishDate = unpublishDefault.toISOString().split('T')[0];
      
      // 默认完整播放视频
      const defaultDuration = 0;
      
      // 创建媒体对象
      const media = {
        fileName: file.name,
        filePath: file.path,
        type: file.type.startsWith('video/') ? 'video' : 'image',
        duration: file.type.startsWith('video/') ? defaultDuration : 10,
        publishDate: today,
        unpublishDate: defaultUnpublishDate,
        autoUnpublish: true,
        isSpecial: true, // 标记为特殊媒体
        maxPlayCount: 1, // 默认播放1次后切换到下一个
        currentPlayCount: 0 // 当前播放次数
      };
      
      // 添加到特殊媒体列表
      specialMediaList.push(media);
      
      // 保存特殊媒体列表
      await saveSpecialMediaList();
      
      // 更新媒体选择框
      updateMediaSelects();
      
      // 选择新添加的媒体
      const newIndex = specialMediaList.length - 1;
      const selectElem = document.getElementById(period === 'morning' ? 'morning-content' : 'evening-content');
      if (selectElem) {
        selectElem.value = `special:${newIndex}`;
      }
      
      alert(`已添加${period === 'morning' ? '早间' : '晚间'}包屏素材: ${file.name}`);
    }
  };
  
  input.click();
}

// 保存设置
async function saveSettings() {
  console.log('开始保存设置');
  try {
    // 从表单收集数据
    // 屏幕位置和大小
    const screenTop = document.getElementById('screen-top');
    const screenLeft = document.getElementById('screen-left');
    const screenWidth = document.getElementById('screen-width');
    const screenHeight = document.getElementById('screen-height');
    
    if (screenTop) currentConfig.window.top = parseInt(screenTop.value) || 0;
    if (screenLeft) currentConfig.window.left = parseInt(screenLeft.value) || 0;
    if (screenWidth) currentConfig.window.width = parseInt(screenWidth.value) || 1280;
    if (screenHeight) currentConfig.window.height = parseInt(screenHeight.value) || 720;
    
    // 基础选项
    const startTime = document.getElementById('start-time');
    const endTime = document.getElementById('end-time');
    
    if (startTime) currentConfig.playback.startTime = startTime.value;
    if (endTime) currentConfig.playback.endTime = endTime.value;
    
    // 禁用自动播放功能
    currentConfig.playback.autoStart = false;
    
    // 默认设置
    currentConfig.playback.defaultDuration = 0; // 默认完整播放
    currentConfig.playback.loopPlaylist = true; // 默认循环播放
    currentConfig.playback.randomOrder = false; // 默认顺序播放
    
    // 包屏设置
    const enableSpecialContent = document.getElementById('enable-special-content');
    const morningStart = document.getElementById('morning-start');
    const morningEnd = document.getElementById('morning-end');
    const eveningStart = document.getElementById('evening-start');
    const eveningEnd = document.getElementById('evening-end');
    
    if (enableSpecialContent) currentConfig.specialContent.enableSpecialContent = enableSpecialContent.checked;
    if (morningStart) currentConfig.specialContent.morningStart = morningStart.value;
    if (morningEnd) currentConfig.specialContent.morningEnd = morningEnd.value;
    if (eveningStart) currentConfig.specialContent.eveningStart = eveningStart.value;
    if (eveningEnd) currentConfig.specialContent.eveningEnd = eveningEnd.value;
    
    // 处理早间包屏内容选择
    const morningSelect = document.getElementById('morning-content');
    if (morningSelect && morningSelect.value && morningSelect.value.startsWith('special:')) {
      const index = parseInt(morningSelect.value.split(':')[1]);
      if (!isNaN(index) && index >= 0 && index < specialMediaList.length) {
        currentConfig.specialContent.morningContent = specialMediaList[index].fileName;
      } else {
        currentConfig.specialContent.morningContent = '';
      }
    } else if (morningSelect) {
      currentConfig.specialContent.morningContent = '';
    }
    
    // 处理晚间包屏内容选择
    const eveningSelect = document.getElementById('evening-content');
    if (eveningSelect && eveningSelect.value && eveningSelect.value.startsWith('special:')) {
      const index = parseInt(eveningSelect.value.split(':')[1]);
      if (!isNaN(index) && index >= 0 && index < specialMediaList.length) {
        currentConfig.specialContent.eveningContent = specialMediaList[index].fileName;
      } else {
        currentConfig.specialContent.eveningContent = '';
      }
    } else if (eveningSelect) {
      currentConfig.specialContent.eveningContent = '';
    }
    
    // 亮度设置
    const brightnessRange = document.getElementById('brightness-range');
    if (brightnessRange) currentConfig.screen.brightness = parseInt(brightnessRange.value) || 75;
    
    // 天气设置
    const enableWeather = document.getElementById('enable-weather');
    const weatherCity = document.getElementById('weather-city');
    const weatherInterval = document.getElementById('weather-interval');
    const weatherPosition = document.getElementById('weather-position');
    
    if (enableWeather) currentConfig.weather.enabled = enableWeather.checked;
    if (weatherCity) currentConfig.weather.city = weatherCity.value || '深圳市';
    if (weatherInterval) currentConfig.weather.updateInterval = parseInt(weatherInterval.value) || 60;
    if (weatherPosition) currentConfig.weather.position = weatherPosition.value || 'topRight';
    
    console.log('保存设置:', currentConfig);
    
    // 保存配置
    const result = await ipcRenderer.invoke('save-config', currentConfig);
    console.log('保存配置结果:', result);
    
    // 关闭模态框
    const settingsModal = document.getElementById('settings-modal');
    if (settingsModal) {
      const modal = bootstrap.Modal.getInstance(settingsModal);
      if (modal) modal.hide();
    }
    
    // 更新界面
    updatePlaylistTable();
    
    // 应用亮度设置
    if (currentMediaElement) {
      currentMediaElement.style.filter = `brightness(${currentConfig.screen.brightness}%)`;
    }
    
    // 检查是否需要更新天气服务
    if (currentConfig.weather.enabled) {
      startWeatherService();
    } else {
      // 如果禁用，清除天气定时器和显示
      if (weatherUpdateTimer) {
        clearInterval(weatherUpdateTimer);
        weatherUpdateTimer = null;
      }
      const weatherContainer = document.getElementById('weather-container');
      if (weatherContainer) {
        weatherContainer.remove();
      }
    }
    
    alert('设置已保存！');
    return true;
  } catch (error) {
    console.error('保存设置错误:', error);
    alert('保存设置失败: ' + error.message);
    return false;
  }
} 