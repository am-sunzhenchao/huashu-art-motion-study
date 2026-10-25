// s11_cubism · 1912 分析立体主义（毕加索／布拉克）×「大模型参数」风格样片（10s 单镜头三拍）。
// 题材构图（不搬速通片的房间）：一张分析立体主义拼贴——参数＝半透明渐变切面上的报纸字数字剪贴。
//   拍一 0–3s   三块放大的半透明渐变切面（参数本体，各贴 0.73 / −1.2 / 2.4 剪贴，逐块弹出被端详），
//               切面小幅滑动错位、明暗微沸（8fps），几片半透明三角「切面刀」匀速掠过＝切开；镜头缓推近；
//   拍二 3–7s   三块切面缩位成种子，碎面群沿脊线与两翼错位拼合增殖成一大片多视角解构结构
//               （顶部 2×2 窗格碎面各自错位滑移＝同一碎面场的四个视角），胸前剪报翻牌计数器
//               （AlfaSlabOne 模版字断口，12fps 卡点）滚动 1.5B→175B→540B→1T+，
//               1T+ 揭示时一道米白波从计数器扫过全结构（全片唯一一次重音），
//               背景深褐大面＋贯穿细直线随密度加深加密（bgB 整层淡入）；镜头先缓拉远展开；
//   拍三 7–10s 增殖停住、滑动收缓；书摞（数据）、齿轮（方法）、灯泡（算力）三件立体主义静物解构
//               从下方依次升起归位（齿轮缓转、灯泡暖光闪烁），碎面逐块描米白亮边、铺亮面
//               （从变多转为变亮变精），一道米白高光带扫过，贯穿线加浓收稳；镜头停收全貌。
// 管线：底版 bgA（纸底＋手排大面含中央深褐大面＋放射扇面＋随机小切面＋排线/点画＋JOU 报纸＋
//      9000 短划砂纹＋贯穿线＋颗粒，2400×1360 超采样整张 P.cached，做旧只上背景）＋
//      密度升级层 bgB（更多深褐大面＋26 条贯穿线＋压深薄纱，随密度整层淡入）；
//      动态层每帧画：呼吸纹理补丁、8 片漂浮碎面、切面刀、窗格碎面、种子切面、~112 片机器碎面
//      （plane 渐变＋滑动＋8fps 明暗微沸）、贯穿线蔓延、上层透明叠面、计数器、三件静物
//      （平涂进 willReadFrequently 层 → facetize 切面器三角不裁剪 → 灯丝与暖光盖面）。
// 约定：随机全用 U.rng / U.hash 种子（同帧两次渲染逐像素一致）；无角色（不画脸、不加脸）；
//      中文屏上字 LXGWWenKai-500、数字 AlfaSlabOne-400、报纸 LibreBaskerville-700，落笔前 U.assertGlyphs。
SCENES['s11_cubism'] = (() => {
  const W = 1920, H = 1080, TAU = Math.PI * 2;
  const { clamp, lerp, ss, ease, hash } = U, P = PAINT;
  const C = { paper: '#d6c8ac', cream: '#ece3cf', ochre: '#b8975f', brown: '#6e5538', dbrown: '#3a2c1e', grey: '#a8a395', bgrey: '#8e9eab', dgrey: '#5a5852', ink: '#2e241a' };
  const WIN = ['#c9d3da', '#8fa3b3', '#e4e6e2', '#6f8597', '#b4c1cb', '#5f7385'];   // 卡内窗景色组

  // 要 getImageData 的离屏层必须 willReadFrequently，且每帧 g.reset()（清像素＋清状态）——原版踩过的确定性坑
  const LAYERS = {};
  const layer = (k) => { if (!LAYERS[k]) { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.getContext('2d', { willReadFrequently: true }); LAYERS[k] = cv; } return LAYERS[k]; };
  const poly = (g, pts) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); };
  // 「切面」：沿随机顶点方向从亮到暗的线性渐变（分析立体主义的透明叠面）
  const plane = (g, pts, col, alpha, r, dark = 0.4, light = 0.25) => {
    const c0 = Array.isArray(col) ? col : P.hex(col);
    let a = pts[0], b = pts[(r() * pts.length) | 0]; if (a === b) b = pts[(pts.length / 2) | 0];
    const gr = g.createLinearGradient(a[0], a[1], b[0], b[1]);
    gr.addColorStop(0, P.rgb(P.mix(c0, [250, 244, 228], light), alpha)); gr.addColorStop(0.55, P.rgb(c0, alpha)); gr.addColorStop(1, P.rgb(P.mix(c0, [45, 35, 25], dark), alpha));
    g.fillStyle = gr; poly(g, pts); g.fill();
  };

  // ---------- 切面器：抖动三角网，三角不裁剪（轮廓被切成直边，可伸出物外） ----------
  function facetize(g, src, box, cell, seed, t, opt) {
    const { boilFrac = 0.25, alpha = 0.95, edge = 'rgba(40,30,20,.32)', light = 0.2, dark = 0.32, minA = 120 } = opt || {};
    const [x0, y0, x1, y1] = box, w = x1 - x0, h = y1 - y0, d = src.getContext('2d').getImageData(x0, y0, w, h).data;
    const nx = Math.ceil(w / cell), ny = Math.ceil(h / cell), r = U.rng(seed), pts = [];
    const st = P.boilSeed(t, 8);
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) { const k = j * (nx + 1) + i;
      pts.push([x0 + i * cell + (r() - .5) * cell * 0.85 + (hash(k, st * 3 + seed) - .5) * cell * 0.16,
                y0 + j * cell + (r() - .5) * cell * 0.85 + (hash(k, st * 5 + seed) - .5) * cell * 0.16]); }
    const at = (x, y) => { const ix = clamp(Math.round(x - x0), 0, w - 1), iy = clamp(Math.round(y - y0), 0, h - 1), k = (iy * w + ix) * 4; return [d[k], d[k + 1], d[k + 2], d[k + 3]]; };
    g.lineJoin = 'round';
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const A = pts[j * (nx + 1) + i], B = pts[j * (nx + 1) + i + 1], Cc = pts[(j + 1) * (nx + 1) + i], D = pts[(j + 1) * (nx + 1) + i + 1];
      const tris = r() < 0.5 ? [[A, B, D], [A, D, Cc]] : [[A, B, Cc], [B, D, Cc]];
      tris.forEach((tri, k) => {
        const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3, cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3, s = at(cx, cy);
        if (s[3] < minA) return;
        const flick = hash(i * 31 + j, k + st * 7) < boilFrac ? (hash(i, j + st) - 0.5) * 0.25 : 0;
        const sh = 0.8 + r() * 0.38 + flick, col = [s[0] * sh, s[1] * sh, s[2] * sh];
        const gr = g.createLinearGradient(tri[0][0], tri[0][1], tri[2][0], tri[2][1]);
        gr.addColorStop(0, P.rgb(P.mix(col, [250, 244, 228], light), alpha)); gr.addColorStop(1, P.rgb(P.mix(col, [40, 32, 24], dark), alpha));
        g.fillStyle = gr; poly(g, tri); g.fill(); g.strokeStyle = edge; g.lineWidth = 1; g.stroke();
      });
    }
  }

  // ---------- 底版 bgA（超采样 2400×1360，世界坐标原点 (-240,-140)） ----------
  const jouScrap = () => P.cached('cub_jou', 300, 190, (g) => {
    g.fillStyle = '#ebe3cc'; g.fillRect(0, 0, 300, 190); g.strokeStyle = 'rgba(60,45,30,.6)'; g.lineWidth = 1; g.strokeRect(0.5, 0.5, 299, 189);
    g.fillStyle = '#2b2219'; g.font = '84px "LibreBaskerville-700"'; g.textBaseline = 'alphabetic'; g.fillText('JOU', 16, 82);
    g.fillRect(12, 94, 276, 3); g.font = '12px "LibreBaskerville-700"'; g.fillText('LA BATAILLE', 14, 118); g.fillText("S'EST ENGAGÉ UN CHAT", 112, 118); g.fillRect(12, 126, 276, 1.5);
    g.fillStyle = 'rgba(50,40,30,.55)'; for (let col = 0; col < 3; col++) for (let y = 136; y < 185; y += 5) g.fillRect(14 + col * 94, y, 84 - ((y * 7 + col * 13) % 23), 2);
    g.strokeStyle = 'rgba(40,30,20,.5)'; g.beginPath(); g.moveTo(106, 128); g.lineTo(106, 186); g.moveTo(200, 128); g.lineTo(200, 186); g.stroke();
  });
  const bgA = () => P.cached('cub_bg', 2400, 1360, (g) => {
    const r = U.rng(1912);
    g.translate(240, 140);
    g.fillStyle = C.paper; g.fillRect(-240, -140, 2400, 1360);
    // 手排大面（中央一块深褐大面给足——原版偏亮是老坑）
    const big = [
      [[[520, 230], [1360, 210], [1400, 860], [540, 880]], C.dbrown, .5],
      [[[-240, 0], [360, 0], [240, 330], [-240, 300]], C.grey, .55],
      [[[380, -40], [760, -60], [640, 220], [320, 180]], C.cream, .5],
      [[[1250, -60], [1700, -80], [1560, 240], [1180, 200]], C.ochre, .45],
      [[[1700, 120], [2160, 80], [2160, 620], [1760, 560]], C.grey, .45],
      [[[-240, 700], [300, 640], [380, 1220], [-240, 1220]], C.brown, .45],
      [[[400, 940], [1600, 920], [1680, 1220], [360, 1220]], C.dbrown, .4],
      [[[1480, 300], [1690, 260], [1620, 520], [1430, 480]], C.bgrey, .4],
      [[[1650, 650], [2000, 600], [2050, 1000], [1700, 1020]], C.cream, .35],
      [[[300, 60], [520, 40], [470, 300], [280, 260]], C.dgrey, .3],
    ];
    big.forEach(([pts, col, a]) => plane(g, pts, col, a, r));
    // 底部放射扇面（自 (860,1220) 发出，亮暗交替——桌下扇面的笔法，位置为这台结构重排）
    for (let i = 0; i < 9; i++) { const a0 = -Math.PI + 0.3 + i * 0.26, a1 = a0 + 0.14;
      plane(g, [[860, 1220], [860 + Math.cos(a0) * 640, 1220 + Math.sin(a0) * 560], [860 + Math.cos(a1) * 640, 1220 + Math.sin(a1) * 560]], i % 2 ? C.cream : C.brown, 0.26, r, 0.5, 0.3); }
    // 随机小切面
    for (let i = 0; i < 60; i++) { const cx = r() * W, cy = r() * H, s = 50 + r() * 180, a0 = r() * TAU, n = r() < 0.6 ? 3 : 4;
      const pts = []; for (let k = 0; k < n; k++) { const a = a0 + k / n * TAU + (r() - .5) * 0.8; pts.push([cx + Math.cos(a) * s * (0.5 + r() * 0.6), cy + Math.sin(a) * s * (0.5 + r() * 0.6)]); }
      plane(g, pts, [C.cream, C.grey, C.ochre, C.bgrey, C.brown, C.dgrey][(r() * 6) | 0], 0.16 + r() * 0.26, r); }
    // 排线面 ×3（静态肌理）
    [[[640, -20], [780, -50], [740, 130], [610, 100]], [[-240, 500], [-80, 480], [-60, 700], [-240, 720]], [[1900, 180], [2120, 150], [2080, 380], [1880, 340]]].forEach((pts, k) => {
      g.save(); poly(g, pts); g.clip(); g.strokeStyle = 'rgba(50,38,26,.42)'; g.lineWidth = 1.2; g.beginPath();
      for (let d2 = -900; d2 < 900; d2 += 7) { g.moveTo(pts[0][0] + d2, pts[0][1] - 300); g.lineTo(pts[0][0] + d2 + (k % 2 ? 300 : -120), pts[0][1] + 300); } g.stroke(); g.restore(); });
    // 点画面 ×2
    [[[1860, 660], [2000, 630], [1970, 790], [1850, 770]], [[60, 1080], [180, 1050], [160, 1210], [40, 1230]]].forEach((pts) => {
      g.save(); poly(g, pts); g.clip(); g.fillStyle = 'rgba(40,30,20,.4)';
      for (let y = 620; y < 1240; y += 9) for (let x = 0 + (y / 9 % 2) * 4.5; x < 2120; x += 9) { if (x < pts[0][0] - 200 || x > pts[0][0] + 260 || y < pts[0][1] - 220 || y > pts[0][1] + 260) continue; g.beginPath(); g.arc(x, y, 1.6, 0, TAU); g.fill(); } g.restore(); });
    // JOU 报纸（贴左下，微旋）
    g.save(); g.translate(235, 822); g.rotate(-0.12); g.drawImage(jouScrap(), -150, -95); g.restore();
    g.strokeStyle = 'rgba(40,30,20,.7)'; g.lineWidth = 2; g.beginPath(); g.moveTo(395, 900); g.lineTo(430, 950); g.moveTo(85, 940); g.lineTo(60, 990); g.stroke();
    // 布拉克短划砂纹（做旧，只上背景）
    for (let i = 0; i < 9000; i++) { const x = -240 + r() * 2400, y = -140 + r() * 1360; g.fillStyle = r() < 0.55 ? 'rgba(246,238,220,.28)' : 'rgba(60,45,30,.16)'; g.fillRect(x, y, 3 + r() * 5, 1.5); }
    // 贯穿细直线（passage）
    g.strokeStyle = 'rgba(40,30,20,.55)'; g.lineWidth = 1.3;
    for (let i = 0; i < 30; i++) { const x = r() * W, y = r() * H, a = r() * Math.PI, L = 140 + r() * 520; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }
    g.drawImage(P.grain('cubg', 0.05, [50, 40, 30], 0.18), -240, -140, 2400, 1360);
  });

  // ---------- 密度升级层 bgB（拍二整层淡入：更多深褐大面＋贯穿线＋压深薄纱） ----------
  const bgB = () => P.cached('cub_bg2', 2400, 1360, (g) => {
    const r = U.rng(1937);
    g.translate(240, 140);
    const big2 = [
      [[[430, 180], [1500, 150], [1560, 880], [470, 910]], C.dbrown, .34],
      [[[-240, 380], [320, 330], [260, 900], [-240, 940]], C.brown, .38],
      [[[1720, 380], [2160, 340], [2160, 1020], [1780, 1000]], C.dgrey, .4],
      [[[700, -60], [1260, -90], [1180, 180], [720, 140]], C.ochre, .32],
    ];
    big2.forEach(([pts, col, a]) => plane(g, pts, col, a, r));
    g.strokeStyle = 'rgba(40,30,20,.6)'; g.lineWidth = 1.4;
    for (let i = 0; i < 26; i++) { const x = r() * W, y = r() * H, a = r() * Math.PI, L = 160 + r() * 500; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }
    g.fillStyle = 'rgba(58,44,30,.10)'; g.fillRect(-240, -140, 2400, 1360);
  });

  // ---------- 窗格碎面场（缓存一张 560×540 的抽象切面图，四格各自错位取景＝多视角） ----------
  const field = () => P.cached('cub_field', 560, 540, (g) => {
    const r = U.rng(77);
    g.fillStyle = '#9fb0bd'; g.fillRect(0, 0, 560, 540);
    for (let i = 0; i < 48; i++) { const cx = r() * 560, cy = r() * 540, s = 36 + r() * 150, a0 = r() * TAU;
      const pts = [0, 1, 2].map(k => { const a = a0 + k * 2.1 + (r() - .5) * 0.6; return [cx + Math.cos(a) * s, cy + Math.sin(a) * s * (0.4 + r())]; });
      plane(g, pts, WIN[(r() * 6) | 0], 0.45 + r() * 0.4, r, 0.45, 0.35); }
    [[150, 0, 60], [230, 0, 30]].forEach(([x, y, w]) => plane(g, [[x, y], [x + w, y], [x + w + 300, y + 420], [x + 300, y + 420]], '#e8ecec', 0.55, r, 0.3, 0.5));
    g.drawImage(P.grain('cubw', 0.04, [255, 255, 255], 0.2), 0, 0, 560, 540, 0, 0, 560, 540);
  });

  // ---------- 镜头：一个连续运镜（近景→展开→收稳） ----------
  const CAMK = [[0, 1.0], [3.0, 1.10], [4.6, 0.99], [7.0, 0.93], [10, 0.945]];
  function camS(lt) {
    if (lt <= CAMK[0][0]) return CAMK[0][1];
    for (let k = 0; k < CAMK.length - 1; k++) if (lt >= CAMK[k][0] && lt <= CAMK[k + 1][0])
      return lerp(CAMK[k][1], CAMK[k + 1][1], ease.inOut((lt - CAMK[k][0]) / (CAMK[k + 1][0] - CAMK[k][0])));
    return CAMK[CAMK.length - 1][1];
  }

  // ---------- 三颗参数种子（拍一特写 → 3.0–4.2 缩位入结构） ----------
  const SE = [
    { cx: 640, cy: 470, dx: 640, dy: 560, col: C.ochre, num: '0.73', s: 195, ph: 0.7, pop: 0.55, ang: -0.06, lx: -40, ly: -46, alpha: 0.62 },
    { cx: 1180, cy: 350, dx: 1000, dy: 450, col: C.bgrey, num: '-1.2', s: 170, ph: 2.1, pop: 1.15, ang: 0.05, lx: 30, ly: -40, alpha: 0.58 },
    { cx: 1090, cy: 680, dx: 1230, dy: 640, col: C.cream, num: '2.4', s: 150, ph: 3.6, pop: 1.65, ang: -0.04, lx: 20, ly: -50, alpha: 0.66 },
  ];
  SE.forEach((sd, n) => { const r = U.rng(900 + n); const pts = []; const a0 = r() * TAU;
    for (let k = 0; k < 5; k++) { const a = a0 + k / 5 * TAU + (r() - .5) * 0.5; const rr = sd.s * (0.75 + r() * 0.35); pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); }
    sd.pts = pts; sd.seed = 1 + ((r() * 1e6) | 0); });

  // ---------- 机器碎面群（骨架生成：冠/脊/两翼×2/底座/体内散布，出生序列洗牌铺满 3.30–6.42） ----------
  const FR = [];
  {
    const r = U.rng(1913), slots = [];
    for (let i = 0; i < 7; i++) slots.push([lerp(700, 1020, i / 6), 235 + (r() - 0.5) * 46]);                       // 冠
    for (let i = 0; i < 9; i++) slots.push([860 + (r() - 0.5) * 70, lerp(650, 845, i / 8)]);                          // 脊
    for (let i = 0; i < 8; i++) { const q = i / 7; slots.push([lerp(860, 445, q) + (r() - 0.5) * 60, lerp(560, 425, q) + (r() - 0.5) * 55]); }
    for (let i = 0; i < 8; i++) { const q = i / 7; slots.push([lerp(860, 1365, q) + (r() - 0.5) * 60, lerp(560, 415, q) + (r() - 0.5) * 55]); }
    for (let i = 0; i < 7; i++) { const q = i / 6; slots.push([lerp(860, 545, q) + (r() - 0.5) * 60, lerp(620, 790, q) + (r() - 0.5) * 50]); }
    for (let i = 0; i < 7; i++) { const q = i / 6; slots.push([lerp(860, 1330, q) + (r() - 0.5) * 60, lerp(620, 775, q) + (r() - 0.5) * 50]); }
    for (let i = 0; i < 8; i++) slots.push([lerp(565, 1165, i / 7) + (r() - 0.5) * 40, 835 + (r() - 0.5) * 30]);     // 底座
    for (let i = 0; i < 58; i++) { let x, y, guard = 0;                                                            // 体内散布
      do { x = 860 + (r() - 0.5) * 860; y = 540 + (r() - 0.5) * 560; } while (Math.abs(x - 860) / 430 + Math.abs(y - 540) / 280 > 1 && guard++ < 40);
      slots.push([x, y]); }
    for (let k = slots.length - 1; k > 0; k--) { const m = (r() * (k + 1)) | 0; const tt = slots[k]; slots[k] = slots[m]; slots[m] = tt; }
    const cols = [C.cream, C.grey, C.ochre, C.bgrey, C.brown, C.dbrown], WT = [15, 15, 19, 12, 19, 20];
    slots.forEach(([cx, cy], n) => {
      const born = 3.30 + 3.12 * Math.pow(n / (slots.length - 1), 0.85) + r() * 0.05;
      const s = 46 + r() * 80, a0 = r() * TAU, nv = r() < 0.62 ? 3 : 4;
      const pts = []; for (let k = 0; k < nv; k++) { const a = a0 + k / nv * TAU + (r() - .5) * 0.8; pts.push([cx + Math.cos(a) * s * (0.5 + r() * 0.6), cy + Math.sin(a) * s * (0.5 + r() * 0.6)]); }
      let pick = r() * 100, ci = 5; for (let k = 0; k < 6; k++) { pick -= WT[k]; if (pick <= 0) { ci = k; break; } }
      FR.push({ pts, cx, cy, col: cols[ci], alpha: 0.26 + r() * 0.34, born, ph: r() * TAU, seed: 1 + ((r() * 1e6) | 0), i: n });
    });
  }

  // ---------- 贯穿线（结构线随密度生长蔓延；拍三加浓收稳） ----------
  const PL = [];
  {
    const r = U.rng(4242);
    [[[860, 290], [860, 850]], [[860, 560], [430, 420]], [[860, 560], [1370, 410]], [[860, 620], [530, 800]], [[860, 620], [1340, 785]], [[560, 838], [1175, 838]], [[700, 235], [1020, 235]]]
      .forEach(([a, b], i) => PL.push({ a, b, w: 2 + (i % 3) * 0.8, born: 3.5 + i * 0.26 }));
    for (let i = 0; i < 26; i++) { const x = r() * W, y = r() * H, a = r() * Math.PI, L = 140 + r() * 480; PL.push({ a: [x, y], b: [x + Math.cos(a) * L, y + Math.sin(a) * L], w: 1.3, born: 3.4 + r() * 2.6 }); }
  }

  // ---------- 边缘漂浮碎面 ×8（拍一就有，全程小循环） ----------
  const AM = [];
  { const r = U.rng(808);
    for (let i = 0; i < 8; i++) { const left = i % 2 === 0;
      const cx = left ? 130 + r() * 300 : 1480 + r() * 340, cy = 130 + r() * 760;
      const s = 42 + r() * 46, a0 = r() * TAU, n = r() < 0.6 ? 3 : 4;
      const pts = []; for (let k = 0; k < n; k++) { const a = a0 + k / n * TAU + (r() - .5) * 0.7; pts.push([Math.cos(a) * s * (0.6 + r() * 0.5), Math.sin(a) * s * (0.6 + r() * 0.5)]); }
      AM.push({ cx, cy, pts, col: [C.cream, C.grey, C.ochre, C.bgrey][(r() * 4) | 0], alpha: 0.24 + r() * 0.14, ph: r() * TAU, seed: 1 + ((r() * 1e6) | 0) });
    } }

  // ---------- 上层透明叠面 ×4（把结构嵌进空间） ----------
  const OV = [[[720, 330], [900, 300], [880, 470]], [[980, 540], [1120, 500], [1150, 690], [1010, 720]], [[600, 640], [740, 600], [700, 760]], [[1180, 430], [1340, 400], [1300, 620]]];

  // ---------- 计数器（真实序列 1.5B→175B→540B→1T+，12fps 卡点跳换＋模版字断口） ----------
  const CK = [[3.30, 0], [3.92, 1.5], [4.18, 1.5], [4.98, 175], [5.08, 175], [5.88, 540], [5.98, 540], [6.78, 1000], [999, 1000]];
  function counterVal(lt) {
    for (let i = 0; i < CK.length - 1; i++) if (lt >= CK[i][0] && lt <= CK[i + 1][0])
      return lerp(CK[i][1], CK[i + 1][1], ease.inOut(clamp((lt - CK[i][0]) / (CK[i + 1][0] - CK[i][0]), 0, 1)));
    return lt < 3.3 ? 0 : 1000;
  }

  // ---------- 拍三三件静物（平涂进层 → facetize 切面；灯丝暖光盖面不切） ----------
  const OBJ = [
    { key: 'obk', x: 430, y: 850, rise: 7.15, box: [292, 646, 572, 1130], cell: 34, seed: 61, label: '数据', lx: 455, ly: 712 },
    { key: 'ogr', x: 1290, y: 882, rise: 7.55, box: [1146, 738, 1434, 1194], cell: 30, seed: 67, label: '方法', lx: 1290, ly: 735 },
    { key: 'obu', x: 1632, y: 706, rise: 7.95, box: [1498, 566, 1766, 990], cell: 30, seed: 71, label: '算力', lx: 1758, ly: 612 },
  ];
  function drawBooksFlat(g, x, y) {
    const rows = [
      { dy: -12, w: 252, h: 42, c: '#b8975f', rot: -0.028 },
      { dy: -54, w: 238, h: 40, c: '#8e9eab', rot: 0.03 },
      { dy: -94, w: 246, h: 38, c: '#ece3cf', rot: -0.02 },
      { dy: -132, w: 226, h: 36, c: '#a8a395', rot: 0.035 },
    ];
    g.save(); g.translate(x, y);
    rows.forEach(rw => {
      g.save(); g.rotate(rw.rot);
      g.fillStyle = rw.c; g.fillRect(-rw.w / 2, rw.dy, rw.w, rw.h);
      g.fillStyle = '#fbf8f0'; g.fillRect(rw.w / 2 - 18, rw.dy + 5, 9, rw.h - 10);
      g.strokeStyle = C.ink; g.lineWidth = 2.6; g.strokeRect(-rw.w / 2, rw.dy, rw.w, rw.h);
      g.strokeStyle = 'rgba(46,36,26,.5)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-rw.w / 2 + 16, rw.dy + 6); g.lineTo(-rw.w / 2 + 16, rw.dy + rw.h - 6); g.stroke();
      g.restore();
    });
    g.restore();
  }
  function drawGearFlat(g, x, y, lt) {
    g.save(); g.translate(x, y); g.rotate(lt * 0.5);
    for (let i = 0; i < 9; i++) { const a = i / 9 * TAU;
      poly(g, [[Math.cos(a) * 128, Math.sin(a) * 128], [Math.cos(a + 0.16) * 98, Math.sin(a + 0.16) * 98], [Math.cos(a - 0.16) * 98, Math.sin(a - 0.16) * 98]]);
      g.fillStyle = '#6e5538'; g.fill(); g.strokeStyle = C.ink; g.lineWidth = 2.6; g.stroke(); }
    g.fillStyle = '#b8975f'; g.beginPath(); g.arc(0, 0, 102, 0, TAU); g.fill(); g.strokeStyle = C.ink; g.lineWidth = 3; g.stroke();
    g.fillStyle = '#3a2c1e'; g.beginPath(); g.arc(0, 0, 74, 0, TAU); g.fill();
    g.fillStyle = '#ece3cf'; g.beginPath(); g.arc(0, 0, 58, 0, TAU); g.fill(); g.stroke();
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.5; g.fillStyle = '#3a2c1e'; g.beginPath(); g.arc(Math.cos(a) * 40, Math.sin(a) * 40, 7, 0, TAU); g.fill(); }
    g.fillStyle = '#b8975f'; g.beginPath(); g.arc(0, 0, 16, 0, TAU); g.fill(); g.stroke();
    g.restore();
  }
  function drawBulbFlat(g, x, y) {
    g.save(); g.translate(x, y);
    g.fillStyle = 'rgba(236,227,207,.88)'; g.beginPath(); g.arc(0, -44, 76, 0, TAU); g.fill();
    g.strokeStyle = C.ink; g.lineWidth = 3; g.stroke();
    g.fillStyle = 'rgba(214,178,110,.5)'; g.beginPath(); g.arc(0, -44, 52, 0, TAU); g.fill();
    g.fillStyle = '#6e5538'; g.fillRect(-34, 30, 68, 16); g.fillRect(-30, 48, 60, 14); g.fillRect(-20, 64, 40, 12);
    g.strokeStyle = C.ink; g.lineWidth = 2.2; g.strokeRect(-34, 30, 68, 16); g.strokeRect(-30, 48, 60, 14); g.strokeRect(-20, 64, 40, 12);
    g.fillStyle = '#3a2c1e'; g.fillRect(-9, 78, 18, 14);
    g.restore();
  }

  // ---------- 各绘制件 ----------
  function texPatches(c, lt) {                                    // 呼吸纹理补丁（排线＋点画）
    const a1 = 0.32 + 0.13 * Math.sin(lt * 2.1);
    c.save(); poly(c, [[1560, 560], [1700, 530], [1660, 660], [1540, 640]]); c.clip();
    c.strokeStyle = 'rgba(50,38,26,' + a1 + ')'; c.lineWidth = 1.2; c.beginPath();
    for (let d = -260; d < 300; d += 7) { c.moveTo(1560 + d, 500); c.lineTo(1560 + d + 170, 700); }
    c.stroke(); c.restore();
    const a2 = 0.3 + 0.12 * Math.sin(lt * 1.7 + 2);
    c.save(); poly(c, [[240, 520], [360, 500], [330, 640], [230, 620]]); c.clip();
    c.fillStyle = 'rgba(40,30,20,' + a2 + ')';
    for (let y = 500; y < 640; y += 9) for (let x = 220 + (y / 9 % 2) * 4.5; x < 370; x += 9) { c.beginPath(); c.arc(x, y, 1.6, 0, TAU); c.fill(); }
    c.restore();
  }
  function ambient(c, lt) {
    for (let i = 0; i < AM.length; i++) { const m = AM[i];
      const dx = Math.sin(lt * 0.45 + m.ph) * 14, dy = Math.cos(lt * 0.4 + m.ph * 1.2) * 9;
      const pts = m.pts.map(p => [m.cx + p[0] + dx, m.cy + p[1] + dy]);
      plane(c, pts, m.col, m.alpha, U.rng(m.seed), 0.42, 0.24);
      c.strokeStyle = 'rgba(40,30,20,.45)'; c.lineWidth = 1; poly(c, pts); c.stroke();
    }
  }
  function slicers(c, lt) {                                       // 拍一的「切面刀」三角
    const a = ss(0.15, 0.7, lt) * (1 - ss(3.1, 3.6, lt));
    if (a <= 0.01) return;
    const SL = [[350, 150, 0, C.cream], [560, 210, 700, C.bgrey], [680, 120, 380, C.cream]];
    SL.forEach(([y0, spd, off, col], i) => {
      const x = ((lt * spd + off) % 2000) - 420, wob = Math.sin(lt * 1.3 + i * 2.1) * 12;
      c.fillStyle = P.rgb(P.hex(col), 0.28 * a);
      poly(c, [[x, y0 + wob], [x + 330, y0 - 90 + wob], [x + 210, y0 + 150 + wob]]);
      c.fill(); c.strokeStyle = 'rgba(40,30,20,' + 0.5 * a + ')'; c.lineWidth = 1.4; c.stroke();
    });
  }
  function panesGrid(c, lt, t) {                                  // 2×2 窗格碎面（多视角错位滑移）
    const ga = ss(3.8, 4.6, lt); if (ga <= 0.01) return;
    const st = P.boilSeed(t, 10), calmA = 1 - 0.55 * ss(8.6, 9.8, lt);
    const panes = [[652, 282], [860, 282], [652, 458], [860, 458]];
    panes.forEach(([x, y], i) => {
      const dx = Math.sin(lt * 9 + i * 1.7) * 18 * calmA + (hash(st, i) - 0.5) * 6;
      const dy = Math.cos(lt * 7 + i) * 8 * calmA;
      c.save(); c.beginPath(); c.rect(x, y, 198, 166); c.clip();
      c.globalAlpha = ga;
      c.drawImage(field(), 622 + (i % 2) * 36 + dx, 242 + ((i / 2) | 0) * 30 + dy, 560, 540);
      const sx = x + ((lt * 240 + i * 70) % 328) - 65;
      c.fillStyle = 'rgba(232,236,236,.4)'; poly(c, [[sx, y + 18 + i * 10], [sx + 66, y + 58], [sx + 8, y + 132]]); c.fill();
      c.strokeStyle = 'rgba(40,40,46,.5)'; c.lineWidth = 1.4; c.stroke();
      c.restore();
    });
    c.globalAlpha = ga;
    c.strokeStyle = '#4a3420'; c.lineWidth = 13; c.strokeRect(652, 282, 406, 342);
    c.lineWidth = 9; c.beginPath(); c.moveTo(855, 282); c.lineTo(855, 624); c.moveTo(652, 453); c.lineTo(1058, 453); c.stroke();
    c.strokeStyle = C.ink; c.lineWidth = 2; c.strokeRect(645, 275, 420, 356);
    c.globalAlpha = 1;
  }
  function plate(c, x, y, rot, sc, num, a) {                      // 报纸字数字剪贴（拍一种子）
    if (a <= 0.02 || sc <= 0) return;
    c.save(); c.globalAlpha = a; c.translate(x, y); c.rotate(rot); c.scale(sc, sc);
    poly(c, [[-112, -50], [108, -54], [118, 48], [-104, 52]]);
    c.fillStyle = C.cream; c.fill(); c.strokeStyle = 'rgba(46,36,26,.8)'; c.lineWidth = 2.2; c.stroke();
    c.strokeStyle = 'rgba(60,45,30,.5)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-92, -34); c.lineTo(96, -38); c.moveTo(-92, 40); c.lineTo(96, 36); c.stroke();
    c.fillStyle = '#3b2e22'; c.font = '76px "AlfaSlabOne-400"'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(num, 4, 6);
    c.restore();
  }
  function seeds(c, lt, t) {                                      // 三颗参数种子：特写 → 缩位入结构
    const st = P.boilSeed(t, 8);
    const k = ease.inOut(ss(3.0, 4.2, lt));
    SE.forEach((sd, n) => {
      const app = ss(0.1, 0.55, lt);
      if (app <= 0.01) return;
      const cx = lerp(sd.cx, sd.dx, k), cy = lerp(sd.cy, sd.dy, k), scl = lerp(1, 0.45, k);
      const drift = 1 - 0.5 * k;
      const dx = Math.sin(lt * 0.7 + sd.ph) * 18 * drift, dy = Math.cos(lt * 0.55 + sd.ph * 1.2) * 10 * drift;
      const flick = hash(n, st) < 0.3 ? (hash(n + 4, st) - 0.5) * 0.25 : 0;
      const ca = Math.cos(sd.ang), sa = Math.sin(sd.ang);
      const pts = sd.pts.map(p => [cx + (p[0] * scl * ca - p[1] * scl * sa) + dx, cy + (p[0] * scl * sa + p[1] * scl * ca) + dy]);
      plane(c, pts, sd.col, sd.alpha * app, U.rng(sd.seed), 0.4 - flick * 0.35, 0.25 + flick);
      c.strokeStyle = 'rgba(40,30,20,.55)'; c.lineWidth = 1.6; poly(c, pts); c.stroke();
      const rr = ss(7.6 + n * 0.3, 8.2 + n * 0.3, lt);            // 拍三：描米白亮边
      if (rr > 0.02) { c.strokeStyle = 'rgba(240,233,214,' + 0.8 * rr + ')'; c.lineWidth = 2.6 * rr; poly(c, pts); c.stroke(); }
      const pq = clamp((lt - sd.pop) / 0.35, 0, 1);
      if (pq > 0) {
        const zq = clamp((lt - sd.pop) / 1.5, 0, 1);
        const zoom = 1 + 0.2 * Math.sin(Math.PI * zq);             // 弹出后被端详（放大细看再落回）
        const pa = app * ss(0, 0.25, pq);
        plate(c, cx + sd.lx * lerp(1, scl, k), cy + sd.ly * lerp(1, scl, k), sd.ang * 0.6 + 0.02 * Math.sin(lt * 1.1 + n), lerp(1, scl, k) * zoom * (0.62 + 0.38 * ease.outBack(pq)), sd.num, pa);
      }
    });
  }
  function frags(c, lt, t, calm) {                                // 机器碎面群：错位拼合增殖＋8fps 微沸＋拍三描亮
    const st = P.boilSeed(t, 8);
    const amp = 1 - 0.55 * calm;
    for (const f of FR) {
      if (lt <= f.born) continue;
      const pop = ease.outBack(clamp((lt - f.born) / 0.34, 0, 1));
      const dx = Math.sin(lt * 0.6 + f.ph) * 15 * amp + (hash(f.i, st) - 0.5) * 5;
      const dy = Math.cos(lt * 0.5 + f.ph * 1.3) * 9 * amp + (hash(f.i + 9, st) - 0.5) * 4;
      const flick = hash(f.i, st * 3 + 7) < 0.2 ? (hash(f.i + 3, st) - 0.5) * 0.18 : 0;
      const pts = f.pts.map(p => [f.cx + (p[0] - f.cx) * pop + dx, f.cy + (p[1] - f.cy) * pop + dy]);
      plane(c, pts, f.col, f.alpha, U.rng(f.seed), 0.42 - flick * 0.4, 0.24 + flick);
      c.strokeStyle = 'rgba(40,30,20,.5)'; c.lineWidth = 1; poly(c, pts); c.stroke();
      const st2 = 7.25 + hash(f.i, 77) * 1.6, rr = ss(st2, st2 + 0.5, lt);
      if (rr > 0.02) {                                             // 拍三：逐块描米白亮边＋铺亮面（变亮变精）
        c.strokeStyle = 'rgba(240,233,214,' + 0.8 * rr + ')'; c.lineWidth = 2.6 * rr; poly(c, pts); c.stroke();
        plane(c, pts, C.cream, 0.2 * rr, U.rng(f.seed + 5), 0.1, 0.5);
      }
    }
  }
  function passages(c, lt, calm) {                                // 贯穿线：随密度生长蔓延，拍三加浓收稳
    for (const L of PL) {
      if (lt <= L.born) continue;
      const qa = clamp((lt - L.born) / 0.5, 0, 1);
      const gp = ease.out(clamp((lt - L.born) / 0.9, 0, 1));
      c.strokeStyle = 'rgba(40,30,20,' + (0.5 * qa + 0.18 * calm) + ')';
      c.lineWidth = L.w + 0.8 * calm;
      c.beginPath(); c.moveTo(L.a[0], L.a[1]);
      c.lineTo(lerp(L.a[0], L.b[0], gp), lerp(L.a[1], L.b[1], gp));
      c.stroke();
    }
  }
  function overplanes(c, lt, t, calm) {                           // 上层透明叠面（缓慢错动，把结构嵌进空间）
    const a = ss(3.6, 4.4, lt); if (a <= 0.01) return;
    const r = U.rng(51);
    OV.forEach((pts, i) => {
      const dx = Math.sin(lt * 6 + i) * 9 * (1 - 0.6 * calm);
      const q = pts.map(([x, y]) => [x + dx, y]);
      plane(c, q, [C.cream, C.bgrey, C.ochre, C.grey][i], 0.2 * a, r, 0.35, 0.4);
      c.strokeStyle = 'rgba(40,30,20,.4)'; c.lineWidth = 1.1; poly(c, q); c.stroke();
    });
  }
  function wave1T(c, lt) {                                        // 1T+ 揭示：一道米白波从计数器扫过全结构（唯一重音）
    if (lt < 6.75 || lt > 7.4) return;
    const Rw = (lt - 6.78) * 1350;
    for (const f of FR) {
      if (lt <= f.born) continue;
      const dd = Math.abs(Math.hypot(f.cx - 860, f.cy - 730) - Rw);
      if (dd < 140) { c.fillStyle = 'rgba(240,233,214,' + 0.5 * (1 - dd / 140) + ')'; poly(c, f.pts); c.fill(); }
    }
  }
  function band(c, lt) {                                          // 拍三：一道米白高光带扫过全结构
    const a = ss(8.0, 8.25, lt) * (1 - ss(8.55, 8.8, lt));
    if (a <= 0.01) return;
    c.save(); poly(c, [[430, 200], [1370, 180], [1450, 860], [480, 880]]); c.clip();
    c.translate(lerp(240, 1900, clamp((lt - 8.0) / 0.8, 0, 1)), 520); c.rotate(-0.3);
    c.fillStyle = 'rgba(255,250,235,' + 0.13 * a + ')';
    c.fillRect(-140, -760, 280, 1520);
    c.restore();
  }
  function drawCounter(c, lt) {                                   // 剪报翻牌计数器（12fps 卡点＋模版字断口）
    const a = ss(3.3, 3.75, lt) * (1 - 0.55 * ss(7.2, 7.8, lt));
    if (a <= 0.01) return;
    const L = P.scratch('cubCnt'), g = L.getContext('2d');
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); g.restore();
    const st = Math.floor(Math.max(0, lt) * 12);
    const v = counterVal(lt);
    const txt = v >= 1000 ? '1T+' : v < 10 ? v.toFixed(1) + 'B' : Math.round(v) + 'B';
    const pulse = v >= 1000 ? Math.exp(-Math.max(0, lt - 6.78) * 3.0) : 0;
    g.save(); g.translate(860, 730); g.rotate(-0.015 + (hash(st, 3) - 0.5) * 0.01); g.scale(1 + 0.1 * pulse, 1 + 0.1 * pulse);
    poly(g, [[-215, -78], [200, -82], [210, 76], [-207, 80]]);
    g.fillStyle = '#ebe3cc'; g.fill(); g.strokeStyle = 'rgba(46,36,26,.75)'; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#2b2219'; g.font = '24px "LibreBaskerville-700"'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.fillText('LES PARAMÈTRES', 0, -52);
    g.fillRect(-170, -40, 340, 2.5);
    g.font = '92px "AlfaSlabOne-400"';
    const ws = [...txt].map(ch => g.measureText(ch).width + 6);
    const tot = ws.reduce((s, w) => s + w, 0) - 6;
    let cx = -tot / 2;
    [...txt].forEach((ch, i) => {
      const jy = (hash(st, i * 3 + 1) - 0.5) * 16, rot = (hash(st, i * 5 + 2) - 0.5) * 0.16;
      g.save(); g.translate(cx + ws[i] / 2, 36 + jy); g.rotate(rot); g.textAlign = 'center'; g.fillStyle = '#3b2e22'; g.fillText(ch, 0, 0); g.restore();
      cx += ws[i];
    });
    g.fillStyle = 'rgba(50,40,30,.45)'; for (let x = -190; x < 190; x += 24) g.fillRect(x, 58, 18, 3);
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000';
    g.fillRect(-180 + hash(st, 7) * 10, 4, 360, 6);
    g.fillRect(-140 + hash(st, 8) * 20, 28, 40, 72);
    g.fillRect(20 + hash(st, 9) * 20, 24, 36, 76);
    g.globalCompositeOperation = 'source-over';
    g.restore();
    c.save(); c.globalAlpha = a;
    c.drawImage(L, 860 - 260, 730 - 110, 520, 220, 860 - 260, 730 - 110, 520, 220);
    c.restore();
  }
  function objects(c, lt, t) {                                    // 拍三：三件静物解构升起＋铭文
    OBJ.forEach(o => {
      const q = clamp((lt - o.rise) / 0.85, 0, 1); if (q <= 0) return;
      const yOff = (1 - ease.outBack(q)) * 170;
      const al = ss(0, 0.3, q);
      const L = layer(o.key), g = L.getContext('2d');
      g.reset();
      if (o.key === 'obk') drawBooksFlat(g, o.x, o.y + yOff);
      else if (o.key === 'ogr') drawGearFlat(g, o.x, o.y + yOff, lt);
      else drawBulbFlat(g, o.x, o.y + yOff);
      facetize(g, L, o.box, o.cell, o.seed, t, { boilFrac: 0.3, edge: 'rgba(40,30,20,.3)', light: 0.26, dark: 0.36 });
      if (o.key === 'obu') {                                      // 灯丝（暖光闪烁）与光晕盖在切面上
        g.save(); g.translate(o.x, o.y - 44 + yOff); g.strokeStyle = '#2e241a'; g.lineWidth = 3.2; g.lineJoin = 'round';
        const fw = 1 + 0.12 * Math.sin(lt * 13);
        g.beginPath(); g.moveTo(-26, 26); g.lineTo(-26, 6); g.lineTo(-10, -14 * fw); g.lineTo(2, 10); g.lineTo(12, -12 * fw); g.lineTo(26, 8); g.lineTo(26, 26); g.stroke();
        const ga2 = 0.3 + 0.1 * Math.sin(lt * 9.7) + 0.05 * Math.sin(lt * 23);
        const gr = g.createRadialGradient(0, 0, 8, 0, 0, 128);
        gr.addColorStop(0, P.rgb([236, 200, 130], 0.5)); gr.addColorStop(0.5, P.rgb([214, 178, 110], 0.3 * ga2 * 2)); gr.addColorStop(1, 'rgba(214,178,110,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 130, 0, TAU); g.fill();
        g.restore();
      }
      c.save(); c.globalAlpha = al; c.drawImage(L, 0, 0); c.restore();
      const la = ss(0.5, 0.8, q);                                 // 铭文（米白小牌＋墨字）
      if (la > 0.02) {
        c.save(); c.globalAlpha = la; c.translate(o.lx, o.ly); c.rotate(-0.01);
        poly(c, [[-84, -34], [80, -36], [88, 32], [-78, 34]]);
        c.fillStyle = C.cream; c.fill(); c.strokeStyle = 'rgba(46,36,26,.8)'; c.lineWidth = 2; c.stroke();
        c.fillStyle = C.ink; c.font = '44px "LXGWWenKai-500"'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(o.label, 2, 4);
        c.restore();
      }
    });
  }

  // ---------- 屏上字（每拍一条，模版字断口＝剪贴铅字；画在镜头变换外） ----------
  const CAPS = [
    { txt: '参数', x: 330, y: 250, size: 150, a: lt => ss(0.5, 1.1, lt) * (1 - ss(2.75, 3.25, lt)) },
    { txt: '疯狂卷参数', x: 330, y: 250, size: 96, a: lt => ss(3.3, 3.9, lt) * (1 - ss(6.6, 7.05, lt)) },
    { txt: '参数之外', x: 330, y: 250, size: 96, a: lt => ss(7.3, 7.9, lt) },
  ];
  function captions(c, lt) {
    CAPS.forEach((cp, n) => {
      const a = cp.a(lt); if (a <= 0.02) return;
      const L = P.scratch('cubCap'), g = L.getContext('2d');
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); g.restore();
      g.save(); g.translate(cp.x, cp.y); g.rotate(-0.012 + 0.008 * Math.sin(lt * 0.9 + n * 2));
      g.font = cp.size + 'px "LXGWWenKai-500"'; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
      const w = g.measureText(cp.txt).width;
      g.fillStyle = C.ink; g.fillText(cp.txt, 0, 0);
      g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000';   // 模版字断口（透出底下的叠面）
      g.fillRect(w * 0.12, -cp.size * 0.30, w * 0.34, cp.size * 0.075);
      g.fillRect(w * 0.55, -cp.size * 0.12, w * 0.3, cp.size * 0.07);
      g.fillRect(w * 0.42, -cp.size * 0.78, cp.size * 0.055, cp.size * 0.95);
      g.globalCompositeOperation = 'source-over';
      g.restore();
      const rx = cp.x - 60, ry = cp.y - cp.size * 1.2, rw = w + 140, rh = cp.size * 1.45;
      c.save(); c.globalAlpha = a;
      c.drawImage(L, rx, ry, rw, rh, rx, ry, rw, rh);
      c.restore();
    });
  }

  return {
    init() {
      U.assertGlyphs('96px "LXGWWenKai-500"', '参数疯狂卷之外数据方法算力', 's11_cubism 屏上字/铭文');
      U.assertGlyphs('92px "AlfaSlabOne-400"', '0123456789.BT+-', 's11_cubism 数字');
      U.assertGlyphs('84px "LibreBaskerville-700"', "JOU LA BATAILLE S'EST ENGAGÉ UN CHAT LES PARAMÈTRES", 's11_cubism 报纸');
      bgA(); bgB(); field();                                      // 预热缓存：首帧也快
      ['obk', 'ogr', 'obu'].forEach(k => { const g = layer(k).getContext('2d'); g.fillRect(0, 0, 2, 2); g.reset(); });
      P.scratch('cubCap'); P.scratch('cubCnt');
    },
    draw(c, lt, t) {
      const calm = ss(8.6, 9.8, lt);                              // 拍三收稳
      const s = camS(lt);
      c.save();
      c.translate(960, 500); c.scale(s, s); c.translate(-960, -500);
      c.drawImage(bgA(), -240, -140);
      const ba = ss(4.0, 6.2, lt);                                // 背景随密度升级
      if (ba > 0.01) { c.globalAlpha = 0.92 * ba; c.drawImage(bgB(), -240, -140); c.globalAlpha = 1; }
      texPatches(c, lt);
      ambient(c, lt);
      slicers(c, lt);
      panesGrid(c, lt, t);
      frags(c, lt, t, calm);
      seeds(c, lt, t);
      passages(c, lt, calm);
      overplanes(c, lt, t, calm);
      wave1T(c, lt);
      drawCounter(c, lt);
      band(c, lt);
      objects(c, lt, t);
      c.restore();
      captions(c, lt);
    },
  };
})();
