// pages/training/history/history.js
Page({
  data: {
    workoutHistory: [],
    currentMonth: '',
    months: []
  },

  onLoad: function(options) {
    this.initMonthData();
    this.loadWorkoutHistory();
  },

  onShow: function() {
    this.refreshData();
  },

  initMonthData: function() {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}年${now.getMonth() + 1}月`;
    
    // 生成最近6个月的数据
    const months = [];
    for (let i = 0; i < 6; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${monthDate.getFullYear()}年${monthDate.getMonth() + 1}月`);
    }
    
    this.setData({
      currentMonth: currentMonth,
      months: months
    });
  },

  loadWorkoutHistory: function() {
    const storage = require('../../../utils/storage.js');
    const workouts = storage.getWorkouts();
    
    const formattedWorkoutHistory = workouts.map(item => {
      // 格式化动作信息
      const exerciseNames = item.exercises.map(ex => {
        if (typeof ex === 'string') return ex;
        return ex.name || '未知动作';
      });
      
      return {
        ...item,
        formattedDate: this.formatDate(item.date),
        formattedDuration: `${item.duration || 0}分钟`,
        formattedSets: `${item.totalSets || 0}组动作`,
        formattedExercises: exerciseNames.join('、') || '无记录'
      };
    });
    
    this.setData({
      workoutHistory: formattedWorkoutHistory
    });
    
    // 初始筛选当前月份数据
    this.filterWorkoutsByMonth();
  },

  refreshData: function() {
    // 刷新页面数据
    this.loadWorkoutHistory();
  },

  data: {
    currentMonth: '',
    // 修改months数组为完整的年月格式
    months: (() => {
      const result = [];
      const now = new Date();
      for (let i = 0; i < 12; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        result.unshift(`${date.getFullYear()}年${date.getMonth() + 1}月`);
      }
      return result;
    })(),
    workoutHistory: []
  },

  onMonthChange: function(e) {
    console.log('picker选择索引:', e.detail.value);
    const selectedIndex = Number(e.detail.value);
    
    if (!isNaN(selectedIndex) && selectedIndex >= 0 && selectedIndex < this.data.months.length) {
      const selectedMonth = this.data.months[selectedIndex];
      console.log('选择的月份:', selectedMonth);
      
      this.setData({
        currentMonth: selectedMonth
      });
      this.filterWorkoutsByMonth();
    } else {
      // 默认显示当前月
      const now = new Date();
      const defaultMonth = `${now.getFullYear()}年${now.getMonth() + 1}月`;
      console.warn('无效的选择索引，使用默认月份:', defaultMonth);
      
      this.setData({
        currentMonth: defaultMonth
      });
    }
  },

  filterWorkoutsByMonth: function() {
    const storage = require('../../../utils/storage.js');
    const allWorkouts = storage.getWorkouts();
    const dateParts = this.data.currentMonth.replace('年', ',').replace('月', '').split(',');
    const year = dateParts[0];
    const month = dateParts[1];
    
    const filteredWorkouts = allWorkouts.filter(workout => {
      const workoutDate = new Date(workout.date);
      return workoutDate.getFullYear() == year && 
             (workoutDate.getMonth() + 1) == month;
    });
    
    const formattedWorkoutHistory = filteredWorkouts.map(item => ({
      ...item,
      formattedDate: this.formatDate(item.date),
      formattedDuration: `${item.duration}分钟`,
      formattedSets: `${item.totalSets}组动作`,
      formattedExercises: item.exercises.map(ex => ex.name).join('、')
    }));
    
    this.setData({
      workoutHistory: formattedWorkoutHistory
    });
  },

  viewWorkoutDetail: function(e) {
    const workoutId = e.currentTarget.dataset.id;
    // 查看训练详情
    // 这里将来会实现跳转到详情页的逻辑
    console.log('查看训练详情:', workoutId);
  },

  formatDate: function(dateString) {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }
})