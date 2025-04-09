const express = require('express');
const router = express.Router();
const db = require('../database/initDb');
const authenticateToken = require('../middleware/authMiddleware'); // 引入认证中间件

// GET /api/math/levels - 获取所有关卡设置 (移除认证)
router.get('/levels', /* authenticateToken, */ (req, res) => {
  const sql = `SELECT * FROM math_levels ORDER BY level_number ASC`;
  db.all(sql, [], (err, levels) => {
    if (err) {
      console.error('DB Error fetching math levels:', err.message);
      return res.status(500).json({ message: '获取数学关卡设置失败' });
    }
    // 将 is_boss_level 从 0/1 转换为 boolean
    const formattedLevels = levels.map(level => ({
        ...level,
        is_boss_level: Boolean(level.is_boss_level)
    }));
    res.json(formattedLevels);
  });
});

// PUT /api/math/levels - 更新所有关卡设置 (需要认证)
router.put('/levels', authenticateToken, (req, res) => {
  const levelsData = req.body;

  if (!Array.isArray(levelsData) || levelsData.length === 0) {
    return res.status(400).json({ message: '无效的关卡数据' });
  }

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    let errorOccurred = false;
    const updateStmt = db.prepare(
      `UPDATE math_levels SET 
         max_number = ?,
         duration_seconds = ?,
         updated_at = CURRENT_TIMESTAMP 
       WHERE level_number = ?`
    );

    levelsData.forEach(level => {
      if (errorOccurred) return; 

      if (typeof level.level_number !== 'number' || 
          typeof level.max_number !== 'number' || 
          typeof level.duration_seconds !== 'number') {
          console.error('Invalid data format for level:', level);
          errorOccurred = true;
          return; 
      }
      
      updateStmt.run(
        level.max_number,
        level.duration_seconds,
        level.level_number,
        (err) => {
          if (err) {
            console.error(`Error updating math level ${level.level_number}:`, err.message);
            errorOccurred = true;
          }
        }
      );
    });

    updateStmt.finalize((finalizeErr) => {
        if (finalizeErr) {
            console.error('Error finalizing statement:', finalizeErr.message);
            errorOccurred = true; 
        }
        if (errorOccurred) {
          db.run("ROLLBACK", rollbackErr => {
             if (rollbackErr) console.error('Error rolling back:', rollbackErr.message);
             res.status(500).json({ message: '更新数学关卡设置失败' });
          });
        } else {
          db.run("COMMIT", commitErr => {
            if (commitErr) {
              console.error('Error committing:', commitErr.message);
              res.status(500).json({ message: '更新数学关卡设置失败' });
            } else {
              console.log('Math levels (max_number, duration) updated successfully.');
              res.json({ message: '数学关卡设置已保存' });
            }
          });
        }
    });
  });
});

module.exports = router; 