// pages/achievement/achievement.js
Page({
  data: {
    activeTab: 0, // 0: 成就, 1: 排行榜
    achievements: [],
    unlockedAchievements: [],
    rankings: {
      friends: [],
      global: []
    },
    rankingType: 'weekly' // weekly, monthly, allTime
  },

  onLoad: function(options) {
    this.loadAchievements();
    this.loadRankings();
  },

  onShow: function() {
    this.refreshData();
  },

  loadAchievements: function() {
    // 引入storage模块
    const storage = require('../../utils/storage.js');
    
    // 从本地存储获取成就数据
    const achievementsProgress = storage.getAchievements();
    
    // 成就模板数据
    const achievementsTemplate = [
      {
        id: 'ach-1',
        name: '初次训练',
        description: '完成你的第一次训练',
        icon: '/assets/default-icon.png',
        total: 1
      },
      {
        id: 'ach-2',
        name: '坚持不懈',
        description: '连续7天完成训练',
        icon: '/assets/default-icon.png',
        total: 7
      },
      {
        id: 'ach-3',
        name: '力量训练专家',
        description: '完成10次增肌训练',
        icon: '/assets/default-icon.png',
        total: 10
      },
      {
        id: 'ach-4',
        name: '减脂达人',
        description: '完成10次减脂训练',
        icon: '/assets/icons/achievement-cardio.png',
        total: 10
      },
      {
        id: 'ach-5',
        name: '训练狂人',
        description: '累计训练时间达到10小时',
        icon: '/assets/icons/achievement-time.png',
        total: 600
      }
    ];
    
    // 合并模板和进度数据
    const achievements = achievementsTemplate.map(item => {
      const progress = achievementsProgress.find(a => a.id === item.id)?.progress || 0;
      return {
        ...item,
        progress: progress,
        unlocked: progress >= item.total,
        date: progress >= item.total ? new Date().toISOString().split('T')[0] : null
      };
    });
    
    const unlockedAchievements = achievements.filter(item => item.unlocked);
    const completionRate = Math.round(unlockedAchievements.length / achievements.length * 100);
    
    this.setData({
      achievements: achievements,
      unlockedAchievements: unlockedAchievements,
      completionRate: completionRate
    });
  },

  loadRankings: function() {
    // 加载排行榜数据
    // 这里将来会从本地存储加载数据
    console.log('加载排行榜数据');
    
    // 模拟数据
    const friendRankings = [
      {
        id: 'user-1',
        name: '张三',
        avatar: '/assets/icons/avatar-1.png',
        workouts: 12,
        minutes: 360,
        rank: 1
      },
      {
        id: 'user-2',
        name: '李四',
        avatar: '/assets/icons/avatar-2.png',
        workouts: 10,
        minutes: 300,
        rank: 2
      },
      {
        id: 'current-user',
        name: '我',
        avatar: '/assets/icons/default-avatar.png',
        workouts: 6,
        minutes: 180,
        rank: 3,
        isCurrentUser: true
      },
      {
        id: 'user-3',
        name: '王五',
        avatar: '/assets/icons/avatar-3.png',
        workouts: 5,
        minutes: 150,
        rank: 4
      }
    ];
    
    const globalRankings = [
      {
        id: 'global-1',
        name: '健身达人',
        avatar: '/assets/icons/avatar-4.png',
        workouts: 30,
        minutes: 900,
        rank: 1
      },
      {
        id: 'global-2',
        name: '运动王者',
        avatar: '/assets/icons/avatar-5.png',
        workouts: 28,
        minutes: 840,
        rank: 2
      },
      {
        id: 'global-3',
        name: '肌肉男神',
        avatar: '/assets/icons/avatar-6.png',
        workouts: 25,
        minutes: 750,
        rank: 3
      },
      {
        id: 'current-user',
        name: '我',
        avatar: '/assets/icons/default-avatar.png',
        workouts: 6,
        minutes: 180,
        rank: 156,
        isCurrentUser: true
      }
    ];
    
    this.setData({
      'rankings.friends': friendRankings,
      'rankings.global': globalRankings
    });
  },

  refreshData: function() {
    // 刷新页面数据
    this.loadAchievements();
    this.loadRankings();
  },

  switchTab: function(e) {
    const tab = parseInt(e.currentTarget.dataset.tab);
    this.setData({
      activeTab: tab
    });
  },

  changeRankingType: function(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      rankingType: type
    });
    // 根据类型加载不同的排行榜数据
    this.loadRankingsByType(type);
  },

  loadRankingsByType: function(type) {
    // 根据类型加载排行榜数据
    // 这里将来会实现不同时间段的排行榜数据加载
    console.log('加载排行榜数据类型:', type);
  }
})