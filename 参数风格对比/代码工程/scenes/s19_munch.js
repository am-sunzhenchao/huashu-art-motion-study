// s19_munch · 蒙克《呐喊》式表现主义 ×「大模型参数」风格样片（10s 单镜头三拍）。
// 题材构图（不搬速通片房间，为「参数」重设）：参数＝血色天空里一颗颗流线漩涡点——
//   拍一 0–3s   三颗主漩涡点特写（挂数字 0.73／-1.2／2.4，随整幅行扭歪斜），各自绕转、核心呼吸；
//   拍二 3–7s   漩涡点从网心按序增殖、曲线连线织成天网，四道织线横贯；
//               峡湾上计数沿真实序列滚动 1.5B→175B→540B→1T+（1T+ 定格砸大描金＝全片唯一重音），
//               水波一圈圈荡开，天色与整幅扭动幅度随增殖档加深；
//   拍三 7–10s  增殖停住；桥栏前三件剪影物依次升起归位：一摞书（数据）／齿轮盘（方法）／
//               提灯（算力，点亮）；漩涡点轮流描金变亮变精、相位收敛，颜色抽冷收稳。
// 管线：区域同色系平涂底 → P.flowLines 长弯流线（天/峡湾/岬角/桥面：不描边、半透明叠色、
//       一根笔 200–300px——蒙克薄涂长笔，照搬梵高描边会读成毛毛虫短笔）→ 天网/水波计数/三件物
//       → 桥栏 → 整幅 KIT.warpRows＋warpCols 正弦扭动（整个世界在流动；幅度随增殖加深、收尾变柔）。
// 硬红线：无角色无脸；做旧不用；随机全 U.rng 种子（qa 冷热渲逐像素一致）；
//         中文 LXGWWenKai-500、数字 IMFellEnglish-400i，落笔前 U.assertGlyphs；字全部避开 y>880。
SCENES['s19_munch'] = (() => {
  const W = 1920, H = 1080, TAU = Math.PI * 2;
  const { clamp, lerp, ss, ease } = U, P = PAINT;

  // ---------- 卡内色板（references/风格配方/19_munch.md） ----------
  const PAL = {
    sky: ['#e2541c', '#f08a24', '#f4c03a', '#c8301e', '#e8743a', '#f6a63a', '#b82a1e'],
    fjord: ['#1d3a6a', '#2c5a8a', '#3a4a7a', '#14243e', '#4a6aa0'],
    hill: ['#2a4a2a', '#1e3a3a', '#43603a', '#5a6a2a'],
    deck: ['#8a5a2a', '#a8703a', '#6a3a1e', '#c88a42', '#4a2a1a'],
  };
  const hx = {}; for (const k in PAL) hx[k] = PAL[k].map(P.hex);
  const PAPER = '#f6e0a0', GOLD = '#f4c03a', INKD = '#2a1014';   // 暖白／藤黄／暗边（卡内系族）

  // ---------- 几何（岸线/岬角/桥面边：静态，8px 查表提速 flowLines 的逐步判区） ----------
  const shoreAt = x => 560 + 30 * Math.sin(x * 0.006 + 0.8) + 8 * Math.sin(x * 0.021 + 2);
  const deckAt = x => 760 - 0.055 * x + 10 * Math.sin(x * 0.008 + 1.4);
  const SHORE = [], DECK = [];
  for (let x = 0; x <= W; x += 8) { SHORE.push(shoreAt(x)); DECK.push(deckAt(x)); }
  const idx = x => clamp((x / 8) | 0, 0, SHORE.length - 1);
  const shore = x => SHORE[idx(x)], deckY = x => DECK[idx(x)];
  const hillEdge = y => 150 + 0.55 * (y - 555);
  function region(x, y) {
    if (y < shore(x)) return 'sky';
    if (y < deckY(x)) return x < hillEdge(y) ? 'hill' : 'fjord';
    return 'deck';
  }
  // 方向场（各区域缓慢扭动；桥面绕右侧消失点辐射）。时间速度对照 gallery 原版整体放慢约 3 倍：
  // 原版这套血色天空满幅流线在 qa 的 480 宽测尺下本身就有 23% 相邻帧差（跑过 qa/参照19munch），
  // 本片要把全幅时间运动压进 0.3–8% 验收线，流线的「活」保留给 warp、漩涡点、计数与三件物。
  const VP = [1700, 620];
  function angle(x, y, t, reg) {
    switch (reg) {
      case 'sky': return 0.55 * Math.sin(x * 0.011 + y * 0.018 - t * 0.4) + 0.15 * Math.sin(y * 0.05 + t * 0.5);
      case 'fjord': { const a = Math.atan2(y - 640, x - 700); return a + Math.PI / 2 + 0.3 * Math.sin(t * 0.4 + a * 2); }
      case 'hill': return -0.9 + 0.4 * Math.sin(y * 0.03 + t * 0.4);
      default: return Math.atan2(y - VP[1], x - VP[0]) + 0.18 * Math.sin(x * 0.01 + t * 0.55);
    }
  }
  const RS = { sky: [30, 7, 10, 0.78], fjord: [22, 6, 9, 0.72], hill: [14, 6, 8, 0.75], deck: [30, 8, 12, 0.55] };
  const SEEDS = P.flowSeeds(26, 19);
  const flowColor = (reg, sx, sy, r1, t) => {
    if (reg === 'sky') {                       // 血色天空：按「波浪化的 y」取色带（带型是静态的横波；
      const yy = sy + 22 * Math.sin(sx * 0.014) + 8 * Math.sin(sx * 0.05);   // 色带随整幅 warp 横移＝天在流，不再自爬）
      const band = Math.floor((yy + 40) / 44 + r1 * 0.55);
      return hx.sky[((band % 7) + 7) % 7];
    }
    const pal = hx[reg];
    return pal[(r1 * pal.length) | 0];
  };

  // ---------- 密度档（拍二 3.0–6.3 升满：天色加深、扭幅加深；拍三收敛） ----------
  const density = lt => ss(3.0, 6.3, lt);

  // ---------- 区域平涂底（笔缝里露同色，不是黑） ----------
  function baseFill(g, d) {
    const sk = g.createLinearGradient(0, 0, 0, 660);
    sk.addColorStop(0, P.rgb(P.mix(P.hex('#b82a1e'), P.hex('#7a180f'), d * 0.6)));
    sk.addColorStop(0.45, P.rgb(P.mix(P.hex('#e2541c'), P.hex('#a83414'), d * 0.6)));
    sk.addColorStop(0.8, P.rgb(P.mix(P.hex('#f08a24'), P.hex('#c8381a'), d * 0.6)));
    sk.addColorStop(1, '#c8301e');
    g.fillStyle = sk; g.fillRect(0, 0, W, 680);
    // 峡湾暗蓝（随档加深）
    const fj = g.createLinearGradient(0, 500, 0, 840);
    fj.addColorStop(0, P.rgb(P.mix(P.hex('#2c5a8a'), P.hex('#12213e'), d * 0.7)));
    fj.addColorStop(1, P.rgb(P.mix(P.hex('#14243e'), P.hex('#0c1528'), d * 0.7)));
    g.fillStyle = fj;
    g.beginPath(); g.moveTo(0, 520);
    for (let x = 0; x <= W; x += 32) g.lineTo(x, Math.max(500, shoreAt(x) - 6));
    g.lineTo(W, 880); g.lineTo(0, 880); g.closePath(); g.fill();
    // 左侧黑色岬角（区域与 region() 同边界）
    g.fillStyle = '#1e3a3a';
    g.beginPath(); g.moveTo(0, shoreAt(0));
    for (let x = 0; x <= 170; x += 10) g.lineTo(x, shoreAt(x));
    for (let y = shoreAt(160); y <= 760; y += 6) g.lineTo(hillEdge(y), y);
    g.lineTo(0, 760); g.closePath(); g.fill();
    // 桥面（暖褐透视线，往右远去）
    const dk = g.createLinearGradient(0, 620, 0, H);
    dk.addColorStop(0, '#7a4a22'); dk.addColorStop(1, '#4a2614');
    g.fillStyle = dk;
    g.beginPath(); g.moveTo(0, deckAt(0));
    for (let x = 0; x <= W; x += 32) g.lineTo(x, deckAt(x));
    g.lineTo(W, H); g.lineTo(0, H); g.closePath(); g.fill();
  }

  // ---------- 参数漩涡点（参数本体）＋天网 ----------
  const MAIN = [
    { x: 620, y: 300, r: 66, num: '0.73', col: '#f6a63a', ph: 0 },
    { x: 1230, y: 220, r: 54, num: '-1.2', col: '#e8743a', ph: 2.1 },
    { x: 930, y: 440, r: 48, num: '2.4', col: '#f4c03a', ph: 4.2 },
  ];
  const NETC = [940, 300];
  const KNOTS = (() => {
    const r = U.rng(20261019), pts = MAIN.map(m => Object.assign({ birth: -1, main: true }, m));
    for (let i = 0; i < 44; i++) {              // 外圈按到网心距离排序出生（3.0–6.4s 从中心蔓延）
      const a = r() * TAU, dsp = 110 + Math.pow(r(), 0.72) * 560;
      const x = NETC[0] + Math.cos(a) * dsp, y = NETC[1] + Math.sin(a) * dsp * 0.62;
      if (y < 46 || y > shore(x) - 26) continue;
      pts.push({ x, y, r: 13 + r() * 19, col: ['#f6a63a', '#f4c03a', '#e8743a', '#f08a24'][i % 4], birth: 0, ph: r() * 6, main: false });
    }
    const grew = pts.filter(p => !p.main);
    grew.forEach(p => { p.d = Math.hypot(p.x - NETC[0], p.y - NETC[1]); });
    grew.sort((a, b) => a.d - b.d);
    grew.forEach((p, i) => { p.birth = 3.0 + 3.4 * (i / grew.length); });
    pts.forEach((p, i) => { p.i = i; });
    // 边：每点连向更早出生的最近 1–2 点 → 网从中心蔓延的形
    const order = pts.slice().sort((a, b) => a.birth - b.birth), edges = [];
    for (let i = 1; i < order.length; i++) {
      const p = order[i], cand = [];
      for (let j = 0; j < i; j++) { const q = order[j], dd = Math.hypot(p.x - q.x, p.y - q.y); if (dd < 460) cand.push([dd, q]); }
      cand.sort((a, b) => a[0] - b[0]);
      const deg = i % 3 === 0 ? 2 : 1;
      for (let k = 0; k < Math.min(deg, cand.length); k++) edges.push([cand[k][1], p, r() * TAU]);
    }
    return { pts, edges };
  })();
  const bornOf = (p, lt) => p.birth < 0 ? 1 : ss(p.birth, p.birth + 0.32, lt);
  const bobOf = (i, lt, t) => 4 * Math.sin(t * 0.7 + i * 0.7 * (1 - ss(9.2, 9.8, lt)));   // 拍三相位收敛
  const breathe = (p, t) => 1 + 0.08 * Math.sin(t * 1.2 + p.ph);   // 漩涡点核心呼吸（knot 与 trioTop 共用，保持描金环跟臂对齐）

  function knot(g, p, yb, lt, t) {
    const born = bornOf(p, lt);
    if (born <= 0) return;
    const pop = p.birth < 0 ? 1 : ease.outBack(clamp(born, 0, 1));
    const R = p.r * pop * breathe(p, t);
    g.save(); g.translate(p.x, yb); g.rotate(t * (p.main ? 0.15 : 0.09) + p.ph);
    g.lineCap = 'round';
    for (let k = 0; k < 6; k++) {              // 六臂螺旋长笔（蒙克的流线小漩涡，不是梵高星斑）
      const a0 = k / 6 * TAU, spin = 2.1 + 0.3 * Math.sin(p.ph + k);
      g.strokeStyle = P.rgb(P.hex(p.col), 0.8);
      g.lineWidth = Math.max(4, R * 0.15);
      g.beginPath();
      g.moveTo(Math.cos(a0) * R * 0.5, Math.sin(a0) * R * 0.5);
      for (let s = 1; s <= 3; s++) {
        const q = s / 3, a = a0 + spin * q, rr = R * (0.5 + 0.62 * q);
        g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      g.stroke();
    }
    g.fillStyle = PAPER;
    g.beginPath(); g.arc(0, 0, Math.max(3, R * 0.26), 0, TAU); g.fill();
    g.strokeStyle = INKD; g.lineWidth = 2.2; g.stroke();
    g.restore();
  }
  function knotNum(g, p, yb, t) {               // 斜体手写数字（在整幅行扭里一起歪）
    g.save();
    g.translate(p.x + p.r + 58, yb - p.r * 0.7);
    g.rotate(-0.1 + 0.05 * Math.sin(t * 1.1 + p.ph));
    g.font = '58px "IMFellEnglish-400i"';
    g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.lineJoin = 'round';
    g.strokeStyle = INKD; g.lineWidth = 7;
    g.strokeText(p.num, 0, 0);
    g.fillStyle = PAPER; g.fillText(p.num, 0, 0);
    g.restore();
  }
  function net(g, lt, t) {
    g.save(); g.lineCap = 'round';
    for (const [A, B, ph] of KNOTS.edges) {     // 弯曲流线连线（不是直线）
      const eb = Math.max(3.05, A.birth, B.birth);
      const al = Math.min(bornOf(A, lt), bornOf(B, lt), ss(eb + 0.06, eb + 0.2, lt));
      if (al <= 0) continue;
      const ax = A.x, ay = A.y + bobOf(A.i, lt, t), bx = B.x, by = B.y + bobOf(B.i, lt, t);
      const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1;
      const sag = 26 + 20 * Math.sin(ph * 3.1);
      g.globalAlpha = al;
      g.strokeStyle = 'rgba(246,166,58,0.5)'; g.lineWidth = 3.5;
      g.beginPath(); g.moveTo(ax, ay);
      g.quadraticCurveTo((ax + bx) / 2 - dy / L * sag, (ay + by) / 2 + dx / L * sag, bx, by);
      g.stroke();
    }
    g.globalAlpha = 1;
    for (const p of KNOTS.pts) {
      const yb = p.y + bobOf(p.i, lt, t);
      knot(g, p, yb, lt, t);
      if (p.main) knotNum(g, p, yb, t);
    }
    g.restore();
  }

  // ---------- 四道横贯织线（拍二随档显现，波纹慢速横移） ----------
  const THREADS = [
    { y0: 120, birth: 3.35, ph: 0.4 },
    { y0: 225, birth: 4.0, ph: 2.2 },
    { y0: 330, birth: 4.6, ph: 4.1 },
    { y0: 430, birth: 5.2, ph: 1.1 },
  ];
  function threads(g, lt, t) {
    g.save(); g.lineCap = 'round';
    for (const th of THREADS) {
      const rev = ss(th.birth, th.birth + 1.15, lt);
      if (rev <= 0) continue;
      const x1 = -60 + rev * 2040;
      g.strokeStyle = 'rgba(246,166,58,0.4)'; g.lineWidth = 7;
      g.beginPath();
      let first = true;
      for (let x = -60; x <= x1; x += 46) {
        const y = th.y0 + 30 * Math.sin(x * 0.0042 + th.ph) + 12 * Math.sin(x * 0.011 - t * 0.5 + th.ph);
        first ? g.moveTo(x, y) : g.lineTo(x, y); first = false;
      }
      g.stroke();
      g.strokeStyle = 'rgba(244,192,58,0.72)'; g.lineWidth = 2;
      g.stroke();
    }
    g.restore();
  }

  // ---------- 峡湾：水波计数器（真实序列 1.5B→175B→540B→1T+，一圈圈荡开） ----------
  function countVal(lt) {
    const K = [[3.25, 3.6, 0.3, 1.5], [3.6, 4.5, 1.5, 175], [4.5, 5.4, 175, 540], [5.4, 6.3, 540, 1000]];
    for (const [a, b, v0, v1] of K) if (lt >= a && lt < b) return v0 + (v1 - v0) * ease.inOut((lt - a) / (b - a));
    return lt >= 6.3 ? 1000 : 0;
  }
  function counter(g, lt, t) {
    if (lt < 3.2) return;
    g.save();
    g.beginPath();                              // 水波只画在峡湾带内
    g.moveTo(0, shore(0) + 6);
    for (let x = 0; x <= W; x += 40) g.lineTo(x, shore(x) + 6);
    for (let x = W; x >= 0; x -= 40) g.lineTo(x, deckY(x) - 4);
    g.closePath(); g.clip();
    const rings = [[3.6, 0], [4.5, 1.7], [5.4, 3.4], [6.3, 5.1]];
    for (const [b, ph] of rings) {
      const q = (lt - b) / 2.7;
      if (q <= 0 || q >= 1) continue;
      const R = 26 + q * 420, al = 0.5 * (1 - q);
      g.strokeStyle = 'rgba(244,192,58,' + al.toFixed(3) + ')';
      g.lineWidth = 4.5 - 2 * q;
      g.beginPath();
      for (let k = 0; k <= 52; k++) {
        const a = k / 52 * TAU, rr = R + 7 * Math.sin(a * 5 + t * 1.4 + ph);
        const x = 700 + Math.cos(a) * rr, y = 638 + Math.sin(a) * rr * 0.34;
        k ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.closePath(); g.stroke();
    }
    g.restore();
    // 「参数量」＋数值（峡湾正中，随整幅行扭）。1T+ 定格＝全片唯一重音：砸大描金
    const v = countVal(lt);
    const big = v >= 999.5;
    const txt = big ? '1T+' : ((v < 10 ? v.toFixed(1) : String(Math.round(v))) + 'B');
    const pop = big ? ease.outBack(clamp((lt - 6.3) / 0.42, 0, 1)) : 1;
    g.save();
    g.translate(700, 674); g.scale(pop, pop); g.translate(-700, -674);
    g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.lineJoin = 'round';
    g.strokeStyle = INKD;
    g.font = '44px "LXGWWenKai-500"'; g.lineWidth = 6;
    g.strokeText('参数量', 700, 596);
    g.fillStyle = PAPER; g.fillText('参数量', 700, 596);
    g.font = (big ? 92 : 84) + 'px "IMFellEnglish-400i"'; g.lineWidth = 8;
    g.strokeText(txt, 700, 674);
    g.fillStyle = big ? GOLD : PAPER; g.fillText(txt, 700, 674);
    g.restore();
  }

  // ---------- 拍三：桥栏前三件剪影物（书=数据／齿轮盘=方法／提灯=算力） ----------
  const OBJX = [480, 960, 1440], RISE = [7.15, 7.55, 7.95], TAG = [7.75, 8.15, 8.55];
  const TAGY = [628, 700, 612], TAGTXT = ['数据', '方法', '算力'];
  const trioPos = (k, lt) => {
    const rp = ease.outBack(clamp((lt - RISE[k]) / 0.55, 0, 1));
    return { rp, x: OBJX[k], y: deckY(OBJX[k]) + 10 + (1 - rp) * 260, sc: 0.72 + 0.28 * clamp(rp, 0, 1) };
  };
  function books(g, gild) {
    const B = [[-88, 0, 176, 40], [-76, -40, 152, 36], [-60, -76, 120, 34]];
    for (let k = 0; k < 3; k++) {
      const q = B[k];
      g.save(); g.translate(q[0] + q[2] / 2, q[1] - q[3] / 2); g.rotate((k - 1) * 0.045);
      g.fillStyle = '#14243e'; g.fillRect(-q[2] / 2, -q[3] / 2, q[2], q[3]);
      g.strokeStyle = '#0a1220'; g.lineWidth = 3; g.strokeRect(-q[2] / 2, -q[3] / 2, q[2], q[3]);
      g.strokeStyle = 'rgba(246,224,160,' + (0.35 + 0.6 * gild).toFixed(3) + ')';
      g.lineWidth = 3; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-q[2] / 2 + 14, -q[3] / 2 + 9); g.lineTo(q[2] / 2 - 24, -q[3] / 2 + 9); g.stroke();
      g.restore();
    }
  }
  function gearDisc(g, lt, gild) {
    const rot = -lt * 0.2, cy = -116, R = 92, n = 11;
    const p = new Path2D();
    for (let i = 0; i < n * 2; i++) {
      const a = rot + i / (n * 2) * TAU, rr = i % 2 ? R : R + 22;
      const px = Math.cos(a) * rr, py = cy + Math.sin(a) * rr;
      i ? p.lineTo(px, py) : p.moveTo(px, py);
    }
    p.closePath();
    g.fillStyle = '#5a2418'; g.fill(p);
    g.strokeStyle = INKD; g.lineWidth = 4; g.stroke(p);
    const hub = new Path2D(); hub.arc(0, cy, 26, 0, TAU);
    g.fillStyle = INKD; g.fill(hub);
    g.strokeStyle = INKD; g.lineWidth = 9; g.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const a = rot * 1.15 + i * Math.PI / 2;
      g.beginPath(); g.moveTo(Math.cos(a) * 34, cy + Math.sin(a) * 34); g.lineTo(Math.cos(a) * 76, cy + Math.sin(a) * 76); g.stroke();
    }
    if (gild > 0) {
      g.strokeStyle = 'rgba(244,192,58,' + (0.75 * gild).toFixed(3) + ')';
      g.lineWidth = 3; g.beginPath(); g.arc(0, cy, R + 26, 0, TAU); g.stroke();
    }
  }
  function lanternBody(g, t) {
    g.strokeStyle = '#2a1418'; g.lineWidth = 10; g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(14, -90, -6, -168); g.stroke();
    const bx = -6, by = -226;
    g.fillStyle = '#2a1418';
    g.fillRect(bx - 34, by - 34, 68, 68);
    g.beginPath(); g.moveTo(bx - 40, by - 34); g.lineTo(bx + 40, by - 34); g.lineTo(bx + 30, by - 52); g.lineTo(bx - 30, by - 52); g.closePath(); g.fill();
    g.beginPath(); g.arc(bx, by - 62, 8, 0, TAU); g.fill();
  }
  function lanternGlow(g, t, lit) {
    if (lit <= 0) return;
    const fl = 0.85 + 0.15 * Math.sin(t * 7.3) + 0.08 * Math.sin(t * 11.7);
    const bx = -6, by = -226;
    const gg = g.createRadialGradient(bx, by, 4, bx, by, 46 * fl);
    gg.addColorStop(0, 'rgba(251,240,190,' + (0.95 * lit).toFixed(3) + ')');
    gg.addColorStop(0.4, 'rgba(246,166,58,' + (0.7 * lit).toFixed(3) + ')');
    gg.addColorStop(1, 'rgba(246,166,58,0)');
    g.fillStyle = gg; g.beginPath(); g.arc(bx, by, 46 * fl, 0, TAU); g.fill();
    g.fillStyle = 'rgba(251,240,190,' + (0.95 * lit).toFixed(3) + ')';
    g.beginPath(); g.arc(bx, by, 15 * fl, 0, TAU); g.fill();
  }
  function trio(g, lt, t) {
    for (let k = 0; k < 3; k++) {
      const q = trioPos(k, lt);
      if (q.rp <= 0) continue;
      g.save(); g.translate(q.x, q.y); g.scale(q.sc, q.sc);
      if (k === 0) books(g, 0);
      else if (k === 1) gearDisc(g, lt, 0);
      else lanternBody(g, t);
      g.restore();
    }
  }
  // 冷却后重画的暖层：标签、描金、提灯点亮（颜色抽冷，暖光透出来）
  function trioTop(g, lt, t) {
    const gild = ss(7.05, 8.6, lt), lit = ss(8.05, 8.65, lt);
    for (let k = 0; k < 3; k++) {
      const q = trioPos(k, lt);
      if (q.rp < 1) continue;
      if (k === 1) { g.save(); g.translate(q.x, q.y); g.scale(q.sc, q.sc); gearDisc(g, lt, gild); g.restore(); }
      if (k === 2) { g.save(); g.translate(q.x, q.y); g.scale(q.sc, q.sc); lanternGlow(g, t, lit); g.restore(); }
      const tp = ease.outBack(clamp((lt - TAG[k]) / 0.3, 0, 1));
      if (tp > 0) {
        g.save(); g.translate(q.x, TAGY[k]); g.scale(tp, tp); g.rotate(0.02 * Math.sin(t * 1.9 + k));
        g.font = '46px "LXGWWenKai-500"'; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.lineJoin = 'round';
        g.strokeStyle = INKD; g.lineWidth = 6; g.strokeText(TAGTXT[k], 0, 0);
        g.fillStyle = PAPER; g.fillText(TAGTXT[k], 0, 0);
        g.restore();
      }
    }
    if (gild > 0) {                             // 漩涡点「变亮变精」：亮核＋描金环，轮流点亮
      for (const p of KNOTS.pts) {
        const born = bornOf(p, lt);
        if (born <= 0) continue;
        const hi = Math.max(0, Math.sin(lt * 1.4 - p.i * 0.83));
        const yb = p.y + bobOf(p.i, lt, t);
        const R = p.r * born * breathe(p, t);
        g.fillStyle = 'rgba(251,240,190,' + (gild * (0.5 + 0.45 * hi)).toFixed(3) + ')';
        g.beginPath(); g.arc(p.x, yb, Math.max(3, R * 0.3), 0, TAU); g.fill();
        g.strokeStyle = 'rgba(244,192,58,' + (gild * 0.65).toFixed(3) + ')';
        g.lineWidth = 2.6;
        g.beginPath(); g.arc(p.x, yb, R * 0.52, 0, TAU); g.stroke();
      }
    }
  }

  // ---------- 桥栏（最前景：两条横栏＋栏柱，随世界一起扭） ----------
  function railing(g, t) {
    g.save(); g.strokeStyle = '#1a1020'; g.lineCap = 'round';
    for (let k = 0; k < 2; k++) {
      g.lineWidth = 10 - k * 3;
      g.beginPath();
      for (let x = 0; x <= W; x += 60) {
        const y = deckY(x) - 104 + k * 42 + 5 * Math.sin(x * 0.013 + t * 1.2 + k);
        x ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.stroke();
    }
    g.lineWidth = 7;
    for (let i = 0; i <= 7; i++) {
      const x = 60 + i * 280;
      g.beginPath(); g.moveTo(x, deckY(x) - 6); g.lineTo(x + 4, deckY(x) - 108); g.stroke();
    }
    g.restore();
  }

  // ---------- 相机：缓推（近景端详）→缓拉远（看全网全桥）→停（收全貌）；全程 z≥1.03 不露边。
  // 变焦速率按 qa 480 宽测尺校准：满幅高对比流线纹理下变焦每秒 >2% 就会在纹理边缘整片过阈；
  // 1T+ 的重音交给内容（数字砸大描金＋最后一圈大水波），相机不快推——相机快推在这套纹理上
  // 要么整段超运动线、要么被记成跳变（环境帧差压不住镜头事件的收尾阈值），不可兼得。 ----------
  function cam(lt) {
    if (lt < 3) { const p = ss(0, 3, lt); return { z: lerp(1.05, 1.10, p), cx: lerp(960, 940, p), cy: lerp(540, 505, p) }; }
    if (lt < 6.5) { const p = ss(3, 6.5, lt); return { z: lerp(1.10, 1.03, p), cx: lerp(940, 960, p), cy: lerp(505, 540, p) }; }
    return { z: 1.03, cx: 960, cy: 540 };
  }

  // ---------- 屏上字（三拍 ≤8 字；画进离屏再按行正弦扭——蒙克的字也是歪的） ----------
  const BEAT_TXT = [[0.15, 2.9, '参数', 112], [3.05, 6.9, '疯狂卷参数', 86], [7.05, 10.2, '参数之外', 96]];
  function screenText(c, lt, t) {
    for (const bt of BEAT_TXT) {
      const pIn = clamp((lt - bt[0]) / 0.3, 0, 1), pOut = 1 - clamp((lt - (bt[1] - 0.22)) / 0.22, 0, 1);
      if (pIn <= 0 || pOut <= 0) continue;
      const al = Math.min(pIn, pOut);
      const L = P.scratch('mu2_txt'), g = L.getContext('2d'); g.reset();
      g.globalAlpha = al;
      g.font = bt[3] + 'px "LXGWWenKai-500"';
      g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.lineJoin = 'round';
      g.strokeStyle = INKD; g.lineWidth = 14;
      g.strokeText(bt[2], 140, 300);
      g.fillStyle = GOLD; g.fillText(bt[2], 140, 300);
      const y0 = 300 - bt[3] - 26, y1 = 340;
      for (let y = y0; y < y1; y += 4) {
        const dx = 5 * Math.sin(y * 0.09 + t * 2);
        c.drawImage(L, 0, y, W, 4, dx, y, W, 4);
      }
    }
  }

  return {
    init() {
      U.assertGlyphs('112px "LXGWWenKai-500"', '参数疯狂卷之外数据方法算力量', 's19_munch 屏上字/标签');
      U.assertGlyphs('84px "IMFellEnglish-400i"', '0123456789.-BT+', 's19_munch 数字');
    },
    draw(c, lt, t) {
      const d = density(lt);
      // ---- 世界层（全部画进离屏，最后整幅扭动） ----
      const S = P.scratch('mu2_w'), g = S.getContext('2d'); g.reset();
      baseFill(g, d);
      P.flowLines(g, SEEDS, { t, region, angle, color: flowColor, params: RS });
      threads(g, lt, t);
      net(g, lt, t);
      counter(g, lt, t);
      trio(g, lt, t);
      // 拍三：颜色抽冷（multiply 整幅冷蓝罩，只罩世界层）
      const cool = ss(7.2, 9.4, lt);
      if (cool > 0) {
        g.save(); g.globalCompositeOperation = 'multiply';
        g.fillStyle = 'rgba(52,72,108,' + (0.34 * cool).toFixed(3) + ')';
        g.fillRect(0, 0, W, H);
        g.restore();
      }
      trioTop(g, lt, t);
      railing(g, t);
      // ---- 整个世界在流动：行扭 →（相机）→ 列扭；幅度随增殖加深、拍三收稳变柔。
      //      时间速度放慢约 3 倍（原版的 4.2/6/3.6 会让满幅纹理每帧位移 >0.5 测尺像素，qa 全片超线）----
      const S2 = P.scratch('mu2_w2'), g2 = S2.getContext('2d'); g2.reset();
      g2.fillStyle = '#1f0d10'; g2.fillRect(0, 0, W, H);
      const ampF = lerp(1 + 0.5 * d, 0.8, ss(7.4, 9.6, lt));
      KIT.warpRows(g2, S, y => (9 * Math.sin(y * 0.012 + t * 0.75) + 4 * Math.sin(y * 0.031 - t * 1.1)) * ampF, 5, 22);
      c.fillStyle = '#1f0d10'; c.fillRect(0, 0, W, H);
      const cm = cam(lt);
      c.save();
      c.translate(W / 2, H / 2); c.scale(cm.z, cm.z); c.translate(-cm.cx, -cm.cy);
      KIT.warpCols(c, S2, x => 6 * Math.sin(x * 0.009 - t * 0.7) * ampF, 5, 12);
      c.restore();
      screenText(c, lt, t);
    },
  };
})();
