#!/usr/bin/env python3
# /// script
# dependencies = ["pillow", "numpy"]
# ///
"""读一个静帧目录里的全部 png：每帧报尺寸、亮度均值/方差（空白检测）、主色 top8（十六进制＋占比）。
没有视觉时用它当"眼睛"：对着风格配方卡的色板逐个核对主色来源。"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image

d = Path(sys.argv[1])
frames = []
for f in sorted(d.glob('*.png')):
    im = np.asarray(Image.open(f).convert('RGB')).astype(np.float32)
    h, w = im.shape[:2]
    px = im.reshape(-1, 3)
    q = (px // 24 * 24 + 12).astype(np.int32)                 # 24 级量化聚类
    keys, counts = np.unique(q.view([('', q.dtype)] * 3), return_counts=True)
    order = np.argsort(-counts)[:8]
    tops = []
    for i in order:
        c = tuple(int(x) for x in np.asarray(keys[i].tolist()))
        tops.append('#%02x%02x%02x %4.1f%%' % (c[0], c[1], c[2], counts[i] / len(px) * 100))
    flat = float((np.abs(px - np.median(px, axis=0)).max(axis=1) > 24).mean())   # 离主色远的像素占比
    print(f'{f.name}  {w}x{h}  亮度 {px.mean():6.1f}  std {px.std():5.1f}  离主色>24 像素 {flat*100:5.1f}%')
    print('   主色:', ' | '.join(tops))
    frames.append(np.asarray(Image.open(f).convert('RGB')).astype(int))
for i in range(len(frames) - 1):
    for j in range(i + 1, len(frames)):
        d = float((np.abs(frames[i] - frames[j]).max(axis=2) > 12).mean() * 100)
        print(f'帧差 {i}↔{j}: {d:.2f}%')
