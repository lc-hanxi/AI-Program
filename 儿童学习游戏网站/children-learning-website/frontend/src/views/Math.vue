<template>
  <div class="math-game">
    <audio ref="backgroundMusicRef" loop>
      <source src="../assets/sounds/background.wav" type="audio/wav">
    </audio>
    <audio ref="correctSoundRef">
      <source src="../assets/sounds/correct.wav" type="audio/wav">
    </audio>
    <audio ref="wrongSoundRef">
      <source src="../assets/sounds/wrong.mp3" type="audio/mpeg">
    </audio>
    
    <h1 class="title">数学射击游戏</h1>
    
    <div v-if="!gameStarted" class="mode-selection">
       <div v-if="loadingLevels" class="loading-message">加载关卡设置...</div>
       <div v-else-if="levelError" class="error-message">{{ levelError }}</div>
       <template v-else>
         <button 
            class="mode-btn campaign" 
            @click="startGame('campaign')"
            :disabled="loadingLevels || !!levelError">
            通关模式
         </button>
         <button 
            class="mode-btn challenge" 
            @click="startGame('challenge')"
            :disabled="loadingLevels || !!levelError">
            挑战模式
          </button>
       </template>
    </div>
    
    <div v-else class="game-container">
      <div class="game-info">
        <div class="lives">
          <img v-for="life in lives" :key="life" src="../assets/images/heart.png" class="heart-icon" alt="生命值" />
        </div>
        <div class="timer">时间: {{ timer }}秒</div>
        <div class="score">得分: {{ score }}</div>
        <div v-if="gameMode === 'campaign'" class="level">关卡: {{ level }}</div>
        <div v-if="isEffectivelyBossLevel" class="boss-health">
          BOSS血量: {{ bossHealth }}/{{ isChallengeBossMode ? 1000 : 150 }}
        </div>
      </div>
      
      <div class="game-area" :style="{ backgroundImage: `url(${currentBackground})` }">
        <div class="question">{{ currentQuestion.expression }} = ?</div>
        
        <div class="game-field">
          <div class="tank">
            <img src="../assets/images/tank.svg" alt="坦克" />
          </div>
          
          <div 
            class="monster monster-sprite"
            :class="[
              `monster-sprite-${monsterSpriteIndex}`,
              { 
                'hit': monsterHit, 
                'defeated': monsterDefeated && !isEffectivelyBossLevel,
                'boss-defeated': bossDefeated && isEffectivelyBossLevel,
                'is-boss': isEffectivelyBossLevel,
                'no-transition': !gameStarted
              }
            ]"
            :style="{ left: `${monsterPosition}%` }"
            ref="monsterElement"
          >
          </div>
          
          <div 
            v-for="(bullet, index) in bullets" 
            :key="index" 
            class="bullet"
            :style="{ left: `${bullet.position}%`, bottom: '60px' }"
          >
            💥
          </div>
        </div>
        
        <div class="answers">
          <button 
            v-for="answer in currentQuestion.options" 
            :key="answer" 
            class="answer-btn"
            @click="shootBullet(answer)"
            :disabled="!canShoot"
          >
            {{ answer }}
          </button>
        </div>
      </div>
    </div>
    
    <div v-if="levelComplete" class="level-complete">
      <h2>{{ levelCompleteMessage }}</h2>
      <div class="level-score">本关得分: {{ score }}</div>
      <div class="buttons">
        <button class="next-btn" @click="goToNextLevel">进入下一关</button>
        <button class="exit-btn" @click="exitGame">退出游戏</button>
      </div>
    </div>
    
    <div v-if="gameOver" class="game-over">
      <h2>{{ gameOverMessage }}</h2>
      <div class="final-score">最终得分: {{ score }}</div>
      <div class="buttons">
        <button class="restart-btn" @click="resetGame">重新开始</button>
        <button class="exit-btn" @click="exitGame">退出游戏</button>
      </div>
    </div>
  </div>
</template>

<script>
/* eslint-disable vue/no-ref-as-operand */ // 在脚本顶部禁用规则
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import axios from 'axios'

// 导入图像资源
import airadventurelevel1 from '../assets/images/background/airadventurelevel1.png'
import airadventurelevel2 from '../assets/images/background/airadventurelevel2.png'
import airadventurelevel3 from '../assets/images/background/airadventurelevel3.png'
import airadventurelevel4 from '../assets/images/background/airadventurelevel4.png'

