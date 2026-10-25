// 「大模型参数」× 哥特泥金手抄本（s05_gothic）——一整页 1290 泥金手抄本，35 风格横向对比样片之一。
// 构图为「参数」题材重设计（不搬速通片房间）：参数＝嵌在泥金首字母框上的金箔点，卷参数＝藤蔓页边饰
// 从首字母两角双向蔓延成整页金网＋行间朱红小注计数，参数之外＝三枚泥金徽章（福音书＝数据、玫瑰窗＝方法、
// 圣油灯＝算力）升起归位，一圈金光自外向内收束把金球描金点亮（变多→变亮变精）。
// 管线：①静态层两组缓存——UNDER（羊皮纸＋做旧＋行线）、MAIN（红蓝菱格块页边带＋金角＋泥金首字母 P：
//   逐像素金箔（大尺度斑驳＋横向拉丝＋左上受光）＋菱格压花（暗线＋错 1.2px 亮线）＋蓝地金字）；
// ②金箔掩膜 MASK＝按「金色度」逐像素分类（凡金自动被斜向高光扫到）；③动态层＝页边藤蔓（种子生成＋
//   摆动＋三瓣常春藤＋带须金球）、贴页计数栏（朱红小注逐行写出＋对数连续滚动）、徽章、蜗牛老鼠母题；
// ④金光：拍一匀速斜扫、1T+ 处反向快扫＋全金网脉冲（唯一重音）、拍三径向收束波。
// 运镜：纯缩放 z 1.0→1.20→1.0（中心固定 960,540），近景端详→缓拉看整页→停住收全貌；无快推无砸入。
// 确定性：随机全用 U.rng/U.hash 种子；金箔/羊皮纸逐像素层全部 PAINT.cached 一次烘好；每帧无逐像素操作。
// 硬红线：无角色无脸；做旧（斑驳、暗角、污渍）只上背景层；所有字 y≤852。
SCENES['s05_gothic'] = (() => {
  const W = 1920, H = 1080, TAU = Math.PI * 2;
  const { clamp, lerp, ss, ease, rng, hash } = U, P = PAINT;
  const INK = '#2b1a12';
  const C = {
    parch: '#ecdfc0', parchDk: '#c9ae80', gold: '#d9a63a', goldHi: '#f8de86', goldLo: '#9c6a1a',
    red: '#c3262e', redDk: '#7e1318', blue: '#24449e', blueDk: '#142a6a', pink: '#e7a3aa',
    white: '#f8f2e2', wood: '#8a5a2c', woodDk: '#5a3818', goldRef: '#eac564',
  };
  const R_ = (seed) => U.rng(seed);
  const dot = (c, x, y, r, fill, line, lw) => { c.beginPath(); c.arc(x, y, r, 0, TAU); if (fill) { c.fillStyle = fill; c.fill(); } if (line) { c.strokeStyle = line; c.lineWidth = lw || 1.5; c.stroke(); } };
  const F = (c, p, fill, line, lw) => { if (fill) { c.fillStyle = fill; c.fill(p); } if (line) { c.strokeStyle = line || INK; c.lineWidth = lw || 3; c.stroke(p); } };

  // ---------- 页面几何（世界坐标） ----------
  const BOX = { x0: 300, y0: 350, x1: 760, y1: 850 };            // 首字母盒
  const SLIP = { x0: 1485, y0: 320, x1: 1655, y1: 852 };         // 计数贴页
  const MED = [{ x: 855, y: 645 }, { x: 1135, y: 645 }, { x: 1355, y: 645 }];   // 三徽章（书/窗/灯）
  const LEAFCOL = [C.blue, C.red, C.gold];

  // ---------- 逐像素金箔（只在首字母盒区域内，拉丝＋斑驳＋左上受光＋颗粒；照原实现公式） ----------
  const goldTex = () => P.cached('s05_gold', BOX.x1 - BOX.x0, BOX.y1 - BOX.y0, (g) => {
    const w = BOX.x1 - BOX.x0, h = BOX.y1 - BOX.y0, r = R_(5);
    const img = g.createImageData(w, h), d = img.data;
    const lo = P.hex(C.goldLo), mid = P.hex(C.gold), hi = P.hex(C.goldHi);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const big = P.fbm(x * 0.0035, y * 0.0035 + 7, 3);
      const brush = P.noise(x * 0.004, y * 0.09) * 0.5 + P.noise(x * 0.012, y * 0.25) * 0.3;   // 横向打磨拉丝
      const light = 0.18 - x / w * 0.12 - y / h * 0.16;
      let f = clamp(0.52 + big * 0.42 + brush * 0.22 + light + (r() - .5) * 0.10);
      const c0 = f < 0.5 ? P.mix(lo, mid, f * 2) : P.mix(mid, hi, (f - 0.5) * 2);
      const i = (y * w + x) * 4; d[i] = c0[0]; d[i + 1] = c0[1]; d[i + 2] = c0[2]; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  });

  // 菱格压花：暗线＋错 1.2px 亮线＝刻进金里；菱心四点压印；每 118×125px 金箔接缝
  function lattice(g, x0, y0, x1, y1, s) {
    g.save(); g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); g.clip();
    g.drawImage(goldTex(), BOX.x0, BOX.y0);
    g.lineWidth = 1.6;
    for (let k = -40; k < 90; k++) { const u = k * s; g.strokeStyle = 'rgba(255,240,180,.5)'; g.beginPath(); g.moveTo(u - x1 + 1.2, y1 + 1.2); g.lineTo(u + x1 + 1.2, -y1 + 1.2); g.moveTo(u - x1 + 1.2, -y1 + 1.2); g.lineTo(u + x1 + 1.2, y1 + 1.2); g.stroke();
      g.strokeStyle = 'rgba(110,66,10,.5)'; g.beginPath(); g.moveTo(u - x1, y1); g.lineTo(u + x1, -y1); g.moveTo(u - x1, -y1); g.lineTo(u + x1, y1); g.stroke(); }
    for (let a = 0; a < 60; a++) for (let b = -40; b < 40; b++) {
      const u = (a + 0.5) * s, v = (b + 0.5) * s, x = (u + v) / 2, y = (u - v) / 2;
      if (x < x0 + 4 || x > x1 - 4 || y < y0 + 4 || y > y1 - 4) continue;
      for (const q of [[-5, 0], [5, 0], [0, -5], [0, 5]]) {
        g.fillStyle = 'rgba(255,245,200,.65)'; g.beginPath(); g.arc(x + q[0] - .6, y + q[1] - .6, 1.8, 0, 7); g.fill();
        g.fillStyle = 'rgba(120,70,10,.5)'; g.beginPath(); g.arc(x + q[0] + .7, y + q[1] + .7, 1.4, 0, 7); g.fill();
      }
    }
    g.strokeStyle = 'rgba(120,75,15,.16)'; g.lineWidth = 1;
    for (let x = x0 + 118; x < x1; x += 118) { g.beginPath(); g.moveTo(x, y0); g.lineTo(x + 3, y1); g.stroke(); }
    for (let y = y0 + 125; y < y1; y += 125) { g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y + 2); g.stroke(); }
    g.restore();
  }

  // ---------- UNDER：羊皮纸＋做旧（只上背景）＋行线 ----------
  const UNDER = () => P.cached('s05_under', W, H, (g) => {
    g.drawImage(P.texture('s05_parch', C.parch, { scale: 0.0028, amt: 20, grain: 9, dark: C.parchDk, seed: 3 }), 0, 0);
    const vg = g.createRadialGradient(W / 2, H / 2, 380, W / 2, H / 2, 1150);
    vg.addColorStop(0, 'rgba(120,80,30,0)'); vg.addColorStop(1, 'rgba(110,70,25,.5)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
    const r = R_(21);                                   // 污渍斑（做旧，只背景）
    for (let i = 0; i < 7; i++) { g.fillStyle = `rgba(112,72,28,${0.04 + r() * 0.05})`; g.beginPath(); g.ellipse(r() * W, r() * H, 70 + r() * 150, 45 + r() * 95, r() * 3, 0, TAU); g.fill(); }
    for (let i = 0; i < 26; i++) { dot(g, 240 + r() * 1440, 340 + r() * 540, 1 + r() * 1.6, 'rgba(70,45,20,.28)', null); }   // 墨点小污
    g.strokeStyle = 'rgba(150,110,70,.28)'; g.lineWidth = 1.2;   // 行线（正文栏格线）
    for (let k = 0; k < 7; k++) { const y = 390 + k * 70; g.beginPath(); g.moveTo(300, y); g.lineTo(1445, y); g.stroke(); }
  });

  // ---------- MAIN：红蓝菱格块页边带＋金角＋泥金首字母 P ----------
  const STUDS = [];                                    // 首字母笔画上的小金球（世界坐标，构建时测字形框得出）
  const MAIN = () => P.cached('s05_main', W, H, (g) => {
    const cols = [C.red, C.blue, C.pink, C.blue];
    // 左右竖带：红蓝粉蓝方块＋白点
    for (const x0 of [130, 1732]) for (let y = 179, k = 0; y < 921; y += 34, k++) {
      g.fillStyle = cols[k % 4]; g.fillRect(x0, y, 58, 34); g.strokeStyle = INK; g.lineWidth = 2; g.strokeRect(x0, y, 58, 34); dot(g, x0 + 29, y + 17, 4, '#fff', null);
    }
    // 上下横带：红蓝相间＋白波浪（照原版下边框画法）
    for (const y0 of [115, 927]) for (let x = 188, k = 0; x < 1732; x += 52, k++) {
      const w = Math.min(52, 1732 - x); g.fillStyle = k % 2 ? C.blue : C.red; g.fillRect(x, y0, w, 58);
      g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath();
      for (let s = 0; s <= w - 10; s += 2) { const yy = y0 + 29 + Math.sin(s / (w - 10) * TAU) * 5; s ? g.lineTo(x + 5 + s, yy) : g.moveTo(x + 5, yy); } g.stroke();
      g.strokeStyle = INK; g.lineWidth = 2; g.strokeRect(x, y0, w, 58);
    }
    // 四角金方（金箔＋压花＋白点）
    for (const [x, y] of [[118, 103], [1730, 103], [118, 913], [1730, 913]]) {
      lattice(g, x, y, x + 72, y + 72, 34);
      g.strokeStyle = INK; g.lineWidth = 3; g.strokeRect(x, y, 72, 72);
      dot(g, x + 36, y + 36, 4.5, '#fff', null);
    }
    // ----- 泥金首字母 P -----
    g.save(); g.shadowColor = 'rgba(60,30,0,.3)'; g.shadowOffsetX = 4; g.shadowOffsetY = 4; g.fillStyle = C.gold; g.fillRect(BOX.x0, BOX.y0, BOX.x1 - BOX.x0, BOX.y1 - BOX.y0); g.restore();
    lattice(g, BOX.x0, BOX.y0, BOX.x1, BOX.y1, 46);                                     // 金框整体贴金＋压花
    g.fillStyle = C.blue; g.fillRect(BOX.x0 + 26, BOX.y0 + 26, 408, 448);               // 蓝地
    g.strokeStyle = INK; g.lineWidth = 3; g.strokeRect(BOX.x0, BOX.y0, BOX.x1 - BOX.x0, BOX.y1 - BOX.y0);
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1.6; g.strokeRect(BOX.x0 + 26, BOX.y0 + 26, 408, 448);
    for (let x = BOX.x0 + 34; x < BOX.x1 - 26; x += 28) { dot(g, x, BOX.y0 + 13, 2.6, '#fff', null); dot(g, x + 6, BOX.y1 - 13, 2.6, '#fff', null); }
    for (let y = BOX.y0 + 40; y < BOX.y1 - 26; y += 28) { dot(g, BOX.x0 + 13, y, 2.6, '#fff', null); dot(g, BOX.x1 - 13, y + 6, 2.6, '#fff', null); }
    // 金字 P：source-atop 把金箔贴进字形
    const LG = P.cached('s05_letter', BOX.x1 - BOX.x0, BOX.y1 - BOX.y0, (lg) => {
      lg.font = '400px "UnifrakturMaguntia-400"'; lg.textAlign = 'center'; lg.textBaseline = 'alphabetic';
      lg.fillStyle = '#fff'; lg.fillText('P', 230, 440);
      lg.globalCompositeOperation = 'source-atop'; lg.drawImage(goldTex(), 0, 0); lg.globalCompositeOperation = 'source-over';
    });
    g.drawImage(LG, BOX.x0, BOX.y0);
    g.font = '400px "UnifrakturMaguntia-400"'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.lineWidth = 9; g.strokeStyle = INK; g.strokeText('P', 530, 790);
    g.save(); g.beginPath(); g.rect(BOX.x0 + 26, BOX.y0 + 26, 408, 200); g.clip();       // 字身上半贴白高光
    g.fillStyle = 'rgba(255,245,200,.30)'; g.fillText('P', 530, 790); g.restore();
    g.fillStyle = 'rgba(255,245,200,.28)'; g.font = '400px "UnifrakturMaguntia-400"';
    // 笔画上的小金球（参数本体的小号）：按字形实测框布点
    const m = g.measureText('P');
    const bx0 = 530 - m.actualBoundingBoxLeft, bx1 = 530 + m.actualBoundingBoxRight;
    const by0 = 790 - m.actualBoundingBoxAscent, by1 = 790 + m.actualBoundingBoxDescent;
    [[0.20, 0.38], [0.22, 0.74], [0.50, 0.16], [0.82, 0.34], [0.60, 0.52]].forEach((f, i) => {
      const x = bx0 + f[0] * (bx1 - bx0), y = by0 + f[1] * (by1 - by0);
      dot(g, x, y, 6.5 + (i % 3), C.gold, INK, 1.6); dot(g, x - 1.4, y - 1.4, 1.6, '#fff', null);
      STUDS.push({ x, y });
    });
  });

  // ---------- DIAPER / VIG：场内菱格底纹与暗角（动态 α 随密度升级） ----------
  const DIAPER = () => P.cached('s05_diaper', W, H, (g) => {
    const s = 44;
    for (let a = -30; a < 60; a++) for (let b = -30; b < 30; b++) {
      const u = a * s, v = b * s, x = (u + v) / 2, y = (u - v) / 2;
      if (x < 295 || x > 1445 || y < 335 || y > 860) continue;
      const dm = U.poly([[x, y - s / 2], [x + s / 2, y], [x, y + s / 2], [x - s / 2, y]]);
      g.fillStyle = (a + b) % 2 ? C.pink : C.blueDk; g.fill(dm);
      if ((a + b) % 2 === 0) for (const q of [[-4, 0], [4, 0], [0, -4], [0, 4]]) dot(g, x + q[0], y + q[1], 1.7, 'rgba(255,255,255,.5)', null);
      else dot(g, x, y, 3.6, C.gold, null);
    }
  });
  const VIG = () => P.cached('s05_vig', W, H, (g) => {
    const vg = g.createRadialGradient(960, 540, 300, 960, 540, 1150);
    vg.addColorStop(0, 'rgba(90,55,20,0)'); vg.addColorStop(1, 'rgba(90,55,20,.85)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  });

  // ---------- 贴页（计数栏外壳，画在藤蔓之上） ----------
  const SLIPC = () => P.cached('s05_slip', W, H, (g) => {
    g.fillStyle = '#f1e6c9'; g.fillRect(SLIP.x0, SLIP.y0, SLIP.x1 - SLIP.x0, SLIP.y1 - SLIP.y0);
    g.strokeStyle = INK; g.lineWidth = 3; g.strokeRect(SLIP.x0, SLIP.y0, SLIP.x1 - SLIP.x0, SLIP.y1 - SLIP.y0);
    g.fillStyle = 'rgba(120,80,30,.12)'; g.beginPath(); g.moveTo(SLIP.x0, SLIP.y1); g.lineTo(SLIP.x0 + 70, SLIP.y1); g.lineTo(SLIP.x0, SLIP.y1 - 66); g.closePath(); g.fill();   // 折角
    dot(g, 1570, 344, 9, C.gold, INK, 1.8);                                            // 金印
    for (const q of [[-13, -6], [13, -6], [0, -14]]) dot(g, 1570 + q[0], 344 + q[1], 1.5, '#fff', null);
  });

  // ---------- MASK：金色度掩膜（斜向高光只落在金上；金色度公式照原实现） ----------
  const MASK = () => P.cached('s05_mask', W, H, (g) => {
    const s = P.scratch('s05_maskC'), q = s.getContext('2d');
    q.clearRect(0, 0, W, H); q.drawImage(UNDER(), 0, 0); q.drawImage(DIAPER(), 0, 0); q.drawImage(MAIN(), 0, 0); q.drawImage(SLIPC(), 0, 0);
    const d0 = q.getImageData(0, 0, W, H).data, img = g.createImageData(W, H), d = img.data;
    for (let i = 0; i < W * H * 4; i += 4) {
      const r = d0[i], gg = d0[i + 1], b = d0[i + 2];
      const k = clamp((r - b - 70) / 50) * clamp((gg - b - 30) / 40) * clamp((r - 140) / 40);
      d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = k * 255;
    }
    g.putImageData(img, 0, 0);
  });

  // ---------- 藤蔓链（种子生成：折线按弧长重采样＋低频摆动；逐点出生时刻预计算） ----------
  function buildChain(waypts, wob, seed, step) {
    const segs = []; let L = 0;
    for (let i = 1; i < waypts.length; i++) { const a = waypts[i - 1], b = waypts[i]; const len = Math.hypot(b[0] - a[0], b[1] - a[1]); segs.push([a, b, len, L]); L += len; }
    const pts = [];
    for (const [a, b, len, s0] of segs) {
      const n = Math.max(1, Math.ceil(len / (step || 9))), dx = (b[0] - a[0]) / len, dy = (b[1] - a[1]) / len, nx = -dy, ny = dx;
      for (let k = 0; k < n; k++) {
        const q = k / n, sCum = s0 + len * q, w = P.noise(sCum * 0.014, seed * 0.71) * wob;
        pts.push({ x: lerp(a[0], b[0], q) + nx * w, y: lerp(a[1], b[1], q) + ny * w, s: sCum, L });
      }
    }
    pts.push({ x: waypts[waypts.length - 1][0], y: waypts[waypts.length - 1][1], s: L, L });
    return pts;
  }

  // 页边整圈（从首字母左上角逆时针一整圈，右上角收尾；两端都长、在对侧会合）
  const RING = buildChain([[305, 342], [252, 325], [237, 358], [237, 868], [252, 893], [300, 908], [1640, 908], [1682, 893], [1697, 855], [1697, 262], [1688, 225], [1648, 203], [790, 203], [770, 240], [755, 300], [755, 342]], 11, 31, 9);
  {
    const split = RING.findIndex(p => p.x > 1600 && p.y < 215);                          // 顶廊右端（front A/B 分界）
    const sSplit = RING[split].s, L = RING[RING.length - 1].s;
    RING.forEach((p, i) => {
      p.birth = p.s <= sSplit ? 3.05 + (p.s / sSplit) * 2.45 : 3.05 + ((L - p.s) / (L - sSplit)) * 2.45;
      if ((p.x < 262 && p.y > 435 && p.y < 585) || (p.y > 886 && p.x > 535 && p.x < 725)) p.birth = -1;   // 拍一就在场的残段
      p.anch = clamp(Math.min(p.s, L - p.s, 130) / 130, 0.12, 1);
    });
  }
  // 内网：三横（自首字母右缘向右织出）＋三纵（自顶廊垂下）
  const HORZ = [430, 575, 720].map((y, row) => {
    const pts = buildChain([[765, y], [1000, y - 8], [1300, y + 8], [1690, y]], 9, 41 + row, 10);
    pts.forEach((p, i) => { p.birth = 4.5 + row * 0.12 + (i / pts.length) * 1.55; p.anch = clamp(i / 14, 0.1, 1); });
    return pts;
  });
  const VERT = [885, 1140, 1400].map((x, col) => {
    const pts = buildChain([[x, 340], [x + 8, 560], [x - 6, 862]], 9, 51 + col, 10);
    pts.forEach((p, i) => { p.birth = 5.1 + col * 0.1 + (i / pts.length) * 1.2; p.anch = clamp(i / 14, 0.1, 1); });
    return pts;
  });
  const ALLCHAINS = [RING].concat(HORZ, VERT);
  // 每条链上挂金球（参数）与三瓣常春藤叶
  ALLCHAINS.forEach((pts, ci) => pts.forEach((p, i) => {
    p.ph = hash(i, ci * 13 + 3) * TAU;
    if (i % 4 === 2 && hash(i, ci + 20) < 0.82 && i > 2 && i < pts.length - 3) p.ball = { r: 7.5 + hash(i, ci + 30) * 7 };
    if (i % 6 === 3 && hash(i, ci + 40) < 0.8) p.leaf = { side: (Math.floor(i / 6) % 2) ? 1 : -1, col: LEAFCOL[(i + ci) % 3], s: 1.0 + hash(i, ci + 50) * 0.45 };
    const dx = p.x - 960, dy = p.y - 545; p.dC = Math.hypot(dx, dy);
    p.gild = 8.55 + ((920 - p.dC) / 850) * 0.9;                                          // 收束波到达时刻（自外向内）
  }));

  // 三颗主参数（嵌在首字母金框上，各带朱红小注牌；底球放框左段，避开 P 的下伸 flourish，
  // 注牌挪到 P 字形外框（实测 x 358–700）左侧，且不与拍三徽章注牌（y 745–800）挤）
  const HEROES = [
    { x: 450, y: BOX.y0 + 13, num: '0.73', tag: [555, 376], ph: 0.0 },
    { x: 700, y: BOX.y0 + 13, num: '-1.2', tag: [808, 406], ph: 2.1 },
    { x: 360, y: BOX.y1 - 13, num: '2.4', tag: [270, 820], ph: 4.2 },
  ];
  HEROES.forEach(h => { h.dC = Math.hypot(h.x - 960, h.y - 545); h.gild = 8.55 + ((920 - h.dC) / 850) * 0.9; });

  // ---------- 计数（真实序列：四档对数连续滚动，行间朱红小注逐行写出） ----------
  const STAGES = [
    { t0: 3.75, t1: 4.15, v0: 0.12, v1: 1.5, final: '1.5B', y: 480, fl: 4.2 },
    { t0: 4.55, t1: 4.95, v0: 1.5, v1: 175, final: '175B', y: 566, fl: 5.0 },
    { t0: 5.35, t1: 5.75, v0: 175, v1: 540, final: '540B', y: 652, fl: 5.8 },
    { t0: 6.0, t1: 6.3, v0: 540, v1: 1000, final: '1T+', y: 738, fl: 6.35 },
  ];
  const rollV = (st, lt) => Math.exp(lerp(Math.log(st.v0), Math.log(st.v1), ss(st.t0, st.t1, lt)));
  const fmtV = (v) => v >= 999.5 ? '1T+' : ((v < 10 ? v.toFixed(1) : String(Math.round(v))) + 'B');

  // ---------- 相机：纯缩放，中心固定（z≥1 保证不出页；峰值 1.20 控制整页位移速率，qa 运动% 过线） ----------
  const camZ = (lt) => lt < 3 ? lerp(1.0, 1.20, ss(0, 3, lt)) : lt < 6.9 ? lerp(1.20, 1.0, ss(3, 6.9, lt)) : 1.0;

  // ---------- 斜向金光（掩膜限制，只落在金上；斜率 K=0.45，匀速） ----------
  const K_SLANT = 0.45;
  function goldSweep(c, xc, alpha) {
    if (alpha <= 0.02 || xc < 130 || xc > 1790) return;
    const bx = Math.round(xc - 460), bw = 920, s = P.scratch('s05Sweep'), g = s.getContext('2d');
    g.clearRect(0, 0, W, H); g.globalCompositeOperation = 'source-over';
    const gr = g.createLinearGradient(xc - 170, 540 - 170 * K_SLANT, xc + 170, 540 + 170 * K_SLANT);
    gr.addColorStop(0, 'rgba(255,240,190,0)'); gr.addColorStop(0.25, 'rgba(255,236,170,.32)'); gr.addColorStop(0.47, 'rgba(255,252,230,.85)');
    gr.addColorStop(0.53, 'rgba(255,252,230,.85)'); gr.addColorStop(0.75, 'rgba(255,236,170,.32)'); gr.addColorStop(1, 'rgba(255,240,190,0)');
    g.fillStyle = gr; g.fillRect(bx, 0, bw, H);
    g.globalCompositeOperation = 'destination-in'; g.drawImage(MASK(), bx, 0, bw, H, bx, 0, bw, H); g.globalCompositeOperation = 'source-over';
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = alpha; c.drawImage(s, bx, 0, bw, H, bx, 0, bw, H); c.restore();
  }
  const sweepX = (lt) => lt < 3.1 ? lerp(180, 1740, ss(0.5, 2.6, lt)) : (lt >= 6.35 && lt < 7.05 ? lerp(1740, 160, ss(6.35, 7.0, lt)) : 0);
  const nearSweep = (x, y, xc) => xc ? clamp(1 - Math.abs(x + K_SLANT * (y - 540) - xc) / 95) : 0;
  const glint = (c, x, y, s, a) => {
    if (s <= 0.02 || a <= 0.02) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = clamp(a, 0, 1); c.fillStyle = '#fff6d0';
    c.beginPath(); c.moveTo(x, y - 18 * s); c.quadraticCurveTo(x, y, x + 18 * s, y); c.quadraticCurveTo(x, y, x, y + 18 * s); c.quadraticCurveTo(x, y, x - 18 * s, y); c.quadraticCurveTo(x, y, x, y - 18 * s); c.fill();
    c.globalAlpha = clamp(a, 0, 1) * 0.5; c.beginPath(); c.arc(x, y, 6 * s, 0, 7); c.fill(); c.restore();
  };

  // ---------- 三瓣常春藤叶（照原实现） ----------
  function ivy(c, x, y, a, s, col) {
    c.save(); c.translate(x, y); c.rotate(a); c.scale(s, s);
    const p = new Path2D(); p.moveTo(0, 0); p.quadraticCurveTo(-10, -6, -14, -18); p.quadraticCurveTo(-6, -14, -2, -22); p.quadraticCurveTo(0, -30, 2, -22);
    p.quadraticCurveTo(6, -14, 14, -18); p.quadraticCurveTo(10, -6, 0, 0); p.closePath();
    c.fillStyle = col; c.fill(p); c.strokeStyle = INK; c.lineWidth = 1.6 / s; c.stroke(p); c.restore();
  }

  // ---------- 藤蔓＋金球＋叶（每帧：生长前沿＋摆动＋拍三描金） ----------
  function vines(c, lt, t, conv, swX, pu) {
    const waveR = lerp(920, 70, ss(8.55, 9.45, lt));
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    ALLCHAINS.forEach((pts) => {
      // 茎：相邻且都已出生的点连段（两臂会合前中段留空＝正在长）
      c.strokeStyle = '#3a2416'; c.lineWidth = 2.6; c.beginPath();
      let pen = false;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        if (p.birth > lt) { pen = false; continue; }
        const ax = Math.sin(t * 2.1 + p.ph) * 4.5 * p.anch * conv, ay = Math.cos(t * 1.7 + p.ph * 0.8) * 3.2 * p.anch * conv;
        const x = p.x + ax, y = p.y + ay;
        if (pen) c.lineTo(x, y); else { c.moveTo(x, y); pen = true; }
        p._x = x; p._y = y;
      }
      c.stroke();
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        if (p.birth > lt || !p._x) continue;
        const grow = p.birth < 0 ? 1 : ease.outBack(clamp((lt - p.birth) / 0.32, 0, 1));
        if (p.leaf) {
          const sw = Math.sin(t * 3.4 + i * 1.7) * 0.3 * conv;
          ivy(c, p._x, p._y, -Math.PI / 2 + p.leaf.side * 0.5 + sw, p.leaf.s * Math.max(0.05, grow), p.leaf.col);
        }
        if (p.ball) {
          const refined = lt > p.gild, pop = refined ? ease.outBack(clamp((lt - p.gild) / 0.3, 0, 1)) : 1;
          const r = p.ball.r * grow * (refined ? 0.85 * (0.8 + 0.2 * pop) : 1) * (1 + 0.32 * pu);
          dot(c, p._x, p._y, r, refined ? C.goldRef : C.gold, INK, 1.4);
          if (refined) { c.strokeStyle = INK; c.lineWidth = 1.1; c.beginPath(); c.arc(p._x, p._y, r + 2.6, 0, TAU); c.stroke(); dot(c, p._x - r * 0.3, p._y - r * 0.3, 1.4, '#fff', null); }
          const wa = t * 3 + i * 1.7 + (p.ph || 0);
          c.strokeStyle = '#3a2416'; c.lineWidth = 1.1; c.beginPath();
          for (let h = -1; h <= 1; h++) { const a2 = -Math.PI / 2 + h * 0.55 + 0.35 * Math.sin(wa); c.moveTo(p._x + Math.cos(a2) * (r + 1), p._y + Math.sin(a2) * (r + 1)); c.lineTo(p._x + Math.cos(a2) * (r + 7), p._y + Math.sin(a2) * (r + 7)); }
          c.stroke();
          const ns = nearSweep(p._x, p._y, swX);
          if (ns > 0) glint(c, p._x, p._y - 2, 0.5 + ns * 0.6, ns * 0.9);
          if (pu > 0.02) glint(c, p._x, p._y - 2, 0.55 + pu * 0.5, pu * 0.7);
          if (Math.abs(p.dC - waveR) < 60) glint(c, p._x, p._y - 2, 0.9, 0.85);       // 收束波掠过
          if (lt > 9.45 && hash(i, 61) < 0.1 && Math.sin(t * 3 + i * 2.7) > 0.9) glint(c, p._x, p._y - 2, 0.5, 0.55);   // 定格后零星明灭
        }
      }
    });
    c.restore();
  }

  // ---------- 计数贴页内容（朱红小注逐行写出＋滚动） ----------
  function counter(c, lt, t, pu) {
    if (lt < 3.25) return;
    const inn = ease.out(clamp((lt - 3.3) / 0.32, 0, 1));
    c.save(); c.translate(0, 46 * (1 - inn)); c.globalAlpha = clamp((lt - 3.3) / 0.2, 0, 1);
    c.drawImage(SLIPC(), 0, 0);
    const cx = 1570;
    c.fillStyle = C.red; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    const hIn = clamp((lt - 3.6) / 0.35, 0, 1);                                          // 栏头
    if (hIn > 0) { c.save(); c.beginPath(); c.rect(cx - 80, 360, 160 * hIn, 56); c.clip(); c.font = '50px "LXGWWenKai-500"'; c.fillText('参数量', cx, 404); c.restore(); }
    STAGES.forEach((st, k) => {
      if (lt < st.t0) return;
      const wIn = clamp((lt - st.t0) / 0.32, 0, 1);
      const settled = lt >= st.t1;
      const txt = settled ? st.final : fmtV(rollV(st, lt));
      c.save(); c.beginPath(); c.rect(cx - 85, st.y - 78, 170 * ease.out(wIn), 100); c.clip();
      c.font = (st.final === '1T+' && settled ? 96 : 78) + 'px "IMFellEnglish-400"';
      if (st.final === '1T+' && settled) { const pk = 1 + 0.2 * pu; c.save(); c.translate(cx, st.y); c.scale(pk, pk); c.fillText(txt, 0, 0); c.restore(); }
      else c.fillText(txt, cx, st.y);
      c.restore();
      if (lt > st.fl) {                                                                   // 行下朱笔花线
        const fw = clamp((lt - st.fl) / 0.35, 0, 1) * (settled ? 150 : 90);
        c.strokeStyle = C.red; c.lineWidth = 2.2; c.beginPath();
        for (let s = 0; s <= 20; s++) { const q = s / 20, xx = cx - fw / 2 + q * fw, yy = st.y + 24 + Math.sin(q * 7 + k) * 4; s ? c.lineTo(xx, yy) : c.moveTo(xx, yy); }
        c.stroke();
      }
    });
    if (pu > 0.02) glint(c, 1570, 344, 0.7 + pu * 0.6, pu);                              // 金印随重音闪光
    c.restore();
  }

  // ---------- 主参数（首字母框上的三颗大金球＋小注牌） ----------
  function heroes(c, lt, t, conv, swX, pu) {
    c.save(); c.lineCap = 'round';
    HEROES.forEach((h, hi) => {
      const refined = lt > h.gild;
      const br = 21 * (1 + 0.06 * Math.sin(t * 2.5 + h.ph)) * (refined ? 0.92 : 1) * (1 + 0.3 * pu);
      dot(c, h.x, h.y, br, refined ? C.goldRef : C.gold, INK, 2.2);
      const gr = c.createRadialGradient(h.x - 6, h.y - 6, 2, h.x, h.y, br);
      gr.addColorStop(0, 'rgba(255,250,220,.8)'); gr.addColorStop(1, 'rgba(255,250,220,0)');
      c.fillStyle = gr; c.beginPath(); c.arc(h.x, h.y, br, 0, TAU); c.fill();
      if (refined) { c.strokeStyle = INK; c.lineWidth = 1.4; c.beginPath(); c.arc(h.x, h.y, br + 3, 0, TAU); c.stroke(); }
      c.strokeStyle = '#3a2416'; c.lineWidth = 2; c.beginPath();                          // 须芒缓转
      const rot = 0.3 * Math.sin(t * 1.6 + h.ph) * conv;
      for (let k = -1; k <= 1; k++) { const a2 = -Math.PI / 2 + k * 0.62 + rot; c.moveTo(h.x + Math.cos(a2) * (br + 2), h.y + Math.sin(a2) * (br + 2)); c.lineTo(h.x + Math.cos(a2) * (br + 10), h.y + Math.sin(a2) * (br + 10)); }
      c.stroke();
      const tw = Math.max(0, Math.sin(t * 3.1 + h.ph));
      glint(c, h.x, h.y - 3, (0.4 + 0.7 * tw) * (refined ? 1.2 : 1), 0.45 + 0.5 * tw);
      const ns = nearSweep(h.x, h.y, swX); if (ns > 0) glint(c, h.x, h.y - 3, 0.7 + ns * 0.7, ns);
      if (pu > 0.02) glint(c, h.x, h.y - 3, 0.9, pu * 0.85);
      // 朱红小注牌
      const tx = h.tag[0], ty = h.tag[1];
      c.fillStyle = C.white; c.strokeStyle = INK; c.lineWidth = 2.2;
      c.fillRect(tx - 70, ty - 26, 140, 52); c.strokeRect(tx - 70, ty - 26, 140, 52);
      c.fillStyle = 'rgba(120,80,30,.14)'; c.fillRect(tx - 70, ty + 14, 140, 12);
      c.fillStyle = C.red; c.font = '42px "IMFellEnglish-400"'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(h.num, tx, ty + 2);
      if (refined) dot(c, tx + 62, ty - 18, 3.4, C.gold, INK, 1);                        // 归精后加金点
    });
    c.textBaseline = 'alphabetic';
    c.restore();
    STUDS.forEach((s, i) => {                                                             // 字身小金球随高光频闪
      const ns = nearSweep(s.x, s.y, swX); if (ns > 0) glint(c, s.x, s.y, 0.4 + ns * 0.5, ns * 0.9);
      if (lt > 9.45 && Math.sin(t * 2.6 + i * 1.9) > 0.93) glint(c, s.x, s.y, 0.45, 0.5);
    });
  }

  // ---------- 三枚泥金徽章（书＝数据 / 玫瑰窗＝方法 / 圣油灯＝算力） ----------
  function medRing(c, x, y, r) {
    c.strokeStyle = INK; c.lineWidth = 3.5; c.beginPath(); c.arc(x, y, r + 3, 0, TAU); c.stroke();
    const ann = new Path2D(); ann.arc(x, y, r, 0, TAU); ann.arc(x, y, r - 20, 0, TAU, true); ann.closePath();
    F(c, ann, C.gold, INK, 2.2);
    c.strokeStyle = 'rgba(255,245,200,.85)'; c.lineWidth = 4; c.beginPath(); c.arc(x, y, r - 10, Math.PI * 1.02, Math.PI * 1.5); c.stroke();
    c.strokeStyle = C.goldLo; c.lineWidth = 3; c.beginPath(); c.arc(x, y, r - 10, Math.PI * 0.08, Math.PI * 0.52); c.stroke();
    for (let k = 0; k < 18; k++) { const a = k / 18 * TAU; dot(c, x + Math.cos(a) * (r - 10), y + Math.sin(a) * (r - 10), 1.7, k % 2 ? '#fff' : C.goldLo, null); }
    c.strokeStyle = INK; c.lineWidth = 2.5; c.beginPath(); c.arc(x, y, r - 20, 0, TAU); c.stroke();
    c.fillStyle = C.white; c.beginPath(); c.arc(x, y, r - 22, 0, TAU); c.fill();
    c.strokeStyle = C.blue; c.lineWidth = 2; c.beginPath(); c.arc(x, y, r - 25, 0, TAU); c.stroke();
  }
  function drawBook(c, x, y, t) {                                                          // 福音书（数据）
    const cov = U.poly([[x - 58, y + 16], [x - 48, y - 34], [x + 56, y - 26], [x + 48, y + 20]]);
    F(c, cov, C.wood, INK, 2.6);
    const pg = U.poly([[x + 56, y - 26], [x + 62, y - 24], [x + 54, y + 21], [x + 48, y + 20]]);
    F(c, pg, C.white, INK, 1.6);
    c.strokeStyle = C.woodDk; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x - 44, y - 30); c.quadraticCurveTo(x - 40, y - 8, x - 42, y + 16); c.stroke();
    F(c, U.poly([[x - 50, y - 32], [x - 30, y - 30], [x - 42, y - 18]]), C.gold, INK, 1.6);   // 金包角
    F(c, U.poly([[x + 34, y + 16], [x + 46, y + 14], [x + 40, y + 2]]), C.gold, INK, 1.6);
    F(c, U.poly([[x - 8, y + 6], [x + 8, y + 6], [x + 8, y + 22], [x - 8, y + 22]]), C.gold, INK, 1.8);   // 金书扣
    const tw = Math.max(0, Math.sin(t * 3.6 + 0.8));
    glint(c, x, y + 14, 0.45 + 0.55 * tw, 0.35 + 0.5 * tw);
    c.strokeStyle = C.red; c.lineWidth = 2.6; c.beginPath(); c.moveTo(x - 26, y - 22); c.quadraticCurveTo(x - 18, y - 12, x - 26, y - 2); c.moveTo(x - 8, y - 22); c.quadraticCurveTo(x - 0.01, y - 12, x - 8, y - 2); c.stroke();   // 十字纹
  }
  function drawRose(c, x, y, t) {                                                          // 玫瑰窗（方法）
    c.fillStyle = C.blueDk; c.beginPath(); c.arc(x, y, 62, 0, TAU); c.fill();
    c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
    const rot = t * 0.05;
    for (let k = 0; k < 8; k++) {
      const a = rot + k / 8 * TAU, px = x + Math.cos(a) * 38, py = y + Math.sin(a) * 38;
      const dm = U.poly([[px + Math.cos(a) * 16, py + Math.sin(a) * 16], [px + Math.cos(a + 2.1) * 12, py + Math.sin(a + 2.1) * 12], [px + Math.cos(a + 4.2) * 16, py + Math.sin(a + 4.2) * 16], [px + Math.cos(a - 2.1) * 12, py + Math.sin(a - 2.1) * 12]]);
      F(c, dm, k % 2 ? C.blue : C.red, INK, 1.6);
      dot(c, x + Math.cos(a) * 55, y + Math.sin(a) * 55, 2.2, '#fff', null);
    }
    dot(c, x, y, 13, C.gold, INK, 2); dot(c, x, y, 5, C.red, null);
    c.save(); c.globalCompositeOperation = 'lighter';                                      // 彩玻璃明灭
    for (let k = 0; k < 8; k++) { const h2 = hash(k, 77); const a2 = rot + k / 8 * TAU + 0.4; const gx = x + Math.cos(a2) * 38, gy = y + Math.sin(a2) * 38;
      const al = Math.max(0, Math.sin(t * 5 + h2 * 40) - 0.6) * 1.6; if (al <= 0.02) continue;
      const gr = c.createRadialGradient(gx, gy, 0, gx, gy, 20); gr.addColorStop(0, `rgba(255,255,255,${al})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = gr; c.fillRect(gx - 20, gy - 20, 40, 40); }
    c.restore();
  }
  function drawLamp(c, x, y, t) {                                                          // 圣油灯（算力）
    const fl = 30 + 5 * Math.sin(t * 9) + 3 * Math.sin(t * 23 + 1);
    c.strokeStyle = INK; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x - 12, y - 44); c.lineTo(x - 4, y - 30); c.moveTo(x + 12, y - 44); c.lineTo(x + 4, y - 30); c.moveTo(x, y - 46); c.lineTo(x, y - 30); c.stroke();   // 提环
    F(c, U.poly([[x - 34, y - 30], [x + 34, y - 30], [x + 28, y - 22], [x - 28, y - 22]]), C.gold, INK, 2);     // 灯口沿
    const bowl = new Path2D(); bowl.moveTo(x - 30, y - 22); bowl.quadraticCurveTo(x - 30, y + 20, x, y + 22); bowl.quadraticCurveTo(x + 30, y + 20, x + 30, y - 22); bowl.closePath();
    F(c, bowl, C.gold, INK, 2.2);
    c.strokeStyle = C.goldLo; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 20, y - 14); c.quadraticCurveTo(x - 18, y + 10, x, y + 14); c.stroke();
    for (const dx of [-20, 0, 20]) { c.strokeStyle = INK; c.lineWidth = 2.2; c.beginPath(); c.moveTo(x + dx, y + 18); c.lineTo(x + dx * 0.7, y + 30); c.stroke(); }   // 三足
    F(c, U.poly([[x - 24, y + 30], [x + 24, y + 30], [x + 18, y + 38], [x - 18, y + 38]]), C.gold, INK, 2);
    // 灯焰（三层）＋灯芯
    c.strokeStyle = INK; c.lineWidth = 1.6;
    const fp = (hh, ww) => { const p = new Path2D(); p.moveTo(x, y - 34 - hh); p.quadraticCurveTo(x + ww, y - 34 - hh * 0.4, x + ww * 0.55, y - 30); p.quadraticCurveTo(x, y - 26, x - ww * 0.55, y - 30); p.quadraticCurveTo(x - ww, y - 34 - hh * 0.4, x, y - 34 - hh); p.closePath(); return p; };
    F(c, fp(fl, 13), C.gold, INK, 1.6); F(c, fp(fl * 0.62, 8), C.goldHi, null); dot(c, x, y - 32, 3, '#fff', null);
    dot(c, x, y - 28, 2.2, C.red, null);
    c.save(); c.globalAlpha = 0.55; P.steam(c, t, x, y - 40 - fl, { h: 52, n: 2, color: 'rgba(110,100,90,.6)', width: 2, spread: 5, wobble: 7, seed: 9 }); c.restore();
    const tw = Math.max(0, Math.sin(t * 8.5)); glint(c, x, y - 44 - fl * 0.3, 0.5 + 0.5 * tw, 0.4 + 0.4 * tw);
  }
  function medallions(c, lt, t, swX) {
    const B = [7.35, 7.75, 8.15], LB = [8.0, 8.35, 8.7], TXT = ['数据', '方法', '算力'];
    for (let k = 0; k < 3; k++) {
      if (lt < B[k]) continue;
      const pop = ease.outBack(clamp((lt - B[k]) / 0.55, 0, 1));
      if (pop <= 0) continue;
      const [tx, ty] = [MED[k].x, MED[k].y];
      const y = ty + 250 * (1 - Math.min(pop, 1.02));
      c.save(); c.globalAlpha = clamp((lt - B[k]) / 0.18, 0, 1);
      medRing(c, tx, y, 100);
      if (k === 0) drawBook(c, tx, y - 2, t); else if (k === 1) drawRose(c, tx, y, t); else drawLamp(c, tx, y - 6, t);
      const ns = nearSweep(tx, y, swX); if (ns > 0) glint(c, tx, y, 0.8 + ns * 0.5, ns);
      c.restore();
      const lp = clamp((lt - LB[k]) / 0.3, 0, 1);                                          // 小注牌
      if (lp > 0) {
        const lx = tx, ly = ty + 128;
        c.save(); c.translate(lx, ly); const sc = 0.8 + 0.2 * ease.outBack(lp); c.scale(sc, sc); c.globalAlpha = clamp((lt - LB[k]) / 0.15, 0, 1);
        c.fillStyle = C.white; c.strokeStyle = INK; c.lineWidth = 2.2; c.fillRect(-75, -27, 150, 54); c.strokeRect(-75, -27, 150, 54);
        c.beginPath(); c.rect(-80, -30, 160 * ease.out(clamp(lp, 0, 1)), 60); c.clip();
        c.fillStyle = C.red; c.font = '44px "LXGWWenKai-500"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(TXT[k], 0, 2);
        c.restore();
      }
    }
    c.textBaseline = 'alphabetic';
  }

  // ---------- 页边小母题：蜗牛爬、老鼠跑（无脸小兽） ----------
  function snail(c, lt, t) {
    const x = 1470 - 55 * lt, y = 954, st = Math.sin(t * 6) * 4;
    c.save(); c.lineJoin = 'round';
    const body = new Path2D(); body.moveTo(x + 52, y + 26); body.lineTo(x - 54 - st, y + 26); body.quadraticCurveTo(x - 70 - st, y + 22, x - 62 - st, y + 6); body.quadraticCurveTo(x - 40, y + 4, x - 10, y + 12); body.lineTo(x + 52, y + 18); body.closePath();
    F(c, body, C.white, INK, 2.4);
    c.strokeStyle = INK; c.lineWidth = 2.2; const ex = x - 58 - st;
    for (const q of [[-12, -30], [2, -34]]) { const wob = Math.sin(t * 8 + q[0]) * 3; c.beginPath(); c.moveTo(ex + 4, y + 8); c.quadraticCurveTo(ex + q[0] * 0.5, y - 10, ex + q[0] + wob, y + q[1]); c.stroke(); dot(c, ex + q[0] + wob, y + q[1], 3.4, INK, null); }
    const shell = new Path2D(); shell.arc(x + 4, y - 10, 32, 0, TAU); F(c, shell, C.gold, INK, 2.8);
    c.strokeStyle = C.goldLo; c.lineWidth = 3; c.beginPath();
    for (let a = 0; a < 14; a += 0.2) { const r2 = 2 + a * 2.0; const px = x + 4 + Math.cos(a) * r2, py = y - 10 + Math.sin(a) * r2; a ? c.lineTo(px, py) : c.moveTo(px, py); }
    c.stroke();
    c.restore();
  }
  function mouse(c, lt, t) {
    const q = clamp((lt - 7.3) / 1.9, 0, 1), x = lerp(1580, 400, q), y = 903, leg = Math.sin(t * 40);
    if (q <= 0 || q >= 1) return;
    c.save(); c.lineCap = 'round';
    c.strokeStyle = '#3e302c'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 22, y); c.bezierCurveTo(x + 50, y - 12 + Math.sin(t * 14) * 6, x + 60, y + 10, x + 82, y - 4 + Math.sin(t * 14 + 1) * 6); c.stroke();
    c.lineWidth = 3; c.beginPath(); c.moveTo(x - 10, y + 4); c.lineTo(x - 16 - leg * 7, y + 12); c.moveTo(x + 12, y + 4); c.lineTo(x + 16 + leg * 7, y + 12); c.stroke();
    const b = new Path2D(); b.ellipse(x, y - 2, 25, 12, 0, 0, TAU); F(c, b, '#3e302c', INK, 1.5);
    const hd = new Path2D(); hd.moveTo(x - 14, y - 10); hd.quadraticCurveTo(x - 30, y - 8, x - 38, y + 2); hd.quadraticCurveTo(x - 24, y + 6, x - 12, y + 6); hd.closePath(); F(c, hd, '#3e302c', INK, 1.5);
    dot(c, x - 16, y - 13, 6, '#5a4640', INK, 1.2); dot(c, x - 30, y - 2, 1.6, '#fff', null);
    c.restore();
  }

  // ---------- 屏上字（朱红栏题，写在首字母上方，随页面世界） ----------
  const TITLES = [[0.15, 2.95, '参数'], [3.15, 6.95, '疯狂卷参数'], [7.1, 10.3, '参数之外']];
  function screenText(c, lt, t) {
    for (const [t0, t1, txt] of TITLES) {
      if (lt < t0 || lt > t1 + 0.1) continue;
      const aIn = clamp((lt - t0) / 0.35, 0, 1), aOut = 1 - ss(t1 - 0.2, t1, lt);
      if (aIn <= 0 || aOut <= 0) continue;
      const x = 300, y = 312;
      c.save(); c.globalAlpha = Math.min(aIn, aOut);
      c.font = '84px "LXGWWenKai-500"'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      const w = c.measureText(txt).width;
      c.beginPath(); c.rect(x - 12, y - 74, (w + 40) * ease.out(aIn), 100); c.clip();
      c.fillStyle = C.redDk; c.fillText(txt, x + 3, y + 3);                                // 朱笔叠影
      c.fillStyle = C.red; c.fillText(txt, x, y);
      c.restore();
      if (aIn >= 1) {                                                                      // 句首金球＋朱笔细线
        const wob = 0.5 + 0.5 * Math.max(0, Math.sin(t * 3.2));
        dot(c, x - 30, y - 30, 6, C.gold, INK, 1.6); glint(c, x - 30, y - 30, 0.5 + wob * 0.6, 0.4 + wob * 0.45);
        c.strokeStyle = C.red; c.lineWidth = 2.4; c.beginPath();
        for (let s = 0; s <= 14; s++) { const q = s / 14, xx = x - 10 + q * (w + 26), yy = y + 26 + Math.sin(q * 6.5) * 4; s ? c.lineTo(xx, yy) : c.moveTo(xx, yy); }
        c.stroke();
      }
    }
  }

  return {
    init() {
      U.assertGlyphs('84px "LXGWWenKai-500"', '参数疯狂卷之外数据方法量', 's05_gothic 屏上字/栏头/注牌');
      U.assertGlyphs('78px "IMFellEnglish-400"', '0123456789.-BT+', 's05_gothic 数字');
      U.assertGlyphs('400px "UnifrakturMaguntia-400"', 'P', 's05_gothic 首字母');
      UNDER(); DIAPER(); VIG(); MAIN(); SLIPC(); MASK();
    },
    draw(c, lt, t) {
      const z = camZ(lt), dens = ss(3.4, 6.3, lt);
      const conv = 1 - 0.6 * ss(9.0, 9.7, lt);                                            // 收稳：摆幅收敛（仍留 40% 活）
      const pu = ss(6.3, 6.55, lt) * (1 - ss(6.55, 7.15, lt));                            // 1T+ 唯一重音（画面脉冲，非镜头）
      const swX = sweepX(lt);
      c.save();
      c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-960, -540);
      c.drawImage(UNDER(), 0, 0);
      // 底纹/暗角：dens 门限之上再乘 0.55s 淡入（否则 3.4s 一帧整屏跳现，分镜自检也过不去）
      const aIn = ss(3.4, 3.95, lt);
      if (aIn > 0.001) {
        c.globalAlpha = (0.15 + 0.30 * dens) * aIn; c.drawImage(DIAPER(), 0, 0);
        c.globalAlpha = 0.13 * dens * aIn; c.drawImage(VIG(), 0, 0);
        c.globalAlpha = 1;
      }
      c.drawImage(MAIN(), 0, 0);
      vines(c, lt, t, conv, swX, pu);
      counter(c, lt, t, pu);
      heroes(c, lt, t, conv, swX, pu);
      medallions(c, lt, t, swX);
      snail(c, lt, t);
      mouse(c, lt, t);
      // 斜向金光：拍一匀速扫过首字母；1T+ 反向快扫（重音的一半）
      goldSweep(c, swX, lt < 3.1 ? 0.85 : 0.7);
      // 拍三收束：径向金光带自外向内（掩膜限金），到心留一点余晖
      const wv = ss(8.55, 9.45, lt);
      if (wv > 0.001 && wv < 0.999) {
        const r = lerp(920, 70, wv), s = P.scratch('s05Wave'), g = s.getContext('2d');
        g.clearRect(0, 0, W, H); g.globalCompositeOperation = 'source-over';
        const gr = g.createRadialGradient(960, 545, Math.max(1, r - 75), 960, 545, r + 75);
        gr.addColorStop(0, 'rgba(255,248,205,0)'); gr.addColorStop(0.5, 'rgba(255,248,205,.55)'); gr.addColorStop(1, 'rgba(255,248,205,0)');
        g.fillStyle = gr; g.fillRect(0, 0, W, H);
        g.globalCompositeOperation = 'destination-in'; g.drawImage(MASK(), 0, 0); g.globalCompositeOperation = 'source-over';
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.55; c.drawImage(s, 0, 0); c.restore();
      }
      if (lt > 9.45) {                                                                     // 金光归心余晖
        const gl = c.createRadialGradient(960, 545, 60, 960, 545, 470);
        const ga = 0.12 * ss(9.45, 9.8, lt) + 0.02 * Math.max(0, Math.sin(t * 2.2));
        gl.addColorStop(0, `rgba(255,244,200,${ga})`); gl.addColorStop(1, 'rgba(255,244,200,0)');
        c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = gl; c.fillRect(430, 200, 1060, 700); c.restore();
      }
      screenText(c, lt, t);
      c.restore();
      c.drawImage(P.grain('s05g', 0.05, [90, 60, 20], 0.16), 0, 0);
    },
  };
})();
