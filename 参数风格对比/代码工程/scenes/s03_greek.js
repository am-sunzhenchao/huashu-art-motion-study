// 「大模型参数」× 阿提卡黑绘陶瓶（s03_greek）：纹带几何单元即参数本体——
// 拍一 0–3 近景：纹带上三颗参数单元（黑釉菱形/三环圆点/回纹方）带刻凿小数字 0.73、−1.2、2.4，
//   各自呼吸/明灭/走线收回，顶回纹带左缓滚、底莲苞链静置，缓推端详；
// 拍二 3–7 疯狂卷参数：经纬黑线织出织机网络，节点（菱形/圆点/圆环）从三颗母本一排排织出，
//   小帆船在网浪上起伏、海豚驮光点跃过经线，陶面板铭文计数 1.5B→175B→540B→1T+，
//   板内刻痕一行行凿出，回纹带反向加速滚，散点随档加密、整器微微加深，1T+ 揭示一道白光从左往右掠过全网（唯一重音）；缓拉远；
// 拍三 7–10 参数之外：增殖停住，三件黑绘剪影物从地线后升起（纸草书卷=数据、日晷=方法、油灯=算力）挂刻凿标签，
//   火苗摇曳、晷影缓转、节点描白点睛「变亮变精」，网波幅衰减收稳、里拉琴摆动渐止；停。
// 管线照 03_greek 配方卡：陶土底（低频斑驳+拉坯水平细纹+颗粒+边缘裂纹）缓存 → 回纹带/莲苞链滚动条带（缓存预渲、取模周期=真实周期）
//   → 每帧经纬线（正弦涟漪，拍三衰减）、节点、母本、船、海豚、计数板、三物、屏上字 → 暗角（缓存）最后盖。
// 黑绘三件套：黑釉剪影 C.black ＋刻线 C.inc ＋附加色（紫红 C.red 带＋白点 C.white）。
SCENES['s03_greek'] = (() => {
  const W = 1920, H = 1080, { clamp, lerp, ss, rng } = U, P = PAINT, TAU = Math.PI * 2;
  const C = {
    clay: '#dc6a2f', clayHi: '#e8803f', black: '#1b120d', red: '#8a2a37', white: '#f6ead6',
    inc: '#e8904c', resv: '#f3cfa4',
  };
  const line = (g, pts) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); };
  // smoothstep 的积分（速度分段平滑叠加 → 位移曲线不跳，纹带变速滚动用）
  const Sint = (a, b, t) => { if (t <= a) return 0; if (t >= b) return t - (a + b) / 2; const u = (t - a) / (b - a); return (b - a) * (u * u * u - u * u * u * u / 2); };

  // ---------------- ① 陶土底（缓存，照原版管线：480×270 低频斑驳放大 + 拉坯细纹 + 颗粒 + 边缘裂纹） ----------------
  function crack(g, pts, seed) {
    const r = rng(seed); g.save(); g.strokeStyle = 'rgba(52,18,6,.55)'; g.lineWidth = 1.3; g.lineJoin = 'round'; g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], n = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 9));
      for (let k = 1; k <= n; k++) g.lineTo(lerp(a[0], b[0], k / n) + (r() - .5) * 4, lerp(a[1], b[1], k / n) + (r() - .5) * 4); }
    g.stroke();
    g.strokeStyle = 'rgba(255,190,140,.18)'; g.translate(1, 1.2); g.stroke(); g.restore();
  }
  const bg = () => P.cached('sg3_bg', W, H, (g) => {
    const lw = 480, lh = 270, lo = P.canvas(lw, lh), lg = lo.getContext('2d'), img = lg.createImageData(lw, lh), d = img.data, b = P.hex(C.clay);
    for (let y = 0; y < lh; y++) for (let x = 0; x < lw; x++) {
      const n = P.fbm(x * 0.016 + 3, y * 0.016, 4), s = P.noise(x * 0.006, y * 0.85) * 0.6 + P.noise(x * 0.013 + 7, y * 0.4) * 0.4;
      const k = n * 30 + s * 9, i = (y * lw + x) * 4;
      d[i] = b[0] + k; d[i + 1] = b[1] + k * 0.75; d[i + 2] = b[2] + k * 0.45; d[i + 3] = 255;
    }
    lg.putImageData(img, 0, 0); g.imageSmoothingEnabled = true; g.drawImage(lo, 0, 0, W, H);
    const hl = g.createRadialGradient(980, 520, 60, 980, 520, 900); hl.addColorStop(0, 'rgba(255,170,90,.16)'); hl.addColorStop(1, 'rgba(255,170,90,0)');
    g.fillStyle = hl; g.fillRect(0, 0, W, H);
    const r = rng(31);
    for (let i = 0; i < 560; i++) { const y = r() * H, x = r() * W - 300, L = 150 + r() * 900;
      g.strokeStyle = r() < 0.55 ? 'rgba(120,38,8,' + (0.03 + r() * 0.05) + ')' : 'rgba(255,196,140,' + (0.03 + r() * 0.05) + ')'; g.lineWidth = 0.7 + r() * 1.8;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + L, y + (r() - .5) * 2); g.stroke(); }
    for (let i = 0; i < 420; i++) { g.fillStyle = 'rgba(70,24,8,' + (0.25 + r() * 0.45) + ')'; g.beginPath(); g.arc(r() * W, r() * H, 0.6 + r() * 1.6, 0, TAU); g.fill(); }
    for (let i = 0; i < 120; i++) { g.fillStyle = 'rgba(255,205,160,' + (0.2 + r() * 0.3) + ')'; g.beginPath(); g.arc(r() * W, r() * H, 0.6 + r() * 1.2, 0, TAU); g.fill(); }
    g.drawImage(P.grain('sg3_grainA', 0.07, [70, 22, 6], 0.16), 0, 0); g.drawImage(P.grain('sg3_grainBB', 0.04, [255, 214, 170], 0.12), 0, 0);
    crack(g, [[1884, 130], [1830, 330], [1858, 520], [1806, 700]], 3);
    crack(g, [[36, 700], [66, 830], [28, 975]], 4);
    crack(g, [[1480, 1012], [1620, 990], [1786, 1002]], 5);
  });
  const vig = () => P.cached('sg3_vig', W, H, (g) => {
    const v = g.createRadialGradient(960, 540, 380, 960, 540, 1180); v.addColorStop(0, 'rgba(40,10,0,0)'); v.addColorStop(1, 'rgba(30,6,0,.62)');
    g.fillStyle = v; g.fillRect(0, 0, W, H);
  });

  // ---------------- ② 滚动纹带（缓存预渲；周期 = 图案真实周期：回纹 60、莲苞链 76＝两个 38 单元） ----------------
  const TOP_P = 60, BOT_P = 76;
  const topStrip = () => P.cached('sg3_top', W + TOP_P * 2, 60, (g) => {
    g.strokeStyle = C.black; g.lineWidth = 7; g.lineCap = 'square'; g.lineJoin = 'miter';
    const y0 = 6, h = 46;
    g.beginPath(); g.moveTo(0, y0 + h); g.lineTo(W + TOP_P * 2, y0 + h); g.stroke();
    for (let x = 0; x < W + TOP_P * 2; x += TOP_P) {
      line(g, [[x + 4, y0 + h], [x + 4, y0], [x + 50, y0], [x + 50, y0 + 34], [x + 18, y0 + 34], [x + 18, y0 + 14], [x + 36, y0 + 14], [x + 36, y0 + 22]]); g.stroke();
    }
  });
  const botStrip = () => P.cached('sg3_bot', W + BOT_P * 2, 150, (g) => {
    const Y = 930;
    g.fillStyle = C.black; g.fillRect(0, 934 - Y, W + BOT_P * 2, 4); g.fillRect(0, 996 - Y, W + BOT_P * 2, 6); g.fillRect(0, 1072 - Y, W + BOT_P * 2, 8);
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (let i = 0, x = 0; x < W + BOT_P * 2; i++, x += BOT_P / 2) {
      g.strokeStyle = C.black; g.lineWidth = 2.6; g.beginPath(); g.moveTo(x, 946 - Y); g.quadraticCurveTo(x + 19, 962 - Y, x + 38, 946 - Y); g.stroke();
      const bud = new Path2D(); bud.moveTo(x, 948 - Y); bud.bezierCurveTo(x + 11, 954 - Y, x + 10, 972 - Y, x, 988 - Y); bud.bezierCurveTo(x - 10, 972 - Y, x - 11, 954 - Y, x, 948 - Y);
      g.fillStyle = i % 2 ? C.red : C.black; g.fill(bud); g.strokeStyle = C.black; g.lineWidth = 2.4; g.stroke(bud);
      if (i % 2) { g.strokeStyle = C.black; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x, 953 - Y); g.lineTo(x, 982 - Y); g.stroke(); }
      g.fillStyle = C.black; g.beginPath(); g.arc(x + 19, 972 - Y, 2.6, 0, TAU); g.fill();
      g.beginPath(); g.moveTo(x - 17, 1074 - Y); g.lineTo(x + 2, 1008 - Y); g.lineTo(x + 21, 1074 - Y); g.fill();
    }
  });
  const rim = (c) => {                       // 口沿深色 + 黑条 + 地线（每帧几笔）
    const tg = c.createLinearGradient(0, 0, 0, 24); tg.addColorStop(0, 'rgba(18,10,6,.95)'); tg.addColorStop(1, 'rgba(26,14,8,.85)');
    c.fillStyle = tg; c.fillRect(0, 0, W, 21); c.fillStyle = C.black; c.fillRect(0, 24, W, 4); c.fillRect(0, 86, W, 5); c.fillRect(0, 899, W, 6);
  };

  // ---------------- ③ 织机网络几何：经线（竖 14 条）×纬线（横 5 条）；三颗母本挂在中纬线上 ----------------
  const WARP = []; for (let x = 460; x <= 1760; x += 100) WARP.push(x);
  const WEFT = [330, 435, 540, 645, 750];
  const NX0 = 420, NX1 = 1780;
  // 纬线涟漪/经线微摆（拍二起涟、拍三衰减收稳；相位随 lt 走，确定性）
  const rippA = (lt) => 5.5 * (0.35 + 0.65 * ss(3.6, 5.2, lt)) * (1 - 0.78 * ss(7.2, 9.2, lt));
  const ripple = (x, lt) => rippA(lt) * Math.sin(x * 0.021 + lt * 2.6);
  const swayA = (lt) => 2.1 * (0.3 + 0.7 * ss(3.6, 5.2, lt)) * (1 - 0.75 * ss(7.2, 9.2, lt));
  const sway = (y, lt) => swayA(lt) * Math.sin(y * 0.03 + 1.7 + lt * 1.9);

  // 节点（网眼上的参数单元；从三颗母本向外一排排织出，紫红为附加色）
  const MOMX = [660, 960, 1260];
  const NODES = (() => {
    const r = rng(42), out = [];
    WARP.forEach((x) => WEFT.forEach((y) => {
      if (y === 540 && MOMX.indexOf(x) >= 0) return;
      const k = r(), dist = Math.abs(x - 960) / 800 * 0.55 + Math.abs(y - 540) / 210 * 0.45;
      out.push({ x, y, ty: k < 0.4 ? 'loz' : k < 0.72 ? 'dot' : 'ring', red: r() < 0.18, white: r() < 0.4,
        s: 0.78 + r() * 0.3, at: 3.42 + 2.2 * dist + 0.55 * r(), ph: r() * 6, wg: r() });
    }));
    return out;
  })();
  // 密度升级的小散点（拍二随档加密；拍三描白点睛）
  const MDOTS = (() => {
    const r = rng(77), out = [];
    for (let i = 0; i < 64; i++) {
      const nx = r(); out.push({ x: NX0 + 60 + nx * (NX1 - NX0 - 120), y: 310 + r() * 460, r: 1.8 + r() * 1.6,
        red: r() < 0.22, at: 4.9 + 1.5 * r() + 0.3 * nx, ph: r() * 6 });
    }
    return out;
  })();
  // 拍一四周散的小参数（纹带饰点；呼吸/明灭小循环）
  const SCAT = (() => {
    const r = rng(515);
    const spots = [[152, 440], [258, 545], [170, 660], [300, 775], [132, 856], [1748, 470], [1778, 622], [1715, 782], [1352, 258], [1544, 292], [1722, 244], [562, 838], [860, 826], [1652, 842]];
    return spots.map(([x, y]) => { const k = r();
      return { x: x + (r() - .5) * 10, y: y + (r() - .5) * 10, ty: k < 0.4 ? 'loz' : k < 0.7 ? 'dot' : 'ring',
        s: 0.8 + r() * 0.45, red: r() < 0.3, white: r() < 0.55, ph: r() * 6, at: r() < 0.5 ? 0 : 0.08 + r() * 0.4 }; });
  })();

  // ---------------- ④ 三颗母本参数单元（拍一被放大端详；黑剪影+刻线+附加色） ----------------
  const NUMS = ['0.73', '-1.2', '2.4'];      // init 里若 Cinzel 有「−」则换 U+2212
  const MOMS = [
    { x: 660, y: 540, kind: 'loz', num: 0, at: 0.5, ph: 0.7 },
    { x: 960, y: 540, kind: 'ring', num: 1, at: 0.95, ph: 2.9 },
    { x: 1260, y: 540, kind: 'mea', num: 2, at: 1.4, ph: 4.5 },
  ];
  // 回纹方：单元折线（原版回纹折线按 132 方盒缩放居中）与总长（dash 走线用）
  const MEA = (() => {
    const sc = 112 / 60, pts = [[4, 52], [4, 6], [50, 6], [50, 40], [18, 40], [18, 20], [36, 20], [36, 28]]
      .map(p => [p[0] * sc - 56, p[1] * sc - 56]);
    let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    return { pts, len };
  })();
  const carve = (g, txt, x, y, size, font) => {   // 刻凿铭文：浅亮下缘偏移 + 主体（陶上凿字的味道）
    g.font = size + 'px "' + font + '"'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.fillStyle = 'rgba(243,207,164,.5)'; g.fillText(txt, x + 1.8, y + 1.8);
    g.fillStyle = C.black; g.fillText(txt, x, y);
  };
  function momDraw(g, lt, t) {
    MOMS.forEach((m) => {
      const br = 1 + 0.035 * Math.sin(lt * TAU / 1.15 + m.ph);          // 呼吸涨落
      const pop = 1 + 0.05 * ss(m.at - 0.06, m.at + 0.3, lt) * (1 - ss(m.at + 0.3, m.at + 0.75, lt));   // 端详时轻推一下
      const hl3 = ss(8.25, 8.9, lt);                                     // 拍三描白点睛
      g.save(); g.translate(m.x, m.y); g.scale(br * pop, br * pop); g.lineJoin = 'round'; g.lineCap = 'round';
      const flick = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * 4.2 + m.ph)); // 白点明灭
      if (m.kind === 'loz') {                                            // 黑釉大菱形
        const dia = (hw, hh) => { const p = new Path2D(); p.moveTo(0, -hh); p.lineTo(hw, 0); p.lineTo(0, hh); p.lineTo(-hw, 0); p.closePath(); return p; };
        g.fillStyle = C.black; g.fill(dia(84, 84));
        g.strokeStyle = C.inc; g.lineWidth = 2.6; g.stroke(dia(66, 66));
        g.fillStyle = C.red; g.fill(dia(21, 21));
        g.fillStyle = 'rgba(246,234,214,' + (flick * (0.75 + 0.25 * hl3)).toFixed(3) + ')'; g.beginPath(); g.arc(0, 0, 5.2, 0, TAU); g.fill();
        [-46, 46].forEach((sx) => [-46, 46].forEach((sy) => { g.fillStyle = C.white; g.beginPath(); g.arc(sx, sy, 2.4, 0, TAU); g.fill(); }));
      } else if (m.kind === 'ring') {                                    // 三环圆点（涟漪式呼吸）
        const w1 = Math.sin(lt * TAU / 1.3 + m.ph), w2 = Math.sin(lt * TAU / 1.3 + m.ph + 1.1);
        g.strokeStyle = C.black; g.lineWidth = 13; g.beginPath(); g.arc(0, 0, 78 + 5 * w1, 0, TAU); g.stroke();
        g.strokeStyle = C.red; g.lineWidth = 9; g.beginPath(); g.arc(0, 0, 54 + 3.5 * w2, 0, TAU); g.stroke();
        g.strokeStyle = C.inc; g.lineWidth = 4; g.beginPath(); g.arc(0, 0, 31 + 2 * w1, 0, TAU); g.stroke();
        g.fillStyle = 'rgba(246,234,214,' + (flick * (0.75 + 0.25 * hl3)).toFixed(3) + ')'; g.beginPath(); g.arc(0, 0, 8, 0, TAU); g.fill();
      } else {                                                            // 回纹方：刻线慢慢走线又收回
        g.fillStyle = C.black; g.fillRect(-66, -66, 132, 132);
        const ph = (lt % 2.9) / 2.9, q = ph < 0.45 ? ss(0, 1, ph / 0.45) : ph < 0.58 ? 1 : 1 - ss(0, 1, (ph - 0.58) / 0.42);
        g.strokeStyle = C.inc; g.lineWidth = 6.5; g.lineCap = 'square'; g.lineJoin = 'miter';
        g.setLineDash([Math.max(0.01, MEA.len * q), 99999]); line(g, MEA.pts); g.stroke(); g.setLineDash([]);
        g.fillStyle = C.white; [[-56, -56], [56, -56], [-56, 56], [56, 56]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 2.6, 0, TAU); g.fill(); });
        g.fillStyle = C.red; g.beginPath(); g.arc(11.3, -3.6, 4.5, 0, TAU); g.fill();
      }
      g.restore();
      if (hl3 > 0) {                                                     // 拍三白点睛环（变亮变精）
        g.save(); g.globalAlpha = hl3 * (0.42 + 0.22 * Math.sin(t * 2.6 + m.ph)); g.strokeStyle = C.white; g.lineWidth = 2.4;
        g.beginPath(); g.ellipse(m.x, m.y, 100, 88, 0, 0, TAU); g.stroke(); g.restore();
      }
      const na = ss(m.at + 0.18, m.at + 0.55, lt);                       // 刻凿小数字（带端详时刻）
      if (na > 0) {
        const p2 = na < 1 ? 1 + 0.14 * (1 - na) * Math.sin(na * Math.PI) : 1;
        g.save(); g.globalAlpha = na; g.translate(m.x, 700); g.scale(p2, p2);
        carve(g, NUMS[m.num], 0, 0, 44, 'Cinzel-400');
        g.strokeStyle = C.black; g.lineWidth = 2.5; g.lineCap = 'round';
        const uq = ss(m.at + 0.25, m.at + 0.62, lt);
        g.beginPath(); g.moveTo(-78 - 26 * uq, 16); g.lineTo(-46, 14); g.moveTo(46, 14); g.lineTo(78 + 26 * uq, 16); g.stroke();
        g.restore();
      }
    });
  }

  // ---------------- ⑤ 陶面板铭文计数板：1.5B → 175B → 540B → 1T+（数字滚动＋刻痕一行行凿出） ----------------
  const BD = { x0: 700, y0: 118, x1: 1220, y1: 282 };
  function counterVal(t) {
    if (t < 3.15) return null;
    if (t < 3.45) return 1.5e9;
    if (t < 4.1) return 1.5e9 * Math.pow(175e9 / 1.5e9, ss(3.45, 4.1, t));
    if (t < 4.45) return 175e9;
    if (t < 5.1) return 175e9 * Math.pow(540e9 / 175e9, ss(4.45, 5.1, t));
    if (t < 5.5) return 540e9;
    if (t < 6.45) return 540e9 * Math.pow(1.02e12 / 540e9, ss(5.5, 6.45, t));
    return 1.02e12;
  }
  const counterTxt = (v) => { if (v >= 1e12) return '1T+'; const b = v / 1e9; return (b >= 99.95 ? String(Math.round(b)) : (Math.round(b * 10) / 10).toFixed(1)) + 'B'; };
  const TALLY_AT = [3.5, 3.52, 4.6, 5.55, 6.5];
  function boardDraw(g, lt, t) {
    const gate = ss(3.15, 3.4, lt) * (1 - ss(7.0, 7.45, lt));
    if (gate <= 0.004) return;
    g.save(); g.globalAlpha = gate; g.lineJoin = 'round';
    g.fillStyle = C.clayHi; g.fillRect(BD.x0, BD.y0, BD.x1 - BD.x0, BD.y1 - BD.y0);
    const cs = [[BD.x0, BD.y0], [BD.x1, BD.y0], [BD.x1, BD.y1], [BD.x0, BD.y1], [BD.x0, BD.y0]];
    const fp = new Path2D(), done = Math.min(4, ss(3.15, 3.55, lt) * 4);       // 四边依次凿出
    for (let i = 0; i < 4; i++) { const q = clamp(done - i, 0, 1); if (q <= 0) break;
      fp.moveTo(cs[i][0], cs[i][1]); fp.lineTo(lerp(cs[i][0], cs[i + 1][0], q), lerp(cs[i][1], cs[i + 1][1], q)); }
    g.strokeStyle = C.black; g.lineWidth = 3.2; g.stroke(fp);
    g.fillStyle = C.red; g.fillRect(BD.x0 + 8, BD.y0 + 8, BD.x1 - BD.x0 - 16, 7);      // 附加色：紫红带＋白点
    for (let x = BD.x0 + 18; x < BD.x1 - 12; x += 24) { g.fillStyle = C.white; g.beginPath(); g.arc(x, BD.y0 + 11.5, 2, 0, TAU); g.fill(); }
    // 刻痕（每过一档新凿一组）
    TALLY_AT.forEach((at, k) => {
      const q = ss(at, at + 0.26, lt); if (q <= 0) return;
      const gx = BD.x0 + 96 + k * 64;
      g.strokeStyle = C.black; g.lineWidth = 3.4; g.lineCap = 'round';
      for (let s = 0; s < 4; s++) { g.beginPath(); g.moveTo(gx + s * 7.5, 266); g.lineTo(gx + s * 7.5, 266 - 20 * q); g.stroke(); }
      if (q > 0.5) { g.beginPath(); g.moveTo(gx - 7, 263 - 8 * q); g.lineTo(gx + 30, 248); g.stroke(); }
    });
    const v = counterVal(lt);
    if (v !== null) {
      const big = v >= 1e12, pop = big ? 1 + 0.1 * ss(6.42, 6.56, lt) * (1 - ss(6.72, 7.15, lt)) : 1;
      g.save(); g.translate(960, 224); g.scale(pop, pop);
      g.font = '92px "Cinzel-700"'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      g.fillStyle = big ? C.red : 'rgba(243,207,164,.5)'; g.fillText(counterTxt(v), 2.2, 2.2);
      if (big) { g.shadowColor = 'rgba(246,234,214,.55)'; g.shadowBlur = 10; }
      g.fillStyle = big ? C.white : C.black; g.fillText(counterTxt(v), 0, 0);
      g.restore();
    }
    g.restore();
  }

  // ---------------- ⑥ 小帆船（织网当海：网浪上起伏；无人物） ----------------
  function boatDraw(g, lt, t) {
    const a = ss(3.5, 4.0, lt); if (a <= 0.004) return;
    const damp = 1 - 0.45 * ss(7.2, 8.6, lt);
    const bob = 5 * damp * Math.sin(lt * TAU / 0.95), tilt = 0.028 * damp * Math.cos(lt * TAU / 0.95);
    g.save(); g.globalAlpha = a;
    g.translate(1355 + 70 * ss(3.5, 6.8, lt), 700 + bob); g.rotate(tilt); g.scale(-0.52, 0.52); g.lineJoin = 'round'; g.lineCap = 'round';
    g.strokeStyle = C.black; g.lineWidth = 1.6; line(g, [[-116, -41], [-156, 53]]); g.stroke(); line(g, [[88, -41], [126, 49]]); g.stroke();
    g.lineWidth = 4.5; line(g, [[-14, -129], [-14, 57]]); g.stroke();
    const sail = new Path2D(); sail.moveTo(-116, -133); sail.lineTo(88, -133); sail.quadraticCurveTo(98, -85, 88, -39);
    sail.quadraticCurveTo(-14, -31, -116, -39); sail.quadraticCurveTo(-126, -85, -116, -133);
    g.fillStyle = C.white; g.fill(sail); g.lineWidth = 2.6; g.strokeStyle = C.black; g.stroke(sail);
    g.strokeStyle = C.red; g.lineWidth = 1.6; [-74, -34, 8, 48].forEach((x) => { g.beginPath(); g.moveTo(x, -131); g.lineTo(x + 1, -37); g.stroke(); });
    g.strokeStyle = C.black; g.lineWidth = 6; line(g, [[-128, -135], [100, -135]]); g.stroke();
    g.fillStyle = C.black; g.beginPath(); g.moveTo(-170, 57); g.quadraticCurveTo(-144, 51, -104, 55); g.lineTo(116, 49);
    g.quadraticCurveTo(138, 27, 138, -13); g.quadraticCurveTo(134, -31, 122, -27); g.quadraticCurveTo(144, -43, 154, -17);
    g.quadraticCurveTo(160, 41, 126, 77); g.quadraticCurveTo(26, 109, -104, 97); g.quadraticCurveTo(-146, 87, -170, 57); g.fill();
    g.fillStyle = C.red; g.beginPath(); g.moveTo(-104, 67); g.lineTo(116, 61); g.quadraticCurveTo(26, 81, -104, 79); g.closePath(); g.fill();
    g.strokeStyle = C.inc; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-134, 83); g.quadraticCurveTo(-14, 101, 126, 71); g.stroke();
    g.fillStyle = C.white; g.beginPath(); g.arc(-146, 61, 3, 0, TAU); g.fill();
    g.restore();
  }

  // ---------------- ⑦ 海豚（跃过经线的参数包：驮一颗光点；循环出画入画用透明包边防跳变） ----------------
  function dolphin(g, x, y, ang, s) {
    g.save(); g.translate(x, y); g.rotate(ang); g.scale(s, s); g.fillStyle = C.black;
    g.beginPath(); g.moveTo(34, 1); g.quadraticCurveTo(28, -4, 22, -6); g.bezierCurveTo(10, -13, -12, -12, -26, -4);
    g.lineTo(-38, -12); g.lineTo(-34, 0); g.lineTo(-38, 12); g.lineTo(-26, 4); g.bezierCurveTo(-10, 10, 10, 10, 22, 5); g.quadraticCurveTo(28, 4, 34, 1); g.fill();
    g.beginPath(); g.moveTo(-2, -10); g.quadraticCurveTo(-10, -22, -16, -21); g.lineTo(-12, -9); g.fill();
    g.beginPath(); g.moveTo(4, 7); g.lineTo(-4, 16); g.lineTo(-8, 8); g.fill();
    g.strokeStyle = C.inc; g.lineWidth = 1.4; g.beginPath(); g.moveTo(22, 2); g.bezierCurveTo(8, 6, -10, 5, -24, 1); g.stroke();
    g.fillStyle = C.white; g.beginPath(); g.arc(18, -3, 1.8, 0, TAU); g.fill();
    g.restore();
  }
  function dolphinDraw(g, lt, t) {
    const a0 = ss(3.7, 4.05, lt); if (a0 <= 0.004) return;
    const T = 3.2 + 1.6 * ss(7.2, 8.4, lt);
    const f = (((lt - 3.7) / T) % 1 + 1) % 1;
    const env = ss(0.02, 0.1, f) * (1 - ss(0.9, 0.985, f)) * a0;
    if (env <= 0.01) return;
    const amp = 200 * (1 - 0.45 * ss(7.2, 8.4, lt));
    const x = 560 + 1160 * f, y = 790 - amp * Math.sin(Math.PI * f);
    const ang = Math.atan2(-amp * Math.cos(Math.PI * f) * Math.PI / T, 1160 / T);
    g.save(); g.globalAlpha = env;
    const gl = g.createRadialGradient(x, y, 4, x, y, 46);                      // 驮的光点
    gl.addColorStop(0, 'rgba(255,236,200,.5)'); gl.addColorStop(1, 'rgba(255,220,160,0)');
    g.fillStyle = gl; g.beginPath(); g.arc(x, y, 46, 0, TAU); g.fill();
    dolphin(g, x, y, ang, 1.15);
    g.save(); g.translate(x, y); g.rotate(ang);
    g.fillStyle = C.white; g.beginPath(); g.arc(-8, -14, 5, 0, TAU); g.fill(); g.restore();
    g.restore();
  }

  // ---------------- ⑧ 里拉琴（钉轴小摆，拍三渐止） ----------------
  function lyreDraw(g, lt, t) {
    const a = 0.09 * Math.sin(lt * TAU / 0.8 + 0.5) * (1 - 0.75 * ss(8.4, 9.4, lt));
    g.save(); g.translate(330, 235); g.rotate(a); g.scale(0.62, 0.62); g.lineJoin = 'round'; g.lineCap = 'round';
    g.strokeStyle = C.red; g.lineWidth = 2.4; line(g, [[-64, 64], [0, 0], [62, 60]]); g.stroke();
    g.strokeStyle = C.black; g.lineWidth = 8; g.beginPath(); g.moveTo(-46, 176); g.quadraticCurveTo(-90, 120, -60, 50); g.stroke();
    g.beginPath(); g.moveTo(-16, 176); g.quadraticCurveTo(30, 122, 54, 54); g.stroke();
    g.lineWidth = 7; line(g, [[-72, 64], [66, 62]]); g.stroke();
    g.fillStyle = C.black; [[-74, 64], [68, 62]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 6, 0, TAU); g.fill(); });
    g.strokeStyle = C.inc; g.lineWidth = 1.5; for (let k = 0; k < 7; k++) { g.beginPath(); g.moveTo(-50 + k * 14, 64); g.lineTo(-42 + k * 3.6, 172); g.stroke(); }
    g.fillStyle = C.black; g.beginPath(); g.arc(-31, 206, 44, 0, TAU); g.fill();
    g.strokeStyle = C.inc; g.lineWidth = 1.6; g.beginPath(); g.arc(-31, 206, 37, 0, TAU); g.stroke();
    g.beginPath(); g.arc(-31, 182, 8, 0.1, Math.PI - 0.1); g.stroke();
    [[-31, 210], [-46, 202], [-16, 202], [-42, 222], [-20, 222]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 6.5, 0, TAU); g.stroke(); });
    g.restore();
    g.fillStyle = C.black; g.beginPath(); g.arc(330, 235, 5, 0, TAU); g.fill();
  }

  // ---------------- ⑨ 拍三三件黑绘剪影物（从地线后升起挂标签）＋ 屏上字 ----------------
  function tagDraw(g, x, topY, txt, q) {
    if (q <= 0) return;
    g.save(); g.globalAlpha = Math.min(1, q * 1.5);
    g.strokeStyle = C.black; g.lineWidth = 2; g.beginPath(); g.moveTo(x, topY - 12); g.lineTo(x, topY); g.stroke();
    const dy = (1 - q) * 10;
    g.fillStyle = C.clayHi; g.fillRect(x - 34, topY + dy, 68, 34);
    g.strokeStyle = C.black; g.lineWidth = 2; g.strokeRect(x - 34, topY + dy, 68, 34);
    g.fillStyle = C.red; g.fillRect(x - 34, topY + dy, 68, 4);
    g.font = '26px "LXGWWenKai-500"'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.fillStyle = 'rgba(243,207,164,.45)'; g.fillText(txt, x + 1.2, topY + dy + 26 + 1.2);
    g.fillStyle = C.black; g.fillText(txt, x, topY + dy + 26);
    g.restore();
  }
  function objectsDraw(g, lt, t) {
    g.save(); g.beginPath(); g.rect(0, 0, W, 899); g.clip(); g.lineJoin = 'round'; g.lineCap = 'round';
    // 纸草书卷（数据）
    const q1 = ss(7.05, 7.65, lt);
    if (q1 > 0) {
      g.save(); g.globalAlpha = Math.min(1, q1 * 1.4); g.translate(0, (1 - q1) * 130);
      g.fillStyle = C.black; g.fillRect(352, 698, 20, 128); g.fillRect(628, 698, 20, 128);   // 两根卷轴杆
      g.fillStyle = C.red; g.fillRect(349, 694, 26, 10); g.fillRect(625, 694, 26, 10); g.fillRect(349, 820, 26, 10); g.fillRect(625, 820, 26, 10);
      g.fillStyle = C.black; g.fillRect(372, 734, 256, 62);                                    // 展开的书页
      g.strokeStyle = C.inc; g.lineWidth = 2; [746, 760, 774].forEach((y) => { g.beginPath(); g.moveTo(380, y); g.lineTo(620, y); g.stroke(); });
      g.fillStyle = C.red; g.fillRect(494, 734, 12, 62);                                       // 紫红系带＋白点
      g.fillStyle = C.white; g.beginPath(); g.arc(500, 752, 2.6, 0, TAU); g.fill(); g.beginPath(); g.arc(500, 778, 2.6, 0, TAU); g.fill();
      g.restore();
      tagDraw(g, 500, 820, '数据', ss(8.35, 8.75, lt));
    }
    // 日晷（方法；晷影缓转）
    const q2 = ss(7.45, 8.05, lt);
    if (q2 > 0) {
      g.save(); g.globalAlpha = Math.min(1, q2 * 1.4); g.translate(0, (1 - q2) * 130);
      g.fillStyle = C.black; g.beginPath(); g.ellipse(960, 788, 105, 32, 0, 0, TAU); g.fill();   // 晷盘
      const phi = -0.55 + 0.75 * ss(7.6, 9.7, lt);                                                // 晷影（陶色刻在黑盘上）
      g.save(); g.beginPath(); g.ellipse(960, 788, 100, 29, 0, 0, TAU); g.clip();
      g.fillStyle = C.clay; g.beginPath(); g.moveTo(960, 788);
      g.lineTo(960 + Math.cos(phi - 0.09) * 150, 788 + Math.sin(phi - 0.09) * 44);
      g.lineTo(960 + Math.cos(phi + 0.09) * 150, 788 + Math.sin(phi + 0.09) * 44); g.closePath(); g.fill();
      g.restore();
      g.strokeStyle = C.inc; g.lineWidth = 1.8; g.beginPath(); g.ellipse(960, 788, 88, 26, 0, 0, TAU); g.stroke();
      for (let k = 0; k < 9; k++) { const a = -Math.PI / 2 + k / 8 * Math.PI;                     // 时位刻线
        g.beginPath(); g.moveTo(960 + Math.cos(a) * 84, 788 + Math.sin(a) * 25); g.lineTo(960 + Math.cos(a) * 98, 788 + Math.sin(a) * 29); g.stroke(); }
      g.strokeStyle = C.red; g.lineWidth = 3; g.beginPath(); g.ellipse(960, 788, 105, 32, 0, 0, TAU); g.stroke();
      g.fillStyle = C.black; g.beginPath(); g.moveTo(960, 788); g.lineTo(960, 712); g.lineTo(1014, 788); g.closePath(); g.fill();   // 晷针
      g.strokeStyle = C.inc; g.lineWidth = 1.6; g.beginPath(); g.moveTo(966, 782); g.lineTo(966, 722); g.stroke();
      g.fillStyle = C.white; [[880, 806], [960, 812], [1040, 806]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 2.4, 0, TAU); g.fill(); });
      g.restore();
      tagDraw(g, 960, 824, '方法', ss(8.55, 8.95, lt));
    }
    // 油灯（算力；火苗摇曳）
    const q3 = ss(7.85, 8.45, lt);
    if (q3 > 0) {
      g.save(); g.globalAlpha = Math.min(1, q3 * 1.4); g.translate(0, (1 - q3) * 130);
      const h = 40 * (0.9 + 0.16 * Math.sin(t * 7 + 1) + 0.07 * Math.sin(t * 13)), sw = 3.2 * Math.sin(t * 5.3);
      const gl = g.createRadialGradient(1516, 720 - h * 0.6, 4, 1516, 720 - h * 0.6, 96);        // 火光（变亮）
      gl.addColorStop(0, 'rgba(255,200,110,' + (0.13 + 0.05 * Math.sin(t * 2.6)).toFixed(3) + ')'); gl.addColorStop(1, 'rgba(255,180,90,0)');
      g.fillStyle = gl; g.fillRect(1420, 600, 200, 260);
      g.fillStyle = C.red;                                                                        // 外焰
      g.beginPath(); g.moveTo(1506, 738); g.quadraticCurveTo(1498, 738 - h * 0.55, 1516 + sw, 738 - h);
      g.quadraticCurveTo(1530, 738 - h * 0.5, 1526, 738); g.closePath(); g.fill();
      g.fillStyle = C.white;                                                                      // 内焰白心
      g.beginPath(); g.moveTo(1510, 738); g.quadraticCurveTo(1507, 738 - h * 0.35, 1516 + sw * 0.6, 738 - h * 0.62);
      g.quadraticCurveTo(1522, 738 - h * 0.32, 1522, 738); g.closePath(); g.fill();
      g.fillStyle = C.black; g.beginPath(); g.ellipse(1420, 762, 72, 34, 0, 0, TAU); g.fill();     // 灯身
      g.beginPath(); g.moveTo(1470, 748); g.lineTo(1512, 736); g.lineTo(1504, 758); g.lineTo(1466, 762); g.closePath(); g.fill();  // 长嘴
      g.strokeStyle = C.black; g.lineWidth = 11; g.beginPath(); g.arc(1344, 758, 21, 0, TAU); g.stroke();                          // 提环
      g.save(); g.beginPath(); g.ellipse(1420, 762, 72, 34, 0, 0, TAU); g.clip();
      g.fillStyle = C.red; g.fillRect(1348, 774, 144, 11);                                       // 紫红带＋白点
      g.fillStyle = C.white; [1380, 1412, 1444, 1476].forEach((x) => { g.beginPath(); g.arc(x, 779.5, 2.2, 0, TAU); g.fill(); });
      g.strokeStyle = C.inc; g.lineWidth = 1.6; g.beginPath(); g.moveTo(1352, 748); g.quadraticCurveTo(1420, 730, 1488, 748); g.stroke();
      g.restore();
      g.fillStyle = C.black; g.beginPath(); g.moveTo(1404, 796); g.lineTo(1436, 796); g.lineTo(1428, 816); g.lineTo(1412, 816); g.closePath(); g.fill();  // 灯足
      g.restore();
      tagDraw(g, 1420, 824, '算力', ss(8.75, 9.15, lt));
    }
    g.restore();
  }
  // 屏上字（右上铭文：黑釉字＋浅亮凿缘＋紫红底线白点；每拍 ≤8 字）
  const TT = [['参数', 0, 150], ['疯狂卷参数', 3, 312], ['参数之外', 7, 244]];
  function titleDraw(g, lt, t) {
    for (let k = 0; k < 3; k++) {
      const t0 = TT[k][1], a = ss(t0 + 0.35, t0 + 0.95, lt) * (k < 2 ? 1 - ss(t0 + 2.95, t0 + 3.3, lt) : 1);
      if (a <= 0.004) continue;
      g.save(); g.globalAlpha = a; g.lineJoin = 'round';
      g.font = '54px "LXGWWenKai-500"'; g.letterSpacing = '6px'; g.textAlign = 'right'; g.textBaseline = 'alphabetic';
      g.fillStyle = 'rgba(243,207,164,.5)'; g.fillText(TT[k][0], 1790 + 1.6, 168 + 1.6);
      g.fillStyle = C.black; g.fillText(TT[k][0], 1790, 168);
      g.letterSpacing = '0px';
      const uq = ss(t0 + 0.5, t0 + 1.1, lt);
      if (uq > 0) {
        g.strokeStyle = C.red; g.lineWidth = 3; g.beginPath(); g.moveTo(1790 - TT[k][2] * uq, 194); g.lineTo(1790, 192); g.stroke();
        g.fillStyle = C.white;
        [-0.25, -0.5, -0.75].forEach((o) => { const x = 1790 + TT[k][2] * o * uq; g.beginPath(); g.arc(x, 193, 2.2, 0, TAU); g.fill(); });
      }
      g.restore();
    }
  }

  // ---------------- ⑩ 织机网络（经纬线织出＋节点一排排织出＋拍三描白点睛）＋ 散点 ----------------
  function netDraw(g, lt, t, sw) {
    // 纬线（从中线向两端织出；拍二起正弦涟漪，拍三衰减）
    WEFT.forEach((wy, j) => {
      const rw = ss(3.22 + j * 0.13, 3.98 + j * 0.13, lt); if (rw <= 0) return;
      const half = (NX1 - NX0) / 2 * rw;
      g.strokeStyle = C.black; g.lineWidth = 3; g.beginPath();
      for (let i = 0; i <= 30; i++) { const x = 960 - half + (2 * half) * i / 30, y = wy + ripple(x, lt); i ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
    });
    // 经线（自上而下垂入）
    WARP.forEach((wx, i) => {
      const rv = ss(3.18 + i * 0.05, 3.88 + i * 0.05, lt); if (rv <= 0) return;
      g.strokeStyle = C.black; g.lineWidth = 2.6; g.beginPath();
      for (let k = 0; k <= 12; k++) { const y = 330 + 420 * k / 12, x = wx + sway(y, lt); k ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
    });
    // 节点（菱形/圆点/圆环；走线跟随涟漪与微摆）
    const hl3 = ss(8.15, 8.95, lt);
    NODES.forEach((n) => {
      const q = ss(n.at, n.at + 0.38, lt); if (q <= 0) return;
      const s = n.s * (q < 1 ? U.ease.outBack(q) : 1);
      const nx = n.x + sway(n.y, lt), ny = n.y + ripple(n.x, lt);
      const col = n.red ? C.red : C.black;
      g.strokeStyle = col; g.fillStyle = col;
      if (n.ty === 'loz') { g.save(); g.translate(nx, ny); g.scale(s, s); g.beginPath(); g.moveTo(0, -10); g.lineTo(10, 0); g.lineTo(0, 10); g.lineTo(-10, 0); g.closePath(); g.fill(); g.restore(); }
      else if (n.ty === 'dot') { g.beginPath(); g.arc(nx, ny, 5.6 * s, 0, TAU); g.fill(); }
      else { g.lineWidth = 3 * s; g.beginPath(); g.arc(nx, ny, 7.5 * s, 0, TAU); g.stroke(); }
      if (n.white) { g.fillStyle = 'rgba(246,234,214,.85)'; g.beginPath(); g.arc(nx, ny, 1.8 * s, 0, TAU); g.fill(); }
      const wq = ss(8.15 + n.wg * 0.8, 8.65 + n.wg * 0.8, lt);                                   // 拍三描白点睛＋微闪
      if (hl3 > 0 && wq > 0) { g.fillStyle = 'rgba(246,234,214,' + (wq * (0.62 + 0.32 * Math.sin(t * 2.4 + n.ph))).toFixed(3) + ')';
        g.beginPath(); g.arc(nx, ny, (n.ty === 'ring' ? 2.2 : 2.8), 0, TAU); g.fill(); }
      if (sw.env > 0.01) {                                                                        // 1T+ 白光扫过时节点过光闪亮
        const dd = Math.exp(-((n.x - sw.sx) / 130) * ((n.x - sw.sx) / 130));
        if (dd > 0.05) { g.fillStyle = 'rgba(255,244,226,' + (dd * sw.env * 0.6).toFixed(3) + ')';
          g.beginPath(); g.arc(nx, ny, 12, 0, TAU); g.fill(); }
      }
    });
    // 密度升级的小散点
    MDOTS.forEach((m) => {
      const q = ss(m.at, m.at + 0.3, lt); if (q <= 0) return;
      g.fillStyle = m.red ? C.red : C.black; g.beginPath(); g.arc(m.x, m.y, m.r * q, 0, TAU); g.fill();
      const wq = ss(8.2 + (m.x - NX0) / 1360 * 0.7, 8.9 + (m.x - NX0) / 1360 * 0.7, lt);
      if (wq > 0) { g.fillStyle = 'rgba(246,234,214,' + (wq * (0.55 + 0.3 * Math.sin(t * 2.2 + m.ph))).toFixed(3) + ')';
        g.beginPath(); g.arc(m.x, m.y, 1.5, 0, TAU); g.fill(); }
    });
  }
  function scatterDraw(g, lt, t) {                                // 拍一四周散的小参数（呼吸/明灭）
    SCAT.forEach((u) => {
      const a = ss(u.at, u.at + 0.3, lt); if (a <= 0) return;
      const br = 1 + 0.07 * Math.sin(lt * TAU / 1.6 + u.ph);
      g.save(); g.globalAlpha = a; g.translate(u.x, u.y); g.scale(u.s * br, u.s * br);
      const col = u.red ? C.red : C.black; g.fillStyle = col; g.strokeStyle = col;
      if (u.ty === 'loz') { g.beginPath(); g.moveTo(0, -13); g.lineTo(13, 0); g.lineTo(0, 13); g.lineTo(-13, 0); g.closePath(); g.fill(); }
      else if (u.ty === 'dot') { g.beginPath(); g.arc(0, 0, 7, 0, TAU); g.fill(); }
      else { g.lineWidth = 3.4; g.beginPath(); g.arc(0, 0, 9.5, 0, TAU); g.stroke(); }
      if (u.white) { g.fillStyle = 'rgba(246,234,214,' + (0.5 + 0.5 * (0.5 + 0.5 * Math.sin(t * 3.6 + u.ph))).toFixed(3) + ')';
        g.beginPath(); g.arc(0, 0, 2, 0, TAU); g.fill(); }
      g.restore();
    });
  }
  // 1T+ 揭示：一道白光从左往右掠过全网（唯一重音，ss 平滑无跳变）
  function sweepDraw(g, lt) {
    const env = ss(6.42, 6.6, lt) * (1 - ss(6.86, 7.02, lt));
    if (env <= 0.004) return;
    const sx = 420 + 1420 * ss(6.42, 6.95, lt);
    g.save(); g.globalCompositeOperation = 'lighter';
    const gr = g.createLinearGradient(sx - 170, 0, sx + 170, 0);
    gr.addColorStop(0, 'rgba(255,244,226,0)'); gr.addColorStop(0.5, 'rgba(255,244,226,' + (0.32 * env).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(255,244,226,0)');
    g.fillStyle = gr; g.fillRect(sx - 170, 290, 340, 580);
    g.restore();
  }

  // ---------------- ⑪ 镜头：拍一缓推 1→1.12，拍二缓拉远回 1，拍三停 ----------------
  const camS = (t) => t < 2.7 ? 1.0 + 0.12 * ss(0, 2.7, t) : t < 3.0 ? 1.12 : t < 6.5 ? 1.12 - 0.12 * ss(3.0, 6.5, t) : 1.0;

  return {
    init() {
      if (U.missingGlyphs('Cinzel-400', '\u2212').length === 0) NUMS[1] = '\u22121.2';          // 优先用真减号，缺字就退回连字符
      U.assertGlyphs('Cinzel-400', '0123456789.BT+-', 's03_greek 母本小数字');
      U.assertGlyphs('Cinzel-700', '0123456789.BT+-', 's03_greek 铭文计数');
      U.assertGlyphs('LXGWWenKai-500', '参数疯狂卷之外数据方法算力', 's03_greek 屏上字与标签');
      bg(); topStrip(); botStrip(); vig();                                                   // 冷缓存，首帧即热
    },
    draw(c, lt, t) {
      const s = camS(lt);
      c.save();
      c.translate(960, 540); c.scale(s, s); c.translate(-960, -540);
      c.drawImage(bg(), 0, 0);
      const dark = 0.13 * ss(3.2, 6.2, lt) * (1 - ss(6.9, 7.7, lt));                            // 拍二整器微微加深、拍三退净
      if (dark > 0.003) { c.fillStyle = 'rgba(27,18,13,' + dark.toFixed(3) + ')'; c.fillRect(0, 0, W, H); }
      const topOff = 26 * lt - 132 * Sint(3.0, 5.4, lt) + 88 * Sint(7.0, 8.4, lt);             // 顶带：左缓滚→反向加速→缓滚
      const botOff = 90 * Sint(3.2, 5.6, lt) - 68 * Sint(7.0, 8.4, lt);                        // 底带：静置→左滚加速→缓滚
      const ts = ((topOff % TOP_P) + TOP_P) % TOP_P, bs = ((botOff % BOT_P) + BOT_P) % BOT_P;
      c.drawImage(topStrip(), -ts, 30);
      c.drawImage(botStrip(), -bs, 930);
      rim(c);
      scatterDraw(c, lt, t);
      const env = ss(6.42, 6.6, lt) * (1 - ss(6.86, 7.02, lt));
      netDraw(c, lt, t, { sx: 420 + 1420 * ss(6.42, 6.95, lt), env });
      boatDraw(c, lt, t);
      dolphinDraw(c, lt, t);
      boardDraw(c, lt, t);
      momDraw(c, lt, t);
      lyreDraw(c, lt, t);
      objectsDraw(c, lt, t);
      titleDraw(c, lt, t);
      sweepDraw(c, lt);
      c.restore();
      c.drawImage(vig(), 0, 0);
    },
  };
})();
