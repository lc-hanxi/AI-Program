from PIL import Image
import os
import glob

def create_sprite_sheet(sprite_dir, output_path, sprite_width=128, sprite_height=128, character_name=""):
    # 获取所有PNG文件
    sprite_files = sorted(glob.glob(os.path.join(sprite_dir, "*.png")))
    
    if not sprite_files:
        print(f"No sprite files found in {sprite_dir}")
        return
    
    # 计算sprite sheet的尺寸
    num_sprites = len(sprite_files)
    sheet_width = sprite_width * num_sprites  # 所有精灵放在一行
    sheet_height = sprite_height  # 只有一行
    
    # 创建新图片
    sprite_sheet = Image.new('RGBA', (sheet_width, sheet_height), (0, 0, 0, 0))
    
    # 放置每个精灵
    for i, sprite_path in enumerate(sprite_files):
        try:
            sprite = Image.open(sprite_path)
            # 调整大小确保一致性
            sprite = sprite.resize((sprite_width, sprite_height), Image.Resampling.LANCZOS)
            
            # 计算位置
            x = i * sprite_width
            y = 0
            
            # 粘贴到sprite sheet
            sprite_sheet.paste(sprite, (x, y), sprite)
            
        except Exception as e:
            print(f"Error processing {sprite_path}: {e}")
    
    # 保存sprite sheet
    sprite_sheet.save(output_path, 'PNG', optimize=True)
    print(f"Sprite sheet saved to {output_path}")
    
    # 不生成CSS类了，我们将在english_sprites.css文件中手动设置
    return True

if __name__ == "__main__":
    # 设置路径
    base_dir = "../src/assets/images/English"
    output_dir = "../src/assets/images"
    
    # 确保输出目录存在
    os.makedirs(output_dir, exist_ok=True)
    
    # 生成僵尸精灵图表
    create_sprite_sheet(
        os.path.join(base_dir, "zombie"),
        os.path.join(output_dir, "zombie_sprite_sheet.png"),
        128, 128,
        "zombie"
    )
    
    # 生成浣熊精灵图表
    create_sprite_sheet(
        os.path.join(base_dir, "raccoon"),
        os.path.join(output_dir, "raccoon_sprite_sheet.png"),
        128, 128,
        "raccoon"
    )
    
    print("精灵图表生成完成，请确保 english_sprites.css 文件已经更新") 