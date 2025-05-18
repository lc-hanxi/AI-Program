// pages/training/template/template.js
Page({
  data: {
    templateId: '',
    templateInfo: {},
    exercises: []
  },

  onLoad: function(options) {
    if (options.id) {
      this.setData({
        templateId: options.id
      });
      this.loadTemplateInfo(options.id);
    }
  },

  loadTemplateInfo: function(templateId) {
    // 根据模板ID加载模板信息
    // 这里将来会从本地存储加载数据
    console.log('加载模板信息:', templateId);
    
    // 模拟数据
    let templateInfo = {};
    let exercises = [];
    
    switch(templateId) {
      case 'muscle-gain':
        templateInfo = {
          id: 'muscle-gain',
          name: '增肌训练',
          description: '专注于肌肉增长的训练计划',
          color: '#FF9800',
          difficulty: '中等',
          duration: '45-60分钟',
          frequency: '每周3-4次'
        };
        exercises = [
          {
            id: 'ex-1',
            name: '杠铃卧推',
            sets: 4,
            reps: '8-12',
            rest: 90,
            muscle: '胸部',
            image: '/assets/exercises/bench-press.png'
          },
          {
            id: 'ex-2',
            name: '引体向上',
            sets: 4,
            reps: '6-10',
            rest: 90,
            muscle: '背部',
            image: '/assets/exercises/pull-up.png'
          },
          {
            id: 'ex-3',
            name: '深蹲',
            sets: 4,
            reps: '8-12',
            rest: 120,
            muscle: '腿部',
            image: '/assets/exercises/squat.png'
          },
          {
            id: 'ex-4',
            name: '肩上推举',
            sets: 3,
            reps: '8-12',
            rest: 90,
            muscle: '肩部',
            image: '/assets/exercises/shoulder-press.png'
          }
        ];
        break;
      case 'fat-loss':
        templateInfo = {
          id: 'fat-loss',
          name: '减脂训练',
          description: '帮助燃烧脂肪的训练计划',
          color: '#2196F3',
          difficulty: '中高等',
          duration: '30-45分钟',
          frequency: '每周4-5次'
        };
        exercises = [
          {
            id: 'ex-5',
            name: '高抬腿',
            sets: 3,
            reps: '30秒',
            rest: 30,
            muscle: '全身',
            image: '/assets/exercises/high-knees.png'
          },
          {
            id: 'ex-6',
            name: '波比跳',
            sets: 3,
            reps: '45秒',
            rest: 30,
            muscle: '全身',
            image: '/assets/exercises/burpee.png'
          },
          {
            id: 'ex-7',
            name: '山climbers',
            sets: 3,
            reps: '30秒',
            rest: 30,
            muscle: '核心',
            image: '/assets/exercises/mountain-climber.png'
          },
          {
            id: 'ex-8',
            name: '跳绳',
            sets: 3,
            reps: '60秒',
            rest: 45,
            muscle: '全身',
            image: '/assets/exercises/jump-rope.png'
          }
        ];
        break;
      case 'endurance':
        templateInfo = {
          id: 'endurance',
          name: '耐力训练',
          description: '提升体能和耐力的训练计划',
          color: '#4CAF50',
          difficulty: '中等',
          duration: '40-60分钟',
          frequency: '每周3次'
        };
        exercises = [
          {
            id: 'ex-9',
            name: '慢跑',
            sets: 1,
            reps: '20分钟',
            rest: 0,
            muscle: '心肺',
            image: '/assets/exercises/jogging.png'
          },
          {
            id: 'ex-10',
            name: '间歇冲刺',
            sets: 5,
            reps: '30秒冲刺 + 90秒慢跑',
            rest: 0,
            muscle: '心肺',
            image: '/assets/exercises/sprint.png'
          },
          {
            id: 'ex-11',
            name: '平板支撑',
            sets: 3,
            reps: '60秒',
            rest: 45,
            muscle: '核心',
            image: '/assets/exercises/plank.png'
          },
          {
            id: 'ex-12',
            name: '俯卧撑',
            sets: 3,
            reps: '尽可能多',
            rest: 60,
            muscle: '上肢',
            image: '/assets/exercises/push-up.png'
          }
        ];
        break;
      default:
        // 默认模板
        templateInfo = {
          id: 'default',
          name: '基础训练',
          description: '基础全身训练计划',
          color: '#9C27B0',
          difficulty: '初级',
          duration: '30分钟',
          frequency: '每周2-3次'
        };
        exercises = [
          {
            id: 'ex-13',
            name: '俯卧撑',
            sets: 3,
            reps: '10-15',
            rest: 60,
            muscle: '胸部',
            image: '/assets/exercises/push-up.png'
          },
          {
            id: 'ex-14',
            name: '深蹲',
            sets: 3,
            reps: '15-20',
            rest: 60,
            muscle: '腿部',
            image: '/assets/exercises/squat.png'
          }
        ];
    }
    
    this.setData({
      templateInfo: templateInfo,
      exercises: exercises
    });
  },

  startWorkout: function() {
    // 开始训练
    wx.navigateTo({
      url: `/pages/training/workout/workout?templateId=${this.data.templateId}`
    });
  }
})