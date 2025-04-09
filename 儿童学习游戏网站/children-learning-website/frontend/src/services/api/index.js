// API服务模块 - 使用axios客户端，支持本地存储备份
import apiClient from './axios-client';
import { mathLocalStorage, englishLocalStorage, chineseLocalStorage } from '../local-storage';

// 通用API错误处理
const handleApiError = async (apiCall, fallbackMethod, ...args) => {
  try {
    return await apiCall();
  } catch (error) {
    console.warn('API调用失败，使用本地存储备份:', error);
    // 使用本地存储作为备份
    return fallbackMethod(...args);
  }
};

// 数学游戏API
export const mathAPI = {
  // 保存分数
  saveScore: async (mode, score, level) => {
    return handleApiError(
      () => apiClient.post('/math-scores', { mode, score, level }),
      mathLocalStorage.saveScore,
      mode, score, level
    );
  },

  // 获取所有分数
  getScores: async () => {
    return handleApiError(
      () => apiClient.get('/math-scores'),
      mathLocalStorage.getScores
    );
  },

  // 获取通关最高分
  getCampaignHighScore: async () => {
    return handleApiError(
      () => apiClient.get('/math-scores/campaign/highest'),
      mathLocalStorage.getCampaignHighScore
    );
  },

  // 获取挑战最高分
  getChallengeHighScore: async () => {
    return handleApiError(
      () => apiClient.get('/math-scores/challenge/highest'),
      mathLocalStorage.getChallengeHighScore
    );
  }
};

// 英语游戏API
export const englishAPI = {
  // 保存游戏结果
  saveResult: async (wordsCount, win) => {
    return handleApiError(
      () => apiClient.post('/english-scores', { wordsCount, win }),
      englishLocalStorage.saveResult,
      wordsCount, win
    );
  },

  // 获取所有结果
  getResults: async () => {
    return handleApiError(
      () => apiClient.get('/english-scores'),
      englishLocalStorage.getResults
    );
  },

  // 获取游戏统计
  getStats: async () => {
    return handleApiError(
      () => apiClient.get('/english-scores/stats'),
      englishLocalStorage.getStats
    );
  }
};

// 语文游戏API
export const chineseAPI = {
  // 保存分数
  saveScore: async (score) => {
    return handleApiError(
      () => apiClient.post('/chinese-scores', { score }),
      chineseLocalStorage.saveScore,
      score
    );
  },

  // 获取所有分数
  getScores: async () => {
    return handleApiError(
      () => apiClient.get('/chinese-scores'),
      chineseLocalStorage.getScores
    );
  },

  // 获取游戏统计
  getStats: async () => {
    return handleApiError(
      () => apiClient.get('/chinese-scores/stats'),
      chineseLocalStorage.getStats
    );
  }
}; 