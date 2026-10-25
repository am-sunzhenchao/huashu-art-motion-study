// s15_raytrace · 1993 早期光线追踪 CGI ×「大模型参数」风格样片（10s 单镜头三拍）。
// 题材构图（不搬速通片的房间）：无限透视棋盘＋粉紫落日天这套「射线追踪祖师爷」布景里——
//   拍一 0–3s   三颗铬球（参数本体）立在棋盘上，球面逐像素环境映射（镜面里棋盘随自转滚动＋粉紫天＋太阳亮带），
//               旁挂 0.73／-1.2／2.4 数字铭牌各自明灭，镜头缓推端详最大一颗（虚线选框收紧），远山线框网格缓缓显影；
//   拍二 3–7s   铬球沿棋盘格点增殖成球阵、金色光束蔓延成网，三只紫环自转，右上渲染台计数器
//               绿色线框数字翻滚 1.5B→175B→540B→1T+（每到一档被扫描线扫成实体），落日霞光随密度加浓、远山网格加密，
//               1T+ 揭示时全网球面一次脉冲发亮，镜头缓拉远；
//   拍三 7–10s  增殖停住；三件塑料雕塑沿扫描线自下而上「渲染升起」——书堆（数据）／齿轮（方法）／电池（算力），
//               三颗带数字的铬球变亮变精、飘落各停在一件雕塑顶上，残余球阵变暗收小、光束收拢成三球连线，镜头停住收稳。
// 管线：天空 16 条色带（早期 CG 色带感）＋逐像素透视棋盘（远处 2×2 超采样、近处单采样，缓存一次）；
//      铬球每帧逐像素环境映射（反射向量 R=2(N·V)N−V：向下→棋盘滚动，向上→落日渐变＋太阳亮带，菲涅尔边缘提亮）；
//      球阵小球用 3 张相位错开的活动铬球精灵缩放复用（控制逐像素开销）；远山两层缓存交叉淡入；
//      随机全 U.rng/U.hash 种子（同帧两次渲染逐像素一致）；无角色无脸；中文 PuHui-Bold、数字 Exo2-800i，字全部 y<880。
SCENES['s15_raytrace'] = (() => {
  const W = 1920, H = 1080, TAU = Math.PI * 2;
  const { clamp, lerp, ease, rng, hash, ss, seg } = U, P = PAINT;
  // ---------- 色板（抄 references/风格配方/15_raytrace.md） ----------
  const VPX = 960, VPY = 500, TX = 0.27, TZ = 0.00029;          // 棋盘透视参数（卡内值）
  const SUN = [620, 172];
  const GREEN = '#6cff7c', GOLD = '#f8c070';
  const SKY = [[0, '#a24cc4'], [0.42, '#df62ae'], [0.72, '#f5a08a'], [1, '#f8c070']].map(([q, h]) => [q, P.hex(h)]);
  const skyCol = (q) => {
    for (let k = 0; k < SKY.length - 1; k++) {
      const [qa, a] = SKY[k], [qb, b] = SKY[k + 1];
      if (q <= qb) { const u = clamp((q - qa) / (qb - qa)); return P.mix(a, b, u); }
    }
    return SKY[SKY.length - 1][1];
  };
  function rrectPath(x, y, w, h, r) {
    const p = new Path2D();
    p.moveTo(x + r, y); p.lineTo(x + w - r, y); p.arcTo(x + w, y, x + w, y + r, r);
    p.lineTo(x + w, y + h - r); p.arcTo(x + w, y + h, x + w - r, y + h, r);
    p.lineTo(x + r, y + h); p.arcTo(x, y + h, x, y + h - r, r);
    p.lineTo(x, y + r); p.arcTo(x, y, x + r, y, r); p.closePath();
    return p;
  }
  // ---------- 塑料着色（15 号卡的 plastic，逐部件过一遍） ----------
  function plastic(c, path, base, hx, hy, R, o) {
    o = o || {};
    const dark = o.dark != null ? o.dark : 0.42, spec = o.spec != null ? o.spec : 0.85;
    const specR = o.specR != null ? o.specR : 0.16, rim = o.rim !== false, specAng = o.specAng != null ? o.specAng : -0.5;
    c.fillStyle = base; c.fill(path);
    c.save(); c.clip(path);
    const g = c.createRadialGradient(hx, hy, 0, hx + R * 0.25, hy + R * 0.3, R);
    g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(0.28, 'rgba(255,255,255,.06)');
    g.addColorStop(0.62, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(10,0,30,' + dark + ')');
    c.fillStyle = g; c.fillRect(hx - R * 3, hy - R * 3, R * 6, R * 6);
    if (rim) { c.globalCompositeOperation = 'lighter'; c.lineWidth = R * 0.18; c.strokeStyle = 'rgba(70,150,150,.28)'; c.translate(-R * 0.04, 0); c.stroke(path); c.globalCompositeOperation = 'source-over'; }
    c.restore();
    if (spec) { c.save(); c.clip(path); c.fillStyle = 'rgba(255,255,255,' + spec + ')'; c.beginPath(); c.ellipse(hx, hy, R * specR, R * specR * 0.55, specAng, 0, 7); c.fill(); c.restore(); }
  }

  // ---------- 静态底：16 条色带天＋逐像素棋盘（缓存一次） ----------
  const BG = P.cached('s15bg', W, H, (g) => {
    const NB = 16;
    for (let b = 0; b < NB; b++) {
      const q = (b + 0.5) / NB, col = skyCol(q);
      g.fillStyle = 'rgb(' + (col[0] | 0) + ',' + (col[1] | 0) + ',' + (col[2] | 0) + ')';
      g.fillRect(0, Math.round(b * 500 / NB), W, Math.ceil(500 / NB) + 1);
    }
    { const r = rng(55);                                            // 三条静态斜阳云带
      for (let k = 0; k < 3; k++) {
        const y = 110 + k * 78 + r() * 20, x = 130 + r() * 500, w2 = 300 + r() * 260;
        g.fillStyle = k === 1 ? 'rgba(255,214,150,.20)' : 'rgba(150,70,150,.16)';
        g.beginPath(); g.ellipse(x, y, w2, 8 + r() * 5, -0.05, 0, TAU); g.fill();
      } }
    { const sg = g.createRadialGradient(SUN[0], SUN[1], 20, SUN[0], SUN[1], 320);   // 太阳底晕（静态）
      sg.addColorStop(0, 'rgba(255,236,200,.62)'); sg.addColorStop(0.4, 'rgba(255,196,150,.22)'); sg.addColorStop(1, 'rgba(255,196,150,0)');
      g.fillStyle = sg; g.fillRect(SUN[0] - 340, SUN[1] - 340, 680, 680); }
    g.fillStyle = '#fff3d8'; g.beginPath(); g.arc(SUN[0], SUN[1], 26, 0, TAU); g.fill();
    // 棋盘：y 500–720 用 2×2 超采样（格边密），720 以下单采样（格边稀，锯齿不可见）
    const A = P.hex('#d9dadf'), B = P.hex('#3e5d62'), FH = 580;
    const im = g.createImageData(W, FH), d = im.data;
    for (let y = 0; y < FH; y++) {
      const wy = 500 + y, ss4 = wy < 720;
      for (let x = 0; x < W; x++) {
        let s;
        if (ss4) {
          s = 0;
          for (let k = 0; k < 4; k++) {
            const dy = y + (k >> 1) * 0.5 + 0.25, xx = x + (k & 1) * 0.5 + 0.25;
            const X = (xx - VPX) / dy, Z = 1 / dy;
            s += ((Math.floor(X / TX + 0.5) + Math.floor(Z / TZ)) & 1);
          }
          s /= 4;
        } else {
          const X = (x + 0.5 - VPX) / y, Z = 1 / y;
          s = ((Math.floor(X / TX + 0.5) + Math.floor(Z / TZ)) & 1);
        }
        const fog = clamp(1 - y / 160) * 0.62, i = (y * W + x) * 4;
        d[i] = lerp(lerp(A[0], B[0], s), 172, fog);
        d[i + 1] = lerp(lerp(A[1], B[1], s), 190, fog);
        d[i + 2] = lerp(lerp(A[2], B[2], s), 192, fog);
        d[i + 3] = 255;
      }
    }
    g.putImageData(im, 0, 500);
    { const hg = g.createLinearGradient(0, 496, 0, 534);           // 地平线暖光带
      hg.addColorStop(0, 'rgba(248,192,112,.5)'); hg.addColorStop(1, 'rgba(248,192,112,0)');
      g.fillStyle = hg; g.fillRect(0, 496, W, 38); }
  });

  // ---------- 远山两层（缓存；拍一显影、拍二随密度加密交叉淡入） ----------
  function mountainLayer(g, spec) {
    const base = 500;
    g.beginPath(); g.moveTo(0, base);
    spec.pts.forEach(p => g.lineTo(p[0], p[1]));
    g.lineTo(W, base); g.closePath();
    const mg = g.createLinearGradient(0, spec.top, 0, base);
    mg.addColorStop(0, spec.c0); mg.addColorStop(1, spec.c1);
    g.fillStyle = mg; g.fill();
    g.save(); g.clip();
    g.strokeStyle = spec.line; g.lineWidth = 1.4;
    for (let x = 0; x <= W; x += spec.vx) { g.beginPath(); g.moveTo(x, spec.top - 6); g.lineTo(x, base); g.stroke(); }
    for (let y = spec.top + 8; y < base; y += spec.hy) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    g.fillStyle = '#fbeef6';                                          // 锯齿雪顶
    spec.snow.forEach(([x, y, w2]) => {
      g.beginPath(); g.moveTo(x - w2, y + w2 * 0.9); g.lineTo(x, y); g.lineTo(x + w2, y + w2 * 0.9);
      g.lineTo(x + w2 * 0.4, y + w2 * 0.6); g.lineTo(x, y + w2 * 0.95); g.lineTo(x - w2 * 0.5, y + w2 * 0.6); g.closePath(); g.fill();
    });
    g.restore();
    g.strokeStyle = 'rgba(255,190,235,.5)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(0, base); spec.pts.forEach(p => g.lineTo(p[0], p[1])); g.lineTo(W, base); g.stroke();
  }
  const MTF = P.cached('s15mtf', W, H, (g) => mountainLayer(g, {
    top: 330, c0: '#b06ab8', c1: '#8a50a8', line: 'rgba(255,170,230,.45)', vx: 26, hy: 24,
    pts: [[0, 430], [130, 354], [260, 412], [390, 338], [520, 414], [650, 356], [780, 418], [910, 340], [1040, 410], [1170, 360], [1300, 416], [1430, 350], [1560, 412], [1690, 362], [1820, 414], [1920, 382]],
    snow: [[390, 338, 27], [910, 340, 22], [1430, 350, 18]],
  }));
  const MTN = P.cached('s15mtn', W, H, (g) => mountainLayer(g, {
    top: 442, c0: '#8f5aa8', c1: '#6c3f94', line: 'rgba(255,190,240,.5)', vx: 18, hy: 16,
    pts: [[0, 478], [150, 452], [300, 488], [450, 446], [600, 486], [750, 452], [900, 490], [1050, 450], [1200, 488], [1350, 456], [1500, 492], [1650, 458], [1800, 490], [1920, 466]],
    snow: [[450, 446, 14], [1050, 450, 12]],
  }));

  // ---------- 辉光精灵（绿：渲染台；暖金：铬球/计数器实体闪） ----------
  const GLOWG = P.cached('s15glg', 256, 256, (g) => {
    const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, 'rgba(160,255,170,.8)'); gr.addColorStop(0.4, 'rgba(108,255,124,.3)'); gr.addColorStop(1, 'rgba(108,255,124,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  });
  const GLOWW = P.cached('s15glw', 256, 256, (g) => {
    const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, 'rgba(255,242,214,.85)'); gr.addColorStop(0.4, 'rgba(248,192,112,.3)'); gr.addColorStop(1, 'rgba(248,192,112,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  });

  // ---------- 铬球：逐像素环境映射（反射向量向下→滚动棋盘；向上→落日渐变＋太阳亮带；菲涅尔） ----------
  function chromeInto(g, r, rot, az) {
    const D = Math.max(12, Math.ceil(r * 2) + 2), rr = D / 2 - 1;
    // 先清掉最大可能用过的 240×240 再 putImageData：主球半径随拍三飞行缩小、D 会变小，
    // 裁剪框外残留的历史内容会让 Skia 走不同的纹理路径，冷渲/热渲的缩放抗锯齿差出一行（qa 确定性抓到过）。
    g.clearRect(0, 0, 240, 240);
    const im = g.createImageData(D, D), d = im.data;
    for (let y = 0; y < D; y++) for (let x = 0; x < D; x++) {
      const nx = (x - rr) / rr, ny = (y - rr) / rr, q = nx * nx + ny * ny;
      if (q > 1) continue;
      const nz = Math.sqrt(1 - q), i = (y * D + x) * 4;
      const rx = 2 * nz * nx, ry = 2 * nz * ny, rz = 2 * nz * nz - 1;
      let c0, c1, c2;
      if (ry > 0.05) {                                                // 镜面里向下看到棋盘
        const u = rx / ry * 1.6 + rot, v = rz / ry * 1.6;
        if (((Math.floor(u * 2) + Math.floor(v * 2)) & 1)) { c0 = 62; c1 = 93; c2 = 98; }
        else { c0 = 217; c1 = 218; c2 = 223; }
      } else {                                                        // 向上看到落日渐变天
        const k = clamp(-ry * 1.35);
        c0 = lerp(248, 162, k); c1 = lerp(192, 76, k); c2 = lerp(112, 196, k);
        if (Math.abs(rx - az) < 0.085 && ry < -0.3 && ry > -0.8) { c0 = 255; c1 = 255; c2 = 255; }
      }
      const f = 0.35 + 0.65 * Math.pow(1 - nz, 0.3) * 0.5 + 0.3;      // 菲涅尔边缘提亮
      d[i] = c0 * f + 18; d[i + 1] = c1 * f + 18; d[i + 2] = c2 * f + 22; d[i + 3] = 255;
    }
    g.putImageData(im, 0, 0);
    return D;
  }

  // ---------- 三颗参数铬球（0.73／-1.2／2.4），拍三飘落雕塑顶 ----------
  const HERO = [
    { x: 1170, y: 690, r: 112, num: '0.73', ph: 0,   az: -0.5,  dock: [430, 654],  pw: 168, phh: 62, fs: 46 },
    { x: 560,  y: 630, r: 74,  num: '-1.2', ph: 2.1, az: 0.45,  dock: [960, 596],  pw: 148, phh: 56, fs: 40 },
    { x: 872,  y: 556, r: 40,  num: '2.4',  ph: 4.2, az: -0.4,  dock: [1490, 574], pw: 124, phh: 50, fs: 34 },
  ];

  // ---------- 球阵：棋盘格点上的节点（种子生成、出生洗牌铺满 3.12–6.4） ----------
  const NODES = [], NODE_AT = {};
  {
    const r = rng(1515);
    for (let j = 6; j <= 34; j++) {
      const dy = 1 / (j * TZ), y = VPY + dy;
      const maxI = Math.floor(1040 / (TX * dy));
      const cand = [];
      for (let i = -maxI; i <= maxI; i++) cand.push(i);
      for (let n = cand.length - 1; n > 0; n--) { const m = (r() * (n + 1)) | 0; const tmp = cand[n]; cand[n] = cand[m]; cand[m] = tmp; }
      const want = j < 9 ? 7 : j < 17 ? 8 : 5;
      for (let n = 0; n < Math.min(want, cand.length); n++) {
        const i = cand[n];
        if (HERO.some(h => Math.hypot(VPX + i * TX * dy - h.x, y - (h.y + h.r)) < h.r + 42)) continue;   // 别贴着主角球
        const nd = { i, j, x: VPX + i * TX * dy, y, dy, r: 7 + dy * 0.055, ph: r() * TAU, sp: 1.8 + r() * 2.4,
          v: ((i * 73 + j * 31) % 3 + 3) % 3, birth: 0 };
        NODES.push(nd); NODE_AT[j + '_' + i] = nd;
      }
    }
    const ord = NODES.map((q, idx) => ({ idx, k: r() })).sort((a, b) => a.k - b.k);
    ord.forEach((o, n) => { NODES[o.idx].birth = 3.12 + 3.28 * Math.pow(n / Math.max(1, ord.length - 1), 0.9) + r() * 0.05; });
  }
  // 连线：同排横线＋跨排纵深线＋主角球接最近 3 颗
  const EDGES = [];
  {
    NODES.forEach(a => {
      const b = NODE_AT[a.j + '_' + (a.i + 1)]; if (b) EDGES.push({ a, b, birth: Math.max(a.birth, b.birth) + 0.14, hero: false });
      const c2 = NODE_AT[(a.j + 1) + '_' + a.i]; if (c2) EDGES.push({ a, b: c2, birth: Math.max(a.birth, c2.birth) + 0.14, hero: false });
    });
    HERO.forEach(h => {
      NODES.map(n => ({ n, d: Math.hypot(n.x - h.x, n.y - h.y - h.r) }))
        .sort((p, q) => p.d - q.d).slice(0, 3)
        .forEach(({ n }) => EDGES.push({ a: { x: h.x, y: h.y, dy: 300 }, b: n, birth: n.birth + 0.14, hero: true }));
    });
  }

  // ---------- 紫环（自转；小球沿环排布按深度排序） ----------
  const TORI = [
    { x: 430, y: 352, R: 84, rr: 13, spin: 0.9,  tilt: 0.35 },
    { x: 1500, y: 356, R: 66, rr: 11, spin: -1.15, tilt: -0.32 },
    { x: 995, y: 286, R: 50, rr: 9,  spin: 0.75, tilt: 0.5 },
  ];
  function torus(c, t, o, alpha) {
    const th = t * o.spin, N = 46, out = [];
    for (let k = 0; k < N; k++) {
      const ph = k / N * TAU, x0 = o.R * Math.cos(ph), y0 = o.R * Math.sin(ph);
      const X = x0 * Math.cos(th), Z = x0 * Math.sin(th);
      const Y = y0 * Math.cos(o.tilt) - Z * Math.sin(o.tilt), Z2 = y0 * Math.sin(o.tilt) + Z * Math.cos(o.tilt);
      out.push([o.x + X, o.y + Y, Z2]);
    }
    out.sort((a, b) => a[2] - b[2]);
    c.save(); c.globalAlpha = alpha;
    const base = new Path2D();                                       // 暗底让球连成管
    out.forEach(([x, y]) => { base.moveTo(x + o.rr, y); base.arc(x, y, o.rr, 0, TAU); });
    c.fillStyle = '#4d1168'; c.fill(base);
    out.forEach(([x, y, z]) => {                                     // 逐颗按深度调亮
      const l = 0.5 + 0.5 * z / o.R;
      c.fillStyle = 'rgb(' + (lerp(130, 232, l) | 0) + ',' + (lerp(32, 118, l) | 0) + ',' + (lerp(152, 246, l) | 0) + ')';
      c.beginPath(); c.arc(x, y, o.rr * 0.88, 0, TAU); c.fill();
    });
    const sp = new Path2D();                                         // 批量白色镜点
    out.forEach(([x, y]) => { const hx = x - o.rr * 0.34, hy = y - o.rr * 0.38; sp.moveTo(hx + o.rr * 0.2, hy); sp.arc(hx, hy, o.rr * 0.2, 0, TAU); });
    c.fillStyle = 'rgba(255,225,255,.6)'; c.fill(sp);
    c.restore();
  }

  // ---------- HUD 铭牌（数字铭牌／雕塑标签共用） ----------
  function hudPlate(c, x, y, w, h, alpha) {
    c.save(); c.globalAlpha = alpha;
    const p = rrectPath(x, y, w, h, 7);
    c.fillStyle = 'rgba(13,8,40,.78)'; c.fill(p);
    c.strokeStyle = 'rgba(159,232,224,.75)'; c.lineWidth = 1.6; c.stroke(p);
    c.strokeStyle = 'rgba(159,232,224,.95)'; c.lineWidth = 2.4;
    [[x + 4, y + 4, 1, 1], [x + w - 4, y + 4, -1, 1], [x + 4, y + h - 4, 1, -1], [x + w - 4, y + h - 4, -1, -1]].forEach(([tx, ty, sx, sy]) => {
      c.beginPath(); c.moveTo(tx + 10 * sx, ty); c.lineTo(tx, ty); c.lineTo(tx, ty + 10 * sy); c.stroke();
    });
    c.restore();
  }
  // 线框→扫描线→实体 的「渲染字」：prog 0 全绿线框、0–1 扫描线下扫成实体、1 全实体
  function sweepText(c, txt, font, cx, yTop, boxH, prog, baseY) {
    c.save(); c.font = font; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    const gr = c.createLinearGradient(0, yTop + boxH * 0.12, 0, yTop + boxH * 0.92);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, GOLD);
    const solidPart = (y0, y1) => { if (y1 - y0 < 1) return;
      c.save(); c.beginPath(); c.rect(cx - 640, y0, 1280, y1 - y0); c.clip();
      c.fillStyle = 'rgba(30,10,60,.85)'; c.fillText(txt, cx + 3, baseY + 4);
      c.fillStyle = gr; c.fillText(txt, cx, baseY); c.restore(); };
    const wirePart = (y0, y1) => { if (y1 - y0 < 1) return;
      c.save(); c.beginPath(); c.rect(cx - 640, y0, 1280, y1 - y0); c.clip();
      c.strokeStyle = GREEN; c.lineWidth = 2; c.shadowColor = GREEN; c.shadowBlur = 9; c.strokeText(txt, cx, baseY); c.restore(); };
    if (prog <= 0.002) wirePart(yTop - 40, yTop + boxH + 14);
    else if (prog >= 0.998) solidPart(yTop - 40, yTop + boxH + 14);
    else {
      const sy = yTop + prog * boxH;
      solidPart(yTop - 40, sy); wirePart(sy, yTop + boxH + 14);
      c.save(); c.globalCompositeOperation = 'lighter';
      const bg = c.createLinearGradient(0, sy - 6, 0, sy + 6);
      bg.addColorStop(0, 'rgba(108,255,124,0)'); bg.addColorStop(0.5, 'rgba(190,255,190,.9)'); bg.addColorStop(1, 'rgba(108,255,124,0)');
      c.fillStyle = bg; c.fillRect(cx - 640, sy - 6, 1280, 12); c.restore();
    }
    c.restore();
  }

  // ---------- 屏上字（拍界换字，同一块渲染台铭牌） ----------
  const CAPS = [
    { txt: '参数', sub: 'PARAMETERS', size: 96, w: 316, t0: 0.35, ts: 0.85, out: 2.6 },
    { txt: '疯狂卷参数', sub: 'PARAMETER RACE', size: 68, w: 486, t0: 3.15, ts: 3.65, out: 6.55 },
    { txt: '参数之外', sub: 'BEYOND PARAMETERS', size: 80, w: 452, t0: 7.3, ts: 7.8, out: 99 },
  ];
  function captions(c, lt, t) {
    CAPS.forEach(cp => {
      const a = ss(cp.t0, cp.t0 + 0.42, lt) * (1 - ss(cp.out, cp.out + 0.4, lt));
      if (a <= 0.01) return;
      const px = 104, py = 108 - (1 - ss(cp.t0, cp.t0 + 0.42, lt)) * 16;
      hudPlate(c, px, py, cp.w, 200, a * 0.94);
      c.save(); c.globalAlpha = a;
      const bl = hash(Math.floor(t * 7), 9) < 0.5;                   // 渲染台指示灯
      c.fillStyle = bl ? 'rgba(108,255,124,.95)' : 'rgba(108,255,124,.3)';
      c.fillRect(px + cp.w - 26, py + 14, 9, 9);
      c.font = '19px "Exo2-800i"'; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.letterSpacing = '2px';
      c.fillStyle = 'rgba(108,255,124,.85)'; c.fillText('RENDER', px + 22, py + 28);
      c.restore();
      const prog = clamp((lt - cp.ts) / 0.42, 0, 1);
      sweepText(c, cp.txt, cp.size + 'px "PuHui-Bold"', px + cp.w / 2, py + 40, 122, prog, py + 166);
      c.save(); c.globalAlpha = a * ss(cp.ts + 0.2, cp.ts + 0.55, lt);
      c.font = '21px "Exo2-800i"'; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.letterSpacing = '4px';
      c.fillStyle = 'rgba(108,255,124,.9)'; c.fillText(cp.sub, px + cp.w / 2, py + 200 - 20);
      c.restore();
    });
  }

  // ---------- 渲染台计数器：绿线框翻滚，每到一档扫描线扫成实体 ----------
  const MILE = [[3.35, '1.5B'], [4.35, '175B'], [5.45, '540B'], [6.4, '1T+']];
  const CK = { x: 1332, y: 84, w: 500, h: 186 };
  function counterState(lt) {
    let cur = null, next = null;
    for (let m = 0; m < MILE.length; m++) {
      if (lt >= MILE[m][0]) cur = MILE[m]; else { next = MILE[m]; break; }
    }
    if (!cur) return { scramble: 1 };
    if (!next) return { solid: cur[1], L: cur[0], sweep: 1 };
    if (lt >= next[0] - 0.5) return { scramble: 1 };
    return { solid: cur[1], L: cur[0], sweep: clamp((lt - cur[0]) / 0.34, 0, 1) };
  }
  function counter(c, lt, t) {
    const on = ss(3.05, 3.55, lt) * (1 - ss(6.95, 7.55, lt)); if (on <= 0.01) return;
    const px = CK.x, py = CK.y - (1 - ss(3.05, 3.55, lt)) * 24;
    c.save(); c.globalAlpha = on;
    hudPlate(c, px, py, CK.w, CK.h, 0.94);
    c.font = '20px "Exo2-800i"'; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.letterSpacing = '2px';
    c.fillStyle = 'rgba(108,255,124,.9)'; c.fillText('RENDER / PARAM COUNT', px + 24, py + 34);
    const bl = hash(Math.floor(t * 8), 3) < 0.5;
    c.fillStyle = bl ? 'rgba(108,255,124,.95)' : 'rgba(108,255,124,.3)';
    c.fillRect(px + CK.w - 28, py + 22, 11, 11);
    c.letterSpacing = '0px';
    const st = counterState(lt);
    if (st.scramble) {
      const f = Math.floor(t * 13);
      let txt = '';
      for (let k = 0; k < 3; k++) txt += String(Math.floor(hash(f, k + 20) * 10));
      txt += 'B';
      c.font = '92px "Exo2-800i"'; c.textAlign = 'center';
      c.strokeStyle = GREEN; c.lineWidth = 2.2; c.shadowColor = GREEN; c.shadowBlur = 12;
      c.strokeText(txt, px + CK.w / 2, py + 156);
      c.shadowBlur = 0;
    } else {
      sweepText(c, st.solid, '92px "Exo2-800i"', px + CK.w / 2, py + 76, 102, st.sweep, py + 156);
      const fl = Math.exp(-Math.max(0, lt - st.L) * 2.4);            // 落定后的实体辉光
      if (fl > 0.02) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = on * 0.5 * fl;
        c.drawImage(GLOWW, px + CK.w / 2 - 200, py + 110 - 200, 400, 400); c.restore(); }
    }
    const pf = clamp((lt - 3.15) / 3.25, 0, 1);                        // 渲染进度条
    c.fillStyle = 'rgba(108,255,124,.2)'; c.fillRect(px + 24, py + CK.h - 24, CK.w - 48, 7);
    c.fillStyle = GREEN; c.fillRect(px + 24, py + CK.h - 24, (CK.w - 48) * pf, 7);
    c.restore();
  }

  // ---------- 拍三：三件塑料雕塑（绿色线框→扫描线自下而上→实体） ----------
  function wireStyle(c, a) { c.strokeStyle = 'rgba(108,255,124,' + a + ')'; c.lineWidth = 2; c.shadowColor = GREEN; c.shadowBlur = 6; }
  const BOOKS = [
    { w: 178, c: '#7a3a9e', rot: -0.022 }, { w: 170, c: '#df62ae', rot: 0.018 }, { w: 160, c: '#3e5d62', rot: -0.014 },
    { w: 152, c: '#f5a08a', rot: 0.024 }, { w: 144, c: '#8a5ab8', rot: -0.02 }, { w: 132, c: '#c2508e', rot: 0.016 },
  ];
  function booksSolid(c, X, Y, t) {
    c.save(); c.translate(X, Y);
    plastic(c, rrectPath(-96, -24, 192, 24, 4), '#cfd6da', -20, -16, 130, { spec: 0.7, rim: false });
    let yy = -24;
    BOOKS.forEach((b, k) => {
      const h = 26, yb = yy - h;
      c.save(); c.translate(0, yb + h / 2); c.rotate(b.rot); c.translate(0, -(yb + h / 2));
      const p = rrectPath(-b.w / 2, yb, b.w, h, 3);
      plastic(c, p, b.c, -b.w * 0.18, yb + 8, b.w * 0.72, { spec: 0.75, specR: 0.09, dark: 0.4 });
      for (let s = 0; s < 4; s++) {                                  // 书脊数据刻度（绿色，明灭）
        const aa = 0.3 + 0.35 * (0.5 + 0.5 * Math.sin(t * 2.1 + k * 1.7 + s));
        c.fillStyle = 'rgba(108,255,124,' + aa.toFixed(3) + ')';
        c.fillRect(b.w / 2 - 12, yb + 5 + s * 5, 7, 2.4);
      }
      c.strokeStyle = 'rgba(20,8,40,.5)'; c.lineWidth = 1.5; c.stroke(p);
      c.restore(); yy -= h;
    });
    c.restore();
  }
  function booksWire(c, X, Y) {
    c.save(); c.translate(X, Y); wireStyle(c, 1);
    c.strokeRect(-96, -24, 192, 24);
    let yy = -24;
    BOOKS.forEach(b => { const yb = yy - 26; c.strokeRect(-b.w / 2, yb, b.w, 26);
      c.beginPath(); c.moveTo(-b.w / 2, yb); c.lineTo(b.w / 2, yb + 26); yy -= 26; });
    c.restore();
  }
  function gearSolid(c, X, Y, t) {
    c.save(); c.translate(X, Y);
    plastic(c, rrectPath(-64, -64, 128, 64, 5), '#4f7a80', -22, -50, 96, { spec: 0.6, rim: false });
    const tp = new Path2D(); tp.ellipse(0, -64, 64, 11, 0, 0, TAU);
    plastic(c, tp, '#5c8a90', -18, -68, 60, { spec: 0.7, rim: false });
    plastic(c, rrectPath(-14, -82, 28, 20, 3), '#cfd6da', -8, -78, 30, { spec: 0.7, rim: false });
    c.save(); c.translate(0, -162); c.rotate(t * 0.3);                // 齿轮缓转
    const gp = new Path2D(); gp.arc(0, 0, 88, 0, TAU);
    for (let k = 0; k < 11; k++) {
      const a = k / 11 * TAU, w2 = 0.19, r0 = 85, r1 = 106;
      gp.moveTo(Math.cos(a - w2) * r0, Math.sin(a - w2) * r0); gp.lineTo(Math.cos(a - w2) * r1, Math.sin(a - w2) * r1);
      gp.lineTo(Math.cos(a + w2) * r1, Math.sin(a + w2) * r1); gp.lineTo(Math.cos(a + w2) * r0, Math.sin(a + w2) * r0); gp.closePath();
    }
    plastic(c, gp, '#d4a94e', -26, -56, 150, { spec: 0.8, specR: 0.05, dark: 0.45 });
    c.fillStyle = '#8a6a28'; c.beginPath(); c.arc(0, 0, 30, 0, TAU); c.fill();
    c.fillStyle = '#241a08'; c.beginPath(); c.arc(0, 0, 15, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(60,40,10,.55)'; c.lineWidth = 7;
    for (let s = 0; s < 5; s++) { const a = s / 5 * TAU; c.beginPath(); c.moveTo(Math.cos(a) * 15, Math.sin(a) * 15); c.lineTo(Math.cos(a) * 62, Math.sin(a) * 62); c.stroke(); }
    c.strokeStyle = 'rgba(255,240,200,.5)'; c.lineWidth = 3;
    c.beginPath(); c.arc(0, 0, 84, -2.4, -0.9); c.stroke();
    c.restore(); c.restore();
  }
  function gearWire(c, X, Y) {
    c.save(); c.translate(X, Y); wireStyle(c, 1);
    c.strokeRect(-64, -64, 128, 64);
    c.beginPath(); c.ellipse(0, -64, 64, 11, 0, 0, TAU); c.stroke();
    c.translate(0, -162);
    c.beginPath(); c.arc(0, 0, 88, 0, TAU); c.stroke();
    c.beginPath(); c.arc(0, 0, 106, 0, TAU); c.stroke();
    c.beginPath(); c.arc(0, 0, 30, 0, TAU); c.stroke();
    for (let k = 0; k < 11; k++) { const a = k / 11 * TAU;
      c.beginPath(); c.moveTo(Math.cos(a) * 85, Math.sin(a) * 85); c.lineTo(Math.cos(a) * 106, Math.sin(a) * 106); c.stroke(); }
    for (let s = 0; s < 5; s++) { const a = s / 5 * TAU;
      c.beginPath(); c.moveTo(Math.cos(a) * 30, Math.sin(a) * 30); c.lineTo(Math.cos(a) * 85, Math.sin(a) * 85); c.stroke(); }
    c.restore();
  }
  function battSolid(c, X, Y, t) {
    c.save(); c.translate(X, Y);
    plastic(c, rrectPath(-84, -26, 168, 26, 5), '#cfd6da', -30, -18, 110, { spec: 0.7, rim: false });
    plastic(c, rrectPath(-58, -226, 116, 200, 12), '#3e5d62', -20, -190, 170, { spec: 0.8, specR: 0.07, dark: 0.42 });
    c.fillStyle = 'rgba(159,232,224,.5)'; c.fillRect(-58, -210, 116, 14);      // 环带
    c.fillStyle = '#0e1a20'; c.fillRect(-36 + 0, -206, 72, 128);
    c.strokeStyle = 'rgba(159,232,224,.45)'; c.lineWidth = 1.5; c.strokeRect(-36, -206, 72, 128);
    for (let k = 0; k < 5; k++) {                                   // 电量格（绿，脉动）
      const aa = 0.4 + 0.4 * (0.5 + 0.5 * Math.sin(t * 2.4 + k * 0.8));
      c.fillStyle = 'rgba(108,255,124,' + aa.toFixed(3) + ')';
      c.fillRect(-26, -94 - k * 21, 52, 13);
    }
    plastic(c, rrectPath(-17, -254, 34, 30, 4), '#d9dadf', -10, -248, 40, { spec: 0.75, rim: false });
    const dome = new Path2D(); dome.ellipse(0, -254, 17, 8, 0, Math.PI, 0);
    plastic(c, dome, '#eceef2', -6, -258, 22, { spec: 0.7, rim: false });
    c.restore();
  }
  function battWire(c, X, Y) {
    c.save(); c.translate(X, Y); wireStyle(c, 1);
    c.strokeRect(-84, -26, 168, 26);
    c.strokeRect(-58, -226, 116, 200);
    c.strokeRect(-17, -254, 34, 30);
    c.strokeRect(-36, -206, 72, 128);
    for (let k = 0; k < 5; k++) c.strokeRect(-26, -94 - k * 21, 52, 13);
    c.restore();
  }
  const OBJ = [
    { x: 430, base: 880, t0: 7.05, w: 260, h: 190, solid: booksSolid, wire: booksWire, label: '数据', lab: 'DATA', lx: 596, ly: 792 },
    { x: 960, base: 896, t0: 7.4, w: 250, h: 276, solid: gearSolid, wire: gearWire, label: '方法', lab: 'METHOD', lx: 1112, ly: 812 },
    { x: 1490, base: 880, t0: 7.75, w: 200, h: 288, solid: battSolid, wire: battWire, label: '算力', lab: 'POWER', lx: 1598, ly: 786 },
  ];
  function sculpture(c, o, lt, t) {
    const wa0 = ss(o.t0, o.t0 + 0.45, lt);
    if (wa0 <= 0.005) return;
    const sw = seg(lt, o.t0 + 0.42, o.t0 + 1.38);
    const yTop = o.base - o.h, scanY = o.base + 8 - sw * (o.h + 16);
    { c.save(); c.globalCompositeOperation = 'lighter';               // 渲染基座绿辉
      c.globalAlpha = 0.14 * wa0 * (1 - 0.45 * sw);
      c.drawImage(GLOWG, o.x - 190, o.base - 60 - 190, 380, 380); c.restore(); }
    if (sw > 0) {                                                     // 扫描线以下＝实体
      c.save(); c.beginPath(); c.rect(o.x - o.w / 2 - 44, scanY, o.w + 88, o.base + 30 - scanY); c.clip();
      o.solid(c, o.x, o.base, t); c.restore();
    }
    const wa = wa0 * (1 - ss(o.t0 + 1.3, o.t0 + 1.72, lt) * 0.94);    // 扫描线以上＝绿线框，扫完淡出
    if (wa > 0.02 && sw < 1) {
      c.save(); c.beginPath(); c.rect(o.x - o.w / 2 - 44, yTop - 34, o.w + 88, Math.max(1, scanY - yTop + 34)); c.clip();
      c.globalAlpha = wa; o.wire(c, o.x, o.base); c.restore();
    }
    if (sw > 0 && sw < 1) {                                           // 扫描线亮条
      c.save(); c.globalCompositeOperation = 'lighter';
      const bg2 = c.createLinearGradient(0, scanY - 7, 0, scanY + 7);
      bg2.addColorStop(0, 'rgba(108,255,124,0)'); bg2.addColorStop(0.5, 'rgba(190,255,190,.85)'); bg2.addColorStop(1, 'rgba(108,255,124,0)');
      c.fillStyle = bg2; c.fillRect(o.x - o.w / 2 - 60, scanY - 7, o.w + 120, 14); c.restore();
    }
    const la = ss(o.t0 + 1.5, o.t0 + 1.92, lt);                       // 雕塑标签铭牌
    if (la > 0.01) {
      hudPlate(c, o.lx, o.ly, 150, 64, la * 0.94);
      c.save(); c.globalAlpha = la;
      c.font = '34px "PuHui-Bold"'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
      c.fillStyle = 'rgba(30,10,60,.85)'; c.fillText(o.label, o.lx + 75 + 2, o.ly + 42 + 2);
      c.fillStyle = '#f2ecf4'; c.fillText(o.label, o.lx + 75, o.ly + 42);
      c.font = '15px "Exo2-800i"'; c.letterSpacing = '3px'; c.fillStyle = 'rgba(108,255,124,.85)';
      c.fillText(o.lab, o.lx + 75, o.ly + 60); c.letterSpacing = '0px';
      c.restore();
    }
  }

  // ---------- 镜头光晕（屏幕层，锚在经运镜变换的太阳上；lighter） ----------
  function flare(c, sx, sy, t, inten) {
    c.save(); c.globalCompositeOperation = 'lighter';
    const pul = 1 + 0.08 * Math.sin(t * 3.1);
    const R = 150 * inten * pul;
    const glow = c.createRadialGradient(sx, sy, 0, sx, sy, R);
    glow.addColorStop(0, 'rgba(255,255,255,.95)'); glow.addColorStop(0.14, 'rgba(255,240,250,.85)');
    glow.addColorStop(0.4, 'rgba(255,170,220,.24)'); glow.addColorStop(1, 'rgba(255,150,220,0)');
    c.fillStyle = glow; c.beginPath(); c.arc(sx, sy, R, 0, TAU); c.fill();
    const rot = t * 0.4;
    for (let k = 0; k < 10; k++) {                                    // 星芒缓旋
      const a = rot + k / 10 * TAU, L = (k % 2 ? 66 : 108) * pul;
      const g = c.createLinearGradient(sx, sy, sx + Math.cos(a) * L, sy + Math.sin(a) * L);
      g.addColorStop(0, 'rgba(255,255,255,.75)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.strokeStyle = g; c.lineWidth = 2.4;
      c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + Math.cos(a) * L, sy + Math.sin(a) * L); c.stroke();
    }
    const hs = c.createLinearGradient(sx - 390, 0, sx + 390, 0);      // 水平长条光
    hs.addColorStop(0, 'rgba(255,255,255,0)'); hs.addColorStop(0.5, 'rgba(255,255,255,' + (0.7 * pul * Math.min(inten, 1.3)).toFixed(3) + ')'); hs.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = hs; c.fillRect(sx - 390, sy - 2, 780, 4);
    c.strokeStyle = 'rgba(255,255,255,.16)'; c.lineWidth = 3;
    c.beginPath(); c.arc(sx, sy, 132 * pul, 0, TAU); c.stroke();
    const C0 = [960, 540], dx = C0[0] - sx, dy = C0[1] - sy, sl = Math.sin(t * 0.9) * 0.02;
    [[0.62, 54, 'rgba(180,255,240,.15)', 0], [0.95, 16, 'rgba(160,255,255,.38)', 6], [1.25, 38, 'rgba(255,200,255,.12)', 6], [1.55, 32, 'rgba(200,255,230,.17)', 0], [0.8, 11, 'rgba(255,255,200,.3)', 6]].forEach(([k, r, col, sides]) => {
      const x = sx + dx * (k + sl), y = sy + dy * (k + sl);
      c.fillStyle = col; c.beginPath();
      if (sides) for (let i = 0; i < sides; i++) { const a = i / sides * TAU + 0.3; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
      else c.arc(x, y, r, 0, TAU);
      c.closePath(); c.fill();
    });
    c.restore();
  }

  // ---------- 运镜：拍一缓推 1→1.09，拍二缓拉回 1.09→1，拍三停住 ----------
  function camZ(lt) {
    if (lt < 3) return 1 + 0.09 * ease.inOut(clamp(lt / 3, 0, 1));
    if (lt < 7) return 1.09 - 0.09 * ease.inOut(clamp((lt - 3) / 4, 0, 1));
    return 1;
  }

  return {
    init() {
      U.assertGlyphs('96px "PuHui-Bold"', '参数疯狂卷之外数据方法算力', 's15_raytrace 屏上字/铭牌');
      U.assertGlyphs('96px "Exo2-800i"', '0123456789.BT+-RENDER/PARAMCOUNT DWLGOVSYBUHKMAQ.73-1.2 2.4', 's15_raytrace 数字/英文');
    },
    draw(c, lt, t) {
      const dens = ss(3.12, 6.4, lt);                                 // 球阵密度
      const pulse = Math.sin(Math.PI * seg(lt, 6.4, 6.9));            // 1T+ 揭示一次脉冲
      const d3 = ss(7.0, 8.2, lt);                                    // 拍三收拢
      const dimA = lerp(1, 0.42, d3), shrink = lerp(1, 0.66, d3);
      const gold3 = ss(8.5, 9.6, lt);                                 // 主球变亮变精
      const z = camZ(lt);
      const f30 = Math.floor(t * 30);

      c.save();
      c.translate(960, 620); c.scale(z, z); c.translate(-960, -620);
      c.drawImage(BG, 0, 0);
      if (dens > 0.02) {                                              // 落日霞光随密度加浓
        const g1 = c.createRadialGradient(SUN[0], SUN[1], 60, SUN[0], SUN[1], 1100);
        g1.addColorStop(0, 'rgba(245,160,138,' + (0.24 * dens + 0.2 * pulse).toFixed(3) + ')'); g1.addColorStop(1, 'rgba(245,160,138,0)');
        c.fillStyle = g1; c.fillRect(0, 0, W, 720);
        const g2 = c.createLinearGradient(0, 0, 0, 520);
        g2.addColorStop(0, 'rgba(122,44,158,' + (0.16 * dens).toFixed(3) + ')'); g2.addColorStop(1, 'rgba(122,44,158,0)');
        c.fillStyle = g2; c.fillRect(0, 0, W, 520);
      }
      { const sg = c.createRadialGradient(SUN[0], SUN[1], 30, SUN[0], SUN[1], 340);  // 太阳动态晕
        sg.addColorStop(0, 'rgba(255,238,204,' + (0.4 + 0.3 * dens + 0.4 * pulse).toFixed(3) + ')'); sg.addColorStop(1, 'rgba(255,210,160,0)');
        c.fillStyle = sg; c.fillRect(SUN[0] - 360, SUN[1] - 360, 720, 720); }
      const mfa = ss(0.5, 2.6, lt);                                   // 远山线框缓缓显影
      if (mfa > 0.01) { c.save(); c.globalAlpha = mfa; c.drawImage(MTF, 0, 0); c.restore(); }
      const mna = 0.95 * ss(3.3, 6.2, lt) * (1 - 0.3 * d3);           // 近山网格随密度加密
      if (mna > 0.01) { c.save(); c.globalAlpha = mna; c.drawImage(MTN, 0, 0); c.restore(); }
      const tA = ss(3.3, 4.3, lt) * (1 - ss(7.1, 8.3, lt));           // 三只紫环
      if (tA > 0.01) TORI.forEach((o, k) => torus(c, t, { x: o.x, y: o.y + 9 * Math.sin(t * 0.7 + k * 2.1), R: o.R, rr: o.rr, spin: o.spin, tilt: o.tilt }, tA));

      // —— 球阵光束（金色，双描：宽晕＋亮芯；近排粗远排细） ——
      const beamFade = (1 - ss(6.9, 8.1, lt));
      if (beamFade > 0.01 && dens > 0.01) {
        const flick = clamp(0.3 + 0.1 * Math.sin(t * 2.7) + 0.32 * pulse, 0, 0.9);
        [[1, 230, 2.6], [0, 230, 1.3]].forEach(([mode, cut, wBase]) => {
          c.save(); c.beginPath(); let any = false;
          EDGES.forEach(e => {
            if (lt <= e.birth) return;
            const nearD = (e.a.dy + e.b.dy) / 2 > cut;
            if (mode ? !nearD : nearD) return;
            const ay = e.hero ? e.a.y : e.a.y - e.a.r;
            c.moveTo(e.a.x, ay); c.lineTo(e.b.x, e.b.y - e.b.r); any = true;
          });
          if (any) {
            c.lineCap = 'round';
            c.strokeStyle = 'rgba(248,192,112,' + (flick * beamFade * 0.4).toFixed(3) + ')'; c.lineWidth = wBase * 3; c.stroke();
            c.strokeStyle = 'rgba(255,224,160,' + (flick * beamFade * 0.85).toFixed(3) + ')'; c.lineWidth = wBase; c.stroke();
          }
          c.restore();
        });
      }
      // —— 接触阴影（批量一道） ——
      { const sh = new Path2D();
        NODES.forEach(nd => { if (lt > nd.birth && nd.r > 13) { sh.moveTo(nd.x + nd.r * 0.78, nd.y + 1); sh.ellipse(nd.x, nd.y + 1, nd.r * 0.78, nd.r * 0.12, 0, 0, TAU); } });
        HERO.forEach(h => { const q = clamp((lt - 8.55) / 0.9, 0, 1); if (q < 1) { sh.moveTo(h.x + h.r * 0.9 * (1 - q * 0.5), h.y + h.r + 3); sh.ellipse(h.x, h.y + h.r + 3, h.r * 0.9 * (1 - q * 0.5), h.r * 0.14, 0, 0, TAU); } });
        OBJ.forEach(o => { if (lt > o.t0) { sh.moveTo(o.x + o.w * 0.42, o.base + 5); sh.ellipse(o.x, o.base + 5, o.w * 0.42, 15, 0, 0, TAU); } });
        c.fillStyle = 'rgba(12,22,32,.34)'; c.fill(sh); }

      // —— 球阵：3 张相位错开的活动铬球精灵，逐节点缩放复用 ——
      if (dens > 0.01) {
        const SPRK = ['s15a0', 's15a1', 's15a2'], SPRD = [];
        for (let k = 0; k < 3; k++) SPRD.push(chromeInto(P.scratch(SPRK[k]).getContext('2d'), 45, t * (1.05 + k * 0.42) + k * 1.3, -0.35));
        NODES.forEach(nd => {
          if (lt <= nd.birth) return;
          const age = lt - nd.birth;
          const pop = age < 0.32 ? ease.outBack(clamp(age / 0.32)) : 1;
          const r = nd.r * pop * shrink * (1 + 0.045 * Math.sin(t * 2.3 + nd.ph));
          if (r < 1.5) return;
          const br = clamp((0.58 + 0.3 * dens + 0.16 * Math.sin(t * nd.sp + nd.ph) + 0.55 * pulse) * dimA, 0, 1);
          if (nd.dy > 240) {                                          // 近排小球在棋盘上的倒影
            c.save(); c.globalAlpha = 0.2 * br;
            c.translate(0, 2 * nd.y); c.scale(1, -1);
            c.drawImage(P.scratch(SPRK[nd.v]), 0, 0, SPRD[nd.v], SPRD[nd.v], nd.x - r, nd.y - 2 * r, 2 * r, 2 * r);
            c.restore();
          }
          c.save(); c.globalAlpha = br;
          c.drawImage(P.scratch(SPRK[nd.v]), 0, 0, SPRD[nd.v], SPRD[nd.v], nd.x - r, nd.y - 2 * r, 2 * r, 2 * r);
          c.restore();
          if (nd.r > 24) {                                             // 大球加一点辉光
            c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.13 * br;
            c.drawImage(GLOWW, nd.x - r * 1.7, nd.y - r - r * 1.7, r * 3.4, r * 3.4); c.restore();
          }
        });
      }

      // —— 拍三：三件塑料雕塑沿扫描线升起 ——
      OBJ.forEach(o => sculpture(c, o, lt, t));

      // —— 拍三：光束收拢成三球连线（金色三角＋流动光点） ——
      const triA = ss(8.85, 9.5, lt);
      if (triA > 0.01) {
        c.save(); c.lineCap = 'round';
        const P3 = [HERO[0].dock, HERO[1].dock, HERO[2].dock];
        const flick2 = 0.5 + 0.14 * Math.sin(t * 3);
        c.beginPath();
        for (let k = 0; k < 3; k++) { c.moveTo(P3[k][0], P3[k][1]); c.lineTo(P3[(k + 1) % 3][0], P3[(k + 1) % 3][1]); }
        c.strokeStyle = 'rgba(248,192,112,' + (triA * flick2 * 0.35).toFixed(3) + ')'; c.lineWidth = 10; c.stroke();
        c.strokeStyle = 'rgba(255,230,170,' + (triA * flick2 * 0.9).toFixed(3) + ')'; c.lineWidth = 3; c.stroke();
        c.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 3; k++) {                                 // 沿边流动的能量光点
          const a2 = P3[k], b2 = P3[(k + 1) % 3], q2 = (t * 0.35 + k / 3) % 1;
          const x = lerp(a2[0], b2[0], q2), y = lerp(a2[1], b2[1], q2);
          c.drawImage(GLOWW, x - 26, y - 26, 52, 52);
        }
        c.restore();
      }

      // —— 三颗参数铬球（逐像素环境映射＋镜面倒影＋铭牌；拍三飘落雕塑顶） ——
      HERO.forEach((h, k) => {
        const q = ease.inOut(clamp((lt - 8.55) / 0.9, 0, 1));
        const bob = (4 * (1 - q) + 1.6) * Math.sin(t * 1.6 + h.ph);
        const x = lerp(h.x, h.dock[0], q);
        const y = lerp(h.y, h.dock[1], q) - 80 * Math.sin(Math.PI * q) + bob;
        const r = lerp(h.r, 46, q);
        const sc = P.scratch('s15hr' + k);
        const D = chromeInto(sc.getContext('2d'), r, t * 1.15 + h.ph * 1.7, h.az * (1 - q * 0.4));
        const haloA = clamp(0.14 + 0.34 * gold3 + 0.3 * pulse, 0, 0.9);
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = haloA;
        c.drawImage(GLOWW, x - r * 2.4, y - r * 2.4, r * 4.8, r * 4.8); c.restore();
        if (q < 0.97) {                                               // 棋盘上的镜面倒影
          const gy = y + r;
          c.save(); c.beginPath(); c.rect(0, Math.max(VPY, gy), W, H); c.clip();
          c.globalAlpha = 0.3 * (1 - 0.8 * q);
          c.translate(0, 2 * gy); c.scale(1, -1);
          c.drawImage(sc, 0, 0, D, D, x - r, y - r, 2 * r, 2 * r);
          c.restore();
        }
        c.drawImage(sc, 0, 0, D, D, x - r, y - r, 2 * r, 2 * r);
        c.save();                                                     // 硬边镜面高光（Phong 味）
        c.fillStyle = 'rgba(255,255,255,' + (0.85 * (1 + 0.2 * gold3)).toFixed(3) + ')';
        c.beginPath(); c.ellipse(x - r * 0.38, y - r * 0.44, r * 0.2, r * 0.1, -0.5, 0, TAU); c.fill();
        c.fillStyle = 'rgba(255,255,255,.9)';
        c.beginPath(); c.arc(x - r * 0.5, y - r * 0.56, r * 0.045, 0, TAU); c.fill();
        const ga = t * 0.9 + k * 2.1;                                  // 沿球缘游走的高光点
        c.globalCompositeOperation = 'lighter';
        c.fillStyle = 'rgba(255,246,220,.7)';
        c.beginPath(); c.arc(x + Math.cos(ga) * r * 0.94, y + Math.sin(ga) * r * 0.94, r * 0.06, 0, TAU); c.fill();
        c.restore();
        if (lt < 3.1 && k === 0) {                                     // 拍一：端详最大一颗的选框（虚线收紧）
          const ra = r * lerp(1.55, 1.22, ease.inOut(clamp(lt / 2.8, 0, 1)));
          c.save(); c.strokeStyle = 'rgba(159,232,224,' + (0.55 * (1 - ss(2.5, 3.0, lt))).toFixed(3) + ')';
          c.lineWidth = 2; c.setLineDash([12, 9]); c.lineDashOffset = -t * 40;
          c.beginPath(); c.arc(x, y, ra, 0, TAU); c.stroke(); c.setLineDash([]); c.restore();
        }
        const pa = ss(0.55, 1.0, lt);                                  // 数字铭牌（各自明灭）
        if (pa > 0.01) {
          const drop = hash(f30, k + 5) < 0.035 ? 0.45 : 1;
          const fl = pa * (0.78 + 0.22 * Math.sin(t * 3.2 + h.ph)) * drop;
          const plx = x + r * 0.95 + 10, ply = y - r * 1.18;
          hudPlate(c, plx, ply, h.pw, h.phh, fl);
          c.save(); c.globalAlpha = clamp(fl, 0, 1);
          c.strokeStyle = 'rgba(159,232,224,.5)'; c.lineWidth = 1.4;
          c.beginPath(); c.moveTo(plx, ply + h.phh); c.lineTo(x + r * 0.55, y - r * 0.72); c.stroke();
          c.font = h.fs + 'px "Exo2-800i"'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
          c.shadowColor = GREEN; c.shadowBlur = 10; c.fillStyle = GREEN;
          c.fillText(h.num, plx + h.pw / 2, ply + h.phh * 0.68);
          c.shadowBlur = 0;
          c.fillStyle = hash(Math.floor(t * 9), k) < 0.5 ? 'rgba(108,255,124,.95)' : 'rgba(108,255,124,.3)';
          c.fillRect(plx + h.pw - 15, ply + 9, 7, 7);
          c.restore();
        }
      });

      c.restore();                                                     // —— 世界层（运镜）结束 ——

      // —— 屏幕层：镜头光晕（锚在变换后的太阳）＋渲染台计数器＋屏上字 ——
      const sx = 960 + (SUN[0] - 960) * z, sy = 620 + (SUN[1] - 620) * z;
      flare(c, sx, sy, t, clamp(0.8 + 0.4 * dens + 0.9 * pulse - 0.18 * d3, 0, 1.6));
      counter(c, lt, t);
      captions(c, lt, t);
    },
  };
})();
