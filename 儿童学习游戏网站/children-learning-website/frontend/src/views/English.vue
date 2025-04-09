<template>
  <!-- Add audio elements -->
  <audio ref="backgroundMusicRef" loop>
    <source src="../assets/sounds/background.wav" type="audio/wav">
  </audio>
  <audio ref="correctSoundRef">
    <source src="../assets/sounds/correct.wav" type="audio/wav">
  </audio>
  <audio ref="wrongSoundRef">
    <source src="../assets/sounds/wrong.mp3" type="audio/mpeg">
  </audio>
  <audio ref="wordAudioRef">
    <!-- src will be set dynamically -->
  </audio>

  <!-- Use full-screen container structure -->
  <div class="english-game full-screen-game"> 
    <h1 class="title">龟兔赛跑学单词</h1>
    
    <div v-if="!gameStarted" class="start-screen">
      <button class="start-btn" @click="startGame">开始游戏</button>
    </div>
    
    <!-- Main game container -->
    <div v-else class="game-container"> 
      <!-- Game area with background -->
      <div class="game-area" :style="{ backgroundImage: `url(${currentBackground})` }">
        
        <div class="race-track">
          <div class="finish-line">🏁</div>
          <div 
            class="sprite zombie-sprite"
            :class="`zombie-sprite-${zombieFrame}`"
            :style="{ left: `${zombiePosition}%` }"
          ></div>
          <div 
            class="sprite raccoon-sprite"
            :class="`raccoon-sprite-${raccoonFrame}`"
            :style="{ left: `${raccoonPosition}%` }"
          ></div>
        </div>
        
        <div class="word-area">
          <div class="word-display-container">
          <div class="current-word">{{ currentWord }}</div>
              <div class="word-image-container">
                 <img v-if="currentWordData && currentWordData.image_url" 
                      :src="getServerFileUrl(currentWordData.image_url)" 
                      alt="Word image" 
                      class="word-image"/>
                 <div v-else class="word-image-placeholder">?</div>
              </div>
          </div>
          
          <div class="spelling-area">
            <div class="spelled-word">
              <!-- Add click handler for undo -->
              <span 
                v-for="(item, index) in spelledWord" 
                :key="index" 
                class="spelled-letter"
                :class="{ 'filled': item.letter !== '_' }"
                @click="undoLetter(index)" 
              >
                {{ item.letter }}
              </span>
            </div>
            
            <div class="letter-options">
              <button 
                v-for="(letter, index) in letterOptions" 
                :key="index"
                class="letter-btn"
                :disabled="selectedLetters.includes(index)"
                @click="selectLetter(letter, index)"
              >
                {{ letter }}
              </button>
            </div>
          </div>
        </div>
        
        <div class="game-stats">
          <div class="level-display">Level: {{ level }}</div>
          <div class="words-count">拼对单词数：{{ wordsCount }}</div>
        </div>
      </div> // End game-area
    </div> // End game-container
    
    <!-- ADD: Level Complete Screen -->
    <div v-if="levelComplete" class="level-complete">
      <h2>🎉 太棒了！完成第 {{ level }} 关! 🎉</h2>
      <div class="buttons">
        <button class="next-btn" @click="goToNextLevel">下一关</button>
        <button class="exit-btn" @click="exitGame">退出游戏</button>
      </div>
    </div>
    <!-- END ADD -->

    <!-- Modify: Game Over Screen -->
    <div v-if="gameOver" class="game-over">
      <h2>{{ gameOverMessage }}</h2>
      <div class="final-stats">最终Level: {{ level }}</div> <!-- Keep final level display -->
      <div class="final-stats">拼对单词数：{{ wordsCount }}</div> <!-- Keep final score -->
      <div class="buttons">
        <!-- Show Replay only on game over -->
        <button class="restart-btn" @click="startGame">再玩一次</button>
        <button class="exit-btn" @click="exitGame">退出游戏</button>
      </div>
    </div>
    <!-- END Modify -->

  </div>
</template>

