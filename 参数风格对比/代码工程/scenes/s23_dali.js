// 「大模型参数」达利超现实样片（s23_dali）——纯代码，1931 达利《记忆的永恒》一脉超现实荒原。
// 手法照 23 号风格卡：底版拆层缓存（天/海/荒原/礁岩 → 影子 → 断块台＋枯枝）、软钟折叠映射 softMap、
// 体积填色 vol（无勾线）、剪切仿射长影子 castShadow（kx 随片越拉越长）、蚂蚁/高跷象/软钟三大母题循环。
// 构图按「参数」题材重排（不搬速通片房间构图）：荒原右侧断块台上枯枝挂一只大软钟＝参数本体
// （表盘三格刻度旁小数字 0.73 / -1.2 / 2.4，随淌势微倾），滩上半埋的橙怀表＝计数器；
// 拍二母钟淌出金水泊、新钟按距离逐只融出、金线垂连成「记忆之网」、刻度环一圈圈向外延伸（1T+ 一圈金环重音）；
// 拍三书（数据）/变形罗盘（方法）/融化中的油灯（算力）依次升起归位、刻度描金、指针减速滑向十二点对齐，
// 最后一只小钟升到半空停住不再融化（一滴悬而不落）。无角色无脸；随机全种子。
SCENES['s23_dali'] = (() => {
  const W = 1920, H = 1080, TAU = Math.PI * 2;
  const { clamp, lerp, ease, rng, ss, seg } = U, P = PAINT;
  const HZ = 560, SHORE = 592;                       // 海平线、岸线
  const C = { sky0: '#22407c', sky1: '#5f88bd', sky2: '#e9dcae', sea0: '#8aa6b8', sea1: '#4f6f86',
    g0: '#d2ad70', g1: '#7a5129', cliffA: '#e8c27a', cliffB: '#9a6a34',
    gold: '#f0d27c', goldD: '#9a7426', ink: '#3a2416',
    plinthA: '#b07a46', plinthB: '#6e4422', branch: '#4a3020' };
  const vol = P.vol;

  // ---------- ① 静态底版（天、海、礁岩、荒原；做旧只进缓存层） ----------
  const bg = () => P.cached('s23_bg', W, H, (g) => {
    const sg = g.createLinearGradient(0, 0, 0, HZ); sg.addColorStop(0, C.sky0); sg.addColorStop(0.55, C.sky1); sg.addColorStop(1, C.sky2);
    g.fillStyle = sg; g.fillRect(0, 0, W, HZ + 2);
    [[420, 210, 300, 8], [900, 148, 260, 6], [1352, 252, 240, 7], [760, 330, 420, 5], [150, 380, 220, 6]].forEach(([x, y, w, h]) => {
      const rg = g.createLinearGradient(x - w, 0, x + w, 0); rg.addColorStop(0, 'rgba(250,215,200,0)'); rg.addColorStop(0.5, 'rgba(250,215,200,.55)'); rg.addColorStop(1, 'rgba(250,215,200,0)');
      g.fillStyle = rg; g.beginPath(); g.ellipse(x, y, w, h, 0, 0, TAU); g.fill();
    });
    const mg = g.createLinearGradient(0, HZ, 0, SHORE); mg.addColorStop(0, C.sea0); mg.addColorStop(1, C.sea1);
    g.fillStyle = mg; g.fillRect(0, HZ, W, SHORE - HZ);
    g.strokeStyle = 'rgba(240,235,210,.6)'; g.lineWidth = 1.5;
    [568, 574, 583].forEach((y, k) => { g.beginPath(); g.moveTo(80 + k * 140, y); g.lineTo(700 + k * 200, y); g.stroke(); });
    // 左远处小礁岩（平衡右侧断崖）
    const rockL = new Path2D(); rockL.moveTo(40, SHORE); [[70, 556], [118, 548], [168, 560], [230, 570], [280, SHORE]].forEach(p => rockL.lineTo(p[0], p[1])); rockL.closePath();
    vol(g, rockL, 40, 545, 280, 592, '#e0ba76', '#9a6a34', 'rgba(70,40,15,.4)', 10);
    // 右侧克雷乌斯角金色礁岩
    const cliff = new Path2D(); cliff.moveTo(1560, SHORE); [[1610, 528], [1668, 492], [1726, 470], [1786, 444], [1840, 452], [1896, 428], [1920, 436], [1920, SHORE]].forEach(p => cliff.lineTo(p[0], p[1])); cliff.closePath();
    vol(g, cliff, 1580, 430, 1800, 600, C.cliffA, C.cliffB, 'rgba(70,40,15,.5)', 18);
    g.strokeStyle = 'rgba(255,240,200,.7)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(1640, 505); g.quadraticCurveTo(1700, 478, 1760, 462); g.moveTo(1800, 448); g.quadraticCurveTo(1852, 452, 1896, 434); g.stroke();
    // 荒原：近暗远亮＋细地层线
    const gg = g.createLinearGradient(0, SHORE, 0, H); gg.addColorStop(0, C.g0); gg.addColorStop(0.45, '#a87a44'); gg.addColorStop(1, C.g1);
    g.fillStyle = gg; g.fillRect(0, SHORE, W, H - SHORE);
    g.strokeStyle = 'rgba(90,55,25,.25)'; g.lineWidth = 2;
    for (let k = 0; k < 9; k++) { const y = SHORE + Math.pow(k / 9, 1.6) * 470 + 10; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(600, y - 6, 1300, y + 8, W, y - 2); g.stroke(); }
    g.fillStyle = 'rgba(255,200,120,.06)'; g.fillRect(0, 0, W, H);
    g.drawImage(P.grain('s23g', 0.05, [70, 45, 20], 0.10), 0, 0);
  });

  // ---------- 断块台（右侧荒原上）＋枯橄榄枝（挂母钟），影子夹在中间所以单独一层缓存 ----------
  const PLINTH = new Path2D(); PLINTH.moveTo(1300, 905); PLINTH.lineTo(1300, 574); PLINTH.lineTo(1322, 561); PLINTH.lineTo(1558, 567); PLINTH.lineTo(1580, 584); PLINTH.lineTo(1580, 905); PLINTH.closePath();
  const TREE = [
    { w: 15, d: [[1412, 572], [1424, 470], [1386, 372], [1394, 308]] },                    // 主干（贝塞尔折线）
    { w: 12, d: [[1394, 318], [1300, 314], [1172, 334], [1058, 352]] },                    // 挂钟长枝
    { w: 6, d: [[1296, 326], [1252, 296], [1218, 292]] },
    { w: 5, d: [[1392, 310], [1368, 268]] }, { w: 4, d: [[1398, 314], [1430, 284]] },
    { w: 4, d: [[1120, 344], [1078, 322]] },
  ];
  // 画一根枯枝（≥4 点贝塞尔、3 点贝塞尔收于第 3 点、2 点直线）
  function branch(g, tr) {
    g.lineWidth = tr.w; g.beginPath(); g.moveTo(tr.d[0][0], tr.d[0][1]);
    if (tr.d.length >= 4) g.bezierCurveTo(tr.d[1][0], tr.d[1][1], tr.d[2][0], tr.d[2][1], tr.d[3][0], tr.d[3][1]);
    else if (tr.d.length === 3) g.quadraticCurveTo(tr.d[1][0], tr.d[1][1], tr.d[2][0], tr.d[2][1]);
    else g.lineTo(tr.d[1][0], tr.d[1][1]);
    g.stroke();
  }
  const plinth = () => P.cached('s23_pl', W, H, (g) => {
    vol(g, PLINTH, 1300, 0, 1580, 0, C.plinthA, C.plinthB, 'rgba(40,20,8,.5)', 20);
    g.fillStyle = '#c89058'; g.beginPath(); g.moveTo(1300, 574); g.lineTo(1322, 561); g.lineTo(1558, 567); g.lineTo(1580, 584); g.lineTo(1556, 576); g.lineTo(1320, 570); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(60,34,14,.5)'; g.lineWidth = 2;                                    // 台面细裂
    [[1340, 640, 1460, 648], [1360, 760, 1520, 770], [1350, 848, 1540, 842]].forEach(s => { g.beginPath(); g.moveTo(s[0], s[1]); g.quadraticCurveTo((s[0] + s[2]) / 2, s[3] + 6, s[2], s[3]); g.stroke(); });
    g.strokeStyle = C.branch; g.lineCap = 'round';
    TREE.forEach(tr => branch(g, tr));
    g.lineWidth = 3; g.strokeStyle = '#3a2418'; [[1404, 574], [1428, 578], [1372, 570]].forEach(p => { g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[0] + 12, p[1] - 14); g.stroke(); });   // 根爪
  });

  // ---------- ③ 软钟：圆盘局部坐标 (u,v) → 屏幕；越过折线 fold 的部分垂下并随 sag 越垂越低 ----------
  function softMap(o, sag) {
    const cx = o.cx, cy = o.cy, R = o.R, fold = o.fold, top = o.top == null ? 0.32 : o.top, flare = o.flare == null ? -0.12 : o.flare, drip = o.drip == null ? 0.18 : o.drip;
    return (u, v) => {
      if (v <= fold) return [cx + u, cy + v * top + Math.sin(u * 0.05) * 2];
      const d = v - fold, q = d / R;
      return [cx + u * (1 - flare * q) + Math.sin(q * 3) * 5 * sag,
        cy + fold * top + d * (0.62 + 0.3 * sag) + sag * R * drip * Math.exp(-Math.pow((u + R * 0.2) / (R * 0.6), 2)) * q * q + Math.sin(u * 0.06 + 1) * 6 * q];
    };
  }
  function geom(o, sag) {
    const m = softMap(o, sag), R = o.R, N = 96;
    const ring = (r) => { const pts = []; for (let i = 0; i <= N; i++) { const a = i / N * TAU; pts.push(m(Math.cos(a) * r, Math.sin(a) * r)); } return pts; };
    return { m, outer: U.poly(ring(R)), inner: U.poly(ring(R * 0.86)) };
  }
  const wrapA = (a) => a - Math.floor(a / TAU) * TAU;

  // 画在软面上的数字：逐字符沿映射方向摆（数字随淌势微倾、随折线弯）
  function drapeText(c, m, str, u, v, size, color, alpha) {
    c.save(); c.globalAlpha = alpha;
    c.font = size + 'px "PlayfairDisplay-700i"'; c.textAlign = 'left'; c.textBaseline = 'middle';
    let tw = 0; for (let i = 0; i < str.length; i++) tw += c.measureText(str[i]).width + 0.6;
    let uu = u - tw / 2;
    for (let i = 0; i < str.length; i++) {
      const w = c.measureText(str[i]).width + 0.6;
      const p0 = m(uu, v), p1 = m(uu + size * 0.62, v);
      const ang = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
      const sx = Math.max(0.25, Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) / (size * 0.62));
      c.save(); c.translate(p0[0], p0[1]); c.rotate(ang); c.scale(sx, 1);
      c.fillStyle = color; c.fillText(str[i], 0, 0); c.restore();
      uu += w / sx;
    }
    c.restore();
  }

  // ---------- 蚂蚁（无脸剪影母题，3 节身体＋颚，可驮金色碎屑） ----------
  function ant(c, x, y, ang, s, carry) {
    c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s);
    c.fillStyle = '#1c110a'; c.strokeStyle = '#1c110a'; c.lineWidth = 1.1; c.lineCap = 'round';
    c.beginPath(); c.ellipse(-4.6, 0, 1.6, 2.2, 0, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(0, 0, 2.2, 2.9, 0, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(4.4, 0, 1.7, 2.5, 0, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(0, -2.4); c.lineTo(-2.6, -6.4); c.moveTo(0, 2.4); c.lineTo(-2.6, 6.4); c.moveTo(3, -2); c.lineTo(0.6, -6.2); c.moveTo(3, 2); c.lineTo(0.6, 6.2); c.stroke();
    if (carry) { c.fillStyle = '#e2b968'; c.beginPath(); c.arc(9.5, -1.5, 2, 0, TAU); c.fill(); c.strokeStyle = '#1c110a'; c.beginPath(); c.moveTo(6.4, -1.2); c.lineTo(7.4, -1.5); c.moveTo(6.4, 0.6); c.lineTo(7.4, 1.2); c.stroke(); }
    c.restore();
  }

  // ---------- 高跷象（1948《象》母题：细长腿交替迈步、背驮方尖碑，横穿地平线） ----------
  function elephant(c, x, lt, ink) {
    const y = 468, GY = 586, legH = GY - y, col = ink ? '#000' : '#5a4a46';
    c.save(); c.fillStyle = col; c.strokeStyle = col; c.lineCap = 'round';
    [[-26, 0], [-12, Math.PI], [18, Math.PI * 0.5], [30, Math.PI * 1.5]].forEach((L) => {
      const sw = Math.sin(lt * 6.4 + L[1]), fx = x + L[0] + sw * 9, kx = x + L[0] + sw * 3.5 + 2.6, ky = y + legH * 0.52 - Math.max(0, sw) * 6;
      c.lineWidth = 2.4; c.beginPath(); c.moveTo(x + L[0], y + 7); c.lineTo(kx, ky); c.lineTo(fx, GY - Math.max(0, sw) * 4); c.stroke();
    });
    const bob = Math.sin(lt * 13) * 1.4;
    c.beginPath(); c.ellipse(x, y + bob, 50, 26, 0, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(x - 41, y - 7 + bob, 17, 15, 0, 0, TAU); c.fill();
    c.lineWidth = 5.5; c.beginPath(); c.moveTo(x - 52, y - 2 + bob); c.quadraticCurveTo(x - 66, y + 28, x - 59 + Math.sin(lt * 4.6) * 5, y + 48); c.stroke();
    if (ink) { c.fillRect(x - 20, y - 24 + bob, 38, 64); }
    else {
      c.fillStyle = '#c8402c'; c.fillRect(x - 20, y - 24 + bob, 38, 7);
      c.fillStyle = '#e6d6b0'; c.beginPath(); c.moveTo(x - 9, y - 24 + bob); c.lineTo(x + 6, y - 24 + bob); c.lineTo(x - 2, y - 88 + bob); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,235,200,.35)'; c.beginPath(); c.ellipse(x - 13, y - 9 + bob, 24, 5, -0.2, 0, TAU); c.fill();
    }
    c.restore();
  }

  // ---------- 软钟本体（外框体积金、米白表盘、12 刻度、双针、折线高光） ----------
  function drawClock(c, o, g, t, opt) {
    const R = o.R, m = g.m, k = R / 64;
    c.save(); if (opt.alpha != null && opt.alpha < 1) c.globalAlpha = opt.alpha;
    c.save(); c.translate(-8, 10); c.fillStyle = 'rgba(30,15,5,.30)'; c.filter = 'blur(6px)'; c.fill(g.outer); c.restore();
    vol(c, g.outer, o.cx - R, 0, o.cx + R, 0, C.gold, C.goldD, 'rgba(70,45,10,.5)', 8);
    const fg = c.createLinearGradient(0, o.cy - R * 0.3, 0, o.cy + R * 1.4); fg.addColorStop(0, '#f6efd6'); fg.addColorStop(0.45, '#e8dcb6'); fg.addColorStop(1, '#bfae84');
    c.fillStyle = fg; c.fill(g.inner);
    // 12 刻度（走同一映射），拍三描金
    c.strokeStyle = C.ink;
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU - Math.PI / 2, p0 = m(Math.cos(a) * R * 0.74, Math.sin(a) * R * 0.74), p1 = m(Math.cos(a) * R * 0.8, Math.sin(a) * R * 0.8);
      c.lineWidth = (i % 3 ? 2 : 4) * Math.max(0.7, k); c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.stroke();
      if (opt.gild > 0.02) { c.strokeStyle = 'rgba(243,214,126,' + (0.85 * opt.gild) + ')'; c.lineWidth = (i % 3 ? 2.6 : 4.6) * Math.max(0.7, k); c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.stroke(); c.strokeStyle = C.ink; }
    }
    if (opt.gild > 0.02) { c.strokeStyle = 'rgba(240,210,124,' + (0.5 * opt.gild) + ')'; c.lineWidth = 3.2 * Math.max(0.7, k); c.stroke(g.inner); }
    // 指针：拍三前各速旋转，拍三减速滑向十二点对齐（半圈内平滑归位）
    const e = ease.inOut(opt.hs || 0);
    const aMin = lerp(wrapA(t * (opt.sp || 4.5) - 1.2), -Math.PI / 2, e), aHr = lerp(wrapA(t * (opt.sp || 4.5) / 12 + 0.6), -Math.PI / 2, e);
    const hand = (ang, len, w) => { c.strokeStyle = '#2a1c10'; c.lineWidth = w * Math.max(0.7, k); c.lineCap = 'round'; c.beginPath(); for (let i = 0; i <= 12; i++) { const r = len * i / 12, q = m(Math.cos(ang) * r, Math.sin(ang) * r); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); } c.stroke(); };
    hand(aMin, R * 0.66, 4); hand(aHr, R * 0.46, 6);
    const cc = m(0, 0); c.fillStyle = '#2a1c10'; c.beginPath(); c.arc(cc[0], cc[1], 4 * Math.max(0.8, k), 0, TAU); c.fill();
    // 折线高光（柔软的「棱」）
    c.strokeStyle = 'rgba(255,250,225,.55)'; c.lineWidth = 3 * Math.max(0.7, k);
    c.beginPath(); for (let i = 0; i <= 30; i++) { const u = -R * 0.9 + i / 30 * R * 1.8, q = m(u, o.fold + 2); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); } c.stroke();
    // 参数读数：三格刻度旁的小数字（0.73 / -1.2 / 2.4），呼吸发亮、随淌势微倾
    if (opt.nums) {
      NUMS.forEach((n, i) => {
        const u = Math.cos(n.a) * R * 0.5, v = Math.sin(n.a) * R * 0.5, p = m(u, v);
        c.save(); c.globalCompositeOperation = 'lighter';
        const gg = c.createRadialGradient(p[0], p[1], 2, p[0], p[1], 42);
        const br = 0.10 + 0.10 * Math.sin(t * 2.2 + i * 2.1) + 0.10 * opt.gild;
        gg.addColorStop(0, 'rgba(240,210,124,' + Math.max(0, br) + ')'); gg.addColorStop(1, 'rgba(240,210,124,0)');
        c.fillStyle = gg; c.fillRect(p[0] - 44, p[1] - 44, 88, 88); c.restore();
        drapeText(c, m, n.s, u, v, 30, '#241608', 1);
        if (opt.gild > 0.02) drapeText(c, m, n.s, u, v, 30, 'rgba(243,214,126,' + (0.55 * opt.gild) + ')', 1);
      });
    }
    c.restore();
  }

  // ---------- 母钟 / 小钟群（种子固定） ----------
  const MOM = { cx: 1050, cy: 390, R: 125, fold: -52, top: 0.26, flare: -0.12, drip: 0.30 };
  const NUMS = [{ a: -0.62, s: '0.73' }, { a: 2.35, s: '-1.2' }, { a: 0.85, s: '2.4' }];
  const BABIES = (() => {
    const r = rng(2301), defs = [
      { x: 768, y: 802, R: 54, fold: 8, t0: 3.42, pool: 1 },
      { x: 912, y: 874, R: 42, fold: 5, t0: 3.72, pool: 1 },
      { x: 1192, y: 836, R: 50, fold: -8, t0: 4.02, pool: 1 },
      { x: 1352, y: 566, R: 58, fold: 14, t0: 4.38 },                                  // 搭在断块台左棱
      { x: 1512, y: 884, R: 44, fold: 4, t0: 4.72, pool: 1 },
      { x: 1630, y: 762, R: 46, fold: -6, t0: 5.08, pool: 1 },
      { x: 700, y: 910, R: 34, fold: 3, t0: 5.42, pool: 1 },
    ];
    return defs.map((d) => { d.cx = d.x; d.cy = d.y; d.sag = 0.75 + r() * 0.5; d.sp = (1.8 + r() * 3) * (r() < 0.5 ? 1 : -1); d.ph = r() * 6; return d; });
  })();
  // 金线网：金水泊 → 各钟（＋钟↔钟），生长时刻与垂度全种子
  const EDGES = [
    { a: [995, 848], b: [768, 772], sag: 50, t0: 3.55, ph: 0.2 },
    { a: [995, 848], b: [912, 848], sag: 38, t0: 3.85, ph: 1.4 },
    { a: [995, 848], b: [1192, 802], sag: 44, t0: 4.15, ph: 2.6 },
    { a: [995, 848], b: [1352, 524], sag: 86, t0: 4.5, ph: 3.8 },
    { a: [995, 848], b: [1512, 852], sag: 52, t0: 4.85, ph: 5.0 },
    { a: [1192, 802], b: [1630, 726], sag: 62, t0: 5.2, ph: 0.9 },
    { a: [995, 848], b: [700, 884], sag: 42, t0: 5.55, ph: 2.2 },
  ];
  const CLOUDS = (() => { const r = rng(2317), out = []; for (let k = 0; k < 5; k++) out.push([260 + r() * 1760, 90 + r() * 330, 180 + r() * 220, 5 + r() * 5, r() * 6]); return out; })();

  // 金水泊／小金泊（径向渐变压扁）
  function pool(c, x, y, rx, a) {
    if (a <= 0.01 || rx <= 1) return;
    c.save(); c.translate(x, y); c.scale(1, 0.18);
    const g = c.createRadialGradient(0, 0, rx * 0.08, 0, 0, rx);
    g.addColorStop(0, 'rgba(244,218,138,' + (0.8 * a) + ')'); g.addColorStop(0.65, 'rgba(230,190,110,' + (0.34 * a) + ')'); g.addColorStop(1, 'rgba(230,190,110,0)');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill(); c.restore();
  }

  // 计数序列：1.5B → 175B → 540B → 1T+（分段连续插值后定格）
  function cntStr(lt) {
    if (lt < 3.55) return '1.5B';
    if (lt < 4.6) { const v = 1.5 * Math.pow(175 / 1.5, seg(lt, 3.55, 4.6)); return (v < 10 ? v.toFixed(1) : Math.round(v)) + 'B'; }
    if (lt < 5.8) { const v = 175 * Math.pow(540 / 175, seg(lt, 4.6, 5.8)); return Math.round(v) + 'B'; }
    if (lt < 6.3) return '540B';
    return '1T+';
  }

  // 屏上字（天空里的淡金笔画字，换拍时旧字先淡出新字再淡入）
  const TITLES = [{ txt: '参数', s: 96 }, { txt: '疯狂卷参数', s: 68 }, { txt: '参数之外', s: 84 }];
  function titles(c, lt, t) {
    c.save(); c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.letterSpacing = '12px';
    for (let k = 0; k < 3; k++) {
      let a = k === 0 ? ss(0.08, 0.55, lt) : ss(3.06 + (k - 1) * 4, 3.42 + (k - 1) * 4, lt);
      if (k < 2) a *= 1 - ss(2.62 + k * 4, 2.96 + k * 4, lt);
      if (a <= 0.015) continue;
      const dx = 3 * Math.sin(t * 0.35 + k * 2.1), T = TITLES[k];
      c.globalAlpha = a * 0.5; c.font = T.s + 'px "LXGWWenKai-500"'; c.fillStyle = 'rgba(46,66,106,.9)';
      c.fillText(T.txt, 324 + dx, 215);
      c.globalAlpha = a; c.fillStyle = '#f6efdc'; c.fillText(T.txt, 321 + dx, 212);
    }
    c.letterSpacing = '0px'; c.restore();
  }

  // 铭牌（物件脚下的深木小牌＋细杆）
  function plate(c, x, y, txt, a) {
    if (a <= 0.015) return;
    c.save(); c.globalAlpha = a;
    c.strokeStyle = '#4a3622'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x, y - 14); c.lineTo(x, y - 34); c.stroke();
    const w = txt.length * 27 + 26;
    c.fillStyle = '#4a3622'; c.beginPath(); c.roundRect(x - w / 2, y - 14, w, 38, 6); c.fill();
    c.strokeStyle = 'rgba(240,210,124,.55)'; c.lineWidth = 1.4; c.stroke();
    c.fillStyle = '#e9dcae'; c.font = '25px "LXGWWenKai-500"'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(txt, x, y + 6); c.restore();
  }

  // 三件物升起（依次归位）
  const rise = (lt, t0) => ({ p: ease.out(seg(lt, t0, t0 + 1.15)), a: ss(t0, t0 + 0.5, lt) });

  function book(c, lt, t, b3) {
    const { p, a } = rise(lt, 7.15); if (a <= 0.015) return;
    c.save(); c.globalAlpha = a; c.translate(0, (1 - p) * 170);
    const fl = 5 * Math.sin(t * 1.4) * (1 - 0.5 * b3);                       // 右上页角轻颤（拍三收稳）
    c.fillStyle = '#7a3c28'; c.beginPath();                                  // 封面
    c.moveTo(250, 784); c.bezierCurveTo(212, 770, 178, 774, 158, 786); c.lineTo(154, 814); c.bezierCurveTo(186, 806, 224, 818, 250, 822);
    c.bezierCurveTo(278, 818, 316, 810, 346, 818); c.lineTo(344, 790 + fl * 0.3); c.bezierCurveTo(314, 786 + fl * 0.5, 280, 776, 250, 784); c.closePath(); c.fill();
    c.fillStyle = '#f0e6c8';                                                 // 左右摊开的书页
    c.beginPath(); c.moveTo(250, 782); c.bezierCurveTo(216, 772, 186, 776, 168, 784); c.lineTo(164, 808); c.bezierCurveTo(190, 802, 222, 814, 250, 818); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(250, 782); c.bezierCurveTo(284, 774, 314, 778 + fl * 0.4, 332, 788 + fl); c.lineTo(336, 812 + fl * 0.5); c.bezierCurveTo(310, 804 + fl * 0.3, 278, 814, 250, 818); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(58,36,24,.28)'; c.lineWidth = 1.6;                 // 页面字行
    [[196, 790, 238, 798], [190, 800, 240, 808], [270, 792, 318, 800], [272, 802, 320, 808]].forEach((s) => { c.beginPath(); c.moveTo(s[0], s[1]); c.quadraticCurveTo((s[0] + s[2]) / 2, s[3] - 3, s[2], s[3]); c.stroke(); });
    if (b3 > 0.02) { c.strokeStyle = 'rgba(243,214,126,' + (0.7 * b3) + ')'; c.lineWidth = 2.6; c.beginPath(); c.moveTo(168, 784); c.lineTo(164, 808); c.moveTo(332, 788 + fl); c.lineTo(336, 812 + fl * 0.5); c.moveTo(250, 782); c.lineTo(250, 818); c.stroke(); }
    c.restore();
    plate(c, 250, 852, '数据', a);
  }

  function compass(c, lt, t, b3) {
    const { p, a } = rise(lt, 7.55); if (a <= 0.015) return;
    c.save(); c.globalAlpha = a; c.translate(0, (1 - p) * 150);
    c.translate(445, 700); c.rotate(-0.06); c.scale(1, 0.94);                 // 变形（软化的椭圆盘）
    const cg = c.createLinearGradient(-52, -50, 52, 50); cg.addColorStop(0, '#c89058'); cg.addColorStop(1, '#8a5a26');
    c.fillStyle = cg; c.beginPath(); c.ellipse(0, 0, 52, 50, 0, 0, TAU); c.fill();
    c.strokeStyle = C.goldD; c.lineWidth = 3; c.stroke();
    c.fillStyle = '#33261a'; c.beginPath(); c.ellipse(0, 0, 43, 41, 0, 0, TAU); c.fill();
    for (let ring = 0; ring < 3; ring++) {                                   // 三圈刻度环反向慢转（拍三减速）
      const rr = 36 - ring * 10, rot = (ring % 2 ? -1 : 1) * t * 0.22 * (1 - 0.85 * b3);
      c.strokeStyle = 'rgba(240,210,124,.6)'; c.lineWidth = 1.6;
      c.beginPath(); c.ellipse(0, 0, rr, rr * 0.94, 0, 0, TAU); c.stroke();
      for (let i = 0; i < 12; i++) { const an = i / 12 * TAU + rot + ring * 0.26;
        c.beginPath(); c.moveTo(Math.cos(an) * (rr - 4), Math.sin(an) * (rr - 4) * 0.94); c.lineTo(Math.cos(an) * (rr + 4), Math.sin(an) * (rr + 4) * 0.94); c.stroke(); }
    }
    const sw = -0.75 + 0.55 * Math.sin(t * 1.1), na = lerp(sw, -0.55, ease.inOut(b3));   // 指针摆动后收定
    c.fillStyle = '#e8c27a'; c.save(); c.rotate(na); c.beginPath(); c.moveTo(-30, 0); c.lineTo(0, -3); c.lineTo(30, 0); c.lineTo(0, 3); c.closePath(); c.fill();
    c.fillStyle = '#b04a28'; c.beginPath(); c.moveTo(0, -24); c.lineTo(3, 0); c.lineTo(-3, 0); c.closePath(); c.fill(); c.restore();
    c.fillStyle = '#e8c27a'; c.beginPath(); c.arc(0, 0, 3.6, 0, TAU); c.fill();
    const dr = 3 + 13 * ease.inOut(seg(lt, 7.6, 9.3));                        // 右缘融化垂滴（长出后停住）
    c.fillStyle = cg; c.beginPath(); c.moveTo(34, 44); c.quadraticCurveTo(40, 44 + dr * 0.6, 37, 46 + dr); c.quadraticCurveTo(34, 44 + dr * 0.6, 31, 45); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,240,210,.2)'; c.lineWidth = 3; c.beginPath(); c.arc(-14, -12, 34, -2.4, -1.2); c.stroke();
    c.restore();
    plate(c, 445, 788, '方法', a);
  }

  function lamp(c, lt, t, b3) {
    const { p, a } = rise(lt, 7.95); if (a <= 0.015) return;
    c.save(); c.globalAlpha = a; c.translate(0, (1 - p) * 140);
    c.translate(668, 742);
    const bg2 = c.createLinearGradient(-46, -34, 44, 12); bg2.addColorStop(0, '#d9a655'); bg2.addColorStop(1, '#8a5a26');
    c.fillStyle = bg2;                                                        // 神灯壶身
    c.beginPath(); c.moveTo(-44, -4); c.quadraticCurveTo(-40, -34, -8, -38); c.quadraticCurveTo(22, -36, 40, -22); c.lineTo(58, -32);
    c.quadraticCurveTo(52, -18, 40, -14); c.quadraticCurveTo(46, 2, 38, 12); c.quadraticCurveTo(10, 22, -20, 16); c.quadraticCurveTo(-42, 10, -44, -4); c.closePath(); c.fill();
    c.strokeStyle = '#6e4418'; c.lineWidth = 2.4; c.stroke();
    c.strokeStyle = '#a8703a'; c.lineWidth = 5; c.beginPath(); c.arc(-34, -22, 13, 2.2, 5.1); c.stroke();   // 提环
    c.fillStyle = '#e8c27a'; c.beginPath(); c.ellipse(0, 14, 42, 6, 0, 0, TAU); c.fill();                     // 壶底
    const d1 = 4 + 12 * ease.inOut(seg(lt, 7.6, 9.4)), d2 = 3 + 9 * ease.inOut(seg(lt, 8.0, 9.6));            // 融化中的垂滴
    c.fillStyle = bg2;
    c.beginPath(); c.moveTo(-22, 16); c.quadraticCurveTo(-24, 16 + d1 * 0.6, -21, 17 + d1); c.quadraticCurveTo(-18, 16 + d1 * 0.6, -16, 16); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(12, 17); c.quadraticCurveTo(14, 17 + d2 * 0.6, 12, 18 + d2); c.quadraticCurveTo(10, 17 + d2 * 0.6, 7, 17); c.closePath(); c.fill();
    const fx = 62, fy = -40;                                                  // 焰苗（摇曳映地）
    c.save(); c.globalCompositeOperation = 'lighter';
    const gl = c.createRadialGradient(fx, fy - 6, 4, fx, fy - 6, 118);
    gl.addColorStop(0, 'rgba(255,208,120,.34)'); gl.addColorStop(1, 'rgba(255,208,120,0)');
    c.fillStyle = gl; c.fillRect(fx - 120, fy - 124, 240, 240);
    const pg = c.createRadialGradient(0, 58, 8, 0, 58, 108);                 // 地上暖光（灯脚下的光池）
    pg.addColorStop(0, 'rgba(255,196,108,.22)'); pg.addColorStop(1, 'rgba(255,196,108,0)');
    c.fillStyle = pg; c.fillRect(-108, -50, 216, 216);
    c.restore();
    c.save(); c.translate(fx, fy); c.scale(1 + 0.1 * Math.sin(t * 6.3), 1 + 0.18 * Math.sin(t * 7.1 + 1)); c.rotate(0.1 * Math.sin(t * 5.2));
    const fg2 = c.createRadialGradient(0, -4, 1, 0, -4, 20); fg2.addColorStop(0, '#fff6d0'); fg2.addColorStop(0.5, '#f5b23c'); fg2.addColorStop(1, 'rgba(216,98,31,0)');
    c.fillStyle = fg2; c.beginPath(); c.moveTo(0, 4); c.quadraticCurveTo(8, -6, 0, -24); c.quadraticCurveTo(-8, -6, 0, 4); c.closePath(); c.fill();
    c.fillStyle = '#fff8e2'; c.beginPath(); c.arc(0, -2, 3.4, 0, TAU); c.fill(); c.restore();
    c.restore();
    plate(c, 668, 818, '算力', a);
  }

  return {
    init() {
      U.assertGlyphs('96px "LXGWWenKai-500"', '参数疯狂卷之外数据方法算力', 's23_dali 屏上字与铭牌');
      U.assertGlyphs('34px "PlayfairDisplay-700i"', '0.73-1.2 2.4 1.5B 175B 540B 1T+', 's23_dali 数字');
    },
    draw(c, lt, t) {
      const dens = ss(3.15, 6.4, lt);                        // 拍二增殖密度
      const b3 = ss(7.05, 8.8, lt);                          // 拍三收稳
      const gild = ss(7.2, 8.9, lt), hs = ss(7.05, 8.7, lt); // 描金 / 指针归位
      // ---------- 运镜：0–3s 缓推凑近表盘 → 3–7.2s 缓拉远看全荒原 → 之后停住收全貌 ----------
      let z, cx, cy;
      if (lt < 3) { const q = ease.inOut(lt / 3); z = 1 + 0.20 * q; cx = lerp(960, 1005, q); cy = lerp(540, 468, q); }
      else if (lt < 7.2) { const q = ease.inOut(seg(lt, 3, 7.2)); z = 1.20 - 0.20 * q; cx = lerp(1005, 960, q); cy = lerp(468, 540, q); }
      else { const q = ease.inOut(seg(lt, 7.2, 9.6)); z = 1 + 0.016 * q; cx = 960; cy = lerp(540, 533, q); }
      c.save(); c.translate(cx, cy); c.scale(z, z); c.translate(-cx, -cy);
      // ① 底版
      c.drawImage(bg(), 0, 0);
      // ② 天色渐沉＋云增多（只落在拍二）
      if (dens > 0.004) {
        const dk = c.createLinearGradient(0, 0, 0, HZ + 40);
        dk.addColorStop(0, 'rgba(26,40,74,' + (0.24 * dens) + ')'); dk.addColorStop(1, 'rgba(26,40,74,0)');
        c.fillStyle = dk; c.fillRect(0, 0, W, HZ + 40);
        CLOUDS.forEach((cl) => {
          const ca = dens * 0.5 * (0.7 + 0.3 * Math.sin(t * 0.5 + cl[4]));
          const rg = c.createLinearGradient(cl[0] - cl[2], 0, cl[0] + cl[2], 0);
          rg.addColorStop(0, 'rgba(232,206,196,0)'); rg.addColorStop(0.5, 'rgba(232,206,196,' + ca + ')'); rg.addColorStop(1, 'rgba(232,206,196,0)');
          c.fillStyle = rg; c.beginPath(); c.ellipse(cl[0] - 5.5 * lt, cl[1], cl[2], cl[3], 0, 0, TAU); c.fill();
        });
      }
      // ③ 高跷象横穿地平线（在礁岩前、断块台后）
      elephant(c, 1740 - 62 * lt, lt, false);
      // ④ 预计算全部软钟几何（影子与本体共用同一映射）
      const sagM = 0.12 + 1.05 * ease.inOut(clamp(lt / 1.6)) + 0.25 * ease.inOut(seg(lt, 2.4, 6.5));
      const gM = geom(MOM, sagM);
      const born = [];
      BABIES.forEach((b) => {
        const s = ease.out(seg(lt, b.t0, b.t0 + 0.85));
        if (s <= 0.01) return;
        const sagB = b.sag * ease.inOut(seg(lt, b.t0 + 0.15, b.t0 + 1.35));
        born.push({ b, s, sag: sagB, g: geom(b, sagB), a: ss(b.t0, b.t0 + 0.4, lt) });
      });
      const risers = [rise(lt, 7.15), rise(lt, 7.55), rise(lt, 7.95)];
      // ⑤ 长影子（剪切仿射，kx 全片越拉越长＝黄昏）：象、台座＋枯枝、母钟、已融出的钟、怀表、三件物
      P.castShadow(c, [
        [588, (g) => elephant(g, 1740 - 62 * lt, lt, true)],
        [903, (g) => { g.fill(PLINTH); g.strokeStyle = '#000'; g.lineCap = 'round'; TREE.forEach((tr) => branch(g, tr)); }],
        [700, (g) => g.fill(gM.outer)],
        [868, (g) => { g.beginPath(); g.ellipse(560, 816, 60, 30, 0, 0, TAU); g.fill(); }],
      ].concat(born.map((bb) => [bb.b.plinth ? 905 : bb.b.y + bb.b.R * 0.95, (g) => g.fill(bb.g.outer)]))
        .concat(risers.map((r, i) => {
          const dy = (1 - r.p) * (i === 0 ? 170 : i === 1 ? 150 : 140);
          return [[818, 774, 770][i], (g) => {
            g.save(); g.translate(0, dy); g.globalAlpha = r.a;
            if (i === 0) g.fillRect(158, 782, 190, 38);
            if (i === 1) { g.beginPath(); g.ellipse(445, 700, 54, 52, 0, 0, TAU); g.fill(); }
            if (i === 2) { g.beginPath(); g.ellipse(668, 742, 56, 40, 0, 0, TAU); g.fill(); }
            g.restore();
          }];
        })), { kx: 0.82 + 0.8 * ease.inOut(clamp(lt / 9.4)), ky: 0.22, clipY: SHORE + 2, alpha: 0.5, blur: 1.5, key: 's23sh' });
      // ⑥ 断块台＋枯枝（影子之后）
      c.drawImage(plinth(), 0, 0);
      // ⑦ 金水泊（母钟淌出来的）＋涟漪（拍三收稳）
      const pq = ease.out(seg(lt, 2.1, 6.6));
      if (pq > 0.01) {
        const rx = lerp(36, 175, pq);
        pool(c, 995, 856, rx, 1);
        for (let k = 0; k < 2; k++) {
          const fr = (t * 0.42 + k * 0.5) % 1, rr = rx * (0.28 + 0.68 * fr);
          c.strokeStyle = 'rgba(246,235,200,' + (0.3 * (1 - fr) * dens * (1 - 0.5 * b3)) + ')'; c.lineWidth = 1.8;
          c.beginPath(); c.ellipse(995, 856, rr, rr * 0.18, 0, 0, TAU); c.stroke();
        }
      }
      // ⑧ 金线网（垂连的淌金线＋沿线流珠；拍三波纹收稳）
      EDGES.forEach((e) => {
        const q = ease.inOut(seg(lt, e.t0, e.t0 + 1.1)); if (q <= 0.02) return;
        const swy = 3 * Math.sin(t * 0.8 + e.ph);
        const mx = (e.a[0] + e.b[0]) / 2, my = (e.a[1] + e.b[1]) / 2 + e.sag + swy;
        const bez = (u) => { const v = 1 - u; return [v * v * e.a[0] + 2 * v * u * mx + u * u * e.b[0], v * v * e.a[1] + 2 * v * u * my + u * u * e.b[1]]; };
        c.strokeStyle = 'rgba(240,210,124,' + (0.62 * q * dens) + ')'; c.lineWidth = 2.4; c.beginPath();
        for (let i = 0; i <= 22; i++) { const u = i / 22 * q, p = bez(u); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.stroke();
        if (q > 0.98) {                                                       // 流珠（拍三变慢变淡）
          const u = (t * 0.16 + e.ph) % 1, p = bez(u);
          c.save(); c.globalCompositeOperation = 'lighter';
          const sg = c.createRadialGradient(p[0], p[1], 0.5, p[0], p[1], 6);
          sg.addColorStop(0, 'rgba(250,226,150,' + (0.55 * (1 - 0.45 * b3)) + ')'); sg.addColorStop(1, 'rgba(250,226,150,0)');
          c.fillStyle = sg; c.fillRect(p[0] - 7, p[1] - 7, 14, 14); c.restore();
        }
      });
      // ⑨ 母钟滴线（沿淌势垂到金水泊；拍三淌珠减速）
      const dA = ss(2.0, 2.7, lt);
      if (dA > 0.01) {
        const from = gM.m(-MOM.R * 0.2, MOM.R * 0.99), to = [995, 848];
        const mx = (from[0] + to[0]) / 2 + 16 * Math.sin(t * 0.7), my = (from[1] + to[1]) / 2 + 6;
        const bez = (u) => { const v = 1 - u; return [v * v * from[0] + 2 * v * u * mx + u * u * to[0], v * v * from[1] + 2 * v * u * my + u * u * to[1]]; };
        c.strokeStyle = 'rgba(240,210,124,' + (0.78 * dA) + ')'; c.lineWidth = 3; c.beginPath();
        for (let i = 0; i <= 20; i++) { const p = bez(i / 20); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.stroke();
        const u = (lt < 7 ? 0.42 * lt : 2.94 + 0.085 * (lt - 7)) % 1, p = bez(u);
        c.fillStyle = '#f0d27c'; c.beginPath(); c.ellipse(p[0], p[1] + 2, 3.2, 4.4 * (1 + u * 0.4), 0, 0, TAU); c.fill();
      }
      // ⑩ 母钟（参数刻度特写对象）
      drawClock(c, MOM, gM, t, { nums: true, gild, hs, sp: 4.6, alpha: 1 });
      for (let k = 0; k < 5; k++) {                                            // 绕盘爬行搬运的蚂蚁（走同一映射）
        const sp = (0.5 + (k % 3) * 0.18) * (k % 2 ? 1 : -1), a = sp * t + k * 1.26;
        const p0 = gM.m(Math.cos(a) * MOM.R * 0.93, Math.sin(a) * MOM.R * 0.93), p1 = gM.m(Math.cos(a + 0.05) * MOM.R * 0.93, Math.sin(a + 0.05) * MOM.R * 0.93);
        ant(c, p0[0], p0[1], Math.atan2(p1[1] - p0[1], p1[0] - p0[0]) * 1, 1.15, k % 2 === 0);
      }
      // ⑪ 小钟群逐只融出（从各自的金泊里长出，滴在荒原/台座棱上）
      born.forEach((bb) => {
        if (bb.b.pool) pool(c, bb.b.x, bb.b.y + bb.b.R * 0.55, bb.b.R * 0.95 * bb.s + 8 * bb.s, bb.a * 0.85);
        const ax = bb.b.plinth ? bb.b.x : bb.b.x, ay = bb.b.plinth ? bb.b.y : bb.b.y + bb.b.R * 0.95;
        c.save(); c.translate(ax, ay); c.scale(bb.s, bb.s); c.translate(-ax, -ay);
        drawClock(c, bb.b, bb.g, t, { gild, hs, sp: bb.b.sp, alpha: bb.a });
        c.restore();
      });
      // ⑫ 怀表计数器：刻度环一圈圈向外延伸（175B/540B/1T+ 各一圈，1T+ 一圈金环重音扩散）
      const RINGS = [[4.6, 96], [5.8, 152], [6.3, 214]];
      RINGS.forEach((R, k) => {
        const q = ease.out(ss(R[0], R[0] + 1.25, lt)); if (q <= 0.01) return;
        const r = lerp(64, R[1], q), ry = r * 0.3;
        const pu = k === 2 ? Math.sin(Math.PI * seg(lt, 6.3, 6.78)) : 0;      // 1T+ 重音：一圈金环平滑扩散
        c.strokeStyle = 'rgba(240,210,124,' + (0.5 + 0.35 * pu) + ')'; c.lineWidth = 3.2 + pu * 2.6;
        c.beginPath(); c.ellipse(560, 850, r, ry, 0, 0, TAU); c.stroke();
        for (let i = 0; i < 12; i++) { const an = i / 12 * TAU + k * 0.26;
          c.beginPath(); c.moveTo(560 + Math.cos(an) * (r - 6), 850 + Math.sin(an) * (ry - 6) * 0.3); c.lineTo(560 + Math.cos(an) * (r + 6), 850 + Math.sin(an) * (ry + 6) * 0.3); c.stroke(); }
        if (pu > 0.02) { c.save(); c.globalCompositeOperation = 'lighter';
          const gg = c.createRadialGradient(560, 850, 8, 560, 850, 130);
          gg.addColorStop(0, 'rgba(243,214,126,' + (0.4 * pu) + ')'); gg.addColorStop(1, 'rgba(243,214,126,0)');
          c.fillStyle = gg; c.fillRect(430, 720, 260, 260); c.restore(); }
      });
      // ⑬ 橙怀表（拍一合盖半埋、拍二掀盖露计数表盘）
      {
        const wx = 560, wy = 816, R = 58, op = ease.inOut(seg(lt, 3.2, 3.72));
        if (op > 0.02) {                                                      // 掀开的盖（绕左铰旋起）
          const HX = wx - R * 0.94, HY = wy - 2, th = op * 1.9;
          const lx = HX + R * 0.94 * Math.cos(th), ly = HY - R * 0.94 * Math.sin(th);
          c.save(); c.globalAlpha = op; c.translate(lx, ly); c.rotate(-th * 0.92);
          const lg = c.createLinearGradient(-R, -R * 0.7, R, R * 0.7); lg.addColorStop(0, '#c05a1c'); lg.addColorStop(1, '#7a3a10');
          c.fillStyle = lg; c.beginPath(); c.ellipse(0, 0, R * 0.98, R * 0.68, 0, 0, TAU); c.fill();
          c.strokeStyle = '#8a4214'; c.lineWidth = 2.4; c.stroke(); c.restore();
        }
        const wg = c.createRadialGradient(wx - 14, wy - 10, 4, wx, wy, R * 1.05); wg.addColorStop(0, '#f08a3a'); wg.addColorStop(1, '#a84f18');
        c.fillStyle = wg; c.beginPath(); c.ellipse(wx, wy, R, R * 0.7, 0, 0, TAU); c.fill();
        c.strokeStyle = C.goldD; c.lineWidth = 2.6; c.stroke();
        c.save(); c.globalAlpha = op;                                          // 表盘＋计数
        c.fillStyle = '#f6efd6'; c.beginPath(); c.ellipse(wx, wy, R * 0.8, R * 0.52, 0, 0, TAU); c.fill();
        c.strokeStyle = '#c9a24a'; c.lineWidth = 2; c.beginPath(); c.ellipse(wx, wy, R * 0.8, R * 0.52, 0, 0, TAU); c.stroke();
        c.strokeStyle = '#3a2a18'; c.lineWidth = 2;
        for (let i = 0; i < 12; i++) { const an = i / 12 * TAU;
          c.beginPath(); c.moveTo(wx + Math.cos(an) * R * 0.62, wy + Math.sin(an) * R * 0.4); c.lineTo(wx + Math.cos(an) * R * 0.72, wy + Math.sin(an) * R * 0.47); c.stroke(); }
        c.fillStyle = C.ink; c.font = '34px "PlayfairDisplay-700i"'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(cntStr(lt), wx, wy + 4);
        if (lt >= 6.3) { c.strokeStyle = 'rgba(154,116,38,.8)'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(wx - 40, wy + 26); c.lineTo(wx + 40, wy + 26); c.stroke(); }
        c.restore();
        if (op < 0.98) {                                                      // 合着的盖（拍一）
          c.save(); c.globalAlpha = 1 - op;
          const cg2 = c.createLinearGradient(wx - R, wy - R * 0.7, wx + R, wy + R * 0.7); cg2.addColorStop(0, '#e07a2e'); cg2.addColorStop(1, '#8a4214');
          c.fillStyle = cg2; c.beginPath(); c.ellipse(wx, wy, R * 1.02, R * 0.72, 0, 0, TAU); c.fill();
          c.strokeStyle = 'rgba(255,232,190,.4)'; c.lineWidth = 2; c.beginPath(); c.ellipse(wx - 6, wy - 4, R * 0.7, R * 0.45, -0.2, 0, TAU); c.stroke();
          c.fillStyle = '#c9a24a'; c.beginPath(); c.arc(wx + R * 0.92, wy - R * 0.34, 6, 0, TAU); c.fill();
          c.restore();
        }
        c.fillStyle = '#c9a066';                                              // 半埋的沙堆
        c.beginPath(); c.ellipse(wx - 10, wy + R * 0.68, 54, 13, 0.06, 0, TAU); c.fill();
        c.beginPath(); c.ellipse(wx + 26, wy + R * 0.6, 34, 10, -0.05, 0, TAU); c.fill();
        c.fillStyle = '#c9a24a'; c.beginPath(); c.arc(wx + R * 1.02, wy - R * 0.42, 6.5, 0, TAU); c.fill();   // 表冠
        c.strokeStyle = C.goldD; c.lineWidth = 3; c.beginPath(); c.arc(wx + R * 1.16, wy - R * 0.62, 6, 1, 5.2); c.stroke();
        for (let k = 0; k < 9; k++) {                                          // 绕表爬行搬运的蚂蚁
          const a = lt * (1.5 + (k % 3) * 0.4) * (k % 2 ? 1 : -1) + k * 0.7, rr = 0.3 + (k % 4) * 0.17;
          ant(c, wx + Math.cos(a) * 46 * rr, wy - 2 + Math.sin(a) * 17 * rr, a + (k % 2 ? Math.PI / 2 : -Math.PI / 2), 0.9, k % 3 === 0);
        }
        for (let k = 0; k < 4; k++) {                                          // 沙地上驮金屑的蚂蚁
          const a = lt * (0.6 + (k % 2) * 0.25) * (k % 2 ? 1 : -1) + k * 1.8;
          ant(c, wx + Math.cos(a) * 86, 852 + Math.sin(a) * 22, a + (k % 2 ? Math.PI / 2 : -Math.PI / 2), 1.1, true);
        }
      }
      // ⑭ 三件物升起归位：书（数据）、变形罗盘（方法）、融化中的油灯（算力）
      book(c, lt, t, b3); compass(c, lt, t, b3); lamp(c, lt, t, b3);
      // ⑮ 最后一只小钟升到半空停住不再融化（一滴悬而不落）
      {
        const fa = ss(7.3, 7.8, lt), fp = ease.out(seg(lt, 7.3, 8.6));
        const fy = lerp(690, 575, fp), FIN = { cx: 890, cy: fy, R: 34, fold: -10, top: 0.3, flare: -0.12, drip: 0.2 };
        if (fa > 0.01) {
          pool(c, 890, 848, 30, 0.5 * fa * (1 - 0.4 * fp));                   // 地上淡影（钟升空后更淡）
          const gF = geom(FIN, 0.35);
          c.save(); c.globalAlpha = 0.12 * fa; c.globalCompositeOperation = 'lighter';
          const hg = c.createRadialGradient(890, fy, 6, 890, fy, 90); hg.addColorStop(0, 'rgba(250,226,150,.7)'); hg.addColorStop(1, 'rgba(250,226,150,0)');
          c.fillStyle = hg; c.fillRect(800, fy - 90, 180, 180); c.restore();
          drawClock(c, FIN, gF, t, { gild: 1, hs: 1, sp: 0.0001, alpha: fa });   // 指针停在十二点、不再融化（sag 恒定）
          const bp = gF.m(-FIN.R * 0.2, FIN.R * 1.06);                       // 悬而不落的一滴（微颤）
          const tq = 1 + 0.08 * Math.sin(t * 2.9);
          c.save(); c.translate(bp[0] + 0.8 * Math.sin(t * 4.6), bp[1] + 0.6 * Math.sin(t * 3.1)); c.scale(tq, tq);
          c.fillStyle = '#f0d27c'; c.beginPath(); c.moveTo(0, -5); c.quadraticCurveTo(5, 1, 0, 8); c.quadraticCurveTo(-5, 1, 0, -5); c.closePath(); c.fill();
          c.restore();
        }
      }
      // ⑯ 屏上字（天空淡金笔画）
      titles(c, lt, t);
      c.restore();
      // ⑰ 暗角（博物馆灯下的画）
      const vg = c.createRadialGradient(960, 520, 520, 960, 540, 1150);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(25,12,4,.36)');
      c.fillStyle = vg; c.fillRect(0, 0, W, H);
    },
  };
})();
