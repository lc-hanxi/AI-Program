<template>
  <div class="home">
    <div class="header">
      <h1 class="welcome">欢迎来到小豆豆的学习乐园！</h1>
      <div class="weather">今天天气：{{ weather.condition }}，{{ weather.temperature }}°C</div>
      <div class="quote">"{{ quote.text }}"——{{ quote.author }}</div>
    </div>
    
    <div class="subject-cards">
      <div class="card math" @click="goToSubject('math')">
        <div class="card-icon">123</div>
        <div class="card-title">数学</div>
      </div>
      
      <div class="card english" @click="goToSubject('english')">
        <div class="card-icon">ABC</div>
        <div class="card-title">英语</div>
      </div>
      
      <div class="card chinese" @click="goToSubject('chinese')">
        <div class="card-icon">汉字</div>
        <div class="card-title">语文</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HomeView',
  data() {
    return {
      weather: {
        condition: '晴',
        temperature: 25
      },
      quote: {
        text: '学习是通向未来的钥匙',
        author: '爱因斯坦'
      }
    }
  },
  methods: {
    goToSubject(subject) {
      this.$router.push(`/${subject}`)
    }
  },
  mounted() {
    // 这里可以添加获取天气和名言的API调用
    // 由于是演示，目前使用的是静态数据
  }
}
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.header {
  margin-bottom: 40px;
  width: 100%;
  text-align: center;
}

.welcome {
  font-size: 2.5rem;
  color: #FF6B6B;
  margin-bottom: 10px;
}

.weather, .quote {
  margin: 10px 0;
  font-size: 1.2rem;
  color: #555;
}

.subject-cards {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 30px;
  width: 100%;
  max-width: 900px;
}

.card {
  width: 200px;
  height: 250px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.card:hover {
  transform: translateY(-10px);
  box-shadow: 0 12px 16px rgba(0, 0, 0, 0.2);
}

.card-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  font-weight: bold;
}

.card-title {
  font-size: 1.8rem;
  font-weight: bold;
}

.math {
  background-color: #A8E6CF;
  color: #30896A;
}

.english {
  background-color: #DCEDC1;
  color: #7D9655;
}

.chinese {
  background-color: #FFD3B6;
  color: #D68255;
}
</style> 