<script>
// Import necessary functions and assets
import { ref, computed, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
// Import backgrounds
import airadventurelevel1 from '../assets/images/background/airadventurelevel1.png'
import airadventurelevel2 from '../assets/images/background/airadventurelevel2.png'
import airadventurelevel3 from '../assets/images/background/airadventurelevel3.png'
import airadventurelevel4 from '../assets/images/background/airadventurelevel4.png'

// --- Import ALL Sprites Statically ---
// Zombie Sprites (1-10)
import zombie1 from '../assets/images/English/zombie/1.png'
import zombie2 from '../assets/images/English/zombie/2.png'
import zombie3 from '../assets/images/English/zombie/3.png'
import zombie4 from '../assets/images/English/zombie/4.png'
import zombie5 from '../assets/images/English/zombie/5.png'
import zombie6 from '../assets/images/English/zombie/6.png'
import zombie7 from '../assets/images/English/zombie/7.png'
import zombie8 from '../assets/images/English/zombie/8.png'
import zombie9 from '../assets/images/English/zombie/9.png'
import zombie10 from '../assets/images/English/zombie/10.png'
const zombieSprites = [zombie1, zombie2, zombie3, zombie4, zombie5, zombie6, zombie7, zombie8, zombie9, zombie10];

// Raccoon Sprites (1-11)
import raccoon1 from '../assets/images/English/raccoon/1.png'
import raccoon2 from '../assets/images/English/raccoon/2.png'
import raccoon3 from '../assets/images/English/raccoon/3.png'
import raccoon4 from '../assets/images/English/raccoon/4.png'
import raccoon5 from '../assets/images/English/raccoon/5.png'
import raccoon6 from '../assets/images/English/raccoon/6.png'
import raccoon7 from '../assets/images/English/raccoon/7.png'
import raccoon8 from '../assets/images/English/raccoon/8.png'
import raccoon9 from '../assets/images/English/raccoon/9.png'
import raccoon10 from '../assets/images/English/raccoon/10.png'
import raccoon11 from '../assets/images/English/raccoon/11.png'
const raccoonSprites = [raccoon1, raccoon2, raccoon3, raccoon4, raccoon5, raccoon6, raccoon7, raccoon8, raccoon9, raccoon10, raccoon11];

export default {
  name: 'EnglishGame',
  setup() {
    // Game state
    const gameStarted = ref(false)
    const gameOver = ref(false)
    const gameOverMessage = ref('')
    const level = ref(1)
    const levelComplete = ref(false)
    const MAX_LEVEL = 4;
    
    // --- Audio Refs ---
    const backgroundMusicRef = ref(null)
    const correctSoundRef = ref(null)
    const wrongSoundRef = ref(null)
    const wordAudioRef = ref(null); 

    // --- Sprite Refs & State ---
    let spriteAnimationId = null;
    const spriteFrameInterval = 100; // Milliseconds between frames
    let lastSpriteFrameTime = 0;
    const zombieFrame = ref(0);
    const raccoonFrame = ref(0);
    const zombieMaxFrames = 10; // 僵尸有10帧动画
    const raccoonMaxFrames = 11; // 浣熊有11帧动画

    // Game timers
    const zombieTimer = ref(null)
    
    // Game data
    const zombiePosition = ref(5) // Zombie is the opponent, moves automatically
    const raccoonPosition = ref(0) // Raccoon is the player, moves on correct answers
    const wordsCount = ref(0)
    
    // Word data
    const wordsFromAPI = ref([]); // 存储从 API 获取的单词对象
    const currentWordData = ref(null); // 存储当前单词的完整对象 {id, word, image_url, audio_url}
    const currentWord = ref('')
    const spelledWord = ref([]) 
    const letterOptions = ref([])
    const selectedLetters = ref([]) // Tracks indices of selected letter options
    const loadingWords = ref(false);
    
    // --- 新增：关卡难度设置相关 ---
    const englishLevels = ref([]);
    const loadingLevels = ref(false);
    
    // --- 新增：统一的 API 错误状态 ---
    const apiError = ref(''); 
    // ------------------------------

    const currentLevelSettings = computed(() => {
      if (loadingLevels.value || englishLevels.value.length === 0) {
          // 提供默认值，确保游戏能基本运行
          return { level: level.value, zombie_speed: 1.0, raccoon_step_base: 0.5 };
      }
      const settings = englishLevels.value.find(l => l.level === level.value);
      return settings || englishLevels.value[englishLevels.value.length - 1] || { level: level.value, zombie_speed: 1.0, raccoon_step_base: 0.5 };
    });
    // -----------------------------

    // --- 修改：不再添加硬编码的基础 URL ---
    const getServerFileUrl = (relativePath) => {
        // 直接返回后端提供的相对 URL 路径
        // 浏览器会自动根据当前域名来请求
        return relativePath ? relativePath : null; 
    };
    // ------------------------------------
    
    // --- Computed Properties ---
    const currentBackground = computed(() => {
      const backgrounds = [airadventurelevel1, airadventurelevel2, airadventurelevel3, airadventurelevel4];
      return backgrounds[(level.value - 1) % backgrounds.length]; 
    });

    // --- Audio Functions (copied from Math.vue, slightly adapted) ---
    const playSound = (isCorrect) => {
      try {
        const soundRef = isCorrect ? correctSoundRef : wrongSoundRef;
        const soundName = isCorrect ? '正确' : '错误';
        console.log(`尝试播放 ${soundName} 音效`);
        if (soundRef.value) {
          soundRef.value.currentTime = 0;
          const playPromise = soundRef.value.play();
          if (playPromise !== undefined) {
            playPromise.catch(err => {
              console.error(`播放 ${soundName} 音效失败:`, err);
            });
          }
        } else {
           console.error(`playSound: ${soundName} 音效引用无效`);
        }
      } catch (error) {
        console.error('播放音效时出错:', error);
      }
    };

    const playBackgroundMusic = () => {
      console.log('尝试播放背景音乐 (English)');
      if (backgroundMusicRef.value) {
        try {
          backgroundMusicRef.value.currentTime = 0;
          backgroundMusicRef.value.volume = 0.5; // Adjust volume as needed
          const playPromise = backgroundMusicRef.value.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
               console.log('背景音乐播放成功 (English)');
            }).catch(error => {
              console.error('背景音乐播放失败 (English):', error);
            });
          }
        } catch (error) {
          console.error('播放背景音乐时发生错误 (English):', error);
        }
      } else {
        console.error('playBackgroundMusic: 背景音乐引用无效 (English)');
      }
    };

    const stopAllAudio = () => {
      console.log('停止所有音频 (English)');
      if (backgroundMusicRef.value && !backgroundMusicRef.value.paused) {
        backgroundMusicRef.value.pause();
        backgroundMusicRef.value.currentTime = 0;
        console.log('背景音乐已停止 (English)');
      }
      if (correctSoundRef.value && !correctSoundRef.value.paused) {
        correctSoundRef.value.pause();
        correctSoundRef.value.currentTime = 0;
      }
      if (wrongSoundRef.value && !wrongSoundRef.value.paused) {
        wrongSoundRef.value.pause();
        wrongSoundRef.value.currentTime = 0;
      }
      if (wordAudioRef.value && !wordAudioRef.value.paused) {
        wordAudioRef.value.pause();
        wordAudioRef.value.currentTime = 0;
      }
    };
    
    // --- Animation Functions ---
    const animateSprites = (timestamp) => {
      if (!gameStarted.value || gameOver.value) {
        if (spriteAnimationId) {
          cancelAnimationFrame(spriteAnimationId);
          spriteAnimationId = null;
        }
        return;
      }

      if (!lastSpriteFrameTime) {
        lastSpriteFrameTime = timestamp;
      }

      const elapsed = timestamp - lastSpriteFrameTime;

      if (elapsed >= spriteFrameInterval) {
        lastSpriteFrameTime = timestamp - (elapsed % spriteFrameInterval);
        
        // Update zombie frame
        zombieFrame.value = (zombieFrame.value + 1) % zombieMaxFrames;
        
        // Update raccoon frame
        raccoonFrame.value = (raccoonFrame.value + 1) % raccoonMaxFrames;
      }

      spriteAnimationId = requestAnimationFrame(animateSprites);
    };

    const startSpriteAnimation = () => {
      if (spriteAnimationId) {
        cancelAnimationFrame(spriteAnimationId);
      }
      lastSpriteFrameTime = 0;
      spriteAnimationId = requestAnimationFrame(animateSprites);
    };

    const stopSpriteAnimation = () => {
      if (spriteAnimationId) {
        cancelAnimationFrame(spriteAnimationId);
        spriteAnimationId = null;
      }
    };

    // --- Game Logic ---
    const startGame = async () => {
      console.log('Starting English Game...');
      // 重置状态
      gameStarted.value = true;
      gameOver.value = false;
      levelComplete.value = false;
      level.value = 1;
      wordsCount.value = 0;
      zombiePosition.value = 5;
      raccoonPosition.value = 0;

      clearTimers(); // 清除旧计时器
      stopAllAudio(); // 停止旧音频
      
      // 重置音频播放位置
      if (backgroundMusicRef.value) backgroundMusicRef.value.currentTime = 0;
      if (correctSoundRef.value) correctSoundRef.value.currentTime = 0;
      if (wrongSoundRef.value) wrongSoundRef.value.currentTime = 0;
      if (wordAudioRef.value) wordAudioRef.value.currentTime = 0;

      // 先获取数据，再开始游戏逻辑
      loadingWords.value = true;
      loadingLevels.value = true;
      await Promise.all([fetchEnglishWords(), fetchEnglishLevels()]); // 并行获取
      loadingWords.value = false;
      loadingLevels.value = false;
      
      // 检查数据是否加载成功
      if (apiError.value || wordsFromAPI.value.length === 0) {
          gameOver.value = true;
          gameOverMessage.value = `游戏初始化失败: ${apiError.value || '单词库为空'}`;
          gameStarted.value = false; // 回到开始界面
          return;
        }

      chooseNewWord(); // 选择第一个单词
      
      // 启动僵尸移动计时器
      zombieTimer.value = setInterval(moveZombie, 100); // 调整时间间隔控制基础速度

      // 启动精灵图动画计时器
      startSpriteAnimation();

      playBackgroundMusic();
    };
    
    const generateNewWord = () => {
      const randomIndex = Math.floor(Math.random() * wordsFromAPI.value.length);
      currentWordData.value = wordsFromAPI.value[randomIndex];
      currentWord.value = currentWordData.value.word.toUpperCase(); // 确保大写
      
      // spelledWord 初始化为下划线
      spelledWord.value = currentWord.value.split('').map(() => ({ letter: '_', sourceIndex: null }));
      
      // 生成字母选项 (包含正确字母，打乱)
      const correctLetters = currentWord.value.split('');
      // 添加一些干扰字母 (简单实现)
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let distractors = [];
      while (distractors.length < Math.max(3, 10 - correctLetters.length)) { // 保证总共约10个选项
         const randomLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
         if (!correctLetters.includes(randomLetter) && !distractors.includes(randomLetter)) {
             distractors.push(randomLetter);
         }
      }
      letterOptions.value = [...correctLetters, ...distractors].sort(() => Math.random() - 0.5);
      selectedLetters.value = []; // 重置已选字母
      console.log(`New word: ${currentWord.value}`, currentWordData.value);
    };
    
    const selectLetter = (letter, index) => {
      if (selectedLetters.value.includes(index)) return; // 防止重复选择
      
      // 找到第一个空的下划线位置
      const emptyIndex = spelledWord.value.findIndex(item => item.letter === '_');
      if (emptyIndex !== -1) {
        spelledWord.value[emptyIndex] = { letter: letter, sourceIndex: index }; 
        selectedLetters.value.push(index); // 标记按钮为已使用
        
        // 检查是否拼写完成
        if (spelledWord.value.every(item => item.letter !== '_')) {
          const spelled = spelledWord.value.map(item => item.letter).join('');
          if (spelled === currentWord.value) {
            console.log('Correct! Current word complete:', currentWordData.value.word);
            // playSound(true); // REMOVE: Do not play correct sound
            wordsCount.value++;
            
            // --- Re-introduce raccoon step calculation ---
            const baseStep = currentLevelSettings.value.raccoon_step_base || 5.0; // Base step from level settings
            const wordLengthFactor = Math.max(1, currentWordData.value.word.length / 5); // Factor based on word length
            const raccoonStep = baseStep * wordLengthFactor; // Calculate the actual step
            console.log(`Raccoon move calculated: base=${baseStep}, factor=${wordLengthFactor.toFixed(2)}, step=${raccoonStep.toFixed(2)}`);
            
            // Update raccoon position, ensuring it doesn't exceed 85
            const nextPosition = raccoonPosition.value + raccoonStep;
            raccoonPosition.value = Math.min(nextPosition, 85); // Change 90 to 85
            // --- End re-introduction ---

            // --- ADD: Play word audio --- 
            playWordAudio();

            // --- Modify: Change win condition to 85% ---
            if (raccoonPosition.value >= 85) { 
              endGame('win');
              return; // Stop further execution for this word
            }
            
            // Wait briefly, then load the next word
            setTimeout(() => {
              chooseNewWord();
            }, 1000); // Delay before next word
          } else {
            // 错误
            playSound(false);
            // 重置拼写
            setTimeout(() => {
                spelledWord.value = currentWord.value.split('').map(() => ({ letter: '_', sourceIndex: null }));
              selectedLetters.value = [];
            }, 500);
          }
        }
      }
    };

    // --- 新增：重置当前单词拼写状态 ---
    const resetCurrentWordState = () => {
        spelledWord.value = currentWord.value.split('').map(() => ({ letter: '_', sourceIndex: null }));
        selectedLetters.value = [];
        console.log("Current word state reset for next word.");
    };
    // ---------------------------------

    // --- Undo Letter Function ---
    const undoLetter = (spelledIndex) => {
      const item = spelledWord.value[spelledIndex];
      // Only allow undo if the slot is filled
      if (item.letter !== '_') { 
        const sourceLetterIndex = item.sourceIndex;
        
        // Reset the slot in spelledWord
        spelledWord.value[spelledIndex] = { letter: '_', sourceIndex: null };
        
        // Re-enable the corresponding letter option button
        const indexInSelected = selectedLetters.value.indexOf(sourceLetterIndex);
        if (indexInSelected > -1) {
          selectedLetters.value.splice(indexInSelected, 1);
        }
      }
    };
    
    const endGame = (reason) => {
      console.log(`Game ending. Reason: ${reason}, Current Level: ${level.value}`);
      gameStarted.value = false; // Stop game logic
      clearTimers();
      stopAllAudio();

      if (reason === 'win') {
        // Check if it's the final level
        if (level.value < MAX_LEVEL) {
          levelComplete.value = true; // Show level complete screen
          gameOver.value = false;     // Ensure game over screen is hidden
          console.log('Level complete, preparing for next level option.');
        } else {
          // Completed the final level
          gameOver.value = true;
          levelComplete.value = false; // Ensure level complete screen is hidden
          gameOverMessage.value = '🏆 恭喜！你完成了所有关卡！ 🏆';
          console.log('All levels completed! Game Over.');
        }
      } else { // reason === 'lose'
        gameOver.value = true;
        levelComplete.value = false;
        gameOverMessage.value = '😭 唉呀，僵尸先到终点了！ 😭';
        console.log('Player lost. Game Over.');
      }
      
      // 记录游戏结果到数据库 (根据需要调整，比如只记录总成绩)
      // submitScoreIfNeeded(); // Maybe call this only on final gameOver or lose?
    };
    
    const saveGameResult = async (win) => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('User not authenticated, cannot save score.');
          return; // 如果未认证，则不保存
        }
        // 使用 axios 发送 POST 请求
        await axios.post('/api/english/saveScore', {
            score: wordsCount.value, // 确保分数被包含
            win: win 
        }, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
        });
        console.log('English game score saved successfully.');
      } catch (error) {
        console.error('Error saving English game score:', error);
      }
    };
    
    const resetGame = () => {
      console.log("Resetting game state...");
      clearInterval(zombieTimer.value); // Clear zombie timer
      stopAllAudio(); 
      
      zombiePosition.value = 5;
      raccoonPosition.value = 0;
      wordsCount.value = 0;
      level.value = 1;
      gameOver.value = false;
      levelComplete.value = false;
      gameOverMessage.value = ''; 
      // Reset animation frames
      zombieFrame.value = 0;
      raccoonFrame.value = 0;
      
      currentWord.value = '';
      spelledWord.value = [];
      letterOptions.value = [];
      selectedLetters.value = [];
    };

    // --- Exit Game Function ---
    const exitGame = () => {
      console.log("Exiting English game...");
      // Ensure all overlays are hidden and game state is reset
      gameOver.value = false; 
      levelComplete.value = false;
      gameStarted.value = false; // Return to start screen
      // Call resetGame to clear timers and other states
      resetGame(); 
      stopSpriteAnimation();
    };

    // --- Go to Next Level --- 
    const goToNextLevel = () => {
      if (level.value < MAX_LEVEL) {
        level.value++; // Increment level
        levelComplete.value = false; // Hide level complete screen
        resetGame(); // Reset game state for the new level
        startGame(); // Start the new level
        console.log(`Starting next level: ${level.value}`);
      } else {
        console.error("Already at max level, cannot go to next level.");
        // Optionally, redirect to game over or main menu
        levelComplete.value = false;
        gameOver.value = true;
        gameOverMessage.value = '🏆 恭喜！你完成了所有关卡！ 🏆'; // Ensure correct message
      }
    };

    // 僵尸移动 (修改：使用配置速度，并检查终点)
    const moveZombie = () => {
      if (gameOver.value || levelComplete.value) return;
      
      const speedPerSecond = currentLevelSettings.value.zombie_speed || 30.0; // 每秒前进百分比，带默认值
      const intervalMs = 100; // 计时器间隔
      const step = (speedPerSecond / 1000) * intervalMs; // 计算本次移动步长

      // console.log(`Zombie move: speed=${speedPerSecond}%/s, step=${step.toFixed(2)}%`); // 可以取消注释来调试
      zombiePosition.value += step;
      
      // --- 移除碰撞检测 ---
      // if (zombiePosition.value >= raccoonPosition.value - 5) { ... }
      // -------------------

      // --- 添加僵尸到达终点检测 (85%) ---
      if (zombiePosition.value >= 85) { // 修改阈值为 85
        endGame('失败了，僵尸先到达终点！', false); // 僵尸获胜
      }
      // -------------------------
    };

    // 清除计时器
    const clearTimers = () => {
        if (zombieTimer.value) clearInterval(zombieTimer.value);
        if (spriteAnimationId) cancelAnimationFrame(spriteAnimationId);
        zombieTimer.value = null;
        spriteAnimationId = null;
    };

    // --- ADD: Function to play the current word's audio ---
    const playWordAudio = () => {
        if (wordAudioRef.value && currentWordData.value && currentWordData.value.audio_url) {
            const audioUrl = getServerFileUrl(currentWordData.value.audio_url);
            console.log(`尝试播放单词音频: ${audioUrl}`);
            if (audioUrl) {
                try {
                    // --- ADD LOGGING --- 
                    console.log('[playWordAudio] Setting audio src to:', audioUrl);
                    // --- END LOGGING ---
                    wordAudioRef.value.src = audioUrl;
                    wordAudioRef.value.currentTime = 0;
                    // wordAudioRef.value.load(); // Optional: Explicitly load
                    const playPromise = wordAudioRef.value.play();
                    if (playPromise !== undefined) {
                        playPromise.then(() => {
                            console.log(`单词音频 ${currentWord.value} 播放成功`);
                        }).catch(error => {
                            console.error(`播放单词 ${currentWord.value} 音频失败 (${audioUrl}):`, error);
                            // You might want to show a user-friendly message here
                        });
                    }
                } catch (error) {
                    console.error(`设置或播放单词 ${currentWord.value} 音频时出错 (${audioUrl}):`, error);
                }
            } else {
                console.warn(`无法获取单词 ${currentWord.value} 的有效音频 URL`);
            }
        } else {
            let reason = "未知原因";
            if (!wordAudioRef.value) reason = "wordAudioRef 无效";
            else if (!currentWordData.value) reason = "currentWordData 无效";
            else if (!currentWordData.value.audio_url) reason = "currentWordData.audio_url 无效";
            console.warn(`无法播放单词音频，原因: ${reason}`);
        }
    };

    // --- API 调用函数 ---
    const fetchEnglishWords = async () => {
        loadingWords.value = true;
        try {
            // 移除认证检查和请求头
            const response = await axios.get('/api/english/words'); 
            wordsFromAPI.value = response.data;
            console.log('English words fetched:', wordsFromAPI.value.length);
             if (wordsFromAPI.value.length === 0) {
                 apiError.value = '单词库为空！';
             }
        } catch (error) {
            console.error('Error fetching english words:', error);
            apiError.value = `加载单词失败: ${error.response?.data?.error || error.message}`;
        } finally {
            loadingWords.value = false;
        }
    };

    const fetchEnglishLevels = async () => {
        loadingLevels.value = true;
        try {
            // 移除认证检查和请求头
            const response = await axios.get('/api/english/levels');
            englishLevels.value = response.data;
            console.log('English levels fetched:', englishLevels.value);
        } catch (error) {
            console.error('Error fetching english levels:', error);
            apiError.value = `加载难度设置失败: ${error.response?.data?.error || error.message}`;
            // 提供默认值
            englishLevels.value = [
              { level: 1, zombie_speed: 30.0, raccoon_step_base: 5.0 },
              { level: 2, zombie_speed: 40.0, raccoon_step_base: 6.0 },
              { level: 3, zombie_speed: 50.0, raccoon_step_base: 7.0 }
            ];
             console.warn("Using fallback default english levels.");
        } finally {
            loadingLevels.value = false;
        }
    };

    // 选择新单词 (修改：从 API 数据选择)
    const chooseNewWord = () => {
      if (wordsFromAPI.value.length === 0) {
        console.error("单词列表为空!");
        // 可以设置游戏结束或显示错误
        gameOver.value = true;
        gameOverMessage.value = '错误：单词库为空！';
        stopAllAudio();
        clearTimers();
        return;
      }
      // 从API获取的列表中随机选择一个单词对象
      const randomIndex = Math.floor(Math.random() * wordsFromAPI.value.length);
      currentWordData.value = wordsFromAPI.value[randomIndex];
      currentWord.value = currentWordData.value.word.toUpperCase(); // 确保大写
      
      // spelledWord 初始化为下划线
      spelledWord.value = currentWord.value.split('').map(() => ({ letter: '_', sourceIndex: null }));
      
      // 生成字母选项 (包含正确字母，打乱)
      const correctLetters = currentWord.value.split('');
      // 添加一些干扰字母 (简单实现)
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let distractors = [];
      while (distractors.length < Math.max(3, 10 - correctLetters.length)) { // 保证总共约10个选项
         const randomLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
         if (!correctLetters.includes(randomLetter) && !distractors.includes(randomLetter)) {
             distractors.push(randomLetter);
         }
      }
      letterOptions.value = [...correctLetters, ...distractors].sort(() => Math.random() - 0.5);
      selectedLetters.value = []; // 重置已选字母
      console.log('[chooseNewWord] New word data:', JSON.stringify(currentWordData.value)); 
    }

    // --- Lifecycle Hooks ---
    onMounted(() => {
      console.log('English Game Component Mounted.');
      // Add audio cleanup listeners
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
      });
    });

    onUnmounted(() => {
      console.log('English Game Component Unmounting.');
      clearInterval(zombieTimer.value); // Clear zombie timer
      clearInterval(spriteAnimationId);
      stopAllAudio();
      stopSpriteAnimation();
    });
    
    return {
      gameStarted,
      gameOver,
      gameOverMessage,
      zombiePosition,
      raccoonPosition,
      wordsCount,
      currentWord,
      spelledWord,
      letterOptions,
      selectedLetters,
      startGame,
      selectLetter,
      resetGame,
      exitGame,
      undoLetter,
      backgroundMusicRef,
      correctSoundRef,
      wrongSoundRef,
      wordAudioRef,
      currentBackground,
      level,
      levelComplete,
      goToNextLevel,
      currentWordData,
      getServerFileUrl,
      loadingWords,
      apiError,
      loadingLevels,
      zombieFrame,
      raccoonFrame,
    };
  }
}
</script>

