// pages/test/storageTest.js
const storage = require('../../utils/storage.js');

Page({
  data: {
    testResults: [],
    storageData: null
  },

  onLoad: function() {
    this.runTests();
  },

  runTests: function() {
    const testResults = [];
    
    // 测试1: 保存训练记录
    const workoutData = {
      id: 'test-workout',
      name: '测试训练',
      duration: 30,
      exercises: [],
      date: new Date().toISOString(),
      totalSets: 0
    };
    
    const saveResult = storage.saveWorkout(workoutData);
    testResults.push({
      name: '保存训练记录',
      passed: saveResult,
      message: saveResult ? '保存成功' : '保存失败'
    });
    
    // 测试2: 获取训练记录
    const workouts = storage.getWorkouts();
    const foundWorkout = workouts.some(w => w.id === 'test-workout');
    testResults.push({
      name: '获取训练记录',
      passed: foundWorkout,
      message: foundWorkout ? '找到测试记录' : '未找到测试记录'
    });
    
    // 测试3: 更新成就进度
    const updateResult = storage.updateAchievement('test-achievement', 1);
    testResults.push({
      name: '更新成就进度',
      passed: updateResult,
      message: updateResult ? '更新成功' : '更新失败'
    });
    
    // 测试4: 获取成就进度
    const achievements = storage.getAchievements();
    const foundAchievement = achievements.some(a => a.id === 'test-achievement');
    testResults.push({
      name: '获取成就进度',
      passed: foundAchievement,
      message: foundAchievement ? '找到测试成就' : '未找到测试成就'
    });
    
    // 测试5: 保存用户信息
    const userInfo = {
      nickName: '测试用户',
      avatarUrl: '/assets/icons/default-avatar.png'
    };
    const saveUserResult = storage.saveUserInfo(userInfo);
    testResults.push({
      name: '保存用户信息',
      passed: saveUserResult,
      message: saveUserResult ? '保存成功' : '保存失败'
    });
    
    // 测试6: 获取用户信息
    const storedUserInfo = storage.getUserInfo();
    const userInfoMatch = storedUserInfo.nickName === '测试用户';
    testResults.push({
      name: '获取用户信息',
      passed: userInfoMatch,
      message: userInfoMatch ? '用户信息匹配' : '用户信息不匹配'
    });
    
    // 显示所有存储数据
    this.setData({
      testResults: testResults,
      storageData: storage.getAllData()
    });
    
    console.log('测试完成:', testResults);
    console.log('当前存储数据:', this.data.storageData);
  },

  clearStorage: function() {
    try {
      wx.removeStorageSync('fitTrackerData');
      this.setData({
        storageData: null
      });
      wx.showToast({
        title: '存储已清空',
        icon: 'success'
      });
    } catch (e) {
      wx.showToast({
        title: '清空失败',
        icon: 'error'
      });
    }
  }
})