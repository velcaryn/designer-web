#!/usr/bin/env python3
import os
import sys
from PIL import Image

def convert_to_webp(src_path, dest_path, max_dim=1200, target_kb=120):
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    with Image.open(src_path) as orig:
        orig = orig.convert('RGB')
        
        # Try decreasing size and quality until under target_kb
        cur_dim = max_dim
        while cur_dim >= 400:
            w, h = orig.size
            if max(w, h) > cur_dim:
                if w >= h:
                    new_w = cur_dim
                    new_h = int(h * (cur_dim / w))
                else:
                    new_h = cur_dim
                    new_w = int(w * (cur_dim / h))
                img = orig.resize((new_w, new_h), Image.Resampling.LANCZOS)
            else:
                img = orig.copy()
            
            for quality in [82, 76, 70, 64, 58, 52]:
                img.save(dest_path, 'WEBP', quality=quality, method=6)
                size_kb = os.path.getsize(dest_path) / 1024
                if size_kb <= target_kb:
                    print(f"Saved {dest_path} ({img.size[0]}x{img.size[1]}, {size_kb:.1f} KB, q={quality})")
                    return
            cur_dim -= 150

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: process-demo-image.py <src> <dest>")
        sys.exit(1)
    convert_to_webp(sys.argv[1], sys.argv[2])
