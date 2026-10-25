// 「大模型参数」× 慕夏新艺术（s10_nouveau）——参数＝藤蔓卷须上的花苞。
// 拍一 0–3s：中央花茎上三朵大参数花（罂粟红 0.73／粉玫瑰 -1.2／金轮花 2.4，数字挂奶白吊牌）＋S 形奶白卷草环绕、
//   顶部光轮金钉缓转；花瓣缓开、花头呼吸摇摆、吊牌随花轻晃，整组随镜头缓缓放大端详（缓推）。
// 拍二 3–7s：藤蔓从三花沿拱形轮廓蔓延成拱形花窗网络——拱缘双藤自两底角向穹顶生长、彩色玻璃饰片逐片点亮、
//   百余花苞连片弹出＋金绿连线结网；太阳升入光轮中心、放射铅条缓转；底部弧形铭牌计数器滚动 1.5B→175B→540B→1T+
//   （里程碑逐字点金）；背景石版绿罩随密度加深；1T+ 揭示＝一次单向快推重音（缓拉远后）。
// 拍三 7–10s：增殖停住；三块装饰徽章依次升上马赛克台归位——花饰书摞（数据）／齿轮花窗（方法，齿轮缓转）／
//   百合油灯（算力，灯焰摇曳）；藤网描金变亮、花苞呼吸收稳，金色鞭线卷草环绕三物生长收尾，一道流光铺过全网（停，收全貌）。
// 硬红线：无角色无脸（花与器物，不加五官）；一片一风格——只用卡 10_nouveau 的色板与渲染器（可变线宽鞭线、
//   拱形花窗、光环＋放射铅条、石版颗粒、剪影错位垫底）；随机全用 U.rng 种子；静态底版 PAINT.cached；
//   字：中文 LXGWWenKai-500、数字 LibreBaskerville-700，全部 U.assertGlyphs，字避开 y>880。
SCENES['s10_nouveau'] = (() => {
  const W = 1920, H = 1080, TAU = Math.PI * 2;
  const { clamp, lerp, ss, ease } = U, P = PAINT;
  const C = {
    paper: '#efe6cf', gold: '#c9a24a', goldD: '#9c7a2e', line: '#4e3320',
    green: '#b9cba0', green2: '#cfd3a6', peach: '#ecc9a2', dot: 'rgba(120,140,100,.38)',
    banner: '#8fac80', cream: '#f6eedb', poppy: '#d9706a', poppyD: '#b4504b',
    stem: '#5f8a58', stemHi: '#6f9a68', leaf: '#8fb38a', leafD: '#5f8a58', lily: '#f7f2e6',
    iron: '#3d7763', pink: '#e6aaa5', pinkD: '#d48e8c', haloPink: '#ebb8b2', teal: '#5f9a8a', red: '#b8473a',
  };

  // ---------- 小工具（照 10_nouveau 原配方：Catmull-Rom 加密＋法线偏移的可变线宽路径） ----------
  const dense = (pts, n = 8) => {
    const o = [], N = pts.length, g = i => pts[Math.max(0, Math.min(N - 1, i))];
    for (let i = 0; i < N - 1; i++) { const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
      for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t;
        o.push([0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
                0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); } }
    o.push(pts[N - 1]); return o;
  };
  const ribbon = (pts, wf) => {
    const L = [], R = [], n = pts.length;
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
      const w = wf(i / (n - 1)) / 2; L.push([pts[i][0] - dy * w, pts[i][1] + dx * w]); R.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
    }
    const p = new Path2D(); L.forEach((q, i) => i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1]));
    for (let i = n - 1; i >= 0; i--) p.lineTo(R[i][0], R[i][1]); p.closePath(); return p;
  };
  const spiralPts = (cx, cy, r0, a0, turns, dir = 1, n = 20) => { const o = []; for (let i = 0; i <= n; i++) { const q = i / n, a = a0 + dir * q * turns * TAU, r = r0 * (1 - q * 0.85); o.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return o; };
  const mix = (a, b, t) => [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)];
  const rgb = (v) => 'rgb(' + v[0] + ',' + v[1] + ',' + v[2] + ')';
  const INK = [78, 51, 32], GOLDI = [156, 122, 46];

  // ---------- ① 底版（缓存，全静态）：三段渐变＋圆点花纹＋石版斑驳＋马赛克地砖＋绿横幅＋卷草＋金框 ----------
  const bg = () => P.cached('nvS10_bg', W, H, (g) => {
    g.fillStyle = C.paper; g.fillRect(0, 0, W, H);
    const gr = g.createLinearGradient(0, 30, 0, 905); gr.addColorStop(0, C.green); gr.addColorStop(0.55, C.green2); gr.addColorStop(1, C.peach);
    g.fillStyle = gr; g.fillRect(34, 32, W - 68, 875);
    g.strokeStyle = C.dot; g.fillStyle = C.dot; g.lineWidth = 1.6;
    for (let j = 0, y = 62; y < 900; y += 54, j++) for (let x = 64 + (j % 2) * 31; x < 1880; x += 62) {
      g.beginPath(); g.arc(x, y, 10, 0, TAU); g.stroke(); g.beginPath(); g.arc(x, y, 2.6, 0, TAU); g.fill(); }
    const nz = P.canvas(240, 135), ng = nz.getContext('2d'), im = ng.createImageData(240, 135);
    for (let y = 0; y < 135; y++) for (let x = 0; x < 240; x++) { const v = P.fbm(x * 0.05, y * 0.05, 4), i = (y * 240 + x) * 4; im.data[i] = 90; im.data[i + 1] = 70; im.data[i + 2] = 40; im.data[i + 3] = clamp(v * 1.4 + 0.15) * 60; }
    ng.putImageData(im, 0, 0); g.globalAlpha = 0.5; g.drawImage(nz, 0, 0, W, H); g.globalAlpha = 1;
    const tiles = ['#f1ead6', '#8fb08a', '#c9a24a', '#f1ead6', '#a9c39a', '#d98c8c', '#c9a24a', '#f1ead6', '#6f9a80'];
    g.fillStyle = C.line; g.fillRect(34, 898, W - 68, 34);
    for (let k = 0, x = 38; x < 1880; x += 24, k++) { g.fillStyle = tiles[(k * 7 + (k >> 2)) % tiles.length]; g.fillRect(x, 903, 20, 24); }
    g.fillStyle = C.banner; g.fillRect(34, 934, W - 68, 114);
    g.fillStyle = C.line; g.fillRect(34, 932, W - 68, 3); g.fillRect(34, 1046, W - 68, 3);
    // 横幅两侧的鞭线卷草（左右镜像）
    const whip = (s) => { g.save(); if (s < 0) { g.translate(W, 0); g.scale(-1, 1); }
      g.fillStyle = C.cream; g.fill(ribbon(dense([[100, 960], [112, 948], [128, 958], [200, 985], [300, 990], [400, 984]], 10), q => 2 + 5 * Math.sin(Math.PI * Math.min(1, 0.12 + q))));
      g.fillStyle = C.gold; g.fill(ribbon(dense([[130, 1010], [150, 1022], [180, 1004], [260, 985], [330, 975], [380, 975]], 10), q => 2 + 6 * Math.sin(Math.PI * Math.min(1, 0.12 + q))));
      g.fillStyle = C.cream; g.fill(ribbon(dense(spiralPts(112, 956, 16, Math.PI, 0.9, 1), 2), q => 4.5 - q * 3));
      g.fillStyle = C.gold; g.fill(ribbon(dense(spiralPts(142, 1012, 15, 0, 0.8, -1), 2), q => 5 - q * 3.5));
      g.fillStyle = '#d07a86'; g.beginPath(); g.arc(420, 993, 8, 0, TAU); g.fill(); g.fillStyle = '#6fa08a'; g.beginPath(); g.arc(452, 986, 6, 0, TAU); g.fill();
      g.restore(); };
    whip(1); whip(-1);
    g.strokeStyle = C.gold; g.lineWidth = 6; g.strokeRect(22, 20, W - 44, H - 40);
    g.strokeStyle = C.line; g.lineWidth = 2; g.strokeRect(31, 29, W - 62, H - 58); g.strokeRect(16, 14, W - 32, H - 28);
  });

  // ---------- 拱形几何：中心 (960,390) rx720 ry320，两竖边落到 y780 ----------
  const AC = { cx: 960, cy: 390, rx: 720, ry: 320, bot: 780 };
  const archPath = (ins) => { const p = new Path2D(); p.moveTo(AC.cx - AC.rx + ins, AC.bot); p.lineTo(AC.cx - AC.rx + ins, AC.cy); p.ellipse(AC.cx, AC.cy, AC.rx - ins, AC.ry - ins, 0, Math.PI, TAU); p.lineTo(AC.cx + AC.rx - ins, AC.bot); return p; };
  const archWalk = (ins, step) => { const o = [];
    for (let y = AC.bot; y > AC.cy; y -= step) o.push([AC.cx - AC.rx + ins, y]);
    for (let a = Math.PI; a <= TAU + 1e-9; a += 0.07) o.push([AC.cx + Math.cos(a) * (AC.rx - ins), AC.cy + Math.sin(a) * (AC.ry - ins)]);
    for (let y = AC.cy + step; y < AC.bot; y += step) o.push([AC.cx + AC.rx - ins, y]);
    return o; };
  const ARCH_CLIP = archPath(16);

  // 拱缘双藤的点列（左半自底左向穹顶、右半自底右向穹顶，q=0 都在底角）
  const ARC_RAW = archWalk(0, 48);
  const mid = ARC_RAW.length >> 1;
  const ARC_L = dense(ARC_RAW.slice(0, mid + 1), 4);
  const ARC_R = dense(ARC_RAW.slice(mid).reverse(), 4);
  const ARC_GOLD_L = dense(archWalk(42, 44).slice(0, (archWalk(42, 44).length >> 1) + 1), 4);
  const ARC_GOLD_R = dense(archWalk(42, 44).slice(archWalk(42, 44).length >> 1).reverse(), 4);

  // ---------- ② 世界数据（种子随机，模块加载时一次成型） ----------
  const SEEDS = [
    { x: 960, y: 448, R: 90, num: '0.73', ph: 0.4, kind: 0 },
    { x: 640, y: 618, R: 72, num: '-1.2', ph: 2.1, kind: 1 },
    { x: 1280, y: 606, R: 74, num: '2.4', ph: 4.4, kind: 2 },
  ];
  const HALO = { x: 960, y: 240, R: 138 };
  const BLOOM_COLS = [C.poppy, C.gold, C.pink, C.teal, C.lily, C.poppyD];
  const GLASS_COLS = ['#e0b040', '#6fb0a0', '#e9e0c4', '#d9706a', '#c9a24a', '#e6aaa5'];

  // 拱缘花苞（沿拱轮廓，出生=两底角向穹顶蔓延）
  const ARC_NODES = (() => {
    const out = [];
    ARC_RAW.forEach((p, i) => { const u = i / (ARC_RAW.length - 1);
      out.push({ x: p[0], y: p[1], u: u, birth: 3.05 + 1.55 * (1 - Math.abs(2 * u - 1)) }); });
    return out;
  })();
  // 彩色玻璃饰片（拱内缘、随藤逐片点亮）
  const SHARDS = (() => {
    const pts = archWalk(26, 21), out = [];
    pts.forEach((p, i) => { const u = i / (pts.length - 1);
      const b = 3.15 + 1.6 * (1 - Math.abs(2 * u - 1)) + (i % 2) * 0.05;
      const q = pts[Math.min(pts.length - 1, i + 1)];
      out.push({ x: p[0], y: p[1], a: Math.atan2(q[1] - p[1], q[0] - p[0]), col: GLASS_COLS[i % GLASS_COLS.length], birth: b }); });
    return out;
  })();
  // 伴点（三花周围小珠）＋拱缘花苞＋内域花苞 → 统一 NODES；EDGES 用「先出生者优先」的近邻法
  const NET = (() => {
    const r = U.rng(1896), pts = [];
    SEEDS.forEach(s => pts.push({ x: s.x, y: s.y, kind: -1, s: 1.0, birth: -1, ph: s.ph, col: 0 }));
    for (let k = 0; k < 12; k++) { const sd = SEEDS[k % 3], a = r() * TAU, d = sd.R + 52 + r() * 62;
      pts.push({ x: sd.x + Math.cos(a) * d, y: sd.y + Math.sin(a) * d * 0.8, kind: -2, s: 0.38 + r() * 0.2, birth: 2.95 + r() * 0.45, ph: r() * 6.28, col: (r() * 6) | 0 }); }
    ARC_NODES.forEach(n => pts.push({ x: n.x, y: n.y, kind: n.u > 0.42 && n.u < 0.58 ? 0 : (r() < 0.6 ? 0 : 1), s: 0.85 + r() * 0.5, birth: n.birth, ph: r() * 6.28, col: (r() * 6) | 0 }));
    let guard = 0, got = 0;
    while (got < 74 && guard++ < 900) {
      const x = 300 + r() * 1320, y = 150 + r() * 590;
      if (y < AC.cy + 30 && Math.pow((x - AC.cx) / (AC.rx - 70), 2) + Math.pow((y - AC.cy) / (AC.ry - 70), 2) > 1) continue;
      if (y > 742) continue;
      if (Math.hypot(x - HALO.x, y - HALO.y) < 178) continue;
      let near = false;
      for (let q = 0; q < pts.length; q++) { const p = pts[q]; if (Math.hypot(x - p.x, y - p.y) < (p.kind === -1 ? p.R + 60 : 52)) { near = true; break; } }
      if (near) continue;
      pts.push({ x: x, y: y, kind: r() < 0.62 ? 0 : 1, s: 0.7 + r() * 0.7, birth: 0, ph: r() * 6.28, col: (r() * 6) | 0, dx: Math.hypot(x - 960, (y - 470) * 1.1) });
      got++;
    }
    const inner = pts.filter(p => p.dx != null);
    const dmax = inner.reduce((m, p) => Math.max(m, p.dx), 1);
    inner.forEach(p => { p.birth = 3.3 + 2.9 * Math.pow(p.dx / dmax, 0.92); delete p.dx; });
    const byBirth = pts.slice(3 + 12).sort((a, b) => a.birth - b.birth);   // 边按出生序向「先出生者」连
    pts.length = 3 + 12; pts.push.apply(pts, byBirth);
    const edges = [];
    for (let i = 1; i < pts.length; i++) { const p = pts[i], cand = [];
      for (let j = 0; j < i; j++) { const q = pts[j]; if (q.birth > p.birth + 0.02) continue;
        const dd = Math.hypot(p.x - q.x, p.y - q.y); if (dd < 520) cand.push([dd, j]); }
      cand.sort((a, b) => a[0] - b[0]);
      const deg = i < 15 ? 2 : (i % 3 === 0 ? 2 : 1);
      for (let k = 0; k < Math.min(deg, cand.length); k++) { const j = cand[k][1];
        edges.push({ i: j, j: i, t0: Math.max(pts[i].birth, pts[j].birth) + 0.06, bow: U.hash(i * 31 + 7, j) - 0.5 }); }
    }
    return { pts: pts, edges: edges };
  })();

  const STG = [3.6, 4.5, 5.4, 6.3];
  const stageSum = lt => ss(STG[0], STG[0] + 0.35, lt) + ss(STG[1], STG[1] + 0.35, lt) + ss(STG[2], STG[2] + 0.35, lt) + ss(STG[3], STG[3] + 0.35, lt);

  // ---------- ③ 相机：拍一缓推端详 → 拍二缓拉远看花窗长全 → 1T+ 一次快推重音 → 停 ----------
  function cam(lt) {
    if (lt < 3) { const p = ss(0, 3, lt); return { z: lerp(1.06, 1.20, p), cx: 960, cy: 530 }; }
    if (lt < 6.3) { const p = ease.inOut(ss(3, 6.3, lt)); return { z: lerp(1.20, 0.97, p), cx: 960, cy: lerp(530, 540, p) }; }
    if (lt < 6.58) { const p = ease.out(ss(6.3, 6.58, lt)); return { z: lerp(0.97, 1.035, p), cx: 960, cy: 540 }; }
    if (lt < 7.3) { const p = ss(6.58, 7.3, lt); return { z: lerp(1.035, 1.0, p), cx: 960, cy: 540 }; }
    return { z: 1.0, cx: 960, cy: 540 };
  }
  const countVal = (lt) => {
    const K = [[3.9, 4.5, 1.5, 175], [4.5, 5.4, 175, 540], [5.4, 6.3, 540, 1000]];
    if (lt < 3.9) return 1.5;
    for (let q = 0; q < K.length; q++) { const a = K[q]; if (lt >= a[0] && lt < a[1]) return a[2] + (a[3] - a[2]) * ease.inOut((lt - a[0]) / (a[1] - a[0])); }
    return 1000;
  };
  const fmtB = (v) => v >= 999.5 ? '1T+' : (v < 10 ? v.toFixed(1) : String(Math.round(v))) + 'B';

  // ---------- ④ 顶部光轮（金钉缓转＋玫瑰窗花瓣反转）＋ 升入中心的太阳＋放射铅条 ----------
  function haloDraw(c, lt, t) {
    const inn = ease.outBack(clamp((lt - 0.15) / 0.6, 0, 1));
    if (inn <= 0.02) return;
    c.save(); c.translate(HALO.x, HALO.y); c.scale(0.86 + 0.14 * inn, 0.86 + 0.14 * inn); c.globalAlpha = clamp(inn * 1.4);
    const rot = t * 0.9;
    c.lineWidth = 3; c.strokeStyle = C.line;
    c.fillStyle = C.gold; c.beginPath(); c.arc(0, 0, HALO.R, 0, TAU); c.fill(); c.stroke();
    for (let i = 0; i < 18; i++) { const a = rot + i / 18 * TAU, x = Math.cos(a) * (HALO.R - 13), y = Math.sin(a) * (HALO.R - 13);
      c.fillStyle = C.cream; c.beginPath(); c.arc(x, y, 7.5, 0, TAU); c.fill(); c.lineWidth = 2; c.stroke();
      c.fillStyle = C.red; c.beginPath(); c.arc(x, y, 3, 0, TAU); c.fill(); }
    c.lineWidth = 3; c.fillStyle = C.teal; c.beginPath(); c.arc(0, 0, 105, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = C.haloPink; c.beginPath(); c.arc(0, 0, 86, 0, TAU); c.fill(); c.stroke();
    c.save(); c.rotate(-rot * 0.7); c.strokeStyle = '#c98a86'; c.lineWidth = 2;
    for (let i = 0; i < 14; i++) { c.save(); c.rotate(i / 14 * TAU);
      c.fillStyle = i % 2 ? '#e3a5a0' : '#efc4be'; c.beginPath(); c.moveTo(38, 0);
      c.quadraticCurveTo(52, -12, 66, 0); c.quadraticCurveTo(52, 12, 38, 0); c.fill(); c.stroke(); c.restore(); }
    c.restore(); c.restore();
  }
  function sunDraw(c, lt, t) {
    if (lt < 3.2) return;
    const k = ease.inOut(ss(3.2, 5.7, lt));
    const sy = lerp(660, HALO.y, k) + (k >= 1 ? Math.sin(t * 0.8) * 3 : 0);
    c.save(); c.globalAlpha = clamp(ss(3.2, 3.7, lt));
    c.fillStyle = '#f7e2a0'; c.beginPath(); c.arc(HALO.x, sy, 78, 0, TAU); c.fill();
    c.strokeStyle = C.line; c.lineWidth = 4; c.stroke();
    const sun = c.createRadialGradient(HALO.x - 12, sy - 12, 6, HALO.x, sy, 58);
    sun.addColorStop(0, '#f8c860'); sun.addColorStop(1, '#e8a43c');
    c.fillStyle = sun; c.beginPath(); c.arc(HALO.x, sy, 58, 0, TAU); c.fill(); c.stroke();
    c.restore();
    return sy;
  }
  function raysDraw(c, lt, t, sy) {
    if (lt < 3.4 || !sy) return;
    const a = clamp(ss(3.4, 4.1, lt)) * 0.55;
    c.save(); c.clip(ARCH_CLIP); c.globalAlpha = a;
    c.strokeStyle = C.line; c.lineWidth = 3; c.lineCap = 'round';
    const rot = lt * 0.9;
    for (let i = 0; i < 14; i++) { const ang = (i + 0.5) / 14 * TAU + rot * 0.22 + Math.sin(rot + i) * 0.04;
      c.beginPath(); c.moveTo(HALO.x + Math.cos(ang) * 96, sy + Math.sin(ang) * 96);
      c.lineTo(HALO.x + Math.cos(ang) * 545, sy + Math.sin(ang) * 545); c.stroke(); }
    c.restore();
  }

  // ---------- ⑤ 拱缘双藤（外棕内绿的鞭线拱）＋内圈金细线（随生长揭示） ----------
  function archVineDraw(c, lt) {
    const p = ss(3.0, 4.6, lt); if (p <= 0.01) return;
    const nL = Math.max(2, Math.round(p * ARC_L.length)), nR = Math.max(2, Math.round(p * ARC_R.length));
    const wf = q => 8.5 - 1.6 * q;
    [[ARC_L.slice(0, nL)], [ARC_R.slice(0, nR)]].forEach(([seg]) => {
      const d = dense(seg, 3);
      c.fillStyle = C.line; c.fill(ribbon(d, q => wf(q) + 3.4));
      c.fillStyle = C.stem; c.fill(ribbon(d, wf));
    });
    const gL = Math.max(2, Math.round(p * ARC_GOLD_L.length)), gR = Math.max(2, Math.round(p * ARC_GOLD_R.length));
    c.strokeStyle = C.gold; c.lineWidth = 2.2; c.globalAlpha = 0.85;
    [ARC_GOLD_L.slice(0, gL), ARC_GOLD_R.slice(0, gR)].forEach(seg => {
      c.beginPath(); seg.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.stroke(); });
    c.globalAlpha = 1;
  }
  function shardsDraw(c, lt) {
    c.lineWidth = 1.4; c.strokeStyle = C.line;
    for (let i = 0; i < SHARDS.length; i++) { const s = SHARDS[i];
      const born = ss(s.birth, s.birth + 0.3, lt); if (born <= 0) continue;
      const pop = 0.55 + 0.45 * ease.outBack(clamp(born, 0, 1));
      c.save(); c.translate(s.x, s.y); c.rotate(s.a); c.scale(pop, pop); c.globalAlpha = clamp(born * 1.5);
      c.fillStyle = s.col; c.fillRect(-6.5, -6.5, 13, 13); c.strokeRect(-6.5, -6.5, 13, 13);
      c.restore(); }
    c.globalAlpha = 1;
  }

  // ---------- ⑥ 花窗网络：连线藤＋花苞（连片弹出、呼吸；拍三描金收稳） ----------
  function bloomDraw(c, p, born, lt, t, calm, gild) {
    const pop = ease.outBack(clamp(born, 0, 1)); if (pop <= 0.02) return;
    const R = 13 * p.s * pop * (1 + 0.07 * calm * Math.sin(t * 2.1 + p.ph));
    const x = p.x + Math.sin(t * 1.2 + p.ph) * 2.4, y = p.y;
    const col = BLOOM_COLS[p.col];
    if (p.kind === 0) {                                        // 开放小花苞：5 瓣＋金心
      const rot = t * 0.18 * (p.ph % 2 > 1 ? 1 : -1) + p.ph;
      c.fillStyle = col; c.strokeStyle = C.line; c.lineWidth = 1.6;
      for (let i = 0; i < 5; i++) { const a = rot + i / 5 * TAU;
        c.beginPath(); c.ellipse(x + Math.cos(a) * R * 0.62, y + Math.sin(a) * R * 0.62, R * 0.5, R * 0.3, a, 0, TAU); c.fill(); c.stroke(); }
      c.fillStyle = C.gold; c.beginPath(); c.arc(x, y, R * 0.3, 0, TAU); c.fill(); c.stroke();
    } else {                                                   // 闭花苞：绿萼＋彩尖
      c.fillStyle = C.leaf; c.strokeStyle = C.line; c.lineWidth = 1.5;
      c.beginPath(); c.ellipse(x, y, R * 0.42, R * 0.72, 0, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = col; c.beginPath(); c.arc(x, y - R * 0.55, R * 0.34, 0, TAU); c.fill(); c.stroke();
    }
    if (gild > 0) { c.strokeStyle = 'rgba(201,162,74,' + (0.7 * gild).toFixed(3) + ')'; c.lineWidth = 1.6;
      c.beginPath(); c.arc(x, y, R * 1.25 + 3, 0, TAU); c.stroke(); }
  }
  function netDraw(c, lt, t, calm, gild) {
    c.save(); c.lineCap = 'round';
    for (let e = 0; e < NET.edges.length; e++) { const E = NET.edges[e], A = NET.pts[E.i], B = NET.pts[E.j];
      const rv = ss(E.t0, E.t0 + 0.24, lt); if (rv <= 0) continue;
      const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2, dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1;
      const px = -dy / L, py = dx / L, bow = E.bow * L * 0.15;
      c.globalAlpha = Math.min(1, rv);
      c.strokeStyle = C.line; c.lineWidth = 3.8;
      c.beginPath(); c.moveTo(A.x, A.y); c.quadraticCurveTo(mx + px * bow, my + py * bow, B.x, B.y); c.stroke();
      c.strokeStyle = C.stemHi; c.lineWidth = 1.7; c.stroke();
      if (gild > 0) { c.strokeStyle = 'rgba(201,162,74,' + (0.8 * gild).toFixed(3) + ')'; c.lineWidth = 1.2; c.stroke(); }
    }
    c.globalAlpha = 1;
    for (let i = 0; i < NET.pts.length; i++) { const p = NET.pts[i];
      if (p.kind === -1) continue;                                            // 三枚种子花另画
      const born = ss(p.birth, p.birth + 0.35, lt); if (born <= 0) continue;
      if (p.kind === -2) {                                                     // 伴点小珠
        const pop = ease.outBack(clamp(born, 0, 1)) * (1 + 0.1 * calm * Math.sin(t * 2.6 + p.ph));
        const R = 8 * p.s * pop;
        c.fillStyle = p.col % 2 ? C.cream : C.gold; c.strokeStyle = C.line; c.lineWidth = 1.6;
        c.beginPath(); c.arc(p.x, p.y, Math.max(0.5, R), 0, TAU); c.fill(); c.stroke();
      } else bloomDraw(c, p, born, lt, t, calm, gild);
    }
    c.restore();
  }

  // ---------- ⑦ S 形奶白卷草（环绕花组，行波轻摆） ----------
  const SCROLLS = [
    { w: 22, ph: 0.6, pts: [[620, 706], [566, 668], [520, 616], [492, 556], [494, 502], [520, 468], [556, 452]] },
    { w: 18, ph: 2.4, pts: [[1300, 696], [1352, 656], [1396, 602], [1422, 546], [1420, 494], [1392, 462], [1356, 450]] },
    { w: 14, ph: 4.4, pts: [[742, 398], [700, 424], [662, 462], [636, 504], [634, 544], [652, 566], [676, 570]] },
  ];
  function scrollsDraw(c, lt, t) {
    const inn = clamp(ss(0.3, 1.1, lt)); if (inn <= 0.02) return;
    SCROLLS.forEach((s, k) => {
      const e = spiralPts(s.pts[s.pts.length - 1][0], s.pts[s.pts.length - 1][1], 26, k * 1.1, 1.05, k % 2 ? -1 : 1, 12);
      const raw = s.pts.map((p, i) => [p[0] + Math.sin(i * 1.05 + s.ph - t * 0.8) * 5, p[1] + Math.cos(i * 0.9 + s.ph - t * 0.8) * 4]);
      const all = dense(raw.concat(e.slice(1)), 4), rb = ribbon(all, q => 2 + (s.w - 2) * Math.sin(Math.PI * Math.min(1, 0.12 + q * 1.06)));
      c.globalAlpha = 0.95 * inn; c.fillStyle = '#fbf7ec'; c.fill(rb);
      c.strokeStyle = '#8a6a4a'; c.lineWidth = 1.6; c.stroke(rb);
      c.strokeStyle = 'rgba(160,130,100,.55)'; c.lineWidth = 1.1;
      c.beginPath(); all.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke();
    });
    c.globalAlpha = 1;
  }

  // ---------- ⑧ 中央花茎、分支、叶片（鞭线茎，上段随摇摆） ----------
  const sway = (t, ph, amp) => (Math.sin(t * 7.5 + ph) * 13 + Math.sin(t * 3.1 + ph * 2) * 5) * amp;
  const stemDraw = (c, base, head, bend, w) => { const pts = dense([base, [lerp(base[0], head[0], 0.35) + bend, lerp(base[1], head[1], 0.35)], [lerp(base[0], head[0], 0.72) - bend * 0.6, lerp(base[1], head[1], 0.72)], head], 8);
    c.fillStyle = C.line; c.fill(ribbon(pts, q => w + 3 - q * 3)); c.fillStyle = C.stem; c.fill(ribbon(pts, q => w - 1 - q * 3)); };
  const bladeDraw = (c, base, tip, bend, w) => { const pts = dense([base, [lerp(base[0], tip[0], 0.45) + bend, lerp(base[1], tip[1], 0.45)], tip], 8);
    const p = ribbon(pts, q => w * Math.sin(Math.PI * Math.min(1, 0.12 + q * 0.88)) + 1);
    c.fillStyle = C.leaf; c.fill(p); c.strokeStyle = C.line; c.lineWidth = 2.4; c.stroke(p);
    c.strokeStyle = C.leafD; c.lineWidth = 1.8; c.beginPath(); pts.slice(2, -3).forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.stroke(); };
  function stemsDraw(c, lt, t, amp) {
    const d0 = sway(t, 0.4, amp), d1 = sway(t, 2.1, amp), d2 = sway(t, 4.4, amp);
    stemDraw(c, [960, 920], [960 + d0 * 0.9, 452], 46);
    stemDraw(c, [942, 812], [SEEDS[1].x + d1, SEEDS[1].y + 66], -56, 8);
    stemDraw(c, [978, 806], [SEEDS[2].x + d2, SEEDS[2].y + 64], 58, 8);
    bladeDraw(c, [905, 812], [830, 742], 26 + d0 * 0.3, 30); bladeDraw(c, [1010, 780], [1088, 716], -24 + d0 * 0.3, 26);
    bladeDraw(c, [700, 838], [646, 762], -20 + d1 * 0.3, 26); bladeDraw(c, [1244, 820], [1306, 750], 22 + d2 * 0.3, 28);
    bladeDraw(c, [960, 700], [900, 636], 18, 22);
  }

  // ---------- ⑨ 三朵参数花（罂粟／粉玫瑰／金轮花；可变线宽花瓣缓开） ----------
  const poppyHead = (c, x, y, r, rot, open) => {
    c.save(); c.translate(x, y); c.rotate(rot);
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; c.save(); c.rotate(a);
      c.fillStyle = i % 2 ? C.poppy : '#df7d74';
      c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(r * 0.9 * open, -r * 0.55, r * 1.12 * open, r * 0.25, r * 0.4 * open + r * 0.18, r * 0.62 * open); c.closePath();
      c.fill(); c.strokeStyle = C.line; c.lineWidth = 2.5; c.stroke(); c.restore(); }
    c.strokeStyle = C.poppyD; c.lineWidth = 2;
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + 0.3;
      c.beginPath(); c.moveTo(Math.cos(a) * r * 0.3 * open, Math.sin(a) * r * 0.3 * open); c.lineTo(Math.cos(a) * r * 0.75 * open, Math.sin(a) * r * 0.75 * open); c.stroke(); }
    c.fillStyle = '#3f6a4a'; c.beginPath(); c.arc(0, 0, r * 0.24, 0, TAU); c.fill(); c.strokeStyle = C.line; c.lineWidth = 2.5; c.stroke();
    c.fillStyle = '#e2b84a'; for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; c.beginPath(); c.arc(Math.cos(a) * r * 0.36 * open, Math.sin(a) * r * 0.36 * open, 3, 0, TAU); c.fill(); }
    c.restore();
  };
  const roseHead = (c, x, y, r, rot, open) => {
    c.save(); c.translate(x, y); c.rotate(rot);
    const rings = [[8, 0.98, C.pink], [6, 0.66, '#f0b4bb'], [4, 0.38, '#f7d8d4']];
    rings.forEach(function (rg, k) { const n = rg[0], f = rg[1] * open + 0.06;
      c.fillStyle = rg[2]; c.strokeStyle = C.line; c.lineWidth = 2.2;
      for (let i = 0; i < n; i++) { const a = i / n * TAU + k * 0.35;
        c.beginPath(); c.ellipse(Math.cos(a) * r * f * 0.5, Math.sin(a) * r * f * 0.5, r * f * 0.52, r * f * 0.3, a, 0, TAU); c.fill(); c.stroke(); } });
    c.fillStyle = C.gold; c.beginPath(); c.arc(0, 0, r * 0.16, 0, TAU); c.fill(); c.strokeStyle = C.line; c.lineWidth = 2.2; c.stroke();
    c.fillStyle = '#d99a2a'; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; c.beginPath(); c.arc(Math.cos(a) * r * 0.26 * open, Math.sin(a) * r * 0.26 * open, 3.2, 0, TAU); c.fill(); }
    c.restore();
  };
  const goldHead = (c, x, y, r, rot, open) => {
    c.save(); c.translate(x, y); c.rotate(rot);
    c.fillStyle = C.gold; c.strokeStyle = C.line; c.lineWidth = 2.4;
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU;
      c.beginPath(); c.ellipse(Math.cos(a) * r * 0.52 * open, Math.sin(a) * r * 0.52 * open, r * 0.42 * open + r * 0.1, r * 0.2, a, 0, TAU); c.fill(); c.stroke(); }
    c.fillStyle = C.line; c.beginPath(); c.arc(0, 0, r * 0.3, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = C.cream; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; c.beginPath(); c.arc(Math.cos(a) * r * 0.3, Math.sin(a) * r * 0.3, 3, 0, TAU); c.fill(); }
    c.restore();
  };
  function headsInto(g, lt, t, amp) {
    for (let k = 0; k < 3; k++) { const s = SEEDS[k];
      const d = sway(t, s.ph, amp), open = clamp(ss(0.25 + k * 0.28, 1.6 + k * 0.28, lt));
      const hy = s.y + Math.abs(d) * 0.15, hx = s.x + d, rot = d * 0.012 + s.ph * 0.2;
      if (open < 0.3) {                                                   // 未开：萼托＋彩尖
        g.fillStyle = C.leaf; g.strokeStyle = C.line; g.lineWidth = 2.5;
        g.beginPath(); g.ellipse(hx, hy, s.R * 0.3, s.R * 0.52, 0.2, 0, TAU); g.fill(); g.stroke();
        g.fillStyle = [C.poppy, C.pink, C.gold][k]; g.beginPath(); g.arc(hx, hy - s.R * 0.4, s.R * 0.2, 0, TAU); g.fill(); g.stroke();
      } else if (k === 0) poppyHead(g, hx, hy, s.R, rot, ease.out(clamp((open - 0.3) / 0.7)));
      else if (k === 1) roseHead(g, hx, hy, s.R, rot, ease.out(clamp((open - 0.3) / 0.7)));
      else goldHead(g, hx, hy, s.R, rot, ease.out(clamp((open - 0.3) / 0.7)));
    }
  }

  // ---------- ⑩ 数字吊牌（奶白弧牌＋金边＋LibreBaskerville 数字，随花轻晃） ----------
  function plaqueDraw(c, s, t, lt, amp) {
    const d = sway(t, s.ph, amp);
    const inn = clamp(ss(0.7 + s.ph * 0.1, 1.3 + s.ph * 0.1, lt)); if (inn <= 0.02) return;
    const ax = s.x + d, ay = s.y + s.R * 0.98;
    const ang = clamp(d * 0.014, -0.22, 0.22) + Math.sin(t * 2.3 + s.ph) * 0.035;
    c.save(); c.globalAlpha = inn; c.translate(ax, ay); c.rotate(ang);
    c.strokeStyle = C.gold; c.lineWidth = 2.4; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 26); c.stroke();
    c.translate(0, 26 + 30);
    c.font = '40px "LibreBaskerville-700"';
    const tw = c.measureText(s.num).width;
    const w = tw + 46, h = 58;
    c.fillStyle = C.cream; c.strokeStyle = C.line; c.lineWidth = 2;
    c.beginPath(); c.moveTo(-w / 2, -h / 2 + 10); c.quadraticCurveTo(0, -h / 2 - 12, w / 2, -h / 2 + 10);
    c.lineTo(w / 2, h / 2 - 8); c.quadraticCurveTo(0, h / 2 + 12, -w / 2, h / 2 - 8); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = C.gold; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#4e3320'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(s.num, 0, 3);
    c.fillStyle = C.gold; c.beginPath(); c.arc(-w / 2 + 12, 0, 3, 0, TAU); c.fill(); c.beginPath(); c.arc(w / 2 - 12, 0, 3, 0, TAU); c.fill();
    c.restore();
  }

  // ---------- ⑪ 底部弧形铭牌计数器（拱下世界层；滚动＋里程碑逐字点金＋1T+ 描金一瞬） ----------
  function counterDraw(c, lt, t) {
    if (lt < 3.18) return;
    const ent = ss(3.2, 3.8, lt), out = 1 - ss(6.9, 7.35, lt);
    const a = ent * out; if (a <= 0.01) return;
    const rise = (1 - ease.out(ent)) * 70 + (1 - out) * 26;
    c.save(); c.globalAlpha = a; c.translate(960, 828 + rise);
    const pulse = ss(6.3, 6.42, lt) * (1 - ss(6.72, 7.0, lt));
    const BW = 540, BH = 104, bow = 24;
    // 端翼（banner 侧翼小片）
    c.fillStyle = '#e9ddc2'; c.strokeStyle = C.line; c.lineWidth = 2;
    c.beginPath(); c.moveTo(-BW / 2 - 34, -BH / 2 + 14); c.lineTo(-BW / 2 + 8, -BH / 2 + 2); c.lineTo(-BW / 2 + 8, BH / 2 - 6); c.lineTo(-BW / 2 - 34, BH / 2 + 4); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(BW / 2 + 34, -BH / 2 + 14); c.lineTo(BW / 2 - 8, -BH / 2 + 2); c.lineTo(BW / 2 - 8, BH / 2 - 6); c.lineTo(BW / 2 + 34, BH / 2 + 4); c.closePath(); c.fill(); c.stroke();
    // 弧形主体
    c.beginPath(); c.moveTo(-BW / 2, -BH / 2 + 12); c.quadraticCurveTo(0, -BH / 2 - bow, BW / 2, -BH / 2 + 12);
    c.lineTo(BW / 2, BH / 2 - 10); c.quadraticCurveTo(0, BH / 2 + bow * 0.8, -BW / 2, BH / 2 - 10); c.closePath();
    c.fillStyle = C.cream; c.fill(); c.strokeStyle = C.line; c.lineWidth = 2.4; c.stroke();
    c.strokeStyle = mixHex(C.gold, '#f2d98a', pulse); c.lineWidth = 2.6 + pulse * 2.4;
    c.beginPath(); c.moveTo(-BW / 2 + 14, -BH / 2 + 16); c.quadraticCurveTo(0, -BH / 2 - bow + 16, BW / 2 - 14, -BH / 2 + 16);
    c.lineTo(BW / 2 - 14, BH / 2 - 14); c.quadraticCurveTo(0, BH / 2 + bow * 0.8 - 14, -BW / 2 + 14, BH / 2 - 14); c.closePath(); c.stroke();
    // 金珠流苏（牌底两角）
    c.strokeStyle = C.gold; c.lineWidth = 2; [-1, 1].forEach(function (sd) {
      c.beginPath(); c.moveTo(sd * (BW / 2 - 26), BH / 2 + 4); c.lineTo(sd * (BW / 2 - 26), BH / 2 + 18); c.stroke();
      c.fillStyle = C.gold; c.beginPath(); c.arc(sd * (BW / 2 - 26), BH / 2 + 24, 5, 0, TAU); c.fill();
      c.strokeStyle = C.line; c.lineWidth = 1.4; c.stroke(); c.strokeStyle = C.gold; c.lineWidth = 2; });
    // 小标「参数量」
    c.fillStyle = '#4e3320'; c.font = '30px "LXGWWenKai-500"'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('参数量', 0, -28);
    // 数字：入场逐字点亮 → 滚动 → 里程碑逐字点金
    const txt = fmtB(countVal(lt));
    c.font = '62px "LibreBaskerville-700"';
    const ws = [...txt].map(function (ch) { return c.measureText(ch).width; });
    const tot = ws.reduce(function (s2, w2) { return s2 + w2; }, 0) - 2;
    let m = 0; for (let q = 0; q < STG.length; q++) if (lt >= STG[q]) m = STG[q];   // 最近里程碑（3.6 起步不闪）
    let cx = -tot / 2;
    for (let i = 0; i < txt.length; i++) {
      const reveal = clamp(ss(3.32 + i * 0.09, 3.46 + i * 0.09, lt));
      const glow = m > 3.6 && m < 6.2 ? ss(m + 0.05 * i, m + 0.05 * i + 0.08, lt) * (1 - ss(m + 0.5 + 0.05 * i, m + 0.62 + 0.05 * i, lt)) : 0;
      const pl = ss(6.3, 6.45, lt) * (1 - ss(6.8, 7.1, lt));
      if (reveal > 0.01) {
        c.fillStyle = rgb(mix(mix(INK, GOLDI, glow), [242, 219, 138], pl * 0.8));
        c.globalAlpha = a * reveal;
        c.fillText(txt[i], cx + ws[i] / 2, 24);
      }
      cx += ws[i];
    }
    c.globalAlpha = a;
    c.restore();
  }
  function mixHex(h1, h2, q) { const p = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    return rgb(mix(p(h1), p(h2), q)); }

  // ---------- ⑫ 拍三：马赛克台＋三块装饰徽章（花饰书=数据／齿轮花窗=方法／百合灯=算力）＋铭牌 ----------
  const EMB = [{ x: 420, y: 722, txt: '数据', t0: 7.15 }, { x: 960, y: 730, txt: '方法', t0: 7.52 }, { x: 1500, y: 722, txt: '算力', t0: 7.89 }];
  const medallion = (c, t) => {
    c.fillStyle = C.gold; c.strokeStyle = C.line; c.lineWidth = 3;
    c.beginPath(); c.arc(0, 0, 82, 0, TAU); c.fill(); c.stroke();
    const rot = t * 0.25;
    for (let i = 0; i < 12; i++) { const a = rot + i / 12 * TAU;
      c.fillStyle = C.cream; c.beginPath(); c.arc(Math.cos(a) * 71, Math.sin(a) * 71, 5, 0, TAU); c.fill();
      c.lineWidth = 1.8; c.stroke(); }
    c.fillStyle = C.cream; c.beginPath(); c.arc(0, 0, 62, 0, TAU); c.fill(); c.lineWidth = 2.4; c.stroke();
    c.strokeStyle = C.gold; c.lineWidth = 1.6; c.beginPath(); c.arc(0, 0, 55, 0, TAU); c.stroke();
  };
  function emblemDraw(c, k, lt, t) {
    const pop = clamp((lt - EMB[k].t0) / 0.6, 0, 1); if (pop <= 0) return;
    const rise = (1 - pop) * 290, sc = 0.78 + 0.22 * ease.outBack(pop);
    const e = EMB[k];
    // 马赛克台（先于徽章半拍升起）
    const ped = clamp((lt - (e.t0 - 0.28)) / 0.4, 0, 1);
    if (ped > 0) { c.save(); c.globalAlpha = ped;
      c.translate(e.x, e.y + 104 + (1 - ease.out(ped)) * 46);
      const tiles2 = ['#8fb08a', '#c9a24a', '#d98c8c', '#6f9a80', '#f1ead6', '#a9c39a'];
      c.fillStyle = C.line; c.fillRect(-92, 0, 184, 26);
      for (let i = 0, x = -88; x < 84; x += 16, i++) { c.fillStyle = tiles2[(i * 5 + 2) % tiles2.length]; c.fillRect(x, 4, 14, 18); }
      c.fillStyle = C.gold; c.fillRect(-92, -3, 184, 4);
      c.strokeStyle = C.line; c.lineWidth = 2; c.strokeRect(-92, 0, 184, 26); c.restore(); }
    c.save(); c.translate(e.x, e.y + rise); c.scale(sc, sc); c.globalAlpha = Math.min(1, pop * 2);
    medallion(c, t);
    if (k === 0) {                                       // 花饰书摞
      const B = [[-52, -8, 104, 26, C.banner], [-42, -34, 84, 26, C.poppy], [-32, -58, 64, 24, C.gold]];
      B.forEach(function (b) { c.fillStyle = b[4]; c.strokeStyle = C.line; c.lineWidth = 2.6;
        c.beginPath(); c.rect(b[0], b[1], b[2], b[3]); c.fill(); c.stroke();
        c.fillStyle = C.cream; c.fillRect(b[0] + b[2] - 9, b[1] + 3, 4, b[3] - 6);
        c.fillStyle = C.gold; c.beginPath(); c.arc(b[0] + 16, b[1] + b[3] / 2, 4, 0, TAU); c.fill(); c.strokeStyle = C.line; c.lineWidth = 1.4; c.stroke(); });
      c.fillStyle = C.leaf; c.strokeStyle = C.line; c.lineWidth = 2.2;                   // 书顶小芽＋迷你苞
      c.beginPath(); c.moveTo(0, -70); c.quadraticCurveTo(4, -84, 0, -96); c.quadraticCurveTo(-4, -84, 0, -70); c.fill(); c.stroke();
      c.fillStyle = C.poppy; c.beginPath(); c.arc(0, -100, 7, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = C.gold; c.beginPath(); c.arc(0, -100, 2.5, 0, TAU); c.fill();
    } else if (k === 1) {                                // 齿轮花窗（齿轮缓转＝方法的活）
      const seg = [C.teal, C.haloPink, C.gold];
      for (let i = 0; i < 8; i++) { const a0 = i / 8 * TAU, a1 = (i + 1) / 8 * TAU;
        c.fillStyle = seg[i % 3]; c.strokeStyle = C.line; c.lineWidth = 1.6;
        c.beginPath(); c.moveTo(Math.cos(a0) * 22, Math.sin(a0) * 22);
        c.arc(0, 0, 52, a0, a1); c.lineTo(Math.cos(a1) * 22, Math.sin(a1) * 22); c.closePath(); c.fill(); c.stroke(); }
      const rot = t * 0.4; const gp = new Path2D();
      for (let i = 0; i < 20; i++) { const a = rot + (i / 20) * TAU, rr = i % 2 ? 24 : 36;
        const px = Math.cos(a) * rr, py = Math.sin(a) * rr; i ? gp.lineTo(px, py) : gp.moveTo(px, py); }
      gp.closePath();
      c.fillStyle = C.iron; c.strokeStyle = C.line; c.lineWidth = 2.6; c.fill(gp); c.stroke(gp);
      c.strokeStyle = C.line; c.lineWidth = 5;
      for (let i = 0; i < 4; i++) { const a = rot * 1.2 + i * Math.PI / 2;
        c.beginPath(); c.moveTo(Math.cos(a) * 8, Math.sin(a) * 8); c.lineTo(Math.cos(a) * 20, Math.sin(a) * 20); c.stroke(); }
      c.fillStyle = C.gold; c.beginPath(); c.arc(0, 0, 9, 0, TAU); c.fill(); c.strokeStyle = C.line; c.lineWidth = 2; c.stroke();
    } else {                                             // 百合油灯（灯焰摇曳＝算力的活）
      c.fillStyle = C.gold; c.strokeStyle = C.line; c.lineWidth = 2.6;
      c.beginPath(); c.moveTo(-30, 44); c.lineTo(30, 44); c.lineTo(20, 34); c.lineTo(-20, 34); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = C.cream; c.beginPath(); c.ellipse(0, 24, 27, 14, 0, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = C.gold; c.beginPath(); c.moveTo(-24, 18); c.quadraticCurveTo(-30, -6, -8, -12);
      c.quadraticCurveTo(22, -18, 24, 2); c.lineTo(20, 10); c.quadraticCurveTo(0, 16, -24, 18); c.closePath(); c.fill(); c.stroke();
      const sp = dense(spiralPts(26, 14, 12, -0.6, 0.9, -1, 12), 2);
      c.fillStyle = C.gold; c.fill(ribbon(sp, q => 5 - q * 3.4)); c.strokeStyle = C.line; c.lineWidth = 1.6; c.stroke(ribbon(sp, q => 5 - q * 3.4));
      const fl = 1 + 0.14 * Math.sin(t * 9 + Math.sin(t * 13) * 1.5);
      c.save(); c.globalCompositeOperation = 'lighter';
      const g2 = c.createRadialGradient(0, -22, 2, 0, -22, 46);
      g2.addColorStop(0, 'rgba(255,236,160,.42)'); g2.addColorStop(1, 'rgba(255,236,160,0)');
      c.fillStyle = g2; c.beginPath(); c.arc(0, -22, 46, 0, TAU); c.fill(); c.restore();
      c.fillStyle = C.lily; c.strokeStyle = C.line; c.lineWidth = 2.2;                   // 百合灯罩：6 白瓣围焰
      for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) / 6 * 2.1;
        c.beginPath(); c.ellipse(Math.cos(a) * 15, -24 + Math.sin(a) * 15, 16, 7.5, a + Math.PI / 2, 0, TAU); c.fill(); c.stroke(); }
      const flame = (fy, s2, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(0, fy - s2 * 2);
        c.quadraticCurveTo(s2, fy - s2, 0, fy + s2 * 0.4); c.quadraticCurveTo(-s2, fy - s2, 0, fy - s2 * 2); c.closePath(); c.fill(); };
      flame(-24, 11 * fl, '#e8a83a'); flame(-24, 5.5 * fl, '#fbe6a0');
      c.strokeStyle = C.line; c.lineWidth = 2; flame(-24, 11 * fl, null); c.stroke();
    }
    c.restore();
    // 铭牌（字 ≤880）
    const ta = clamp((lt - (e.t0 + 0.42)) / 0.3, 0, 1);
    if (ta > 0) { c.save(); c.globalAlpha = ta; c.translate(e.x, 852 + (1 - ease.out(ta)) * 12);
      c.font = '36px "LXGWWenKai-500"';
      const w = c.measureText(e.txt).width + 52;
      c.fillStyle = C.cream; c.strokeStyle = C.line; c.lineWidth = 2;
      c.beginPath(); c.moveTo(-w / 2, -14); c.quadraticCurveTo(0, -26, w / 2, -14); c.lineTo(w / 2, 16); c.quadraticCurveTo(0, 26, -w / 2, 16); c.closePath(); c.fill(); c.stroke();
      c.strokeStyle = C.gold; c.lineWidth = 1.8; c.stroke();
      c.fillStyle = '#4e3320'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(e.txt, 0, 2); c.restore(); }
  }
  // 金色鞭线卷草环绕三物（生长收尾）
  function goldScrolls(c, lt, t) {
    for (let k = 0; k < 3; k++) { const e = EMB[k];
      for (let sd = -1; sd <= 1; sd += 2) {
        const t0 = 8.0 + k * 0.3 + (sd < 0 ? 0 : 0.15);
        const p = ss(t0, t0 + 0.7, lt); if (p <= 0.01) continue;
        const raw = [[e.x + sd * 92, e.y + 10], [e.x + sd * 126, e.y + 30], [e.x + sd * 146, e.y + 58], [e.x + sd * 150, e.y + 84], [e.x + sd * 136, e.y + 104]]
          .map(function (q, i) { const w2 = Math.sin(i * 1.3 + t * 0.9 + k) * 4 * p; return [q[0], q[1] + w2]; });
        const sp = spiralPts(e.x + sd * 128, e.y + 112, 20, sd > 0 ? 2.4 : 0.6, 1.05, sd, 10);
        const all = dense(raw.concat(sp.slice(1)), 4);
        const n = Math.max(3, Math.round(all.length * p));
        const seg = all.slice(0, n), rb = ribbon(seg, q => 8 * (1 - q) + 1.6);
        c.fillStyle = C.gold; c.fill(rb); c.strokeStyle = C.goldD; c.lineWidth = 1.4; c.stroke(rb);
      }
    }
  }

  // ---------- ⑬ 屏上字（左上悬挂牌匾：金链挂顶框＋拱顶奶白弧牌，拍间淡换） ----------
  const BEAT_TXT = [[0.15, 2.95, '参数', 104], [3.12, 6.9, '疯狂卷参数', 84], [7.06, 10.3, '参数之外', 92]];
  function screenText(c, lt) {
    for (let q = 0; q < BEAT_TXT.length; q++) { const b = BEAT_TXT[q];
      const pIn = clamp((lt - b[0]) / 0.4, 0, 1), pOut = 1 - clamp((lt - (b[1] - 0.3)) / 0.3, 0, 1);
      if (pIn <= 0 || pOut <= 0) continue;
      c.save(); c.globalAlpha = Math.min(1, pIn * 1.6) * pOut;
      c.font = b[3] + 'px "LXGWWenKai-500"';
      const tw = c.measureText(b[2]).width + 13 * (b[2].length - 1);
      const pw = tw + 116, ph = b[3] * 1.72, px = 96, py = 62, arch = ph * 0.4;
      const drop = (1 - ease.out(pIn)) * 14;
      c.translate(0, drop);
      // 金链挂顶框
      c.strokeStyle = C.gold; c.lineWidth = 2.6;
      c.beginPath(); c.moveTo(px + pw * 0.22, 20); c.lineTo(px + pw * 0.3, py); c.moveTo(px + pw * 0.78, 20); c.lineTo(px + pw * 0.7, py); c.stroke();
      c.fillStyle = C.gold; c.strokeStyle = C.line; c.lineWidth = 1.4;
      [0.22, 0.78].forEach(function (f) { c.beginPath(); c.arc(px + pw * f, 20, 4.5, 0, TAU); c.fill(); c.stroke(); });
      // 拱顶弧牌
      const p = new Path2D();
      p.moveTo(px, py + ph); p.lineTo(px, py + arch); p.ellipse(px + pw / 2, py + arch, pw / 2, arch, 0, Math.PI, TAU); p.lineTo(px + pw, py + ph); p.closePath();
      c.fillStyle = C.cream; c.fill(p); c.strokeStyle = C.line; c.lineWidth = 2.4; c.stroke(p);
      const pi = new Path2D();
      const ins = 11;
      pi.moveTo(px + ins, py + ph - 8); pi.lineTo(px + ins, py + arch);
      pi.ellipse(px + pw / 2, py + arch, pw / 2 - ins, arch * 0.82, 0, Math.PI, TAU); pi.lineTo(px + pw - ins, py + ph - 8);
      c.strokeStyle = C.gold; c.lineWidth = 2.6; c.stroke(pi);
      c.fillStyle = '#4e3320'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.letterSpacing = '13px';
      c.fillText(b[2], px + pw / 2 + 6, py + ph * 0.6);
      c.letterSpacing = '0px';
      c.restore();
    }
  }

  // ---------- ⑭ 收尾流光（描金后一道铺光扫过全网） ----------
  function sweep(c, x0, alpha) {
    const gr = c.createLinearGradient(x0 - 240, 0, x0 + 240, 0);
    gr.addColorStop(0, 'rgba(255,240,180,0)'); gr.addColorStop(0.5, 'rgba(255,240,180,' + alpha + ')'); gr.addColorStop(1, 'rgba(255,240,180,0)');
    c.save(); c.globalCompositeOperation = 'lighter'; c.transform(1, 0, -0.35, 1, 0, 0);
    c.fillStyle = gr; c.fillRect(x0 - 240 - 500, 0, 480 + 1000, 1200); c.restore();
  }

  // ---------- 主绘制 ----------
  return {
    init() {
      U.assertGlyphs('104px "LXGWWenKai-500"', '参数疯狂卷之外数据方法算力量', 's10_nouveau 屏上字/铭牌');
      U.assertGlyphs('62px "LibreBaskerville-700"', '0123456789.-BT+', 's10_nouveau 数字');
    },
    draw(c, lt, t) {
      const cm = cam(lt), stage = stageSum(lt);
      const gild = ss(7.1, 8.7, lt);
      const calm = lerp(1, 0.45, ss(7, 9, lt));                    // 拍三：呼吸收稳（不停）
      const amp = lerp(1, 0.6, ss(7, 9, lt));                      // 花头摇摆也收一点
      const applyCam = (g) => { g.translate(W / 2, H / 2); g.scale(cm.z, cm.z); g.translate(-cm.cx, -cm.cy); };
      // 1 静态底版 ＋ 石版绿罩随密度加深
      c.drawImage(bg(), 0, 0);
      if (stage > 0) { c.fillStyle = 'rgba(80,105,70,' + (0.042 * Math.min(stage, 4)).toFixed(3) + ')'; c.fillRect(0, 0, W, H); }
      // 2 世界层（随镜头）：拱内玻璃底色 → 铅条光芒 → 光轮＋太阳 → 拱藤＋饰片 → 藤网 → 卷草 → 茎叶
      c.save(); applyCam(c);
      const wash = 0.3 * ss(3.3, 4.6, lt);
      if (wash > 0.01) { c.save(); c.clip(ARCH_CLIP); c.globalAlpha = wash; c.fillStyle = C.cream; c.fillRect(AC.cx - AC.rx, 60, AC.rx * 2, 730); c.restore(); }
      const sy = sunDraw(c, lt, t);
      raysDraw(c, lt, t, sy);
      haloDraw(c, lt, t);
      archVineDraw(c, lt);
      shardsDraw(c, lt);
      netDraw(c, lt, t, calm, gild);
      scrollsDraw(c, lt, t);
      stemsDraw(c, lt, t, amp);
      c.restore();
      // 3 三朵参数花：剪影错位垫底（慕夏式「外轮廓粗、内线细」）
      const L = P.scratch('nvS10_L'), lg = L.getContext('2d');
      lg.setTransform(1, 0, 0, 1, 0, 0); lg.clearRect(0, 0, W, H);
      lg.save(); applyCam(lg); headsInto(lg, lt, t, amp); lg.restore();
      const S = P.scratch('nvS10_S'), sg = S.getContext('2d');
      sg.setTransform(1, 0, 0, 1, 0, 0); sg.clearRect(0, 0, W, H);
      sg.drawImage(L, 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = C.line; sg.fillRect(0, 0, W, H); sg.globalCompositeOperation = 'source-over';
      [[-1.5, -1.5], [3.5, 4.5], [2, 2.5]].forEach(function (o) { c.drawImage(S, o[0], o[1]); });
      c.drawImage(L, 0, 0);
      // 4 世界层续（随镜头）：数字吊牌 → 计数铭牌 → 马赛克台＋徽章 → 铭牌 → 金卷草
      c.save(); applyCam(c);
      for (let k = 0; k < 3; k++) plaqueDraw(c, SEEDS[k], t, lt, amp);
      counterDraw(c, lt, t);
      for (let k = 0; k < 3; k++) emblemDraw(c, k, lt, t);
      goldScrolls(c, lt, t);
      c.restore();
      // 5 石版颗粒 ＋ 收尾流光
      c.drawImage(P.grain('nvS10', 0.05, [70, 50, 30], 0.14), 0, 0);
      const fin = ss(8.6, 9.7, lt);
      if (fin > 0 && fin < 1) sweep(c, lerp(-280, 2240, fin), 0.14);
      // 6 屏上字（左上悬挂牌匾）
      screenText(c, lt);
    },
  };
})();
