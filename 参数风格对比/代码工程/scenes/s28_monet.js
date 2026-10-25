// s28_monet · 莫奈《睡莲》《日本桥》×「大模型参数」风格样片（10s 单镜头三拍）。
// 题材构图（不搬速通片的房间）：吉维尼睡莲池全景——参数＝水面明灭的彩色光点。
//   拍一 0–3s   三颗大光斑特写（旁缀斜体数字 0.73／−1.2／2.4，倒影在水里颤动）＋近景漂移的睡莲圆叶，
//              绿拱日本桥与垂柳作背景骨架，镜头缓推端详；
//   拍二 3–7s   光点从大光斑处连片生长成光网铺满池面、连线蔓延，序列计数器倒映水里颤动着滚动
//              1.5B→175B→540B→1T+（1T+ 揭示一次重音：全网光斑平滑脉冲），天光倒影随密度变暖变亮；
//   拍三 7–10s  增殖停住；三朵大睡莲依次从水下升起绽放——书叶莲（花心一摞小书＝数据）、
//              齿轮莲（花心黄铜齿轮＝方法）、灯焰莲（花心油灯＝算力），书页轻翻、齿轮缓转、灯焰摇曳；
//              光斑网从变多转为变亮变精（白芯收拢、连线变白），水波荡开最后一圈大涟漪收稳。
// 管线：整面池水的短横笔触底（水渐变＋天光倒影＋远叶→一遍 P.strokes，照卡水面参数 cell 9/len 34/w 6.5，
//      boil 0 静态化进 PAINT.cached，杜绝全屏重洗的跳变）＋桥层（深色树荫衬底防被吞，照卡）；
//      每帧只画动态层：柳影波动、桥倒影、天光亮笔、圆叶漂移、光斑网（10fps 跳位颤动，照卡母题）、
//      涟漪虚线椭圆外扩、紫藤点列摆动（照卡：点列不是粗条）、主光斑、三莲、木牌屏上字、水中计数器。
// 约定：随机全用 U.rng／U.hash 种子（同帧两次渲染逐像素一致）；无角色、无做旧；中文 LXGWWenKai-500、
//      数字 PlayfairDisplay-400i，落笔前 U.assertGlyphs；字避开 y>880；屏上字每拍 ≤8 字。
SCENES['s28_monet'] = (() => {
  const W = 1920, H = 1080, TAU = Math.PI * 2;
  const { clamp, lerp, ss, seg, ease, rng, hash } = U, P = PAINT;

  // ---------- 布局 ----------
  const arcY = (x) => { const q = (x - 960) / 420; return 470 - 150 * (1 - q * q); };   // 桥拱曲线
  const HERO = [                                                                          // 三颗参数大光斑（拍一位 → 拍三落三莲上方）
    { x: 620, y: 690, num: '0.73', col: 0, ph: 0.0, r: 50, dock: [540, 522] },
    { x: 1010, y: 740, num: '-1.2', col: 1, ph: 2.1, r: 44, dock: [960, 506] },
    { x: 770, y: 800, num: '2.4', col: 2, ph: 4.2, r: 38, dock: [1430, 516] },
  ];
  const LILY = [                                                                          // 三朵大睡莲（拍三依次升起）
    { x: 540, y: 640, t0: 7.25, kind: 'books' },
    { x: 960, y: 620, t0: 7.85, kind: 'gear' },
    { x: 1430, y: 640, t0: 8.45, kind: 'lamp' },
  ];

  // ---------- 区域色板（色值全抄 references/风格配方/28_monet.md 卡内色板） ----------
  const SW = {
    water: P.swatch(['#5b6fb5', '#7d8fd0', '#9db5e0', '#6aa0a8', '#b7a6d8', '#d9c8e8', '#8fb8a8', '#a6c4e8', '#c8b0d8'], 0.45),
    green: P.swatch(['#5f8f4a', '#7fae5a', '#3f6f4a', '#9cc070', '#6f9a7a', '#b4cc78'], 0.4),
    pink: P.swatch(['#f0a0b8', '#f7d0dc', '#fff2f4', '#e88aa0'], 0.3),
    willow: P.swatch(['#3f6a58', '#557a4a', '#2e5048', '#6a5f9a', '#4a6aa0'], 0.4),
    sky: P.swatch(['#f2e2c4', '#e8d6a8', '#fdf0d0', '#f7dcc0'], 0.3),
  };
  const GLINT = ['#fffbe8', '#fdf0d0', '#f8e0ec', '#e8f4ff'];                             // 水面光斑四色（照卡母题）

  // ---------- 静态底（PAINT.cached 一次画好）：池水短横笔触＋远岸树丛＋日本桥 ----------
  const STATIC = P.cached('mn28S', W, H, (g) => {
    const dr = P.scratch('mn28D'), dg = dr.getContext('2d');
    dg.clearRect(0, 0, W, H);
    const wg = dg.createLinearGradient(0, 0, 0, H);                                        // 水面竖向渐变（上浅下深，照卡）
    wg.addColorStop(0, '#b9c7e6'); wg.addColorStop(0.35, '#8fa6d6'); wg.addColorStop(0.7, '#6c84bf'); wg.addColorStop(1, '#5a72a8');
    dg.fillStyle = wg; dg.fillRect(0, 0, W, H);
    [[640, 478, 250, 46], [1290, 505, 270, 52], [300, 560, 190, 40], [1620, 540, 210, 44]].forEach(([x, y, rx, ry], k) => {   // 静态天光倒影
      dg.fillStyle = k % 2 ? '#e8d6e8' : '#f2e2c4'; dg.beginPath(); dg.ellipse(x, y, rx, ry, 0, 0, TAU); dg.fill();
    });
    const r0 = rng(2810);                                                                 // 远处小睡莲叶（静态融入水笔触）
    for (let i = 0; i < 26; i++) {
      const x = 90 + r0() * 1740, y = 445 + r0() * 135, rx = 14 + r0() * 20, ry = 4.5 + r0() * 4.5, nch = r0() * TAU;
      dg.fillStyle = r0() < 0.5 ? '#5f8f4a' : '#7fae5a';
      dg.beginPath(); dg.ellipse(x, y, rx, ry, 0, nch + 0.4, nch + TAU - 0.4); dg.lineTo(x, y); dg.closePath(); dg.fill();
    }
    g.drawImage(dr, 0, 0);
    P.strokes(g, dr, {                                                                    // 一遍短横笔触（照卡水面参数；boil 0 静态化）
      cell: 9, len: 34, width: 6.5, seed: 28, t: 0, boil: 0, outline: 0, jitterCol: 14,
      angle: (x, y) => 0.06 * Math.sin(y * 0.05 + x * 0.004) + 0.05 * P.noise(x * 0.01, y * 0.01),
      palette: (x, y, col, r) => {
        const R = col[0], G = col[1], B = col[2];
        if (R > 200 && G < 190) return SW.pink(col, r);
        if (R > 225 && G > 205 && B < 205) return SW.sky(col, r);
        if (G > R + 15 && G > B - 10) return SW.green(col, r);
        if (G > R && B < 150) return SW.willow(col, r);
        return SW.water(col, r);
      },
      mask: (x, y) => !(x > 460 && x < 1460 && y < 472),                                  // 中央上半留给树丛＋桥
    });
    const rT = rng(283);                                                                   // 远岸树丛（横带团，盖住上部水笔触）
    for (let i = 0; i < 42; i++) {
      const x = 380 + rT() * 1180, y = 14 + rT() * 160;
      g.fillStyle = ['#4f8a3a', '#2f5a30', '#6fa040', '#3a6a5a', '#9cbf58'][i % 5];
      g.beginPath(); g.ellipse(x, y, 42 + rT() * 52, 22 + rT() * 26, 0, 0, TAU); g.fill();
    }
    g.fillStyle = '#24452a'; g.beginPath(); g.ellipse(960, 328, 524, 158, 0, 0, TAU); g.fill();   // 桥后深色树荫衬底（照卡，防桥被树叶吞）
    const r1 = rng(282);
    for (let i = 0; i < 58; i++) {                                                        // 桥后浓密树叶团
      const x = 470 + r1() * 980, y = 172 + r1() * 158;
      g.fillStyle = ['#4f8a3a', '#6fa040', '#2f5a30', '#9cbf58', '#3a6a5a'][i % 5];
      g.beginPath(); g.ellipse(x, y, 28 + r1() * 30, 19 + r1() * 19, 0, 0, TAU); g.fill();
    }
    g.lineCap = 'round';                                                                   // 日本桥：绿色拱＋扶手＋竖栏（照卡配色）
    g.strokeStyle = '#3f8a62'; g.lineWidth = 24;
    g.beginPath(); for (let x = 540; x <= 1380; x += 6) { const y = arcY(x); x === 540 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
    g.strokeStyle = '#8fdcae'; g.lineWidth = 9;
    [-46, -24].forEach(off => { g.beginPath(); for (let x = 548; x <= 1372; x += 6) { const y = arcY(x) + off; x === 548 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); });
    g.strokeStyle = '#3f8a62'; g.lineWidth = 6;
    for (let x = 556; x <= 1364; x += 34) { g.beginPath(); g.moveTo(x, arcY(x)); g.lineTo(x, arcY(x) - 46); g.stroke(); }
  });

  // ---------- 光斑网（参数本体）预生成：从三颗大光斑处向外增殖 ----------
  const NODES = [], EDGES = [];
  {
    const r = rng(2801);
    for (let i = 0; i < 208; i++) {
      const x = 70 + r() * 1780, y = 462 + r() * 580;
      const d = Math.hypot(x - 800, y - 740);
      const ap = d < 340 ? 0.3 + r() * 1.9 : 3.1 + 3.0 * clamp(d / 950, 0, 1) + r() * 0.35;
      NODES.push({ x, y, ap, ph: r() * TAU, fq: 3.5 + r() * 3.5, L: 13 + r() * 20, ci: (r() * 4) | 0, i });
    }
    for (let a = 0; a < NODES.length; a++) for (let b = a + 1; b < NODES.length; b++) {
      const p = NODES[a], q = NODES[b];
      if (Math.hypot(p.x - q.x, p.y - q.y) < 105) EDGES.push([p, q]);
    }
  }
  // 天光亮笔（动态天光倒影，随密度增多变亮）＋近景圆叶丛
  const SKYD = [];
  { const r = rng(593); for (let i = 0; i < 14; i++) SKYD.push({ x: 60 + r() * 1780, y: 452 + r() * 540, L: 70 + r() * 150, w: 9 + r() * 8, ph: r() * TAU, fq: 0.5 + r() * 1.3 }); }
  const PADS = [];
  {
    const r = rng(284);
    for (let k = 0; k < 8; k++) {
      const cx = 130 + k * 240 + (r() - 0.5) * 120, cy = 780 + r() * 220, n = 2 + ((r() * 2.4) | 0);
      for (let i = 0; i < n; i++) PADS.push({ x: cx + (r() - 0.5) * 220, y: cy + (r() - 0.5) * 90, rx: 46 + r() * 44, ry: 14 + r() * 11, notch: r() * TAU, flower: r() < 0.4, ph: r() * TAU, k });
    }
  }
  // 主光斑辉光精灵（缓存）
  const SPR = ['255,251,232', '248,224,236', '232,244,255'].map((rgb, k) => P.cached('mn28H' + k, 128, 128, (g) => {
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.16, 'rgba(' + rgb + ',.9)');
    gr.addColorStop(0.5, 'rgba(' + rgb + ',.28)'); gr.addColorStop(1, 'rgba(' + rgb + ',0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  }));

  // ---------- 动态层 ----------
  const WILLOW = [[92, 0.95], [208, 0.7], [318, 0.5], [1706, 0.8], [1828, 1]];             // 垂柳影竖带
  function willows(c, t) {
    WILLOW.forEach(([x0, a], k) => {
      c.fillStyle = k % 2 ? '#3f6a58' : '#4f5f8f'; c.globalAlpha = 0.5;
      c.beginPath();
      for (let y = 0; y <= 560; y += 20) c.lineTo(x0 + Math.sin(y * 0.03 - t * 3.2 + k) * 14, y);
      for (let y = 560; y >= 0; y -= 20) c.lineTo(x0 + 48 * a + Math.sin(y * 0.03 - t * 3.2 + k + 0.6) * 14, y);
      c.closePath(); c.fill();
    });
    c.globalAlpha = 1;
  }
  function bridgeRefl(c, t) {                                                              // 桥的绿色倒影（波动弧）
    c.save(); c.strokeStyle = '#4f8a6a'; c.globalAlpha = 0.3; c.lineWidth = 8; c.lineCap = 'round';
    c.beginPath();
    for (let x = 560; x <= 1360; x += 8) { const q = (x - 960) / 210, y = 512 + 44 * (1 - q * q) + Math.sin(x * 0.08 + t * 6) * 3; x === 560 ? c.moveTo(x, y) : c.lineTo(x, y); }
    c.stroke();
    c.globalAlpha = 0.16; c.lineWidth = 5;
    c.beginPath();
    for (let x = 600; x <= 1320; x += 8) { const q = (x - 960) / 200, y = 548 + 30 * (1 - q * q) + Math.sin(x * 0.07 - t * 5) * 3; x === 600 ? c.moveTo(x, y) : c.lineTo(x, y); }
    c.stroke(); c.restore();
  }
  function skyDabs(c, t, dens, pulse, b3) {                                                // 天光倒影亮笔（背景随密度升级）
    const st = Math.floor(t * 10);
    c.save(); c.lineCap = 'round';
    SKYD.forEach((s, i) => {
      const a = clamp(0.09 + 0.15 * dens + 0.05 * Math.sin(t * s.fq + s.ph) + 0.15 * pulse + 0.06 * b3, 0, 0.55);
      if (a < 0.05) return;
      const jx = (hash(i, st) - 0.5) * 10;
      c.globalAlpha = a; c.strokeStyle = ['#f2e2c4', '#e8d6e8', '#fdf0d0', '#f8e0ec'][i % 4]; c.lineWidth = s.w;
      c.beginPath(); c.moveTo(s.x + jx, s.y); c.lineTo(s.x + jx + s.L, s.y + 2); c.stroke();
    });
    c.restore();
  }
  function pads(c, t) {                                                                    // 近景圆叶漂移＋粉白小花
    PADS.forEach(p => {
      const x = p.x + Math.sin(t * 1.3 + p.ph) * 7, y = p.y + Math.sin(t * 0.9 + p.ph * 1.3) * 2.5;
      c.fillStyle = p.k % 2 ? '#5f8f4a' : '#7fae5a';
      c.beginPath(); c.ellipse(x, y, p.rx, p.ry, 0, p.notch + 0.38, p.notch + TAU - 0.38); c.lineTo(x, y); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(156,192,112,.5)'; c.lineWidth = 3;
      c.beginPath(); c.ellipse(x, y, p.rx * 0.62, p.ry * 0.6, 0, p.notch + 0.9, p.notch + TAU - 0.9); c.stroke();
      if (p.flower) {
        c.fillStyle = p.k % 3 ? '#f2a6bf' : '#fbf4f0'; c.beginPath(); c.ellipse(x + 5, y - 8, 15, 9, 0, 0, TAU); c.fill();
        c.fillStyle = p.k % 3 ? '#fff2f2' : '#f6d86a'; c.beginPath(); c.ellipse(x + 5, y - 11, 7, 5, 0, 0, TAU); c.fill();
      }
    });
  }
  function net(c, t, lt, dens, b3, pulse) {                                                // 光斑网：连线蔓延＋短笔光斑 10fps 跳位颤动
    const ea = 0.04 + 0.11 * dens + 0.07 * b3 + 0.05 * pulse;
    c.save(); c.lineCap = 'round'; c.lineWidth = 1.6;
    c.strokeStyle = 'rgba(232,240,255,' + ea + ')';
    c.beginPath();
    for (let e = 0; e < EDGES.length; e++) {
      const p = EDGES[e][0], q = EDGES[e][1];
      if (ss(p.ap, p.ap + 0.35, lt) < 0.3 || ss(q.ap, q.ap + 0.35, lt) < 0.3) continue;
      const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2 - 7 + Math.sin(t * 1.7 + p.i) * 2;
      c.moveTo(p.x, p.y); c.quadraticCurveTo(mx, my, q.x, q.y);
    }
    c.stroke();
    const st = Math.floor(t * 10);
    for (let k = 0; k < NODES.length; k++) {
      const n = NODES[k];
      const lit = ss(n.ap, n.ap + 0.35, lt); if (lit <= 0.02) continue;
      const pop = lit < 1 ? ease.out(lit) : 1;
      const br = clamp((0.5 + 0.22 * Math.sin(t * n.fq + n.ph)) * pop + 0.10 * dens + 0.30 * pulse + 0.28 * b3, 0, 1);
      if (br < 0.1) continue;
      const jx = (hash(n.i, st) - 0.5) * 10;
      const L = n.L * pop * (1 - 0.18 * b3 + 0.22 * pulse);
      c.globalAlpha = br * 0.8; c.strokeStyle = GLINT[n.ci]; c.lineWidth = 4 + 2 * b3;
      c.beginPath(); c.moveTo(n.x + jx, n.y); c.lineTo(n.x + jx + L, n.y + 1.5); c.stroke();
      if (b3 > 0.03) {                                                                     // 拍三：变亮变精（白芯短段收拢）
        c.globalAlpha = clamp(0.5 * b3 * br, 0, 1); c.strokeStyle = '#fffbe8'; c.lineWidth = 2.2;
        const c0 = n.x + jx + L * 0.28;
        c.beginPath(); c.moveTo(c0, n.y + 0.5); c.lineTo(c0 + L * 0.44, n.y + 1.2); c.stroke();
      }
    }
    c.globalAlpha = 1; c.restore();
  }
  function heroes(c, t, lt, b3, pulse) {                                                   // 三颗参数大光斑＋斜体数字（水中颤动）
    const st = Math.floor(t * 10);
    const dk = ease.inOut(seg(lt, 8.5, 9.4));                                              // 拍三漂向三莲上方归位
    HERO.forEach((h, k) => {
      const bob = Math.sin(t * 1.7 + k * 2.1) * 5 * (1 - 0.7 * b3);
      const x = lerp(h.x, h.dock[0], dk), y = lerp(h.y, h.dock[1], dk) - 60 * Math.sin(Math.PI * dk);
      const rr = h.r * (1 + 0.06 * Math.sin(t * 2.3 + h.ph));
      const br = clamp(0.72 + 0.18 * Math.sin(t * 2.6 + k) + 0.35 * pulse + 0.3 * b3, 0, 1);
      const gs = rr * 4.6 * (1 - 0.12 * b3);
      c.save(); c.globalAlpha = br; c.drawImage(SPR[h.col], x - gs / 2, y + bob - gs / 2, gs, gs); c.restore();
      c.fillStyle = 'rgba(255,255,255,' + (0.9 * br) + ')';
      c.beginPath(); c.arc(x, y + bob, rr * 0.3 * (1 + 0.2 * b3), 0, TAU); c.fill();
      const jx = (hash(k, st) - 0.5) * 8;                                                   // 数字标签：随波颤动＋alpha 呼吸
      const ny = y + bob - rr - 34 + Math.sin(t * 2.2 + k * 1.4) * 3;
      c.save(); c.font = '44px "PlayfairDisplay-400i"'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
      c.shadowColor = 'rgba(243,236,220,.9)'; c.shadowBlur = 16;
      c.fillStyle = 'rgba(253,246,232,' + clamp(0.78 + 0.18 * Math.sin(t * 3 + k), 0, 1) + ')';
      c.fillText(h.num, x + jx, ny);
      c.restore();
      c.save(); c.globalAlpha = 0.22; c.font = '40px "PlayfairDisplay-400i"'; c.textAlign = 'center';   // 水中淡倒影
      c.fillStyle = '#e8f4ff';
      c.fillText(h.num, x + jx + Math.sin(t * 1.9 + k) * 4, y + bob + rr * 0.55 + 36 + Math.sin(t * 2.6 + k) * 3);
      c.restore();
    });
  }
  const RIP = [[470, 640], [1240, 780], [860, 520]];
  function ripples(c, t, lt, b3) {                                                          // 涟漪：虚线椭圆外扩淡出（照卡）＋拍三收尾大涟漪
    c.save(); c.strokeStyle = '#eef4ff'; c.lineWidth = 3; c.setLineDash([12, 10]);
    RIP.forEach(([x, y], k) => {
      for (let j = 0; j < 3; j++) {
        const q = (t * (0.8 - 0.25 * b3) + j / 3 + k * 0.3) % 1;
        c.globalAlpha = 0.55 * (1 - q);
        c.beginPath(); c.ellipse(x, y, 20 + q * 90, (20 + q * 90) * 0.22, 0, 0, TAU); c.stroke();
      }
    });
    const wq = seg(lt, 9.3, 10.0);
    if (wq > 0 && wq < 1) {
      for (let j = 0; j < 3; j++) {
        const q = (wq + j * 0.22) % 1;
        c.globalAlpha = 0.4 * (1 - q) * Math.min(1, wq * 4);
        c.lineWidth = 4;
        c.beginPath(); c.ellipse(960, 700, 60 + q * 560, (60 + q * 560) * 0.2, 0, 0, TAU); c.stroke();
      }
    }
    c.setLineDash([]); c.globalAlpha = 1; c.restore();
  }
  function wisteria(c, t) {                                                                // 紫藤垂花：点列摆动（照卡，点列不是粗条）
    for (let i = 0; i < 11; i++) {
      const x = 585 + i * 72, sw = Math.sin(t * 2.4 + i * 0.9) * 8, L = 46 + (i * 37 % 46), y0 = arcY(x) - 20;
      for (let j = 0; j < 8; j++) {
        const q = j / 7, px = x + sw * q * q + Math.sin(j * 2.1 + i) * 4, py = y0 + L * q;
        c.fillStyle = ['#b8a0dc', '#d6c0ee', '#9a86c8', '#e8dcf6'][(i + j) % 4];
        c.beginPath(); c.ellipse(px, py, 7.5 * (1 - q * 0.6), 6 * (1 - q * 0.5), 0.3, 0, TAU); c.fill();
      }
    }
  }
  function lily(c, x, y, t, lt, L, b3) {                                                    // 拍三大睡莲：升起＋两轮花瓣绽放＋花心物
    const ap = ss(L.t0, L.t0 + 0.5, lt); if (ap <= 0.01) return;
    const p = ease.out(seg(lt, L.t0, L.t0 + 1.15));
    const fl = seg(lt, L.t0 + 0.55, L.t0 + 1.5);
    const bob = Math.sin(t * 1.2 + L.t0) * 4;
    c.save(); c.globalAlpha = ap; c.translate(0, (1 - p) * 300 + bob * p);
    const cy = y - 34;
    c.fillStyle = '#5f8f4a';                                                               // 叶基座（缺口大椭圆）
    c.beginPath(); c.ellipse(x, y, 108, 30, 0, 0.42, TAU - 0.42); c.lineTo(x, y); c.closePath(); c.fill();
    c.fillStyle = '#7fae5a';
    c.beginPath(); c.ellipse(x - 34, y + 7, 60, 17, 0, 1.2, TAU - 1.2); c.lineTo(x - 34, y + 7); c.closePath(); c.fill();
    const petals = (n, R0, w0, c1, c2, ph0) => {                                           // 两轮花瓣：从收拢到绽开
      for (let i = 0; i < n; i++) {
        const R = R0 * (0.35 + 0.65 * ease.out(fl)), w = w0 * (0.5 + 0.5 * fl);
        c.fillStyle = i % 2 ? c1 : c2;
        c.save(); c.translate(x, cy); c.rotate(ph0 + i / n * TAU);
        c.beginPath(); c.ellipse(0, -R * 0.5, w, R * 0.55 + 2, 0, 0, TAU); c.fill();
        c.restore();
      }
    };
    petals(6, 58, 15, '#f0a0b8', '#f7d0dc', 0.3);
    petals(5, 38, 11, '#fff2f4', '#f7d0dc', 0.9);
    if (fl > 0.45) {                                                                        // 花心三件物（浮现）
      const q = ss(0.45, 0.85, fl);
      c.save(); c.globalAlpha = ap * q; c.translate(x, cy - 4);
      if (L.kind === 'books') {                                                             // 数据：一摞小书＋书页轻翻
        let by = 16;
        [[18, '#3f6f4a'], [16, '#9cc070'], [14, '#b7a6d8']].forEach(([bh, col], j) => {
          const bx = -27 + (j % 2 ? 3 : -3), bw = 54 - j * 6;
          c.fillStyle = col; c.fillRect(bx, by - bh, bw, bh);
          c.fillStyle = '#fff2f4'; c.fillRect(bx, by - bh, bw, 3);
          by -= bh;
        });
        c.fillStyle = 'rgba(255,242,244,' + (0.3 + 0.3 * Math.abs(Math.sin(t * 2.4))) + ')';
        c.fillRect(-6, by + 1, 14, 2.5);
      } else if (L.kind === 'gear') {                                                       // 方法：黄铜齿轮缓转
        c.save(); c.rotate(t * 0.5);
        c.fillStyle = '#e0bc90'; c.beginPath(); c.arc(0, 0, 19, 0, TAU); c.fill();
        for (let j = 0; j < 8; j++) { c.save(); c.rotate(j / 8 * TAU); c.fillStyle = '#c69a6a'; c.fillRect(15, -4.5, 8, 9); c.restore(); }
        c.fillStyle = '#fff2f4'; c.beginPath(); c.arc(0, 0, 5.5, 0, TAU); c.fill();
        c.strokeStyle = '#8a6a4a'; c.lineWidth = 1.6; c.beginPath(); c.arc(0, 0, 19, 0, TAU); c.stroke();
        c.restore();
      } else {                                                                              // 算力：油灯＋焰苗摇曳
        c.fillStyle = '#e0bc90'; c.fillRect(-9, 16, 18, 5);
        c.fillStyle = '#f3ecdc'; c.beginPath(); c.moveTo(-13, 16); c.quadraticCurveTo(-13, -8, 0, -12); c.quadraticCurveTo(13, -8, 13, 16); c.closePath(); c.fill();
        c.strokeStyle = '#8a7aa8'; c.lineWidth = 2; c.stroke();
        const fw = Math.sin(t * 5.2) * 2.2;
        const fg = c.createRadialGradient(0, -6, 1, 0, -6, 26);
        fg.addColorStop(0, 'rgba(253,240,208,.95)'); fg.addColorStop(1, 'rgba(253,240,208,0)');
        c.fillStyle = fg; c.fillRect(-26, -32, 52, 52);
        c.fillStyle = '#fdf0d0'; c.beginPath(); c.ellipse(fw * 0.4, -7, 4.5, 9 + Math.sin(t * 7) * 1.5, fw * 0.06, 0, TAU); c.fill();
        c.fillStyle = '#fffbe8'; c.beginPath(); c.ellipse(fw * 0.4, -5, 2.2, 4.5, 0, 0, TAU); c.fill();
      }
      c.restore();
    }
    const rq = seg(lt, L.t0 + 1.05, L.t0 + 1.9);                                            // 归位时一圈涟漪荡开
    if (rq > 0 && rq < 1) {
      c.save(); c.strokeStyle = '#eef4ff'; c.globalAlpha = 0.5 * (1 - rq); c.lineWidth = 3.5; c.setLineDash([14, 11]);
      c.beginPath(); c.ellipse(x, y, 110 + rq * 120, (110 + rq * 120) * 0.24, 0, 0, TAU); c.stroke();
      c.setLineDash([]); c.restore();
    }
    c.restore();
  }
  const SIGN = ['参数', '疯狂卷参数', '参数之外'];
  function plank(c, t, lt) {                                                                // 屏上字：吉维尼园中木牌（字长在物上）
    const k = lt < 3 ? 0 : lt < 7 ? 1 : 2;
    const T0 = [3, 7][k - 1];
    const bob = Math.sin(t * 1.1) * 3;
    c.save(); c.translate(250, 745 + bob); c.rotate(Math.sin(t * 0.7) * 0.012);
    c.fillStyle = 'rgba(63,106,58,.35)'; c.fillRect(-96, 132, 12, 26); c.fillRect(84, 132, 12, 26);   // 桩的水中影
    c.fillStyle = '#8a6a4a'; c.fillRect(-96, 22, 12, 116); c.fillRect(84, 22, 12, 116);
    c.fillStyle = '#6a4f38'; c.fillRect(-96, 22, 12, 8); c.fillRect(84, 22, 12, 8);
    const bw = 336, bh = 92;
    c.fillStyle = '#f3ecdc'; c.fillRect(-bw / 2, -bh / 2, bw, bh);
    c.strokeStyle = '#3f6a3a'; c.lineWidth = 5; c.strokeRect(-bw / 2, -bh / 2, bw, bh);
    c.strokeStyle = 'rgba(63,106,58,.4)'; c.lineWidth = 1.5; c.strokeRect(-bw / 2 + 7, -bh / 2 + 7, bw - 14, bh - 14);
    const oldA = k === 0 ? 0 : 1 - ss(T0, T0 + 0.32, lt);
    const newA = k === 0 ? ss(0.05, 0.45, lt) : ss(T0 + 0.3, T0 + 0.6, lt);
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '48px "LXGWWenKai-500"';
    if (oldA > 0.02) { c.fillStyle = 'rgba(46,80,72,' + oldA + ')'; c.fillText(SIGN[k - 1], 0, -2); }
    if (newA > 0.02) { c.fillStyle = 'rgba(46,80,72,' + newA + ')'; c.fillText(SIGN[k], 0, -2); }
    c.restore();
  }
  function counter(c, t, lt, pulse) {                                                       // 序列计数器：倒映水里颤动（1T+ 一次重音）
    const on = ss(3.15, 3.6, lt); if (on <= 0.01) return;
    const dim = 1 - 0.9 * ss(7.6, 8.4, lt);
    let str;
    if (lt < 3.5) str = '1.5B';
    else if (lt < 6.3) {
      const AN = [[3.5, 1.5], [4.4, 175], [5.6, 540], [6.3, 1000]];
      let v = 1000;
      for (let j = 0; j < AN.length - 1; j++) if (lt >= AN[j][0] && lt < AN[j + 1][0]) {
        const q = (lt - AN[j][0]) / (AN[j + 1][0] - AN[j][0]);
        v = Math.exp(lerp(Math.log(AN[j][1]), Math.log(AN[j + 1][1]), q)); break;
      }
      str = v < 10 ? v.toFixed(1) + 'B' : Math.min(999, Math.round(v)) + 'B';
    } else str = '1T+';
    const bob = Math.sin(t * 2.2) * 2;
    c.save(); c.globalAlpha = on * dim;
    const hg = c.createRadialGradient(1560, 560, 10, 1560, 560, 150);                       // 奶白光晕垫底（照卡：笔触底上要加光晕）
    hg.addColorStop(0, 'rgba(243,236,220,.5)'); hg.addColorStop(1, 'rgba(243,236,220,0)');
    c.fillStyle = hg; c.beginPath(); c.ellipse(1560, 566, 150, 60, 0, 0, TAU); c.fill();
    c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.font = '26px "LXGWWenKai-500"'; c.fillStyle = 'rgba(250,252,255,.9)';
    c.shadowColor = 'rgba(243,236,220,.8)'; c.shadowBlur = 10;
    c.fillText('参数量', 1560, 508 + bob);
    const pop = 1 + 0.1 * pulse;
    c.save(); c.translate(1560, 0); c.scale(pop, pop); c.translate(-1560, 0);
    c.font = '58px "PlayfairDisplay-400i"'; c.shadowColor = 'rgba(243,236,220,.95)'; c.shadowBlur = 18;
    c.fillStyle = '#fdf6e8';
    c.fillText(str, 1560, 572 + bob);
    c.restore();
    c.font = '48px "PlayfairDisplay-400i"'; c.globalAlpha = on * dim * 0.25;                // 水中倒影（错位颤动）
    c.fillStyle = '#dce8f8'; c.shadowBlur = 0;
    c.fillText(str, 1560 + Math.sin(t * 1.8) * 5, 622 + Math.sin(t * 2.7) * 3);
    c.restore();
  }

  return {
    init() {
      U.assertGlyphs('48px "LXGWWenKai-500"', '参数疯狂卷之外参数量', 's28_monet 木牌与计数器');
      U.assertGlyphs('44px "PlayfairDisplay-400i"', '0.73-1.2 2.4 1.5B 175B 540B 1T+ 0123456789', 's28_monet 数字');
    },
    draw(c, lt, t) {
      const dens = ss(3.1, 6.2, lt);                                                       // 拍二密度（背景升级）
      const b3 = ss(7, 8.6, lt);                                                           // 拍三收稳（变亮变精）
      const pulse = Math.sin(Math.PI * seg(lt, 6.3, 6.78));                                // 1T+ 揭示：全网一次平滑脉冲
      const zoom = 1 + 0.13 * ease.inOut(ss(0, 3, lt)) - 0.13 * ease.inOut(ss(3, 7, lt)) + 0.02 * ease.inOut(ss(7, 9.5, lt));   // 近景缓推→拉远铺开→停住微收
      const cx = lerp(800, 960, ss(3, 7, lt)), cy = lerp(745, 640, ss(3, 7, lt));
      c.save();
      c.translate(cx, cy); c.scale(zoom, zoom); c.translate(-cx, -cy);                     // 一个连续运镜（恒 zoom≥1，静态底不露边）
      c.drawImage(STATIC, 0, 0);
      if (dens > 0.01) { c.fillStyle = 'rgba(242,226,196,' + (0.09 * dens) + ')'; c.fillRect(0, 372, W, H - 372); }   // 暖色温随密度升级
      willows(c, t);
      bridgeRefl(c, t);
      skyDabs(c, t, dens, pulse, b3);
      pads(c, t);
      net(c, t, lt, dens, b3, pulse);
      heroes(c, t, lt, b3, pulse);
      ripples(c, t, lt, b3);
      wisteria(c, t);
      LILY.forEach(L => lily(c, L.x, L.y, t, lt, L, b3));
      plank(c, t, lt);
      counter(c, t, lt, pulse);
      c.restore();
    },
  };
})();