<style scoped>
/* Base styles */
.english-game {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  /* background-color: #E8F5E9; Remove default background */
  box-sizing: border-box;
}

/* Full screen layout like Math game */
.full-screen-game {
  width: 100%;
  min-height: 100vh; /* Ensure it takes full viewport height */
}

.title {
  color: #4CAF50;
  font-size: 2.5rem;
  margin-bottom: 10px; /* 减少标题下方间距 */
  text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
}

.start-screen {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-grow: 1; /* Take available space */
}

.start-btn {
  padding: 20px 40px;
  font-size: 1.8rem;
  background-color: #FF9800;
  color: white;
  border: none;
  border-radius: 15px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}
.start-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 12px rgba(0,0,0,0.3);
}

/* Game container structure */
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
  background-color: #87CEEB; 
  background-size: cover;
  background-position: center bottom;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  min-height: 500px; 
  overflow: hidden; 
  padding-top: 0; /* 进一步减少顶部内边距 */
}

/* Race track styling */
.race-track {
  position: relative;
  height: 130px; 
  margin-bottom: 20px; /* 减少底部间距 */
  margin-top: 0; /* 减少顶部间距 */
}

.finish-line {
  position: absolute;
  right: 1%;
  bottom: -360px;
  font-size: 7rem;
}

