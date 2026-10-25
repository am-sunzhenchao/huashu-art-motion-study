// s08_impressionism · 1874 印象派（莫奈）×「大模型参数」风格样片（10s 单镜头三拍）。
// 题材构图（不搬速通片的房间）：花园午后的草坡罂粟田——参数＝草坡上会呼吸的光斑。
//   拍一 0–3s   三团大光斑特写（旁缀写生铅笔注记 0.73／-1.2／2.4，随光斑轻晃），坡上几株罂粟、天上云慢走，
//               笔簇按不规则节拍明灭、光晕呼吸涨缩，镜头缓推端详；
//   拍二 3–7s   光斑按序列连片生长铺成光点海（百余团小光斑＋草坡亮闪随密度升级），罂粟带越开越密，
//               云走投影掠过草坡，画角铅笔签名计数器滚动 1.5B→175B→540B→1T+（1T+ 时光涌一次，全片唯一重音）；
//   拍三 7–10s  增殖停住；书摞（数据）、伞骨罗盘（方法）、玻璃提灯（算力）三物从草坡升起归位，
//               伞骨影子摆到停稳、灯焰摇曳、伞顶丝带飘，光斑从「变多」转为「变亮变精」（白芯收拢），三物上落一小簇亮斑。
// 管线：静态底（天空渐变＋右上暖阳光＋远树带＋起伏草坡 → 一遍 P.strokes，照卡 08_impressionism 参数
//      cell 11/len 20/w 7/boil 0，区域粉彩色板全抄卡内色板；画布先铺 #f2e6ee，笔触缝隙露底）静态化进 PAINT.cached；
//      每帧只画动态层：云、云影、罂粟、草坡亮闪、光点田与三团参数光斑（照卡母题：位置固定短笔、
//      双 sin 不规则明灭、8fps 微跳位颤动、整团缓漂）、三物、铅笔注记屏上字、画角计数器。
// 约定：随机全用 U.rng／U.hash 种子（同帧两次渲染逐像素一致）；无角色无脸；中文 LXGWWenKai-500、
//      数字 EBGaramond-400i（cmap 已验：0-9 . - B T + 全在），落笔前 U.assertGlyphs；字避开 y>880；每拍 ≤8 字。
SCENES['s08_impressionism'] = (() => {
  const W = 1920, H = 1080, TAU = Math.PI * 2;
  const { clamp, lerp, ss, seg, ease, rng, hash } = U, P = PAINT;

  // ---------- 布局 ----------
  const hor = (x) => 430 + 36 * Math.sin(x / 1920 * Math.PI * 1.25 + 0.55) + 16 * P.noise(x * 0.006, 3.2);   // 起伏地平线
  const HERO = [                                                                          // 三团参数光斑（拍一主角 → 拍三漂到三物上方）
    { x: 620, y: 650, num: '0.73', ci: 0, ph: 0.0, r: 62, dock: [560, 505], ax: -1, ay: -1 },
    { x: 985, y: 705, num: '-1.2', ci: 1, ph: 2.1, r: 55, dock: [935, 486], ax: 1, ay: -1 },
    { x: 805, y: 800, num: '2.4', ci: 2, ph: 4.2, r: 50, dock: [1430, 508], ax: -1, ay: -0.9 },
  ];
  const THING = [                                                                         // 拍三三物（依次升起，8.5s 抽帧时三件都可辨）
    { x: 560, y: 655, t0: 7.0, kind: 'books' },
    { x: 935, y: 565, t0: 7.55, kind: 'umbrella' },
    { x: 1430, y: 650, t0: 8.1, kind: 'lamp' },
  ];

  // ---------- 区域色板（色值全抄 references/风格配方/08_impressionism.md 卡内色板及其明暗变体） ----------
  const SW = {
    sky: P.swatch(['#8ab4e8', '#a8c8f0', '#f0f4ff', '#7aa0e0', '#c0d8f8'], 0.4),
    sunny: P.swatch(['#fff0b0', '#fbe08a', '#ffe8c8', '#fff8e0', '#f0c0d8'], 0.3),
    tree: P.swatch(['#3e8a46', '#2f6a38', '#5a9a40', '#8acc60', '#3a7a44'], 0.4),
    green: P.swatch(['#9ccc5a', '#8ac860', '#b8d878', '#5a9a40', '#a0d868', '#6faf48'], 0.4),
    pale: P.swatch(['#f2e6ee', '#f0c8cc', '#fff0b0', '#f6dcc0', '#e8c8f0', '#fff2d8'], 0.3),
  };
  const POPPY = ['#e8281e', '#c81812', '#f04a30'];                                       // 罂粟红三档（卡内 #e8281e 族）

  // ---------- 静态底（PAINT.cached 一次画好）：天空＋暖阳光＋远树带＋草坡 → 一遍短笔触 ----------
  const STATIC = P.cached('imp08S', W, H, (g) => {
    const dr = P.scratch('imp08D'), dg = dr.getContext('2d');
    dg.clearRect(0, 0, W, H);
    const hMid = 430;
    const sk = dg.createLinearGradient(0, 0, 0, hMid + 60);                                 // 天空：上深下浅
    sk.addColorStop(0, '#7aa6e2'); sk.addColorStop(0.72, '#a8c8f0'); sk.addColorStop(1, '#d8e8f8');
    dg.fillStyle = sk; dg.fillRect(0, 0, W, hMid + 60);
    const sun = dg.createRadialGradient(1550, 40, 60, 1550, 40, 780);                       // 右上暖阳光（照卡）
    sun.addColorStop(0, 'rgba(255,240,176,.55)'); sun.addColorStop(1, 'rgba(255,240,176,0)');
    dg.fillStyle = sun; dg.fillRect(770, 0, 1150, hMid + 60);
    const rT = rng(804);                                                                   // 远树带：草坡尽头一团团深绿
    for (let i = 0; i < 44; i++) {
      const x = -20 + rT() * 1960, h = hor(x), y = h - 44 + rT() * 46;
      dg.fillStyle = ['#3e8a46', '#2f6a38', '#5a9a40', '#3a7a44'][i % 4];
      dg.beginPath(); dg.ellipse(x, y, 30 + rT() * 46, 16 + rT() * 20, 0, 0, TAU); dg.fill();
    }
    for (let i = 0; i < 14; i++) {                                                         // 右上受光的黄绿高光团
      const x = 950 + rT() * 950, y = hor(x) - 56 + rT() * 40;
      dg.fillStyle = 'rgba(138,204,96,.8)';
      dg.beginPath(); dg.ellipse(x, y, 16 + rT() * 26, 9 + rT() * 12, 0, 0, TAU); dg.fill();
    }
    const gr = dg.createLinearGradient(0, hMid, 0, H);                                      // 草坡：上亮下深
    gr.addColorStop(0, '#b8d878'); gr.addColorStop(0.42, '#9ccc5a'); gr.addColorStop(1, '#4f8a3c');
    dg.fillStyle = gr;
    dg.beginPath(); dg.moveTo(0, H); dg.lineTo(0, hor(0));
    for (let x = 0; x <= W; x += 24) dg.lineTo(x, hor(x));
    dg.lineTo(W, H); dg.closePath(); dg.fill();
    dg.fillStyle = 'rgba(240,200,204,.30)';                                                // 远景发粉紫（印象派空气透视）
    dg.beginPath(); dg.moveTo(0, 470);
    for (let x = 0; x <= W; x += 24) dg.lineTo(x, hor(x) - 4);
    dg.lineTo(W, hor(W) + 30); dg.lineTo(0, hor(0) + 30); dg.closePath(); dg.fill();
    const warm = dg.createRadialGradient(1520, 700, 60, 1520, 700, 560);                    // 右下草坡被午后的阳光照暖
    warm.addColorStop(0, 'rgba(255,240,170,.28)'); warm.addColorStop(1, 'rgba(255,240,170,0)');
    dg.fillStyle = warm; dg.fillRect(960, 440, 960, 640);
    g.fillStyle = '#f2e6ee'; g.fillRect(0, 0, W, H);                                        // 画布先铺卡内底色，笔触缝隙里露出
    g.drawImage(dr, 0, 0);
    P.strokes(g, dr, {                                                                     // 一遍位置固定的短笔触（照卡主画面参数）
      cell: 11, len: 20, width: 7, seed: 808, t: 0, boil: 0, outline: 0, jitterCol: 26,
      angle: (x, y) => {
        const h = hor(x);
        if (y < h - 30) return 0.05 * Math.sin(x * 0.008) + 0.04 * P.noise(x * 0.01, y * 0.008);                        // 天空横向
        if (y < h + 14) return Math.atan2(y - 400, x - 960) * 0.35 + 0.2 * P.noise(x * 0.02, y * 0.02);                // 树带放射
        return -0.06 + 0.22 * P.noise(x * 0.004, y * 0.007) + 0.05 * Math.sin((y - h) * 0.02);                          // 草坡近水平
      },
      palette: (x, y, col, r) => {
        const h = hor(x);
        if (y < h - 26) return (x > 1180 && y < 430 && col[0] > 205) ? SW.sunny(col, r) : SW.sky(col, r);
        if (y < h + 10) return col[1] > col[0] ? SW.tree(col, r) : SW.sky(col, r);
        return SW.green(col, r);
      },
    });
  });

  // ---------- 光点田（拍二增殖的百余团小光斑）预生成 ----------
  const NODES = [];
  {
    const r = rng(801);
    for (let i = 0; i < 150; i++) {
      const x = 60 + r() * 1800, y = 470 + r() * 520;
      const d = Math.hypot(x - 810, y - 700);
      const ap = d < 320 ? 0.3 + r() * 1.7 : 3.1 + 3.05 * clamp(d / 950, 0, 1) + r() * 0.35;
      const n = { x, y, ap, i, ph: r() * TAU, fq: 3 + r() * 3.5, rx: 13 + r() * 17, ry: 8 + r() * 10, pts: [] };
      const cnt = 8 + ((r() * 5) | 0);
      for (let j = 0; j < cnt; j++) {                                                      // 每团的亮黄白短笔（照卡光斑笔法）
        const u = r() * 2 - 1, v = r() * 2 - 1; if (u * u + v * v > 1) { j--; continue; }
        n.pts.push({ dx: u * n.rx, dy: v * n.ry, L: 8 + r() * 11, w: 4 + r() * 3.2, g: 244 + r() * 11 | 0, b: 180 + r() * 50 | 0, o: 0.55 + r() * 0.45 });
      }
      n.edge = { dx: -n.rx * 0.7, dy: -n.ry * 0.7, L: 12 + r() * 8, col: ['#f0c8cc', '#f2e6ee', '#e8c8f0'][i % 3] };   // 一笔粉彩边笔
      NODES.push(n);
    }
  }
  // 草坡亮闪（短笔触密度随计数升级的辅证：风吹草浪的反光点）
  const GLINT = [];
  { const r = rng(806); for (let i = 0; i < 80; i++) GLINT.push({ x: 80 + r() * 1760, y: 460 + r() * 520, ap: 3.3 + r() * 3.0, fq: 2 + r() * 3, ph: r() * TAU, L: 10 + r() * 14, w: 4 + r() * 3 }); }

  // ---------- 罂粟带预生成（照卡：茎底不动、花头横摆；拍二越开越密） ----------
  const POP = [];
  {
    const r = rng(807);
    for (let i = 0; i < 60; i++) {                                                         // 左中主带
      const x = 90 + r() * 880, y = 545 + r() * 235;
      POP.push({ x, y, r: 4 + r() * 6 + (y - 540) * 0.008, ph: r() * TAU, ap: i < 26 ? 0 : 3.25 + i * 0.02, ci: (r() * 3) | 0, lw: 2 + r() * 1.2 });
    }
    for (let i = 0; i < 58; i++) {                                                         // 拍二向右铺开的扩展带
      const x = 980 + r() * 850, y = 505 + r() * 265;
      POP.push({ x, y, r: 4 + r() * 6 + (y - 540) * 0.006, ph: r() * TAU, ap: 3.5 + i * 0.024, ci: (r() * 3) | 0, lw: 2 + r() * 1.2 });
    }
  }
  // ---------- 云（白粉笔簇，整团缓移）＋草坡上的云影 ----------
  const CLOUD = [];
  {
    const defs = [[980, 118, 150, 44, -20, 0.0], [560, 192, 122, 36, -16, 2.2], [1150, 72, 102, 30, -24, 4.4]];
    defs.forEach(([x, y, rx, ry, v, ph], k) => {
      const r = rng(8080 + k), cl = { x, y, rx, ry, v, ph, k, pts: [] };
      for (let j = 0; j < 26; j++) {
        const u = r() * 2 - 1, v2 = r() * 2 - 1; if (u * u + v2 * v2 > 1) { j--; continue; }
        cl.pts.push({ dx: u * rx, dy: v2 * ry * 0.7, L: 20 + r() * 26, w: 9 + r() * 5, cool: r() < 0.2 });
      }
      CLOUD.push(cl);
    });
  }
  // 三团参数大光斑：每团 40 笔亮黄白＋4 笔粉彩边笔（照卡 26 斑的笔法，位置固定种子）
  HERO.forEach((h, k) => {
    const r = rng(8050 + k); h.pts = []; h.edge = [];
    for (let j = 0; j < 40; j++) {
      const u = r() * 2 - 1, v = r() * 2 - 1; if (u * u + v * v > 1) { j--; continue; }
      h.pts.push({ dx: u * h.r * 0.92, dy: v * h.r * 0.42, L: 14 + r() * 16, w: 8 + r() * 5, g: 244 + r() * 11 | 0, b: 180 + r() * 50 | 0 });
    }
    for (let j = 0; j < 4; j++) h.edge.push({ dx: (r() * 2 - 1) * h.r * 1.25, dy: (r() * 2 - 1) * h.r * 0.55, L: 12 + r() * 10, w: 7 + r() * 4, col: ['#f0c8cc', '#f2e6ee', '#e8c8f0', '#fff0b0'][j] });
    h.sp = 5.5 + k * 1.3;
  });
  // 光晕精灵（缓存）
  const SPR = ['255,251,232', '248,224,236', '232,238,252'].map((rgb, k) => P.cached('imp08H' + k, 128, 128, (g) => {
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.16, 'rgba(' + rgb + ',.9)');
    gr.addColorStop(0.5, 'rgba(' + rgb + ',.28)'); gr.addColorStop(1, 'rgba(' + rgb + ',0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  }));

  // ---------- 动态层 ----------
  function clouds(c, t) {                                                                  // 白粉笔云整团缓移（笔画位置固定，整团漂＋呼吸，不跳位）
    c.save(); c.lineCap = 'round';
    CLOUD.forEach((cl, k) => {
      const x0 = cl.x + cl.v * t, a = 0.62 + 0.16 * Math.sin(t * 0.45 + cl.ph);
      cl.pts.forEach((p, j) => {
        c.globalAlpha = a * (p.cool ? 0.55 : 0.9);
        c.strokeStyle = p.cool ? '#c4d0ec' : '#fafbff';
        c.lineWidth = p.w;
        const x = x0 + p.dx, y = cl.y + p.dy, L = p.L;
        c.beginPath(); c.moveTo(x - L / 2, y + 1); c.lineTo(x + L / 2, y - 2); c.stroke();
      });
    });
    c.globalAlpha = 1; c.restore();
  }
  function cloudShade(c, t) {                                                               // 云影：软椭圆暗斑随云掠过草坡
    c.save();
    CLOUD.forEach((cl, k) => {
      if (k > 1) return;                                                                    // 前两朵投影到草坡
      const x = cl.x + cl.v * t + 300 + cl.rx * 0.8, y = 655 + cl.y * 0.55;
      const a = 0.13 + 0.03 * Math.sin(t * 0.45 + cl.ph);
      const g = c.createRadialGradient(x, y, 8, x, y, cl.rx * 2.4);
      g.addColorStop(0, 'rgba(46,84,42,' + a + ')'); g.addColorStop(1, 'rgba(46,84,42,0)');
      c.fillStyle = g; c.beginPath(); c.ellipse(x, y, cl.rx * 2.4, 56, 0, 0, TAU); c.fill();
    });
    c.restore();
  }
  function poppies(c, t, lt) {                                                              // 罂粟：花头横摆（照卡），随计数越开越密
    c.save(); c.lineCap = 'round';
    POP.forEach((p, i) => {
      const pop = ss(p.ap, p.ap + 0.55, lt); if (pop <= 0.02) return;
      const sw = Math.sin(t * 3.2 + p.ph + p.x * 0.02) * (3 + p.r * 0.7) * pop;
      const hx = p.x + sw, hy = p.y - p.r * 0.7;
      c.globalAlpha = pop;
      c.strokeStyle = '#3e7a30'; c.lineWidth = p.lw;
      c.beginPath(); c.moveTo(p.x, p.y + p.r * 1.6); c.quadraticCurveTo(p.x + sw * 0.3, p.y, hx, hy); c.stroke();
      c.fillStyle = POPPY[p.ci];
      c.beginPath(); c.ellipse(hx, hy, p.r * pop, p.r * 0.72 * pop, sw * 0.03, 0, TAU); c.fill();
      c.fillStyle = 'rgba(58,32,24,.65)';
      c.beginPath(); c.ellipse(hx + sw * 0.2, hy + 1, p.r * 0.2 * pop, p.r * 0.16 * pop, 0, 0, TAU); c.fill();
    });
    c.globalAlpha = 1; c.restore();
  }
  function glints(c, t, lt, b3) {                                                           // 草坡亮闪：密度升级的辅证，明灭
    c.save(); c.lineCap = 'round'; c.strokeStyle = 'rgba(240,255,190,1)';
    GLINT.forEach((s, i) => {
      const pop = ss(s.ap, s.ap + 0.4, lt); if (pop <= 0.02) return;
      const a = 0.22 * pop * (0.5 + 0.5 * Math.sin(t * s.fq + s.ph)) + 0.12 * b3;
      if (a < 0.03) return;
      c.globalAlpha = a; c.lineWidth = s.w;
      c.beginPath(); c.moveTo(s.x, s.y); c.lineTo(s.x + s.L, s.y - 2); c.stroke();
    });
    c.globalAlpha = 1; c.restore();
  }
  function field(c, t, lt, b3, pulse) {                                                     // 光点田：连片生长、位置固定、双 sin 不规则明灭（照卡 v2：活由明灭承担，不整层跳位）
    c.save(); c.lineCap = 'round';
    NODES.forEach((n) => {
      const pop = ss(n.ap, n.ap + 0.35, lt); if (pop <= 0.02) return;
      const kk = clamp(0.5 + 0.5 * Math.sin(t * n.fq + n.ph) * Math.sin(t * n.fq * 0.53 + n.ph * 2), 0, 1);   // 不规则节拍（照卡光斑公式）
      const br = clamp(kk * 1.3 - 0.12 + 0.30 * pulse + 0.30 * b3, 0, 1) * ease.out(pop);
      if (br < 0.08) return;
      const shrink = 1 - 0.10 * b3;
      n.pts.forEach((p) => {
        c.globalAlpha = clamp(br * p.o, 0, 1);
        c.strokeStyle = 'rgba(255,' + p.g + ',' + p.b + ',1)'; c.lineWidth = p.w;
        const x = n.x + p.dx * shrink, y = n.y + p.dy * shrink, L = p.L * shrink;
        c.beginPath(); c.moveTo(x - L / 2, y + 1.2); c.lineTo(x + L / 2, y - 1.2); c.stroke();
      });
      c.globalAlpha = clamp(br * 0.5, 0, 1); c.strokeStyle = n.edge.col; c.lineWidth = 5;    // 粉彩边笔
      const ex = n.x + n.edge.dx * shrink, ey = n.y + n.edge.dy * shrink;
      c.beginPath(); c.moveTo(ex - n.edge.L / 2, ey); c.lineTo(ex + n.edge.L / 2, ey - 1.5); c.stroke();
      if (b3 > 0.03) {                                                                      // 拍三：白芯收拢，变亮变精
        c.globalAlpha = clamp(0.55 * b3 * br, 0, 1); c.strokeStyle = '#fffbe8'; c.lineWidth = 2.4;
        const cx0 = n.x + n.edge.dx * 0.3;
        c.beginPath(); c.moveTo(cx0, n.y + 0.5); c.lineTo(cx0 + n.edge.L * 0.5, n.y - 1); c.stroke();
      }
    });
    c.globalAlpha = 1; c.restore();
  }
  function heroes(c, t, lt, b3, pulse) {                                                     // 三团参数光斑＋铅笔注记（拍三原地变亮变精收稳，三物上的亮斑由 cluster 承担）
    c.save(); c.lineCap = 'round';
    HERO.forEach((h, k) => {
      const bob = Math.sin(t * 1.7 + k * 2.1) * 5 * (1 - 0.6 * b3);
      const x = h.x, y = h.y + bob;
      const kk = clamp(0.5 + 0.5 * Math.sin(t * h.sp + h.ph) * Math.sin(t * h.sp * 0.53 + h.ph * 2), 0, 1);   // 不规则节拍明灭（照卡）
      const br = clamp(kk * 1.15 - 0.1 + 0.30 * pulse + 0.26 * b3, 0, 1);
      const rr = h.r * (1 + 0.06 * Math.sin(t * 2.3 + h.ph)) * (1 - 0.1 * b3);
      const gs = rr * 4.6;
      c.globalAlpha = br * 0.9; c.drawImage(SPR[h.ci], x - gs / 2, y - gs / 2, gs, gs);
      const dx = Math.sin(t * 2.6 + h.ph) * 10 * (1 - 0.7 * b3), dy = Math.cos(t * 2.0 + h.ph) * 4;
      h.pts.forEach((p) => {
        c.globalAlpha = clamp(br * 0.95, 0, 1);
        c.strokeStyle = 'rgba(255,' + p.g + ',' + p.b + ',1)'; c.lineWidth = p.w;
        c.beginPath(); c.moveTo(x + dx + p.dx - p.L / 2, y + dy + p.dy + 2); c.lineTo(x + dx + p.dx + p.L / 2, y + dy + p.dy - 2.5); c.stroke();
      });
      h.edge.forEach((p) => {
        c.globalAlpha = clamp(br * 0.5, 0, 1); c.strokeStyle = p.col; c.lineWidth = p.w;
        c.beginPath(); c.moveTo(x + dx + p.dx - p.L / 2, y + dy + p.dy); c.lineTo(x + dx + p.dx + p.L / 2, y + dy + p.dy - 2); c.stroke();
      });
      c.globalAlpha = clamp(br, 0, 1);
      c.fillStyle = 'rgba(255,255,255,1)';
      c.beginPath(); c.arc(x + dx, y + dy, rr * 0.26 * (1 + 0.25 * b3), 0, TAU); c.fill();
      const jx = Math.sin(t * 2.2 + k * 1.4) * 2;                                            // 写生铅笔注记：随光斑轻晃
      const nx = x + dx + h.ax * (h.r + 46), ny = y + dy + h.ay * (h.r + 44) + jx;
      c.font = '44px "EBGaramond-400i"'; c.textAlign = h.ax < 0 ? 'right' : 'left'; c.textBaseline = 'alphabetic';
      c.shadowColor = 'rgba(243,236,220,.9)'; c.shadowBlur = 12;
      c.fillStyle = 'rgba(90,74,110,' + clamp(0.62 + 0.22 * Math.sin(t * 3 + k), 0, 1) + ')';
      c.fillText(h.num, nx, ny);
      c.shadowBlur = 0;
    });
    c.globalAlpha = 1; c.restore();
  }
  // 三物上的一小簇亮斑（照分镜：三物上还落着一小簇亮斑）
  function cluster(c, t, lt, x, y, seed) {
    const ap = ss(seed.t0 + 0.4, seed.t0 + 0.95, lt); if (ap <= 0.02) return;
    c.save(); c.lineCap = 'round';
    const r = rng(seed.t0 * 731 + 42);
    for (let j = 0; j < 10; j++) {
      const u = r() * 2 - 1, v = r() * 2 - 1; if (u * u + v * v > 1) { j--; continue; }
      const a = ap * (0.55 + 0.4 * Math.sin(t * 4.3 + j * 2.4));
      if (a < 0.05) continue;
      c.globalAlpha = a; c.strokeStyle = 'rgba(255,244,180,1)'; c.lineWidth = 5 + r() * 4;
      const px = x + u * 26, py = y + v * 13, L = 9 + r() * 10;
      c.beginPath(); c.moveTo(px - L / 2, py + 1); c.lineTo(px + L / 2, py - 1.5); c.stroke();
    }
    c.globalAlpha = 1; c.restore();
  }
  function relief(c, t, lt) {                                                                // 拍三三物：依次从草坡升起归位
    THING.forEach((T, k) => {
      const ap = ss(T.t0, T.t0 + 0.75, lt); if (ap <= 0.01) return;
      const p = ease.out(seg(lt, T.t0, T.t0 + 1.35));
      c.save(); c.globalAlpha = ap; c.translate(0, (1 - p) * 88);
      if (T.kind === 'books') {                                                             // 数据：一摞书＋飘动书签
        const bx = T.x, by = T.y;
        c.fillStyle = 'rgba(46,84,42,.25)'; c.beginPath(); c.ellipse(bx + 8, by + 8, 84, 16, 0, 0, TAU); c.fill();
        c.save(); c.translate(bx, by); c.rotate(0.012 * Math.sin(t * 1.1 + 0.3) * p);
        const BKS = [[136, 26, '#b88a98'], [124, 24, '#d8c49a'], [112, 22, '#8aa862'], [98, 20, '#c87868']];
        let yy = 0;
        BKS.forEach(([w, h, col], j) => {
          c.fillStyle = col; c.fillRect(-w / 2, yy - h, w, h);
          c.fillStyle = '#f6f0e6'; c.fillRect(w / 2 - 9, yy - h + 2, 8, h - 4);
          c.strokeStyle = 'rgba(120,100,90,.5)'; c.lineWidth = 1;
          c.beginPath(); c.moveTo(w / 2 - 5, yy - h + 6); c.lineTo(w / 2 - 5, yy - 6); c.stroke();
          yy -= h;
        });
        const fl = Math.sin(t * 3.4) * 9;                                                     // 最上书页间飘出的书签带
        c.fillStyle = '#e8281e';
        c.beginPath(); c.moveTo(28, yy + 2); c.quadraticCurveTo(38 + fl, yy - 18, 34 + fl, yy - 34);
        c.lineTo(28 + fl, yy - 32); c.quadraticCurveTo(30 + fl, yy - 16, 24, yy + 2); c.closePath(); c.fill();
        c.restore();
      } else if (T.kind === 'umbrella') {                                                    // 方法：插在草里的伞骨罗盘＋丝带
        const ux = T.x, uy = T.y;
        const settle = Math.max(0.18, 1 - (lt - 8.3) * 1.1);                                  // 影子摆到停稳
        c.fillStyle = 'rgba(46,84,42,.22)';
        c.beginPath(); c.ellipse(ux + 46 * Math.sin(t * 1.8) * settle, uy + 128, 92, 18, 0.05, 0, TAU); c.fill();
        c.strokeStyle = '#8a6a4a'; c.lineWidth = 5; c.lineCap = 'round';
        c.beginPath(); c.moveTo(ux + 16, uy + 128); c.quadraticCurveTo(ux + 8, uy + 40, ux, uy + 2); c.stroke();
        const a0 = -2.55, a1 = -0.5;
        for (let j = 0; j < 8; j++) {                                                         // 八根伞骨（放射）
          const a = a0 + j / 7 * (a1 - a0), ex = ux + Math.cos(a) * 128, ey = uy + Math.sin(a) * 128;
          const mx = ux + Math.cos(a) * 64, my = uy + Math.sin(a) * 64 - 14;
          if (j > 0) {                                                                       // 骨间绷一层淡纱
            const pa = a0 + (j - 1) / 7 * (a1 - a0), px = ux + Math.cos(pa) * 128, py = uy + Math.sin(pa) * 128;
            c.fillStyle = 'rgba(242,230,238,.22)';
            c.beginPath(); c.moveTo(ux, uy); c.lineTo(px, py); c.lineTo(ex, ey); c.closePath(); c.fill();
          }
          c.strokeStyle = '#8a6a4a'; c.lineWidth = 3.2;
          c.beginPath(); c.moveTo(ux, uy); c.quadraticCurveTo(mx, my, ex, ey); c.stroke();
          c.fillStyle = '#8a6a4a'; c.beginPath(); c.arc(ex, ey, 3, 0, TAU); c.fill();
        }
        for (let j = 0; j < 2; j++) {                                                         // 伞顶丝带：飘
          const fl = Math.sin(t * 3.1 + j * 1.7) * 30, col = j ? '#f0c8cc' : '#8ab4e8';
          c.fillStyle = col;
          c.beginPath(); c.moveTo(ux - 4 + j * 8, uy - 2);
          c.quadraticCurveTo(ux + 26 + fl * 0.5 + j * 8, uy - 26 - j * 12, ux + 58 + fl + j * 12, uy - 34 - j * 20);
          c.quadraticCurveTo(ux + 40 + fl * 0.6 + j * 10, uy - 20 - j * 10, ux + 4 + j * 8, uy + 4);
          c.closePath(); c.fill();
        }
        c.fillStyle = '#f0c8cc'; c.beginPath(); c.arc(ux, uy - 18, 13, 0, TAU); c.fill();     // 顶上小罗盘
        c.strokeStyle = '#8a6a4a'; c.lineWidth = 3; c.beginPath(); c.arc(ux, uy - 18, 16, 0, TAU); c.stroke();
        const na = -0.6 * Math.sin(t * 2.2) * Math.max(0.15, 1 - (lt - 8.4) * 1.2);          // 指针缓摆到停稳
        c.strokeStyle = '#e8281e'; c.lineWidth = 3;
        c.beginPath(); c.moveTo(ux - Math.cos(na) * 9, uy - 18 - Math.sin(na) * 9); c.lineTo(ux + Math.cos(na) * 9, uy - 18 + Math.sin(na) * 9); c.stroke();
        c.fillStyle = '#8a5a40'; c.beginPath(); c.arc(ux, uy - 18, 2.6, 0, TAU); c.fill();
      } else {                                                                               // 算力：玻璃提灯＋摇曳灯焰
        const lx = T.x, ly = T.y;
        c.fillStyle = 'rgba(46,84,42,.22)'; c.beginPath(); c.ellipse(lx + 14, ly + 34, 46, 11, 0, 0, TAU); c.fill();
        const fw = Math.sin(t * 5.2) * 2.4;                                                   // 焰苗摇曳
        const glow = c.createRadialGradient(lx, ly - 18, 4, lx, ly - 18, 95);
        const ga = 0.30 + 0.05 * Math.sin(t * 5.2 + 1);
        glow.addColorStop(0, 'rgba(255,240,170,' + ga + ')'); glow.addColorStop(1, 'rgba(255,240,170,0)');
        c.fillStyle = glow; c.fillRect(lx - 100, ly - 118, 200, 200);
        c.fillStyle = '#8a6a4a'; c.beginPath(); c.ellipse(lx, ly + 26, 27, 8, 0, 0, TAU); c.fill();
        c.fillRect(lx - 4, ly + 8, 8, 18);
        c.beginPath(); c.moveTo(lx - 14, ly - 66); c.lineTo(lx + 14, ly - 66); c.lineTo(lx + 9, ly - 78); c.lineTo(lx - 9, ly - 78); c.closePath(); c.fill();
        c.strokeStyle = '#8a6a4a'; c.lineWidth = 4; c.beginPath(); c.arc(lx, ly - 86, 12, -Math.PI * 0.15, Math.PI * 1.15, true); c.stroke();
        c.beginPath(); c.moveTo(lx - 30, ly + 8); c.quadraticCurveTo(lx - 32, ly - 52, lx, ly - 62); c.quadraticCurveTo(lx + 32, ly - 52, lx + 30, ly + 8);   // 玻璃钟罩
        c.closePath();
        c.fillStyle = 'rgba(214,232,248,.26)'; c.fill();
        c.strokeStyle = 'rgba(148,168,196,.55)'; c.lineWidth = 2; c.stroke();
        c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 3;                               // 左缘高光
        c.beginPath(); c.moveTo(lx - 22, ly + 2); c.quadraticCurveTo(lx - 24, ly - 40, lx - 8, ly - 56); c.stroke();
        c.fillStyle = 'rgba(255,240,200,.16)';
        c.beginPath(); c.ellipse(lx, ly - 10, 20, 30, 0, 0, TAU); c.fill();
        c.fillStyle = '#fdf0c0';                                                              // 灯焰：双层椭圆
        c.beginPath(); c.ellipse(lx + fw * 0.5, ly - 16, 6, 13 + Math.sin(t * 7) * 1.5, fw * 0.05, 0, TAU); c.fill();
        c.fillStyle = '#fffbe8';
        c.beginPath(); c.ellipse(lx + fw * 0.5, ly - 14, 3, 6.5, fw * 0.05, 0, TAU); c.fill();
      }
      cluster(c, t, lt, T.x, T.y - (T.kind === 'umbrella' ? 150 : 96), T);
      c.restore();
    });
  }
  const SIGN = ['参数', '疯狂卷参数', '参数之外'];
  function signWord(c, t, lt) {                                                              // 屏上字：左下画角写生铅笔签注（字长在物上）
    const k = lt < 3 ? 0 : lt < 7 ? 1 : 2;
    const T0 = [3, 7][k - 1];
    const bob = Math.sin(t * 1.1) * 2;
    c.save(); c.translate(238, 806 + bob); c.rotate(-0.025 + Math.sin(t * 0.9) * 0.004);
    c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.font = '52px "LXGWWenKai-500"';
    const oldA = k === 0 ? 0 : 1 - ss(T0, T0 + 0.32, lt);
    const newA = k === 0 ? ss(0.08, 0.5, lt) : ss(T0 + 0.3, T0 + 0.62, lt);
    c.shadowColor = 'rgba(243,236,220,.75)'; c.shadowBlur = 9;
    if (oldA > 0.02) { c.fillStyle = 'rgba(74,58,94,' + oldA + ')'; c.fillText(SIGN[k - 1], 0, 0); }
    if (newA > 0.02) { c.fillStyle = 'rgba(74,58,94,' + newA + ')'; c.fillText(SIGN[k], 0, 0); }
    c.shadowBlur = 0; c.strokeStyle = 'rgba(74,58,94,.5)'; c.lineWidth = 2; c.lineCap = 'round';   // 铅笔下划线
    const wl = 96 + k * 74;
    c.globalAlpha = Math.max(oldA, newA);
    c.beginPath(); c.moveTo(-2, 16); c.lineTo(wl, 13 + Math.sin(t * 1.4) * 1.2); c.stroke();
    c.globalAlpha = 1; c.restore();
  }
  function counter(c, t, lt, pulse) {                                                        // 画角铅笔签名计数器（1T+ 光涌一次）
    const on = ss(3.15, 3.6, lt); if (on <= 0.01) return;
    const dim = 1 - 0.2 * ss(7.6, 8.4, lt);                                               // 拍三轻退仍可读（1T+ 定格）
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
    const hg = c.createRadialGradient(1608, 758, 10, 1608, 758, 150);                        // 奶白光晕垫底（笔触底上要加光晕）
    hg.addColorStop(0, 'rgba(243,236,220,.5)'); hg.addColorStop(1, 'rgba(243,236,220,0)');
    c.fillStyle = hg; c.beginPath(); c.ellipse(1608, 762, 150, 62, 0, 0, TAU); c.fill();
    c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.font = '26px "LXGWWenKai-500"'; c.fillStyle = 'rgba(250,252,255,.9)';
    c.shadowColor = 'rgba(243,236,220,.8)'; c.shadowBlur = 10;
    c.fillText('参数量', 1608, 712 + bob);
    const pop = 1 + 0.1 * pulse;
    c.save(); c.translate(1608, 0); c.scale(pop, pop); c.translate(-1608, 0);
    c.font = '58px "EBGaramond-400i"'; c.shadowColor = 'rgba(243,236,220,.95)'; c.shadowBlur = 16;
    c.fillStyle = '#fdf0d0';
    c.fillText(str, 1608, 772 + bob);
    c.restore();
    c.shadowBlur = 0; c.strokeStyle = 'rgba(74,58,94,.45)'; c.lineWidth = 1.6; c.lineCap = 'round';   // 铅笔下划线
    c.beginPath(); c.moveTo(1540, 788); c.lineTo(1676, 785 + Math.sin(t * 1.6) * 1.2); c.stroke();
    c.restore();
  }

  return {
    init() {
      U.assertGlyphs('52px "LXGWWenKai-500"', '参数疯狂卷之外参数量', 's08_impressionism 签注与计数器');
      U.assertGlyphs('44px "EBGaramond-400i"', '0.73-1.2 2.4 1.5B 175B 540B 1T+ 0123456789', 's08_impressionism 数字');
    },
    draw(c, lt, t) {
      const dens = ss(3.1, 6.2, lt);                                                       // 拍二密度（背景升级）
      const b3 = ss(7, 8.6, lt);                                                          // 拍三收稳（变亮变精）
      const pulse = Math.sin(Math.PI * seg(lt, 6.3, 6.78));                               // 1T+ 揭示：一次平滑光涌
      const zoom = 1 + 0.13 * ease.inOut(ss(0, 3, lt)) - 0.13 * ease.inOut(ss(3, 7, lt)) + 0.02 * ease.inOut(ss(7, 9.5, lt));   // 缓推端详→缓拉铺开→停住微收
      const cx = lerp(830, 960, ss(3, 7, lt)), cy = lerp(700, 600, ss(3, 7, lt));
      c.save();
      c.translate(cx, cy); c.scale(zoom, zoom); c.translate(-cx, -cy);                     // 一个连续运镜（恒 zoom≥1，静态底不露边）
      c.drawImage(STATIC, 0, 0);
      if (dens > 0.01) { c.fillStyle = 'rgba(255,240,176,' + (0.05 * dens) + ')'; c.fillRect(0, 430, W, H - 430); }   // 草坡色温随密度升级
      clouds(c, t);
      cloudShade(c, t);
      poppies(c, t, lt);
      glints(c, t, lt, b3);
      field(c, t, lt, b3, pulse);
      heroes(c, t, lt, b3, pulse);
      if (pulse > 0.02) { c.fillStyle = 'rgba(255,248,200,' + (0.07 * pulse) + ')'; c.fillRect(0, 0, W, H); }   // 1T+ 光涌
      relief(c, t, lt);
      signWord(c, t, lt);
      counter(c, t, lt, pulse);
      c.restore();
    },
  };
})();
