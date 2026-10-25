// 「大模型参数」× 1947 马蒂斯《爵士》剪纸（s30_matisse）——参数＝剪好落墙的彩色纸片。
// 手法照 30 号卡：一切内容是「饱和平涂的彩纸剪形（P.cut 剪刀折线：每 14–24px 取点＋种子抖动、直线相连）
// ＋钉纸投影（偏移 5,6 / blur 4 / α.3）」；增殖＝往墙上再贴一张纸（outBack 0.28–0.35s 弹贴）；
// 水粉刷痕只烤在白纸墙底、比原版减半减淡（1100 道 / α≤.075），纸片一律平涂。
// 拍一 0–3「参数」：黄星、红海藻、蓝叶三张参数纸片从上方翻飞落墙钉住（星缓转明灭、藻摆动卷边、叶翻面呼吸），
//   月牙、绿叶、粉滴小纸片随后落定；0.73 / -1.2 / 2.4 手写黑字（Caveat-600）写上白纸条，缓推凑近端详。
// 拍二 3–7「疯狂卷参数」：纸片从太阳心按距离逐张弹贴成大太阳海星网络（黄日轮＋八臂×三节海藻＋散落星月叶滴），
//   双蓝棋盘墙从四周逐格贴满（网络所在的中心留白岛）；臂节与纸片绕钉点摆、投影跟着挪；
//   剪贴本页码式计数纸片（白纸＋红 Caveat 大字）滚 1.5B→175B→540B→1T+，1T+ 揭示处 0.32s 快推到日心停住。
// 拍三 7–10「参数之外」：增殖停、摆幅收敛；蓝书摞（数据）、齿轮花（方法）、黑纸油灯（算力）依次升起钉墙挂白标签，
//   网络纸片逐枚点上黄星（从变多转为变亮变精）；黑纸大剪刀沿底部白纸幅上缘剪出「参数之外」纸条钉上，收在这一剪。
// 确定性：随机全 U.rng 种子，每帧是 (lt,t) 纯函数；无角色无脸。字：中文 LXGWWenKai-500、数字 Caveat-600，
// U.assertGlyphs 验形，全部避开 y>880。静态纸片全部 PAINT.cached 精灵（形状＋投影烤进小画布，帧内只 drawImage）。
SCENES['s30_matisse'] = (() => {
  const W = 1920, H = 1080, TAU = Math.PI * 2;
  const { clamp, lerp, ss, ease, seg, rng } = U, P = PAINT;
  const C = { white: '#f7f3e8', cobalt: '#1d4fb8', sky: '#4f95dc', yel: '#f7d21e', red: '#e2322a',
    black: '#141414', green: '#1f9a5a', pink: '#ef6f9a', org: '#f28a24' };
  const cut = P.cut;
  const SUN = { x: 880, y: 390, r: 118 };

  // ---------- 剪形（照卡：一切形状走剪刀折线） ----------
  function capsule(A, th, L, w) {               // th：相对竖直向上的角度
    const d = [Math.sin(th), -Math.cos(th)], n = [-d[1], d[0]], T = [A[0] + d[0] * (L - w / 2), A[1] + d[1] * (L - w / 2)], pts = [];
    pts.push([A[0] + n[0] * w * 0.42, A[1] + n[1] * w * 0.42]);
    pts.push([A[0] + d[0] * L * 0.5 + n[0] * w * 0.55, A[1] + d[1] * L * 0.5 + n[1] * w * 0.55]);
    for (let k = 0; k <= 6; k++) { const a = Math.atan2(n[1], n[0]) - k / 6 * Math.PI; pts.push([T[0] + Math.cos(a) * w / 2, T[1] + Math.sin(a) * w / 2]); }
    pts.push([A[0] + d[0] * L * 0.5 - n[0] * w * 0.55, A[1] + d[1] * L * 0.5 - n[1] * w * 0.55]);
    pts.push([A[0] - n[0] * w * 0.42, A[1] - n[1] * w * 0.42]);
    return pts;
  }
  function algaePath(len, width, lobes, seed, bend) {   // 锥形茎＋左右交替圆头手指，nonzero 一次填充＝并集
    const r = rng(seed), p = new Path2D(), sp = u => [Math.sin(u * 1.6) * bend * len * 0.25, -u * len];
    p.addPath(cut(capsule(sp(0), bend * 0.2, len, width * 0.24), seed, 16, 2));
    const n = Math.round(lobes * 2);
    for (let k = 0; k < n; k++) { const u = 0.12 + 0.78 * k / Math.max(1, n - 1), side = k % 2 ? 1 : -1, A = sp(u);
      const th = side * (1.05 - 0.55 * u) + bend * 0.2 + (r() - 0.5) * 0.25, L = width * (1.0 - 0.45 * u) * (0.8 + r() * 0.3), w = width * (0.34 - 0.12 * u);
      p.addPath(cut(capsule(A, th, L, w), seed + k * 11, 15, 1.8)); }
    return p;
  }
  const starPath = (r0, r1, n, seed) => { const r = rng(seed), pts = [];
    for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * TAU + (r() - 0.5) * 0.25, rr = (i % 2 ? r1 : r0) * (0.75 + r() * 0.45); pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
    return cut(pts, seed * 17 + 5, 14, 1.8); };
  const moonP = (r, seed) => { const p = new Path2D();                        // 月牙＝两圈剪刀折线，evenodd
    p.addPath(cut(P.ellipsePts(0, 0, r, r, 26), seed, 13, 1.8));
    p.addPath(cut(P.ellipsePts(r * 0.36, 0, r * 0.82, r * 0.82, 22), seed + 3, 12, 1.6));
    return p; };
  const dropPts = r => { const pts = [];
    for (let k = 0; k <= 12; k++) { const a = Math.PI - k / 12 * Math.PI; pts.push([Math.cos(a) * r * 0.62, 0.22 * r + Math.sin(a) * r * 0.74]); }
    pts.push([0.4 * r, -0.5 * r], [0.18 * r, -1.02 * r], [0, -1.48 * r], [-0.18 * r, -1.02 * r], [-0.4 * r, -0.5 * r]);
    return pts; };

  // ---------- 纸片精灵：形状＋钉纸投影烤进小画布，钉点在 (ox,oy) ----------
  const paper = (key, w, h, ox, oy, fn) => ({ cv: P.cached('s30p_' + key, Math.round(w), Math.round(h), g => {
    g.translate(ox, oy); g.shadowColor = 'rgba(10,20,40,.3)'; g.shadowOffsetX = 5; g.shadowOffsetY = 6; g.shadowBlur = 4; fn(g);
  }), ox, oy });
  const stamp = (c, p, x, y, rot, sx, sy) => { c.save(); c.translate(x, y); if (rot) c.rotate(rot); c.scale(sx, sy); c.drawImage(p.cv, -p.ox, -p.oy); c.restore(); };
  // 白纸墙底（水粉刷痕烤进去：比原版 2600 道 / α.04–.13 减半减淡）
  const wall = () => P.cached('s30_wall', W, H, g => {
    g.fillStyle = C.white; g.fillRect(0, 0, W, H);
    const r = rng(2030); g.lineCap = 'round';
    for (let i = 0; i < 1100; i++) { const x = r() * W, y = r() * H, a = -0.25 + (r() - 0.5) * 0.5, L = 50 + r() * 190;
      g.strokeStyle = r() < 0.5 ? 'rgba(255,255,255,' + (0.03 + r() * 0.045).toFixed(3) + ')' : 'rgba(0,0,0,' + (0.022 + r() * 0.038).toFixed(3) + ')';
      g.lineWidth = 5 + r() * 11; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }
  });
  // 现画的白纸条（带字，逐帧画）：居中 (0,0) 的 w×h 剪刀边纸条＋红钉
  const RECTS = {};
  const rectShape = (w, h) => RECTS[w + 'x' + h] || (RECTS[w + 'x' + h] = cut([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], 61 + w, 22, 2.2));
  function paperStrip(c, w, h, pinX, pinY) {
    c.fillStyle = C.white; c.shadowColor = 'rgba(10,20,40,.3)'; c.shadowOffsetX = 5; c.shadowOffsetY = 6; c.shadowBlur = 4;
    c.fill(rectShape(w, h)); c.shadowColor = 'rgba(0,0,0,0)';
    if (pinX != null) { c.fillStyle = C.red; c.beginPath(); c.arc(pinX, pinY, 5.5, 0, TAU); c.fill(); }
  }

  // ---------- 静态数据（种子一次性生成） ----------
  const HERO = [      // 拍一三张参数纸片（star 明灭缓转 / algae 摆动卷边 / leaf 翻面呼吸）
    { kind: 'star', x: 700, y: 480, col: C.yel, r: 92, num: '0.73', nx: 848, ny: 596, t0: 0.1, dir: 1, ph: 0 },
    { kind: 'algae', x: 960, y: 565, col: C.red, len: 232, wid: 132, lobes: 3.5, num: '-1.2', nx: 1128, ny: 684, t0: 0.38, dir: -1, ph: 1.9 },
    { kind: 'leaf', x: 1185, y: 445, col: C.cobalt, rx: 104, ry: 50, num: '2.4', nx: 1342, ny: 552, t0: 0.64, dir: 1, ph: 3.8 },
  ];
  const SIDE = [      // 拍一的小纸片：月牙、绿叶、粉滴、橙滴
    { kind: 'moon', x: 1500, y: 252, col: C.yel, r: 52, t0: 0.95, dir: 1, ph: 0.6 },
    { kind: 'leaf', x: 415, y: 300, col: C.green, rx: 60, ry: 29, t0: 1.18, dir: -1, ph: 2.4 },
    { kind: 'leaf', x: 1585, y: 628, col: C.green, rx: 54, ry: 26, t0: 1.42, dir: 1, ph: 4.5 },
    { kind: 'drop', x: 545, y: 648, col: C.pink, r: 40, t0: 1.6, dir: -1, ph: 1.2 },
    { kind: 'drop', x: 243, y: 558, col: C.org, r: 30, t0: 1.78, dir: 1, ph: 5.1 },
  ];
  const NET = (() => {   // 拍二散落纸片：星月叶滴藻，按到日心的距离出生
    const r = rng(777), out = [], kinds = ['star', 'moon', 'leaf', 'drop', 'algae'], cols = [C.yel, C.pink, C.green, C.org, C.red];
    let guard = 0;
    while (out.length < 26 && guard++ < 700) {
      const a = r() * TAU, d = 130 + r() * 450;
      const x = SUN.x + Math.cos(a) * d * 1.18, y = SUN.y + Math.sin(a) * d * 0.9;
      if (x < 100 || x > 1820 || y < 90 || y > 690) continue;
      if (out.some(p => Math.hypot(p.x - x, p.y - y) < 135)) continue;
      const s = 0.7 + r() * 0.55;
      out.push({ kind: kinds[(r() * 5) | 0], col: cols[(r() * 5) | 0], x, y, d, s, rot: (r() - 0.5) * 0.7, ph: r() * TAU, amp: 0.07 + r() * 0.06 });
    }
    out.sort((a, b) => a.d - b.d);
    out.forEach((p, i) => { p.birth = 3.4 + 2.55 * i / out.length; });
    return out;
  })();
  const ARMS = (() => {  // 八臂×三节海藻（按节半径出生＝从太阳心伸出去）
    const r = rng(512), cols = [C.green, C.pink, C.org], out = [];
    const lens = [150, 118, 90], wid = [96, 74, 58], radii = [152, 264, 366];
    for (let k = 0; k < 8; k++) {
      const th = k * TAU / 8 + (r() - 0.5) * 0.3;
      for (let m = 0; m < 3; m++) {
        const rr = radii[m] + (r() - 0.5) * 22;
        const x = SUN.x + Math.cos(th) * rr * 1.12, y = SUN.y + Math.sin(th) * rr * 0.92;
        out.push({ x, y, th, len: lens[m], wid: wid[m] * (0.85 + r() * 0.3), lobes: 2.5 - m * 0.4, col: cols[(k + m) % 3],
          seed: 80 + k * 3 + m, ph: r() * TAU, d: Math.hypot(x - SUN.x, y - SUN.y),
          birth: 3.32 + 2.5 * Math.pow(rr / 366, 1.35) + r() * 0.1, key: 'a' + k + '_' + m });
      }
    }
    return out;
  })();
  const CHECK = (() => { // 双蓝棋盘墙（《波利尼西亚》240×216 剪纸块）：网络所在的中心留白岛，其余从最外格往里贴
    const out = [];
    for (let j = 0; j < 5; j++) for (let i = 0; i < 8; i++) {
      const cx = i * 240 + 120, cy = j * 216 + 108, d = Math.hypot(cx - SUN.x, cy - SUN.y);
      if (d < 452 + P.noise(cx * 0.006 + 9, cy * 0.006 + 7) * 88) continue;
      out.push({ x: i * 240, y: j * 216, cx, cy, i, j, d });
    }
    const dmax = Math.max.apply(null, out.map(o => o.d));
    out.forEach(o => { o.birth = 3.5 + 2.45 * (1 - o.d / dmax) + (o.i * 7 + o.j * 3) % 5 * 0.012; });
    return out;
  })();

  // ---------- 精灵 ----------
  let sunSpr, booksSpr, gearRing, gearCore, lampSpr, bladeSpr, stockSpr, gildP;
  function buildPiece(p, tag) {
    const key = tag + '_' + (p.x | 0) + '_' + (p.y | 0);
    if (p.kind === 'star') { const D = p.r * 2.7 + 40; p.spr = paper(key, D, D, D / 2, D / 2, g => { g.fillStyle = p.col; g.fill(starPath(p.r, p.r * 0.42, 5, tag.length * 31 + p.x | 0)); }); p.gdx = 26; p.gdy = -22; }
    else if (p.kind === 'moon') { const D = p.r * 2.7 + 40; p.spr = paper(key, D, D, D / 2, D / 2, g => { g.fillStyle = p.col; g.fill(moonP(p.r, tag.length * 7 + 2), 'evenodd'); }); p.gdx = 24; p.gdy = -18; }
    else if (p.kind === 'leaf') { const D1 = p.rx * 2.7 + 40, D2 = p.ry * 2.7 + 40; p.spr = paper(key, D1, D2, D1 / 2, D2 / 2, g => { g.fillStyle = p.col; g.fill(cut(P.ellipsePts(0, 0, p.rx, p.ry, 22), tag.length * 13 + 1, 13, 1.7)); }); p.gdx = 20; p.gdy = -14; }
    else if (p.kind === 'drop') { const D = p.r * 3 + 44; p.spr = paper(key, D, D, D / 2, D * 0.62, g => { g.fillStyle = p.col; g.fill(cut(dropPts(p.r), tag.length * 5 + 3, 12, 1.6)); }); p.gdx = 18; p.gdy = -30; }
    else { const w2 = p.wid * 2.3 + 44, h2 = p.len * 1.25 + 30; p.spr = paper(key, w2, h2, w2 / 2, h2 - 12, g => { g.fillStyle = p.col; g.fill(algaePath(p.len, p.wid, p.lobes || 2.5, tag.length * 7 + 3, 0.35)); }); p.gdx = 13; p.gdy = -p.len * 0.6; }
  }
  function buildSprites() {
    HERO.forEach((p, i) => buildPiece(p, 'h' + i));
    SIDE.forEach((p, i) => buildPiece(p, 's' + i));
    NET.forEach((p, i) => {
      if (p.kind === 'star') { p.r = 46 * p.s; }
      else if (p.kind === 'moon') { p.r = 40 * p.s; }
      else if (p.kind === 'leaf') { p.rx = 62 * p.s; p.ry = 30 * p.s; }
      else if (p.kind === 'drop') { p.r = 34 * p.s; }
      else { p.len = 105 * p.s; p.wid = 66 * p.s; }
      buildPiece(p, 'n' + i); });
    ARMS.forEach(a => { a.spr = paper(a.key, a.wid * 2.3 + 44, a.len * 1.25 + 30, (a.wid * 2.3 + 44) / 2, a.len * 1.25 + 18, g => { g.fillStyle = a.col; g.fill(algaePath(a.len, a.wid, a.lobes, a.seed, 0.3)); }); });
    CHECK.forEach(o => { o.spr = paper('chk' + o.i + '_' + o.j, 268, 244, 134, 122, g => { g.fillStyle = (o.i + o.j) % 2 ? C.cobalt : C.sky; g.fill(cut([[-120, -108], [120, -108], [120, 108], [-120, 108]], o.i * 13 + o.j * 31, 24, 2.4)); }); o.ox = 134; o.oy = 122; });
    sunSpr = paper('sun', 340, 340, 170, 170, g => { g.fillStyle = C.yel; g.fill(cut(P.ellipsePts(0, 0, 118, 118, 40), 41, 20, 2.2)); g.fillStyle = C.red; g.fill(cut(P.ellipsePts(0, 10, 44, 44, 26), 42, 15, 1.8)); });
    booksSpr = paper('books', 210, 130, 105, 122, g => {
      const r = rng(88), ys = [0, 30, 57, 82], ws = [150, 134, 120, 106], hs = [30, 27, 25, 22], cols = [C.sky, C.cobalt, C.sky, C.sky];
      for (let i = 0; i < 4; i++) { const dx = (r() - 0.5) * 14, w = ws[i], h = hs[i], y = -ys[i] - h;
        g.fillStyle = cols[i]; g.fill(cut([[-w / 2 + dx, y], [w / 2 + dx, y], [w / 2 + dx, y + h], [-w / 2 + dx, y + h]], 88 + i, 16, 1.6));
        g.fillStyle = C.white; g.fill(cut([[w / 2 + dx - 15, y + 3], [w / 2 + dx - 2, y + 4], [w / 2 + dx - 2, y + h - 3], [w / 2 + dx - 15, y + h - 3]], 92 + i, 9, 1));
        g.fillStyle = 'rgba(20,20,20,.35)'; g.fillRect(-w / 2 + dx, y, w, 2.5); }
    });
    gearRing = paper('gearRing', 310, 310, 155, 155, g => {
      for (let k = 0; k < 8; k++) { g.save(); g.rotate(k * TAU / 8); g.fillStyle = k % 2 ? C.sky : C.cobalt;
        const pp = new Path2D();
        pp.addPath(cut(P.ellipsePts(62, 0, 44, 17, 20), 300 + k, 12, 1.5));
        pp.addPath(cut([[92, -15], [107, -7], [107, 7], [92, 15]], 310 + k, 9, 1.2));
        g.fill(pp); g.restore(); }
    });
    gearCore = paper('gearCore', 100, 100, 50, 50, g => { g.fillStyle = C.red; g.fill(cut(P.ellipsePts(0, 0, 37, 37, 22), 321, 12, 1.5)); g.fillStyle = C.yel; g.fill(cut(P.ellipsePts(0, 0, 13, 13, 14), 322, 9, 1)); });
    lampSpr = paper('lamp', 240, 290, 120, 268, g => {
      g.fillStyle = C.black;
      const solid = new Path2D();
      solid.addPath(cut([[-74, 2], [74, 2], [58, -16], [-58, -16]], 71, 12, 1.4));
      solid.addPath(cut([[-64, -14], [-44, -100], [44, -100], [64, -14]], 72, 12, 1.4));
      solid.addPath(cut([[-9, -100], [9, -100], [7, -118], [-7, -118]], 73, 9, 1.2));
      solid.addPath(cut([[-17, -118], [17, -118], [13, -134], [-13, -134]], 74, 9, 1.2));
      g.fill(solid);
      const chim = new Path2D();
      chim.addPath(cut([[-27, -134], [-32, -212], [32, -212], [27, -134]], 75, 11, 1.3));
      chim.addPath(cut([[-19, -140], [-22, -204], [22, -204], [19, -140]], 76, 10, 1.2));
      g.fill(chim, 'evenodd');
    });
    bladeSpr = paper('blade', 350, 130, 100, 62, g => {      // 剪刀的一片：刃（+x）＋柄环，枢轴在原点；环孔抠透
      g.fillStyle = C.black;
      const p = new Path2D();
      p.addPath(cut([[4, -10], [148, -7.5], [228, -2], [234, 0], [228, 2], [148, 7], [4, 9]], 91, 12, 1.4));
      p.addPath(cut([[2, -9], [-38, -21], [-52, -27]], 92, 10, 1.2));
      p.addPath(cut(P.ellipsePts(-64, -30, 27, 23, 20), 93, 11, 1.4));
      g.fill(p);
      g.shadowColor = 'rgba(0,0,0,0)'; g.globalCompositeOperation = 'destination-out';
      g.fill(cut(P.ellipsePts(-64, -30, 16, 13, 16), 94, 10, 1));
    });
    stockSpr = paper('stock', 1580, 360, 790, 178, g => { g.fillStyle = C.white; g.fill(cut([[-750, -170], [750, -178], [744, 172], [-744, 176]], 61, 26, 2.2)); });
    gildP = starPath(15, 6.5, 5, 404);
    wall();
  }

  // ---------- 动起来的部分 ----------
  function pieceLife(p, lt) {   // 落墙（翻飞下滑＋落定弹）→ 绕钉点小循环
    const q = ss(p.t0, p.t0 + 0.92, lt);
    if (q < 1) { const e = ease.inOut(q);
      return { x: p.x + Math.sin(q * 5.2 + p.t0 * 7) * 64 * (1 - q), y: p.y - (1 - e) * 830, rot: (1 - q) * 2.4 * p.dir, s: 1, sway: 0 }; }
    const pop = 0.86 + 0.14 * ease.outBack(ss(p.t0 + 0.92, p.t0 + 1.22, lt));
    return { x: p.x, y: p.y, rot: 0, s: pop, sway: ss(p.t0 + 0.92, p.t0 + 1.5, lt) };
  }
  function drawPiece(c, p, life, lt, t, ampMul, heroGrow) {
    const g1 = 1 + 0.06 * heroGrow, swy = life.sway * (0.35 + 0.65 * ampMul);   // 拍三摆幅收敛（星明灭不收）
    let rot = life.rot, sx = 1, sy = 1, gl = 1;
    if (p.kind === 'star') { rot += t * 0.05 + 0.1 * swy * Math.sin(t * 1.8 + p.ph); gl = 0.94 + 0.06 * Math.sin(t * 6 + p.ph); }
    else if (p.kind === 'algae') { rot += 0.11 * swy * Math.sin(t * 2.6 + p.ph); sx = 0.93 + 0.07 * Math.sin(t * 3.3 + p.ph) * (0.3 + 0.7 * swy); }
    else if (p.kind === 'leaf') { rot += 0.08 * swy * Math.sin(t * 1.9 + p.ph); sx = 0.94 + 0.08 * Math.sin(t * 2.1 + p.ph) * (0.3 + 0.7 * swy); }
    else if (p.kind === 'moon') { rot += t * 0.03 + 0.07 * swy * Math.sin(t * 1.6 + p.ph); }
    else { rot += 0.09 * swy * Math.sin(t * 2.1 + p.ph); sy = 1 + 0.04 * Math.sin(t * 2.9 + p.ph) * swy; }
    const S = life.s * p.s * g1;
    c.save(); c.translate(life.x, life.y); c.rotate(rot); c.scale(S * sx * gl, S * sy * gl);
    c.drawImage(p.spr.cv, -p.spr.ox, -p.spr.oy);
    if (p.gBirth && lt >= p.gBirth) {   // 拍三点上的黄星（跟纸一起动）
      const gq = ease.outBack(ss(p.gBirth, p.gBirth + 0.3, lt)), gs = gq * (0.92 + 0.1 * Math.sin(t * 5 + p.ph));
      c.save(); c.translate(p.gdx, p.gdy); c.scale(gs, gs);
      c.shadowColor = 'rgba(10,20,40,.28)'; c.shadowOffsetX = 3; c.shadowOffsetY = 4; c.shadowBlur = 3;
      c.fillStyle = C.yel; c.fill(gildP); c.restore();
    }
    c.restore();
  }
  function countStr(lt) {
    if (lt < 3.62) return '1.5B';
    if (lt >= 6.3) return '1T+';
    const K = [[3.62, 4.5, 1.5, 175], [4.5, 5.4, 175, 540], [5.4, 6.3, 540, 1000]];
    for (let k = 0; k < K.length; k++) { const a = K[k][0], b = K[k][1];
      if (lt >= a && lt < b) { const v = K[k][2] + (K[k][3] - K[k][2]) * ease.inOut((lt - a) / (b - a)); return (v < 10 ? v.toFixed(1) : String(Math.round(v))) + 'B'; } }
    return '1.5B';
  }
  function titleStrip(c, lt, t0, t1, txt, size, sw) {
    const a = ease.outBack(clamp((lt - t0) / 0.32, 0, 1)) * (1 - ss(t1 - 0.27, t1, lt));
    if (a <= 0.02) return;
    c.save(); c.translate(110 + sw / 2, 116); c.rotate(-0.012); c.scale(a, a);
    paperStrip(c, sw, 112, -sw / 2 + 22, -34);
    c.fillStyle = C.black; c.font = size + 'px "LXGWWenKai-500"'; c.letterSpacing = '6px';
    c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillText(txt, 3, 42); c.letterSpacing = '0px';
    c.restore();
  }
  function counter(c, lt) {
    if (lt < 3.2) return;
    const fade = 1 - ss(7.0, 7.35, lt); if (fade <= 0) return;
    const inn = ease.outBack(clamp((lt - 3.2) / 0.34, 0, 1));
    let pop = 1; [3.6, 4.5, 5.4, 6.3].forEach(x => { pop += 0.05 * ss(x, x + 0.1, lt) * (1 - ss(x + 0.1, x + 0.42, lt)); });
    c.save(); c.globalAlpha = fade; c.translate(1314, 129); c.rotate(0.008); c.scale(inn * pop * (1 - 0.22 * (1 - fade)), inn * pop * (1 - 0.22 * (1 - fade)));
    paperStrip(c, 328, 170, -142, -63);
    c.fillStyle = C.black; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.font = '34px "LXGWWenKai-500"'; c.fillText('参数量', 0, -40);
    c.font = '90px "Caveat-600"'; c.fillStyle = C.red; c.fillText(countStr(lt), 0, 56);
    c.strokeStyle = C.red; c.lineWidth = 3;
    c.beginPath(); c.moveTo(-112, 76); c.lineTo(112, 76); c.moveTo(-112, 83); c.lineTo(112, 83); c.stroke();
    c.restore();
  }
  function numStrip(c, lt, x, y, txt, t0) {
    const a = ease.outBack(clamp((lt - t0) / 0.3, 0, 1)) * (1 - ss(3.0, 3.3, lt));
    if (a <= 0.02) return;
    c.save(); c.globalAlpha = clamp(a * 1.6, 0, 1); c.translate(x, y + (1 - Math.min(1, a)) * 26); c.rotate(-0.02); c.scale(a, a);
    paperStrip(c, 176, 76, -64, -24);
    c.fillStyle = C.black; c.font = '48px "Caveat-600"'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.fillText(txt, 4, 16);
    c.restore();
  }
  function label(c, lt, x, y, txt, t0) {
    const a = ease.outBack(clamp((lt - t0) / 0.3, 0, 1));
    if (a <= 0.02) return;
    c.save(); c.translate(x, y); c.rotate(0.015); c.scale(a, a);
    paperStrip(c, 176, 64, -64, -18);
    c.fillStyle = C.black; c.font = '42px "LXGWWenKai-500"'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.fillText(txt, 0, 15);
    c.restore();
  }
  function scissors(c, lt) {    // 滑入 → 沿 stock 上缘剪过去（刃一张一合）→ 合刃停住；返回剪点 x
    if (lt < 8.55) return -999;
    let x, y, rot, ang;
    if (lt < 8.8) { const q = ease.out(seg(lt, 8.55, 8.8)); x = lerp(-200, 660, q); y = lerp(718, 782, q); rot = lerp(-0.42, -0.05, q); ang = 0.24 * ss(8.55, 8.7, lt); }
    else if (lt < 9.55) { const q = seg(lt, 8.8, 9.55); x = lerp(660, 1240, q); y = 782; rot = -0.05; ang = 0.045 + 0.185 * Math.abs(Math.sin(q * Math.PI * 2.6)); }
    else { const q = ss(9.55, 9.78, lt); x = lerp(1240, 1252, q); y = 782 - 2 * q; rot = -0.05 + 0.02 * q; ang = lerp(0.045, 0.025, q); }
    c.save(); c.translate(x, y); c.rotate(rot);
    c.save(); c.rotate(-ang); c.drawImage(bladeSpr.cv, -bladeSpr.ox, -bladeSpr.oy); c.restore();
    c.save(); c.scale(1, -1); c.rotate(-ang); c.drawImage(bladeSpr.cv, -bladeSpr.ox, -bladeSpr.oy); c.restore();
    c.restore();
    return x;
  }
  function flame(c, x, y, t) {
    const fl = 0.86 + 0.13 * Math.sin(t * 8.3) + 0.05 * Math.sin(t * 13.7 + 1);
    c.save(); c.translate(x, y);
    c.shadowColor = 'rgba(10,20,40,.28)'; c.shadowOffsetX = 3; c.shadowOffsetY = 4; c.shadowBlur = 3;
    c.fillStyle = C.yel; c.save(); c.scale(1, fl); c.rotate(0.05 * Math.sin(t * 5.1)); c.fill(cut(P.ellipsePts(0, 0, 14, 20, 18), 81, 9, 1.1)); c.restore();
    c.fillStyle = C.org; c.save(); c.scale(0.62, 0.66 * fl); c.fill(cut(P.ellipsePts(0, 2, 14, 20, 16), 82, 8, 1)); c.restore();
    c.restore();
  }

  return {
    init() {
      U.assertGlyphs('64px "LXGWWenKai-500"', '参数疯狂卷之外数据方法算力量', 's30_matisse 屏上字/标签/计数牌');
      U.assertGlyphs('48px "Caveat-600"', '0.73-1.2 2.4 1.5B 175B 540B 1T+ 0123456789.', 's30_matisse 手写数字');
      buildSprites();
    },
    draw(c, lt, t) {
      const conv = ss(7.0, 9.4, lt), ampMul = 1 - 0.72 * conv;          // 拍三摆幅收敛
      const bump1T = ss(6.28, 6.5, lt) * (1 - ss(6.5, 7.05, lt));       // 1T+ 日轮一次弹
      // 运镜：近景缓推 → 缓拉远展开 → 1T+ 快推到日心停住 → 缓拉收全貌停机
      let z, cx, cy;
      if (lt < 3) { const q = ss(0, 2.7, lt); z = lerp(1.02, 1.16, q); cx = lerp(960, 890, q); cy = lerp(540, 505, q); }
      else if (lt < 6.3) { const q = ss(3, 6.3, lt); z = lerp(1.16, 1.03, q); cx = lerp(890, 960, q); cy = lerp(505, 540, q); }
      else if (lt < 6.62) { const q = ease.inOut(seg(lt, 6.3, 6.62)); z = lerp(1.03, 1.26, q); cx = lerp(960, 860, q); cy = lerp(540, 400, q); }
      else if (lt < 7.25) { z = 1.26; cx = 860; cy = 400; }
      else { const q = ss(7.25, 9.3, lt); z = lerp(1.26, 1.1, q); cx = lerp(860, 960, q); cy = lerp(400, 540, q); }   // 拉回幅度压小：剪纸边密，整幅扫边每帧帧差得压在全球中位数 6 倍以内
      c.save(); c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-cx, -cy);
      // ① 白纸墙（水粉刷痕烤在墙底）
      c.fillStyle = C.white; c.fillRect(-500, -500, W + 1000, H + 1000);
      c.drawImage(wall(), 0, 0);
      // ② 双蓝棋盘墙（从最外格往里贴）
      for (let k = 0; k < CHECK.length; k++) { const o = CHECK[k], q = ss(o.birth, o.birth + 0.28, lt); if (q <= 0) continue;
        const s = ease.outBack(q); c.save(); c.translate(o.cx, o.cy); c.scale(s, s); c.drawImage(o.spr.cv, -o.ox, -o.oy); c.restore(); }
      // ③ 八臂×三节海藻（从太阳心按距离伸出，绕钉点摆）
      for (let k = 0; k < ARMS.length; k++) { const a = ARMS[k], q = ss(a.birth, a.birth + 0.3, lt); if (q <= 0) continue;
        const rot = a.th + Math.PI / 2 + (0.085 * Math.sin(t * 2.3 + a.ph) + 0.03 * Math.sin(t * 3.7 + a.ph * 2)) * ampMul;
        const sx = 0.93 + 0.07 * Math.sin(t * 3.1 + a.ph) * ampMul;
        stamp(c, a.spr, a.x, a.y, rot, ease.outBack(q) * sx, ease.outBack(q)); }
      // ④ 散落纸片（按距离出生、绕钉点摆、翻面呼吸；拍三逐枚点上黄星）
      for (let k = 0; k < NET.length; k++) { const p = NET[k], q = ss(p.birth, p.birth + 0.3, lt); if (q <= 0) continue;
        const life = { x: p.x, y: p.y, rot: p.rot, s: ease.outBack(q) * p.s, sway: 1 };
        const rot = life.rot + 0.09 * ampMul * Math.sin(t * 2.1 + p.ph);
        let sx = 1, sy = 1, gl = 1;
        if (p.kind === 'star') { gl = 0.92 + 0.08 * Math.sin(t * 6 + p.ph); }
        else if (p.kind === 'leaf' || p.kind === 'algae') { sx = 0.93 + 0.07 * Math.sin(t * 3 + p.ph) * ampMul; }
        else if (p.kind === 'drop') { sy = 1 + 0.05 * Math.sin(t * 2.8 + p.ph); }
        c.save(); c.translate(p.x, p.y); c.rotate(rot); c.scale(life.s * sx * gl, life.s * sy * gl);
        c.drawImage(p.spr.cv, -p.spr.ox, -p.spr.oy);
        const gb = 7.3 + 1.55 * k / NET.length;
        if (lt >= gb) { const gq = ease.outBack(ss(gb, gb + 0.3, lt)), gs = gq * (0.92 + 0.1 * Math.sin(t * 5 + p.ph));
          c.save(); c.translate(p.gdx, p.gdy); c.scale(gs, gs);
          c.shadowColor = 'rgba(10,20,40,.28)'; c.shadowOffsetX = 3; c.shadowOffsetY = 4; c.shadowBlur = 3;
          c.fillStyle = C.yel; c.fill(gildP); c.restore(); }
        c.restore();
      }
      // ⑤ 太阳（pop 出场＋缓转呼吸＋1T+ 一次弹）
      { const q = ss(3.2, 3.52, lt);
        if (q > 0) { const s = ease.outBack(q) * (1 + 0.012 * Math.sin(t * 2) + 0.085 * bump1T);
          stamp(c, sunSpr, SUN.x, SUN.y, t * 0.04, s, s); } }
      // ⑥ 三张参数纸片＋手写数字条（拍一落下、端详放大；拍二起常驻网络中）
      const heroGrow = ss(0.4, 2.8, lt) * (1 - ss(3.05, 3.5, lt));
      HERO.forEach((p, i) => {
        const life = pieceLife(p, lt);
        drawPiece(c, p, life, lt, t, ampMul, heroGrow);
        if (lt < 3.35) numStrip(c, lt, p.nx, p.ny, p.num, 1.68 + i * 0.2);
      });
      SIDE.forEach(p => drawPiece(c, p, pieceLife(p, lt), lt, t, ampMul, heroGrow));
      // ⑦ 拍三三件物：蓝书摞（数据）、齿轮花（方法）、黑纸油灯（算力）
      { const pr = ease.outBack(clamp(seg(lt, 7.15, 7.7), 0, 1)), al = ss(7.15, 7.55, lt);
        if (pr > 0) { c.save(); c.globalAlpha = al; stamp(c, booksSpr, 330, 670 + (1 - pr) * 300, 0, pr, pr); c.restore(); } }
      { const pr = ease.outBack(clamp(seg(lt, 7.55, 8.1), 0, 1)), al = ss(7.55, 7.95, lt);
        if (pr > 0) { const dy = (1 - pr) * 300; c.save(); c.globalAlpha = al;
          stamp(c, gearRing, 880, 630 + dy, t * 0.35, pr, pr); stamp(c, gearCore, 880, 630 + dy, 0, pr, pr); c.restore(); } }
      { const pr = ease.outBack(clamp(seg(lt, 7.95, 8.5), 0, 1)), al = ss(7.95, 8.35, lt);
        if (pr > 0) { const dy = (1 - pr) * 300, lx = 1450, ly = 675 + dy;
          flame(c, lx, ly - 170, t);
          stamp(c, lampSpr, lx, ly, 0, pr, pr);
          c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = al;
          const gg = c.createRadialGradient(lx, ly - 170, 6, lx, ly - 170, 150);
          gg.addColorStop(0, 'rgba(242,138,36,' + (0.1 + 0.05 * Math.sin(t * 8.3)).toFixed(3) + ')'); gg.addColorStop(1, 'rgba(242,138,36,0)');
          c.fillStyle = gg; c.fillRect(lx - 160, ly - 330, 320, 320); c.restore(); } }
      label(c, lt, 522, 653, '数据', 7.75); label(c, lt, 1105, 641, '方法', 8.15); label(c, lt, 1662, 655, '算力', 8.55);
      // ⑧ 底部白纸幅＋剪刀剪出「参数之外」纸条（收在这一剪）
      { const q = ease.outBack(clamp(seg(lt, 7.35, 7.75), 0, 1));
        if (q > 0) stamp(c, stockSpr, 960, 938, 0, q, q); }
      const scX = scissors(c, lt);
      { const sq = ss(8.82, 9.6, lt), setl = ss(9.55, 9.85, lt);
        if (sq > 0 && scX > -900) {
          const revW = clamp((scX - 690) / 550, 0, 1) * 640;
          c.save(); c.translate(960, 796 + (1 - ease.outBack(setl)) * 26); c.rotate(-0.021); c.scale(sq, sq);
          paperStrip(c, 640, 104, null);
          if (revW > 6) { c.save(); c.beginPath(); c.rect(-330, -70, revW + 8, 140); c.clip();
            c.fillStyle = C.black; c.font = '62px "LXGWWenKai-500"'; c.letterSpacing = '8px';
            c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillText('参数之外', 4, 22); c.letterSpacing = '0px'; c.restore(); }
          if (setl > 0.4) { c.fillStyle = C.red; c.beginPath(); c.arc(-294, -38, 5.5, 0, TAU); c.fill(); }
          c.restore();
        } }
      // ⑨ 屏上字（纸条式）＋计数牌
      titleStrip(c, lt, 0.06, 2.98, '参数', 78, 268);
      titleStrip(c, lt, 3.06, 6.98, '疯狂卷参数', 66, 438);
      counter(c, lt);
      c.restore();
    },
  };
})();
