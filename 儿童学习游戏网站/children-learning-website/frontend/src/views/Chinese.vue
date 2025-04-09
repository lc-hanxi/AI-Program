<template>
  <audio ref="backgroundMusicRef" loop>
    <source src="../assets/sounds/background.wav" type="audio/wav">
  </audio>
  <audio ref="correctSoundRef">
    <source src="../assets/sounds/correct.wav" type="audio/wav">
  </audio>
  <audio ref="wrongSoundRef">
    <source src="../assets/sounds/wrong.mp3" type="audio/mpeg">
  </audio>
  <audio ref="poemAudioRef"></audio>
  <audio ref="charAudioRef"></audio>

  <div class="chinese-learning full-screen-game">
    <h1 class="title">生字大冒险</h1>
    
    <div class="tabs">
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'learn' }" 
        @click="activeTab = 'learn'"
      >
        学习
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'game' }" 
        @click="activeTab = 'game'"
      >
        游戏
      </button>
    </div>
    
    <!-- 学习部分 -->
    <div v-if="activeTab === 'learn' && currentCharacterData" class="learn-section">
      <div v-if="loadingChars" class="loading">加载中...</div>
      <div v-else-if="!charsFromAPI || charsFromAPI.length === 0" class="error-message">
          无法加载汉字数据，请检查后台配置。
      </div>
      <template v-else>
      <div class="character-card">
              <div class="character">{{ currentCharacterData.character }}</div>
              <img v-if="currentCharacterData.image_url" :src="getServerFileUrl(currentCharacterData.image_url)" alt="汉字图片" class="learn-char-image">
      </div>
      
      <div class="poem-section">
              <h3>相关儿歌/古诗</h3>
              <div class="poem">{{ currentCharacterData.poem_or_song || '暂无' }}</div>
              <button class="read-btn" @click="readPoem" :disabled="!currentCharacterData.poem_audio_url">
          <span class="read-icon">🔊</span> 朗读
        </button>
      </div>
      
      <div class="navigation">
        <button class="nav-btn" @click="prevCharacter">上一个</button>
        <button class="nav-btn" @click="nextCharacter">下一个</button>
      </div>
      </template>
    </div>
     <div v-else-if="activeTab === 'learn' && loadingChars" class="learn-section loading">
        加载汉字数据中...
    </div>
     <div v-else-if="activeTab === 'learn' && (!charsFromAPI || charsFromAPI.length === 0)" class="learn-section error-message">
        加载汉字数据失败或字库为空。
    </div>
    
    <!-- 游戏部分 -->
    <div v-if="activeTab === 'game'" class="game-section">
      <div v-if="!gameStarted" class="start-screen">
        <div class="game-instruction">
          <p>点击与生字"{{ targetCharacter }}"相同的气球，获得分数！</p>
          <p>小心，气球会越来越快哦～</p>
        </div>
        <button class="start-btn" @click="startGame">开始游戏</button>
      </div>
      
      <div v-else class="game-container">
        <div class="game-area" :style="{ backgroundImage: `url(${currentBackground})` }">
        <div class="game-info">
          <div class="target-char">目标生字: {{ targetCharacter }}</div>
            <div class="level-display">关卡: {{ level }}</div>
          <div class="timer">时间: {{ gameTimer }}秒</div>
          <div class="score">得分: {{ gameScore }}</div>
        </div>
        
          <div class="balloons-container" ref="balloonsContainerRef">
          <div 
              v-for="(balloon) in balloons" 
              :key="balloon.id" 
            class="balloon"
              :class="{ exploded: balloon.exploded }"
            :style="{
              left: `${balloon.x}%`,
                bottom: `${balloon.y}%`,
                'animation-duration': `${balloon.duration}s`, 
                filter: `hue-rotate(${balloon.hueRotate}deg)`
            }"
              @click="popBalloon(balloon)"
              @animationiteration="handleBalloonLoop(balloon.id)"
          >
              <img :src="balloon.imageSrc" alt="Balloon" class="balloon-image">
              <span class="balloon-char-overlay">{{ balloon.char }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="gameOver" class="game-over">
        <h2>{{ gameOverMessage }}</h2>
        <div class="final-score">最终得分: {{ gameScore }}</div>
        <div class="buttons">
        <button class="restart-btn" @click="resetGame">再玩一次</button>
            <button class="exit-btn" @click="exitGame">退出游戏</button>
      </div>
      </div>

      <!-- 移动关卡完成界面到这里 -->
      <div v-if="levelComplete" class="level-complete">
        <h2>太棒了！完成第 {{ level }} 关!</h2>
        <div class="buttons">
          <button class="next-btn" @click="goToNextLevel">下一关</button>
          <button class="exit-btn" @click="exitGame">退出游戏</button>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted, computed, onUpdated, onBeforeUpdate, watch } from 'vue'
