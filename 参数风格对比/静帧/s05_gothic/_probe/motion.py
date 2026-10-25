#!/usr/bin/env python3
# /// script
# dependencies = ["playwright", "numpy", "pillow"]
# """运动剖面：按 qa 同口径（renderSolo 30fps，相邻帧 max|Δ|>12 像素占比）逐帧量，
# 找出把运动均值顶过 8% 的热点窗口。"""
import base64, functools, http.server, io, socketserver, threading
from pathlib import Path
import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[3] / '代码工程'
VW, VH = 1920, 1080

class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *x): pass
class S(socketserver.ThreadingTCPServer):
    request_queue_size = 128
    daemon_threads = True

srv = S(('127.0.0.1', 0), functools.partial(Q, directory=str(root)))
port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()

GRAB = '''async (t)=>{ window.renderSolo('s05_gothic', t); return window.__canvas.toDataURL('image/png').split(',')[1]; }'''
MEAS = '''() => { const c = window.__canvas.getContext('2d'); c.save(); c.font = '400px "UnifrakturMaguntia-400"'; c.textAlign='center'; c.textBaseline='alphabetic'; const m = c.measureText('P'); c.restore(); c.font = '42px "IMFellEnglish-400"'; c.textAlign='center'; c.textBaseline='middle'; const m2 = c.measureText('2.4'); return [m.actualBoundingBoxLeft, m.actualBoundingBoxRight, m.actualBoundingBoxAscent, m.actualBoundingBoxDescent, m2.actualBoundingBoxLeft, m2.actualBoundingBoxRight, m2.actualBoundingBoxAscent, m2.actualBoundingBoxDescent]; }'''

with sync_playwright() as p:
    br = p.chromium.launch(args=['--enable-gpu-rasterization', '--ignore-gpu-blocklist'])
    pg = br.new_page(viewport={'width': VW, 'height': VH})
    pg.goto(f'http://127.0.0.1:{port}/index.html?render=1&film=s05_gothic')
    pg.wait_for_function('window.__ready === true || !!window.__bootFailed', timeout=180000)
    meas = pg.evaluate(MEAS)
    print('P 字形 [abl,abr,aba,abd] =', meas[:4])
    print('2.4 文本 [abl,abr,aba,abd] =', meas[4:])
    N = 300
    frames = []
    for i in range(N):
        b64 = pg.evaluate(GRAB, i / 30.0)
        frames.append(np.asarray(Image.open(io.BytesIO(base64.b64decode(b64))).convert('RGB').resize((480, 270))).astype(np.int16))
    br.close()
srv.shutdown(); srv.server_close()

diffs = np.array([(np.abs(frames[i + 1] - frames[i]).max(axis=2) > 12).mean() * 100 for i in range(N - 1)])
print(f'帧对 {len(diffs)}  均值 {diffs.mean():.2f}%  中位 {np.median(diffs):.2f}%')
print('每 0.5s 窗口均值：')
for k in range(0, N - 1, 15):
    w = diffs[k:k + 15]
    print(f'  {k/30:5.2f}–{min(k+15,N-1)/30:5.2f}s  {w.mean():5.2f}%')
print('最热 25 帧对：')
for i in np.argsort(-diffs)[:25]:
    print(f'  {i/30:5.2f}→{(i+1)/30:5.2f}s  {diffs[i]:5.2f}%')
