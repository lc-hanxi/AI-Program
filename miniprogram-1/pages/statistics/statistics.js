// pages/statistics/statistics.js
Page({
  data: {
    trainingData: [30, 45, 40, 60, 35, 50, 20], // 训练时长(分钟)
    weightData: [65.2, 64.9, 64.7, 64.5, 64.3, 64.1, 63.9], // 体重数据(kg)
    completionRate: 82, // 完成百分比
    windowWidth: 375,
    targetCompletion: 100 // 目标完成率
  },

  onLoad() {
    wx.getSystemInfo({
      success: (res) => {
        this.setData({ windowWidth: res.windowWidth }, () => {
          this.drawTrainingChart();
          this.drawWeightChart();
          this.drawCompletionChart();
        });
      }
    });
  },

  drawTrainingChart() {
    const ctx = wx.createCanvasContext('trainingChart');
    const { windowWidth } = this.data;
    
    // 使用完整屏幕宽度
    const canvasWidth = windowWidth;
    const canvasHeight = 300;
    
    // 最小边距
    const margin = {
      left: 20,
      right: 20,
      top: 30,
      bottom: 40
    };
    
    // 计算绘图区域
    const plotWidth = canvasWidth - margin.left - margin.right;
    const plotHeight = canvasHeight - margin.top - margin.bottom;
    
    // 数据准备
    const data = this.data.trainingData;
    const maxValue = Math.max(...data) * 1.2;
    const barCount = data.length;
    const barWidth = plotWidth / barCount * 0.8; // 更宽的柱状图
    const barSpacing = plotWidth / barCount;
    
    // 清空画布
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // 绘制Y轴
    ctx.beginPath();
    ctx.setStrokeStyle('#CCCCCC');
    ctx.setLineWidth(1);
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + plotHeight);
    ctx.stroke();
    
    // 绘制X轴
    ctx.moveTo(margin.left, margin.top + plotHeight);
    ctx.lineTo(margin.left + plotWidth, margin.top + plotHeight);
    ctx.stroke();
    
    // 绘制柱状图
    const days = ['周一','周二','周三','周四','周五','周六','周日'];
    data.forEach((value, index) => {
      const x = margin.left + index * barSpacing + (barSpacing - barWidth) / 2;
      const height = (value / maxValue) * plotHeight;
      const y = margin.top + plotHeight - height;
      
      // 绘制柱
      ctx.setFillStyle('#4CAF50');
      ctx.fillRect(x, y, barWidth, height);
      
      // 绘制数值
      ctx.setFillStyle('#333333');
      ctx.setFontSize(12);
      ctx.setTextAlign('center');
      ctx.fillText(value, x + barWidth / 2, y - 5);
      
      // 绘制星期标签
      ctx.setFillStyle('#666666');
      ctx.fillText(days[index], x + barWidth / 2, margin.top + plotHeight + 15);
    });
    
    // 绘制标题
    ctx.setFillStyle('#333333');
    ctx.setFontSize(14);
    ctx.setTextAlign('center');
    ctx.fillText('每周训练时长(分钟)', canvasWidth / 2, 15);
    
    ctx.draw();
  },

  drawWeightChart() {
    const ctx = wx.createCanvasContext('weightChart');
    const { windowWidth, weightData } = this.data;
    
    const canvasWidth = windowWidth;
    const canvasHeight = 300;
    
    const margin = {
      left: 20,
      right: 20,
      top: 30,
      bottom: 40
    };
    
    const plotWidth = canvasWidth - margin.left - margin.right;
    const plotHeight = canvasHeight - margin.top - margin.bottom;
    
    // 计算数据范围
    const maxWeight = Math.max(...weightData) * 1.01;
    const minWeight = Math.min(...weightData) * 0.99;
    const weightRange = maxWeight - minWeight;
    
    // 清空画布
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // 绘制Y轴
    ctx.beginPath();
    ctx.setStrokeStyle('#CCCCCC');
    ctx.setLineWidth(1);
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + plotHeight);
    ctx.stroke();
    
    // 绘制X轴
    ctx.moveTo(margin.left, margin.top + plotHeight);
    ctx.lineTo(margin.left + plotWidth, margin.top + plotHeight);
    ctx.stroke();
    
    // 绘制折线
    ctx.beginPath();
    ctx.setStrokeStyle('#2196F3');
    ctx.setLineWidth(2);
    
    const days = ['周一','周二','周三','周四','周五','周六','周日'];
    const pointSpacing = plotWidth / (weightData.length - 1);
    
    weightData.forEach((weight, index) => {
      const x = margin.left + index * pointSpacing;
      const y = margin.top + plotHeight - ((weight - minWeight) / weightRange * plotHeight);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      // 绘制数据点
      ctx.beginPath();
      ctx.setFillStyle('#2196F3');
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // 绘制体重数值
      ctx.setFillStyle('#333333');
      ctx.setFontSize(12);
      ctx.setTextAlign('center');
      ctx.fillText(weight.toFixed(1), x, y - 10);
      
      // 绘制星期标签
      ctx.setFillStyle('#666666');
      ctx.fillText(days[index], x, margin.top + plotHeight + 15);
    });
    
    ctx.stroke();
    
    // 绘制标题
    ctx.setFillStyle('#333333');
    ctx.setFontSize(14);
    ctx.setTextAlign('center');
    ctx.fillText('体重变化趋势(kg)', canvasWidth / 2, 15);
    
    ctx.draw();
  },

  drawCompletionChart() {
    const ctx = wx.createCanvasContext('completionChart');
    const { windowWidth, completionRate, targetCompletion } = this.data;
    
    const canvasWidth = windowWidth;
    const canvasHeight = 300;
    
    // 计算圆环参数
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const radius = Math.min(centerX, centerY) * 0.6;
    const lineWidth = 15;
    
    // 清空画布
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // 绘制背景圆环
    ctx.beginPath();
    ctx.setLineWidth(lineWidth);
    ctx.setStrokeStyle('#EEEEEE');
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // 绘制进度圆环
    ctx.beginPath();
    ctx.setLineWidth(lineWidth);
    ctx.setStrokeStyle('#FF9800');
    ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * completionRate / targetCompletion));
    ctx.stroke();
    
    // 绘制中心文本
    ctx.setFillStyle('#333333');
    ctx.setFontSize(radius * 0.5);
    ctx.setTextAlign('center');
    ctx.setTextBaseline('middle');
    ctx.fillText(completionRate + '%', centerX, centerY);
    
    // 绘制说明文本
    ctx.setFillStyle('#666666');
    ctx.setFontSize(14);
    ctx.fillText('本周训练完成率', centerX, centerY + radius + 20);
    
    // 绘制标题
    ctx.setFillStyle('#333333');
    ctx.setFontSize(14);
    ctx.setTextAlign('center');
    ctx.fillText('训练完成度统计', canvasWidth / 2, 15);
    
    ctx.draw();
  },
})