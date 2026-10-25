#!/usr/bin/env python3
# /// script
# dependencies = ["playwright", "numpy", "pillow"]
# """区域差分：渲相邻两帧，按 8×6 网格报变化像素占比，找出热点到底在哪块画面。"""
import base64, functools, http.server, io, socketserver, threading, sys
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

pairs = [float(x) for x in sys.argv[1:]] or [5.30, 3.47, 1.00, 6.00]
with sync_playwright() as p:
    br = p.chromium.launch(args=['--enable-gpu-rasterization', '--ignore-gpu-blocklist'])
    pg = br.new_page(viewport={'width': VW, 'height': VH})
    pg.goto(f'http://127.0.0.1:{port}/index.html?render=1&film=s05_gothic')
    pg.wait_for_function('window.__ready === true || !!window.__bootFailed', timeout=180000)
    out = {}
    for t0 in pairs:
        a = np.asarray(Image.open(io.BytesIO(base64.b64decode(pg.evaluate(GRAB, t0)))).convert('RGB')).astype(np.int16)
        b = np.asarray(Image.open(io.BytesIO(base64.b64decode(pg.evaluate(GRAB, t0 + 1 / 30)))).convert('RGB')).astype(np.int16)
        out[t0] = (a, b)
    br.close()
srv.shutdown(); srv.server_close()

GX, GY = 8, 6
for t0, (a, b) in out.items():
    d = (np.abs(b - a).max(axis=2) > 12)
    print(f'--- {t0:.2f}→{t0+1/30:.2f}s  总变化 {d.mean()*100:.2f}% ---')
    for gy in range(GY):
        row = []
        for gx in range(GX):
            reg = d[gy*VH//GY:(gy+1)*VH//GY, gx*VW//GX:(gx+1)*VW//GX]
            row.append(f'{reg.mean()*100:5.1f}')
        print('  ' + ' '.join(row))
    ys, xs = np.where(d)
    if len(ys):
        print(f'  变化质心 x≈{xs.mean():.0f} y≈{ys.mean():.0f}  x范围[{xs.min()},{xs.max()}] y范围[{ys.min()},{ys.max()}]  变化px {len(ys)}')
    im = Image.fromarray((d*255).astype(np.uint8))
    im.save(Path(__file__).parent / f'diff_{t0:06.2f}.png')
