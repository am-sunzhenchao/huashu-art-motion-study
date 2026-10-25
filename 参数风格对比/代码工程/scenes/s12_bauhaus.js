// s12_bauhaus · 1923 包豪斯海报 ×「大模型参数」风格样片（10s 单镜头三拍）。
// 题材构图（不搬速通片的房间）：一张包豪斯构成海报——参数＝红黄蓝几何单元（圆/方/三角）。
//   拍一 0–3s   三颗放大的几何参数单元特写（各带米白读数牌 0.73 / −1.2 / 2.4，逐个弹出被端详），
//               红圆内指针缓转、旁列同心弧一浪浪外推，黄三角自转微倾，蓝方慢旋内嵌小黄方绕行，
//               右上毂心垂下一根黑色指针杆转陡地扫过（把三颗读数逐个读到）；镜头缓缓推近；
//   拍二 3–7s   三颗单元缩位入格，整面几何单元阵列（圆/方/三角/四分之一圆）按序列增殖弹出、
//               缝隙黑连线蔓延成网、按机器步进换色（蒙德里安格窗式翻色），计数器滚动
//               1.5B→175B→540B→1T+，1T+ 揭示时一道米色波从计数器扫过全阵（全片唯一一次重音），
//               背景九线格纸随密度加深、外框加粗；镜头先缓拉远展开、后段缓推入网心；
//   拍三 7–10s 增殖停住、换色慢下来收稳；书摞（数据）、圆+三角齿齿轮（方法）、黄圆棒电池（算力）
//               依次升起归位（齿轮缓转、电池电量窗涨满），阵列单元逐个描黑边点白芯（变亮变精）、
//               一道米色高光带扫过全阵，红圆黄三角蓝方三颗主角缓转放大收尾；镜头停收全貌。
// 管线：底版（米白旧纸＋斑驳＋竖排 bauhaus 铭＋红黑条＋地线＋细斜线＋颗粒，做旧只上背景）整张 P.cached
//      超采样缓存随镜头缩放；每帧只画动态层：阵列/连线/三主角/指针杆/同心弧/计数器/三物/屏上字。
// 约定：随机全用 U.rng / U.hash 种子（同帧两次渲染逐像素一致）；无角色（不画脸、不画人偶）；
//      中文 PuHui-Heavy（NotoSansSC-800 字重）、数字 ArchivoBlack-400、竖排铭 Poppins-800，落笔前 U.assertGlyphs。
SCENES['s12_bauhaus'] = (() => {
  const W = 1920, H = 1080, TAU = Math.PI * 2;
  const { clamp, lerp, ss, ease, hash } = U, P = PAINT;
  const C = { paper: '#ebe3cf', ink: '#161514', red: '#d3262b', blue: '#2a58b4', yellow: '#efc12f', lblue: '#b9cee0', lblue2: '#a6c0da', grey: '#c6c3bb', cream: '#f2ecdf' };
  const PAL = ['red', 'yellow', 'blue', 'cream', 'lblue', 'lblue2', 'grey'];
  const HEX = { red: C.red, yellow: C.yellow, blue: C.blue, cream: C.cream, lblue: C.lblue, lblue2: C.lblue2, grey: C.grey };
  const WT = [14, 16, 16, 22, 15, 9, 8];                                  // 抽色权重（无黑：换到黑格像坏格子）

  // ---------- 斑驳小噪声图（放大使用，只上背景做旧） ----------
  const mottle = (key, seed, col, amt) => P.cached('bhb_m_' + key, 320, 180, (g) => {
    const im = g.createImageData(320, 180), r = U.rng(seed);
    for (let y = 0; y < 180; y++) for (let x = 0; x < 320; x++) { const v = P.fbm(x * 0.045 + seed, y * 0.045, 4), i = (y * 320 + x) * 4;
      im.data[i] = col[0]; im.data[i + 1] = col[1]; im.data[i + 2] = col[2]; im.data[i + 3] = clamp(v * 1.6 + 0.1) * 255 * amt + r() * 10; }
    g.putImageData(im, 0, 0);
  });

  // ---------- 底版（超采样 2400×1360，随镜头缩放也不露边；世界坐标原点在画布 (-240,-140)） ----------
  const bgBig = () => P.cached('bhb_bg', 2400, 1360, (g) => {
    g.translate(240, 140);                                                 // 之后全部按世界坐标画
    g.fillStyle = C.paper; g.fillRect(-240, -140, 2400, 1360);
    g.globalAlpha = 0.5; g.drawImage(mottle('paper', 3, [150, 130, 95], 0.35), -240, -140, 2400, 1360); g.globalAlpha = 1;
    g.strokeStyle = C.ink; g.lineWidth = 2.2; g.beginPath(); g.moveTo(40, 170); g.lineTo(1900, 840); g.stroke();   // 贯穿细斜线
    g.fillStyle = C.ink; g.fillRect(60, 61, 256, 13);                      // 左上黑横条
    g.fillStyle = C.red; g.fillRect(292, 105, 24, 468);                    // 红竖条
    g.fillStyle = '#9a9894'; g.fillRect(875, 150, 31, 31); g.fillRect(646, 132, 18, 18); g.fillRect(1300, 128, 24, 24);  // 灰小方块
    g.fillStyle = C.ink; g.fillRect(345, 898, 1395, 17);                  // 地线
    g.save(); g.translate(1856, 980); g.rotate(-Math.PI / 2);               // 竖排 bauhaus 铭（自下而上读）
    g.font = '190px "Poppins-800"'; g.fillStyle = C.ink; g.textBaseline = 'alphabetic';
    const w0 = g.measureText('bauhaus').width; g.scale(820 / w0, 1); g.fillText('bauhaus', 0, 0); g.restore();
    g.drawImage(P.grain('bhb', 0.02, [40, 35, 30], 0.35), -240, -140, 2400, 1360);   // 旧印刷颗粒（只上背景）
  });

  // ---------- 阵列九线格纸（缓存一张域大小的图，帧内只调透明度） ----------
  const GX0 = 392, GY0 = 162, CW = 96, CH = 96, PGX = 108, PGY = 106, NC = 13, NR = 6;
  const cellC = (i, j) => [GX0 + PGX * i + CW / 2, GY0 + PGY * j + CH / 2];
  const graphTile = () => P.cached('bhb_graph', 1392, 626, (g) => {
    g.strokeStyle = 'rgba(30,30,30,.14)'; g.lineWidth = 1; g.beginPath();
    for (let x = 4.5; x < 1392; x += 9) { g.moveTo(x, 0); g.lineTo(x, 626); }
    for (let y = 4.5; y < 626; y += 9) { g.moveTo(0, y); g.lineTo(1392, y); }
    g.stroke();
  });

  // ---------- 三颗参数主角（红圆/黄三角/蓝方），锚在阵列格位上 ----------
  const TRIO = [
    { i: 2, j: 2, shape: 'circle', col: 'red', num: '0.73', big: 170, small: 44, pop: 0.9, px: 656, py: 646 },
    { i: 7, j: 1, shape: 'tri', col: 'yellow', num: '-1.2', big: 210, small: 46, pop: 1.6, px: 1196, py: 500 },
    { i: 10, j: 3, shape: 'square', col: 'blue', num: '2.4', big: 110, small: 44, pop: 2.3, px: 1520, py: 690 },
  ];

  // ---------- 阵列（种子生成：出生序列洗牌铺满 3.30–6.45；三主角 3.02 缩位入格） ----------
  const CELLS = [];
  {
    const r = U.rng(1212), slots = [];
    for (let j = 0; j < NR; j++) for (let i = 0; i < NC; i++) slots.push([i, j]);
    for (let k = slots.length - 1; k > 0; k--) { const m = (r() * (k + 1)) | 0; const t = slots[k]; slots[k] = slots[m]; slots[m] = t; }
    const bornOf = {};
    slots.forEach((s, n) => { bornOf[s[0] + ',' + s[1]] = 3.30 + 3.12 * Math.pow(n / (slots.length - 1), 0.85) + r() * 0.06; });
    for (let j = 0; j < NR; j++) for (let i = 0; i < NC; i++) {
      const tr = TRIO.find(q => q.i === i && q.j === j);
      if (tr) { CELLS.push({ i, j, trio: tr, born: 3.02, active: false, phase: 0 }); continue; }
      const sh = r(), shape = sh < 0.58 ? 'square' : sh < 0.80 ? 'circle' : sh < 0.93 ? 'tri' : 'quarter';
      let pick = r() * 100, col = 0; for (let k = 0; k < WT.length; k++) { pick -= WT[k]; if (pick <= 0) { col = k; break; } }
      CELLS.push({ i, j, shape, col, born: bornOf[i + ',' + j], active: r() < 0.55, phase: (r() * 8) | 0, seed: r() });
    }
  }
  // 机器步进换色：13fps 步进、每 8 步翻一色；7s 后周期加倍、9.4s 冻住（增殖停住→收稳，步进慢下来）
  function cellCol(cl, lt) {
    const base = (cl.trio ? PAL.indexOf(cl.trio.col) : cl.col);
    if (cl.trio || !cl.active) return base;
    const mult = lt <= 7 ? 1 : 0.5 * Math.max(0, 1 - ss(7.6, 9.4, lt));
    const ltE = lt <= 7 ? lt : 7 + (lt - 7) * mult;
    const k = Math.floor((ltE * 13 + cl.phase) / 8);
    return (base + k * 3) % 7;
  }

  // ---------- 连线（相邻格缝蔓延）＋少量红色斜杠（密度重音的静态骨架） ----------
  const LINKS = [];
  {
    const r = U.rng(7171), by = {};
    CELLS.forEach(cl => { by[cl.i + ',' + cl.j] = cl; });
    for (const cl of CELLS) {
      [[by[(cl.i + 1) + ',' + cl.j]], [by[cl.i + ',' + (cl.j + 1)]]].forEach(([nb]) => {
        if (!nb) return;
        LINKS.push({ a: cl, b: nb, born: Math.max(cl.born, nb.born) + 0.18 + r() * 0.16, red: false });
      });
    }
    let n = 0, guard = 0;
    while (n < 8 && guard++ < 600) {
      const A = CELLS[(r() * CELLS.length) | 0], B = CELLS[(r() * CELLS.length) | 0];
      const d = Math.abs(A.i - B.i) + Math.abs(A.j - B.j);
      if (d < 3 || d > 6) continue;
      LINKS.push({ a: A, b: B, born: 5.55 + r() * 1.2, red: true }); n++;
    }
  }
  // 拍三在连线上跑的小方块（网络收稳后仍在低声流动）
  const TRAV = [];
  { const r = U.rng(889); let guard = 0;
    while (TRAV.length < 3 && guard++ < 500) {
      const L = LINKS[(r() * LINKS.length) | 0];
      if (!L || L.red || L.born > 5.5 || TRAV.some(q => q.L === L)) continue;
      TRAV.push({ L, sp: 0.22 + r() * 0.15, ph: r(), col: r() < 0.6 ? C.yellow : C.red });
    }
  }

  // ---------- 镜头：一个连续运镜（近景→展开→收稳），关键帧缓动插值 ----------
  const CAMK = [[0, 1.0], [3, 1.06], [4, 0.94], [6.8, 1.02], [7.8, 0.985], [10, 1.0]];
  function camS(lt) {
    if (lt <= CAMK[0][0]) return CAMK[0][1];
    for (let k = 0; k < CAMK.length - 1; k++) if (lt >= CAMK[k][0] && lt <= CAMK[k + 1][0])
      return lerp(CAMK[k][1], CAMK[k + 1][1], ease.inOut((lt - CAMK[k][0]) / (CAMK[k + 1][0] - CAMK[k][0])));
    return CAMK[CAMK.length - 1][1];
  }

  // ---------- 几何绘制件 ----------
  function shapePath(c, shape, x, y, s) {
    c.beginPath();
    if (shape === 'circle') { c.arc(x, y, s, 0, TAU); }
    else if (shape === 'square') { c.rect(x - s, y - s, s * 2, s * 2); }
    else { c.moveTo(x, y - s); c.lineTo(x + s * 0.866, y + s * 0.5); c.lineTo(x - s * 0.866, y + s * 0.5); c.closePath(); }
  }
  function drawCell(c, cl, lt) {
    if (lt <= cl.born) return;
    const [x, y] = cellC(cl.i, cl.j);
    const pop = lt - cl.born < 0.34 ? ease.outBack(clamp((lt - cl.born) / 0.34)) : 1;
    if (cl.shape === 'quarter') {                                          // 四分之一圆格（格窗图样）
      c.save(); c.translate(x, y); c.scale(pop, pop);
      c.fillStyle = C.grey; c.fillRect(-48, -48, 96, 96);
      c.fillStyle = C.cream; c.beginPath(); c.moveTo(-48, 48); c.arc(-48, 48, 66, -Math.PI / 2, 0); c.closePath(); c.fill();
      c.strokeStyle = C.ink; c.lineWidth = 2; c.strokeRect(-48, -48, 96, 96); c.restore();
      return;
    }
    const col = HEX[PAL[cellCol(cl, lt)]];
    c.save(); c.translate(x, y); c.scale(pop, pop);
    c.fillStyle = col; shapePath(c, cl.shape, 0, 0, 48); c.fill();
    const st = 7.7 + 1.15 * hash(cl.i * 31 + cl.j, 5);                     // 拍三：逐个描黑边、点白芯（变亮变精）
    const rf = ss(st, st + 0.9, lt);
    if (rf > 0.02) {
      c.strokeStyle = C.ink; c.lineWidth = 3 * rf; shapePath(c, cl.shape, 0, 0, 48); c.stroke();
      c.fillStyle = C.cream; c.beginPath(); c.arc(0, 0, 7 * rf, 0, TAU); c.fill();
    }
    c.restore();
  }

  // 三颗主角：拍一巨大特写 → 3.0–4.2 缩位入格 → 9.0 后缓转放大收尾
  function drawTrio(c, lt) {
    const k = ease.inOut(ss(3.0, 4.2, lt));
    const grow = ease.outBack(clamp((lt - 9.0) / 0.9, 0, 1));
    { // 红圆：内指针缓转＋中心墨点
      const [x, y] = cellC(2, 2), R = lerp(170, 44, k) * (1 + 0.62 * grow);
      c.fillStyle = C.red; c.beginPath(); c.arc(x, y, R, 0, TAU); c.fill();
      c.strokeStyle = C.ink; c.lineWidth = 3.5; c.stroke();
      const da = lt * 1.1 + 2.4, rl = Math.max(10, R - 14);
      c.strokeStyle = C.cream; c.lineWidth = Math.max(2.5, R * 0.035);
      c.beginPath(); c.moveTo(x - Math.cos(da) * rl, y - Math.sin(da) * rl); c.lineTo(x + Math.cos(da) * rl, y + Math.sin(da) * rl); c.stroke();
      c.fillStyle = C.ink; c.beginPath(); c.arc(x, y, Math.max(3, R * 0.055), 0, TAU); c.fill();
    }
    { // 黄三角：自转微倾＋内三角反向缓转＋轻浮动
      const [x, y] = cellC(7, 1), R = lerp(210, 46, k) * (1 + 0.6 * grow);
      const bob = Math.sin(lt * 1.7) * 6 * (1 - 0.8 * k);
      c.save(); c.translate(x, y + bob); c.rotate(Math.sin(lt * 0.8) * 0.06 + lt * 0.12 + 0.5 * ss(9.0, 9.9, lt));
      c.fillStyle = C.yellow; c.beginPath(); c.moveTo(0, -R); c.lineTo(R * 0.866, R * 0.5); c.lineTo(-R * 0.866, R * 0.5); c.closePath(); c.fill();
      c.strokeStyle = C.ink; c.lineWidth = 3.5; c.stroke();
      const ir = R * 0.42, ia = -lt * 0.5;
      c.strokeStyle = C.ink; c.lineWidth = Math.max(2, R * 0.014); c.beginPath();
      c.moveTo(Math.cos(ia) * ir, Math.sin(ia) * ir); c.lineTo(Math.cos(ia + 2.09) * ir, Math.sin(ia + 2.09) * ir); c.lineTo(Math.cos(ia + 4.19) * ir, Math.sin(ia + 4.19) * ir); c.closePath(); c.stroke();
      c.restore();
    }
    { // 蓝方：慢旋＋内嵌小黄方沿边绕行
      const [x, y] = cellC(10, 3), S = lerp(110, 44, k) * (1 + 0.6 * grow);
      c.save(); c.translate(x, y); c.rotate(lt * 0.1 + 0.25 * ss(9.0, 9.9, lt));
      c.fillStyle = C.blue; c.fillRect(-S, -S, S * 2, S * 2);
      c.strokeStyle = C.ink; c.lineWidth = 3.5; c.strokeRect(-S, -S, S * 2, S * 2);
      const q = (lt * 0.35) % 4, side = Math.floor(q), fq = q - side, E = S - 14; let px, py;
      if (side === 0) { px = -E + 2 * E * fq; py = -E; } else if (side === 1) { px = E; py = -E + 2 * E * fq; }
      else if (side === 2) { px = E - 2 * E * fq; py = E; } else { px = -E; py = E - 2 * E * fq; }
      const ssz = Math.max(7, S * 0.16);
      c.fillStyle = C.yellow; c.fillRect(px - ssz, py - ssz, ssz * 2, ssz * 2);
      c.restore();
    }
  }

  // 拍一的读数牌（米白牌＋墨字，逐个弹出放大被端详，指针杆读到时最亮）
  function plates(c, lt) {
    TRIO.forEach((tr, n) => {
      const q = clamp((lt - tr.pop) / 0.35);
      if (q <= 0) return;
      const a = ss(0, 0.3, q) * (1 - ss(3.05, 3.55, lt));
      if (a <= 0.01) return;
      const sc = 0.62 + 0.38 * ease.outBack(q);
      c.save(); c.globalAlpha = a; c.translate(tr.px, tr.py); c.scale(sc, sc);
      c.fillStyle = C.cream; c.fillRect(-80, -27, 160, 54);
      c.strokeStyle = C.ink; c.lineWidth = 3; c.strokeRect(-80, -27, 160, 54);
      c.fillStyle = n === 1 ? C.red : C.ink;                                // −1.2 用红字：负权重一眼可辨
      c.font = '50px "ArchivoBlack-400"'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(tr.num, 0, 2);
      c.restore();
    });
  }

  // 红圆旁同心弧（一浪浪外推呼吸；主角缩位后跟着收小）
  function arcs(c, lt) {
    const [x, y] = cellC(2, 2);
    const R0 = lerp(170, 44, ease.inOut(ss(3.0, 4.2, lt)));
    const big = R0 > 100, n = big ? 6 : 4, step = big ? 26 : 12;
    const alpha = 0.9 * (1 - 0.45 * ss(3.4, 5, lt));
    c.strokeStyle = C.ink; c.lineCap = 'butt';
    for (let i = 0; i < n; i++) {
      const a0 = -1.05 + i * 0.05, a1 = 0.95 - i * 0.09;
      const d = Math.sin(lt * 9 - i * 0.7) * 0.05, sw = 0.55 + 0.45 * clamp(lt / 0.4, 0, 1);
      c.lineWidth = 2.2; c.globalAlpha = alpha;
      c.beginPath(); c.arc(x, y, R0 + 26 + i * step + Math.sin(lt * 12 - i) * 3, a0 + d, lerp(a0, a1, sw) + d); c.stroke();
    }
    c.globalAlpha = 1;
  }

  // 指针杆：像仪表针绕毂转陡（24°→58° 扫过读数，之后随阵列缓升到 70° 收稳）
  function rod(c, lt) {
    const deg = 24 + 34 * ease.out(clamp((lt - 0.4) / 2.5, 0, 1)) + 10 * ease.inOut(clamp((lt - 3) / 4, 0, 1)) + 2 * ss(7, 9.5, lt);
    const a = deg * Math.PI / 180, PIV = [1500, 190];
    const u = [Math.cos(a), -Math.sin(a)], n2 = [Math.sin(a), Math.cos(a)];
    const at = (s, o) => [PIV[0] + u[0] * s + n2[0] * (o || 0), PIV[1] + u[1] * s + n2[1] * (o || 0)];
    c.strokeStyle = C.ink; c.lineWidth = 2.2;
    c.beginPath(); c.arc(PIV[0], PIV[1], 64, 0, TAU); c.stroke();
    c.beginPath(); c.arc(PIV[0], PIV[1], 48, -a + 0.9, -a + 4.5); c.stroke();
    c.lineWidth = 2.4; c.beginPath(); c.moveTo(...at(-560, 26)); c.lineTo(...at(120, 26)); c.stroke();
    c.lineWidth = 20; c.lineCap = 'butt'; c.beginPath(); c.moveTo(...at(-560)); c.lineTo(...at(120)); c.stroke();
    c.strokeStyle = C.red; c.lineWidth = 10; c.beginPath(); c.moveTo(...at(56, -26)); c.lineTo(...at(130, -26)); c.stroke();
    c.fillStyle = C.ink; c.beginPath(); c.arc(PIV[0], PIV[1], 11, 0, TAU); c.fill();
  }

  // ---------- 序列计数器：真实滚动 1.5B→175B→540B→1T+（黑牌黄字 ArchivoBlack） ----------
  const CK = [[3.30, 0], [3.92, 1.5], [4.18, 1.5], [4.98, 175], [5.08, 175], [5.88, 540], [5.98, 540], [6.78, 1000], [999, 1000]];
  function counterVal(lt) {
    for (let i = 0; i < CK.length - 1; i++) if (lt >= CK[i][0] && lt <= CK[i + 1][0])
      return lerp(CK[i][1], CK[i + 1][1], ease.inOut(clamp((lt - CK[i][0]) / (CK[i + 1][0] - CK[i][0]), 0, 1)));
    return lt < 3.3 ? 0 : 1000;
  }
  function drawCounter(c, lt) {
    const a = ss(3.3, 3.75, lt) * (1 - ss(6.9, 7.4, lt));
    if (a <= 0.01) return;
    const v = counterVal(lt);
    const txt = v >= 1000 ? '1T+' : v < 10 ? v.toFixed(1) + 'B' : Math.round(v) + 'B';
    const pulse = v >= 1000 ? Math.exp(-Math.max(0, lt - 6.78) * 3.0) : 0;
    c.save(); c.globalAlpha = a;
    c.translate(1565, 847); c.scale(1 + 0.13 * pulse, 1 + 0.13 * pulse); c.translate(-1565, -847);
    c.fillStyle = C.ink; c.fillRect(1330, 802, 470, 90);
    c.fillStyle = C.red; c.fillRect(1352, 818, 24, 24);
    c.strokeStyle = 'rgba(242,236,223,.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(1392, 826); c.lineTo(1392, 868); c.stroke();
    c.font = '62px "ArchivoBlack-400"'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.fillStyle = C.yellow; c.fillText(txt, 1585, 864);
    c.restore();
  }

  // ---------- 拍三：三件几何物（书摞=数据、齿轮=方法、电池=算力），缓存精灵＋动态件 ----------
  const BOOKS = () => P.cached('bhb_books', 280, 210, (g) => {           // 叠矩形书摞
    const rows = [
      { y: 172, w: 252, h: 34, c: C.red, rot: -0.03 },
      { y: 136, w: 240, h: 33, c: C.blue, rot: 0.025 },
      { y: 100, w: 248, h: 32, c: C.cream, rot: -0.02 },
      { y: 66, w: 230, h: 31, c: C.yellow, rot: 0.03 },
    ];
    g.save(); g.translate(140, 0);
    rows.forEach(r => {
      g.save(); g.rotate(r.rot);
      g.fillStyle = r.c; g.fillRect(-r.w / 2, r.y, r.w, r.h);
      g.fillStyle = '#fbf8f0'; g.fillRect(r.w / 2 - 16, r.y + 4, 9, r.h - 8);      // 书口
      g.strokeStyle = C.ink; g.lineWidth = 3; g.strokeRect(-r.w / 2, r.y, r.w, r.h);
      g.restore();
    });
    g.restore();
  });
  const GEAR = () => P.cached('bhb_gear', 220, 220, (g) => {           // 圆＋三角齿
    g.translate(110, 110);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU;
      g.fillStyle = C.red; g.beginPath();
      g.moveTo(Math.cos(a) * 104, Math.sin(a) * 104);
      g.lineTo(Math.cos(a + 0.17) * 80, Math.sin(a + 0.17) * 80);
      g.lineTo(Math.cos(a - 0.17) * 80, Math.sin(a - 0.17) * 80);
      g.closePath(); g.fill();
      g.strokeStyle = C.ink; g.lineWidth = 3; g.stroke();
    }
    g.fillStyle = C.blue; g.beginPath(); g.arc(0, 0, 84, 0, TAU); g.fill();
    g.strokeStyle = C.ink; g.lineWidth = 4; g.stroke();
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.4; g.fillStyle = C.ink; g.beginPath(); g.arc(Math.cos(a) * 55, Math.sin(a) * 55, 6, 0, TAU); g.fill(); }
    g.fillStyle = C.yellow; g.beginPath(); g.arc(0, 0, 30, 0, TAU); g.fill();
    g.strokeStyle = C.ink; g.lineWidth = 3; g.stroke();
  });
  const BAT = () => P.cached('bhb_bat', 150, 200, (g) => {              // 黄圆棒电池（电量窗动态另画）
    g.translate(75, 0);
    g.fillStyle = C.ink; g.fillRect(-19, 0, 38, 22);
    g.fillStyle = C.yellow; g.fillRect(-58, 22, 116, 170);
    g.strokeStyle = C.ink; g.lineWidth = 4; g.strokeRect(-58, 22, 116, 170);
    g.fillStyle = C.cream; g.fillRect(-44, 36, 88, 142);
    g.strokeStyle = C.ink; g.lineWidth = 3; g.strokeRect(-44, 36, 88, 142);
  });
  const OBJ = [
    { key: 'books', x: 560, rise: 7.15, label: '数据', lc: C.red },
    { key: 'gear', x: 1140, rise: 7.55, label: '方法', lc: C.blue },
    { key: 'bat', x: 1650, rise: 7.95, label: '算力', lc: C.yellow },
  ];
  function drawObjects(c, lt) {
    OBJ.forEach(o => {
      const q = clamp((lt - o.rise) / 0.85, 0, 1);
      if (q <= 0) return;
      const yOff = (1 - ease.outBack(q)) * 180, al = ss(0, 0.3, q);
      c.save(); c.globalAlpha = al; c.translate(0, yOff);
      if (o.key === 'books') c.drawImage(BOOKS(), o.x - 140, 898 - 206);
      if (o.key === 'gear') { c.save(); c.translate(o.x, 792); c.rotate(lt * 0.45); c.drawImage(GEAR(), -110, -110); c.restore(); }
      if (o.key === 'bat') {
        c.drawImage(BAT(), o.x - 75, 898 - 192);
        const lvl = clamp(0.35 + 0.62 * ss(7.95, 9.55, lt) + 0.015 * Math.sin(lt * 2.2), 0, 1);   // 电量窗涨满（算力到位）
        const wh = lvl * 142, wy = (898 - 192) + 36;
        c.fillStyle = C.blue; c.fillRect(o.x - 44, wy + (142 - wh), 88, wh);
      }
      c.restore();
      const la = ss(0.55, 0.85, q);                                        // 铭文（方块色标＋黑字）
      if (la > 0.02) {
        c.save(); c.globalAlpha = la;
        c.font = '46px "PuHui-Heavy"'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
        c.fillStyle = o.lc; c.fillRect(o.x - 112, 822, 16, 16);
        c.fillStyle = C.ink; c.fillText(o.label, o.x - 88, 858);
        c.restore();
      }
    });
  }

  // ---------- 屏上字（每拍一条，黑字压米白纸，微幅海报摇） ----------
  const CAPS = [
    { txt: '参数', x: 365, y: 242, size: 150, a: lt => ss(0.55, 1.2, lt) * (1 - ss(2.75, 3.25, lt)) },
    { txt: '疯狂卷参数', x: 365, y: 242, size: 104, a: lt => ss(3.3, 3.9, lt) * (1 - ss(6.6, 7.05, lt)) },
    { txt: '参数之外', x: 1245, y: 242, size: 104, a: lt => ss(7.3, 7.9, lt) },
  ];
  function captions(c, lt) {
    CAPS.forEach((cp, n) => {
      const a = cp.a(lt);
      if (a <= 0.01) return;
      c.save(); c.globalAlpha = a; c.translate(cp.x, cp.y); c.rotate(-0.012 + 0.01 * Math.sin(lt * 0.9 + n * 2));
      c.font = cp.size + 'px "PuHui-Heavy"'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      c.fillStyle = C.ink; c.fillText(cp.txt, 0, 0);
      c.restore();
    });
  }

  return {
    init() {
      U.assertGlyphs('150px "PuHui-Heavy"', '参数疯狂卷之外数据方法算力', 's12_bauhaus 屏上字/铭文');
      U.assertGlyphs('62px "ArchivoBlack-400"', '0123456789.BT+-', 's12_bauhaus 计数器/读数');
      U.assertGlyphs('190px "Poppins-800"', 'bauhaus', 's12_bauhaus 竖排铭');
      bgBig(); graphTile(); BOOKS(); GEAR(); BAT();                      // 预热缓存：首帧也快
    },
    draw(c, lt) {
      const dn = clamp((lt - 3.3) / 3.15, 0, 1);                          // 阵列密度
      const s = camS(lt);
      c.save(); c.translate(1050, 420); c.scale(s, s); c.translate(-1050, -420);
      c.drawImage(bgBig(), -240, -140);
      if (dn > 0.01) { c.globalAlpha = 0.5 * dn; c.drawImage(graphTile(), GX0, GY0); c.globalAlpha = 1; }   // 九线格纸随密度加深
      const fa = ss(3.3, 4.2, lt);
      if (fa > 0.01) {                                                                                    // 外框随密度加粗、5.3s 后加一重
        c.globalAlpha = fa; c.strokeStyle = C.ink; c.lineWidth = 1 + 5 * dn;
        c.strokeRect(GX0 - 9, GY0 - 9, 1392 + 18, 626 + 18);
        const f2 = ss(5.3, 6.0, lt);
        if (f2 > 0.01) { c.globalAlpha = fa * f2; c.lineWidth = 2.5; c.strokeRect(GX0 - 16, GY0 - 16, 1392 + 32, 626 + 32); }
        c.globalAlpha = 1;
      }
      { // 密度升格：与底版斜线平行的红色轴（只在阵列域内）
        const ra = ss(5.0, 5.8, lt);
        if (ra > 0.01) { c.globalAlpha = 0.9 * ra; c.strokeStyle = C.red; c.lineWidth = 4;
          c.beginPath(); c.moveTo(452, 202); c.lineTo(1724, 748); c.stroke(); c.globalAlpha = 1; }
      }
      { // 连线：格缝里蔓延（墨线）＋红色斜杠；拍三收稳后透明度加浓
        const calm = ss(8.6, 9.7, lt);
        for (const L of LINKS) {
          if (lt <= L.born) continue;
          const prog = clamp((lt - L.born) / 0.3, 0, 1);
          const [ax, ay] = cellC(L.a.i, L.a.j), [bx, by] = cellC(L.b.i, L.b.j);
          if (L.red) { c.strokeStyle = C.red; c.globalAlpha = 0.8; c.lineWidth = 3.5; }
          else { c.strokeStyle = C.ink; c.globalAlpha = 0.7 + 0.22 * calm; c.lineWidth = 2.4; }
          c.beginPath(); c.moveTo(ax, ay); c.lineTo(lerp(ax, bx, prog), lerp(ay, by, prog)); c.stroke();
        }
        c.globalAlpha = 1;
      }
      for (const cl of CELLS) { if (!cl.trio) drawCell(c, cl, lt); }     // 阵列单元（三主角另画）
      { // 1T+ 揭示：一道米色波从计数器扫过全阵（全片唯一一次重音）
        if (lt > 6.75 && lt < 7.35) {
          const Rw = (lt - 6.78) * 1500;
          for (const cl of CELLS) {
            if (cl.trio || lt <= cl.born) continue;
            const [x, y] = cellC(cl.i, cl.j), dd = Math.abs(Math.hypot(x - 1565, y - 847) - Rw);
            if (dd < 130) {
              c.globalAlpha = 0.5 * (1 - dd / 130);
              if (cl.shape === 'quarter') c.fillStyle = C.cream, c.fillRect(x - 44, y - 44, 88, 88);
              else { c.fillStyle = C.cream; shapePath(c, cl.shape, x, y, 44); c.fill(); }
            }
          }
          c.globalAlpha = 1;
        }
      }
      { // 变亮变精的高光带：一道米色斜光扫过全阵
        const bA = ss(8.0, 8.25, lt) * (1 - ss(8.55, 8.8, lt));
        if (bA > 0.01) {
          c.save(); c.beginPath(); c.rect(GX0 - 9, GY0 - 9, 1410, 644); c.clip();
          c.translate(lerp(240, 1880, clamp((lt - 8.0) / 0.8, 0, 1)), 480); c.rotate(-0.32);
          c.fillStyle = 'rgba(255,252,240,' + (0.16 * bA) + ')';
          c.fillRect(-130, -700, 260, 1400);
          c.restore();
        }
      }
      drawTrio(c, lt);
      { // 网络收稳后在连线上流动的小方块
        const ta = ss(8.0, 8.4, lt);
        if (ta > 0.01) for (const q of TRAV) {
          const p = ((lt - 8.0) * q.sp + q.ph) % 1;
          const [ax, ay] = cellC(q.L.a.i, q.L.a.j), [bx, by] = cellC(q.L.b.i, q.L.b.j);
          c.globalAlpha = ta; c.fillStyle = q.col;
          c.fillRect(lerp(ax, bx, p) - 8, lerp(ay, by, p) - 8, 16, 16);
        }
        c.globalAlpha = 1;
      }
      arcs(c, lt);
      rod(c, lt);
      drawCounter(c, lt);
      drawObjects(c, lt);
      plates(c, lt);
      c.restore();
      captions(c, lt);
    },
  };
})();
