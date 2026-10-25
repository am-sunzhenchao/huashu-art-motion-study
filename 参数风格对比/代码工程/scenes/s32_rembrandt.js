// s32_rembrandt · 1642 伦勃朗明暗法 ×「大模型参数」风格样片（10s 单镜头三拍）。
// 题材构图（不搬速通片的房间）：烛光账房——参数＝光柱里的浮尘光点——
//   拍一 0–3s   右上铅条窗的光柱里三粒发亮浮尘（厚涂亮部＝可学的参数本体），尘旁账本手写读数 0.73／-1.2／2.4；
//               各自缓浮、明灭、被放大端详；烛焰摇曳、云影让窗光明暗；整组缓缓推近。
//   拍二 3–7s   浮尘增殖织成暗金尘网蔓延过整面墙（细金线连线），账本页读数滚动 1.5B→175B→540B→1T+，
//               1T+ 揭示时窗光一次轻爆（唯一重音）；暗角随密度加深＝背景随密度升级。
//   拍三 7–10s  增殖停住；三物从暗中升起被光逐一揭开：一摞厚书（数据）、黄铜浑仪（方法，一环缓转）、
//               三枝烛台（算力，焰苗摇曳）；浮尘从「变多」转为「变亮变精」（描金收拢），尘网颤动收稳。
// 管线（照卡 32_rembrandt）：亮态底稿（按全亮颜色画墙/窗/账桌）→ 褐色大笔触重画＋2.2px 揉开（静态缓存）
//   → 桌层细笔触＋道具 → 光照图整幅 multiply（环境 rgb(30,21,13)≈0.13：光柱/窗池/分离光/账本/烛光/三物揭开，
//   云影 sin 循环＋光池随 noise 漂移）→ 窗玻璃 screen 提亮＋云影团掠过 → 浮尘/尘网/读数/计数器/三物/厚涂亮斑
//   → 龟裂＋颗粒＋暗角（缓存）＋soft-light 金褐釉。相机：缓推(0–3)→缓拉(3–7)→收稳(7–10)一个连续运镜。
// 约定：随机全用 U.rng 种子（同帧两次渲染逐像素一致）；无角色；中文 LXGWWenKai-500、数字 CormorantGaramond-500，
//   落笔前 U.assertGlyphs；字全部 ≤y880。
SCENES['s32_rembrandt'] = (() => {
  const W = 1920, H = 1080, TAU = Math.PI * 2;
  const { clamp, lerp, ss, ease, rng } = U, P = PAINT;
  const pool = P.pool, impasto = P.impasto;
  const flick = (t, k = 0) => 0.5 * P.noise(t * 2.2 + k * 7.3, k * 3.1) + 0.25 * P.noise(t * 6.5 + k, 9 + k);   // 约 ±0.35

  // ---------- 静态几何（右上窗、光柱斜落左下账桌；三物从右下暗中升起） ----------
  const GLASS = [1270, 80, 508, 390];                       // 玻璃区 x,y,w,h
  // 光柱楔形：右上窗 → 左下账桌
  const BEAM_PTS = [[1280, 120], [1748, 120], [1330, 1015], [250, 1015]];
  const beamL = y => 1280 + (250 - 1280) * (y - 120) / 895;
  const beamR = y => 1748 + (1330 - 1748) * (y - 120) / 895;

  // 三粒参数本体（拍一特写）
  const FEAT = [
    { x: 1050, y: 350, n: '0.73', ph: 0 },
    { x: 1230, y: 540, n: '-1.2', ph: 2.1 },
    { x: 830, y: 560, n: '2.4', ph: 4.2 },
  ];

  // ---------- 区域色板（色值全部来自 references/风格配方/32_rembrandt.md 卡内） ----------
  const SW = {
    wall: P.swatch(['#5a3c20', '#6e4a28', '#4e3418', '#6a4a28', '#4a3018', '#765030'], 0.7),
    dark: P.swatch(['#2a1a0c', '#3a2412', '#1e1208', '#4a2e16'], 0.5),
    wood: P.swatch(['#7a5228', '#5a3c20', '#8a642e', '#4a3018', '#9a6a32'], 0.62),
    cloth: P.swatch(['#8a2e18', '#6a2010', '#a8441e', '#c8943a'], 0.7),
  };

  // ---------- ① 亮态底稿：墙/地/窗（右上方） ----------
  function room(g) {
    const wg = g.createLinearGradient(0, 0, W, 0);
    wg.addColorStop(0, '#3a2412'); wg.addColorStop(0.52, '#4a3018'); wg.addColorStop(1, '#6a4a28');
    g.fillStyle = wg; g.fillRect(0, 0, W, H);
    g.fillStyle = '#3a2614'; g.fillRect(0, 880, W, 200);
    // 窗洞（厚墙斜面）
    g.fillStyle = '#8a6a44'; g.beginPath(); g.moveTo(1218, 40); g.lineTo(1806, 40); g.lineTo(1778, 80); g.lineTo(1270, 80); g.closePath(); g.fill();
    g.fillStyle = '#7a5a38'; g.beginPath(); g.moveTo(1218, 40); g.lineTo(1270, 80); g.lineTo(1270, 470); g.lineTo(1218, 506); g.closePath(); g.fill();
    g.fillStyle = '#5a3e22'; g.beginPath(); g.moveTo(1806, 40); g.lineTo(1778, 80); g.lineTo(1778, 470); g.lineTo(1806, 506); g.closePath(); g.fill();
    // 玻璃：铅条菱格＋牛眼玻璃
    g.save(); g.beginPath(); g.rect(GLASS[0], GLASS[1], GLASS[2], GLASS[3]); g.clip();
    const gg = g.createRadialGradient(1520, 250, 30, 1540, 290, 360);
    gg.addColorStop(0, '#fff6dc'); gg.addColorStop(0.6, '#f0d8a0'); gg.addColorStop(1, '#c49a5a');
    g.fillStyle = gg; g.fillRect(GLASS[0], GLASS[1], GLASS[2], GLASS[3]);
    const r = rng(4242);
    for (let i = 0; i < 64; i++) { const x = GLASS[0] + r() * GLASS[2], y = GLASS[1] + r() * GLASS[3], rr = 5 + r() * 13;
      g.fillStyle = `rgba(${r() < .5 ? '255,250,230' : '190,150,90'},${0.15 + r() * 0.2})`; g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill(); }
    g.strokeStyle = '#3a2a1a'; g.lineWidth = 3;
    for (let k = -10; k < 16; k++) {
      g.beginPath(); g.moveTo(GLASS[0] + k * 52, GLASS[1]); g.lineTo(GLASS[0] + k * 52 + GLASS[3] * 0.62, GLASS[1] + GLASS[3]); g.stroke();
      g.beginPath(); g.moveTo(GLASS[0] + k * 52, GLASS[1] + GLASS[3]); g.lineTo(GLASS[0] + k * 52 + GLASS[3] * 0.62, GLASS[1]); g.stroke();
    }
    g.restore();
    // 窗框与中梃、横档
    g.fillStyle = '#2a1a0e';
    g.fillRect(1270, 80, 508, 12); g.fillRect(1270, 458, 508, 12); g.fillRect(1270, 80, 12, 390); g.fillRect(1766, 80, 12, 390);
    g.fillRect(1512, 80, 14, 390); g.fillRect(1270, 269, 508, 12);
    // 窗台
    g.fillStyle = '#7a5a36'; g.fillRect(1226, 470, 580, 24); g.fillStyle = '#4a321c'; g.fillRect(1226, 494, 580, 12);
  }
  // 账桌（桌面＋柜身＋抽屉＋红褐衬布）
  function desk(g) {
    g.fillStyle = '#7a5228';
    g.beginPath(); g.moveTo(240, 700); g.lineTo(1050, 700); g.lineTo(1062, 762); g.lineTo(228, 762); g.closePath(); g.fill();
    g.fillStyle = '#5a3a1c'; g.fillRect(228, 762, 834, 18);
    g.fillStyle = '#38220f'; g.fillRect(240, 780, 820, 300);
    g.strokeStyle = 'rgba(20,10,4,.8)'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(262, 860); g.lineTo(1038, 860); g.stroke();
    g.beginPath(); g.moveTo(262, 980); g.lineTo(1038, 980); g.stroke();
    g.fillStyle = '#9a7432';
    [[560, 890], [560, 1010]].forEach(([x, y]) => { g.beginPath(); g.ellipse(x, y, 13, 5, 0, 0, TAU); g.fill(); });
    // 红褐衬布：盖过账本位、垂过桌沿
    g.fillStyle = '#8a2e18';
    g.beginPath(); g.moveTo(392, 702); g.lineTo(878, 702); g.lineTo(892, 762); g.lineTo(880, 828);
    g.quadraticCurveTo(635, 846, 384, 826); g.lineTo(382, 762); g.closePath(); g.fill();
    g.strokeStyle = '#c8943a'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(398, 710); g.lineTo(872, 710); g.stroke();
    g.strokeStyle = '#d0a050'; g.lineWidth = 3;
    for (let x = 400; x < 872; x += 12) { g.beginPath(); g.moveTo(x, 828 + 4 * Math.sin(x * 0.05)); g.lineTo(x + 1, 850 + 5 * Math.sin(x * 0.08)); g.stroke(); }
  }
  // 桌上道具：摊开的账本（计数器写在这页上）、墨水瓶＋鹅毛笔、黄铜烛台＋蜡烛
  function props(g) {
    g.fillStyle = '#5a1a10';
    g.beginPath(); g.moveTo(438, 648); g.lineTo(630, 626); g.lineTo(822, 648); g.lineTo(812, 756); g.lineTo(630, 776); g.lineTo(448, 756); g.closePath(); g.fill();
    const pg = g.createLinearGradient(0, 620, 0, 780);
    pg.addColorStop(0, '#f0e0b8'); pg.addColorStop(1, '#dcc898');
    g.fillStyle = pg;
    g.beginPath(); g.moveTo(446, 646); g.lineTo(630, 624); g.lineTo(640, 740); g.lineTo(452, 754); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(630, 624); g.lineTo(814, 646); g.lineTo(806, 754); g.lineTo(640, 740); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(120,90,50,.7)'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(634, 626); g.lineTo(638, 741); g.stroke();
    const rr = rng(77);
    g.strokeStyle = 'rgba(90,60,30,.4)'; g.lineWidth = 2.2; g.lineCap = 'round';
    for (let k = 0; k < 7; k++) {
      const y0 = 646 + k * 13;
      g.beginPath(); g.moveTo(468, y0 + 2); g.quadraticCurveTo(540, y0 - 2 + rr() * 4, 612, y0 + 1); g.stroke();
      g.beginPath(); g.moveTo(652, y0 - 1); g.quadraticCurveTo(730, y0 - 3 + rr() * 4, 794, y0); g.stroke();
    }
    g.strokeStyle = 'rgba(140,40,30,.55)'; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(462, 648); g.quadraticCurveTo(460, 700, 456, 752); g.stroke();
    // 墨水瓶＋鹅毛笔
    g.fillStyle = '#7a7466'; g.beginPath(); g.ellipse(886, 700, 22, 9, 0, 0, TAU); g.fill();
    g.fillStyle = '#8a8478'; g.fillRect(874, 672, 24, 30);
    g.fillStyle = '#2a2018'; g.beginPath(); g.ellipse(886, 672, 12, 4, 0, 0, TAU); g.fill();
    g.strokeStyle = '#d8cfae'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(880, 676); g.quadraticCurveTo(858, 640, 842, 612); g.stroke();
    g.lineWidth = 2; g.strokeStyle = '#c8bd98';
    for (let k = 0; k < 6; k++) { const q = 0.2 + k * 0.13; g.beginPath(); g.moveTo(876 - q * 34, 676 - q * 60); g.lineTo(870 - q * 40, 660 - q * 62); g.stroke(); }
    // 黄铜烛台＋蜡烛（焰每帧动态画）
    g.fillStyle = '#9a7432'; g.beginPath(); g.ellipse(975, 706, 30, 8, 0, 0, TAU); g.fill();
    g.fillRect(969, 660, 12, 46);
    g.beginPath(); g.ellipse(975, 658, 17, 5, 0, 0, TAU); g.fill();
    g.fillStyle = '#efe2c0'; g.fillRect(965, 586, 20, 74);
    g.strokeStyle = 'rgba(120,80,40,.4)'; g.lineWidth = 2; g.strokeRect(965, 586, 20, 74);
    g.fillStyle = '#f0d8a0'; g.fillRect(967, 588, 4, 70);
    g.strokeStyle = '#2a1608'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(975, 586); g.lineTo(975, 578); g.stroke();
  }

  // ---------- ② 静态缓存：底稿 → 褐色大笔触（揉开的底子）→ 窗保留清楚 → 桌层细笔触＋道具 ----------
  // 每遍笔触各用一张底稿画布取色（同一画布多次 getImageData 会触发控制台性能告警，[page] 要归零）
  const stat = () => P.cached('s32Stat', W, H, (g, cv) => {
    const b = P.canvas(), bg = b.getContext('2d');
    room(bg);
    g.drawImage(b, 0, 0);
    P.strokes(g, b, { cell: 18, len: 54, width: 16, seed: 3, t: 0, boil: 0, outline: 0, jitterCol: 6,
      angle: (x, y) => -0.9 + 1.6 * P.noise(x * 0.003, y * 0.003),
      palette: (x, y, col, r) => (y > 880 ? SW.dark(col, r) : SW.wall(col, r)),
      mask: (x, y) => !(x > 1222 && x < 1800 && y > 36 && y < 512) && !(x > 220 && x < 1064 && y > 684) });
    { const tmp = P.canvas(), tg = tmp.getContext('2d'); tg.filter = 'blur(2.2px)'; tg.drawImage(cv, 0, 0); g.globalAlpha = 0.75; g.drawImage(tmp, 0, 0); g.globalAlpha = 1; }
    g.drawImage(b, 1226, 40, 572, 472, 1226, 40, 572, 472);                     // 窗木作/玻璃保留清楚
    const tb = P.canvas(), tbg = tb.getContext('2d');
    desk(tbg);
    tbg.save(); tbg.globalCompositeOperation = 'source-atop';
    P.strokes(tbg, tb, { cell: 8, len: 16, width: 6, seed: 5, t: 0, boil: 0, outline: 0.25, outlineCol: [30, 10, 5], outlineMix: 0.6,
      jitterCol: 14, alphaMask: true,
      angle: (x, y) => y < 772 ? 0.12 + 0.12 * P.noise(x * 0.02, y * 0.02) : Math.PI / 2 + 0.35 * P.noise(x * 0.03, y * 0.03),
      palette: (x, y, col, r) => (y > 700 && y < 834 && x > 380 && x < 894 ? SW.cloth(col, r) : SW.wood(col, r)) });
    tbg.restore();
    props(tbg);
    g.drawImage(tb, 0, 0);
  });

  // 光柱（缓存楔形，模糊烤进图里）
  const BEAM = P.cached('s32Beam', W, H, (g) => {
    g.filter = 'blur(40px)'; g.fillStyle = 'rgba(255,232,190,0.55)';
    g.beginPath(); g.moveTo(BEAM_PTS[0][0], BEAM_PTS[0][1]);
    for (let i = 1; i < 4; i++) g.lineTo(BEAM_PTS[i][0], BEAM_PTS[i][1]);
    g.closePath(); g.fill();
    g.filter = 'none';
  });
  // 金色光晕精灵（浮尘/计数器/三物共用）
  const GLOW = P.cached('s32Glow', 256, 256, (g) => {
    const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, 'rgba(255,216,150,.9)'); gr.addColorStop(0.4, 'rgba(240,190,110,.32)'); gr.addColorStop(1, 'rgba(240,190,110,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  });
  // 罩层：暗角（VIG 单独缓存，拍二再压一层＝背景随密度升级）、龟裂、颗粒（暗色＋暖光微闪两种）
  const VIG = P.cached('s32Vig', W, H, (g) => {
    const vg = g.createRadialGradient(960, 520, 360, 960, 540, 1180);
    vg.addColorStop(0, 'rgba(8,4,0,0)'); vg.addColorStop(1, 'rgba(8,4,0,.78)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  });
  const OVER = P.cached('s32Over', W, H, (g) => {
    g.drawImage(VIG, 0, 0);
    g.globalAlpha = 0.28; g.drawImage(P.craquelure('s32cr', 0.28), 0, 0); g.globalAlpha = 1;
    g.drawImage(P.grain('s32ga', 0.05, [30, 15, 5], 0.12), 0, 0);
    g.drawImage(P.grain('s32gb', 0.02, [205, 170, 120], 0.10), 0, 0);
  });

  // ---------- 拍二：尘网（种子生成；出生按洗牌序列铺满 3.22–6.55，越晚越密） ----------
  const rS = rng(3232);
  const NET = [];
  { let guard = 0;
    while (NET.length < 150 && guard++ < 8000) {
      const x = 230 + rS() * 1330, y = 128 + rS() * 492;
      if (x > 1248 && y < 522) continue;                                        // 窗玻璃区不生尘
      if (FEAT.some(f => Math.hypot(x - f.x, y - f.y) < 118)) continue;        // 三粒特写周围让位
      if (NET.some(q => Math.hypot(x - q.x, y - q.y) < 44)) continue;          // 尘距
      NET.push({ x, y, r: 2.6 + rS() * 3.4, ph: rS() * TAU, sp: 0.7 + rS() * 1.3, warm: rS() < 0.75 });
    }
    const ord = NET.map((q, i) => ({ i, k: rS() })).sort((a, b) => a.k - b.k);
    ord.forEach((o, n) => { NET[o.i].birth = 3.22 + 3.33 * Math.pow(n / Math.max(1, ord.length - 1), 0.85) + rS() * 0.05; });
  }
  // 尘网连线：每尘连最近 2 粒（含三粒特写），去重；不跨窗玻璃
  const CONN = [];
  { const pts = FEAT.map(f => ({ x: f.x, y: f.y, birth: 0 })).concat(NET);
    const seen = {};
    pts.forEach((p, i) => {
      const cand = [];
      pts.forEach((q, j) => { if (j !== i) { const d = Math.hypot(p.x - q.x, p.y - q.y); if (d < 235) cand.push({ j, d }); } });
      cand.sort((a, b) => a.d - b.d);
      let links = 0;
      for (const cd of cand) {
        const key = i < cd.j ? i * 4096 + cd.j : cd.j * 4096 + i;
        if (seen[key]) continue;
        const b = pts[cd.j], mx = (p.x + b.x) / 2, my = (p.y + b.y) / 2;
        if (mx > 1248 && my < 522) continue;
        seen[key] = 1;
        CONN.push({ ax: p.x, ay: p.y, bx: b.x, by: b.y, bow: (rS() - 0.5) * 40,
          birth: Math.max(p.birth, b.birth) + 0.14 + rS() * 0.12, ph: rS() * TAU, nx: 0, ny: 0 });
        if (++links >= 2) break;
      }
    });
    CONN.forEach(k2 => { const dx = k2.bx - k2.ax, dy = k2.by - k2.ay, L = Math.hypot(dx, dy) || 1; k2.nx = -dy / L; k2.ny = dx / L; });
  }

  // ---------- 拍三：三件物精灵（厚书=数据、黄铜浑仪=方法、三枝烛台=算力） ----------
  const BOOKS = P.cached('s32Books', 250, 300, (g) => {
    const rr = rng(311);
    const rows = [
      { y: 262, w: 224, h: 36, c: '#4a1a10', rot: -0.028 },
      { y: 224, w: 210, h: 34, c: '#6a3a22', rot: 0.024 },
      { y: 190, w: 218, h: 32, c: '#5a3c20', rot: -0.02 },
      { y: 158, w: 202, h: 31, c: '#3a2412', rot: 0.03 },
      { y: 128, w: 212, h: 29, c: '#7a2a18', rot: -0.024 },
    ];
    g.save(); g.translate(125, 0); g.lineCap = 'round';
    rows.forEach(r => {
      g.save(); g.rotate(r.rot);
      g.fillStyle = r.c; g.fillRect(-r.w / 2, r.y, r.w, r.h);
      g.fillStyle = '#e8d6aa'; g.fillRect(r.w / 2 - 15, r.y + 3, 8, r.h - 6);                    // 书口
      for (let i = 0; i < 22; i++) {                                                            // 封面笔触
        const x = -r.w / 2 + 8 + rr() * (r.w - 30), y = r.y + 4 + rr() * (r.h - 8);
        g.strokeStyle = P.rgb(P.jitter(P.hex(r.c), rr, 26)); g.lineWidth = 2.6 + rr() * 2;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + 10 + rr() * 9, y + (rr() - 0.5) * 3); g.stroke();
      }
      g.strokeStyle = 'rgba(200,148,58,.8)'; g.lineWidth = 3;                                   // 描金书脊带
      g.beginPath(); g.moveTo(-r.w / 2 + 13, r.y + 5); g.lineTo(-r.w / 2 + 13, r.y + r.h - 5); g.stroke();
      g.strokeStyle = 'rgba(30,14,6,.65)'; g.lineWidth = 2.6; g.strokeRect(-r.w / 2, r.y, r.w, r.h);
      g.restore();
    });
    g.fillStyle = '#8e3b30'; g.fillRect(-96, 100, 192, 11);                                      // 顶上摊开的一册
    g.fillStyle = '#f0e0b8'; g.beginPath(); g.moveTo(-90, 102); g.quadraticCurveTo(0, 74, 90, 102);
    g.lineTo(90, 110); g.quadraticCurveTo(0, 84, -90, 110); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(139,59,48,.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 84); g.lineTo(0, 110); g.stroke();
    P.impasto(g, [[-86, 100], [-40, 92]], 5, '#f6e8c0', 'rgba(255,250,232,.8)');                 // 顶册厚涂受光边
    P.impasto(g, [[40, 92], [86, 100]], 5, '#f6e8c0', 'rgba(255,250,232,.8)');
    g.restore();
  });
  const ARM = P.cached('s32Arm', 260, 340, (g) => {
    const rr = rng(509);
    g.save(); g.translate(130, 0); g.lineCap = 'round';
    g.strokeStyle = '#6e4e20'; g.lineWidth = 11;                                                // 三足架
    g.beginPath(); g.moveTo(-54, 336); g.lineTo(-16, 244); g.stroke();
    g.beginPath(); g.moveTo(54, 336); g.lineTo(16, 244); g.stroke();
    g.beginPath(); g.moveTo(0, 338); g.lineTo(0, 246); g.stroke();
    g.fillStyle = '#9a7432'; g.beginPath(); g.ellipse(0, 336, 60, 11, 0, 0, TAU); g.fill();      // 底座
    g.strokeStyle = '#5a3e14'; g.lineWidth = 3; g.beginPath(); g.ellipse(0, 336, 60, 11, 0, 0, TAU); g.stroke();
    g.fillStyle = '#8a6428'; g.fillRect(-7, 158, 14, 88);                                        // 立柱
    g.fillStyle = '#c8943a'; g.fillRect(-4, 150, 8, 10);
    g.strokeStyle = '#5a3e14'; g.lineWidth = 14; g.beginPath(); g.arc(0, 150, 100, 0, TAU); g.stroke();   // 外环
    g.strokeStyle = '#c8943a'; g.lineWidth = 9; g.beginPath(); g.arc(0, 150, 100, 0, TAU); g.stroke();
    g.strokeStyle = '#7a5a24'; g.lineWidth = 7; g.beginPath(); g.ellipse(0, 150, 62, 100, 0.5, 0, TAU); g.stroke();   // 内斜环
    g.strokeStyle = '#a8802e'; g.lineWidth = 6; g.beginPath(); g.ellipse(0, 150, 100, 34, 0.25, 0, TAU); g.stroke();  // 赤道环
    const eg = g.createRadialGradient(-6, 144, 2, 0, 150, 18);                                  // 中央地球
    eg.addColorStop(0, '#e8c070'); eg.addColorStop(1, '#6a4a1c');
    g.fillStyle = eg; g.beginPath(); g.arc(0, 150, 17, 0, TAU); g.fill();
    for (let i = 0; i < 30; i++) {                                                              // 黄铜短弧笔触
      const a = rr() * TAU, rad = 94 + rr() * 14;
      g.strokeStyle = ['#f0c870', '#c8943a', '#8a6428'][(rr() * 3) | 0]; g.lineWidth = 3.5 + rr() * 3;
      g.beginPath(); g.arc(0, 150, rad, a, a + 0.14 + rr() * 0.1); g.stroke();
    }
    g.restore();
  });
  const CAND = P.cached('s32Cand', 280, 330, (g) => {
    const rr = rng(733);
    g.save(); g.translate(140, 0); g.lineCap = 'round';
    g.fillStyle = '#9a7432'; g.beginPath(); g.ellipse(0, 324, 62, 11, 0, 0, TAU); g.fill();      // 底座
    g.strokeStyle = '#5a3e14'; g.lineWidth = 3; g.beginPath(); g.ellipse(0, 324, 62, 11, 0, 0, TAU); g.stroke();
    g.fillStyle = '#8a6428'; g.fillRect(-54, 308, 108, 12);
    g.fillRect(-8, 240, 16, 70);                                                                // 立柱
    g.fillStyle = '#c8943a';
    g.beginPath(); g.ellipse(0, 258, 13, 6, 0, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(0, 236, 13, 6, 0, 0, TAU); g.fill();
    g.strokeStyle = '#c8943a'; g.lineWidth = 9;                                                // 三臂
    g.beginPath(); g.moveTo(0, 240); g.lineTo(0, 212); g.stroke();
    g.beginPath(); g.moveTo(0, 252); g.bezierCurveTo(-40, 246, -62, 240, -74, 226); g.stroke();
    g.beginPath(); g.moveTo(0, 252); g.bezierCurveTo(40, 246, 62, 240, 74, 226); g.stroke();
    [[0, 208], [-74, 226], [74, 226]].forEach(([x, y]) => {                                     // 烛杯＋蜡烛
      g.fillStyle = '#9a7432'; g.beginPath(); g.ellipse(x, y + 4, 15, 4.5, 0, 0, TAU); g.fill();
      g.fillStyle = '#efe2c0'; g.fillRect(x - 8, y - 42, 16, 44);
      g.strokeStyle = 'rgba(120,80,40,.4)'; g.lineWidth = 2; g.strokeRect(x - 8, y - 42, 16, 44);
      g.fillStyle = '#f0d8a0'; g.fillRect(x - 6, y - 40, 4, 40);
      g.strokeStyle = '#2a1608'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(x, y - 42); g.lineTo(x, y - 48); g.stroke();
    });
    for (let i = 0; i < 26; i++) {                                                              // 底座黄铜短弧
      const a = rr() * Math.PI - Math.PI / 2;
      g.strokeStyle = ['#f0c870', '#c8943a', '#8a6428'][(rr() * 3) | 0]; g.lineWidth = 3.2 + rr() * 2.6;
      g.beginPath(); g.arc(0, 306 + rr() * 18, 14 + rr() * 44, a, a + 0.18 + rr() * 0.12); g.stroke();
    }
    g.restore();
  });
  const OBJ = [
    { key: 'books', x: 380, baseY: 880, sprite: BOOKS, sw: 250, sh: 300, sc: 1.05, label: '数据', rise: 7.15, pool: [380, 760, 300] },
    { key: 'arm', x: 1180, baseY: 890, sprite: ARM, sw: 260, sh: 340, sc: 1.0, label: '方法', rise: 7.55, pool: [1180, 740, 320] },
    { key: 'cand', x: 1650, baseY: 880, sprite: CAND, sw: 280, sh: 330, sc: 1.05, label: '算力', rise: 7.95, pool: [1650, 690, 340] },
  ];
  const CAND_FLAMES = [[140, 160], [66, 178], [214, 178]];         // 烛台三焰的精灵坐标（焰基）

  // ---------- 屏上字（金褐铭文写在左上暗墙上；每拍一条） ----------
  const CAPS = [
    { txt: '参数', x: 250, y: 232, size: 150, box: [206, 58, 592, 254], a: lt => ss(0.5, 1.1, lt) * (1 - ss(2.55, 3.0, lt)), wob: 0 },
    { txt: '疯狂卷参数', x: 250, y: 208, size: 92, box: [206, 74, 762, 246], a: lt => ss(3.3, 3.9, lt) * (1 - ss(6.6, 7.0, lt)), wob: 2 },
    { txt: '参数之外', x: 250, y: 214, size: 118, box: [206, 68, 782, 250], a: lt => ss(7.3, 7.9, lt), wob: 4 },
  ];

  // ---------- 光照图（每帧）：环境 0.13 ＋ 光柱/窗池/分离光/账本/烛光/尘网底光/三物揭开 ----------
  function lightMap(t, lt, dn, gold, pulse, qs) {
    const f = flick(t), fc = flick(t * 1.7, 3);
    return P.lightMap('s32Light', 'rgb(30,21,13)', g => {
      const cloud = 0.5 + 0.5 * Math.sin(t * 2.2 - 0.6);                     // 云影：窗光慢慢暗下去又回来
      const dx = 14 * P.noise(t * 0.9, 1), dy = 10 * P.noise(t * 0.9, 5);    // 光池缓慢漂移
      g.globalAlpha = clamp((0.82 + 0.13 * f) * (1 - 0.35 * cloud) * (1 + 0.3 * pulse) * (1 + 0.2 * gold), 0, 1);
      g.drawImage(BEAM, 0, 0); g.globalAlpha = 1;
      pool(g, 1520, 275 + dy, 330, '255,246,225', clamp((1 - 0.3 * cloud) * (1 + 0.25 * pulse), 0, 1));   // 窗本身
      pool(g, 330, 316 + dy, 340, '200,150,90', 0.3 + 0.03 * f);               // 左墙分离光（暗侧亮墙，防死黑）
      pool(g, 930, 128, 300, '190,140,80', 0.15);                              // 顶墙弱光
      pool(g, 1560, 640, 420, '170,120,70', 0.12 + 0.02 * f);                   // 右下暗墙分层（三物将从这里亮起）
      pool(g, 630 + dx, 728, 300, '255,214,160', 0.58 + 0.05 * f);             // 账本/桌面
      pool(g, 770 + dx, 948, 320, '255,232,190', 0.35 * (1 - 0.3 * cloud));    // 光柱落地
      pool(g, 975, 585, 190 + 40 * fc, '255,180,90', 0.6 + 0.4 * fc);          // 烛光（快闪）
      if (dn > 0.02) pool(g, 880, 400, 620, '210,160,100', clamp(0.13 * dn * (1 + 0.6 * pulse), 0, 1));   // 尘网底光随密度升
      OBJ.forEach((o, k) => { const q = qs[k]; if (q <= 0.01) return;            // 三物揭开的光（外池＋核心光比要够）
        const oq = ease.out(q);
        pool(g, o.pool[0] + dx, o.pool[1], o.pool[2], '255,222,170', clamp(0.16 + 0.62 * oq + 0.05 * f, 0, 1));
        pool(g, o.pool[0] + dx, o.pool[1] - 40, 200, '255,240,210', clamp(0.34 * oq, 0, 1)); });
    });
  }

  // ---------- 相机：一个连续运镜（近景缓推 → 展开缓拉 → 收稳） ----------
  function camZoom(lt) {
    if (lt < 3) return lerp(1, 1.09, ss(0, 3, lt));
    if (lt < 7) return lerp(1.09, 1.02, ease.inOut(clamp((lt - 3) / 4, 0, 1)));
    return lerp(1.02, 1, ss(7.3, 9.6, lt));
  }

  // ---------- 光柱浮尘（母题循环：只在光柱楔形里显示、闪烁上浮） ----------
  function beamDust(c, t, gold) {
    c.save(); c.globalCompositeOperation = 'lighter';
    const dust = P.particles(64, 19, t * 0.32, { x0: 300, x1: 1560, y0: 1015, y1: 120, speed: 36, drift: 22, life: 8 });
    dust.forEach((d, i) => {
      if (d.y < 130 || d.y > 1010 || d.x < beamL(d.y) - 26 || d.x > beamR(d.y) + 26) return;
      const tw = 0.5 + 0.5 * Math.sin(t * 3.1 + i * 2.3);
      c.fillStyle = 'rgba(255,236,190,' + clamp(0.16 + 0.4 * tw + 0.12 * gold, 0, 1) + ')';
      c.beginPath(); c.arc(d.x, d.y, 1.3 + d.s * 1.5 + 0.4 * gold, 0, TAU); c.fill();
    });
    c.restore();
  }

  // ---------- 尘网：细金线蔓延＋尘粒增殖；拍三描金收稳（屏上字/铭牌后面压暗保读） ----------
  function drawNet(c, lt, t, dn, gold, calm, pulse, qs) {
    const dim = [];
    CAPS.forEach(cp => { if (cp.a(lt) > 0.3) dim.push(cp.box); });
    OBJ.forEach((o, k) => { const q = qs[k]; if (q > 0.45) { const ps = objPose(o, q), ly = ps.y - o.sh * ps.sc;
      dim.push([o.x - 54, ly - 46, o.x + 54, ly + 12]); } });
    const la = 0.2 + 0.26 * dn + 0.45 * gold;
    const amp = 3 * (1 - 0.82 * calm);
    c.save(); c.lineCap = 'round';
    for (const L of CONN) {
      if (lt <= L.birth) continue;
      const fr = clamp((lt - L.birth) / 0.4, 0, 1);
      const mx = (L.ax + L.bx) / 2 + L.bow * 0.9, my = (L.ay + L.by) / 2 + L.bow * 0.35;
      const nSeg = Math.max(2, Math.ceil(8 * fr));
      c.strokeStyle = 'rgba(196,148,88,' + (la * (0.5 + 0.5 * fr)) + ')'; c.lineWidth = 2.2;
      c.beginPath(); c.moveTo(L.ax, L.ay);
      for (let s2 = 1; s2 <= nSeg; s2++) {
        const q = (s2 / 8) * fr, u = 1 - q;
        c.lineTo(u * u * L.ax + 2 * u * q * mx + q * q * L.bx + L.nx * amp * Math.sin(q * 7 + L.ph),
                 u * u * L.ay + 2 * u * q * my + q * q * L.by + L.ny * amp * Math.sin(q * 7 + L.ph));
      }
      c.stroke();
      if (gold > 0.04) {                                                        // 拍三描金
        c.save(); c.globalCompositeOperation = 'lighter';
        c.strokeStyle = 'rgba(240,200,120,' + (0.5 * gold) + ')'; c.lineWidth = 1.3;
        c.beginPath(); c.moveTo(L.ax, L.ay);
        for (let s2 = 1; s2 <= nSeg; s2++) {
          const q = (s2 / 8) * fr, u = 1 - q;
          c.lineTo(u * u * L.ax + 2 * u * q * mx + q * q * L.bx + L.nx * amp * Math.sin(q * 7 + L.ph),
                   u * u * L.ay + 2 * u * q * my + q * q * L.by + L.ny * amp * Math.sin(q * 7 + L.ph));
        }
        c.stroke(); c.restore();
      }
    }
    const tight = 1 - 0.3 * gold;                                               // 拍三：光晕收紧变精
    for (const m of NET) {
      if (lt <= m.birth) continue;
      const age = lt - m.birth, pop = age < 0.3 ? ease.outBack(clamp(age / 0.3, 0, 1)) : 1;
      const tw = 0.5 + 0.5 * Math.sin(t * m.sp * 2.2 + m.ph);
      let a = (0.3 + 0.3 * dn + 0.34 * gold) * (0.55 + 0.45 * tw) * (1 + 0.3 * pulse);
      let dm = false;
      for (const bx of dim) if (m.x > bx[0] && m.x < bx[2] && m.y > bx[1] && m.y < bx[3]) { dm = true; break; }
      if (dm) a *= 0.25;
      const R = m.r * 5.2 * pop * tight * (0.9 + 0.2 * tw);
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = clamp(a, 0, 1);
      c.drawImage(GLOW, m.x - R, m.y - R, R * 2, R * 2); c.restore();
      c.fillStyle = m.warm ? '#e2b878' : '#f0dcae';
      c.beginPath(); c.arc(m.x, m.y, m.r * pop * (1 + 0.2 * gold), 0, TAU); c.fill();
      if (gold > 0.05 && !dm) { c.fillStyle = '#fbeec0'; c.beginPath(); c.arc(m.x, m.y, m.r * 0.5 * pop, 0, TAU); c.fill(); }
      if (!dm && m.r > 4.6) {                                                    // 大尘给十字光
        c.strokeStyle = m.warm ? 'rgba(226,184,120,.7)' : 'rgba(240,220,174,.7)'; c.lineWidth = 1.8;
        const ln = m.r * (1.9 + 0.5 * tw) * pop;
        c.beginPath(); c.moveTo(m.x - ln, m.y); c.lineTo(m.x + ln, m.y); c.moveTo(m.x, m.y - ln); c.lineTo(m.x, m.y + ln); c.stroke();
      }
    }
    c.restore();
  }

  // ---------- 三粒参数本体：呼吸明灭、缓浮、被放大端详（拍一）→退入尘网（拍二）→描金变精（拍三） ----------
  function drawFeat(c, lt, t, gold, calm) {
    const fs = lt < 2.8 ? 1 + 0.16 * ss(0, 2.8, lt) : lerp(1.16, 0.62, ease.inOut(clamp((lt - 2.8) / 1.6, 0, 1)));
    const numA = ss(0.7, 1.4, lt) * (1 - ss(3.3, 4.0, lt));
    FEAT.forEach((fm, k) => {
      const br = 0.85 + 0.15 * Math.sin(t * 2.1 + fm.ph);
      const dx = 8 * Math.sin(t * 0.42 + fm.ph), dy = 12 * Math.sin(t * 0.55 + fm.ph * 1.3) * (1 - 0.5 * calm);
      const R = 118 * fs * br * (1 - 0.22 * gold);
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = clamp(0.5 + 0.3 * gold, 0, 1);
      c.drawImage(GLOW, fm.x + dx - R, fm.y + dy - R, R * 2, R * 2); c.restore();
      // 厚涂鬃毛笔：浮尘＝画上的厚颜料亮斑
      impasto(c, [[fm.x + dx - 6 * fs, fm.y + dy - 2], [fm.x + dx + 6 * fs, fm.y + dy + 1]], 5 * fs, '#f0d8a0', 'rgba(255,248,220,.7)');
      c.fillStyle = '#f6e8c8'; c.beginPath(); c.arc(fm.x + dx, fm.y + dy, 6.4 * fs * br, 0, TAU); c.fill();
      c.fillStyle = '#fff6dc'; c.beginPath(); c.arc(fm.x + dx, fm.y + dy, 2.9 * fs * br, 0, TAU); c.fill();
      if (numA > 0.02) {                                                         // 账本手写读数
        c.save(); c.globalAlpha = numA; c.translate(fm.x + dx + 62 * fs, fm.y + dy + 56 * fs);
        c.rotate(-0.06 + 0.02 * Math.sin(t * 0.8 + fm.ph));
        c.font = Math.round(46 * fs) + 'px "CormorantGaramond-500"'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
        c.fillStyle = 'rgba(28,14,5,.85)'; c.fillText(fm.n, 2.5, 2.5);
        c.fillStyle = '#e2b45a'; c.fillText(fm.n, 0, 0);
        c.restore();
      }
    });
  }

  // ---------- 计数器：账本页上一列滚动读数 1.5B→175B→540B→1T+（铁胆墨深褐＋1T+ 时金墨一闪） ----------
  const CK = [[3.30, 0], [3.92, 1.5], [4.18, 1.5], [4.98, 175], [5.08, 175], [5.88, 540], [5.98, 540], [6.78, 1000], [999, 1000]];
  function counterVal(lt) {
    for (let i = 0; i < CK.length - 1; i++)
      if (lt >= CK[i][0] && lt <= CK[i + 1][0])
        return lerp(CK[i][1], CK[i + 1][1], ease.inOut(clamp((lt - CK[i][0]) / (CK[i + 1][0] - CK[i][0]), 0, 1)));
    return lt < 3.3 ? 0 : 1000;
  }
  function drawCounter(c, lt, t) {
    const a = ss(3.3, 3.78, lt) * (1 - ss(7.0, 7.42, lt)); if (a <= 0.01) return;
    const v = counterVal(lt);
    const txt = v >= 1000 ? '1T+' : v < 10 ? v.toFixed(1) + 'B' : Math.round(v) + 'B';
    const pulse = v >= 1000 ? Math.exp(-Math.max(0, lt - 6.78) * 3.2) : 0;
    const cx = 630, cy = 714;
    c.save(); c.globalAlpha = a;
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a * (0.2 + 0.32 * pulse);   // 烛照账页的暖光
    c.drawImage(GLOW, cx - 150, cy - 130, 300, 300); c.restore();
    c.translate(cx, cy); c.scale(1 + 0.13 * pulse, 1 + 0.13 * pulse);
    c.font = '86px "CormorantGaramond-500"'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.fillStyle = 'rgba(240,224,184,.9)'; c.fillText(txt, 3, 4);                    // 墨的投影偏暖
    c.fillStyle = '#38220e'; c.fillText(txt, 0, 0);                                 // 铁胆墨
    if (pulse > 0.03) {                                                            // 1T+：金墨一闪
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = pulse * 0.75;
      c.fillStyle = '#e8c070'; c.fillText(txt, 0, 0); c.restore();
    }
    c.strokeStyle = 'rgba(140,40,30,.5)'; c.lineWidth = 3; c.lineCap = 'round';    // 账页底线
    c.beginPath(); c.moveTo(-128, 16); c.lineTo(128, 16); c.stroke();
    c.restore();
    if (lt > 6.78 && lt < 7.45) {                                                  // 1T+ 揭示：金环扩散（唯一重音）
      const q = (lt - 6.78) / 0.67;
      c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
      c.strokeStyle = 'rgba(240,200,120,' + (0.55 * (1 - q)) + ')'; c.lineWidth = 10;
      c.setLineDash([20, 14]); c.lineDashOffset = -t * 60;
      c.beginPath(); c.arc(cx, cy - 26, 34 + q * 180, 0, TAU); c.stroke();
      c.setLineDash([]); c.restore();
    }
  }

  // ---------- 三物：精灵合成（乘光前）＋铭牌/描金点睛/烛焰（乘光后） ----------
  function objPose(o, q) {
    const e = ease.out(q), eb = ease.outBack(q);
    return { y: lerp(o.baseY + 300, o.baseY, eb), sc: lerp(o.sc * 0.7, o.sc, e), al: ss(0, 0.22, q) };
  }
  function compositeObjects(sg, t, qs) {
    OBJ.forEach((o, k) => {
      const q = qs[k]; if (q <= 0) return;
      const ps = objPose(o, q);
      sg.save(); sg.globalAlpha = ps.al; sg.translate(o.x, ps.y); sg.scale(ps.sc, ps.sc);
      sg.drawImage(o.sprite, -o.sw / 2, -o.sh);
      if (o.key === 'arm') {                                                       // 浑仪一环缓转＋环上铜珠
        const rot = t * 0.32, ba = t * 0.9;
        sg.strokeStyle = '#6a4a1c'; sg.lineWidth = 10;
        sg.beginPath(); sg.ellipse(0, -o.sh + 150, 88, 27, rot, 0, TAU); sg.stroke();
        sg.strokeStyle = '#c8943a'; sg.lineWidth = 6;
        sg.beginPath(); sg.ellipse(0, -o.sh + 150, 88, 27, rot, 0, TAU); sg.stroke();
        const bx = 88 * Math.cos(ba) * Math.cos(rot) - 27 * Math.sin(ba) * Math.sin(rot);
        const by = 88 * Math.cos(ba) * Math.sin(rot) + 27 * Math.sin(ba) * Math.cos(rot);
        sg.fillStyle = '#f0c870'; sg.beginPath(); sg.arc(bx, -o.sh + 150 + by, 6, 0, TAU); sg.fill();
      }
      sg.restore();
    });
  }
  function decorObjects(c, lt, t, gold, qs) {
    OBJ.forEach((o, k) => {
      const q = qs[k]; if (q <= 0) return;
      const ps = objPose(o, q);
      const labY = ps.y - o.sh * ps.sc - 14;
      const la = ps.al * ss(0.5, 0.85, q);
      if (la > 0.02) {                                                             // 铭牌（随物升起，≤880）
        c.save(); c.globalAlpha = la; c.font = '38px "LXGWWenKai-500"'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
        c.fillStyle = 'rgba(22,10,4,.92)'; c.fillText(o.label, o.x + 2, labY + 3);
        c.fillStyle = '#d0a050'; c.fillText(o.label, o.x, labY);
        c.restore();
      }
      const sp = gold * ss(0.75, 1, q);                                            // 归位后的描金点睛（厚涂）
      if (sp > 0.04) {
        c.save(); c.globalAlpha = sp; c.translate(o.x, ps.y); c.scale(ps.sc, ps.sc);
        if (o.key === 'books') {
          P.impasto(c, [[-80, -38], [-30, -42]], 5, '#e8c070');
          P.impasto(c, [[30, -42], [80, -38]], 5, '#e8c070');
        } else if (o.key === 'arm') {
          P.impasto(c, [[-58, -268], [-16, -288]], 5, '#f0c870');
          P.impasto(c, [[16, -288], [58, -268]], 5, '#f0c870');
        } else {
          P.impasto(c, [[-74, -110], [-58, -120]], 5, '#f0c870');
          P.impasto(c, [[58, -120], [74, -110]], 5, '#f0c870');
          P.impasto(c, [[-10, -166], [10, -168]], 4, '#f0c870');
        }
        c.restore();
      }
    });
  }

  // ---------- 烛焰（桌上蜡烛＋拍三烛台三焰；noise 驱动摇曳） ----------
  function drawFlame(c, x, yb, s, t, k) {
    const fl = 0.7 + 0.3 * flick(t * 1.6, k + 2), lean = 6 * P.noise(t * 2.6, k * 3.3);
    c.save(); c.globalCompositeOperation = 'lighter';
    pool(c, x, yb - 24 * s, (66 + 14 * fl) * s, '255,170,70', 0.34 + 0.16 * fl);
    c.fillStyle = '#ffd890';
    c.beginPath(); c.moveTo(x - 7 * s, yb);
    c.quadraticCurveTo(x - 8 * s, yb - 20 * s * fl, x + lean, yb - 42 * s * fl);
    c.quadraticCurveTo(x + 8 * s, yb - 18 * s * fl, x + 7 * s, yb); c.closePath(); c.fill();
    c.fillStyle = '#fff6d8';
    c.beginPath(); c.ellipse(x + lean * 0.3, yb - 10 * s, 3.4 * s, 8 * s * fl, 0.1, 0, TAU); c.fill();
    c.restore();
  }
  function flames(c, lt, t, qs) {
    drawFlame(c, 975, 578, 1, t, 0);
    if (qs[2] > 0.06) {
      const o = OBJ[2], ps = objPose(o, qs[2]);
      CAND_FLAMES.forEach(([fx, fy], k) => drawFlame(c, o.x + (fx - 140) * ps.sc, ps.y + (fy - 330) * ps.sc, ps.sc * 0.9, t, k + 1));
    }
  }

  // ---------- 受光处的厚涂亮斑（静态位置，每帧重画；窗台沿/烛身/墨水瓶/铜拉手/账页角） ----------
  function impastoAccents(c) {
    impasto(c, [[1236, 484], [1300, 487]], 6, '#e8c070');
    impasto(c, [[1420, 484], [1490, 484]], 5.5, '#e8c070');
    impasto(c, [[1590, 483], [1660, 483]], 5, '#e8c070');
    impasto(c, [[966, 585], [982, 584]], 4.5, '#fbf4dc', 'rgba(255,252,240,.8)');
    impasto(c, [[876, 694], [892, 696]], 4, '#a8a498');
    impasto(c, [[554, 888], [564, 888]], 3.5, '#e8c070');
    impasto(c, [[554, 1008], [564, 1008]], 3.5, '#e8c070');
    impasto(c, [[470, 638], [540, 630]], 4, '#f6ead0', 'rgba(255,252,235,.6)');
  }

  function captions(c, lt, t) {
    CAPS.forEach(cp => {
      const a = cp.a(lt); if (a <= 0.01) return;
      c.save(); c.globalAlpha = a; c.translate(cp.x, cp.y); c.rotate(-0.02 + 0.012 * Math.sin(t * 0.7 + cp.wob));
      c.font = cp.size + 'px "LXGWWenKai-500"'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      c.fillStyle = 'rgba(20,9,3,.95)'; c.fillText(cp.txt, 5, 7);
      c.fillStyle = '#d0a050'; c.fillText(cp.txt, 0, 0);
      c.restore();
    });
  }

  return {
    init() {
      U.assertGlyphs('150px "LXGWWenKai-500"', '参数疯狂卷之外数据方法算力', 's32_rembrandt 屏上字/铭牌');
      U.assertGlyphs('86px "CormorantGaramond-500"', '0123456789.BT+-', 's32_rembrandt 计数器/读数');
    },
    draw(c, lt, t) {
      const dn = clamp((lt - 3.28) / 3.27, 0, 1);                        // 尘网密度
      const gold = ss(7.6, 9.2, lt);                                      // 拍三描金
      const calm = ss(8.6, 9.7, lt);                                     // 尘网收稳
      const pulse = Math.exp(-Math.pow((lt - 6.78) * 3.2, 2));           // 1T+ 一次轻爆
      const qs = OBJ.map(o => clamp((lt - o.rise) / 0.8, 0, 1));
      // 静态底＋三物合成（先合成、后乘光，让揭开的光池塑形）
      const S = P.scratch('s32Sc'), sg = S.getContext('2d'); sg.reset();
      sg.drawImage(stat(), 0, 0);
      compositeObjects(sg, t, qs);
      P.applyLight(sg, lightMap(t, lt, dn, gold, pulse, qs));
      // 窗玻璃是光源：再亮一点（screen）＋云影团掠过（首尾淡入淡出，不硬切）
      sg.save(); sg.globalCompositeOperation = 'screen'; sg.globalAlpha = 0.34 + 0.08 * flick(t);
      sg.drawImage(stat(), 1272, 82, 504, 386, 1272, 82, 504, 386); sg.restore();
      sg.save(); sg.beginPath(); sg.rect(GLASS[0], GLASS[1], GLASS[2], GLASS[3]); sg.clip();
      const ph = (t * 230) % 640, cbx = 1330 + ph, cbA = Math.sin(Math.PI * ph / 640);
      const cbg = sg.createRadialGradient(cbx, 262, 30, cbx, 262, 250);
      cbg.addColorStop(0, 'rgba(60,40,20,' + (0.35 * cbA) + ')'); cbg.addColorStop(1, 'rgba(60,40,20,0)');
      sg.fillStyle = cbg; sg.fillRect(GLASS[0], GLASS[1], GLASS[2], GLASS[3]); sg.restore();
      // 一个连续运镜：近景缓推 → 展开缓拉 → 收稳
      const z = camZoom(lt), cx = lerp(1050, 960, ss(3, 7, lt)), cy = lerp(450, 540, ss(3, 7, lt));
      c.save(); c.translate(cx, cy); c.scale(z, z); c.translate(-cx, -cy);
      c.drawImage(S, 0, 0);
      beamDust(c, t, gold);
      drawNet(c, lt, t, dn, gold, calm, pulse, qs);
      drawFeat(c, lt, t, gold, calm);
      drawCounter(c, lt, t);
      impastoAccents(c);
      flames(c, lt, t, qs);
      decorObjects(c, lt, t, gold, qs);
      c.restore();
      // 屏上字（不随镜头缩放）
      captions(c, lt, t);
      // 罩层：拍二暗角随密度加深（背景升级）＋龟裂＋颗粒＋soft-light 金褐釉
      { const a = 0.22 * dn * (1 - 0.45 * gold); if (a > 0.004) { c.save(); c.globalAlpha = a; c.drawImage(VIG, 0, 0); c.restore(); } }
      c.drawImage(OVER, 0, 0);
      c.save(); c.globalCompositeOperation = 'soft-light'; c.fillStyle = 'rgba(200,140,60,.35)'; c.fillRect(0, 0, W, H); c.restore();
    },
  };
})();
