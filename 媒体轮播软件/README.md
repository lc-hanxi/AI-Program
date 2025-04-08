# XLD Media Player

XLD Media Player是一个专用的媒体轮播播放器，用于播放视频和图片媒体文件。

## 特性

- 支持视频和图片轮播播放
- 可自定义播放设置（循环播放、显示时长等）
- 全屏播放模式
- 可设置播放时间范围

## 使用方法

### 打包好的可执行文件

1. 打开`dist`文件夹
2. 找到`XLD-MediaPlayer.exe`文件，双击运行

### 便携版

1. 打开`dist/standalone`文件夹
2. 找到`XLD-MediaPlayer.exe`文件，双击运行
3. 您可以将整个`standalone`文件夹拷贝到U盘或其他存储设备上，随处使用

## 配置说明

配置文件会自动保存在以下位置：
```
C:/Users/您的用户名/AppData/Roaming/xld-media-player/config.json
```

### 主要配置项

- **播放设置**：控制播放列表循环、默认显示时长等
- **窗口设置**：控制应用窗口大小和位置
- **特殊内容**：可设置在特定时间段播放特定内容

## 开发信息

本应用使用Electron和Node.js开发。

### 开发命令

- `npm start`：启动开发模式
- `npm run packager`：打包应用为可执行文件

### 项目结构

- `main.js`：主进程代码
- `index.html`：主界面
- `player.html`：播放器界面
- `js/app.js`：应用逻辑
- `css/style.css`：样式表 