// pages/training/workout/workout.js
Page({
  data: {
    templateId: '',
    workoutName: '快速训练',
    exercises: [],
    currentExerciseIndex: 0,
    currentSetIndex: 0,
    isResting: false,
    restTimeRemaining: 0,
    workoutStartTime: 0,
    workoutDuration: 0,
    isWorkoutComplete: false,
    timerInterval: null,
    totalSets: 0
  },

  onLoad: function(options) {
    if (options.templateId) {
      this.setData({
        templateId: options.templateId
      });
      this.loadWorkoutData(options.templateId);
    } else {
      this.loadQuickWorkout();
    }
    
    // 记录开始时间
    this.setData({
      workoutStartTime: Date.now()
    });
  },

  onUnload: function() {
    // 清除定时器
    if (this.data.timerInterval) {
      clearInterval(this.data.timerInterval);
    }
  },

  loadWorkoutData: function(templateId) {
    // 根据模板ID加载训练数据
    // 这里将来会从本地存储加载数据
    console.log('加载训练数据:', templateId);
    
    // 模拟数据
    let workoutName = '';
    let exercises = [];
    
    switch(templateId) {
      case 'muscle-gain':
        workoutName = '增肌训练';
        exercises = [
          {
            id: 'ex-1',
            name: '杠铃卧推',
            sets: 4,
            reps: '8-12',
            rest: 90,
            muscle: '胸部',
            image: '/assets/exercises/bench-press.png',
            completedSets: []
          },
          {
            id: 'ex-2',
            name: '引体向上',
            sets: 4,
            reps: '6-10',
            rest: 90,
            muscle: '背部',
            image: '/assets/exercises/pull-up.png',
            completedSets: []
          },
          {
            id: 'ex-3',
            name: '深蹲',
            sets: 4,
            reps: '8-12',
            rest: 120,
            muscle: '腿部',
            image: '/assets/exercises/squat.png',
            completedSets: []
          },
          {
            id: 'ex-4',
            name: '肩上推举',
            sets: 3,
            reps: '8-12',
            rest: 90,
            muscle: '肩部',
            image: '/assets/exercises/shoulder-press.png',
            completedSets: []
          }
        ];
        break;
      case 'fat-loss':
        workoutName = '减脂训练';
        exercises = [
          {
            id: 'ex-5',
            name: '高抬腿',
            sets: 3,
            reps: '30秒',
            rest: 30,
            muscle: '全身',
            image: '/assets/exercises/high-knees.png',
            completedSets: []
          },
          {
            id: 'ex-6',
            name: '波比跳',
            sets: 3,
            reps: '45秒',
            rest: 30,
            muscle: '全身',
            image: '/assets/exercises/burpee.png',
            completedSets: []
          },
          {
            id: 'ex-7',
            name: '山climbers',
            sets: 3,
            reps: '30秒',
            rest: 30,
            muscle: '核心',
            image: '/assets/exercises/mountain-climber.png',
            completedSets: []
          },
          {
            id: 'ex-8',
            name: '跳绳',
            sets: 3,
            reps: '60秒',
            rest: 45,
            muscle: '全身',
            image: '/assets/exercises/jump-rope.png',
            completedSets: []
          }
        ];
        break;
      case 'endurance':
        workoutName = '耐力训练';
        exercises = [
          {
            id: 'ex-9',
            name: '慢跑',
            sets: 1,
            reps: '20分钟',
            rest: 0,
            muscle: '心肺',
            image: '/assets/exercises/jogging.png',
            completedSets: []
          },
          {
            id: 'ex-10',
            name: '间歇冲刺',
            sets: 5,
            reps: '30秒冲刺 + 90秒慢跑',
            rest: 0,
            muscle: '心肺',
            image: '/assets/exercises/sprint.png',
            completedSets: []
          },
          {
            id: 'ex-11',
            name: '平板支撑',
            sets: 3,
            reps: '60秒',
            rest: 45,
            muscle: '核心',
            image: '/assets/exercises/plank.png',
            completedSets: []
          },
          {
            id: 'ex-12',
            name: '俯卧撑',
            sets: 3,
            reps: '尽可能多',
            rest: 60,
            muscle: '上肢',
            image: '/assets/exercises/push-up.png',
            completedSets: []
          }
        ];
        break;
    }
    
    this.setData({
      workoutName: workoutName,
      exercises: exercises
    });
  },

  loadQuickWorkout: function() {
    // 加载快速训练数据
    this.setData({
      workoutName: '快速训练',
      exercises: [
        {
          id: 'ex-13',
          name: '俯卧撑',
          sets: 3,
          reps: '10-15',
          rest: 60,
          muscle: '胸部',
          image: '/assets/exercises/push-up.png',
          completedSets: []
        },
        {
          id: 'ex-14',
          name: '深蹲',
          sets: 3,
          reps: '15-20',
          rest: 60,
          muscle: '腿部',
          image: '/assets/exercises/squat.png',
          completedSets: []
        },
        {
          id: 'ex-15',
          name: '平板支撑',
          sets: 3,
          reps: '30秒',
          rest: 45,
          muscle: '核心',
          image: '/assets/exercises/plank.png',
          completedSets: []
        }
      ]
    });
  },

  completeSet: function() {
    const { currentExerciseIndex, currentSetIndex, exercises } = this.data;
    const currentExercise = exercises[currentExerciseIndex];
    
    // 记录完成的组
    const updatedExercises = [...exercises];
    updatedExercises[currentExerciseIndex].completedSets.push({
      setNumber: currentSetIndex + 1,
      timestamp: Date.now()
    });
    
    this.setData({
      exercises: updatedExercises
    });
    
    // 检查是否需要休息
    if (currentSetIndex < currentExercise.sets - 1) {
      // 还有更多组要完成，开始休息
      this.startRest(currentExercise.rest);
    } else {
      // 当前动作的所有组都完成了
      if (currentExerciseIndex < exercises.length - 1) {
        // 还有更多动作，移动到下一个动作
        this.setData({
          currentExerciseIndex: currentExerciseIndex + 1,
          currentSetIndex: 0
        });
      } else {
        // 所有动作都完成了，训练结束
        this.completeWorkout();
      }
    }
  },

  startRest: function(seconds) {
    this.setData({
      isResting: true,
      restTimeRemaining: seconds
    });
    
    // 设置定时器
    const timerInterval = setInterval(() => {
      if (this.data.restTimeRemaining > 0) {
        this.setData({
          restTimeRemaining: this.data.restTimeRemaining - 1
        });
      } else {
        // 休息结束
        clearInterval(this.data.timerInterval);
        this.setData({
          isResting: false,
          currentSetIndex: this.data.currentSetIndex + 1,
          timerInterval: null
        });
      }
    }, 1000);
    
    this.setData({
      timerInterval: timerInterval
    });
  },

  skipRest: function() {
    // 跳过休息
    if (this.data.timerInterval) {
      clearInterval(this.data.timerInterval);
    }
    
    this.setData({
      isResting: false,
      currentSetIndex: this.data.currentSetIndex + 1,
      timerInterval: null
    });
  },

  completeWorkout: function() {
    // 计算训练时长
    const workoutDuration = Math.floor((Date.now() - this.data.workoutStartTime) / 1000 / 60);
    
    // 计算总组数
    let totalSets = 0;
    this.data.exercises.forEach(exercise => {
      totalSets += exercise.completedSets.length;
    });
    
    this.setData({
      isWorkoutComplete: true,
      workoutDuration: workoutDuration,
      totalSets: totalSets
    });
    
    // 保存训练记录
    this.saveWorkoutRecord();
  },

  saveWorkoutRecord: function() {
    const storage = require('../../../utils/storage.js');
    
    // 准备训练记录数据
    const workoutRecord = {
      id: Date.now().toString(),
      templateId: this.data.templateId,
      name: this.data.workoutName,
      duration: this.data.workoutDuration,
      exercises: this.data.exercises,
      date: new Date().toISOString(),
      totalSets: this.data.totalSets
    };
    
    console.log('准备保存训练记录:', workoutRecord);
    
    // 保存训练记录
    const result = storage.saveWorkout(workoutRecord);
    console.log('训练记录保存结果:', result);
    
    if (result) {
      // 获取更新后的训练记录
      const workouts = storage.getWorkouts();
      console.log('当前所有训练记录:', workouts);
      
      // 计算统计数据
      const totalMinutes = workouts.reduce((sum, w) => sum + w.duration, 0);
      const streak = this.calculateStreak(workouts);
      
      console.log('计算统计数据:', {
        workouts: workouts.length,
        minutes: totalMinutes,
        streak: streak
      });
      
      // 更新用户统计数据
      const updateResult = storage.updateUserStats({
        workouts: workouts.length,
        minutes: totalMinutes,
        streak: streak
      });
      console.log('用户统计数据更新结果:', updateResult);
      
      // 验证更新后的数据
      const updatedUserInfo = storage.getUserInfo();
      console.log('更新后的用户数据:', updatedUserInfo);
    }
    
    // 更新成就进度
    this.updateAchievements();
  },

  calculateStreak: function(workouts) {
    // 计算连续训练天数
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
        break; // 连续天数中断
      }
      // diffDays === 0 表示同一天多次训练，不计入连续天数
    }
    
    return streak;
  },
  
  updateAchievements: function() {
    const storage = require('../../../utils/storage.js');
    
    // 更新"初次训练"成就
    storage.updateAchievement('ach-1', 1);
    
    // 更新"训练狂人"成就 - 累计训练时间
    const workouts = storage.getWorkouts();
    const totalMinutes = workouts.reduce((sum, workout) => sum + workout.duration, 0);
    storage.updateAchievement('ach-5', totalMinutes);
    
    // 更新"坚持不懈"成就 - 连续训练天数
    // 这里需要更复杂的逻辑来计算连续天数
    // 暂时简单更新进度
    storage.updateAchievement('ach-2', 1);
  },

  finishWorkout: function() {
    // 返回首页
    wx.switchTab({
      url: '/pages/index/index'
    });
  }
})