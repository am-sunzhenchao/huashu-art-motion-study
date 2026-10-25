// 「大模型参数」漫威 Kirby 银河时代样片（s27_kirby）——纯代码。
// 手法照 27 号卡「同一份几何画两遍」：
//   色版层：深空底＋平涂＋本戴网点（C 15°／M 75°／Y 0°），合成时整层偏移 (4,3)＝套色不准；
//   墨线层：白填→Kirby 黑块阴影＋羽化排线→黑描边，multiply 叠上（白＝透明）；krackle 黑点簇 12fps 换形脉动。
// 构图按「参数」题材重排（不搬速通片房间）：
//   拍一 0–3s「参数」：深空里一簇四色网点能量点＝参数本体，三颗放大的参数球挂 0.73/-1.2/2.4 黄色爆炸框、虚线聚焦环扫过，缓推特写；
//   拍二 3–7s「疯狂卷参数」：点群外扩，无脸机器神像（粗块方碑＋两侧仪表圆盘＋顶端能量球）自底座逐层拔高，
//        深透视地板、放射聚焦线、krackle 密度随层级升级；计数器 1.5B→175B→540B→1T+，拟声大字 175B!/540B! 逐个砸出、1T+ 最大一格（全片唯一重音）；
//   拍三 7–10s「参数之外」：增殖停住，数据（一摞书＋卷轴）／方法（咬合齿轮组）／算力（能量电池）三个分格依次弹升归位，
//        参数点从变多转为变亮变精（白芯亮星描出），沿弧线收成稳定星环＋细墨连线收拢，缓拉收全貌。
SCENES['s27_kirby'] = (() => {
  const W = 1920, H = 1080, TAU = Math.PI * 2;
  const { clamp, lerp, ease, rng, ss, seg } = U, P = PAINT, K = window.KIT;
  const INK = '#141212', PAPER = '#f4ecd6';
  const C = { cyan: '#2a9fd8', blue: '#1f3f9e', mag: '#e0287a', red: '#e3262d', yel: '#ffd62a',
    org: '#f6921e', orgD: '#d2541c', space: '#121a52', floor: '#2b3f9c', energy: '#ffe14a', energy2: '#ff8a2a' };
  const PN = [26, 26, 1868, 1028];                              // 主格（页面框内）
  const LIGHT = [-0.86, -0.5];

  // ---- Kirby 黑块阴影＋羽化排线：局部坐标系版（画在 translate 过的上下文里也能覆盖到） ----
  function shadeLocal(g, path, d1, d2, gap = 9) {
    g.save(); P.clipBeside(g, path, LIGHT[0] * d2, LIGHT[1] * d2);
    g.strokeStyle = INK; g.lineWidth = 2.6; g.lineCap = 'butt'; g.beginPath();
    const aa = Math.atan2(LIGHT[1], LIGHT[0]), nx = -Math.sin(aa), ny = Math.cos(aa);
    for (let k = -60; k <= 60; k++) { const ox = nx * k * gap, oy = ny * k * gap; g.moveTo(ox - LIGHT[0] * 620, oy - LIGHT[1] * 620); g.lineTo(ox + LIGHT[0] * 620, oy + LIGHT[1] * 620); }
    g.stroke(); g.restore();
    g.save(); P.clipBeside(g, path, LIGHT[0] * d1, LIGHT[1] * d1); g.fillStyle = INK; g.fillRect(-900, -900, 1800, 1800); g.restore();
  }

  // ---- 局部圆点阵：跟形状一起动（createPattern 的网点钉在画布上，移动件用它会「网不动、形在动」）----
  function dotGridLocal(g, path, bx, by, bw, bh, pitch, rr, col) {
    g.save(); g.clip(path); g.fillStyle = col;
    const p2 = new Path2D();
    for (let gy = Math.floor((by - pitch) / pitch) * pitch; gy < by + bh + pitch; gy += pitch)
      for (let gx = Math.floor((bx - pitch) / pitch) * pitch; gx < bx + bw + pitch; gx += pitch) {
        const x = gx + (((gy / pitch) % 2 + 2) % 2) * pitch / 2;
        p2.moveTo(x + rr, gy); p2.arc(x, gy, rr, 0, TAU);
      }
    g.fill(p2); g.restore();
  }

  // ---- 部件：色版层填色＋网点；墨线层白填→Kirby 阴影→描边 ----
  const mkPart = (g, mode) => (path, col, o = {}) => {
    if (!path) return;
    if (mode === 'color') {
      g.fillStyle = col; g.fill(path);
      if (o.dots) dotGridLocal(g, path, o.bx, o.by, o.bw, o.bh, o.dots[1], o.dots[2], o.dots[3]);
      return;
    }
    g.fillStyle = '#fff'; g.fill(path);
    if (o.shade) { if (o.local) shadeLocal(g, path, o.shade[0], o.shade[1]); else P.kirbyShade(g, path, { d1: o.shade[0], d2: o.shade[1] }); }
    if (o.lw !== 0) { g.strokeStyle = INK; g.lineWidth = o.lw || 6; g.lineJoin = 'round'; g.stroke(path); }
  };

  // ---- Kirby krackle：一簇黑点，12fps 换形，半径脉动 ----
  function krackle(g, cx, cy, R, seed, t, n = 12) {
    if (R < 6) return;
    const st = Math.floor(t * 12), r = rng(seed * 131 + st * 7);
    g.fillStyle = INK;
    for (let i = 0; i < n; i++) {
      const a = r() * TAU, d = Math.pow(r(), 0.7) * R, rr = R * (0.05 + 0.2 * (1 - d / R) * r()) * (0.9 + 0.1 * Math.sin(t * 12 + i));
      g.beginPath(); g.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.8, Math.max(2, rr), 0, TAU); g.fill();
    }
  }

  // ---- 预生成（种子固定） ----
  const SW = (() => { const r = rng(2701), cols = [C.cyan, C.mag, C.yel, C.red, C.org, C.blue], out = [];
    for (let i = 0; i < 26; i++) out.push({ a: r() * TAU, rr: 0.16 + 0.84 * r(), sz: 13 + r() * 20, col: cols[(r() * 6) | 0], ph: r() * TAU, sp: (r() < .5 ? -1 : 1) * (0.14 + 0.22 * r()) });
    return out; })();
  const HERO = [
    { x: 648, y: 428, r: 92, col: C.cyan, dc: C.mag, da: 75, a0: 0.7 },
    { x: 1216, y: 396, r: 84, col: C.mag, dc: C.cyan, da: 15, a0: 2.8 },
    { x: 962, y: 672, r: 76, col: C.yel, dc: C.red, da: 0, a0: 4.6 },
  ];
  const HSLOT = [{ x: 210, y: 268 }, { x: 960, y: 168 }, { x: 1710, y: 268 }];
  const STARS = (() => { const r = rng(3517), out = [];
    for (let i = 0; i < 34; i++) out.push({ x: 60 + r() * 1800, y: 40 + r() * 560, s: 4 + r() * 8, ph: r() * TAU });
    return out; })();
  const KR = [                                                   // krackle 簇：围簇／绕像／顶球（拍三神像旁的收掉）
    { x: 560, y: 330, R: 58, seed: 11, t0: 0.30, n: 11, f3: 0 },
    { x: 1310, y: 300, R: 54, seed: 12, t0: 0.45, n: 10, f3: 0 },
    { x: 860, y: 560, R: 50, seed: 14, t0: 4.40, n: 11, f3: 1 },
    { x: 1070, y: 608, R: 46, seed: 15, t0: 4.90, n: 10, f3: 1 },
    { x: 700, y: 668, R: 44, seed: 16, t0: 5.40, n: 8, f3: 1 },
    { x: 1240, y: 662, R: 44, seed: 17, t0: 5.60, n: 8, f3: 1 },
    { x: 960, y: 258, R: 56, seed: 13, t0: 6.00, n: 13, f3: 0 },
  ];
  const PANELS = [
    { x: 64, w: 540, label: 'DATA', tab: 104, bg: C.blue, dot: ['k27pd', C.cyan, 75], t0: 7.15 },
    { x: 690, w: 540, label: 'METHOD', tab: 148, bg: C.mag, dot: ['k27pm', C.yel, 0], t0: 7.55 },
    { x: 1316, w: 540, label: 'COMPUTE', tab: 172, bg: C.red, dot: ['k27pc', C.yel, 15], t0: 7.95 },
  ];
  const PY0 = 704, PY1 = 1012;
  const slotX = i => 96 + (i + 0.5) / 26 * 1728;
  const slotY = i => 318 - Math.sin(Math.PI * (i + 0.5) / 26) * 152;
  const starP = (cx, cy, r0, r1, n, rot) => { const pts = []; for (let i = 0; i < n * 2; i++) { const a = rot + i / (n * 2) * TAU - Math.PI / 2, rr = i % 2 ? r1 : r0; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } return U.poly(pts); };
  const countStr = (lt) => {                                     // 计数器：1.5B → 175B → 540B → 1T+
    if (lt < 3.5) return '1.5B';
    if (lt < 4.95) { const v = 1.5 * Math.pow(175 / 1.5, seg(lt, 3.5, 4.95)); return (v < 10 ? v.toFixed(1) : String(Math.round(v))) + 'B'; }
    if (lt < 6.32) { const v = 175 * Math.pow(540 / 175, seg(lt, 4.95, 6.32)); return String(Math.round(v)) + 'B'; }
    return '1T+';
  };

  // ---- 拟声大字 / 数字爆炸框：outBack 砸入、ease.in 缩没，12fps 抖 ----
  function sfx(c, txt, x, y, lt, t, fs, spike, rot, popT, outT) {
    const qa = seg(lt, popT, popT + 0.34), qd = 1 - seg(lt, outT - 0.3, outT);
    if (qa <= 0 || qd <= 0) return;
    const s = ease.outBack(qa) * ease.in(qd);
    const st = Math.floor(t * 12), jx = (U.hash(st, 3) - 0.5) * 4, jy = (U.hash(st, 9) - 0.5) * 4;
    c.save(); c.translate(x + jx, y + jy); c.rotate(rot); c.scale(s, s);
    const burst = []; for (let i = 0; i < 26; i++) { const a = i / 26 * TAU, r = (i % 2 ? spike * 0.62 : spike) * (0.9 + U.hash(i, 77) * 0.2); burst.push([Math.cos(a) * r * 1.5, Math.sin(a) * r * 0.75]); }
    const bp = U.poly(burst);
    c.fillStyle = C.yel; c.strokeStyle = INK; c.lineWidth = Math.max(5, fs * 0.075); c.fill(bp); c.stroke(bp);
    c.font = fs + 'px "Bangers-400"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.letterSpacing = '3px';
    for (let d = fs * 0.106; d > 0; d -= 2) { c.fillStyle = INK; c.fillText(txt, d * 0.8, d); }   // Kirby 立体积木字
    c.lineWidth = fs * 0.075; c.strokeStyle = INK; c.strokeText(txt, 0, 0);
    c.fillStyle = C.red; c.fillText(txt, 0, 0);
    c.fillStyle = C.yel; c.save(); c.beginPath(); c.rect(-400, -fs * 0.53, 800, fs * 0.34); c.clip(); c.fillText(txt, 0, 0); c.restore();
    c.letterSpacing = '0px'; c.restore();
  }

  // ---- 色版/墨线两层共用的整幅绘制 ----
  function art(g, mode, lt, t) {
    const part = mkPart(g, mode);
    const dens = ss(3.1, 6.1, lt);                               // 拍二密度（背景升级）
    const q2 = ss(3.0, 5.6, lt);                                 // 簇→绕像环
    const b3 = ss(7.0, 8.8, lt);                                 // 拍三收束
    if (mode !== 'color') { g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); }

    // 深空底（色版）：纯深空＋两片品红网点星云（随密度外扩）＋青网点小带——Kirby 的太空是纯底，网屏留给物
    if (mode === 'color') {
      g.fillStyle = C.space; g.fillRect(0, 0, W, H);
      g.fillStyle = P.dotPattern(g, 'k27neb', 22, 3.4, C.mag, null, 75);
      [[430, 240, 0.55, -0.3], [1500, 200, 0.5, 0.35]].forEach(([nx, ny, k, an]) => {
        const sc = k + 0.7 * dens;
        g.save(); g.globalAlpha = 0.5 + 0.3 * dens; g.beginPath(); g.ellipse(nx, ny, 220 * sc, 110 * sc, an, 0, TAU); g.fill(); g.restore();
      });
      g.fillStyle = P.dotPattern(g, 'k27nebc', 22, 3.0, C.cyan, null, 15);
      g.save(); g.globalAlpha = 0.35 + 0.2 * dens; g.beginPath(); g.ellipse(880, 150, 300 + 120 * dens, 60, -0.1, 0, TAU); g.fill(); g.restore();
    }
    // 深透视地板（拍二起）：固定网格，用向下展开的揭示带显形（不整片每帧扫线）
    if (dens > 0.004) {
      const fg2 = clamp(dens * 1.55, 0, 1);
      if (mode === 'color') {
        g.save(); g.globalAlpha = fg2; g.fillStyle = C.floor; g.fillRect(0, 640, W, H - 640);
        g.fillStyle = P.dotPattern(g, 'k27fl', 24, 3.2, '#7a2a9a', null, 75); g.fillRect(0, 640, W, H - 640); g.restore();
      } else {
        g.save(); g.beginPath(); g.rect(0, 640, W, 416 * fg2 + 2); g.clip();
        g.globalAlpha = 0.95 * fg2; g.strokeStyle = INK; g.lineWidth = 2.5; g.beginPath();
        for (let i = -4; i <= 4; i++) { g.moveTo(960 + i * 130, 640); g.lineTo(960 + i * 360, 1056); }
        for (let k = 1; k <= 6; k++) { const y = 640 + Math.pow(k / 6, 1.5) * 416, sp = 1900 * Math.pow(k / 6, 0.7); g.moveTo(960 - sp, y); g.lineTo(960 + sp, y); }
        g.stroke(); g.restore();
      }
    }
    // 星（色版白星，随密度增多、闪烁）
    if (mode === 'color') {
      const nSt = 12 + Math.round(22 * dens);
      g.fillStyle = '#fff';
      for (let i = 0; i < nSt; i++) { const s2 = STARS[i]; const tw = 0.65 + 0.35 * Math.sin(t * 7 + s2.ph);
        g.fill(K.star(s2.x, s2.y, s2.s * 2.6 * tw, s2.s * 0.55, 4)); }
    }
    // ---- 无脸机器神像：逐层拔高（锚在各自底边）----
    const gp = t0 => ease.out(seg(lt, t0, t0 + 0.85));
    const slab = (pts0, ya, g0, col, o) => { if (g0 <= 0.004) return; const pts = pts0.map(p => [p[0], ya - (ya - p[1]) * g0]); part(U.poly(pts), col, o); };
    slab([[698, 846], [1222, 846], [1152, 698], [768, 698]], 846, gp(3.12), C.orgD, { shade: [14, 30], lw: 6 });
    slab([[768, 698], [1152, 698], [1122, 652], [798, 652]], 698, gp(3.30), C.org, { shade: [10, 22], lw: 5 });
    slab([[848, 652], [1072, 652], [1056, 540], [864, 540]], 652, gp(3.60), C.red, { dots: ['k27r', 12, 2.8, C.yel, 0], bx: 848, by: 540, bw: 224, bh: 112, shade: [14, 30], lw: 6 });
    slab([[872, 540], [1048, 540], [1036, 466], [884, 466]], 540, gp(4.00), C.org, { dots: ['k27o', 12, 2.8, C.mag, 75], bx: 872, by: 466, bw: 176, bh: 74, shade: [12, 26], lw: 5 });
    slab([[776, 652], [840, 652], [832, 466], [784, 466]], 652, gp(4.40), C.blue, { dots: ['k27b', 12, 2.6, C.cyan, 15], bx: 776, by: 466, bw: 64, bh: 186, shade: [12, 26], lw: 5 });
    slab([[1080, 652], [1144, 652], [1136, 466], [1088, 466]], 652, gp(4.50), C.blue, { dots: ['k27b', 12, 2.6, C.cyan, 15], bx: 1080, by: 466, bw: 64, bh: 186, shade: [12, 26], lw: 5 });
    slab([[894, 466], [1026, 466], [1014, 414], [906, 414]], 466, gp(5.25), C.mag, { dots: ['k27m', 12, 2.4, C.yel, 45], bx: 894, by: 414, bw: 132, bh: 52, shade: [10, 22], lw: 5 });
    slab([[934, 414], [986, 414], [976, 318], [946, 318]], 414, gp(5.60), C.red, { shade: [10, 22], lw: 5 });
    // 两侧仪表圆盘（黄面品红点环＋转针）
    [[808, 548, gp(4.85)], [1112, 548, gp(5.00)]].forEach(([dx2, dy2, g0]) => {
      if (g0 <= 0.004) return;
      const rr = 52 * g0, dial = new Path2D(); dial.arc(dx2, dy2, rr, 0, TAU);
      part(dial, C.yel, { dots: ['k27dy', 12, 2.4, C.mag, 75], bx: dx2 - 52, by: dy2 - 52, bw: 104, bh: 104, shade: [8, 18], lw: 5 });
      if (mode === 'color') { g.fillStyle = PAPER; g.beginPath(); g.arc(dx2, dy2, rr * 0.5, 0, TAU); g.fill(); }
      else {
        g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.arc(dx2, dy2, rr * 0.62, 0, TAU); g.stroke();
        g.lineWidth = 3.5; g.beginPath();
        for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; g.moveTo(dx2 + Math.cos(a) * rr * 0.7, dy2 + Math.sin(a) * rr * 0.7); g.lineTo(dx2 + Math.cos(a) * rr * 0.88, dy2 + Math.sin(a) * rr * 0.88); }
        g.stroke();
        g.save(); g.translate(dx2, dy2); g.rotate(t * 0.7); g.lineWidth = 6; g.lineCap = 'round';
        g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -rr * 0.62); g.stroke();
        g.fillStyle = INK; g.beginPath(); g.arc(0, 0, 7, 0, TAU); g.fill(); g.restore();
      }
    });
    // 两根肘管（立柱→尖刃），随生长从一端长出
    { const gT = gp(5.45);
      if (gT > 0.004) {
        const pA = K.densify([[808, 520], [830, 440], [905, 392], [946, 386]], 6);
        const pB = K.densify([[1112, 520], [1090, 440], [1015, 392], [974, 386]], 6);
        part(K.ribbon(pA.slice(0, Math.max(2, Math.ceil(pA.length * gT))), 22), C.org, { shade: [6, 14], lw: 4 });
        part(K.ribbon(pB.slice(0, Math.max(2, Math.ceil(pB.length * gT))), 22), C.org, { shade: [6, 14], lw: 4 });
      } }
    // 顶端能量球（1T+ 揭示时长满；拍三白芯亮星化）
    { const gO = gp(5.70);
      if (gO > 0.004) {
        const rr = 76 * gO, orb = new Path2D(); orb.arc(960, 260, rr, 0, TAU);
        part(orb, C.energy, { shade: [16, 32], lw: 6 });
        if (mode === 'color') {
          const g1t = clamp(seg(lt, 6.32, 6.72));                // 1T+ 揭示：白芯永久提亮（重音的一部分，单向不回）
          g.save(); g.clip(orb);
          g.fillStyle = C.energy2; g.beginPath(); g.arc(938, 280, rr * 0.84, 0, TAU); g.fill();
          if (g1t > 0.01) { g.globalAlpha = g1t; g.fillStyle = '#fff'; g.beginPath(); g.arc(946, 242, rr * (0.12 + 0.22 * g1t + 0.34 * b3), 0, TAU); g.fill(); g.globalAlpha = 1; }
          g.restore();
          if (b3 > 0.02) { g.save(); g.globalAlpha = b3; g.fillStyle = '#fff'; g.fill(K.star(946, 238, 20 + 118 * b3, 13, 4)); g.restore(); }
        }
      } }

    // ---- 拍三：三个分格（数据/方法/算力）从页底弹升归位 ----
    PANELS.forEach((pl, j) => {
      const p = ease.outBack(seg(lt, pl.t0, pl.t0 + 0.9));
      if (p <= 0.01) return;
      const dy = (1 - p) * 380, h2 = PY1 - PY0, w2 = pl.w;
      const cx = w2 / 2, cy = h2 / 2;                             // 局部坐标：网点跟着分格走（不被页面网屏钉住）
      g.save(); g.translate(pl.x, PY0 + dy);
      const rect = new Path2D(); rect.rect(0, 0, w2, h2);
      if (mode === 'color') {
        g.fillStyle = pl.bg; g.fill(rect);
        dotGridLocal(g, rect, 0, 0, w2, h2, 12, 3.4, pl.dot[1]);
        g.fillStyle = C.yel; g.fillRect(16, 14, pl.tab, 42);
      } else {
        g.fillStyle = '#fff'; g.fill(rect);
        g.strokeStyle = INK; g.lineWidth = 6; g.stroke(rect);
        g.font = '26px "Bangers-400"'; g.fillStyle = INK; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.letterSpacing = '1px';
        g.fillText(pl.label, 30, 44); g.letterSpacing = '0px';
      }
      g.save(); g.beginPath(); g.rect(6, 6, w2 - 12, h2 - 12); g.clip();
      if (j === 0) { // 数据：一摞书＋卷轴
        const defs = [
          { w: 344, h: 52, col: C.red, dots: ['k27bk1', 9, 2.4, C.yel, 15] },
          { w: 366, h: 50, col: C.blue, dots: ['k27bk2', 9, 2.4, C.cyan, 75] },
          { w: 330, h: 48, col: C.org, dots: ['k27bk3', 9, 2.4, C.mag, 0] },
          { w: 302, h: 44, col: C.mag, dots: ['k27bk4', 9, 2.2, C.yel, 75] },
          { w: 268, h: 40, col: C.yel, dots: ['k27bk5', 9, 2.2, C.red, 15] }];
        let yy = cy + 118; const r = rng(726);
        defs.forEach((d, k) => {
          const rot = (r() - .5) * 0.05 + 0.008 * Math.sin(t * 2.2 + k), ox = (r() - .5) * 14;
          g.save(); g.translate(cx + ox, yy - d.h / 2); g.rotate(rot);
          const bp = new Path2D(); bp.rect(-d.w / 2, -d.h / 2, d.w, d.h);
          part(bp, d.col, { dots: d.dots, bx: -d.w / 2, by: -d.h / 2, bw: d.w, bh: d.h, shade: [8, 16], lw: 5, local: 1 });
          if (mode === 'color') {
            g.fillStyle = PAPER; g.fillRect(d.w / 2 - 34, -d.h / 2 + 5, 30, d.h - 10);           // 书口
            g.fillStyle = 'rgba(58,36,24,.25)'; g.fillRect(d.w / 2 - 34, -d.h / 2 + 5, 3, d.h - 10);
            g.save(); g.globalAlpha = 0.18; g.fillStyle = INK; g.fillRect(-d.w / 2, -d.h / 2, 20, d.h); g.restore();   // 书脊带
          } else { g.strokeStyle = INK; g.lineWidth = 3; g.strokeRect(d.w / 2 - 34, -d.h / 2 + 5, 30, d.h - 10); }
          g.restore(); yy -= d.h;
        });
        const sy = yy - 13 + 2.5 * Math.sin(t * 2.4);                                            // 顶上卷轴轻浮
        const scroll = new Path2D(); scroll.rect(cx - 104, sy - 13, 208, 26);
        part(scroll, PAPER, { lw: 4, shade: [5, 10], local: 1 });
        [[-104, 0], [104, 0]].forEach(ex => { const roll = new Path2D(); roll.arc(cx + ex[0], sy, 15, 0, TAU); part(roll, PAPER, { lw: 4 }); });
        if (mode === 'color') { g.strokeStyle = C.red; g.lineWidth = 5; g.beginPath(); g.arc(cx - 104, sy, 7, 0, TAU); g.stroke(); g.beginPath(); g.arc(cx + 104, sy, 7, 0, TAU); g.stroke(); }
      } else if (j === 1) { // 方法：咬合齿轮组（连续慢咬）
        [[cx - 80, cy - 20, 104, 82, 10, t * 0.34, C.yel, ['k27gy', 8, 2.2, C.red, 45], C.red],
         [cx + 78, cy + 58, 64, 50, 8, -t * 0.55, C.org, ['k27go', 8, 2.2, C.mag, 0], C.mag]].forEach(([gx, gy2, r0, r1, n, rot, col, dots, hubCol]) => {
          part(starP(gx, gy2, r0, r1, n, rot), col, { shade: [10, 20], lw: 5, local: 1 });
          const hub = new Path2D(); hub.arc(gx, gy2, r0 * 0.24, 0, TAU); part(hub, hubCol, { lw: 4 });
          if (mode !== 'color') { g.strokeStyle = INK; g.lineWidth = 3; g.beginPath();
            for (let k = 0; k < 6; k++) { const a = rot + k / 6 * TAU; g.moveTo(gx + Math.cos(a) * r0 * 0.36, gy2 + Math.sin(a) * r0 * 0.36); g.lineTo(gx + Math.cos(a) * r0 * 0.46, gy2 + Math.sin(a) * r0 * 0.46); }
            g.stroke(); }
        });
      } else { // 算力：能量电池（窗内 krackle 明灭、液面晃、端子火花）
        const body = new Path2D(); body.rect(cx - 80, cy - 92, 160, 190);
        part(body, C.org, { dots: ['k27ba', 9, 2.6, C.yel, 15], bx: cx - 80, by: cy - 92, bw: 160, bh: 190, shade: [12, 26], lw: 6, local: 1 });
        const cap = new Path2D(); cap.rect(cx - 30, cy - 122, 60, 30); part(cap, C.orgD, { shade: [6, 12], lw: 5, local: 1 });
        const win = new Path2D(); win.rect(cx - 54, cy - 64, 108, 132);
        if (mode === 'color') {
          g.fillStyle = PAPER; g.fill(win);
          const lvl = cy - 64 + 132 * (0.34 + 0.03 * Math.sin(t * 2.6));
          g.save(); g.clip(win); g.fillStyle = C.energy; g.fillRect(cx - 54, lvl, 108, cy + 68 - lvl);
          g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(cx - 54, lvl, 108, 5); g.restore();
        } else {
          g.strokeStyle = INK; g.lineWidth = 5; g.stroke(win);
          g.save(); g.clip(win); krackle(g, cx, cy + 26, 34, 71, t, 9); g.restore();
        }
        part(U.poly([[cx + 52, cy - 50], [cx + 74, cy - 50], [cx + 60, cy - 22], [cx + 80, cy - 22], [cx + 44, cy + 44], [cx + 56, cy - 4], [cx + 34, cy - 4]]), C.yel, { lw: 4, shade: [4, 8], local: 1 });   // 闪电标
        if (mode === 'color') {
          g.fillStyle = C.yel; g.fillRect(cx - 78, cy - 40, 8, 20); g.fillRect(cx - 78, cy - 14, 8, 20);
          const st = Math.floor(t * 12);
          if (U.hash(st, 5) > 0.4) { g.fillStyle = '#fff'; g.fill(K.star(cx, cy - 128, 14 + 9 * U.hash(st, 7), 3, 4)); }
        } else { g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(cx - 78, cy - 40); g.lineTo(cx - 66, cy - 40); g.moveTo(cx - 78, cy - 14); g.lineTo(cx - 66, cy - 14); g.stroke(); }
      }
      g.restore(); g.restore();                                   // 弹掉分格 clip 和分格 translate
    });

    // ---- 能量点群：簇（拍一）→绕像环（拍二）→星弧（拍三）----
    // 色版层在局部坐标里填网点（网点跟着球走，不被页面网屏钉住）；墨线层局部 Kirby 阴影
    const drawDot = (x, y, r, col, dc, da, lw) => {
      g.save(); g.translate(x, y);
      const path = new Path2D(); path.arc(0, 0, r, 0, TAU);
      if (mode === 'color') {
        const gx = 2 + Math.sin(t * 2.6 + x * 0.01) * 1.6, gy = 1.5 + Math.cos(t * 2.1 + y * 0.01) * 1.4;   // 套色错位鬼影
        g.save(); g.globalAlpha = 0.5; g.fillStyle = dc; g.beginPath(); g.arc(gx, gy, r * 0.96, 0, TAU); g.fill(); g.restore();
        part(path, col, { dots: ['k27sw', 8, r > 40 ? 2.4 : 1.8, dc, da], bx: -r, by: -r, bw: 2 * r, bh: 2 * r });
        g.save(); g.globalAlpha = 0.8; g.fillStyle = '#fff'; g.beginPath(); g.arc(-r * 0.42, -r * 0.46, r * 0.16, 0, TAU); g.fill(); g.restore();
        if (b3 > 0.02) { g.save(); g.globalAlpha = Math.min(1, b3 * 1.2); g.fillStyle = '#fff';
          g.beginPath(); g.arc(0, 0, r * (0.3 + 0.3 * b3), 0, TAU); g.fill(); g.fill(K.star(0, 0, r * (1.4 + 1.4 * b3), r * 0.16, 4)); g.restore(); }
      } else {
        g.fillStyle = '#fff'; g.fill(path);
        shadeLocal(g, path, r * 0.18, r * 0.36);
        g.strokeStyle = INK; g.lineWidth = lw; g.lineJoin = 'round'; g.stroke(path);
      }
      g.restore();
    };
    for (let i = 0; i < 26; i++) {
      const s2 = SW[i], appear = ss(0.12 + 0.05 * (i % 5), 0.7 + 0.06 * i, lt);
      if (appear <= 0.01) continue;
      const ang = s2.a + t * s2.sp * (1 - 0.86 * b3);
      const p1x = 960 + Math.cos(ang) * (60 + 130 * s2.rr), p1y = 488 + Math.sin(ang) * (44 + 96 * s2.rr);
      const p2x = 960 + Math.cos(ang) * (170 + 330 * s2.rr), p2y = 520 + Math.sin(ang) * (150 + 200 * s2.rr);
      const x = lerp(lerp(p1x, p2x, q2), slotX(i) + Math.sin(t * 1.6 + s2.ph) * 5, b3);
      const y = lerp(lerp(p1y, p2y, q2), slotY(i) + Math.cos(t * 1.3 + s2.ph) * 5, b3);
      const r = s2.sz * appear * (1 + 0.14 * Math.sin(t * 5 + s2.ph));
      drawDot(x, y, r, s2.col, s2.col === C.yel ? C.red : C.yel, (i % 2) ? 75 : 15, 3.5);
    }
    // 三颗主角参数球
    if (mode !== 'color' && q2 < 0.98) {                          // 拍一虚线聚焦环
      g.save(); g.globalAlpha = 1 - q2; g.strokeStyle = INK; g.lineWidth = 4; g.setLineDash([34, 18]); g.lineDashOffset = t * 50;
      HERO.forEach((h2, j) => { g.beginPath(); g.arc(h2.x + Math.sin(t * 1.1 + j * 2.1) * 6, h2.y + Math.cos(t * 0.9 + j * 1.7) * 6, h2.r + 20, 0, TAU); g.stroke(); });
      g.setLineDash([]); g.restore();
    }
    HERO.forEach((h2, j) => {
      const ang = h2.a0 + t * 0.16 * (j % 2 ? -1 : 1) * (1 - 0.85 * b3);
      const x = lerp(lerp(h2.x + Math.sin(t * 1.1 + j * 2.1) * 6, 960 + Math.cos(ang) * 430, q2), HSLOT[j].x + Math.sin(t * 1.6 + j) * 6, b3);
      const y = lerp(lerp(h2.y + Math.cos(t * 0.9 + j * 1.7) * 6, 500 + Math.sin(ang) * 300, q2), HSLOT[j].y + Math.cos(t * 1.4 + j) * 6, b3);
      drawDot(x, y, h2.r * (1 + 0.045 * Math.sin(t * 4.2 + j * 2)), h2.col, h2.dc, h2.da, 6);
    });
    // krackle（墨线黑点）：拍三神像旁的簇收掉，顶球簇留下
    if (mode !== 'color') KR.forEach(k2 => { if (lt >= k2.t0) krackle(g, k2.x, k2.y, k2.R * (1 - (k2.f3 ? b3 : 0)), k2.seed, t, k2.n); });
    // 拍二生长速度线（12fps 抖，仅生长中）
    if (mode !== 'color') {
      const act = clamp(dens * (1 - dens) * 4);
      if (act > 0.05) {
        const st = Math.floor(t * 12), r = rng(300 + st);
        g.strokeStyle = INK; g.lineCap = 'round';
        for (let i = 0; i < 10; i++) {
          const ox = (i % 2 ? 740 + r() * 90 : 1100 + r() * 90) + (r() - .5) * 40, oy = 400 + r() * 300, L = (40 + r() * 90) * act;
          g.lineWidth = 2.5 + r() * 2.5; g.beginPath(); g.moveTo(ox, oy); g.lineTo(ox, oy + L); g.stroke();
        }
      }
      // 放射聚焦线：角度固定（种子），整体缓旋——不逐帧换位
      if (dens > 0.02 && b3 < 0.98) {
        const r = rng(900), rot = 0;
        g.save(); g.globalAlpha = 0.5 * dens * (1 - b3); g.fillStyle = INK;
        for (let i = 0; i < 32; i++) { const a = rot + i / 32 * TAU + r() * 0.06, w2 = 0.016 + r() * 0.02, r0 = 200 + r() * 50;
          g.beginPath(); g.moveTo(960 + Math.cos(a - w2) * r0, 260 + Math.sin(a - w2) * r0); g.lineTo(960 + Math.cos(a) * 1300, 260 + Math.sin(a) * 1300); g.lineTo(960 + Math.cos(a + w2) * r0, 260 + Math.sin(a + w2) * r0); g.fill(); }
        g.restore();
      }
      // 星环连线（拍三收稳：细墨线沿弧合拢）
      if (b3 > 0.25) {
        const prog = clamp((b3 - 0.25) / 0.75), lim = prog * 25;
        g.strokeStyle = INK; g.lineWidth = 3.5; g.lineCap = 'round'; g.beginPath();
        for (let i = 0; i <= Math.floor(lim); i++) {
          const sx = slotX(i), sy = slotY(i) + Math.cos(t * 1.3 + SW[i].ph) * 5;
          i ? g.lineTo(sx, sy) : g.moveTo(sx, sy);
        }
        g.stroke();
      }
    }
  }

  // ---- 页面家具：旁白框（中文）、计数器（Bangers）、格框 ----
  const SIGN = [{ txt: '参数', s: 92, w: 246 }, { txt: '疯狂卷参数', s: 64, w: 368 }, { txt: '参数之外', s: 84, w: 334 }];
  function captions(c, lt) {
    c.textBaseline = 'alphabetic'; c.textAlign = 'left';
    for (let k = 0; k < 3; k++) {
      const S0 = [3.0, 7.0][k - 1] || -1;
      let a = k === 0 ? 1 : ss(S0 + 0.06, S0 + 0.4, lt);
      if (k < 2) { const E0 = [3.0, 7.0][k]; a *= 1 - ss(E0 - 0.4, E0 - 0.06, lt); }
      if (a <= 0.01) continue;
      const sg = SIGN[k];
      c.save(); c.globalAlpha = a;
      c.save(); c.translate(5, 5); c.fillStyle = INK; c.fillRect(56, 52, sg.w, sg.s + 44); c.restore();
      c.fillStyle = C.yel; c.fillRect(56, 52, sg.w, sg.s + 44);
      c.strokeStyle = INK; c.lineWidth = 5; c.strokeRect(56, 52, sg.w, sg.s + 44);
      c.font = sg.s + 'px "PuHui-Black"'; c.fillStyle = INK;
      c.fillText(sg.txt, 56 + (sg.w - c.measureText(sg.txt).width) / 2, 52 + sg.s + 12);
      c.restore();
    }
  }
  function counterBox(c, lt, pulse) {
    const on = ss(3.06, 3.4, lt); if (on <= 0.01) return;
    const bx = 1560, by = 52, bw = 296, bh = 100;
    c.save(); c.globalAlpha = on;
    c.save(); c.translate(bx + bw / 2, by + bh / 2); c.scale(1 + 0.1 * pulse, 1 + 0.1 * pulse); c.translate(-(bx + bw / 2), -(by + bh / 2));
    c.save(); c.translate(5, 5); c.fillStyle = INK; c.fillRect(bx, by, bw, bh); c.restore();
    c.fillStyle = C.yel; c.fillRect(bx, by, bw, bh);
    c.strokeStyle = INK; c.lineWidth = 5; c.strokeRect(bx, by, bw, bh);
    c.fillStyle = INK; c.font = '24px "Bangers-400"'; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.letterSpacing = '2px';
    c.fillText('PARAMS', bx + 18, by + 32); c.letterSpacing = '0px';
    c.font = '58px "Bangers-400"'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = C.orgD; c.fillText(countStr(lt), bx + bw / 2 + 3, by + 70);    // 套色错位衬字
    c.fillStyle = INK; c.fillText(countStr(lt), bx + bw / 2, by + 68);
    c.restore(); c.restore();
  }

  return {
    init() {
      U.assertGlyphs('92px "PuHui-Black"', '参数疯狂卷之外', 's27_kirby 旁白框');
      U.assertGlyphs('62px "Bangers-400"', '0.73-1.2 2.4 1.5B 175B 540B 1T+ PARAMS DATA METHOD COMPUTE!', 's27_kirby 数字/拟声');
    },
    draw(c, lt, t) {
      const pulse = Math.sin(Math.PI * seg(lt, 6.32, 6.92));      // 1T+ 揭示：全片唯一重音
      const cc = P.scratch('k27c'), cg = cc.getContext('2d');
      const ic = P.scratch('k27i'), ig = ic.getContext('2d');
      const ac = P.scratch('k27a'), ag = ac.getContext('2d');
      cg.reset(); ig.reset(); ag.reset();
      art(cg, 'color', lt, t); art(ig, 'ink', lt, t);
      ag.fillStyle = C.space; ag.fillRect(0, 0, W, H);
      ag.drawImage(cc, 4, 3);                                    // 套色不准：色版相对墨版偏 (4,3)
      ag.save(); ag.globalCompositeOperation = 'multiply'; ag.drawImage(ic, 0, 0); ag.restore();
      // 页面＋运镜（主格 clip 内：近景缓推→拉远展开→收全貌；满页本戴网点经不起大幅推拉，幅度收着走防满屏爬点）
      c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
      let z, cx, cy;
      if (lt < 3) { const q = ease.inOut(lt / 3); z = 1 + 0.032 * q; cx = lerp(960, 952, q); cy = lerp(540, 522, q); }
      else if (lt < 7) { const q = ease.inOut(seg(lt, 3, 6.6)); z = 1.032 - 0.042 * q; cx = lerp(952, 960, q); cy = lerp(522, 540, q); }
      else { const q = ease.inOut(seg(lt, 7, 9.7)); z = 0.99 + 0.01 * q; cx = 960; cy = 540; }
      c.save(); c.beginPath(); c.rect(PN[0], PN[1], PN[2], PN[3]); c.clip();
      c.save(); c.translate(cx, cy); c.scale(z, z); c.translate(-cx, -cy);
      c.drawImage(ac, 0, 0);
      sfx(c, '0.73', 830, 262, lt, t, 62, 80, -0.12, 0.55, 3.0);
      sfx(c, '-1.2', 1372, 262, lt, t, 62, 80, 0.10, 0.95, 3.0);
      sfx(c, '2.4', 1116, 760, lt, t, 62, 80, -0.06, 1.40, 3.0);
      sfx(c, '175B!', 560, 322, lt, t, 96, 118, -0.10, 4.28, 5.5);
      sfx(c, '540B!', 1360, 318, lt, t, 96, 118, 0.08, 5.55, 6.5);
      sfx(c, '1T+', 960, 238, lt, t, 150, 168, -0.05, 6.38, 7.5);
      c.restore(); c.restore();
      // 格框＋旁白框＋计数器＋胶印颗粒
      c.strokeStyle = INK; c.lineWidth = 7; c.strokeRect(PN[0], PN[1], PN[2], PN[3]);
      captions(c, lt); counterBox(c, lt, pulse);
      c.save(); c.globalCompositeOperation = 'multiply'; c.drawImage(P.grain('k27g', 0.05, [120, 100, 60], 0.25), 0, 0); c.restore();
    },
  };
})();
