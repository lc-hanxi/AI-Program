<template>
  <div class="statistics">
    <h1 class="title">学习统计</h1>
    
    <div class="stats-container">
      <div class="stats-card">
        <h2 class="subject-title math">数学学习</h2>
        <div class="stat-item">
          <div class="stat-label">通关情况：</div>
          <div class="stat-value">{{ mathStats.level }}/3关</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">通关模式最高分：</div>
          <div class="stat-value">{{ mathStats.campaignHighScore }}分</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">挑战模式最高分：</div>
          <div class="stat-value">{{ mathStats.challengeHighScore }}分</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">最快通关时间：</div>
          <div class="stat-value">{{ mathStats.fastestTime }}秒</div>
        </div>
      </div>
      
      <div class="stats-card">
        <h2 class="subject-title english">英语学习</h2>
        <div class="stat-item">
          <div class="stat-label">累计拼对单词：</div>
          <div class="stat-value">{{ englishStats.wordsSpelled }}个</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">胜利次数：</div>
          <div class="stat-value">{{ englishStats.wins }}次</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">最多单词记录：</div>
          <div class="stat-value">{{ englishStats.maxWordsInGame }}个</div>
        </div>
      </div>
      
      <div class="stats-card">
        <h2 class="subject-title chinese">语文学习</h2>
        <div class="stat-item">
          <div class="stat-label">学习的生字：</div>
          <div class="stat-value">{{ chineseStats.charactersLearned }}个</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">游戏最高分：</div>
          <div class="stat-value">{{ chineseStats.highScore }}分</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">气球游戏次数：</div>
          <div class="stat-value">{{ chineseStats.gamesPlayed }}次</div>
        </div>
      </div>
    </div>
    
    <div class="ranking-section">
      <h2 class="ranking-title">历史最高分</h2>
      
      <div class="ranking-list">
        <div class="ranking-item">
          <div class="rank-subject math">数学 - 挑战模式</div>
          <div class="rank-score">{{ mathStats.challengeHighScore }}分</div>
          <div class="rank-date">{{ mathStats.challengeHighScoreDate }}</div>
        </div>
        
        <div class="ranking-item">
          <div class="rank-subject english">英语 - 龟兔赛跑</div>
          <div class="rank-score">{{ englishStats.maxWordsInGame }}个单词</div>
          <div class="rank-date">{{ englishStats.maxWordsDate }}</div>
        </div>
        
        <div class="ranking-item">
          <div class="rank-subject chinese">语文 - 气球游戏</div>
          <div class="rank-score">{{ chineseStats.highScore }}分</div>
          <div class="rank-date">{{ chineseStats.highScoreDate }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { mathAPI, englishAPI, chineseAPI } from '../services/api'

export default {
  name: 'StatisticsView',
  setup() {
    // 数学统计数据
    const mathStats = ref({
      level: 0,
      campaignHighScore: 0,
      challengeHighScore: 0,
      fastestTime: 0,
      challengeHighScoreDate: '2023-04-01'
    })
    
    // 英语统计数据
    const englishStats = ref({
      wordsSpelled: 0,
      wins: 0,
      maxWordsInGame: 0,
      maxWordsDate: '2023-04-02'
    })
    
    // 语文统计数据
    const chineseStats = ref({
      charactersLearned: 8, // 生字库中的字数
      highScore: 0,
      gamesPlayed: 0,
      highScoreDate: '2023-04-03'
    })
    
    // 获取数学统计数据
    const fetchMathStats = async () => {
      try {
        // 获取挑战模式最高分
        const challengeData = await mathAPI.getChallengeHighScore();
        if (challengeData && challengeData.score) {
          mathStats.value.challengeHighScore = challengeData.score;
          mathStats.value.challengeHighScoreDate = formatDate(new Date(challengeData.date));
        }

        // 获取通关模式最高分
        const campaignData = await mathAPI.getCampaignHighScore();
        if (campaignData && campaignData.score) {
          mathStats.value.campaignHighScore = campaignData.score;
          mathStats.value.level = campaignData.level || 0;
        }
      } catch (error) {
        console.error("Error fetching math stats: ", error);
      }
    }
    
    // 获取英语统计数据
    const fetchEnglishStats = async () => {
      try {
        const stats = await englishAPI.getStats();
        if (stats) {
          englishStats.value.wordsSpelled = stats.total_words || 0;
          englishStats.value.wins = stats.wins || 0;
          englishStats.value.maxWordsInGame = stats.max_words || 0;
          
          // 获取最高分记录的日期
          const results = await englishAPI.getResults();
          if (results && results.length > 0) {
            // 找到单词数最多的记录
            const maxWordsResult = results.reduce((max, current) => 
              current.words_count > max.words_count ? current : max, results[0]);
            
            englishStats.value.maxWordsDate = formatDate(new Date(maxWordsResult.date));
          }
        }
      } catch (error) {
        console.error("Error fetching english stats: ", error);
      }
    }
    
    // 获取语文统计数据
    const fetchChineseStats = async () => {
      try {
        const stats = await chineseAPI.getStats();
        if (stats) {
          chineseStats.value.highScore = stats.high_score || 0;
          chineseStats.value.gamesPlayed = stats.games_played || 0;
          
          // 获取最高分记录的日期
          const scores = await chineseAPI.getScores();
          if (scores && scores.length > 0) {
            // 找到分数最高的记录
            const highScoreRecord = scores.reduce((max, current) => 
              current.score > max.score ? current : max, scores[0]);
            
            chineseStats.value.highScoreDate = formatDate(new Date(highScoreRecord.date));
          }
        }
      } catch (error) {
        console.error("Error fetching chinese stats: ", error);
      }
    }
    
    // 格式化日期
    const formatDate = (date) => {
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    }
    
    // 初始化模拟数据
    const initMockData = () => {
      // 模拟数据 - 实际项目中应该使用API数据
      mathStats.value = {
        level: 2,
        campaignHighScore: 150,
        challengeHighScore: 200,
        fastestTime: 45,
        challengeHighScoreDate: '2023-04-01'
      }
      
      englishStats.value = {
        wordsSpelled: 25,
        wins: 3,
        maxWordsInGame: 8,
        maxWordsDate: '2023-04-02'
      }
      
      chineseStats.value = {
        charactersLearned: 8,
        highScore: 120,
        gamesPlayed: 5,
        highScoreDate: '2023-04-03'
      }
    }
    
    // 组件挂载时获取数据
    onMounted(() => {
      // 尝试从API获取数据
      fetchMathStats();
      fetchEnglishStats();
      fetchChineseStats();
      
      // 如果无法获取API数据，使用模拟数据
      setTimeout(() => {
        if (mathStats.value.challengeHighScore === 0) {
          initMockData();
        }
      }, 1000);
    })
    
    return {
      mathStats,
      englishStats,
      chineseStats
    }
  }
}
</script>

<style scoped>
.statistics {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.title {
  font-size: 2.5rem;
  color: #3F51B5;
  margin-bottom: 40px;
}

.stats-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 30px;
  width: 100%;
  max-width: 1200px;
  margin-bottom: 50px;
}

.stats-card {
  width: 300px;
  padding: 20px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.subject-title {
  font-size: 1.8rem;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid;
}

.subject-title.math {
  color: #4CAF50;
  border-color: #4CAF50;
}

.subject-title.english {
  color: #2196F3;
  border-color: #2196F3;
}

.subject-title.chinese {
  color: #FF9800;
  border-color: #FF9800;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  font-size: 1.1rem;
}

.stat-label {
  color: #666;
}

.stat-value {
  font-weight: bold;
  color: #333;
}

.ranking-section {
  width: 100%;
  max-width: 800px;
}

.ranking-title {
  font-size: 2rem;
  color: #3F51B5;
  margin-bottom: 20px;
  text-align: center;
}

.ranking-list {
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.ranking-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #eee;
}

.ranking-item:last-child {
  border-bottom: none;
}

.rank-subject {
  font-weight: bold;
  width: 40%;
  padding-left: 10px;
  border-left: 5px solid;
}

.rank-subject.math {
  color: #4CAF50;
  border-color: #4CAF50;
}

.rank-subject.english {
  color: #2196F3;
  border-color: #2196F3;
}

.rank-subject.chinese {
  color: #FF9800;
  border-color: #FF9800;
}

.rank-score {
  font-weight: bold;
  font-size: 1.2rem;
}

.rank-date {
  color: #666;
}
</style> 