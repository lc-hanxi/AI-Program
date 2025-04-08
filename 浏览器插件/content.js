// 使用更简单、更可靠的方式实现content script功能
(() => {
  // 简单的日志函数
  const log = (msg) => {
    try {
      console.log(`[DeepSeek助手] ${msg}`);
    } catch (e) {
      // 忽略日志错误
    }
  };

  // 检查扩展是否可用
  const isExtensionAvailable = () => {
    try {
      return typeof chrome !== 'undefined' && 
             chrome.runtime && 
             typeof chrome.runtime.id === 'string';
    } catch (e) {
      return false;
    }
  };

  // 安全地发送消息
  const sendMessageSafely = (message) => {
    if (!isExtensionAvailable()) return;
    
    try {
      chrome.runtime.sendMessage(message).catch(() => {
        // 忽略错误
      });
    } catch (e) {
      // 忽略错误
    }
  };

  // 处理文本选择
  const handleTextSelection = () => {
    try {
      const selectedText = window.getSelection().toString().trim();
      if (selectedText && isExtensionAvailable()) {
        sendMessageSafely({
          action: "selectedText",
          text: selectedText
        });
      }
    } catch (e) {
      // 忽略错误
    }
  };

  // 设置消息监听器
  const setupMessageListener = () => {
    if (!isExtensionAvailable()) return;
    
    try {
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        // 立即检查扩展是否可用
        if (!isExtensionAvailable()) {
          sendResponse({ error: "扩展上下文已失效" });
          return false;
        }
        
        try {
          if (request.action === "getSelectedText") {
            const selectedText = window.getSelection().toString().trim();
            sendResponse({ success: true, text: selectedText });
          } else if (request.action === "getPageContent") {
            sendResponse({
              title: document.title,
              content: document.body.innerText,
              url: window.location.href
            });
          }
        } catch (e) {
          sendResponse({ error: e.message });
        }
        
        return true; // 保持消息通道开放
      });
    } catch (e) {
      log(`设置消息监听器失败: ${e.message}`);
    }
  };

  // 使用事件委托添加选择监听器
  const setupSelectionListener = () => {
    try {
      // 使用防抖动处理选择事件
      let selectionTimeout = null;
      
      const selectionHandler = () => {
        clearTimeout(selectionTimeout);
        selectionTimeout = setTimeout(handleTextSelection, 300);
      };
      
      // 使用事件委托
      document.addEventListener('mouseup', selectionHandler, { passive: true });
      document.addEventListener('keyup', selectionHandler, { passive: true });
      
      log('已添加选择事件监听器');
    } catch (e) {
      log(`添加选择事件监听器失败: ${e.message}`);
    }
  };

  // 初始化
  const initialize = () => {
    if (!isExtensionAvailable()) {
      log('扩展不可用，无法初始化');
      return;
    }
    
    setupMessageListener();
    setupSelectionListener();
    log('内容脚本已初始化');
  };

  // 在DOM加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})(); 