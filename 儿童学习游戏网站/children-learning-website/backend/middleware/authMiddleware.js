const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-very-secure-secret-key'; // 确保与 auth.js 中的一致

const authenticateToken = (req, res, next) => {
  // 从请求头中获取 token
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) {
    // 如果没有 token，返回 401 未授权
    return res.status(401).json({ message: '未提供认证令牌' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      // 如果 token 无效或已过期，返回 403 禁止访问
      console.log('JWT Verification Error:', err.message);
      return res.status(403).json({ message: '无效或过期的令牌' });
    }
    // 如果 token 有效，将解码后的用户信息附加到请求对象上
    req.user = user;
    next(); // 继续处理请求
  });
};

module.exports = authenticateToken; 