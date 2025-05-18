// utils/storage.js
const STORAGE_KEY = 'fitTrackerData';

// 获取所有存储数据
function getAllData() {
  try {
    const data = wx.getStorageSync(STORAGE_KEY);
    console.log('获取的存储数据:', data);
    if (!data) {
      const initialData = {
        workouts: [],
        achievements: [],
        userInfo: null,
        settings: {}
      };
      wx.setStorageSync(STORAGE_KEY, initialData);
      return initialData;
    }
    return data;
  } catch (e) {
    console.error('获取存储数据失败:', e);
    const initialData = {
      workouts: [],
      achievements: [],
      userInfo: null,
      settings: {}
    };
    wx.setStorageSync(STORAGE_KEY, initialData);
    return initialData;
  }
}

// 保存所有数据
function saveAllData(data) {
  try {
    wx.setStorageSync(STORAGE_KEY, data);
    return true;
  } catch (e) {
    console.error('保存数据失败:', e);
    return false;
  }
}

// 保存训练记录
function saveWorkout(workoutData) {
  const data = getAllData();
  data.workouts.unshift(workoutData);
  return saveAllData(data);
}

// 获取训练记录
function getWorkouts() {
  return getAllData().workouts;
}

// 更新成就进度
function updateAchievement(achievementId, progress) {
  const data = getAllData();
  const achievement = data.achievements.find(a => a.id === achievementId);
  
  if (achievement) {
    achievement.progress = progress;
  } else {
    data.achievements.push({
      id: achievementId,
      progress: progress
    });
  }
  
  return saveAllData(data);
}

// 获取成就进度
function getAchievements() {
  return getAllData().achievements;
}

// 保存用户信息
function saveUserInfo(userInfo) {
  const data = getAllData();
  console.log('保存前的用户数据:', data.userInfo);
  
  data.userInfo = {
    ...userInfo,
    lastLogin: new Date().toISOString(),
    workouts: data.userInfo?.workouts || 0,
    minutes: data.userInfo?.minutes || 0,
    streak: data.userInfo?.streak || 0
  };
  
  const result = saveAllData(data);
  console.log('保存后的用户数据:', data.userInfo, '结果:', result);
  return result;
}

// 获取用户信息
function getUserInfo() {
  return getAllData().userInfo || null;
}

// 更新用户统计数据
function updateUserStats(stats) {
  const data = getAllData();
  console.log('更新用户统计数据:', stats);
  
  if (!data.userInfo) {
    console.warn('无用户信息，创建新用户数据');
    data.userInfo = {
      workouts: 0,
      minutes: 0,
      streak: 0
    };
  }

  if (stats.workouts !== undefined) {
    data.userInfo.workouts = stats.workouts;
  }
  if (stats.minutes !== undefined) {
    data.userInfo.minutes = stats.minutes;
  }
  if (stats.streak !== undefined) {
    data.userInfo.streak = stats.streak;
  }

  const result = saveAllData(data);
  console.log('用户统计数据更新结果:', result, '更新后数据:', data.userInfo);
  return result;
}

module.exports = {
  saveWorkout,
  getWorkouts,
  updateAchievement,
  getAchievements,
  saveUserInfo,
  getUserInfo,
  updateUserStats,
  getAllData
};