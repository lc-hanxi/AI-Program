from PIL import Image
import os
import glob

def create_sprite_sheet(sprite_dir, output_path, sprite_width=128, sprite_height=128):
    # 获取所有PNG文件
    sprite_files = sorted(glob.glob(os.path.join(sprite_dir, "w_*.png")))
    
    if not sprite_files:
        print(f"No sprite files found in {sprite_dir}")
        return
    
    # 计算sprite sheet的尺寸
    num_sprites = len(sprite_files)
    sheet_width = sprite_width * 8  # 每行8个精灵
    sheet_height = sprite_height * ((num_sprites + 7) // 8)  # 向上取整计算行数
    
    # 创建新图片
    sprite_sheet = Image.new('RGBA', (sheet_width, sheet_height), (0, 0, 0, 0))
    
    # 放置每个精灵
    for i, sprite_path in enumerate(sprite_files):
        try:
            sprite = Image.open(sprite_path)
            # 调整大小确保一致性
            sprite = sprite.resize((sprite_width, sprite_height), Image.Resampling.LANCZOS)
            
            # 计算位置
            x = (i % 8) * sprite_width
            y = (i // 8) * sprite_height
            
            # 粘贴到sprite sheet
            sprite_sheet.paste(sprite, (x, y), sprite)
            
        except Exception as e:
            print(f"Error processing {sprite_path}: {e}")
    
    # 保存sprite sheet
    sprite_sheet.save(output_path, 'PNG', optimize=True)
    print(f"Sprite sheet saved to {output_path}")
    
    # 生成CSS类
    css = """
.monster-sprite {
    width: 128px;
    height: 128px;
    background-image: url('../images/monster_sprite_sheet.png');
    background-repeat: no-repeat;
}
"""
    
    for i in range(len(sprite_files)):
        x = (i % 8) * -sprite_width
        y = (i // 8) * -sprite_height
        css += f"""
.monster-sprite-{i} {{
    background-position: {x}px {y}px;
}}
"""
    
    # 保存CSS
    css_path = os.path.join(os.path.dirname(output_path), 'monster_sprites.css')
    with open(css_path, 'w') as f:
        f.write(css)
    print(f"CSS file saved to {css_path}")

if __name__ == "__main__":
    # 设置路径
    sprite_dir = "../public/images/sprites"
    output_dir = "../src/assets/images"
    
    # 确保输出目录存在
    os.makedirs(output_dir, exist_ok=True)
    
    # 生成sprite sheet
    create_sprite_sheet(
        sprite_dir,
        os.path.join(output_dir, "monster_sprite_sheet.png")
    ) 