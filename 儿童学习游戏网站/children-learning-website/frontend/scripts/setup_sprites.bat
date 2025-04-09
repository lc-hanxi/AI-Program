@echo off
echo Installing Python dependencies...
pip install pillow

echo Generating sprite sheet...
python generate_sprite_sheet.py

echo Done! 