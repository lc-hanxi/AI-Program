const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database/initDb'); // 引入数据库连接

const router = express.Router();

// --- Multer 配置 (参考 english.js) ---
// 使用 path.resolve 获取绝对路径
const uploadBaseDir = path.resolve(__dirname, '../public/uploads/chinese');
const imageUploadDir = path.join(uploadBaseDir, 'images');
const poemAudioUploadDir = path.join(uploadBaseDir, 'poem_audio');
const charAudioUploadDir = path.join(uploadBaseDir, 'char_audio');

fs.mkdirSync(imageUploadDir, { recursive: true });
fs.mkdirSync(poemAudioUploadDir, { recursive: true });
fs.mkdirSync(charAudioUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 根据字段名确定目录 (使用绝对路径)
    if (file.fieldname === 'image') {
      cb(null, imageUploadDir);
    } else if (file.fieldname === 'poem_audio') {
      cb(null, poemAudioUploadDir);
    } else if (file.fieldname === 'char_audio') {
      cb(null, charAudioUploadDir);
    } else {
      cb(new Error('Invalid file fieldname'), null);
    }
  },
  filename: function (req, file, cb) {
    // 使用 汉字_字段_时间戳.扩展名 (保持不变，但存储的是绝对路径)
    const char = req.body.character || 'unknown';
    const safeChar = Buffer.from(char).toString('hex');
    const fieldName = file.fieldname;
    cb(null, `${safeChar}_${fieldName}_${Date.now()}${path.extname(file.originalname)}`);
  }
});

// 可选：添加文件过滤器 (参考 english.js)
const fileFilter = (req, file, cb) => {
    if ((file.fieldname === 'image' && file.mimetype.startsWith('image/')) ||
        ((file.fieldname === 'poem_audio' || file.fieldname === 'char_audio') && file.mimetype.startsWith('audio/'))) {
        cb(null, true);
    } else {
        cb(new Error('不支持的文件类型!'), false);
    }
};

const upload = multer({ storage: storage, fileFilter: fileFilter }); // 添加过滤器
const uploadFields = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'poem_audio', maxCount: 1 },
    { name: 'char_audio', maxCount: 1 }
]);

// --- 辅助函数：删除文件 (修改: 操作绝对路径) ---
const deleteFileByAbsPath = (absolutePath) => {
  if (absolutePath) {
    fs.unlink(absolutePath, (err) => {
      // ENOENT: 文件不存在，无需报错
      if (err && err.code !== 'ENOENT') {
        console.error(`Error deleting file ${absolutePath}:`, err);
      }
    });
  }
};

// --- API 路由 (使用绝对路径和参考 english.js 逻辑) ---

// GET /api/chinese/chars
router.get('/chars', (req, res) => {
  db.all('SELECT id, character, poem_or_song, image_path, poem_audio_path, char_audio_path FROM chinese_characters ORDER BY id DESC', [], (err, rows) => {
    if (err) {
      console.error('Error fetching chinese characters:', err.message);
      return res.status(500).json({ error: '数据库错误，无法获取汉字列表' });
    }
    // 格式化 URL (添加 null/string 检查)
    const charsWithUrls = rows.map(char => {
      const imageUrl = (char.image_path && typeof char.image_path === 'string')
                       ? `/uploads/chinese/images/${path.basename(char.image_path)}`
                       : null;
      const poemAudioUrl = (char.poem_audio_path && typeof char.poem_audio_path === 'string')
                           ? `/uploads/chinese/poem_audio/${path.basename(char.poem_audio_path)}`
                           : null;
      const charAudioUrl = (char.char_audio_path && typeof char.char_audio_path === 'string')
                           ? `/uploads/chinese/char_audio/${path.basename(char.char_audio_path)}`
                           : null;
      return {
          ...char,
          image_url: imageUrl,
          poem_audio_url: poemAudioUrl,
          char_audio_url: charAudioUrl
      };
    });
    res.status(200).json(charsWithUrls);
  });
});