.runner {
  position: absolute;
  /* Adjusted vertical position - maybe closer to Math game */
  bottom: 10px; 
  transition: left 0.5s linear;
  z-index: 5;
}

.runner img {
  width: 60px; /* Might need adjustment based on actual sprites */
  height: auto;
  display: block;
}

.rabbit { /* Specific positioning if needed */ }
.turtle { /* Specific positioning if needed */ }

/* Word and spelling area */
.word-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: -100px; /* 减少顶部间距，让内容上移 */
  padding-left: 0;
  width: 100%;
}

/* 单词和图片容器样式 */
.word-display-container {
  display: flex;
  align-items: center; 
  justify-content: center;
  gap: 15px; 
  margin-bottom: 15px;
  width: 100%;
}

.current-word {
  font-size: 3rem;
  font-weight: bold;
  color: #4CAF50;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 5px 15px;
  border-radius: 10px;
  display: inline-block;
}

.word-image-container {
    width: 80px;
    height: 80px;
    background-color: rgba(255, 255, 255, 0.7);
    border: 2px solid #ccc;
    border-radius: 5px;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
}
.word-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}
.word-image-placeholder {
    font-size: 40px;
    color: #aaa;
}

.spelling-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px; /* 减少间距 */
}

.spelled-word {
  display: flex;
  gap: 8px; /* 减小空格 */
  background-color: rgba(255, 255, 255, 0.7);
  padding: 12px; /* 减小内边距 */
  border-radius: 10px;
  min-height: 50px; /* 减小高度 */
}

