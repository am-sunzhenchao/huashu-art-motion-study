// 「大模型参数」× 敦煌壁画（s20_dunhuang）——参数＝天花（花雨与飘带上的节点）。纯代码，1920×1080，单段 10 秒。
// 管线：①土红地仗（cached：矿物色斑驳＋褪色团花＋顶部卷草三角垂幔＋剥落斑/龟裂/烟熏全烤进墙底——做旧只上背景，主角画在其上）
//      ②两道巡游长飘带（飞天在场，不画人物）→ ③三朵主天花（参数本体）＋竖排经文旁注 0.73/-1.2/2.4＋稀疏天花雨
//      ④拍二：飘带从三朵主天花逐档蜿蜒生长、连缀成经变网（天花为节点、飘带为连线、网眼里嵌供灯火苗明灭），
//        题记计数牌逐行点亮滚动 1.5B→175B→540B→1T+，土红墙随密度逐档加深、团花/天花雨逐档加密；1T+ 全网一次胀缩重音
//      ⑤拍三：增殖停住，经卷（数据）/法轮（方法）/酥油灯（算力）依次升起入尖楣龛挂榜题，全网天花描金点睛、
//        飘带行波收稳同拍，一道飞天飘带扫过，背景旧画剥落的颜料片脱落下落收尾
// 会动的：飘带行波（拍三收稳成同拍微动）、天花翻面飘落、节点呼吸、火苗明灭、酥油灯火苗 17t/29t 跳动、法轮缓转、颜料片脱落。
// 确定性：随机全 U.rng 种子（节点/边/花雨/剥落片在模块加载时一次性生成）；一切运动是 lt,t 的纯函数。硬红线：无人物无脸，飞天只画飘带。
SCENES['s20_dunhuang'] = (() => {
  const W = 1920, H = 1080, TAU = Math.PI * 2;
  const { clamp, lerp, ss, ease, rng } = U, P = PAINT;
  const C = { red: '#a5452f', redDk: '#7a2e1e', green: '#3f8f6e', green2: '#6ab08e', blue: '#2f5f8f', blue2: '#5a86b0',
    white: '#ecdfc4', ink: '#2a1a14', line: '#5a2414', gold: '#d8b05a', plaster: '#d8c6a2', wood: '#6b3a20' };
  const LW = 2.6;
  const O = [960, 520];                                       // 运镜中心＝经变网心
  const F = (c, p, fill, lw, line) => { if (fill) { c.fillStyle = fill; c.fill(p); } if (lw !== 0) { c.strokeStyle = line || C.line; c.lineWidth = lw || LW; c.stroke(p); } };
  const rgba = (h, a) => P.rgb(P.hex(h), a);
  const bump = (lt, t0, up, dn) => ss(t0, t0 + up, lt) * (1 - ss(t0 + up, t0 + (up || 0.5) + dn, lt));

  // ---------- 通用母题：四瓣天花、团花、飘带节点 ----------
  function flower(c, x, y, r, col, t, ph, gild, bloom, lw) {
    if (bloom <= 0 || r <= 0) return;
    const br = bloom * (1 + 0.055 * Math.sin(t * 2.2 + ph));
    c.save(); c.translate(x, y); c.scale(br, br);
    for (let j = 0; j < 4; j++) {
      c.rotate(Math.PI / 2);
      c.fillStyle = col; c.beginPath(); c.ellipse(0, -r * 0.52, r * 0.3, r * 0.56, 0, 0, TAU); c.fill();
      c.strokeStyle = C.line; c.lineWidth = (lw || 2) / br; c.stroke();
    }
    c.fillStyle = C.gold; c.beginPath(); c.arc(0, 0, Math.max(2.2, r * 0.2), 0, TAU); c.fill();
    if (gild > 0.02) {                                        // 描金点睛：金环＋白芯
      c.strokeStyle = 'rgba(216,176,90,' + (gild * 0.95).toFixed(3) + ')'; c.lineWidth = 2.6 / br;
      c.beginPath(); c.arc(0, 0, r * 0.8, 0, TAU); c.stroke();
      c.fillStyle = 'rgba(255,242,204,' + (gild * 0.4).toFixed(3) + ')'; c.beginPath(); c.arc(0, 0, r * 0.36, 0, TAU); c.fill();
    }
    c.restore();
  }
  function rosette(g, x, y, s, alpha) {                       // 褪色团花（背景装饰）
    g.save(); g.translate(x, y); g.scale(s, s); g.globalAlpha = alpha;
    for (let j = 0; j < 8; j++) { g.rotate(Math.PI / 4); g.fillStyle = j % 2 ? C.green2 : C.white; g.beginPath(); g.ellipse(0, -16, 7, 14, 0, 0, TAU); g.fill(); }
    g.fillStyle = C.blue2; g.beginPath(); g.arc(0, 0, 8, 0, TAU); g.fill();
    g.restore();
  }
  function lampNode(c, x, y, s, t, i, bloom, gild) {           // 供灯：金碗＋明灭火苗（网眼里的灯）
    if (bloom <= 0) return;
    const fl = 1 + Math.sin(t * 13 + i * 2.1) * 0.16 + Math.sin(t * 21 + i) * 0.1;
    c.save(); c.translate(x, y); c.scale(bloom, bloom);
    c.globalAlpha = clamp(bloom * (0.72 + 0.28 * Math.sin(t * 2.7 + i * 1.9)), 0, 1);
    F(c, (function () { const p = new Path2D(); p.moveTo(-s, 2); p.quadraticCurveTo(0, s * 1.1, s, 2); p.closePath(); return p; })(), C.gold, 1.8);
    const sw = Math.sin(t * 9 + i) * s * 0.14;
    F(c, new Path2D('M' + -s * 0.28 + ' 2 Q' + (-s * 0.3 + sw) + ' ' + (-s * 0.8 * fl) + ' ' + (sw * 0.8) + ' ' + (-s * 1.5 * fl) +
      ' Q' + (s * 0.3 + sw) + ' ' + (-s * 0.8 * fl) + ' ' + s * 0.28 + ' 2 Z'), '#f2a43a', 1.3);
    c.fillStyle = '#fbe7a0'; c.beginPath(); c.ellipse(sw * 0.4, -s * 0.34, s * 0.11, s * 0.3 * fl, 0, 0, TAU); c.fill();
    if (gild > 0.02) { c.globalCompositeOperation = 'lighter'; c.fillStyle = rgba('#ffdf9e', gild * 0.3); c.beginPath(); c.arc(0, -s * 0.4, s * 2.1, 0, TAU); c.fill(); }
    c.restore();
  }

  // ---------- 墙底（cached）：矿物色地仗＋团花＋垂幔＋剥落/龟裂/烟熏（做旧只上背景） ----------
  const GROUND = P.cached('s20_wall', W, H, (g) => {
    g.drawImage(P.texture('s20_red', C.red, { scale: 0.003, amt: 30, grain: 16, dark: '#7a3020', seed: 3 }), 0, 0);
    const r0 = rng(8);
    for (let i = 0; i < 16; i++) rosette(g, 120 + r0() * 1680, 250 + r0() * 560, 0.8 + r0() * 1.2, 0.4);
    // 顶部：卷草边＋三角垂幔（石青石绿土红白交替＋金珠）——原版 20_dunhuang 垂幔笔法
    g.fillStyle = '#7a2e1e'; g.fillRect(0, 0, W, 34);
    g.strokeStyle = C.green2; g.lineWidth = 4; g.beginPath();
    for (let x = 0; x <= W; x += 4) { const y = 17 + Math.sin(x * 0.05) * 9; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    for (let x = 0; x < W; x += 80) { g.strokeStyle = C.white; g.lineWidth = 2.5; g.beginPath(); g.arc(x + 40, 17 + Math.sin((x + 40) * 0.05) * 9, 8, 0, Math.PI * 1.5); g.stroke(); }
    const cols = [C.blue, C.green, C.white, C.red];
    for (let x = 0, k = 0; x < W; x += 64, k++) {
      g.fillStyle = cols[k % 4]; g.beginPath(); g.moveTo(x, 34); g.lineTo(x + 64, 34); g.lineTo(x + 32, 84); g.closePath(); g.fill();
      g.strokeStyle = C.line; g.lineWidth = 2; g.stroke();
      g.fillStyle = C.gold; g.beginPath(); g.arc(x + 32, 88, 5, 0, TAU); g.fill();
    }
    g.fillStyle = '#7a2e1e'; g.fillRect(0, 34, W, 5);
    // 剥落斑（阈值法：大块剥落而非芝麻斑）＋边缘暗线，烤进墙底
    const im = g.getImageData(0, 0, W, H), d = im.data, pl = P.hex(C.plaster), r1 = rng(91);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4, n = P.fbm(x * 0.0032 + 11, y * 0.0032 + 4, 5) + 0.12 * P.noise(x * 0.03, y * 0.03);
      if (n > 0.3) { const v = (r1() - 0.5) * 22 + (n - 0.3) * 60; d[i] = pl[0] + v; d[i + 1] = pl[1] + v; d[i + 2] = pl[2] + v * 0.8; }
      else if (n > 0.28) { d[i] = d[i] * 0.45 + 70 * 0.55; d[i + 1] = d[i + 1] * 0.45 + 45 * 0.55; d[i + 2] = d[i + 2] * 0.45 + 30 * 0.55; }
    }
    g.putImageData(im, 0, 0);
    // 龟裂
    g.strokeStyle = 'rgba(50,25,15,.35)'; g.lineWidth = 1;
    for (let k = 0; k < 480; k++) {
      let x = r1() * W, y = r1() * H, a = r1() * TAU; g.beginPath(); g.moveTo(x, y);
      for (let s = 0, m = 5 + r1() * 8; s < m; s++) { a += (r1() - 0.5) * 1.4; x += Math.cos(a) * (5 + r1() * 12); y += Math.sin(a) * (5 + r1() * 12); g.lineTo(x, y); }
      g.stroke();
    }
    // 顶部烟熏
    const sg = g.createLinearGradient(0, 0, 0, 380); sg.addColorStop(0, 'rgba(40,20,10,.35)'); sg.addColorStop(1, 'rgba(40,20,10,0)');
    g.fillStyle = sg; g.fillRect(0, 0, W, 380);
  });
  const DIRT = P.texture('s20_dirt', '#e8dcc8', { scale: 0.002, amt: 40, grain: 20, seed: 9 });   // 整体土尘罩层
  const DYN_ROS = (function () { const r = rng(404), o = []; while (o.length < 14) o.push({ x: 130 + r() * 1660, y: 220 + r() * 600, s: 0.9 + r() * 1.1, thr: 0.5 + r() * 2.6 }); return o; })();

  // ---------- 静态数据（模块加载时种子一次性生成） ----------
  const HUBS = [                                              // 三朵主天花＝参数本体（网心）
    { x: 640, y: 385, r: 92, col: C.white, num: '0.73', nx: 795, ny: 300 },
    { x: 1225, y: 520, r: 82, col: C.red, num: '-1.2', nx: 1370, ny: 425 },
    { x: 855, y: 700, r: 86, col: C.green2, num: '2.4', nx: 698, ny: 620 },
  ];
  const PCOL = [C.white, C.red, C.green2, '#e8a0a0'];
  const ECOL = [C.green, C.red, C.blue2, C.green2];
  const WHITE_DASH = 'rgba(236,223,196,0.75)';
  const STG = [3.6, 4.5, 5.4, 6.3];                           // 1.5B / 175B / 540B / 1T+ 到达时刻
  const stageSum = (lt) => STG.reduce((s, q) => s + ss(q, q + 0.35, lt), 0);
  // 经变网节点：四档（随计数逐档增殖），按到网心距离排序出生（从主天花逐环铺开）
  const GRP = [{ t0: 3.15, n: 9, r: [16, 25], win: 0.7 }, { t0: 3.7, n: 15, r: [14, 22], win: 0.85 }, { t0: 4.55, n: 20, r: [12, 20], win: 0.9 }, { t0: 5.45, n: 26, r: [11, 18], win: 0.9 }];
  const NODES = [];
  (function () {
    const r = rng(2020);
    GRP.forEach((G) => {
      const pts = [];
      let tries = 0;
      while (pts.length < G.n && tries < 4000) {
        tries++;
        const x = 90 + r() * 1740, y = 130 + r() * 840, rr = lerp(G.r[0], G.r[1], r());
        if (x > 1580 && y < 800) continue;                                   // 计数牌区让开
        if (pts.some((p) => Math.hypot(p.x - x, p.y - y) < 92)) continue;    // 不叠太近
        if (HUBS.some((h) => Math.hypot(h.x - x, h.y - y) < h.r + 62)) continue;
        pts.push({ x: x, y: y, r: rr, gi: G.t0, ph: r() * TAU, kind: 0, col: PCOL[(r() * 4) | 0], birth: 0 });
      }
      pts.sort((a, b) => Math.hypot(a.x - O[0], a.y - O[1]) - Math.hypot(b.x - O[0], b.y - O[1]));
      pts.forEach((p, i) => { p.birth = G.t0 + G.win * i / pts.length; });
      NODES.push.apply(NODES, pts);
    });
    [12, 18, 27, 35, 44, 55, 63].forEach((i) => { if (NODES[i]) NODES[i].kind = 1; });   // 七盏供灯
  })();
  // 经变网边：每节点连向更早的节点/主天花（1–2 条），飘带从早端向晚端生长
  const EDGES = [];
  (function () {
    const r = rng(3030), pool = [];
    HUBS.forEach((h) => pool.push(h));
    NODES.forEach((nd) => {
      const cands = pool.slice().sort((a, b) => Math.hypot(a.x - nd.x, a.y - nd.y) - Math.hypot(b.x - nd.x, b.y - nd.y));
      const k = r() < 0.7 ? 1 : 2;
      for (let j = 0; j < k && j < cands.length; j++) {
        const a = cands[j], L = Math.hypot(a.x - nd.x, a.y - nd.y);
        if (L > 560) continue;
        const n = 2 + ((r() * 2) | 0), ctrl = [];
        for (let q = 1; q <= n; q++) {
          const u = q / (n + 1), mx = lerp(a.x, nd.x, u), my = lerp(a.y, nd.y, u);
          const dx = nd.x - a.x, dy = nd.y - a.y, L2 = Math.hypot(dx, dy) || 1;
          const bow = (r() - 0.5) * Math.min(190, L * 0.4);
          ctrl.push([mx - dy / L2 * bow, my + dx / L2 * bow]);
        }
        EDGES.push({
          pts: KIT.densify([[a.x, a.y]].concat(ctrl).concat([[nd.x, nd.y]]), 5),
          born: nd.birth + 0.22 + r() * 0.25, ph: r() * TAU, ci: EDGES.length % 4,
          sp: 3.6 + r() * 2.4, amp: 10 + r() * 12,
        });
      }
      pool.push(nd);
    });
  })();
  // 巡游长飘带（飞天在场）：静态基线，巡游＋行波
  const AMB = [
    { y0: 205, amp: 30, sp: 4.4, ph: 1.3, col: C.green2, dir: 1, base: [] },
    { y0: 335, amp: 40, sp: 3.2, ph: 4.6, col: C.blue2, dir: -1, base: [] },
  ];
  AMB.forEach((a) => { for (let i = 0; i <= 56; i++) { const q = i / 56; a.base.push([-700 + q * 3400, a.y0 + Math.sin(q * 5.2 + a.ph) * 34]); } });
  // 剥落颜料片（结尾从墙面脱开落下）
  const FLAKES = (function () {
    const r = rng(55), o = []; let tries = 0;
    while (o.length < 8 && tries < 4000) {
      tries++;
      const x = 120 + r() * 1680, y = 150 + r() * 680, n = P.fbm(x * 0.0032 + 11, y * 0.0032 + 4, 5);
      if (n > 0.265 && n < 0.3) o.push([x, y, 8.15 + r() * 1.1, 9 + r() * 9, r() * TAU, (r() * 3) | 0]);
    }
    return o;
  })();

  // ---------- 计数（真实序列：段间 ease.inOut 连续插值，1T+ 定格） ----------
  const SEG = [[3.2, 3.6, 0, 1.5], [3.6, 4.5, 1.5, 175], [4.5, 5.4, 175, 540], [5.4, 6.3, 540, 1000]];
  const ROWSTART = [3.2, 3.6, 4.5, 5.4], FIXED = ['1.5B', '175B', '540B', '1T+'];
  function countVal(lt) {
    for (let k = 0; k < 4; k++) { const s = SEG[k]; if (lt >= s[0] && lt < s[1]) return s[2] + (s[3] - s[2]) * ease.inOut((lt - s[0]) / (s[1] - s[0])); }
    return lt >= 6.3 ? 1000 : 0;
  }
  const fmt = (v) => v >= 999.5 ? '1T+' : (v < 10 ? v.toFixed(1) : String(Math.round(v))) + 'B';
  function counter(c, lt, t) {
    if (lt < 3.2) return;
    const fade = 1 - ss(7.0, 7.5, lt);
    if (fade <= 0) return;
    const inn = ease.outBack(clamp((lt - 3.2) / 0.4, 0, 1));
    const pop = 1 + 0.04 * bump(lt, 6.3, 0.5, 0.9);
    c.save(); c.globalAlpha = fade;
    c.translate(1712, 470 + (1 - Math.min(1, inn)) * 210); c.scale(inn * pop, inn * pop);
    const w = 176, h = 590;
    c.fillStyle = '#e6d6b2'; c.fillRect(-w / 2, -h / 2, w, h);                       // 题记牌：浅地仗＋铁线双框
    c.strokeStyle = C.line; c.lineWidth = 4; c.strokeRect(-w / 2, -h / 2, w, h);
    c.lineWidth = 1.6; c.strokeRect(-w / 2 + 7, -h / 2 + 7, w - 14, h - 14);
    c.fillStyle = C.ink; c.font = '34px "LXGWWenKai-500"'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('参数量', 0, -h / 2 + 38);
    c.strokeStyle = 'rgba(90,36,20,.5)'; c.lineWidth = 2; c.beginPath();             // 卷草分隔
    for (let x = -60; x <= 60; x += 6) { const y = -h / 2 + 72 + Math.sin(x * 0.16) * 5; x <= -60 ? c.moveTo(x, y) : c.lineTo(x, y); }
    c.stroke();
    for (let k = 0; k < 4; k++) {                                                    // 逐行点亮：当前行滚动，过档定格
      const st = ROWSTART[k]; if (lt < st) continue;
      const nxt = ROWSTART[k + 1] || 6.3, rolling = lt < nxt;
      const rin = ease.outBack(clamp((lt - st) / 0.35, 0, 1));
      const ry = -165 + k * 130;
      c.save(); c.translate(0, ry + (1 - Math.min(1, rin)) * 16); c.scale(rin * (1 + 0.08 * bump(lt, nxt, 0.45, 0.6)), rin * (1 + 0.08 * bump(lt, nxt, 0.45, 0.6)));
      c.font = '56px "LXGWWenKai-500"'; c.fillStyle = rolling ? '#7a2e1e' : C.ink;
      c.fillText(rolling ? fmt(countVal(lt)) : FIXED[k], 0, 0);
      c.restore();
    }
    c.restore();
  }

  // ---------- 三件供器（数据/方法/算力）与尖楣龛 ----------
  const TRIO = [
    { x: 545, y: 715, lab: '数据', t0: 7.15, lg: 7.7 },
    { x: 960, y: 630, lab: '方法', t0: 7.55, lg: 8.1 },
    { x: 1375, y: 715, lab: '算力', t0: 7.95, lg: 8.5 },
  ];
  function niche(c, x, y, w, hgt, prog) {                    // 尖楣龛：两侧竖边＋尖拱，逐段描出
    if (prog <= 0) return;
    const w2 = w / 2, h2 = hgt / 2, sh = h2 - 78, pts = [];
    for (let i = 0; i <= 5; i++) pts.push([x - w2, y + h2 - i * (h2 - sh) / 5]);
    for (let i = 0; i <= 7; i++) { const q = i / 7, u = 1 - q;                    // 左肩→拱尖
      pts.push([u * u * (x - w2) + 2 * u * q * (x - w2 * 0.72) + q * q * x, u * u * (y - sh) + 2 * u * q * (y - h2 - 8) + q * q * (y - h2)]); }
    for (let i = 0; i <= 7; i++) { const q = i / 7, u = 1 - q;                    // 拱尖→右肩
      pts.push([u * u * x + 2 * u * q * (x + w2 * 0.72) + q * q * (x + w2), u * u * (y - h2) + 2 * u * q * (y - h2 - 8) + q * q * (y - sh)]); }
    for (let i = 0; i <= 5; i++) pts.push([x + w2, y - sh + i * (h2 - sh) / 5]);
    const m = Math.max(2, Math.ceil(prog * pts.length));
    c.strokeStyle = C.green; c.lineWidth = 6.5; c.lineJoin = 'round';
    c.beginPath(); for (let i = 0; i < m; i++) i ? c.lineTo(pts[i][0], pts[i][1]) : c.moveTo(pts[i][0], pts[i][1]); c.stroke();
    c.strokeStyle = 'rgba(236,223,196,.8)'; c.lineWidth = 2;
    c.beginPath(); for (let i = 0; i < m; i++) i ? c.lineTo(pts[i][0], pts[i][1]) : c.moveTo(pts[i][0], pts[i][1]); c.stroke();
    if (prog > 0.9) {                                                              // 拱尖蕉叶饰
      c.save(); c.translate(x, y - h2 - 12);
      F(c, new Path2D('M0 10 Q-11 -4 0 -20 Q11 -4 0 10 Z'), C.green2, 1.6);
      c.restore();
    }
  }
  function scrollDraw(c, t, gild) {                          // 经卷（数据）：两卷叠放＋木轴金轴头＋经文墨线＋飘尾绦带
    [[-36, 78], [22, 88]].forEach(function (s, k) {
      const dy = s[0], w2 = s[1];
      c.fillStyle = k ? C.white : '#f4e9d2'; c.fillRect(-w2, dy, w2 * 2, 30);
      c.strokeStyle = C.line; c.lineWidth = 2.4; c.strokeRect(-w2, dy, w2 * 2, 30);
      c.beginPath(); c.ellipse(0, dy, w2, 11, 0, Math.PI, TAU); c.fillStyle = '#f6ecd6'; c.fill(); c.lineWidth = 2; c.stroke();
      c.strokeStyle = 'rgba(42,26,20,.75)'; c.lineWidth = 2;
      for (let i = -4; i <= 4; i++) { c.beginPath(); c.moveTo(i * w2 / 4.7, dy - 9); c.lineTo(i * w2 / 4.7, dy - 3); c.stroke(); }
      [-w2 - 16, w2 + 4].forEach(function (ex) {
        c.fillStyle = C.wood; c.fillRect(ex, dy - 6, 12, 42);
        c.strokeStyle = C.line; c.lineWidth = 1.8; c.strokeRect(ex, dy - 6, 12, 42);
        c.fillStyle = C.gold; c.beginPath(); c.arc(ex + 6, dy - 8, 4.5, 0, TAU); c.arc(ex + 6, dy + 36, 4.5, 0, TAU); c.fill();
      });
    });
    const pts = []; for (let i = 0; i <= 10; i++) { const q = i / 10; pts.push([-60 + q * 22, 64 + q * 54 + Math.sin(q * 5 - t * 3.4) * 8 * q]); }
    F(c, KIT.ribbon(pts, function (q) { return 9 * (1 - q * 0.45); }), C.green, 1.6);
    if (gild > 0.02) { c.strokeStyle = 'rgba(216,176,90,' + (gild * 0.85).toFixed(3) + ')'; c.lineWidth = 3; c.strokeRect(-118, -50, 236, 134); }
  }
  function wheelDraw(c, t, gild) {                           // 法轮（方法）：金轮八辐莲珠，缓转
    const rot = t * 0.55, R = 92;
    c.save(); c.rotate(rot);
    c.fillStyle = C.gold; c.beginPath(); c.arc(0, 0, R, 0, TAU); c.arc(0, 0, R - 26, 0, TAU, true); c.fill();
    c.strokeStyle = C.line; c.lineWidth = 2.6; c.beginPath(); c.arc(0, 0, R, 0, TAU); c.stroke();
    c.beginPath(); c.arc(0, 0, R - 26, 0, TAU); c.stroke();
    for (let i = 0; i < 8; i++) { const a = i * TAU / 8; c.strokeStyle = C.line; c.lineWidth = 7; c.beginPath(); c.moveTo(Math.cos(a) * (R - 30), Math.sin(a) * (R - 30)); c.lineTo(Math.cos(a) * 15, Math.sin(a) * 15); c.stroke(); }
    for (let i = 0; i < 16; i++) { const a = i * TAU / 16; c.fillStyle = C.white; c.beginPath(); c.arc(Math.cos(a) * (R - 13), Math.sin(a) * (R - 13), 4.5, 0, TAU); c.fill(); }
    c.fillStyle = C.gold; c.beginPath(); c.arc(0, 0, 17, 0, TAU); c.fill(); c.strokeStyle = C.line; c.lineWidth = 2.4; c.stroke();
    c.fillStyle = C.white; c.beginPath(); c.arc(0, 0, 6.5, 0, TAU); c.fill();
    if (gild > 0.02) { c.strokeStyle = 'rgba(216,176,90,' + (gild * 0.9).toFixed(3) + ')'; c.lineWidth = 3.4; c.beginPath(); c.arc(0, 0, R + 7, 0, TAU); c.stroke(); }
    c.restore();
  }
  function lampDraw(c, t, gild) {                            // 酥油灯（算力）：金碗＋束腰柄＋火苗 17t/29t 跳动＋光晕
    const fl = 1 + Math.sin(t * 17) * 0.12 + Math.sin(t * 29) * 0.08, sw = Math.sin(t * 11) * 4;
    c.save(); c.globalCompositeOperation = 'lighter';
    const gg = c.createRadialGradient(0, -62, 4, 0, -62, 105 + gild * 50);
    gg.addColorStop(0, 'rgba(255,200,90,' + ((0.42 + 0.26 * gild) * (0.94 + 0.06 * Math.sin(t * 17))).toFixed(3) + ')');
    gg.addColorStop(1, 'rgba(255,200,90,0)');
    c.fillStyle = gg; c.fillRect(-150, -200, 300, 260); c.restore();
    c.fillStyle = '#7a2e1e'; c.fillRect(-8, -18, 16, 48); c.strokeStyle = C.line; c.lineWidth = 2.2; c.strokeRect(-8, -18, 16, 48);
    c.beginPath(); c.ellipse(0, 36, 44, 10, 0, 0, TAU); c.fillStyle = '#7a2e1e'; c.fill(); c.stroke();
    c.beginPath(); c.ellipse(0, 27, 31, 8, 0, 0, TAU); c.fillStyle = C.gold; c.fill(); c.stroke();
    F(c, new Path2D('M-62 -22 Q0 16 62 -22 Q0 6 -62 -22 Z'), C.gold, 2.6);
    c.beginPath(); c.ellipse(0, -22, 62, 12, 0, 0, TAU); c.fillStyle = '#f4e9d2'; c.fill(); c.strokeStyle = C.line; c.lineWidth = 2.2; c.stroke();
    F(c, new Path2D('M-9 -24 Q-8 -46 ' + (-2 + sw) + ' ' + (-64 - 20 * fl) + ' Q4 -44 9 -24 Z'), '#f2a43a', 1.8);
    c.fillStyle = '#fbe7a0'; c.beginPath(); c.ellipse(sw * 0.4, -40, 4, 10 * fl, 0, 0, TAU); c.fill();
  }
  function trio(c, lt, t, gild) {
    TRIO.forEach(function (o, i) {
      const pr = ease.outBack(clamp((lt - o.t0) / 0.5, 0, 1));
      if (pr <= 0) return;
      niche(c, o.x, o.y, 264, 260, ss(o.t0 + 0.45, o.t0 + 1.15, lt));
      c.save(); c.translate(o.x, o.y + (1 - Math.min(1, pr)) * 240); c.scale(0.72 + 0.28 * Math.min(1, pr), 0.72 + 0.28 * Math.min(1, pr));
      if (i === 0) scrollDraw(c, t, gild);
      else if (i === 1) wheelDraw(c, t, gild);
      else lampDraw(c, t, gild);
      c.restore();
    });
    TRIO.forEach(function (o, i) {                           // 榜题：两字竖排小牌
      const pp = ease.outBack(clamp((lt - o.lg) / 0.3, 0, 1));
      if (pp <= 0) return;
      c.save(); c.translate(o.x, 842); c.scale(pp, pp);
      c.fillStyle = '#e6d6b2'; c.fillRect(-48, -37, 96, 74);
      c.strokeStyle = C.line; c.lineWidth = 3; c.strokeRect(-48, -37, 96, 74);
      c.fillStyle = C.ink; c.font = '38px "LXGWWenKai-500"'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(o.lab[0], 0, -17); c.fillText(o.lab[1], 0, 19);
      c.restore();
    });
  }

  // ---------- 屏上字（榜题式竖排：浅地仗牌＋铁线双框＋落款小印） ----------
  const TXT = [[0.05, 2.95, '参数', 108], [3.05, 6.95, '疯狂卷参数', 74], [7.05, 10.2, '参数之外', 88]];
  function screenText(c, lt) {
    TXT.forEach(function (T) {
      const pIn = clamp((lt - T[0]) / 0.35, 0, 1), pOut = 1 - clamp((lt - (T[1] - 0.25)) / 0.25, 0, 1);
      if (pIn <= 0 || pOut <= 0) return;
      const size = T[3], chars = Array.from(T[2]), ch = size + 14, pad = 34;
      const w = size + 84, hgt = pad * 2 + chars.length * ch + 26, rise = (1 - ease.out(pIn)) * 26;
      c.save(); c.globalAlpha = Math.min(pIn, pOut); c.translate(116, 148 + rise);
      c.fillStyle = '#e6d6b2'; c.fillRect(-w / 2, 0, w, hgt);
      c.strokeStyle = C.line; c.lineWidth = 4; c.strokeRect(-w / 2, 0, w, hgt);
      c.lineWidth = 1.6; c.strokeRect(-w / 2 + 7, 7, w - 14, hgt - 14);
      c.fillStyle = C.ink; c.font = size + 'px "LXGWWenKai-500"'; c.textAlign = 'center'; c.textBaseline = 'middle';
      chars.forEach(function (chr, i) { c.fillText(chr, 2, pad + size / 2 + i * ch); });
      c.fillStyle = C.red; c.globalAlpha *= 0.9; c.fillRect(-10, hgt - 44, 20, 18);   // 落款小印
      c.restore();
    });
  }

  // ---------- 每帧绘制 ----------
  function drawEdge(c, e, lt, t, calm, gild) {
    const grow = ss(e.born, e.born + 0.6, lt);
    if (grow <= 0) return;
    const pts = e.pts, n = pts.length - 1;
    let sub;
    if (grow >= 1) sub = pts;
    else {
      const prog = grow * n, m2 = prog | 0, fr = prog - m2;
      sub = pts.slice(0, m2 + 1);
      if (m2 < n) sub.push([lerp(pts[m2][0], pts[m2 + 1][0], fr), lerp(pts[m2][1], pts[m2 + 1][1], fr)]);
    }
    const m = sub.length - 1 || 1, sp = lerp(e.sp, 2.2, calm), amp = e.amp * lerp(1, 0.45, calm);
    const off = new Array(m + 1);
    for (let i = 0; i <= m; i++) { const q = i / m; off[i] = [sub[i][0], sub[i][1] + Math.sin(q * 6.5 - t * sp + e.ph) * amp * (0.25 + q * 0.75)]; }
    F(c, KIT.ribbon(off, function (q) { return lerp(13, 5.5, q); }), ECOL[e.ci], 2);
    c.setLineDash([3, 9]); c.strokeStyle = WHITE_DASH; c.lineWidth = 1.7;           // 白描花虚线（飘带笔法）
    c.beginPath(); for (let i = 0; i <= m; i++) i ? c.lineTo(off[i][0], off[i][1]) : c.moveTo(off[i][0], off[i][1]); c.stroke(); c.setLineDash([]);
    if (gild > 0.02) {
      c.strokeStyle = 'rgba(216,176,90,' + (gild * 0.8).toFixed(3) + ')'; c.lineWidth = 2.4;
      c.beginPath(); for (let i = 0; i <= m; i++) i ? c.lineTo(off[i][0], off[i][1]) : c.moveTo(off[i][0], off[i][1]); c.stroke();
    }
    for (let i = 5; i <= m; i += 11) { c.fillStyle = C.red; c.beginPath(); c.arc(off[i][0], off[i][1], 2.6, 0, TAU); c.fill(); }
  }
  function petal(c, p, t, col, sc, alpha) {                  // 天花雨：四瓣花翻面下落
    if (alpha <= 0) return;
    c.save(); c.globalAlpha = alpha; c.translate(p.x, p.y); c.rotate(p.a);
    c.scale(sc, sc * (Math.abs(Math.cos(t * 2.6 + p.i)) * 0.8 + 0.2));
    for (let j = 0; j < 4; j++) { c.rotate(Math.PI / 2); c.fillStyle = col; c.beginPath(); c.ellipse(0, -6, 3.2, 6.4, 0, 0, TAU); c.fill(); }
    c.fillStyle = C.gold; c.beginPath(); c.arc(0, 0, 1.8, 0, TAU); c.fill();
    c.restore();
  }
  function ambient(c, lt, t, calm) {                          // 巡游长飘带
    AMB.forEach(function (a, k) {
      const xoff = lt * 46 * a.dir, amp = a.amp * lerp(1, 0.55, calm);
      const pts = new Array(a.base.length);
      for (let i = 0; i < a.base.length; i++) { const q = i / 56, p = a.base[i]; pts[i] = [p[0] + xoff, p[1] + Math.sin(q * 6.4 - t * a.sp + a.ph) * amp * (0.3 + q * 0.7)]; }
      F(c, KIT.ribbon(pts, function (q) { return lerp(19, 7, q); }), a.col, 2.2);
      c.setLineDash([3, 9]); c.strokeStyle = WHITE_DASH; c.lineWidth = 1.8;
      c.beginPath(); for (let i = 0; i < pts.length; i++) i ? c.lineTo(pts[i][0], pts[i][1]) : c.moveTo(pts[i][0], pts[i][1]); c.stroke(); c.setLineDash([]);
      for (let i = 6; i < pts.length; i += 13) { c.fillStyle = C.red; c.beginPath(); c.arc(pts[i][0], pts[i][1], 3, 0, TAU); c.fill(); }
    });
  }
  const SWEEP = { pts: [[-140, 640], [300, 470], [740, 610], [1140, 470], [1540, 640], [2060, 500]], full: null };
  SWEEP.full = KIT.densify(SWEEP.pts, 6);
  function sweep(c, lt, t, calm) {                            // 拍三：一道飞天飘带扫过三龛
    const p = ss(8.35, 9.2, lt), fade = 1 - ss(9.35, 9.75, lt);
    if (p <= 0 || fade <= 0) return;
    const full = SWEEP.full, n = full.length - 1, m = Math.max(2, (p * n | 0) + 1);
    const pts = new Array(m);
    for (let i = 0; i < m; i++) { const q = i / n; pts[i] = [full[i][0], full[i][1] + Math.sin(q * 7 - t * 4.6 + 2) * 26 * (0.3 + q * 0.7) * lerp(1, 0.5, calm)]; }
    c.save(); c.globalAlpha = fade;
    F(c, KIT.ribbon(pts, function (q) { return lerp(26, 8, q); }), C.blue2, 2.4);
    c.setLineDash([4, 10]); c.strokeStyle = WHITE_DASH; c.lineWidth = 2;
    c.beginPath(); for (let i = 0; i < m; i++) i ? c.lineTo(pts[i][0], pts[i][1]) : c.moveTo(pts[i][0], pts[i][1]); c.stroke(); c.setLineDash([]);
    for (let i = 8; i < m; i += 15) { c.fillStyle = C.red; c.beginPath(); c.arc(pts[i][0], pts[i][1], 3.4, 0, TAU); c.fill(); }
    c.restore();
  }

  return {
    init() {
      U.assertGlyphs('110px "LXGWWenKai-500"', '参数疯狂卷之外数据方法算力量', 's20_dunhuang 屏上字/榜题/计数牌');
      U.assertGlyphs('64px "LXGWWenKai-500"', '0123456789.-BT+', 's20_dunhuang 数字');
    },
    draw(c, lt, t) {
      const stage = stageSum(lt), calm = ss(9.15, 9.75, lt), gild = ss(7.0, 8.6, lt), bloom = bump(lt, 6.3, 0.5, 0.9);
      // 运镜：近景缓推 → 展开缓拉远 → 收稳停（全片锁网心，单一连续思路）
      const z = lt < 3 ? lerp(1.0, 1.09, ease.inOut(ss(0, 3, lt))) : lt < 6.5 ? lerp(1.09, 1.0, ease.inOut(ss(3, 6.5, lt))) : 1.0;
      c.save(); c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-O[0], -O[1]);
      // ① 土红地仗墙（做旧烤在底里）
      c.drawImage(GROUND, 0, 0);
      // ② 密度升级：墙色逐档加深＋逐档显出的褪色团花
      if (stage > 0.01) { c.fillStyle = 'rgba(90,32,18,' + (0.055 * Math.min(4, stage)).toFixed(3) + ')'; c.fillRect(-420, -420, W + 840, H + 840); }
      DYN_ROS.forEach(function (q) { const a = clamp((stage - q.thr) * 2.2, 0, 1) * 0.38; if (a > 0.01) rosette(c, q.x, q.y, q.s, a); });
      // ③ 巡游长飘带（飞天在场）
      ambient(c, lt, t, calm);
      // ④ 经变网：飘带连线逐条生长
      for (let i = 0; i < EDGES.length; i++) drawEdge(c, EDGES[i], lt, t, calm, gild);
      // ⑤ 节点天花沿途绽放呼吸＋供灯火苗明灭（1T+ 一次全网胀缩重音）
      for (let i = 0; i < NODES.length; i++) {
        const nd = NODES[i], b = ss(nd.birth, nd.birth + 0.45, lt);
        if (b <= 0) continue;
        const sc = 1 + 0.09 * bloom * (1 - calm);
        if (nd.kind) lampNode(c, nd.x, nd.y, 16 + nd.r * 0.5, t, nd.ph, b * sc, gild);
        else flower(c, nd.x, nd.y, nd.r * sc, nd.col, t, nd.ph, gild, b);
      }
      // ⑥ 三朵主天花（参数本体，缓推中被放大端详）＋竖排经文旁注数字（3.0–3.4 溶进网里）
      const heroGrow = 1 + 0.1 * ss(0.3, 2.7, lt);
      const numFade = 1 - ss(3.0, 3.4, lt);
      HUBS.forEach(function (h, i) {
        flower(c, h.x, h.y, h.r * heroGrow * (1 + 0.07 * bloom), h.col, t, i * 2.2, gild, 1, 3.2);
        if (numFade <= 0) return;
        c.save(); c.globalAlpha = numFade;
        const pl = 1 + 0.05 * Math.sin(t * 2.6 + i * 1.1);
        c.strokeStyle = rgba(C.line, 0.6); c.lineWidth = 1.6; c.setLineDash([2, 5]);        // 旁注引线
        c.beginPath(); c.moveTo(h.x + h.r * 0.72, h.y - h.r * 0.35); c.lineTo(h.nx - 4, h.ny - 16); c.stroke(); c.setLineDash([]);
        c.translate(h.nx, h.ny); c.scale(pl, pl);
        c.font = '30px "LXGWWenKai-500"'; c.textAlign = 'center'; c.textBaseline = 'middle';
        Array.from(h.num).forEach(function (g2, k) {
          c.fillStyle = 'rgba(42,26,20,.7)'; c.fillText(g2, 1.5, k * 38 + 1.5);
          c.fillStyle = C.white; c.fillText(g2, 0, k * 38);
        });
        c.restore();
      });
      // ⑦ 天花雨（稀疏 → 随密度逐档加密）
      P.particles(12, 77, t, { x0: 0, x1: W, y0: 30, y1: H + 60, drift: 66, life: 3.6 })
        .forEach(function (p, i) { petal(c, p, t, PCOL[p.i % 4], p.s * 1.9, 0.92); });
      P.particles(31, 88, t, { x0: 0, x1: W, y0: 30, y1: H + 60, drift: 74, life: 3.1 })
        .forEach(function (p) { petal(c, p, t, PCOL[(p.i + 1) % 4], p.s * 1.6, clamp((stage - p.i * 0.117) * 3, 0, 1)); });
      // ⑧ 题记计数牌 → ⑨ 三件供器入龛 → ⑩ 飘带扫过 → ⑪ 剥落颜料片下落
      counter(c, lt, t);
      trio(c, lt, t, gild);
      sweep(c, lt, t, calm);
      FLAKES.forEach(function (f, k) {
        const q = lt - f[2]; if (q < 0) return;
        const fy = f[1] + q * q * 560, fx = f[0] + Math.sin(q * 5 + f[4]) * 14;
        if (fy > H + 40) return;
        c.save(); c.globalAlpha = clamp(1.6 - q, 0, 1); c.translate(fx, fy); c.rotate(q * 5 + f[4]); c.scale(1, Math.cos(q * 8 + f[4]));
        c.fillStyle = [C.red, C.green, C.blue2][f[5]];
        const s = f[3];
        c.beginPath(); c.moveTo(-s, -s * 0.4); c.lineTo(s * 0.6, -s * 0.8); c.lineTo(s, s * 0.5); c.lineTo(-s * 0.3, s * 0.7); c.closePath(); c.fill();
        c.strokeStyle = C.line; c.lineWidth = 1.4; c.stroke();
        c.restore();
      });
      c.restore();
      // ⑫ 屏上字（UI 层）→ ⑬ 整体做旧罩层（褪色＋土尘；剥落已只烤在墙底）
      screenText(c, lt);
      c.save(); c.globalCompositeOperation = 'saturation'; c.fillStyle = 'rgba(128,128,128,.3)'; c.fillRect(0, 0, W, H); c.restore();
      c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.5; c.drawImage(DIRT, 0, 0); c.restore();
    },
  };
})();