// POST /api/chinese/chars (使用绝对路径, 修正 unlink)
router.post('/chars', uploadFields, (req, res) => {
  const { character, poem_or_song } = req.body;
  // 获取 multer 保存的绝对路径
  const imageAbsPath = req.files && req.files['image'] ? req.files['image'][0].path : null;
  const poemAudioAbsPath = req.files && req.files['poem_audio'] ? req.files['poem_audio'][0].path : null;
  const charAudioAbsPath = req.files && req.files['char_audio'] ? req.files['char_audio'][0].path : null;

  // 辅助函数删除临时文件 (操作绝对路径)
  const deleteTempFiles = () => {
      deleteFileByAbsPath(imageAbsPath);
      deleteFileByAbsPath(poemAudioAbsPath);
      deleteFileByAbsPath(charAudioAbsPath);
  };

  if (!character) {
    deleteTempFiles();
    return res.status(400).json({ error: '汉字不能为空' });
  }

  // 移除路径中的 replace 调用，直接使用绝对路径

  // 数据库 INSERT (存储绝对路径)
  db.run(
    'INSERT INTO chinese_characters (character, poem_or_song, image_path, poem_audio_path, char_audio_path) VALUES (?, ?, ?, ?, ?)',
    [character, poem_or_song || null, imageAbsPath, poemAudioAbsPath, charAudioAbsPath],
    function(err) {
      if (err) {
        console.error('Error inserting chinese character:', err.message);
        // 数据库插入失败，删除已保存的 *绝对路径* 文件
        deleteTempFiles(); // 使用辅助函数
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: `汉字 "${character}" 已存在` });
        }
        return res.status(500).json({ error: '数据库错误，无法添加汉字' });
      }
      // 返回数据 (生成 URL)
      res.status(201).json({
        id: this.lastID,
        character,
        poem_or_song,
        image_url: imageAbsPath ? `/uploads/chinese/images/${path.basename(imageAbsPath)}` : null,
        poem_audio_url: poemAudioAbsPath ? `/uploads/chinese/poem_audio/${path.basename(poemAudioAbsPath)}` : null,
        char_audio_url: charAudioAbsPath ? `/uploads/chinese/char_audio/${path.basename(charAudioAbsPath)}` : null,
        // 可以选择不返回绝对路径给前端
        // image_path: imageAbsPath,
        // poem_audio_path: poemAudioAbsPath,
        // char_audio_path: charAudioAbsPath,
      });
    }
  );
});

// PUT /api/chinese/chars/:id (使用绝对路径, 参考 english.js 结构, 修正 unlink)
router.put('/chars/:id', uploadFields, async (req, res) => { // 添加 async
  const { id } = req.params;
  const { character, poem_or_song } = req.body;
  // 新上传文件的绝对路径
  const newImageAbsPath = req.files && req.files['image'] ? req.files['image'][0].path : null;
  const newPoemAudioAbsPath = req.files && req.files['poem_audio'] ? req.files['poem_audio'][0].path : null;
  const newCharAudioAbsPath = req.files && req.files['char_audio'] ? req.files['char_audio'][0].path : null;

  // 辅助函数删除新上传的临时文件
  const deleteNewTempFiles = () => {
      deleteFileByAbsPath(newImageAbsPath);
      deleteFileByAbsPath(newPoemAudioAbsPath);
      deleteFileByAbsPath(newCharAudioAbsPath);
  };

  if (!character) {
    deleteNewTempFiles();
    return res.status(400).json({ error: '汉字不能为空' });
  }

  // 1. 获取旧记录以查找旧文件的绝对路径 (使用 Promise 包装 db.get)
  const getOldSql = 'SELECT image_path, poem_audio_path, char_audio_path FROM chinese_characters WHERE id = ?';
  let oldPaths = {};
  try {
    oldPaths = await new Promise((resolve, reject) => {
      db.get(getOldSql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else if (!row) {
          reject(new Error('Character not found')); // 自定义错误
        } else {
          // row 包含 image_path, poem_audio_path, char_audio_path (绝对路径)
          resolve(row);
        }
      });
    });
  } catch (err) {
    console.error('Error fetching old character paths:', err.message);
    deleteNewTempFiles(); // 获取旧数据失败，删除新文件
    const isNotFound = err.message === 'Character not found';
    return res.status(isNotFound ? 404 : 500)
              .json({ error: isNotFound ? '未找到要更新的汉字' : '获取旧数据时出错' });
  }

  // 2. 确定最终要保存的绝对路径
  const finalImageAbsPath = newImageAbsPath || oldPaths.image_path;
  const finalPoemAudioAbsPath = newPoemAudioAbsPath || oldPaths.poem_audio_path;
  const finalCharAudioAbsPath = newCharAudioAbsPath || oldPaths.char_audio_path;

  // 3. 更新数据库 (存储绝对路径)
  const updateSql = 'UPDATE chinese_characters SET character = ?, poem_or_song = ?, image_path = ?, poem_audio_path = ?, char_audio_path = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
  db.run(updateSql, [
      character,
      poem_or_song || null,
      finalImageAbsPath,
      finalPoemAudioAbsPath,
      finalCharAudioAbsPath,
      id
    ],
    function(err) {
      if (err) {
        console.error('Error updating chinese character:', err.message);
        // 更新失败，删除新上传的文件 (如果它们和旧文件不同)
        if (newImageAbsPath && newImageAbsPath !== oldPaths.image_path) deleteFileByAbsPath(newImageAbsPath);
        if (newPoemAudioAbsPath && newPoemAudioAbsPath !== oldPaths.poem_audio_path) deleteFileByAbsPath(newPoemAudioAbsPath);
        if (newCharAudioAbsPath && newCharAudioAbsPath !== oldPaths.char_audio_path) deleteFileByAbsPath(newCharAudioAbsPath);

        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({ error: `汉字 "${character}" 已存在` });
        }
        return res.status(500).json({ error: '数据库错误，无法更新汉字' });
      }

      if (this.changes === 0) {
        // ID 不存在 (理论上应该在上面 catch 捕获，但作为保险)
        deleteNewTempFiles();
        return res.status(404).json({ error: '未找到要更新的汉字 (更新影响行数为0)' });
      }

      // 4. 更新成功，删除被替换的旧文件 (操作绝对路径)
      if (newImageAbsPath && oldPaths.image_path && oldPaths.image_path !== finalImageAbsPath) {
        deleteFileByAbsPath(oldPaths.image_path);
      }
      if (newPoemAudioAbsPath && oldPaths.poem_audio_path && oldPaths.poem_audio_path !== finalPoemAudioAbsPath) {
        deleteFileByAbsPath(oldPaths.poem_audio_path);
      }
      if (newCharAudioAbsPath && oldPaths.char_audio_path && oldPaths.char_audio_path !== finalCharAudioAbsPath) {
        deleteFileByAbsPath(oldPaths.char_audio_path);
      }

      // 返回成功信息和新数据 (生成 URL)
      const finalImageFilename = finalImageAbsPath ? path.basename(finalImageAbsPath) : null;
      const finalPoemAudioFilename = finalPoemAudioAbsPath ? path.basename(finalPoemAudioAbsPath) : null;
      const finalCharAudioFilename = finalCharAudioAbsPath ? path.basename(finalCharAudioAbsPath) : null;

      res.status(200).json({
        id: Number(id),
        character,
        poem_or_song,
        image_url: finalImageFilename ? `/uploads/chinese/images/${finalImageFilename}` : null,
        poem_audio_url: finalPoemAudioFilename ? `/uploads/chinese/poem_audio/${finalPoemAudioFilename}` : null,
        char_audio_url: finalCharAudioFilename ? `/uploads/chinese/char_audio/${finalCharAudioFilename}` : null
      });
    }
  );
});

