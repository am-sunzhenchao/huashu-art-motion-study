#!/usr/bin/env python3
# /// script
# dependencies = ["pillow", "numpy"]
# ///
"""诊断：把几对相邻帧（30fps）分 6x4 块，报每块的变化像素占比——定位运动大头的区域。"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image

files = sorted(Path(sys.argv[1]).glob('*.png'))
ims = {f.name: np.asarray(Image.open(f).convert('RGB')).astype(np.int16) for f in files}
names = list(ims)
# 相邻帧对：名字按渲染时刻排好，两两一组
pairs = []
i = 0
while i + 1 < len(names):
    a, b = names[i], names[i + 1]
    if abs(float(b[1:7]) - float(a[1:7])) < 0.04:
        pairs.append((a, b)); i += 2
    else:
        i += 1
for a, b in pairs:
    A, B = ims[a], ims[b]
    ch = (np.abs(A - B).max(axis=2) > 12)
    print(f'== {a} vs {b}  总 {ch.mean()*100:.2f}%')
    gy, gx = 4, 6
    for iy in range(gy):
        row = []
        for ix in range(gx):
            blk = ch[iy*270:(iy+1)*270, ix*320:(ix+1)*320]
            row.append(f'{blk.mean()*100:5.1f}')
        print('   ' + ' '.join(row))
