const express = require('express');
const cors = require('cors');
// 不再需要 sqlite3 在这里，因为我们从 initDb 导入
// const sqlite3 = require('sqlite3').verbose(); 
const path = require('path');
// 导入 initDb.js 中创建的数据库连接实例
const db = require('./database/initDb'); // 确保路径正确，initDb.js 需要导出 db

// 创建Express应用
const app = express();
const port = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API路由
// 1. 数学游戏分数
app.post('/api/math-scores', (req, res) => {
  const { mode, score, level } = req.body;
  // 确保 math_scores 表存在于 learning_website.db (需要在 initDb.js 添加)
  db.run(
    'INSERT INTO math_scores (mode, score, level) VALUES (?, ?, ?)',
    [mode, score, level],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id: this.lastID });
    }
  );
});

app.get('/api/math-scores', (req, res) => {
  db.all('SELECT * FROM math_scores ORDER BY score DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json(rows);
  });
});

// 获取通关最高得分
app.get('/api/math-scores/campaign/highest', (req, res) => {
  db.get(
    'SELECT * FROM math_scores WHERE mode = "campaign" ORDER BY score DESC LIMIT 1',
    [],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(200).json(row || { score: 0, level: 0 });
    }
  );
});

// 获取挑战最高得分
app.get('/api/math-scores/challenge/highest', (req, res) => {
  db.get(
    'SELECT * FROM math_scores WHERE mode = "challenge" ORDER BY score DESC LIMIT 1',
    [],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(200).json(row || { score: 0 });
    }
  );
});

// 2. 英语游戏分数
app.post('/api/english-scores', (req, res) => {
  const { wordsCount, win } = req.body;
  db.run(
    'INSERT INTO english_scores (words_count, win) VALUES (?, ?)',
    [wordsCount, win],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id: this.lastID });
    }
  );
});

app.get('/api/english-scores', (req, res) => {
  db.all('SELECT * FROM english_scores ORDER BY words_count DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json(rows);
  });
});

// 获取英语游戏统计
app.get('/api/english-scores/stats', (req, res) => {
  db.get(
    'SELECT SUM(words_count) as total_words, COUNT(CASE WHEN win = 1 THEN 1 END) as wins, MAX(words_count) as max_words FROM english_scores',
    [],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(200).json(row || { total_words: 0, wins: 0, max_words: 0 });
    }
  );
});

// 3. 语文游戏分数
app.post('/api/chinese-scores', (req, res) => {
  const { score } = req.body;
  db.run(
    'INSERT INTO chinese_scores (score) VALUES (?)',
    [score],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id: this.lastID });
    }
  );
});

app.get('/api/chinese-scores', (req, res) => {
  db.all('SELECT * FROM chinese_scores ORDER BY score DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json(rows);
  });
});

// 获取语文游戏统计
app.get('/api/chinese-scores/stats', (req, res) => {
  db.get(
    'SELECT MAX(score) as high_score, COUNT(*) as games_played FROM chinese_scores',
    [],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(200).json(row || { high_score: 0, games_played: 0 });
    }
  );
});

// --- 引入路由 ---
const authRoutes = require('./routes/auth');
const mathRoutes = require('./routes/math');
const englishRoutes = require('./routes/english');
const chineseRoutes = require('./routes/chinese'); // 引入 chinese 路由

// --- 挂载路由 ---
app.use('/api/auth', authRoutes);
app.use('/api/math', mathRoutes);
app.use('/api/english', englishRoutes);
app.use('/api/chinese', chineseRoutes); // 挂载 chinese 路由

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// --- 确保静态文件服务和通配符路由在 API 路由之后，且通配符在最后 ---
// 静态文件服务 (服务 /public 目录，如果需要的话保持)
app.use(express.static(path.join(__dirname, 'public')));

// 静态文件服务 (服务构建后的前端)
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// 对于任何未捕获的路由，返回前端应用
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});
// --- 顺序调整结束 ---

// 启动服务器
app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});

// 优雅关闭
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Database connection closed.');
    process.exit(0);
  });
}); 