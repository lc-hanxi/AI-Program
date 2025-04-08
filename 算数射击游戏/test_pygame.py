import pygame
import sys

print("程序开始运行...")

try:
    # 初始化Pygame
    pygame.init()
    print("Pygame初始化成功")

    # 创建一个简单的窗口
    screen = pygame.display.set_mode((400, 300))
    print("窗口创建成功")
    pygame.display.set_caption("测试窗口")

    # 主游戏循环
    running = True
    print("进入主循环")
    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
                print("收到退出信号")
        
        # 填充白色背景
        screen.fill((255, 255, 255))
        pygame.display.flip()

    pygame.quit()
    print("程序正常结束")

except Exception as e:
    print(f"发生错误：{str(e)}")
    sys.exit(1) 