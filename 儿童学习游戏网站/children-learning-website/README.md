# 小豆豆的学习乐园

这是一个专为5岁儿童设计的趣味学习网站，通过游戏的方式帮助孩子学习数学、英语和语文知识。

## 功能特点

- **数学学习**：通过射击游戏学习50以内的加减法
- **英语学习**：通过龟兔赛跑游戏学习简单英语单词拼写
- **语文学习**：学习汉字和相关古诗，通过气球游戏巩固汉字识别
- **学习统计**：记录孩子的学习情况和游戏成绩

## 技术栈

- **前端框架**：Vue.js 3
- **后端服务**：Node.js + Express
- **数据库**：SQLite（本地存储）
- **游戏引擎**：原生JavaScript + CSS动画
- **样式设计**：CSS3，针对儿童的卡通风格设计

## 安装与运行

### 前提条件

- 安装 [Node.js](https://nodejs.org/) (v14.0.0以上版本)
- 安装 npm 或 yarn

### 快速开始

### Windows用户 (已解决中文乱码和启动问题)

有多种方式启动项目：

1. **最简单方法 (推荐)**: 双击运行 `FIXED-START.bat`
   - 已禁用ESLint，避免报错
   - 纯英文界面，100%兼容所有Windows系统
   - 自动安装必要依赖

2. **英文界面启动**: 双击运行 `START-APP.bat`
   - 纯英文界面，兼容所有Windows系统
   - 直接启动前后端服务，会安装基本依赖

3. **全功能方法**: 双击运行 `安装依赖并启动.bat` 
   - 先安装所有依赖，再启动服务
   - 如果出现中文乱码，请使用 `START-APP.bat`

4. **分步启动**:
   - 先双击运行 `启动后端.bat`
   - 再双击运行 `启动前端.bat`

5. **PowerShell用户**:
   - 如果使用PowerShell，请先运行 `修复中文乱码.bat`
   - 然后在PowerShell中执行 `.\Start-App.ps1`

### Mac/Linux用户

在终端中运行：
```
chmod +x start.sh
./start.sh
```

### 手动启动

如果自动启动脚本不起作用，你可以按照以下步骤手动启动项目：

1. 启动后端服务器
   ```
   cd backend
   npm install
   npm start
   ```

2. 启动前端服务器（在新的终端窗口）
   ```
   cd frontend
   npm install
   npm run serve
   ```

3. 访问网站
   在浏览器中打开 `http://localhost:8080`

## 项目结构

```
children-learning-website/
├── frontend/            # 前端代码
│   ├── public/          # 静态资源
│   │   ├── images/      # 游戏和UI图片
│   │   ├── audio/       # 语音朗读音频文件
│   │   └── index.html   # HTML入口文件
│   └── src/             # 源代码
│       ├── components/  # Vue组件
│       ├── views/       # 页面视图
│       ├── services/    # 服务API
│       ├── games/       # 游戏逻辑
│       ├── router/      # 路由配置
│       ├── App.vue      # 根组件
│       └── main.js      # 入口文件
├── backend/             # 后端代码
│   ├── server.js        # 服务器入口文件
│   └── database.db      # SQLite数据库文件
├── start.bat            # Windows启动脚本
├── start.sh             # Mac/Linux启动脚本
└── README.md            # 项目说明文档
```

## 数据存储

本项目使用SQLite数据库进行本地数据存储，所有游戏记录和分数都会保存在`backend/database.db`文件中。这种方式不需要安装额外的数据库软件，适合初学者使用。

## 自定义设置

1. **修改端口**：
   - 前端端口：在`frontend/vue.config.js`中修改（默认8080）
   - 后端端口：在`backend/server.js`中修改（默认3000）

2. **添加更多题目**：
   - 数学题目：在`frontend/src/views/Math.vue`中的`generateQuestion`函数
   - 英语单词：在`frontend/src/views/English.vue`中的`wordsList`数组
   - 汉字库：在`frontend/src/views/Chinese.vue`中的`characters`数组

## 未来计划

- 添加更多学科和游戏类型
- 实现多用户支持，允许家长监控孩子的学习进度
- 添加奖励系统，增强学习动力
- 优化移动设备上的体验

## 故障排除

### 启动问题

1. **ESLint相关错误**
   - 使用 `FIXED-START.bat` 启动 (已禁用ESLint验证)
   - 或手动安装ESLint解析器：
   ```
   cd frontend
   npm install --save-dev @babel/eslint-parser @babel/core
   ```

2. **中文显示乱码**
   - 使用纯英文的 `START-APP.bat` 或 `FIXED-START.bat` 启动程序
   - 或运行 `修复中文乱码.bat` 修复系统设置

3. **npm install 卡住不动**
   - 建议先运行 `FIXED-START.bat`，只安装必要依赖
   - 或手动执行以下命令：
   ```
   cd frontend
   npm install axios
   ```

4. **找不到模块错误**
   - 最常见的是缺少axios模块，运行 `FIXED-START.bat` 可自动修复此问题
   - 也可手动安装：`npm install axios --save`

### 其他问题

如果您遇到其他问题，请尝试以下步骤：

1. 运行 `diagnose.bat` 生成诊断信息
2. 运行 `fix-npm.bat` 修复npm环境
3. 使用 `simple-start.bat` 启动项目

## 项目贡献

欢迎任何形式的贡献，无论是新功能、bug修复还是文档更新！

## 许可证

本项目使用 MIT 许可证 