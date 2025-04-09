const express = require('express');
const router = express.Router();
const db = require('../database/initDb');
const authenticateToken = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- 文件上传设置 (Multer) ---
// 定义上传文件的存储目录 (确保这些目录存在或在启动时创建)
const uploadDir = path.resolve(__dirname, '../public/uploads');
const imageDir = path.join(uploadDir, 'english/images');
const audioDir = path.join(uploadDir, 'english/audio');

// 确保目录存在
fs.mkdirSync(imageDir, { recursive: true });
fs.mkdirSync(audioDir, { recursive: true });

// Multer 存储配置
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 根据文件类型决定存储目录
    if (file.fieldname === 'image') {
      cb(null, imageDir);
    } else if (file.fieldname === 'audio') {
      cb(null, audioDir);
    } else {
      cb(new Error('Invalid file fieldname'), null);
    }
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名：时间戳-原始文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// 文件类型过滤 (可选，只允许图片和音频)
const fileFilter = (req, file, cb) => {
    if ((file.fieldname === 'image' && file.mimetype.startsWith('image/')) || 
        (file.fieldname === 'audio' && file.mimetype.startsWith('audio/'))) {
        cb(null, true);
    } else {
        cb(new Error('不支持的文件类型!'), false);
    }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });
// ------------------------------

// GET /api/english/words - 获取所有单词 (移除认证)
router.get('/words', /* authenticateToken, */ async (req, res) => {
  const sql = `SELECT * FROM english_words ORDER BY word ASC`;
  db.all(sql, [], (err, words) => {
    if (err) {
      console.error('DB Error fetching english words:', err.message);
      return res.status(500).json({ message: '获取英语单词列表失败' });
    }
    // 格式化路径，使其成为可访问的 URL (假设 /public 是静态服务目录)
    const formattedWords = words.map(w => ({
        ...w,
        image_url: w.image_path ? `/uploads/english/images/${w.image_path}` : null,
        audio_url: w.audio_path ? `/uploads/english/audio/${w.audio_path}` : null
    }));
    res.json(formattedWords);
  });
});

// POST /api/english/words - 添加新单词 (需要认证)
router.post('/words', 
    authenticateToken, 
    // 使用 multer 处理 image 和 audio 字段的文件上传
    upload.fields([{ name: 'image', maxCount: 1 }, { name: 'audio', maxCount: 1 }]), 
    (req, res) => {
        const { word } = req.body;
        const imageFile = req.files && req.files['image'] ? req.files['image'][0] : null;
        const audioFile = req.files && req.files['audio'] ? req.files['audio'][0] : null;

        if (!word) {
            return res.status(400).json({ message: '单词不能为空' });
        }

        // --- 修改：只存储文件名到数据库 ---
        const imageFilename = imageFile ? path.basename(imageFile.path) : null;
        const audioFilename = audioFile ? path.basename(audioFile.path) : null;
        // 获取文件的绝对路径，用于可能的错误处理删除
        const imageAbsPath = imageFile ? imageFile.path : null;
        const audioAbsPath = audioFile ? audioFile.path : null;

        const sql = `INSERT INTO english_words (word, image_path, audio_path) VALUES (?, ?, ?)`;
        // 存入数据库的是文件名
        db.run(sql, [word, imageFilename, audioFilename], function(err) {
            if (err) {
                console.error('DB Error inserting english word:', err.message);
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ message: `单词 "${word}" 已存在` });
                }
                // 出错时需要删除已上传的文件 (使用绝对路径)
                if(imageAbsPath) fs.unlink(imageAbsPath, (e) => e && console.error("Error deleting uploaded image:", e));
                if(audioAbsPath) fs.unlink(audioAbsPath, (e) => e && console.error("Error deleting uploaded audio:", e));
                return res.status(500).json({ message: '添加单词失败' });
            }
            console.log(`English word "${word}" added with ID: ${this.lastID}, image: ${imageFilename}, audio: ${audioFilename}`);
            // 返回给前端的是构造好的 URL
            res.status(201).json({ 
                message: '单词添加成功', 
                id: this.lastID, 
                word: word,
                image_url: imageFilename ? `/uploads/english/images/${imageFilename}` : null,
                audio_url: audioFilename ? `/uploads/english/audio/${audioFilename}` : null
            });
        });
    }
);

