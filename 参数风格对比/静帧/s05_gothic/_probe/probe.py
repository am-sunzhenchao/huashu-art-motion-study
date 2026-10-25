#!/usr/bin/env python3
# /// script
# dependencies = ["pillow", "numpy"]
# """修正版自检探针：上一版断点在「用世界坐标采样，但画布是屏幕坐标」。
# 场景相机为纯缩放 z（中心 960,540），本探针先把世界坐标 → 屏幕坐标再查像素，
# 用「在容差框内找目标色」代替单点采样，抗锯边/摆动都吃得下。"""
import numpy as np
from PIL import Image

D = __import__('pathlib').Path(__file__).parent.parent
W, H = 1920, 1080

def ss(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)

def lerp(a, b, t):
    return a + (b - a) * t

def camZ(lt):
    return lerp(1.0, 1.20, ss(0, 3, lt)) if lt < 3 else (lerp(1.20, 1.0, ss(3, 6.9, lt)) if lt < 6.9 else 1.0)

def to_scr(wx, wy, z):
    return 960 + (wx - 960) * z, 540 + (wy - 540) * z

def hexc(s):
    return np.array([int(s[i:i + 2], 16) for i in (1, 3, 5)], dtype=np.int32)

RED, GOLD, GOLDREF, BLUE, BLUEDK = hexc('#c3262e'), hexc('#d9a63a'), hexc('#eac564'), hexc('#24449e'), hexc('#142a6a')
PARCH, SLIPC, STEM, PINK = hexc('#ecdfc0'), hexc('#f1e6c9'), hexc('#3a2416'), hexc('#e7a3aa')
WOOD, WHITE, MOUSE = hexc('#8a5a2c'), hexc('#f8f2e2'), hexc('#3e302c')

frames = {}
for lt in (1.0, 3.5, 5.5, 8.5):
    frames[lt] = np.asarray(Image.open(D / f't{lt:06.2f}.png').convert('RGB')).astype(np.int32)
# 终态帧（补渲进 _probe）：算力注牌 8.7–9.0 挂上、收束波 8.55–9.45 走完，9.3 已齐
END = D / '_probe' / 't009.30.png'
if END.exists():
    frames[9.3] = np.asarray(Image.open(END).convert('RGB')).astype(np.int32)

def hit(lt, wx0, wy0, wx1, wy1, col, tol=46, pad=6):
    """世界框 → 屏幕框（外扩 pad），数容差内像素。"""
    z = camZ(lt)
    x0, y0 = to_scr(wx0, wy0, z); x1, y1 = to_scr(wx1, wy1, z)
    x0, x1 = sorted((x0, x1)); y0, y1 = sorted((y0, y1))
    x0 = max(0, int(x0) - pad); x1 = min(W - 1, int(x1) + pad)
    y0 = max(0, int(y0) - pad); y1 = min(H - 1, int(y1) + pad)
    reg = frames[lt][y0:y1 + 1, x0:x1 + 1]
    if not reg.size:
        return 0, (x0, y0, x1, y1)
    m = (np.abs(reg - col).max(axis=2) <= tol).sum()
    return int(m), (x0, y0, x1, y1)

checks = []
def ck(name, lt, box, col, need, tol=46):
    n, sb = hit(lt, *box, col, tol)
    ok = n >= need
    checks.append(ok)
    print(f'{"✓" if ok else "✗"} {name:<26} t={lt:<4} 世界框{box} 屏幕{sb} 命中{n} (需≥{need}) {col.tolist()}')

# ---- 拍一 t=1.0：首字母特写 ----
ck('屏上字「参数」朱红', 1.0, (288, 238, 475, 334), RED, 400)
ck('金框上参数点0.73', 1.0, (435, 348, 465, 378), GOLD, 40)
ck('金框上参数点-1.2', 1.0, (685, 348, 715, 378), GOLD, 40)
ck('金框上参数点2.4', 1.0, (345, 822, 375, 852), GOLD, 40)
ck('注牌白底(0.73)', 1.0, (485, 350, 625, 402), WHITE, 900)
ck('注牌白底(2.4)', 1.0, (210, 800, 330, 840), WHITE, 900)
ck('首字母蓝地', 1.0, (330, 380, 700, 560), BLUE, 2500)
ck('首字母金框', 1.0, (300, 350, 760, 376), GOLD, 300)
ck('羊皮纸底', 1.0, (900, 470, 1400, 530), PARCH, 3000, tol=40)
ck('蜗牛白身(下边框)', 1.0, (1340, 916, 1420, 962), WHITE, 150)
ck('蜗牛金壳', 1.0, (1380, 905, 1445, 950), GOLD, 150)
ck('左竖带朱红块', 1.0, (130, 179, 188, 247), RED, 400)