export default {
  name: 'MathGame',
  setup() {
    const gameStarted = ref(false)
    const gameMode = ref('')
    const level = ref(1)
    const lives = ref(3)
    const score = ref(0)
    const timer = ref(60)
    const gameOver = ref(false)
    const gameOverMessage = ref('')
    const levelComplete = ref(false)
    const levelCompleteMessage = ref('')
    const monsterPosition = ref(80)
    const monsterTimer = ref(null)
    const gameTimer = ref(null)
    const spriteAnimationTimer = ref(null); // 添加 sprite 动画计时器 ref
    
    // Audio refs from template
    const backgroundMusicRef = ref(null)
    const correctSoundRef = ref(null)
    const wrongSoundRef = ref(null)
    
    const monsterSpriteIndex = ref(0)
    const bullets = ref([])
    const monsterHit = ref(false)
    
    // 怪物精灵图动画
    const monsterSprites = ref([])
    
    // 添加动画相关的状态
    const monsterDefeated = ref(false)
    const bossDefeated = ref(false)
    
    // 背景图片根据关卡变化
    const currentBackground = computed(() => {
      if (level.value === 1) {
        return airadventurelevel1
      } else if (level.value === 2) {
        return airadventurelevel2
      } else if (level.value === 3) {
        return airadventurelevel3
      } else {
        return airadventurelevel4
      }
    })
    
    const monsterElement = ref(null) // 怪兽元素的引用
    
    // 当前精灵图
    const currentMonsterSprite = computed(() => {
      if (monsterSprites.value.length > 0) {
        return monsterSprites.value[monsterSpriteIndex.value]
      }
      return '' // 返回空字符串表示图片未加载
    })
    
    const currentQuestion = reactive({
      expression: '',
      answer: 0,
      options: []
    })
    
    // 在setup函数中添加BOSS状态相关变量
    const isBossLevel = computed(() => level.value === 4)
    const isEffectivelyBossLevel = computed(() => isBossLevel.value || isChallengeBossMode.value)
    const bossHealth = ref(150) // 修改初始血量为 150
    
    // --- 新增：存储从 API 获取的关卡设置 ---
    const mathLevels = ref([]);
    const loadingLevels = ref(true);
    const levelError = ref('');
    const isChallengeBossMode = ref(false); // 新增：标记挑战BOSS模式
    // ----------------------------------------

    // --- 新增：计算当前关卡的设置 --- 
    const currentLevelSettings = computed(() => {
      if (loadingLevels.value || mathLevels.value.length === 0) {
        // 返回默认值或加载状态，防止错误
        return { level_number: level.value, max_number: 10, duration_seconds: 60 }; // 确保字段名与 API 返回一致
      }
      // API 返回的 level 字段是 level_number
      const settings = mathLevels.value.find(l => l.level_number === level.value);
      // 如果找不到特定关卡设置（例如超出范围），可以返回最后一关或默认值
      return settings || mathLevels.value[mathLevels.value.length - 1] || { level_number: level.value, max_number: 10, duration_seconds: 60 };
    });
    // ---------------------------------

    // 在 setup 函数中添加状态变量
    const isBulletInFlight = ref(false); // 标记是否有子弹正在飞行
    const canShoot = ref(true); // 标记是否允许点击答案按钮

    // Preload and setup
    onMounted(async () => {
      console.log('Component Mounted. Initializing...')
      
      await fetchMathLevels();
      
      // 不再需要预加载单独的精灵图片
      monsterSprites.value = Array.from({ length: 61 }, (_, i) => i); // 0-60的数组
      console.log('精灵图索引已初始化:', monsterSprites.value.length)

      // --- Event listeners for cleanup ---
      const handlePopState = () => {
        console.log('检测到浏览器后退操作，停止所有音频')
        stopAllAudio()
      }
      const handleBeforeUnload = () => {
        console.log('页面即将卸载，停止所有音频')
        stopAllAudio()
      }
      const handleLinkClick = (e) => {
        // Check if the click target is a link or inside a link, potentially causing navigation
        if (e.target.tagName === 'A' || e.target.closest('a')) {
          console.log('检测到链接点击，可能发生导航，停止所有音频')
          stopAllAudio()
        }
      }

      window.addEventListener('popstate', handlePopState)
      window.addEventListener('beforeunload', handleBeforeUnload)
      document.addEventListener('click', handleLinkClick) // General link click detection

      // Cleanup listeners on unmount
      onUnmounted(() => {
        console.log('MathGame component unmounting. Cleaning up...')
        window.removeEventListener('popstate', handlePopState)
        window.removeEventListener('beforeunload', handleBeforeUnload)
        document.removeEventListener('click', handleLinkClick)
        
        // Ensure all timers are cleared
        clearTimers(); // 调用已更新的 clearTimers
        
        // Explicitly stop audio on unmount
        stopAllAudio()
        console.log('Cleanup complete.')
      })
       // --- End Event listeners ---
    })
    
    // --- 获取数学关卡设置的函数 ---
    const fetchMathLevels = async () => {
        loadingLevels.value = true;
        levelError.value = '';
        try {
            // --- 移除认证检查和请求头 ---
            // const token = localStorage.getItem('token');
            // if (!token) { ... }
            
            const response = await axios.get('/api/math/levels'); // 直接调用，无需认证头
            // ---------------------------

            mathLevels.value = response.data;
            console.log('Math levels fetched:', mathLevels.value);
             if (!Array.isArray(mathLevels.value) || mathLevels.value.length === 0) {
               levelError.value = '关卡设置无效或为空。';
               // 提供默认值以防万一
               mathLevels.value = [ 
                   { level_number: 1, max_number: 10, duration_seconds: 60 },
                   { level_number: 2, max_number: 20, duration_seconds: 60 },
                   { level_number: 3, max_number: 50, duration_seconds: 60 },
                   { level_number: 4, max_number: 50, duration_seconds: 60, is_boss_level: 1 },
               ];
               console.warn("Using fallback default math levels.");
           }
        } catch (error) {
            console.error('Error fetching math levels:', error);
            // 保持之前的错误处理，但移除特定于认证的检查
            levelError.value = `无法加载关卡设置: ${error.response?.data?.message || error.message}`;
            // 提供默认值
            mathLevels.value = [
                { level_number: 1, max_number: 10, duration_seconds: 60 },
                { level_number: 2, max_number: 20, duration_seconds: 60 },
                { level_number: 3, max_number: 50, duration_seconds: 60 },
                { level_number: 4, max_number: 50, duration_seconds: 60, is_boss_level: 1 },
            ];
             console.warn("Using fallback default math levels due to API error.");
        } finally {
            loadingLevels.value = false; // 结束加载
        }
    };
    // -------------------------------------

    // 生成题目
    const generateQuestion = () => {
      let num1, num2, operator
      // 从计算属性获取当前关卡的最大数字
      const maxNum = currentLevelSettings.value.max_number;
      console.log(`Generating question for Level ${level.value}, MaxNum: ${maxNum}`);

      if (isEffectivelyBossLevel.value) {
        // BOSS关：(可以保留现有逻辑或也使用 maxNum)
        num1 = Math.floor(Math.random() * (maxNum - 10)) + 10 // 示例: 10 到 maxNum
        num2 = Math.floor(Math.random() * (maxNum / 2)) + 1 // 示例: 1 到 maxNum/2
        operator = Math.random() > 0.5 ? '+' : '-'
      } else if (gameMode.value === 'challenge') {
        // 挑战模式：(保留现有逻辑或自定义)
        num1 = Math.floor(Math.random() * 70) + 1
        num2 = Math.floor(Math.random() * 30) + 1
        operator = Math.random() > 0.5 ? '+' : '-'
      } else { // 通关模式 (非 BOSS 关)
        // 使用后台配置的最大数字
        num1 = Math.floor(Math.random() * maxNum) + 1
        num2 = Math.floor(Math.random() * maxNum) + 1
        operator = Math.random() > 0.5 ? '+' : '-'

        // 确保减法结果不为负 (可选)
        if (operator === '-' && num1 < num2) {
          [num1, num2] = [num2, num1]; // 交换
        }
      }
      
      let answer
      if (operator === '+') {
        answer = num1 + num2
      } else {
        answer = num1 - num2
      }

      currentQuestion.expression = `${num1} ${operator} ${num2}`
      currentQuestion.answer = answer

      // 生成 7 个选项 (1 个正确，6 个错误)
      const options = new Set([answer])
      let attempts = 0; // 总尝试次数计数器
      const maxTotalAttempts = 150; // 防止无限循环的总安全限制

      while (options.size < 7 && attempts < maxTotalAttempts) {
        attempts++;
        let wrongAnswer;
        let found = false;
        
        // 策略1: 尝试在答案附近生成 (最多尝试 5 次)
        for (let i = 0; i < 5; i++) {
            const offsetRange = 10;
            const randomOffset = Math.floor(Math.random() * (offsetRange + 1)) - Math.floor(offsetRange / 2); // -5 到 +5
            wrongAnswer = answer + randomOffset;
            if (wrongAnswer >= 0 && wrongAnswer <= maxNum && !options.has(wrongAnswer)) {
                options.add(wrongAnswer);
                found = true;
                break; // 找到一个，跳出内层 for 循环
            }
        }

        // 策略2: 如果附近没找到，在 0 到 maxNum 范围内随机生成
        if (!found) {
            let randomAttempts = 0;
            const maxRandomAttempts = 20; // 随机生成的尝试次数限制
            while (randomAttempts < maxRandomAttempts) {
                randomAttempts++;
                wrongAnswer = Math.floor(Math.random() * (maxNum + 1)); // 0 到 maxNum
                if (wrongAnswer !== answer && !options.has(wrongAnswer)) {
                    options.add(wrongAnswer);
                    found = true;
                    break; // 找到一个，跳出内层 while 循环
                }
            }
        }
        
        // 如果两种策略都找不到（极少情况），可能需要记录日志或跳过本次添加
        if (!found) {
             console.warn(`Could not find a suitable wrong option after multiple attempts. Answer: ${answer}, Options:`, options);
        }
      }
      
      // 如果最终选项不足7个 (触发了 maxTotalAttempts)
      if (options.size < 7) {
          console.error(`Safety break! Could not generate 7 options after ${maxTotalAttempts} attempts. Answer: ${answer}, Options:`, options);
          // 填充剩余选项
          let fillAttempts = 0;
          while (options.size < 7 && fillAttempts < 50) {
              fillAttempts++;
              let fillValue = Math.floor(Math.random() * (maxNum + 1));
              if (!options.has(fillValue)) {
                  options.add(fillValue);
              }
          }
      }

      currentQuestion.options = Array.from(options).sort(() => Math.random() - 0.5)
    }
    
    // --- 修改：使用 requestAnimationFrame 优化怪物动画 ---
    let lastFrameTime = 0;
    let animationFrameId = null; // 存储 requestAnimationFrame ID
    const frameInterval = 150; // 目标帧间隔 (毫秒)

    const animateMonster = (timestamp) => {
        if (!gameStarted.value || gameOver.value || levelComplete.value) {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
            return; // 如果游戏未开始或已结束，停止动画
        }

        if (!lastFrameTime) {
            lastFrameTime = timestamp;
        }

        const elapsed = timestamp - lastFrameTime;

        if (elapsed >= frameInterval) {
            lastFrameTime = timestamp - (elapsed % frameInterval); // 校准时间
            
            // 更新 monsterSpriteIndex 来切换 <img src>
            if (monsterSprites.value.length > 0) {
                monsterSpriteIndex.value = (monsterSpriteIndex.value + 1) % monsterSprites.value.length;
            }
        }
        
        // 请求下一帧
        animationFrameId = requestAnimationFrame(animateMonster);
    };

    const startMonsterAnimation = () => {
        // 先停止任何可能在运行的旧动画帧
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        lastFrameTime = 0; // 重置上次时间
        animationFrameId = requestAnimationFrame(animateMonster); // 启动动画循环
        console.log("Monster animation started using requestAnimationFrame.");
    };

    const stopMonsterAnimation = () => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
            console.log("Monster animation stopped.");
        }
    };
    // --- 动画优化结束 ---
    
    // 发射子弹
    const shootBullet = (answer) => {
      console.log('尝试发射子弹:', answer);
      playSound(answer === currentQuestion.answer);

      // 如果答案错误或不允许发射，直接返回
      if (answer !== currentQuestion.answer || !canShoot.value) {
        return;
      }

      // 禁用发射和按钮点击
      canShoot.value = false;
      isBulletInFlight.value = true;

      // 创建新子弹
      const newBullet = {
        position: 15, // 初始位置（坦克位置）
        answer: answer,
      };

      // 添加到子弹数组
      bullets.value.push(newBullet);

      // 使用直接DOM操作确保子弹移动
      setTimeout(() => {
        const bulletElements = document.querySelectorAll('.bullet');
        const bulletIndex = bulletElements.length - 1;

        if (bulletElements[bulletIndex]) {
          // 强制回流，确保浏览器重新计算样式
          void bulletElements[bulletIndex].offsetWidth;

          // 使用requestAnimationFrame确保平滑动画
          let startTime = null;
          const duration = 800; // 子弹飞行时间(毫秒)
          const startPosition = 15;
          const targetPosition = monsterPosition.value;
          const distance = targetPosition - startPosition;

          const animateBullet = function(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // 使用线性插值计算当前位置
            const currentPosition = startPosition + distance * progress;

            // 更新子弹位置
            if (bulletIndex < bullets.value.length) {
              bullets.value[bulletIndex].position = currentPosition;
            }

            // 更新DOM元素位置
            const currentBulletElements = document.querySelectorAll('.bullet');
            if (bulletIndex < currentBulletElements.length) {
              currentBulletElements[bulletIndex].style.left = `${currentPosition}%`;
            }

            // 检查是否击中怪物
            if (progress >= 1) {
              // 子弹到达目标位置，从DOM和数组中移除
              if (bulletIndex < bullets.value.length) {
                bullets.value.splice(bulletIndex, 1);
              }

              // 从DOM中移除子弹元素
              if (bulletIndex < currentBulletElements.length) {
                currentBulletElements[bulletIndex].remove();
              }

              // 答案正确，触发怪物被击中效果
              if (isEffectivelyBossLevel.value) {
                bossHealth.value -= 10;
                score.value += 10;

                if (bossHealth.value <= 0) {
                  bossDefeated.value = true;
                  setTimeout(() => {
                    endGame(isChallengeBossMode.value ? '挑战结束！' : '恭喜你击败了BOSS，通过所有关卡！');
                  }, 2000);
                } else {
                  monsterPosition.value = Math.min(80, monsterPosition.value + 5);
                  generateQuestion();
                  canShoot.value = true; // 重新启用按钮
                }
              } else {
                monsterHit.value = true;
                setTimeout(() => {
                  score.value += 10;
                  monsterDefeated.value = true;

                  setTimeout(() => {
                    monsterDefeated.value = false;
                    generateNewMonster();
                    generateQuestion();
                    canShoot.value = true; // 重新启用按钮

                    // 检查是否达到100分（普通关卡）
                    if (gameMode.value === 'campaign' && !isEffectivelyBossLevel.value && score.value >= 100) {
                      if (level.value < 4) {
                        // 完成当前关卡
                        levelComplete.value = true;
                        levelCompleteMessage.value = `恭喜通过第${level.value}关！`;
                        clearTimers();
                      } else {
                        // 最后一关
                        endGame('恭喜你通过所有关卡！');
                      }
                    }
                  }, 500);
                }, 600);
              }

              return;
            }
            
            // 继续动画
            requestAnimationFrame(animateBullet);
          };
          
          requestAnimationFrame(animateBullet);
        }
      }, 10);
    }
    
    // 生成新怪兽的函数（不是重置怪兽位置）
    const generateNewMonster = () => {
      // 先隐藏当前怪兽（设置不可见）
      monsterHit.value = false
      
      // 将怪兽移到起始位置 (确保动画计时器此时是停止的，或者能处理位置突变)
      // 直接设置，不通过移出屏幕再移回的方式
      monsterPosition.value = 80; // 或者 85，根据你的设计

      // 可以在这里显式启动移动计时器，或者依赖于调用它的地方来管理
      // startMonsterMovement(); // 如果需要在这里启动

      console.log("Generated new monster at position:", monsterPosition.value);
    }
    
    // 添加专门的音效播放函数
    const playSound = (isCorrect) => {
      try {
        const soundRef = isCorrect ? correctSoundRef : wrongSoundRef
        const soundName = isCorrect ? '正确' : '错误'

        console.log(`尝试播放 ${soundName} 音效`)
        if (soundRef.value) {
           console.log(`${soundName} 音效 src:`, soundRef.value.src)
           console.log(`${soundName} 音效 readyState:`, soundRef.value.readyState)
           console.log(`${soundName} 音效 paused 状态 (播放前):`, soundRef.value.paused)

          // Reset time and play
          soundRef.value.currentTime = 0
          const playPromise = soundRef.value.play()

          if (playPromise !== undefined) {
             playPromise.then(() => {
                // console.log(`${soundName} 音效播放成功`); // Optional: reduce console noise
             }).catch(err => {
                console.error(`播放 ${soundName} 音效失败 (Promise rejected):`, err)
             })
          } else {
             console.log(`${soundName} 音效 play() 未返回 Promise`)
          }
        } else {
           console.error(`playSound: ${soundName} 音效引用无效`)
        }
      } catch (error) {
        console.error('播放音效时出错:', error)
      }
    }
    
    // 重新添加：背景音乐播放函数
    const playBackgroundMusic = () => {
      console.log('尝试播放背景音乐 (Math)');
      if (backgroundMusicRef.value) {
        try {
          backgroundMusicRef.value.currentTime = 0;
          backgroundMusicRef.value.volume = 0.5; // Adjust volume as needed
          const playPromise = backgroundMusicRef.value.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
               console.log('背景音乐播放成功 (Math)');
            }).catch(error => {
              console.error('背景音乐播放失败 (Math):', error);
            });
          }
        } catch (error) {
          console.error('播放背景音乐时发生错误 (Math):', error);
        }
      } else {
        console.error('playBackgroundMusic: 背景音乐引用无效 (Math)');
      }
    };
    
    // 清理所有计时器
    const clearTimers = () => {
        if (monsterTimer.value) clearInterval(monsterTimer.value);
        if (gameTimer.value) clearInterval(gameTimer.value);
        stopMonsterAnimation(); // 使用新的停止函数
        monsterTimer.value = null;
        gameTimer.value = null;
        console.log("All timers and monster animation cleared.");
    };

    // --- 重构：设置关卡并开始 ---
    const setupLevel = (levelNum) => {
      console.log(`Setting up Level ${levelNum}`);
      clearTimers(); // 清理上一关卡的计时器 (内部会调用 stopMonsterAnimation)
      stopAllAudio(); // 停止上一关卡的音频

      // --- 添加：每关开始时重置分数 ---
      score.value = 0;
      // ------------------------------

      level.value = levelNum;
      monsterPosition.value = 80; // 重置怪物位置
      bullets.value = [];      // 清空子弹
      monsterHit.value = false;
      monsterDefeated.value = false;
      bossDefeated.value = false;
      levelComplete.value = false;
      gameOver.value = false; // 确保游戏不是结束状态

      if (isEffectivelyBossLevel.value) {
        // 修改：从后台读取或默认设置为 150
        bossHealth.value = currentLevelSettings.value.boss_health || 150; 
        console.log(`Boss level ${levelNum}, Health: ${bossHealth.value}`);
      }

      setTimerBasedOnLevel(); // 根据新关卡设置计时器
      generateQuestion();     // 生成新问题
      
      // 启动新的计时器和动画
      startMonsterMovement(); 
      startGameTimer();
      startMonsterAnimation(); // 确保动画也重新开始
      
      playBackgroundMusic(); // 播放背景音乐
      console.log(`Level ${levelNum} setup complete.`);
    };

    // 开始游戏 (修改：调用 setupLevel)
    const startGame = (mode) => {
      console.log(`开始游戏: ${mode} 模式`);
      stopAllAudio(); // 先停止所有可能存在的音频

      gameMode.value = mode;
      gameStarted.value = true;
      isChallengeBossMode.value = false; // 先重置
      
      // 重置通用游戏状态
      lives.value = 3;
      score.value = 0; // 通关和挑战模式都从0分开始
      
      if (mode === 'challenge') {
          // 挑战模式直接进入 BOSS 关卡设置
          console.log("Setting up Challenge Boss Mode");
          isChallengeBossMode.value = true;
          setupLevel(4); // 使用第 4 关的设置
          bossHealth.value = 1000; // 覆盖血量为 1000
          console.log(`Challenge Boss Health set to: ${bossHealth.value}`);
      } else {
          // 通关模式从第一关开始
          setupLevel(1); 
      }
    };
    
    // 进入下一关 (修改：调用 setupLevel)
    const goToNextLevel = () => {
      if (level.value < 4) { // 假设总共4关
          console.log('进入下一关:', level.value + 1);
          // 注意：score 不重置，继续累积（或者根据游戏规则决定）
          setupLevel(level.value + 1);
      } else {
         console.log("已是最后一关，触发游戏结束");
         endGame('恭喜你通过所有关卡！'); // 已经是最后一关，通关
      }
    };
    
    // 退出游戏 (修改：清理更彻底)
    const exitGame = () => {
      console.log('执行 exitGame');
      gameStarted.value = false;
      levelComplete.value = false;
      gameOver.value = false;
      isChallengeBossMode.value = false; // 重置挑战模式标记
      clearTimers();    // 清理计时器
      stopAllAudio();   // 停止音频

      // 可以选择重置一些状态回初始值
      level.value = 1;
      score.value = 0;
      lives.value = 3;
      // ... 其他需要重置的状态 ...
      console.log('exitGame 完成');
    };
    
    // 结束游戏 (保持不变)
    const endGame = (message) => {
      console.log('游戏结束:', message)
      // Clear timers first
      if (monsterTimer.value) clearInterval(monsterTimer.value)
      if (gameTimer.value) clearInterval(gameTimer.value)

      gameOver.value = true
      gameOverMessage.value = message

      saveScore()
      // Stop audio *after* setting game over state if needed, or rely on unmount/exitGame
      // stopAllAudio() // Optional: stop immediately on game over screen
    }
    
    // 保存分数 (保持不变)
    const saveScore = async () => {
      try {
        await axios.post('/api/math/scores', {
          mode: gameMode.value,
          score: score.value,
          level: level.value
        })
      } catch (error) {
        console.error("Error saving score: ", error)
      }
    }
    
    // 重置游戏 (修改：调用 setupLevel)
    const resetGame = () => {
      console.log("Resetting game...");
      isChallengeBossMode.value = false; // 重置挑战模式标记
      
      // 重置核心状态
      lives.value = 3;
      score.value = 0;
      
      // 设置第一关 (内部会清理计时器、音频等)
      // 如果之前是挑战模式，这里会自动切回普通模式第一关
      setupLevel(1); 
    }
    
    // 将怪兽移动和游戏计时器逻辑抽取为单独的函数，方便重用
    const startMonsterMovement = () => {
      // 清除旧计时器 (setupLevel 已做，但双重保险无害)
      if (monsterTimer.value) clearInterval(monsterTimer.value);
      
      // TODO: 如果后台有速度配置，在此处读取 currentLevelSettings.value.monster_speed
      // const monsterSpeedSetting = currentLevelSettings.value.monster_speed || 1.0; // 假设 1.0 为基准速度
      // const baseInterval = 400; // 基础移动间隔 (ms)
      // const speedInterval = isBossLevel.value ? baseInterval * 1.5 : baseInterval / monsterSpeedSetting; // 示例调整逻辑

      const speed = isEffectivelyBossLevel.value ? 400 : (400 - (level.value - 1) * 50); // 保留旧的基于 level 的速度计算
      const moveStep = isEffectivelyBossLevel.value ? 0.5 : 1; // 保留旧的基于 level 的步长计算
      
      console.log(`Starting monster movement: interval=${speed}ms, step=${moveStep}%`);
      monsterTimer.value = setInterval(() => {
        if (gameOver.value || levelComplete.value) { // 增加检查，防止游戏结束后还移动
            clearInterval(monsterTimer.value);
            return;
        }
        monsterPosition.value -= moveStep;
        
        if (monsterPosition.value <= 10) {
          // 怪物到达坦克
          playSound(false);
          
          // BOSS一次摧毁所有生命 (使用新判断)
          if (isEffectivelyBossLevel.value) {
            lives.value = 0; // 直接清零
            endGame('BOSS摧毁了你的坦克，游戏结束！');
          } else {
            lives.value--;
            
            if (lives.value <= 0) {
              endGame('很遗憾，坦克被摧毁了！');
            } else {
              // 重置怪物位置并继续
              monsterPosition.value = 80; 
              console.log("Monster reached tank, reset position.");
            }
          }
        }
      }, speed);
    }
    
    const startGameTimer = () => {
      // 清除旧计时器 (setupLevel 已做，但双重保险无害)
      if (gameTimer.value) clearInterval(gameTimer.value);
      
       console.log(`Starting game timer: ${timer.value} seconds.`);
      gameTimer.value = setInterval(() => {
        if (gameOver.value || levelComplete.value) { // 增加检查
            clearInterval(gameTimer.value);
            return;
        }
        
        timer.value--;
        
        if (timer.value <= 0) {
          // 检查通关条件：普通关卡分数达到100 或 (BOSS关卡或挑战模式) 且 Boss血量为0
          const levelPassed = (!isEffectivelyBossLevel.value && score.value >= 100) || (isEffectivelyBossLevel.value && bossHealth.value <= 0);
          
          if (levelPassed) {
             if (level.value < 4 && !isChallengeBossMode.value) { // 只有普通模式的前3关才能进入下一关
                 console.log(`Level ${level.value} complete (Time up, score/boss condition met)`);
                 levelComplete.value = true;
                 levelCompleteMessage.value = `时间到！恭喜通过第${level.value}关！`;
                 // 清理计时器
                 clearTimers(); 
             } else {
                 // 普通模式第4关或挑战模式 BOSS 被击败（时间到）
                 endGame(isChallengeBossMode.value ? '时间到！挑战结束！' : '时间到！恭喜你通过所有关卡！');
             }
          } else {
             // 时间到但未通过
             endGame(isChallengeBossMode.value ? '时间到！挑战结束！' : '时间到，挑战失败！');
          }
        }
      }, 1000);
    }
    
    // 添加停止所有音频的函数 (保持不变)
    const stopAllAudio = () => {
      console.log('执行 stopAllAudio')
      
      // Stop background music via ref
      if (backgroundMusicRef.value) {
        try {
          if (!backgroundMusicRef.value.paused) {
             console.log('尝试停止背景音乐 (ref)')
             backgroundMusicRef.value.pause()
             // Check paused status *after* pause attempt
             console.log('背景音乐 (ref) pause() 调用后状态:', backgroundMusicRef.value.paused)
          } else {
             console.log('背景音乐 (ref) 已经是暂停状态')
          }
          // Always reset time
          backgroundMusicRef.value.currentTime = 0
          console.log('背景音乐 (ref) 时间已重置')

          // Optionally clear src to prevent potential background loading? Only if necessary.
          // backgroundMusicRef.value.src = ''; // Usually not needed if pause/currentTime works
          // backgroundMusicRef.value.load();
        } catch (e) {
           console.error('停止背景音乐 (ref) 失败:', e)
        }
      } else {
        console.warn('stopAllAudio: 背景音乐引用 (ref) 无效')
      }

      // Stop other sound effect refs
      const soundRefs = { correctSoundRef, wrongSoundRef }
      for (const refName in soundRefs) {
         const soundRef = soundRefs[refName]
         if (soundRef.value) {
           try {
              if (!soundRef.value.paused) {
                 console.log(`尝试停止 ${refName}`)
                 soundRef.value.pause()
              }
              soundRef.value.currentTime = 0
           } catch (e) { console.error(`停止 ${refName} 失败:`, e) }
         } else {
           // This might happen if the ref wasn't correctly assigned initially
           // console.warn(`stopAllAudio: ${refName} 引用无效`);
         }
      }

      // Attempt to stop any other audio elements on the page (less reliable fallback)
      document.querySelectorAll('audio').forEach(audio => {
        // Avoid stopping the main refs again if they are caught by the querySelector
        if (audio !== backgroundMusicRef.value && audio !== correctSoundRef.value && audio !== wrongSoundRef.value) {
            try {
                if (!audio.paused) {
                   console.log('停止页面上的其他音频元素:', audio.src || 'No Source')
                   audio.pause()
                   audio.currentTime = 0
                }
            } catch(e) {
                console.error("停止其他音频元素失败:", e)
            }
        }
      })
      console.log('stopAllAudio 执行完毕')
    }
    
    // 添加更强力的音频停止方法 (保持不变)
    const forceStopAllAudio = () => {
      console.log('执行 forceStopAllAudio (调用 stopAllAudio)')
      stopAllAudio() // Use the refined stop function
      // Removed element recreation logic as it's likely causing issues with refs
    }
    
    // 根据关卡设置计时器的函数 (保持不变)
    const setTimerBasedOnLevel = () => {
        if (!loadingLevels.value && mathLevels.value.length > 0) {
            const duration = currentLevelSettings.value.duration_seconds;
            console.log(`Setting timer for level ${level.value} to ${duration} seconds`);
            timer.value = duration;
        } else {
            console.log('Level settings not loaded yet, using default timer.');
            timer.value = 60; // 默认值
        }
    };
    // -------------------------------------

    return {
      gameStarted,
      gameMode,
      level,
      lives,
      score,
      timer,
      gameOver,
      gameOverMessage,
      levelComplete,
      levelCompleteMessage,
      monsterPosition,
      currentQuestion,
      currentBackground,
      currentMonsterSprite,
      bullets,
      startGame,
      shootBullet,
      resetGame,
      goToNextLevel,
      exitGame,
      backgroundMusicRef,
      correctSoundRef,
      wrongSoundRef,
      monsterHit,
      isEffectivelyBossLevel,
      bossHealth,
      monsterDefeated,
      bossDefeated,
      monsterElement,
      loadingLevels,
      levelError,
      monsterSpriteIndex, // 确保 monsterSpriteIndex 返回（如果模板或其他地方直接用）
      isChallengeBossMode,
      canShoot,
    }
  }
}
</script>