// DELETE /api/chinese/chars/:id (使用绝对路径, 参考 english.js 结构, 修正 unlink)
router.delete('/chars/:id', async (req, res) => { // 添加 async
  const { id } = req.params;

  // 1. 获取旧记录以查找旧文件的绝对路径 (使用 Promise 包装)
  const getOldSql = 'SELECT image_path, poem_audio_path, char_audio_path FROM chinese_characters WHERE id = ?';
  let oldPaths = {};
  try {
    oldPaths = await new Promise((resolve, reject) => {
      db.get(getOldSql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else if (!row) {
          reject(new Error('Character not found'));
        } else {
          resolve(row);
        }
      });
    });
  } catch (err) {
    console.error('Error fetching old character paths for delete:', err.message);
    const isNotFound = err.message === 'Character not found';
    return res.status(isNotFound ? 404 : 500)
              .json({ error: isNotFound ? '未找到要删除的汉字' : '获取旧数据时出错' });
  }

  // 2. 删除数据库记录
  const deleteSql = 'DELETE FROM chinese_characters WHERE id = ?';
  db.run(deleteSql, [id], function(err) {
    if (err) {
      console.error('Error deleting chinese character:', err.message);
      return res.status(500).json({ error: '数据库错误，无法删除汉字' });
    }

    if (this.changes === 0) {
      // ID 不存在
      return res.status(404).json({ error: '未找到要删除的汉字 (影响行数为0)' });
    }

    // 3. 数据库删除成功，删除关联的文件 (操作绝对路径)
    deleteFileByAbsPath(oldPaths.image_path);
    deleteFileByAbsPath(oldPaths.poem_audio_path);
    deleteFileByAbsPath(oldPaths.char_audio_path);

    res.status(200).json({ message: '汉字删除成功' });
  });
});

// --- 语文关卡难度设置 API ---

// GET /api/chinese/levels
router.get('/levels', (req, res) => {
  db.all('SELECT * FROM chinese_levels ORDER BY level ASC', [], (err, levels) => {
    if (err) {
      console.error('DB Error fetching chinese levels:', err.message);
      return res.status(500).json({ message: '获取语文关卡难度列表失败' });
    }
    res.json(levels);
  });
});

// PUT /api/chinese/levels/:level
router.put('/levels/:level', (req, res) => {
  const { level } = req.params;
  const { balloon_speed, balloons_per_wave } = req.body;

  if (balloon_speed === undefined || balloons_per_wave === undefined) {
    return res.status(400).json({ message: '缺少必要的难度参数' });
  }
  const speed = parseFloat(balloon_speed);
  const balloons = parseInt(balloons_per_wave, 10);
  if (isNaN(speed) || isNaN(balloons) || speed <= 0 || balloons <= 0) {
      return res.status(400).json({ message: '无效的难度参数值' });
  }

  const sql = `UPDATE chinese_levels SET balloon_speed = ?, balloons_per_wave = ? WHERE level = ?`;
  db.run(sql, [speed, balloons, level], function(err) {
    if (err) {
      console.error('DB Error updating chinese level:', err.message);
      return res.status(500).json({ message: '更新语文关卡难度失败' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: '未找到要更新的语文关卡' });
    }
    res.json({ message: `语文关卡 ${level} 难度更新成功`, level: parseInt(level), balloon_speed: speed, balloons_per_wave: balloons });
  });
});

module.exports = router; 