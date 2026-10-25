// 「大模型参数」蒸汽波样片（s26_vaporwave）——纯代码，2011 蒸汽波/赛博霓虹。
// 管线：整幅先画进离屏 S（包一层贯穿全片的缓变推拉镜），再做 VHS 后期输出到 c：
//        rgbSplit 三通道分离错位（量随 sin 连续变化，不用哈希跳变）＋跟踪噪声带（带内横向撕裂＋噪线）＋扫描线＋OSD＋暗角。
// 拍一 0–3s「参数」：透视网格近端三颗粉/青双色辉光球（参数本体）各自呼吸明灭、微微起伏，
//        灯管数字标签 0.73 / -1.2 / 2.4 贴在球旁被推近端详；天顶落日横条缓缓上移、地平线青色灯带、棕榈剪影轻摇、灯箱霓虹「参数」。
// 拍二 3–7s「疯狂卷参数」：球沿网格节点逐颗点亮增殖、洋红/青连线蔓延成网，网格加速前滚、落日横条上移、天色随密度加浓；
//        霓虹线框芯片分段描线浮现；右上 VHS 面板计数器 1.5B→175B→540B→1T+ 滚动（1T+ 揭示时全网球平滑脉冲发亮一次）。
// 拍三 7–10s「参数之外」：增殖停住；三件罗马柱式物依次升起——大理石柱书堆（数据）、大理石齿轮盘（方法）、复古 CRT 电视（算力）；
//        三颗参数球描金变亮、飘落三物之上（书堆顶/齿轮心/天线间），齿轮缓转、电视屏闪雪花，网格减速、网络辉光收稳变精；
//        一条加强跟踪噪声带自下而上扫过收尾。随机全部 U.rng/U.hash 种子，同一 t 两次渲染逐像素一致。
SCENES['s26_vaporwave'] = (() => {
  const W = 1920, H = 1080, TAU = Math.PI * 2;
  const { clamp, lerp, ease, rng, hash, ss, seg } = U, P = PAINT;
  const C = { pink: '#ff4fd8', hot: '#ff2f8f', cyan: '#3ff6ff', deep: '#12052a', purple: '#2a0b4a', violet: '#7a2ae0', yellow: '#ffd84a', orange: '#ff8a3a', ink: '#08020f' };
  const glowLine = P.glowStroke;
  const FLOOR = 680, VX = 960, VY = 560;   // 地平线 / 网格消失点
  const ssInt = (a, b, x) => {             // ∫ss(a,b,u)du 的闭式（0..x）：变速动画的相位积分，免得换速度时跳相
    if (x <= a) return 0; if (x >= b) return (b - a) / 2;
    const w = (x - a) / (b - a); return (b - a) * (w * w * w - w * w * w * w / 2);
  };

  // ---------- 静态底版：夜空渐变＋星点＋远山剪影＋地平线灯带 ----------
  const bg = () => P.cached('vwp26_bg', W, H, (g) => {
    const sky = g.createLinearGradient(0, 0, 0, FLOOR);
    sky.addColorStop(0, '#0d0322'); sky.addColorStop(0.55, '#2c0b52'); sky.addColorStop(1, C.purple);
    g.fillStyle = sky; g.fillRect(0, 0, W, FLOOR);
    g.fillStyle = C.ink; g.fillRect(0, FLOOR, W, H - FLOOR);
    const r = rng(88);
    for (let k = 0; k < 46; k++) {                             // 远处星点（静态）
      const x = r() * W, y = r() * (FLOOR - 160), s = 0.7 + r() * 1.6;
      g.fillStyle = r() < 0.3 ? 'rgba(63,246,255,.6)' : 'rgba(255,240,252,.55)';
      g.beginPath(); g.arc(x, y, s, 0, TAU); g.fill();
    }
    const hz = g.createRadialGradient(960, FLOOR, 40, 960, FLOOR, 900);   // 地平线洋红霞
    hz.addColorStop(0, 'rgba(255,79,216,.30)'); hz.addColorStop(1, 'rgba(255,79,216,0)');
    g.fillStyle = hz; g.fillRect(0, 0, W, FLOOR);
    // 远山剪影＋地平线青色灯带
    g.beginPath(); g.moveTo(0, FLOOR);
    [[130, 622], [300, 652], [470, 600], [700, 648], [960, 588], [1230, 650], [1500, 602], [1740, 648], [1920, 610]].forEach(p => g.lineTo(p[0], p[1]));
    g.lineTo(W, FLOOR); g.closePath(); g.fillStyle = '#0a0216'; g.fill();
    g.beginPath(); g.moveTo(0, FLOOR); g.lineTo(W, FLOOR); glowLine(g, C.cyan, 3, 14);
  });

  // ---------- 辉光球精灵（缓存）：白芯→主色→透明 ----------
  const spr = (key, rgb) => P.cached('vwp26_s' + key, 128, 128, (g) => {
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.12, `rgba(255,255,255,.85)`);
    gr.addColorStop(0.24, `rgba(${rgb},.92)`); gr.addColorStop(0.55, `rgba(${rgb},.26)`); gr.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  });
  const SPR = [spr('p', '255,79,216'), spr('c', '63,246,255')];

  // ---------- 落日（小离屏：横条切口上移、缝宽向下变大；相位用积分时间，变速不跳相） ----------
  let sunC = null;
  function sun(g, ts, dens, pulse) {
    if (!sunC) { sunC = document.createElement('canvas'); sunC.width = 340; sunC.height = 340; }
    const s = sunC.getContext('2d'); s.reset();
    const sx = 960, sy = 320 - 26 * dens, sr = 128, ox = 340 / 2;
    const gl = g.createRadialGradient(sx, sy, 60, sx, sy, sr * 2.1);   // 落日外晕
    gl.addColorStop(0, `rgba(255,47,143,${0.30 + 0.16 * dens + 0.30 * pulse})`); gl.addColorStop(1, 'rgba(255,47,143,0)');
    g.fillStyle = gl; g.fillRect(sx - sr * 2.2, sy - sr * 2.2, sr * 4.4, sr * 4.4);
    s.save(); s.beginPath(); s.arc(ox, ox, sr, 0, TAU); s.clip();
    const sg = s.createLinearGradient(0, ox - sr, 0, ox + sr);
    sg.addColorStop(0, C.yellow); sg.addColorStop(0.5, C.orange); sg.addColorStop(1, C.hot);
    s.fillStyle = sg; s.fillRect(0, 0, 340, 340);
    s.globalCompositeOperation = 'destination-out';
    const ph = ts % 1;                                           // 横条上移：q 随相位增大而减小
    for (let k = 0; k < 7; k++) {
      const q = (k + 1 - ph) / 7, y = ox + sr * (q * 1.12 - 0.06), hh = 2 + q * q * 15;
      s.fillRect(0, y, 340, hh);
    }
    s.restore();
    g.drawImage(sunC, sx - ox, sy - ox);
  }

  // ---------- 棕榈剪影（地平线左右各一，轻摇） ----------
  function palms(g, t) {
    [[150, FLOOR, 1], [1776, FLOOR, -1]].forEach(([x, y, d], k) => {
      const sw = Math.sin(t * 1.4 + k * 1.7) * 0.05;
      g.save(); g.translate(x, y); g.rotate(sw * d);
      g.strokeStyle = '#0a0216'; g.fillStyle = '#0a0216'; g.lineWidth = 9; g.lineCap = 'round';
      g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(d * 12, -80, d * 4, -158); g.stroke();
      for (let f = 0; f < 6; f++) {
        const a = -Math.PI / 2 + (f - 2.5) * 0.5 + Math.sin(t * 2.1 + f + k) * 0.045, L = 46 + (f % 3) * 13;
        g.save(); g.translate(d * 4, -158); g.rotate(a);
        g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(L * 0.5, -9, L, 8); g.quadraticCurveTo(L * 0.5, 2, 0, 3); g.fill(); g.restore();
      }
      g.restore();
    });
  }

  // ---------- 地面：洋红透视网格（前滚；密度升级时加亮＋青色副线浮现）。相位用积分时间 tg，变速不跳相 ----------
  function floorGrid(g, tg, dens, pulse) {
    g.save(); g.beginPath(); g.rect(0, FLOOR, W, H - FLOOR); g.clip();
    g.strokeStyle = C.pink; g.shadowColor = C.pink; g.shadowBlur = 11 + 5 * dens + 10 * pulse;
    g.lineWidth = 2.1 + 0.7 * dens; g.globalAlpha = 0.9;
    for (let i = -15; i <= 15; i++) {
      g.beginPath(); g.moveTo(VX + i * 150 * (FLOOR - VY) / (H - VY), FLOOR); g.lineTo(VX + i * 150, H + 30); g.stroke();
    }
    if (dens > 0.02) {                                          // 青色副线（半位偏移）随密度浮现
      g.save(); g.strokeStyle = C.cyan; g.shadowColor = C.cyan; g.shadowBlur = 8; g.lineWidth = 1.3; g.globalAlpha = 0.42 * dens;
      for (let i = -15; i <= 15; i++) {
        g.beginPath(); g.moveTo(VX + (i + 0.5) * 150 * (FLOOR - VY) / (H - VY), FLOOR); g.lineTo(VX + (i + 0.5) * 150, H + 30); g.stroke();
      }
      g.restore();
    }
    const ph = tg % 1;
    g.strokeStyle = C.pink; g.shadowColor = C.pink; g.shadowBlur = 12 + 8 * pulse;
    for (let k = 0; k < 14; k++) {
      const d = k + 1 - ph, y = VY + 560 / d;
      if (y < FLOOR || y > H + 4) continue;
      g.lineWidth = 1.1 + 2.6 * (y - FLOOR) / (H - FLOOR); g.globalAlpha = 0.78;
      g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
    }
    g.restore();
  }

  // ---------- 网络节点（拍二增殖）：预生成在透视网格节点上 ----------
  const ROWS = [1.12, 1.38, 1.72, 2.2, 3.0, 4.2];
  const nodes = [], nodeAt = {};
  {
    const r = rng(2601);
    ROWS.forEach((d, j) => {
      const N = Math.min(12, Math.floor(920 * d / 161.5));
      for (let i = -N; i <= N; i++) {
        if (r() < 0.42) continue;
        const u = 560 / d / 520;
        const nd = { i, j, x: VX + i * 150 * u, y: VY + 560 / d, u, ap: 3.15 + 3.0 * r(), col: r() < 0.5 ? 0 : 1, e: 6 + 17 * u };
        nodes.push(nd); nodeAt[j + '_' + i] = nd;
      }
    });
  }
  const edges = [];
  nodes.forEach(a => {
    const b = nodeAt[a.j + '_' + (a.i + 1)]; if (b) edges.push([a, b, 0]);      // 横向连线＝洋红
    const c2 = nodeAt[(a.j + 1) + '_' + a.i]; if (c2) edges.push([a, c2, 1]);   // 纵深连线＝青
  });
  const edgeKind = (a, b) => (a.j === b.j ? 0 : 1);      // 同排＝洋红横线，跨排＝青色纵深线
  function network(g, t, lt, b3, pulse) {
    // 连线：两条批处理路径（洋红横 / 青纵），两端都点亮才画
    const lit = (n) => ss(n.ap, n.ap + 0.26, lt);
    [C.pink, C.cyan].forEach((col, ci) => {
      g.save(); g.beginPath();
      let any = false;
      edges.forEach(([a, b]) => {
        if (ci !== edgeKind(a, b)) return;
        if (lit(a) < 0.25 || lit(b) < 0.25) return;
        g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); any = true;
      });
      if (any) {
        g.strokeStyle = col; g.shadowColor = col; g.shadowBlur = 7;
        g.lineWidth = 1.2 + 0.8 * b3 + 0.8 * pulse; g.globalAlpha = 0.5 + 0.24 * b3 + 0.2 * pulse; g.stroke();
      }
      g.restore();
    });
    // 球：精灵＋白芯（芯批量一笔）
    const cores = new Path2D();
    nodes.forEach(n => {
      const q = lit(n); if (q <= 0.02) return;
      const pop = q < 1 ? ease.out(q) * (1 + 0.30 * Math.sin(q * Math.PI)) : 1;
      const R = n.e * pop;
      const br = 0.62 + 0.16 * Math.sin(t * 2.1 + n.i * 1.3 + n.j)              // 呼吸明灭
        + 0.45 * pulse + 0.30 * b3 - 0.12 * b3;                                  // 拍三：变亮（芯亮）变精（晕收紧）
      const gs = R * (2.5 - 0.4 * b3) * 2;
      g.save(); g.globalAlpha = clamp(br, 0, 1);
      g.drawImage(SPR[n.col], n.x - gs / 2, n.y - gs / 2, gs, gs);
      g.restore();
      cores.moveTo(n.x + R * 0.34 * (1 + 0.3 * b3), n.y);
      cores.arc(n.x, n.y, R * 0.34 * (1 + 0.3 * b3), 0, TAU);
    });
    g.save(); g.fillStyle = 'rgba(255,255,255,.9)'; g.fill(cores); g.restore();
  }

  // ---------- 霓虹线框芯片（拍二分段描线浮现，缓慢悬浮） ----------
  const CHIP = { x: 640, y: 452, w: 300, h: 176 };
  function chip(g, t, lt) {
    const on = ss(4.05, 5.6, lt); if (on <= 0.01) return;
    const bob = Math.sin(t * 1.1) * 4;
    const x0 = CHIP.x - CHIP.w / 2, x1 = CHIP.x + CHIP.w / 2, y0 = CHIP.y - CHIP.h / 2 + bob, y1 = CHIP.y + CHIP.h / 2 + bob;
    g.save(); g.lineCap = 'round';
    const seg = (ap, fn, col, w, bl) => { const q = ss(ap, ap + 0.22, lt); if (q <= 0.02) return; g.globalAlpha = (0.5 + 0.1 * q) * Math.min(1, q * 1.4); g.beginPath(); fn(); glowLine(g, col, w, bl); };
    // 外框四边依次点亮
    seg(4.05, () => { g.moveTo(x0, y0); g.lineTo(x1, y0); }, C.pink, 3, 12);
    seg(4.17, () => { g.moveTo(x1, y0); g.lineTo(x1, y1); }, C.pink, 3, 12);
    seg(4.29, () => { g.moveTo(x1, y1); g.lineTo(x0, y1); }, C.pink, 3, 12);
    seg(4.41, () => { g.moveTo(x0, y1); g.lineTo(x0, y0); }, C.pink, 3, 12);
    // 内框（青）
    seg(4.55, () => { g.rect(x0 + 26, y0 + 26, CHIP.w - 52, CHIP.h - 52); }, C.cyan, 1.8, 8);
    seg(4.68, () => { g.moveTo(x0 + 26, y0 + 62); g.lineTo(x1 - 26, y0 + 62); }, C.cyan, 1.4, 6);
    // 左右引脚
    for (let k = 0; k < 5; k++) {
      const py = y0 + 34 + k * (CHIP.h - 68) / 4;
      seg(4.78 + k * 0.11, () => { g.moveTo(x0, py); g.lineTo(x0 - 20, py); }, C.pink, 2.4, 8);
      seg(4.84 + k * 0.11, () => { g.moveTo(x1, py); g.lineTo(x1 + 20, py); }, C.pink, 2.4, 8);
    }
    // 芯片内一个小方核
    seg(5.05, () => { g.rect(CHIP.x - 26, CHIP.y - 20 + bob, 52, 40); }, C.hot, 2, 9);
    g.restore();
  }

  // ---------- 大理石罗马柱 ----------
  function column(g, x, topY, botY) {
    const mg = g.createLinearGradient(x - 46, 0, x + 46, 0);
    mg.addColorStop(0, '#f2eaf8'); mg.addColorStop(0.55, '#cbb6de'); mg.addColorStop(1, '#8e74ad');
    g.fillStyle = '#5a3a7a'; g.fillRect(x - 66, botY - 22, 132, 22);              // 底座
    g.fillStyle = mg; g.fillRect(x - 46, topY + 20, 92, botY - topY - 40);        // 柱身
    g.save(); g.beginPath(); g.rect(x - 46, topY + 20, 92, botY - topY - 40); g.clip();
    g.strokeStyle = 'rgba(96,64,140,.5)'; g.lineWidth = 2.2;                       // 凹槽
    for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(x + k * 17, topY + 22); g.lineTo(x + k * 17 + 3, botY - 22); g.stroke(); }
    const vg = g.createLinearGradient(x - 46, topY + 40, x + 46, botY - 30);      // 大理石纹理
    g.strokeStyle = 'rgba(140,110,170,.35)'; g.lineWidth = 1.1;
    g.beginPath(); g.moveTo(x - 34, topY + 120); g.quadraticCurveTo(x - 4, topY + 170, x - 16, botY - 60); g.stroke();
    g.beginPath(); g.moveTo(x + 20, topY + 90); g.quadraticCurveTo(x + 44, topY + 200, x + 26, botY - 90); g.stroke();
    g.restore();
    g.fillStyle = mg; g.fillRect(x - 58, topY, 116, 20);                          // 柱头
    g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x - 58, topY, 116, 3);
    g.beginPath(); g.moveTo(x - 66, botY - 22); g.lineTo(x + 66, botY - 22); glowLine(g, C.cyan, 2, 8);  // 柱脚灯带
  }

  // ---------- 拍三三件物：书堆（数据）/ 齿轮盘（方法）/ CRT 电视（算力） ----------
  function riseOf(lt, t0) { return { p: ease.out(seg(lt, t0, t0 + 1.15)), a: ss(t0, t0 + 0.5, lt) }; }
  function books(g, lt, gold) {
    const { p, a } = riseOf(lt, 7.25); if (a <= 0.01) return;
    g.save(); g.globalAlpha = a; g.translate(0, (1 - p) * 300);
    column(g, 372, 688, 892);
    P.pool(g, 372, 898, 150, '63,246,255', 0.16 * a);
    const stack = [   // 自下而上四本书：宽→窄
      [168, 26, '#3a1660'], [150, 24, '#521f82'], [132, 22, '#6a2aa0'], [110, 20, '#8f7cf6'],
    ];
    let y = 688;
    const rr = rng(726);
    stack.forEach(([w2, h2, col], k) => {
      const ox = (rr() - 0.5) * 12;
      g.fillStyle = col; g.fillRect(372 - w2 / 2 + ox, y - h2, w2, h2);
      g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(372 - w2 / 2 + ox, y - h2, w2, 3);
      g.strokeStyle = 'rgba(20,6,40,.6)'; g.lineWidth = 1.6; g.strokeRect(372 - w2 / 2 + ox, y - h2, w2, h2);
      y -= h2;
    });
    g.beginPath(); g.moveTo(372 - 52, y); g.lineTo(372 + 52, y); glowLine(g, C.pink, 2.2, 9);   // 顶书灯线
    if (gold > 0.02) { g.strokeStyle = `rgba(255,216,74,${0.75 * gold})`; g.lineWidth = 2; g.strokeRect(372 - 57, y - 3, 114, 3 + 92); }
    g.restore();
  }
  function gearDisc(g, t, lt, gold) {
    const { p, a } = riseOf(lt, 7.85); if (a <= 0.01) return;
    g.save(); g.globalAlpha = a; g.translate(0, (1 - p) * 300);
    column(g, 960, 688, 892);
    g.fillStyle = '#cbb6de'; g.fillRect(944, 655, 32, 35);                        // 齿轮座销
    P.pool(g, 960, 898, 170, '255,79,216', 0.15 * a);
    const cx = 960, cy = 566, R = 92, ang = t * 0.5;
    g.save(); g.translate(cx, cy); g.rotate(ang);
    const mg = g.createRadialGradient(-30, -40, 10, 0, 0, R);
    mg.addColorStop(0, '#f4eefa'); mg.addColorStop(0.6, '#c9b8d8'); mg.addColorStop(1, '#8a6aa8');
    g.fillStyle = mg; g.beginPath(); g.arc(0, 0, R, 0, TAU); g.fill();            // 盘体
    for (let k = 0; k < 12; k++) {                                                // 齿
      const aa = k / 12 * TAU;
      g.save(); g.rotate(aa); g.fillStyle = mg; g.fillRect(R - 4, -9, 20, 18); g.restore();
    }
    g.strokeStyle = 'rgba(20,6,40,.55)'; g.lineWidth = 2;                          // 暗刻线
    g.beginPath(); g.arc(0, 0, R, 0, TAU); g.stroke();
    g.beginPath(); g.arc(0, 0, 30, 0, TAU); g.stroke();
    for (let k = 0; k < 6; k++) { const aa = k / 6 * TAU; g.beginPath(); g.moveTo(Math.cos(aa) * 30, Math.sin(aa) * 30); g.lineTo(Math.cos(aa) * R, Math.sin(aa) * R); g.stroke(); }
    g.beginPath(); g.arc(0, 0, R - 5, 0, TAU); glowLine(g, C.cyan, 2.4, 10);      // 青霓虹蚀线
    g.beginPath(); g.arc(0, 0, 30, 0, TAU); glowLine(g, C.cyan, 1.6, 7);
    if (gold > 0.02) { g.strokeStyle = `rgba(255,216,74,${0.8 * gold})`; g.lineWidth = 2.2; g.beginPath(); g.arc(0, 0, R + 2, 0, TAU); g.stroke(); }
    g.restore();
    g.restore();
  }
  function tv(g, t, lt, gold) {
    const { p, a } = riseOf(lt, 8.45); if (a <= 0.01) return;
    g.save(); g.globalAlpha = a; g.translate(0, (1 - p) * 300);
    column(g, 1548, 688, 892);
    P.pool(g, 1548, 898, 150, '63,246,255', 0.16 * a);
    // 天线（球落点就在两根天线之间）
    g.strokeStyle = '#241040'; g.lineWidth = 5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(1548 - 26, 560); g.lineTo(1548 - 54, 506); g.moveTo(1548 + 26, 560); g.lineTo(1548 + 54, 506); g.stroke();
    g.beginPath(); g.moveTo(1548 - 26, 560); g.lineTo(1548 - 54, 506); glowLine(g, C.cyan, 1.8, 7);
    g.beginPath(); g.moveTo(1548 + 26, 560); g.lineTo(1548 + 54, 506); glowLine(g, C.cyan, 1.8, 7);
    [1548 - 54, 1548 + 54].forEach(x => { g.fillStyle = C.pink; g.beginPath(); g.arc(x, 506, 4.5, 0, TAU); g.fill(); });
    g.fillStyle = '#1a0830'; g.fillRect(1548 - 118, 556, 236, 132);               // 机身
    g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(1548 - 118, 556, 236, 4);
    const sx = 1548 - 88, sy = 578, sw = 176, sh = 92;                             // 屏幕
    g.fillStyle = '#0b0220'; g.fillRect(sx, sy, sw, sh);
    const fl = 0.82 + 0.18 * Math.sin(t * 13);                                    // 屏幕闪烁
    const sg = g.createRadialGradient(1548, sy + sh / 2, 6, 1548, sy + sh / 2, 130);
    sg.addColorStop(0, `rgba(63,246,255,${0.5 * fl})`); sg.addColorStop(1, 'rgba(63,246,255,0)');
    g.fillStyle = sg; g.fillRect(sx, sy, sw, sh);
    for (let k = 0; k < 3; k++) {                                                 // 三条测试彩条下移
      const by = sy + ((t * 16 + k * 34) % (sh - 8));
      g.fillStyle = k === 1 ? 'rgba(255,79,216,.5)' : 'rgba(63,246,255,.42)';
      g.fillRect(sx + 14, by, sw - 28, 5);
    }
    const f = Math.floor(t * 30);                                                 // 雪花噪点
    for (let k = 0; k < 26; k++) {
      g.fillStyle = hash(f, k) < 0.5 ? 'rgba(255,255,255,.75)' : 'rgba(140,180,220,.6)';
      g.fillRect(sx + hash(f, k + 40) * sw, sy + hash(f, k + 80) * sh, 2.4, 2.4);
    }
    g.strokeStyle = `rgba(63,246,255,.75)`; g.lineWidth = 2.4; g.strokeRect(sx, sy, sw, sh);
    if (gold > 0.02) { g.strokeStyle = `rgba(255,216,74,${0.75 * gold})`; g.lineWidth = 2; g.strokeRect(sx - 5, sy - 5, sw + 10, sh + 10); }
    g.fillStyle = '#241040'; g.beginPath(); g.arc(1548 + 96, 672, 7, 0, TAU); g.fill(); g.beginPath(); g.arc(1548 + 96, 682, 4, 0, TAU); g.fill();  // 旋钮
    g.restore();
  }

  // ---------- 三颗主球（参数本体）＋灯管数字标签 ----------
  const HERO = [
    { x: 620, y: 724, r: 62, col: 0, num: '0.73', dock: [372, 540] },
    { x: 1288, y: 752, r: 52, col: 1, num: '-1.2', dock: [960, 566] },
    { x: 760, y: 880, r: 46, col: 0, num: '2.4', dock: [1548, 522] },
  ];
  function heroes(g, t, lt, b3, pulse) {
    const f = Math.floor(t * 30);
    const dk = ease.inOut(seg(lt, 8.55, 9.45));
    HERO.forEach((h, k) => {
      const x = lerp(h.x, h.dock[0], dk), y = lerp(h.y, h.dock[1], dk) - 52 * Math.sin(Math.PI * dk);
      const bob = Math.sin(t * 1.7 + k * 2.1) * 6 * (1 - 0.75 * b3);
      const rr = h.r * (1 + 0.055 * Math.sin(t * 2.3 + k * 1.9));
      const dim = hash(f, k + 5) < 0.05 ? 0.66 : 1;                               // 霓虹偶发失压
      const br = clamp((0.72 + 0.18 * Math.sin(t * 2.6 + k) + 0.4 * pulse + 0.3 * b3) * dim, 0, 1);
      const gs = rr * 2.5 * 2;
      g.save(); g.globalAlpha = br;                                              // 粉/青双色辉光（错位叠）
      g.drawImage(SPR[1 - h.col], x - 6 - gs / 2, y + bob - gs / 2, gs, gs);
      g.drawImage(SPR[h.col], x + 6 - gs / 2, y + bob - gs / 2, gs, gs);
      g.restore();
      g.fillStyle = `rgba(255,255,255,${0.92 * Math.max(br, 0.55)})`;
      g.beginPath(); g.arc(x, y + bob, rr * 0.38 * (1 + 0.12 * b3), 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,.95)';
      g.beginPath(); g.arc(x - rr * 0.13, y + bob - rr * 0.13, rr * 0.10, 0, TAU); g.fill();
      if (b3 > 0.02) {                                                            // 拍三描金
        g.save(); g.strokeStyle = `rgba(255,216,74,${0.85 * b3})`; g.lineWidth = 2.4;
        g.shadowColor = C.yellow; g.shadowBlur = 12;
        g.beginPath(); g.arc(x, y + bob, rr * 0.56, 0, TAU); g.stroke(); g.restore();
      }
      const ty = y + bob - rr - 40;                                               // 灯管数字标签
      g.save(); g.strokeStyle = h.col ? 'rgba(63,246,255,.8)' : 'rgba(255,79,216,.8)';
      g.lineWidth = 1.6; g.shadowColor = h.col ? C.cyan : C.pink; g.shadowBlur = 6;
      g.beginPath(); g.moveTo(x, y + bob - rr * 0.72); g.lineTo(x, ty + 22); g.stroke(); g.restore();
      const dimT = hash(f, k + 11) < 0.05 ? 0.5 : 1;
      g.save(); g.font = '40px "Righteous-400"'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      g.shadowColor = h.col ? C.cyan : C.pink; g.shadowBlur = 16;
      g.fillStyle = h.col ? '#b9fbff' : '#ffb1ef';
      g.globalAlpha = dimT * (0.95 + 0.05 * Math.sin(t * 3 + k));
      g.fillText(h.num, x, ty);
      g.shadowBlur = 0; g.fillStyle = '#f4fdff'; g.fillText(h.num, x, ty);
      g.restore();
    });
  }

  // ---------- 霓虹灯箱（屏上字，拍界换字时整灯失压闪两下再亮） ----------
  const SIGN = [
    { txt: '参数', size: 104, cap: 'PARAMETERS' },
    { txt: '疯狂卷参数', size: 60, cap: 'PARAMETER RACE' },
    { txt: '参数之外', size: 76, cap: 'BEYOND PARAMETERS' },
  ];
  function sign(g, t, lt) {
    const k = lt < 3 ? 0 : lt < 7 ? 1 : 2, S0 = [3.0, 7.0][k - 1];
    const f = Math.floor(t * 30);
    let lum = 1;
    if (k > 0 && lt < S0 + 0.6) lum = hash(f, 21) < 0.5 ? 0.12 : 1;              // 换字：整灯失压闪烁
    const x0 = 104, y0 = 168, w2 = 516, h2 = 164;
    g.save();
    g.fillStyle = 'rgba(10,2,20,.62)'; g.fillRect(x0, y0, w2, h2);
    g.beginPath(); g.rect(x0, y0, w2, h2); glowLine(g, C.cyan, 3.4, 15);
    g.strokeStyle = 'rgba(240,255,255,.28)'; g.lineWidth = 1; g.strokeRect(x0 + 7, y0 + 7, w2 - 14, h2 - 14);
    const s = SIGN[k];
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `${s.size}px "LXGWWenKai-500"`;
    g.letterSpacing = '6px';
    g.shadowColor = C.pink; g.shadowBlur = 26 * lum;
    g.fillStyle = `rgba(255,150,226,${lum})`; g.fillText(s.txt, x0 + w2 / 2, y0 + h2 / 2 - 12);
    g.shadowBlur = 0; g.fillStyle = `rgba(255,242,252,${lum})`; g.fillText(s.txt, x0 + w2 / 2, y0 + h2 / 2 - 12);
    g.font = '20px "Righteous-400"'; g.letterSpacing = '7px';
    g.shadowColor = C.cyan; g.shadowBlur = 12 * lum;
    g.fillStyle = `rgba(120,242,255,${0.9 * lum})`; g.fillText(s.cap, x0 + w2 / 2, y0 + h2 - 30);
    g.restore();
  }

  // ---------- VHS 面板计数器：1.5B → 175B → 540B → 1T+ ----------
  function counter(g, t, lt) {
    const on = ss(3.15, 3.6, lt); if (on <= 0.01) return;
    const dim = 1 - 0.55 * ss(7.6, 8.4, lt);
    const x0 = 1404, y0 = 176, w2 = 416, h2 = 148;
    let str;
    if (lt < 3.5) str = '1.5B';
    else if (lt < 6.32) {
      const v = 1.5 * Math.pow(1000 / 1.5, seg(lt, 3.5, 6.32));
      str = v < 10 ? v.toFixed(1) + 'B' : Math.min(999, Math.round(v)) + 'B';
    } else str = '1T+';
    let bl = 1;
    if (lt >= 6.32 && lt < 6.85) bl = hash(Math.floor(lt * 30), 3) < 0.32 ? 0.25 : 1;   // 1T+ 落定双闪
    g.save(); g.globalAlpha = on * dim;
    g.fillStyle = 'rgba(8,2,24,.74)'; g.fillRect(x0, y0, w2, h2);
    g.beginPath(); g.rect(x0, y0, w2, h2); glowLine(g, C.cyan, 2.6, 12);
    g.font = '21px "PressStart2P-400"'; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    g.fillStyle = 'rgba(120,242,255,.95)'; g.fillText('PARAMS', x0 + 26, y0 + 44);
    g.font = '52px "PressStart2P-400"'; g.textAlign = 'center';
    g.shadowColor = C.pink; g.shadowBlur = 18 * bl;
    g.fillStyle = `rgba(255,121,221,${bl})`; g.fillText(str, x0 + w2 / 2 - 14, y0 + 116);
    g.shadowBlur = 0; g.fillStyle = `rgba(255,235,250,${bl})`; g.fillText(str, x0 + w2 / 2 - 14, y0 + 116);
    g.fillStyle = 'rgba(120,242,255,.3)'; g.fillRect(x0 + 26, y0 + 132, w2 - 52, 6);    // 序列进度条
    g.fillStyle = lt < 6.32 ? C.pink : C.cyan;
    g.fillRect(x0 + 26, y0 + 132, (w2 - 52) * (lt < 6.32 ? seg(lt, 3.2, 6.32) : 1), 6);
    g.restore();
  }

  // ---------- VHS 后期：通道分离（平滑错位）＋跟踪噪声带＋扫描线＋OSD＋暗角 ----------
  function vhs(c, S, t, lt) {
    const ca = 2.1 + Math.sin(t * 5.3) * 0.85;
    P.rgbSplit(c, S, { r: [-ca, 0], g: [0, 0], b: [ca, 0.7], key: 'vwp26Split' });
    const f = Math.floor(t * 30), r = rng(f * 7 + 1);
    const by = ((lt * 300 + 240) % (H + 180)) - 90, bh = 62;                       // 常态跟踪噪声带（下滚）
    for (let y = by; y < by + bh; y += 6) {
      const dx = (r() - 0.5) * 30 * Math.sin((y - by) / bh * Math.PI);
      c.drawImage(S, 0, y, W, 6, dx, y, W, 6);
    }
    c.save(); c.globalAlpha = 0.36;
    for (let i = 0; i < 40; i++) { c.fillStyle = r() < 0.5 ? '#ffffff' : '#bbbbbb'; c.fillRect(r() * W, by + r() * bh, 16 + r() * 110, 1.4); }
    c.restore();
    const swp = seg(lt, 9.45, 9.95);                                              // 收尾：加强带自下而上扫过
    if (swp > 0 && swp < 1) {
      const cy = lerp(H + 160, -160, swp), r2 = rng(f * 13 + 5);
      for (let y = cy - 70; y < cy + 70; y += 6) {
        const dx = (r2() - 0.5) * 88 * Math.sin((y - (cy - 70)) / 140 * Math.PI);
        c.drawImage(S, 0, clamp(y, 0, H - 6), W, 6, dx, clamp(y, 0, H - 6), W, 6);
      }
      c.save(); c.globalAlpha = 0.5;
      for (let i = 0; i < 32; i++) { c.fillStyle = r2() < 0.5 ? '#ffffff' : '#cfcfcf'; c.fillRect(r2() * W, cy - 70 + r2() * 140, 20 + r2() * 160, 1.6); }
      c.restore();
    }
    P.scanlines(c, 0.24, 0.10);
    // OSD：PLAY ▶＋时间码（帧级走字，16 帧一闪）
    c.save(); c.font = '34px "PressStart2P-400"'; c.fillStyle = '#ffffff';
    c.shadowColor = 'rgba(0,0,0,.8)'; c.shadowOffsetX = 3; c.shadowOffsetY = 3;
    if ((f >> 4) % 2 === 0 || lt < 0.2) { c.fillText('PLAY', 64, 92); c.beginPath(); c.moveTo(232, 60); c.lineTo(262, 77); c.lineTo(232, 94); c.closePath(); c.fill(); }
    c.font = '24px "PressStart2P-400"';
    const s2 = String(Math.floor(lt)).padStart(2, '0'), fr = String(Math.floor(lt * 30) % 30).padStart(2, '0');
    c.fillText('SP 0:00:' + s2 + ':' + fr, 64, 138);
    c.restore();
    P.vignette(c, { inner: 520, outer: 1160, col: 'rgba(10,0,25,.5)' });
  }

  return {
    init() {
      U.assertGlyphs('104px "LXGWWenKai-500"', '参数疯狂卷之外', 's26_vaporwave 灯箱');
      U.assertGlyphs('40px "Righteous-400"', '0.73-1.2 2.4 PARAMETERS RACE BEYOND', 's26_vaporwave 标签');
      U.assertGlyphs('52px "PressStart2P-400"', 'PARAMS 1.5B 540B 1T+ 0123456789 SP:', 's26_vaporwave 计数器');
      U.assertGlyphs('34px "PressStart2P-400"', 'PLAY', 's26_vaporwave OSD');
    },
    draw(c, lt, t) {
      const dens = ss(3.1, 6.2, lt);                            // 拍二密度
      const b3 = ss(7, 8.6, lt);                                // 拍三收稳
      const pulse = Math.sin(Math.PI * seg(lt, 6.32, 6.74));    // 1T+ 揭示：全网球平滑脉冲一次
      const zoom = lt < 3 ? 1 + 0.10 * ease.inOut(lt / 3)
        : lt < 7 ? 1.10 - 0.08 * ease.inOut((lt - 3) / 4)
        : 1.02 - 0.02 * ss(7, 10, lt);                          // 近景缓推 → 拉远展开 → 停住收稳
      // 变速相位的积分时间：网格 1.25 拍二加速至 1.9、拍三减速至 1.45；落日横条同步提速（闭式积分，相位不跳）
      const tauGrid = 1.25 * lt + 0.65 * ssInt(3.1, 6.2, lt) - 0.45 * ssInt(7.0, 9.5, lt);
      const tauSun = 0.30 * lt + 0.45 * ssInt(3.1, 6.2, lt);
      const S = P.scratch('vwp26S'), g = S.getContext('2d'); g.reset();
      g.drawImage(bg(), 0, 0);
      if (dens > 0.01) {                                        // 天色随密度加浓
        g.save(); g.globalAlpha = 0.20 * dens; g.fillStyle = C.deep; g.fillRect(0, 0, W, FLOOR); g.restore();
        const hz = g.createRadialGradient(960, FLOOR, 60, 960, FLOOR, 860);
        hz.addColorStop(0, `rgba(255,79,216,${0.26 * dens + 0.2 * pulse})`); hz.addColorStop(1, 'rgba(255,79,216,0)');
        g.fillStyle = hz; g.fillRect(0, 0, W, FLOOR);
      }
      sun(g, tauSun, dens, pulse);
      palms(g, t);
      chip(g, t, lt);
      g.save();                                                  // —— 统一缓变推拉镜（世界层） ——
      g.translate(960, 690); g.scale(zoom, zoom); g.translate(-960, -690);
      floorGrid(g, tauGrid, dens, pulse);
      network(g, t, lt, b3, pulse);
      books(g, lt, ss(8.6, 9.4, lt));
      gearDisc(g, t, lt, ss(8.6, 9.4, lt));
      tv(g, t, lt, ss(8.6, 9.4, lt));
      heroes(g, t, lt, b3, pulse);
      sign(g, t, lt);
      counter(g, t, lt);
      g.restore();
      vhs(c, S, t, lt);
    },
  };
})();
