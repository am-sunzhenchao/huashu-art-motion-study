// 「大模型参数」× 洞穴岩画（s01_cave）：岩壁上的一幅「参数星图」，单镜头三节拍、整 10 秒。
// 管线照 01_cave 配方卡：①岩壁（半分辨率高度场→法线浮雕、底色 fbm、颗粒、随机游走裂缝、负形手印、暗角）全部缓存；
// ②颜料层：喷点/炭线/刻痕数字统一「fuzz 粗边→ink 炭边→平涂」，整层 source-atop 叠岩面贴图＝颜料吃进岩石；
// ③每帧动态：火光摇曳（overlay）、参数点明灭涨缩、点群野牛两姿态奔跑、刻痕计数器 1.5B→1T+、余烬上飘、三物升起、白垩描亮。
// 节拍：0–3 三颗参数点特写（缓推）；3–7 点增殖成点群野牛＋计数滚动（缓拉远，1T+ 火光重音一次）；7–10 三物升起、描亮收稳（停）。
SCENES['s01_cave'] = (() => {
  const W = 1920, H = 1080, { clamp, lerp, rng, ss } = U, P = PAINT;
  const C = {
    wallL: [206, 146, 90], wallD: [110, 68, 38], wallR: [182, 100, 58],
    ink: '#21150d', red: '#9c3520', redD: '#74261a', ochre: '#c9772f', chalk: '#f0dfbf', ember: '#ffe082',
    wash: 'rgba(140,61,34,.10)', stone: '#c98c50', stoneD: '#c08048', hand: '#8e2a1a',
    dotCore: '#9c3520', dotHalo: '#8e2a1a',
  };

  // ---------- 炭笔图案（描边颗粒边用，9fps 沸腾：几何不动、颗粒在跳） ----------
  const inkTile = () => P.cached('s01c_ink', 256, 256, (g) => {
    const img = g.createImageData(256, 256), d = img.data, r = rng(91);
    for (let i = 0; i < 256 * 256; i++) {
      const x = i % 256, y = (i / 256) | 0, n = P.noise(x * 0.09, y * 0.09) * 0.5 + P.noise(x * 0.3 + 9, y * 0.3) * 0.5;
      const hole = r() < 0.07 || n > 0.58;
      d[i * 4] = 33; d[i * 4 + 1] = 21; d[i * 4 + 2] = 13; d[i * 4 + 3] = hole ? 255 * r() * 0.35 : 225 + r() * 30;
    }
    g.putImageData(img, 0, 0);
  });
  const fuzzTile = () => P.cached('s01c_fuzz', 256, 256, (g) => {
    const r = rng(57); g.fillStyle = '#21150d';
    for (let i = 0; i < 2600; i++) { g.globalAlpha = 0.35 + r() * 0.6; g.beginPath(); g.arc(r() * 256, r() * 256, 0.7 + r() * 1.5, 0, Math.PI * 2); g.fill(); }
  });
  const FPATS = new WeakMap();
  const fuzzPat = (g, t) => { let p = FPATS.get(g); if (!p) { p = g.createPattern(fuzzTile(), 'repeat'); FPATS.set(g, p); } const r = rng(P.boilSeed(t, 9) * 13 + 5); p.setTransform(new DOMMatrix().translate((r() * 256) | 0, (r() * 256) | 0)); return p; };
  const PATS = new WeakMap();
  const inkPat = (g, t) => {
    let p = PATS.get(g); if (!p) { p = g.createPattern(inkTile(), 'repeat'); PATS.set(g, p); }
    const b = P.boilSeed(t, 9), r = rng(b * 7 + 3);
    p.setTransform(new DOMMatrix().translate((r() * 256) | 0, (r() * 256) | 0)); return p;
  };
  // 颜料图形统一画法：fuzz 粗边（外半圈毛边）→ ink 炭边 → 平涂；alpha 全部显式传（拍三升起/刻入渐显用）
  function shape(g, path, fill, lw, t, alpha) {
    const a = alpha === undefined ? 1 : alpha;
    if (lw) { g.save(); g.globalAlpha = a; g.lineJoin = 'round'; g.lineCap = 'round';
      g.strokeStyle = fuzzPat(g, t); g.lineWidth = lw * 2 + 7; g.stroke(path);
      g.strokeStyle = inkPat(g, t); g.lineWidth = lw * 2; g.stroke(path); g.restore(); }
    if (fill) { g.save(); g.globalAlpha = a; g.fillStyle = fill; g.fill(path); g.restore(); }
  }
  function inkLine(g, path, lw, t, alpha) {
    const a = alpha === undefined ? 1 : alpha;
    g.save(); g.globalAlpha = a; g.lineCap = 'round'; g.lineJoin = 'round';
    if (lw > 3.5) { g.strokeStyle = fuzzPat(g, t); g.lineWidth = lw + 5; g.stroke(path); }
    g.strokeStyle = inkPat(g, t); g.lineWidth = lw; g.stroke(path); g.restore();
  }
  // 刻上去的字：下缘亮棱＋炭体，可选炭笔毛边描一遍
  function engrave(g, txt, x, y, font, fill, alpha, stroke) {
    const a = alpha === undefined ? 1 : alpha;
    g.save(); g.font = font; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.globalAlpha = a;
    g.fillStyle = 'rgba(255,226,180,.32)'; g.fillText(txt, x + 1.6, y + 1.6);
    g.fillStyle = fill; g.fillText(txt, x, y);
    if (stroke) { g.strokeStyle = inkPat(g, stroke.t); g.lineWidth = stroke.lw; g.strokeText(txt, x, y); }
    g.restore();
  }

  // ---------- 岩壁（缓存）：半分辨率高度场 → 法线×左上光 → 浮雕明暗 ----------
  const HW = 960, HH = 540;
  const relief = () => P.cached('s01c_relief', HW, HH, (g) => {
    const hgt = new Float32Array((HW + 1) * (HH + 1));
    for (let y = 0; y <= HH; y++) for (let x = 0; x <= HW; x++) { const X = x * 2, Y = y * 2;
      hgt[y * (HW + 1) + x] = P.fbm(X * 0.0022 + 3, Y * 0.0022, 4) * 1.0 + P.fbm(X * 0.011, Y * 0.011 + 7, 3) * 0.16 + P.noise(X * 0.05, Y * 0.05) * 0.03; }
    const img = g.createImageData(HW, HH), d = img.data, L = [-0.55, -0.62, 0.56];
    const shade = new Float32Array(HW * HH);
    for (let y = 0; y < HH; y++) for (let x = 0; x < HW; x++) {
      const i = y * (HW + 1) + x, dx = (hgt[i + 1] - hgt[i]) * 52, dy = (hgt[i + HW + 1] - hgt[i]) * 52;
      const nl = Math.hypot(dx, dy, 1), dot = (-dx * L[0] - dy * L[1] + L[2]) / nl;
      const s = clamp(0.5 + (dot - 0.56) * 0.9, 0, 1); shade[y * HW + x] = s;
      const X = x * 2, Y = y * 2, n2 = P.fbm(X * 0.0016 + 11, Y * 0.0016 + 2, 3), n3 = P.fbm(X * 0.004 + 40, Y * 0.004, 2);
      let col = P.mix(C.wallL, C.wallD, clamp(0.35 - n2 * 1.3, 0, 1)); col = P.mix(col, C.wallR, clamp(n3 * 1.4, 0, 0.45));
      const k = 0.72 + s * 0.55, j = (y * HW + x) * 4;
      d[j] = col[0] * k; d[j + 1] = col[1] * k; d[j + 2] = col[2] * k; d[j + 3] = 255;
    }
    g.putImageData(img, 0, 0); g.__shade = shade;
  });
  // 颜料层用的「岩面贴图」：阴影压暗、亮处提暖＋颗粒＋干湿斑（source-atop）
  const figTex = () => P.cached('s01c_figtex', W, H, (g) => {
    const rl = relief(), sh = rl.getContext('2d').__shade;
    const s = P.canvas(HW, HH), sg = s.getContext('2d'), img = sg.createImageData(HW, HH), d = img.data;
    for (let i = 0; i < HW * HH; i++) { const v = sh ? sh[i] : 0.5; const dk = v < 0.5; d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = dk ? 20 : 255; if (!dk) { d[i * 4 + 1] = 236; d[i * 4 + 2] = 200; } d[i * 4 + 3] = (dk ? (0.5 - v) * 150 : (v - 0.5) * 50); }
    sg.putImageData(img, 0, 0); g.drawImage(s, 0, 0, W, H);
    g.drawImage(P.grain('s01c_fdk', 0.14, [30, 18, 8], 0.32), 0, 0);
    g.drawImage(P.grain('s01c_flt', 0.05, [255, 236, 200], 0.22), 0, 0);
    const m = P.canvas(240, 135), mg = m.getContext('2d'), mi = mg.createImageData(240, 135);
    for (let i = 0; i < 240 * 135; i++) { const x = i % 240, y = (i / 240) | 0, n = P.fbm(x * 0.08 + 21, y * 0.08, 3); mi.data[i * 4] = mi.data[i * 4 + 1] = mi.data[i * 4 + 2] = n > 0 ? 255 : 0; mi.data[i * 4 + 3] = Math.abs(n) * 70; }
    mg.putImageData(mi, 0, 0); g.drawImage(m, 0, 0, W, H);
  });

  // 手形/爪印（负形喷绘用），中心在原点
  function handPath(s) {
    const out = [], pal = new Path2D(); pal.ellipse(0, 8 * s, 26 * s, 31 * s, 0, 0, Math.PI * 2); out.push(pal);
    [[-0.5, 54, -17], [-0.17, 64, -6], [0.14, 62, 6], [0.46, 50, 17], [-1.25, 46, -20]].forEach(function (fr, k) {
      const a = fr[0], l = fr[1], ox = fr[2];
      const A = k < 4 ? [ox * s, -8 * s] : [-18 * s, 18 * s], B = [A[0] + Math.sin(a) * l * s, A[1] - Math.cos(a) * l * s];
      const p = new Path2D(); const n = Math.atan2(B[1] - A[1], B[0] - A[0]) + Math.PI / 2, w = (k < 4 ? 7 : 8) * s;
      p.moveTo(A[0] + Math.cos(n) * w, A[1] + Math.sin(n) * w); p.lineTo(B[0] + Math.cos(n) * w * 0.85, B[1] + Math.sin(n) * w * 0.85);
      p.arc(B[0], B[1], w * 0.85, n, n + Math.PI, true); p.lineTo(A[0] - Math.cos(n) * w, A[1] - Math.sin(n) * w); p.closePath(); out.push(p);
    });
    const wr = new Path2D(); wr.rect(-16 * s, 26 * s, 32 * s, 46 * s); out.push(wr); return out;
  }
  function pawPath(s) { const out = []; const p = new Path2D(); p.ellipse(0, 8 * s, 15 * s, 12 * s, 0, 0, Math.PI * 2); out.push(p); [[-16, -10], [-6, -19], [6, -19], [16, -10]].forEach(function (q) { const e = new Path2D(); e.ellipse(q[0] * s, q[1] * s, 6 * s, 7.5 * s, 0, 0, Math.PI * 2); out.push(e); }); return out; }
  function spray(g, cx, cy, sigma, n, col, seed, rmin, rmax, amin, amax) {
    const r = rng(seed); g.fillStyle = col;
    for (let i = 0; i < n; i++) { const a = r() * Math.PI * 2, rr = Math.sqrt(-2 * Math.log(1 - r() * 0.999)) * sigma; g.globalAlpha = amin + r() * (amax - amin); g.beginPath(); g.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, rmin + r() * (rmax - rmin), 0, Math.PI * 2); g.fill(); }
    g.globalAlpha = 1;
  }
  function stencil(g, x, y, rot, s, col, seed, shapeFn) {
    const tmp = P.canvas(320, 320), tg = tmp.getContext('2d');
    spray(tg, 160, 160, 46 * s, 3200, col, seed, 0.8, 3.2, 0.15, 0.6);
    spray(tg, 160, 160, 28 * s, 1400, col, seed + 1, 1, 3.5, 0.3, 0.75);
    const mk = P.canvas(320, 320), mg = mk.getContext('2d'); mg.translate(160, 160); mg.rotate(rot); mg.fillStyle = '#f6e2bc'; shapeFn(s).forEach(function (p) { mg.fill(p); });
    tg.globalCompositeOperation = 'destination-out'; tg.globalAlpha = 0.95; tg.drawImage(mk, 0, 0);
    tg.globalCompositeOperation = 'source-over'; tg.globalAlpha = 0.3; tg.drawImage(mk, 0, 0);
    g.drawImage(tmp, x - 160, y - 160);
  }
  function cracks(g) {
    const r = rng(405);
    const starts = [[300, 0, 1.6], [980, 0, -1.45], [1620, 0, 1.7], [0, 420, -0.2], [0, 880, 0.1], [1920, 300, 2.9], [1920, 900, 3.3], [600, 1080, -1.5], [1500, 1080, -1.7], [0, 120, 0.35]];
    const walk = function (x, y, a, n, w, depth) {
      const pts = [[x, y]];
      for (let s = 0; s < n; s++) { a += (r() - .5) * 0.9; const l = 14 + r() * 26; x += Math.cos(a) * l; y += Math.sin(a) * l; pts.push([x, y]);
        if (depth < 2 && r() < 0.12) walk(x, y, a + (r() < .5 ? 1 : -1) * (0.6 + r() * 0.6), (n - s) * 0.5 | 0, w * 0.7, depth + 1); }
      g.lineJoin = 'round';
      g.strokeStyle = 'rgba(255,226,180,.22)'; g.lineWidth = w + 1; g.beginPath(); pts.forEach(function (p, i) { i ? g.lineTo(p[0] + 1.6, p[1] + 1.6) : g.moveTo(p[0] + 1.6, p[1] + 1.6); }); g.stroke();
      g.strokeStyle = 'rgba(40,22,10,.62)'; g.lineWidth = w; g.beginPath(); pts.forEach(function (p, i) { i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }); g.stroke();
    };
    starts.forEach(function (st) { walk(st[0], st[1], st[2], 12 + (r() * 14 | 0), 2.2, 0); });
  }

  // 赭石喷点精灵（参数点用）：两档大小——大的给特写三颗，小的给点群
  function dotSprite(key, R, seed) {
    const size = Math.round(R * 3.4);
    return P.cached(key, size, size, function (g) {
      const cx = size / 2;
      spray(g, cx, cx, R * 0.52, Math.round(R * 6), C.dotHalo, seed, R * 0.05, R * 0.22, 0.18, 0.55);
      spray(g, cx, cx, R * 0.3, Math.round(R * 3.6), C.dotHalo, seed + 1, R * 0.06, R * 0.26, 0.28, 0.65);
      g.save(); g.globalAlpha = 0.94; g.fillStyle = C.dotCore; g.beginPath(); g.arc(cx, cx, R, 0, Math.PI * 2); g.fill(); g.restore();
    });
  }
  const dotL = () => dotSprite('s01c_dotL', 30, 33);   // 特写参数点（R=30）
  const dotS = () => dotSprite('s01c_dotS', 12, 44);   // 点群轮廓点（R=12）

  const HANDS = [[140, 235, -0.3, 0.95], [1720, 250, -0.15, 0.8], [1800, 500, 0.25, 0.92], [285, 905, 0.15, 0.85]];
  // 静态画面（岩壁＋所有不动的墙面痕迹）
  const bg = () => P.cached('s01c_bg', W, H, function (g) {
    g.imageSmoothingQuality = 'high'; g.drawImage(relief(), 0, 0, W, H);
    g.drawImage(P.grain('s01c_wdk', 0.22, [60, 36, 18], 0.32), 0, 0);
    g.drawImage(P.grain('s01c_wlt', 0.10, [255, 238, 205], 0.28), 0, 0);
    cracks(g);
    // 负形手印（红赭石喷绘）＋炭黑爪印
    HANDS.forEach(function (hd, k) { stencil(g, hd[0], hd[1], hd[2], hd[3], C.hand, 31 + k * 17, handPath); });
    stencil(g, 1640, 965, 0, 0.5, '#1a0f08', 77, pawPath);
    // 一列红点虚线（右下角，计数感）
    for (let k = 0; k < 9; k++) { const x = 1300 + k * 32, y = 935 - k * 9.25;
      spray(g, x, y, 3.5, 40, '#9a2e1c', 200 + k, 0.8, 2, 0.4, 0.8); g.fillStyle = '#9a2e1c'; g.globalAlpha = 0.75; g.beginPath(); g.arc(x, y, 5.5, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1; }
    // 右上角几笔淡炭涂鸦（未完成的记号）
    g.strokeStyle = 'rgba(40,26,16,.5)'; g.lineWidth = 3; g.lineCap = 'round';
    [[[1480, 150], [1496, 176], [1484, 202]], [[1520, 160], [1536, 186], [1524, 212]], [[1560, 152], [1574, 178], [1562, 204]]].forEach(function (pts, k) {
      P.roughPath(g, pts, { amp: 1.6, seed: 50 + k, step: 8 }); g.stroke(); });
    // 暗角＋中心静态暖光
    const v = g.createRadialGradient(960, 560, 260, 960, 560, 1180); v.addColorStop(0, 'rgba(30,14,4,0)'); v.addColorStop(0.5, 'rgba(30,14,4,.16)'); v.addColorStop(1, 'rgba(18,8,2,.8)');
    g.fillStyle = v; g.fillRect(0, 0, W, H);
    const fl = g.createRadialGradient(960, 520, 20, 960, 520, 640); fl.addColorStop(0, 'rgba(255,190,110,.34)'); fl.addColorStop(0.5, 'rgba(255,150,70,.13)'); fl.addColorStop(1, 'rgba(255,150,70,0)');
    g.globalCompositeOperation = 'lighter'; g.fillStyle = fl; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over';
  });

  // ---------- 点群野牛（原版 01_cave 的野牛形放大 2.15 倍移到画面中央，点沿轮廓排布） ----------
  const tf = (x, y) => [965 + (x - 595) * 2.15, 520 + (y - 300) * 2.15];
  const BODY = [[470, 300], [495, 280], [545, 268], [595, 250], [632, 240], [660, 246], [682, 268], [692, 300], [686, 330], [668, 350], [640, 356], [590, 352], [530, 348], [488, 342], [468, 324]].map(function (p) { return tf(p[0], p[1]); });
  const HEAD = [[672, 270], [698, 280], [716, 302], [724, 326], [714, 340], [696, 338], [682, 326], [668, 300]].map(function (p) { return tf(p[0], p[1]); });
  const LEG0 = [[652, 340, 648, 392], [632, 346, 618, 396], [500, 340, 504, 394], [520, 344, 530, 394]];   // 收拢
  const LEG1 = [[652, 340, 698, 384], [632, 346, 672, 394], [500, 340, 458, 378], [520, 344, 482, 390]];   // 伸展
  // 沿闭合多边形等距放点（带种子抖动）
  function perimDots(pts, spacing, jit, seed) {
    const r = rng(seed), out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / spacing));
      for (let k = 0; k < n; k++) { const q = k / n; out.push([lerp(a[0], b[0], q) + (r() - .5) * jit, lerp(a[1], b[1], q) + (r() - .5) * jit]); }
    }
    return out;
  }
  const headD = perimDots(HEAD, 14, 5, 911);
  const bodyD = perimDots(BODY, 21, 8, 910);
  const maneD = []; for (let k = 0; k < 5; k++) maneD.push([1005 + k * 26, 448]);      // 背脊下的一行鬃点
  const HERD = headD.concat(maneD, bodyD);                                             // 揭示顺序：头→鬃→躯干一周
  const HERDQ = (function () { const r = rng(912); return HERD.map(function (p, i) { return { x: p[0], y: p[1], r: 9.5 + r() * 5.5, at: 3.18 + (i / HERD.length) * 3.05, ph: r() * 6.28 }; }); })();
  // 连线段：头环、躯干环各自闭口（鬃点是散点不连）
  const SEGS = (function () { const out = [], b0 = headD.length + maneD.length;
    for (let i = 1; i < headD.length; i++) out.push([i - 1, i]);
    out.push([headD.length - 1, 0]);
    for (let i = 1; i < bodyD.length; i++) out.push([b0 + i - 1, b0 + i]);
    out.push([b0 + bodyD.length - 1, b0]);
    return out; })();

  // ---------- 三颗特写参数点（每颗=一个可学习的数字） ----------
  const FEAT = [
    { x: 855, y: 515, r: 30, num: '0.73', nx: 855, ny: 588, ph: 1.7 },
    { x: 990, y: 505, r: 26, num: '-1.2', nx: 990, ny: 574, ph: 4.1 },
    { x: 1072, y: 550, r: 30, num: '2.4', nx: 1072, ny: 622, ph: 7.3 },
  ];

  // ---------- 背景参数点星群（拍二成片增殖，拍三停住） ----------
  const STARS = (function () { const r = rng(5150), out = [];
    for (let i = 0; i < 560; i++) { let x = 60, y = 60, ok = false;
      for (let tr = 0; tr < 60 && !ok; tr++) { x = 40 + r() * 1840; y = 40 + r() * 1000; ok = true;
        if (x < 640 && y < 320) ok = false;                                              // 标题区
        if (x > 500 && x < 1330 && y > 715 && y < 865) ok = false;                      // 计数器区
        const ex = (x - 965) / 310, ey = (y - 520) / 170; if (ex * ex + ey * ey < 1) ok = false;  // 野牛体内
        if (x > 670 && x < 1260 && y > 630 && y < 755) ok = false;                       // 四腿区
        if (x > 195 && x < 505 && y > 535 && y < 845) ok = false;                       // 罗盘区
        if (x > 1335 && x < 1650 && y > 615 && y < 875) ok = false;                     // 石板区
        if (x > 800 && x < 1120 && y > 690 && y < 880) ok = false;                      // 火盆区
      }
      out.push({ x: x, y: y, r: 1.6 + r() * 3.2, ph: r() * 6.28, a: 0.34 + r() * 0.4, at: i < 24 ? -1 : 3.2 + r() * 3.05 });
    }
    return out; })();

  // ---------- 计数器：3.15 起 1.5B，滚到 175B、540B、1T+（6.42 过 1e12=重音点） ----------
  function counterVal(t) {
    if (t < 3.15) return null;
    if (t < 3.45) return 1.5e9;
    if (t < 4.1) return 1.5e9 * Math.pow(175e9 / 1.5e9, ss(3.45, 4.1, t));
    if (t < 4.45) return 175e9;
    if (t < 5.1) return 175e9 * Math.pow(540e9 / 175e9, ss(4.45, 5.1, t));
    if (t < 5.5) return 540e9;
    if (t < 6.45) return 540e9 * Math.pow(1.02e12 / 540e9, ss(5.5, 6.45, t));
    return 1.02e12;
  }
  function counterTxt(v) { if (v >= 1e12) return '1T+'; const b = v / 1e9; return (b >= 99.95 ? String(Math.round(b)) : (Math.round(b * 10) / 10).toFixed(1)) + 'B'; }

  // ---------- 镜头：拍一缓推（1.09→1.16），拍二缓拉远（→1.0 看全增殖），拍三停 ----------
  const camS = (t) => (t < 3 ? 1.09 + 0.07 * ss(0, 2.6, t) : t < 7 ? 1.16 - 0.16 * ss(3, 7, t) : 1);

  // ---------- 各部件每帧画法（画进颜料层 L，最后整层吃进岩面） ----------
  function starsDraw(g, lt, t) {
    g.fillStyle = C.red;
    for (let i = 0; i < STARS.length; i++) { const s = STARS[i];
      if (lt < s.at) continue;
      const ap = s.at < 0 ? 1 : ss(s.at, s.at + 0.35, lt);
      let a = s.a * ap * (0.78 + 0.3 * Math.sin(t * 1.7 + s.ph));
      if (a < 0.1) a = 0.1; if (a > 0.85) a = 0.85;
      g.globalAlpha = a; g.beginPath(); g.arc(s.x, s.y, s.r, 0, Math.PI * 2); g.fill();
    }
    g.globalAlpha = 1;
  }

  function herdDraw(g, lt, t) {
    const ph = Math.floor(t * 60 / 7) % 2;                     // 两姿态：每 7 帧（60fps）一换
    const steady = 1 - 0.55 * ss(8.5, 9.3, lt);                // 拍三：明灭收稳
    g.save(); g.translate(ph ? 4 : -4, ph ? -12 : 5);          // 奔跑颠簸
    // 兽身淡彩（点连成兽后洇开，帮远看读出「野牛」）
    const wash = ss(6.45, 7.0, lt);
    if (wash > 0) { g.save(); g.globalAlpha = wash; g.fillStyle = C.wash; g.fill(RIG.smooth(BODY)); g.restore(); }
    // 炭线蔓延：已刻完的段合并一笔，正在刻的那段单画
    const batch = new Path2D(); let curSeg = -1, ndone = 0;
    for (let k = 0; k < SEGS.length; k++) { const at = HERDQ[SEGS[k][1]].at;
      const q = ss(at, at + 0.18, lt);
      if (q >= 1) { const A = HERDQ[SEGS[k][0]], B = HERDQ[SEGS[k][1]]; batch.moveTo(A.x, A.y); batch.lineTo(B.x, B.y); ndone++; }
      else if (q > 0) curSeg = k;
    }
    if (ndone > 0) inkLine(g, batch, 2.6, t, 1);
    if (curSeg >= 0) { const A = HERDQ[SEGS[curSeg][0]], B = HERDQ[SEGS[curSeg][1]], at = HERDQ[SEGS[curSeg][1]].at, q = ss(at, at + 0.18, lt);
      const p = new Path2D(); p.moveTo(A.x, A.y); p.lineTo(lerp(A.x, B.x, q), lerp(A.y, B.y, q)); inkLine(g, p, 2.6, t, 1); }
    // 轮廓点：逐颗刻入＋火光下明灭
    const spr = dotS();
    for (let i = 0; i < HERDQ.length; i++) { const d = HERDQ[i];
      const q = ss(d.at, d.at + 0.22, lt); if (q <= 0) continue;
      const tw = 0.8 + 0.25 * steady * Math.sin(t * 2.1 + d.ph);
      g.globalAlpha = clamp(q * tw, 0, 1); const ds = d.r / 12 * 41;
      g.drawImage(spr, d.x - ds / 2, d.y - ds / 2, ds, ds);
    }
    g.globalAlpha = 1;
    // 拍三：连线描白（参数从变多转为变亮变精）
    const chalkOn = ss(8.3, 8.5, lt);
    if (chalkOn > 0) { const cb = new Path2D(); let cc = -1, cnt = 0;
      for (let k = 0; k < SEGS.length; k++) { const cat = 8.3 + (k / SEGS.length) * 1.15;
        const q = ss(cat, cat + 0.3, lt);
        if (q >= 1) { const A = HERDQ[SEGS[k][0]], B = HERDQ[SEGS[k][1]]; cb.moveTo(A.x, A.y); cb.lineTo(B.x, B.y); cnt++; }
        else if (q > 0) cc = k; }
      if (cnt > 0) { g.save(); g.globalAlpha = 0.42; g.strokeStyle = C.chalk; g.lineWidth = 1.2; g.stroke(cb); g.restore(); }
      if (cc >= 0) { const A = HERDQ[SEGS[cc][0]], B = HERDQ[SEGS[cc][1]], cat = 8.3 + (cc / SEGS.length) * 1.15, q = ss(cat, cat + 0.3, lt);
        g.save(); g.globalAlpha = 0.42; g.strokeStyle = C.chalk; g.lineWidth = 1.2; g.beginPath();
        g.moveTo(A.x, A.y); g.lineTo(lerp(A.x, B.x, q), lerp(A.y, B.y, q)); g.stroke(); g.restore(); } }
    // 四条炭腿（两姿态交替奔跑）＋蹄
    const lg = ss(4.4, 4.8, lt);
    if (lg > 0) { const legs = ph ? LEG1 : LEG0;
      for (let i = 0; i < legs.length; i++) { const A = tf(legs[i][0], legs[i][1]), B = tf(legs[i][2], legs[i][3]);
        inkLine(g, RIG.smooth([A, [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2 + 5], B], false), 12.5, t, lg);
        const hp = new Path2D(); hp.moveTo(B[0] - 13, B[1] + 1); hp.lineTo(B[0] + 15, B[1] + 4); inkLine(g, hp, 12, t, lg); } }
    // 双角＋一点炭眼（头随群先出）
    const hq = ss(3.6, 4.0, lt);
    if (hq > 0) {
      inkLine(g, RIG.smooth([tf(700, 284), tf(708, 262), tf(722, 248)], false), 10, t, hq);
      inkLine(g, RIG.smooth([tf(688, 280), tf(688, 258), tf(698, 242)], false), 9, t, hq);
      const E = tf(704, 304); g.save(); g.globalAlpha = hq; g.fillStyle = C.ink; g.beginPath(); g.arc(E[0], E[1], 7.5, 0, Math.PI * 2); g.fill(); g.restore(); }
    // 尾（最后收笔）
    const tq2 = ss(6.0, 6.45, lt);
    if (tq2 > 0) inkLine(g, RIG.smooth([tf(468, 296), tf(452, 314), tf(446, 336)], false), 8, t, tq2);
    g.restore();
  }

  function featuredDraw(g, lt, t) {
    const spr = dotL(), bright = ss(8.0, 8.8, lt);
    for (let i = 0; i < 3; i++) { const f = FEAT[i];
      const br = 1 + 0.05 * Math.sin(t * 1.9 + f.ph);              // 呼吸涨缩
      const sz = f.r * br, ds = sz / 30 * 102;
      g.globalAlpha = 0.96; g.drawImage(spr, f.x - ds / 2, f.y - ds / 2, ds, ds); g.globalAlpha = 1;
      // 刻上去的数字＋旁边两道划痕
      engrave(g, f.num, f.nx, f.ny, '38px "Kalam-700"', C.ink, 1, { t: t, lw: 2 });
      const sc = new Path2D();
      sc.moveTo(f.nx - 30, f.ny + 12); sc.lineTo(f.nx - 14, f.ny + 15);
      sc.moveTo(f.nx + 16, f.ny + 11); sc.lineTo(f.nx + 32, f.ny + 14);
      inkLine(g, sc, 2.4, t, 0.85);
      // 拍三：白垩点睛环（描亮）
      const ring = ss(8.0 + i * 0.18, 8.35 + i * 0.18, lt);
      if (ring > 0) { const p = new Path2D(); p.ellipse(f.x, f.y, sz + 10 + 3 * bright, sz + 10 + 3 * bright, 0, 0, Math.PI * 2);
        g.save(); g.globalAlpha = clamp(ring * (0.42 + 0.22 * Math.sin(t * 2.6 + f.ph)), 0, 1); g.strokeStyle = C.chalk; g.lineWidth = 2.6; g.stroke(p); g.restore(); }
    }
  }

  function counterDraw(g, lt, t) {
    const gate = ss(3.15, 3.4, lt) * (1 - ss(7.0, 7.45, lt));       // 拍三淡出（增殖停住、不再提）
    if (gate <= 0) return;
    const v = counterVal(lt);
    if (v !== null) {
      const txt = counterTxt(v), big = v >= 1e12;                    // 1T+：换红赭、轻 pop（唯一重音）
      const pop = big ? 1 + 0.13 * ss(6.42, 6.56, lt) * (1 - ss(6.72, 7.15, lt)) : 1;
      g.save(); g.translate(1005, 806); g.scale(pop, pop);
      engrave(g, txt, 0, 0, '60px "Kalam-700"', big ? C.red : C.ink, gate, { t: t, lw: 2.5 });
      g.restore();
    }
    // 刻痕道道：20 道计满 4 组（每道 0.13s 刻入，第 5 道斜杠跨过前四道）
    const pth = new Path2D();
    for (let m = 0; m < 20; m++) {
      const at = 3.5 + m * 0.145, q = ss(at, at + 0.13, lt); if (q <= 0) break;
      const grp = (m / 5) | 0, k = m % 5, gx = 632 + grp * 66;
      if (k < 4) { const x = gx + k * 13; pth.moveTo(x, 772); pth.lineTo(x, 772 + 42 * q); }
      else { const ax = gx - 4, ay = 814, bx = gx + 44, by = 770; pth.moveTo(ax, ay); pth.lineTo(lerp(ax, bx, q), lerp(ay, by, q)); }
    }
    inkLine(g, pth, 3, t, gate);
    g.save(); g.globalAlpha = gate * 0.3; g.translate(1.6, 1.6); g.strokeStyle = 'rgba(255,232,190,.55)'; g.lineWidth = 2; g.stroke(pth); g.restore();
    // 铭文框（四边依次刻出）
    const fq = ss(3.15, 3.55, lt);
    if (fq > 0) { const corners = [[562, 746], [1258, 746], [1258, 834], [562, 834], [562, 746]];
      const fp = new Path2D(); const done = Math.min(4, fq * 4);
      for (let i = 0; i < 4; i++) { const q = clamp(done - i, 0, 1); if (q <= 0) break;
        const a = corners[i], b = corners[i + 1]; fp.moveTo(a[0], a[1]); fp.lineTo(lerp(a[0], b[0], q), lerp(a[1], b[1], q)); }
      inkLine(g, fp, 3.5, t, gate); }
  }

  const TT = [['参数', 0], ['疯狂卷参数', 3], ['参数之外', 7]];
  function titleDraw(g, lt, t) {
    for (let k = 0; k < 3; k++) {
      const txt = TT[k][0], t0 = TT[k][1];
      const a = ss(t0 + 0.35, t0 + 0.95, lt) * (1 - ss(t0 + 3.0, t0 + 3.35, lt));
      if (a <= 0) continue;
      g.save(); g.globalAlpha = a; g.font = '64px "LXGWWenKai-500"'; g.letterSpacing = '6px';
      g.textAlign = 'left'; g.textBaseline = 'alphabetic';
      const w = g.measureText(txt).width;
      g.fillStyle = 'rgba(255,226,180,.25)'; g.fillText(txt, 169.6, 179.6);      // 刻痕下缘亮棱
      g.strokeStyle = inkPat(g, t); g.lineWidth = 3; g.strokeText(txt, 168, 178);
      g.fillStyle = C.red; g.fillText(txt, 168, 178);
      g.letterSpacing = '0px';
      const uq = ss(t0 + 0.5, t0 + 1.05, lt);                                    // 底下刻痕线随字刻入
      if (uq > 0) { const pr = new Path2D(); pr.moveTo(172, 202); pr.lineTo(lerp(172, 194 + w, uq), lerp(202, 200, uq)); inkLine(g, pr, 3, t, a); }
      g.restore();
    }
  }

  // ---------- 拍三：三件物依次从岩壁里描出、升起归位 ----------
  function objectsDraw(g, lt, t) {
    if (lt < 7.0) return;
    // 一摞石板（数据）——自下而上五块
    const qS = ss(7.05, 7.6, lt), oyS = (1 - qS) * 46;
    if (qS > 0) { g.save(); g.translate(0, oyS);
      for (let i = 0; i < 5; i++) { const yc = 812 - i * 31, w = 168 + i * 9, ox = i % 2 ? 7 : -5;
        const pts = [[-w / 2 + ox, -13], [w / 2 + ox, -13], [w / 2 - ox * 0.5, 13], [-w / 2 - ox * 0.5, 13]].map(function (p) { return [p[0] + 1492, p[1] + yc]; });
        shape(g, RIG.smooth(pts), i % 2 ? C.stone : C.stoneD, 5, t, qS * 0.95); }
      const mk = ss(8.9, 9.4, lt);                                              // 顶板刻度＋描亮
      if (mk > 0) { g.save(); g.globalAlpha = mk * 0.75; g.strokeStyle = C.chalk; g.lineWidth = 3; g.lineCap = 'round';
        for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(1436 + k * 26, 676); g.lineTo(1448 + k * 26, 692); g.stroke(); }
        g.beginPath(); g.moveTo(1400, 674); g.lineTo(1584, 674); g.stroke(); g.restore(); }
      g.restore(); }
    // 骨针罗盘（方法）——木环＋八刻度＋骨针旋转减速停稳
    const qC = ss(7.3, 7.85, lt), oyC = (1 - qC) * 46;
    if (qC > 0) { g.save(); g.translate(0, oyC);
      const cx = 350, cy = 690;
      const ring = new Path2D(); ring.arc(cx, cy, 92, 0, Math.PI * 2);
      inkLine(g, ring, 24, t, qC);
      g.save(); g.globalAlpha = qC; g.strokeStyle = C.ochre; g.lineWidth = 15; g.stroke(ring); g.restore();
      const tk = new Path2D();
      for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; tk.moveTo(cx + Math.cos(a) * 102, cy + Math.sin(a) * 102); tk.lineTo(cx + Math.cos(a) * 118, cy + Math.sin(a) * 118); }
      inkLine(g, tk, 3.5, t, qC);
      const qc2 = ss(7.4, 9.1, lt), ang = -1.05 + 1.42 * (1 - (1 - qc2) * (1 - qc2)) + (lt > 9.1 ? 0.03 * Math.sin((lt - 9.1) * 5) : 0);
      g.save(); g.translate(cx, cy); g.rotate(ang);
      shape(g, U.poly([[0, -66], [9, 0], [0, 66], [-9, 0]]), C.chalk, 3.5, t, qC);
      shape(g, U.poly([[0, -66], [7, -50], [-7, -50]]), C.redD, 2.5, t, qC);
      g.restore();
      g.save(); g.globalAlpha = qC; g.fillStyle = C.ink; g.beginPath(); g.arc(cx, cy, 6.5, 0, Math.PI * 2); g.fill(); g.restore();
      const hl = ss(8.9, 9.4, lt);
      if (hl > 0) { g.save(); g.globalAlpha = hl * 0.5; g.strokeStyle = C.chalk; g.lineWidth = 3.2;
        g.beginPath(); g.arc(cx, cy, 99, -2.4, -0.9); g.stroke(); g.restore(); }
      g.restore(); }
    // 火盆（算力）——石盆＋两姿态火苗
    const qF = ss(7.55, 8.1, lt), oyF = (1 - qF) * 46;
    if (qF > 0) { g.save(); g.translate(0, oyF);
      shape(g, RIG.smooth([[858, 772], [874, 814], [918, 838], [1004, 838], [1046, 814], [1062, 772], [1006, 762], [914, 762]]), C.stoneD, 7, t, qF);
      const rim = new Path2D(); rim.ellipse(960, 768, 102, 16, 0, 0, Math.PI * 2);
      g.save(); g.globalAlpha = qF; g.fillStyle = 'rgba(78,38,16,.9)'; g.fill(rim); g.restore();
      inkLine(g, rim, 4, t, qF);
      const ph = Math.floor(t * 60 / 6) % 2;
      const tongues = [[0, 92, 30, C.red], [-27, 62, 20, C.ochre], [27, 58, 18, C.ochre], [0, 40, 11, C.ember]];
      for (let i = 0; i < tongues.length; i++) { const tg = tongues[i];
        const h = tg[1] * (0.85 + 0.25 * (0.5 + 0.5 * P.noise(t * 6.5 + tg[0], tg[0]))) * (ph ? 1.06 : 0.94);
        const sway = (ph ? 1 : -1) * (3 + 4 * Math.abs(P.noise(t * 7.3 + tg[0] * 0.2, tg[0])));
        const p = new Path2D();
        p.moveTo(960 + tg[0] - tg[2], 764); p.quadraticCurveTo(960 + tg[0] - tg[2] * 0.7, 764 - h * 0.45, 960 + tg[0] + sway, 764 - h);
        p.quadraticCurveTo(960 + tg[0] + tg[2] * 0.7, 764 - h * 0.45, 960 + tg[0] + tg[2], 764); p.closePath();
        g.save(); g.globalAlpha = qF * 0.92; g.fillStyle = tg[3]; g.fill(p); g.restore(); }
      const hl2 = ss(9.0, 9.5, lt);
      if (hl2 > 0) { g.save(); g.globalAlpha = hl2 * 0.5; g.strokeStyle = C.chalk; g.lineWidth = 3;
        g.beginPath(); g.ellipse(960, 768, 108, 19, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke(); g.restore(); }
      g.restore(); }
  }

  return {
    init() {
      U.assertGlyphs('LXGWWenKai-500', '参数疯狂卷之外', 's01_cave 屏上字');
      U.assertGlyphs('Kalam-700', '0123456789.BT+-', 's01_cave 刻痕数字');
      dotL(); dotS(); bg();                                        // 冷缓存建在引擎 boot（init 后、首帧前）
    },
    draw(c, lt, t) {
      const s = camS(lt);
      c.save();
      c.translate(960, 540); c.scale(s, s); c.translate(-960, -540);
      c.drawImage(bg(), 0, 0);
      // 拍二：随增殖岩壁蒙尘加深，拍三退净
      const dust = 0.13 * ss(3.2, 6.4, lt) * (1 - ss(6.8, 7.6, lt));
      if (dust > 0.003) { c.fillStyle = 'rgba(28,15,7,' + dust.toFixed(3) + ')'; c.fillRect(0, 0, W, H); }
      // 颜料层（星星→点群野牛→特写参数点→计数器→屏上字→三物），整层吃进岩面
      const L = P.scratch('s01c_fig'), g = L.getContext('2d'); g.clearRect(0, 0, W, H);
      starsDraw(g, lt, t);
      herdDraw(g, lt, t);
      featuredDraw(g, lt, t);
      counterDraw(g, lt, t);
      titleDraw(g, lt, t);
      objectsDraw(g, lt, t);
      g.globalCompositeOperation = 'source-atop'; g.drawImage(figTex(), 0, 0); g.globalCompositeOperation = 'source-over';
      c.drawImage(L, 0, 0);
      // ---- 火光（overlay：提亮暖化不洗掉赭石饱和度） ----
      const n1 = P.noise(t * 3.1, 1.7), n2 = P.noise(t * 2.3, 8.1);
      const surge = 0.30 * ss(6.42, 6.75, lt) * (1 - ss(6.95, 7.7, lt));          // 1T+ 揭示：火光涌起一次（重音）
      const fl = 0.14 + 0.11 * P.noise(t * 9.5, 3.3) + 0.04 * Math.sin(t * 23) + 0.03 * Math.sin(t * 37) + surge;
      const dl = ss(7.6, 8.7, lt);                                                 // 拍三：光心落进火盆
      const fx = 960 + n1 * 55 * (1 - dl), fy = lerp(560 + n2 * 34, 762, dl);
      const gr = c.createRadialGradient(fx, fy, 10, fx, fy, lerp(700 + n2 * 60, 470, dl));
      gr.addColorStop(0, 'rgba(255,196,110,' + clamp(fl * 2.6, 0, 1).toFixed(3) + ')');
      gr.addColorStop(0.5, 'rgba(255,160,80,' + (fl * 1.3).toFixed(3) + ')');
      gr.addColorStop(1, 'rgba(255,140,60,0)');
      c.save(); c.globalCompositeOperation = 'overlay'; c.fillStyle = gr; c.fillRect(0, 0, W, H);
      c.globalCompositeOperation = 'source-over';
      const dk = c.createRadialGradient(fx, fy, 380, fx, fy, 1150); dk.addColorStop(0, 'rgba(20,8,2,0)'); dk.addColorStop(1, 'rgba(20,8,2,' + clamp(0.2 - fl * 0.4, 0.06, 0.3).toFixed(3) + ')');
      c.fillStyle = dk; c.fillRect(0, 0, W, H);
      // 手印明灭（各自独立相位）
      c.globalCompositeOperation = 'lighter';
      HANDS.forEach(function (hd, k) { const v = clamp(0.5 + 0.9 * P.noise(t * 7 + k * 3.7, k)); if (v < 0.05) return;
        const hg = c.createRadialGradient(hd[0], hd[1], 5, hd[0], hd[1], 105); hg.addColorStop(0, 'rgba(255,150,80,' + (0.2 * v).toFixed(3) + ')'); hg.addColorStop(1, 'rgba(255,120,60,0)');
        c.fillStyle = hg; c.fillRect(hd[0] - 105, hd[1] - 105, 210, 210); });
      // 三颗参数点的暖光（呼吸明灭，拍三转亮）
      const bright = ss(8.0, 8.8, lt);
      for (let i = 0; i < 3; i++) { const f = FEAT[i];
        const ga = clamp((0.09 + 0.16 * (0.5 + 0.5 * P.noise(t * 2.3 + f.ph, f.ph))) * (1 + 0.8 * bright), 0, 0.45);
        const fg = c.createRadialGradient(f.x, f.y, 4, f.x, f.y, f.r * 4.2); fg.addColorStop(0, 'rgba(255,150,80,' + ga.toFixed(3) + ')'); fg.addColorStop(1, 'rgba(255,120,60,0)');
        c.fillStyle = fg; c.fillRect(f.x - f.r * 4.2, f.y - f.r * 4.2, f.r * 8.4, f.r * 8.4); }
      // 火盆光
      const qF2 = ss(7.55, 8.3, lt);
      if (qF2 > 0.3) { const bg2 = c.createRadialGradient(960, 745, 8, 960, 745, 230); bg2.addColorStop(0, 'rgba(255,170,70,' + (qF2 * (0.14 + 0.1 * fl)).toFixed(3) + ')'); bg2.addColorStop(1, 'rgba(255,140,60,0)');
        c.fillStyle = bg2; c.fillRect(700, 500, 520, 420); }
      // 金色余烬：两侧＋盆中（盆中的随火盆升起淡入）
      const grp = [[20, 340, 15, 431, 1], [1580, 1900, 15, 473, 1], [560, 1360, 6, 517, 1], [890, 1030, 10, 601, qF2]];
      for (let gi = 0; gi < grp.length; gi++) { const gg = grp[gi], am = gg[4];
        if (am <= 0.02) continue;
        P.particles(gg[2], gg[3], t, { x0: gg[0], x1: gg[1], y0: H + 30, y1: 120, drift: 22, life: 5.5 }).forEach(function (p) {
          const tw = 0.3 + 0.7 * Math.abs(Math.sin(t * 7 + p.i * 1.9)), fade = Math.sin(p.q * Math.PI), r0 = 2.6 + p.s * 2.8;
          c.fillStyle = 'rgba(255,170,60,' + (0.32 * tw * fade * am).toFixed(3) + ')'; c.beginPath(); c.arc(p.x, p.y, r0 * 3.6, 0, Math.PI * 2); c.fill();
          c.fillStyle = 'rgba(255,224,130,' + (0.95 * tw * fade * am).toFixed(3) + ')'; c.beginPath(); c.arc(p.x, p.y, r0, 0, Math.PI * 2); c.fill();
        });
      }
      c.restore(); c.restore();
    },
  };
})();
