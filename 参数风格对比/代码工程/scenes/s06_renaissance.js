// s06_renaissance · 文艺复兴晕涂（达芬奇式手稿）×「大模型参数」风格样片（10s 单镜头三拍）。
// 题材构图（不搬速通片的房间）：一页达芬奇式手稿——参数＝机械注记旁的小数字点。
//   拍一 0–3s   圆规双圈里的三颗参数点（手写注记 0.73／-1.2／2.4），水痕碎光微闪，整组缓推放大端详；
//   拍二 3–7s   注记繁衍成齿轮-杆件机械网络（齿轮缓转、星标缓摆、连线蔓延），扑翼机小样扇翅掠过（=数据包），
//               页角编号计数器滚动 1.5B→175B→540B→1T+（一次轻脉冲），墨色随密度加深；
//   拍三 7–10s  增殖停住；厚书(数据)／黄铜分规(方法)／油灯(算力)依次升上量尺线归位，一道神光斜扫过纸面收稳，
//               参数点描金变亮、齿轮减速、网络收稳。
// 管线：静态羊皮纸页（暗桌/做旧/幽灵草图/量尺/光池）一次画好并整层 blur 1.3px＝sfumato 底；
//      每帧动态墨层画进 scratch，主画面以 blur(1.6px) 全不透明＋α0.82 清晰层两遍合成＝晕涂；
//      罩层（暗角＋黄釉＋画布经纬＋油彩短笔＋龟裂）缓存，一次 drawImage。
// 约定：随机全用 U.rng 种子（同帧两次渲染逐像素一致）；无角色；中文 LXGWWenKai-500、
//      数字 CormorantGaramond-500／注记 500i，落笔前 U.assertGlyphs；所有文字避开 y>880。
SCENES['s06_renaissance'] = (() => {
  const W = 1920, H = 1080, TAU = Math.PI * 2;
  const { clamp, lerp, ss, ease } = U, P = PAINT;
  const R_ = (sd) => U.rng(sd);
  const INK = '#4e3210', INK_D = '#3a2410';

  // ---------- 页面与母题几何（世界坐标） ----------
  const PAGE = { x: 150, y: 70, w: 1620, h: 940 };
  const FEAT = [                                                              // 三颗参数点
    { x: 700, y: 540, n: '0.73', ph: 0, ox: 74, oy: 96 },
    { x: 1040, y: 470, n: '-1.2', ph: 2.1, ox: 74, oy: 96 },
    { x: 560, y: 720, n: '2.4', ph: 4.2, ox: -86, oy: -112 },
  ];
  const RIVER = [[250, 792], [620, 718], [980, 798], [1340, 722], [1700, 782]];   // 淡水痕（碎光流线）

  // ---------- 静态：暗桌＋羊皮纸手稿页（做旧/幽灵草图/量尺/光池），整层 blur 1.3px ＝ sfumato 底 ----------
  function pageBase(g) {
    g.fillStyle = '#221208'; g.fillRect(0, 0, W, H);                          // 暗桌
    const dg = g.createLinearGradient(0, 0, 0, H);
    dg.addColorStop(0, 'rgba(0,0,0,.35)'); dg.addColorStop(0.5, 'rgba(0,0,0,0)'); dg.addColorStop(1, 'rgba(0,0,0,.4)');
    g.fillStyle = dg; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(8,4,1,.6)'; g.fillRect(PAGE.x - 16, PAGE.y - 12, PAGE.w + 32, PAGE.h + 30);   // 纸页投影
    g.fillStyle = 'rgba(8,4,1,.45)'; g.fillRect(PAGE.x - 9, PAGE.y - 7, PAGE.w + 18, PAGE.h + 20);
    const pg = g.createLinearGradient(PAGE.x, PAGE.y, PAGE.x + PAGE.w, PAGE.y + PAGE.h);               // 羊皮纸底
    pg.addColorStop(0, '#d9c9a2'); pg.addColorStop(0.55, '#b89c6f'); pg.addColorStop(1, '#97784d');
    g.fillStyle = pg; g.fillRect(PAGE.x, PAGE.y, PAGE.w, PAGE.h);
    const r = R_(11);
    for (let k = 0; k < 620; k++) {                                           // 纸纹纤维
      const x = PAGE.x + r() * PAGE.w, y = PAGE.y + r() * PAGE.h;
      g.fillStyle = r() < 0.5 ? 'rgba(255,244,214,.15)' : 'rgba(96,64,30,.10)';
      g.fillRect(x, y, 1 + r() * 2.5, 1 + r() * 1.4);
    }
    for (let k = 0; k < 9; k++) {                                             // 水渍大斑
      const x = PAGE.x + r() * PAGE.w, y = PAGE.y + r() * PAGE.h, rad = 50 + r() * 170;
      const st = g.createRadialGradient(x, y, rad * 0.2, x, y, rad);
      st.addColorStop(0, 'rgba(112,72,36,.10)'); st.addColorStop(0.75, 'rgba(112,72,36,.05)'); st.addColorStop(1, 'rgba(112,72,36,0)');
      g.fillStyle = st; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    g.strokeStyle = 'rgba(118,74,38,.12)'; g.lineWidth = 2.5;                 // 潮线弧
    for (let k = 0; k < 4; k++) { const x = PAGE.x + r() * PAGE.w, y = PAGE.y + r() * PAGE.h, rad = 60 + r() * 130;
      g.beginPath(); g.arc(x, y, rad, r() * TAU, r() * TAU + 1.2 + r() * 2.4); g.stroke(); }
    // 四边烧旧
    const eb = 110, eCol = 'rgba(74,44,18,';
    const eT = g.createLinearGradient(0, PAGE.y, 0, PAGE.y + eb); eT.addColorStop(0, eCol + '.32)'); eT.addColorStop(1, eCol + '0)');
    const eB = g.createLinearGradient(0, PAGE.y + PAGE.h, 0, PAGE.y + PAGE.h - eb); eB.addColorStop(0, eCol + '.38)'); eB.addColorStop(1, eCol + '0)');
    const eL = g.createLinearGradient(PAGE.x, 0, PAGE.x + eb, 0); eL.addColorStop(0, eCol + '.30)'); eL.addColorStop(1, eCol + '0)');
    const eR = g.createLinearGradient(PAGE.x + PAGE.w, 0, PAGE.x + PAGE.w - eb, 0); eR.addColorStop(0, eCol + '.34)'); eR.addColorStop(1, eCol + '0)');
    g.fillStyle = eT; g.fillRect(PAGE.x, PAGE.y, PAGE.w, eb); g.fillStyle = eB; g.fillRect(PAGE.x, PAGE.y + PAGE.h - eb, PAGE.w, eb);
    g.fillStyle = eL; g.fillRect(PAGE.x, PAGE.y, eb, PAGE.h); g.fillStyle = eR; g.fillRect(PAGE.x + PAGE.w - eb, PAGE.y, eb, PAGE.h);
    g.strokeStyle = 'rgba(90,60,26,.55)'; g.lineWidth = 2;                    // 页框细线
    g.strokeRect(PAGE.x + 6, PAGE.y + 6, PAGE.w - 12, PAGE.h - 12);
    // 幽灵草图：淡墨圆规弧、气动螺旋、翼膜、淡齿轮、速记线簇（stroke-only，无字）
    g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = 'rgba(78,50,16,.13)'; g.lineWidth = 3;
    [[1500, 400, 300, 0.3, 2.2], [400, 660, 240, 2.4, 4.6], [1180, 880, 170, 1.1, 3.4]].forEach(function (ar) {
      g.beginPath(); g.arc(ar[0], ar[1], ar[2], ar[3], ar[4]); g.stroke();
      g.beginPath(); g.arc(ar[0], ar[1], ar[2] * 0.82, ar[3] + 0.2, ar[4] - 0.1); g.stroke();
    });
    g.lineWidth = 2.6;                                                        // 气动螺旋淡影
    { const cx0 = 330, cy0 = 255;
      for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(cx0, cy0 + 60 - i * 44, 86 - i * 15, 22 - i * 3.6, 0, 0, TAU); g.stroke(); }
      g.beginPath(); g.moveTo(cx0, cy0 + 120); g.lineTo(cx0, cy0 - 130); g.stroke();
      g.beginPath(); g.moveTo(cx0 - 60, cy0 + 128); g.lineTo(cx0, cy0 + 158); g.lineTo(cx0 + 60, cy0 + 128); g.stroke(); }
    { const cx0 = 1610, cy0 = 760;                                            // 翼膜淡影
      for (let i = 0; i < 5; i++) { const a = -0.5 - i * 0.28;
        g.beginPath(); g.moveTo(cx0, cy0); g.lineTo(cx0 + Math.cos(a) * 150, cy0 + Math.sin(a) * 150); g.stroke(); }
      g.beginPath(); g.arc(cx0, cy0, 150, -1.9, -0.45); g.stroke(); }
    { const cx0 = 1250, cy0 = 860; g.lineWidth = 2.4;                         // 淡齿轮圈
      g.beginPath(); g.arc(cx0, cy0, 210, 0, TAU); g.stroke();
      for (let i = 0; i < 14; i++) { const a = i / 14 * TAU;
        g.beginPath(); g.moveTo(cx0 + Math.cos(a) * 210, cy0 + Math.sin(a) * 210); g.lineTo(cx0 + Math.cos(a) * 232, cy0 + Math.sin(a) * 232); g.stroke(); } }
    g.lineWidth = 2.2;                                                        // 速记线簇（远看是笔迹）
    for (let k = 0; k < 9; k++) {
      const x = PAGE.x + 40 + r() * (PAGE.w - 220), y = PAGE.y + 40 + r() * (PAGE.h - 160), n = 3 + (r() * 3 | 0), wd = 60 + r() * 120;
      for (let i = 0; i < n; i++) { const yy = y + i * 9;
        g.beginPath(); g.moveTo(x, yy); g.lineTo(x + wd * (0.72 + r() * 0.3), yy + (r() - 0.5) * 2); g.stroke(); }
    }
    // 量尺（拍三仪器的站台）：主线＋刻度＋端标
    g.strokeStyle = 'rgba(62,38,14,.7)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(230, 818); g.lineTo(1710, 818); g.stroke();
    g.lineWidth = 2; g.strokeStyle = 'rgba(62,38,14,.5)';
    for (let x = 230; x <= 1710; x += 38) { const tall = ((x - 230) / 38) % 5 === 0;
      g.beginPath(); g.moveTo(x, 818); g.lineTo(x, 818 - (tall ? 16 : 8)); g.stroke(); }
    g.beginPath(); g.moveTo(230, 804); g.lineTo(230, 832); g.stroke();
    g.beginPath(); g.moveTo(1710, 804); g.lineTo(1710, 832); g.stroke();
    g.strokeStyle = 'rgba(96,108,80,.20)'; g.lineWidth = 2.4;                 // 淡水痕流线
    g.beginPath(); g.moveTo(RIVER[0][0], RIVER[0][1]);
    for (let i = 1; i < RIVER.length; i++) g.lineTo(RIVER[i][0], RIVER[i][1]);
    g.stroke();
    g.save(); g.globalCompositeOperation = 'soft-light';                     // 左上暖光池
    const lp = g.createRadialGradient(640, 360, 60, 640, 380, 940);
    lp.addColorStop(0, 'rgba(255,232,180,.85)'); lp.addColorStop(1, 'rgba(255,232,180,0)');
    g.fillStyle = lp; g.fillRect(0, 0, W, H); g.restore();
    const top = g.createLinearGradient(0, 0, 0, 780);                         // 顶部压暗（卡内做法）
    top.addColorStop(0, 'rgba(12,7,3,.32)'); top.addColorStop(0.5, 'rgba(12,7,3,0)'); top.addColorStop(1, 'rgba(12,7,3,.12)');
    g.fillStyle = top; g.fillRect(0, 0, W, H);
  }
  const STATIC = () => P.cached('s06_page', W, H, function (g) {
    const raw = P.canvas(), rg = raw.getContext('2d');
    pageBase(rg);
    g.filter = 'blur(1.3px)'; g.drawImage(raw, 0, 0); g.filter = 'none';
  });

  // ---------- 罩层：暗角＋黄釉＋画布经纬＋油彩短笔＋龟裂（缓存，一次 drawImage） ----------
  const OVER = () => P.cached('s06_over', W, H, function (g) {
    const v = g.createRadialGradient(880, 500, 320, 920, 560, 1280);
    v.addColorStop(0, 'rgba(20,10,4,0)'); v.addColorStop(0.55, 'rgba(20,10,4,.28)'); v.addColorStop(1, 'rgba(10,5,2,.78)');
    g.fillStyle = v; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(150,110,40,.07)'; g.fillRect(0, 0, W, H);             // 黄釉
    const r = R_(4); g.lineWidth = 1;
    for (let y = 0; y < H; y += 3) { g.strokeStyle = 'rgba(0,0,0,' + (0.028 + r() * 0.038) + ')';
      g.beginPath(); g.moveTo(0, y + .5); g.lineTo(W, y + .5); g.stroke(); }
    for (let x = 0; x < W; x += 3) { g.strokeStyle = 'rgba(255,240,210,' + (0.014 + r() * 0.026) + ')';
      g.beginPath(); g.moveTo(x + .5, 0); g.lineTo(x + .5, H); g.stroke(); }
    g.lineCap = 'round';                                                      // 油彩短笔肌理
    for (let k = 0; k < 6000; k++) { const x = r() * W, y = r() * H, a = r() * Math.PI, L = 10 + r() * 16;
      g.strokeStyle = r() < 0.5 ? 'rgba(255,235,200,.02)' : 'rgba(20,10,0,.025)'; g.lineWidth = 5 + r() * 5;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }
    g.globalAlpha = 0.30; g.drawImage(P.craquelure('s06', 0.55), 0, 0);       // 龟裂＋亮边
    g.globalAlpha = 0.15; g.globalCompositeOperation = 'lighter'; g.filter = 'brightness(0) invert(1)';
    g.drawImage(P.craquelure('s06', 0.55), 1, 1); g.filter = 'none';
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  });

  // ---------- 光晕精灵 ----------
  const GLOW = () => P.cached('s06_glow', 256, 256, function (g) {
    const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, 'rgba(240,206,140,.9)'); gr.addColorStop(0.35, 'rgba(216,176,104,.32)'); gr.addColorStop(1, 'rgba(216,176,104,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  });

  // ---------- 齿轮精灵 ×2（墨线齿轮：外圈＋齿辐＋内圈＋辐条＋轴毂） ----------
  function gearSprite(key, teeth) {
    return P.cached(key, 240, 240, function (g) {
      const R0 = 96, hh = 18;
      g.save(); g.translate(120, 120); g.lineJoin = 'round'; g.lineCap = 'round';
      g.fillStyle = 'rgba(150,110,60,.14)'; g.beginPath(); g.arc(0, 0, R0, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(78,50,16,.88)'; g.lineWidth = 5.8;
      g.beginPath(); g.arc(0, 0, R0, 0, TAU); g.stroke();
      g.lineWidth = 3.8;
      for (let i = 0; i < teeth; i++) { const a = i / teeth * TAU;
        g.beginPath(); g.moveTo(Math.cos(a) * R0, Math.sin(a) * R0); g.lineTo(Math.cos(a) * (R0 + hh), Math.sin(a) * (R0 + hh)); g.stroke(); }
      g.lineWidth = 3.6; g.beginPath(); g.arc(0, 0, R0 * 0.60, 0, TAU); g.stroke();
      for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.4;
        g.beginPath(); g.moveTo(Math.cos(a) * R0 * 0.18, Math.sin(a) * R0 * 0.18); g.lineTo(Math.cos(a) * R0 * 0.60, Math.sin(a) * R0 * 0.60); g.stroke(); }
      g.fillStyle = 'rgba(78,50,16,.75)'; g.beginPath(); g.arc(0, 0, 11, 0, TAU); g.fill();
      g.restore();
    });
  }
  const GEAR_A = () => gearSprite('s06_gearA', 14);
  const GEAR_B = () => gearSprite('s06_gearB', 20);

  // ---------- 机械元素（齿轮／注记星标）与连线：种子生成，出生时刻铺满 3.25–6.6 ----------
  const rE = U.rng(606);
  const ELEM = [];
  { let guard = 0;
    while (ELEM.length < 84 && guard++ < 9000) {
      const x = 240 + rE() * 1460, y = 135 + rE() * 545;                      // 页面上中部；量尺舞台不带机械
      if (y > 680) continue;
      if (FEAT.some(function (f) { return Math.hypot(x - f.x, y - f.y) < 150; })) continue;   // 参数点留白
      if (x < 724 && y < 410) continue;                                       // 拍二屏上字带
      if (x > 870 && x < 1355 && y < 240) continue;                           // 拍三屏上字带
      if (x < 475 && y > 655) continue;                                       // 计数器页角
      let near = false;
      for (let i = 0; i < ELEM.length; i++) if (Math.hypot(x - ELEM[i].x, y - ELEM[i].y) < 80) { near = true; break; }
      if (near) continue;
      const gear = rE() < 0.62;
      ELEM.push({ x: x, y: y, gear: gear ? (rE() < 0.5 ? 0 : 1) : -1, r: gear ? 23 + rE() * 21 : 15 + rE() * 12,
        ph: rE() * TAU, spd: (rE() < 0.5 ? -1 : 1) * (0.35 + rE() * 0.8), birth: 0 });
    }
    const ord = ELEM.map(function (q, i) { return { i: i, k: rE() }; }).sort(function (a, b) { return a.k - b.k; });
    ord.forEach(function (o, n) { ELEM[o.i].birth = 3.25 + 3.35 * Math.pow(n / Math.max(1, ord.length - 1), 0.9) + rE() * 0.05; });
  }
  const CONN = [];
  { const pts = FEAT.map(function (f) { return { x: f.x, y: f.y, birth: 0 }; }).concat(ELEM);
    const seen = {};
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], cand = [];
      for (let j = 0; j < pts.length; j++) if (j !== i) { const d = Math.hypot(p.x - pts[j].x, p.y - pts[j].y); if (d < 270) cand.push({ j: j, d: d }); }
      cand.sort(function (a, b) { return a.d - b.d; });
      let links = 0;
      for (let c = 0; c < cand.length; c++) {
        const cd = cand[c], key = i < cd.j ? i * 4096 + cd.j : cd.j * 4096 + i;
        if (seen[key]) continue;
        seen[key] = 1;
        const b = pts[cd.j];
        CONN.push({ ax: p.x, ay: p.y, bx: b.x, by: b.y, bow: (rE() - 0.5) * 26,
          birth: Math.max(p.birth, b.birth) + 0.18 + rE() * 0.1, ph: rE() * TAU, nx: 0, ny: 0 });
        if (++links >= 2) break;
      }
    }
    for (let i = 0; i < CONN.length; i++) { const k2 = CONN[i], dx = k2.bx - k2.ax, dy = k2.by - k2.ay, L = Math.hypot(dx, dy) || 1;
      k2.nx = -dy / L; k2.ny = dx / L; }
  }

  // ---------- 神光（缓存一次大模糊，每帧 screen 叠加＋浮尘） ----------
  const BEAMP = (function () { const p = new Path2D(); p.moveTo(1330, -80); p.lineTo(1700, 30); p.lineTo(1560, 1160); p.lineTo(480, 1160); p.closePath(); return p; })();
  const BEAMC = () => P.cached('s06_beam', W, H, function (g) {
    const bg = g.createLinearGradient(1560, 0, 1100, 1080);
    bg.addColorStop(0, 'rgba(255,228,170,0)'); bg.addColorStop(0.25, 'rgba(255,228,170,.30)'); bg.addColorStop(1, 'rgba(255,228,170,.08)');
    g.filter = 'blur(26px)'; g.fillStyle = bg; g.fill(BEAMP); g.filter = 'none';
  });

  // ---------- 三件仪器（拍三）：书摞=数据、黄铜分规=方法、油灯=算力（缓存精灵＋动态件） ----------
  const BOOKS = () => P.cached('s06_books', 300, 268, function (g) {
    const rr = U.rng(311);
    const rows = [
      { y: 226, w: 262, h: 36, c: '#5c2418', rot: -0.022 },
      { y: 192, w: 244, h: 34, c: '#7c3a1e', rot: 0.028 },
      { y: 160, w: 252, h: 32, c: '#7a4a26', rot: -0.024 },
      { y: 130, w: 230, h: 30, c: '#4a2c16', rot: 0.02 },
    ];
    g.save(); g.translate(150, 0); g.lineCap = 'round';
    rows.forEach(function (rw) {
      g.save(); g.rotate(rw.rot);
      g.fillStyle = rw.c; g.fillRect(-rw.w / 2, rw.y, rw.w, rw.h);
      g.fillStyle = '#c9a24a'; g.fillRect(rw.w / 2 - 13, rw.y + 3, 9, rw.h - 6);          // 书口描金
      g.strokeStyle = 'rgba(46,26,10,.8)'; g.lineWidth = 3; g.strokeRect(-rw.w / 2, rw.y, rw.w, rw.h);
      for (let k2 = 0; k2 < 14; k2++) {                                                   // 封面旧痕短笔
        const x = -rw.w / 2 + 8 + rr() * (rw.w - 30), y = rw.y + 5 + rr() * (rw.h - 10);
        g.strokeStyle = rr() < 0.5 ? 'rgba(255,234,190,.10)' : 'rgba(30,14,4,.16)'; g.lineWidth = 3 + rr() * 3;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + 16 + rr() * 16, y + (rr() - .5) * 4); g.stroke();
      }
      g.restore();
    });
    g.fillStyle = '#8a5a26'; g.fillRect(-102, 96, 204, 22);                                // 最上面摊开的速查册
    g.strokeStyle = 'rgba(46,26,10,.8)'; g.lineWidth = 3; g.strokeRect(-102, 96, 204, 22);
    g.fillStyle = '#e8dcbc'; g.beginPath(); g.moveTo(-94, 99); g.quadraticCurveTo(0, 74, 94, 99);
    g.lineTo(94, 113); g.quadraticCurveTo(0, 88, -94, 113); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(139,89,48,.55)'; g.lineWidth = 2.2;
    g.beginPath(); g.moveTo(0, 88); g.lineTo(0, 113); g.stroke();
    for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(-78 + i * 18, 92 + Math.abs(i - 2)); g.quadraticCurveTo(-72 + i * 18, 96, -66 + i * 18, 100); g.stroke(); }
    g.strokeStyle = '#7c1818'; g.lineWidth = 5;                                            // 书签红绳
    g.beginPath(); g.moveTo(-46, 96); g.quadraticCurveTo(-30, 60, -44, 44); g.stroke();
    g.restore();
  });
  const DIVID = () => P.cached('s06_div', 140, 310, function (g) {
    g.save(); g.translate(70, 0); g.lineCap = 'round';
    const leg = function (dir) {                                                          // 黄铜细锥腿（墨描边压住纸底）
      g.beginPath(); g.moveTo(0, 40); g.quadraticCurveTo(dir * 14, 170, dir * 30, 292);
      g.strokeStyle = 'rgba(40,22,6,.85)'; g.lineWidth = 13; g.stroke();
      g.strokeStyle = '#b98e3e'; g.lineWidth = 9; g.stroke();
      g.strokeStyle = 'rgba(30,16,4,.8)'; g.lineWidth = 3; g.stroke();
      g.fillStyle = '#8a6a2e'; g.beginPath(); g.moveTo(dir * 30, 292); g.lineTo(dir * 34, 302); g.lineTo(dir * 26, 300); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(30,16,4,.8)'; g.lineWidth = 2.4; g.stroke();
    };
    leg(1); leg(-1);
    g.fillStyle = '#c9a24a'; g.beginPath(); g.arc(0, 34, 16, 0, TAU); g.fill();           // 铰轮
    g.strokeStyle = 'rgba(40,22,6,.85)'; g.lineWidth = 3.6; g.beginPath(); g.arc(0, 34, 16, 0, TAU); g.stroke();
    g.lineWidth = 2.2; g.strokeStyle = 'rgba(70,44,14,.85)';
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU;
      g.beginPath(); g.moveTo(Math.cos(a) * 4, 34 + Math.sin(a) * 4); g.lineTo(Math.cos(a) * 14, 34 + Math.sin(a) * 14); g.stroke(); }
    g.fillStyle = '#6a4a20'; g.beginPath(); g.arc(0, 34, 5, 0, TAU); g.fill();            // 铰心
    g.strokeStyle = '#b98e3e'; g.lineWidth = 5.5; g.beginPath(); g.arc(0, 6, 12, Math.PI * 0.15, Math.PI * 0.85, true); g.stroke();   // 顶环
    g.strokeStyle = 'rgba(30,16,4,.75)'; g.lineWidth = 2.2; g.stroke();
    g.restore();
  });
  const LAMP = () => P.cached('s06_lamp', 170, 330, function (g) {
    g.save(); g.translate(85, 0); g.lineCap = 'round';
    g.fillStyle = '#3e2a14'; g.beginPath(); g.moveTo(-42, 322); g.lineTo(42, 322); g.lineTo(58, 328); g.lineTo(-58, 328); g.closePath(); g.fill();   // 底座
    g.strokeStyle = 'rgba(20,10,2,.7)'; g.lineWidth = 3; g.stroke();
    g.fillStyle = '#8a6a2e'; g.fillRect(-9, 236, 18, 88);                                  // 立杆
    g.strokeStyle = 'rgba(40,22,6,.7)'; g.lineWidth = 2.6; g.strokeRect(-9, 236, 18, 88);
    g.fillStyle = '#c9a24a'; g.fillRect(-14, 252, 28, 7); g.fillRect(-14, 288, 28, 7);    // 杆箍
    g.fillStyle = '#c9a24a'; g.beginPath(); g.ellipse(0, 228, 54, 19, 0, 0, TAU); g.fill();   // 油碗
    g.strokeStyle = 'rgba(40,22,6,.75)'; g.lineWidth = 3; g.beginPath(); g.ellipse(0, 228, 54, 19, 0, 0, TAU); g.stroke();
    g.fillStyle = '#b98e3e'; g.beginPath(); g.ellipse(0, 226, 40, 12, 0, 0, TAU); g.fill();
    g.fillStyle = '#e8c878'; g.beginPath(); g.ellipse(-12, 222, 16, 6, 0, 0, TAU); g.fill();    // 油面反光
    g.strokeStyle = '#b98e3e'; g.lineWidth = 6; g.beginPath(); g.arc(54, 208, 20, Math.PI * 0.7, Math.PI * 1.9); g.stroke();   // 提环
    g.strokeStyle = 'rgba(40,22,6,.6)'; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#8a6a2e'; g.beginPath(); g.moveTo(-8, 214); g.lineTo(8, 214); g.lineTo(5, 198); g.lineTo(-5, 198); g.closePath(); g.fill();   // 灯芯座
    const rr = U.rng(733);                                                                 // 黄铜短弧笔触
    for (let i = 0; i < 12; i++) { const a = rr() * TAU;
      g.strokeStyle = ['#c9a24a', '#e8c878', '#b98e3e'][(rr() * 3) | 0]; g.lineWidth = 3 + rr() * 2;
      g.beginPath(); g.arc(0, 228, 44 + rr() * 12, a, a + 0.18 + rr() * 0.1); g.stroke(); }
    g.restore();
  });
  function flamePath(g, x, y, w, h) {
    g.beginPath(); g.moveTo(x - w, y);
    g.bezierCurveTo(x - w, y - h * 0.42, x - w * 0.4, y - h * 0.62, x, y - h);
    g.bezierCurveTo(x + w * 0.4, y - h * 0.62, x + w, y - h * 0.42, x + w, y);
    g.closePath();
  }
  const OBJ = [
    { key: 'books', x: 430, spr: BOOKS, ax: 150, ay: 262, sc: 1.15, label: '数据', rise: 7.15 },
    { key: 'div', x: 960, spr: DIVID, ax: 70, ay: 302, sc: 1.18, label: '方法', rise: 7.57 },
    { key: 'lamp', x: 1490, spr: LAMP, ax: 85, ay: 328, sc: 1.05, label: '算力', rise: 7.99 },
  ];
  function drawObjects(g, lt, t) {
    OBJ.forEach(function (o, k) {
      const q = clamp((lt - o.rise) / 0.8, 0, 1); if (q <= 0) return;
      const e = ease.out(q), eb = ease.outBack(q), baseY = 818;
      const y = lerp(baseY + 170, baseY, eb), sc = lerp(o.sc * 0.72, o.sc, e), al = ss(0, 0.3, q);
      g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = al * (0.4 + 0.1 * Math.sin(t * 1.6 + k * 2));
      g.drawImage(GLOW(), o.x - 200, y - o.ay * sc - 130, 400, 400); g.restore();           // 物底暖光晕
      g.save(); g.globalAlpha = al; g.translate(o.x, y); g.scale(sc, sc);
      g.drawImage(o.spr(), -o.ax, -o.ay);
      if (o.key === 'div') {                                                                // 铰轮校准环＋足尖金点
        const gap = t * 0.5;
        g.strokeStyle = 'rgba(78,50,16,.7)'; g.lineWidth = 2.2;
        g.beginPath(); g.arc(0, 34 - o.ay, 56, gap + 0.4, gap - 0.4 + TAU); g.stroke();
        g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(240,206,140,.85)';
        g.beginPath(); g.arc(-30, 292 - o.ay, 4, 0, TAU); g.fill();
        g.beginPath(); g.arc(30, 292 - o.ay, 4, 0, TAU); g.fill(); g.restore();
      }
      if (o.key === 'lamp') {                                                               // 焰苗：噪声摇曳（亮芯压过纸底）
        const fl = 1 + 0.22 * P.noise(lt * 3.4, 7.7), fw = 1 + 0.3 * P.noise(lt * 2.6, 12.3);
        g.fillStyle = '#3a2410'; g.fillRect(-2.5, -140, 5, 12);
        g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = al * (0.65 + 0.18 * Math.sin(t * 5 + k));
        g.drawImage(GLOW(), -80, -226, 160, 160); g.restore();
        g.fillStyle = '#e8a040'; flamePath(g, 0, -128, 17 * fw, 52 * fl); g.fill();
        g.fillStyle = '#ffefb0'; flamePath(g, 0, -126, 9 * fw, 30 * fl); g.fill();
      }
      g.restore();
      const la = al * ss(0.5, 0.85, q);                                                     // 铭文（站台下方）
      if (la > 0.02) {
        g.save(); g.globalAlpha = la;
        g.font = '44px "LXGWWenKai-500"'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
        g.fillStyle = '#4a2414'; g.fillText(o.label, o.x + 1.5, 864);
        g.fillStyle = '#7c2818'; g.fillText(o.label, o.x, 862);
        g.restore();
      }
    });
  }

  // ---------- 屏上字与计数器（屏幕空间；字后一圈纸面提亮，避开 y>880） ----------
  const CAPS = [
    { txt: '参数', x: 1330, y: 208, size: 150, box: [1290, 30, 1665, 258], a: function (lt) { return ss(0.45, 1.1, lt) * (1 - ss(2.7, 3.2, lt)); }, wob: 0 },
    { txt: '疯狂卷参数', x: 176, y: 210, size: 92, box: [140, 78, 660, 258], a: function (lt) { return ss(3.15, 3.75, lt) * (1 - ss(6.5, 7.0, lt)); }, wob: 2 },
    { txt: '参数之外', x: 884, y: 206, size: 110, box: [840, 50, 1360, 258], a: function (lt) { return ss(7.25, 7.95, lt); }, wob: 4 },
  ];
  const CK = [[3.30, 0], [3.92, 1.5], [4.18, 1.5], [4.98, 175], [5.08, 175], [5.88, 540], [5.98, 540], [6.78, 1000], [999, 1000]];
  function counterVal(lt) {
    for (let i = 0; i < CK.length - 1; i++)
      if (lt >= CK[i][0] && lt <= CK[i + 1][0])
        return lerp(CK[i][1], CK[i + 1][1], ease.inOut(clamp((lt - CK[i][0]) / (CK[i + 1][0] - CK[i][0]), 0, 1)));
    return lt < 3.3 ? 0 : 1000;
  }
  function drawCounter(c, lt, t) {
    const a = ss(3.3, 3.72, lt) * (1 - ss(7.0, 7.45, lt)); if (a <= 0.01) return;
    const v = counterVal(lt);
    const txt = v >= 1000 ? '1T+' : v < 10 ? v.toFixed(1) + 'B' : Math.round(v) + 'B';
    const pulse = v >= 1000 ? Math.exp(-Math.max(0, lt - 6.78) * 3.2) : 0;
    const cx = 250, cy = 778;
    c.save(); c.globalAlpha = a;
    const gr = c.createRadialGradient(cx, cy - 30, 10, cx, cy - 30, 200);                  // 页角提亮
    gr.addColorStop(0, 'rgba(230,210,168,.5)'); gr.addColorStop(1, 'rgba(230,210,168,0)');
    c.fillStyle = gr; c.fillRect(cx - 210, cy - 180, 420, 340);
    c.translate(cx, cy); c.rotate(-0.012); c.scale(1 + 0.12 * pulse, 1 + 0.12 * pulse);
    c.strokeStyle = 'rgba(78,50,16,.6)'; c.lineWidth = 2.2;                                // 页角编号的细墨框线
    c.beginPath(); c.moveTo(-92, -64); c.quadraticCurveTo(0, -78, 92, -64); c.stroke();
    c.beginPath(); c.moveTo(-78, 36); c.quadraticCurveTo(0, 48, 78, 36); c.stroke();
    c.font = '96px "CormorantGaramond-500"'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.fillStyle = '#b98e3e'; c.fillText(txt, 4, 6);
    c.fillStyle = INK_D; c.fillText(txt, 0, 0);
    c.restore();
    if (lt > 6.78 && lt < 7.45) {                                                          // 1T+ 揭示：一圈金环扩散（一次重音）
      const q = (lt - 6.78) / 0.67;
      c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
      c.strokeStyle = 'rgba(201,162,74,' + (0.5 * (1 - q) * a) + ')'; c.lineWidth = 10;
      c.setLineDash([20, 13]); c.lineDashOffset = -t * 64;
      c.beginPath(); c.arc(cx, cy - 30, 40 + q * 165, 0, TAU); c.stroke();
      c.setLineDash([]); c.restore();
    }
  }
  function captions(c, lt, t) {
    CAPS.forEach(function (cp) {
      const a = cp.a(lt); if (a <= 0.01) return;
      c.save(); c.globalAlpha = a;
      const gr = c.createRadialGradient(cp.x + cp.size * 0.9, cp.y - cp.size * 0.45, 10, cp.x + cp.size * 0.9, cp.y - cp.size * 0.45, cp.size * 2.1);
      gr.addColorStop(0, 'rgba(232,212,170,.62)'); gr.addColorStop(1, 'rgba(232,212,170,0)');
      c.fillStyle = gr; c.fillRect(cp.x - cp.size, cp.y - cp.size * 1.4, cp.size * 4.2, cp.size * 2.2);
      c.translate(cp.x, cp.y); c.rotate(-0.03 + 0.012 * Math.sin(t * 0.8 + cp.wob));
      c.font = cp.size + 'px "LXGWWenKai-500"'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      c.fillStyle = '#caa452'; c.fillText(cp.txt, 5, 7);                                    // 贴金底
      c.fillStyle = INK_D; c.fillText(cp.txt, 0, 0);                                        // 墨字
      c.restore();
    });
  }

  // ---------- 相机：近景缓推 → 拉远铺开 → 停住收稳（世界坐标 → 屏幕） ----------
  function camera(lt) {
    let s, fx, fy;
    if (lt < 3) { s = 1.10 + 0.24 * ease.inOut(clamp((lt - 0.15) / 2.5, 0, 1)); fx = 830; fy = 580; }
    else if (lt < 6.9) { const q = ease.inOut(clamp((lt - 3.05) / 3.55, 0, 1));
      s = lerp(1.34, 0.94, q); fx = lerp(830, 960, q); fy = lerp(580, 540, q); }
    else { s = lerp(0.94, 0.965, ss(7.0, 9.8, lt)); fx = 960; fy = 540; }
    return { s: s, fx: fx, fy: fy };
  }
  let CAMS = { s: 1.1, fx: 830, fy: 580 };
  let DIMBOX = [];
  const w2s = function (x, y) { return [960 + (x - CAMS.fx) * CAMS.s, 540 + (y - CAMS.fy) * CAMS.s]; };
  const inDim = function (sx, sy) {
    for (let i = 0; i < DIMBOX.length; i++) { const b = DIMBOX[i]; if (sx > b[0] && sx < b[2] && sy > b[1] && sy < b[3]) return true; }
    return false;
  };

  // ---------- 每帧动态件 ----------
  function drawGlints(g, t) {                                                              // 水痕碎光微闪
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 26; k++) {
      const u = (t * 0.055 + k / 26) % 1, seg = u * (RIVER.length - 1), i = Math.floor(seg), f = seg - i;
      const a = RIVER[i], b = RIVER[Math.min(i + 1, RIVER.length - 1)];
      const x = lerp(a[0], b[0], f), y = lerp(a[1], b[1], f);
      const tw = Math.max(0, Math.sin(t * 7 + k * 2.3));
      let al = 0.5 * tw;
      const scr = w2s(x, y);
      if (inDim(scr[0], scr[1])) al *= 0.3;
      if (al <= 0.02) continue;
      g.fillStyle = 'rgba(255,246,214,' + al.toFixed(3) + ')';
      g.beginPath(); g.ellipse(x, y, 2.2 + i * 0.4, 1.4, 0, 0, TAU); g.fill();
    }
    g.restore();
  }
  function drawNet(g, lt, t, dn) {                                                          // 机械网络：连线蔓延＋齿轮缓转＋星标缓摆
    const gold = ss(7.7, 9.0, lt), calm = ss(8.4, 9.6, lt);
    const pulse = Math.exp(-Math.pow((lt - 6.78) * 3.2, 2));
    const spin = 1 - 0.62 * ss(7.0, 9.4, lt);                                               // 拍三齿轮减速（不停死）
    const amp = 3.2 * (1 - 0.85 * calm), goldA = 0.55 * gold;
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (let ci = 0; ci < CONN.length; ci++) {
      const k2 = CONN[ci];
      if (lt <= k2.birth) continue;
      const frac = clamp((lt - k2.birth) / 0.42, 0, 1);
      const scr = w2s((k2.ax + k2.bx) / 2, (k2.ay + k2.by) / 2);
      const dim = inDim(scr[0], scr[1]) ? 0.3 : 1;
      const mx = (k2.ax + k2.bx) / 2 + k2.bow * 0.9, my = (k2.ay + k2.by) / 2 + k2.bow * 0.35;
      const nSeg = Math.max(2, Math.ceil(9 * frac));
      const pth = new Path2D(); pth.moveTo(k2.ax, k2.ay);
      for (let s2 = 1; s2 <= nSeg; s2++) {
        const q = (s2 / nSeg) * frac, u = 1 - q;
        pth.lineTo(u * u * k2.ax + 2 * u * q * mx + q * q * k2.bx + k2.nx * amp * Math.sin(q * 7 + k2.ph),
                   u * u * k2.ay + 2 * u * q * my + q * q * k2.by + k2.ny * amp * Math.sin(q * 7 + k2.ph));
      }
      g.strokeStyle = 'rgba(78,50,16,' + ((0.3 + 0.22 * dn) * dim).toFixed(3) + ')'; g.lineWidth = 2.4;
      g.stroke(pth);
      if (goldA > 0.02 && dim === 1) {                                                     // 拍三描金
        g.save(); g.globalCompositeOperation = 'lighter';
        g.strokeStyle = 'rgba(201,162,74,' + goldA.toFixed(3) + ')'; g.lineWidth = 1.6;
        g.stroke(pth); g.restore();
      }
    }
    for (let ei = 0; ei < ELEM.length; ei++) {
      const e = ELEM[ei];
      if (lt <= e.birth) continue;
      const age = lt - e.birth, pop = age < 0.35 ? ease.outBack(clamp(age / 0.35)) : 1;
      const scr = w2s(e.x, e.y);
      const dim = inDim(scr[0], scr[1]) ? 0.32 : 1;
      if (e.gear >= 0) {
        if (dim < 1) g.globalAlpha = dim;
        const ang = e.ph + e.spd * lt * spin * (1 + 0.3 * pulse);
        const spr = e.gear ? GEAR_B() : GEAR_A();
        const sc = (e.r / 114) * Math.max(0.01, pop);
        g.save(); g.translate(e.x, e.y); g.rotate(ang);
        g.drawImage(spr, -120 * sc, -120 * sc, 240 * sc, 240 * sc); g.restore();
        if (dim < 1) g.globalAlpha = 1;
        if (gold > 0.05 && dim === 1) {                                                    // 齿轮描金圈
          g.save(); g.globalCompositeOperation = 'lighter';
          g.strokeStyle = 'rgba(214,170,88,' + (0.55 * gold * (0.6 + 0.4 * Math.sin(t * 2.2 + e.ph))).toFixed(3) + ')';
          g.lineWidth = 2.4; g.beginPath(); g.arc(e.x, e.y, e.r * pop * 0.99, 0, TAU); g.stroke(); g.restore();
        }
      } else {                                                                              // 注记星标：放射短线缓摆
        g.save();
        if (dim < 1) g.globalAlpha = dim;
        g.translate(e.x, e.y); g.rotate(e.ph + Math.sin(t * 0.9 + e.ph) * 0.22);
        g.strokeStyle = 'rgba(58,36,16,.6)'; g.lineWidth = 2.4;
        const L = e.r * pop;
        for (let i = 0; i < 5; i++) { const a = i / 5 * TAU, l = L * (0.72 + 0.28 * Math.sin(t * 2.4 + e.ph + i));
          g.beginPath(); g.moveTo(Math.cos(a) * L * 0.2, Math.sin(a) * L * 0.2); g.lineTo(Math.cos(a) * l, Math.sin(a) * l); g.stroke(); }
        g.fillStyle = 'rgba(58,36,16,.55)'; g.beginPath(); g.arc(0, 0, 3.4 * pop, 0, TAU); g.fill();
        if (gold > 0.05) { g.globalCompositeOperation = 'lighter';
          g.fillStyle = 'rgba(228,184,98,' + (0.6 * gold).toFixed(3) + ')'; g.beginPath(); g.arc(0, 0, 3.2, 0, TAU); g.fill(); }
        g.restore();
      }
    }
  }
  function drawFeat(g, lt, t) {                                                             // 三颗参数点：圆规圈缓转＋呼吸＋注记
    const numA = ss(0.55, 1.3, lt) * (1 - ss(3.35, 4.0, lt));
    const gold = ss(7.7, 9.0, lt);
    const fs = lt < 2.8 ? 1 + 0.13 * ss(0, 2.8, lt) : lerp(1.13, 0.7, ease.inOut(clamp((lt - 2.8) / 1.5, 0, 1)));
    FEAT.forEach(function (f, k) {
      const tw = 0.85 + 0.15 * Math.sin(t * 2.1 + f.ph);
      const R = 118 * fs * (1 - 0.07 * gold);
      const gap = t * 0.4 * (k % 2 ? -1 : 1) + f.ph;
      g.strokeStyle = 'rgba(78,50,16,.78)'; g.lineWidth = 2.6;                             // 圆规双圈（缺口缓转）
      g.beginPath(); g.arc(f.x, f.y, R, gap + 0.34, gap - 0.34 + TAU); g.stroke();
      g.beginPath(); g.arc(f.x, f.y, R * 0.8, gap + Math.PI + 0.26, gap + Math.PI - 0.26 + TAU); g.stroke();
      g.lineWidth = 1.8; g.strokeStyle = 'rgba(78,50,16,.5)';                               // 十字准线
      g.beginPath();
      g.moveTo(f.x - R * 0.5, f.y); g.lineTo(f.x - R * 0.22, f.y); g.moveTo(f.x + R * 0.22, f.y); g.lineTo(f.x + R * 0.5, f.y);
      g.moveTo(f.x, f.y - R * 0.5); g.lineTo(f.x, f.y - R * 0.22); g.moveTo(f.x, f.y + R * 0.22); g.lineTo(f.x, f.y + R * 0.5);
      g.stroke();
      const hg = R * 1.7 * tw;                                                              // 光晕
      g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.3 + 0.34 * gold + 0.06 * Math.sin(t * 3.1 + f.ph);
      g.drawImage(GLOW(), f.x - hg, f.y - hg, hg * 2, hg * 2); g.restore();
      if (numA > 0.02) {                                                                    // 引线 flourish
        g.strokeStyle = 'rgba(58,36,16,' + (0.5 * numA).toFixed(3) + ')'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(f.x + Math.sign(f.ox) * 10 * fs, f.y + Math.sign(f.oy) * 8 * fs);
        g.quadraticCurveTo(f.x + 0.7 * f.ox * fs, f.y + 0.45 * f.oy * fs, f.x + 0.9 * f.ox * fs, f.y + 0.78 * f.oy * fs);
        g.stroke();
      }
      g.fillStyle = '#2c1c0c'; g.beginPath(); g.arc(f.x, f.y, 9 * fs * tw, 0, TAU); g.fill();    // 墨点本体
      if (gold > 0.05) {                                                                    // 拍三描金变亮
        g.save(); g.globalCompositeOperation = 'lighter';
        g.fillStyle = 'rgba(240,206,140,' + (0.75 * gold).toFixed(3) + ')';
        g.beginPath(); g.arc(f.x, f.y, 5 * fs, 0, TAU); g.fill(); g.restore();
      }
      if (numA > 0.02) {                                                                    // 手写注记
        g.save(); g.globalAlpha = numA;
        g.translate(f.x + f.ox * fs, f.y + f.oy * fs); g.rotate(-0.06 + 0.02 * Math.sin(t * 0.9 + f.ph));
        g.font = Math.round(56 * fs) + 'px "CormorantGaramond-500i"'; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
        g.fillStyle = INK_D; g.fillText(f.n, 0, 0);
        g.restore();
      }
    });
  }
  function ornithopter(g, lt, t) {                                                          // 扑翼机小样＝数据包（无驾驶员）
    if (lt < 5.0 || lt > 7.3) return;
    const q = clamp((lt - 5.0) / 2.3, 0, 1);
    const x = lerp(270, 1590, q), y = 338 - q * 68 + Math.sin(lt * 4.4) * 15;
    g.save(); g.translate(x, y); g.rotate(-0.06 + Math.sin(lt * 4.4 + 1) * 0.06); g.scale(1.02, 1.02);
    const wing = function (sc, dark, ph) {
      const up = 0.5 + 0.5 * Math.sin(t * 11 + ph);
      const tip = [-26 * sc, (-52 * up + 16 * (1 - up)) * sc];
      const back = [-120 * sc, (-26 * up + 14) * sc];
      g.fillStyle = dark ? 'rgba(150,118,80,.5)' : 'rgba(214,188,140,.55)';
      g.beginPath(); g.moveTo(2, 0); g.lineTo(tip[0], tip[1]);
      g.quadraticCurveTo(-70 * sc, (tip[1] + back[1]) / 2 - 10 * sc, back[0], back[1]);
      g.lineTo(-26 * sc, 6 * sc); g.closePath(); g.fill();
      g.strokeStyle = INK; g.lineWidth = 2.2; g.stroke();
      g.lineWidth = 1.5;
      for (let i = 0; i <= 4; i++) { const u = i / 4;
        const rx = lerp(tip[0], back[0], u) - Math.sin(u * Math.PI) * 18 * sc;
        const ry = lerp(tip[1], back[1], u) - Math.sin(u * Math.PI) * 6 * sc;
        g.beginPath(); g.moveTo(-4, 2); g.lineTo(rx, ry); g.stroke(); }
    };
    wing(0.8, true, 0.5);
    g.strokeStyle = INK; g.lineWidth = 3.4; g.beginPath(); g.moveTo(42, 6); g.lineTo(-84, 10); g.stroke();   // 机身梁
    g.lineWidth = 2; g.beginPath(); g.moveTo(-70, 8); g.lineTo(-96, -2 + Math.sin(t * 6) * 4); g.lineTo(-94, 16 + Math.sin(t * 6) * 4); g.closePath(); g.stroke();   // 尾舵
    wing(1.0, false, 0);
    g.restore();
  }
  function beam(c, lt, t) {                                                                 // 神光斜扫＋浮尘
    const a = ss(8.15, 8.85, lt); if (a <= 0.01) return;
    const dx = lerp(240, 0, ease.out(ss(8.15, 9.35, lt)));
    c.save(); c.globalCompositeOperation = 'screen';
    c.globalAlpha = a * (0.75 + 0.18 * Math.sin(t * 2.2));
    c.drawImage(BEAMC(), dx, 0);
    const ps = P.particles(44, 23, t, { x0: 820, x1: 1780, y0: 1060, y1: 140, speed: 55, drift: 15, life: 7 });
    for (let i = 0; i < ps.length; i++) { const p = ps[i];
      const tw = 0.5 + 0.5 * Math.sin(t * 6 + p.i * 1.7), al = 0.85 * tw * Math.sin(p.q * Math.PI);
      if (al <= 0.02) continue;
      c.fillStyle = 'rgba(255,240,200,' + (al * a).toFixed(3) + ')';
      c.beginPath(); c.arc(p.x + dx * 0.35, p.y, 2 * p.s + 1, 0, TAU); c.fill();
    }
    c.restore();
  }

  return {
    init: function () {
      U.assertGlyphs('150px "LXGWWenKai-500"', '参数疯狂卷之外数据方法算力', 's06_renaissance 屏上字/铭文');
      U.assertGlyphs('96px "CormorantGaramond-500"', '0123456789.BT+', 's06_renaissance 计数器');
      U.assertGlyphs('58px "CormorantGaramond-500i"', '0123456789.-+', 's06_renaissance 注记');
      STATIC(); OVER(); GLOW(); GEAR_A(); GEAR_B(); BEAMC(); BOOKS(); DIVID(); LAMP();
    },
    draw: function (c, lt, t) {
      const cam = camera(lt); CAMS = cam;
      const dn = clamp((lt - 3.25) / 3.35, 0, 1);
      DIMBOX = [];
      const cA = ss(3.3, 3.72, lt) * (1 - ss(7.0, 7.45, lt));
      if (cA > 0.3) DIMBOX.push([110, 655, 415, 858]);
      for (let i = 0; i < CAPS.length; i++) if (CAPS[i].a(lt) > 0.3) DIMBOX.push(CAPS[i].box);
      // ① 静态页（随镜头）
      c.save();
      c.setTransform(cam.s, 0, 0, cam.s, 960 - cam.fx * cam.s, 540 - cam.fy * cam.s);
      c.drawImage(STATIC(), 0, 0);
      c.restore();
      // ② 动态墨层（页面世界）→ 晕涂两遍合成
      const L = P.scratch('s06Ink'), g = L.getContext('2d');
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
      g.setTransform(cam.s, 0, 0, cam.s, 960 - cam.fx * cam.s, 540 - cam.fy * cam.s);
      drawGlints(g, t);
      drawNet(g, lt, t, dn);
      drawFeat(g, lt, t);
      ornithopter(g, lt, t);
      drawObjects(g, lt, t);
      g.setTransform(1, 0, 0, 1, 0, 0);
      c.filter = 'blur(1.6px)'; c.drawImage(L, 0, 0); c.filter = 'none';
      c.globalAlpha = 0.82; c.drawImage(L, 0, 0); c.globalAlpha = 1;
      // ③ 墨色随密度加深（拍二），拍三随神光回退
      { const wa = 0.17 * ss(3.4, 6.6, lt) * (1 - 0.75 * ss(8.0, 9.3, lt));
        if (wa > 0.004) { c.fillStyle = 'rgba(62,38,15,' + wa.toFixed(3) + ')'; c.fillRect(0, 0, W, H); } }
      // ④ 神光＋浮尘
      beam(c, lt, t);
      // ⑤ 计数器＋屏上字（屏幕空间）
      drawCounter(c, lt, t);
      captions(c, lt, t);
      // ⑥ 罩层
      c.drawImage(OVER(), 0, 0);
    },
  };
})();
