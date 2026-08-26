import os
from PIL import Image

screenshots_base = '/Users/aru/.gemini/antigravity/scratch/designer-web/public/Screenshots'
output_base = '/Users/aru/.gemini/antigravity/scratch/designer-web/public/previews'
os.makedirs(output_base, exist_ok=True)

categories = ['lihashop-mobile', 'lihashop-web', 'velcaryn-mobile', 'velcaryn-web']

for cat in categories:
    cat_dir = os.path.join(screenshots_base, cat)
    if not os.path.exists(cat_dir):
        continue
    files = sorted([f for f in os.listdir(cat_dir) if not f.startswith('.')])
    print(f"\n--- {cat} ({len(files)} files) ---")
    for i, fname in enumerate(files):
        in_path = os.path.join(cat_dir, fname)
        try:
            with Image.open(in_path) as img:
                w, h = img.size
                out_name = f"{cat}_{i+1}.webp"
                out_path = os.path.join(output_base, out_name)
                # If very large, resize with high quality LANCZOS
                max_w = 1600 if 'web' in cat else 900
                if w > max_w:
                    new_h = int(h * (max_w / w))
                    resized = img.resize((max_w, new_h), Image.Resampling.LANCZOS)
                    resized.save(out_path, 'WEBP', quality=85, method=6)
                else:
                    img.save(out_path, 'WEBP', quality=85, method=6)
                out_size = os.path.getsize(out_path)
                print(f"[{i+1}] {fname} -> {out_name} ({w}x{h} -> {out_size // 1024} KB)")
        except Exception as e:
            print(f"Error processing {fname}: {e}")
