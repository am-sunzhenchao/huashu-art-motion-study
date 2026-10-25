// s29_seurat · 修拉《大碗岛的星期天下午》点彩 ×「大模型参数」风格样片（10s 单镜头三拍）。
// 题材构图（不搬速通片的房间）：参数＝画布上一颗颗等大纯色点本身——
//   拍一 0–3s   特写三颗纯色参数点（红橙／湖蓝／黄绿，旁挂数字小牌 0.73／-1.2／2.4），周身两两并置的混色点圈
//              ＋绕行的补色卫星点，大片还没上点的素色画布；点呼吸换色、卫星点绕转、点群边缘涨缩，镜头几乎静止端详；
//   拍二 3–7s   点阵从中心结晶扩散，长成一整幅「数字公园」（大树／塞纳湖／草坡／远处无脸人影剪影／漂移的帆船），
//              画框角落的展览标签计数器滚动 1.5B→175B→540B→1T+、四枚色点指示灯逐级点亮，天色点云草花随档加密，
//              1T+ 时光渗出一圈涟漪（唯一一次重音）；镜头 3.5–4.5s 一次平滑拉远看全画（点彩对缩放重采样极敏感，
//              拉远须短而匀：1s smoothstep，QA 记为镜头事件而非跳变），之后停住；
//   拍三 7–10s  增殖停住；一摞点彩书(数据)／点彩齿轮(方法)／点彩油灯(算力)依次从草坡升起归位，齿轮缓转、油灯点起
//              光渗进周身的点，参数点从「变多」转为「变亮变精」——上光小点自三物向外漾开，点场收稳；镜头停收全貌。
// 管线（照风格卡 29_seurat 的点彩渲染器，本地实现以支持「结晶出生／上光」；P.pointillism 无出生遮罩故不直接用）：
//   ①每帧平涂底稿 basePaint（公园＋三物＋主点）→ ②半分辨率底稿模糊提亮，只clip 到「已结晶区」（点缝里露出的打底色）；
//      素色画布上有淡色铅笔起稿线（croquis：树冠/湖线/人影/三物虚线框），点彩长到即被覆盖
//   → ③点彩：固定六角网格 pitch 10／行距 8.66／r 4.5，位置±1.2px 种子抖动；21 色纯色板两两并置视觉混色（目标色投影
//      取比例 w、15bit 量化缓存）＋取色前±20 哈希抖动（防竖色带）＋8% 补色点＋明暗交界光渗（亮侧白点／暗侧深蓝点）
//      ＋湖面点 4fps 掷光（波光）；点彩对缩放重采样极敏感，运镜只做近静止端详＋1s 平滑拉远，其余全靠画面本身生长；
//      「颤」用每点错相 4fps（同一颗点仍保持 1/4s，全局不齐步→帧差平滑不闪），幅度压到 4%（拍三 2%）
//   → ④屏幕层：展签式屏上字（WenKai）／数字牌与计数器（Marcellus）。
// 确定性：随机全用 U.hash／U.rng 种子；无角色（远处人影为无脸剪影）；做旧不上身；帧内 ms 目标 ≤150。
SCENES['s29_seurat'] = (() => {
  const W = 1920, H = 1080, TAU = Math.PI * 2;
  const { clamp, lerp, ss, ease } = U, P = PAINT;

  // ---------- 21 色纯色板与补色映射（抄自风格卡 29_seurat / 原版 scenes/29_seurat.js） ----------
  const PAL = ['#1a2058', '#2a3a9a', '#3f6fd0', '#6aaee6', '#1f6a52', '#2f9a5a', '#a8c83a', '#f2cf3a', '#f08a2a', '#e0432a',
    '#c0306a', '#7a4aa8', '#f8f4e8', '#e8b48a', '#f6e49a', '#f6c48a', '#cfe08a', '#b0cff0', '#f2b8c8', '#c99a4a', '#9a7ac8'];
  const PALRGB = PAL.map(P.hex);
  const COMP = { 0: 8, 1: 8, 2: 8, 3: 9, 4: 9, 5: 10, 6: 11, 7: 11, 8: 2, 9: 5, 10: 5, 11: 7, 12: 17, 13: 17, 14: 20, 15: 17, 16: 18, 17: 15, 18: 16, 19: 2, 20: 14 };

  // ---------- 网格 ----------
  const PITCH = 10, ROWH = PITCH * 0.866, RAD = 4.5;

  // ---------- 结晶中心 / 计数档位 ----------
  const FC = { x: 952, y: 510 };
  const STG = [3.62, 4.5, 5.4, 6.3];
  const stage = lt => ss(STG[0], STG[0] + 0.35, lt) + ss(STG[1], STG[1] + 0.35, lt) + ss(STG[2], STG[2] + 0.35, lt) + ss(STG[3], STG[3] + 0.35, lt);

  // ---------- 三颗参数主点（吸附到网格节点；数字牌偏移） ----------
  const SEEDS = [
    { x: 825, y: 459, num: '0.73', ph: 0.0, pair: [9, 7], sats: [8, 12, 14], off: [124, 98] },
    { x: 1080, y: 606, num: '-1.2', ph: 2.1, pair: [2, 3], sats: [8, 9, 12], off: [-128, -106] },
    { x: 955, y: 372, num: '2.4', ph: 4.2, pair: [6, 5], sats: [11, 19, 12], off: [122, 94] },
  ];

  // ---------- 静态几何（种子生成一次） ----------
  const rG = U.rng(4242);
  const FLOWERS = []; for (let i = 0; i < 64; i++) FLOWERS.push({ x: 36 + rG() * 1848, y: 796 + rG() * 248, c: [9, 7, 14][(rG() * 3) | 0], r: 3.4 + rG() * 1.6, t0: i < 14 ? -1 : STG[Math.min(3, ((i - 14) / 12) | 0)] + ((i - 14) % 12) * 0.05 });
  const CLOUDS = [
    { x: 520, y: 152, s: 1.1, stg: 0 }, { x: 905, y: 96, s: 0.8, stg: 1 }, { x: 1272, y: 214, s: 0.95, stg: 2 },
    { x: 292, y: 262, s: 0.7, stg: 3 }, { x: 1576, y: 128, s: 0.66, stg: 4 },
  ];
  const GLIT = [
    { x: 1560, y: 662, rx: 120, ry: 8 }, { x: 1430, y: 692, rx: 90, ry: 7 }, { x: 1662, y: 702, rx: 100, ry: 7 },
    { x: 1502, y: 728, rx: 130, ry: 8 }, { x: 1752, y: 650, rx: 70, ry: 6 }, { x: 1352, y: 750, rx: 110, ry: 8 }, { x: 1618, y: 762, rx: 90, ry: 7 },
  ];
  const FIGS = [
    { x: 1128, y: 610, h: 52, par: 1 }, { x: 1236, y: 614, h: 46, par: 0 },
    { x: 1318, y: 611, h: 55, par: 1 }, { x: 1422, y: 613, h: 40, par: 0, sit: 1 },
  ];

  // ---------- 相机：近景缓推 → 缓拉远看全画 → 停 ----------
  // ---------- 相机：近景端详（几乎静止）→ 3.5–4.5s 一次平滑拉远看全画（点彩对缩放重采样极敏感，拉远须短而匀，QA 记镜头事件）→ 停 ----------
  function camOf(lt) {
    if (lt < 3.5) return { z: 2.0, cx: 952, cy: 506 };
    if (lt < 4.5) { const p = U.ss(3.5, 4.5, lt); return { z: lerp(2.0, 1, p), cx: lerp(952, 960, p), cy: lerp(506, 540, p) }; }
    return { z: 1, cx: 960, cy: 540 };
  }
  // 结晶前沿半径：两段匀速——3–3.6s 快速长出中心区（特写下可见「初生公园」），3.6–6.9s 匀速铺满四角；
  // 行程压到 ≤14px/帧（快段）/9.3px/帧（铺满段）：拉远串之外的结晶帧差须低于拉远串的扩展阈值，QA 才能把拉远认成镜头事件
  function frontR(lt) {
    if (lt <= 3) return 0;
    if (lt <= 3.6) return 260 * (lt - 3) / 0.6;
    return 260 + 925 * Math.min(1, (lt - 3.6) / 3.3);
  }
  // 点群呼吸半径（拍一在素色画布上胀缩；拍二起被结晶前沿吞没）——静中微动，摆幅压小
  const clusR = (s, t) => 130 + 6 * Math.sin(t * 0.42 + s.ph * 0.7);

  // ---------- 视觉混色取色（15bit 量化缓存；色板两两投影 + 远对惩罚，照卡） ----------
  const pickCache = new Map();
  function pick(r, g, b) {
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    let v = pickCache.get(key); if (v) return v;
    let best = 1e18, bi = 0, bj = 0, bw = 1;
    for (let i = 0; i < 21; i++) for (let j = i + 1; j < 21; j++) {
      const pi = PALRGB[i], pj = PALRGB[j], ex = pi[0] - pj[0], ey = pi[1] - pj[1], ez = pi[2] - pj[2];
      const w = clamp(((r - pj[0]) * ex + (g - pj[1]) * ey + (b - pj[2]) * ez) / (ex * ex + ey * ey + ez * ez + 1e-6), 0.2, 0.8);
      const dr = pj[0] + w * ex - r, dg = pj[1] + w * ey - g, db = pj[2] + w * ez - b;
      const d = dr * dr * 0.9 + dg * dg * 1.2 + db * db * 0.8 + (ex * ex + ey * ey + ez * ez) * 0.004;
      if (d < best) { best = d; bi = i; bj = j; bw = w; }
    }
    v = [bi, bj, bw]; pickCache.set(key, v); return v;
  }

  // ---------- 底稿：整幅平涂的「数字公园」 ----------
  function figure(g, f) {                       // 远处人影＝无脸剪影
    const { x, y, h } = f, dk = '#23244a';
    g.fillStyle = dk;
    if (f.sit) { g.beginPath(); g.ellipse(x, y - h * 0.3, h * 0.24, h * 0.32, 0, 0, TAU); g.fill(); g.beginPath(); g.arc(x + h * 0.05, y - h * 0.72, h * 0.11, 0, TAU); g.fill(); return; }
    g.beginPath(); g.ellipse(x, y - h * 0.34, h * 0.13, h * 0.36, 0, 0, TAU); g.fill();     // 裙身
    g.beginPath(); g.arc(x, y - h * 0.86, h * 0.11, 0, TAU); g.fill();                      // 头（剪影无脸）
    if (f.par) {                                                                               // 阳伞
      g.strokeStyle = dk; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x + h * 0.04, y - h * 0.9); g.lineTo(x + h * 0.14, y - h * 1.14); g.stroke();
      g.beginPath(); g.ellipse(x + h * 0.18, y - h * 1.16, h * 0.3, h * 0.1, -0.14, Math.PI, TAU); g.fill();
    }
  }
  function boat(g, x, y, s, dir) {
    g.fillStyle = '#23244a';
    g.beginPath(); g.moveTo(x - 30 * s, y); g.quadraticCurveTo(x, y + 12 * s, x + 30 * s, y); g.lineTo(x + 21 * s, y - 7 * s); g.lineTo(x - 21 * s, y - 7 * s); g.closePath(); g.fill();
    g.strokeStyle = '#23244a'; g.lineWidth = 3 * s; g.beginPath(); g.moveTo(x, y - 7 * s); g.lineTo(x, y - 64 * s); g.stroke();
    g.fillStyle = '#f8f4e8'; g.beginPath(); g.moveTo(x + 2 * s, y - 62 * s); g.lineTo(x + 2 * s, y - 12 * s); g.lineTo(x + 42 * s * dir, y - 14 * s); g.closePath(); g.fill();
  }
  function flamePath(g, x, y, w, h) {
    g.beginPath(); g.moveTo(x - w, y);
    g.bezierCurveTo(x - w, y - h * 0.42, x - w * 0.4, y - h * 0.62, x, y - h);
    g.bezierCurveTo(x + w * 0.4, y - h * 0.62, x + w, y - h * 0.42, x + w, y);
    g.closePath();
  }
  // 拍三三物（画进底稿→被点彩）：书=数据 齿轮=方法 油灯=算力
  const RISE = [7.15, 7.55, 7.95];
  const riseOf = (lt, k) => ease.outBack(clamp((lt - RISE[k]) / 1.05, 0, 1));
  function drawObjects(g, lt, t) {
    // —— 一摞书（数据）——
    { const k = riseOf(lt, 0); if (k > 0) { g.save(); g.translate(0, 175 * (1 - k));
      const rows = [[470 - 125, 1006 - 34, 250, 34, '#e0432a'], [470 - 114, 1006 - 66, 228, 32, '#2f9a5a'], [470 - 119, 1006 - 96, 238, 30, '#f2cf3a'], [470 - 107, 1006 - 124, 214, 28, '#3f6fd0']];
      rows.forEach(q => { g.fillStyle = q[4]; g.fillRect(q[0], q[1], q[2], q[3]); g.fillStyle = '#f8f4e8'; g.fillRect(q[0] + q[2] - 12, q[1] + 3, 9, q[3] - 6); g.strokeStyle = 'rgba(26,32,88,.6)'; g.lineWidth = 3; g.strokeRect(q[0], q[1], q[2], q[3]); });
      g.fillStyle = '#f8f4e8'; g.beginPath(); g.moveTo(470 - 100, 1006 - 130); g.quadraticCurveTo(470, 1006 - 158, 470 + 100, 1006 - 130); g.lineTo(470 + 100, 1006 - 142); g.quadraticCurveTo(470, 1006 - 170, 470 - 100, 1006 - 142); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(26,32,88,.55)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(470, 1006 - 168); g.lineTo(470, 1006 - 132); g.stroke();
      g.restore(); } }
    // —— 齿轮（方法）——
    { const k = riseOf(lt, 1); if (k > 0) { g.save(); g.translate(0, 175 * (1 - k));
      const cx = 960, cy = 892, ang = 0.3 + lt * 0.16;
      g.beginPath();
      for (let i = 0; i < 24; i++) { const a = ang + (i / 24) * TAU, rr = i % 2 ? 114 : 96, px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr; i ? g.lineTo(px, py) : g.moveTo(px, py); }
      g.closePath(); g.fillStyle = '#f2cf3a'; g.fill(); g.strokeStyle = '#c99a4a'; g.lineWidth = 6; g.stroke();
      g.strokeStyle = '#c99a4a'; g.lineWidth = 10; g.lineCap = 'round';
      for (let i = 0; i < 4; i++) { const a = ang * 1.4 + i * Math.PI / 2; g.beginPath(); g.moveTo(cx + Math.cos(a) * 34, cy + Math.sin(a) * 34); g.lineTo(cx + Math.cos(a) * 80, cy + Math.sin(a) * 80); g.stroke(); }
      g.fillStyle = '#e0432a'; g.beginPath(); g.arc(cx, cy, 28, 0, TAU); g.fill();
      g.fillStyle = '#2f9a5a'; g.beginPath(); g.arc(cx, cy, 11, 0, TAU); g.fill();
      g.restore(); } }
    // —— 油灯（算力）——
    { const k = riseOf(lt, 2); if (k > 0) { g.save(); g.translate(0, 175 * (1 - k));
      const cx = 1450;
      g.fillStyle = '#c99a4a'; g.beginPath(); g.ellipse(cx, 1000, 58, 17, 0, 0, TAU); g.fill();
      g.fillRect(cx - 7, 878, 14, 116);
      g.fillStyle = '#f2cf3a'; g.beginPath(); g.ellipse(cx, 874, 46, 15, 0, 0, TAU); g.fill();
      g.strokeStyle = '#c99a4a'; g.lineWidth = 5; g.beginPath(); g.ellipse(cx, 874, 46, 15, 0, 0, TAU); g.stroke();
      g.fillStyle = 'rgba(176,207,240,.3)'; g.beginPath(); g.moveTo(cx - 26, 862); g.lineTo(cx + 26, 862); g.lineTo(cx + 15, 778); g.lineTo(cx - 15, 778); g.closePath(); g.fill();
      g.strokeStyle = '#b0cff0'; g.lineWidth = 3; g.stroke();
      g.fillStyle = '#c99a4a'; g.fillRect(cx - 22, 766, 44, 12);
      g.fillStyle = '#6a4a2a'; g.fillRect(cx - 3, 838, 6, 12);                                    // 灯芯
      const fl = 1 + 0.13 * P.noise(lt * 3.2, 7.7), fw = 1 + 0.18 * P.noise(lt * 2.5, 12.3);
      g.fillStyle = '#f2cf3a'; flamePath(g, cx, 840, 15 * fw, 54 * fl); g.fill();
      g.fillStyle = '#f8f4e8'; flamePath(g, cx, 840, 8 * fw, 32 * fl); g.fill();
      const ga = ss(8.0, 8.6, lt) * (0.3 + 0.045 * Math.sin(t * 0.9));                             // 灯光光渗进周身的点
      if (ga > 0.01) { const rg = g.createRadialGradient(cx, 830, 10, cx, 830, 250); rg.addColorStop(0, 'rgba(246,228,154,' + ga + ')'); rg.addColorStop(1, 'rgba(246,228,154,0)'); g.fillStyle = rg; g.fillRect(cx - 250, 580, 500, 500); }
      g.restore(); } }
  }
  // ---------- 静态基景（一次画好每帧贴回：天空/太阳/对岸/人影/湖/草坡/大树/边框） ----------
  const BG = P.cached('s29bg', W, H, (g) => {
    const sg = g.createLinearGradient(0, 0, 0, 624);
    sg.addColorStop(0, '#b0cff0'); sg.addColorStop(0.55, '#bcd4ec'); sg.addColorStop(1, '#e8eef0');
    g.fillStyle = sg; g.fillRect(0, 0, W, 624);                                // 天空（湖蓝→地平线象牙霾）
    { const hg = g.createRadialGradient(1630, 168, 20, 1630, 168, 310); hg.addColorStop(0, 'rgba(248,244,232,.85)'); hg.addColorStop(0.4, 'rgba(246,228,154,.4)'); hg.addColorStop(1, 'rgba(246,228,154,0)'); g.fillStyle = hg; g.fillRect(1320, 0, 600, 500); }   // 太阳与日晕（右上）
    g.fillStyle = '#f6e49a'; g.beginPath(); g.arc(1630, 168, 44, 0, TAU); g.fill();
    g.fillStyle = '#1f6a52';                                                   // 对岸树影
    [[1706, 62], [1820, 46], [1616, 40], [390, 34], [520, 28]].forEach(q => { g.beginPath(); g.ellipse(q[0], 562, q[1], 46, 0, Math.PI, TAU); g.fill(); });
    g.fillStyle = '#2f6a4a'; g.fillRect(0, 560, W, 64);                         // 对岸草带
    FIGS.forEach(f => figure(g, f));                                          // 远处人影剪影（无脸）
    const lg = g.createLinearGradient(0, 624, 0, 778);                         // 湖面（塞纳河：上深下亮）
    lg.addColorStop(0, '#2a3a9a'); lg.addColorStop(0.3, '#3f6fd0'); lg.addColorStop(0.75, '#6aaee6'); lg.addColorStop(1, '#3d6fc0');
    g.fillStyle = lg; g.fillRect(0, 624, W, 154);
    const gb = g.createLinearGradient(0, 778, 0, H);                          // 近岸草坡
    gb.addColorStop(0, '#cfe08a'); gb.addColorStop(0.45, '#a8c83a'); gb.addColorStop(1, '#2f9a5a');
    g.fillStyle = gb; g.fillRect(0, 778, W, 302);
    g.fillStyle = 'rgba(31,106,82,.45)'; g.beginPath(); g.ellipse(440, 892, 320, 116, 0, 0, TAU); g.fill();   // 大树投影在草坡上
    g.fillStyle = '#6a4a2a'; g.beginPath(); g.moveTo(298, 472); g.quadraticCurveTo(314, 630, 306, 792); g.lineTo(350, 792); g.quadraticCurveTo(344, 630, 352, 472); g.closePath(); g.fill();   // 大树（大碗岛的签名物：左侧巨树）
    g.fillStyle = '#1f5a3a'; g.beginPath(); g.ellipse(330, 392, 245, 188, 0, 0, TAU); g.fill();
    g.save(); g.globalAlpha = 0.8; g.fillStyle = '#2f9a5a';
    [[432, 300, 112, 68], [522, 382, 92, 60], [180, 342, 82, 56]].forEach(q => { g.beginPath(); g.ellipse(q[0], q[1], q[2], q[3], 0, 0, TAU); g.fill(); });
    g.globalAlpha = 0.7; g.fillStyle = '#1f6a52';
    [[240, 472, 92, 60], [148, 422, 72, 46]].forEach(q => { g.beginPath(); g.ellipse(q[0], q[1], q[2], q[3], 0, 0, TAU); g.fill(); });
    g.restore();
    g.fillStyle = '#1a2058'; g.fillRect(0, 0, W, 28); g.fillRect(0, H - 28, W, 28); g.fillRect(0, 0, 28, H); g.fillRect(W - 28, 0, 28, H);   // 修拉自画的点彩边框（深蓝带，也进点彩）
  });
  function basePaint(g, lt, t) {
    const stg = stage(lt);
    g.drawImage(BG, 0, 0);
    // 随密度档：天色与湖面各加一层淡紫蓝（一次淡入后恒定，不再逐档加深——档位变化会连锁点彩换色）
    if (stg > 0.01) { g.fillStyle = 'rgba(42,58,154,0.05)'; g.fillRect(0, 0, W, 624); g.fillStyle = 'rgba(26,32,88,0.06)'; g.fillRect(0, 624, W, 154); }
    // 点云（逐档显现）
    CLOUDS.forEach((cl, k) => {
      const a = cl.stg === 0 ? 1 : ss(STG[cl.stg - 1], STG[cl.stg - 1] + 0.45, lt); if (a <= 0.01) return;
      g.save(); g.globalAlpha = 0.5 * a; g.fillStyle = '#f8f4e8';
      [[-0.5, 0.06, 0.62], [0, -0.08, 0.8], [0.52, 0.05, 0.58]].forEach(q => { g.beginPath(); g.ellipse(cl.x + q[0] * 130 * cl.s, cl.y + q[1] * 120 * cl.s + 26 * cl.s, 92 * cl.s * q[2], 30 * cl.s * q[2], 0, 0, TAU); g.fill(); });
      g.globalAlpha = 0.24 * a; g.fillStyle = '#f6e49a';
      g.beginPath(); g.ellipse(cl.x, cl.y + 12 * cl.s, 80 * cl.s, 22 * cl.s, 0, 0, TAU); g.fill();
      g.restore();
    });
    // 湖面随档加深的淡层与湖上动态（碎金/船）在下方；对岸与人影已进 BG
    // 日光落湖的碎金（逐档增多，逐条平滑淡入）
    const ng = 3 + Math.round(stg);
    for (let i = 0; i < Math.min(ng, GLIT.length); i++) { const q = GLIT[i];
      const aG = i < 3 ? 1 : U.ss(STG[i - 3], STG[i - 3] + 0.4, lt); if (aG <= 0.01) continue;
      g.fillStyle = (i % 2 ? 'rgba(246,228,154,' : 'rgba(248,244,232,') + (0.5 * aG) + ')';
      g.beginPath(); g.ellipse(q.x, q.y, q.rx, q.ry, 0, 0, TAU); g.fill(); }
    // 草花（逐档增多，逐朵平滑淡入）
    for (let i = 0; i < FLOWERS.length; i++) { const f = FLOWERS[i];
      const aF = f.t0 < 0 ? 1 : U.ss(f.t0, f.t0 + 0.5, lt); if (aF <= 0.01) continue;
      g.globalAlpha = aF; g.fillStyle = PAL[f.c]; g.beginPath(); g.arc(f.x, f.y, f.r, 0, TAU); g.fill(); }
    g.globalAlpha = 1;
    // 湖上帆船（漂移，减速——静水行舟）
    boat(g, 1500 - lt * 16, 706, 1, -1);
    boat(g, 240 + lt * 10, 649, 0.5, 1);
    // 拍三三物
    drawObjects(g, lt, t);
    // 三颗参数主点：光晕（呼吸色）＋主点＋补色卫星点
    SEEDS.forEach(s => {
      const bb = 0.5 + 0.26 * Math.sin(t * 1.1 + s.ph);
      const col = P.mix(PALRGB[s.pair[0]], PALRGB[s.pair[1]], bb);
      g.fillStyle = P.rgb(col, 0.16); g.beginPath(); g.arc(s.x, s.y, 42, 0, TAU); g.fill();
      g.fillStyle = P.rgb(col); g.beginPath(); g.arc(s.x, s.y, 6.5, 0, TAU); g.fill();
      s.sats.forEach((ci, q) => {
        const a = s.ph + q * 2.1 + t * [0.26, -0.34, 0.42][q];
        g.fillStyle = PAL[ci]; g.beginPath(); g.arc(s.x + Math.cos(a) * 54, s.y + Math.sin(a) * 49, 5.5, 0, TAU); g.fill();
      });
    });
  }

  // ---------- 画布 ----------
  const BASE = P.scratch('s29base');
  const bctx = BASE.getContext('2d', { willReadFrequently: true });
  const UNDER = P.canvas(960, 540);
  const PICKC = P.canvas(960, 540);                                          // 半分辨率取色版（点彩 pick 用，读回省 3/4）
  const pkc = PICKC.getContext('2d', { willReadFrequently: true });
  const TMP = P.canvas(480, 270);                                            // UNDER 降采样中转（代替 filter blur）
  const pixK = (x, y) => (clamp(y >> 1, 0, 539) * 960 + clamp(x >> 1, 0, 959)) * 4;

  // ---------- 点彩主遍（世界坐标；c 已带相机变换） ----------
  function dotPass(c, lt, t, cam, rSeed, R, sd) {
    const flick = 0.04 * (1 - 0.5 * ss(8.2, 9.4, lt));                       // 拍三收稳：颤点再减半
    const gildQ = ss(7.2, 8.8, lt);                                            // 拍三：变亮变精
    const rp = lt >= 6.3 && lt < 8.1 ? (lt - 6.3) / 1.8 : -1;                  // 1T+ 光渗涟漪（唯一重音，慢圈）
    const rr = rp >= 0 ? rp * 990 : -1, ripA = rp >= 0 ? 0.15 * (1 - rp) : 0;
    const GILD_AT = [[470, 900], [960, 880], [1450, 890]];
    const paths = []; for (let k = 0; k < 21; k++) paths.push(new Path2D());
    const gildPath = gildQ > 0.005 ? new Path2D() : null;
    const ripPath = rp >= 0 ? new Path2D() : null;
    const lum = (x, y) => { const k = pixK(x | 0, y | 0); return sd[k] * 0.3 + sd[k + 1] * 0.59 + sd[k + 2] * 0.11; };
    // 可见世界矩形（只画看得见的点，省 60–85%）
    const hw = W / 2 / cam.z, hh = H / 2 / cam.z;
    const j0 = Math.max(0, Math.floor((cam.cy - hh) / ROWH) - 1);
    const j1 = Math.min(Math.ceil(H / ROWH), Math.ceil((cam.cy + hh) / ROWH) + 1);
    const fRj = R + 46, fRj2 = fRj * fRj;
    for (let j = j0; j <= j1; j++) {
      const off = (j & 1) * PITCH / 2;
      const i0 = Math.max(0, Math.floor((cam.cx - hw - off) / PITCH) - 1);
      const i1 = Math.min(Math.ceil(W / PITCH), Math.ceil((cam.cx + hw - off) / PITCH) + 1);
      for (let i = i0; i <= i1; i++) {
        const px = i * PITCH + off + (U.hash(i, j * 7 + 1) - 0.5) * 2.4;
        const py = j * ROWH + (U.hash(i * 3, j + 5) - 0.5) * 2.4;
        // 出生（结晶前沿 or 主点群呼吸圈），pop 同时是长出动画（66px 行程渐长，前沿扫过不闪）
        let pop = 0;
        const dfx = px - FC.x, dfy = py - FC.y, df2 = dfx * dfx + dfy * dfy;
        let dF = -1;
        if (R > 4 && df2 < fRj2) {
          dF = Math.sqrt(df2) + (U.hash(i * 3, j * 7) - 0.5) * 28;
          const p2 = (R - dF) / 66; if (p2 > pop) pop = p2;
        }
        for (let s = 0; s < 3; s++) {
          const dx = px - SEEDS[s].x, dy = py - SEEDS[s].y, d2 = dx * dx + dy * dy, rs = rSeed[s];
          if (d2 < rs * rs) { const p2 = (rs - Math.sqrt(d2)) / 34; if (p2 > pop) pop = p2; }
        }
        if (pop <= 0.05) continue;
        const rsz = RAD * (0.34 + 0.66 * Math.min(1, pop));
        // 视觉混色取色（目标色 ±20 哈希抖动，防竖色带；sd 是半分辨率取色版）
        const k = pixK(px | 0, py | 0);
        const dj = (U.hash(i * 7 + 3, j * 11) - 0.5) * 40;
        const pk = pick(clamp(sd[k] + dj, 0, 255) | 0, clamp(sd[k + 1] + dj * 0.8, 0, 255) | 0, clamp(sd[k + 2] - dj * 0.6, 0, 255) | 0);
        const w = pk[2], ci = pk[0], cj = pk[1];
        // 湖面点 4fps 掷光（波光）；每点错相 → 全场不齐步闪（修拉偏静，掷光放慢）
        const inLake = py > 622 && py < 778;
        const stp = t * 4 + U.hash(i, j * 13 + 5);
        const st = stp | 0;
        const hseed = inLake ? U.hash(i + st * 977, j) : U.hash(i, j);
        let idx = hseed < w ? ci : cj;
        const h2 = U.hash(i * 5 + 2, j * 3 + 9);
        if (h2 < 0.08 && COMP[idx] != null) idx = COMP[idx];                    // 补色点
        else if (U.hash(i * 13 + st * 31, j * 17) < flick) idx = (U.hash(i, j + st) < w) ? cj : ci;   // 光在点间颤
        else { const dl = lum(px, py) - lum(px + 14, py + 6); if (Math.abs(dl) > 45 && h2 < 0.45) idx = dl > 0 ? 12 : 0; }   // 光渗
        const pth = paths[idx];
        pth.moveTo(px + rsz, py); pth.arc(px, py, rsz, 0, TAU);
        if (ripPath && dF >= 0 && Math.abs(dF - rr) < 38) { ripPath.moveTo(px + rsz * 0.9, py); ripPath.arc(px, py, rsz * 0.9, 0, TAU); }
        if (gildPath) {                                                        // 变亮变精：上光小点自三物向外漾开
          let dg = 1500;
          for (let q = 0; q < 3; q++) { const dx = px - GILD_AT[q][0], dy = py - GILD_AT[q][1], dd = Math.sqrt(dx * dx + dy * dy); if (dd < dg) dg = dd; }
          if (gildQ > (dg / 1500) * 0.8 + U.hash(i * 11, j * 5) * 0.18) { gildPath.moveTo(px + rsz * 0.42, py); gildPath.arc(px, py, rsz * 0.42, 0, TAU); }
        }
      }
    }
    for (let k = 0; k < 21; k++) { c.fillStyle = P.rgb(PALRGB[k]); c.fill(paths[k]); }
    if (ripPath) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = ripA; c.fillStyle = '#f8f4e8'; c.fill(ripPath); c.restore(); }
    if (gildPath) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.42; c.fillStyle = '#f8f4e8'; c.fill(gildPath); c.restore(); }
  }

  // ---------- 计数器（真实序列：1.5B→175B→540B→1T+） ----------
  const CK = [[3.3, 0], [3.62, 1.5], [3.98, 1.5], [4.5, 175], [4.86, 175], [5.4, 540], [5.75, 540], [6.3, 1000], [1e9, 1000]];
  function countVal(lt) {
    for (let i = 0; i < CK.length - 1; i++) if (lt >= CK[i][0] && lt <= CK[i + 1][0])
      return lerp(CK[i][1], CK[i + 1][1], ease.inOut(clamp((lt - CK[i][0]) / (CK[i + 1][0] - CK[i][0]), 0, 1)));
    return lt < 3.3 ? 0 : 1000;
  }

  // ---------- 屏幕层 ----------
  const CAPS = [
    { txt: '参数', size: 132, x: 96, y: 64, t0: 0.35, t1: 3.05 },
    { txt: '疯狂卷参数', size: 104, x: 96, y: 76, t0: 3.2, t1: 6.95 },
    { txt: '参数之外', size: 116, x: 96, y: 72, t0: 7.1, t1: 99 },
  ];
  const OBJ = [
    { x: 470, ly: 788, txt: '数据', rise: RISE[0] },
    { x: 960, ly: 736, txt: '方法', rise: RISE[1] },
    { x: 1450, ly: 706, txt: '算力', rise: RISE[2] },
  ];
  function card(c, x, y, w, h, lw) {
    c.fillStyle = '#f8f4e8'; c.fillRect(x, y, w, h);
    c.strokeStyle = '#1a2058'; c.lineWidth = lw; c.strokeRect(x + lw / 2, y + lw / 2, w - lw, h - lw);
    c.lineWidth = 1.3; c.strokeRect(x + 8, y + 8, w - 16, h - 16);
  }
  function ui(c, lt, t, cam) {
    // 展签式屏上字
    for (let q = 0; q < CAPS.length; q++) {
      const cp = CAPS[q];
      const aIn = ss(cp.t0, cp.t0 + 0.5, lt), aOut = 1 - ss(cp.t1 - 0.3, cp.t1, lt);
      const a = Math.min(aIn, aOut); if (a <= 0.01) continue;
      c.save(); c.globalAlpha = a;
      c.font = cp.size + 'px "LXGWWenKai-500"';
      const w = c.measureText(cp.txt).width + 84, h = cp.size * 1.74;
      c.translate(cp.x, cp.y + (1 - ease.out(aIn)) * 16);
      card(c, 0, 0, w, h, 3);
      c.fillStyle = '#1a2058'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(cp.txt, w / 2, h / 2 + 10);
      c.restore();
    }
    // 拍一：三颗主点的数字小牌（随点轻晃＋连线）
    const tagA = ss(0.55, 1.1, lt) * (1 - ss(3.35, 3.8, lt));
    if (tagA > 0.01) for (let q = 0; q < 3; q++) {
      const s = SEEDS[q];
      const sx = (s.x - cam.cx) * cam.z + W / 2, sy = (s.y - cam.cy) * cam.z + H / 2;
      const bob = 3.5 * Math.sin(t * 1.15 + s.ph * 3);
      const tx = sx + s.off[0], ty = sy + s.off[1] + bob;
      c.save(); c.globalAlpha = tagA;
      c.strokeStyle = 'rgba(26,32,88,.55)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(sx + s.off[0] * 0.18, sy + s.off[1] * 0.18); c.lineTo(tx - Math.sign(s.off[0]) * 66, ty); c.stroke();
      c.translate(tx, ty);
      card(c, -66, -34, 132, 68, 2.5);
      c.fillStyle = '#1a2058'; c.font = '44px "Marcellus-400"'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(s.num, 0, 3);
      c.restore();
    }
    // 拍二：画框角落的展览标签计数器（逐级点亮）
    const cA = ss(3.2, 3.65, lt) * (1 - ss(7.05, 7.5, lt));
    if (cA > 0.01) {
      const pop = 1 + 0.07 * Math.exp(-Math.pow((lt - 6.32) * 3.2, 2));       // 1T+ 揭示的一次轻 pop
      const slide = (1 - ease.out(ss(3.2, 3.65, lt))) * 22;
      c.save(); c.globalAlpha = cA;
      c.translate(1680, 170 + slide); c.scale(pop, pop);
      card(c, -168, -88, 336, 176, 3);
      c.fillStyle = '#1a2058'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = '34px "LXGWWenKai-500"'; c.fillText('参数量', 0, -58);
      const v = countVal(lt);
      c.font = '78px "Marcellus-400"';
      c.fillText(v >= 999.5 ? '1T+' : (v < 10 ? v.toFixed(1) : String(Math.round(v))) + 'B', 0, 6);
      for (let k = 0; k < 4; k++) {                                          // 四枚色点指示灯逐级点亮
        const lit = ss(STG[k], STG[k] + 0.3, lt), dx = -96 + k * 64;
        c.globalAlpha = cA * (0.15 + 0.85 * lit);
        c.fillStyle = ['#6aaee6', '#2f9a5a', '#f2cf3a', '#e0432a'][k];
        c.beginPath(); c.arc(dx, 60, 10, 0, TAU); c.fill();
        if (lit < 0.99) { c.globalAlpha = cA * 0.4; c.strokeStyle = '#1a2058'; c.lineWidth = 2; c.beginPath(); c.arc(dx, 60, 10, 0, TAU); c.stroke(); }
      }
      c.restore();
    }
    // 拍三：三物铭文标签
    for (let q = 0; q < 3; q++) {
      const o = OBJ[q];
      const k = clamp((lt - o.rise - 0.45) / 0.4, 0, 1); if (k <= 0) continue;
      const e = ease.outBack(k);
      c.save(); c.globalAlpha = Math.min(1, k * 1.5);
      const sc = 0.7 + 0.3 * Math.min(1, e);
      c.translate(o.x, o.ly + (1 - Math.min(1.15, e)) * 26); c.scale(sc, sc);
      card(c, -70, -34, 140, 68, 2.5);
      c.fillStyle = '#1a2058'; c.font = '40px "LXGWWenKai-500"'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(o.txt, 0, 4);
      c.restore();
    }
  }

  return {
    init() {
      U.assertGlyphs('132px "LXGWWenKai-500"', '参数疯狂卷之外数据方法算力量', 's29_seurat 屏上字/铭文');
      U.assertGlyphs('78px "Marcellus-400"', '0123456789.-BT+', 's29_seurat 数字');
    },
    draw(c, lt, t) {
      const cam = camOf(lt), R = frontR(lt);
      const rSeed = SEEDS.map(s => clusR(s, t));
      // ① 底稿
      bctx.reset(); basePaint(bctx, lt, t);
      // ①b 半分辨率取色版（点彩 pick / 光渗判读用，读回 2MB 而不是 8.3MB）
      pkc.reset(); pkc.drawImage(BASE, 0, 0, 960, 540);
      const sd = pkc.getImageData(0, 0, 960, 540).data;
      // ② 打底色（半分辨率、两级降采样近似模糊、提亮，只露在已结晶区内——点缝里的 ébauche）
      const ug = UNDER.getContext('2d');
      ug.reset();
      ug.fillStyle = '#f8f4e8'; ug.fillRect(0, 0, 960, 540);                  // 还没上点的素色画布
      // 淡色起稿线（修拉的 croquis：点彩没长到的地方看得见铅笔底稿，长到即被覆盖；半分辨率＝世界÷2）
      ug.strokeStyle = 'rgba(42,58,154,.22)'; ug.lineWidth = 1.2; ug.lineCap = 'round';
      ug.strokeRect(8, 8, 944, 524);                                          // 内框
      ug.beginPath(); ug.ellipse(165, 196, 122, 94, 0, 0, TAU); ug.stroke();  // 大树树冠
      ug.beginPath(); ug.moveTo(157, 240); ug.lineTo(154, 392); ug.moveTo(175, 240); ug.lineTo(173, 392); ug.stroke();   // 树干
      ug.beginPath(); ug.ellipse(165, 196, 84, 58, 0, 0.3, 2.2); ug.stroke(); // 树冠素描调子
      ug.beginPath(); ug.ellipse(216, 152, 56, 34, 0, 0, Math.PI); ug.stroke();
      ug.beginPath(); ug.moveTo(0, 312); ug.lineTo(960, 312); ug.moveTo(0, 389); ug.lineTo(960, 389); ug.stroke();      // 湖平线/草坡线
      [[853, 31], [910, 23], [808, 20], [195, 17], [260, 14]].forEach(q => { ug.beginPath(); ug.ellipse(q[0], 281, q[1], 23, 0, Math.PI, TAU); ug.stroke(); });   // 对岸树影
      ug.beginPath(); ug.arc(815, 84, 22, 0, TAU); ug.stroke();                 // 太阳
      ug.globalAlpha = 0.5; ug.beginPath(); ug.arc(815, 84, 80, 0, TAU); ug.stroke(); ug.globalAlpha = 1;                // 日晕
      CLOUDS.forEach(cl => { ug.beginPath(); ug.ellipse(cl.x / 2, cl.y / 2, 46 * cl.s, 15 * cl.s, 0, 0, TAU); ug.stroke(); });   // 点云
      ug.beginPath(); ug.moveTo(735, 353); ug.lineTo(735, 321); ug.lineTo(756, 353); ug.moveTo(720, 353); ug.lineTo(780, 353); ug.stroke();   // 帆船一
      ug.beginPath(); ug.moveTo(108, 324); ug.lineTo(108, 308); ug.lineTo(119, 324); ug.moveTo(100, 324); ug.lineTo(130, 324); ug.stroke();     // 帆船二
      FIGS.forEach(f => { ug.beginPath(); ug.ellipse(f.x / 2, f.y / 2 - f.h * 0.34 / 2, f.h * 0.13 / 2, f.h * 0.36 / 2, 0, 0, TAU); ug.stroke(); ug.beginPath(); ug.arc(f.x / 2, f.y / 2 - f.h * 0.86 / 2, f.h * 0.11 / 2, 0, TAU); ug.stroke(); });   // 人影
      ug.setLineDash([7, 6]);                                                  // 拍三三物的预埋虚线框
      ug.strokeRect(235, 441, 125, 62);                                        // 书摞
      ug.beginPath(); ug.arc(480, 446, 57, 0, TAU); ug.stroke();               // 齿轮
      ug.strokeRect(711, 383, 78, 117);                                        // 油灯
      ug.setLineDash([]);
      const cl = new Path2D();
      if (R > 6) cl.arc(FC.x / 2, FC.y / 2, Math.min(1400, R + 40) / 2, 0, TAU);
      for (let q = 0; q < 3; q++) cl.arc(SEEDS[q].x / 2, SEEDS[q].y / 2, (rSeed[q] + 16) / 2, 0, TAU);
      ug.save(); ug.clip(cl);
      // 两级降采样＝便宜的高斯感（原 filter blur 逐帧 4–6px 在 960×540 上是大头），再垫一层淡白提亮
      const tg = TMP.getContext('2d');
      tg.reset(); tg.drawImage(BASE, 0, 0, W, H, 0, 0, 480, 270);
      ug.drawImage(TMP, 0, 0, 480, 270, 0, 0, 960, 540);
      ug.globalAlpha = 0.06; ug.fillStyle = '#f8f4e8'; ug.fillRect(0, 0, 960, 540); ug.globalAlpha = 1;
      ug.restore();
      // ③ 点彩（世界坐标，随相机缩放＝点锚在画上）
      c.save();
      c.translate(W / 2, H / 2); c.scale(cam.z, cam.z); c.translate(-cam.cx, -cam.cy);
      c.drawImage(UNDER, 0, 0, 960, 540, 0, 0, W, H);
      dotPass(c, lt, t, cam, rSeed, R, sd);
      c.restore();
      // ④ 屏幕层
      ui(c, lt, t, cam);
    },
  };
})();
