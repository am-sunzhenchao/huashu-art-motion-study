// s09_postimp · 梵高《星月夜》×「大模型参数」风格样片（10s 单镜头三拍）。
// 题材构图（不搬速通片的房间）：参数＝夜空里一颗颗可学习的星——
//   拍一 0–3s   三颗大星特写（星旁手写读数 0.73／-1.2／2.4，星周漩涡笔触绕转、放射星芒伸屈），整组缓缓放大端详；
//   拍二 3–7s   星点增殖成星网＋弧线星轨蔓延，序列计数器滚动 1.5B→175B→540B→1T+（1T+ 揭示一次重音），夜色与漩涡随密度加浓；
//   拍三 7–10s  增殖停住；一摞书(数据)／罗盘(方法)／油灯(算力)依次升上地平线归位，星网描金变亮、星点收稳。
// 管线：整幅厚涂底纹（夜空渐变＋月牙＋双层丘陵＋右侧暖赭田＋火焰柏树）用三遍流场笔触重画、P.cached 缓存一次；
//      每帧只画动态层：转动的大漩涡短笔链、星网（增殖＋画线＋描金）、三星特写、计数器、三件物、屏上字。
// 约定：随机全用 U.rng／U.hash 种子（同帧两次渲染逐像素一致）；无角色；中文 LXGWWenKai-500、数字 LilitaOne-400，落笔前 U.assertGlyphs。
SCENES['s09_postimp'] = (() => {
  const W = 1920, H = 1080, TAU = Math.PI * 2;
  const { clamp, lerp, ss, ease } = U, P = PAINT;
  const LINE = '#1c2458';

  // ---------- 区域色板（色值全部来自 references/风格配方/09_postimp.md 卡内色板） ----------
  const SW = {
    skyDeep: P.swatch(['#1b2a78', '#22339a', '#2f4fb8', '#3c6bd0'], 0.42),
    skyLite: P.swatch(['#8fb6ee', '#5c86dc', '#c3cbf6', '#3c6bd0'], 0.42),
    terraG: P.swatch(['#5f8f6a', '#1f7a48', '#2f9a5c', '#3c6bd0', '#22339a'], 0.4),
    terraW: P.swatch(['#c0573c', '#d7774a', '#e08a5c', '#8e3b30', '#5f8f6a'], 0.38),
    cyp: P.swatch(['#1f7a48', '#2f9a5c', '#1b2a78', '#22339a'], 0.5),
    halo: P.swatch(['#f6d84a', '#fbeea0', '#f0c040'], 0.25),
  };

  // ---------- 静态几何 ----------
  const ridge = x => 812 - 44 * Math.sin(x * 0.0021 + 0.6) - 22 * Math.sin(x * 0.0052 + 2.2);   // 近丘丘脊
  const ridge2 = x => ridge(x) - 62 + 16 * Math.sin(x * 0.0031 + 1.2);                          // 远丘丘脊
  const SWR = [{ x: 640, y: 350, r: 205, dir: 1 }, { x: 1330, y: 430, r: 150, dir: -1 }];       // 两团大漩涡
  const FEAT = [                                                                                // 三颗参数大星
    { x: 660, y: 430, n: '0.73', ph: 0 },
    { x: 1210, y: 350, n: '-1.2', ph: 2.1 },
    { x: 950, y: 640, n: '2.4', ph: 4.2 },
  ];
  const MOON = { x: 1760, y: 244, r: 42 };

  // 火焰柏树剪影（左缘，星月夜的签名物）
  function cypPath(g) {
    g.beginPath();
    g.moveTo(150, 882);
    g.bezierCurveTo(108, 762, 152, 700, 106, 622);
    g.bezierCurveTo(82, 560, 140, 520, 102, 452);
    g.bezierCurveTo(78, 390, 132, 340, 110, 282);
    g.bezierCurveTo(92, 222, 138, 180, 126, 128);
    g.bezierCurveTo(150, 112, 172, 148, 160, 206);
    g.bezierCurveTo(188, 262, 160, 322, 192, 390);
    g.bezierCurveTo(212, 452, 172, 520, 206, 590);
    g.bezierCurveTo(232, 662, 184, 732, 224, 816);
    g.bezierCurveTo(240, 850, 212, 882, 150, 882);
    g.closePath();
  }
  // 柏树命中测试（一次性栅格化，避免 bbox 笔触溢出剪影）
  const CYP_HIT = (() => {
    const cv = P.canvas(W, H), g = cv.getContext('2d', { willReadFrequently: true });
    g.fillStyle = '#fff'; cypPath(g); g.fill();
    const d = g.getImageData(0, 0, W, H).data;
    return (x, y) => { const i = (((y | 0) * W) + (x | 0)) * 4 + 3; return x >= 0 && y >= 0 && x < W && y < H && d[i] > 40; };
  })();

  // 底稿（静态，进缓存）：夜空渐变＋月晕月牙＋双层丘陵＋暖赭田块＋柏树
  function baseStatic(g) {
    const sg = g.createLinearGradient(0, 0, 0, 920);
    sg.addColorStop(0, '#1b2a78'); sg.addColorStop(0.45, '#22339a'); sg.addColorStop(1, '#2f4fb8');
    g.fillStyle = sg; g.fillRect(0, 0, W, 940);
    { const hg = g.createRadialGradient(MOON.x, MOON.y, 8, MOON.x, MOON.y, 132);
      hg.addColorStop(0, 'rgba(251,238,160,.9)'); hg.addColorStop(0.35, 'rgba(246,216,74,.4)'); hg.addColorStop(1, 'rgba(246,216,74,0)');
      g.fillStyle = hg; g.beginPath(); g.arc(MOON.x, MOON.y, 132, 0, TAU); g.fill(); }
    g.fillStyle = '#f6d84a'; g.beginPath(); g.arc(MOON.x, MOON.y, MOON.r, 0, TAU); g.fill();
    g.fillStyle = '#2f4fb8'; g.beginPath(); g.arc(MOON.x - 15, MOON.y - 13, MOON.r - 7, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(0, ridge2(0));
    for (let x = 0; x <= W; x += 24) g.lineTo(x, ridge2(x));
    g.lineTo(W, H); g.lineTo(0, H); g.closePath();
    g.fillStyle = '#2f4fb8'; g.fill();
    g.beginPath(); g.moveTo(0, ridge(0));
    for (let x = 0; x <= W; x += 24) g.lineTo(x, ridge(x));
    g.lineTo(W, H); g.lineTo(0, H); g.closePath();
    g.fillStyle = '#1b2a78'; g.fill();
    // 右侧暖赭田块（呼应卡内 floor 暖色系）
    g.save(); g.beginPath(); g.moveTo(0, ridge(0));
    for (let x = 0; x <= W; x += 24) g.lineTo(x, ridge(x));
    g.lineTo(W, H); g.lineTo(0, H); g.closePath(); g.clip();
    const rr = U.rng(88);
    for (let k = 0; k < 5; k++) {
      g.fillStyle = k % 2 ? 'rgba(192,87,60,.5)' : 'rgba(95,143,106,.55)';
      g.beginPath(); g.ellipse(1300 + k * 128, 954 + (k % 2) * 42, 210, 46, (rr() - .5) * 0.3, 0, TAU); g.fill();
    }
    g.restore();
    cypPath(g); g.fillStyle = '#1f7a48'; g.fill();
  }

  // 笔触方向场（静态）：星空绕最近漩涡切线、月晕沿圆周、远处横向波浪；近丘沿丘脊起伏；柏树竖向带火苗摆
  const nearSwirl = (x, y) => {
    let b = SWR[0], bd = Math.hypot(x - SWR[0].x, y - SWR[0].y) / SWR[0].r;
    for (const s of SWR) { const d = Math.hypot(x - s.x, y - s.y) / s.r; if (d < bd) { bd = d; b = s; } }
    return { s: b, d: bd };
  };
  const angleSky = (x, y) => {
    const ns = nearSwirl(x, y);
    if (ns.d < 1.35) return Math.atan2(y - ns.s.y, x - ns.s.x) + Math.PI / 2;
    if (Math.hypot(x - MOON.x, y - MOON.y) < 135) return Math.atan2(y - MOON.y, x - MOON.x) + Math.PI / 2;
    return 0.16 * Math.sin(x * 0.0031 + y * 0.0017) + 0.05 * Math.sin(y * 0.006);
  };
  const angleTerra = x => 0.24 * Math.sin(x * 0.0042 + 1) + 0.1 * Math.sin(x * 0.011);
  const angleCyp = (x, y) => -Math.PI / 2 + 0.34 * Math.sin(y * 0.021 + 1.3);

  // 区域色板：柏树深绿；丘下绿蓝、右侧暖赭；月晕暖黄；漩涡环带亮蓝/深蓝相间（静态的同心环肌理），其余深蓝
  const pal = (x, y, col, r) => {
    if (CYP_HIT(x, y)) return SW.cyp(col, r);
    if (y > ridge(x)) return (x > 1210 && y < ridge(x) + 240) ? SW.terraW(col, r) : SW.terraG(col, r);
    if (Math.hypot(x - MOON.x, y - MOON.y) < 112) return SW.halo(col, r);
    const ns = nearSwirl(x, y);
    if (ns.d < 1.5) { const q = (ns.d * 3.6) % 1; return q < 0.52 ? SW.skyLite(col, r) : SW.skyDeep(col, r); }
    return SW.skyDeep(col, r);
  };

  // ---------- 缓存：整幅厚涂底纹（三遍流场笔触，一次画好；帧内只 drawImage） ----------
  // 每遍笔触从各自的一份底稿画布取色（同一画布多次 getImageData 会触发控制台性能告警，[page] 要归零）
  const IMP = P.cached('s09Imp', W, H, (g) => {
    const bases = ['s09BaseA', 's09BaseB', 's09BaseC'].map(k => {
      const b = P.scratch(k), bg = b.getContext('2d');
      bg.clearRect(0, 0, W, H); baseStatic(bg); return b;
    });
    P.strokes(g, bases[0], { cell: 12, len: 46, width: 7.5, seed: 9, t: 0, boil: 0, outline: 0.85, outlineMix: 0.44,
      angle: angleSky, palette: pal, mask: (x, y) => y < ridge(x) && !CYP_HIT(x, y) });
    P.strokes(g, bases[1], { cell: 11, len: 34, width: 8, seed: 19, t: 0, boil: 0, outline: 0.8, outlineMix: 0.42,
      angle: (x) => angleTerra(x), palette: pal, mask: (x, y) => y >= ridge(x) && !CYP_HIT(x, y) });
    P.strokes(g, bases[2], { cell: 8, len: 24, width: 6, seed: 29, t: 0, boil: 0, outline: 0.7, outlineMix: 0.5,
      angle: angleCyp, palette: pal, mask: (x, y) => CYP_HIT(x, y) });
  });

  // 光晕精灵（星／计数器／三件物共用）
  const GLOW = P.cached('s09Glow', 256, 256, (g) => {
    const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, 'rgba(251,238,160,.9)'); gr.addColorStop(0.35, 'rgba(246,216,74,.34)'); gr.addColorStop(1, 'rgba(246,216,74,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  });

  // ---------- 星场（种子生成；出生时刻按洗牌序列铺满 3.28–6.55，越晚越密） ----------
  const rS = U.rng(4242);
  const STARS = [];
  { let guard = 0;
    while (STARS.length < 168 && guard++ < 5000) {
      const x = 62 + rS() * 1796, yMax = ridge(x) - 42, y = 96 + rS() * Math.max(60, yMax - 96);
      if (x < 314) continue;                                                             // 柏树带
      if (y > yMax) continue;
      if (Math.hypot(x - MOON.x, y - MOON.y) < 162) continue;                             // 月晕
      if (FEAT.some(f => Math.hypot(x - f.x, y - f.y) < 132)) continue;                  // 三星特写
      if (x > 1230 && x < 1770 && y > 762) continue;                                    // 计数器读数区
      if (SWR.some(s => Math.hypot(x - s.x, y - s.y) < 56)) continue;                     // 漩涡中心留白
      if (STARS.some(q => Math.hypot(x - q.x, y - q.y) < 47)) continue;                   // 星距
      STARS.push({ x, y, r: 3.4 + rS() * 6.4, ph: rS() * TAU, sp: 0.8 + rS() * 1.2, warm: rS() < 0.72 });
    }
    const ord = STARS.map((q, i) => ({ i, k: rS() })).sort((a, b) => a.k - b.k);
    ord.forEach((o, n) => { STARS[o.i].birth = 3.28 + 3.27 * Math.pow(n / Math.max(1, ord.length - 1), 0.85) + rS() * 0.05; });
  }

  // ---------- 星轨连线（每颗星连最近的 2 颗，去重；不跨柏树、不入丘陵） ----------
  const CONN = [];
  { const pts = FEAT.map(f => ({ x: f.x, y: f.y, birth: 0 })).concat(STARS);
    const seen = {};
    pts.forEach((p, i) => {
      const cand = [];
      pts.forEach((q, j) => { if (j !== i) { const d = Math.hypot(p.x - q.x, p.y - q.y); if (d < 262) cand.push({ j, d }); } });
      cand.sort((a, b) => a.d - b.d);
      let links = 0;
      for (const cd of cand) {
        const key = i < cd.j ? i * 4096 + cd.j : cd.j * 4096 + i;
        if (seen[key]) continue;
        const b = pts[cd.j], mx = (p.x + b.x) / 2, my = (p.y + b.y) / 2;
        if (mx < 330 || my > ridge(mx) - 26) continue;
        seen[key] = 1;
        CONN.push({ ax: p.x, ay: p.y, bx: b.x, by: b.y, bow: (rS() - 0.5) * 44,
          birth: Math.max(p.birth, b.birth) + 0.16 + rS() * 0.12, ph: rS() * TAU, nx: 0, ny: 0 });
        if (++links >= 2) break;
      }
    });
    CONN.forEach(k2 => { const dx = k2.bx - k2.ax, dy = k2.by - k2.ay, L = Math.hypot(dx, dy) || 1;
      k2.nx = -dy / L; k2.ny = dx / L; });
  }

  // ---------- 屏上字（每拍一条，黄字深蓝投影，微幅手绘摇） ----------
  const CAPS = [
    { txt: '参数', x: 1330, y: 200, size: 150, box: [1290, 36, 1680, 246], a: lt => ss(0.5, 1.15, lt) * (1 - ss(2.7, 3.2, lt)), wob: 0 },
    { txt: '疯狂卷参数', x: 620, y: 206, size: 92, box: [584, 86, 1136, 246], a: lt => ss(3.15, 3.75, lt) * (1 - ss(6.5, 7.0, lt)), wob: 2 },
    { txt: '参数之外', x: 1150, y: 206, size: 118, box: [1116, 56, 1652, 246], a: lt => ss(7.25, 7.95, lt), wob: 4 },
  ];

  // 沿螺旋的短笔链：深蓝描边打底＋圆头彩色短笔逐段排布，随 rot 转动（转得慢，是「活的」不是「闪的」）
  const BAND = ['#8fb6ee', '#5c86dc', '#c3cbf6', '#3c6bd0'];
  const FEATBAND = ['#f6d84a', '#8fb6ee', '#f0c040', '#fbeea0'];
  function chain(c, cx, cy, rr0, rr1, turns, rot, cols, alpha, wBase, seed) {
    const r = U.rng(seed);
    for (let ring = 0; ring < 3; ring++) {
      const base = rr1 - (rr1 - rr0) * (ring / 2), turn = turns - ring * 0.28;
      let prev = null;
      for (let a = 0; a <= Math.PI * turn; a += 0.13) {
        const rad = lerp(base * 0.62, base, a / (Math.PI * turn)), aa = a + rot + ring * 0.55;
        const px = cx + Math.cos(aa) * rad, py = cy + Math.sin(aa) * rad * 0.86;
        if (prev) {
          const wdt = wBase + r() * 5, col = cols[(r() * cols.length) | 0];
          c.strokeStyle = 'rgba(28,36,88,' + (0.5 * alpha) + ')'; c.lineWidth = wdt + 3.2;
          c.beginPath(); c.moveTo(prev[0], prev[1]); c.lineTo(px, py); c.stroke();
          c.strokeStyle = col; c.globalAlpha = alpha; c.lineWidth = wdt;
          c.beginPath(); c.moveTo(prev[0], prev[1]); c.lineTo(px, py); c.stroke(); c.globalAlpha = 1;
        }
        prev = [px, py];
      }
    }
  }

  // 拍二的大漩涡：两团螺旋笔链缓转＋外缘彗形短笔随动；密度越大越亮越宽
  function drawBands(c, lt, t, dn) {
    c.save(); c.lineCap = 'round';
    const gold = ss(7.7, 9.0, lt);
    const pulse = Math.exp(-Math.pow((lt - 6.78) * 3.2, 2));                       // 1T+ 揭示的一次轻脉冲
    const alpha = clamp((0.5 + 0.28 * dn) * (1 + 0.3 * pulse) * (1 - 0.22 * gold) + 0.1, 0, 1);
    const w = 12 + 4 * dn;
    SWR.forEach((s, k) => {
      chain(c, s.x, s.y, s.r * 0.34, s.r * 0.98, 2.5, t * 0.13 * s.dir + k * 1.7, BAND, alpha, w, 70 + k * 17);
      for (let i = 0; i < 7; i++) {
        const a = i / 7 * TAU + t * 0.21 * s.dir, rr2 = s.r * 1.06 + 8 * Math.sin(t * 0.9 + i);
        c.strokeStyle = 'rgba(195,203,246,.55)'; c.lineWidth = 7;
        c.beginPath(); c.arc(s.x, s.y, Math.max(8, rr2), a, a + 0.22); c.stroke();
      }
    });
    c.restore();
  }

  // 星网：弧线星轨蔓延画线（带正弦微颤，拍三描金、颤幅收稳）＋星点（增殖弹出、呼吸明灭、拍三变亮变精）
  function drawNet(c, lt, t, dn) {
    const gold = ss(7.7, 9.0, lt), calm = ss(8.6, 9.7, lt);
    const pulse = Math.exp(-Math.pow((lt - 6.78) * 3.2, 2));
    c.save(); c.lineCap = 'round';
    const baseA = 0.3 + 0.2 * dn, goldA = 0.62 * gold;
    const pts = [];
    for (const k2 of CONN) {
      if (lt <= k2.birth) continue;
      const frac = clamp((lt - k2.birth) / 0.42, 0, 1);
      const mx = (k2.ax + k2.bx) / 2 + k2.bow * 0.9, my = (k2.ay + k2.by) / 2 + k2.bow * 0.35;
      const nSeg = Math.max(2, Math.ceil(10 * frac)), amp = 3.4 * (1 - 0.8 * calm);
      pts.length = 0; pts.push(k2.ax, k2.ay);
      for (let s2 = 1; s2 <= nSeg; s2++) {
        const q = (s2 / 10) * frac, u = 1 - q;
        pts.push(u * u * k2.ax + 2 * u * q * mx + q * q * k2.bx + k2.nx * amp * Math.sin(q * 7 + k2.ph),
                 u * u * k2.ay + 2 * u * q * my + q * q * k2.by + k2.ny * amp * Math.sin(q * 7 + k2.ph));
      }
      c.strokeStyle = 'rgba(92,134,220,' + baseA + ')'; c.lineWidth = 2.6;
      c.beginPath(); c.moveTo(pts[0], pts[1]);
      for (let s2 = 2; s2 < pts.length; s2 += 2) c.lineTo(pts[s2], pts[s2 + 1]);
      c.stroke();
      if (goldA > 0.01) {
        c.globalCompositeOperation = 'lighter';
        c.strokeStyle = 'rgba(246,216,74,' + goldA + ')'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(pts[0], pts[1]);
        for (let s2 = 2; s2 < pts.length; s2 += 2) c.lineTo(pts[s2], pts[s2 + 1]);
        c.stroke(); c.globalCompositeOperation = 'source-over';
      }
    }
    const tight = 1 - 0.28 * gold;                                                 // 拍三：光晕收紧变精
    const dimBoxes = [];
    CAPS.forEach(cp => { if (cp.a(lt) > 0.3) dimBoxes.push(cp.box); });           // 屏上字后面压暗星晕，保字可读
    for (const s of STARS) {
      if (lt <= s.birth) continue;
      const age = lt - s.birth, pop = age < 0.3 ? ease.outBack(clamp(age / 0.3)) : 1;
      const tw = Math.sin(t * s.sp + s.ph);
      const twk = 1 + 0.24 * tw * (1 - 0.65 * calm);
      let hA = (0.2 + 0.18 * dn + 0.24 * gold) * (0.8 + 0.3 * tw) * (1 + 0.35 * pulse);
      let dimmed = false;
      for (const bx of dimBoxes) if (s.x > bx[0] && s.x < bx[2] && s.y > bx[1] && s.y < bx[3]) { dimmed = true; break; }
      if (dimmed) hA *= 0.3;
      const R = s.r * 6 * pop * twk * tight;
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = clamp(hA, 0, 1);
      c.drawImage(GLOW, s.x - R, s.y - R, R * 2, R * 2); c.restore();
      c.fillStyle = s.warm ? '#f6d84a' : '#c3cbf6';
      c.beginPath(); c.arc(s.x, s.y, s.r * pop * twk, 0, TAU); c.fill();
      if (gold > 0.05) { c.fillStyle = '#fbeea0'; c.beginPath(); c.arc(s.x, s.y, s.r * 0.45 * pop, 0, TAU); c.fill(); }
      if (!dimmed && s.r > 7.2) {                                                  // 大星给十字星芒
        c.strokeStyle = s.warm ? 'rgba(246,216,74,.75)' : 'rgba(195,203,246,.75)'; c.lineWidth = 2.2;
        const ln = s.r * (2.1 + 0.5 * tw);
        c.beginPath(); c.moveTo(s.x - ln, s.y); c.lineTo(s.x + ln, s.y); c.moveTo(s.x, s.y - ln); c.lineTo(s.x, s.y + ln); c.stroke();
      }
    }
    c.restore();
  }

  // 三颗参数大星：星核呼吸、放射星芒伸屈、星周金蓝笔链绕转、手写读数；拍一放大端详、拍二退入星网
  function drawFeat(c, lt, t) {
    const fs = lt < 2.8 ? 1 + 0.14 * ss(0, 2.8, lt) : lerp(1.14, 0.62, ease.inOut(clamp((lt - 2.8) / 1.5, 0, 1)));
    const numA = ss(0.7, 1.4, lt) * (1 - ss(3.3, 4.0, lt));
    const ringA = lt < 3 ? 0.8 : 0.8 - 0.35 * ss(3, 5, lt) - 0.2 * ss(7, 8.5, lt);
    const gold = ss(7.7, 9.0, lt);
    FEAT.forEach((f, k) => {
      const tw = 0.85 + 0.15 * Math.sin(t * 2.2 + f.ph);
      const R = 150 * fs * tw;
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.55 + 0.25 * gold;
      c.drawImage(GLOW, f.x - R, f.y - R, R * 2, R * 2); c.restore();
      c.save(); c.lineCap = 'round'; c.translate(f.x, f.y); c.scale(fs, fs); c.rotate(t * 0.07 + k * 0.8);
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * TAU, ln = (46 + 12 * Math.sin(t * 2.6 + f.ph + i * 1.3)) * tw;
        c.strokeStyle = i % 2 ? '#f6d84a' : '#fbeea0'; c.lineWidth = 5;
        c.beginPath(); c.moveTo(Math.cos(a) * 36, Math.sin(a) * 36); c.lineTo(Math.cos(a) * (36 + ln), Math.sin(a) * (36 + ln)); c.stroke();
      }
      c.restore();
      if (ringA > 0.03) chain(c, f.x, f.y, 62 * fs, 128 * fs, 1.9, t * (k % 2 ? -0.4 : 0.34) + k * 2.2, FEATBAND, ringA, 9, 40 + k * 13);
      c.fillStyle = '#f6d84a'; c.beginPath(); c.arc(f.x, f.y, 26 * fs * tw, 0, TAU); c.fill();
      c.fillStyle = '#fbeea0'; c.beginPath(); c.arc(f.x, f.y, (11 + 3 * gold) * fs, 0, TAU); c.fill();
      if (numA > 0.02) {
        c.save(); c.globalAlpha = numA; c.translate(f.x + 92 * fs, f.y + 82 * fs); c.rotate(-0.05 + 0.02 * Math.sin(t * 0.9 + f.ph));
        c.font = Math.round(54 * fs) + 'px "LilitaOne-400"'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
        c.fillStyle = '#1b2a78'; c.fillText(f.n, 4, 5);
        c.fillStyle = '#f6d84a'; c.fillText(f.n, 0, 0);
        c.restore();
      }
    });
  }

  // ---------- 序列计数器：真实滚动 1.5B→175B→540B→1T+（LilitaOne，黄字深蓝投影，星轨下的里程） ----------
  const CK = [[3.30, 0], [3.92, 1.5], [4.18, 1.5], [4.98, 175], [5.08, 175], [5.88, 540], [5.98, 540], [6.78, 1000], [999, 1000]];
  function counterVal(lt) {
    for (let i = 0; i < CK.length - 1; i++)
      if (lt >= CK[i][0] && lt <= CK[i + 1][0])
        return lerp(CK[i][1], CK[i + 1][1], ease.inOut(clamp((lt - CK[i][0]) / (CK[i + 1][0] - CK[i][0]), 0, 1)));
    return lt < 3.3 ? 0 : 1000;
  }
  function drawCounter(c, lt, t) {
    const a = ss(3.3, 3.75, lt) * (1 - ss(7.0, 7.5, lt)); if (a <= 0.01) return;
    const v = counterVal(lt);
    const txt = v >= 1000 ? '1T+' : v < 10 ? v.toFixed(1) + 'B' : Math.round(v) + 'B';
    const pulse = v >= 1000 ? Math.exp(-Math.max(0, lt - 6.78) * 3.2) : 0;
    const pop = 1 + 0.15 * pulse;
    const cx = 1462, cy = 838;
    c.save(); c.globalAlpha = a;
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a * (0.3 + 0.4 * pulse);
    c.drawImage(GLOW, cx - 170, cy - 100 - 170, 340, 340); c.restore();
    c.translate(cx, cy); c.scale(pop, pop);
    c.font = '88px "LilitaOne-400"'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.fillStyle = '#1b2a78'; c.fillText(txt, 5, 7);
    c.fillStyle = '#f6d84a'; c.fillText(txt, 0, 0);
    c.restore();
    if (lt > 6.78 && lt < 7.4) {                                                   // 1T+ 揭示：一圈金环扩散（一次重音）
      const q = (lt - 6.78) / 0.62;
      c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
      c.strokeStyle = 'rgba(246,216,74,' + (0.5 * (1 - q) * a) + ')'; c.lineWidth = 11;
      c.setLineDash([22, 14]); c.lineDashOffset = -t * 66;
      c.beginPath(); c.arc(cx, cy - 34, 42 + q * 175, 0, TAU); c.stroke();
      c.setLineDash([]); c.restore();
    }
  }

  // ---------- 拍三：三件物（书摞=数据、罗盘=方法、油灯=算力），缓存精灵＋动态件 ----------
  const BOOKS = P.cached('s09Books', 260, 232, (g) => {
    const rr = U.rng(311);
    const rows = [
      { y: 196, w: 208, h: 30, c: '#8e3b30', rot: -0.03 },
      { y: 165, w: 196, h: 29, c: '#c0573c', rot: 0.025 },
      { y: 134, w: 205, h: 28, c: '#5f8f6a', rot: -0.02 },
      { y: 104, w: 188, h: 28, c: '#d7774a', rot: 0.035 },
      { y: 75, w: 198, h: 27, c: '#c96a52', rot: -0.028 },
    ];
    g.save(); g.translate(130, 0); g.lineCap = 'round';
    rows.forEach(r => {
      g.save(); g.rotate(r.rot);
      g.fillStyle = r.c; g.fillRect(-r.w / 2, r.y, r.w, r.h);
      g.fillStyle = '#fbeea0'; g.fillRect(r.w / 2 - 15, r.y + 3, 9, r.h - 6);      // 书口
      for (let i = 0; i < 26; i++) {                                              // 封面短笔触
        const x = -r.w / 2 + 6 + rr() * (r.w - 26), y = r.y + 4 + rr() * (r.h - 8);
        g.strokeStyle = P.rgb(P.jitter(P.hex(r.c), rr, 30)); g.lineWidth = 3 + rr() * 2;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + 12 + rr() * 10, y + (rr() - .5) * 3); g.stroke();
      }
      g.strokeStyle = 'rgba(28,36,88,.6)'; g.lineWidth = 3; g.strokeRect(-r.w / 2, r.y, r.w, r.h);
      g.restore();
    });
    g.fillStyle = '#e08a5c'; g.fillRect(-97, 47, 194, 12);                          // 摊开的书
    g.strokeStyle = 'rgba(28,36,88,.6)'; g.lineWidth = 3; g.strokeRect(-97, 47, 194, 12);
    g.fillStyle = '#fbeea0'; g.beginPath(); g.moveTo(-90, 49); g.quadraticCurveTo(0, 20, 90, 49);
    g.lineTo(90, 58); g.quadraticCurveTo(0, 30, -90, 58); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(139,59,48,.55)'; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(0, 30); g.lineTo(0, 58); g.stroke();
    for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-70 + i * 19, 41); g.quadraticCurveTo(-63 + i * 19, 46, -56 + i * 19, 52); g.stroke(); }
    g.restore();
  });
  const COMPASS = P.cached('s09Comp', 244, 252, (g) => {
    const rr = U.rng(509);
    g.save(); g.translate(122, 132); g.lineCap = 'round';
    g.strokeStyle = '#e0a020'; g.lineWidth = 9;                                    // 吊环
    g.beginPath(); g.arc(0, -104, 16, Math.PI * 0.12, Math.PI * 0.88, true); g.stroke();
    g.fillStyle = '#e0a020'; g.beginPath(); g.arc(0, 0, 96, 0, TAU); g.fill();     // 黄铜外圈
    g.fillStyle = '#22339a'; g.beginPath(); g.arc(0, 0, 79, 0, TAU); g.fill();      // 深蓝表盘
    g.fillStyle = 'rgba(195,203,246,.22)'; g.beginPath(); g.arc(-24, -26, 60, 0, TAU); g.fill();   // 玻面反光
    g.strokeStyle = '#f0c040';
    for (let i = 0; i < 24; i++) {                                                 // 刻度
      const a = i / 24 * TAU, long = i % 6 === 0;
      g.lineWidth = long ? 4.5 : 2.5; g.beginPath();
      g.moveTo(Math.cos(a) * (long ? 58 : 66), Math.sin(a) * (long ? 58 : 66));
      g.lineTo(Math.cos(a) * 74, Math.sin(a) * 74); g.stroke();
    }
    for (let i = 0; i < 40; i++) {                                                 // 黄铜环短弧笔触
      const a = rr() * TAU;
      g.strokeStyle = ['#f0c040', '#f6d84a', '#e0a020'][(rr() * 3) | 0]; g.lineWidth = 4 + rr() * 3;
      g.beginPath(); g.arc(0, 0, 88, a, a + 0.16 + rr() * 0.1); g.stroke();
    }
    g.strokeStyle = LINE; g.lineWidth = 4; g.beginPath(); g.arc(0, 0, 100, 0, TAU); g.stroke();
    g.restore();
  });
  const LAMP = P.cached('s09Lamp', 244, 322, (g) => {
    const rr = U.rng(733);
    g.save(); g.translate(122, 0); g.lineCap = 'round';
    g.fillStyle = '#8e3b30'; g.beginPath(); g.moveTo(-38, 292); g.lineTo(38, 292); g.lineTo(56, 316); g.lineTo(-56, 316); g.closePath(); g.fill();
    g.strokeStyle = LINE; g.lineWidth = 3.5; g.stroke();
    g.strokeStyle = '#f0c040'; g.lineWidth = 4.5; g.beginPath(); g.moveTo(-42, 298); g.lineTo(42, 298); g.stroke();
    g.fillStyle = '#e0a020'; g.fillRect(-14, 246, 28, 48);                          // 灯杆
    g.strokeStyle = LINE; g.lineWidth = 3; g.strokeRect(-14, 246, 28, 48);
    g.fillStyle = '#e0a020'; g.beginPath(); g.ellipse(0, 238, 52, 20, 0, 0, TAU); g.fill();   // 油碗
    g.fillStyle = '#f6d84a'; g.beginPath(); g.ellipse(0, 238, 40, 13, 0, 0, TAU); g.fill();
    g.strokeStyle = LINE; g.lineWidth = 3; g.beginPath(); g.ellipse(0, 238, 52, 20, 0, 0, TAU); g.stroke();
    g.beginPath(); g.moveTo(-36, 228); g.lineTo(-25, 116); g.lineTo(25, 116); g.lineTo(36, 228); g.closePath();   // 玻璃罩
    g.fillStyle = 'rgba(139,182,238,.16)'; g.fill();
    g.strokeStyle = '#8fb6ee'; g.lineWidth = 4.5; g.stroke();
    g.fillStyle = '#e0a020'; g.fillRect(-31, 104, 62, 13);                          // 罩顶盖
    g.strokeStyle = LINE; g.lineWidth = 3; g.strokeRect(-31, 104, 62, 13);
    for (let i = 0; i < 22; i++) {                                                 // 玻璃竖笔触
      const x = -30 + rr() * 60, y = 118 + rr() * 100;
      g.strokeStyle = 'rgba(195,203,246,.45)'; g.lineWidth = 2.5 + rr() * 2;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rr() - .5) * 5, y + 14 + rr() * 12); g.stroke();
    }
    for (let i = 0; i < 16; i++) {                                                 // 油碗黄铜短弧笔触
      const a = rr() * Math.PI - Math.PI / 2;
      g.strokeStyle = ['#f0c040', '#f6d84a', '#e0a020'][(rr() * 3) | 0]; g.lineWidth = 3.5 + rr() * 2;
      g.beginPath(); g.arc(0, 238, 46 + rr() * 8, a, a + 0.2 + rr() * 0.12); g.stroke();
    }
    g.restore();
  });
  function flamePath(g, x, y, w, h) {
    g.beginPath(); g.moveTo(x - w, y);
    g.bezierCurveTo(x - w, y - h * 0.42, x - w * 0.4, y - h * 0.62, x, y - h);
    g.bezierCurveTo(x + w * 0.4, y - h * 0.62, x + w, y - h * 0.42, x + w, y);
    g.closePath();
  }
  const OBJ = [
    { key: 'books', x: 470, sprite: BOOKS, sw: 260, sh: 232, sc: 1.42, label: '数据', rise: 7.15 },
    { key: 'compass', x: 900, sprite: COMPASS, sw: 244, sh: 252, sc: 1.38, label: '方法', rise: 7.57 },
    { key: 'lamp', x: 1430, sprite: LAMP, sw: 244, sh: 322, sc: 1.36, label: '算力', rise: 7.99 },
  ];
  function drawObjects(c, lt, t) {
    OBJ.forEach((o, k) => {
      const q = clamp((lt - o.rise) / 0.8, 0, 1); if (q <= 0) return;
      const e = ease.out(q), eb = ease.outBack(q);
      const baseY = ridge(o.x) - 34;
      const y = lerp(baseY + 170, baseY, eb);
      const sc = lerp(o.sc * 0.72, o.sc, e);
      const al = ss(0, 0.3, q);
      const gcy = y - o.sh * 0.55 * sc;
      c.save(); c.globalAlpha = al * (0.55 + 0.12 * Math.sin(t * 1.6 + k * 2));     // 物底暖光晕
      c.globalCompositeOperation = 'lighter';
      c.drawImage(GLOW, o.x - 180, gcy - 180, 360, 360); c.restore();
      c.save(); c.globalAlpha = al; c.translate(o.x, y); c.scale(sc, sc);
      c.drawImage(o.sprite, -o.sw / 2, -o.sh);
      if (o.key === 'compass') {                                                    // 罗盘指针：摆动到停稳
        const tau = lt - o.rise;
        const na = -2.2 + 0.55 * Math.sin(tau * 2.5) * Math.exp(-Math.max(0, tau - 0.3) * 1.1);
        const tx = Math.cos(na) * 70, ty = Math.sin(na) * 70;
        c.fillStyle = '#f6d84a'; c.beginPath(); c.moveTo(tx, ty);
        c.lineTo(Math.cos(na + 2.5) * 12, Math.sin(na + 2.5) * 12); c.lineTo(Math.cos(na - 2.5) * 12, Math.sin(na - 2.5) * 12); c.closePath(); c.fill();
        c.strokeStyle = LINE; c.lineWidth = 2.5; c.stroke();
        c.fillStyle = '#8e3b30'; c.beginPath(); c.moveTo(-tx * 0.62, -ty * 0.62);
        c.lineTo(Math.cos(na + Math.PI + 2.4) * 12, Math.sin(na + Math.PI + 2.4) * 12); c.lineTo(Math.cos(na + Math.PI - 2.4) * 12, Math.sin(na + Math.PI - 2.4) * 12); c.closePath(); c.fill();
        c.fillStyle = '#f0c040'; c.beginPath(); c.arc(0, 0, 9, 0, TAU); c.fill();
        c.strokeStyle = LINE; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 9, 0, TAU); c.stroke();
      }
      if (o.key === 'lamp') {                                                       // 焰苗：噪声摇曳
        const fl = 1 + 0.2 * P.noise(lt * 3.4, 7.7), fw = 1 + 0.28 * P.noise(lt * 2.6, 12.3);
        c.fillStyle = '#8e3b30'; c.fillRect(-2.5, -134, 5, 12);                     // 灯芯
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = al * (0.5 + 0.15 * Math.sin(t * 5 + k));
        c.drawImage(GLOW, -70, -200, 140, 140); c.restore();
        c.fillStyle = '#f6d84a'; flamePath(c, 0, -128, 16 * fw, 50 * fl); c.fill();
        c.fillStyle = '#fbeea0'; flamePath(c, 0, -126, 9 * fw, 30 * fl); c.fill();
      }
      c.restore();
      c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';        // 灯晕环外扩（虚线，随动）
      for (let ring = 0; ring < 3; ring++) {
        const ph = ((t * 0.55 + ring / 3) % 1), r = 40 + ph * 130;
        c.strokeStyle = 'rgba(255,236,140,' + (0.3 * (1 - ph) * al) + ')'; c.lineWidth = 13;
        c.setLineDash([18, 12]); c.lineDashOffset = -t * 55;
        c.beginPath(); c.arc(o.x, gcy, r, 0, TAU); c.stroke();
      }
      c.setLineDash([]); c.restore();
      const la = al * ss(0.5, 0.85, q);                                             // 物旁铭文
      if (la > 0.02) {
        c.save(); c.globalAlpha = la; c.font = '40px "LXGWWenKai-500"'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
        c.fillStyle = '#1b2a78'; c.fillText(o.label, o.x + 2, baseY + 59);
        c.fillStyle = '#f6d84a'; c.fillText(o.label, o.x, baseY + 56);
        c.restore();
      }
    });
  }

  function captions(c, lt, t) {
    CAPS.forEach(cp => {
      const a = cp.a(lt); if (a <= 0.01) return;
      c.save(); c.globalAlpha = a; c.translate(cp.x, cp.y); c.rotate(-0.035 + 0.014 * Math.sin(t * 0.8 + cp.wob));
      c.font = cp.size + 'px "LXGWWenKai-500"'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      c.fillStyle = '#1b2a78'; c.fillText(cp.txt, 6, 8);
      c.fillStyle = '#f6d84a'; c.fillText(cp.txt, 0, 0);
      c.restore();
    });
  }

  return {
    init() {
      U.assertGlyphs('150px "LXGWWenKai-500"', '参数疯狂卷之外数据方法算力', 's09_postimp 屏上字/铭文');
      U.assertGlyphs('88px "LilitaOne-400"', '0123456789.BT+', 's09_postimp 计数器');
    },
    draw(c, lt, t) {
      const dn = clamp((lt - 3.28) / 3.27, 0, 1);                                  // 星网密度
      c.drawImage(IMP, 0, 0);
      { const a = 0.15 * ss(3.2, 6.6, lt);                                         // 拍二：夜色随密度加浓（逐秒缓变）
        if (a > 0.004) { c.fillStyle = 'rgba(27,42,120,' + a + ')'; c.fillRect(0, 0, W, 720); } }
      drawBands(c, lt, t, dn);
      { const ph = (t * 0.5) % 1;                                                  // 月晕脉动（母题小循环）
        c.save(); c.globalCompositeOperation = 'lighter';
        c.strokeStyle = 'rgba(255,236,140,' + (0.26 * (1 - ph)) + ')'; c.lineWidth = 16;
        c.setLineDash([24, 16]); c.lineDashOffset = -t * 52;
        c.beginPath(); c.arc(MOON.x, MOON.y, 58 + ph * 105, 0, TAU); c.stroke();
        c.setLineDash([]); c.restore(); }
      drawNet(c, lt, t, dn);
      drawFeat(c, lt, t);
      { const wa = 0.1 * ss(7.1, 8.6, lt);                                         // 拍三：地平线暖光（灯将亮起）
        if (wa > 0.004) { c.save(); c.globalCompositeOperation = 'lighter';
          const gr = c.createLinearGradient(0, 620, 0, 920);
          gr.addColorStop(0, 'rgba(240,192,64,0)'); gr.addColorStop(0.65, 'rgba(240,192,64,' + wa + ')'); gr.addColorStop(1, 'rgba(240,192,64,0)');
          c.fillStyle = gr; c.fillRect(0, 600, W, 340); c.restore(); } }
      drawCounter(c, lt, t);
      drawObjects(c, lt, t);
      captions(c, lt, t);
    },
  };
})();
