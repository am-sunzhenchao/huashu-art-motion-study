// 「大模型参数」霍珀美国现实主义样片（s24_hopper）——纯代码，1942 霍珀硬光块面（《夜游者》《小城办公室》一脉）。
// 手法照 24 号卡「双版本光影裁切」：整间深夜办公室画两张缓存——背光版（冷绿墙 #5d8679、暗地板）与受光版（暖黄墙 #efcf8f、亮地板）；
// 每帧用硬边光斑多边形把受光版裁进来：银行灯的灯池（呼吸）、窗外城市光在墙上长出的光斑（拍二）、收尾一道晨光斜切过全场。
// 墙上的窗棂／电线影子＝光斑里透出背光版（影子剪影 source-in 背光底版再画回光斑），几何影子、无任何人形剪影。
// 拍一 0–3s「参数」：三张账本纸页躺在灯池里，0.73 / -1.2 / 2.4 手写数字，纸页翘角轻颤、墨迹随光深浅、浮尘上浮，缓推端详。
// 拍二 3–7s「疯狂卷参数」：缓拉远——桌上纸摞一层层长高，窗外窗火一盏盏亮起，墙上窗棂／电线影子网拉长交错，
//        墙上摊开的账本页码翻动 1.5B→175B→540B→1T+，1T+ 揭示时城市光与灯池同步涌亮一次（全片唯一重音）。
// 拍三 7–10s「参数之外」：增殖停住；窗下矮柜上三件物依次升起——一摞书（数据）、带秒针的台钟（方法）、带刻度盘的收音机（算力）；
//        纸摞抖边收直、顶页描金变亮，影子网收稳，一道硬边晨光从窗侧扫过全场、把书钟收音机和纸页逐件点亮收尾。
SCENES['s24_hopper'] = (() => {
  const W = 1920, H = 1080, TAU = Math.PI * 2;
  const { clamp, lerp, ease, rng, ss, seg } = U, P = PAINT;
  const FL = 740;                                   // 墙脚线
  // 背光／受光两套色（照卡抄）；lit=false 时多传一个"亮暗"之外的差异：窗外景（夜／清晨）
  const SH = { wall: '#5d8679', dado: '#4b6d63', floor: '#5b3d2b', board: '#4a3122', trim: '#a7b3a5', trimD: '#7f8d80',
    blind: '#cfc3a0', wood: '#4f3322', woodD: '#3a2418', paper: '#cfc3a0', ink: '#3a2418', glass: '#4b6d63', sign: '#f4e8c4' };
  const LT = { wall: '#efcf8f', dado: '#d8ad68', floor: '#c98b52', board: '#b0743e', trim: '#f7eed2', trimD: '#d9c9a2',
    blind: '#f4e8c4', wood: '#a86c3c', woodD: '#7a4a26', paper: '#f4e8c4', ink: '#2a1810', glass: '#6f9a86', sign: '#f7eed2' };
  const poly = (c, pts) => { c.beginPath(); pts.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); };
  const smth = p => p * p * p * (p * (p * 6 - 15) + 10);   // 五次缓动：峰值速度只有 ease.inOut 的 62%，硬边每帧重采样的抖动跟着压下来

  // ---------- 静态房间：同一个 room(g,K,night)，两套色画两张缓存 ----------
  function outside(g, night) {                      // 窗外：夜（黑绿天＋暗砖楼＋电线杆）／清晨（日天空＋红砖楼）
    g.save(); g.beginPath(); g.rect(1300, 150, 480, 410); g.clip();
    const sk = g.createLinearGradient(0, 150, 0, 340);
    if (night) { sk.addColorStop(0, '#1f2a24'); sk.addColorStop(1, '#2c3f36'); }
    else { sk.addColorStop(0, '#5f97c9'); sk.addColorStop(1, '#a9c8dc'); }
    g.fillStyle = sk; g.fillRect(1300, 150, 480, 190);
    g.fillStyle = night ? '#5a2418' : '#b4553a'; g.fillRect(1300, 300, 480, 260);   // 对街砖立面
    g.fillStyle = night ? '#47200f' : '#8a3f28'; g.fillRect(1300, 296, 480, 8);     // 檐下硬影
    for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) {                        // 12 个窗洞（夜黑／日暗）
      const x = 1328 + i * 116, y = 312 + j * 72;
      g.fillStyle = night ? '#24352f' : '#1f2a24'; g.fillRect(x, y, 92, 58);
      if (!night) { g.fillStyle = '#e8dcc0'; g.fillRect(x - 5, y - 5, 102, 4); g.fillRect(x - 5, y - 5, 4, 68); }
    }
    g.fillStyle = '#1f2a24'; g.fillRect(1338, 150, 14, 150);                          // 电线杆（影子网的本体，剪影无脸）
    g.fillRect(1306, 188, 78, 8); g.fillRect(1318, 236, 54, 7);
    g.strokeStyle = '#1f2a24'; g.lineWidth = 3; g.beginPath();
    g.moveTo(1352, 186); g.quadraticCurveTo(1560, 128, 1780, 116); g.stroke();        // 两根电线没入夜空
    g.beginPath(); g.moveTo(1352, 234); g.quadraticCurveTo(1500, 196, 1780, 188); g.stroke();
    g.restore();
  }
  function room(g, K, night) {
    const wg = g.createLinearGradient(0, 0, 0, FL); wg.addColorStop(0, K.dado); wg.addColorStop(0.42, K.wall); wg.addColorStop(1, K.wall);
    g.fillStyle = wg; g.fillRect(0, 0, W, FL);                                        // 墙（上暗下亮，夜深）
    g.fillStyle = K.dado; g.fillRect(0, 660, W, FL - 660);                            // 护墙板
    g.fillStyle = K.trim; g.fillRect(0, 652, W, 8); g.fillRect(0, FL - 8, W, 8);
    g.fillStyle = K.floor; g.fillRect(0, FL, W, H - FL);                             // 地板
    g.strokeStyle = K.board; g.lineWidth = 3;
    for (let k = 1; k < 10; k++) { const y = FL + Math.pow(k / 10, 1.5) * (H - FL); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    g.strokeStyle = 'rgba(30,20,12,.35)'; g.lineWidth = 2;                            // 几道竖向短拼缝（确定性）
    [[430, 810, 60], [980, 930, 44], [1600, 800, 70], [240, 1000, 40]].forEach(([x, y, l]) => { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + l); g.stroke(); });
    outside(g, night);
    // 窗：套、台、中梃＋半卷的卷帘（白漆在夜里的冷白）
    g.fillStyle = K.trim; g.fillRect(1284, 134, 212, 22); g.fillRect(1284, 134, 22, 452); g.fillRect(1774, 134, 22, 452); g.fillRect(1264, 558, 252, 24);
    g.fillStyle = K.trimD; g.fillRect(1264, 582, 252, 8); g.fillRect(1520, 150, 28, 410); g.fillRect(1300, 345, 480, 25);
    g.fillStyle = K.blind; g.fillRect(1300, 150, 480, 66); g.fillStyle = K.trimD; g.fillRect(1300, 210, 480, 7);
    // 门（左墙深处，关闭，无光缝：全片只有两个光源）
    g.fillStyle = K.trimD; g.fillRect(58, 240, 286, 500);
    g.fillStyle = K.woodD; g.fillRect(74, 256, 254, 482);
    g.fillStyle = K.wood; g.fillRect(92, 274, 218, 180); g.fillRect(92, 486, 218, 224);
    g.fillStyle = '#a8893f'; g.beginPath(); g.arc(304, 500, 6, 0, TAU); g.fill();      // 黄铜门钮
    // 窗下矮柜（拍三三件物的底座）
    g.fillStyle = K.woodD; g.fillRect(1210, 616, 580, 124);
    g.fillStyle = K.wood; g.fillRect(1210, 616, 580, 14); g.fillRect(1224, 646, 262, 80); g.fillRect(1514, 646, 262, 80);
    g.fillStyle = K.trimD; g.fillRect(1224, 646, 262, 4); g.fillRect(1514, 646, 262, 4);
    // 书桌（前景偏左）
    poly(g, [[250, 700], [1080, 700], [1170, 790], [140, 790]]); g.fillStyle = K.wood; g.fill();
    g.fillStyle = K.woodD; g.fillRect(140, 786, 1030, 8);
    g.fillStyle = 'rgba(20,13,7,.30)'; poly(g, [[150, 872], [1170, 872], [1240, 940], [80, 940]]); g.fill();   // 桌影投地
    g.fillStyle = K.woodD; g.fillRect(140, 794, 1030, 78);                          // 桌围（抽屉柜）
    for (let k = 0; k < 3; k++) { const x = 190 + k * 330; g.fillStyle = K.wood; g.fillRect(x, 806, 286, 54); g.fillStyle = '#a8893f'; g.beginPath(); g.arc(x + 143, 833, 4.5, 0, TAU); g.fill(); }
    g.fillStyle = K.wood; g.fillRect(168, 872, 42, 112); g.fillRect(1102, 872, 42, 112);
    // 绿罩银行灯（台右，静态件）：黄铜柱＋绿玻璃罩
    g.fillStyle = K.woodD; g.beginPath(); g.ellipse(1002, 716, 48, 11, 0, 0, TAU); g.fill();
    g.fillStyle = '#a8893f'; g.beginPath(); g.ellipse(1002, 713, 30, 7, 0, 0, TAU); g.fill();
    g.strokeStyle = '#a8893f'; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(1002, 710); g.quadraticCurveTo(1000, 668, 988, 648); g.stroke();
    poly(g, [[916, 646], [1084, 646], [1076, 684], [924, 672]]); g.fillStyle = K.glass; g.fill();
    g.strokeStyle = '#a8893f'; g.lineWidth = 5; g.beginPath(); g.moveTo(916, 647); g.lineTo(1084, 647); g.stroke();
  }
  const bgShade = () => P.cached('hop24sh', W, H, g => room(g, SH, true));
  const bgLit = () => P.cached('hop24lt', W, H, g => room(g, LT, false));
  // 油画拖笔：竖向拉长 fbm，1/4 分辨率放大，soft-light α0.18（墙要平，只若有若无）
  const brush = () => P.cached('hop24br', W, H, (g) => {
    const s = 4, w = W / s, h = H / s, sm = P.canvas(w, h), sg = sm.getContext('2d'), im = sg.createImageData(w, h), d = im.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const n = P.fbm(x * 0.06, y * 0.006, 4) * 0.7 + P.fbm(x * 0.02 + y * 0.02, 3.3, 3) * 0.3, v = 128 + n * 110, i = (y * w + x) * 4; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    sg.putImageData(im, 0, 0); g.imageSmoothingQuality = 'high'; g.drawImage(sm, 0, 0, W, H);
  });

  // ---------- 预生成（种子固定） ----------
  const HERO = [   // 三张带数字的主纸＋两张空白小纸
    { x: 430, y: 742, w: 150, h: 92, rot: -0.06, num: '0.73', ph: 0 },
    { x: 645, y: 764, w: 170, h: 100, rot: 0.045, num: '-1.2', ph: 2.1 },
    { x: 848, y: 736, w: 142, h: 88, rot: -0.03, num: '2.4', ph: 4.2 },
    { x: 298, y: 772, w: 112, h: 70, rot: 0.1, ph: 1.3 },
    { x: 966, y: 754, w: 122, h: 74, rot: -0.12, ph: 3.4 },
  ];
  const STACKS = (() => {   // 桌上背靠墙的纸摞：位置、每层尺寸、发端时刻与生长窗口（全部 3.15–6.9s 内长完）
    const r = rng(2401), defs = [
      { x: 255, w: 95, n: 15 }, { x: 425, w: 130, n: 24 }, { x: 590, w: 110, n: 20 }, { x: 755, w: 150, n: 28 }, { x: 905, w: 80, n: 13 },
    ];
    return defs.map((d, k) => { const yb = 706 + (r() - 0.5) * 8, lay = [];
      for (let i = 0; i < d.n; i++) lay.push({ dy: i * (7.2 + r() * 1.6), dx: (r() - 0.5) * 11, w: d.w * (0.84 + r() * 0.18), h: 6.4 + r() * 2.6 });
      return { x: d.x, yb, lay, t0: 3.15 + k * 0.14 + r() * 0.12, win: 2.4 + r() * 0.5 }; });
  })();
  const WIRES = (() => {   // 电线影子：从光斑里长出的细斜条（角度 2.15–2.7rad＝向左下）
    const r = rng(2477), out = [];
    for (let k = 0; k < 9; k++) out.push({ ang: 2.15 + r() * 0.55, len: 360 + r() * 330, t0: 3.45 + k * 0.3, x: 946 + r() * 320, y: 168 + r() * 84, w: 5 + r() * 4.5 });
    return out; })();
  const CITY = (() => {   // 对街 12 扇窗：逐盏点亮时刻＋卷帘高度
    const r = rng(2357), out = [];
    for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) out.push({ x: 1328 + i * 116, y: 312 + j * 72, t: 3.3 + (j * 4 + i) * 0.21, bl: 0.2 + r() * 0.5, k: j * 4 + i });
    return out; })();

  const countStr = (lt) => {   // 账本计数：1.5B → 175B → 540B → 1T+
    if (lt < 3.5) return '1.5B';
    if (lt < 4.95) { const v = 1.5 * Math.pow(175 / 1.5, seg(lt, 3.5, 4.95)); return (v < 10 ? v.toFixed(1) : Math.round(v)) + 'B'; }
    if (lt < 6.32) { const v = 175 * Math.pow(540 / 175, seg(lt, 4.95, 6.32)); return Math.round(v) + 'B'; }
    return '1T+';
  };

  // ---------- 桌上动态（背光/受光同一函数换色） ----------
  function papers(g, K, lt, t, b3) {
    HERO.forEach(p => {
      const rot = p.rot * (1 - 0.5 * b3) + 0.012 * Math.sin(t * 2.1 + p.ph) * (1 - 0.4 * b3);   // 翘角轻颤，拍三收稳变齐
      const yy = p.y + 1.6 * Math.sin(t * 1.7 + p.ph);
      g.save(); g.translate(p.x, yy); g.rotate(rot);
      g.fillStyle = K.paper; g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      g.strokeStyle = 'rgba(58,36,24,.22)'; g.lineWidth = 1;
      for (let i = 1; i <= 2; i++) { g.beginPath(); g.moveTo(-p.w / 2 + 10, -p.h / 2 + i * p.h / 3); g.lineTo(p.w / 2 - 10, -p.h / 2 + i * p.h / 3); g.stroke(); }
      g.fillStyle = 'rgba(58,36,24,.16)'; g.beginPath(); g.moveTo(p.w / 2 - 15, -p.h / 2); g.lineTo(p.w / 2, -p.h / 2); g.lineTo(p.w / 2, -p.h / 2 + 15); g.closePath(); g.fill();
      if (p.num) {
        g.font = '34px "LibreBaskerville-700"'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.globalAlpha = clamp(0.8 + 0.2 * Math.sin(t * 1.3 + p.ph) + 0.25 * b3, 0, 1);   // 墨迹随光深浅，拍三墨沉
        g.fillStyle = K.ink; g.fillText(p.num, 0, 2);
        if (b3 > 0.02) { g.globalAlpha = 0.85 * b3; g.strokeStyle = '#f3d67e'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(-34, 24); g.lineTo(34, 24); g.stroke(); }
        g.globalAlpha = 1;
      }
      g.restore();
    });
  }
  function stacks(g, K, lt, b3, lit) {
    STACKS.forEach(s => {
      const q = clamp((lt - s.t0) / s.win, 0, 1); if (q <= 0) return;
      const n = Math.min(s.lay.length, Math.floor(ease.out(q) * s.lay.length + 1e-4));
      for (let i = 0; i < n; i++) {
        const L = s.lay[i], dx = L.dx * (1 - 0.6 * b3), w = L.w + (i % 5 === 4 ? 7 : 0), y = s.yb - L.dy - L.h;   // 抖边拍三收直（变精）
        g.fillStyle = K.paper; g.fillRect(s.x - w / 2 + dx, y, w, L.h);
        g.fillStyle = 'rgba(58,36,24,.22)'; g.fillRect(s.x - w / 2 + dx, y + L.h - 1.6, w, 1.6);
        if (lit && b3 > 0.02 && i >= n - 2) { g.fillStyle = `rgba(243,214,126,${0.55 * b3})`; g.fillRect(s.x - w / 2 + dx, y - 1.4, w, 2.6); }   // 顶页描金
      }
    });
  }
  function ledger(g, K, lt, t) {
    const on = ss(3.05, 3.55, lt); if (on <= 0.01) return;
    g.save(); g.globalAlpha = on;
    g.fillStyle = K.wood; g.fillRect(600, 130, 305, 215);
    g.fillStyle = K.woodD; g.fillRect(600, 338, 305, 7);
    g.fillStyle = K.paper; g.fillRect(616, 146, 130, 183); g.fillRect(759, 146, 130, 183);
    g.fillStyle = 'rgba(58,36,24,.30)'; g.fillRect(746, 146, 13, 183);
    g.strokeStyle = 'rgba(58,36,24,.20)'; g.lineWidth = 1;                              // 账本格线
    for (let k = 1; k < 5; k++) { g.beginPath(); g.moveTo(620, 150 + k * 36); g.lineTo(742, 150 + k * 36); g.stroke(); }
    const cnt = Math.floor(4 + 18 * clamp(seg(lt, 3.5, 6.32), 0, 1));                    // 刻痕随计数加
    g.strokeStyle = 'rgba(58,36,24,.72)'; g.lineWidth = 2.6; g.lineCap = 'round';
    for (let i = 0; i < cnt; i++) {
      const gx = 626 + (i % 2) * 64, gy = 158 + Math.floor(i / 2) * 26;
      g.beginPath(); for (let k = 0; k < 4; k++) { g.moveTo(gx + k * 8, gy); g.lineTo(gx + k * 8, gy + 18); } g.stroke();
      g.beginPath(); g.moveTo(gx - 4, gy + 14); g.lineTo(gx + 29, gy + 2); g.stroke();
    }
    g.font = '58px "LibreBaskerville-700"'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = K.ink; g.fillText(countStr(lt), 824, 238);
    g.strokeStyle = 'rgba(58,36,24,.5)'; g.lineWidth = 2;                                  // 数字下双横线（账房规矩）
    g.beginPath(); g.moveTo(782, 274); g.lineTo(866, 274); g.moveTo(782, 280); g.lineTo(866, 280); g.stroke();
    if (lt > 3.5 && lt < 6.32) {                                                          // 中缝翻页（持续小循环）
      const fq = (lt * 1.6) % 1, wv = 60 * Math.sin(Math.PI * fq);
      g.fillStyle = 'rgba(207,195,160,.95)'; g.fillRect(752 - wv, 150, wv, 178);
      g.fillStyle = 'rgba(58,36,24,.25)'; g.fillRect(752 - wv, 150, Math.min(6, wv), 178);
    }
    g.restore();
  }
  const SIGN = [{ txt: '参数', s: 96 }, { txt: '疯狂卷参数', s: 60 }, { txt: '参数之外', s: 76 }];
  function signText(g, K, lt) {   // 墙上漆字：换拍时旧字先淡出、新字再淡入（不叠画）
    g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.letterSpacing = '10px';
    for (let k = 0; k < 3; k++) {
      const S0 = [3.0, 7.0][k - 1] || -1;
      let a = k === 0 ? 1 : ss(S0 + 0.06, S0 + 0.38, lt);
      if (k < 2) { const E0 = [3.0, 7.0][k]; a *= 1 - ss(E0 - 0.38, E0 - 0.06, lt); }
      if (a <= 0.01) continue;
      const s = SIGN[k];
      g.save(); g.globalAlpha = a; g.font = `${s.s}px "LXGWWenKai-500"`;
      g.fillStyle = '#3b5348'; g.fillText(s.txt, 156, 203);                                // 硬边投影（贴墙漆）
      g.fillStyle = K.sign; g.fillText(s.txt, 150, 196);
      g.restore();
    }
    g.letterSpacing = '0px';
  }
  function objects(g, K, lt, b3) {   // 拍三三件物：书（数据）、台钟（方法）、收音机（算力）
    const rise = (t0) => ({ p: ease.out(seg(lt, t0, t0 + 1.05)), a: ss(t0, t0 + 0.5) });
    { // 一摞书
      const { p, a } = rise(7.15); if (a > 0.01) { g.save(); g.globalAlpha = a; g.translate(0, (1 - p) * 260);
        const r = rng(726); let y = 616; [[128, 26, '#b4553a'], [116, 24, '#4b6d63'], [104, 22, '#7a2c2a'], [92, 20, '#c98b52']].forEach(([w2, h2, col]) => {
          const ox = (r() - 0.5) * 10;
          g.fillStyle = col; g.fillRect(1325 - w2 / 2 + ox, y - h2, w2, h2);
          g.fillStyle = K.paper; g.fillRect(1325 - w2 / 2 + ox + 8, y - h2 + 3, w2 * 0.2, h2 - 6);   // 书口
          g.fillStyle = 'rgba(30,18,10,.35)'; g.fillRect(1325 - w2 / 2 + ox, y - h2, w2, 3);
          y -= h2; });
        g.fillStyle = `rgba(243,214,126,${0.6 * b3})`; g.fillRect(1325 - 58, y - 2, 116, 2.6);
        g.restore(); } }
    { // 台钟：拱顶木壳＋奶白表盘＋秒针（单独画在最上层）
      const { p, a } = rise(7.65); if (a > 0.01) { g.save(); g.globalAlpha = a; g.translate(0, (1 - p) * 260);
        g.fillStyle = K.wood; g.beginPath(); g.moveTo(1452, 616); g.lineTo(1452, 530); g.arc(1519, 530, 67, Math.PI, 0); g.lineTo(1586, 616); g.closePath(); g.fill();
        g.fillStyle = K.woodD; g.fillRect(1444, 608, 150, 10);
        g.fillStyle = K.paper; g.beginPath(); g.arc(1519, 549, 51, 0, TAU); g.fill();
        g.strokeStyle = K.woodD; g.lineWidth = 5; g.stroke();
        if (b3 > 0.02) { g.strokeStyle = `rgba(243,214,126,${0.7 * b3})`; g.lineWidth = 2.6; g.beginPath(); g.arc(1519, 549, 56, 0, TAU); g.stroke(); }
        g.strokeStyle = K.ink; g.lineWidth = 2.4; g.lineCap = 'round';
        for (let k = 0; k < 12; k++) { const aa = k / 12 * TAU; g.beginPath(); g.moveTo(1519 + Math.cos(aa) * 43, 549 + Math.sin(aa) * 43); g.lineTo(1519 + Math.cos(aa) * 47, 549 + Math.sin(aa) * 47); g.stroke(); }
        g.restore(); } }
    { // 收音机：木壳＋奶白格栅＋呼吸刻度盘＋天线
      const { p, a } = rise(8.15); if (a > 0.01) { g.save(); g.globalAlpha = a; g.translate(0, (1 - p) * 260);
        g.strokeStyle = K.woodD; g.lineWidth = 4; g.beginPath(); g.moveTo(1702, 524); g.lineTo(1738, 468); g.stroke();
        g.fillStyle = '#a8893f'; g.beginPath(); g.arc(1738, 468, 4, 0, TAU); g.fill();
        g.fillStyle = K.wood; g.fillRect(1632, 524, 140, 92);
        g.fillStyle = K.woodD; g.fillRect(1632, 524, 140, 6);
        g.fillStyle = K.trimD; g.fillRect(1646, 540, 112, 30);
        g.strokeStyle = K.woodD; g.lineWidth = 3; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(1652, 547 + k * 8); g.lineTo(1752, 547 + k * 8); g.stroke(); }
        g.fillStyle = K.ink; g.beginPath(); g.arc(1702, 592, 5, 0, TAU); g.arc(1748, 592, 5, 0, TAU); g.fill();
        g.restore(); } }
  }
  function handsAndDial(c, lt, t) {   // 秒针＋刻度盘：画在双版本之上，永远可读；跟各自物件同落差
    const a1 = ss(7.65, 8.15, lt), a2 = ss(8.15, 8.65, lt);
    const off1 = (1 - ease.out(seg(lt, 7.65, 8.7))) * 260, off2 = (1 - ease.out(seg(lt, 8.15, 9.2))) * 260;
    if (a1 > 0.01) { c.save(); c.globalAlpha = a1; c.translate(1519, 549 + off1);
      c.strokeStyle = '#2a1810'; c.lineWidth = 5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(Math.cos(-2.1) * 12, Math.sin(-2.1) * 12); c.lineTo(Math.cos(-2.1) * 26, Math.sin(-2.1) * 26); c.stroke();   // 时针
      c.beginPath(); c.moveTo(Math.cos(-2.75) * 14, Math.sin(-2.75) * 14); c.lineTo(Math.cos(-2.75) * 40, Math.sin(-2.75) * 40); c.stroke(); // 分针
      const sa = t * TAU / 10 - Math.PI / 2;
      c.strokeStyle = '#7a2c2a'; c.lineWidth = 2.6; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(sa) * 45, Math.sin(sa) * 45); c.stroke();  // 红秒针扫盘
      c.fillStyle = '#a8893f'; c.beginPath(); c.arc(0, 0, 4.5, 0, TAU); c.fill(); c.restore(); }
    if (a2 > 0.01) { const br = 0.45 + 0.3 * Math.sin(t * 2.7);                          // 刻度盘呼吸（算力在烧）
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a2; c.translate(0, off2);
      const dg = c.createRadialGradient(1702, 560, 2, 1702, 560, 26); dg.addColorStop(0, `rgba(239,207,143,${0.85 * br})`); dg.addColorStop(1, 'rgba(239,207,143,0)');
      c.fillStyle = dg; c.fillRect(1676, 534, 52, 52); c.restore(); }
  }

  return {
    init() {
      U.assertGlyphs('96px "LXGWWenKai-500"', '参数疯狂卷之外', 's24_hopper 墙上漆字');
      U.assertGlyphs('34px "LibreBaskerville-700"', '0.73-1.2 2.4 1.5B 175B 540B 1T+', 's24_hopper 账本数字');
    },
    draw(c, lt, t) {
      const dens = ss(3.15, 6.2, lt), b3 = ss(7, 8.6, lt);
      const pulse = Math.sin(Math.PI * seg(lt, 6.32, 6.78));                            // 1T+ 揭示：全屋涌亮一次（唯一重音）
      const flick = dens * (1 - b3);                                                     // 卷参数期城市光微晃，拍三收稳
      // 运镜：近景缓推 → 拉远展开（幅度减半＋五次缓动：硬边房线逐帧重采样抖动压在跳变线下）→ 拍三缓移回中收全貌
      let z, cx, cy;
      if (lt < 3) { const q = ease.inOut(lt / 3); z = 1 + 0.13 * q; cx = lerp(960, 620, q); cy = lerp(540, 700, q); }
      else if (lt < 7) { const q = smth((lt - 3) / 4); z = 1.13 - 0.07 * q; cx = lerp(620, 790, q); cy = lerp(700, 620, q); }
      else { const q3 = smth(ss(7, 10, lt)); z = 1.06 + 0.012 * ss(7.2, 10, lt); cx = lerp(790, 960, q3); cy = lerp(620, 540, q3); }
      c.save(); c.translate(cx, cy); c.scale(z, z); c.translate(-cx, -cy);
      // ① 背光底版 ＋ 窗外逐盏亮起的城市窗火
      c.drawImage(bgShade(), 0, 0);
      CITY.forEach(wd => { const on = ss(wd.t, wd.t + 0.4, lt); if (on <= 0.01) return;
        const br = on * (0.88 + 0.08 * Math.sin(t * 1.7 + wd.k * 2.2)) * (1 - 0.5 * b3);
        c.fillStyle = `rgba(239,207,143,${clamp(br, 0, 1)})`; c.fillRect(wd.x, wd.y, 92, 58);
        c.fillStyle = `rgba(61,106,78,${clamp(0.85 * br, 0, 1)})`; c.fillRect(wd.x, wd.y, 92, 58 * wd.bl);   // 半拉绿卷帘
      });
      // ② 光斑多边形：灯池（呼吸）＋窗外城市光斑（拍二从窗口长出）＋晨光斜切（收尾扫过全场）
      const br = 1 + 0.026 * Math.sin(t * 1.85) + 0.05 * b3;
      const poolP = [[420, 688], [1012, 672], [1130, 792], [384, 802]].map(([x, y]) => [736 + (x - 736) * br, 738 + (y - 738) * br]);
      const gq = ss(3.2, 4.6, lt) * (0.75 + 0.25 * dens), Lx = lerp(1300, 920, gq), Bx = lerp(1300, 700, gq);
      const wallP = [[Lx, 150], [1300, 150], [1300, 640], [Bx, 700]];
      const floorP = [[lerp(1300, 660, gq), 740], [1300, 740], [1390, 870], [lerp(1390, 540, gq), 870]];
      const sw = seg(lt, 9.02, 9.88), xL = lerp(2560, 110, smth(sw));   // 晨光楔从画外右缘扫入：起点退化为画外零面积，终点与原版同框
      const mornP = [[xL, 60], [1985, 60], [1985, 1080], [xL - 620, 1080]];
      const polys = gq > 0.004 ? [poolP, wallP, floorP] : [poolP];
      if (sw > 0) polys.push(mornP);
      // ③ 桌上动态（背光色打底）
      papers(c, SH, lt, t, b3); stacks(c, SH, lt, b3, false); ledger(c, SH, lt, t); signText(c, SH, lt); objects(c, SH, lt, b3);
      // ④ 光斑里裁进受光版＋受光色的同一批东西＋暖光加浓
      P.litClip(c, polys, (cc) => {
        cc.drawImage(bgLit(), 0, 0);
        papers(cc, LT, lt, t, b3); stacks(cc, LT, lt, b3, true); ledger(cc, LT, lt, t); signText(cc, LT, lt); objects(cc, LT, lt, b3);
        cc.fillStyle = `rgba(239,207,143,${clamp(0.09 * dens + 0.12 * pulse, 0, 0.4)})`; cc.fillRect(0, 0, W, H);
      });
      // ⑤ 影子网：光斑里透出背光墙——窗棂／电线杆／电线的硬影（几何剪影，避开账本）
      if (gq > 0.01) {
        const S = P.scratch('hop24S'), sg = S.getContext('2d'); sg.reset(); sg.clearRect(0, 0, W, H);
        sg.fillStyle = '#000';
        [[1240, 150, 36], [1080, 150, 32], [1210, 150, 22]].forEach(([x, y, w2]) => { poly(sg, [[x, y], [x + w2, y], [x + w2 - 124, 700], [x - 124, 700]]); sg.fill(); });   // 两道窗棂影＋电线杆影
        poly(sg, [[920, 338], [1300, 318], [1300, 350], [920, 370]]); sg.fill();       // 横棂影
        WIRES.forEach((w2, k) => { const q = ss(w2.t0, w2.t0 + 0.75, lt); if (q <= 0.01) return;
          const ang = w2.ang + 0.012 * Math.sin(t * 1.1 + k * 1.9) * (1 - b3);        // 卷参数期轻摆、拍三收稳
          const l = w2.len * q, dx = Math.cos(ang), dy = Math.sin(ang), ox = -dy * w2.w / 2, oy = dx * w2.w / 2;
          poly(sg, [[w2.x + ox, w2.y + oy], [w2.x + dx * l + ox, w2.y + dy * l + oy], [w2.x + dx * l - ox, w2.y + dy * l - oy], [w2.x - ox, w2.y - oy]]); sg.fill(); });
        sg.save(); const hole = new Path2D(); hole.rect(-40, -40, W + 80, H + 80); hole.rect(618, 128, 290, 220);   // 账本区镂空（影子不上账本）
        sg.globalCompositeOperation = 'source-in'; sg.drawImage(bgShade(), 0, 0);
        P.litClip(c, [wallP], (cc) => { cc.save(); cc.clip(hole, 'evenodd'); cc.drawImage(S, 0, 0); cc.restore(); });
        sg.restore();
      }
      // ⑥ 光体：灯池辉光、灯罩热点、窗外城市光晕、1T+ 账本涌亮
      c.save(); c.globalCompositeOperation = 'lighter';
      const pg = c.createRadialGradient(736, 738, 30, 736, 738, 330);                   // 灯池辉光（随呼吸/密度/重音）
      const pa = clamp(0.15 + 0.03 * Math.sin(t * 1.85) + 0.06 * dens + 0.10 * pulse + 0.06 * b3, 0, 0.5);
      pg.addColorStop(0, `rgba(244,214,150,${pa})`); pg.addColorStop(1, 'rgba(244,214,150,0)');
      c.fillStyle = pg; c.fillRect(380, 430, 760, 620);
      const hg = c.createRadialGradient(1000, 672, 4, 1000, 672, 96);                 // 灯罩下热点
      hg.addColorStop(0, `rgba(255,236,190,${0.55 + 0.1 * Math.sin(t * 1.85) + 0.15 * pulse})`); hg.addColorStop(1, 'rgba(255,236,190,0)');
      c.fillStyle = hg; c.fillRect(904, 576, 192, 192);
      if (dens > 0.01) { const wg2 = c.createRadialGradient(1300, 400, 60, 1300, 400, 520);   // 城市光晕（随密度、微晃、拍三收稳）
        const wa = clamp((0.10 + 0.12 * dens) * ss(3.15, 3.95, lt) * (1 + 0.05 * Math.sin(t * 7.3) * flick) + 0.22 * pulse, 0, 0.5);   // 光晕从零缓显，不整块砸入
        wg2.addColorStop(0, `rgba(239,207,143,${wa})`); wg2.addColorStop(1, 'rgba(239,207,143,0)');
        c.fillStyle = wg2; c.fillRect(780, 0, 1040, 920); }
      if (pulse > 0.02) { const lg2 = c.createRadialGradient(824, 238, 10, 824, 238, 210);   // 1T+ 账本一次涌亮
        lg2.addColorStop(0, `rgba(243,214,126,${0.5 * pulse})`); lg2.addColorStop(1, 'rgba(243,214,126,0)');
        c.fillStyle = lg2; c.fillRect(614, 28, 420, 420); }
      c.restore();
      // ⑦ 灯池浮尘（只在池内）
      c.save(); c.globalCompositeOperation = 'lighter';
      P.particles(22, 42, t, { x0: 440, x1: 1040, y0: 805, y1: 655, speed: 0, drift: 16, life: 7 }).forEach(p => {
        const q = (p.y - 688) / 114, lx = lerp(420, 384, q), rx = lerp(1012, 1130, clamp((p.y - 672) / 120, 0, 1));
        if (p.x < lx || p.x > rx) return;
        c.fillStyle = `rgba(255,240,200,${clamp(0.3 + 0.22 * Math.sin(t * 6 + p.i), 0, 1)})`;
        c.beginPath(); c.arc(p.x, p.y, 2.1 * p.s, 0, TAU); c.fill(); });
      c.restore();
      // ⑧ 秒针与刻度盘、卷帘拉绳轻摆
      handsAndDial(c, lt, t);
      c.save(); c.translate(1762, 217); c.rotate(Math.sin(t * 3.4) * 0.09);
      c.strokeStyle = '#7a5f3e'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 64); c.stroke();
      c.strokeStyle = '#d9c9a2'; c.lineWidth = 4; c.beginPath(); c.arc(0, 72, 7, 0, TAU); c.stroke(); c.restore();
      // ⑨ 油画拖笔（soft-light，若有若无）
      c.save(); c.globalCompositeOperation = 'soft-light'; c.globalAlpha = 0.18; c.drawImage(brush(), 0, 0); c.restore();
      c.restore();
    },
  };
})();
