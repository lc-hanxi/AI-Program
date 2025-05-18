// pages/profile/profile.js
Page({
  data: {
    userInfo: {}, // 初始为空，等待登录后填充
    isLoggedIn: false,
    achievements: [],
    statistics: {
      totalWorkouts: 0,
      totalMinutes: 0,
      currentStreak: 0
    }
  },

  onLoad: function(options) {
    const storage = require('../../utils/storage.js');
    const userInfo = storage.getUserInfo();
    
    if (userInfo) {
      console.log('发现已登录用户:', userInfo);
      this.setData({
        userInfo: userInfo,
        isLoggedIn: true
      });
      this.loadUserStatistics();
    } else {
      console.log('未发现用户登录信息');
      this.initUserInfo();
    }
  },

  onShow: function() {
    // 每次页面显示时刷新数据
    if (this.data.isLoggedIn) {
      console.log('刷新用户统计数据');
      this.loadUserStatistics();
    }
  },

  onShow: function() {
    this.refreshData();
  },

  initUserInfo: function() {
    // 初始化用户信息
    // 这里将来会从本地存储加载用户数据
    console.log('初始化用户信息');
  },

  loadStatistics: function() {
    // 加载用户统计数据
    // 这里将来会从本地存储加载统计数据
    console.log('加载统计数据');
  },

  refreshData: function() {
    // 刷新页面数据
    this.loadStatistics();
  },

  onUserInfoTap: function() {
    console.log('头像点击事件触发');
    if (this.data.isLoggedIn) {
      console.log('用户已登录，无需操作');
      return;
    }
    
    console.log('准备获取用户信息');
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        console.log('获取用户信息成功', res);
        this.setData({
          userInfo: res.userInfo,
          isLoggedIn: true
        });
        // 保存用户信息到本地
        this.saveUserInfo(res.userInfo);
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        });
      },
      fail: (err) => {
        console.error('获取用户信息失败', err);
        wx.showToast({
          title: '登录失败: ' + err.errMsg,
          icon: 'none',
          duration: 3000
        });
      },
      complete: () => {
        console.log('登录流程完成');
      }
    });
  },

  saveUserInfo: function(userInfo) {
    const storage = require('../../utils/storage.js');
    storage.saveUserInfo(userInfo);
    this.loadUserStatistics();
  },

  loadUserStatistics: function() {
    console.log('开始加载用户统计数据...');
    const storage = require('../../utils/storage.js');
    
    // 检查存储系统是否正常
    const allData = storage.getAllData();
    console.log('当前所有存储数据:', allData);
    
    // 获取用户数据
    const userData = storage.getUserInfo();
    console.log('获取的用户数据:', userData);
    
    if (userData && (userData.workouts || userData.minutes || userData.streak)) {
      console.log('发现有效用户统计数据');
      this.setData({
        statistics: {
          totalWorkouts: userData.workouts || 0,
          totalMinutes: userData.minutes || 0,
          currentStreak: userData.streak || 0
        }
      });
      console.log('统计数据已更新:', this.data.statistics);
    } else {
      console.warn('未找到有效用户统计数据，使用默认值');
      this.setData({
        statistics: {
          totalWorkouts: 0,
          totalMinutes: 0,
          currentStreak: 0
        }
      });
      
      // 如果是已登录用户但数据为0，可能是初始化问题
      if (this.data.isLoggedIn) {
        console.warn('已登录用户但统计数据为0，尝试修复...');
        const workouts = storage.getWorkouts();
        if (workouts.length > 0) {
          console.log('发现历史训练记录，重新计算统计数据...');
          const totalMinutes = workouts.reduce((sum, w) => sum + w.duration, 0);
          const streak = this.calculateStreak(workouts);
          
          storage.updateUserStats({
            workouts: workouts.length,
            minutes: totalMinutes,
            streak: streak
          });
          
          // 重新加载数据
          this.loadUserStatistics();
        }
      }
    }
  },

  calculateStreak: function(workouts) {
    if (!workouts || workouts.length === 0) return 0;
    
    // 按日期排序（从新到旧）
    workouts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    let streak = 1;
    let lastDate = new Date(workouts[0].date);
    lastDate.setHours(0, 0, 0, 0);
    
    for (let i = 1; i < workouts.length; i++) {
      const currentDate = new Date(workouts[i].date);
      currentDate.setHours(0, 0, 0, 0);
      
      const diffDays = Math.round((lastDate - currentDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        streak++;
        lastDate = currentDate;
      } else if (diffDays > 1) {
        break;
      }
    }
    
    console.log('计算连续天数结果:', streak);
    return streak;
  },

  navigateToAchievements: function() {
    wx.navigateTo({
      url: '/pages/achievement/achievement'
    });
  },

  navigateToHistory: function() {
    wx.navigateTo({
      url: '/pages/training/history/history'
    });
  }
})