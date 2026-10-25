// 「大模型参数」× 埃及墓室壁画（s02_egypt）：灰泥墙上平涂细勾线的「参数账本」——象形符号即参数本体，
// 阿顿日盘光线牵出符号之网、计数逐级凿在石碑上，收尾三块铭文物升起描金。单镜头三节拍、整 10 秒。
// 管线照 02_egypt 配方卡：①静态墙（灰泥纹理＋四色彩块边框＋分栏红线＋底部饰带＋深蓝带）缓存；
// ②每帧动态：特写符号金晕呼吸、阿顿光线末端小手开合＋扇形波动、水纹字 12fps 步进、符号逐颗凿出（dash 揭示＋金辉回落）、
// 计数 1.5B→1T+ 滚动、圣甲虫推日球循环、三物升起、彩条回弹；
// ③壁画表面：斑驳 multiply 全画面（配方卡做法）＋发丝裂纹只画四边边缘（做旧不上身）＋颗粒。
// 节拍：0–3 三枚特写符号＋爬虫（缓推）；3–7 阿顿日盘网络增殖＋石碑计数（缓拉远，1T+ 光晕涌起一次重音）；7–10 三物升起描金收稳＋彩条（停）。
SCENES['s02_egypt'] = (() => {
  const W = 1920, H = 1080, { clamp, lerp, ss, rng } = U, P = PAINT;
  const C = {
    wall: '#eadcb8', wall2: '#d8c597', line: '#2a1810', rule: '#9a2b22',
    red: '#b8322a', blue: '#2a58a8', yellow: '#e2b13a', green: '#2e8a55', black: '#231a14',
    gold: '#e0ab38', goldD: '#a8741c', goldL: '#f3d27a', navy: '#1c2236', cream: '#f2ead6', white: '#f6f2e8',
    sun: '#c8372b', ray: '#c23a2a', hand: '#b4452c', lapis: '#2c56b0', turq: '#3fa6a0', terra: '#d4936a',
  };
  const BAND = [C.red, C.blue, C.yellow, C.green];

  // ---------------- 小工具 ----------------
  const poly = (g, pts, close = true) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); if (close) g.closePath(); };
  const fs2 = (g, fill, stroke, lw = 2.5) => { if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); } };
  const D2R = Math.PI / 180;

  // ---------------- 象形字形库（原点居中，约 50px 宽；照配方卡 24 字的笔法精选 13 个） ----------------
  const GL = {
    ankh: { h: 60, cols: [C.blue, C.green, C.black, C.red], d(g) { g.lineWidth = 3.6; g.beginPath(); g.ellipse(0, -17, 8, 11, 0, 0, 7); g.moveTo(-16, -3); g.lineTo(16, -3); g.moveTo(0, -5); g.lineTo(0, 29); g.stroke(); } },
    eye: { h: 36, cols: [C.green, C.black, C.blue], d(g) { g.beginPath(); g.moveTo(-18, 0); g.quadraticCurveTo(0, -12, 18, 0); g.quadraticCurveTo(0, 9, -18, 0); g.stroke(); g.beginPath(); g.arc(0, -1, 4.5, 0, 7); g.fill(); g.beginPath(); g.moveTo(-18, -12); g.quadraticCurveTo(0, -20, 20, -11); g.moveTo(-4, 6); g.lineTo(-6, 16); g.moveTo(6, 5); g.quadraticCurveTo(14, 18, 4, 16); g.stroke(); } },
    reed: { h: 62, cols: [C.black, C.green, C.red], d(g) { g.beginPath(); g.moveTo(-2, 29); g.quadraticCurveTo(-11, 0, 1, -29); g.quadraticCurveTo(7, -2, 4, 29); g.stroke(); g.beginPath(); g.moveTo(1, -29); g.quadraticCurveTo(9, -31, 10, -24); g.stroke(); } },
    water: { h: 30, cols: [C.blue], water: true, d(g, ph = 0) { g.lineWidth = 2.6; for (let r = -1; r <= 1; r++) { g.beginPath(); for (let i = 0; i <= 16; i++) { const x = -21 + i * 2.625, y = r * 9 + ((i + ph) % 2 < 1 ? -3 : 3); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); } } },
    scarab: { h: 46, cols: [C.blue, C.black], d(g) { g.beginPath(); g.ellipse(0, 6, 10, 14, 0, 0, 7); g.fill(); g.beginPath(); g.arc(0, -11, 6, 0, 7); g.fill(); g.beginPath(); for (const s of [-1, 1]) for (const k of [-1, 0, 1]) { g.moveTo(s * 9, 6 + k * 8); g.lineTo(s * 17, 2 + k * 11); } g.stroke(); } },
    djed: { h: 62, cols: [C.blue, C.green], d(g) { g.beginPath(); g.moveTo(-6, 29); g.lineTo(-6, -10); g.moveTo(6, 29); g.lineTo(6, -10); for (let k = 0; k < 4; k++) { g.moveTo(-13, -12 - k * 5); g.lineTo(13, -12 - k * 5); } g.moveTo(-12, 29); g.lineTo(12, 29); g.stroke(); } },
    sun: { h: 40, cols: [C.black, C.blue, C.red], d(g) { g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 15, 0, 7); g.stroke(); g.beginPath(); g.arc(0, 0, 4, 0, 7); g.fill(); } },
    lotus: { h: 56, cols: [C.green, C.blue], d(g) { g.beginPath(); g.moveTo(0, 27); g.lineTo(0, -6); g.stroke(); poly(g, [[0, -6], [-12, -18], [-6, -26], [0, -16], [6, -26], [12, -18]]); g.stroke(); } },
    jug: { h: 50, cols: [C.red, C.green, C.blue], d(g) { g.beginPath(); g.moveTo(-6, -22); g.lineTo(6, -22); g.lineTo(5, -14); g.quadraticCurveTo(16, -6, 12, 12); g.quadraticCurveTo(8, 22, 0, 22); g.quadraticCurveTo(-8, 22, -12, 12); g.quadraticCurveTo(-16, -6, -5, -14); g.closePath(); g.stroke(); g.beginPath(); g.moveTo(-10, 0); g.lineTo(10, 0); g.stroke(); } },
    shen: { h: 42, cols: [C.red, C.blue], d(g) { g.beginPath(); g.arc(0, -4, 13, 0, 7); g.stroke(); g.beginPath(); g.moveTo(-14, 13); g.lineTo(14, 13); g.stroke(); } },
    snake: { h: 30, cols: [C.green, C.black, C.red], d(g) { g.lineWidth = 3.2; g.beginPath(); g.moveTo(22, 8); g.bezierCurveTo(10, -4, 4, 14, -6, 6); g.bezierCurveTo(-14, 0, -16, -4, -20, -2); g.stroke(); g.beginPath(); g.moveTo(-20, -2); g.lineTo(-23, -9); g.moveTo(-17, -3); g.lineTo(-15, -10); g.stroke(); } },
    feather: { h: 60, cols: [C.blue, C.green, C.black], d(g) { g.beginPath(); g.moveTo(-2, 29); g.quadraticCurveTo(-8, -10, 4, -29); g.quadraticCurveTo(12, -18, 6, 0); g.quadraticCurveTo(3, 15, 2, 29); g.stroke(); } },
    bread: { h: 26, cols: [C.red, C.blue, C.green], d(g) { g.beginPath(); g.arc(0, 9, 19, Math.PI, 0); g.closePath(); g.stroke(); g.beginPath(); g.moveTo(-12, 4); g.lineTo(12, 4); g.stroke(); } },
    basket: { h: 26, cols: [C.blue, C.green, C.black], d(g) { g.beginPath(); g.moveTo(-20, -4); g.lineTo(20, -4); g.quadraticCurveTo(18, 12, 0, 12); g.quadraticCurveTo(-18, 12, -20, -4); g.stroke(); g.beginPath(); g.arc(22, 2, 5, -1.5, 1.6); g.stroke(); } },
    mouth: { h: 20, cols: [C.red], d(g) { g.beginPath(); g.moveTo(-18, 0); g.quadraticCurveTo(0, -9, 18, 0); g.quadraticCurveTo(0, 9, -18, 0); g.stroke(); } },
  };
  const GN = Object.keys(GL);
  const drawGlyph = (g, q, ph = 0, rv = 1, glow = 0) => {
    g.save(); g.translate(q.x, q.y); g.scale(q.s, q.s);
    g.strokeStyle = q.col; g.fillStyle = q.col; g.lineWidth = 3.1; g.lineCap = 'round'; g.lineJoin = 'round';
    if (glow > 0) { g.shadowColor = 'rgba(246,200,70,' + (0.85 * glow).toFixed(3) + ')'; g.shadowBlur = 12 * glow; }
    if (rv < 1) { g.setLineDash([Math.max(0.01, rv * 95), 999]); if (rv < 0.55) g.fillStyle = 'rgba(0,0,0,0)'; }
    GL[q.n].d(g, ph); g.restore();
  };

  // ---------------- 彩块边框（照配方卡 blocks：块间米白细缝＋黑线） ----------------
  function blocks(g, x0, y0, x1, y1, len, off = 0) {
    const hor = (x1 - x0) > (y1 - y0), L = hor ? x1 - x0 : y1 - y0;
    g.fillStyle = C.cream; g.fillRect(x0, y0, x1 - x0, y1 - y0);
    for (let s = 0, k = off; s < L; s += len, k++) {
      g.fillStyle = BAND[k % 4];
      if (hor) g.fillRect(x0 + s + 3, y0 + 3, Math.min(len - 6, L - s - 3), y1 - y0 - 6); else g.fillRect(x0 + 3, y0 + s + 3, x1 - x0 - 6, Math.min(len - 6, L - s - 3));
      g.fillStyle = C.black; if (hor) g.fillRect(x0 + s, y0, 2, y1 - y0); else g.fillRect(x0, y0 + s, x1 - x0, 2);
    }
    g.strokeStyle = C.black; g.lineWidth = 2; g.strokeRect(x0, y0, x1 - x0, y1 - y0);
  }

  // ---------------- 背景铭文栏（左右各两列；拍一稀疏，拍二随密度逐颗浮现） ----------------
  const COLS = [
    { x: 168, y0: 96, y1: 830 }, { x: 276, y0: 96, y1: 830 },
    { x: 1644, y0: 250, y1: 830 }, { x: 1752, y0: 250, y1: 830 },
  ];
  const GLYPHS = (() => {
    const r = rng(1350), out = [];
    COLS.forEach((col) => {
      const used = {}; let y = col.y0 + 8, prev = '';
      while (true) {
        let n; do { n = GN[(r() * GN.length) | 0]; } while (n === prev || used[n] > 2 || ((n === 'scarab' || n === 'water') && r() < 0.6));
        prev = n; used[n] = (used[n] || 0) + 1;
        const gl = GL[n], s = 1.06 * (1.0 + r() * 0.12);
        if (y + gl.h * s > col.y1) break;
        const early = r() < 0.34;
        out.push({ n, x: col.x + (r() - 0.5) * 4, y: y + gl.h * s / 2, s, col: gl.cols[(r() * gl.cols.length) | 0], ph: r() * 2, at: early ? -1 : 3.2 + r() * 3.1 });
        y += gl.h * s + 6 + r() * 5;
      }
    });
    let nw = out.filter(q => q.n === 'water').length;
    for (const q of out) { if (nw >= 6) break; if (['mouth', 'bread', 'basket'].includes(q.n)) { q.n = 'water'; q.col = C.blue; nw++; } }
    return out;
  })();

  // ---------------- 静态墙（缓存一次）：灰泥墙＋四色边框＋分栏红线＋底部饰带＋深蓝带 ----------------
  const bg = () => P.cached('s02e_bg', W, H, (g) => {
    g.drawImage(P.texture('s02e_wall', C.wall, { scale: 0.0035, amt: 16, grain: 12, dark: C.wall2, seed: 13 }), 0, 0);
    g.lineCap = 'round';
    COLS.forEach((col) => [col.x - 44, col.x + 44].forEach((x) => { g.strokeStyle = C.rule; g.lineWidth = 2.6; g.beginPath(); g.moveTo(x, col.y0); g.lineTo(x, col.y1); g.stroke(); }));
    // 地线＋底部饰带＋深蓝带
    g.fillStyle = C.black; g.fillRect(0, 898, W, 6);
    g.fillStyle = C.cream; g.fillRect(0, 904, W, 106);
    blocks(g, -20, 914, W + 20, 948, 64, 0);
    g.fillStyle = C.yellow; g.fillRect(0, 961, W, 15); g.fillStyle = C.red; g.fillRect(0, 984, W, 14);
    g.fillStyle = C.black; [912, 960, 977, 983, 999, 1008].forEach(y => g.fillRect(0, y, W, 1.6));
    g.fillStyle = C.navy; g.fillRect(0, 1010, W, 70);
    const r = rng(7); for (let i = 0; i < 2600; i++) { g.fillStyle = r() < 0.5 ? 'rgba(90,100,140,.35)' : 'rgba(5,8,20,.45)'; g.fillRect(r() * W, 1010 + r() * 70, 1 + r() * 2, 1 + r() * 2); }
    // 顶部与两侧彩块边框
    blocks(g, -10, 6, W + 10, 40, 56, 2);
    blocks(g, 32, 40, 58, 898, 46, 1); blocks(g, 1862, 40, 1888, 898, 46, 3);
  });

  // ---------------- 壁画表面：斑驳 multiply（全画面，配方卡做法）＋边缘短裂纹（做旧不上中央主体）＋颗粒 ----------------
  const surface = () => P.cached('s02e_surface', W, H, (g) => {
    const img = g.createImageData(W, H), d = img.data, r = rng(99);
    for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) {
      const n = P.fbm(x * 0.006 + 40, y * 0.006, 4), m = P.fbm(x * 0.03, y * 0.03 + 9, 2);
      const v = 243 + n * 30 + m * 12 + (r() - 0.5) * 18;
      for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const i = ((y + dy) * W + x + dx) * 4; d[i] = v; d[i + 1] = v - 6; d[i + 2] = v - 16; d[i + 3] = 255; }
    }
    g.putImageData(img, 0, 0);
    const rr = rng(5);   // 发丝裂纹只从四边出发、短游走，不进中央画面主体
    [[150, 0, 0.5], [720, 0, 1.35], [1300, 0, -1.2], [60, 250, -0.15], [1882, 210, 2.8], [110, 720, 0.2], [1820, 620, 1.8], [500, 1080, -1.5], [1450, 1080, -1.7]].forEach(([x, y, a0]) => {
      g.strokeStyle = 'rgba(90,70,50,.55)'; g.lineWidth = 1.1; let a = a0;
      g.beginPath(); g.moveTo(x, y); for (let s = 0; s < 10; s++) { a += (rr() - 0.5) * 0.7; x += Math.cos(a) * 13; y += Math.sin(a) * 13; g.lineTo(x, y); if (rr() < 0.08) g.moveTo(x, y); } g.stroke();
    });
  });
  const specks = () => P.grain('s02e_specks', 0.018, [70, 50, 30], 0.4);

  // ---------------- 特写三符号（参数本体；0.25–0.9s 逐颗被写出端详） ----------------
  const FEAT = [
    { n: 'ankh', x: 700, y: 575, s: 1.72, col: C.blue, num: '0.73', ph: 1.7, at: 0.25 },
    { n: 'eye', x: 960, y: 552, s: 1.72, col: C.green, num: '-1.2', ph: 4.1, at: 0.5 },
    { n: 'reed', x: 1218, y: 568, s: 1.72, col: C.black, num: '2.4', ph: 7.3, at: 0.75 },
  ];

  // ---------------- 阿顿网络：日盘＋13 条光线（3 条长射线托住三特写符号，10 条普通线各串 1–2 颗符号） ----------------
  const DISK = [960, 352];
  const RAYS = [
    { a: -160, len: 470 }, { a: -135, len: 440 }, { a: -110, len: 290 }, { a: -85, len: 295 },
    { a: -60, len: 340 }, { a: -35, len: 465 }, { a: -10, len: 495 }, { a: 15, len: 440 }, { a: 40, len: 415 }, { a: 65, len: 300 },
  ].map((r, k) => ({ ...r, k, at: 3.4 + k * 0.07, main: false }));
  const MAINR = FEAT.map((f, k) => {
    const hx = f.x, hy = f.y - 45;                 // 光线末端小手托在符号上方
    return { a: Math.atan2(hy - DISK[1], hx - DISK[0]) / D2R, len: Math.hypot(hx - DISK[0], hy - DISK[1]), k: 20 + k, at: 3.6 + k * 0.12, main: true };
  });
  const ALLR = MAINR.concat(RAYS);
  // 普通光线中段的网络符号（沿光线逐颗凿出）
  const RSY = (() => {
    const r = rng(666), out = [];
    RAYS.forEach((ray) => {
      const a = ray.a * D2R, slots = ray.len > 380 ? [0.6, 0.84] : [0.7];
      slots.forEach((q, j) => {
        let n; do { n = GN[(r() * GN.length) | 0]; } while (n === 'water' || n === 'scarab' || n === 'ankh' || n === 'eye' || n === 'reed');
        out.push({ n, x: DISK[0] + Math.cos(a) * ray.len * q, y: DISK[1] + Math.sin(a) * ray.len * q, s: 0.72 + r() * 0.22, col: GL[n].cols[(r() * GL[n].cols.length) | 0], ph: r() * 2, at: ray.at + 0.12 + j * 0.3 + r() * 0.2 });
      });
    });
    return out;
  })();

  // ---------------- 计数器：3.15 起 1.5B → 175B → 540B → 1T+（6.45 过 1e12＝唯一重音） ----------------
  const FR = [770, 688, 1150, 782];
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

  // ---------------- 镜头：拍一缓推 1.0→1.10，拍二缓拉回 1.10→1.0，拍三停 ----------------
  const camS = (t) => t < 2.6 ? 1.0 + 0.10 * ss(0, 2.6, t) : t < 3.0 ? 1.10 : t < 7.0 ? 1.10 - 0.10 * ss(3.0, 7.0, t) : 1.0;

  // ---------------- 小手（阿顿光线末端，照配方卡 handAt） ----------------
  function handAt(g, x, y, ang, open, col) {
    g.save(); g.translate(x, y); g.rotate(ang);
    g.scale(1.35, 1.35); g.scale(0.9 + 0.3 * open, 0.9 + 0.3 * open);
    g.lineCap = 'round';
    for (let k = 0; k < 4; k++) { const a = (k - 1.5) * (0.03 + open * 0.42); g.beginPath(); g.moveTo(Math.cos(a) * 5, Math.sin(a) * 5); g.lineTo(Math.cos(a) * (12.5 + open * 1.5), Math.sin(a) * (12.5 + open * 1.5)); g.strokeStyle = '#5a1c10'; g.lineWidth = 5.6; g.stroke(); g.strokeStyle = col; g.lineWidth = 3.4; g.stroke(); }
    g.beginPath(); g.moveTo(1, -5); g.lineTo(5, -10 - open * 3); g.strokeStyle = '#5a1c10'; g.lineWidth = 5.4; g.stroke(); g.strokeStyle = col; g.lineWidth = 3.2; g.stroke();
    g.beginPath(); g.ellipse(0, 0, 8, 6.6, 0, 0, 7); g.fillStyle = col; g.fill(); g.strokeStyle = '#5a1c10'; g.lineWidth = 1.2; g.stroke();
    g.beginPath(); g.moveTo(-9, 0); g.lineTo(-14, 0); g.strokeStyle = col; g.lineWidth = 4; g.stroke();
    g.restore();
  }

  // ---------------- 圣甲虫 ×2：底部深蓝带推日球循环（全程）＋拍一爬过符号脚下 ----------------
  function scarabRoll(g, lt, t) {
    let x = 800 + 642 * (lt - 0.394); x = ((x + 120) % 2160 + 2160) % 2160 - 120;
    const y = 1044, bx = x + 54, br = 23, rot = bx / br, pose = Math.floor(lt * 15) % 2;
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    g.translate(x + 27, y); g.scale(1.22, 1.22); g.translate(-x - 27, -y);
    g.beginPath(); g.arc(bx, y - 2, br, 0, 7); g.fillStyle = '#c8302a'; g.fill(); g.strokeStyle = '#3a0c08'; g.lineWidth = 2.2; g.stroke();
    g.save(); g.beginPath(); g.arc(bx, y - 2, br, 0, 7); g.clip(); g.fillStyle = '#f2c23a';
    for (let k = 0; k < 9; k++) { const a = rot + k * 0.698, rr = k % 3 === 0 ? 0 : 14; if (k % 3 === 0 && k) continue; g.beginPath(); g.arc(bx + Math.cos(a) * rr, y - 2 + Math.sin(a) * rr * 0.9, 3.6, 0, 7); g.fill(); }
    g.restore();
    g.strokeStyle = '#141a30'; g.lineWidth = 3;
    const legs = pose ? [[-14, -16, -26], [0, -18, -6], [14, -14, 18]] : [[-14, -14, -32], [0, -19, 2], [14, -18, 24]];
    legs.forEach(([lx, ly, ex], i) => { for (const s of [-1, 1]) { const q = s * (i === 1 ? 1 : (pose ? 1 : -1)); g.beginPath(); g.moveTo(x + lx, y); g.lineTo(x + lx + (ex - lx) * 0.5, y + s * (ly - 4)); g.lineTo(x + ex + q * 2, y + s * (ly + 4)); g.stroke(); } });
    g.beginPath(); g.moveTo(x + 26, y - 4); g.lineTo(bx - br + 2, y - 12 + pose * 3); g.moveTo(x + 26, y + 4); g.lineTo(bx - br + 1, y + 8 - pose * 3); g.stroke();
    g.beginPath(); g.ellipse(x - 4, y, 24, 17, 0, 0, 7); g.fillStyle = C.lapis; g.fill(); g.strokeStyle = '#0d1430'; g.lineWidth = 2.2; g.stroke();
    g.beginPath(); g.moveTo(x - 28, y); g.lineTo(x + 18, y); g.stroke();
    g.fillStyle = C.turq; g.beginPath(); g.ellipse(x - 8, y - 8, 12, 4, -0.1, 0, 7); g.fill(); g.beginPath(); g.ellipse(x - 8, y + 8, 12, 4, 0.1, 0, 7); g.fill();
    g.beginPath(); g.ellipse(x + 22, y, 8, 11, 0, 0, 7); g.fillStyle = '#3a68c4'; g.fill(); g.strokeStyle = '#0d1430'; g.stroke();
    g.fillStyle = C.gold; g.beginPath(); g.arc(x + 25, y, 3, 0, 7); g.fill();
    g.restore();
  }
  function scarabWalk(g, lt, t) {
    if (lt > 3.06) return;
    const a = 1 - ss(2.82, 3.06, lt), x = 360 + 410 * lt, y = 738, pose = Math.floor(t * 15) % 2;
    g.save(); g.globalAlpha = a; g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = 'rgba(154,43,34,.22)'; g.lineWidth = 3; g.setLineDash([10, 8]); g.beginPath(); g.moveTo(x - 96, y + 28); g.lineTo(x + 96, y + 28); g.stroke(); g.setLineDash([]);
    g.translate(x, y); g.scale(1.06, 1.06);
    g.strokeStyle = '#141a30'; g.lineWidth = 3;
    const legs = pose ? [[-14, -16, -26], [0, -18, -6], [14, -14, 18]] : [[-14, -14, -32], [0, -19, 2], [14, -18, 24]];
    legs.forEach(([lx, ly, ex], i) => { for (const s of [-1, 1]) { const q = s * (i === 1 ? 1 : (pose ? 1 : -1)); g.beginPath(); g.moveTo(lx, 0); g.lineTo(lx + (ex - lx) * 0.5, s * (ly - 4)); g.lineTo(ex + q * 2, s * (ly + 4)); g.stroke(); } });
    g.beginPath(); g.ellipse(0, 0, 26, 18, 0, 0, 7); g.fillStyle = C.lapis; g.fill(); g.strokeStyle = '#0d1430'; g.lineWidth = 2.4; g.stroke();
    g.beginPath(); g.moveTo(-30, 0); g.lineTo(20, 0); g.stroke();
    g.fillStyle = C.turq; g.beginPath(); g.ellipse(-8, -8, 13, 4.5, -0.1, 0, 7); g.fill(); g.beginPath(); g.ellipse(-8, 8, 13, 4.5, 0.1, 0, 7); g.fill();
    g.beginPath(); g.arc(28, -2, 7.5, 0, 7); g.fillStyle = '#3a68c4'; g.fill(); g.strokeStyle = '#0d1430'; g.lineWidth = 2; g.stroke();
    g.fillStyle = C.gold; g.beginPath(); g.moveTo(33, -2); g.quadraticCurveTo(44, -6, 47, -2); g.quadraticCurveTo(44, 2, 33, 2); g.closePath(); g.fill();
    g.restore();
  }

  // ---------------- 屏上字（右上；拍一王名圈，拍二/三底刻线；浮雕棱＝刻痕下缘亮线） ----------------
  const TT = [['参数', 0], ['疯狂卷参数', 3], ['参数之外', 7]];
  function titleDraw(g, lt, t) {
    for (let k = 0; k < 3; k++) {
      const txt = TT[k][0], t0 = TT[k][1];
      const a = ss(t0 + 0.35, t0 + 0.95, lt) * (1 - ss(t0 + 3.0, t0 + 3.35, lt));
      if (a <= 0) continue;
      g.save(); g.globalAlpha = a; g.textBaseline = 'alphabetic'; g.lineJoin = 'round';
      if (k === 0) {   // 王名圈：椭圆＋底线
        g.strokeStyle = C.line; g.lineWidth = 3.2; g.beginPath(); g.ellipse(1638, 148, 84, 52, 0, 0, 7); g.stroke();
        g.beginPath(); g.moveTo(1592, 206); g.lineTo(1684, 206); g.stroke();
        g.font = '54px "LXGWWenKai-500"'; g.textAlign = 'center';
        g.fillStyle = 'rgba(246,242,232,.55)'; g.fillText(txt, 1639.8, 166.8);
        g.fillStyle = C.line; g.fillText(txt, 1638, 165);
      } else {
        g.font = '54px "LXGWWenKai-500"'; g.letterSpacing = '4px'; g.textAlign = 'right';
        g.fillStyle = 'rgba(246,242,232,.55)'; g.fillText(txt, 1846.8, 171.8);
        g.fillStyle = C.line; g.fillText(txt, 1845, 170);
        g.letterSpacing = '0px';
        const uq = ss(t0 + 0.5, t0 + 1.1, lt);
        if (uq > 0) { g.strokeStyle = C.rule; g.lineWidth = 3; g.beginPath(); g.moveTo(1848 - uq * 305, 194); g.lineTo(1848, 192); g.stroke(); }
      }
      g.restore();
    }
  }

  // ---------------- 拍三：三块铭文物（莎草纸卷/描金有翼太阳轮/圣油灯）＋彩条回弹 ----------------
  function scrollDraw(g, lt, t) {
    const q = ss(7.05, 7.6, lt); if (q <= 0) return;
    const oy = (1 - q) * 46, cx = 415, cy = 655 + oy, wq = 320 * ss(0.15, 0.92, q);
    g.save(); g.lineJoin = 'round'; g.lineCap = 'round'; g.globalAlpha = Math.min(1, q * 1.4);
    // 展开的纸面
    if (wq > 8) {
      g.fillStyle = C.cream; g.fillRect(cx - wq / 2, cy - 52, wq, 104);
      g.strokeStyle = C.line; g.lineWidth = 2.4; g.strokeRect(cx - wq / 2, cy - 52, wq, 104);
      g.strokeStyle = C.rule; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - wq / 2 + 5, cy - 40); g.lineTo(cx + wq / 2 - 5, cy - 40); g.moveTo(cx - wq / 2 + 5, cy + 40); g.lineTo(cx + wq / 2 - 5, cy + 40); g.stroke();
      const rows = [[-22, ['sun', 'lotus', 'water']], [2, ['water', 'ankh', 'jug']], [26, ['reed', 'water', 'shen']]];
      rows.forEach(([ry, ns], ri) => ns.forEach((n, i) => { const gx = cx - wq / 2 + 34 + i * Math.min(105, (wq - 60) / 3), gl = GL[n];
        drawGlyph(g, { n, x: gx, y: cy + ry, s: 0.3, col: ri === 1 ? C.blue : C.green, ph: 0 }, 0, 1, 0); }));
      // 红色系带＋封印
      g.strokeStyle = C.red; g.lineWidth = 4; g.beginPath(); g.moveTo(cx, cy - 56); g.lineTo(cx, cy + 56); g.stroke();
      g.beginPath(); g.arc(cx, cy, 9, 0, 7); g.fillStyle = C.red; g.fill(); g.strokeStyle = C.line; g.lineWidth = 1.6; g.stroke();
    }
    // 两根卷轴杆（暗金＋红端帽）
    [1, -1].forEach((s) => { const px = cx + s * (wq / 2 + 18);
      g.fillStyle = C.goldD; g.fillRect(px - 7, cy - 74, 14, 148); g.strokeStyle = C.line; g.lineWidth = 2.2; g.strokeRect(px - 7, cy - 74, 14, 148);
      g.fillStyle = C.red; g.fillRect(px - 9, cy - 82, 18, 10); g.fillRect(px - 9, cy + 72, 18, 10); g.strokeRect(px - 9, cy - 82, 18, 10); g.strokeRect(px - 9, cy + 72, 18, 10);
    });
    g.restore();
  }
  function wheelWings(g, lt, t) {
    const q = ss(7.45, 8.0, lt); if (q <= 0) return;
    const dy = -44 * q, cy = DISK[1] + dy, R = 80;
    g.save(); g.lineJoin = 'round';
    for (const s of [-1, 1]) {                                  // 左右各四层上扬阶梯羽（蓝），从盘缘展开
      for (let i = 0; i < 4; i++) {
        const wq = q * (1 - i * 0.12), L = (58 + i * 22) * wq, y0 = cy - 8 - i * 16, x0 = s * (R - 6), x1 = s * (R + L), y1 = y0 - 26 - i * 6;
        poly(g, [[x0, y0], [x1, y1], [x1, y1 + 9 + i], [x0, y0 + 14]]);
        g.fillStyle = i % 2 ? '#245098' : C.blue; g.fill(); g.strokeStyle = C.line; g.lineWidth = 2.2; g.stroke();
      }
      const gr = ss(8.2, 8.8, lt);                               // 描金上缘
      if (gr > 0) { g.strokeStyle = 'rgba(243,210,122,' + (gr * 0.8).toFixed(3) + ')'; g.lineWidth = 3; g.beginPath();
        g.moveTo(s * (R - 4), cy - 8); g.quadraticCurveTo(s * (R + 90 * q), cy - 52, s * (R + 128 * q), cy - 76); g.stroke(); }
    }
    g.restore();
  }
  function lampDraw(g, lt, t) {
    const q = ss(7.85, 8.4, lt); if (q <= 0) return;
    const oy = (1 - q) * 46, cx = 1505, cy = 672 + oy, pose = Math.floor(t * 60 / 6) % 2;
    g.save(); g.lineJoin = 'round'; g.lineCap = 'round'; g.globalAlpha = Math.min(1, q * 1.4);
    const gr = ss(8.5, 9.2, lt);                                 // 火苗描金光晕（点睛）
    const h = (pose ? 54 : 46) * (0.92 + 0.16 * (0.5 + 0.5 * Math.sin(t * 2.6)));
    const sw = Math.sin(t * 2.1) * 4;
    const fl = new Path2D();
    fl.moveTo(cx - 8, cy - 22); fl.quadraticCurveTo(cx - 12, cy - 22 - h * 0.5, cx + sw, cy - 22 - h);
    fl.quadraticCurveTo(cx + 12, cy - 22 - h * 0.5, cx + 8, cy - 22); fl.closePath();
    fs2(g, C.red, C.line, 2.2);
    const fl2 = new Path2D();
    fl2.moveTo(cx - 4, cy - 22); fl2.quadraticCurveTo(cx - 5, cy - 22 - h * 0.45, cx + sw * 0.6, cy - 22 - h * 0.62);
    fl2.quadraticCurveTo(cx + 5, cy - 22 - h * 0.4, cx + 4, cy - 22); fl2.closePath();
    fs2(g, C.yellow, null);
    if (gr > 0) { const gg = g.createRadialGradient(cx, cy - 40, 4, cx, cy - 40, 120);
      gg.addColorStop(0, 'rgba(255,200,90,' + (gr * (0.14 + 0.05 * Math.sin(t * 2.4))).toFixed(3) + ')'); gg.addColorStop(1, 'rgba(255,170,70,0)');
      g.globalCompositeOperation = 'lighter'; g.fillStyle = gg; g.fillRect(cx - 130, cy - 165, 260, 260); g.globalCompositeOperation = 'source-over'; }
    // 陶碗＋长嘴＋蓝沿纹＋圈足
    poly(g, [[cx - 66, cy - 18], [cx - 24, cy - 30], [cx - 96, cy - 58], [cx - 104, cy - 50], [cx - 70, cy - 20]]);
    fs2(g, C.terra, C.line, 2.2);
    g.beginPath(); g.moveTo(cx - 66, cy - 18); g.quadraticCurveTo(cx - 8, cy + 26, cx + 62, cy - 16); g.quadraticCurveTo(cx + 8, cy - 46, cx - 66, cy - 18);
    fs2(g, C.terra, C.line, 2.4);
    g.strokeStyle = C.blue; g.lineWidth = 3.4; g.beginPath(); g.moveTo(cx - 60, cy - 12); g.quadraticCurveTo(cx - 6, cy + 14, cx + 56, cy - 12); g.stroke();
    poly(g, [[cx - 26, cy + 8], [cx + 26, cy + 8], [cx + 16, cy + 30], [cx - 16, cy + 30]]); fs2(g, C.goldD, C.line, 2.2);
    g.restore();
  }
  const RIB = [[415, 458, 152, 0], [960, 106, 116, 1], [1505, 458, 152, 3]];   // 挂毯彩条：红/蓝/绿（两侧长、中间短）
  function ribbonsDraw(g, lt, t) {
    if (lt < 9.3) return;
    const q = ss(9.3, 9.78, lt), eb = U.ease.outBack(q);
    g.save(); g.lineJoin = 'round';
    RIB.forEach(([x, top, len, ci]) => {
      const y = lerp(-len - 40, top, eb), seg = len / 3;
      for (let k = 0; k < 3; k++) { g.fillStyle = BAND[(ci + k) % 4]; g.fillRect(x - 12, y + k * seg + 2, 24, seg - 5); g.strokeStyle = C.black; g.lineWidth = 1.6; g.strokeRect(x - 12, y + k * seg + 2, 24, seg - 5); }
      g.fillStyle = C.gold; g.fillRect(x - 14, y - 8, 28, 9); g.strokeStyle = C.line; g.lineWidth = 2; g.strokeRect(x - 14, y - 8, 28, 9);
      g.strokeStyle = C.line; g.lineWidth = 2; g.strokeRect(x - 12.5, y, 25, len);
    });
    g.restore();
  }

  // ---------------- 主体绘制 ----------------
  function glyphReveal(g, q, lt) {          // 凿出（dash 揭示）＋金辉回落；rv>=1 常态
    const rv = ss(q.at, q.at + 0.36, lt);
    if (rv <= 0) return 0;
    drawGlyph(g, q, 0, rv, rv < 1 ? 1 - rv : 0);
    return rv;
  }
  function colGlyphs(g, lt, t) {            // 背景铭文栏（水纹字 12fps 步进流动）
    const wp = Math.floor(lt * 12) * 0.5;
    GLYPHS.forEach((q) => {
      const a = q.at < 0 ? 1 : ss(q.at, q.at + 0.3, lt);
      if (a <= 0) return;
      g.save(); g.globalAlpha = 0.88 * a;
      if (GL[q.n].water) drawGlyph(g, q, wp + q.ph);
      else drawGlyph(g, q);
      g.restore();
    });
  }
  function netDraw(g, lt, t) {              // 阿顿日盘＋光线＋小手＋网络符号（拍三描金收稳）
    if (lt < 3.15) return;
    const g0 = 0.2 + 0.8 * ss(3.15, 3.55, lt), dy = -44 * ss(7.45, 8.0, lt), cx = DISK[0], cy = DISK[1] + dy, R = 80;
    const au = ss(8.6, 9.4, lt);            // 光线转金、小手收敛
    const rayCol = P.rgb(P.mix(P.hex(C.ray), P.hex(C.gold), au));
    const handCol = P.rgb(P.mix(P.hex(C.hand), P.hex(C.goldD), au));
    const open = (k, ph) => { const amp = lerp(0.5, 0.24, ss(8.3, 9.0, lt)), prd = lerp(0.4, 0.8, ss(8.3, 9.0, lt)); return 0.5 + amp * Math.sin(lt * Math.PI * 2 / prd + ph * 0.9); };
    const pu = 0.5 + 0.5 * Math.sin(lt * Math.PI * 2 / 0.45);      // 日盘脉动光晕
    g.save(); g.lineCap = 'round';
    const hg = g.createRadialGradient(cx, cy, R * g0, cx, cy, R + 60 + 34 * pu);
    hg.addColorStop(0, 'rgba(255,190,90,' + (0.30 * pu + 0.08).toFixed(3) + ')'); hg.addColorStop(1, 'rgba(255,170,70,0)');
    g.fillStyle = hg; g.beginPath(); g.arc(cx, cy, R + 100 + 34 * pu, 0, 7); g.fill();
    // 光线（先长伸到位、扇形波动、微颤）
    ALLR.forEach((ray) => {
      const rq = ss(ray.at, ray.at + 0.55, lt); if (rq <= 0) return;
      const ext = 1 + 0.09 * Math.sin(lt * Math.PI * 2 / 0.45 - ray.k * 0.55);
      const a = ray.a * D2R, wob = Math.sin(t * 7 + ray.k * 1.3) * 3;
      const ex = cx + Math.cos(a) * ray.len * rq * ext + wob, ey = cy + Math.sin(a) * ray.len * rq * ext + Math.cos(t * 6 + ray.k) * 2;
      const ang = Math.atan2(ey - cy, ex - cx);
      g.strokeStyle = rayCol; g.lineWidth = ray.main ? 3 : 2.4;
      g.beginPath(); g.moveTo(cx + Math.cos(ang) * R * g0, cy + Math.sin(ang) * R * g0); g.lineTo(ex - Math.cos(ang) * 6, ey - Math.sin(ang) * 6); g.stroke();
      handAt(g, ex, ey, ang, open(ray.k, ray.k), handCol);
    });
    // 网络符号（逐颗凿出；拍三描金点睛圈）
    const ring = ss(8.2, 8.8, lt);
    RSY.forEach((q) => {
      const rv = glyphReveal(g, q, lt); if (rv <= 0) return;
      if (ring > 0) { g.save(); g.globalAlpha = ring * (0.5 + 0.22 * Math.sin(t * 2.6 + q.ph)); g.strokeStyle = C.goldL; g.lineWidth = 2.4;
        g.beginPath(); g.arc(q.x, q.y, 30 * q.s, 0, 7); g.stroke(); g.restore(); }
    });
    // 日盘本体（红盘＋圣蛇曲线＋金圈）
    g.beginPath(); g.arc(cx, cy, R * g0, 0, 7); g.fillStyle = C.sun; g.fill(); g.lineWidth = 3; g.strokeStyle = '#7a1c14'; g.stroke();
    g.strokeStyle = C.gold; g.lineWidth = 4.4; g.beginPath(); g.moveTo(cx, cy - R * g0 + 10); g.quadraticCurveTo(cx + 12 * g0, cy, cx, cy + R * g0 - 10); g.stroke();
    g.fillStyle = C.gold; g.beginPath(); g.ellipse(cx, cy + 26 * g0, 6, 9, 0, 0, 7); g.fill(); g.strokeStyle = C.black; g.lineWidth = 1.6; g.stroke();
    const gild = ss(8.2, 8.8, lt);
    if (gild > 0) { g.strokeStyle = 'rgba(243,210,122,' + (gild * 0.9).toFixed(3) + ')'; g.lineWidth = 5; g.beginPath(); g.arc(cx, cy, R + 7, 0, 7); g.stroke(); }
    g.restore();
    return { cx, cy };
  }
  function featDraw(g, lt, t) {             // 三特写符号：凿出端详＋金晕呼吸＋账目小数墨色明暗
    const ring = ss(8.2, 8.8, lt);
    FEAT.forEach((f) => {
      const rv = ss(f.at, f.at + 0.4, lt); if (rv <= 0) return;
      drawGlyph(g, f, 0, rv, rv < 1 ? 1 - rv : 0);
      if (rv >= 1) {   // 金晕呼吸（壁画感的暖光）
        const ga = clamp((0.10 + 0.07 * (0.5 + 0.5 * Math.sin(t * 1.8 + f.ph))) * (1 + 0.9 * ring), 0, 0.34);
        const fg = g.createRadialGradient(f.x, f.y, 8, f.x, f.y, 88);
        fg.addColorStop(0, 'rgba(255,196,100,' + ga.toFixed(3) + ')'); fg.addColorStop(1, 'rgba(255,170,80,0)');
        g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = fg; g.fillRect(f.x - 92, f.y - 92, 184, 184); g.restore();
      }
      if (ring > 0 && rv >= 1) { g.save(); g.globalAlpha = ring * (0.5 + 0.22 * Math.sin(t * 2.6 + f.ph)); g.strokeStyle = C.goldL; g.lineWidth = 2.6;
        g.beginPath(); g.ellipse(f.x, f.y, 42, 46, 0, 0, 7); g.stroke(); g.restore(); }
      // 账目小数（纸莎草刻痕体；墨色忽浓忽淡）
      const na = ss(f.at + 0.18, f.at + 0.55, lt); if (na <= 0) return;
      const ink = P.rgb(P.mix(P.hex(C.rule), P.hex(C.red), 0.5 + 0.5 * Math.sin(t * 1.6 + f.ph)));
      g.save(); g.globalAlpha = na; g.font = '36px "Kalam-700"'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      g.fillStyle = 'rgba(246,242,232,.5)'; g.fillText(f.num, f.x + 1.6, f.y + 96.6);
      g.fillStyle = ink; g.fillText(f.num, f.x, f.y + 95);
      g.strokeStyle = 'rgba(90,60,40,.55)'; g.lineWidth = 2.2; g.lineCap = 'round';
      g.beginPath(); g.moveTo(f.x - 44, f.y + 112); g.lineTo(f.x - 16, f.y + 115); g.moveTo(f.x + 18, f.y + 111); g.lineTo(f.x + 46, f.y + 114); g.stroke();
      g.restore();
    });
  }
  function counterDraw(g, lt, t) {          // 石碑铭文计数框：框四边依次凿出、数字滚动、1T+ 金色＋轻 pop
    const gate = ss(3.15, 3.4, lt) * (1 - ss(7.0, 7.45, lt));
    if (gate <= 0) return;
    g.save(); g.lineCap = 'round';
    g.globalAlpha = gate * 0.6; g.fillStyle = C.cream; g.fillRect(FR[0], FR[1], FR[2] - FR[0], FR[3] - FR[1]); g.globalAlpha = gate;
    const corners = [[FR[0], FR[1]], [FR[2], FR[1]], [FR[2], FR[3]], [FR[0], FR[3]], [FR[0], FR[1]]];
    const fp = new Path2D(); const done = Math.min(4, ss(3.15, 3.55, lt) * 4);
    for (let i = 0; i < 4; i++) { const q = clamp(done - i, 0, 1); if (q <= 0) break;
      const a = corners[i], b = corners[i + 1]; fp.moveTo(a[0], a[1]); fp.lineTo(lerp(a[0], b[0], q), lerp(a[1], b[1], q)); }
    g.strokeStyle = C.rule; g.lineWidth = 3.5; g.stroke(fp);
    drawGlyph(g, { n: 'scarab', x: 828, y: 734, s: 0.62, col: C.blue }, 0, 1, 0);   // 框内圣甲虫印记
    const v = counterVal(lt);
    if (v !== null) {
      const txt = counterTxt(v), big = v >= 1e12;
      const pop = big ? 1 + 0.13 * ss(6.42, 6.56, lt) * (1 - ss(6.72, 7.15, lt)) : 1;
      g.translate(986, 752); g.scale(pop, pop);
      g.font = '64px "Kalam-700"'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      const shine = big ? ss(6.42, 6.6, lt) : 0;
      g.fillStyle = 'rgba(246,242,232,.45)'; g.fillText(txt, 1.8, 1.8);
      g.fillStyle = shine > 0 ? P.rgb(P.mix(P.hex(C.line), P.hex(C.gold), 0.25 + 0.75 * shine)) : C.line;
      if (shine > 0) { g.shadowColor = 'rgba(246,200,70,' + (0.8 * shine).toFixed(3) + ')'; g.shadowBlur = 14 * shine; }
      g.fillText(txt, 0, 0);
    }
    g.restore();
  }
  function surgeDraw(g, lt, t) {            // 1T+ 揭示：日盘光晕涌起一次（唯一重音，ss 平滑）
    const s0 = 0.28 * ss(6.42, 6.9, lt) * (1 - ss(6.95, 7.55, lt));
    if (s0 <= 0.004) return;
    const cx = DISK[0], cy = DISK[1];
    const gg = g.createRadialGradient(cx, cy, 70, cx, cy, 640);
    gg.addColorStop(0, 'rgba(255,206,110,' + s0.toFixed(3) + ')'); gg.addColorStop(0.5, 'rgba(255,180,90,' + (s0 * 0.45).toFixed(3) + ')'); gg.addColorStop(1, 'rgba(255,170,70,0)');
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = gg; g.fillRect(0, 0, W, H); g.restore();
  }

  return {
    init() {
      U.assertGlyphs('LXGWWenKai-500', '参数疯狂卷之外', 's02_egypt 屏上字');
      U.assertGlyphs('Kalam-700', '0123456789.BT+-', 's02_egypt 账目数字');
      bg(); surface(); specks();                            // 冷缓存在引擎 boot（init 后、首帧前）
    },
    draw(c, lt, t) {
      const s = camS(lt);
      c.save();
      c.translate(960, 540); c.scale(s, s); c.translate(-960, -540);
      c.drawImage(bg(), 0, 0);
      // 拍二：墙面随密度渐暗（矿土棕罩），拍三退净——「背景随密度升级」
      const dark = 0.15 * ss(3.2, 6.4, lt) * (1 - ss(6.9, 7.7, lt));
      if (dark > 0.003) { c.fillStyle = 'rgba(46,26,10,' + dark.toFixed(3) + ')'; c.fillRect(0, 0, W, H); }
      colGlyphs(c, lt, t);
      counterDraw(c, lt, t);
      netDraw(c, lt, t);
      featDraw(c, lt, t);
      scarabWalk(c, lt, t);
      // 拍三：三物升起归位（先翼后轮盘在网络层内，这里补纸卷/油灯/彩条）
      scrollDraw(c, lt, t);
      lampDraw(c, lt, t);
      ribbonsDraw(c, lt, t);
      titleDraw(c, lt, t);
      scarabRoll(c, lt, t);
      surgeDraw(c, lt, t);                                    // 重音画在表面之下、描金之上
      // 壁画表面：斑驳 multiply＋颗粒（配方卡做法；裂纹已只画边缘）
      c.save(); c.globalCompositeOperation = 'multiply'; c.drawImage(surface(), 0, 0); c.restore();
      c.drawImage(specks(), 0, 0);
      c.restore();
    },
  };
})();