// PUT /api/english/words/:id - 更新单词 (需要认证)
// 注意：文件更新通常更复杂。这里简化为：如果提供了新文件，则替换旧文件。
router.put('/words/:id', 
    authenticateToken, 
    upload.fields([{ name: 'image', maxCount: 1 }, { name: 'audio', maxCount: 1 }]), 
    async (req, res) => {
        const { id } = req.params;
        const { word } = req.body;
        const imageFile = req.files && req.files['image'] ? req.files['image'][0] : null;
        const audioFile = req.files && req.files['audio'] ? req.files['audio'][0] : null;

        if (!word) {
            return res.status(400).json({ message: '单词不能为空' });
        }

        // 1. 获取旧记录以查找旧文件路径
        const getOldSql = `SELECT image_path, audio_path FROM english_words WHERE id = ?`;
        let oldPaths = {};
        try {
            oldPaths = await new Promise((resolve, reject) => {
                db.get(getOldSql, [id], (err, row) => {
                    if (err) reject(err);
                    else if (!row) reject(new Error('Word not found'));
                    else resolve(row);
                });
            });
        } catch (err) {
             console.error('Error fetching old word paths:', err.message);
             // 如果没找到记录，也删除可能已上传的新文件
             if(imageFile) fs.unlink(imageFile.path, (e) => e && console.error("Error deleting new image:", e));
             if(audioFile) fs.unlink(audioFile.path, (e) => e && console.error("Error deleting new audio:", e));
             return res.status(err.message === 'Word not found' ? 404 : 500).json({ message: err.message === 'Word not found' ? '未找到要更新的单词' : '更新单词失败' });
        }

        // 2. 准备更新数据
        // --- 修改：处理文件名而不是绝对路径 ---
        const newImageFilename = imageFile ? path.basename(imageFile.path) : oldPaths.image_path;
        const newAudioFilename = audioFile ? path.basename(audioFile.path) : oldPaths.audio_path;
        // 获取新上传文件的绝对路径（用于错误处理时删除）
        const newImageAbsPath = imageFile ? imageFile.path : null;
        const newAudioAbsPath = audioFile ? audioFile.path : null;
        // 获取旧文件的绝对路径（用于更新成功后删除）
        // !!! 修改：确保只使用文件名来构建路径 !!!
        const oldImageFilename = oldPaths.image_path ? path.basename(oldPaths.image_path) : null;
        const oldAudioFilename = oldPaths.audio_path ? path.basename(oldPaths.audio_path) : null;
        const oldImageAbsPath = oldImageFilename ? path.join(imageDir, oldImageFilename) : null; // 使用提取的文件名重建旧绝对路径
        const oldAudioAbsPath = oldAudioFilename ? path.join(audioDir, oldAudioFilename) : null; // 使用提取的文件名重建旧绝对路径

        // 3. 更新数据库 (存入文件名)
        const updateSql = `UPDATE english_words SET word = ?, image_path = ?, audio_path = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        db.run(updateSql, [word, newImageFilename, newAudioFilename, id], function(err) {
            if (err) {
                console.error('DB Error updating english word:', err.message);
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ message: `单词 "${word}" 已存在` });
                }
                // 更新失败，删除新上传的文件 (使用绝对路径)
                if(newImageAbsPath) fs.unlink(newImageAbsPath, (e) => e && console.error("Error deleting new image:", e));
                if(newAudioAbsPath) fs.unlink(newAudioAbsPath, (e) => e && console.error("Error deleting new audio:", e));
                return res.status(500).json({ message: '更新单词失败' });
            }

            // 4. 如果更新成功且上传了新文件，删除旧文件
            if (this.changes > 0) {
                console.log(`English word ID: ${id} updated. Checking old files to delete...`);
                if (imageFile && oldImageAbsPath && oldImageAbsPath !== newImageAbsPath) {
                    console.log(`Deleting old image: ${oldImageAbsPath}`);
                    fs.unlink(oldImageAbsPath, (e) => e && console.error("Error deleting old image:", e));
                }
                if (audioFile && oldAudioAbsPath && oldAudioAbsPath !== newAudioAbsPath) {
                    console.log(`Deleting old audio: ${oldAudioAbsPath}`);
                    fs.unlink(oldAudioAbsPath, (e) => e && console.error("Error deleting old audio:", e));
                }
                // 返回给前端的是构造好的 URL
                res.json({ 
                    message: '单词更新成功',
                    id: parseInt(id),
                    word: word,
                    image_url: newImageFilename ? `/uploads/english/images/${newImageFilename}` : null,
                    audio_url: newAudioFilename ? `/uploads/english/audio/${newAudioFilename}` : null
                 });
            } else {
                 // 可能因为 ID 不存在导致未更新
                 res.status(404).json({ message: '未找到要更新的单词' });
            }
        });
    }
);

// DELETE /api/english/words/:id - 删除单词 (需要认证)
router.delete('/words/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    // 1. 获取旧记录以查找文件路径
     const getOldSql = `SELECT image_path, audio_path FROM english_words WHERE id = ?`;
     let oldPaths = {};
     try {
         oldPaths = await new Promise((resolve, reject) => {
             db.get(getOldSql, [id], (err, row) => {
                 if (err) reject(err);
                 else if (!row) reject(new Error('Word not found'));
                 else resolve(row);
             });
         });
     } catch (err) {
          console.error('Error fetching word paths for delete:', err.message);
          return res.status(err.message === 'Word not found' ? 404 : 500).json({ message: err.message === 'Word not found' ? '未找到要删除的单词' : '删除单词失败' });
     }

    // 2. 删除数据库记录
    const deleteSql = `DELETE FROM english_words WHERE id = ?`;
    db.run(deleteSql, [id], function(err) {
        if (err) {
            console.error('DB Error deleting english word:', err.message);
            return res.status(500).json({ message: '删除单词失败' });
        }

        // 3. 如果删除成功，删除关联的文件
        if (this.changes > 0) {
            // --- 修改：根据文件名重建绝对路径来删除 ---
            if (oldPaths.image_path) {
                const oldImageAbsPath = path.join(imageDir, oldPaths.image_path);
                console.log(`Deleting image file: ${oldImageAbsPath}`);
                fs.unlink(oldImageAbsPath, (e) => e && console.error("Error deleting image file:", e));
            }
            if (oldPaths.audio_path) {
                const oldAudioAbsPath = path.join(audioDir, oldPaths.audio_path);
                console.log(`Deleting audio file: ${oldAudioAbsPath}`);
                fs.unlink(oldAudioAbsPath, (e) => e && console.error("Error deleting audio file:", e));
            }
            console.log(`English word ID: ${id} deleted.`);
            res.json({ message: '单词删除成功' });
        } else {
            res.status(404).json({ message: '未找到要删除的单词' });
        }
    });
});

// --- 英语关卡难度设置 API ---

// GET /api/english/levels - 获取所有英语关卡设置 (移除认证)
router.get('/levels', /* authenticateToken, */ (req, res) => {
  db.all('SELECT * FROM english_levels ORDER BY level ASC', [], (err, levels) => {
    if (err) {
      console.error('DB Error fetching english levels:', err.message);
      return res.status(500).json({ message: '获取英语关卡难度列表失败' });
    }
    res.json(levels);
  });
});

// PUT /api/english/levels/:level - 更新指定英语关卡的难度 (临时移除认证)
router.put('/levels/:level', /* authenticateToken, */ (req, res) => { // 暂时注释掉认证
  const { level } = req.params;
  const { zombie_speed, raccoon_step_base } = req.body;

  // 简单验证输入
  if (zombie_speed === undefined || raccoon_step_base === undefined) {
    return res.status(400).json({ message: '缺少必要的难度参数 (zombie_speed, raccoon_step_base)' });
  }
  const speed = parseFloat(zombie_speed);
  const step = parseFloat(raccoon_step_base);
  if (isNaN(speed) || isNaN(step) || speed < 0 || step < 0) {
      return res.status(400).json({ message: '无效的难度参数值' });
  }

  const sql = `UPDATE english_levels SET zombie_speed = ?, raccoon_step_base = ? WHERE level = ?`;
  db.run(sql, [speed, step, level], function(err) {
    if (err) {
      console.error('DB Error updating english level:', err.message);
      return res.status(500).json({ message: '更新英语关卡难度失败' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: '未找到要更新的英语关卡' });
    }
    console.log(`English level ${level} difficulty updated.`);
    res.json({ message: `英语关卡 ${level} 难度更新成功`, level: parseInt(level), zombie_speed: speed, raccoon_step_base: step });
  });
});

module.exports = router; 