document.addEventListener('DOMContentLoaded', function() {
  // 获取DOM元素
  const translateTab = document.getElementById('translateTab');
  const summaryTab = document.getElementById('summaryTab');
  const translatePanel = document.getElementById('translatePanel');
  const summaryPanel = document.getElementById('summaryPanel');
  const originalText = document.getElementById('originalText');
  const translatedText = document.getElementById('translatedText');
  const summaryText = document.getElementById('summaryText');
  const translateBtn = document.getElementById('translateBtn');
  const summarizeBtn = document.getElementById('summarizeBtn');
  const copyTranslateBtn = document.getElementById('copyTranslateBtn');
  const copySummaryBtn = document.getElementById('copySummaryBtn');
  const regenerateBtn = document.getElementById('regenerateBtn');
  const shortSummary = document.getElementById('shortSummary');
  const mediumSummary = document.getElementById('mediumSummary');
  const longSummary = document.getElementById('longSummary');
  const apiKeyInput = document.getElementById('apiKey');
  const saveApiKeyBtn = document.getElementById('saveApiKey');
  const statusDiv = document.getElementById('status');
  const translateDirection = document.getElementById('translateDirection');

  // 初始化变量
  let summaryLength = 'short'; // 默认总结长度
  let selectedText = '';
  let currentTabId = null;
  let currentTabUrl = '';
  let currentTabTitle = '';
  let isPopupMode = window.location.href.includes('chrome-extension://');

  // 从存储中获取API密钥
  chrome.storage.sync.get(['deepseekApiKey'], function(result) {
    if (result.deepseekApiKey) {
      apiKeyInput.value = result.deepseekApiKey;
    }
  });

  // 检查URL哈希，如果是#summary则切换到总结标签
  if (window.location.hash === '#summary') {
    switchToSummaryTab();
  }

  // 获取当前标签页信息
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, function(tabs) {
    if (tabs && tabs.length > 0) {
      currentTabId = tabs[0].id;
      currentTabUrl = tabs[0].url;
      currentTabTitle = tabs[0].title;
    }
  });

  // 标签页切换
  translateTab.addEventListener('click', function() {
    switchToTranslateTab();
  });

  summaryTab.addEventListener('click', function() {
    switchToSummaryTab();
  });

  function switchToTranslateTab() {
    translateTab.classList.add('active');
    summaryTab.classList.remove('active');
    translatePanel.classList.add('active');
    summaryPanel.classList.remove('active');
  }

  function switchToSummaryTab() {
    summaryTab.classList.add('active');
    translateTab.classList.remove('active');
    summaryPanel.classList.add('active');
    translatePanel.classList.remove('active');
  }

  // 总结长度选择
  shortSummary.addEventListener('click', function() {
    setActiveSummaryLength(shortSummary);
    summaryLength = 'short';
  });

  mediumSummary.addEventListener('click', function() {
    setActiveSummaryLength(mediumSummary);
    summaryLength = 'medium';
  });

  longSummary.addEventListener('click', function() {
    setActiveSummaryLength(longSummary);
    summaryLength = 'long';
  });

  function setActiveSummaryLength(button) {
    shortSummary.classList.remove('active');
    mediumSummary.classList.remove('active');
    longSummary.classList.remove('active');
    button.classList.add('active');
  }

  // 保存API密钥
  saveApiKeyBtn.addEventListener('click', function() {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
      chrome.storage.sync.set({ deepseekApiKey: apiKey }, function() {
        showStatus('API密钥已保存', 'success');
      });
    } else {
      showStatus('请输入有效的API密钥', 'error');
    }
  });

  // 获取选中的文本
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'getSelectedText') {
      selectedText = request.text;
      originalText.value = selectedText;
    } else if (request.action === 'switchToSummary') {
      switchToSummaryTab();
    }
  });

  // 翻译功能
  translateBtn.addEventListener('click', function() {
    const text = originalText.value.trim();
    if (!text) {
      showStatus('请输入或选择要翻译的文本', 'error');
      return;
    }

    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
      showStatus('请先设置DeepSeek API密钥', 'error');
      return;
    }

    const direction = translateDirection.value;
    translateText(text, apiKey, direction);
  });

  // 页面总结功能
  summarizeBtn.addEventListener('click', function() {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
      showStatus('请先设置DeepSeek API密钥', 'error');
      return;
    }

    showStatus('正在获取页面内容...', 'loading');

    // 获取最近聚焦的窗口中的活动标签页
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, function(tabs) {
      if (tabs && tabs.length > 0) {
        const activeTab = tabs[0];
        
        // 如果当前是弹窗模式，并且活动标签页是扩展自身，则尝试获取原始标签页
        if (isPopupMode && activeTab.url.startsWith('chrome-extension://')) {
          // 获取所有非扩展页面的标签页
          chrome.tabs.query({ currentWindow: false }, function(allTabs) {
            const nonExtensionTabs = allTabs.filter(tab => !tab.url.startsWith('chrome-extension://'));
            if (nonExtensionTabs.length > 0) {
              // 使用第一个非扩展页面的标签页
              processTabForSummary(nonExtensionTabs[0], apiKey);
            } else {
              showStatus('未找到可总结的网页，请先打开一个网页', 'error');
            }
          });
        } else {
          processTabForSummary(activeTab, apiKey);
        }
      } else {
        showStatus('无法获取当前标签页', 'error');
      }
    });
  });

  // 处理标签页总结
  function processTabForSummary(tab, apiKey) {
    currentTabId = tab.id;
    currentTabUrl = tab.url;
    currentTabTitle = tab.title;
    
    // 使用executeScript直接在页面上下文中执行脚本获取内容
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: function() {
        return {
          title: document.title,
          content: document.body.innerText,
          url: window.location.href
        };
      }
    }).then(results => {
      if (results && results[0] && results[0].result) {
        summarizeContent(results[0].result, apiKey);
      } else {
        showStatus('无法获取页面内容', 'error');
        fallbackSummarize(tab, apiKey);
      }
    }).catch(error => {
      console.error('执行脚本错误:', error);
      showStatus('获取页面内容失败: ' + error.message, 'error');
      fallbackSummarize(tab, apiKey);
    });
  }

  // 备用总结方法
  function fallbackSummarize(tab, apiKey) {
    showStatus('尝试备用方法获取页面内容...', 'loading');
    
    // 使用tab的title和url进行总结
    const pageData = {
      title: tab.title,
      content: `这是一个网页，标题为"${tab.title}"，URL为"${tab.url}"。由于技术限制，无法获取完整内容，将基于标题和URL进行总结。`,
      url: tab.url
    };
    
    summarizeContent(pageData, apiKey);
  }

  // 重新生成总结
  regenerateBtn.addEventListener('click', function() {
    summarizeBtn.click();
  });

  // 复制翻译结果
  copyTranslateBtn.addEventListener('click', function() {
    copyToClipboard(translatedText.value);
  });

  // 复制总结结果
  copySummaryBtn.addEventListener('click', function() {
    copyToClipboard(summaryText.value);
  });

  // 翻译文本
  async function translateText(text, apiKey, direction) {
    showStatus('正在翻译...', 'loading');
    translateBtn.disabled = true;

    try {
      // 根据翻译方向设置系统提示词
      let systemPrompt;
      switch (direction) {
        case 'zh2en':
          systemPrompt = '你是一个专业的翻译助手。请将用户提供的中文文本翻译成英文。只返回翻译结果，不要添加任何解释或额外内容。';
          break;
        case 'en2zh':
          systemPrompt = '你是一个专业的翻译助手。请将用户提供的英文文本翻译成中文。只返回翻译结果，不要添加任何解释或额外内容。';
          break;
        default: // auto
          systemPrompt = '你是一个专业的翻译助手。请将用户提供的文本翻译成中文或英文（根据源文本的语言自动判断）。只返回翻译结果，不要添加任何解释或额外内容。';
      }

      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: text
            }
          ],
          temperature: 0.3
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || '翻译请求失败');
      }

      if (data.choices && data.choices[0] && data.choices[0].message) {
        translatedText.value = data.choices[0].message.content.trim();
        showStatus('翻译完成', 'success');
      } else {
        throw new Error('无法获取翻译结果');
      }
    } catch (error) {
      console.error('翻译错误:', error);
      showStatus(`翻译失败: ${error.message}`, 'error');
    } finally {
      translateBtn.disabled = false;
    }
  }

  // 总结页面内容
  async function summarizeContent(pageData, apiKey) {
    showStatus('正在生成总结...', 'loading');
    summarizeBtn.disabled = true;
    regenerateBtn.disabled = true;

    try {
      // 根据选择的总结长度设置提示词
      let summaryPrompt;
      switch (summaryLength) {
        case 'short':
          summaryPrompt = `请对以下网页内容进行简短总结（100字以内）。标题：${pageData.title}，URL：${pageData.url || '未知'}，内容：${pageData.content.substring(0, 10000)}`;
          break;
        case 'medium':
          summaryPrompt = `请对以下网页内容进行中等长度总结（200-300字）。标题：${pageData.title}，URL：${pageData.url || '未知'}，内容：${pageData.content.substring(0, 15000)}`;
          break;
        case 'long':
          summaryPrompt = `请对以下网页内容进行详细总结（500字左右），包括主要观点和关键信息。标题：${pageData.title}，URL：${pageData.url || '未知'}，内容：${pageData.content.substring(0, 20000)}`;
          break;
        default:
          summaryPrompt = `请对以下网页内容进行总结。标题：${pageData.title}，URL：${pageData.url || '未知'}，内容：${pageData.content.substring(0, 10000)}`;
      }

      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: '你是一个专业的内容总结助手。请对用户提供的网页内容进行清晰、准确的总结。'
            },
            {
              role: 'user',
              content: summaryPrompt
            }
          ],
          temperature: 0.3
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || '总结请求失败');
      }

      if (data.choices && data.choices[0] && data.choices[0].message) {
        summaryText.value = data.choices[0].message.content.trim();
        showStatus('总结生成完成', 'success');
      } else {
        throw new Error('无法获取总结结果');
      }
    } catch (error) {
      console.error('总结错误:', error);
      showStatus(`总结失败: ${error.message}`, 'error');
    } finally {
      summarizeBtn.disabled = false;
      regenerateBtn.disabled = false;
    }
  }

  // 复制到剪贴板
  function copyToClipboard(text) {
    if (!text) {
      showStatus('没有可复制的内容', 'error');
      return;
    }

    navigator.clipboard.writeText(text)
      .then(() => {
        showStatus('已复制到剪贴板', 'success');
      })
      .catch(err => {
        console.error('复制失败:', err);
        showStatus('复制失败', 'error');
      });
  }

  // 显示状态信息
  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = 'status';
    statusDiv.classList.add(type);
    statusDiv.style.display = 'block';
    
    // 3秒后自动隐藏成功和错误消息
    if (type === 'success' || type === 'error') {
      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 3000);
    }
  }
}); 