<style scoped>
.math-game {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100vh;
  width: 100%;
  padding: 20px;
  background-color: #E3F2FD;
  box-sizing: border-box;
}

.title {
  color: #2196F3;
  font-size: 2.5rem;
  margin-bottom: 30px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.mode-selection {
  display: flex;
  gap: 20px;
}

.mode-btn {
  padding: 15px 30px;
  font-size: 1.5rem;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.mode-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
}

.campaign {
  background-color: #4CAF50;
  color: white;
}

.challenge {
  background-color: #FF9800;
  color: white;
}

.game-container {
  width: 100%;
  max-width: 1600px;
  height: 80vh;
  display: flex;
  flex-direction: column;
}

.game-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  padding: 10px 20px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  font-size: 1.2rem;
  font-weight: bold;
}

.lives {
  display: flex;
  gap: 5px;
}

.heart-icon {
  width: 24px;
  height: 24px;
}

.game-area {
  flex: 1;
  background-color: #87CEEB;
  background-size: cover;
  background-position: center bottom; /* 确保背景底部显示 */
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 500px; /* 确保游戏区域足够高 */
}

.question {
  font-size: 2.5rem;
  font-weight: bold;
  color: white;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  background-color: rgba(0, 0, 0, 0.5);
  padding: 10px 20px;
  border-radius: 10px;
  display: inline-block;
  margin: 0 auto 20px auto;
  z-index: 20;
}