.spelled-letter {
  width: 45px; /* 减小宽度 */
  height: 45px; /* 减小高度 */
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.6rem; /* 减小字体 */
  font-weight: bold;
  border: 2px solid #ccc;
  border-radius: 8px;
  background-color: #fff;
  color: #333;
  transition: background-color 0.3s, transform 0.2s;
}
.spelled-letter.filled {
  background-color: #A5D6A7;
  border-color: #4CAF50;
  cursor: pointer;
}
.spelled-letter.filled:hover {
  background-color: #FFCDD2;
  transform: scale(1.05);
}

.letter-options {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px; /* 减小间距 */
  width: auto;
  max-width: 85%;
}

.letter-btn {
  width: 50px; /* 减小宽度 */
  height: 50px; /* 减小高度 */
  font-size: 1.5rem; /* 减小字体 */
  font-weight: bold;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.2s, background-color 0.2s, box-shadow 0.2s;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
}
.letter-btn:hover:not(:disabled) {
  transform: scale(1.05);
  background-color: #1976D2;
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);
}
.letter-btn:disabled {
  background-color: #B0BEC5;
  cursor: default;
  opacity: 0.6;
}

/* game-stats 保持右下角 */
.game-stats {
  display: flex;
  justify-content: space-around;
  align-items: center;
  font-size: 1.2rem;
  font-weight: bold;
  color: #333;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 8px 15px;
  border-radius: 8px;
  position: absolute;
  bottom: 20px;
  right: 20px;
}
.level-display {
  /* Specific style for level if needed */
}
.words-count {
  /* Specific style for word count if needed */
}

