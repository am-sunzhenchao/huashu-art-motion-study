// 「大模型参数」风格样片：当代扁平插画（s16_2026）——纯代码，2026 Dribbble 扁平＋颗粒点彩。
// 管线：静态底（米白墙/地面、粉圆与淡紫色块的颗粒点彩、地毯）缓存 → 密度升级层（三张透明贴图按拍二档位淡入）
//      → 会动的环境（太阳光芒缓转、云左移、装饰符号 4fps 沸腾、两盆绿植摆动）→ 主体：
//      拍一 0–3s「参数」：三颗参数球（珊瑚/日黄/豆绿，颗粒点彩＋同色系深一档分体块）带阻尼弹跳呼吸，
//             白色数字铭牌 0.73 / -1.2 / 2.4（Poppins-800）随球轻摆；扁平放大镜环依次滑到每颗球上方端详，
//             被端详的球做一次受激阻尼缩胀回弹。
//      拍二 3–7s「疯狂卷参数」：大脑侧剖色块回弹长出，小参数球沿抖动网格逐颗点亮、藏青细线蔓延连成网，
//             两台服务器机柜卡回弹入场、指示灯明灭，悬浮计数卡滚动 1.5B→175B→540B→1T+（缓动回弹），
//             背景颗粒密度三档加密；1T+ 揭示时全脑小球一次同脉冲变亮（全片唯一重音）。
//      拍三 7–10s「参数之外」：增殖停住；三张白底圆角卡依次升起（书堆=数据、齿轮=方法、电池=算力），
//             三颗带数字的参数球飞落卡顶描白变精，齿轮缓转、电池充格循环，三色同心环光圈向脑心收束，
//             计数卡淡出，一枚四角星在卡列上方弹出收尾。
// 确定性：随机全部 U.rng/U.hash 种子；静态层 PAINT.cached；同一 t 两次渲染逐像素一致。
// 运镜一个思路：近景缓推 → 展开缓拉远 → 停住收稳（字与计数卡在屏幕层，不入镜）。
SCENES['s16_2026'] = (() => {
  const W = 1920, H = 1080, TAU = Math.PI * 2;
  const { clamp, lerp, ease, rng, hash, ss, seg } = U, P = PAINT;
  // 色板照抄 16 号风格卡（无描边纯色块；体块靠同色系深一档分）
  const C = {
    wall: '#f6efe2', navy: '#262a5c', navyLt: '#3c4178', coral: '#e8655a', coralLt: '#f08b7d', coralDk: '#d1514a',
    pink: '#f5cdc6', pinkDot: '#e8807b', lav: '#e4dbf6', lavDot: '#b9a4ea', red: '#e65a52',
    yellow: '#f2b33d', yellowDk: '#dca23a', yellowLt: '#f8cf6a', sun: '#f3b13c',
    green: '#2f8a5d', greenDk: '#22704a', greenLt: '#57b07a', mint: '#d6ece0', white: '#fffaf2',
  };
  const dmp = (tt, t0, amp, period, decay) => tt < t0 ? 0 : amp * Math.exp(-(tt - t0) / decay) * Math.sin((tt - t0) / period * TAU);   // 阻尼二次动作
  const sm = (pts, closed = true) => RIG.smooth(pts, closed);

  // ---------- 颗粒点彩：形状内撒方点，密度是位置函数（照卡） ----------
  function stipple(g, path, box, col, density, seed, size = 2.2) {
    const r = U.rng(seed), [x0, y0, x1, y1] = box;
    g.save(); if (path) g.clip(path); g.fillStyle = col;
    const n = Math.round((x1 - x0) * (y1 - y0) * 0.02);
    for (let i = 0; i < n; i++) {
      const x = lerp(x0, x1, r()), y = lerp(y0, y1, r());
      if (r() < density(x, y)) { const s = size * (0.6 + r() * 0.8); g.fillRect(x, y, s, s); }
    }
    g.restore();
  }

  // ---------- 静态底（缓存一次）：墙/地、粉圆、淡紫色块、地毯、软影 ----------
  const PINK = [430, 400, 290];
  const LAVP = [[1310, 215], [1452, 190], [1572, 254], [1616, 404], [1600, 558], [1498, 674], [1344, 714], [1224, 634], [1186, 470], [1206, 306]];
  const LAV = sm(LAVP);
  const bg = () => P.cached('f26bg', W, H, (g) => {
    g.fillStyle = C.wall; g.fillRect(0, 0, W, 820);
    const fg = g.createLinearGradient(0, 820, 0, H); fg.addColorStop(0, '#eedec4'); fg.addColorStop(1, '#f2e6d2');
    g.fillStyle = fg; g.fillRect(0, 820, W, H - 820);
    // 粉圆：淡粉渐变底＋越往下越密的红点（照卡的密度函数写法）
    const pc = new Path2D(); pc.arc(PINK[0], PINK[1], PINK[2], 0, TAU);
    const pg = g.createLinearGradient(0, PINK[1] - PINK[2], 0, PINK[1] + PINK[2]);
    pg.addColorStop(0, 'rgba(246,214,206,.5)'); pg.addColorStop(1, 'rgba(244,196,188,.92)');
    g.save(); g.clip(pc); g.fillStyle = pg; g.fillRect(PINK[0] - PINK[2], PINK[1] - PINK[2], PINK[2] * 2, PINK[2] * 2); g.restore();
    stipple(g, pc, [PINK[0] - PINK[2], PINK[1] - PINK[2], PINK[0] + PINK[2], PINK[1] + PINK[2]], C.pinkDot,
      (x, y) => 0.08 + 0.42 * clamp((y - PINK[1] + 150) / 440), 11);
    // 淡紫色块
    g.fillStyle = C.lav; g.fill(LAV);
    stipple(g, LAV, [1170, 180, 1630, 730], C.lavDot, (x, y) => 0.05 + 0.30 * clamp((x - 1290) / 320) * clamp((y - 300) / 380 + 0.3), 12);
    // 地毯
    const rug = new Path2D(); rug.ellipse(960, 928, 560, 38, 0, 0, TAU);
    g.fillStyle = C.mint; g.fill(rug);
    stipple(g, rug, [400, 890, 1520, 966], '#9fcfb4', () => 0.30, 13, 2.4);
    // 地面软影
    g.fillStyle = 'rgba(160,140,120,.16)';
    [[960, 856, 420, 14], [330, 846, 130, 10], [1662, 846, 130, 10]].forEach(([x, y, rx, ry]) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); });
  });

  // ---------- 密度升级层：三张透明贴图（粉圆更密/淡紫更密/地面浮点），拍二按档淡入 ----------
  const pinkDots = (g, extra, seed) => {
    const pc = new Path2D(); pc.arc(PINK[0], PINK[1], PINK[2], 0, TAU);
    stipple(g, pc, [PINK[0] - PINK[2], PINK[1] - PINK[2], PINK[0] + PINK[2], PINK[1] + PINK[2]], C.pinkDot,
      (x, y) => extra * (0.25 + 0.75 * clamp((y - PINK[1] + 150) / 440)), seed);
  };
  const lavDots = (g, extra, seed) => stipple(g, LAV, [1170, 180, 1630, 730], C.lavDot, (x, y) => extra * (0.3 + 0.7 * clamp((x - 1290) / 320)), seed);
  const floorDots = (g, n, seed) => {
    const r = U.rng(seed); g.fillStyle = '#d9c6a5';
    for (let i = 0; i < n; i++) { const x = 40 + r() * (W - 80), y = 832 + r() * 220, s = 2 + r() * 2.2; g.fillRect(x, y, s, s); }
  };
  const OVL = [
    { ramp: [3.2, 4.3], build: (g) => { pinkDots(g, 0.35, 21); lavDots(g, 0.30, 61); floorDots(g, 620, 51); } },
    { ramp: [4.5, 5.5], build: (g) => { pinkDots(g, 0.55, 22); lavDots(g, 0.50, 62); floorDots(g, 700, 52); } },
    { ramp: [5.7, 6.5], build: (g) => { pinkDots(g, 0.80, 23); lavDots(g, 0.75, 63); floorDots(g, 760, 53); } },
  ];
  const ovTex = (k) => P.cached('f26ov' + k, W, H, OVL[k].build);

  // ---------- 会动的环境：太阳（缓存盘＋活光芒）、云、装饰符号 4fps 沸腾、两盆绿植 ----------
  const sunSpr = () => P.cached('f26sun', 160, 160, (g) => {
    g.fillStyle = C.sun; g.beginPath(); g.arc(80, 80, 58, 0, TAU); g.fill();
    const r = U.rng(5); g.fillStyle = '#e8743a';
    for (let i = 0; i < 2400; i++) { const a = r() * 7, d = Math.sqrt(r()) * 56, x = 80 + Math.cos(a) * d, y = 80 + Math.sin(a) * d; if (r() < 0.12 + 0.6 * clamp((x + y - 130) / 110)) g.fillRect(x, y, 2, 2); }
  });
  function sun(c, t) {
    const S = [1706, 168];
    c.strokeStyle = C.sun; c.lineWidth = 6; c.lineCap = 'round';
    for (let k = 0; k < 12; k++) {
      const a = k / 12 * TAU + t * 0.32, r0 = 68, r1 = 82 + (k % 2 ? 0 : 5) + Math.sin(t * 5 + k) * 3;
      c.beginPath(); c.moveTo(S[0] + Math.cos(a) * r0, S[1] + Math.sin(a) * r0); c.lineTo(S[0] + Math.cos(a) * r1, S[1] + Math.sin(a) * r1); c.stroke();
    }
    c.drawImage(sunSpr(), S[0] - 80, S[1] - 80);
  }
  function clouds(c, t) {
    const cloud = (x, y, s) => {
      c.fillStyle = C.white;
      c.beginPath(); c.arc(x, y, 22 * s, Math.PI, 0); c.arc(x + 30 * s, y - 10 * s, 28 * s, Math.PI, 0); c.arc(x + 62 * s, y, 20 * s, Math.PI, 0); c.closePath(); c.fill();
      c.beginPath(); c.roundRect(x - 22 * s, y - 2, 104 * s, 18 * s, 9 * s); c.fill();
    };
    [[520, 0.8, 238], [680, 1.15, 322], [360, 0.7, 412]].forEach(([x0, s, y]) => {
      const span = W + 460, x = ((x0 - t * 14) % span + span) % span - 230;
      cloud(x, y, s);
    });
  }
  const DECOS = [
    ['plus', 148, 318, C.red, 1.15], ['dot', 92, 540, C.yellow, 1], ['squig', 208, 772, C.navy, 0.9], ['dots', 118, 902, '#8dc7a2', 1],
    ['tri', 560, 132, '#b59bec', 1.1], ['dot', 762, 104, C.coral, 0.85], ['ring', 1105, 150, C.yellow, 0.95], ['squig', 1078, 252, C.red, 0.9],
    ['x', 1566, 300, C.navy, 1], ['half', 1842, 372, C.greenLt, 1], ['dot', 1786, 610, C.yellow, 0.9], ['plus', 1872, 856, C.coral, 1],
  ];
  function decos(c, t) {
    const b = Math.floor(t * 4);
    DECOS.forEach(([k, x, y, col, s], i) => {
      const jx = (hash(i, b) - 0.5) * 3, jy = (hash(i + 50, b) - 0.5) * 3, ja = (hash(i + 99, b) - 0.5) * 0.18;
      c.save(); c.translate(x + jx, y + jy); c.rotate(ja); c.scale(s, s); c.fillStyle = col; c.strokeStyle = col; c.lineCap = 'round'; c.lineJoin = 'round';
      if (k === 'plus' || k === 'x') { if (k === 'x') c.rotate(0.78); c.lineWidth = 8; c.beginPath(); c.moveTo(-13, 0); c.lineTo(13, 0); c.moveTo(0, -13); c.lineTo(0, 13); c.stroke(); }
      else if (k === 'dot') { c.beginPath(); c.arc(0, 0, 11, 0, TAU); c.fill(); }
      else if (k === 'ring') { c.lineWidth = 6; c.beginPath(); c.arc(0, 0, 13, 0, TAU); c.stroke(); }
      else if (k === 'tri') { c.beginPath(); c.moveTo(0, -16); c.lineTo(15, 12); c.lineTo(-15, 12); c.closePath(); c.fill(); }
      else if (k === 'half') { c.beginPath(); c.arc(0, 6, 20, Math.PI, 0); c.closePath(); c.fill(); }
      else if (k === 'squig') { c.lineWidth = 5; c.beginPath(); for (let q = 0; q <= 24; q++) { const xx = -32 + q * 2.7, yy = Math.sin(q / 24 * Math.PI * 3 + i) * 8; q ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke(); }
      else if (k === 'dots') { for (let a = 0; a < 3; a++) for (let d = 0; d < 4; d++) { c.beginPath(); c.arc(d * 15 - 22, a * 15 - 15, 3.6, 0, TAU); c.fill(); } }
      c.restore();
    });
  }
  // 绿植（照卡的虎皮兰画法，位置为本片重新构图）：叶子绕盆口摆
  function snakePlant(c, bx, by, sc, ang) {
    c.save(); c.translate(bx, by); c.rotate(ang); c.scale(sc, sc);
    const leaf = (ox, tipx, tipy, w, col, edge) => {
      c.fillStyle = edge; c.beginPath(); c.moveTo(ox - w, 0); c.quadraticCurveTo(ox - w * 0.6, tipy / 2, tipx, tipy); c.quadraticCurveTo(ox + w * 0.8, tipy / 2, ox + w, 0); c.closePath(); c.fill();
      c.fillStyle = col; c.beginPath(); c.moveTo(ox - w + 5, 0); c.quadraticCurveTo(ox - w * 0.5, tipy / 2 + 10, tipx, tipy + 14); c.quadraticCurveTo(ox + w * 0.6, tipy / 2 + 10, ox + w - 5, 0); c.closePath(); c.fill();
    };
    leaf(-52, -118, -205, 20, '#3f9a62', C.yellow); leaf(42, 122, -180, 17, '#3f9a62', C.yellow);
    leaf(-15, -40, -300, 21, '#2e7f50', '#2e7f50'); leaf(16, 55, -260, 19, '#4aa86c', C.yellow);
    leaf(0, -8, -335, 15, '#2e7f50', C.yellow);
    c.restore();
  }
  function plants(c, t, lt) {
    const a1 = Math.sin(t * 1.6) * 0.018 + dmp(lt, 3.1, 0.035, 0.55, 0.6) + dmp(lt, 6.32, 0.03, 0.55, 0.5);
    c.fillStyle = C.red; c.beginPath(); c.moveTo(86, 818); c.lineTo(216, 818); c.lineTo(208, 902); c.quadraticCurveTo(206, 920, 184, 920); c.lineTo(118, 920); c.quadraticCurveTo(96, 920, 94, 902); c.closePath(); c.fill();   // 左：红盆
    c.fillStyle = C.white; c.fillRect(90, 838, 122, 15);
    stipple(c, null, [86, 818, 216, 920], '#c2403a', (x, y) => y > 852 ? 0.4 : 0.2, 16);
    snakePlant(c, 151, 818, 1, -a1 * 0.8);
    const a2 = Math.sin(t * 1.5 + 1.4) * 0.02 + dmp(lt, 6.32, 0.03, 0.5, 0.5);
    c.fillStyle = '#ac94ea'; c.beginPath(); c.moveTo(1766, 818); c.lineTo(1886, 818); c.lineTo(1878, 896); c.quadraticCurveTo(1876, 912, 1858, 912); c.lineTo(1794, 912); c.quadraticCurveTo(1776, 912, 1774, 896); c.closePath(); c.fill();   // 右：淡紫小盆
    c.fillStyle = '#9a7ee0'; c.fillRect(1770, 836, 112, 13);
    snakePlant(c, 1826, 818, 0.66, a2);
  }

  // ---------- 大脑侧剖（拍二长出）：静态体缓存＋点阵活层 ----------
  const BR_PTS = [[640, 560], [648, 436], [726, 344], [862, 300], [958, 326], [1032, 298], [1148, 318], [1236, 396], [1284, 512], [1272, 646], [1188, 736], [1062, 776], [940, 770], [832, 730], [726, 688], [642, 646]];
  const BRAIN = sm(BR_PTS);
  const brainSpr = () => P.cached('f26brain', 760, 560, (g) => {
    g.translate(-580, -270);
    g.fillStyle = 'rgba(160,140,120,.15)'; g.beginPath(); g.ellipse(960, 792, 330, 26, 0, 0, TAU); g.fill();   // 底影
    g.fillStyle = C.coral; g.beginPath(); g.arc(1150, 692, 84, 0, TAU); g.fill();                               // 小脑
    g.strokeStyle = C.coralDk; g.lineWidth = 6; g.beginPath(); g.arc(1150, 692, 84, 0.55 * Math.PI, 1.45 * Math.PI); g.stroke();
    g.fillStyle = C.coralLt; g.fill(BRAIN);                                                                     // 脑体
    g.save(); g.clip(BRAIN);
    g.fillStyle = C.coral; g.beginPath(); g.moveTo(580, 690); g.quadraticCurveTo(960, 600, 1340, 700); g.lineTo(1340, 830); g.lineTo(580, 830); g.closePath(); g.fill();   // 下半深一档
    g.strokeStyle = C.coralDk; g.lineWidth = 12; g.lineCap = 'round';                                           // 沟回
    g.beginPath(); g.moveTo(958, 330); g.quadraticCurveTo(952, 430, 962, 548); g.stroke();
    g.beginPath(); g.moveTo(760, 366); g.quadraticCurveTo(700, 470, 736, 580); g.stroke();
    g.beginPath(); g.moveTo(1140, 372); g.quadraticCurveTo(1206, 480, 1172, 590); g.stroke();
    g.beginPath(); g.moveTo(848, 470); g.quadraticCurveTo(910, 520, 900, 590); g.stroke();
    g.restore();
  });
  // 点阵（拍二逐颗点亮）：抖动网格＋isPointInPath 筛选，种子洗牌定出场顺序；连线取已出场近邻
  const BD = [], EDGES = [];
  {
    const ip = P.canvas(12, 12).getContext('2d'), r = rng(1601);
    for (let y = 322; y <= 758; y += 37) for (let x = 652; x <= 1262; x += 37) {
      const x2 = x + (r() - 0.5) * 15, y2 = y + (r() - 0.5) * 15;
      if (ip.isPointInPath(BRAIN, x2, y2)) BD.push({ x: x2, y: y2, r: 5.5 + r() * 5, col: null, core: null, ph: r() * TAU, ap: 0 });
    }
    BD.forEach((d) => { const k = r(); d.col = k < 0.3 ? C.white : k < 0.55 ? C.yellow : k < 0.8 ? C.green : C.navy; d.core = d.col === C.white ? 'rgba(38,42,92,' : 'rgba(255,250,242,'; });
    const idx = BD.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) { const j = (r() * (i + 1)) | 0; const tmp = idx[i]; idx[i] = idx[j]; idx[j] = tmp; }
    idx.forEach((bi, k) => { BD[bi].ap = 3.62 + (k / BD.length) * 3.05; });
    const popped = [];
    idx.forEach((bi) => {
      const d = BD[bi], near = [];
      popped.forEach((pj) => { const dd = Math.hypot(BD[pj].x - d.x, BD[pj].y - d.y); if (dd < 76) near.push([dd, pj]); });
      near.sort((a, b) => a[0] - b[0]);
      for (let m = 0; m < Math.min(2, near.length); m++) EDGES.push([bi, near[m][1]]);
      popped.push(bi);
    });
  }
  function brainLayer(c, lt, t, b3, pulse) {
    const gr = ease.outBack(ss(3.05, 3.62, lt));                                 // 回弹长出
    if (gr > 0.01) {
      c.save(); c.globalAlpha = clamp(ss(3.05, 3.3, lt), 0, 1);
      c.translate(960, 560); c.scale(gr, gr); c.translate(-960, -560);
      c.drawImage(brainSpr(), 580, 270);
      c.restore();
    }
    if (lt < 3.6) return;
    c.save(); c.clip(BRAIN);
    c.strokeStyle = `rgba(38,42,92,${0.26 + 0.10 * b3})`; c.lineWidth = 2; c.beginPath();   // 连线蔓延
    EDGES.forEach(([a, b]) => {
      if (Math.min(ss(BD[a].ap, BD[a].ap + 0.3, lt), ss(BD[b].ap, BD[b].ap + 0.3, lt)) < 0.25) return;
      c.moveTo(BD[a].x, BD[a].y); c.lineTo(BD[b].x, BD[b].y);
    });
    c.stroke();
    BD.forEach((d) => {                                                          // 小球：点亮弹入＋呼吸明灭＋拍三描白变精
      const q = ss(d.ap, d.ap + 0.34, lt); if (q <= 0.02) return;
      const pop = q < 1 ? ease.out(q) * (1 + 0.35 * Math.sin(q * Math.PI)) : 1;
      const rr = d.r * pop * lerp(1, 0.88, b3);
      const ca = clamp(0.34 + 0.26 * Math.sin(t * 2.3 + d.ph) + 0.5 * pulse + 0.3 * b3, 0, 0.92);
      c.fillStyle = d.col; c.beginPath(); c.arc(d.x, d.y, rr, 0, TAU); c.fill();
      c.fillStyle = d.core + ca + ')'; c.beginPath(); c.arc(d.x, d.y, rr * 0.55, 0, TAU); c.fill();
      if (b3 > 0.02) { c.strokeStyle = `rgba(255,250,242,${0.7 * b3})`; c.lineWidth = 2.2; c.beginPath(); c.arc(d.x, d.y, rr + 3.5, 0, TAU); c.stroke(); }
    });
    c.restore();
  }

  // ---------- 三颗参数球（主角，贯穿全片）：精灵缓存＋阻尼弹跳＋白色数字铭牌 ----------
  const HERO = [
    { x: 700, y: 560, r: 78, base: C.coral, dk: C.coralDk, lt: C.coralLt, num: '0.73', tIn: 0.12, ex: 0.78, dock: [600, 566] },
    { x: 985, y: 706, r: 62, base: C.yellow, dk: C.yellowDk, lt: C.yellowLt, num: '-1.2', tIn: 0.30, ex: 1.72, dock: [960, 566] },
    { x: 1258, y: 520, r: 56, base: C.green, dk: C.greenDk, lt: C.greenLt, num: '2.4', tIn: 0.46, ex: 2.62, dock: [1320, 566] },
  ];
  const heroSpr = (k) => {
    const h = HERO[k], S = (h.r + 16) * 2;
    return P.cached('f26h' + k, S, S, (g) => {
      const cx = S / 2, cy = S / 2;
      const body = new Path2D(); body.arc(cx, cy, h.r, 0, TAU);
      g.fillStyle = h.base; g.fill(body);
      g.save(); g.clip(body);
      g.fillStyle = h.lt; g.beginPath(); g.ellipse(cx - h.r * 0.3, cy - h.r * 0.34, h.r * 0.52, h.r * 0.4, -0.5, 0, TAU); g.fill();   // 亮面
      g.fillStyle = h.dk; g.beginPath(); g.moveTo(cx - h.r, cy + h.r * 0.12); g.quadraticCurveTo(cx, cy - h.r * 0.02, cx + h.r, cy + h.r * 0.3); g.lineTo(cx + h.r, cy + h.r); g.lineTo(cx - h.r, cy + h.r); g.closePath(); g.fill();   // 深一档斜块
      const r = U.rng(70 + k); g.fillStyle = h.dk;                                                               // 颗粒点彩
      for (let i = 0; i < 460; i++) {
        const x = cx + (r() * 2 - 1) * h.r, y = cy + (r() * 2 - 1) * h.r;
        if (Math.hypot(x - cx, y - cy) < h.r * 0.96 && r() < 0.05 + 0.28 * clamp((y - cy + h.r * 0.4) / (h.r * 1.2))) g.fillRect(x, y, 2.4, 2.4);
      }
      g.restore();
    });
  };
  function heroes(c, lt, t, b3) {
    c.save(); c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    HERO.forEach((h, k) => {
      const qIn = ease.outBack(ss(h.tIn, h.tIn + 0.38, lt)); if (qIn <= 0.02) return;
      const spr = heroSpr(k), S = (h.r + 16) * 2;
      const tDock = 8.62 + k * 0.18, dq = ease.inOut(seg(lt, tDock, tDock + 0.55));
      const land = dmp(lt, tDock + 0.55, 0.10, 0.30, 0.32);                       // 落卡阻尼
      const exP = dmp(lt, h.ex, 0.09, 0.34, 0.40);                                // 被端详时受激缩胀
      const bob = Math.sin(t * 1.8 + k * 2.1) * 7 * (1 - 0.55 * b3);
      const x = lerp(h.x, h.dock[0], dq);
      const y = lerp(h.y, h.dock[1], dq) - 72 * Math.sin(Math.PI * dq) + bob;
      const sc = clamp(qIn * (1 + exP + land) * lerp(1, 0.8, ss(8.4, 9.4, lt)), 0, 2.4);
      const ss2 = S * sc;
      c.save(); c.globalAlpha = clamp(ss(h.tIn, h.tIn + 0.2, lt), 0, 1);
      c.drawImage(spr, x - ss2 / 2, y - ss2 / 2, ss2, ss2);
      if (b3 > 0.02) { c.strokeStyle = `rgba(255,250,242,${0.85 * b3})`; c.lineWidth = 4.5; c.beginPath(); c.arc(x, y, h.r * sc + 8, 0, TAU); c.stroke(); }   // 拍三描白
      c.restore();
      const cq = ease.outBack(ss(h.tIn + 0.15, h.tIn + 0.5, lt));                 // 白色数字铭牌
      if (cq > 0.03) {
        const sw = Math.sin(t * 1.8 + k * 2.1 + 0.7) * 3;
        const cy2 = y + h.r * sc + 34;
        c.save(); c.globalAlpha = clamp(cq, 0, 1) * 0.97;
        c.font = '34px "Poppins-800"';
        const cw = c.measureText(h.num).width + 44;
        c.fillStyle = C.white; c.beginPath(); c.roundRect(x + sw - cw / 2, cy2 - 23, cw, 46, 15); c.fill();
        c.fillStyle = C.navy; c.fillText(h.num, x + sw, cy2 + 9);
        c.restore();
      }
    });
    c.restore();
  }
  // 扁平放大镜环（拍一端详动作）：滑到每颗球上方悬停
  function magnifier(c, lt, t) {
    const a = ss(0.5, 0.8, lt) * (1 - ss(3.18, 3.45, lt)); if (a <= 0.01) return;
    const A = [HERO[0].x, HERO[0].y - 4], B = [HERO[1].x, HERO[1].y - 4], C2 = [HERO[2].x, HERO[2].y - 4];
    let px;
    if (lt < 1.5) px = A;
    else if (lt < 1.7) { const q = ease.inOut((lt - 1.5) / 0.2); px = [lerp(A[0], B[0], q), lerp(A[1], B[1], q)]; }
    else if (lt < 2.4) px = B;
    else if (lt < 2.6) { const q = ease.inOut((lt - 2.4) / 0.2); px = [lerp(B[0], C2[0], q), lerp(B[1], C2[1], q)]; }
    else px = C2;
    const x = px[0], y = px[1] + Math.sin(t * 2.6) * 5;
    const pop = dmp(lt, 0.75, 0.05, 0.3, 0.3) + dmp(lt, 1.7, 0.05, 0.3, 0.3) + dmp(lt, 2.6, 0.05, 0.3, 0.3);
    const R2 = 92 * (1 + pop);
    c.save(); c.globalAlpha = a;
    c.fillStyle = 'rgba(255,250,242,.4)'; c.beginPath(); c.arc(x, y, R2 - 7, 0, TAU); c.fill();
    c.strokeStyle = C.white; c.lineWidth = 13; c.beginPath(); c.arc(x, y, R2, 0, TAU); c.stroke();
    const ha = Math.PI * 0.75;
    c.strokeStyle = C.navy; c.lineCap = 'round'; c.lineWidth = 14;
    c.beginPath(); c.moveTo(x + Math.cos(ha) * R2, y + Math.sin(ha) * R2); c.lineTo(x + Math.cos(ha) * (R2 + 78), y + Math.sin(ha) * (R2 + 78)); c.stroke();
    c.restore();
  }

  // ---------- 服务器机柜卡（拍二弹入）：藏青体＋白条＋指示灯明灭＋通风槽 ----------
  function rack(c, cx, t, lt, t0, seed) {
    const q = ease.outBack(ss(t0, t0 + 0.55, lt)); if (q <= 0.01) return;
    const y = 640 + (1 - q) * 260 + Math.sin(t * 1.3 + seed) * 2;
    c.save(); c.globalAlpha = clamp(q, 0, 1);
    c.fillStyle = 'rgba(160,140,120,.20)'; c.beginPath(); c.ellipse(cx, 838, 120, 12, 0, 0, TAU); c.fill();
    c.fillStyle = C.navy; c.beginPath(); c.roundRect(cx - 95, y - 170, 190, 340, 22); c.fill();
    c.fillStyle = C.white; c.beginPath(); c.roundRect(cx - 80, y - 155, 160, 46, 12); c.fill();
    c.fillStyle = C.navyLt; c.beginPath(); c.roundRect(cx - 80, y - 148, 160, 8, 4); c.fill();
    const F2 = Math.floor(t * 2.6);
    for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) {
      const on2 = hash(F2 + seed * 97, j * 7 + i * 13) > 0.42;
      c.fillStyle = on2 ? [C.yellow, C.greenLt, C.white][(j + i + seed) % 3] : C.navyLt;
      c.beginPath(); c.arc(cx - 52 + i * 52, y - 66 + j * 40, 7, 0, TAU); c.fill();
    }
    c.fillStyle = C.coral;
    for (let s = 0; s < 3; s++) { c.beginPath(); c.roundRect(cx - 70, y + 118 + s * 15, 140, 9, 5); c.fill(); }
    c.restore();
  }

  // ---------- 悬浮参数计数卡（屏幕层，拍二）：白卡＋「参数量」＋滚动数字＋进度条 ----------
  function valTxt(lt) {
    const roll = (a, b, q) => { const v = a * Math.pow(b / a, ease.inOut(q)); return v < 10 ? v.toFixed(1) + 'B' : Math.min(999, Math.round(v)) + 'B'; };
    if (lt < 3.5) return '1.5B';
    if (lt < 4.42) return roll(1.5, 175, seg(lt, 3.5, 4.42));
    if (lt < 4.78) return '175B';
    if (lt < 5.58) return roll(175, 540, seg(lt, 4.78, 5.58));
    if (lt < 5.94) return '540B';
    if (lt < 6.32) return roll(540, 1000, seg(lt, 5.94, 6.32));
    return '1T+';
  }
  function counter(c, lt) {
    const on = ease.outBack(ss(3.12, 3.52, lt)); if (on <= 0.01) return;
    const fade = 1 - ss(8.8, 9.6, lt); if (fade <= 0.01) return;
    const x0 = 1390, y0 = 108, w = 432, h = 158;
    const pop = dmp(lt, 4.42, 0.07, 0.3, 0.3) + dmp(lt, 5.58, 0.07, 0.3, 0.3) + dmp(lt, 6.32, 0.11, 0.3, 0.4);   // 各档落定回弹
    const s = on * (1 + pop);
    c.save(); c.globalAlpha = fade;
    c.translate(x0 + w / 2, y0 + h / 2); c.scale(s, s); c.translate(-(x0 + w / 2), -(y0 + h / 2));
    c.save(); c.shadowColor = 'rgba(150,120,110,.26)'; c.shadowBlur = 18; c.shadowOffsetY = 9;
    c.fillStyle = C.white; c.beginPath(); c.roundRect(x0, y0, w, h, 26); c.fill(); c.restore();
    c.fillStyle = C.navy; c.font = '26px "PuHui-Bold"'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    c.fillText('参数量', x0 + 30, y0 + 52);
    c.font = '58px "Poppins-800"'; c.textAlign = 'right';
    c.fillText(valTxt(lt), x0 + w - 28, y0 + 116);
    c.fillStyle = C.mint; c.fillRect(x0 + 30, y0 + 132, w - 60, 9);
    c.fillStyle = C.coral; c.fillRect(x0 + 30, y0 + 132, (w - 60) * ss(3.5, 6.32, lt), 9);
    c.restore();
  }

  // ---------- 屏上字徽章（屏幕层）：藏青圆角块＋白字＋小号英文注，拍界压扁换字 ----------
  const SIGN = [
    { txt: '参数', size: 84, cap: 'PARAMETERS' },
    { txt: '疯狂卷参数', size: 62, cap: 'PARAMETER RACE' },
    { txt: '参数之外', size: 70, cap: 'BEYOND PARAMETERS' },
  ];
  function sign(c, lt) {
    const k = lt < 3 ? 0 : lt < 7 ? 1 : 2;
    const st = k === 0 ? -9 : (k === 1 ? 2.86 : 6.86);
    const q = seg(lt, st, st + 0.34);
    const squash = 1 - 0.24 * Math.sin(Math.PI * q);
    const S = (q < 0.5 && k > 0) ? SIGN[k - 1] : SIGN[k];
    c.save();
    c.font = `${S.size}px "PuHui-Heavy"`;
    const tw = c.measureText(S.txt).width;
    c.letterSpacing = '5px'; c.font = '17px "Poppins-800"';
    const cw2 = c.measureText(S.cap).width;
    c.letterSpacing = '0px';
    const w = Math.max(tw, cw2) + 84, h = 152, x0 = 108, y0 = 92;
    c.translate(x0 + w / 2, y0 + h / 2); c.scale(1, squash); c.translate(-(x0 + w / 2), -(y0 + h / 2));
    c.save(); c.shadowColor = 'rgba(150,120,110,.28)'; c.shadowBlur = 16; c.shadowOffsetY = 8;
    c.fillStyle = C.navy; c.beginPath(); c.roundRect(x0, y0, w, h, 30); c.fill(); c.restore();
    c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.font = `${S.size}px "PuHui-Heavy"`; c.fillStyle = C.white;
    c.fillText(S.txt, x0 + w / 2, y0 + 92);
    c.letterSpacing = '5px'; c.font = '17px "Poppins-800"'; c.fillStyle = C.yellow;
    c.fillText(S.cap, x0 + w / 2, y0 + 128);
    c.letterSpacing = '0px';
    c.restore();
  }

  // ---------- 拍三三张卡：书堆（数据）/ 齿轮（方法）/ 电池（算力），依次回弹升起 ----------
  const CARD = [
    { cx: 600, t0: 7.25, name: '数据' }, { cx: 960, t0: 7.85, name: '方法' }, { cx: 1320, t0: 8.45, name: '算力' },
  ];
  function books(c, cx, cy) {
    const rr = U.rng(33);
    let y = cy + 80;
    [[214, 30, C.navy], [192, 27, C.green], [170, 24, C.coral], [148, 22, C.yellow]].forEach(([w2, h2, col]) => {
      const ox = (rr() - 0.5) * 14;
      c.fillStyle = col; c.beginPath(); c.roundRect(cx - w2 / 2 + ox, y - h2, w2, h2, 7); c.fill();
      c.fillStyle = C.white; c.beginPath(); c.roundRect(cx + w2 / 2 + ox - 32, y - h2 + 5, 22, h2 - 10, 4); c.fill();
      c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(cx - w2 / 2 + ox + 8, y - h2 + 4, w2 - 52, 5);
      y -= h2;
    });
  }
  function gear(c, cx, cy, t) {
    c.save(); c.translate(cx, cy + 6); c.rotate(t * 0.5);
    c.fillStyle = C.yellow;
    for (let k = 0; k < 8; k++) { c.save(); c.rotate(k / 8 * TAU); c.beginPath(); c.roundRect(56, -12, 28, 24, 6); c.fill(); c.restore(); }
    c.beginPath(); c.arc(0, 0, 62, 0, TAU); c.fill();
    c.strokeStyle = C.yellowDk; c.lineWidth = 5; c.beginPath(); c.arc(0, 0, 44, 0, TAU); c.stroke();
    c.fillStyle = C.yellowDk; for (let k = 0; k < 3; k++) { const a = k / 3 * TAU; c.beginPath(); c.arc(Math.cos(a) * 32, Math.sin(a) * 32, 8.5, 0, TAU); c.fill(); }
    c.fillStyle = C.navy; c.beginPath(); c.arc(0, 0, 20, 0, TAU); c.fill();
    c.fillStyle = C.greenLt; c.beginPath(); c.arc(0, 0, 7, 0, TAU); c.fill();
    c.restore();
  }
  function batt(c, cx, cy, t) {
    const bx = cx - 78, by = cy - 42;
    c.fillStyle = C.green; c.beginPath(); c.roundRect(bx, by, 156, 86, 18); c.fill();
    c.fillStyle = C.greenDk; c.beginPath(); c.roundRect(bx + 10, by + 10, 132, 66, 12); c.fill();
    const n = 1 + (Math.floor(t * 1.3) % 3);
    c.fillStyle = C.yellow;
    for (let i = 0; i < 3; i++) { if (i >= n) continue; c.beginPath(); c.roundRect(bx + 18 + i * 42, by + 18, 34, 50, 6); c.fill(); }
    c.fillStyle = C.navy; c.beginPath(); c.roundRect(cx + 80, by + 26, 16, 34, 5); c.fill();
    c.fillStyle = 'rgba(255,255,255,.28)'; c.fillRect(bx + 10, by + 10, 132, 6);
  }
  function cards3(c, lt, t) {
    CARD.forEach((d, k) => {
      const p = ease.outBack(ss(d.t0, d.t0 + 1.05, lt)); if (p <= 0.01) return;
      const dy = (1 - p) * 300, cy = 765 + dy, cx = d.cx;
      c.save(); c.globalAlpha = clamp(p, 0, 1);
      c.save(); c.shadowColor = 'rgba(150,120,110,.26)'; c.shadowBlur = 20; c.shadowOffsetY = 10;
      c.fillStyle = C.white; c.beginPath(); c.roundRect(cx - 160, cy - 155, 320, 310, 26); c.fill(); c.restore();
      if (k === 0) books(c, cx, cy);
      else if (k === 1) gear(c, cx, cy, t);
      else batt(c, cx, cy, t);
      const aT = 0.96 * ss(0.16, 0.4, p);                                        // 铭牌：升卡半程后再写字（防半截）
      if (aT > 0.16) {
        c.globalAlpha = aT;
        const chy = cy + 93;
        c.fillStyle = C.navy; c.beginPath(); c.roundRect(cx - 62, chy - 21, 124, 42, 21); c.fill();
        c.fillStyle = C.white; c.font = '26px "PuHui-Bold"'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
        c.fillText(d.name, cx, chy + 9);
      }
      c.restore();
    });
  }
  // 三色同心环光圈收束（拍三）
  function rings(c, lt) {
    const cols = [C.coral, C.yellow, C.green];
    for (let k = 0; k < 3; k++) {
      const t0 = 8.95 + k * 0.22, q = ease.inOut(seg(lt, t0, t0 + 0.85));
      if (q <= 0 || q >= 1) continue;
      c.save(); c.globalAlpha = (1 - q) * 0.8; c.strokeStyle = cols[k]; c.lineWidth = 9;
      c.beginPath(); c.ellipse(960, 545, lerp(470, 130, q), lerp(300, 150, q), 0, 0, TAU); c.stroke();
      c.restore();
    }
  }
  // 签名式收尾：四角星＋两枚小加号
  function sparkle(c, lt) {
    const q = ease.outBack(ss(9.55, 9.9, lt)); if (q <= 0.01) return;
    const x = 960, y = 462;
    c.save(); c.globalAlpha = clamp(q, 0, 1); c.translate(x, y); c.rotate(-0.18 + q * 0.36); c.scale(q, q);
    c.fillStyle = C.yellow; c.beginPath();
    c.moveTo(0, -46); c.quadraticCurveTo(7, -7, 46, 0); c.quadraticCurveTo(7, 7, 0, 46); c.quadraticCurveTo(-7, 7, -46, 0); c.quadraticCurveTo(-7, -7, 0, -46); c.fill();
    c.fillStyle = C.white; c.beginPath(); c.arc(0, 0, 6, 0, TAU); c.fill();
    c.restore();
    [[-92, -38], [88, 44]].forEach(([ox, oy], i) => {
      const q2 = ease.outBack(ss(9.66 + i * 0.08, 9.98 + i * 0.08, lt)); if (q2 <= 0.01) return;
      c.save(); c.globalAlpha = clamp(q2, 0, 1) * 0.9; c.translate(x + ox, y + oy); c.scale(q2, q2);
      c.strokeStyle = C.coral; c.lineWidth = 7; c.lineCap = 'round';
      c.beginPath(); c.moveTo(-11, 0); c.lineTo(11, 0); c.moveTo(0, -11); c.lineTo(0, 11); c.stroke();
      c.restore();
    });
  }

  // 运镜：近景缓推 → 展开缓拉远 → 停住收稳（一个连续思路）
  function zoom(lt) {
    if (lt < 3) return 1 + 0.11 * ease.inOut(lt / 3);
    if (lt < 7) return 1.11 - 0.205 * ease.inOut((lt - 3) / 4);
    return 0.905 + 0.06 * ease.inOut(clamp((lt - 7) / 2.6, 0, 1));
  }

  return {
    init() {
      U.assertGlyphs('84px "PuHui-Heavy"', '参数疯狂卷之外', 's16_2026 屏上字');
      U.assertGlyphs('26px "PuHui-Bold"', '参数量数据方法算', 's16_2026 标签');
      U.assertGlyphs('58px "Poppins-800"', '0.73-1.2 2.4 1.5B 175B 540B 1T+ PARAMETERS RACE BEYOND 0123456789', 's16_2026 数字与英文');
    },
    draw(c, lt, t) {
      const b3 = ss(7, 8.6, lt);                                  // 拍三收稳
      const pulse = Math.sin(Math.PI * seg(lt, 6.32, 6.74));       // 1T+ 揭示：全脑小球一次同脉冲（唯一重音）
      c.drawImage(bg(), 0, 0);
      OVL.forEach((o, k) => { const a = ss(o.ramp[0], o.ramp[1], lt); if (a > 0.01) { c.save(); c.globalAlpha = a; c.drawImage(ovTex(k), 0, 0); c.restore(); } });
      c.save(); c.translate(960, 585); const z = zoom(lt); c.scale(z, z); c.translate(-960, -585);
      decos(c, t);
      sun(c, t);
      clouds(c, t);
      rack(c, 330, t, lt, 3.7, 1);
      rack(c, 1662, t, lt, 4.15, 2);
      brainLayer(c, lt, t, b3, pulse);
      rings(c, lt);
      cards3(c, lt, t);
      heroes(c, lt, t, b3);
      magnifier(c, lt, t);
      sparkle(c, lt);
      plants(c, t, lt);
      c.restore();
      sign(c, lt);
      counter(c, lt);
    },
  };
})();
