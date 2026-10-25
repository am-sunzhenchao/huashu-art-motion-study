// 利希滕斯坦波普（1962 Pop）——「大模型参数」三问 · 10 秒单镜头（s13_pop）。
// 构图为「参数」题材重设计（不搬速通片的房间构图）：
//   拍一 0–3   近景特写：三颗大本戴网点＝参数本体（0.73 / −1.2 / 2.4），呼吸、摇摆、明灭＋"0.73!" 拟声框 30fps 抖动＋思考泡泡三点轮闪；
//   拍二 3–7   网点增殖成海：沃霍尔四格逐格砸入里程碑（1.5B→175B!→540B!→1T+! 最大一格带星形放射线定格红底），
//              右下计数板里程数字真实滚动 1.5B→1.1T、红色刻度表上涨；背景网点密度随里程碑逐级加密变大；
//   拍三 7–10  增殖停住：三格漫画分镜（书摞=数据、齿轮=方法、电池=算力）依次升起归位；参数点减量、排成三排、
//              逐颗点亮白高光（变亮变精），墨线把点串成网、垂到三格（网络收稳）；思考泡泡回来三点轮闪收尾。
// 镜头：整片一条连续运镜——近景缓推 → 缓拉远看增殖全貌 → 停住缓拉收全貌（cos 缓动，边界零斜率，无猛切）。
SCENES['s13_pop'] = (() => {
  const W = 1920, H = 1080, TAU = Math.PI * 2;
  const { clamp, lerp } = U, P = PAINT, ss = U.ss;
  const C = { ink: '#141414', paper: '#f3eedb', blue: '#2f5cc8', yellow: '#f7d52c', red: '#d8232a', white: '#fbf8ee',
    dotRed: '#e2483c', gold: '#d9a514', war: ['#9ccf3a', '#e0359a', '#2fc0b0', '#f08a2a'], warTxt: ['#141414', '#fbf8ee', '#141414', '#141414'] };
  const hash = (i, j) => U.hash(i | 0, (j | 0));

  // ---------- 字形一次性检查（缺字 console.error → 渲染非零退出） ----------
  let GLCHK = null;
  const glyphsOk = () => {
    if (GLCHK === null) GLCHK =
      U.assertGlyphs('66px "LXGWWenKai-500"', '参数疯狂卷之外数据方法算力', 's13_pop 中文') &&
      U.assertGlyphs('90px "Anton-400"', '0123456789.,!+−B 0.73 −1.2 2.4 1.5B 175B! 540B! 1T+!', 's13_pop 数字');
    return GLCHK;
  };

  // ---------- 通用笔法（抄原版 13_pop 的写法） ----------
  const ink = (c, p, fill, lw = 5) => { if (fill) { c.fillStyle = fill; c.fill(p); } c.strokeStyle = C.ink; c.lineWidth = lw; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(p); };
  const poly = (pts, closed = true) => { const p = new Path2D(); pts.forEach((q, i) => i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])); if (closed) p.closePath(); return p; };
  // 本戴点图案：方格四角＋中心＝45° 网格（tile 缓存，零成本）
  const dotPattern = (c, key, pitch, r, col, bg) => {
    const tile = P.cached('pop13_tile_' + key, pitch, pitch, (g) => {
      if (bg) { g.fillStyle = bg; g.fillRect(0, 0, pitch, pitch); }
      g.fillStyle = col;
      [[0, 0], [pitch, 0], [0, pitch], [pitch, pitch], [pitch / 2, pitch / 2]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); });
    });
    return c.createPattern(tile, 'repeat');
  };
  // 斜线阴影（漫画投影）
  const hatch = (c, cx, cy, rx, ry, gap = 10, w = 3.5) => { c.save(); c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, TAU); c.clip();
    c.strokeStyle = C.ink; c.lineWidth = w; c.beginPath(); for (let x = cx - rx - ry * 2; x < cx + rx + ry; x += gap) { c.moveTo(x, cy + ry); c.lineTo(x + ry * 2.2, cy - ry); } c.stroke(); c.restore(); };
  // 爆炸星形（外沿半径带 hash 抖动）
  const burstPath = (cx, cy, r0, r1, n, seed) => { const pts = []; for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * TAU + 0.1, r = i % 2 ? r0 * (0.92 + hash(i, seed) * 0.12) : r1 * (0.85 + hash(i, seed + 1) * 0.3); pts.push([cx + Math.cos(a) * r * 1.12, cy + Math.sin(a) * r * 0.8]); } return poly(pts); };
  // Anton 拟声大字：黑投影＋黑描边＋填色
  const anton = (c, s, x, y, size, fill, lw) => {
    c.save(); c.font = size + 'px "Anton-400"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    c.strokeStyle = C.ink; c.lineWidth = lw || Math.max(3, size * 0.13);
    c.strokeText(s, x + size * 0.035, y + size * 0.05); c.strokeText(s, x, y);
    c.fillStyle = fill; c.fillText(s, x, y); c.restore();
  };

  // ---------- 静态底版（缓存）：米白纸＋漫画页外框＋纸面颗粒（做旧只上背景） ----------
  const base = () => P.cached('pop13_base', W, H, (g) => {
    g.fillStyle = C.paper; g.fillRect(0, 0, W, H);
    g.strokeStyle = C.ink; g.lineWidth = 6; g.strokeRect(17, 14, W - 34, H - 28);
    g.drawImage(P.grain('pop13', 0.035, [60, 50, 30], 0.12), 0, 0);
  });

  // ---------- 镜头（连续缓动，边界零斜率） ----------
  const camAt = (lt) => {
    if (lt < 3) { const u = 0.5 - 0.5 * Math.cos(Math.PI * clamp(lt / 3)); return { s: 1.16 + 0.06 * u, px: 800, py: 530 }; }
    if (lt < 7) { const u = 0.5 - 0.5 * Math.cos(Math.PI * clamp((lt - 3) / 4)); return { s: 1.22 - 0.34 * u, px: lerp(800, 960, u), py: lerp(530, 540, u) }; }
    const u = 0.5 - 0.5 * Math.cos(Math.PI * clamp((lt - 7) / 3)); return { s: 0.88 - 0.04 * u, px: 960, py: 540 };
  };

  // ---------- 三颗主角网点（参数本体）→ 拍二收成元老 → 拍三归入点阵 ----------
  const HERO = [
    { x: 540, y: 630, r: 168, col: C.red, num: '0.73', fs: 96, numCol: C.white, shade: C.blue, ph: 0 },
    { x: 950, y: 400, r: 138, col: C.blue, num: '−1.2', fs: 84, numCol: C.white, shade: C.dotRed, ph: 2.1 },
    { x: 1330, y: 670, r: 150, col: C.yellow, num: '2.4', fs: 84, numCol: C.ink, shade: C.blue, ph: 4.2 },
  ];
  const ELDER = [{ x: 1230, y: 375 }, { x: 1470, y: 305 }, { x: 1665, y: 400 }];   // 拍二三停留（计数板上方）
  const GLIDE = [{ x: 560, y: 234 }, { x: 960, y: 234 }, { x: 1360, y: 234 }];      // 拍三归入中排点阵

  // ---------- 背景网点场（确定性：极坐标螺旋＋hash 抖动；避开四格画框与计数板） ----------
  const FIELD = (() => {
    const rects = [[275, 258, 1055, 917], [1080, 560, 1860, 880]];                  // 拍二的遮挡区（点不浪费在这里）
    const out = []; let i = 0;
    while (out.length < 372 && i < 3200) {
      const a = i * 2.399963 + hash(i, 5) * 0.5;
      const rad = 60 + 900 * Math.pow(i / 3200, 0.62) + hash(i, 1) * 60;
      const x = 960 + Math.cos(a) * rad, y = 540 + Math.sin(a) * rad * 0.62; i++;
      if (x < 52 || x > 1868 || y < 50 || y > 1030) continue;
      if (rects.some(([x0, y0, x1, y1]) => x > x0 - 26 && x < x1 + 26 && y > y0 - 26 && y < y1 + 26)) continue;
      out.push({ x, y, r: 8.5 + hash(i, 2) * 7.5, col: [C.red, C.blue, C.yellow, C.dotRed][(hash(i, 3) * 4) | 0], ph: hash(i, 4) * TAU });
    }
    out.forEach((d, k) => { d.t0 = k < 18 ? -1 : 3.05 + 3.85 * Math.pow((k - 18) / (out.length - 18), 0.7); });
    // 拍三：约每 5 颗取 1 颗收成三排点阵（变少、排齐、点亮）
    const lat = out.filter((d, k) => k % 5 === 0);
    const cols = Math.ceil(lat.length / 3);
    lat.forEach((d, k) => { d.lat = true; d.lx = 262 + (k % cols) * (1396 / (cols - 1)); d.ly = 200 + ((k / cols) | 0) * 34; });
    return out;
  })();
  // 里程碑加密：每砸一格，全场点半径上一级台阶
  const rMul = (lt) => 1 + 0.09 * (ss(3.45, 3.75, lt) + ss(4.2, 4.5, lt) + ss(4.95, 5.25, lt) + ss(6.05, 6.35, lt));

  const drawDot = (c, x, y, r, col, al) => {
    c.save(); c.globalAlpha = al;
    c.fillStyle = col; c.beginPath(); c.arc(x, y, Math.max(0.5, r), 0, TAU); c.fill();
    c.strokeStyle = C.ink; c.lineWidth = 3.5; c.stroke(); c.restore();
  };

  // ---------- 拍二：沃霍尔四格＋计数板 ----------
  const CELLS = [
    { x: 300, y: 280, w: 330, h: 295, txt: '1.5B', fs: 64, t: 3.45 },
    { x: 660, y: 280, w: 370, h: 295, txt: '175B!', fs: 60, t: 4.2 },
    { x: 300, y: 605, w: 330, h: 290, txt: '540B!', fs: 60, t: 4.95 },
    { x: 660, y: 605, w: 370, h: 290, txt: '1T+!', fs: 128, t: 6.05, big: true },
  ];
  const ANCH = [[3.1, 1.5e9], [4.2, 175e9], [4.95, 540e9], [6.05, 1.024e12], [6.9, 1.1e12]];   // 真实序列：里程碑锚点（对数插值）
  const valAt = (lt) => {
    if (lt <= ANCH[0][0]) return ANCH[0][1];
    for (let k = 0; k < ANCH.length - 1; k++) {
      const [t0, v0] = ANCH[k], [t1, v1] = ANCH[k + 1];
      if (lt < t1) return v0 * Math.pow(v1 / v0, clamp((lt - t0) / (t1 - t0)));
    }
    return ANCH[ANCH.length - 1][1];
  };
  const fmt = (v) => { let s = String(Math.round(v)), o = ''; while (s.length > 3) { o = ',' + s.slice(-3) + o; s = s.slice(0, -3); } return s + o; };

  const cellCol = (i, lt) => {
    if (i === 3 && lt >= 6.05) return 3.5;                                            // 1T+ 揭示：定格红（下标 3.5 = red）
    const k = Math.max(0, Math.floor((lt - 3.35 - i * 0.45) / 1.8));                  // 错色轮播：每格 1.8s 一换、互相错开 0.45s
    return (i + k) % 4;
  };

  function drawGrid(c, lt) {
    const a = ss(3.12, 3.42, lt) * (1 - ss(7.0, 7.8, lt));   // 托板：淡入＋0.8s 缓淡出（白压纸的逐帧色差低于帧差阈值）
    if (a <= 0.01) return;
    c.save(); c.globalAlpha = a;
    // 白画框（沃霍尔印版的托板）
    c.fillStyle = C.white; c.fillRect(275, 258, 780, 659);
    c.strokeStyle = C.ink; c.lineWidth = 7; c.strokeRect(275, 258, 780, 659);
    // 四格底色：漫画式硬切弹入（一帧贴上一格，利希滕斯坦贴格的读法）
    CELLS.forEach((cl, i) => {
      if (lt < 3.42 + i * 0.09) return;
      const ci = cellCol(i, lt);
      c.fillStyle = ci === 3.5 ? C.red : C.war[ci];
      c.fillRect(cl.x, cl.y, cl.w, cl.h);
      c.strokeStyle = C.ink; c.lineWidth = 6; c.strokeRect(cl.x, cl.y, cl.w, cl.h);
    });
    // 1T+ 星形放射线（唯一最大重音：爆开、脉动、停住）
    if (lt >= 6.05) {
      const s = ss(6.05, 6.42, lt), cx = 845, cy = 750;
      c.fillStyle = C.ink;
      for (let k = 0; k < 10; k++) {
        const ang = k * TAU / 10 + 0.16, r0 = (218 + hash(k, 21) * 30) * s, r1 = r0 + (108 + 9 * Math.sin(lt * 5 + k)) * s, w = 0.062;
        c.beginPath();
        c.moveTo(cx + Math.cos(ang - w) * r0 * 1.12, cy + Math.sin(ang - w) * r0 * 0.8);
        c.lineTo(cx + Math.cos(ang) * r1 * 1.12, cy + Math.sin(ang) * r1 * 0.8);
        c.lineTo(cx + Math.cos(ang + w) * r0 * 1.12, cy + Math.sin(ang + w) * r0 * 0.8);
        c.closePath(); c.fill();
      }
      const outer = burstPath(cx, cy, 130 * s, 185 * s, 14, 31);
      c.fillStyle = C.white; c.fill(outer); c.lineWidth = 6; c.strokeStyle = C.ink; c.stroke(outer);
      c.fillStyle = C.yellow; c.fill(burstPath(cx, cy, 102 * s, 148 * s, 12, 37));
    }
    // 里程碑拟声大字逐格砸入（缩放砸入＋停住）
    CELLS.forEach((cl, i) => {
      if (lt < cl.t) return;
      const p = Math.min(1, (lt - cl.t) / 0.22), sc = 1 + 0.6 * Math.pow(1 - p, 1.8);
      const ci = cellCol(i, lt);
      const fill = i === 3 ? C.white : (ci === 3.5 ? C.white : C.warTxt[ci]);
      c.save(); c.globalAlpha = a * Math.min(1, p * 5);
      c.translate(cl.x + cl.w / 2, cl.y + cl.h / 2); c.scale(sc, sc);
      anton(c, cl.txt, 0, 0, cl.fs, fill, Math.max(5, cl.fs * 0.13));
      c.restore();
    });
    c.restore();
  }

  // ---------- 计数板（右下，真实滚动的里程数字＋红色刻度表） ----------
  function drawBoard(c, lt) {
    const inA = ss(4.9, 5.32, lt), a = inA * (1 - ss(7.0, 7.8, lt));
    if (a <= 0.01) return;
    const X = 1080 + (1 - inA) * 70;
    const v = valAt(lt);
    c.save(); c.globalAlpha = a;
    c.fillStyle = C.white; c.fillRect(X, 560, 780, 320);
    c.strokeStyle = C.ink; c.lineWidth = 8; c.strokeRect(X, 560, 780, 320);
    [[X + 26, 586], [X + 754, 586], [X + 26, 854], [X + 754, 854]].forEach(([x, y]) => {   // 四角铆钉
      c.fillStyle = C.yellow; c.beginPath(); c.arc(x, y, 9, 0, TAU); c.fill();
      c.lineWidth = 4; c.strokeStyle = C.ink; c.stroke(); });
    // 里程数字（逐帧滚动）
    c.font = '80px "Anton-400"'; c.fillStyle = C.ink; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.fillText(fmt(v), X + 390, 800);
    // 刻度表：红条随参数量上涨，三道刻度＝三个里程碑
    const gx = X + 40, gw = 700, gy = 610, gh = 42, fr = clamp((v - 1.5e9) / (1.1e12 - 1.5e9));
    c.fillStyle = C.white; c.fillRect(gx, gy, gw, gh);
    c.fillStyle = C.red; c.fillRect(gx + 4, gy + 4, Math.max(0, (gw - 8) * fr), gh - 8);
    c.strokeStyle = C.ink; c.lineWidth = 6; c.strokeRect(gx, gy, gw, gh);
    [175e9, 540e9, 1.024e12].forEach((mv) => {
      const fx = gx + gw * clamp((mv - 1.5e9) / (1.1e12 - 1.5e9));
      c.lineWidth = 4; c.beginPath(); c.moveTo(fx, gy - 9); c.lineTo(fx, gy + gh + 9); c.stroke(); });
    const fx = gx + 4 + Math.max(0, (gw - 8) * fr);                                       // 滑标小三角
    c.fillStyle = C.ink; c.beginPath(); c.moveTo(fx, gy + gh / 2); c.lineTo(fx + 18, gy + gh / 2 - 11); c.lineTo(fx + 18, gy + gh / 2 + 11); c.closePath(); c.fill();
    c.restore();
  }

  // ---------- 三颗主角网点 ----------
  function drawHero(c, lt) {
    HERO.forEach((h, k) => {
      let x = h.x, y = h.y, r = h.r, rot = 0, fs = h.fs, col = h.col, numA = 1;
      if (lt < 3) {                                                                    // 拍一：三样小循环
        if (k === 0) r *= 1 + 0.035 * Math.sin(lt * TAU * 0.9);                        // 呼吸胀缩
        if (k === 1) rot = 0.05 * Math.sin(lt * TAU * 0.45);                           // 缓慢摇摆
        if (k === 2) col = Math.sin(lt * TAU * 0.85) > 0 ? C.yellow : C.gold;          // 黄/深金明灭
      } else if (lt < 3.55) {                                                          // 起飞：弧线飞去计数板上方、缩成元老
        const u = ss(3, 3.55, lt);
        x = lerp(h.x, ELDER[k].x, u); y = lerp(h.y, ELDER[k].y, u) - Math.sin(Math.PI * u) * 130;
        r = lerp(h.r, 42, u); fs = lerp(h.fs, 34, u);
      } else {
        x = ELDER[k].x; y = ELDER[k].y; r = 42 * (1 + 0.03 * Math.sin(lt * 2.1 + h.ph)); fs = 34;
        if (lt >= 7) {                                                                  // 拍三：元老归入中排点阵、数字淡出
          const g = U.ease.inOut(ss(7.05 + k * 0.15, 7.95, lt));
          x = lerp(ELDER[k].x, GLIDE[k].x, g); y = lerp(ELDER[k].y, GLIDE[k].y, g);
          r = lerp(42, 21, g) * (1 + 0.03 * Math.sin(lt * 2.1 + h.ph)); fs = lerp(34, 20, g);
          numA = 1 - ss(7.0, 7.4, lt);
        }
      }
      c.save(); c.translate(x, y); c.rotate(rot);
      const p = new Path2D(); p.arc(0, 0, r, 0, TAU);
      ink(c, p, col, 9);
      // 本戴点阴影月牙（网点对齐屏幕坐标，tile 固定不随呼吸缩放——印刷感）
      c.save(); c.clip(p);
      c.beginPath(); c.arc(-r * 0.3, r * 0.36, r * 1.02, 0, TAU); c.clip();
      c.fillStyle = dotPattern(c, 'hero' + k, Math.max(14, Math.round(h.r * 0.2)), Math.max(3.4, Math.round(h.r * 0.048)), h.shade);
      c.fillRect(-r * 2.2, -r * 2.2, r * 4.4, r * 4.4);
      c.restore();
      // 白高光弧
      c.strokeStyle = C.white; c.lineWidth = Math.max(6, r * 0.05); c.lineCap = 'round';
      c.beginPath(); c.arc(0, 0, r * 0.7, -2.6, -1.9); c.stroke();
      if (numA > 0.01) { c.globalAlpha = numA; anton(c, h.num, 0, r * 0.03, fs, h.numCol, Math.max(4, fs * 0.12)); }
      // 拍三落地后：点睛白高光（变亮）
      if (lt >= 7.95) {
        const hl = ss(7.95, 8.12, lt);
        if (hl > 0) { c.save(); c.globalAlpha = hl * (0.65 + 0.35 * Math.sin(lt * 2.4 + h.ph));
          c.fillStyle = C.white; c.beginPath(); c.arc(-r * 0.34, -r * 0.34, r * 0.3, 0, TAU); c.fill(); c.restore(); }
      }
      c.restore();
    });
  }

  // ---------- 网点场两趟：普通点（拍三淡出）＋点阵点（拍三滑入排齐＋点亮） ----------
  function drawFieldPass(c, lt) {
    const m = rMul(lt);
    FIELD.forEach((d, k) => {
      if (d.lat && lt >= 6.98) return;
      const b = ss(d.t0, d.t0 + 0.22, lt); if (b <= 0) return;
      const sc = 0.2 + 0.98 * b;
      let al = 1, rr = d.r * sc * m * (1 + 0.035 * Math.sin(lt * 1.5 + d.ph));
      if (lt >= 7 && !d.lat) {                                                          // 变多 → 变精：多余的点收掉
        const f = ss(7.0 + hash(k, 9) * 0.3, 7.62 + hash(k, 9) * 0.3, lt);
        al = 1 - f; rr *= 1 - 0.45 * f;
        if (al <= 0.02) return;
      }
      drawDot(c, d.x, d.y, rr, d.col, al);
    });
  }
  function drawLatticePass(c, lt) {
    if (lt < 6.98) return;
    const m = rMul(lt);
    FIELD.forEach((d, k) => {
      if (!d.lat) return;
      const g = U.ease.inOut(ss(7.0 + hash(k, 8) * 0.35, 7.95, lt));
      const x = lerp(d.x, d.lx, g), y = lerp(d.y, d.ly, g);
      const rr = lerp(d.r * m, 10.5, g) * (1 + 0.02 * Math.sin(lt * 2 + d.ph));
      const col = (g > 0.5 && d.col === C.dotRed) ? C.red : d.col;                      // 落位时纯色提亮
      drawDot(c, x, y, rr, col, 1);
      const hl = ss(7.95 + hash(k, 7) * 0.7, 8.15 + hash(k, 7) * 0.7, lt);              // 逐颗点亮白高光＋波纹微闪
      if (hl > 0) { c.save(); c.globalAlpha = hl * (0.6 + 0.4 * Math.sin(lt * 2.4 + d.lx * 0.012));
        c.fillStyle = C.white; c.beginPath(); c.arc(x - rr * 0.35, y - rr * 0.35, rr * 0.3, 0, TAU); c.fill(); c.restore(); }
    });
  }

  // ---------- 拍三：三排点串成网、垂到三格（网络收稳） ----------
  const PANELS = [{ x: 150, label: '数据', t: 7.35 }, { x: 700, label: '方法', t: 7.7 }, { x: 1250, label: '算力', t: 8.05 }];
  function drawNet(c, lt) {
    if (lt < 8.55) return;
    c.save(); c.strokeStyle = C.ink; c.lineWidth = 3.5; c.lineCap = 'round';
    for (let row = 0; row < 3; row++) {
      const y = 200 + row * 34, p = ss(8.6 + row * 0.12, 9.18 + row * 0.12, lt);
      if (p <= 0) continue;
      c.beginPath(); c.moveTo(262, y); c.lineTo(262 + 1396 * p, y); c.stroke();
    }
    PANELS.forEach((pn, i) => {                                                          // 三条垂线落到格顶
      const p = ss(9.25 + i * 0.12, 9.55 + i * 0.12, lt);
      if (p <= 0) return;
      c.beginPath(); c.moveTo(pn.x + 235, 268); c.lineTo(pn.x + 235, 268 + 62 * p); c.stroke();
    });
    c.restore();
  }

  // ---------- 拍三：三格漫画分镜（书=数据、齿轮=方法、电池=算力） ----------
  const BOOKS = [
    { x: 205, y: 452, w: 356, h: 84, col: C.red, dot: C.blue, rot: -0.012 },
    { x: 228, y: 544, w: 312, h: 80, col: C.blue, dot: C.dotRed, rot: 0.014 },
    { x: 214, y: 636, w: 344, h: 84, col: C.yellow, dot: null, rot: -0.008 },
  ];
  function drawBooks(c, lt) {
    BOOKS.forEach((b, k) => {
      c.save(); c.translate(b.x + b.w / 2, b.y + b.h / 2);
      c.rotate(b.rot + 0.004 * Math.sin(lt * 1.1 + k));                                  // 一摞书整体轻晃
      const p = poly([[-b.w / 2, -b.h / 2], [b.w / 2, -b.h / 2], [b.w / 2, b.h / 2], [-b.w / 2, b.h / 2]]);
      ink(c, p, b.col, 7);
      if (b.dot) {                                                                       // 封面本戴点（右半）
        c.save(); c.clip(p); c.beginPath(); c.rect(0, -b.h / 2, b.w / 2, b.h); c.clip();
        c.fillStyle = dotPattern(c, 'book' + k, 22, 5.2, b.dot);
        c.fillRect(-b.w / 2 - 4, -b.h / 2 - 4, b.w + 8, b.h + 8); c.restore();
      }
      c.fillStyle = C.white; c.fillRect(b.w / 2 - 26, -b.h / 2 + 8, 20, b.h - 16);      // 白书页边
      c.strokeStyle = C.ink; c.lineWidth = 3;
      c.beginPath(); c.moveTo(b.w / 2 - 19, -b.h / 2 + 10); c.lineTo(b.w / 2 - 19, b.h / 2 - 10);
      c.moveTo(b.w / 2 - 12, -b.h / 2 + 10); c.lineTo(b.w / 2 - 12, b.h / 2 - 10); c.stroke();
      c.restore();
    });
  }
  function drawGear(c, cx, cy, R, n, col, rot, hubR) {
    c.save(); c.translate(cx, cy); c.rotate(rot);
    for (let k = 0; k < n; k++) {                                                        // 齿
      c.save(); c.rotate(k * TAU / n);
      ink(c, poly([[R - 12, -16], [R + 20, -15], [R + 22, 15], [R - 12, 16]]), col, 6);
      c.restore();
    }
    ink(c, (() => { const p = new Path2D(); p.arc(0, 0, R - 8, 0, TAU); return p; })(), col, 7);
    for (let k = 0; k < 4; k++) {                                                        // 轮辐
      const a = k * Math.PI / 2;
      c.strokeStyle = C.ink; c.lineWidth = 7; c.beginPath();
      c.moveTo(Math.cos(a) * hubR, Math.sin(a) * hubR); c.lineTo(Math.cos(a) * (R - 12), Math.sin(a) * (R - 12)); c.stroke();
    }
    ink(c, (() => { const p = new Path2D(); p.arc(0, 0, hubR, 0, TAU); return p; })(), C.white, 6);
    c.fillStyle = C.ink; c.beginPath(); c.arc(0, 0, 9, 0, TAU); c.fill();
    c.restore();
  }
  function drawBattery(c, lt) {
    ink(c, poly([[1447, 372], [1523, 372], [1523, 396], [1447, 396]]), C.yellow, 6);     // 正极帽
    ink(c, poly([[1392, 396], [1578, 396], [1578, 712], [1392, 712]]), C.white, 8);      // 电池身
    [['red', 622], ['blue', 548]].forEach(([col, y], k) => {                             // 两格电量条（轮流变亮）
      const p = poly([[1408, y], [1562, y], [1562, y + 62], [1408, y + 62]]);
      ink(c, p, C[col], 5);
      c.save(); c.globalAlpha = 0.22 * (0.5 + 0.5 * Math.sin(lt * 2.2 - k * 1.2));
      c.fillStyle = C.white; c.fillRect(1408, y, 154, 62); c.restore();
    });
    ink(c, poly([[1478, 402], [1516, 402], [1494, 442], [1518, 442], [1452, 532], [1470, 476], [1446, 476]]), C.yellow, 6);  // 闪电
    c.save(); c.globalAlpha = 0.12 + 0.12 * Math.sin(lt * 3);                             // 闪电微闪
    c.fillStyle = C.white; c.fill(poly([[1478, 402], [1516, 402], [1494, 442], [1518, 442], [1452, 532], [1470, 476], [1446, 476]]));
    c.restore();
  }
  function drawPanels(c, lt) {
    PANELS.forEach((pn, i) => {
      const p = ss(pn.t, pn.t + 0.55, lt);
      if (p <= 0) return;
      const e = 1 + 2.7 * Math.pow(p - 1, 3) + 1.7 * Math.pow(p - 1, 2);                 // 升起＋回弹归位
      const yo = 560 * (1 - e);
      if (p > 0.6) { c.save(); c.globalAlpha = (p - 0.6) / 0.4; hatch(c, pn.x + 235, 824, 250, 13); c.restore(); }
      c.save(); c.translate(0, yo);
      c.fillStyle = C.white; c.fillRect(pn.x, 330, 470, 470);
      c.strokeStyle = C.ink; c.lineWidth = 9; c.strokeRect(pn.x, 330, 470, 470);
      c.strokeStyle = C.blue; c.lineWidth = 3; c.strokeRect(pn.x + 14, 344, 442, 442);    // 内衬蓝线（波普分格）
      if (i === 0) drawBooks(c, lt);
      else if (i === 1) { drawGear(c, 935, 545, 118, 9, C.yellow, lt * 0.5, 36); drawGear(c, 1052, 652, 54, 7, C.red, -lt * 1.06, 17); }
      else drawBattery(c, lt);
      c.fillStyle = C.yellow; c.fillRect(pn.x + 124, 726, 222, 58);                      // 铭牌（物上标签）
      c.strokeStyle = C.ink; c.lineWidth = 6; c.strokeRect(pn.x + 124, 726, 222, 58);
      c.font = '40px "LXGWWenKai-500"'; c.fillStyle = C.ink; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(pn.label, pn.x + 235, 757);
      c.restore();
    });
  }

  // ---------- 页面层（不随镜头缩放）：拟声框、思考泡泡、三拍旁白框 ----------
  function sfxBox(c, lt) {
    const a = 1 - ss(3.0, 3.25, lt); if (a <= 0.01) return;
    const st = Math.floor(lt * 30), jx = (hash(st, 3) - 0.5) * 9, jy = (hash(st, 7) - 0.5) * 7, rot = (hash(st, 11) - 0.5) * 0.05;
    c.save(); c.globalAlpha = a; c.translate(270 + jx, 250 + jy); c.rotate(rot);
    c.fillStyle = C.yellow; c.fillRect(-155, -64, 310, 128);
    c.strokeStyle = C.ink; c.lineWidth = 7; c.strokeRect(-155, -64, 310, 128);
    anton(c, '0.73!', 0, 4, 62, C.red, 9);
    c.strokeStyle = C.ink; c.lineWidth = 5; c.beginPath();                                 // 指向 0.73 那颗点
    c.moveTo(96, 68); c.lineTo(140, 116); c.moveTo(52, 72); c.lineTo(92, 124); c.stroke();
    c.restore();
  }
  const CLOUD = [[1598, 164, 56], [1666, 132, 60], [1738, 140, 56], [1798, 170, 50], [1816, 216, 44], [1774, 254, 42], [1710, 260, 48], [1632, 246, 46], [1582, 210, 42], [1714, 194, 88]];
  function bubble(c, lt) {
    const s = ss(0.45, 0.85, lt) * (1 - ss(2.95, 3.3, lt)) * ss(8.3, 8.65, lt);
    if (s <= 0.01) return;
    c.save(); c.translate(1700, 200); c.scale(s, s); c.translate(-1700, -200);
    c.lineWidth = 11; c.strokeStyle = C.ink;
    CLOUD.forEach(([x, y, r]) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke(); });
    c.fillStyle = C.white; CLOUD.forEach(([x, y, r]) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); });
    [[1530, 314, 15], [1494, 344, 10]].forEach(([x, y, r]) => {                           // 引导小泡
      c.fillStyle = C.white; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
      c.lineWidth = 5; c.strokeStyle = C.ink; c.stroke(); });
    const f = lt * 30;                                                                    // 三点依次闪（12 帧一循环）
    [[1656, 196], [1714, 186], [1770, 196]].forEach(([x, y], k) => {
      const on = (((f - 2 * k) % 12) + 12) % 12 < 4;
      c.fillStyle = C.ink; c.beginPath(); c.arc(x, y - (on ? 6 : 0), on ? 19 : 11, 0, TAU); c.fill(); });
    c.restore();
  }
  const captionBox = (c, txt, x, y) => {
    const w = txt.length * 66 + 96, h = 100;
    c.save();
    c.fillStyle = C.yellow; c.fillRect(x, y, w, h);
    c.strokeStyle = C.ink; c.lineWidth = 7; c.strokeRect(x, y, w, h);
    c.font = '66px "LXGWWenKai-500"'; c.fillStyle = C.ink; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(txt, x + w / 2, y + h / 2 + 4);
    c.restore();
  };
  function captions(c, lt) {
    if (lt < 3.35) captionBox(c, '参数', lerp(70, -380, ss(3.0, 3.3, lt)), 56);
    if (lt >= 3.05 && lt < 7.35) captionBox(c, '疯狂卷参数', lerp(lerp(-560, 70, ss(3.12, 3.5, lt)), -620, ss(7.0, 7.3, lt)), 56);
    if (lt >= 7.1) captionBox(c, '参数之外', 960 - (4 * 66 + 96) / 2, lerp(-130, 56, ss(7.15, 7.55, lt)));
  }

  return {
    draw(c, lt, t) {
      glyphsOk();
      const cam = camAt(lt);
      c.drawImage(base(), 0, 0);
      c.save(); c.translate(cam.px, cam.py); c.scale(cam.s, cam.s); c.translate(-cam.px, -cam.py);
      drawFieldPass(c, lt);        // 网点海（普通点）
      drawNet(c, lt);              // 拍三：三排串线（点画在线上，后画点盖住线）
      drawLatticePass(c, lt);      // 网点海（点阵点，拍三排齐点亮）
      drawGrid(c, lt);             // 沃霍尔四格＋星爆
      drawBoard(c, lt);            // 计数板
      drawHero(c, lt);             // 三颗主角点→元老→点阵中排
      if (lt >= 7.3) drawPanels(c, lt);   // 三格漫画分镜
      c.restore();
      sfxBox(c, lt);               // 以下为页面层，不随镜头缩放
      bubble(c, lt);
      captions(c, lt);
    },
  };
})();
