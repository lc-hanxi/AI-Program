import pygame
import random
import sys
import os
from pygame import mixer

# 添加调试信息
print("程序开始运行...")

try:
    # 初始化Pygame
    pygame.init()
    print("Pygame初始化成功")
    mixer.init()
    print("混音器初始化成功")

    # 设置窗口
    WINDOW_WIDTH = 800
    WINDOW_HEIGHT = 600
    screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
    pygame.display.set_caption("数学射击游戏")
    print("游戏窗口创建成功")

    # 颜色定义
    WHITE = (255, 255, 255)
    BLACK = (0, 0, 0)
    BLUE = (100, 100, 255)
    PINK = (255, 192, 203)
    GREEN = (50, 205, 50)
    RED = (255, 0, 0)
    YELLOW = (255, 255, 0)

    # 字体设置 - 使用系统默认中文字体
    try:
        # Windows系统
        font_large = pygame.font.SysFont('simhei', 64)
        font_small = pygame.font.SysFont('simhei', 36)
    except:
        try:
            # Linux/Mac系统
            font_large = pygame.font.SysFont('notosanscjksc', 64)
            font_small = pygame.font.SysFont('notosanscjksc', 36)
        except:
            font_large = pygame.font.Font(None, 64)
            font_small = pygame.font.Font(None, 36)
    print("字体加载成功")

    # 加载音效
    try:
        # 初始化混音器
        pygame.mixer.init()
        print("混音器初始化成功")
        
        # 加载并播放背景音乐
        pygame.mixer.music.load(os.path.join('assets', 'sounds', 'background.wav'))
        pygame.mixer.music.set_volume(0.3)  # 设置音量为30%
        pygame.mixer.music.play(-1)  # -1表示循环播放
        print("背景音乐加载成功")
        
        # 加载音效
        correct_sound = pygame.mixer.Sound(os.path.join('assets', 'sounds', 'correct.wav'))
        wrong_sound = pygame.mixer.Sound(os.path.join('assets', 'sounds', 'wrong.mp3'))  # 注意这里是mp3
        
        # 设置音效音量
        correct_sound.set_volume(0.6)
        wrong_sound.set_volume(0.6)
        print("音效加载成功")
    except Exception as e:
        print(f"音效加载失败：{str(e)}")

    # 在游戏初始化部分添加
    try:
        heart_img = pygame.image.load(os.path.join('assets', 'images', 'heart.png'))
        heart_img = pygame.transform.scale(heart_img, (30, 30))  # 调整心形图标大小
    except:
        print("无法加载心形图片")
        heart_img = None

    # 在游戏初始化部分添加新的资源加载
    try:
        # 加载背景图片
        background_images = []
        background_path = os.path.join('assets', 'images', 'background')
        for bg_file in ['airadventurelevel1.png', 'airadventurelevel2.png', 
                        'airadventurelevel3.png', 'airadventurelevel4.png']:
            try:
                img = pygame.image.load(os.path.join(background_path, bg_file))
                # 调整背景图片大小，只占据上面2/3的区域
                scaled_height = int(WINDOW_HEIGHT * 0.7)  # 背景图片只占70%的高度
                img = pygame.transform.scale(img, (WINDOW_WIDTH, scaled_height))
                background_images.append(img)
            except Exception as e:
                print(f"加载背景图片失败 {bg_file}：{str(e)}")
        print(f"成功加载了 {len(background_images)} 张背景图片")
        current_background = random.choice(background_images) if background_images else None
    except Exception as e:
        print(f"背景图片加载失败：{str(e)}")
        background_images = []
        current_background = None

    # 修改炮台图片加载部分
    try:
        # 尝试直接加载SVG文件（如果支持）
        cannon_img = pygame.image.load(os.path.join('assets', 'images', 'tank.svg'))
        cannon_img = pygame.transform.scale(cannon_img, (200, 200))  # 改为200x200，与怪兽大小更接近
        print("炮台图片加载成功")
    except Exception as e:
        print(f"SVG加载失败，尝试加载PNG：{str(e)}")
        try:
            # 如果SVG加载失败，尝试加载PNG
            cannon_img = pygame.image.load(os.path.join('assets', 'images', 'tank.png'))
            cannon_img = pygame.transform.scale(cannon_img, (200, 200))  # 改为200x200
            print("PNG炮台图片加载成功")
        except Exception as e:
            print(f"炮台图片加载失败：{str(e)}")
            cannon_img = None

    # 修改错误答案音效加载
    try:
        wrong_answer_sound = pygame.mixer.Sound(os.path.join('assets', 'sounds', 'wrong_answer.mp3'))
        wrong_answer_sound.set_volume(0.6)
        print("错误答案音效加载成功")
    except Exception as e:
        print(f"错误答案音效加载失败：{str(e)}")

    class Button:
        def __init__(self, x, y, width, height, text, color, hover_color):
            self.rect = pygame.Rect(x, y, width, height)
            self.text = text
            self.color = color
            self.hover_color = hover_color
            self.is_hovered = False

        def draw(self, surface):
            color = self.hover_color if self.is_hovered else self.color
            pygame.draw.rect(surface, color, self.rect, border_radius=10)
            text_surface = font_small.render(self.text, True, WHITE)
            text_rect = text_surface.get_rect(center=self.rect.center)
            surface.blit(text_surface, text_rect)

        def handle_event(self, event):
            if event.type == pygame.MOUSEMOTION:
                self.is_hovered = self.rect.collidepoint(event.pos)
            elif event.type == pygame.MOUSEBUTTONDOWN:
                if self.is_hovered:
                    return True
            return False

    def draw_game_over_screen():
        screen.fill(WHITE)
        game_over_text = font_large.render("游戏结束!", True, BLACK)
        score_text = font_large.render(f"最终得分: {game.score}", True, BLACK)
        
        # 创建按钮
        restart_button = Button(WINDOW_WIDTH//2 - 100, 400, 200, 50, "重新开始", BLUE, (50, 50, 255))
        quit_button = Button(WINDOW_WIDTH//2 - 100, 470, 200, 50, "退出游戏", RED, (255, 50, 50))
        
        screen.blit(game_over_text, (WINDOW_WIDTH//2 - game_over_text.get_width()//2, 200))
        screen.blit(score_text, (WINDOW_WIDTH//2 - score_text.get_width()//2, 300))
        
        restart_button.draw(screen)
        quit_button.draw(screen)
        pygame.display.flip()
        
        return restart_button, quit_button

    class Bullet:
        def __init__(self, x, y):
            self.x = x + 40  # 
            self.y = y + 20  # 保持垂直位置不变
            self.speed = 10
            self.radius = 5
            self.active = True
            
        def move(self):
            if self.active:
                self.x += self.speed
            
        def draw(self, screen):
            if self.active:
                # 画一个更好看的子弹
                pygame.draw.circle(screen, YELLOW, (int(self.x), int(self.y)), self.radius)
                pygame.draw.circle(screen, (255, 165, 0), (int(self.x), int(self.y)), self.radius-2)  # 内圈

        def collides_with(self, monster):
            if not self.active or not monster.active:
                return False
            # 使用圆形与矩形的碰撞检测
            closest_x = max(monster.x, min(self.x, monster.x + monster.width))
            closest_y = max(monster.y, min(self.y, monster.y + monster.height))
            distance = ((self.x - closest_x) ** 2 + (self.y - closest_y) ** 2) ** 0.5
            return distance <= self.radius

    class Game:
        def __init__(self):
            self.reset()
            
        def reset(self):
            self.score = 0
            self.lives = 3
            self.time_left = 60
            self.last_time = pygame.time.get_ticks()
            self.bullets = []
            # 随机选择新的背景
            global current_background
            if background_images:
                current_background = random.choice(background_images)
            self.generate_question()
            
        def generate_question(self):
            while True:
                num1 = random.randint(1, 10)
                num2 = random.randint(1, 10)
                operation = random.choice(['+', '-'])
                
                if operation == '+':
                    answer = num1 + num2
                else:
                    if num1 < num2:
                        num1, num2 = num2, num1
                    answer = num1 - num2
                    
                if 1 <= answer <= 20:
                    self.answer = answer
                    self.question = f"{num1} {operation} {num2} = ?"
                    break

    class Monster:
        def __init__(self):
            # 先定义尺寸，再加载精灵
            self.width = 80
            self.height = 80
            self.load_sprites()
            self.reset()
            
        def load_sprites(self):
            self.sprites = []
            sprite_path = os.path.join('assets', 'images', 'sprites')
            # 加载所有精灵图片
            for i in range(62):  # 从w_000.png到w_061.png
                try:
                    img_path = os.path.join(sprite_path, f'w_{i:03d}.png')
                    sprite = pygame.image.load(img_path)
                    # 设置透明背景
                    sprite = sprite.convert_alpha()
                    # 调整图片大小到合适的尺寸
                    sprite = pygame.transform.scale(sprite, (self.width, self.height))
                    self.sprites.append(sprite)
                except Exception as e:
                    print(f"加载精灵图片失败 {img_path}: {str(e)}")
            print(f"成功加载了 {len(self.sprites)} 个精灵图片")
        
        def reset(self):
            self.x = WINDOW_WIDTH - 100
            self.y = int(WINDOW_HEIGHT * 0.6) - self.height  # 现在可以安全使用 self.height
            self.speed = 1
            self.active = True
            self.current_sprite = 0
            self.animation_speed = 0.05
            self.last_update = pygame.time.get_ticks()
            
        def move(self):
            if self.active:
                self.x -= self.speed
                # 更新动画帧
                current_time = pygame.time.get_ticks()
                if current_time - self.last_update > self.animation_speed * 1000:  # 转换为毫秒
                    self.current_sprite = (self.current_sprite + 1) % len(self.sprites)
                    self.last_update = current_time
            
        def draw(self, screen):
            if self.active:
                if hasattr(self, 'sprites') and self.sprites:
                    try:
                        screen.blit(self.sprites[self.current_sprite], (self.x, self.y))
                    except Exception as e:
                        print(f"绘制精灵图片失败: {str(e)}")
                        pygame.draw.rect(screen, PINK, (self.x, self.y, self.width, self.height))
                else:
                    pygame.draw.rect(screen, PINK, (self.x, self.y, self.width, self.height))

    class NumberButton:
        def __init__(self, x, y, number):
            self.x = x
            self.y = y
            self.number = number
            self.width = 70  # 增加按钮宽度
            self.height = 70  # 增加按钮高度
            
        def draw(self, screen):
            pygame.draw.rect(screen, BLUE, (self.x, self.y, self.width, self.height), border_radius=15)
            # 增大数字字体
            text = font_large.render(str(self.number), True, WHITE)
            text_rect = text.get_rect(center=(self.x + self.width/2, self.y + self.height/2))
            screen.blit(text, text_rect)
            
        def is_clicked(self, pos):
            return (self.x <= pos[0] <= self.x + self.width and 
                    self.y <= pos[1] <= self.y + self.height)

    # 创建游戏对象
    print("创建游戏对象...")
    game = Game()
    monster = Monster()
    
    # 创建数字按钮
    buttons = []
    numbers_per_row = 10  # 每行10个数字
    button_margin = (WINDOW_WIDTH - 20) // numbers_per_row  # 计算按钮间距
    for i in range(20):
        row = i // numbers_per_row  # 0 或 1，两行
        col = i % numbers_per_row   # 0-9，每行10个
        x = 10 + col * button_margin  # 从左边留10像素空隙开始
        y = int(WINDOW_HEIGHT * 0.75) + row * 80  # 在背景图下方放置按钮
        buttons.append(NumberButton(x, y, i + 1))

    # 修改 Cannon 类
    class Cannon:
        def __init__(self):
            self.width = 200  # 保持200
            self.height = 200  # 保持200
            self.x = 20
            # 进一步调低炮台位置
            self.y = int(WINDOW_HEIGHT * 0.6) - self.height + 140  # 将偏移量从120增加到140
            
        def draw(self, screen):
            if cannon_img:
                screen.blit(cannon_img, (self.x, self.y))
            else:
                # 如果没有炮台图片，画一个简单的三角形
                points = [(self.x, self.y + self.height), 
                         (self.x + self.width, self.y + self.height//2),
                         (self.x, self.y)]
                pygame.draw.polygon(screen, BLUE, points)

    # 创建炮台实例
    cannon = Cannon()

    # 主游戏循环
    running = True
    print("进入主循环")
    clock = pygame.time.Clock()
    game_over = False

    def game_loop():
        global running, game_over
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                global running
                running = False
                return True
            elif event.type == pygame.MOUSEBUTTONDOWN:
                for button in buttons:
                    if button.is_clicked(event.pos):
                        if button.number == game.answer:
                            game.score += 10
                            try:
                                correct_sound.play()
                            except Exception as e:
                                print(f"播放正确音效失败：{str(e)}")
                            game.bullets.append(Bullet(cannon.x, cannon.y))
                            game.generate_question()
                        else:
                            # 播放错误答案音效
                            try:
                                wrong_answer_sound.play()
                            except Exception as e:
                                print(f"播放错误答案音效失败：{str(e)}")

        # 更新游戏状态
        current_time = pygame.time.get_ticks()
        if current_time - game.last_time >= 1000:
            game.time_left -= 1
            game.last_time = current_time
            
        # 更新子弹和碰撞检测
        for bullet in game.bullets[:]:
            bullet.move()
            if bullet.x > WINDOW_WIDTH:
                game.bullets.remove(bullet)
            elif bullet.collides_with(monster):
                print("子弹击中怪兽!")  # 调试信息
                bullet.active = False
                monster.active = False
                game.bullets.remove(bullet)
                monster.reset()
                    
        # 更新怪兽
        if monster.active:
            monster.move()
            if monster.x < 0:
                game.lives -= 1
                try:
                    wrong_sound.play()
                    print("播放错误音效")
                except Exception as e:
                    print(f"播放错误音效失败：{str(e)}")
                monster.reset()
            
        if game.lives <= 0 or game.time_left <= 0:
            return True
            
        # 绘制界面
        screen.fill(WHITE)  # 先填充白色背景
        
        if current_background:
            # 绘制背景图片在上面2/3的区域
            screen.blit(current_background, (0, 0))
        
        # 绘制一条分隔线
        pygame.draw.line(screen, BLACK, (0, int(WINDOW_HEIGHT * 0.7)), 
                        (WINDOW_WIDTH, int(WINDOW_HEIGHT * 0.7)), 2)
        
        score_text = font_small.render(f"得分: {game.score}", True, BLACK)
        lives_text = font_small.render(f"生命: ", True, BLACK)
        time_text = font_small.render(f"时间: {game.time_left}秒", True, BLACK)
        
        screen.blit(score_text, (10, 10))
        screen.blit(lives_text, (300, 10))
        
        # 绘制生命值图标
        if heart_img:
            for i in range(game.lives):
                screen.blit(heart_img, (380 + i * 35, 10))
        else:
            lives_count = font_small.render(f"x {game.lives}", True, BLACK)
            screen.blit(lives_count, (380, 10))
        
        screen.blit(time_text, (600, 10))
        
        question_text = font_large.render(game.question, True, BLACK)
        screen.blit(question_text, (50, 100))
        
        # 绘制炮台
        cannon.draw(screen)
        
        # 绘制子弹
        for bullet in game.bullets:
            bullet.draw(screen)
            
        monster.draw(screen)
        
        for button in buttons:
            button.draw(screen)
            
        pygame.display.flip()
        clock.tick(60)
    
        return False

    while running:
        if not game_over:
            game_over = game_loop()
            if not running:  # 添加这个检查
                break
            if game_over:
                restart_button, quit_button = draw_game_over_screen()
                waiting_for_input = True
                while waiting_for_input and running:
                    for event in pygame.event.get():
                        if event.type == pygame.QUIT:
                            running = False
                            waiting_for_input = False
                            break  # 添加break确保立即退出
                        elif event.type == pygame.MOUSEBUTTONDOWN:
                            if restart_button.handle_event(event):
                                game.reset()
                                monster.reset()
                                game_over = False
                                waiting_for_input = False
                            elif quit_button.handle_event(event):
                                running = False
                                waiting_for_input = False
                        else:
                            restart_button.handle_event(event)
                            quit_button.handle_event(event)
                    
                    if running:  # 只在游戏仍在运行时更新屏幕
                        restart_button.draw(screen)
                        quit_button.draw(screen)
                        pygame.display.flip()

    pygame.quit()
    print("程序正常结束")

except Exception as e:
    print(f"发生错误：{str(e)}")
    sys.exit(1) 