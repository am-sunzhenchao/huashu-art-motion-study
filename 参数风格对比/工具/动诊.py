#!/usr/bin/env python3
# /// script
# dependencies = ["playwright", "numpy", "pillow"]
# ///
"""诊断 s19_munch 的相邻帧运动来源：整链 vs 关掉 warp。用法：
uv run --with playwright --with numpy --with pillow python 参数风格对比/工具/动诊.py [--nowarp]
"""
import sys, functools, http.server, socketserver, threading
from pathlib import Path
import numpy as np
from playwright.sync_api import sync_playwright

NOWARP = '--nowarp' in sys.argv
root = Path('参数风格对比/代码工程').resolve()

class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *x): pass
srv = socketserver.TCPServer(('127.0.0.1', 0), functools.partial(Q, directory=str(root)))
port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()

GRAB = '''async ([t, nowarp]) => {
  if (nowarp) {                     // 把整幅行/列扭换成原样拷贝，量出 warp 的贡献
    const or = KIT.warpRows, oc = KIT.warpCols;
    KIT.warpRows = (d, s) => d.drawImage(s, 0, 0);
    KIT.warpCols = (d, s) => d.drawImage(s, 0, 0);
    try { return await grab2(t); } finally { KIT.warpRows = or; KIT.warpCols = oc; }
  }
  return await grab2(t);
};
async function grab2(t) {
  const cv = window.__canvas, cx = cv.getContext('2d');
  window.renderSolo('s19_munch', t, {});
  const a = cx.getImageData(0, 0, 1920, 1080).data.slice();
  window.renderSolo('s19_munch', t + 1 / 30, {});
  const b = cx.getImageData(0, 0, 1920, 1080).data;
  const n = 1920 * 1080, out = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const j = i * 4;
    out[i] = (Math.abs(a[j] - b[j]) > 12 || Math.abs(a[j + 1] - b[j + 1]) > 12 || Math.abs(a[j + 2] - b[j + 2]) > 12) ? 1 : 0;
  }
  return Array.from(out);
}'''

with sync_playwright() as p:
    b = p.chromium.launch(args=['--enable-gpu-rasterization', '--ignore-gpu-blocklist'])
    pg = b.new_page(viewport={'width': 1920, 'height': 1080})
    pg.on('pageerror', lambda e: print('[pageerror]', e))
    pg.goto(f'http://127.0.0.1:{port}/index.html?render=1&film=s19_munch')
    pg.wait_for_function('window.__ready === true || !!window.__bootFailed', timeout=120000)
    ts = [0.5, 1.5, 2.5, 3.5, 4.2, 5.0, 5.8, 6.4, 7.2, 8.0, 9.0, 9.8]
    print('t      运动%')
    tot = []
    for t in ts:
        bits = np.array(pg.evaluate(GRAB, [t, NOWARP]))
        pct = bits.mean() * 100
        tot.append(pct)
        print(f'{t:<6} {pct:6.2f}')
    print(f'均值   {np.mean(tot):6.2f}   ({"warp 关" if NOWARP else "整链"})')
    b.close()
srv.shutdown(); srv.server_close()