.game-field {
  position: relative;
  height: 300px; /* 更高的游戏场景 */
  margin: 10px 0 30px 0;
  overflow: hidden;
  background-image: linear-gradient(to bottom, transparent 70%, rgba(139, 69, 19, 0.3) 85%, rgba(139, 69, 19, 0.5) 100%); /* 添加地面渐变效果 */
}

.tank {
  position: absolute;
  left: 10%;
  bottom: 10px; /* 降低位置，更贴近地面 */
  z-index: 10;
}

.tank img {
  width: 80px;
  height: auto;
  /* 移除scaleX(1)，使用默认方向 */
}

.monster {
  position: absolute;
  bottom: 10px;
  transition: left 0.5s linear;
  transform-origin: center;
}

.monster.defeated {
  animation: defeated 0.5s ease-out forwards;
}

.monster.boss-defeated {
  animation: boss-defeated 2s ease-out forwards;
}

.monster.is-boss {
  bottom: 30px;
  transform: scale(1.5);
}

@keyframes hit {
  0% { transform: scale(1); }
  50% { transform: scale(0.8); }
  100% { transform: scale(1); }
}

@keyframes defeated {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(0); opacity: 0; }
}

@keyframes boss-defeated {
  0% { transform: scale(1.5); opacity: 1; }
  50% { transform: scale(2); opacity: 0.5; }
  100% { transform: scale(0); opacity: 0; }
}

