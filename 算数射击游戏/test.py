print("1. 程序开始")

import pygame
print("2. 导入pygame成功")

pygame.init()
print("3. pygame初始化成功")

screen = pygame.display.set_mode((400, 300))
print("4. 创建窗口成功")

running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    
    screen.fill((255, 255, 255))
    pygame.display.flip()

pygame.quit()
print("5. 程序结束") 