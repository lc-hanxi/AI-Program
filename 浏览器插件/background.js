// 当插件安装或更新时
chrome.runtime.onInstalled.addListener(() => {
  console.log("插件已安装或更新");
  
  // 检查是否支持侧边栏API
  if (typeof chrome.sidePanel !== 'undefined') {
    console.log("浏览器支持侧边栏API");
    
    // 注册侧边栏
    try {
      chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
        .then(() => {
          console.log("侧边栏行为设置成功");
        })
        .catch(err => {
          console.error("侧边栏行为设置失败:", err);
        });
    } catch (err) {
      console.error("设置侧边栏行为时出错:", err);
    }
  } else {
    console.log("浏览器不支持侧边栏API，将使用弹窗模式");
  }
  
  // 创建右键菜单
  chrome.contextMenus.create({
    id: "translateSelection",
    title: "翻译选中文本",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: "summarizePage",
    title: "总结当前页面",
    contexts: ["page"]
  });
});

// 存储选中的文本，以便在弹出窗口打开时使用
let lastSelectedText = '';

// 监听来自content.js的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "selectedText") {
    console.log("收到选中文本:", request.text.substring(0, 50) + (request.text.length > 50 ? "..." : ""));
    
    // 存储选中的文本
    lastSelectedText = request.text;
    
    // 如果弹出窗口已经打开，则向其发送选中的文本
    try {
      chrome.runtime.sendMessage({
        action: "getSelectedText",
        text: lastSelectedText
      }).catch(err => {
        console.log("发送选中文本消息失败:", err);
      });
    } catch (err) {
      console.error("发送选中文本消息时出错:", err);
    }
  }
  
  // 始终返回true以保持消息通道开放
  return true;
});

// 处理右键菜单点击事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "translateSelection" && info.selectionText) {
    console.log("右键菜单: 翻译选中文本");
    
    // 存储选中的文本
    lastSelectedText = info.selectionText;
    
    // 检查是否支持侧边栏API
    if (typeof chrome.sidePanel !== 'undefined') {
      console.log("尝试打开侧边栏");
      try {
        // 打开侧边栏
        chrome.sidePanel.open({ tabId: tab.id })
          .then(() => {
            console.log("侧边栏已打开");
            
            // 向侧边栏发送选中的文本
            setTimeout(() => {
              chrome.runtime.sendMessage({
                action: "getSelectedText",
                text: lastSelectedText
              }).catch(err => {
                console.log("向侧边栏发送文本失败:", err);
              });
            }, 500);
          })
          .catch(err => {
            console.error("打开侧边栏失败:", err);
            openPopupWindow();
          });
      } catch (err) {
        console.error("打开侧边栏出错:", err);
        openPopupWindow();
      }
    } else {
      console.log("使用弹窗模式");
      openPopupWindow();
    }
  } else if (info.menuItemId === "summarizePage") {
    console.log("右键菜单: 总结当前页面");
    
    // 检查是否支持侧边栏API
    if (typeof chrome.sidePanel !== 'undefined') {
      console.log("尝试打开侧边栏");
      try {
        // 打开侧边栏
        chrome.sidePanel.open({ tabId: tab.id })
          .then(() => {
            console.log("侧边栏已打开");
            
            // 向侧边栏发送切换到总结标签的消息
            setTimeout(() => {
              chrome.runtime.sendMessage({
                action: "switchToSummary"
              }).catch(err => {
                console.log("向侧边栏发送切换消息失败:", err);
              });
            }, 500);
          })
          .catch(err => {
            console.error("打开侧边栏失败:", err);
            openPopupWindowForSummary();
          });
      } catch (err) {
        console.error("打开侧边栏出错:", err);
        openPopupWindowForSummary();
      }
    } else {
      console.log("使用弹窗模式");
      openPopupWindowForSummary();
    }
  }
});

// 打开弹窗窗口用于翻译
function openPopupWindow() {
  chrome.windows.create({
    url: 'sidepanel.html',
    type: 'popup',
    width: 400,
    height: 600
  }, (window) => {
    console.log("弹窗已打开");
    // 等待窗口加载完成后发送消息
    setTimeout(() => {
      chrome.runtime.sendMessage({
        action: "getSelectedText",
        text: lastSelectedText
      }).catch(err => {
        console.log("向弹窗发送文本失败:", err);
      });
    }, 500);
  });
}

// 打开弹窗窗口用于总结
function openPopupWindowForSummary() {
  chrome.windows.create({
    url: 'sidepanel.html#summary',
    type: 'popup',
    width: 400,
    height: 600
  }, (window) => {
    console.log("弹窗已打开(总结模式)");
    // 等待窗口加载完成后发送消息
    setTimeout(() => {
      chrome.runtime.sendMessage({
        action: "switchToSummary"
      }).catch(err => {
        console.log("向弹窗发送切换消息失败:", err);
      });
    }, 500);
  });
}

// 点击工具栏图标时打开侧边栏或弹出窗口
chrome.action.onClicked.addListener((tab) => {
  console.log("点击工具栏图标");
  
  if (typeof chrome.sidePanel !== 'undefined') {
    console.log("尝试打开侧边栏");
    try {
      chrome.sidePanel.open({ tabId: tab.id })
        .then(() => {
          console.log("侧边栏已打开");
        })
        .catch(err => {
          console.error("打开侧边栏失败:", err);
          openPopupWindow();
        });
    } catch (err) {
      console.error("打开侧边栏出错:", err);
      openPopupWindow();
    }
  } else {
    console.log("使用弹窗模式");
    openPopupWindow();
  }
}); 