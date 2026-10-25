// 中国皮影戏 ·「大模型参数」三问 · s34_shadowpuppet —— 幕布上的「参数星图」（35 风格横向对比样片之一）。
// 参数＝皮影雕花件镂空花纹里的孔点：油灯在幕后，光从镂孔里透出来就是一颗颗星。
// 三拍单镜（近景端详 → 缓拉远看全网 → 收稳），整支一个连续运镜：
//   拍一 0–3s「参数」：两三件小皮影雕花件（红如意、琥珀花窗、蓝方胜）被操纵杆吊进光里，
//     绕铆钉僵直摆动，孔点随灯焰明灭，旁边灯影小数字 0.73 / -1.2 / 2.4，红底条幅垂落题「参数」。
//   拍二 3–7s「疯狂卷参数」：三十余件雕花件被杆子一片片翻入（10fps 步进），从三件主角件向外
//     连缀成「参数星图」——链索蔓延、孔点增殖成满天星；右缘题记账册竖排点亮滚动
//     1.5B→175B→540B→1T+，灯心随密度变亮、幕布边缘加深；1T+ 时光波从网心扫过一遍、孔点齐亮。
//   拍三 7–10s「参数之外」：增殖停住；书函（数据）、罗盘（方法）、宫灯（算力）被杆子吊入列升起，
//     罗盘针缓摆定向，幕后点灯：灯焰窜亮、宫灯点亮，孔点从变多转为变亮变精（提亮＋描金晕圈），
//     网件摆动收稳；吊匾落「参数之外」。
// 管线照 34 号卡：影窗（幕后油灯的径向暖光＋screen 灯芯热点＋布纹缓存，灯焰连续扰动）→
//   皮件在离屏层上 piece()（填色→destination-out 镂孔刻纹→补皮边→深褐描边）→ 印到幕布
//   ＝偏移软影（÷4 降采上采代替 blur 滤镜，性能坑）＋multiply 本体（皮子透光＝幕布色×皮色）→
//   铆钉、操纵杆、孔点星、铭文 → 木框。
// 关键约定：皮件动作全部走 10fps stepTime（杆操的僵直一顿一顿，风格程式）；灯焰光心、孔点明灭、
//   题字淡入、计数滚动、运镜是连续的——qa 的运动底线靠它们撑，皮件的步进永远不整屏重洗（跳变 0）。
// 性能：静态布纹/旧渍/木框全部缓存；软影用降采上采（不用 filter:blur）；星点按亮度分桶三笔填。
// 无角色：只有物件雕件。做旧（旧渍、暗角）只上幕布背景。
SCENES['s34_shadowpuppet'] = (() => {
  const W = 1920, H = 1080, TAU = Math.PI * 2;
  const { clamp, lerp, rng, ss, ease, hash } = U, P = PAINT, K = P.carve;
  const RED = '#c0352a', GRN = '#2f7d4c', AMB = '#d99a2e', YEL = '#e2bd4a', BLU = '#2c5a8a', ORG = '#d9782a', EDGE = '#3a160a', CREAM = '#efe2c4', INK = '#4a2410';
  const STAR = ['rgba(196,150,88,.9)', 'rgba(244,214,150,.92)', 'rgba(255,244,202,.95)'];   // 孔点三档：暗 / 亮 / 极亮
  const step = (t, fps = 10) => U.stepTime(t, fps);
  const piece = (g, path, col, carve, edge = 5) => P.piece(g, path, col, carve, { edge, line: EDGE });
  const NETC = [960, 500];                       // 星图网心

  // ---------- 形状库（局部坐标，形心在 0,0） ----------
  const hexP = (rx, ry) => { const p = new Path2D(); for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + k * Math.PI / 3, x = Math.cos(a) * rx, y = Math.sin(a) * ry; k ? p.lineTo(x, y) : p.moveTo(x, y); } p.closePath(); return p; };
  const ruyiP = (r) => { const p = new Path2D(); [[-0.62, 0.1, 0.56], [0.62, 0.1, 0.56], [0, -0.3, 0.72]].forEach(([dx, dy, f]) => { p.moveTo(dx * r + f * r, dy * r); p.arc(dx * r, dy * r, f * r, 0, TAU); }); return p; };
  const diaP = (r) => { const p = new Path2D(); [[-0.46, 0], [0.46, 0]].forEach(([dx]) => { p.moveTo(dx * r, -r); p.lineTo(dx * r + r * 0.72, 0); p.lineTo(dx * r, r); p.lineTo(dx * r - r * 0.72, 0); p.closePath(); }); return p; };
  const rectP = (w, h) => { const p = new Path2D(); p.rect(-w / 2, -h / 2, w, h); return p; };
  const stripP = (w, h) => { const p = new Path2D(); p.moveTo(-w / 2, -h / 2); p.lineTo(w / 2, -h / 2); p.lineTo(w / 2, h / 2 - 16); p.lineTo(0, h / 2 + 12); p.lineTo(-w / 2, h / 2 - 16); p.closePath(); return p; };
  const plaqueP = (w, h) => { const p = new Path2D(); const c = 20; p.moveTo(-w / 2 + c, -h / 2); p.lineTo(w / 2 - c, -h / 2); p.lineTo(w / 2, -h / 2 + c); p.lineTo(w / 2, h / 2 - c); p.lineTo(w / 2 - c, h / 2); p.lineTo(-w / 2 + c, h / 2); p.lineTo(-w / 2, h / 2 - c); p.lineTo(-w / 2, -h / 2 + c); p.closePath(); return p; };
  const kiteP = (ln, ls, w) => { const p = new Path2D(); p.moveTo(0, -ln); p.lineTo(w, 0); p.lineTo(0, ls); p.lineTo(-w, 0); p.closePath(); return p; };

  // ---------- 皮件：镂孔＝星点。孔的局部坐标既用来刻也用来画星，一一对位 ----------
  const NR = rng(20261024), NS = rng(7341);
  const mkHoles = (r) => { const n = Math.round(4 + r / 13), hs = []; for (let i = 0; i < n; i++) { const a = NR() * TAU, d = NR() * r * 0.58; hs.push({ dx: Math.cos(a) * d, dy: Math.sin(a) * d * 0.92, r: 4 + NR() * 3 }); } return hs; };
  const carveHoles = (hs, extra) => (q) => { hs.forEach(hh => { q.beginPath(); q.arc(hh.dx, hh.dy, hh.r, 0, TAU); q.fill(); }); if (extra) extra(q); };
  const spokes = (r) => (q) => { q.lineWidth = 2.2; q.beginPath(); for (let k = 0; k < 3; k++) { const a = Math.PI / 6 + k * Math.PI / 3 * 2; q.moveTo(0, 0); q.lineTo(Math.cos(a) * r * 0.86, Math.sin(a) * r * 0.86); } q.stroke(); };
  const arcs2 = (r) => (q) => { q.lineWidth = 2.6; [-0.52, 0.52].forEach(f => { q.beginPath(); q.arc(f * r, r * 0.42, r * 0.42, Math.PI * 0.12, Math.PI * 0.88); q.stroke(); }); };
  const cross = (r) => (q) => { K.lines(q, [[[-r * 0.3, -r * 0.3], [r * 0.3, r * 0.3]], [[r * 0.3, -r * 0.3], [-r * 0.3, r * 0.3]]], 2.4); };

  // ---------- 幕顶坠饰（拍一即有，贯穿全片的小循环） ----------
  const PENDX = [300, 540, 760, 1416, 1650];
  const pendants = PENDX.map((ax, i) => { const r = 26 + NR() * 10, len = 96 + NR() * 42;
    return { kind: 'pend', ax, len, r, type: ['ruyi', 'dia', 'hex'][i % 3], col: [GRN, YEL, RED, BLU, ORG][i], born: -1,
      holes: mkHoles(r * 0.62), sway: 0.1 + NR() * 0.035, f: 1.0 + NR() * 0.5, ph: NR() * TAU }; });

  // ---------- 三件主角皮件（孔点＝参数本体） ----------
  const heroes = [
    { x: 760, y: 505, r: 88, type: 'ruyi', col: RED, born: 0.35, num: '0.73', nx: 886, ny: 496 },
    { x: 1122, y: 445, r: 78, type: 'hex', col: AMB, born: 0.55, num: '-1.2', nx: 1240, ny: 432 },
    { x: 948, y: 340, r: 72, type: 'dia', col: BLU, born: 0.75, num: '2.4', nx: 1052, ny: 332 },
  ].map((h) => { h.kind = 'hero'; h.holes = mkHoles(h.r); h.rise = 168; h.a0 = (NR() < 0.5 ? -1 : 1) * (0.4 + NR() * 0.3); h.amp = 0.028 + NR() * 0.014; h.f = 2.2 + NR() * 0.9; h.ph = NR() * TAU; return h; });

  // ---------- 雕花件网络（种子生成；出生序＝离三件主角的距离，从主角向外增殖） ----------
  const EXCL = [ // 条幅带 / 拍二题字带 / 账册带 / 三物落位带 / 吊匾带：网件不落进去（重叠相乘发黑的老坑）
    [176, 235, 316, 571], [1450, 110, 1586, 662], [1586, 453, 1760, 913],
    [244, 589, 616, 821], [811, 569, 1109, 841], [1359, 529, 1661, 831], [806, 95, 1174, 215],
  ];
  const inExcl = (x, y, rr) => (y - rr < 300 && x > 240 && x < 1780) ||
    EXCL.some(([x0, y0, x1, y1]) => x + rr > x0 - 26 && x - rr < x1 + 26 && y + rr > y0 - 26 && y - rr < y1 + 26);
  const pickCol = () => { const v = NR(); return v < 0.24 ? RED : v < 0.46 ? AMB : v < 0.62 ? YEL : v < 0.76 ? ORG : v < 0.9 ? GRN : BLU; };
  const center = { kind: 'node', x: 960, y: 500, r: 56, type: 'hex', col: YEL, born: 3.14, rise: 150, a0: 0.5, amp: 0.03, f: 1.7, ph: 1, holes: mkHoles(56) };
  const nodes = [];
  const okSpot = (x, y, rr) => !inExcl(x, y, rr) &&
    !heroes.some(hh => Math.hypot(x - hh.x, y - hh.y) < hh.r + 118 + rr) &&
    Math.hypot(x - 960, y - 500) > 56 + rr + 30 &&
    !nodes.some(q => Math.hypot(x - q.x, y - q.y) < q.r + rr + 24);
  const rings = [[6, 182, 124, 40], [9, 356, 212, 38], [13, 566, 258, 34]];
  rings.forEach(([n, rx, ry, r0]) => { for (let k = 0; k < n; k++) { let ok = false, x = 0, y = 0, rr = 0, tr = 0;
    while (!ok && tr++ < 40) { const a = -Math.PI / 2 + (k + 0.5) / n * TAU + (NR() - 0.5) * 0.5;
      x = 960 + Math.cos(a) * (rx + (NR() - 0.5) * 66); y = 500 + Math.sin(a) * (ry + (NR() - 0.5) * 56);
      rr = r0 * (0.78 + NR() * 0.55); ok = okSpot(x, y, rr); }
    if (ok) nodes.push({ kind: 'node', x, y, r: rr, type: ['hex', 'ruyi', 'dia'][(NR() * 3) | 0], col: pickCol(), holes: mkHoles(rr) }); } });
  for (let k = 0; k < 8; k++) { let ok = false, x = 0, y = 0, rr = 0, tr = 0;   // 内圈填缝件
    while (!ok && tr++ < 40) { const a = NR() * TAU, d = 0.3 + NR() * 0.62;
      x = 960 + Math.cos(a) * 566 * d * 0.92; y = 500 + Math.sin(a) * 258 * d; rr = 24 + NR() * 16; ok = okSpot(x, y, rr); }
    if (ok) nodes.push({ kind: 'node', x, y, r: rr, type: ['ruyi', 'hex', 'dia'][(NR() * 3) | 0], col: pickCol(), holes: mkHoles(rr) }); }
  nodes.forEach(nd => { nd.rise = 150 + NR() * 62; nd.a0 = (NR() < 0.5 ? -1 : 1) * (0.34 + NR() * 0.4); nd.amp = 0.02 + NR() * 0.02; nd.f = 1.5 + NR() * 1.1; nd.ph = NR() * TAU;
    nd.born = clamp(3.2 + Math.min(...heroes.map(hh => Math.hypot(nd.x - hh.x, nd.y - hh.y))) / 620 * 2.5 + NR() * 0.5, 3.2, 6.42); });
  nodes.sort((a, b) => a.born - b.born);        // 画序＝出生序：新件压旧件，增殖方向读得出来

  // 链索：每件连向已生的最近一两件；主角件也入网
  const netAll = [center, ...heroes, ...nodes];
  const LINKS = [];
  const link = (a, b) => { if (Math.hypot(a.x - b.x, a.y - b.y) < 620) LINKS.push({ a, b, born: Math.max(a.born, b.born) + 0.16 }); };
  nodes.forEach(nd => { const cand = netAll.filter(q => q !== nd && q.born <= nd.born).sort((p, q) => Math.hypot(p.x - nd.x, p.y - nd.y) - Math.hypot(q.x - nd.x, q.y - nd.y));
    if (cand[0]) link(nd, cand[0]); if (cand[1] && Math.hypot(cand[1].x - nd.x, cand[1].y - nd.y) < 380) link(nd, cand[1]); });
  link(center, heroes[0]); link(center, heroes[1]); link(heroes[0], heroes[2]); link(heroes[1], heroes[2]);

  // ---------- 拍三：三件皮影物 + 皮签铭牌 + 吊匾 + 条幅 ----------
  const books = [
    { x: 410, y: 741, w: 230, h: 54, col: BLU, born: 7.2 }, { x: 407, y: 692, w: 218, h: 50, col: GRN, born: 7.27 }, { x: 410, y: 646, w: 204, h: 46, col: BLU, born: 7.34 },
  ].map((b, i) => ({ kind: 'book', ...b, rise: 150 + i * 8, a0: (i - 1) * 0.1, amp: 0.008, f: 1.2 + i * 0.3, ph: i * 2 }));
  const compass = { kind: 'disc', x: 960, y: 712, r: 92, born: 7.52, rise: 150, a0: 0.3, amp: 0.012, f: 1.3, ph: 0.5 };
  const lantern = { kind: 'lant', x: 1500, y: 688, born: 7.8, rise: 170, a0: 0.14, amp: 0.02, f: 0.9, ph: 2.2 };
  const tags = [
    { txt: '数据', ax: 566, ay: 616, str: [505, 644], born: 7.42 },
    { txt: '方法', ax: 1096, ay: 664, str: [1042, 694], born: 7.72 },
    { txt: '算力', ax: 1622, ay: 668, str: [1570, 660], born: 8.02 },
  ].map((tg, i) => ({ kind: 'tag', ...tg, len: 64, r: 0, col: CREAM, sway: 0.06, f: 1.15 + i * 0.25, ph: i * 2.4, holes: [], born2: tg.born }));
  const strip = { kind: 'strip', x: 245, w: 112, h: 300, col: '#8a2a20', born: 0.22 };
  const plaque = { kind: 'plaque', x: 990, w: 352, h: 96, col: RED, born: 7.62 };

  // ---------- 星点（孔点）登记：明灭频率、相位、描金资格 ----------
  const stars = [];
  [...pendants, ...heroes, center, ...nodes].forEach(p => p.holes.forEach(hh =>
    stars.push({ p, h: hh, f: 1.1 + NS() * 2.1, ph: NS() * TAU, th: 0.08 + NS() * 0.7, elite: NS() < 0.17 })));

  // ---------- 计数（真实序列，题记账册竖排点亮） ----------
  const SEGS = [[3.35, 1.5], [4.2, 175], [5.2, 540], [6.3, 1000]];
  const valAt = (lt) => { if (lt < SEGS[0][0]) return SEGS[0][1] * ss(3.16, 3.35, lt); if (lt >= 6.3) return 1000;
    for (let i = 0; i < 3; i++) { if (lt < SEGS[i + 1][0]) { const [t0, v0] = SEGS[i], [t1, v1] = SEGS[i + 1]; return Math.exp(lerp(Math.log(v0), Math.log(v1), ss(t0, t1, lt))); } } return 1000; };
  const fmtB = (v) => v >= 1000 ? '1T+' : (v >= 10 ? Math.round(v) + 'B' : v.toFixed(1) + 'B');

  // ---------- 静态缓存：布纹＋旧渍（做旧只上背景） ----------
  const weave = () => P.cached('s34_weave', 2160, 1240, (g) => {
    g.fillStyle = '#fff'; g.fillRect(0, 0, 2160, 1240);
    g.strokeStyle = 'rgba(120,90,50,.08)'; g.lineWidth = 1;
    for (let x = 0; x < 2160; x += 3) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 1240); g.stroke(); }
    for (let y = 0; y < 1240; y += 3) { g.beginPath(); g.moveTo(0, y); g.lineTo(2160, y); g.stroke(); }
    g.drawImage(P.grain('s34g', 0.06, [120, 80, 40], 0.3), -120, -120, 2160, 1240);
    const r = rng(84); g.globalCompositeOperation = 'multiply';         // 旧渍
    for (let i = 0; i < 26; i++) { const x = r() * 2160, y = r() * 1240, rr = 26 + r() * 96;
      const gg = g.createRadialGradient(x, y, 0, x, y, rr); gg.addColorStop(0, `rgba(122,86,44,${0.05 + r() * 0.09})`); gg.addColorStop(1, 'rgba(122,86,44,0)');
      g.fillStyle = gg; g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill(); }
  });
  const frame = () => P.cached('s34_frame', W, H, (g) => {
    g.fillStyle = '#2a140a'; g.beginPath(); g.rect(0, 0, W, H); g.rect(28, 24, W - 56, H - 48); g.fill('evenodd');
    g.strokeStyle = '#a8742e'; g.lineWidth = 3; g.strokeRect(34, 30, W - 68, H - 60);
    const corner = (cx, cy, sx, sy) => { g.save(); g.translate(cx, cy); g.scale(sx, sy); const p = new Path2D();
      [[-6, 6, 13], [12, 8, 11], [2, -4, 15]].forEach(([dx, dy, rr]) => { p.moveTo(dx + rr, dy); p.arc(dx, dy, rr, 0, TAU); });
      g.fillStyle = '#3a1c0c'; g.fill(p); g.restore(); };
    corner(66, 60, 1, 1); corner(1854, 60, -1, 1); corner(66, 1020, 1, -1); corner(1854, 1020, -1, -1);
    const vg = g.createRadialGradient(960, 500, 500, 960, 540, 1150); vg.addColorStop(0, 'rgba(40,15,0,0)'); vg.addColorStop(1, 'rgba(40,15,0,.45)');
    g.fillStyle = vg; g.fillRect(28, 24, W - 56, H - 48);
  });

  // ---------- 影窗：幕后油灯（灯焰连续扰动＝孔点明灭之源） ----------
  function screenDraw(c, t, lt) {
    const fl = 0.5 * P.noise(t * 3, 1) + 0.3 * P.noise(t * 9, 4);
    const dens = ss(3.1, 6.5, lt), lit = ss(7.9, 8.8, lt);
    const cx = 960 + fl * 26, cy = 480 + P.noise(t * 2, 7) * 18;
    const g = c.createRadialGradient(cx, cy, 30, cx, cy + 40, 1150);
    g.addColorStop(0, `rgb(255,${246 + fl * 8 + lit * 6},${214 + fl * 20 + lit * 18})`);
    g.addColorStop(0.35, '#f2d7a0'); g.addColorStop(0.7, '#cf9a58'); g.addColorStop(1, '#7a4a20');
    c.fillStyle = g; c.fillRect(-160, -160, W + 320, H + 320);
    c.save(); c.globalCompositeOperation = 'screen';
    const hg = c.createRadialGradient(cx, cy - 10, 0, cx, cy - 10, 260 + dens * 330 + lit * 70 + fl * 40);
    hg.addColorStop(0, `rgba(255,236,190,${0.5 + fl * 0.22 + lit * 0.2})`); hg.addColorStop(1, 'rgba(255,236,190,0)');
    c.fillStyle = hg; c.fillRect(-160, -160, W + 320, H + 320); c.restore();
    c.save(); c.globalCompositeOperation = 'multiply'; c.drawImage(weave(), -120, -120); c.restore();
    if (dens > 0.02) { c.save(); c.globalCompositeOperation = 'multiply';                 // 密度升级：幕缘加深
      const vg = c.createRadialGradient(960, 500, 430, 960, 540, 1250); vg.addColorStop(0, 'rgba(122,74,32,0)'); vg.addColorStop(1, `rgba(122,74,32,${0.22 * dens})`);
      c.fillStyle = vg; c.fillRect(-160, -160, W + 320, H + 320); c.restore(); }
    return fl;
  }

  // ---------- 姿态（10fps 步进）：每件皮件绕铆钉的僵直摆动＋吊入轨迹 ----------
  function poseOf(p, ls, lt, calm) {
    if (p.kind === 'pend' || p.kind === 'tag') {
      const q = p.kind === 'tag' ? ss(p.born2, p.born2 + 0.42, ls) : 1;
      const d = p.kind === 'tag' ? lerp(p.len - 62, p.len, ease.out(q)) : p.len;
      const calmP = 1 - 0.45 * ss(7.2, 9.4, ls);          // 坠饰只收敛一半，别把幕顶拍死
      return { vis: ls >= (p.kind === 'tag' ? p.born2 : p.born), px: p.ax, py: p.ay, ang: p.sway * Math.sin(ls * p.f * 3.4 + p.ph) * calmP * q, d, alpha: 1 };
    }
    if (p.kind === 'strip') {
      const q = ss(p.born, p.born + 0.55, ls), up = ss(2.72, 3.22, ls);
      const cy = lerp(122, 402, ease.out(q)) - 212 * ease.inOut(up);
      return { vis: true, px: p.x, py: cy - 158, ang: 0.02 * Math.sin(ls * 3.1 + 1) * calm, d: 158, alpha: ss(0.2, 0.38, lt) * (1 - ss(3.0, 3.28, lt)) };
    }
    if (p.kind === 'plaque') {
      const q = ss(p.born, p.born + 0.5, ls);
      const cy = lerp(54, 158, ease.out(q));
      return { vis: ls >= p.born, px: p.x, py: cy - 62, ang: 0.012 * Math.sin(ls * 2.6) * calm * q, d: 62, alpha: 1 };
    }
    if (p.kind === 'lant') {
      const q = ss(p.born, p.born + 0.5, ls), e = ease.out(q);
      const cy = p.y + (1 - e) * p.rise;
      return { vis: ls >= p.born, px: p.x, py: cy - 112, ang: p.a0 * (1 - e) + p.amp * Math.sin(ls * p.f + p.ph) * q * calm, d: 112, alpha: 1, cy };
    }
    const q = ss(p.born, p.born + 0.45, ls), e = ease.out(q);
    const cy = p.y + (1 - e) * p.rise;
    const ang = p.a0 * (1 - e) + (p.amp || 0.03) * Math.sin(ls * (p.f || 1.8) + (p.ph || 0)) * q * calm;
    if (p.kind === 'hero') return { vis: ls >= p.born, px: p.x, py: cy - p.r - 16, ang, d: p.r + 16, alpha: 1, cy };
    return { vis: ls >= p.born, px: p.x, py: cy, ang, d: 0, alpha: 1, cy };
  }
  const holeWorld = (pose, dx, dy) => { const co = Math.cos(pose.ang), si = Math.sin(pose.ang), vx = dx, vy = dy + pose.d;
    return [pose.px + vx * co - vy * si, pose.py + vx * si + vy * co]; };

  const shapePath = (p) => p.type === 'ruyi' ? ruyiP(p.r) : p.type === 'dia' ? diaP(p.r) : p.type === 'hex' ? hexP(p.r * 0.92, p.r * 0.82) : null;

  const rod = (c, A, B, a = 0.8) => { c.save(); c.globalCompositeOperation = 'multiply'; c.strokeStyle = `rgba(60,30,12,${a})`; c.lineWidth = 5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.stroke(); c.restore(); };

  return {
    init() { U.assertGlyphs('LXGWWenKai-500', '参数疯狂卷之外数据方法算力0123456789.-+BT', 's34_shadowpuppet 屏上字'); },
    draw(c, lt, t) {
      const ls = step(lt), calm = 1 - 0.85 * ss(7.2, 9.4, ls);
      const z = lt < 3 ? 1.05 + 0.11 * ss(0.15, 3, lt) : lt < 7.1 ? 1.16 - 0.19 * ss(3, 7.1, lt) : 0.97 + 0.04 * ss(7.05, 9.6, lt);
      c.save(); c.translate(960, 540); c.scale(z, z); c.translate(-960, -540);
      screenDraw(c, t, lt);

      // 姿态表
      const ALL = [...pendants, strip, ...heroes, ...books, compass, lantern, center, ...nodes, ...tags, plaque];
      const POSE = new Map(); ALL.forEach(p => POSE.set(p, poseOf(p, ls, lt, calm)));
      const PZ = (p) => POSE.get(p);

      // ---------- 皮件层（离屏：镂孔刻纹不能打穿幕布） ----------
      const L = P.scratch('s34L'), g = L.getContext('2d'); g.reset();
      // 链索（先画，被皮件压住端头）
      g.strokeStyle = 'rgba(58,22,10,.8)'; g.lineWidth = 2.6; g.lineCap = 'round'; g.beginPath();
      LINKS.forEach(lk => { if (ls < lk.born) return; const a = PZ(lk.a), b = PZ(lk.b);
        g.moveTo(a.px, a.py + a.d); g.lineTo(b.px, b.py + b.d); }); g.stroke();
      // 皮件（画序即数组序：坠饰→条幅→主角→三物→网→签→匾；出生都带 0.16s 淡入，没有整件硬蹦出来）
      const emit = (p, path, col, carve, edge) => { const po = PZ(p); if (!po.vis) return;
        g.save(); g.globalAlpha = po.alpha * ss(p.born, p.born + 0.16, lt); g.translate(po.px, po.py); g.rotate(po.ang); g.translate(0, po.d);
        piece(g, path, col, carve, edge); g.restore(); };
      pendants.forEach(p => emit(p, shapePath(p), p.col, carveHoles(p.holes), 4));
      emit(strip, stripP(strip.w, strip.h), strip.col, (q) => { q.lineWidth = 3; q.beginPath(); q.moveTo(-44, -132); q.lineTo(44, -132); q.moveTo(-44, 132); q.lineTo(44, 132); q.stroke(); }, 4);
      heroes.forEach(p => emit(p, shapePath(p), p.col, carveHoles(p.holes, p.type === 'hex' ? spokes(p.r) : p.type === 'ruyi' ? arcs2(p.r) : cross(p.r))));
      books.forEach((b, i) => emit(b, rectP(b.w, b.h), b.col, (q) => { const x0 = -b.w / 2 + 18; q.lineWidth = 2.6;
        q.beginPath(); q.moveTo(x0, -b.h / 2 + 6); q.lineTo(x0, b.h / 2 - 6); q.moveTo(x0 + 7, -b.h / 2 + 6); q.lineTo(x0 + 7, b.h / 2 - 6); q.stroke(); }, 4));
      emit(compass, (() => { const p = new Path2D(); p.arc(0, 0, compass.r, 0, TAU); return p; })(), AMB, (q) => {
        q.lineWidth = 3; q.beginPath(); q.arc(0, 0, compass.r * 0.8, 0, TAU); q.stroke(); q.lineWidth = 2;
        q.beginPath(); q.arc(0, 0, compass.r * 0.62, 0, TAU); q.stroke();
        q.lineWidth = 2.6; q.beginPath(); for (let k = 0; k < 24; k++) { const a = k / 24 * TAU, r0 = k % 6 === 0 ? 52 : 62;
          q.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); q.lineTo(Math.cos(a) * 74, Math.sin(a) * 74); } q.stroke();
        q.lineWidth = 2.4; q.beginPath(); for (let a = 0; a < 7; a += 0.3) { const rr = 2 + a * 1.9, x = Math.cos(a) * rr, y = Math.sin(a) * rr; a ? q.lineTo(x, y) : q.moveTo(x, y); } q.stroke(); }, 4);
      { const po = PZ(compass), cst = ss(8.1, 9.2, ls);                                    // 罗盘针（缓摆定向）
        if (po.vis) { g.save(); g.globalAlpha = ss(compass.born, compass.born + 0.16, lt); g.translate(po.px, po.py);
          g.rotate(lerp(-2.35, -1.78, cst) + (1 - cst) * 0.3 * Math.sin(ls * 3.4) + 0.05 * Math.sin(ls * 2.1) * (1 - 0.6 * cst));
          piece(g, kiteP(58, 34, 9), EDGE, (q) => { q.lineWidth = 2; q.beginPath(); q.moveTo(0, -58); q.lineTo(0, 34); q.stroke(); }, 3); g.restore(); } }
      { const po = PZ(lantern);                                                            // 宫灯（框＋深色灯壁＋上下座）
        if (po.vis) { g.save(); g.globalAlpha = ss(lantern.born, lantern.born + 0.16, lt); g.translate(po.px, po.py); g.rotate(po.ang); g.translate(0, po.d);
          const fr = (() => { const p = new Path2D(); [[-74, -88], [74, -88], [100, 0], [74, 88], [-74, 88], [-100, 0]].forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y)); p.closePath(); return p; })();
          piece(g, fr, RED, null, 4);
          const ip = (() => { const p = new Path2D(); [[-52, -66], [52, -66], [70, 0], [52, 66], [-52, 66], [-70, 0]].forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y)); p.closePath(); return p; })();
          piece(g, ip, '#7a4a1e', (q) => { q.lineWidth = 2.6; q.beginPath(); q.moveTo(-30, -66); q.lineTo(-30, 66); q.moveTo(0, -66); q.lineTo(0, 66); q.moveTo(30, -66); q.lineTo(30, 66); q.stroke(); }, 3);
          g.translate(0, -101); piece(g, rectP(96, 16), '#4a2008', null, 3);
          g.translate(0, 202); piece(g, rectP(110, 18), '#4a2008', null, 3);
          g.restore(); } }
      center && emit(center, shapePath(center), center.col, carveHoles(center.holes, spokes(center.r)));
      nodes.forEach(p => emit(p, shapePath(p), p.col, carveHoles(p.holes, p.type === 'hex' ? spokes(p.r) : p.type === 'ruyi' ? arcs2(p.r) : cross(p.r))));
      tags.forEach(p => emit(p, stripP(46, 84), CREAM, (q) => { q.lineWidth = 2.4; q.strokeRect(-17, -34, 34, 68); }, 3));
      emit(plaque, plaqueP(plaque.w, plaque.h), plaque.col, (q) => { q.lineWidth = 3; q.strokeRect(-154, -38, 308, 76);
        q.lineWidth = 2; q.strokeRect(-146, -30, 292, 60); q.beginPath(); [[-164, -44], [164, -44], [-164, 44], [164, 44]].forEach(([x, y]) => { q.moveTo(x + 4, y); q.arc(x, y, 4, 0, TAU); }); q.fill(); }, 4);

      // 印到幕布：偏移软影（÷4 降采上采代替 blur 滤镜）＋multiply 本体
      const S = P.cached('s34S', 480, 270, () => {}), sg = S.getContext('2d'); sg.reset();
      sg.clearRect(0, 0, 480, 270); sg.drawImage(L, 0, 0, 480, 270);
      c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.24; c.drawImage(S, 0, 0, 480, 270, 8, 6, W, H); c.restore();
      c.save(); c.globalCompositeOperation = 'multiply'; c.drawImage(L, 0, 0); c.restore();

      // 1T+ 光波（重音一次：光波从网心扫过，孔点随之齐亮）
      const q1 = ss(6.55, 7.35, lt), frontR = 60 + 980 * q1;
      if (q1 > 0 && q1 < 1) { c.strokeStyle = `rgba(217,154,46,${0.3 * Math.sin(q1 * Math.PI)})`; c.lineWidth = 6;
        c.beginPath(); c.arc(NETC[0], NETC[1], frontR, 0, TAU); c.stroke(); }

      // 操纵杆（主角杆在网连缀成后撤走；三物杆吊入）
      const rodA = 1 - ss(3.1, 3.6, lt);
      if (rodA > 0.02) { heroes.forEach((p, i) => { const po = PZ(p); if (po.vis) rod(c, [po.px, po.py], [p.x + (i - 1) * 66, 1082], 0.8 * rodA); }); }
      { const po = PZ(strip); rod(c, [po.px, po.py], [245, 26], 0.7 * po.alpha); }
      { const po = PZ(plaque), q = ss(plaque.born, plaque.born + 0.5, ls); if (q > 0) rod(c, [po.px, po.py], [990, 26], 0.7 * Math.min(1, q * 2)); }
      books.forEach((b, i) => { const po = PZ(b); if (po.vis) rod(c, [b.x + 60, po.py + po.d + b.h / 2], [430 + i * 14, 1082], 0.7); });
      { const po = PZ(compass); if (po.vis) rod(c, [960, po.py + 100], [918, 1082], 0.7); }
      { const po = PZ(lantern); if (po.vis) rod(c, [po.px, po.py], [1500, 26], 0.7); }
      pendants.forEach(p => { const po = PZ(p); rod(c, [p.ax, 84], [p.ax, 0], 0.6); });
      tags.forEach(p => { const po = PZ(p); if (po.vis) { c.strokeStyle = 'rgba(60,30,12,.7)'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(p.str[0], p.str[1]); c.lineTo(p.ax, p.ay); c.stroke(); } });

      // 铆钉（深孔＋黄铜芯，两笔批量）
      const riv = [];
      pendants.forEach(p => riv.push([p.ax, 84, 5])); heroes.forEach(p => { const po = PZ(p); if (po.vis) riv.push([po.px, po.py, 7]); });
      center && (() => { const po = PZ(center); if (po.vis) riv.push([po.px, po.py, 6]); })();
      nodes.forEach(p => { const po = PZ(p); if (po.vis) riv.push([po.px, po.py, 3.6]); });
      LINKS.forEach(lk => { if (ls < lk.born) return; const a = PZ(lk.a), b = PZ(lk.b); riv.push([(a.px + b.px) / 2, (a.py + a.d + b.py + b.d) / 2, 3]); });
      { const po = PZ(compass); if (po.vis) riv.push([po.px, po.py, 6]); }
      c.fillStyle = '#2a1006'; c.beginPath(); riv.forEach(([x, y, r]) => { c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU); }); c.fill();
      c.fillStyle = '#b07a3a'; c.beginPath(); riv.forEach(([x, y, r]) => { const rr = r * 0.42; c.moveTo(x - 1 + rr, y - 1); c.arc(x - 1, y - 1, rr, 0, TAU); }); c.fill();

      // ---------- 孔点星（参数本体：明灭三档；拍三提亮描金） ----------
      const b3 = ss(7.35, 8.6, lt), bk = [[], [], []], halo = [];
      stars.forEach(st => { const po = PZ(st.p); if (!po || !po.vis) return;
        const [wx, wy] = holeWorld(po, st.h.dx, st.h.dy);
        const v = 0.5 + 0.5 * Math.sin(t * st.f * TAU + st.ph);
        let lv = v < 0.34 ? 0 : v < 0.8 ? 1 : 2;
        if (q1 > 0 && q1 < 1 && Math.abs(Math.hypot(wx - NETC[0], wy - NETC[1]) - frontR) < 130) lv = Math.min(2, lv + 1);
        if (b3 > st.th) { lv = Math.min(2, lv + 1); if (st.elite) halo.push([wx, wy, st.h.r + 3.6]); }
        bk[lv].push([wx, wy, st.h.r * (0.66 + lv * 0.3)]); });
      bk.forEach((list, lv) => { if (!list.length) return; c.fillStyle = STAR[lv]; c.beginPath();
        list.forEach(([x, y, r]) => { c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU); }); c.fill(); });
      if (halo.length) { c.strokeStyle = 'rgba(217,154,46,.85)'; c.lineWidth = 2.2; c.beginPath();
        halo.forEach(([x, y, r]) => { c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU); }); c.stroke(); }

      // ---------- 宫灯点灯（幕后灯焰窜亮） ----------
      { const po = PZ(lantern), qL = ss(8.0, 8.6, lt);
        if (po.vis && qL > 0) { const fx = po.px, fy = po.py + po.d;
          c.save(); c.globalCompositeOperation = 'screen';
          const gg = c.createRadialGradient(fx, fy, 8, fx, fy, 300); gg.addColorStop(0, `rgba(255,214,140,${0.34 * qL * (0.78 + 0.22 * Math.sin(t * 7.3))})`);
          gg.addColorStop(1, 'rgba(255,214,140,0)'); c.fillStyle = gg; c.beginPath(); c.arc(fx, fy, 300, 0, TAU); c.fill(); c.restore();
          const sw1 = Math.sin(t * 9.3) * 2.6 + Math.sin(t * 21.7) * 1.1;
          c.save(); c.translate(fx, fy + 12); c.scale(0.72, 1);
          [['rgba(215,120,42,.88)', 17, 46], ['rgba(226,189,74,.92)', 12, 34], ['rgba(255,240,192,.95)', 6.5, 19]].forEach(([col, fw, fh], k) => {
            const wob = sw1 * (1 - k * 0.28), hh = fh * qL * (0.9 + 0.1 * Math.sin(t * 11 + k));
            c.fillStyle = col; c.beginPath(); c.moveTo(0, hh * 0.55);
            c.quadraticCurveTo(-fw, hh * 0.1, -fw * 0.42 + wob, -hh * 0.5); c.quadraticCurveTo(wob * 1.5, -hh, fw * 0.42 + wob, -hh * 0.5);
            c.quadraticCurveTo(fw, hh * 0.1, 0, hh * 0.55); c.closePath(); c.fill(); });
          c.restore(); } }

      // ---------- 铭文（幕布题记，不做金句卡） ----------
      c.textBaseline = 'middle';
      // 拍一：主角件旁的灯影小数字
      const envN = ss(0.6, 1.05, lt) * (1 - ss(2.6, 3.1, lt));
      if (envN > 0.01) { c.font = '46px "LXGWWenKai-500"'; c.textAlign = 'left'; c.fillStyle = INK; c.globalAlpha = 0.88 * envN;
        heroes.forEach((p, i) => c.fillText(p.num, p.nx + Math.sin(t * 0.9 + i) * 2, p.ny + Math.sin(t * 0.7 + i * 1.9) * 2)); c.globalAlpha = 1; }
      // 拍一：条幅题「参数」（字长在皮件上）
      { const po = PZ(strip), env = ss(0.5, 0.98, lt) * (1 - ss(2.95, 3.26, lt));
        if (env > 0.01) { c.font = '92px "LXGWWenKai-500"'; c.textAlign = 'center'; c.fillStyle = CREAM; c.globalAlpha = 0.95 * env;
          [-55, 55].forEach((dy, j) => { const q = holeWorld(po, 0, dy); c.fillText(j ? '数' : '参', q[0], q[1]); }); c.globalAlpha = 1; } }
      // 拍二：竖排题「疯狂卷参数」
      { const env = ss(3.25, 3.9, lt) * (1 - ss(6.9, 7.5, lt));
        if (env > 0.01) { c.font = '76px "LXGWWenKai-500"'; c.textAlign = 'center'; c.fillStyle = INK;
          [...'疯狂卷参数'].forEach((ch, i) => { const ci = ss(3.3 + i * 0.09, 3.75 + i * 0.09, lt); if (ci <= 0) return;
            c.globalAlpha = (i % 2 ? 0.78 : 0.92) * env * ci; c.fillText(ch, 1516, 172 + i * 94 - (1 - ease.out(ci)) * 24); }); c.globalAlpha = 1; } }
      // 拍二：题记账册（真实序列，竖排点亮）
      { const env = ss(3.35, 3.9, lt) * (1 - ss(6.95, 7.55, lt));
        if (env > 0.01) { const v = valAt(lt), k = 1 + (lt >= 4.2 ? 1 : 0) + (lt >= 5.2 ? 1 : 0) + (lt >= 6.3 ? 1 : 0);
          const rows = ['1.5B', '175B', '540B', '1T+'];
          c.strokeStyle = INK; c.globalAlpha = 0.35 * env; c.lineWidth = 2; c.beginPath(); c.moveTo(1744, 556); c.lineTo(1744, 812); c.stroke(); c.globalAlpha = 1;
          c.textAlign = 'right';
          rows.forEach((row, idx) => { const cur = idx === k - 1, size = cur ? (k === 4 ? 52 + 10 * Math.sin(clamp((lt - 6.3) / 0.6, 0, 1) * Math.PI) : 52) : 38;
            c.font = `${size | 0}px "LXGWWenKai-500"`; c.fillStyle = INK; c.globalAlpha = (cur ? 0.92 : idx < k - 1 ? 0.4 : 0.15) * env;
            c.fillText(cur ? (k >= 4 ? '1T+' : fmtB(v)) : row, 1722, 598 + idx * 62); });
          c.globalAlpha = 0.6 * env; c.fillStyle = INK; c.beginPath(); c.arc(1744, 598 + (k - 1) * 62, 5, 0, TAU); c.fill(); c.globalAlpha = 1; } }
      // 拍三：吊匾题「参数之外」（字长在皮件上）
      { const po = PZ(plaque), env = ss(7.9, 8.45, lt);
        if (env > 0.01) { c.font = '56px "LXGWWenKai-500"'; c.textAlign = 'center'; c.fillStyle = CREAM; c.globalAlpha = 0.96 * env;
          [...'参数之外'].forEach((ch, i) => { const q = holeWorld(po, (i - 1.5) * 74, 0); c.fillText(ch, q[0], q[1]); }); c.globalAlpha = 1; } }
      // 拍三：三物皮签铭牌
      c.font = '30px "LXGWWenKai-500"'; c.textAlign = 'center'; c.fillStyle = EDGE;
      tags.forEach((p, i) => { const po = PZ(p); const q = ss(p.born2 + 0.3, p.born2 + 0.6, lt); if (q <= 0) return;
        c.globalAlpha = 0.9 * q; [-19, 17].forEach((dy, j) => { const wpt = holeWorld(po, 0, dy); c.fillText(p.txt[j], wpt[0], wpt[1]); }); });
      c.globalAlpha = 1;

      c.restore();                                 // 运镜结束
      c.drawImage(frame(), 0, 0);                  // 木框（戏台边，不随运镜）
    },
  };
})();