import axios from 'axios'
// import chineseBackground from '../assets/images/background/airadventurelevel1.png' // 旧的单个背景导入
// 导入多个背景图
import airadventurelevel1 from '../assets/images/background/airadventurelevel1.png'
import airadventurelevel2 from '../assets/images/background/airadventurelevel2.png'
import airadventurelevel3 from '../assets/images/background/airadventurelevel3.png'
import airadventurelevel4 from '../assets/images/background/airadventurelevel4.png'
// 移除旧的气球图片导入
// import blueBalloonsImage from '../assets/images/blue-balloons-2.png';
// 导入新的多个气球图片
import blueBalloon from '../assets/images/balloons/blue-balloon.png';
import greenBalloon from '../assets/images/balloons/green-balloon.png';
import pinkBalloon from '../assets/images/balloons/pink-balloon.png';
import yellowBalloon from '../assets/images/balloons/yellow-balloon.png';

// 将导入的图片放入数组
const balloonImages = [blueBalloon, greenBalloon, pinkBalloon, yellowBalloon];

export default {
  name: 'ChineseLearning',
  setup() {
    // 当前标签
    const activeTab = ref('learn')
    
    // --- API 数据 --- 
    const charsFromAPI = ref([]);
    const chineseLevels = ref([]);
    const loadingChars = ref(false);
    const loadingLevels = ref(false);
    const apiError = ref('');
    // ----------------

    // --- 学习模式状态 ---
    const currentLearnIndex = ref(0);
    const currentCharacterData = computed(() => {
        if (!charsFromAPI.value || charsFromAPI.value.length === 0) return null;
        return charsFromAPI.value[currentLearnIndex.value];
    });
    const poemAudioRef = ref(null);
    // -------------------
    
    // 游戏相关状态
    const gameStarted = ref(false)
    const gameOver = ref(false)
    const gameTimer = ref(60)
    const gameScore = ref(0)
    const targetCharacter = ref('')
    const targetCharacterData = ref(null)
    const balloons = ref([])
    const level = ref(1); // 添加关卡状态
    const gameInterval = ref(null)
    const balloonInterval = ref(null)
    const balloonsContainerRef = ref(null); // 添加容器 ref
    const levelComplete = ref(false);
    const nextBalloonId = ref(0);
    const charAudioRef = ref(null);
    const MAX_LEVEL = 4; // 与后台配置一致或动态获取
    const gameOverMessage = ref(''); // 新增：游戏结束信息
    
    // --- 音效 Refs ---
    const backgroundMusicRef = ref(null)
    const correctSoundRef = ref(null)
    const wrongSoundRef = ref(null)

    // --- 计算属性：当前背景 --- (根据关卡选择)
    const currentBackground = computed(() => {
      const backgrounds = [airadventurelevel1, airadventurelevel2, airadventurelevel3, airadventurelevel4];
      // 确保 level 值在有效范围内
      const levelIndex = Math.max(0, Math.min(level.value - 1, backgrounds.length - 1));
      return backgrounds[levelIndex]; 
    });
    
    // --- 音效函数 (从 English.vue 复制并稍作修改) ---
    const playSound = (isCorrect) => {
      try {
        const soundRef = isCorrect ? correctSoundRef : wrongSoundRef;
        const soundName = isCorrect ? '正确' : '错误';
        console.log(`尝试播放 ${soundName} 音效 (Chinese)`);
        if (soundRef.value) {
          soundRef.value.currentTime = 0;
          const playPromise = soundRef.value.play();
          if (playPromise !== undefined) {
            playPromise.catch(err => {
              console.error(`播放 ${soundName} 音效失败 (Chinese):`, err);
            });
          }
        } else {
           console.error(`playSound: ${soundName} 音效引用无效 (Chinese)`);
        }
      } catch (error) {
        console.error('播放音效时出错 (Chinese):', error);
      }
    };

    const playBackgroundMusic = () => {
      console.log('尝试播放背景音乐 (Chinese)');
      if (backgroundMusicRef.value) {
        try {
          backgroundMusicRef.value.currentTime = 0;
          backgroundMusicRef.value.volume = 0.5; // Adjust volume as needed
          const playPromise = backgroundMusicRef.value.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
               console.log('背景音乐播放成功 (Chinese)');
            }).catch(error => {
              console.error('背景音乐播放失败 (Chinese):', error);
            });
          }
        } catch (error) {
          console.error('播放背景音乐时发生错误 (Chinese):', error);
        }
      } else {
        console.error('playBackgroundMusic: 背景音乐引用无效 (Chinese)');
      }
    };

    const stopAllAudio = () => {
      console.log('停止所有音频 (Chinese)');
      if (backgroundMusicRef.value && !backgroundMusicRef.value.paused) {
        backgroundMusicRef.value.pause();
        backgroundMusicRef.value.currentTime = 0;
        console.log('背景音乐已停止 (Chinese)');
      }
      if (correctSoundRef.value && !correctSoundRef.value.paused) {
        correctSoundRef.value.pause();
        correctSoundRef.value.currentTime = 0;
      }
      if (wrongSoundRef.value && !wrongSoundRef.value.paused) {
        wrongSoundRef.value.pause();
        wrongSoundRef.value.currentTime = 0;
      }
      if (poemAudioRef.value && !poemAudioRef.value.paused) {
        poemAudioRef.value.pause();
        poemAudioRef.value.currentTime = 0;
      }
      if (charAudioRef.value && !charAudioRef.value.paused) {
        charAudioRef.value.pause();
        charAudioRef.value.currentTime = 0;
      }
    };
    
    // 开始游戏
    const startGame = async () => {
      console.log("开始语文游戏..."); // 添加日志
      gameStarted.value = true
      gameOver.value = false
      gameTimer.value = 60
      gameScore.value = 0
      level.value = 1; // 重置关卡
      balloons.value = []; // 清空气球
      
      // 加载数据 (如果还没加载)
      loadingChars.value = true;
      loadingLevels.value = true;
      await Promise.all([fetchChineseChars(), fetchChineseLevels()]);
      loadingChars.value = false;
      loadingLevels.value = false;

       if (apiError.value || charsFromAPI.value.length === 0) {
          gameOver.value = true;
          gameStarted.value = false; 
          return;
      }

      setTargetCharacter(); 
      playBackgroundMusic();
      
      // 游戏主计时器
      gameInterval.value = setInterval(() => {
        if (gameTimer.value > 0) {
          gameTimer.value--;
        } else {
          gameOver.value = true;
          stopAllAudio();
          clearTimers();
        }
      }, 1000)

      // 定时生成气球
      const balloonSpawnRate = Math.max(500, 2000 - (level.value * 200)); 
      balloonInterval.value = setInterval(addBalloons, balloonSpawnRate);
    }
    
    // 设置目标汉字
    const setTargetCharacter = () => {
      if (charsFromAPI.value.length === 0) return;
      // 简单地从可用汉字中随机选一个
      const availableChars = charsFromAPI.value; // 可以根据关卡过滤
      const randomIndex = Math.floor(Math.random() * availableChars.length);
      targetCharacterData.value = availableChars[randomIndex];
      targetCharacter.value = targetCharacterData.value.character;
      console.log('Target character set:', targetCharacter.value);
    }

    // 添加气球 (修改：使用配置数量和速度)
    const addBalloons = () => {
        if (balloons.value.length >= 15) return; // 限制屏幕上的气球总数

        const count = currentLevelSettings.value.balloons_per_wave;
        const baseSpeed = currentLevelSettings.value.balloon_speed; // 这是速度值，需要转换为动画时长
        // 假设速度值越大，动画时间越短。需要一个基准来转换。
        // 例如，速度 50 对应 10 秒动画，速度 100 对应 5 秒动画。
        // duration = base_duration * (base_speed / current_speed)
        const baseAnimDuration = 10; // 秒
        const baseSpeedRef = 50;
        const duration = Math.max(3, baseAnimDuration * (baseSpeedRef / baseSpeed)); // 最少3秒动画

        const containerWidth = balloonsContainerRef.value?.offsetWidth || window.innerWidth;

      for (let i = 0; i < count; i++) {
            if (charsFromAPI.value.length === 0) break; // 没有汉字可选

            // 随机选择一个汉字 (包含目标汉字的可能性)
            let charToShow;
            // 保证目标汉字一定概率出现
            if (Math.random() < 0.4 || balloons.value.filter(b => b.char === targetCharacter.value).length === 0) { 
                charToShow = targetCharacter.value;
        } else {
                // 选择干扰项 (添加检查和安全计数器)
                if (charsFromAPI.value.length > 1) {
                    let randomCharIndex;
                    let safetyCounter = 0;
                    const maxLoopAttempts = 50; // 安全限制
                    do {
                        safetyCounter++;
                        randomCharIndex = Math.floor(Math.random() * charsFromAPI.value.length);
                        if (safetyCounter > maxLoopAttempts) {
                            console.warn("Distractor character selection loop safety break! Defaulting to target.");
                            charToShow = targetCharacter.value; // 无法找到干扰项，使用目标字
                            break; // 跳出 do...while
                        }
                    } while (charsFromAPI.value[randomCharIndex].character === targetCharacter.value);
                    
                    // 只有在安全计数器内完成时才赋值
                    if (safetyCounter <= maxLoopAttempts) {
                         charToShow = charsFromAPI.value[randomCharIndex].character;
                    }
                } else {
                    // 如果只有一个汉字，则无法选择干扰项，只能用目标字
                    charToShow = targetCharacter.value;
                }
            }

            const balloon = {
                id: nextBalloonId.value++,
                char: charToShow,
                x: Math.random() * 90, // 0-90% 水平位置
                y: -10, // 从底部开始
                speed: duration, // 控制动画时长
                duration: duration, // 将计算出的动画时长存起来
                exploded: false,
                imageSrc: balloonImages[Math.floor(Math.random() * balloonImages.length)],
                hueRotate: Math.random() * 360
            };
            balloons.value.push(balloon);
      }
    }
    
    // 点击气球
    const popBalloon = (balloon) => {
      if (balloon.exploded) return;

      balloon.exploded = true;

      if (balloon.char === targetCharacter.value) {
        // playSound(true); // 移除正确音效
        gameScore.value += 10; // 加分

        // 播放生字音频
        if (targetCharacterData.value && targetCharacterData.value.char_audio_url && charAudioRef.value) {
            const audioSrc = getServerFileUrl(targetCharacterData.value.char_audio_url);
             if (audioSrc) {
                console.log(`播放生字音频: ${audioSrc}`);
                charAudioRef.value.src = audioSrc;
                const playPromise = charAudioRef.value.play();
                if (playPromise !== undefined) {
                    playPromise.catch(err => {
                        console.error(`播放生字 ${targetCharacter.value} 音频失败:`, err);
                    });
                }
            } else {
                 console.warn(`生字 ${targetCharacter.value} 的音频路径无效`);
            }
        } else {
             console.warn('无法播放生字音频：数据或引用无效');
        }

        // --- 新增：击中正确后立即更换目标汉字 ---
        setTargetCharacter(); 
        // ---------------------------------------
        
        // --- 新增：检查分数是否达到过关条件 ---
        if (gameScore.value >= 100) {
           if (level.value < MAX_LEVEL) {
               // 完成当前关卡
               console.log(`Level ${level.value} complete by score!`);
               levelComplete.value = true;
               clearTimers(); // 停止生成气球和倒计时
               stopAllAudio(); // 停止背景音乐等
           } else {
               // 完成最后一关
               console.log("All levels complete by score!");
               endGame('恭喜你，完成了所有关卡！'); // 调用 endGame 显示通关信息
           }
        }
        // -------------------------------------

      } else {
        gameScore.value = Math.max(0, gameScore.value - 5); // 减分
      }
      
      // 移除气球（延迟 ताकि 爆炸效果可见）
      setTimeout(() => {
        balloons.value = balloons.value.filter(b => b.id !== balloon.id);
      }, 300); // 爆炸效果持续时间
    }
    
    // 结束游戏 (计时结束或最后一关胜利)
    const endGame = (message = '时间到！') => { 
      if (gameOver.value || levelComplete.value) return; 

      console.log("游戏结束:", message);
      gameOverMessage.value = message; // 设置结束信息
      gameOver.value = true
      levelComplete.value = false; 
      clearInterval(gameInterval.value)
      clearInterval(balloonInterval.value)
      stopAllAudio();
      saveGameResult();
    }
    
    // 保存游戏结果
    const saveGameResult = async () => {
      try {
        await axios.post('/api/chinese/saveScore', { score: gameScore.value })
      } catch (error) {
        console.error("Error saving game result: ", error)
      }
    }
    
    // --- 新增：进入下一关 ---
    const goToNextLevel = () => {
        if (level.value < MAX_LEVEL) {
            level.value++;
            levelComplete.value = false;
            // --- 添加：重置分数 ---
            gameScore.value = 0;
            // ---------------------
            gameTimer.value = 60; // 重置计时器
            balloons.value = []; // 清空气球
            nextBalloonId.value = 0;
            clearTimers();
            stopAllAudio();
            // ... 重置音频 ...

            setTargetCharacter();
            playBackgroundMusic();
            // 重启计时器
             gameInterval.value = setInterval(() => {
                if (gameTimer.value > 0) gameTimer.value--;
                else { /* game over */ clearTimers(); stopAllAudio(); gameOver.value = true; }
            }, 1000);
            const balloonSpawnRate = Math.max(500, 2000 - (level.value * 200)); 
            balloonInterval.value = setInterval(addBalloons, balloonSpawnRate);
        } else {
            // 已经是最后一关，触发通关
            console.log("Attempted goToNextLevel from final level. Triggering win.");
            endGame('恭喜你，完成了所有关卡！'); // 调用 endGame
            // gameOver.value = true; // 由 endGame 处理
            // stopAllAudio(); // 由 endGame 处理
            // clearTimers(); // 由 endGame 处理
        }
    };

    // --- 新增：退出游戏（从关卡完成界面）---
    const exitGame = () => {
        console.log("退出语文游戏...");
        gameOver.value = false; 
        levelComplete.value = false;
        gameStarted.value = false; // 返回开始界面
        resetGame(false); // 调用重置，但不自动开始
    };

    // --- 重新添加：重置游戏 (添加参数决定是否立即开始) ---
    const resetGame = (autoStart = true) => {
      console.log("重置语文游戏状态...");
      clearInterval(gameInterval.value);
      clearInterval(balloonInterval.value);
      stopAllAudio(); 
      
      gameStarted.value = false; // 确保重置时不在游戏进行中
      gameOver.value = false;
      levelComplete.value = false;
      gameTimer.value = 60;
      gameScore.value = 0;
      level.value = 1;
      targetCharacter.value = '';
      balloons.value = [];

      if (autoStart) {
         // startGame 内部会设置 gameStarted = true 并开始游戏
         // 延迟一点启动，确保状态完全重置
         setTimeout(startGame, 100);
      } else {
         // 如果不自动开始，确保停止所有音频
         stopAllAudio();
      }
    }
    
    // --- 生命周期钩子，用于音频清理 ---
    onMounted(() => {
      console.log('Chinese Learning Component Mounted.');
      const handlePopState = () => { stopAllAudio(); };
      const handleBeforeUnload = () => { stopAllAudio(); };
      const handleLinkClick = (e) => {
         if (e.target.tagName === 'A' || e.target.closest('a')) { stopAllAudio(); }
      };
      window.addEventListener('popstate', handlePopState);
      window.addEventListener('beforeunload', handleBeforeUnload);
      document.addEventListener('click', handleLinkClick);

      // Store listeners for removal
    onUnmounted(() => {
         window.removeEventListener('popstate', handlePopState);
         window.removeEventListener('beforeunload', handleBeforeUnload);
         document.removeEventListener('click', handleLinkClick);
         stopAllAudio(); // 组件卸载时也停止音频
      });
    });

    onUnmounted(() => {
      console.log('Chinese Learning Component Unmounting.');
      // 清理定时器
      clearInterval(gameInterval.value);
      clearInterval(balloonInterval.value);
      stopAllAudio(); // 确保卸载时停止所有音频
    });
    
    // --- 处理气球动画结束 --- (统一处理移除)
    const handleBalloonLoop = (id) => {
      console.log(`Balloon ${id} finished loop (reached top)`);
      // 移除到达顶部的气球
      balloons.value = balloons.value.filter(b => b.id !== id);
      // 如果是目标汉字的气球到达顶部，可以考虑扣分或某种惩罚
      // if (balloonCharacter === targetCharacter.value) { ... }
    };
    
    // --- 生命周期钩子 (移除 onUpdated) ---
    /*
    onUpdated(() => {
        // 不再需要管理 balloonRefs
    });
    */
    
    const currentLevelSettings = computed(() => {
        if (loadingLevels.value || chineseLevels.value.length === 0) {
            // 默认值
            return { level: level.value, balloon_speed: 50.0, balloons_per_wave: 3 };
        }
        const settings = chineseLevels.value.find(l => l.level === level.value);
        return settings || chineseLevels.value[chineseLevels.value.length - 1] || { level: level.value, balloon_speed: 50.0, balloons_per_wave: 3 };
    });

    const getServerFileUrl = (relativePath) => {
      // return relativePath ? `${SERVER_BASE_URL}${relativePath}` : null;
      // Modify: Return relative path directly
      return relativePath ? relativePath : '';
    };

    const updateCurrentCharacterDisplay = () => { 
        // 这个函数不再需要，直接使用 currentCharacterData 计算属性
    };

    const prevCharacter = () => {
      if (charsFromAPI.value.length > 0) {
        currentLearnIndex.value = (currentLearnIndex.value - 1 + charsFromAPI.value.length) % charsFromAPI.value.length;
        stopPoemAudio(); // 切换时停止诗歌朗读
      }
    };

    const nextCharacter = () => {
      if (charsFromAPI.value.length > 0) {
        currentLearnIndex.value = (currentLearnIndex.value + 1) % charsFromAPI.value.length;
        stopPoemAudio(); // 切换时停止诗歌朗读
      }
    };

    const readPoem = () => {
      if (poemAudioRef.value && currentCharacterData.value && currentCharacterData.value.poem_audio_url) {
        const audioUrl = getServerFileUrl(currentCharacterData.value.poem_audio_url);
        console.log(`播放儿歌/古诗音频: ${audioUrl}`);
        if (audioUrl) {
            try {
                poemAudioRef.value.src = audioUrl;
                poemAudioRef.value.play().catch(e => console.error('播放诗歌音频失败:', e));
            } catch (error) {
                console.error('设置或播放诗歌音频时出错:', error);
            }
        }
      }
    };

    const stopPoemAudio = () => {
        if (poemAudioRef.value && !poemAudioRef.value.paused) {
            poemAudioRef.value.pause();
            poemAudioRef.value.currentTime = 0;
        }
    };

    // --- API 调用 ---
     const fetchChineseChars = async () => {
        loadingChars.value = true;
        apiError.value = '';
        try {
            // Change to relative path
            const response = await axios.get('/api/chinese/chars');
            charsFromAPI.value = response.data;
            console.log("Chinese chars fetched:", charsFromAPI.value.length);
            // If fetched successfully, reset index to ensure currentCharacterData updates
            if (charsFromAPI.value.length > 0) {
                currentLearnIndex.value = 0;
            }
        } catch (error) {
            console.error('Error fetching chinese chars:', error);
            apiError.value = `加载汉字数据失败: ${error.message}`;
            charsFromAPI.value = []; // Ensure it's an empty array on error
        } finally {
            loadingChars.value = false;
        }
    };

    const fetchChineseLevels = async () => {
        loadingLevels.value = true;
        apiError.value = '';
        try {
            // Change to relative path
            const response = await axios.get('/api/chinese/levels');
            chineseLevels.value = response.data;
            console.log("Chinese levels fetched:", chineseLevels.value);
        } catch (error) {
            console.error('Error fetching chinese levels:', error);
            apiError.value = `加载关卡数据失败: ${error.message}`;
            chineseLevels.value = [];
        } finally {
            loadingLevels.value = false;
        }
    };
    // ---------------

    // 组件挂载时获取数据
    onMounted(() => {
      console.log('Chinese component mounted');
      fetchChineseChars();
      fetchChineseLevels();
    });
    
    // 组件卸载时清理
    onUnmounted(() => {
      console.log('Chinese component unmounting');
      stopAllAudio();
      clearTimers();
    });

    // 监听 activeTab 变化，如果切换到游戏且未开始，可能需要重置某些状态或预加载
    watch(activeTab, (newTab) => {
        stopAllAudio(); // 切换标签时停止所有音频
        clearTimers(); // 切换标签时清除游戏计时器
        if (newTab === 'game' && !gameStarted.value) {
            // 可以选择在这里预设目标汉字等
        } else if (newTab === 'learn') {
             // 如果从游戏切回学习，重置游戏状态
             gameStarted.value = false;
             gameOver.value = false;
             levelComplete.value = false;
        }
    });

    const clearTimers = () => {
        if (gameInterval.value) clearInterval(gameInterval.value);
        if (balloonInterval.value) clearInterval(balloonInterval.value);
        gameInterval.value = null;
        balloonInterval.value = null;
    };
    
    return {
      activeTab,
      currentCharacterData,
      prevCharacter,
      nextCharacter,
      readPoem,
      poemAudioRef,
      loadingChars,
      charsFromAPI,
      getServerFileUrl,
      gameStarted,
      gameOver,
      gameTimer,
      gameScore,
      targetCharacter,
      balloons,
      level,
      levelComplete,
      startGame,
      popBalloon,
      resetGame,
      goToNextLevel,
      exitGame,
      currentBackground,
      balloonsContainerRef,
      backgroundMusicRef,
      correctSoundRef,
      wrongSoundRef,
      charAudioRef,
      loadingLevels,
      apiError,
      clearTimers,
      handleBalloonLoop,
      gameOverMessage,
    }
  }
}
</script>

