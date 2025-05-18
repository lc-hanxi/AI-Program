// pages/index/index.js
Page({
  data: {
    templates: [
      {
        id: 'muscle-gain',
        name: '增肌训练',
        description: '专注于肌肉增长的训练计划',
        icon: '/assets/default-icon.png',
        color: '#FF9800'
      },
      {
        id: 'fat-loss',
        name: '减脂训练',
        description: '帮助燃烧脂肪的训练计划',
        icon: '/assets/default-icon.png',
        color: '#2196F3'
      },
      {
        id: 'endurance',
        name: '耐力训练',
        description: '提升体能和耐力的训练计划',
        icon: '/assets/default-icon.png',
        color: '#4CAF50'
      }
    ],
    recentWorkouts: []
  },

  onLoad: function(options) {
    this.loadRecentWorkouts();
  },

  onShow: function() {
    this.refreshData();
  },

  loadRecentWorkouts: function() {
    // 加载最近的训练记录
    // 这里将来会从本地存储加载数据
    console.log('加载最近训练记录');
    
    // 模拟数据
    this.setData({
      recentWorkouts: [
        {
          id: 'workout-1',
          name: '上肢力量训练',
          date: '2023-05-15',
          duration: 45
        },
        {
          id: 'workout-2',
          name: '核心训练',
          date: '2023-05-13',
          duration: 30
        }
      ]
    });
  },

  refreshData: function() {
    // 刷新页面数据
    this.loadRecentWorkouts();
  },

  onTemplateSelect: function(e) {
    const templateId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/training/template/template?id=${templateId}`
    });
  },

  startQuickWorkout: function() {
    wx.navigateTo({
      url: '/pages/training/workout/workout'
    });
  },

  viewHistory: function() {
    wx.navigateTo({
      url: '/pages/training/history/history'
    });
  }
})