/* Level Complete Overlay Styles (similar to game-over) */
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
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  z-index: 1000;
  text-align: center;
}
.level-complete h2 {
  font-size: 2.8rem;
  margin-bottom: 35px;
  color: #4CAF50;
}
.level-complete .buttons,
.game-over .buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
}

/* Game Over / Level Complete styles */
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
  color: #FFEB3B;
}
.game-over .final-stats {
  font-size: 1.8rem;
  margin-bottom: 25px;
}
.game-over button, .level-complete button {
  padding: 15px 30px;
  font-size: 1.5rem;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.2s;
}
.restart-btn, .next-btn {
  background-color: #4CAF50;
  color: white;
}
.exit-btn {
  background-color: #f44336;
  color: white;
}
.restart-btn:hover, .exit-btn:hover, .next-btn:hover {
  transform: scale(1.05);
}

/* Responsive adjustments if needed */
@media (max-width: 768px) {
  .title { font-size: 2rem; }
  .current-word { font-size: 2.5rem; }
  .spelled-letter, .letter-btn { width: 45px; height: 45px; font-size: 1.4rem; }
  .race-track { height: 80px; }
  .runner img { width: 50px; }
  .game-container { height: auto; min-height: 80vh; }
}

/* Import sprite sheets CSS */
@import url('../assets/images/english_sprites.css');

.sprite {
  position: absolute;
  bottom: -360px;
  transform-origin: center;
}

.zombie-sprite {
  z-index: 2;
  transition: left 0.5s linear;
  width: 100px;
  height: 100px;
  bottom: -320px
}

.raccoon-sprite {
  z-index: 3;
  transition: left 0.5s ease-out;
  width: 100px;
  height: 100px;
  bottom: -330px
}

/* ... Word area, Spelling area, Letter options ... */

/* ... Game stats ... */

/* ... Level Complete, Game Over overlays ... */

/* ... Responsive adjustments ... */

/* REMOVE any leftover .runner or .rabbit / .turtle specific styles */
</style> 