<style scoped>
.full-screen-game {
  width: 100%;
  min-height: 100vh;
}

.chinese-learning {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100vh;
  padding: 20px;
  background-color: #FFF8E1;
}

.title {
  color: #FF9800;
  font-size: 2.5rem;
  margin-bottom: 30px;
}

.tabs {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
}

.tab-btn {
  padding: 10px 30px;
  font-size: 1.2rem;
  background-color: #FFE0B2;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s;
}

.tab-btn.active {
  background-color: #FF9800;
  color: white;
}

.learn-section {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

/* 学习部分样式 */
.character-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
}

.character {
  font-size: 6rem;
  font-weight: bold;
  color: #E65100;
}

.pinyin {
  font-size: 1.5rem;
  margin-top: 10px;
  color: #555;
}

.poem-section {
  background-color: white;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.poem-section h3 {
  color: #E65100;
  margin-bottom: 10px;
}

.poem {
  font-size: 1.2rem;
  margin-bottom: 20px;
  line-height: 1.8;
}

.read-btn {
  display: flex;
  align-items: center;
  padding: 8px 15px;
  background-color: #FF9800;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.read-btn:hover {
  background-color: #F57C00;
}

.read-icon {
  margin-right: 8px;
}

.navigation {
  display: flex;
  justify-content: space-between;
}

.nav-btn {
  padding: 10px 20px;
  background-color: #FF9800;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.nav-btn:hover {
  background-color: #F57C00;
}

/* 游戏部分样式 */
.start-screen {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex-grow: 1;
  text-align: center;
}

.game-instruction {
  margin-bottom: 20px;
  font-size: 1.2rem;
}

.start-btn {
  padding: 15px 30px;
  font-size: 1.5rem;
  background-color: #FF9800;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.2s;
}

.start-btn:hover {
  transform: scale(1.05);
}

.game-container {
  width: 100%;
  max-width: 1600px;
  height: 80vh;
  display: flex;
  flex-direction: column;
  margin: 0 auto;
}

.game-area {
  flex: 1;
  background-color: #D0E7FF;
  background-size: cover;
  background-position: center bottom;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  margin-bottom: 20px;
  position: relative;
  overflow: hidden;
}

.game-info {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  margin-bottom: 15px;
  font-size: 1.1rem;
  font-weight: bold;
}

.level-display { /* 可以添加特定样式 */ }

.balloons-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.balloon {
  position: absolute;
  width: 120px; 
  height: 160px; /* 添加固定高度 (根据常见气球比例估算) */
  transform: translateX(-50%);
  display: flex; 
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  pointer-events: all;
  transition: opacity 0.5s ease; 
  opacity: 0.9; /* 添加整体透明度 */

  /* 应用所有动画，explode 初始暂停 */
  animation:
    floatUp linear forwards var(--float-duration, 10s), /* 使用变量，提供默认值 */
    sway 3s ease-in-out infinite alternate,
    explode 0.5s ease-out forwards paused; /* 初始暂停 */
}

.balloon.exploded {
  animation-play-state: paused, paused, running; /* 暂停 floatUp, sway; 运行 explode */
  pointer-events: none; 
  /* 隐藏内部元素 - 这部分样式保持不变 */
  .balloon-image, /* 直接选择图片 */
  .balloon-char-overlay { /* 直接选择文字 */
      display: none;
  }
}

@keyframes floatUp {
  from {
    bottom: -10%;
    transform: translateX(-50%) rotate(0deg); /* 初始旋转角度 */
  }
  50% {
     transform: translateX(-50%) rotate(5deg); /* 中途轻微摆动 */
  }
  to {
    bottom: 110%;
    transform: translateX(-50%) rotate(-5deg); /* 结束时轻微摆动 */
  }
}

/* 新增飘动动画 */
@keyframes sway {
  from {
    transform: translateX(-55%) rotate(-5deg); /* 调整 translateX 以适应旋转 */
  }
  to {
    transform: translateX(-45%) rotate(5deg); /* 调整 translateX 以适应旋转 */
  }
}

/* 新增爆炸动画 */
@keyframes explode {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(2.5);
    opacity: 0;
  }
}

