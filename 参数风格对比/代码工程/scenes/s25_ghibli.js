// 「大模型参数」吉卜力水彩样片（s25_ghibli）——纯代码，1988 吉卜力式手绘水彩背景美术（男鹿和雄式的山坡天空）。
// 笔法照 25 号卡：P.watercolor（中点位移多边形 × 多层低 α multiply ＋ 每层 1.6px 淡描边＝水痕边）；白云＝不透明 source-over α.9 ＋ source-atop 底部蓝灰；
//   色晕 layers 3 α .045 amp 40；木板 layers 3 α .5 amp 3 edge .14；整幅 multiply 纸纹颗粒。构图按「参数」题材重新设计：
//   无人物的户外山坡天空（草坡＋积云＋大树＋山坡木牌），不搬速通片的房间构图。
// 拍一 0–3s「参数」（缓推）：草坡近景，三颗发光种子停在草叶上（旁缀 Kalam 手写数字 0.73 / -1.2 / 2.4），
//   种子呼吸涨缩、伞缨随风格摆，草叶成片随风浪起伏（风沿横向推进），山坡木牌刻着「参数」，缓推端详带数字的种子。
// 拍二 3–7s「疯狂卷参数」（缓拉远＋升镜头）：种子乘风升空增殖成 190 颗、光点连缀成天穹光网，积云加密、天色加深；
//   木牌计数翻动 1.5B→175B→540B→1T+（滚动时数字微抖），1T+ 揭示时天穹光网一次脉冲发亮（全片唯一重音）。
// 拍三 7–10s「参数之外」（停住微收）：增殖停住；草坡上三件物依次升起——一摞木书（数据）、风向标齿轮（方法）、提灯（算力），
//   书页轻翻、齿轮缓转、灯火摇曳；种子从变多转为变亮变精（光芯收拢、叠描金光晕），纱状光雾飘过，湿纸晕开收尾。
SCENES['s25_ghibli'] = (() => {
  const W = 1920, H = 1080, TAU = Math.PI * 2;
  const { clamp, lerp, ease, rng, ss, seg } = U, P = PAINT;
  const wash = P.watercolor, rect = P.rectPts, ellipsePts = P.ellipsePts;
  const LINE = '#6a4a38';

  // ---------- 缓存底版：纸 → 天空渐变洗染 → 卷云淡痕 → 远山两层 → 草坡渐变洗染 ＋ 透明色晕 → 土径 → 远树丛 → 野花 → 纸纹 ----------
  const bg = () => P.cached('g25_bg', W, H, (g) => {
    g.drawImage(P.texture('g25_paper', '#fbf6ea', { scale: 0.02, amt: 6, grain: 10, seed: 3 }), 0, 0);
    const sky = g.createLinearGradient(0, 0, 0, 620);
    sky.addColorStop(0, '#3a86d4'); sky.addColorStop(0.55, '#7db3e0'); sky.addColorStop(1, '#cfeaf6');
    wash(g, rect(-20, -20, W + 40, 660), '#5a9ad8', { layers: 5, alpha: 0.5, amp: 6, seed: 7, edge: 0, blend: 'source-over', fill: sky });
    { const r = rng(51); for (let i = 0; i < 7; i++) { const y = 60 + r() * 260, x = r() * (W - 300), w2 = 160 + r() * 300;      // 高层卷云淡痕（透明白）
      wash(g, [[x, y], [x + w2, y - 10 - r() * 22], [x + w2 + 60, y + 26], [x + 40, y + 30]], '#ffffff', { layers: 3, alpha: 0.12, amp: 14, seed: 60 + i, edge: 0.03, blend: 'source-over' }); } }
    wash(g, [[-20, 560], [180, 470], [420, 520], [700, 450], [1000, 515], [1300, 465], [1600, 520], [1940, 470], [1940, 640], [-20, 640]],   // 远山后层（蓝绿）
      '#7aa6a0', { layers: 5, alpha: 0.35, amp: 6, seed: 8, edge: 0.1 });
    wash(g, [[-20, 604], [260, 552], [560, 590], [900, 548], [1240, 596], [1560, 560], [1940, 588], [1940, 660], [-20, 660]],                   // 远山前层（浅一层）
      '#8fb8a8', { layers: 4, alpha: 0.3, amp: 6, seed: 18, edge: 0.08 });
    { const r = rng(57); for (let i = 0; i < 3; i++) { const x = 120 + i * 620 + r() * 160, y = 560 + r() * 14;                                    // 山脊上的远树丛（深绿团）
      wash(g, ellipsePts(x, y, 60 + r() * 50, 22 + r() * 12, 8), '#4c7a3c', { layers: 3, alpha: 0.4, amp: 8, seed: 70 + i, edge: 0.12 }); } }
    const gr = g.createLinearGradient(0, 600, 0, 1080); gr.addColorStop(0, '#9ccc5a'); gr.addColorStop(0.45, '#6aa848'); gr.addColorStop(1, '#3f7a32');
    wash(g, [[-20, 588], [500, 566], [1000, 594], [1500, 562], [1940, 584], [1940, 1100], [-20, 1100]], '#6aa848',
      { layers: 6, alpha: 0.5, amp: 8, seed: 9, edge: 0.1, blend: 'source-over', fill: gr });
    { const r = rng(52), tints = ['#f3dca0', '#c8d4b0', '#e9d28a', '#a8c05a', '#d8e08a'];                                                           // 草坡透明色晕
      for (let i = 0; i < 18; i++) { const x = r() * W, y = 640 + r() * 380, rx = 80 + r() * 200, ry = 40 + r() * 90;
        wash(g, ellipsePts(x, y, rx, ry, 10), tints[i % tints.length], { layers: 3, alpha: 0.045, amp: 40, seed: 200 + i, edge: 0.04 }); } }
    wash(g, [[60, 1080], [300, 930], [430, 800], [520, 690], [610, 610], [650, 585], [700, 640], [600, 700], [480, 830], [330, 980], [180, 1080]],  // 上坡的土径（暖沙）
      '#c9a464', { layers: 4, alpha: 0.4, amp: 8, seed: 12, edge: 0.1, blend: 'source-over' });
    { const r = rng(53); for (let i = 0; i < 46; i++) { const x = r() * W, y = 660 + r() * 320;                                                     // 远处野花小点
      g.fillStyle = ['#fffdf4', '#f2b830', '#f0d060'][i % 3]; g.beginPath(); g.arc(x, y, 2.4 + r() * 2.4, 0, TAU); g.fill(); } }
    g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.3; g.drawImage(P.texture('g25_gran', '#f4efe2', { scale: 0.06, amt: 18, grain: 26, seed: 9 }), 0, 0); g.restore();
  });
  // 拍二天色加深层（只乘天空区）：更饱和的蓝洗
  const skyDeep = () => P.cached('g25_deep', W, 640, (g) => {
    const gd = g.createLinearGradient(0, 0, 0, 620); gd.addColorStop(0, '#6fa8dc'); gd.addColorStop(1, '#d8ecf4');
    wash(g, rect(-20, -20, W + 40, 670), '#6fa8dc', { layers: 3, alpha: 0.5, amp: 6, seed: 17, edge: 0, blend: 'source-over', fill: gd });
  });
  // 积云精灵（白色不透明团 + 底部蓝灰 source-atop）——照卡笔法
  const cloud = (key, w, h, seed) => P.cached('g25_cl_' + key, w, h, (g) => {
    const r = rng(seed), puffs = [];
    for (let i = 0; i < 16; i++) { const x = w * (0.15 + r() * 0.7), base = h * 0.78, yy = base - Math.sin((x / w) * Math.PI) * h * (0.35 + r() * 0.3); puffs.push([x, yy, 30 + r() * 46]); }
    puffs.push([w * 0.5, h * 0.72, w * 0.36]);
    puffs.forEach(([x, y, rr], i) => wash(g, ellipsePts(x, y, rr, rr * 0.82, 14), '#ffffff', { layers: 3, alpha: 0.9, amp: 6, seed: seed + i, edge: 0, blend: 'source-over' }));
    g.save(); g.globalCompositeOperation = 'source-atop';
    const sh = g.createLinearGradient(0, h * 0.35, 0, h); sh.addColorStop(0, 'rgba(150,175,205,0)'); sh.addColorStop(1, 'rgba(120,145,190,.75)'); g.fillStyle = sh; g.fillRect(0, 0, w, h);
    g.restore();
  });
  // 右侧大树（精灵，绕树根轻摇）
  const tree = () => P.cached('g25_tree', 320, 420, (g) => {
    g.fillStyle = '#4a3a2a'; g.fillRect(150, 240, 26, 175);
    const r = rng(177);
    for (let i = 0; i < 26; i++) { const x = 160 + (r() - .5) * 240, y = 170 + (r() - .5) * 190, rr = 36 + r() * 44;
      wash(g, ellipsePts(x, y, rr, rr * 0.8, 12), i % 3 ? '#3f7a3a' : '#2a5a32', { layers: 3, alpha: 0.6, amp: 10, seed: i + 5, edge: 0.15, blend: 'source-over' }); }
    for (let i = 0; i < 16; i++) { const x = 130 + (r() - .5) * 200, y = 130 + (r() - .5) * 130, rr = 18 + r() * 24;
      wash(g, ellipsePts(x, y, rr, rr * 0.7, 10), '#8cc65a', { layers: 2, alpha: 0.45, amp: 6, seed: i + 50, edge: 0, blend: 'source-over' }); }
  });
  // 种子光晕精灵（小种子批量画用）＋ 描金光晕
  const glow = () => P.cached('g25_glow', 64, 64, (g) => {
    const r0 = g.createRadialGradient(32, 32, 0, 32, 32, 30);
    r0.addColorStop(0, 'rgba(255,252,232,.95)'); r0.addColorStop(0.28, 'rgba(255,244,196,.5)'); r0.addColorStop(1, 'rgba(255,240,180,0)');
    g.fillStyle = r0; g.fillRect(0, 0, 64, 64);
    g.fillStyle = 'rgba(255,255,248,.95)'; g.beginPath(); g.arc(32, 32, 4.5, 0, TAU); g.fill();
  });
  const goldGlow = () => P.cached('g25_gold', 64, 64, (g) => {
    const r0 = g.createRadialGradient(32, 32, 0, 32, 32, 30);
    r0.addColorStop(0, 'rgba(255,220,140,.55)'); r0.addColorStop(0.4, 'rgba(255,208,120,.28)'); r0.addColorStop(1, 'rgba(255,200,110,0)');
    g.fillStyle = r0; g.fillRect(0, 0, 64, 64);
  });

  // ---------- 天穹种子群（预生成，种子固定；出生时刻铺在 3.1–6.0s） ----------
  const SWARM = (() => {
    const r = rng(2525), pts = [];
    for (let i = 0; i < 190; i++) {
      let bx = r() * 1940 - 10, by = 60 + r() * 530;
      if (bx > 290 && bx < 690 && by > 350 && by < 575) bx = 700 + r() * 1210;      // 让开木牌天区
      pts.push({ bx, by, ph: r() * TAU, ph2: r() * TAU, s: 0.6 + r() * 0.7, tb: 3.1 + r() * 2.9 });
    }
    const links = [];
    for (let i = 0; i < pts.length; i++) {
      const near = [];
      for (let j = 0; j < pts.length; j++) { if (i === j) continue;
        const d = Math.hypot(pts[i].bx - pts[j].bx, pts[i].by - pts[j].by);
        if (d < 178) near.push([d, j]); }
      near.sort((a, b) => a[0] - b[0]);
      for (let k = 0; k < Math.min(3, near.length); k++) { const j = near[k][1]; if (i < j) links.push([i, j]); }
    }
    return { pts, links };
  })();
  const seedPos = (s, t, b3) => {
    const wob = 1 - 0.55 * b3;                                                     // 拍三网络收稳：漂移减半
    return [s.bx + Math.sin(t * 0.31 + s.ph) * 26 * wob,
            s.by + Math.sin(t * 0.47 + s.ph2) * 20 * wob - 7 * Math.sin(t * 0.21 + s.ph)];
  };

  // 拍一的三颗主种子（带数字）＋ 数字标签
  const HERO = [
    { x: 590, y: 800, num: '0.73', ph: 0.0, nx: 108, ny: -36 },
    { x: 880, y: 838, num: '-1.2', ph: 2.1, nx: -10, ny: -92 },
    { x: 1165, y: 782, num: '2.4', ph: 4.2, nx: -104, ny: -36 },
  ];
  function drawHeroSeed(c, x, y, sc, a, t, ph) {
    c.save(); c.globalAlpha = a; c.globalCompositeOperation = 'lighter';
    c.drawImage(glow(), x - 47 * sc, y - 47 * sc, 94 * sc, 94 * sc);
    c.restore();
    c.save(); c.globalAlpha = a; c.lineCap = 'round';
    for (let k = 0; k < 6; k++) {                                                  // 伞缨：几根白丝向上散开、随风格摆
      const aa = -Math.PI / 2 + (k - 2.5) * 0.34 + Math.sin(t * 5 + ph + k * 1.3) * 0.15;
      c.strokeStyle = 'rgba(255,252,238,.8)'; c.lineWidth = 1.8;
      c.beginPath(); c.moveTo(x, y - 4);
      c.quadraticCurveTo(x + Math.cos(aa) * 16 * sc, y - 4 + Math.sin(aa) * 16 * sc, x + Math.cos(aa) * 31 * sc, y - 4 + Math.sin(aa) * 31 * sc);
      c.stroke();
    }
    c.fillStyle = LINE; c.beginPath(); c.arc(x, y, 3.6 * sc, 0, TAU); c.fill();      // 种子壳
    c.restore();
  }
  function heroes(c, lt, t) {
    const lift = clamp(seg(lt, 2.95, 4.35), 0, 1), q = ease.inOut(lift);
    const numA = 1 - ss(2.95, 3.3, lt);
    const tremble = Math.sin(t * 30) * 2 * ss(2.62, 2.95, lt) * (1 - lift);          // 起风前轻颤
    HERO.forEach((h) => {
      const tx = h.x + 92 * q + Math.sin(t * 1.6 + h.ph) * 9 * (1 - q) + tremble;
      const ty = h.y - 430 * q + Math.sin(t * 1.7 + h.ph) * 7 * (1 - q) - 26 * Math.sin(Math.PI * q);
      const sc = (1 + 0.1 * Math.sin(t * 2.3 + h.ph)) * (1 - 0.45 * q);
      const a = 1 - ss(0.82, 1, lift);
      if (a > 0.01) drawHeroSeed(c, tx, ty, sc, a, t, h.ph);
      if (numA > 0.01) {                                                             // 手写数字＋柔光底（字避开 y>880）
        const nx = h.x + h.nx, ny = h.y + h.ny;
        c.save(); c.globalAlpha = numA * (0.4 + 0.1 * Math.sin(t * 2.2 + h.ph));
        const hg = c.createRadialGradient(nx, ny, 6, nx, ny, 72);
        hg.addColorStop(0, 'rgba(255,250,232,.85)'); hg.addColorStop(1, 'rgba(255,250,232,0)');
        c.fillStyle = hg; c.beginPath(); c.ellipse(nx, ny, 74, 46, 0, 0, TAU); c.fill();
        c.restore();
        c.save(); c.globalAlpha = numA;
        c.font = '46px "Kalam-700"'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillStyle = '#5a3a28'; c.fillText(h.num, nx, ny + tremble * 0.5);
        c.restore();
      }
    });
  }
  // 天穹光网：连线（screen 暖白）＋ 光点（lighter 精灵）；拍三光芯收拢＋描金
  function web(c, lt, t, b3, pulse) {
    const pos = SWARM.pts.map(s => seedPos(s, t, b3));
    const born = SWARM.pts.map(s => ss(s.tb, s.tb + 0.35, lt));
    const la = (0.32 * ss(3.75, 5.5, lt) + 0.12 * pulse) * (1 - 0.4 * b3);
    if (la > 0.012) {
      c.save(); c.globalCompositeOperation = 'screen'; c.strokeStyle = `rgba(255,246,206,${clamp(la, 0, 0.5)})`; c.lineWidth = 1.3; c.beginPath();
      SWARM.links.forEach(([i, j]) => { if (born[i] > 0.5 && born[j] > 0.5) { c.moveTo(pos[i][0], pos[i][1]); c.lineTo(pos[j][0], pos[j][1]); } });
      c.stroke(); c.restore();
    }
    c.save(); c.globalCompositeOperation = 'lighter';
    SWARM.pts.forEach((s, i) => {
      const bn = born[i]; if (bn <= 0.01) return;
      const pop = ease.outBack(bn);
      const breathe = 1 + 0.15 * Math.sin(t * 2.6 + s.ph) * (1 - 0.5 * b3);
      const sz = 30 * s.s * pop * breathe * (1 - 0.24 * b3);                         // 拍三：光芯收拢
      const al = clamp((0.42 + 0.2 * Math.sin(t * 3.1 + s.ph2)) * (0.55 + 0.45 * bn) * (1 + 0.5 * b3 + 0.9 * pulse), 0, 1);
      c.globalAlpha = al;
      c.drawImage(glow(), pos[i][0] - sz, pos[i][1] - sz, sz * 2, sz * 2);
      if (b3 > 0.03) { c.globalAlpha = clamp(0.5 * b3 * bn, 0, 1); c.drawImage(goldGlow(), pos[i][0] - sz * 1.8, pos[i][1] - sz * 1.8, sz * 3.6, sz * 3.6); }
    });
    c.restore(); c.globalAlpha = 1;
  }
  // 云（飘 18–27px/s）；拍二积云加密（两朵随密度淡入）
  function clouds(c, lt, t) {
    c.save(); c.beginPath(); c.rect(-420, -60, W + 840, 640); c.clip();
    c.drawImage(cloud('a', 430, 250, 31), 130 + t * 20, 70);
    c.drawImage(cloud('b', 300, 180, 47), 880 + t * 27, 215);
    c.drawImage(cloud('c', 250, 150, 59), 1420 + t * 24, 58);
    const on = ss(3.6, 5.3, lt);
    if (on > 0.01) { c.save(); c.globalAlpha = on;
      c.drawImage(cloud('d', 500, 270, 71), 470 + t * 18, 108);
      c.drawImage(cloud('e', 330, 200, 83), 1150 + t * 22, 30);
      c.restore(); }
    c.restore();
  }
  // 草叶：成片同向摆，风是一阵一阵的（相位沿 x 推进），起风时阵风加强、拍三收稳
  function grass(c, t, gust, b3) {
    c.save(); c.lineCap = 'round';
    const r = rng(5), cols = ['#5c9a3e', '#7fb84a', '#3f7a32', '#9ccc5a', '#4a8a3a'];
    for (let i = 0; i < 340; i++) {
      const x = -20 + r() * (W + 40), y = 622 + Math.pow(r(), 1.6) * 438;
      const h = 14 + r() * 30 + (y - 622) * 0.16, ph = r() * TAU;
      const wind = Math.sin(t * 3.1 - x * 0.018) * 0.5 + 0.5;
      const sway = (0.22 + wind * 0.78) * h * 0.6 * gust * (1 - 0.3 * b3) + Math.sin(t * 8 + ph) * 2 * (1 - 0.5 * b3);
      c.strokeStyle = cols[i % 5]; c.lineWidth = 2 + r() * 2.4;
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + sway * 0.35, y - h * 0.62, x + sway, y - h); c.stroke();
    }
    c.restore();
  }
  // 草坡上的暖黄光斑（komorebi）：位置随噪声慢漂、亮度闪
  function dapples(c, t, b3) {
    c.save(); c.globalCompositeOperation = 'screen';
    const r = rng(33);
    for (let i = 0; i < 16; i++) {
      const bx = r() * W, by = 650 + r() * 360, rr = 14 + r() * 30;
      const x = bx + P.noise(i * 1.3, t * 0.8) * 30, y = by + P.noise(i * 2.1 + 5, t * 0.8) * 22;
      const a = (0.10 + 0.10 * (0.5 + 0.5 * Math.sin(t * 4 + i * 1.7))) * (1 - 0.35 * b3);
      const gg = c.createRadialGradient(x, y, 0, x, y, rr); gg.addColorStop(0, `rgba(255,236,170,${a})`); gg.addColorStop(1, 'rgba(255,236,170,0)');
      c.fillStyle = gg; c.beginPath(); c.ellipse(x, y, rr * 1.25, rr, 0.3, 0, TAU); c.fill();
    }
    c.restore();
  }
  // 纱状光雾：两条横向白纱带整幅缓移；拍三 8–9.8s 一阵光雾飘过
  function mist(c, t, lt, b3) {
    const mA = 0.05 + 0.11 * Math.sin(Math.PI * clamp(seg(lt, 8.0, 9.8), 0, 1));
    const band = (y0, amp, ph, alpha) => {
      const up = [], dn = [];
      for (let x = -60; x <= W + 60; x += 130) {
        const y = y0 - t * 5 + Math.sin(x * 0.006 + t * 0.5 + ph) * amp + Math.sin(x * 0.017 - t * 0.35 + ph) * amp * 0.5;
        up.push([x, y - 62]); dn.push([x, y + 62]);
      }
      wash(c, up.concat(dn.reverse()), '#ffffff', { layers: 2, alpha: alpha * 0.5, amp: 22, seed: 41 + Math.round(ph * 57), edge: 0, blend: 'source-over' });
    };
    band(320, 26, 1.2, mA); band(690, 20, 3.9, mA * 0.85);
  }
  // 山坡木牌：柱＋牌面（水洗木板）；屏上字都刻在牌上——「参数」→ 翻动的计数 →「参数之外」
  const countStr = (lt) => {
    if (lt < 3.5) return '1.5B';
    if (lt < 4.95) { const v = 1.5 * Math.pow(175 / 1.5, seg(lt, 3.5, 4.95)); return (v < 10 ? v.toFixed(1) : Math.round(v)) + 'B'; }
    if (lt < 6.32) { const v = 175 * Math.pow(540 / 175, seg(lt, 4.95, 6.32)); return Math.round(v) + 'B'; }
    return '1T+';
  };
  function sign(c, lt, t, pulse) {
    const rock = -0.016 + 0.008 * Math.sin(t * 1.5);
    c.save(); c.translate(470, 642); c.rotate(rock); c.translate(-470, -642);
    c.fillStyle = 'rgba(30,60,26,.28)'; c.beginPath(); c.ellipse(470, 646, 60, 9, 0, 0, TAU); c.fill();      // 立牌影
    wash(c, rect(458, 486, 24, 158), '#7a5030', { layers: 3, alpha: 0.55, amp: 3, seed: 21, edge: 0.16, blend: 'source-over' });
    wash(c, rect(462, 486, 9, 158), '#5a3820', { layers: 2, alpha: 0.22, amp: 2, seed: 22, edge: 0 });
    wash(c, rect(352, 398, 236, 132), '#c89a4a', { layers: 3, alpha: 0.55, amp: 3, seed: 23, edge: 0.16, blend: 'source-over' });
    wash(c, rect(352, 398, 236, 10), '#8a5a34', { layers: 2, alpha: 0.3, amp: 2, seed: 24, edge: 0, blend: 'source-over' });
    wash(c, rect(352, 520, 236, 10), '#8a5a34', { layers: 2, alpha: 0.3, amp: 2, seed: 25, edge: 0, blend: 'source-over' });
    c.strokeStyle = 'rgba(90,56,32,.35)'; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(372, 428); c.quadraticCurveTo(470, 420, 566, 430); c.stroke();
    c.beginPath(); c.moveTo(372, 502); c.quadraticCurveTo(470, 496, 566, 500); c.stroke();
    c.fillStyle = '#5a3820'; c.beginPath(); c.arc(368, 410, 3.5, 0, TAU); c.arc(572, 410, 3.5, 0, TAU); c.fill();
    // —— 屏上字（都长在牌面上）——
    const aT = ss(0.15, 0.55, lt) * (1 - ss(2.95, 3.25, lt));                        // 「参数」
    if (aT > 0.01) { c.save(); c.globalAlpha = aT; c.font = '76px "LXGWWenKai-500"'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = '#4a3020'; c.fillText('参数', 470, 464); c.restore(); }
    const aC = ss(3.45, 3.75, lt) * (1 - ss(6.9, 7.15, lt));                          // 翻动的计数
    if (aC > 0.01) {
      const str = countStr(lt), roll = ss(3.5, 3.7, lt) * (1 - ss(6.32, 6.52, lt));
      c.save(); c.globalAlpha = aC; c.font = '54px "Kalam-700"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#4a3020';
      const chs = [...str], ws = chs.map(ch => c.measureText(ch).width + 5), tot = ws.reduce((s2, w2) => s2 + w2, 0);
      let x = 470 - tot / 2;
      chs.forEach((ch, i) => { c.fillText(ch, x + ws[i] / 2, 464 + Math.sin(lt * 24 + i * 2.1) * 2.6 * roll); x += ws[i]; });
      c.strokeStyle = 'rgba(74,48,32,.5)'; c.lineWidth = 2;                           // 数字下双横线（木牌规矩）
      c.beginPath(); c.moveTo(470 - tot / 2 - 6, 502); c.lineTo(470 + tot / 2 + 6, 502); c.stroke();
      c.restore();
    }
    const aE = ss(7.35, 7.75, lt);                                                    // 「参数之外」
    if (aE > 0.01) { c.save(); c.globalAlpha = aE; c.font = '50px "LXGWWenKai-500"'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = '#4a3020'; c.fillText('参数之外', 470, 464); c.restore(); }
    if (pulse > 0.03) { c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = 0.4 * pulse;   // 1T+ 牌面暖闪
      c.fillStyle = 'rgba(255,236,180,.8)'; c.fillRect(352, 398, 236, 132); c.restore(); }
    c.restore();
  }
  // 拍三三件物：一摞木书（数据）、风向标齿轮（方法）、提灯（算力）——依次从草坡升起
  function objects(c, lt, t, b3) {
    const rise = (t0) => ({ p: ease.out(seg(lt, t0, t0 + 1.05)), a: ss(t0 - 0.05, t0 + 0.4, lt) });
    { const { p, a } = rise(7.15); if (a > 0.01) { c.save(); c.globalAlpha = a; c.translate(0, (1 - p) * 250);   // 一摞木书
      c.fillStyle = `rgba(30,60,26,${0.3 * p})`; c.beginPath(); c.ellipse(250, 648, 95, 12, 0, 0, TAU); c.fill();
      const r = rng(725); let y = 642;
      [[150, 26, '#c86a50'], [138, 24, '#6a9ac0'], [126, 22, '#9ab86a'], [114, 20, '#d8a050']].forEach(([w2, h2, col], k) => {
        const ox = (r() - 0.5) * 12;
        wash(c, rect(250 - w2 / 2 + ox, y - h2, w2, h2), col, { layers: 3, alpha: 0.55, amp: 3, seed: 730 + k, edge: 0.14, blend: 'source-over' });
        c.fillStyle = '#fdf6e4'; c.fillRect(250 + w2 / 2 + ox - 15, y - h2 + 4, 10, h2 - 8);
        c.fillStyle = 'rgba(74,48,32,.4)'; c.fillRect(250 - w2 / 2 + ox, y - h2, w2, 2.4);
        y -= h2; });
      const fq = (t * 0.7) % 1, pg = Math.sin(Math.PI * fq);                            // 顶页轻翻
      c.save(); c.translate(250 - 42, y + 2); c.rotate(-pg * 0.85);
      c.fillStyle = 'rgba(253,246,228,.92)'; c.fillRect(0, -6, 84, 10); c.restore();
      c.restore(); } }
    { const { p, a } = rise(7.65); if (a > 0.01) { c.save(); c.globalAlpha = a; c.translate(0, (1 - p) * 250);   // 风向标齿轮
      c.fillStyle = `rgba(30,60,26,${0.3 * p})`; c.beginPath(); c.ellipse(1480, 648, 30, 8, 0, 0, TAU); c.fill();
      wash(c, rect(1470, 438, 20, 204), '#7a5030', { layers: 3, alpha: 0.55, amp: 3, seed: 741, edge: 0.15, blend: 'source-over' });
      c.save(); c.translate(1480, 560); c.rotate(Math.sin(t * 2.6) * 0.1);              // 风向箭羽随风格摆
      c.strokeStyle = '#8a5a34'; c.lineWidth = 7; c.lineCap = 'round';
      c.beginPath(); c.moveTo(-60, 0); c.lineTo(64, 0); c.stroke();
      c.fillStyle = '#c86a50';
      c.beginPath(); c.moveTo(-58, -15); c.lineTo(-88, 0); c.lineTo(-58, 15); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(-70, -15); c.lineTo(-92, 0); c.lineTo(-70, 15); c.closePath(); c.fill();
      c.fillStyle = '#f3e3b2'; c.beginPath(); c.moveTo(64, 0); c.lineTo(40, -12); c.lineTo(40, 12); c.closePath(); c.fill();
      c.restore();
      c.save(); c.translate(1480, 408); c.rotate(t * 0.5 + 0.3);                         // 齿轮缓转
      c.fillStyle = '#c89a4a';
      for (let k = 0; k < 12; k++) { c.save(); c.rotate(k / 12 * TAU); c.fillRect(-5.5, -60, 11, 16); c.restore(); }
      c.beginPath(); c.arc(0, 0, 48, 0, TAU); c.fill();
      c.strokeStyle = '#8a5a34'; c.lineWidth = 6.5;
      c.beginPath(); c.arc(0, 0, 33, 0, TAU); c.stroke();
      for (let k = 0; k < 4; k++) { const aa = k / 4 * TAU; c.beginPath(); c.moveTo(Math.cos(aa) * 10, Math.sin(aa) * 10); c.lineTo(Math.cos(aa) * 33, Math.sin(aa) * 33); c.stroke(); }
      c.fillStyle = '#8a5a34'; c.beginPath(); c.arc(0, 0, 10, 0, TAU); c.fill();
      c.fillStyle = '#f3e3b2'; c.beginPath(); c.arc(0, 0, 4, 0, TAU); c.fill();
      c.restore(); c.restore(); } }
    { const { p, a } = rise(8.15); if (a > 0.01) { c.save(); c.globalAlpha = a; c.translate(0, (1 - p) * 250);   // 提灯
      c.fillStyle = `rgba(30,60,26,${0.3 * p})`; c.beginPath(); c.ellipse(1160, 648, 62, 10, 0, 0, TAU); c.fill();
      wash(c, rect(1150, 588, 20, 54), '#7a5030', { layers: 3, alpha: 0.55, amp: 3, seed: 751, edge: 0.15, blend: 'source-over' });
      wash(c, rect(1112, 496, 96, 96), '#f8e0a0', { layers: 3, alpha: 0.6, amp: 4, seed: 752, edge: 0.18, blend: 'source-over' });
      wash(c, rect(1104, 486, 112, 16), '#7a5030', { layers: 2, alpha: 0.7, amp: 2, seed: 753, edge: 0.2, blend: 'source-over' });
      wash(c, rect(1104, 578, 112, 14), '#7a5030', { layers: 2, alpha: 0.7, amp: 2, seed: 754, edge: 0.2, blend: 'source-over' });
      c.strokeStyle = '#7a5030'; c.lineWidth = 6; c.lineCap = 'round';
      c.beginPath(); c.moveTo(1112, 486); c.quadraticCurveTo(1160, 458, 1208, 486); c.stroke();
      c.strokeStyle = 'rgba(122,80,48,.55)'; c.lineWidth = 2.5;
      for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(1160 + k * 20, 500); c.lineTo(1160 + k * 20, 580); c.stroke(); }
      const fl = 0.62 + 0.16 * Math.sin(t * 7.3) + 0.08 * Math.sin(t * 13.7) + 0.28 * b3;   // 火苗摇曳（拍三更旺）
      c.save(); c.globalCompositeOperation = 'lighter';
      P.pool(c, 1160, 540, 120, '255,214,120', clamp(0.3 * fl, 0, 0.7));
      P.pool(c, 1160, 540, 46, '255,244,190', clamp(0.5 * fl, 0, 0.9));
      c.restore(); c.restore(); } }
  }
  // 湿纸晕开收尾：一团柔边白晕从提灯处缓缓洇开
  function bloom(c, lt) {
    const q = seg(lt, 9.05, 9.95); if (q <= 0) return;
    const e = ease.inOut(q), r0 = 120 + e * 1450;
    c.save(); c.globalCompositeOperation = 'screen';
    const gg = c.createRadialGradient(1160, 600, r0 * 0.45, 1160, 600, r0);
    gg.addColorStop(0, 'rgba(255,250,238,0)'); gg.addColorStop(0.72, `rgba(255,250,238,${0.14 * e})`); gg.addColorStop(1, 'rgba(255,250,238,0)');
    c.fillStyle = gg; c.fillRect(0, 0, W, H); c.restore();
  }

  return {
    init() {
      U.assertGlyphs('76px "LXGWWenKai-500"', '参数疯狂卷之外', 's25_ghibli 木牌字');
      U.assertGlyphs('46px "Kalam-700"', '0.73-1.2 2.4 1.5B 175B 540B 1T+', 's25_ghibli 种子数字');
    },
    draw(c, lt, t) {
      const dens = ss(3.2, 6.2, lt), b3 = ss(7.0, 8.6, lt);
      const pulse = Math.sin(Math.PI * seg(lt, 6.32, 6.85));                         // 1T+ 揭示：天穹一次脉冲（唯一重音）
      const gust = 1 + 0.5 * Math.sin(Math.PI * clamp(seg(lt, 2.9, 4.15), 0, 1));    // 3s 前后起风：草浪加强
      // 运镜：近景缓推 → 拉远升镜看天穹 → 停住微收全貌（整支一个连续思路）
      let z, cx, cy;
      if (lt < 3) { const q = ease.inOut(lt / 3); z = 1 + 0.16 * q; cx = lerp(960, 760, q); cy = lerp(540, 770, q); }
      else if (lt < 7) { const q = ease.inOut((lt - 3) / 4); z = 1.16 - 0.16 * q; cx = lerp(760, 960, q); cy = lerp(770, 480, q); }
      else { const q = ease.inOut((lt - 7) / 3); z = 1 + 0.035 * q; cx = 960; cy = lerp(480, 530, q); }
      c.save(); c.translate(cx, cy); c.scale(z, z); c.translate(-cx, -cy);
      c.drawImage(bg(), 0, 0);
      if (dens > 0.01) {                                                              // 拍二天色加深（只乘天空区，拍三转回亮）
        c.save(); c.beginPath(); c.rect(-30, -30, W + 60, 640); c.clip();
        c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.55 * dens * (1 - 0.55 * b3);
        c.drawImage(skyDeep(), 0, 0); c.restore();
      }
      clouds(c, lt, t);
      web(c, lt, t, b3, pulse);
      if (pulse > 0.02) {                                                              // 天穹脉冲光
        c.save(); c.globalCompositeOperation = 'screen';
        const pg = c.createRadialGradient(960, 380, 100, 960, 380, 1000);
        pg.addColorStop(0, `rgba(255,246,200,${0.3 * pulse})`); pg.addColorStop(1, 'rgba(255,246,200,0)');
        c.fillStyle = pg; c.fillRect(0, 0, W, H); c.restore();
      }
      mist(c, t, lt, b3);
      c.save(); c.translate(1720, 648); c.rotate(Math.sin(t * 2.2) * 0.02 * (1 - 0.45 * b3)); c.drawImage(tree(), -160, -415); c.restore();
      sign(c, lt, t, pulse);
      objects(c, lt, t, b3);
      grass(c, t, gust, b3);
      dapples(c, t, b3);
      heroes(c, lt, t);
      bloom(c, lt);
      c.restore();
    },
  };
})();