# ---- 拍二 t=3.5：藤蔓起势 + 贴页 ----
ck('屏上字「疯狂卷参数」', 3.5, (288, 238, 740, 334), RED, 700)
ck('藤蔓茎(左竖早期)', 3.5, (237, 358, 252, 430), STEM, 25, tol=60)
ck('金球已缀生', 3.5, (237, 358, 1697, 900), GOLD, 300)
ck('贴页羊皮纸壳', 3.5, (1500, 420, 1640, 800), SLIPC, 3000, tol=40)
ck('贴页金印', 3.5, (1561, 335, 1579, 353), GOLD, 30)
ck('首字母仍在场', 3.5, (330, 380, 700, 560), BLUE, 1500)

# ---- 拍二 t=5.5：金网成形 + 计数滚动 ----
ck('内网横藤(行1)', 5.5, (900, 422, 1600, 438), STEM, 40, tol=70)
ck('贴页计数175B', 5.5, (1470, 530, 1670, 600), RED, 200)
# 底纹是 α 混在羊皮纸上的：期望色 = α*纯色 + (1-α)*羊皮纸（t=5.5 α≈0.32），按混合色找
dens55 = ss(3.4, 6.3, 5.5)
a55 = 0.15 + 0.30 * dens55
blend = (a55 * BLUEDK + (1 - a55) * PARCH).astype(np.int32)
ck('场内菱格蓝(混合色)', 5.5, (800, 560, 1300, 640), blend, 800, tol=32)
ck('场内菱格蓝(混合色·右场)', 5.5, (1000, 660, 1300, 740), blend, 400, tol=32)
ck('藤蔓蓝叶', 5.5, (240, 400, 1690, 860), BLUE, 200, tol=70)

# ---- 拍三 t=8.5：三徽章归位 + 描金 ----
ck('徽章环金(书)', 8.5, (760, 610, 950, 680), GOLD, 500)
ck('徽章环金(窗)', 8.5, (1040, 610, 1230, 680), GOLD, 500)
ck('徽章环金(灯)', 8.5, (1260, 610, 1450, 680), GOLD, 500)
ck('福音书木封面', 8.5, (810, 620, 900, 660), WOOD, 300, tol=60)
ck('玫瑰窗蓝地', 8.5, (1100, 610, 1170, 680), BLUEDK, 200, tol=70)
ck('圣油灯金碗', 8.5, (1330, 640, 1380, 680), GOLD, 150)
ck('徽章白底(书)', 8.5, (790, 580, 920, 620), WHITE, 150)
ck('注牌红字·数据', 8.5, (790, 740, 920, 800), RED, 120)
ck('注牌红字·方法', 8.5, (1070, 740, 1200, 800), RED, 120)
# 「算力」注牌按分镜 8.7s 起挂、9.0s 挂满 —— 8.5 静帧按设计尚未出现，到终态帧核验
if 9.3 in frames:
    ck('注牌红字·算力(终态)', 9.3, (1290, 740, 1420, 800), RED, 120)
    ck('三注牌白底(终态)', 9.3, (780, 745, 1430, 800), WHITE, 900)
    ck('蜗牛终位(下边框)', 9.3, (890, 916, 1030, 962), WHITE, 120)
    ck('屏上字「参数之外」(终态)', 9.3, (288, 238, 740, 334), RED, 500)
    ck('描金亮球(终态)', 9.3, (240, 360, 1690, 880), GOLDREF, 150, tol=50)
ck('计数1T+', 8.5, (1470, 660, 1670, 770), RED, 250)
ck('描金亮球goldRef', 8.5, (240, 360, 1690, 880), GOLDREF, 150, tol=50)
ck('整页金球', 8.5, (240, 360, 1690, 880), GOLD, 900)
ck('老鼠跑过边框', 8.5, (940, 880, 1000, 918), MOUSE, 120, tol=60)
ck('屏上字「参数之外」', 8.5, (288, 238, 740, 334), RED, 500)

print()
print('探针汇总：', f'{sum(checks)}/{len(checks)} 通过', '✅ 全过' if all(checks) else '❌ 有未过项')