.balloon-body {
  width: 80px;
  height: 100px;
  /* background-color: #FF6B6B; */ /* 移除固定背景色 */
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  box-shadow: inset -5px -5px 10px rgba(0,0,0,0.2);
}

.balloon-body::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  width: 10px;
  height: 10px;
  background: inherit;
  border-radius: 50%;
}

.balloon-char {
  font-size: 1.8rem;
  font-weight: bold;
  color: white;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
}

.balloon-string {
  font-size: 1.5rem;
  margin-top: -10px;
  color: #555;
}

.game-over {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.85);
  color: white;
  z-index: 1000;
  text-align: center;
}

.game-over h2 {
  font-size: 2.8rem;
  margin-bottom: 25px;
}

.game-over .final-score {
  font-size: 1.8rem;
  margin-bottom: 25px;
}

.game-over .fireworks {
  font-size: 3rem;
  margin-bottom: 25px;
}

.restart-btn {
  padding: 15px 30px;
  font-size: 1.5rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.2s;
}

.restart-btn:hover {
  transform: scale(1.05);
}

/* 修改：为图片添加样式 */
.balloon-image {
  display: block;
  width: 100%; 
  height: 100%; /* 让图片高度也充满容器 */
  object-fit: contain; /* 确保图片内容完整显示并保持比例 */
}

/* 新增：将汉字叠加在图片上 */
.balloon-char-overlay {
  position: absolute;
  top: 30%; /* 再次向上调整垂直位置 */
  left: 50%;
  transform: translate(-50%, -50%); 
  font-size: 1.8rem;
  font-weight: bold;
  color: white;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
}

.level-complete {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.85);
  color: white;
  z-index: 1000;
  text-align: center;
}

.level-complete h2 {
  font-size: 2.8rem;
  margin-bottom: 25px;
}

.buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 25px;
}

.restart-btn,
.next-btn,
.exit-btn {
  padding: 15px 30px;
  font-size: 1.5rem;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.2s;
}

.restart-btn:hover,
.next-btn:hover,
.exit-btn:hover {
  transform: scale(1.05);
}

.restart-btn,
.next-btn {
  background-color: #4CAF50; /* Green */
}

.exit-btn {
  background-color: #f44336; /* Red */
}

.loading { /* ... */ }
.error-message { /* ... */ }

.learn-char-image {
    max-width: 80px;
    max-height: 80px;
    margin-top: 10px;
}
</style> 