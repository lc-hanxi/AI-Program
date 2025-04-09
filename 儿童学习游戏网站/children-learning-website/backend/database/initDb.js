const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 定义数据库文件路径 (在当前目录下)
const dbPath = path.join(__dirname, 'learning_website.db');

// 连接数据库
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Database file opened. Waiting for connection confirmation...');
  }
});

const createTablesSQL = `
  -- 管理员用户表
  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL, -- MD5 hash (32 chars)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- 数学游戏关卡设置表
  CREATE TABLE IF NOT EXISTS math_levels (
    level_number INTEGER PRIMARY KEY,
    max_number INTEGER NOT NULL,
    duration_seconds INTEGER NOT NULL DEFAULT 60,
    is_boss_level INTEGER DEFAULT 0, -- 0 for FALSE, 1 for TRUE
    boss_health INTEGER,
    boss_hits_required INTEGER,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- 英语单词库表
  CREATE TABLE IF NOT EXISTS english_words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word TEXT NOT NULL UNIQUE,
    image_path TEXT,
    audio_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- 中文字库表
  CREATE TABLE IF NOT EXISTS chinese_characters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character TEXT NOT NULL UNIQUE,
    poem_or_song TEXT,           -- 替换 pinyin
    image_path TEXT,
    poem_audio_path TEXT,        -- 替换 audio_path
    char_audio_path TEXT,        -- 新增：汉字读音音频
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 保留
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- 保留
  );

  -- 数学游戏分数表
  CREATE TABLE IF NOT EXISTS math_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mode TEXT NOT NULL, -- 'campaign' or 'challenge'
    score INTEGER NOT NULL,
    level INTEGER,      -- Only relevant for campaign mode 
    date DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 英语游戏分数表
  CREATE TABLE IF NOT EXISTS english_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    words_count INTEGER NOT NULL,
    win BOOLEAN NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 语文游戏分数表
  CREATE TABLE IF NOT EXISTS chinese_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    score INTEGER NOT NULL,  -- 可以根据游戏具体规则定义score的含义
    date DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 英语游戏关卡难度设置表 (新增)
  CREATE TABLE IF NOT EXISTS english_levels (
    level INTEGER PRIMARY KEY,          -- 关卡号
    zombie_speed REAL NOT NULL DEFAULT 1.0, -- 僵尸速度 (例如: 像素/秒)
    raccoon_step_base REAL NOT NULL DEFAULT 0.5 -- 浣熊基础步长 (例如: 像素/字母)
  );

  -- 语文游戏关卡难度设置表 (新增)
  CREATE TABLE IF NOT EXISTS chinese_levels (
    level INTEGER PRIMARY KEY,            -- 关卡号
    balloon_speed REAL NOT NULL DEFAULT 50.0, -- 气球上升速度 (例如: 像素/秒)
    balloons_per_wave INTEGER NOT NULL DEFAULT 3 -- 每波气球数量
  );
`;

// 插入初始数据
// 注意：这里移除了 math_levels 的 INSERT，因为它们已在 createTablesSQL 中处理
// （或者保留这里的 INSERT，移除 createTablesSQL 中的）- 保持一致性
// 我们将添加英语和语文关卡的默认难度数据
const insertInitialDataSQL = `
  -- 插入默认管理员 (如果需要)
  -- INSERT OR IGNORE INTO admin_users ...

  -- 初始化数学关卡数据 (保留，如果没在 CREATE TABLE 中做)
  INSERT OR IGNORE INTO math_levels (level_number, max_number, duration_seconds, is_boss_level) VALUES
  (1, 10, 60, 0),
  (2, 20, 60, 0),
  (3, 50, 60, 0);
  INSERT OR IGNORE INTO math_levels (level_number, max_number, duration_seconds, is_boss_level, boss_health, boss_hits_required) VALUES
  (4, 50, 60, 1, 150, 15);

  -- 初始化英语关卡难度 (修改为 4 关)
  INSERT OR IGNORE INTO english_levels (level, zombie_speed, raccoon_step_base) VALUES
  (1, 0.8, 0.4),
  (2, 1.0, 0.5),
  (3, 1.2, 0.6),
  (4, 1.4, 0.7); -- 只保留 4 关
  -- (移除第 5-10 关的数据)

  -- 初始化语文关卡难度 (修改为 4 关)
  INSERT OR IGNORE INTO chinese_levels (level, balloon_speed, balloons_per_wave) VALUES
  (1, 40.0, 2),
  (2, 50.0, 3),
  (3, 60.0, 3),
  (4, 70.0, 4); -- 只保留 4 关
  -- (移除第 5-10 关的数据)
`;

// 执行 SQL (修改: 分开执行 CREATE 和 INSERT)
// 确保在数据库连接成功后执行
function initializeDatabase() {
  db.serialize(() => {
    // 1. 创建所有表
    db.exec(createTablesSQL, (err) => {
      if (err) {
        console.error('Error creating tables:', err.message);
      } else {
        console.log('Tables created or already exist.');
        // 2. 表创建成功后，插入所有初始数据
        db.exec(insertInitialDataSQL, (insertErr) => {
           if (insertErr) {
             console.error('Error inserting initial data:', insertErr.message);
           } else {
             console.log('Initial data inserted or already exists.');
           }
        });
        // 3. 创建默认管理员 (如果需要分开处理)
        createDefaultAdmin();
      }
    });
  });
}

// 连接数据库时调用初始化
db.on('open', () => {
  console.log('Database connection confirmed open and ready.');
  initializeDatabase();
});

// 示例：创建默认管理员 (使用 MD5)
// !!! 警告：MD5 不安全，仅作演示，生产环境请使用 bcrypt !!!
const crypto = require('crypto');

function md5(text) {
  return crypto.createHash('md5').update(text).digest('hex');
}

function createDefaultAdmin() {
  const username = 'admin';
  const password = 'password123'; // 设置一个默认密码
  const passwordHash = md5(password);
  const insertAdminSQL = `INSERT OR IGNORE INTO admin_users (username, password_hash) VALUES (?, ?)`;

  db.run(insertAdminSQL, [username, passwordHash], function(err) {
    if (err) {
      console.error('Error inserting default admin user', err.message);
    } else {
      if (this.changes > 0) {
        console.log(`Default admin user "${username}" created.`);
        console.warn('WARNING: Using MD5 is insecure.');
      } else {
        console.log(`Admin user "${username}" already exists.`);
      }
    }
  });
}

// 导出数据库连接实例，以便其他模块使用 (可选)
module.exports = db; 