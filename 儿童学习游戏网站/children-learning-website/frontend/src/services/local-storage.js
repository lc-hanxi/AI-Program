// 本地存储服务 - 作为API不可用时的备份

// 数学游戏本地存储
const MATH_SCORES_KEY = 'math_scores';
export const mathLocalStorage = {
  saveScore: (mode, score, level) => {
    try {
      const newScore = { 
        mode, 
        score, 
        level, 
        timestamp: new Date().toISOString() 
      };
      
      // 获取现有分数
      const scoresStr = localStorage.getItem(MATH_SCORES_KEY);
      const scores = scoresStr ? JSON.parse(scoresStr) : [];
      
      // 添加新分数
      scores.push(newScore);
      
      // 保存回本地存储
      localStorage.setItem(MATH_SCORES_KEY, JSON.stringify(scores));
      
      return newScore;
    } catch (error) {
      console.error('Error saving math score to local storage:', error);
      return null;
    }
  },
  
  getScores: () => {
    try {
      const scoresStr = localStorage.getItem(MATH_SCORES_KEY);
      return scoresStr ? JSON.parse(scoresStr) : [];
    } catch (error) {
      console.error('Error reading math scores from local storage:', error);
      return [];
    }
  },
  
  getCampaignHighScore: () => {
    try {
      const scores = mathLocalStorage.getScores();
      const campaignScores = scores.filter(s => s.mode === 'campaign');
      
      if (campaignScores.length === 0) return { score: 0, level: 0 };
      
      return campaignScores.reduce((highest, current) => {
        return (current.level > highest.level || 
               (current.level === highest.level && current.score > highest.score)) 
               ? current : highest;
      }, { score: 0, level: 0 });
    } catch (error) {
      console.error('Error getting campaign high score from local storage:', error);
      return { score: 0, level: 0 };
    }
  },
  
  getChallengeHighScore: () => {
    try {
      const scores = mathLocalStorage.getScores();
      const challengeScores = scores.filter(s => s.mode === 'challenge');
      
      if (challengeScores.length === 0) return { score: 0 };
      
      return challengeScores.reduce((highest, current) => {
        return current.score > highest.score ? current : highest;
      }, { score: 0 });
    } catch (error) {
      console.error('Error getting challenge high score from local storage:', error);
      return { score: 0 };
    }
  }
};

// 英语游戏本地存储
const ENGLISH_SCORES_KEY = 'english_scores';
export const englishLocalStorage = {
  saveResult: (wordsCount, win) => {
    try {
      const newResult = { 
        wordsCount, 
        win, 
        timestamp: new Date().toISOString() 
      };
      
      // 获取现有结果
      const resultsStr = localStorage.getItem(ENGLISH_SCORES_KEY);
      const results = resultsStr ? JSON.parse(resultsStr) : [];
      
      // 添加新结果
      results.push(newResult);
      
      // 保存回本地存储
      localStorage.setItem(ENGLISH_SCORES_KEY, JSON.stringify(results));
      
      return newResult;
    } catch (error) {
      console.error('Error saving English result to local storage:', error);
      return null;
    }
  },
  
  getResults: () => {
    try {
      const resultsStr = localStorage.getItem(ENGLISH_SCORES_KEY);
      return resultsStr ? JSON.parse(resultsStr) : [];
    } catch (error) {
      console.error('Error reading English results from local storage:', error);
      return [];
    }
  },
  
  getStats: () => {
    try {
      const results = englishLocalStorage.getResults();
      
      if (results.length === 0) {
        return { total_words: 0, wins: 0, max_words: 0 };
      }
      
      const total_words = results.reduce((sum, r) => sum + r.wordsCount, 0);
      const wins = results.filter(r => r.win).length;
      const max_words = Math.max(...results.map(r => r.wordsCount));
      
      return { total_words, wins, max_words };
    } catch (error) {
      console.error('Error calculating English stats from local storage:', error);
      return { total_words: 0, wins: 0, max_words: 0 };
    }
  }
};

// 语文游戏本地存储
const CHINESE_SCORES_KEY = 'chinese_scores';
export const chineseLocalStorage = {
  saveScore: (score) => {
    try {
      const newScore = { 
        score, 
        timestamp: new Date().toISOString() 
      };
      
      // 获取现有分数
      const scoresStr = localStorage.getItem(CHINESE_SCORES_KEY);
      const scores = scoresStr ? JSON.parse(scoresStr) : [];
      
      // 添加新分数
      scores.push(newScore);
      
      // 保存回本地存储
      localStorage.setItem(CHINESE_SCORES_KEY, JSON.stringify(scores));
      
      return newScore;
    } catch (error) {
      console.error('Error saving Chinese score to local storage:', error);
      return null;
    }
  },
  
  getScores: () => {
    try {
      const scoresStr = localStorage.getItem(CHINESE_SCORES_KEY);
      return scoresStr ? JSON.parse(scoresStr) : [];
    } catch (error) {
      console.error('Error reading Chinese scores from local storage:', error);
      return [];
    }
  },
  
  getStats: () => {
    try {
      const scores = chineseLocalStorage.getScores();
      
      if (scores.length === 0) {
        return { high_score: 0, games_played: 0 };
      }
      
      const high_score = Math.max(...scores.map(s => s.score));
      const games_played = scores.length;
      
      return { high_score, games_played };
    } catch (error) {
      console.error('Error calculating Chinese stats from local storage:', error);
      return { high_score: 0, games_played: 0 };
    }
  }
}; 