.bullet {
  position: absolute;
  font-size: 2.5rem; /* Adjust size if needed */
  z-index: 8;
  will-change: transform, left; 
  transform-origin: center;
  /* Keep pulse or remove if preferred */
  animation: pulse 0.3s infinite alternate; 
  transition: none; 
  pointer-events: none; 
  /* Ensure bottom positioning is correct */
  bottom: 60px; 
}

@keyframes pulse {
  from {
    transform: scale(0.9);
  }
  to {
    transform: scale(1.2);
  }
}

.answers {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 15px; /* 减小按钮间距 */
  padding: 15px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  max-width: 90%;
  margin: 0 auto;
}

.answer-btn {
  padding: 10px;
  font-size: 1.5rem;
  font-weight: bold;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.2s, background-color 0.2s;
  width: 60px; /* 减小宽度 */
  height: 60px; /* 减小高度 */
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
}

.answer-btn:hover {
  transform: scale(1.05);
  background-color: #1976D2;
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.3);
}

.answer-btn:active {
  transform: scale(0.98);
  background-color: #0D47A1;
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
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  z-index: 100;
}

.level-complete h2 {
  font-size: 2.5rem;
  margin-bottom: 20px;
  color: #4CAF50;
}

.level-score {
  font-size: 1.8rem;
  margin-bottom: 30px;
}

