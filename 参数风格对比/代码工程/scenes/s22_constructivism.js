// s22_constructivism · 1924 俄国构成主义海报（罗德琴科/李西茨基）×「大模型参数」风格样片（10s 单镜头三拍）。
// 题材构图（不搬速通片的房间）：一张构成主义宣传海报——参数＝灰度照片的 45° 可变点径网点。
//   拍一 0–3s   黑圆＋刺入它的红楔（楔尖 1.3Hz 微进退）、圆外红虚线环旋转、圆顶四道红弧外扩；
//               三块放大的网点剪贴照片（白剪切边＋Anton 数字牌 0.73/-1.2/2.4，逐个盖章弹出被端详、
//               网点整片变点径呼吸、照片轻浮动）；黑圆左上一个斜向宣言锥（墨色字条锥排开缓慢外爬）；镜头缓推。
//   拍二 3–7s   三块照片缩位入列；对角带上的网点块阵列从黑圆向外放射增殖（块内网点密度逐级升级、
//               剪贴盖章弹出），底下黑色对角带随密度展宽、两道红细线加深，红楔长大成贯穿全幅的主结构；
//               斜红地面上一块计数牌滚动 1.5B→175B→540B→1T+，每个数值落定盖章跳一下，
//               1T+ 揭示时两道红环从计数牌扩散（全片唯一一次重音）；镜头先缓拉远、后段缓推入结构带。
//   拍三 7–10s  增殖停住；网点从「变多」转为「变亮变精」（点径收小、每四颗染红、块内描米白内框、
//               一道米白高光带沿对角扫过，连线收稳、红点沿线低声流动）；斜红地面上依次升起三件几何
//               宣传物（红方块书摞=数据、白齿轮=方法、红黑电池=算力，各带米白铭牌）；红字牌沿对角线
//               逐个盖章、末牌落在黑圆心上，整排波浪轻跳收尾；镜头停收全貌。
// 管线：底版（米白旧纸＋斑驳＋左缘竖排「ПАРАМЕТР」几何字）与斜红地面整张 P.cached；网点全部解析灰度
//      直接画点（不 getImageData），墨点/红点各并成一条 path 一次填；做旧（斑驳）只上背景。
// 约定：随机全用 U.rng/U.hash 种子；中文 PuHui-Black/PuHui-Heavy（思源黑 900/800）、数字 Anton-400，
//      落笔前 U.assertGlyphs；字全部避开 y>880；无角色（不画脸，剪贴照片里没有人）。
SCENES['s22_constructivism'] = (() => {
  const W = 1920, H = 1080, TAU = Math.PI * 2;
  const { clamp, lerp, ss, ease, hash, rng } = U, P = PAINT;
  const C = { paper: '#e9dfc4', paperD: '#d9c9a4', red: '#c8231c', redD: '#8f1711', ink: '#151311', cream: '#f4ecd6', shear: '#fbf7ea' };

  // 主对角轴：过黑圆心 (1330,400)，-25°（左下角→右上角的全幅对角线），红楔沿它刺入并长成主结构
  const CC = [1330, 400], CR = 225, AXA = -25 * Math.PI / 180;
  const AU = [Math.cos(AXA), Math.sin(AXA)], AN = [-Math.sin(AXA), Math.cos(AXA)];
  const axP = (s, o) => [CC[0] + AU[0] * s + AN[0] * o, CC[1] + AU[1] * s + AN[1] * o];

  // ---------- 几何西里尔字（5×7 模块，逐部件 fill：两条反向斜腿并一条 path 会被 nonzero 抵消出洞） ----------
  const GL = {
    'П': [[0, 0, 5, 1.3], [0, 0, 1.3, 7], [3.7, 0, 1.3, 7]],
    'Е': [[0, 0, 1.3, 7], [0, 0, 5, 1.3], [0, 2.9, 4, 1.2], [0, 5.7, 5, 1.3]],
    'Т': [[0, 0, 5, 1.3], [1.85, 0, 1.3, 7]],
    'А': [{ p: [[0, 7], [1.8, 0], [3.2, 0], [1.4, 7]] }, { p: [[5, 7], [3.2, 0], [1.8, 0], [3.6, 7]] }, [1.0, 4.3, 3.0, 1.15]],
    'Р': [[0, 0, 1.3, 7], [0, 0, 5, 1.3], [3.7, 1.2, 1.3, 2.0], [0, 2.9, 3.9, 1.15]],           // 本片新加（ПАРАМЕТР 用）
    'М': [{ p: [[0.3, 7], [1.5, 0], [2.6, 0], [1.4, 7]] }, { p: [[4.7, 7], [3.5, 0], [2.4, 0], [3.6, 7]] }, { p: [[1.5, 1.0], [2.5, 3.6], [3.5, 1.0]] }],
  };
  function glyph(c, ch, x, y, u) {
    const g = GL[ch]; if (!g) return;
    g.forEach(r => { c.beginPath(); if (r.p) { r.p.forEach((q, i) => i ? c.lineTo(x + q[0] * u, y + q[1] * u) : c.moveTo(x + q[0] * u, y + q[1] * u)); c.closePath(); } else c.rect(x + r[0] * u, y + r[1] * u, r[2] * u, r[3] * u); c.fill(); });
  }

  // ---------- 底版（做旧只上背景） ----------
  const bg = () => P.cached('ct_bg', W, H, (g) => {
    g.drawImage(P.texture('ct_paper', C.paper, { scale: 0.0035, amt: 16, grain: 18, seed: 5, dark: C.paperD }), 0, 0);
    const r = rng(88);
    for (let k = 0; k < 3; k++) {                                   // 斑驳污渍（只上背景纸面）
      const x = 200 + r() * 1520, y = 140 + r() * 640, rx = 60 + r() * 70;
      g.save(); g.globalAlpha = 0.05 + r() * 0.05; g.translate(x, y); g.rotate((r() - 0.5) * 0.8);
      g.fillStyle = '#8a7a55'; g.beginPath(); g.ellipse(0, 0, rx, rx * (0.4 + r() * 0.3), 0, 0, TAU); g.fill(); g.restore();
    }
    // 左缘竖排 ПАРАМЕТР（海报边铭，模块几何字）
    g.fillStyle = C.ink; g.fillRect(10, 352, 96, 520);
    g.fillStyle = C.cream;
    'ПАРАМЕТР'.split('').forEach((ch, k) => glyph(g, ch, 37, 370 + k * 62, 8.6));
  });

  // ---------- 斜红地面（单独缓存：画在物件之后，好让书/齿轮/电池从地面后方升起） ----------
  const ground = () => P.cached('ct_ground', W, H, (g) => {
    g.fillStyle = C.red; g.beginPath(); g.moveTo(0, 905); g.lineTo(W, 856); g.lineTo(W, H); g.lineTo(0, H); g.closePath(); g.fill();
    g.fillStyle = C.ink; g.beginPath(); g.moveTo(0, 899); g.lineTo(W, 850); g.lineTo(W, 862); g.lineTo(0, 911); g.closePath(); g.fill();
  });

  // ---------- 斜向宣言锥（喇叭形文字锥：一行行墨色字条从黑圆向左上角排开，缓慢外爬） ----------
  const CTIP = [1111, 348], CA = [-0.973, -0.231], CN = [0.231, -0.973];
  function cone(c, lt) {
    const off = (lt * 7.5) % 26;
    c.save(); c.strokeStyle = C.ink; c.lineCap = 'butt'; c.globalAlpha = 0.82;
    for (let r = 0; r < 35; r++) {
      const d = 46 + r * 26 + off; if (d > 950) break;
      const hl = d * 0.194, th = 7.5 + 3.5 * hash(r * 7 + 3, 11);
      c.lineWidth = th; c.beginPath();
      c.moveTo(CTIP[0] + CA[0] * d - CN[0] * hl, CTIP[1] + CA[1] * d - CN[1] * hl);
      c.lineTo(CTIP[0] + CA[0] * d + CN[0] * hl, CTIP[1] + CA[1] * d + CN[1] * hl);
      c.stroke();
    }
    c.restore();
  }

  // ---------- 网点块阵列（放射增殖：离黑圆越远越晚生、越密） ----------
  const SLOT = [[650, 717], [1058, 690], [1666, 409]];            // 三块主角照片的缩位格
  const BLK = [];
  {
    const r = rng(4242); let idx = 0;
    for (let o = -150; o <= 150; o += 150) for (let s = -1200; s <= 600; s += 150) {
      const [x, y] = axP(s, o);
      if (x < 60 || x > 1860 || y < 40 || y > 858) continue;                       // 出画/进地面带的不铺
      if (Math.hypot(x - CC[0], y - CC[1]) < 268) continue;                        // 黑圆底下不铺
      if (SLOT.some(q => Math.hypot(x - q[0], y - q[1]) < 96)) continue;          // 主角格位让出来
      const d = Math.hypot(s, o);
      BLK.push({
        x, y, d, i: idx++,
        born: 3.28 + 2.92 * Math.pow(clamp(d / 1450), 0.8) + r() * 0.05,
        cell: d < 700 ? 11 : d < 1100 ? 9.2 : 7.6,                                // 密度升级：越晚生越密
        red: r() < 0.16, ph: r() * TAU, sd: r() * 40 - 20, st: 0,
      });
    }
    BLK.sort((a, b) => a.born - b.born);
    BLK.forEach((b, k) => { b.st = 7.15 + 0.048 * k; });                          // 拍三「变亮变精」错峰
  }
  const LINKS = [];
  {
    for (const a of BLK) for (const b of BLK) {
      if (b.i <= a.i) continue;
      if (Math.hypot(a.x - b.x, a.y - b.y) < 165) LINKS.push({ a, b, born: Math.max(a.born, b.born) + 0.15 });
    }
  }
  const TRAV = [];
  { const r = rng(889); let n = 0, guard = 0;
    while (n < 3 && guard++ < 400) { const L = LINKS[(r() * LINKS.length) | 0];
      if (L && L.born < 5.6 && Math.hypot(L.a.x - L.b.x, L.a.y - L.b.y) > 120 && !TRAV.some(q => q.L === L)) { TRAV.push({ L, sp: 0.20 + r() * 0.12, ph: r() }); n++; } } }

  // 拍二黑色对角带中心（s=-310 处，长 1740 覆 s -1180..+560）
  const BCTR = axP(-310, 0);
  const bandW = (lt) => 300 * ease.inOut(ss(3.35, 6.45, lt)) + 5 * Math.sin(lt * 0.45);

  function drawBlocks(c, lt) {
    const calm = ss(7.4, 8.6, lt);
    // 剪贴方块（底＋白剪切边＋细墨框）
    for (const b of BLK) {
      if (lt <= b.born) continue;
      const pop = lt - b.born < 0.32 ? Math.max(0.001, ease.outBack(clamp((lt - b.born) / 0.32))) : 1;
      const s = 66 * pop;
      c.fillStyle = b.red ? C.red : C.cream;
      c.fillRect(b.x - s + b.sd * 0.04, b.y - s + b.sd * 0.03, s * 2, s * 2);
    }
    c.save(); c.lineWidth = 3;
    for (const b of BLK) {
      if (lt <= b.born) continue;
      const pop = lt - b.born < 0.32 ? Math.max(0.001, ease.outBack(clamp((lt - b.born) / 0.32))) : 1;
      const s = 66 * pop;
      c.strokeStyle = b.red ? C.ink : C.shear; c.globalAlpha = 0.9;
      c.strokeRect(b.x - s - 3 + b.sd * 0.04, b.y - s - 3 + b.sd * 0.03, s * 2 + 6, s * 2 + 6);
    }
    c.restore();
    // 网点：解析灰度（中心暗→点径大，边缘亮→无点），整片随相位呼吸；拍三收小、每四颗染红（变亮变精）
    const dInk = new Path2D(), dRed = new Path2D(), dCream = new Path2D();
    for (const b of BLK) {
      if (lt <= b.born) continue;
      const pop = lt - b.born < 0.32 ? Math.max(0.001, ease.outBack(clamp((lt - b.born) / 0.32))) : 1;
      const a = ss(b.st, b.st + 0.8, lt);
      const br = 0.9 + 0.13 * Math.sin(lt * 1.5 + b.ph);
      const k = (1 - 0.2 * a) * pop;
      const n = Math.ceil(64 / b.cell);
      for (let j = -n; j <= n; j++) for (let i = -n; i <= n; i++) {
        const px = (i - j) * b.cell * 0.7071 + b.sd * 0.04, py = (i + j) * b.cell * 0.7071 + b.sd * 0.03;   // 45° 网屏
        if (Math.abs(px) > 60 || Math.abs(py) > 60) continue;                                               // 点不溢出剪贴块
        const t = Math.hypot(px, py * 1.12) / (88 * br);
        let L = 0.70 + 0.28 * ss(0.42, 1.02, t) + (px - py) * 0.0022;   // 灰度限在 0.7–0.98：点径最大 0.4·cell，与 45° 网距拉开、不并成实心
        const r = b.cell * 0.74 * Math.sqrt(Math.max(0, 1 - L)) * k;
        if (r < 0.5) continue;
        const x = b.x + px, y = b.y + py;
        const red = a > 0.02 && hash(b.i * 31 + i, j * 17 + 5) < 0.24;                                     // 变亮变精：染红的长点
        const rr = r * (red ? 1.28 : 1);
        const p2 = b.red ? dCream : (red ? dRed : dInk);
        p2.moveTo(x + rr, y); p2.arc(x, y, rr, 0, TAU);
      }
    }
    c.fillStyle = C.ink; c.fill(dInk);
    c.fillStyle = C.red; c.fill(dRed);
    c.fillStyle = C.cream; c.fill(dCream);
    // 拍三：块内描米白内框（描边变亮）
    if (calm > 0.01) { c.save(); c.strokeStyle = C.cream; c.globalAlpha = 0.9 * calm; c.lineWidth = 2.5;
      for (const b of BLK) { if (lt <= b.st + 0.85) continue; c.strokeRect(b.x - 56 + b.sd * 0.04, b.y - 56 + b.sd * 0.03, 112, 112); }
      c.restore(); }
  }

  function drawLinks(c, lt) {
    const calm = ss(7.4, 8.6, lt), a = 0.36 + 0.4 * calm;
    c.save(); c.strokeStyle = C.ink; c.globalAlpha = a; c.lineWidth = 2 + 1.3 * calm;
    if (calm < 0.5) c.setLineDash([10, 8]);
    c.beginPath();
    for (const L of LINKS) { if (lt <= L.born) continue; c.moveTo(L.a.x, L.a.y); c.lineTo(L.b.x, L.b.y); }
    c.stroke(); c.setLineDash([]); c.restore();
    const ta = ss(8.3, 8.7, lt);                                     // 收稳后红点沿线低声流动
    if (ta > 0.01) { c.save(); c.globalAlpha = ta; c.fillStyle = C.red;
      for (const q of TRAV) { const p = ((lt - 8.3) * q.sp + q.ph) % 1;
        c.fillRect(lerp(q.L.a.x, q.L.b.x, p) - 7, lerp(q.L.a.y, q.L.b.y, p) - 7, 14, 14); }
      c.restore(); }
  }

  // ---------- 三块主角照片（拍一特写 → 3.0–4.2 缩位入格；网点＝参数本体，整片呼吸） ----------
  const CARD = [
    { num: '0.73', x: 990, y: 705, rot: -0.06, slot: 0, chip: 1, pop: 0.55, ph: 0.0, neg: 0 },
    { num: '-1.2', x: 1330, y: 730, rot: 0.05, slot: 1, chip: -1, pop: 1.05, ph: 2.1, neg: 1 },
    { num: '2.4', x: 1680, y: 570, rot: -0.04, slot: 2, chip: 1, pop: 1.55, ph: 4.2, neg: 0 },
  ];
  function drawCard(c, cd, lt) {
    const q = clamp((lt - cd.pop) / 0.15); if (q <= 0) return;
    const k = ease.inOut(ss(3.0, 4.2, lt));
    const x = lerp(cd.x, SLOT[cd.slot][0], k), y = lerp(cd.y, SLOT[cd.slot][1], k);
    const bob = Math.sin(lt * 1.3 + cd.ph) * 5 * (1 - k);
    const stamp = lerp(1.42, 1, ease.out(q));
    const sc = (lerp(310, 150, k) / 310) * stamp;
    const a = Math.min(1, q * 2.2);
    const rf = ss(7.3, 8.6, lt);
    c.save(); c.globalAlpha = a;
    c.translate(x, y + bob); c.rotate(lerp(cd.rot, -0.06, k)); c.scale(sc, sc);
    c.strokeStyle = C.shear; c.lineWidth = 13; c.strokeRect(-161, -161, 322, 322);   // 照片白剪切边
    c.fillStyle = C.cream; c.fillRect(-155, -155, 310, 310);
    c.strokeStyle = C.ink; c.lineWidth = 3; c.strokeRect(-155, -155, 310, 310);
    const br = 0.93 + (0.13 * (1 - k) + 0.05 * k) * Math.sin(lt * 1.5 + cd.ph);
    const cell = 12.6, n2 = 11;
    c.fillStyle = C.ink; c.beginPath();
    for (let j = -n2; j <= n2; j++) for (let i = -n2; i <= n2; i++) {
      const px = (i - j) * cell * 0.7071, py = (i + j) * cell * 0.7071;
      if (Math.abs(px) > 148 || Math.abs(py) > 148) continue;
      const t = Math.hypot(px, py * 1.12) / (150 * 1.24 * br);
      let L = 0.72 + 0.26 * ss(0.46, 1.05, t) + (px - py) * 0.0024;   // 同上：网点照片保持「看得见的点」
      const r = cell * 0.92 * Math.sqrt(Math.max(0, 1 - L));
      if (r < 0.5) continue;
      c.moveTo(px + r, py); c.arc(px, py, r, 0, TAU);
    }
    c.fill();
    c.strokeStyle = C.red; c.lineWidth = 5 + 3.5 * rf; c.strokeRect(-161, -161, 322, 322);   // 主角红框（拍三描粗）
    if (rf > 0.02) { c.fillStyle = C.red; c.globalAlpha = a * rf; c.beginPath(); c.arc(0, -6, 9 * rf, 0, TAU); c.fill(); c.globalAlpha = a; }  // 点睛
    const chx = cd.chip * 62, chy = cd.chip * 104;                                   // 数字牌（剪贴照片上的字，Anton）
    const pq = clamp((lt - cd.pop - 0.12) / 0.15);
    if (pq > 0) {
      const ps = lerp(1.35, 1, ease.out(pq));
      c.save(); c.translate(chx, chy); c.scale(ps, ps);
      c.fillStyle = C.shear; c.fillRect(-92, -40, 184, 80);
      c.strokeStyle = C.ink; c.lineWidth = 3; c.strokeRect(-92, -40, 184, 80);
      c.fillStyle = cd.neg ? C.red : C.ink;
      c.font = '62px "Anton-400"'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(cd.num, 0, 2);
      c.restore();
    }
    c.restore();
  }

  // ---------- 红楔（拍一在黑圆边小幅进退；拍二长大成贯穿全幅的主结构；拍三静置微脉） ----------
  function drawWedge(c, lt) {
    const g = ease.inOut(ss(4.0, 6.5, lt));
    const thrust = 46 * (0.5 - 0.5 * Math.cos(TAU * 1.35 * lt)) * (1 - g);
    const tipS = lerp(-252 + thrust, 660, g), baseS = lerp(-640, -1310, g);
    const half = lerp(92, 145, g) + 4 * Math.sin(lt * 0.7) * ss(7.2, 8.4, lt);
    const T = axP(tipS, 0), B1 = axP(baseS, -half), B2 = axP(baseS, half);
    c.save(); c.lineJoin = 'miter';
    c.fillStyle = C.red; c.beginPath(); c.moveTo(T[0], T[1]); c.lineTo(B1[0], B1[1]); c.lineTo(B2[0], B2[1]); c.closePath(); c.fill();
    c.strokeStyle = C.redD; c.lineWidth = 5; c.stroke();
    c.restore();
  }

  // ---------- 黑圆、虚线环、圆顶红弧 ----------
  function drawCircle(c, lt) {
    c.fillStyle = C.ink; c.beginPath(); c.arc(CC[0], CC[1], CR, 0, TAU); c.fill();
    c.save(); c.strokeStyle = C.red; c.lineWidth = 11; c.setLineDash([46, 22]); c.lineDashOffset = -lt * 240;
    c.beginPath(); c.arc(CC[0], CC[1], 262, 0, TAU); c.stroke(); c.restore();
    c.save(); c.strokeStyle = C.red; c.lineCap = 'butt';
    for (let k = 0; k < 4; k++) {
      const ph = (lt * 1.25 + k / 4) % 1, r = 250 + ph * 110;
      c.globalAlpha = (1 - ph) * 0.85; c.lineWidth = 10 - ph * 5;
      c.beginPath(); c.arc(CC[0], CC[1], r, -Math.PI * 0.86, -Math.PI * 0.14); c.stroke();
    }
    c.restore();
  }

  // ---------- 计数牌（米白剪贴牌＋Anton；滚动＋每个数值落定盖章跳；1T+ 红环扩散＝全片唯一重音） ----------
  const CKV = [[3.42, 1.5], [3.98, 1.5], [4.52, 175], [4.98, 175], [5.52, 540], [5.98, 540], [6.52, 1000], [999, 1000]];
  const MILE = [3.42, 4.52, 5.52, 6.52];
  function counterVal(lt) {
    for (let i = 0; i < CKV.length - 1; i++) if (lt >= CKV[i][0] && lt <= CKV[i + 1][0])
      return lerp(CKV[i][1], CKV[i + 1][1], ease.inOut(clamp((lt - CKV[i][0]) / (CKV[i + 1][0] - CKV[i][0]), 0, 1)));
    return lt < 3.42 ? 0 : 1000;
  }
  function drawCounter(c, lt) {
    const a = ss(3.36, 3.62, lt) * (1 - ss(6.95, 7.38, lt));
    if (a <= 0.01) return;
    let hop = 0, pulse = 0;
    for (const m of MILE) { if (lt >= m && lt < m + 0.26) hop = Math.max(hop, -14 * Math.sin((lt - m) / 0.26 * Math.PI)); }
    if (lt >= 6.52) pulse = Math.exp(-Math.max(0, lt - 6.52) * 3.2);
    const v = counterVal(lt);
    const txt = v >= 1000 ? '1T+' : v < 10 ? v.toFixed(1) + 'B' : Math.round(v) + 'B';
    c.save(); c.globalAlpha = a;
    c.translate(430, 800 + hop); c.rotate(-0.105 + 0.012 * Math.sin(lt * 1.3));
    c.scale(1 + 0.10 * pulse, 1 + 0.10 * pulse);
    c.fillStyle = C.cream; c.fillRect(-230, -44, 460, 88);
    c.strokeStyle = C.ink; c.lineWidth = 3.5; c.strokeRect(-230, -44, 460, 88);
    c.fillStyle = C.red; c.fillRect(-206, -11, 22, 22);
    c.fillStyle = C.ink; c.font = '56px "Anton-400"'; c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillText(txt, -172, 2);
    c.restore();
    if (lt > 6.52 && lt < 7.2) {                                    // 1T+ 红环扩散（重音，渐变不跳）
      const ph = (lt - 6.52) / 0.68;
      c.save(); c.strokeStyle = C.red;
      for (let k = 0; k < 2; k++) {
        const q = clamp(ph * 1.15 - k * 0.18); if (q <= 0 || q >= 1) continue;
        c.globalAlpha = (1 - q) * 0.9; c.lineWidth = 10 - q * 6;
        c.beginPath(); c.arc(430, 800, 30 + q * 300, 0, TAU); c.stroke();
      }
      c.restore();
    }
  }

  // ---------- 拍三：三件几何宣传物（红方块书=数据、白齿轮=方法、红黑电池=算力）＋铭牌 ----------
  const BOOKS = () => P.cached('ct_books', 300, 200, (g) => {
    const rows = [
      { y: 152, w: 232, h: 42, c: C.red, rot: -0.025 },
      { y: 110, w: 214, h: 40, c: C.cream, rot: 0.02 },
      { y: 70, w: 220, h: 40, c: C.redD, rot: -0.018 },
      { y: 32, w: 196, h: 38, c: C.cream, rot: 0.022 },
    ];
    g.save(); g.translate(150, 0);
    rows.forEach(r => { g.save(); g.rotate(r.rot);
      g.fillStyle = r.c; g.fillRect(-r.w / 2, r.y, r.w, r.h);
      g.fillStyle = C.shear; g.fillRect(r.w / 2 - 15, r.y + 4, 8, r.h - 8);        // 书口
      g.strokeStyle = C.ink; g.lineWidth = 3; g.strokeRect(-r.w / 2, r.y, r.w, r.h);
      g.restore(); });
    g.restore();
  });
  const OBJ = [
    { key: 'books', x: 480, rise: 7.15, px: 480, py: 655, ldx: 480, ldy: 752, lab: '数据' },
    { key: 'gear', x: 968, rise: 7.5, px: 1140, py: 795, ldx: 1066, ldy: 828, lab: '方法' },
    { key: 'bat', x: 1440, rise: 7.9, px: 1440, py: 655, ldx: 1440, ldy: 726, lab: '算力' },
  ];
  function drawGear(c, x, y, lt) {
    c.save(); c.translate(x, y); c.rotate(lt * 0.55);
    c.fillStyle = C.cream; c.strokeStyle = C.ink; c.lineWidth = 4;
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU;
      c.save(); c.rotate(a); c.fillRect(-13, -104, 26, 36); c.strokeRect(-13, -104, 26, 36); c.restore(); }
    c.beginPath(); c.arc(0, 0, 88, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = C.ink; c.beginPath(); c.arc(0, 0, 58, 0, TAU); c.stroke();
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.4; c.beginPath(); c.arc(Math.cos(a) * 38, Math.sin(a) * 38, 6, 0, TAU); c.fill(); }
    c.fillStyle = C.red; c.fillRect(-17, -17, 34, 34);
    c.restore();
  }
  function drawObjects(c, lt) {
    for (const o of OBJ) {
      const q = clamp((lt - o.rise) / 0.85, 0, 1);
      if (q <= 0) continue;
      const yOff = (1 - ease.outBack(q)) * 180, al = ss(0, 0.25, q);
      c.save(); c.globalAlpha = al;
      if (o.key === 'books') c.drawImage(BOOKS(), o.x - 150, 936 - 200 + yOff);
      if (o.key === 'gear') drawGear(c, o.x, 848 + yOff, lt);
      if (o.key === 'bat') {
        const y = 940 + yOff;
        c.fillStyle = C.ink; c.fillRect(1418, y - 212, 44, 26);
        c.fillStyle = C.red; c.fillRect(1375, y - 186, 130, 186);
        c.strokeStyle = C.ink; c.lineWidth = 4.5; c.strokeRect(1375, y - 186, 130, 186);
        c.fillStyle = C.cream; c.fillRect(1390, y - 170, 100, 152);
        c.strokeStyle = C.ink; c.lineWidth = 3; c.strokeRect(1390, y - 170, 100, 152);
        const lvl = clamp(0.1 + 0.9 * ss(o.rise + 0.05, o.rise + 1.5, lt) + 0.012 * Math.sin(lt * 2.2), 0, 1);   // 电量窗涨满
        const wh = lvl * 152 * 0.94;
        c.fillStyle = C.ink; c.fillRect(1390, y - 18 - wh, 100, wh);
        c.fillStyle = C.red; c.fillRect(1382, y - 26, 14, 6); c.fillRect(1382, y - 76, 14, 6);                     // 电量刻度
      }
      c.restore();
      const la = ss(0.55, 0.85, q);                                                // 铭牌（米白剪贴牌）
      if (la > 0.02) {
        c.save(); c.globalAlpha = la;
        c.strokeStyle = C.ink; c.lineWidth = 2.5;
        c.beginPath(); c.moveTo(o.px, o.py + (o.key === 'bat' ? 26 : 26)); c.lineTo(o.ldx, o.ldy); c.stroke();
        c.translate(o.px, o.py); c.rotate(-0.06 - 0.02 * (o.key === 'gear' ? 1 : 0) + 0.01 * Math.sin(lt * 1.2 + o.rise));
        c.fillStyle = C.cream; c.fillRect(-70, -25, 140, 50);
        c.strokeStyle = C.ink; c.lineWidth = 3; c.strokeRect(-70, -25, 140, 50);
        c.fillStyle = C.red; c.fillRect(-58, -6, 12, 12);
        c.fillStyle = C.ink; c.font = '42px "PuHui-Heavy"'; c.textAlign = 'left'; c.textBaseline = 'middle';
        c.fillText(o.lab, -38, 1);
        c.restore();
      }
    }
  }

  // ---------- 屏上字（每拍一条：字牌逐个盖章＝海报标语块；拍三沿对角线盖印＋波浪跳） ----------
  function captions(c, lt) {
    { // 拍一「参数」：米白字牌压在黑圆顶上
      const a = ss(0.55, 1.15, lt) * (1 - ss(2.75, 3.2, lt));
      [0, 1].forEach(k => {
        const st = 0.55 + k * 0.2, q = clamp((lt - st) / 0.15);
        const s = 168 * lerp(1.42, 1, ease.out(q));
        const aa = a * Math.min(1, q * 2.2);
        c.save(); c.globalAlpha = aa; c.translate(1225 + k * 210, 190 + Math.sin(lt * 1.1 + k) * 3); c.rotate(-0.05 + 0.008 * Math.sin(lt * 0.9 + k * 2)); c.scale(s / 168, s / 168);
        c.fillStyle = C.cream; c.fillRect(-84, -84, 168, 168);
        c.strokeStyle = C.ink; c.lineWidth = 3.5; c.strokeRect(-84, -84, 168, 168);
        c.fillStyle = C.ink; c.font = '132px "PuHui-Black"'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(k ? '数' : '参', 0, 6);
        c.restore();
      });
    }
    { // 拍二「疯狂卷参数」：红字牌一排在下缘（黑带上盖到纸上）
      const a = ss(4.15, 4.75, lt) * (1 - ss(6.6, 7.05, lt));
      '疯狂卷参数'.split('').forEach((ch, k) => {
        const st = 4.15 + k * 0.08, q = clamp((lt - st) / 0.15); if (q <= 0) return;
        const s = lerp(1.4, 1, ease.out(q));
        const hop = -9 * Math.max(0, Math.sin(lt * 7 - k * 0.9)) * 0.35 * (1 - ss(6.2, 6.6, lt));
        c.save(); c.globalAlpha = a * Math.min(1, q * 2.2);
        c.translate(1150 + k * 150, 745 + hop); c.rotate(-0.055); c.scale(s, s);
        c.fillStyle = C.red; c.fillRect(-73, -73, 146, 146);
        c.strokeStyle = C.redD; c.lineWidth = 3.5; c.strokeRect(-73, -73, 146, 146);
        c.fillStyle = C.cream; c.font = '114px "PuHui-Black"'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(ch, 0, 5);
        c.restore();
      });
    }
    { // 拍三「参数之外」：沿对角线逐个盖印，末牌落在黑圆心上；之后整排波浪轻跳（原版标语母题）
      '参数之外'.split('').forEach((ch, k) => {
        const st = 7.45 + k * 0.3, q = clamp((lt - st) / 0.18); if (q <= 0) return;
        const x = 760 + k * 190, y = 610 - k * 89;
        const pop = lerp(1.45, 1, ease.out(q));
        const wave = -9 * Math.max(0, Math.sin(lt * 9 - 0.7 * k)) * ss(8.6, 9.2, lt);
        const last = k === 3;
        c.save(); c.globalAlpha = Math.min(1, q * 2.2);
        c.translate(x, y + wave); c.rotate(-0.44); c.scale(pop, pop);
        c.fillStyle = last ? C.cream : C.red; c.fillRect(-86, -86, 172, 172);
        c.strokeStyle = last ? C.red : C.redD; c.lineWidth = last ? 5 : 3.5; c.strokeRect(-86, -86, 172, 172);
        c.fillStyle = last ? C.ink : C.cream; c.font = '136px "PuHui-Black"'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(ch, 0, 6);
        c.restore();
      });
    }
  }

  // ---------- 镜头：一个连续运镜（近景特写→缓拉远展开→缓推入结构带→停收全貌） ----------
  const CAMK = [[0, 1.10, 1130, 470], [3.0, 1.13, 1150, 480], [4.6, 1.00, 960, 540], [6.2, 1.01, 980, 535], [7.6, 1.02, 985, 530], [10, 1.00, 960, 540]];
  function camAt(lt) {
    if (lt <= CAMK[0][0]) return CAMK[0];
    for (let i = 0; i < CAMK.length - 1; i++) if (lt >= CAMK[i][0] && lt <= CAMK[i + 1][0]) {
      const p = ease.inOut((lt - CAMK[i][0]) / (CAMK[i + 1][0] - CAMK[i][0]));
      return [0, lerp(CAMK[i][1], CAMK[i + 1][1], p), lerp(CAMK[i][2], CAMK[i + 1][2], p), lerp(CAMK[i][3], CAMK[i + 1][3], p)];
    }
    return CAMK[CAMK.length - 1];
  }

  return {
    init() {
      U.assertGlyphs('132px "PuHui-Black"', '参数疯狂卷之外', 's22 屏上字');
      U.assertGlyphs('42px "PuHui-Heavy"', '数据方法算力', 's22 铭牌');
      U.assertGlyphs('62px "Anton-400"', '0123456789.BT+-', 's22 数字牌/计数');
      bg(); ground(); BOOKS();                                       // 预热缓存，首帧也快
    },
    draw(c, lt, t) {
      const [, z, cx, cy] = camAt(lt);
      c.save(); c.translate(cx, cy); c.scale(z, z); c.translate(-cx, -cy);
      c.drawImage(bg(), 0, 0);
      cone(c, lt);
      { // 拍二黑色对角带（背景随密度升级）＋两道红细线
        const w = bandW(lt);
        if (w > 1) {
          c.save(); c.translate(BCTR[0], BCTR[1]); c.rotate(AXA);
          c.fillStyle = C.ink; c.fillRect(-870, -w, 1740, w * 2);
          c.restore();
        }
        const dn = ss(3.6, 6.2, lt);
        if (dn > 0.01) {
          c.save(); c.strokeStyle = C.red; c.globalAlpha = 0.15 + 0.45 * dn; c.lineWidth = 3.5;
          for (const o of [-258, 258]) {
            const A = axP(-1050, o), B = axP(520, o);
            c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.stroke();
          }
          c.restore();
        }
      }
      drawCircle(c, lt);
      drawWedge(c, lt);
      drawBlocks(c, lt);
      drawLinks(c, lt);
      { // 拍三「变亮变精」高光带：一道米白斜光沿对角扫过（只扫结构带）
        const bA = ss(8.0, 8.2, lt) * (1 - ss(8.62, 8.86, lt));
        if (bA > 0.01) {
          const sx = lerp(-950, 950, clamp((lt - 8.0) / 0.8, 0, 1));
          c.save(); c.translate(BCTR[0], BCTR[1]); c.rotate(AXA);
          c.beginPath(); c.rect(-870, -310, 1740, 620); c.clip();
          c.globalAlpha = 0.13 * bA; c.fillStyle = '#fffdf4';
          c.fillRect(sx - 150, -310, 300, 620);
          c.restore();
        }
      }
      for (const cd of CARD) drawCard(c, cd, lt);
      drawCounter(c, lt);
      drawObjects(c, lt);
      c.drawImage(ground(), 0, 0);
      captions(c, lt);
      c.restore();
    },
  };
})();
