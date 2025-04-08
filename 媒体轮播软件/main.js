const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// 用户数据路径
const userDataPath = app.getPath('userData');
// 配置文件路径
const configPath = path.join(userDataPath, 'config.json');
// 播放列表路径
const playlistPath = path.join(userDataPath, 'playlist.json');

// 默认配置
const defaultConfig = {
  window: {
    width: 1000,
    height: 800,
    top: 100,
    left: 100
  },
  playback: {
    autoStart: false,
    defaultDuration: 30, // 默认30秒
    loopPlaylist: true,
    randomOrder: false,
    showCursor: true,
    startTime: '08:00',
    endTime: '22:00'
  },
  specialContent: {
    enableSpecialContent: false,
    morningStart: '08:00',
    morningEnd: '10:00',
    morningContent: '',
    eveningStart: '18:00',
    eveningEnd: '20:00',
    eveningContent: ''
  },
  screen: {
    brightness: 100,
    autoBrightness: false
  },
  weather: {
    enabled: true,
    city: '西安市',
    updateInterval: 30,
    position: 'topRight'
  }
};

// 当前配置
let currentConfig = defaultConfig;

// 确保配置目录存在
if (!fs.existsSync(userDataPath)) {
  fs.mkdirSync(userDataPath, { recursive: true });
}

// 加载配置
async function loadConfig() {
  try {
    const configPath = path.join(app.getPath('userData'), 'config.json');
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configData);
      
      // 确保所有必要的配置项都存在
      let completeConfig = { ...defaultConfig };
      
      // 递归合并配置，保留所有嵌套属性
      const mergeConfig = (target, source) => {
        for (const key in source) {
          if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
            if (!target[key]) target[key] = {};
            mergeConfig(target[key], source[key]);
          } else {
            target[key] = source[key];
          }
        }
      };
      
      mergeConfig(completeConfig, config);
      console.log('加载配置成功:', completeConfig);
      return completeConfig;
    } else {
      console.log('配置文件不存在，使用默认配置');
      // 保存默认配置
      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
      return defaultConfig;
    }
  } catch (error) {
    console.error('加载配置错误:', error);
    return defaultConfig;
  }
}

// 确保播放列表文件存在
if (!fs.existsSync(playlistPath)) {
  fs.writeFileSync(playlistPath, JSON.stringify([], null, 2));
}

let mainWindow;
let playerWindow = null; // 播放器窗口引用

// 创建主窗口
function createWindow() {
  mainWindow = new BrowserWindow({
    width: currentConfig.window.width,
    height: currentConfig.window.height,
    x: currentConfig.window.left,
    y: currentConfig.window.top,
    title: 'XLD专用播放器',
    autoHideMenuBar: true,
    menuBarVisible: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });
  
  mainWindow.loadFile('index.html');
  mainWindow.setMenu(null);
  
  mainWindow.on('closed', () => {
    mainWindow = null;
    // 主窗口关闭时，关闭播放器窗口
    if (playerWindow && !playerWindow.isDestroyed()) {
      playerWindow.close();
      playerWindow = null;
    }
  });
}

// 创建播放器窗口
function createPlayerWindow(data) {
  console.log('创建播放器窗口，媒体:', data.media.fileName);
  
  // 确保之前的窗口已关闭
  if (playerWindow && !playerWindow.isDestroyed()) {
    playerWindow.close();
    // 等待窗口关闭
    setTimeout(() => {
      actuallyCreatePlayerWindow(data);
    }, 500);
  } else {
    actuallyCreatePlayerWindow(data);
  }
}

// 实际创建播放器窗口的辅助函数
function actuallyCreatePlayerWindow(data) {
  try {
    // 验证媒体数据
    if (!data || !data.media || !data.media.filePath) {
      console.error('无效的媒体数据:', data);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('player-error', '无效的媒体数据');
      }
      return;
    }
    
    // 检查文件是否存在
    if (!fs.existsSync(data.media.filePath)) {
      console.error(`媒体文件不存在: ${data.media.filePath}`);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('player-error', `媒体文件不存在: ${data.media.fileName}`);
      }
      return;
    }
    
    console.log(`创建播放器窗口，播放: ${data.media.fileName}, 路径: ${data.media.filePath}`);
    
    playerWindow = new BrowserWindow({
      width: 1920,
      height: 1080,
      // 先不设置全屏，等待页面加载完成再设置
      fullscreen: false,
      frame: true, // 添加边框，使窗口有关闭按钮
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        // 允许播放器访问本地文件
        webSecurity: false
      }
    });
    
    console.log('正在加载播放器页面...');
    
    // 监听页面加载完成
    playerWindow.webContents.on('did-finish-load', () => {
      console.log('播放器页面加载完成，发送媒体数据');
      
      // 先显示窗口，然后延迟设置全屏和发送媒体数据
      playerWindow.show();
      
      setTimeout(() => {
        // 设置全屏
        if (playerWindow && !playerWindow.isDestroyed()) {
          console.log('设置播放器窗口为全屏');
          playerWindow.setFullScreen(true);
          
          // 发送媒体数据
          console.log('发送媒体数据到播放器窗口:', data.media.fileName);
          playerWindow.webContents.send('play-media', data);
        }
      }, 500); // 延迟500毫秒
    });
    
    // 加载播放器页面
    playerWindow.loadFile('player.html');
    
    // 添加调试输出
    playerWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
      console.log(`播放器窗口日志(${level}): ${message}`);
    });
    
    playerWindow.on('closed', () => {
      console.log('播放器窗口已关闭');
      playerWindow = null;
      // 通知主窗口播放器已关闭
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('player-window-closed');
      }
    });
    
    // 监听窗口错误
    playerWindow.webContents.on('crashed', () => {
      console.error('播放器窗口崩溃');
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('player-error', '播放器窗口崩溃');
      }
    });
  } catch (error) {
    console.error('创建播放器窗口错误:', error);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('player-error', `创建播放器窗口错误: ${error.message}`);
    }
  }
}

