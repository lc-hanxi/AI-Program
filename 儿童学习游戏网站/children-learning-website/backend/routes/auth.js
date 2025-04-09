const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../database/initDb'); // 调整路径

// 假设你设置了一个 JWT 密钥在环境变量中，或者直接定义一个
const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secure-secret-key'; // !! 请务必使用更安全的密钥并存储在环境变量中

// MD5 哈希函数 (与 initDb.js 中的保持一致)
function md5(text) {
  return crypto.createHash('md5').update(text).digest('hex');
}

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: '用户名和密码不能为空' });
  }

  const passwordHash = md5(password);
  const sql = `SELECT id, username FROM admin_users WHERE username = ? AND password_hash = ?`;

  db.get(sql, [username, passwordHash], (err, user) => {
    if (err) {
      console.error('DB Error', err.message);
      return res.status(500).json({ message: '服务器错误' });
    }

    if (user) {
      // 用户验证成功，生成 JWT
      const payload = { userId: user.id, username: user.username };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }); // 设置 token 有效期，例如 1 小时

      console.log(`Admin user "${username}" logged in successfully.`);
      res.json({ message: '登录成功', token: token });

    } else {
      // 用户名或密码错误
      console.log(`Login failed for user "${username}". Invalid credentials.`);
      res.status(401).json({ message: '用户名或密码无效' });
    }
  });
});

module.exports = router; 