.buttons {
  display: flex;
  gap: 20px;
}

.next-btn, .exit-btn {
  padding: 15px 30px;
  font-size: 1.5rem;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.2s;
}

.next-btn {
  background-color: #4CAF50;
  color: white;
}

.exit-btn {
  background-color: #f44336;
  color: white;
}

.next-btn:hover, .exit-btn:hover {
  transform: scale(1.05);
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
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  z-index: 100;
}

.game-over h2 {
  font-size: 2.5rem;
  margin-bottom: 20px;
}

.final-score {
  font-size: 1.8rem;
  margin-bottom: 30px;
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

@media (min-width: 1920px) {
  .game-container {
    max-width: 1800px;
  }
  
  .game-field {
    height: 300px;
  }
  
  .tank img {
    width: 120px;
  }
  
  .monster img {
    width: 150px;
  }
  
  .question {
    font-size: 3rem;
  }
  
  .answer-btn {
    width: 80px; /* 在大屏幕上适当增大 */
    height: 80px;
    font-size: 1.8rem;
  }
}

.boss-health {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: rgba(255, 0, 0, 0.7);
  color: white;
  padding: 5px 10px;
  border-radius: 5px;
  font-weight: bold;
}

/* 新增加载和错误消息样式 */
.loading-message,
.error-message {
  padding: 10px 20px;
  margin-bottom: 15px;
  border-radius: 5px;
  font-weight: bold;
  text-align: center;
}

.loading-message {
  background-color: #e0e0e0;
  color: #555;
}

.error-message {
  background-color: #ffcdd2;
  color: #c62828;
}

/* 导入精灵图CSS */
@import url('../assets/images/monster_sprites.css');
</style> 