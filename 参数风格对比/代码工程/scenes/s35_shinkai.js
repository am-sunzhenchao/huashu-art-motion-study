// 「大模型参数」新海诚光影样片（s35_shinkai）——纯代码，2016 新海诚式夏末天空大场景。
// 笔法照 35 号卡：极透明蓝天空渐变＋积雨云（蓝灰剪影＋偏向太阳的亮球＋糊 3px / 55% 清层两层，逐团呼吸、整层漂移）
//   ＋丁达尔光柱（缓存模糊楔形 screen，α 呼吸）＋光尘光粒（径向渐变精灵 lighter 闪烁）＋镜头光晕（P.lensFlare）
//   ＋泛光（P.bloom）＋soft-light 冷暖分离；三件物与站牌用 P.cel 赛璐珞两调（太阳右上：阴影带落左下）。
// 构图按「参数」题材重新设计：无人物的夏末天空（积雨云层叠＋城市屋顶电线横列＋前景天台），参数＝云隙光里飘浮的光粒；
//   不搬速通片的房间构图（窗左上、猫左下、少女右端杯）。
// 拍一 0–3s「参数」（缓推近景）：光柱间几颗光粒缓飘，三颗主光粒旁缀 Poppins 白字蓝影小数字 0.73/-1.2/2.4，
//   积雨云翻涌漂移、飞机拉线、小鸟扇翅，站牌白底蓝字立在天台上。
// 拍二 3–7s「疯狂卷参数」（缓拉远）：光粒顺光柱增殖铺满城市上空、连线成网，电线随密度加密、云塔增多、天色加深、屋顶窗点亮，
//   站牌计数白字蓝影滚动 1.5B→175B→540B→1T+，1T+ 时光网一次脉冲发亮（全片唯一重音）。
// 拍三 7–10s「参数之外」（停住微收）：增殖停住；一道斜向扫光依次揭示三件物从天台墙后升起——书堆（数据）、
//   齿轮盘（方法）、路灯（算力）；书页轻翻、齿轮咬合缓转、路灯点亮火苗摇曳；光粒变亮变精（光芯收拢、描金光晕）、
//   光柱收束、网线收稳收尾。
SCENES['s35_shinkai'] = (() => {
  const W = 1920, H = 1080, TAU = Math.PI * 2;
  const { clamp, lerp, ease, rng, ss, seg } = U, P = PAINT;
  const SUN = [1430, 235];
  const LINE = '#3a4a6a';
  const CELOPT = { line: LINE, lw: 2.2, lx: 0.9, ly: -0.5 };       // 太阳右上：阴影带落左下、亮边在受光的右上

  // ---------- 缓存底版：天空渐变 → 卷云淡痕 → 城市雾层 → 远处屋顶两层剪影（比画布大，运镜放大不露边） ----------
  const bg = () => P.cached('s35_bg', 2160, 1240, (g) => {
    const sg = g.createLinearGradient(0, -80, 0, 780);
    sg.addColorStop(0, '#1360d0'); sg.addColorStop(0.42, '#3f9bf0'); sg.addColorStop(0.8, '#a8dcff'); sg.addColorStop(1, '#e4f6ff');
    g.fillStyle = sg; g.fillRect(-120, -80, 2160, 860);
    { const r = rng(51); for (let i = 0; i < 6; i++) {                      // 高层卷云淡痕（透明白抹）
      const y = 90 + r() * 220, x = -60 + r() * 1700, w2 = 240 + r() * 420;
      const cg2 = g.createLinearGradient(0, y - 16, 0, y + 16);
      cg2.addColorStop(0, 'rgba(255,255,255,0)'); cg2.addColorStop(0.5, 'rgba(255,255,255,.16)'); cg2.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = cg2; g.beginPath(); g.moveTo(x, y);
      g.quadraticCurveTo(x + w2 * 0.5, y - 20 - r() * 16, x + w2, y - 4);
      g.quadraticCurveTo(x + w2 * 0.5, y + 18, x, y); g.fill(); } }
    const fog = g.createLinearGradient(0, 740, 0, 872);                     // 城市上空的雾层
    fog.addColorStop(0, 'rgba(168,220,255,0)'); fog.addColorStop(1, 'rgba(130,151,198,.95)');
    g.fillStyle = fog; g.fillRect(-120, 740, 2160, 140);
    g.fillStyle = '#5f7fae';                                                // 远屋顶后层（深雾蓝大块：水塔/箱楼）
    g.beginPath(); g.moveTo(-120, 800);
    [[-60, 700], [140, 700], [150, 668], [330, 668], [340, 700], [560, 700], [575, 640], [700, 640], [715, 720], [920, 720], [940, 688], [1120, 688], [1135, 715], [1360, 715], [1375, 660], [1520, 660], [1530, 705], [1740, 705], [1750, 680], [1900, 680], [2040, 722]].forEach(p => g.lineTo(p[0], p[1]));
    g.lineTo(2040, 824); g.lineTo(-120, 824); g.closePath(); g.fill();
    g.fillStyle = '#7d9cc6';                                                // 远屋顶前层（住宅屋脊，雾蓝）
    g.beginPath(); g.moveTo(-120, 812);
    [[-40, 748], [120, 748], [135, 730], [300, 730], [315, 755], [520, 755], [535, 738], [760, 738], [775, 762], [1000, 762], [1015, 742], [1240, 742], [1255, 760], [1480, 760], [1495, 745], [1700, 745], [1715, 765], [2040, 768]].forEach(p => g.lineTo(p[0], p[1]));
    g.lineTo(2040, 832); g.lineTo(-120, 832); g.closePath(); g.fill();
    { const r = rng(52); g.strokeStyle = '#5f7fae'; g.lineWidth = 3;         // 屋顶电视天线
      for (let i = 0; i < 9; i++) { const x = -60 + r() * 2000, y = 706 + r() * 44;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - .5) * 12, y - 24 - r() * 26); g.stroke(); } }
  });
  // 拍二天色加深层（multiply 只叠天空区，拍三随 b3 回亮）
  const skyDeep = () => P.cached('s35_deep', 2160, 900, (g) => {
    const gd = g.createLinearGradient(0, -80, 0, 780);
    gd.addColorStop(0, '#2b64c8'); gd.addColorStop(0.5, '#6fa8dc'); gd.addColorStop(1, '#a8c8e8');
    g.fillStyle = gd; g.fillRect(-120, -80, 2160, 860);
  });
  // ---------- 光珠精灵 ----------
  const glow = () => P.cached('s35_glow', 64, 64, (g) => {
    const r0 = g.createRadialGradient(32, 32, 0, 32, 32, 30);
    r0.addColorStop(0, 'rgba(255,255,252,.95)'); r0.addColorStop(0.3, 'rgba(235,246,255,.5)'); r0.addColorStop(1, 'rgba(210,232,255,0)');
    g.fillStyle = r0; g.fillRect(0, 0, 64, 64);
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(32, 32, 4.2, 0, TAU); g.fill();
  });
  const goldGlow = () => P.cached('s35_gold', 64, 64, (g) => {
    const r0 = g.createRadialGradient(32, 32, 0, 32, 32, 30);
    r0.addColorStop(0, 'rgba(255,224,150,.55)'); r0.addColorStop(0.45, 'rgba(255,208,120,.26)'); r0.addColorStop(1, 'rgba(255,200,110,0)');
    g.fillStyle = r0; g.fillRect(0, 0, 64, 64);
  });

  // ---------- 积雨云（剪影＋偏向太阳的亮球＋糊/清两层；逐团呼吸、整层漂移；拍二两团新云随密度淡入） ----------
  const cloudBlobs = (() => { const r = rng(808), out = [];
    for (let i = 0; i < 50; i++) { const h = Math.pow(r(), 0.8); const y = 470 - h * 330, w = h > 0.85 ? 330 : lerp(300, 130, h);      // 主塔（太阳左）
      out.push({ x: 1100 + (r() - 0.5) * w * 1.5 + h * 55, y: y + (r() - 0.5) * 34, r: lerp(62, 34, h) * (0.7 + r() * 0.6), ph: r() * 6, d: 0 }); }
    for (let i = 0; i < 14; i++) { const h = Math.pow(r(), 0.85);                                                                      // 左远小塔
      out.push({ x: 330 + (r() - 0.5) * 200, y: 320 - h * 130 + (r() - 0.5) * 24, r: lerp(40, 20, h) * (0.7 + r() * 0.5), ph: r() * 6, d: 0 }); }
    for (let i = 0; i < 16; i++) { const h = Math.pow(r(), 0.85);                                                                      // 拍二右侧新云
      out.push({ x: 1670 + (r() - 0.5) * 230, y: 330 - h * 150 + (r() - 0.5) * 24, r: lerp(44, 22, h) * (0.7 + r() * 0.5), ph: r() * 6, d: 0.12 }); }
    for (let i = 0; i < 12; i++) { const h = Math.pow(r(), 0.9);                                                                       // 拍二中上更新云
      out.push({ x: 730 + (r() - 0.5) * 300, y: 190 - h * 110 + (r() - 0.5) * 20, r: lerp(36, 18, h) * (0.7 + r() * 0.5), ph: r() * 6, d: 0.4 }); }
    return out.sort((a, b) => b.y - a.y); })();
  function clouds(c, lt, t, dens) {
    const drift = t * 10, CL = P.scratch('s35Cloud'), cg = CL.getContext('2d');
    cg.reset(); cg.clearRect(0, 0, W, H);
    const at = (b) => [b.x + drift, b.y - Math.sin(t * 0.8 + b.ph) * 3, b.r * (1 + 0.05 * Math.sin(t * 1.3 + b.ph))];
    cloudBlobs.forEach((b) => { const on = b.d ? clamp((dens - b.d) / 0.3, 0, 1) : 1; if (on <= 0.01) return;
      const [x, y, r] = at(b); const g = cg.createLinearGradient(0, y - r, 0, y + r);
      g.addColorStop(0, '#b7c6e6'); g.addColorStop(1, '#8297c6');
      cg.globalAlpha = on; cg.fillStyle = g; cg.beginPath(); cg.arc(x, y, r, 0, TAU); cg.fill(); });
    cloudBlobs.forEach((b) => { const on = b.d ? clamp((dens - b.d) / 0.3, 0, 1) : 1; if (on <= 0.01) return;
      const [x, y, r] = at(b); const ox = x + r * 0.22, oy = y - r * 0.3, rr = r * 0.82;
      const g = cg.createRadialGradient(ox + rr * 0.3, oy - rr * 0.3, rr * 0.05, ox, oy, rr);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.6, '#f6f8ff'); g.addColorStop(0.9, '#e2e9fa'); g.addColorStop(1, 'rgba(226,233,250,0)');
      cg.globalAlpha = on; cg.fillStyle = g; cg.beginPath(); cg.arc(ox, oy, rr, 0, TAU); cg.fill(); });
    cg.globalAlpha = 1;
    c.save(); c.filter = 'blur(3px)'; c.drawImage(CL, 0, 0); c.restore();
    c.globalAlpha = 0.55; c.drawImage(CL, 0, 0); c.globalAlpha = 1;
  }

  // ---------- 丁达尔光柱（缓存模糊楔形，screen，α 呼吸；拍三随 b3 收束） ----------
  const beams = () => P.cached('s35_beams', W, H, (g) => { g.filter = 'blur(18px)';
    [[1330, 250, 1390, 240, 640, 1015, 400, 1025, 0.30], [1435, 262, 1472, 252, 870, 1000, 680, 1012, 0.22],
     [1265, 238, 1312, 232, 250, 1000, 90, 1012, 0.24], [1540, 286, 1568, 276, 1270, 1010, 1080, 1020, 0.18]].forEach(([a, b, c2, d, e, f, gx, h, al]) => {
      const lg = g.createLinearGradient(a, b, e, f); lg.addColorStop(0, `rgba(255,240,205,${al})`); lg.addColorStop(1, 'rgba(255,240,205,0)');
      g.fillStyle = lg; g.beginPath(); g.moveTo(a, b); g.lineTo(c2, d); g.lineTo(e, f); g.lineTo(gx, h); g.closePath(); g.fill(); }); });
  function beamsDraw(c, t, dens, b3) {
    c.save(); c.globalCompositeOperation = 'screen';
    c.globalAlpha = clamp((0.75 + 0.25 * Math.sin(t * 3.4)) * (0.85 + 0.4 * dens) * (1 - 0.35 * b3), 0, 1);
    c.drawImage(beams(), 0, 0); c.globalAlpha = 1; c.restore();
  }

  // ---------- 光粒群（预生成 210 颗：光柱走廊＋全天空散布；出生时刻铺在 3.05–6.05s；近邻连线成网） ----------
  const SWARM = (() => { const r = rng(3535), pts = [];
    for (let i = 0; i < 210; i++) {
      let bx, by;
      if (r() < 0.55) { const q = r(); bx = lerp(1430, 380, q) + (r() - 0.5) * 300; by = lerp(300, 880, q * q) + (r() - 0.5) * 130; }   // 光柱走廊
      else { bx = r() * 2000 - 40; by = 110 + Math.pow(r(), 1.4) * 700; }                                                               // 全天空散布
      if (by > 760) by = 760 - r() * 70;                                                                                               // 不压到屋顶带
      pts.push({ bx, by, ph: r() * TAU, ph2: r() * TAU, s: 0.55 + r() * 0.75, tb: 3.05 + r() * 3.0 });
    }
    const links = [];
    for (let i = 0; i < pts.length; i++) { const near = [];
      for (let j = 0; j < pts.length; j++) { if (i === j) continue;
        const d = Math.hypot(pts[i].bx - pts[j].bx, pts[i].by - pts[j].by); if (d < 165) near.push([d, j]); }
      near.sort((a, b) => a[0] - b[0]);
      for (let k = 0; k < Math.min(3, near.length); k++) { const j = near[k][1]; if (i < j) links.push([i, j]); } }
    return { pts, links }; })();
  const seedPos = (s, t, b3) => { const wob = 1 - 0.5 * b3;                        // 拍三网络收稳：漂移减半
    return [s.bx + Math.sin(t * 0.33 + s.ph) * 24 * wob, s.by + Math.sin(t * 0.21 + s.ph2) * 18 * wob - 6 * Math.sin(t * 0.17 + s.ph)]; };
  function motes(c, lt, t, b3, pulse) {
    const pos = SWARM.pts.map(s => seedPos(s, t, b3));
    const born = SWARM.pts.map(s => ss(s.tb, s.tb + 0.4, lt));
    const la = (0.20 * ss(3.8, 5.6, lt) + 0.10 * pulse) * (1 - 0.45 * b3);          // 网线：拍三收稳
    if (la > 0.012) { c.save(); c.globalCompositeOperation = 'screen';
      c.strokeStyle = `rgba(205,232,255,${clamp(la, 0, 0.42)})`; c.lineWidth = 1.2; c.beginPath();
      SWARM.links.forEach(([i, j]) => { if (born[i] > 0.5 && born[j] > 0.5) { c.moveTo(pos[i][0], pos[i][1]); c.lineTo(pos[j][0], pos[j][1]); } });
      c.stroke(); c.restore(); }
    c.save(); c.globalCompositeOperation = 'lighter';
    SWARM.pts.forEach((s, i) => { const bn = born[i]; if (bn <= 0.01) return;
      const pop = ease.outBack(bn);
      const breathe = 1 + 0.14 * Math.sin(t * 2.8 + s.ph) * (1 - 0.5 * b3);
      const sz = 26 * s.s * pop * breathe * (1 - 0.30 * b3);                        // 拍三：光芯收拢变小
      const al = clamp((0.40 + 0.22 * Math.sin(t * 3.3 + s.ph2)) * (0.45 + 0.55 * bn) * (1 + 0.65 * b3 + 0.9 * pulse), 0, 1);
      c.globalAlpha = al; c.drawImage(glow(), pos[i][0] - sz, pos[i][1] - sz, sz * 2, sz * 2);
      if (b3 > 0.03) { c.globalAlpha = clamp(0.55 * b3 * bn + 0.25 * pulse * b3, 0, 1);       // 拍三：描金光晕
        c.drawImage(goldGlow(), pos[i][0] - sz * 1.8, pos[i][1] - sz * 1.8, sz * 3.6, sz * 3.6); } });
    c.restore(); c.globalAlpha = 1;
  }

  // ---------- 拍一的三颗主光粒（带数字；拍二乘风升空融入光粒群） ----------
  const HERO = [
    { x: 760, y: 480, num: '0.73', ph: 0.0, nx: 100, ny: -22 },
    { x: 990, y: 565, num: '-1.2', ph: 2.1, nx: 108, ny: 16 },
    { x: 1210, y: 470, num: '2.4', ph: 4.2, nx: 96, ny: -22 },
  ];
  function heroes(c, lt, t) {
    const lift = clamp(seg(lt, 2.95, 4.3), 0, 1), q = ease.inOut(lift);
    const numA = ss(0.3, 0.7, lt) * (1 - ss(2.95, 3.3, lt));
    HERO.forEach((h) => {
      const tx = h.x + 42 * q + Math.sin(t * 0.9 + h.ph) * 10 * (1 - q * 0.6);
      const ty = h.y - 330 * q + Math.sin(t * 1.1 + h.ph) * 8 * (1 - q * 0.6) - 20 * Math.sin(Math.PI * q);
      const sc = (1 + 0.1 * Math.sin(t * 2.2 + h.ph)) * (1 - 0.42 * q);
      const a = 1 - ss(0.85, 1, lift);
      if (a > 0.01) { c.save(); c.globalAlpha = a; c.globalCompositeOperation = 'lighter';
        c.drawImage(glow(), tx - 52 * sc, ty - 52 * sc, 104 * sc, 104 * sc);
        c.globalAlpha = a * (0.55 + 0.25 * Math.sin(t * 5 + h.ph));                 // 内核亮脉
        c.drawImage(glow(), tx - 24 * sc, ty - 24 * sc, 48 * sc, 48 * sc);
        c.restore(); }
      if (numA > 0.01) {                                                            // 白字蓝影小数字（新海诚字幕）
        const nx = h.x + h.nx, ny = h.y + h.ny;
        c.save(); c.globalAlpha = numA;
        c.font = '44px "Poppins-600"'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.shadowColor = 'rgba(30,48,110,.55)'; c.shadowOffsetX = 2.5; c.shadowOffsetY = 3;
        c.fillStyle = '#ffffff'; c.fillText(h.num, nx, ny); c.restore(); }
    });
  }

  // ---------- 电线杆与电线（逆光剪影；基础 5 根，拍二加密 4 根；电线微风摆） ----------
  const POLE_X = [130, 600, 1170, 1790];
  const WIRE_Y = [572, 590, 606, 624, 642];
  const WIRE_NY = [580, 598, 616, 634];
  function poles(c, t, dens) {
    c.fillStyle = '#3d4f78';
    POLE_X.forEach((x) => {
      c.fillRect(x - 7, 550, 14, 244);
      c.fillRect(x - 54, 566, 108, 8); c.fillRect(x - 42, 618, 84, 7);
      for (let k = 0; k < 3; k++) c.fillRect(x - 44 + k * 44, 557, 3, 10);
      for (let k = 0; k < 2; k++) c.fillRect(x - 30 + k * 60, 609, 3, 10);
      c.beginPath(); c.moveTo(x - 7, 550); c.lineTo(x, 539); c.lineTo(x + 7, 550); c.closePath(); c.fill(); });
    c.strokeStyle = 'rgba(42,58,96,.85)'; c.lineWidth = 1.7; c.lineCap = 'round';
    const wire = (y0, k, al) => { const sway = Math.sin(t * 1.6 + k * 1.3) * 2.5;
      c.save(); c.globalAlpha = al;
      const stops = [-160, 130, 600, 1170, 1790, 2080];
      for (let i = 0; i < stops.length - 1; i++) { const a = stops[i], b = stops[i + 1];
        const ha = (i === 0 || i === stops.length - 2) ? y0 + 22 : y0;              // 出画面端略高
        c.beginPath(); c.moveTo(a, ha);
        c.quadraticCurveTo((a + b) / 2, y0 + 34 + sway + (i % 2) * 8, b, ha); c.stroke(); }
      c.restore(); };
    WIRE_Y.forEach((y, k) => wire(y, k, 1));
    if (dens > 0.01) WIRE_NY.forEach((y, k) => wire(y, k + 5, dens * 0.9));
    c.beginPath(); c.moveTo(1790, 552); c.lineTo(2080, 472); c.stroke();          // 斜拉线
    c.beginPath(); c.moveTo(130, 552); c.lineTo(-160, 502); c.stroke();
  }
  // 屋顶窗点（城市机房上灯，随密度亮起，前几扇微闪）
  const WINDOWS = (() => { const r = rng(70), out = [];
    for (let i = 0; i < 46; i++) out.push({ x: r() * 2000 - 40, y: 692 + r() * 96, w: 5 + r() * 5, h: 7 + r() * 6, fl: r() < 0.2 });
    return out; })();
  function windows(c, dens, t) {
    if (dens <= 0.01) return;
    WINDOWS.forEach((w2, i) => { const al = 0.8 * dens * (w2.fl ? 0.72 + 0.28 * Math.sin(t * 4.2 + i * 1.7) : 1);
      c.fillStyle = `rgba(255,214,140,${clamp(al, 0, 0.85)})`; c.fillRect(w2.x, w2.y, w2.w, w2.h); });
  }

  // ---------- 前景天台：女儿墙（872–932）＋混凝土台面（932 以下），台面上有光柱落斑 ----------
  const ROOFWALL = U.poly([[-140, 872], [2060, 872], [2060, 932], [-140, 932]]);
  const ROOFTOP = U.poly([[-140, 932], [2060, 932], [2060, 1140], [-140, 1140]]);
  function roof(c) {
    P.cel(c, ROOFTOP, '#c3cddd', '#a4b2c8', '#e8eef8', { ...CELOPT, sd: 26, lw: 0 });
    P.cel(c, ROOFWALL, '#a8b4cc', '#8494b4', null, { ...CELOPT, sd: 14, lw: 0 });
    c.fillStyle = '#eef2fa'; c.fillRect(-140, 868, 2200, 5);                       // 墙顶受光亮线
    c.strokeStyle = 'rgba(90,105,135,.4)'; c.lineWidth = 2;                         // 台面伸缩缝
    [-140, 400, 960, 1520, 2060].forEach(x => { c.beginPath(); c.moveTo(x, 932); c.lineTo(x + 90, 1140); c.stroke(); });
    c.strokeStyle = 'rgba(90,105,135,.28)'; c.beginPath(); c.moveTo(-140, 1024); c.lineTo(2060, 1024); c.stroke();
  }
  function roofPool(c, t, b3) {                                                      // 光柱落在台面上的暖光斑
    c.save(); c.globalCompositeOperation = 'screen'; c.filter = 'blur(12px)';
    const fl = 0.75 + 0.25 * Math.sin(t * 3.4);
    c.fillStyle = `rgba(255,238,200,${0.26 * fl * (1 - 0.4 * b3)})`;
    c.beginPath(); c.moveTo(660, 940); c.lineTo(1150, 940); c.lineTo(1400, 1090); c.lineTo(830, 1090); c.closePath(); c.fill();
    c.restore();
  }

  // ---------- 拍三三件物：书堆（数据）、齿轮盘（方法）、路灯（算力）——依次从天台墙后升起 ----------
  function objects(c, lt, t, b3) {
    const rise = (t0) => ({ p: ease.out(clamp(seg(lt, t0, t0 + 1.05), 0, 1)), a: ss(t0 - 0.05, t0 + 0.4, lt) });
    { const { p, a } = rise(7.15); if (a > 0.01) { c.save(); c.globalAlpha = a; c.translate(0, (1 - p) * 245);   // 一摞书
      c.fillStyle = `rgba(30,42,74,${0.28 * p})`; c.beginPath(); c.ellipse(620, 936, 96, 10, 0, 0, TAU); c.fill();
      const BOOKS = [[176, 30, '#3d5a8e', '#27375f'], [162, 26, '#c94f4a', '#8e3030'], [150, 24, '#f2ecdc', '#c2baa4'], [138, 21, '#2c3a66', '#1b2446']];
      let y = 932; const r = rng(735);
      BOOKS.forEach(([w2, h2, base, shade]) => { const ox = (r() - 0.5) * 10;
        const bk = U.poly([[620 - w2 / 2 + ox, y - h2], [620 + w2 / 2 + ox, y - h2], [620 + w2 / 2 + ox - 3, y], [620 - w2 / 2 + ox + 3, y]]);
        P.cel(c, bk, base, shade, null, { ...CELOPT, sd: 12, lw: 2 });
        c.fillStyle = '#fdf6e4'; c.fillRect(620 + w2 / 2 + ox - 15, y - h2 + 4, 9, h2 - 8);
        y -= h2; });
      const fq = (t * 0.55) % 1, pg = Math.sin(Math.PI * fq);                       // 顶页轻翻
      c.save(); c.translate(578, y + 3); c.rotate(-pg * 0.9);
      c.fillStyle = 'rgba(253,246,228,.95)'; c.fillRect(0, -6, 86, 10); c.restore();
      c.restore(); } }
    { const { p, a } = rise(7.6); if (a > 0.01) { c.save(); c.globalAlpha = a; c.translate(0, (1 - p) * 245);   // 齿轮盘
      c.fillStyle = `rgba(30,42,74,${0.28 * p})`; c.beginPath(); c.ellipse(985, 936, 92, 10, 0, 0, TAU); c.fill();
      P.cel(c, U.poly([[958, 780], [994, 780], [988, 932], [942, 932]]), '#8ea2c4', '#6a80a8', '#d4e0f0', { ...CELOPT, sd: 14 });   // 支架
      c.save(); c.translate(960, 786); c.rotate(t * 0.5);                                                            // 大齿轮缓转
      const gear1 = new Path2D();
      for (let k = 0; k < 12; k++) { const ang = k / 12 * TAU;
        gear1.moveTo(Math.cos(ang - 0.11) * 54, Math.sin(ang - 0.11) * 54); gear1.lineTo(Math.cos(ang + 0.11) * 54, Math.sin(ang + 0.11) * 54);
        gear1.lineTo(Math.cos(ang + 0.16) * 68, Math.sin(ang + 0.16) * 68); gear1.lineTo(Math.cos(ang - 0.16) * 68, Math.sin(ang - 0.16) * 68); gear1.closePath(); }
      gear1.moveTo(62, 0); gear1.arc(0, 0, 62, 0, TAU);
      P.cel(c, gear1, '#f8d681', '#d8a050', '#fff6d6', { ...CELOPT, sd: 16, rw: 6 });
      c.strokeStyle = '#b8863e'; c.lineWidth = 6; c.beginPath(); c.arc(0, 0, 40, 0, TAU); c.stroke();
      for (let k = 0; k < 4; k++) { const aa = k / 4 * TAU; c.beginPath(); c.moveTo(Math.cos(aa) * 12, Math.sin(aa) * 12); c.lineTo(Math.cos(aa) * 40, Math.sin(aa) * 40); c.stroke(); }
      c.fillStyle = '#2c3a66'; c.beginPath(); c.arc(0, 0, 12, 0, TAU); c.fill();
      c.fillStyle = '#fff6d6'; c.beginPath(); c.arc(0, 0, 4, 0, TAU); c.fill();
      c.restore();
      c.save(); c.translate(1039, 852); c.rotate(-t * 0.5 * 62 / 41 + 0.39);                                          // 小齿轮咬合反向（齿距与大轮一致）
      const gear2 = new Path2D();
      for (let k = 0; k < 8; k++) { const ang = k / 8 * TAU;
        gear2.moveTo(Math.cos(ang - 0.14) * 33, Math.sin(ang - 0.14) * 33); gear2.lineTo(Math.cos(ang + 0.14) * 33, Math.sin(ang + 0.14) * 33);
        gear2.lineTo(Math.cos(ang + 0.21) * 41, Math.sin(ang + 0.21) * 41); gear2.lineTo(Math.cos(ang - 0.21) * 41, Math.sin(ang - 0.21) * 41); gear2.closePath(); }
      gear2.moveTo(39, 0); gear2.arc(0, 0, 39, 0, TAU);
      P.cel(c, gear2, '#f8d681', '#d8a050', '#fff6d6', { ...CELOPT, sd: 10, rw: 4 });
      c.fillStyle = '#2c3a66'; c.beginPath(); c.arc(0, 0, 9, 0, TAU); c.fill();
      c.restore(); c.restore(); } }
    { const { p, a } = rise(8.05); if (a > 0.01) { c.save(); c.globalAlpha = a; c.translate(0, (1 - p) * 245);   // 路灯
      c.fillStyle = `rgba(30,42,74,${0.28 * p})`; c.beginPath(); c.ellipse(1430, 936, 46, 8, 0, 0, TAU); c.fill();
      P.cel(c, U.poly([[1424, 668], [1436, 668], [1436, 932], [1424, 932]]), '#8ea2c4', '#6a80a8', '#d4e0f0', { ...CELOPT, sd: 20, lw: 1.8 });
      c.save(); c.translate(1430, 668); c.rotate(Math.sin(t * 1.8) * 0.01);                                          // 灯臂轻晃
      P.cel(c, U.poly([[-14, -10], [78, -26], [81, -18], [-14, -2]]), '#8ea2c4', '#6a80a8', null, { ...CELOPT, sd: 8, lw: 1.6 });
      P.cel(c, U.poly([[62, -52], [98, -52], [102, -24], [58, -24]]), '#aebacc', '#8494b4', '#e8eef8', { ...CELOPT, sd: 12, lw: 1.8 });
      const fl = 0.62 + 0.16 * Math.sin(t * 7.3) + 0.08 * Math.sin(t * 13.7) + 0.3 * b3;                              // 灯火摇曳（拍三更旺）
      c.fillStyle = `rgba(255,246,214,${clamp(0.55 + 0.35 * b3, 0, 0.95)})`; c.beginPath(); c.arc(82, -32, 8, 0, TAU); c.fill();
      c.globalCompositeOperation = 'lighter';
      P.pool(c, 82, -34, 130, '255,214,140', clamp(0.30 * fl * b3, 0, 0.7));
      P.pool(c, 82, -34, 44, '255,244,190', clamp(0.55 * fl * b3, 0, 0.9));
      c.restore(); c.restore(); } }
  }
  // 拍三斜向扫光：从左下向右上一道柔光带依次掠过三件物
  function sweep(c, lt) {
    const q = seg(lt, 7.0, 9.0); if (q <= 0) return;
    const e = ease.inOut(q), x = lerp(150, 2060, e);
    c.save(); c.globalCompositeOperation = 'screen'; c.filter = 'blur(10px)';
    c.fillStyle = `rgba(255,246,220,${0.38 * Math.sin(Math.PI * q)})`;
    c.beginPath(); c.moveTo(x - 170, 1000); c.lineTo(x + 60, 1000); c.lineTo(x + 260, 550); c.lineTo(x + 30, 550); c.closePath(); c.fill();
    c.restore();
  }

  // ---------- 站牌（新海诚式白底蓝字站名牌；屏上字都长在牌面上） ----------
  const countStr = (lt) => {
    if (lt < 3.5) return '1.5B';
    if (lt < 4.95) { const v = 1.5 * Math.pow(175 / 1.5, seg(lt, 3.5, 4.95)); return (v < 10 ? v.toFixed(1) : Math.round(v)) + 'B'; }
    if (lt < 6.32) { const v = 175 * Math.pow(540 / 175, seg(lt, 4.95, 6.32)); return Math.round(v) + 'B'; }
    return '1T+'; };
  function sign(c, lt, t, pulse) {
    const rock = Math.sin(t * 1.3) * 0.006;                                          // 轻摆
    c.save(); c.translate(250, 932); c.rotate(rock); c.translate(-250, -932);
    P.cel(c, U.poly([[243, 812], [257, 812], [257, 932], [243, 932]]), '#5a6a8e', '#43536f', '#a8b4cc', { ...CELOPT, sd: 10, lw: 1.8 });
    const plate = U.poly([[140, 700], [360, 700], [360, 820], [140, 820]]);
    P.cel(c, plate, '#fbfbfe', '#c6d0e6', '#ffffff', { ...CELOPT, sd: 10, lw: 0 });
    c.strokeStyle = '#2c3a66'; c.lineWidth = 4; c.stroke(plate);
    c.fillStyle = '#2c3a66'; c.fillRect(140, 700, 220, 14);                           // 顶蓝带＋铆钉（站名牌样式）
    c.fillStyle = '#7d92c0'; [156, 344].forEach(x => { c.beginPath(); c.arc(x, 707, 3.2, 0, TAU); c.fill(); });
    const aT = ss(0.15, 0.55, lt) * (1 - ss(2.95, 3.25, lt));                         // 「参数」
    if (aT > 0.01) { c.save(); c.globalAlpha = aT; c.font = '64px "PuHui-Bold"'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.shadowColor = 'rgba(43,66,138,.3)'; c.shadowOffsetX = 2; c.shadowOffsetY = 3;
      c.fillStyle = '#1b2446'; c.fillText('参数', 250, 770); c.restore(); }
    const aC = ss(3.45, 3.75, lt) * (1 - ss(6.9, 7.15, lt));                           // 翻动的计数
    if (aC > 0.01) { const str = countStr(lt), roll = ss(3.5, 3.7, lt) * (1 - ss(6.32, 6.52, lt));
      c.save(); c.globalAlpha = aC; c.font = '54px "Poppins-600"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#1b2446';
      c.shadowColor = 'rgba(43,66,138,.3)'; c.shadowOffsetX = 2; c.shadowOffsetY = 3;
      const chs = [...str], ws = chs.map(ch => c.measureText(ch).width + 5), tot = ws.reduce((s2, w2) => s2 + w2, 0);
      let x = 250 - tot / 2;
      chs.forEach((ch, i) => { c.fillText(ch, x + ws[i] / 2, 770 + Math.sin(lt * 24 + i * 2.1) * 2.6 * roll); x += ws[i]; });
      c.restore(); }
    const aE = ss(7.35, 7.75, lt);                                                     // 「参数之外」
    if (aE > 0.01) { c.save(); c.globalAlpha = aE; c.font = '46px "PuHui-Bold"'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.shadowColor = 'rgba(43,66,138,.3)'; c.shadowOffsetX = 2; c.shadowOffsetY = 3;
      c.fillStyle = '#1b2446'; c.fillText('参数之外', 250, 770); c.restore(); }
    if (pulse > 0.03) { c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = 0.4 * pulse;   // 1T+ 牌面暖闪
      c.fillStyle = 'rgba(255,236,180,.8)'; c.fillRect(140, 700, 220, 120); c.restore(); }
    c.restore();
  }

  // ---------- 小配角：飞机拉线（一次性横穿，不循环）＋三只小鸟扇翅 ----------
  function plane(c, t) {
    const px = -160 + t * 96, py = 148 - (px + 160) * 0.012;
    const tg = c.createLinearGradient(px - 270, 0, px, 0);
    tg.addColorStop(0, 'rgba(255,255,255,0)'); tg.addColorStop(1, 'rgba(255,255,255,.85)');
    c.strokeStyle = tg; c.lineWidth = 3; c.beginPath(); c.moveTo(px - 270, py + 12); c.lineTo(px, py); c.stroke();
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(px + 3, py, 2.5, 0, TAU); c.fill();
  }
  function birds(c, t) {
    for (let k = 0; k < 3; k++) { const bx = 190 + t * 46 + k * 30, by = 318 + k * 13 + Math.sin(t * 2.6 + k) * 5, f = Math.sin(t * 14 + k * 2) * 5;
      c.strokeStyle = '#3a4a6a'; c.lineWidth = 2; c.beginPath(); c.moveTo(bx - 8, by - f); c.lineTo(bx, by); c.lineTo(bx + 8, by - f); c.stroke(); }
  }

  return {
    init() {
      U.assertGlyphs('64px "PuHui-Bold"', '参数疯狂卷之外', 's35_shinkai 站牌字');
      U.assertGlyphs('54px "Poppins-600"', '0.73-1.2 2.4 1.5B 175B 540B 1T+', 's35_shinkai 数字与计数');
    },
    draw(c, lt, t) {
      const dens = ss(3.2, 6.2, lt), b3 = ss(6.9, 8.4, lt);
      const pulse = Math.sin(Math.PI * seg(lt, 6.32, 6.85));                          // 1T+ 揭示：天网一次脉冲（唯一重音）
      // 运镜：近景缓推端详光粒 → 缓拉远看全天空 → 停住微收全貌（整支一个连续思路）
      let z, cx, cy;
      if (lt < 3) { const q = ease.inOut(lt / 3); z = 1 + 0.09 * q; cx = lerp(960, 850, q); cy = lerp(560, 545, q); }
      else if (lt < 7) { const q = ease.inOut((lt - 3) / 4); z = 1.09 - 0.09 * q; cx = lerp(850, 960, q); cy = lerp(545, 525, q); }
      else { const q = ease.inOut((lt - 7) / 3); z = 1 + 0.035 * q; cx = 960; cy = lerp(525, 540, q); }
      c.save(); c.translate(cx, cy); c.scale(z, z); c.translate(-cx, -cy);
      c.drawImage(bg(), -120, -80);
      if (dens > 0.01) {                                                              // 拍二天色加深（只乘天空区，拍三回亮）
        c.save(); c.beginPath(); c.rect(-120, -80, 2160, 950); c.clip();
        c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.42 * dens * (1 - 0.5 * b3);
        c.drawImage(skyDeep(), -120, -80); c.restore(); }
      clouds(c, lt, t, dens);
      windows(c, dens, t);
      beamsDraw(c, t, dens, b3);
      motes(c, lt, t, b3, pulse);
      heroes(c, lt, t);
      if (pulse > 0.02) {                                                             // 天网脉冲光
        c.save(); c.globalCompositeOperation = 'screen';
        const pg = c.createRadialGradient(960, 420, 120, 960, 420, 1050);
        pg.addColorStop(0, `rgba(255,246,200,${0.32 * pulse})`); pg.addColorStop(1, 'rgba(255,246,200,0)');
        c.fillStyle = pg; c.fillRect(0, 0, W, H); c.restore(); }
      poles(c, t, dens);
      plane(c, t);
      birds(c, t);
      roof(c);
      roofPool(c, t, b3);
      objects(c, lt, t, b3);
      sweep(c, lt);
      sign(c, lt, t, pulse);
      P.lensFlare(c, SUN, t);                       // 镜头光晕（画在相机内：跟场景里的太阳一起缩放平移）
      c.restore();
      // 镜头层：泛光 → soft-light 冷暖分离（新海诚的高光暖/暗部蓝）
      P.bloom(c, { key: 's35_bloom' });
      c.save(); c.globalCompositeOperation = 'soft-light';
      const tg2 = c.createLinearGradient(0, 0, W, H);
      tg2.addColorStop(0, 'rgba(255,220,170,.35)'); tg2.addColorStop(1, 'rgba(80,120,220,.35)');
      c.fillStyle = tg2; c.fillRect(0, 0, W, H); c.restore();
    },
  };
})();
