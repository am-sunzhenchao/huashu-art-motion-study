// 「大模型参数」毕加索蓝色时期样片（s36_picasso_blue）——纯代码，1903 蓝色时期。
// 手法照 36 号风格卡：蓝单色平涂底稿 → 宽而干的笔触重画（墙竖刷/地横刷 cell34 len110 w34，区域色板 mixBase 0.8，
// butt 笔头密排不结「人头阵」，再糊 7px 叠 80% 压笔缘）→ 干刷细丝 → 普鲁士蓝 #0c1830 笃定粗轮廓（不沸腾）
// → 画布纹＋冷暗角；一切缓慢呼吸（sin(1.8t)，深而慢）；物件一律拉长变瘦下垂。
// 构图为「参数」题材重新设计：蓝调画室里一张钉在细长三脚画架上的蓝画纸——参数＝蓝纸上的点注（不搬速通片房间构图）。
// 拍一 0–3s「参数」：缓推近看蓝纸——点注先后落纸、缓慢涨缩明灭，三颗大点带手写小数字 0.73 / -1.2 / 2.4（Caveat-600 浅蓝白）。
// 拍二 3–7s「疯狂卷参数」：缓拉远——点注从纸面连片生长、连线蔓延到整面蓝墙成网；两侧背景里细长烛台/瘦长椅/高书摞
//        被拉长成网络支柱一根根拔高；墙面宽笔随密度加深变沉；纸角蓝白编号滚动 1.5B→175B→540B→1T+，
//        1T+ 揭示时点网一次泛白（全片唯一重音）。
// 拍三 7–10s「参数之外」：增殖停住；三件瘦长蓝物依次升起——一摞高书（数据）、瘦长齿轮（方法）、细长蜡烛（算力），
//        各自描白点亮；点注网从变多转为变亮变精（小点暗下、大点泛蓝白光、连线收稳不晃），最后一道宽笔淡蓝罩从右往左扫过收尾。
SCENES['s36_picasso_blue'] = (() => {
  const W = 1920, H = 1080, TAU = Math.PI * 2;
  const { clamp, lerp, ease, rng, ss, seg } = U, P = PAINT;
  const C = { navy: '#132240', prus: '#1d3866', cob: '#2d5a94', cer: '#6b8fb6', pale: '#b6c8d8', teal: '#3b6878', line: '#0c1830' };
  const FL = 770;                                               // 墙脚线
  const PP = { x: 872, y: 430, w: 780, h: 540, rot: -0.026 };    // 蓝画纸（参数点注的载体），微倾
  const PC = Math.cos(PP.rot), PS = Math.sin(PP.rot);
  const pL = (lx, ly) => [PP.x + lx * PC - ly * PS, PP.y + lx * PS + ly * PC];
  const toLocal = (x, y) => { const dx = x - PP.x, dy = y - PP.y; return [dx * PC + dy * PS, -dx * PS + dy * PC]; };
  const inPaper = (x, y, pad) => { const l = toLocal(x, y); return Math.abs(l[0]) < PP.w / 2 + pad && Math.abs(l[1]) < PP.h / 2 + pad; };
  // 题字区／计数区（纸面局部坐标）：点注和连线都避开，字永远可读
  const zoneHit = (lx, ly) => (lx > -360 && lx < 110 && ly > -255 && ly < -140) || (lx > 0 && lx < 215 && ly > 150 && ly < 258);

  // ---------- 色板（36 号卡，严格单色蓝：墙深／纸中／点注浅，靠明度分层） ----------
  const SW = {
    wall: P.swatch(['#1d3866', '#24457a', '#163056', '#2e5a94', '#20406e', '#3b6878'], 0.8),
    floor: P.swatch(['#4a6c94', '#587ca2', '#3e5f86', '#6b8fb6', '#456a8a'], 0.75),
    paper: P.swatch(['#3a64a0', '#33598f', '#2d5490', '#41669e', '#35619c'], 0.72),
    deep: P.swatch(['#163056', '#122a4e', '#1a3460', '#132240'], 0.85),
  };

  // ---------- 静态底稿：蓝调画室（宽笔墙地＋蓝纸＋细长三脚画架，全缓存） ----------
  function underpaint(g) {
    g.fillStyle = C.prus; g.fillRect(0, 0, W, FL);
    const wg = g.createLinearGradient(0, 0, W, 0);                                   // 左来一点冷光，右沉下去
    wg.addColorStop(0, 'rgba(110,145,185,.32)'); wg.addColorStop(0.6, 'rgba(0,0,0,0)'); wg.addColorStop(1, 'rgba(5,10,25,.42)');
    g.fillStyle = wg; g.fillRect(0, 0, W, FL);
    g.fillStyle = '#4a6c94'; g.fillRect(0, FL, W, H - FL);
    const fg = g.createLinearGradient(0, FL, 0, H);
    fg.addColorStop(0, 'rgba(10,20,40,.4)'); fg.addColorStop(1, 'rgba(150,175,200,.22)');
    g.fillStyle = fg; g.fillRect(0, FL, W, H - FL);
  }
  function leg(g, x0, y0, x1, y1, w0, w1, col) {   // 细长锥形画架腿
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
    g.fillStyle = col; g.beginPath();
    g.moveTo(x0 + nx * w0 / 2, y0 + ny * w0 / 2); g.lineTo(x1 + nx * w1 / 2, y1 + ny * w1 / 2);
    g.lineTo(x1 - nx * w1 / 2, y1 - ny * w1 / 2); g.lineTo(x0 - nx * w0 / 2, y0 - ny * w0 / 2);
    g.closePath(); g.fill();
    g.strokeStyle = C.line; g.lineWidth = 4; g.stroke();
  }
  const stat = () => P.cached('pb36_static', W, H, (g, cv) => {
    const b = P.canvas(), bg = b.getContext('2d'); underpaint(bg);
    g.drawImage(b, 0, 0);
    P.strokes(g, b, { cell: 34, len: 110, width: 34, seed: 12, t: 0, boil: 0, outline: 0, jitterCol: 4, cap: 'butt',
      angle: (x, y) => y > FL ? 0.05 * P.noise(x * 0.01, y * 0.01) : -Math.PI / 2 + 0.5 * P.noise(x * 0.003, y * 0.003),
      palette: (x, y, col, r) => (y > FL ? SW.floor(col, r) : SW.wall(col, r)),
      mask: (x, y) => Math.abs(y - FL) > 18 });
    { const tmp = P.canvas(), tg = tmp.getContext('2d'); tg.filter = 'blur(7px)'; tg.drawImage(cv, 0, 0); g.globalAlpha = 0.8; g.drawImage(tmp, 0, 0); g.globalAlpha = 1; }
    // 干刷细丝（很淡）
    const r = rng(9); g.globalAlpha = 0.07; g.strokeStyle = '#a8c0d6'; g.lineWidth = 1.2;
    for (let i = 0; i < 900; i++) { const x = r() * W, y = r() * H; if (inPaper(x, y, 12)) continue; const a = y > FL ? 0 : -Math.PI / 2, L = 30 + r() * 60; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }
    g.globalAlpha = 1;
    // 墙脚线（普鲁士蓝）
    g.strokeStyle = C.line; g.lineWidth = 4; g.beginPath(); g.moveTo(0, FL); g.lineTo(W, FL); g.stroke();
    // 画架后腿（在纸后面）
    leg(g, 872, 700, 918, 946, 15, 8, '#142c50');
    // 纸影＋蓝画纸（单独一层：渐变平涂＋小笔触，画在宽笔之上）
    g.save(); g.translate(PP.x + 13, PP.y + 17); g.rotate(PP.rot); g.fillStyle = 'rgba(8,18,42,.45)'; g.fillRect(-PP.w / 2, -PP.h / 2, PP.w, PP.h); g.restore();
    const pl = P.canvas(), plg = pl.getContext('2d');
    plg.save(); plg.translate(PP.x, PP.y); plg.rotate(PP.rot);
    const pgd = plg.createLinearGradient(-390, -270, 330, 270); pgd.addColorStop(0, '#3a64a0'); pgd.addColorStop(1, '#2c528c');
    plg.fillStyle = pgd; plg.fillRect(-PP.w / 2, -PP.h / 2, PP.w, PP.h);
    plg.restore();
    plg.save(); plg.globalCompositeOperation = 'source-atop';
    P.strokes(plg, pl, { cell: 9, len: 22, width: 9, seed: 15, t: 0, boil: 0, outline: 0, jitterCol: 10, alphaMask: true, cap: 'butt',
      angle: (x, y) => 0.04 + 0.3 * P.noise(x * 0.004, y * 0.004), palette: (x, y, col, r2) => SW.paper(col, r2) });
    plg.restore(); g.drawImage(pl, 0, 0);
    // 纸缘轮廓（笃定的粗线）＋两枚钉
    g.save(); g.translate(PP.x, PP.y); g.rotate(PP.rot);
    g.strokeStyle = C.line; g.lineWidth = 5; g.lineJoin = 'round';
    P.roughPath(g, [[-390, -270], [390, -270], [390, 270], [-390, 270]], { amp: 2.5, seed: 61, closed: true }); g.stroke();
    [[-322, -244], [322, -244]].forEach(([nx, ny]) => { g.fillStyle = '#c9d6e2'; g.beginPath(); g.arc(nx, ny, 6.5, 0, TAU); g.fill(); g.strokeStyle = C.line; g.lineWidth = 2.5; g.stroke(); });
    // 托板（压住纸底边的细板）＋前腿在纸前面
    g.fillStyle = '#1a3564'; g.fillRect(-382, 280, 764, 18); g.strokeStyle = C.line; g.lineWidth = 4; g.strokeRect(-382, 280, 764, 18);
    g.fillStyle = '#16305a'; g.fillRect(-382, 276, 764, 6);
    g.restore();
    leg(g, 534, 697, 562, 944, 20, 10, '#1a3564');
    leg(g, 1224, 679, 1190, 944, 20, 10, '#1a3564');
    leg(g, 592, 836, 1160, 846, 12, 12, '#1a3564');                                 // 前腿间细横档
  });

  // ---------- 拍二：墙面宽笔随密度加深（另一张缓存，按 dens 透明度叠上） ----------
  const densOv = () => P.cached('pb36_dens', W, H, (g) => {
    const b = P.canvas(), bg = b.getContext('2d');
    bg.fillStyle = '#1a3460'; bg.fillRect(0, 0, W, FL);
    P.strokes(g, b, { cell: 42, len: 132, width: 42, seed: 17, t: 0, boil: 0, outline: 0, jitterCol: 5, cap: 'butt',
      angle: (x, y) => -Math.PI / 2 + 0.45 * P.noise(x * 0.004, y * 0.004),
      palette: (x, y, col, r) => SW.deep(col, r),
      mask: (x, y) => y < FL - 12 && !inPaper(x, y, 30) });
  });

  // ---------- 拍二：被拉长的瘦高物（细长烛台/瘦长椅/高书摞 → 网络支柱），各自缓存、从地面拔高 ----------
  const PIL = (() => {
    const r = rng(3601), out = [];
    [[128, 432, 5], [1300, 1870, 7]].forEach(([x0, x1, n], bi) => {
      for (let k = 0; k < n; k++) {
        const x = x0 + (x1 - x0) * (k / (n - 1)) + (r() - 0.5) * 44;
        const type = (k * 2 + bi) % 3;
        const baseY = 815 + r() * 128;
        const h = type === 0 ? 330 + r() * 200 : type === 1 ? 290 + r() * 130 : 240 + r() * 140;
        out.push({ x, type, baseY, h, t0: 3.28 + (bi * 7 + k) * 0.16 + r() * 0.25, ph: r() * TAU, dep: (baseY - 815) / 128 });
      }
    });
    return out;
  })();
  function pillarImg(k) {
    const p = PIL[k], cw = 300, ch = Math.ceil(p.h) + 16;
    return P.cached('pb36_p' + k, cw, ch, (g) => {
      const r = rng(4700 + k * 131), bx = cw / 2, by = ch - 4;
      g.lineJoin = 'round';
      const cont = () => { g.strokeStyle = C.line; g.lineWidth = 3.5; g.stroke(); };
      if (p.type === 0) {                                // 细长烛台（无火——火只留给拍三的算力蜡烛）
        const lean = (r() < 0.5 ? -1 : 1) * (0.06 + r() * 0.07) * p.h;
        const topX = bx + lean * 0.35, midX = bx + lean * 0.12, topY = by - p.h;
        g.fillStyle = '#24457a'; g.beginPath(); g.ellipse(bx, by - 6, 54, 13, 0, 0, TAU); g.fill(); cont();
        g.fillStyle = '#2d5a94'; g.beginPath();
        g.moveTo(bx - 8, by - 8); g.quadraticCurveTo(midX - 6, by - p.h * 0.55, topX - 5, topY);
        g.lineTo(topX + 5, topY); g.quadraticCurveTo(midX + 6, by - p.h * 0.55, bx + 8, by - 8); g.closePath(); g.fill(); cont();
        const my = by - p.h * 0.4; g.fillStyle = '#24457a'; g.beginPath(); g.ellipse(midX, my, 40, 9, 0, 0, TAU); g.fill(); cont();
        g.fillStyle = '#1d3866'; g.beginPath(); g.ellipse(topX, topY + 8, 24, 8, 0, 0, TAU); g.fill(); cont();
        g.fillStyle = '#6b8fb6'; g.beginPath(); g.ellipse(topX, topY + 5, 13, 4, 0, 0, TAU); g.fill();
      } else if (p.type === 1) {                         // 瘦长椅：细长背板＋顶横档＋薄坐板＋细长腿
        const wSeat = 118, seatY = by - p.h * 0.36, topY = by - p.h;
        [[-46, -36], [46, 36]].forEach(([dx0, dx1]) => {
          g.fillStyle = '#24457a'; g.beginPath();
          g.moveTo(bx + dx0, seatY - 6); g.lineTo(bx + dx1, topY); g.lineTo(bx + dx1 + 9, topY); g.lineTo(bx + dx0 + 11, seatY - 6);
          g.closePath(); g.fill(); cont();
        });
        g.fillStyle = '#1d3866'; g.fillRect(bx - 62, topY - 5, 124, 11); cont();
        g.fillStyle = '#2d5a94'; g.fillRect(bx - wSeat / 2, seatY - 12, wSeat, 13); cont();
        [[-wSeat / 2 + 10, -14], [wSeat / 2 - 10, 14]].forEach(([dx, dx2]) => {
          g.fillStyle = '#24457a'; g.beginPath();
          g.moveTo(bx + dx, seatY - 1); g.lineTo(bx + dx + dx2, by); g.lineTo(bx + dx + dx2 + 8, by); g.lineTo(bx + dx + 9, seatY - 1);
          g.closePath(); g.fill(); cont();
        });
      } else {                                           // 高书摞：一摞薄书错落叠高
        const n = clamp(Math.round(p.h / (20 + r() * 6)), 8, 13);
        let y = by; const cols = ['#2d5a94', '#1d3866', '#3b6878', '#6b8fb6', '#24457a'];
        for (let i = 0; i < n; i++) {
          const hh = (p.h / n) * (0.82 + r() * 0.3), ww = 150 * (0.8 + r() * 0.28), ox = (r() - 0.5) * 16;
          g.fillStyle = cols[(r() * cols.length) | 0]; g.fillRect(bx - ww / 2 + ox, y - hh, ww, hh);
          g.strokeStyle = C.line; g.lineWidth = 3; g.strokeRect(bx - ww / 2 + ox, y - hh, ww, hh);
          g.fillStyle = '#b6c8d8'; g.fillRect(bx + ww / 2 + ox - 22, y - hh + 3, 16, hh - 6);
          y -= hh;
        }
      }
    });
  }
  function pillars(c, lt, t) {
    PIL.forEach((p, k) => {
      const q = clamp((lt - p.t0) / 1.6, 0, 1); if (q <= 0) return;
      const img = pillarImg(k), gr = ease.out(q), hs = (p.h + 10) * gr;
      c.save();
      c.globalAlpha = ss(p.t0, p.t0 + 0.5, lt) * (0.78 + 0.22 * p.dep);
      c.translate(p.x, p.baseY);
      c.rotate(0.007 * Math.sin(t * 0.5 + p.ph));       // 蓝时期的静：极缓的呼吸式摇摆
      c.drawImage(img, 0, img.height - hs, img.width, hs, -img.width / 2, -hs, img.width, hs);
      c.restore();
    });
  }

  // ---------- 点注网：纸面点注（拍一落纸、拍二加密）＋墙面点注（拍二从纸边蔓延开） ----------
  const PD = (() => {
    const big = [
      { lx: -190, ly: -60, r: 34, num: '0.73', nx: 76, ny: -48, t0: 0.22, ph: 0.3, key: true },
      { lx: -55, ly: 95, r: 30, num: '-1.2', nx: 74, ny: 44, t0: 0.38, ph: 2.1, key: true },
      { lx: 152, ly: -28, r: 32, num: '2.4', nx: 64, ny: -46, t0: 0.54, ph: 4.2, key: true },
      { lx: -262, ly: 152, r: 12, t0: 0.72, ph: 1.1 },
      { lx: 62, ly: -192, r: 9, t0: 0.88, ph: 3.3 },
      { lx: 244, ly: 158, r: 13, t0: 1.04, ph: 5.0 },
      { lx: -18, ly: 28, r: 8, t0: 1.18, ph: 0.9 },
    ];
    const more = (() => {
      const r = rng(3611), out = [];
      for (let i = 0; i < 26; i++) {
        let lx = 0, ly = 0, ok = false;
        for (let tries = 0; tries < 24 && !ok; tries++) {
          lx = -360 + r() * 720; ly = -250 + r() * 500; ok = !zoneHit(lx, ly);
          if (ok) for (let k = 0; k < big.length; k++) if (Math.hypot(big[k].lx - lx, big[k].ly - ly) < 62) { ok = false; break; }
        }
        if (!ok) continue;
        out.push({ lx, ly, r: 5 + r() * 9, t0: 3.12 + (i / 26) * 1.35 + r() * 0.22, ph: r() * TAU, key: i % 6 === 0 });
      }
      return out;
    })();
    return big.concat(more);
  })();
  const WD = (() => {                                    // 墙面点注：离纸越近越先长
    const r = rng(3621), out = [];
    for (let i = 0; i < 84; i++) {
      let x = 960, y = 400, ok = false;
      for (let tries = 0; tries < 24 && !ok; tries++) { x = 44 + r() * 1832; y = 96 + r() * 636; ok = !inPaper(x, y, 36) && y < FL - 22; }
      if (!ok) continue;
      const d = Math.hypot(x - PP.x, y - PP.y);
      out.push({ x, y, r: 6 + r() * 10, t0: 3.62 + 2.55 * Math.pow(d / 920, 0.8) + r() * 0.3, ph: r() * TAU, key: i % 6 === 0 });
    }
    return out;
  })();
  const EDGES = (() => {                                 // 连线：拍一淡铅笔草稿线＋拍二蔓延的近邻连线（都避开题字/计数区）
    const out = [];
    const DRAFT = { '0,1': 1, '1,2': 1, '0,3': 1, '1,6': 1, '2,4': 1 };
    const cand = [];
    for (let i = 0; i < PD.length; i++) for (let j = i + 1; j < PD.length; j++) {
      const d = Math.hypot(PD[i].lx - PD[j].lx, PD[i].ly - PD[j].ly);
      if (d < 208) cand.push([d, i, j]);
    }
    cand.sort((a, b) => a[0] - b[0]);
    const deg = {};
    cand.forEach(([d, i, j]) => {
      const draft = DRAFT[i + ',' + j];
      if (!draft && ((deg[i] || 0) >= 3 || (deg[j] || 0) >= 3)) return;
      for (let s = 1; s <= 3; s++) { const q = s / 4; if (zoneHit(lerp(PD[i].lx, PD[j].lx, q), lerp(PD[i].ly, PD[j].ly, q))) return; }
      deg[i] = (deg[i] || 0) + 1; deg[j] = (deg[j] || 0) + 1;
      out.push({ paper: true, a: i, b: j, t0: Math.max(PD[i].t0, PD[j].t0) + 0.15, draft: !!draft, k: out.length });
    });
    const cand2 = [];
    for (let i = 0; i < WD.length; i++) for (let j = i + 1; j < WD.length; j++) {
      const d = Math.hypot(WD[i].x - WD[j].x, WD[i].y - WD[j].y);
      if (d < 235) cand2.push([d, i, j]);
    }
    cand2.sort((a, b) => a[0] - b[0]);
    const deg2 = {};
    cand2.forEach(([d, i, j]) => {
      if ((deg2[i] || 0) >= 3 || (deg2[j] || 0) >= 3) return;
      for (let s = 1; s <= 3; s++) { const q = s / 4; if (inPaper(lerp(WD[i].x, WD[j].x, q), lerp(WD[i].y, WD[j].y, q), 20)) return; }
      deg2[i] = (deg2[i] || 0) + 1; deg2[j] = (deg2[j] || 0) + 1;
      out.push({ paper: false, a: i, b: j, t0: Math.max(WD[i].t0, WD[j].t0) + 0.2, k: out.length });
    });
    return out;
  })();

  function netEdges(c, lt, t, dens, b3, pulse) {
    const wob = 7 * (1 - b3);                            // 拍三连线收稳不晃
    EDGES.forEach(e => {
      const q = clamp((lt - e.t0) / 0.75, 0, 1); if (q <= 0) return;
      const ax = e.paper ? pL(PD[e.a].lx, PD[e.a].ly)[0] : WD[e.a].x;
      const ay = e.paper ? pL(PD[e.a].lx, PD[e.a].ly)[1] : WD[e.a].y;
      const bx = e.paper ? pL(PD[e.b].lx, PD[e.b].ly)[0] : WD[e.b].x;
      const by = e.paper ? pL(PD[e.b].lx, PD[e.b].ly)[1] : WD[e.b].y;
      const aa = e.paper ? ss(PD[e.a].t0, PD[e.a].t0 + 0.55, lt) : ss(WD[e.a].t0, WD[e.a].t0 + 0.55, lt);
      const ab = e.paper ? ss(PD[e.b].t0, PD[e.b].t0 + 0.55, lt) : ss(WD[e.b].t0, WD[e.b].t0 + 0.55, lt);
      if (aa < 0.3 || ab < 0.3) return;                   // 端点还没落定，线不长
      const p = ease.out(q);
      const mx = (ax + bx) / 2 + wob * Math.sin(t * 1.25 + e.k * 1.7), my = (ay + by) / 2 + wob * 0.6 * Math.cos(t * 1.05 + e.k * 2.3);
      const u = 1 - p;                                    // 线长到 p：画二次曲线的子弧
      const ex = u * u * ax + 2 * u * p * mx + p * p * bx, ey = u * u * ay + 2 * u * p * my + p * p * by;
      const cx2 = ax + p * (mx - ax), cy2 = ay + p * (my - ay);
      const al = clamp((e.draft ? 0.26 : 0.3 + 0.2 * dens) * (1 + 0.6 * b3) + 0.3 * pulse, 0, 1);
      c.strokeStyle = `rgba(${(107 + 75 * b3) | 0},${(143 + 57 * b3) | 0},${(182 + 34 * b3) | 0},${al})`;
      c.lineWidth = 2.4;
      c.beginPath(); c.moveTo(ax, ay); c.quadraticCurveTo(cx2, cy2, ex, ey); c.stroke();
    });
  }
  function dot(c, x, y, d, ap, t, b3, pulse) {
    const br = Math.sin(t * 1.8 + d.ph);                 // 蓝时期的深呼吸
    const grow = d.key || d.num ? 1 + 0.18 * b3 : 1 - 0.25 * b3;
    const r = d.r * ap * (1 + 0.09 * br) * grow;
    let al = ap * (0.6 + 0.4 * (0.5 + 0.5 * Math.sin(t * 1.8 + d.ph * 1.3)));   // 明灭
    if (d.key || d.num) al = clamp(al + 0.15 * b3 + 0.3 * pulse, 0, 1); else al *= 1 - 0.7 * b3;   // 拍三：小点暗下、大点更亮
    if (al <= 0.02) return;
    if ((d.key || d.num) && ap > 0.6) {                  // 大点/关键点的蓝白光晕（变亮变精）
      const hr = r * 2.7, ha = clamp((0.22 + 0.3 * b3 + 0.35 * pulse) * ap * (0.85 + 0.15 * (0.5 + 0.5 * Math.sin(t * 1.8 + d.ph))), 0, 1);
      const hg = c.createRadialGradient(x, y, r * 0.3, x, y, hr);
      hg.addColorStop(0, `rgba(203,216,230,${ha})`); hg.addColorStop(1, 'rgba(203,216,230,0)');
      c.fillStyle = hg; c.beginPath(); c.arc(x, y, hr, 0, TAU); c.fill();
    }
    const kb = d.key || d.num ? b3 : 0;
    c.fillStyle = d.num ? `rgba(201,214,226,${al})` : `rgba(${(107 + 60 * kb) | 0},${(143 + 45 * kb) | 0},${(182 + 30 * kb) | 0},${al})`;
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.strokeStyle = `rgba(12,24,48,${al * 0.55})`; c.lineWidth = 2.6; c.stroke();
    if (d.key && b3 > 0.02) { c.fillStyle = `rgba(226,234,240,${0.85 * b3})`; c.beginPath(); c.arc(x, y, r * 0.34, 0, TAU); c.fill(); }
  }
  function netDotsWall(c, lt, t, b3, pulse) {
    WD.forEach(d => { const ap = ss(d.t0, d.t0 + 0.55, lt); if (ap > 0.01) dot(c, d.x, d.y, d, ap, t, b3, pulse); });
  }
  function netDotsPaper(c, lt, t, b3, pulse) {
    PD.forEach(d => { const ap = ss(d.t0, d.t0 + 0.55, lt); if (ap > 0.01) { const w = pL(d.lx, d.ly); dot(c, w[0], w[1], d, ap, t, b3, pulse); } });
  }

  // ---------- 纸上字：题字（LXGWWenKai-500，换拍先淡出再淡入不叠画）、点注数字、纸角计数（Caveat-600） ----------
  const TITLES = [{ txt: '参数', s: 104 }, { txt: '疯狂卷参数', s: 80 }, { txt: '参数之外', s: 92 }];
  function paperTitle(c, lt) {
    c.save(); c.translate(PP.x, PP.y); c.rotate(PP.rot);
    c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    for (let k = 0; k < 3; k++) {
      const E0 = k < 2 ? [3.0, 7.0][k] : 1e9;
      let a = k === 0 ? 1 : ss(E0 + 0.06, E0 + 0.4, lt);
      if (k < 2) a *= 1 - ss(E0 - 0.4, E0 - 0.06, lt);
      if (a <= 0.01) continue;
      c.globalAlpha = a;
      c.font = TITLES[k].s + 'px "LXGWWenKai-500"';
      c.fillStyle = 'rgba(12,24,48,.5)'; c.fillText(TITLES[k].txt, -327, -183);
      c.fillStyle = '#c9d6e2'; c.fillText(TITLES[k].txt, -330, -186);
    }
    c.globalAlpha = 1; c.restore();
  }
  function paperNums(c, lt, t, b3) {
    c.save(); c.translate(PP.x, PP.y); c.rotate(PP.rot);
    c.font = '58px "Caveat-600"'; c.textAlign = 'left'; c.textBaseline = 'middle';
    PD.forEach(d => {
      if (!d.num) return;
      const ap = ss(d.t0, d.t0 + 0.55, lt); if (ap <= 0.01) return;
      const al = clamp(ap * (0.7 + 0.3 * (0.5 + 0.5 * Math.sin(t * 1.3 + d.ph))) * (1 + 0.35 * b3), 0, 1);
      c.fillStyle = `rgba(201,214,226,${al})`;
      c.fillText(d.num, d.lx + d.nx, d.ly + d.ny);
    });
    c.restore();
  }
  function counterStr(lt) {                              // 纸角蓝白编号：1.5B → 175B → 540B → 1T+
    if (lt < 3.15) return '';
    if (lt < 3.55) return '1.5B';
    if (lt < 4.95) { const v = 1.5 * Math.pow(175 / 1.5, seg(lt, 3.55, 4.95)); return (v < 9.95 ? v.toFixed(1) : Math.round(v)) + 'B'; }
    if (lt < 6.30) { const v = 175 * Math.pow(540 / 175, seg(lt, 4.95, 6.30)); return Math.round(v) + 'B'; }
    return '1T+';
  }
  function paperCounter(c, lt) {
    const cs = counterStr(lt); if (!cs) return;
    const a = ss(3.15, 3.5, lt) * (1 - ss(8.0, 8.6, lt)); if (a <= 0.01) return;
    const th = 1 + 0.15 * Math.sin(Math.PI * seg(lt, 6.3, 6.62));   // 1T+ 揭示时顿一下
    c.save(); c.translate(PP.x, PP.y); c.rotate(PP.rot);
    c.save(); c.globalAlpha = a; c.translate(188, 218); c.scale(th, th);
    c.font = '66px "Caveat-600"'; c.textAlign = 'right'; c.textBaseline = 'alphabetic';
    c.fillStyle = '#c9d6e2'; c.fillText(cs, 0, 0);
    c.strokeStyle = 'rgba(201,214,226,.5)'; c.lineWidth = 2.4;
    c.beginPath(); c.moveTo(-150, 16); c.lineTo(0, 16); c.stroke();
    c.restore(); c.restore();
  }

  // ---------- 拍三：三件瘦长蓝物（数据/方法/算力），依次升起、缓缓点亮 ----------
  function halo(c, x, y, r, a) {
    if (a <= 0.01) return;
    const g2 = c.createRadialGradient(x, y, r * 0.12, x, y, r);
    g2.addColorStop(0, `rgba(203,216,230,${clamp(a, 0, 1)})`); g2.addColorStop(1, 'rgba(203,216,230,0)');
    c.fillStyle = g2; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  }
  function books(c, lt, t, b3) {                         // 一摞高书＝数据
    const a = ss(7.10, 7.60, lt); if (a <= 0.01) return;
    const p = ease.out(seg(lt, 7.10, 8.10));
    c.save(); c.globalAlpha = a; c.translate(0, (1 - p) * 280);
    c.fillStyle = 'rgba(12,24,48,.35)'; c.beginPath(); c.ellipse(548, 952, 96, 15, 0, 0, TAU); c.fill();
    c.save(); c.globalCompositeOperation = 'lighter'; halo(c, 548, 845, 150, (0.1 + 0.07 * Math.sin(t * 1.5)) * b3); c.restore();
    const r = rng(7361); let y = 950; const bx = 548;
    [[138, 34, '#2d5a94'], [124, 30, '#1d3866'], [132, 32, '#3b6878'], [116, 28, '#6b8fb6'], [128, 32, '#24457a'], [120, 30, '#2d5a94'], [112, 34, '#1d3866']].forEach(([w2, h2, col]) => {
      const ox = (r() - 0.5) * 14;
      c.fillStyle = col; c.fillRect(bx - w2 / 2 + ox, y - h2, w2, h2);
      c.strokeStyle = C.line; c.lineWidth = 3.5; c.strokeRect(bx - w2 / 2 + ox, y - h2, w2, h2);
      c.fillStyle = '#b6c8d8'; c.fillRect(bx + w2 / 2 + ox - 24, y - h2 + 4, 17, h2 - 8);
      y -= h2;
    });
    if (b3 > 0.02) {                                     // 顶页描亮＋一缕来回的高光（拍三的小循环）
      c.fillStyle = `rgba(203,216,230,${0.7 * b3})`; c.fillRect(bx - 60, y - 2.5, 120, 3);
      const swx = bx - 64 + 128 * (0.5 - 0.5 * Math.cos(t * 0.85));
      c.fillStyle = `rgba(203,216,230,${0.32 * b3})`; c.fillRect(swx, y + 24, 46, 2.2);
    }
    c.restore();
  }
  function gear(c, lt, t, b3) {                          // 瘦长齿轮＝方法（架在细柱上缓转）
    const a = ss(7.48, 7.98, lt); if (a <= 0.01) return;
    const p = ease.out(seg(lt, 7.48, 8.48));
    c.save(); c.globalAlpha = a; c.translate(0, (1 - p) * 280);
    c.fillStyle = 'rgba(12,24,48,.35)'; c.beginPath(); c.ellipse(962, 952, 110, 16, 0, 0, TAU); c.fill();
    c.fillStyle = '#1a3564'; c.fillRect(950, 830, 13, 124);
    c.strokeStyle = C.line; c.lineWidth = 4; c.strokeRect(950, 830, 13, 124);
    c.save(); c.globalCompositeOperation = 'lighter'; halo(c, 960, 812, 190, (0.12 + 0.1 * Math.sin(t * 1.4)) * b3); c.restore();
    c.save(); c.translate(960, 812); c.rotate(0.24 * Math.max(0, lt - 7.48));
    const rx = 82, ry = 104;
    for (let k = 0; k < 10; k++) {                       // 长齿沿椭圆缘
      const an = k / 10 * TAU, tx = Math.cos(an) * rx, ty = Math.sin(an) * ry;
      c.save(); c.translate(tx, ty); c.rotate(an + Math.PI / 2);
      c.fillStyle = '#24457a'; c.fillRect(-10, -20, 20, 42);
      c.strokeStyle = C.line; c.lineWidth = 3; c.strokeRect(-10, -20, 20, 42);
      c.restore();
    }
    c.strokeStyle = '#2d5a94'; c.lineWidth = 24; c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, TAU); c.stroke();
    c.strokeStyle = C.line; c.lineWidth = 4.5;
    c.beginPath(); c.ellipse(0, 0, rx + 13, ry + 13, 0, 0, TAU); c.stroke();
    c.beginPath(); c.ellipse(0, 0, rx - 13, ry - 13, 0, 0, TAU); c.stroke();
    for (let k = 0; k < 3; k++) { const an = k / 3 * TAU; c.strokeStyle = '#1d3866'; c.lineWidth = 9; c.beginPath(); c.moveTo(Math.cos(an) * 20, Math.sin(an) * 24); c.lineTo(Math.cos(an) * (rx - 14), Math.sin(an) * (ry - 14)); c.stroke(); }
    c.fillStyle = '#132240'; c.beginPath(); c.ellipse(0, 0, 20, 26, 0, 0, TAU); c.fill();
    c.strokeStyle = C.line; c.lineWidth = 4; c.stroke();
    if (b3 > 0.02) {                                     // 描白（变亮变精）
      c.strokeStyle = `rgba(203,216,230,${0.55 * b3})`; c.lineWidth = 3.5;
      c.beginPath(); c.ellipse(0, 0, rx + 2, ry + 2, 0, -2.75, -0.9); c.stroke();
    }
    c.restore(); c.restore();
  }
  function candle(c, lt, t, b3) {                        // 细长蜡烛＝算力（烛焰缓缓拨亮）
    const a = ss(7.86, 8.36, lt); if (a <= 0.01) return;
    const p = ease.out(seg(lt, 7.86, 8.86));
    const lit = ss(7.98, 8.9, lt);
    const bx = 1372;
    c.save(); c.globalAlpha = a; c.translate(0, (1 - p) * 280);
    c.fillStyle = 'rgba(12,24,48,.35)'; c.beginPath(); c.ellipse(bx, 952, 66, 12, 0, 0, TAU); c.fill();
    c.save(); c.globalCompositeOperation = 'lighter';
    halo(c, bx - 12, 726, 60 + 70 * lit, (0.08 + 0.3 * lit) * (0.85 + 0.15 * Math.sin(t * 7.3)));
    c.restore();
    c.fillStyle = '#24457a'; c.beginPath(); c.ellipse(bx, 950, 48, 12, 0, 0, TAU); c.fill();
    c.strokeStyle = C.line; c.lineWidth = 3.5; c.stroke();
    c.fillStyle = '#6b8fb6'; c.beginPath();               // 微微左弯的细长烛身（下垂的弯）
    c.moveTo(bx - 9, 948); c.quadraticCurveTo(bx - 16, 838, bx - 18, 748);
    c.lineTo(bx + 7, 746); c.quadraticCurveTo(bx + 2, 838, bx + 10, 948); c.closePath(); c.fill();
    c.strokeStyle = C.line; c.lineWidth = 4; c.stroke();
    c.fillStyle = '#8fb0cc'; c.beginPath(); c.ellipse(bx - 5, 902, 6, 11, 0.5, 0, TAU); c.fill();   // 一滴烛泪
    c.strokeStyle = C.line; c.lineWidth = 2.5; c.stroke();
    const fx = bx - 6, fy = 738;                          // 烛芯＋火苗（细长、摇曳、随 lit 长大）
    c.strokeStyle = '#0c1830'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(fx, fy + 4); c.lineTo(fx - 2, fy - 12); c.stroke();
    const fl = Math.max(0.14, lit) * (1 + 0.09 * Math.sin(t * 7.3) + 0.05 * Math.sin(t * 11.1));
    c.save(); c.translate(fx, fy); c.rotate(0.07 * Math.sin(t * 2.6)); c.scale(fl, fl);
    c.fillStyle = 'rgba(182,200,216,.8)'; c.beginPath();
    c.moveTo(0, 14); c.quadraticCurveTo(-8, 2, 0, -26); c.quadraticCurveTo(8, 2, 0, 14); c.closePath(); c.fill();
    c.fillStyle = 'rgba(230,238,243,.85)'; c.beginPath();
    c.moveTo(0, 10); c.quadraticCurveTo(-4, 2, 0, -12); c.quadraticCurveTo(4, 2, 0, 10); c.closePath(); c.fill();
    c.restore();
    c.restore();
  }

  // ---------- 冷光里的浮尘（贯穿全片的小循环） ----------
  function dust(c, t) {
    c.save(); c.globalCompositeOperation = 'lighter';
    P.particles(14, 36, t, { x0: 120, x1: 1800, y0: 700, y1: 130, speed: 24, drift: 20, life: 9 }).forEach(pt => {
      const al = (0.1 + 0.1 * Math.sin(t * 2.6 + pt.i * 1.9)) * Math.sin(Math.PI * pt.q);
      if (al <= 0.01) return;
      c.fillStyle = `rgba(203,216,230,${al})`;
      c.beginPath(); c.arc(pt.x, pt.y, 2.2 * pt.s, 0, TAU); c.fill();
    });
    c.restore();
  }

  // ---------- 收尾：一道宽笔淡蓝罩从右往左铺过（笔刷拖着走、罩住留下，软前缘不跳变） ----------
  const glide = () => P.cached('pb36_glide', W, 660, (g) => {
    const r = rng(3690); g.lineCap = 'butt';
    const cols = ['rgba(182,200,216,', 'rgba(143,176,204,', 'rgba(203,216,230,'];
    for (let i = 0; i < 150; i++) {
      const y = 40 + r() * 580, x = r() * W, L = 300 + r() * 1100, w2 = 26 + r() * 110;
      g.strokeStyle = cols[(r() * 3) | 0] + (0.028 + r() * 0.026) + ')';
      g.lineWidth = w2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + L, y + (r() - 0.5) * 30); g.stroke();
    }
    g.globalCompositeOperation = 'destination-in';       // 上下边缘淡出＋左缘软（跟着扫过的前缘走）
    const gg = g.createLinearGradient(0, 0, 0, 660);
    gg.addColorStop(0, 'rgba(0,0,0,0)'); gg.addColorStop(0.22, 'rgba(0,0,0,1)'); gg.addColorStop(0.78, 'rgba(0,0,0,1)'); gg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gg; g.fillRect(0, 0, W, 660);
    const gl = g.createLinearGradient(0, 0, 300, 0);
    gl.addColorStop(0, 'rgba(0,0,0,0)'); gl.addColorStop(1, 'rgba(0,0,0,1)');
    g.fillStyle = gl; g.fillRect(0, 0, 300, 660);
    g.globalCompositeOperation = 'source-over';
  });
  function glidePass(c, lt) {
    const q = seg(lt, 9.02, 9.9); if (q <= 0) return;
    const a = ss(9.02, 9.28, lt); if (a <= 0.01) return;
    const lead = lerp(1930, -20, ease.inOut(q));         // 前缘从右缘拖到左缘，铺过的罩留下
    c.save(); c.globalAlpha = a;
    c.beginPath(); c.rect(lead, 0, W - lead, H); c.clip();
    c.drawImage(glide(), 0, 200);
    c.restore();
  }

  // ---------- 画布纹＋冷暗角 ----------
  const over = () => P.cached('pb36_over', W, H, (g) => {
    g.strokeStyle = 'rgba(10,20,40,.06)'; g.lineWidth = 1;
    for (let x = 0; x < W; x += 4) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    for (let y = 0; y < H; y += 4) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    const v = g.createRadialGradient(860, 480, 420, 940, 560, 1200);
    v.addColorStop(0, 'rgba(5,10,25,0)'); v.addColorStop(1, 'rgba(5,10,25,.58)');
    g.fillStyle = v; g.fillRect(0, 0, W, H);
  });

  return {
    init() {
      U.assertGlyphs('104px "LXGWWenKai-500"', '参数疯狂卷之外', 's36_picasso_blue 蓝纸题字');
      U.assertGlyphs('58px "Caveat-600"', '0.73-1.2 2.4 1.5B 175B 540B 1T+', 's36_picasso_blue 手写点注与计数');
    },
    draw(c, lt, t) {
      const dens = ss(3.15, 6.25, lt), b3 = ss(7, 8.6, lt);
      const pulse = Math.sin(Math.PI * seg(lt, 6.3, 6.78));              // 1T+ 揭示：点网一次泛白（全片唯一重音）
      // 运镜：近看蓝纸缓推 → 拉远展开全画室 → 停住微收全貌
      let z, cx, cy;
      if (lt < 3) { const q = ease.inOut(lt / 3); z = 1 + 0.16 * q; cx = lerp(960, 872, q); cy = lerp(540, 445, q); }
      else if (lt < 7) { const q = ease.inOut((lt - 3) / 4); z = 1.16 - 0.16 * q; cx = lerp(872, 960, q); cy = lerp(445, 540, q); }
      else { z = 1 + 0.014 * ss(7.2, 9.8, lt); cx = 960; cy = 540; }
      c.save(); c.translate(cx, cy); c.scale(z, z); c.translate(-cx, -cy);
      c.drawImage(stat(), 0, 0);
      if (dens > 0.01) {                                                 // 墙面宽笔随密度加深变沉
        c.globalAlpha = 0.72 * dens; c.drawImage(densOv(), 0, 0); c.globalAlpha = 1;
        c.fillStyle = `rgba(6,14,36,${0.1 * dens})`; c.fillRect(0, 0, W, H);
      }
      netEdges(c, lt, t, dens, b3, pulse);                               // 线在点下
      netDotsWall(c, lt, t, b3, pulse);                                  // 墙上点在支柱后
      pillars(c, lt, t);                                                 // 支柱立在网前
      netDotsPaper(c, lt, t, b3, pulse);                                 // 纸面点注
      paperTitle(c, lt);
      paperNums(c, lt, t, b3);
      paperCounter(c, lt);
      books(c, lt, t, b3);                                               // 拍三三件物（前景）
      gear(c, lt, t, b3);
      candle(c, lt, t, b3);
      dust(c, t);
      if (pulse > 0.02) {                                                // 1T+ 点网一次涌白
        c.save(); c.globalCompositeOperation = 'lighter';
        const g2 = c.createRadialGradient(PP.x, PP.y, 60, PP.x, PP.y, 760);
        g2.addColorStop(0, `rgba(203,216,230,${0.22 * pulse})`); g2.addColorStop(1, 'rgba(203,216,230,0)');
        c.fillStyle = g2; c.fillRect(0, 0, W, H);
        c.restore();
      }
      glidePass(c, lt);                                                  // 收尾宽笔淡蓝罩
      c.drawImage(over(), 0, 0);
      c.restore();
    },
  };
})();