// 注册IPC处理程序
function registerIpcHandlers() {
  // 处理获取配置请求
  ipcMain.handle('get-config', async () => {
    return currentConfig;
  });
  
  // 处理加载配置请求
  ipcMain.handle('load-config', async () => {
    return await loadConfig();
  });
  
  // 处理获取用户数据路径请求
  ipcMain.on('get-user-data-path', (event) => {
    event.returnValue = userDataPath;
  });

  // 处理保存配置请求
  ipcMain.handle('save-config', async (event, config) => {
    try {
      // 确保保存完整的配置对象
      let completeConfig = { ...defaultConfig };
      
      // 递归合并配置，保留所有嵌套属性
      const mergeConfig = (target, source) => {
        for (const key in source) {
          if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
            if (!target[key]) target[key] = {};
            mergeConfig(target[key], source[key]);
          } else {
            target[key] = source[key];
          }
        }
      };
      
      mergeConfig(completeConfig, config);
      
      // 更新当前配置
      currentConfig = completeConfig;
      console.log('保存配置:', currentConfig);
      
      fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 2));
      return true;
    } catch (error) {
      console.error('保存配置错误:', error);
      return false;
    }
  });
  
  // 处理获取播放列表请求
  ipcMain.handle('get-playlist', async () => {
    if (!fs.existsSync(playlistPath)) {
      fs.writeFileSync(playlistPath, JSON.stringify([], null, 2));
      return [];
    }
    return JSON.parse(fs.readFileSync(playlistPath, 'utf8'));
  });
  
  // 处理加载播放列表请求
  ipcMain.handle('load-playlist', async () => {
    try {
      if (!fs.existsSync(playlistPath)) {
        fs.writeFileSync(playlistPath, JSON.stringify([], null, 2));
        return [];
      }
      const playlistData = fs.readFileSync(playlistPath, 'utf8');
      return JSON.parse(playlistData);
    } catch (error) {
      console.error('加载播放列表错误:', error);
      return [];
    }
  });
  
  // 处理保存播放列表请求
  ipcMain.handle('save-playlist', async (event, playlist) => {
    try {
      fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));
      return true;
    } catch (error) {
      console.error('保存播放列表错误:', error);
      return false;
    }
  });
  
  // 打开播放器窗口
  ipcMain.on('open-player-window', (event, data) => {
    createPlayerWindow(data);
  });
  
  // 暂停播放
  ipcMain.on('pause-playback', (event) => {
    if (playerWindow && !playerWindow.isDestroyed()) {
      playerWindow.webContents.send('toggle-pause');
    }
  });
  
  // 停止播放
  ipcMain.on('stop-playback', (event) => {
    if (playerWindow && !playerWindow.isDestroyed()) {
      playerWindow.close();
      playerWindow = null;
    }
  });
  
  // 退出全屏模式
  ipcMain.on('exit-fullscreen', (event) => {
    console.log('Received exit-fullscreen request');
    try {
      if (playerWindow && !playerWindow.isDestroyed()) {
        if (playerWindow.isFullScreen()) {
          console.log('Setting player window to non-fullscreen mode');
          playerWindow.setFullScreen(false);
        } else {
          console.log('Player window is already in non-fullscreen mode');
        }
      } else {
        console.log('Player window not available for fullscreen exit');
      }
    } catch (error) {
      console.error('Error during exit-fullscreen:', error);
    }
  });
  
  // 播放结束
  ipcMain.on('media-ended', (event, data) => {
    console.log('Media ended, sending event to main window:', data);
    try {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('media-playback-ended', data);
      } else {
        console.log('Main window not available, cannot send media-playback-ended event');
      }
    } catch (error) {
      console.error('Error sending media-playback-ended event:', error);
    }
  });
}

// 应用就绪后创建窗口
app.whenReady().then(async () => {
  // 设置应用程序字符编码
  app.commandLine.appendSwitch('lang', 'zh-CN');
  app.commandLine.appendSwitch('force-chinese-font-for-ui', 'PingFang-SC');
  
  // 先加载配置，确保创建窗口时使用正确的配置
  currentConfig = await loadConfig();
  console.log('应用启动时加载的配置:', currentConfig);
  
  // 注册IPC处理程序
  registerIpcHandlers();
  
  // 创建主窗口
  createWindow();
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 当所有窗口关闭时退出应用
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
}); 