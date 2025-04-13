const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { CozeAPI } = require('@coze/api');

// 配置 Coze API
const apiClient = new CozeAPI({
  token: 'pat_xxxx_your_tokens',
  baseURL: 'https://api.coze.cn',
});

// 下载文件函数
async function downloadFile(url, filePath) {
  const response = await axios({
    method: 'GET',
    url: url,
    responseType: 'stream',
  });
  const writer = fs.createWriteStream(filePath);
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

// 主函数
async function generateNurseryRhymes(inputString) {
  for (const char of inputString) {
    try {
      // 调用 Coze API 工作流（非流式接口）
      const res = await apiClient.workflows.runs.create({
        workflow_id: '7492446143361859618',
        parameters: {
          input: char,
        },
      });

      console.log('API 返回数据:', res); // 调试日志

      if (!res || !res.data) {
        throw new Error('API 返回数据无效');
      }

      // 解析返回的 JSON 数据
      const data = JSON.parse(res.data);
      const { song, text, word } = data;

      // 创建以当前字符命名的文件夹
      const dirPath = path.join(__dirname, char);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath);
      }

      // 下载并保存文件
      await downloadFile(song, path.join(dirPath, 'song.mp3'));
      fs.writeFileSync(path.join(dirPath, 'text.txt'), text);
      await downloadFile(word, path.join(dirPath, 'word.mp3'));

      console.log(`已为字符 "${char}" 生成文件。`);
    } catch (error) {
      console.error(`处理字符 "${char}" 时出错:`, error.message);
    }
  }
}

// 从命令行参数获取输入字符串
const inputString = process.argv[2];
if (!inputString) {
  console.error('请提供一个中文字符串作为输入参数。');
  process.exit(1);
}

generateNurseryRhymes(inputString);
