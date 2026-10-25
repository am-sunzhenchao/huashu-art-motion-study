// 「大模型参数」× 1930 橡皮管卡通（s33_rubberhose）——参数＝打孔纸带上的孔点。纯代码，1920×1080，单段 10 秒。
// 管线：①米黄纸底（墙纸竖条＋菱点、墙裙、地板砖缝，缓存）→ ②斜过下半幅的打孔纸带（参数孔点；三颗特写孔带 0.73/-1.2/2.4
//      老片海报字，各做呼吸/明灭/椭圆转）＋左下伸入的白手套打孔爪随 128BPM 节拍抡下打新孔 → ③右端老式「参数放映机」
//      （双片盘旋转、侧摇柄被另一只手套爪绕着摇、弯腿支架、卷带滚轮、压力表指针随计数滚动）→ ④拍二放映机向左上墙幕
//      射出光束，孔点光斑成串飞出逐颗落位增殖成网、连线蔓延，黑底白字计数卡（1.5B→175B→540B→1T+ 圆形光圈翻卡滚动，
//      墙纸菱点随密度逐档加密）→ ⑤拍三增殖停住：翻页的书（数据）、转动的齿轮（方法）、点亮的大灯泡（算力）蹦入归位，
//      网上孔点从 MID 暗孔逐颗点亮成白（变亮变精），乱拍弹跳相位收敛成全场同拍（网络收稳），纸带整条卷进机器
// → ⑥胶片层：saturation 压低饱和＋暖米黄 multiply（老胶片）＋ P.film 闪烁划痕灰尘＋连续正弦慢摆 gate weave。
// 时间：全部角色与母题按 12fps「一拍二」步进（U.stepTime(t,12)），胶片层 24fps——30 年代赛璐珞的顿挫。
// 确定性：随机全 U.rng 种子（孔位、抖动一次性生成）；一切运动是 lt,t 的纯函数。硬红线：无人脸、无机器人、不给物加脸。
SCENES['s33_rubberhose'] = (() => {
  const W = 1920, H = 1080, TAU = Math.PI * 2;
  const { clamp, lerp, ss, ease, rng } = U, P = PAINT;
  const INK = '#141210', PAPER = '#efe7d2', LT = '#d9d0b8', MID = '#a39a84', DK = '#5e574b', WHT = '#fbf7ec', RED = '#b3202a';
  const BEAT = 60 / 128;                                                          // 128BPM
  const bnc = (tq, ph = 0) => Math.abs(Math.sin(Math.PI * (tq / BEAT + ph)));      // 0=落地 1=最高
  const bump = (lt, t0, up = 0.12, dn = 0.3) => ss(t0, t0 + up, lt) * (1 - ss(t0 + up, t0 + up + dn, lt));

  // ---------- 卡通笔法（学 33_rubberhose 原版的 boing/hose/glove：只借笔法，不搬房间构图） ----------
  function boing(c, ax, ay, b, amp, fn, k = 1) {                                   // 绕着地点上弹＋挤压拉伸
    c.save(); c.translate(ax, ay - b * amp); const sq = (1 - b) * 0.09 * k, st = b * 0.05 * k;
    c.scale(1 + sq - st * 0.6, 1 - sq + st); c.translate(-ax, -ay); fn(); c.restore();
  }
  const ink = (c, w = 6) => { c.strokeStyle = INK; c.lineWidth = w; c.lineJoin = 'round'; c.lineCap = 'round'; };
  const F = (c, p, col, w = 6) => { c.fillStyle = col; c.fill(p); ink(c, w); c.stroke(p); };
  const circ = (x, y, r) => { const p = new Path2D(); p.arc(x, y, r, 0, TAU); return p; };
  const ell = (x, y, rx, ry, a = 0) => { const p = new Path2D(); p.ellipse(x, y, rx, ry, a, 0, TAU); return p; };
  const RR = (x, y, w, h, r) => { const p = new Path2D(); p.roundRect(x, y, w, h, r); return p; };
  // 橡皮管：没有肘的一根面条（二次贝塞尔），粗细恒定，黑边加粗
  function hose(c, A, B, bend, w, col) {
    const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2, dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1;
    const C = [mx - dy / L * bend, my + dx / L * bend];
    c.lineCap = 'round'; c.strokeStyle = INK; c.lineWidth = w + 10; c.beginPath(); c.moveTo(A[0], A[1]); c.quadraticCurveTo(C[0], C[1], B[0], B[1]); c.stroke();
    c.strokeStyle = col; c.lineWidth = w; c.stroke();
  }
  // 白手套（开掌，抓摇柄用）：四指＋外翻袖口＋手背三道线
  function glove(c, x, y, ang, s = 1) {
    c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s);
    F(c, RIG.smooth([[-30, -14], [-8, -24], [16, -22], [30, -12], [34, 4], [24, 20], [4, 24], [-20, 18], [-32, 4]]), WHT, 5);
    [[22, -18], [30, -6], [30, 8]].forEach(fx => F(c, ell(fx[0] + 6, fx[1], 11, 8, 0.2), WHT, 5));
    F(c, RIG.smooth([[-30, -20], [-46, -26], [-50, 0], [-46, 26], [-30, 20], [-26, 0]]), WHT, 5);
    ink(c, 3); [-6, 2, 10].forEach(xx => { c.beginPath(); c.moveTo(xx - 10, xx * 0.2 - 2); c.lineTo(xx + 2, xx * 0.2 - 4); c.stroke(); });
    c.restore();
  }
  // 打孔爪：白手套握拳（四指抱拳＋拇指斜搭＋外翻袖口）
  function fist(c, x, y, ang, s = 1) {
    c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s);
    F(c, RIG.smooth([[-32, -22], [-8, -34], [16, -32], [32, -18], [36, 2], [26, 20], [2, 28], [-24, 26], [-36, 8]]), WHT, 6);
    ink(c, 3.5); [-14, 2, 17].forEach(kx => { c.beginPath(); c.moveTo(kx - 2, -30 + Math.abs(kx) * 0.25); c.lineTo(kx + 3, -12); c.stroke(); });
    F(c, ell(-18, -4, 15, 10, 0.55), WHT, 5);
    F(c, RIG.smooth([[-38, -26], [-54, -30], [-58, 0], [-52, 28], [-34, 24], [-34, 0]]), WHT, 5);
    c.restore();
  }

  // ---------- 打孔纸带 ----------
  const TA = [-80, 604], TB = [1332, 656], TL = Math.hypot(TB[0] - TA[0], TB[1] - TA[1]);
  const TD = [(TB[0] - TA[0]) / TL, (TB[1] - TA[1]) / TL], TN = [-TD[1], TD[0]];
  const CONSUME = 1305;                                                           // 卷进卷带箱（x≈1207，箱 1196 起）
  const tapePt = s => [TA[0] + TD[0] * s + TN[0] * Math.sin(s * 0.0071 + 1.2) * 9, TA[1] + TD[1] * s + TN[1] * Math.sin(s * 0.0071 + 1.2) * 9];
  const advPx = tq => Math.floor(tq / (2 * BEAT)) * 52;                            // 纸带两拍步进一格
  // 三颗特写参数孔（呼吸/明灭/椭圆转）；拍一被放大端详（×1.42），拍二开头落回原位随带卷走
  const HERO = [
    { s: 452, r: 46, num: '0.73', dx: 0, dy: -95, ph: 0 },
    { s: 736, r: 40, num: '-1.2', dx: 74, dy: 78, ph: 0.33 },
    { s: 1016, r: 43, num: '2.4', dx: 0, dy: -92, ph: 0.66 },
  ];
  const heroScale = lt => 1.42 - 0.42 * ss(3.0, 3.6, lt);
  const PUNCH = [{ t0: 0.62, s: 500 }, { t0: 1.56, s: 640 }, { t0: 2.50, s: 585 }]; // 三次抡打
  const SIDE = (() => {                                                           // 纸带上原有的一排参数孔
    const r = rng(332), o = [];
    for (let i = 0; i < 15; i++) { const s = 120 + r() * 1080; if (HERO.every(h => Math.abs(h.s - s) > 90)) o.push({ s, r: 14 + r() * 8 }); }
    return o;
  })();

  // ---------- 墙幕上的孔点网络 ----------
  const SCR = { x0: 150, y0: 226, x1: 880, y1: 520 };
  const SLOT = (() => {
    const r = rng(331), o = [];
    for (let row = 0; row < 5; row++) for (let col = 0; col < 8; col++) {
      const x = 250 + col * 82 + (row % 2) * 41 + (r() - .5) * 16, y = 264 + row * 58 + (r() - .5) * 14;
      o.push({ x, y, r: 10.5 + r() * 3.5, ph: r(), ctrl: (r() - .5) * 120 });
    }
    o.forEach(p => p.d = Math.hypot(p.x - 530, p.y - 376));
    o.sort((a, b) => a.d - b.d);                                                  // 从幕心逐环出生
    o.forEach((p, i) => { p.birth = 3.18 + 2.75 * i / (o.length - 1); });
    const lk = [];
    for (let i = 0; i < o.length; i++) for (let j = i + 1; j < o.length; j++)
      if (Math.hypot(o[i].x - o[j].x, o[i].y - o[j].y) < 92) lk.push([i, j, Math.min(o[i].birth, o[j].birth)]);
    return { pts: o, links: lk };
  })();

  // ---------- 计数（真实序列，对数段间连续滚动） ----------
  const STG = [3.5, 4.4, 5.3, 6.15], VAL = [1.5, 175, 540, 1000];
  function countVal(lt) {
    if (lt < STG[0]) return VAL[0];
    for (let k = 1; k < 4; k++) if (lt < STG[k]) { const a = STG[k - 1], b = STG[k]; return lerp(VAL[k - 1], VAL[k], ease.inOut(clamp((lt - a) / (b - a)))); }
    return 1000;
  }
  const fmt = v => v >= 999.5 ? '1T+' : (v < 10 ? v.toFixed(1) : String(Math.round(v))) + 'B';
  const stageBlend = lt => ss(3.6, 3.95, lt) + ss(4.5, 4.85, lt) + ss(5.4, 5.75, lt) + ss(6.3, 6.65, lt);

  // ---------- 相机：一镜到底，pivot 固定画面中心，只做小幅缓推/缓拉（近景特写靠内容：拍一参数孔放大端详） ----------
  function camZ(lt) {
    if (lt < 3) return lerp(1.06, 1.085, ss(0.2, 2.9, lt));                     // 拍一 微缓推
    if (lt < 5.6) return lerp(1.085, 1.012, ss(3, 5.6, lt));                    // 拍二 缓拉远
    if (lt < 7.4) return lerp(1.012, 1.0, ss(5.6, 7.4, lt));                    // 收
    return lerp(1.0, 0.99, ss(7.6, 9.5, lt));                                   // 拍三 停＋轻拉全貌
  }

  // ---------- 静态底（缓存，含出血） ----------
  const bgWall = () => P.cached('s33_wall', 2000, 1150, g => {
    g.fillStyle = PAPER; g.fillRect(-40, -35, 2080, 1220);
    for (let x = -40; x < 1960; x += 72) { g.fillStyle = '#e5dcc5'; g.fillRect(x, -35, 34, 775); }        // 墙纸竖条
    g.fillStyle = '#cfc5ab';                                                                                     // 菱点
    for (let y = 20; y < 760; y += 84) for (let x = -10 + ((y / 84) % 2) * 36; x < 1960; x += 72) {
      g.beginPath(); g.moveTo(x, y - 8); g.lineTo(x + 7, y); g.lineTo(x, y + 8); g.lineTo(x - 7, y); g.fill();
    }
    g.fillStyle = LT; g.fillRect(-40, 740, 2080, 44); ink(g, 4); g.beginPath(); g.moveTo(-40, 740); g.lineTo(1960, 740); g.stroke();  // 墙裙
    g.fillStyle = DK; g.fillRect(-40, 784, 2080, 12);
    g.fillStyle = '#cdc3a8'; g.fillRect(-40, 796, 2080, 390);                                                    // 地板
    g.strokeStyle = '#8a816c'; g.lineWidth = 3;
    for (let y = 850; y < 1200; y += 58) { g.beginPath(); g.moveTo(-40, y); g.lineTo(1960, y); g.stroke(); }
    for (let k = 0; k < 46; k++) { const y = 850 + Math.floor(k / 8) * 58, x = (k % 8) * 260 + (Math.floor(k / 8) % 2) * 130 - 40; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 58); g.stroke(); }
    const vg = g.createRadialGradient(980, 430, 380, 980, 470, 1350); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(60,50,35,.32)');
    g.fillStyle = vg; g.fillRect(-40, -35, 2080, 1220);
  });
  const bgDense = () => P.cached('s33_dense', 2000, 1150, g => {                                                  // 密度升级层
    g.fillStyle = '#8a816c';
    for (let y = 16; y < 790; y += 42) for (let x = -6 + ((y / 42) % 2) * 21; x < 1960; x += 42) {
      g.beginPath(); g.moveTo(x, y - 5); g.lineTo(x + 4.5, y); g.lineTo(x, y + 5); g.lineTo(x - 4.5, y); g.fill();
    }
  });

  // ---------- 墙幕（杆、吊绳、下摆荷叶边随拍甩） ----------
  function screenSheet(c, tq, flut) {
    ink(c, 4); c.beginPath(); c.moveTo(192, 214); c.lineTo(150, -30); c.moveTo(840, 214); c.lineTo(888, -30); c.stroke();
    ink(c, 9); c.beginPath(); c.moveTo(126, 214); c.lineTo(904, 214); c.stroke();
    F(c, circ(126, 214, 9), DK, 4); F(c, circ(904, 214, 9), DK, 4);
    const d = 15 + 4 * flut, p = new Path2D(); p.moveTo(SCR.x0, SCR.y0);
    p.lineTo(SCR.x0, SCR.y1 - 14);
    for (let x = SCR.x0; x < SCR.x1 - 1; x += 82) p.quadraticCurveTo(x + 41, SCR.y1 + d, Math.min(x + 82, SCR.x1), SCR.y1 - 14);
    p.lineTo(SCR.x1, SCR.y0); p.closePath();
    F(c, p, LT, 5);
    ink(c, 3); for (let x = SCR.x0 + 82; x < SCR.x1 - 20; x += 164) { c.beginPath(); c.moveTo(x, SCR.y1 - 8); c.quadraticCurveTo(x + 10, SCR.y1 + 6, x + 4, SCR.y1 + d - 6); c.stroke(); }
  }

  // ---------- 打孔纸带（拍三整条卷进机器） ----------
  function tape(c, lt, tq) {
    const st = ss(7.0, 8.1, lt), sStart = lerp(0, CONSUME - 14, st);
    if (sStart > CONSUME - 16) return;
    const dip = PUNCH.reduce((s, p) => s + bump(lt, p.t0 + 0.47 * 0.94, 0.1, 0.24), 0);   // 打孔瞬间整条纸带颤一下
    c.save(); c.translate(0, 5 * dip);
    const e0 = tapePt(sStart), e1 = tapePt(CONSUME);
    const p = new Path2D();
    p.moveTo(e0[0] + TN[0] * 30, e0[1] + TN[1] * 30); p.lineTo(e1[0] + TN[0] * 30, e1[1] + TN[1] * 30);
    p.lineTo(e1[0] - TN[0] * 30, e1[1] - TN[1] * 30); p.lineTo(e0[0] - TN[0] * 30, e0[1] - TN[1] * 30); p.closePath();
    F(c, p, LT, 5);
    if (st > 0.01) F(c, ell(e0[0], e0[1], 9, 33, Math.atan2(TD[1], TD[0])), PAPER, 4);    // 卷走的带头
    const adv = advPx(tq), numFade = 1 - ss(3.0, 3.4, lt), hs = heroScale(lt);
    for (let k = Math.floor(sStart / 52); k * 52 + adv <= CONSUME; k++) {                 // 中缝锁孔（步进前移）
      const s = k * 52 + adv - 26; if (s < sStart) continue; const pt = tapePt(s);
      F(c, circ(pt[0], pt[1], 6), MID, 2.5);
    }
    for (const d of SIDE) {                                                               // 原有参数孔
      const s = d.s + adv; if (s < sStart || s > CONSUME) continue; const pt = tapePt(s);
      F(c, circ(pt[0], pt[1], d.r), MID, 3);
    }
    for (const q of PUNCH) {                                                              // 抡出来的新参数孔（白亮弹出）
      const born = q.t0 + 0.47 * 0.94, s = q.s + adv; if (lt < born || s < sStart || s > CONSUME) continue;
      const pt = tapePt(s), pop = ease.outBack(clamp((lt - born) / 0.25, 0, 1));
      F(c, circ(pt[0], pt[1], 20 * pop), WHT, 3.5);
    }
    for (let i = 0; i < 3; i++) {                                                         // 三颗特写孔＋海报字
      const h = HERO[i], s = h.s + adv; if (s < sStart || s > CONSUME) continue;
      const pt = tapePt(s);
      c.save(); c.translate(pt[0], pt[1] - bnc(tq, h.ph) * 7 * hs); c.scale(hs, hs);
      if (i === 0) F(c, circ(0, 0, h.r * (1 + 0.07 * Math.sin(tq * 2.2))), WHT, 4);                        // 呼吸
      else if (i === 1) { c.globalAlpha = 0.72 + 0.28 * Math.abs(Math.sin(tq * 1.7 + 1)); F(c, circ(0, 0, h.r), WHT, 4); c.globalAlpha = 1; } // 明灭
      else F(c, ell(0, 0, h.r, h.r * (0.78 + 0.2 * Math.sin(tq * 2.4)), tq * 0.8), WHT, 4);                // 椭圆转
      c.restore();
      if (numFade > 0.01) {
        const nb = bnc(tq, h.ph + 0.06);
        c.save(); c.globalAlpha = numFade; c.translate(pt[0] + h.dx * hs, pt[1] + h.dy * hs - nb * 6 * hs); c.scale((1 + 0.06 * nb) * hs, (1 + 0.06 * nb) * hs);
        c.font = '62px "Rye-400"'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillStyle = INK; c.fillText(h.num, 4, 5); c.fillStyle = WHT; c.fillText(h.num, 0, 0);
        c.restore();
      }
    }
    c.restore();
  }

  // ---------- 白手套打孔爪（只出手）：举→砸→按→抬，三轮抡打 ----------
  function puncher(c, lt, tq) {
    const rest = [300, 1128], base = [10, 1150];
    let act = null; for (const q of PUNCH) if (lt >= q.t0) act = q;
    let g = rest, imp = 0, T = null;
    if (act) {
      const ph = (lt - act.t0) / 0.94, Tp = tapePt(act.s), R = [Tp[0], Tp[1] - 158], S = [Tp[0], Tp[1] - 16], R2 = [Tp[0] + 34, Tp[1] - 176];
      if (ph < 0.33) { const q = ss(0, 1, ph / 0.33); g = [lerp(rest[0], R[0], q), lerp(rest[1], R[1], q)]; }
      else if (ph < 0.46) { const q = ss(0, 1, (ph - 0.33) / 0.13); g = [lerp(R[0], S[0], q), lerp(R[1], S[1], q)]; }
      else if (ph < 0.6) { g = S; imp = 1 - (ph - 0.46) / 0.14; T = Tp; }
      else if (ph < 1) { const q = ss(0, 1, (ph - 0.6) / 0.4); g = [lerp(S[0], R2[0], q), lerp(S[1], R2[1], q)]; }
      else g = R2;
    }
    const ex = ss(3.46, 3.95, lt);
    if (ex > 0) g = [lerp(g[0], rest[0], ex), lerp(g[1], rest[1], ex)];
    const al = ss(0.12, 0.55, lt) * (1 - ss(3.95, 4.3, lt));
    if (al <= 0.01) return;
    c.save(); c.globalAlpha = al;
    hose(c, base, [g[0], g[1] + 26], 40 * (0.5 - clamp((lt - 0.62) / 2.5)) + 20, 16, '#f4eedc');
    fist(c, g[0], g[1], -1.95 + 0.5 * clamp((lt - 0.6) / 2.8), 1.15);
    if (imp > 0 && T) { ink(c, 4.5); for (let k = 0; k < 5; k++) { const a = -0.4 + k * 0.2; c.beginPath(); c.moveTo(T[0] + Math.cos(a) * 26, T[1] - 14 + Math.sin(a) * 26); c.lineTo(T[0] + Math.cos(a) * (44 + imp * 14), T[1] - 14 + Math.sin(a) * (44 + imp * 14)); c.stroke(); } }
    c.restore();
  }

  // ---------- 老式参数放映机 ----------
  const LENS = [1246, 551];
  function machine(c, lt, tq) {
    const v = countVal(tq);
    boing(c, 1580, 872, bnc(tq, 0.5), 2.2, () => {                                  // 大机器只随拍轻轻起伏（挤压系数压小）
      [[1444, 1], [1728, -1]].forEach(l => {                                              // 弯腿支架
        ink(c, 30); c.beginPath(); c.moveTo(l[0], 690); c.quadraticCurveTo(l[0] - l[1] * 26, 800, l[0] - l[1] * 6, 866); c.stroke(); c.strokeStyle = MID; c.lineWidth = 17; c.stroke();
        F(c, ell(l[0] - l[1] * 6, 872, 34, 14), INK, 4);
      });
      const wig = Math.sin(tq * 2.5) * 14;                                               // 电源线（橡皮管）
      c.strokeStyle = INK; c.lineWidth = 13; c.beginPath(); c.moveTo(1758, 662); c.bezierCurveTo(1810, 730 + wig, 1826, 800 - wig, 1836, 866); c.stroke(); c.strokeStyle = DK; c.lineWidth = 6; c.stroke();
      F(c, RR(1332, 330, 452, 366, 44), PAPER, 7);                                        // 机身
      ink(c, 3); c.beginPath(); c.roundRect(1344, 342, 428, 342, 36); c.stroke();
      F(c, RR(1372, 388, 232, 168, 22), LT, 5);                                           // 面板＋散热缝＋铆钉
      for (let i = 0; i < 5; i++) { c.fillStyle = DK; c.fillRect(1388, 402 + i * 30, 200, 11); }
      for (let x = 1362; x < 1770; x += 88) { F(c, circ(x, 356, 5), MID, 2); F(c, circ(x, 672, 5), MID, 2); }
      c.save(); c.translate(1655, 556);                                                   // 压力表（指针随计数滚）
      const dial = new Path2D(); dial.arc(0, 0, 52, Math.PI, TAU); dial.closePath();
      F(c, dial, LT, 5);
      c.strokeStyle = RED; c.lineWidth = 7; c.globalAlpha = 0.6; c.beginPath(); c.arc(0, 0, 44, -0.55, -0.12); c.stroke(); c.globalAlpha = 1;
      ink(c, 3); for (let k = 0; k <= 4; k++) { const a = Math.PI + k * Math.PI / 4; c.beginPath(); c.moveTo(Math.cos(a) * 40, Math.sin(a) * 40); c.lineTo(Math.cos(a) * 30, Math.sin(a) * 30); c.stroke(); }
      const pr = (Math.log10(Math.max(v, 1.5)) - 0.15) / 2.85, na = Math.PI * (1.06 + 0.88 * clamp(pr, 0, 1)) + 0.03 * Math.sin(tq * 4.7);   // 拍三满值后指针仍在轻轻颤
      ink(c, 5); c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(na) * 42, Math.sin(na) * 42); c.stroke(); F(c, circ(0, 0, 6), INK, 2);
      c.restore();
      [[1462, 262, 92, tq * 1.4], [1696, 300, 76, -tq * 1.1]].forEach(([x, y, r0, rot]) => {   // 双片盘
        F(c, circ(x, y, r0), PAPER, 7);
        ink(c, 4); c.beginPath(); c.arc(x, y, r0 - 22, 0, TAU); c.stroke();
        c.save(); c.translate(x, y); c.rotate(rot);
        ink(c, 10); for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; c.beginPath(); c.moveTo(Math.cos(a) * 16, Math.sin(a) * 16); c.lineTo(Math.cos(a) * (r0 - 24), Math.sin(a) * (r0 - 24)); c.stroke(); }
        c.restore();
        F(c, circ(x, y, 18), MID, 5);
      });
      const sag = Math.sin(tq * 2.6) * 7;                                                // 片环
      c.strokeStyle = INK; c.lineWidth = 9; c.beginPath(); c.moveTo(1462, 354); c.quadraticCurveTo(1570, 420 + sag, 1696, 376); c.stroke(); c.strokeStyle = LT; c.lineWidth = 4; c.stroke();
      F(c, RR(1196, 596, 152, 122, 18), PAPER, 6);                                        // 卷带箱＋滚轮
      [[1218, 620], [1218, 694]].forEach(([x, y]) => {
        F(c, circ(x, y, 24), MID, 5);
        c.save(); c.translate(x, y); c.rotate(tq * 2.6); ink(c, 4); for (let k = 0; k < 3; k++) { const a = k / 3 * TAU; c.beginPath(); c.moveTo(Math.cos(a) * 5, Math.sin(a) * 5); c.lineTo(Math.cos(a) * 18, Math.sin(a) * 18); c.stroke(); } c.restore();
      });
      F(c, RR(1246, 512, 104, 78, 14), PAPER, 7);                                         // 镜头
      ink(c, 4); c.beginPath(); c.moveTo(1276, 518); c.lineTo(1276, 584); c.moveTo(1300, 518); c.lineTo(1300, 584); c.stroke();
      const on = ss(3.05, 3.5, lt);
      F(c, ell(1246, 551, 13, 36), on > 0 ? WHT : LT, 5);
      if (on > 0) { const pu = bnc(tq, 0.2) * on; ink(c, 3.5); for (let k = 0; k < 4; k++) { const a = -0.7 + k * 0.47; c.beginPath(); c.moveTo(1240 - Math.cos(a) * 8, 551 - Math.sin(a) * 26); c.lineTo(1240 - Math.cos(a) * (20 + pu * 12), 551 - Math.sin(a) * (44 + pu * 12)); c.stroke(); } }
      const cr = 1772, cy = 500, rot = tq * 2.6, kx = cr + Math.cos(rot) * 46, ky = cy + Math.sin(rot) * 46;   // 摇柄＋手套爪
      ink(c, 14); c.beginPath(); c.moveTo(cr, cy); c.lineTo(kx, ky); c.stroke(); c.strokeStyle = LT; c.lineWidth = 7; c.stroke();
      F(c, circ(cr, cy, 12), MID, 5);
      hose(c, [1786, 598], [kx, ky + 18], 34, 13, '#f4eedc');
      glove(c, kx, ky, rot + Math.PI / 2, 0.8);
    }, 0.02);
  }

  // ---------- 光束 ----------
  function beam(c, lt, tq) {
    const g = ss(3.05, 3.62, lt); if (g <= 0.01) return;
    const dim = 1 - 0.22 * ss(7.2, 8.0, lt);
    const bob = (bnc(tq, 0.25) - 0.5) * 10;
    const FT = [lerp(LENS[0], 884, g), lerp(LENS[1], 234, g) + bob], FB = [lerp(LENS[0], 884, g), lerp(LENS[1], 516, g) + bob];
    const a = (0.33 + 0.1 * bnc(tq, 0.2)) * Math.min(1, g * 1.5) * dim;
    c.save(); c.globalCompositeOperation = 'lighter';
    c.fillStyle = 'rgba(251,247,236,' + a.toFixed(3) + ')';
    c.beginPath(); c.moveTo(LENS[0], LENS[1]); c.quadraticCurveTo((LENS[0] + FT[0]) / 2, (LENS[1] + FT[1]) / 2 - 26, FT[0], FT[1]);
    c.lineTo(FB[0], FB[1]); c.quadraticCurveTo((LENS[0] + FB[0]) / 2, (LENS[1] + FB[1]) / 2 + 26, LENS[0], LENS[1]); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,' + (0.16 * g * dim).toFixed(3) + ')';
    c.beginPath(); c.moveTo(LENS[0], LENS[1]); c.lineTo(FT[0] - 14, (FT[1] + FB[1]) / 2 - 8); c.lineTo(FT[0] - 14, (FT[1] + FB[1]) / 2 + 8); c.closePath(); c.fill();
    c.restore();
  }

  // ---------- 墙幕网络：飞行光斑 → 落位 → 变亮变精 → 收稳 ----------
  function network(c, lt, tq) {
    const conv = ss(7.5, 9.6, lt);
    const lit = ss(3.4, 3.9, lt) * (1 - 0.1 * ss(7.2, 8.0, lt));                          // 幕布被光束照亮一点
    if (lit > 0) { c.fillStyle = 'rgba(251,247,236,' + (0.1 * lit).toFixed(3) + ')'; c.fillRect(SCR.x0 + 4, SCR.y0 + 4, SCR.x1 - SCR.x0 - 8, SCR.y1 - SCR.y0 - 8); }
    const pts = SLOT.pts;
    for (const [i, j, bL] of SLOT.links) {                                                // 连线（两端落位后浮现）
      const a = ss(bL + 0.72, bL + 1.02, lt); if (a <= 0) continue;
      const A = pts[i], B = pts[j], bA = bnc(tq, lerp(A.ph, 0, conv)) * 6 * (1 - 0.45 * conv), bB = bnc(tq, lerp(B.ph, 0, conv)) * 6 * (1 - 0.45 * conv);
      c.strokeStyle = DK; c.globalAlpha = 0.55 * a; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(A.x, A.y - bA); c.lineTo(B.x, B.y - bB); c.stroke(); c.globalAlpha = 1;
    }
    pts.forEach((p, i) => {
      if (lt < p.birth) return;
      const fl = clamp((lt - p.birth) / 0.72, 0, 1), brt = ss(7.35 + p.d * 0.0022, 7.8 + p.d * 0.0022, lt);
      let x, y, r0;
      if (fl < 1) {                                                                       // 光束里飞：镜头→幕位
        const q = ease.inOut(fl), M = LENS, u = 1 - q;
        const cx = (M[0] + p.x) / 2 + (M[1] - p.y) * 0.18, cy = (M[1] + p.y) / 2 - (M[0] - p.x) * 0.18 + p.ctrl * 0.4;
        x = u * u * M[0] + 2 * u * q * cx + q * q * p.x; y = u * u * M[1] + 2 * u * q * cy + q * q * p.y;
        r0 = 5 + 7 * q;
      } else {
        x = p.x; y = p.y - bnc(tq, lerp(p.ph, 0, conv)) * 3.6 * (1 - 0.45 * conv); r0 = p.r;
      }
      ink(c, 3); c.beginPath(); c.arc(x, y, r0, 0, TAU);
      c.fillStyle = brt > 0.5 ? WHT : MID; c.fill(); c.stroke();                          // 未点亮＝暗孔影，拍三点亮＝白
      if (brt > 0) {
        c.fillStyle = WHT; c.globalAlpha = brt; c.beginPath(); c.arc(x, y, r0 * (0.3 + 0.2 * brt), 0, TAU); c.fill(); c.globalAlpha = 1;
        if (i % 7 === 2) { c.strokeStyle = RED; c.globalAlpha = 0.85 * brt; c.lineWidth = 3; c.beginPath(); c.arc(x, y, r0 + 4.5, 0, TAU); c.stroke(); c.globalAlpha = 1; }  // 一点红：个别孔描红
        if (i % 5 === 0 && brt > 0.6) { ink(c, 2.5); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + tq * 0.5; c.beginPath(); c.moveTo(x + Math.cos(a) * (r0 + 3), y + Math.sin(a) * (r0 + 3)); c.lineTo(x + Math.cos(a) * (r0 + 12), y + Math.sin(a) * (r0 + 12)); c.stroke(); } }
      }
    });
  }

  // ---------- 计数卡（黑底白字，圆形光圈翻卡；1T+ 红字红圈一次重音） ----------
  function card(c, lt, tq) {
    if (lt < 3.32) return;
    const ex = ss(6.85, 7.18, lt), pop = ease.outBack(clamp((lt - 3.32) / 0.4, 0, 1));
    const v = countVal(tq), oneT = lt >= STG[3] - 0.02;
    let ir = ss(3.42, 3.74, lt);
    for (let k = 1; k < 3; k++) ir *= (1 - ss(STG[k] - 0.18, STG[k] - 0.03, lt)) * ss(STG[k] + 0.03, STG[k] + 0.2, lt);
    ir *= 1 - ex;
    const sc = pop * (1 + 0.05 * bump(lt, STG[3], 0.14, 0.4)) * (1 - 0.8 * ex);
    c.save(); c.globalAlpha = Math.min(1, (lt - 3.32) / 0.2) * (1 - ex);
    c.translate(1000 + ex * 130, 430 + ex * 55); c.scale(sc, sc);
    c.beginPath(); c.roundRect(-230, -150, 460, 300, 22); c.fillStyle = '#141210'; c.fill(); ink(c, 7); c.stroke();
    ink(c, 3); c.beginPath(); c.roundRect(-216, -136, 432, 272, 16); c.stroke();
    [[-216, -136], [216, -136], [-216, 136], [216, 136]].forEach(q => F(c, circ(q[0], q[1], 5), WHT, 2));
    c.fillStyle = WHT; c.font = '40px "LXGWWenKai-500"'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('参数量', 0, -102);
    c.save(); c.beginPath(); c.arc(0, 28, 128 * ir, 0, TAU); c.clip();
    c.font = '100px "Rye-400"'; c.fillStyle = oneT ? RED : WHT;
    c.fillText(fmt(v), 0, 44); c.restore();
    if (ir > 0.1) { ink(c, 3); c.beginPath(); c.arc(0, 28, 128 * ir, 0, TAU); c.stroke(); }
    if (oneT && ex <= 0) { const rp = bump(lt, STG[3], 0.16, 0.5); if (rp > 0) { c.strokeStyle = RED; c.globalAlpha = 0.8 * rp; c.lineWidth = 7; c.beginPath(); c.arc(0, 28, 150 - (1 - rp) * 30, 0, TAU); c.stroke(); c.globalAlpha = 1; } }
    c.restore();
  }

  // ---------- 拍三：三件橡皮管物蹦跳归位 ----------
  function trio(c, lt, tq) {
    const T0 = [7.15, 7.55, 7.95], PH = [0.15, 0.5, 0.85];
    // 书：三本一摞，顶册封面写「数据」，册页随拍翻
    (() => {
      const k = 0, rk = ease.outBack(clamp((lt - T0[k]) / 0.55, 0, 1)), a = Math.min(1, (lt - T0[k]) / 0.25);
      if (a <= 0) return;
      boing(c, 330, 866, bnc(tq, PH[k]), 5, () => {
        c.save(); c.globalAlpha = a; c.translate(0, (1 - rk) * 400);
        [[208, 800, 244, 66, LT], [226, 734, 208, 66, WHT], [244, 678, 172, 56, LT]].forEach(bk => {
          F(c, RR(bk[0], bk[1], bk[2], bk[3], 9), bk[4], 6);
          ink(c, 3); c.beginPath(); c.moveTo(bk[0] + bk[2] - 34, bk[1] + 6); c.lineTo(bk[0] + bk[2] - 34, bk[1] + bk[3] - 6); c.stroke();
          c.strokeStyle = MID; c.lineWidth = 2.5; for (let yy = bk[1] + 8; yy < bk[1] + bk[3] - 6; yy += 9) { c.beginPath(); c.moveTo(bk[0] + bk[2] - 26, yy); c.lineTo(bk[0] + bk[2] - 8, yy); c.stroke(); }
        });
        c.fillStyle = INK; c.font = '42px "LXGWWenKai-500"'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('数据', 330, 708);
        const fp = (tq % (4 * BEAT)) / (4 * BEAT);                                        // 翻页
        if (fp < 0.32 && rk >= 1) {
          const q = fp / 0.32, lift = Math.sin(q * Math.PI) * 64;
          c.beginPath(); c.moveTo(412, 684);
          c.quadraticCurveTo(330 + (q - 0.5) * 40, 684 - lift, 330 - (1 - q) * 168, 684 - lift * 0.4);
          c.quadraticCurveTo(330 - (1 - q) * 60, 700, 244 + q * 8, 700); c.closePath();
          c.fillStyle = WHT; c.fill(); ink(c, 4); c.stroke();
        }
        c.restore();
      }, 0.6);
    })();
    // 齿轮：旋转，轴心铆「方法」铭牌
    (() => {
      const k = 1, rk = ease.outBack(clamp((lt - T0[k]) / 0.55, 0, 1)), a = Math.min(1, (lt - T0[k]) / 0.25);
      if (a <= 0) return;
      boing(c, 700, 866, bnc(tq, PH[k]), 5, () => {
        c.save(); c.globalAlpha = a; c.translate(0, (1 - rk) * 400);
        ink(c, 20); c.beginPath(); c.moveTo(660, 860); c.lineTo(644, 872); c.moveTo(740, 860); c.lineTo(756, 872); c.stroke();
        const rot = -tq * 0.55, gp = new Path2D();
        for (let i = 0; i < 20; i++) { const an = rot + i / 20 * TAU, r0 = i % 2 ? 96 : 118; const px = 700 + Math.cos(an) * r0, py = 746 + Math.sin(an) * r0; i ? gp.lineTo(px, py) : gp.moveTo(px, py); }
        gp.closePath(); F(c, gp, MID, 6);
        c.save(); c.translate(700, 746); c.rotate(rot);
        for (let i = 0; i < 6; i++) { const an = i / 6 * TAU; F(c, circ(Math.cos(an) * 58, Math.sin(an) * 58, 5), PAPER, 2.5); }
        c.restore();
        F(c, RR(622, 718, 156, 58, 10), PAPER, 5);
        [[630, 726], [770, 726], [630, 768], [770, 768]].forEach(q => F(c, circ(q[0], q[1], 3.5), INK, 1.5));
        c.fillStyle = INK; c.font = '38px "LXGWWenKai-500"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('方法', 700, 748);
        c.restore();
      }, 0.6);
    })();
    // 灯泡：木箱底座（「算力」）＋灯丝点亮泛暖光
    (() => {
      const k = 2, rk = ease.outBack(clamp((lt - T0[k]) / 0.55, 0, 1)), a = Math.min(1, (lt - T0[k]) / 0.25);
      if (a <= 0) return;
      boing(c, 1050, 866, bnc(tq, PH[k]), 5, () => {
        c.save(); c.globalAlpha = a; c.translate(0, (1 - rk) * 400);
        F(c, RR(986, 798, 128, 68, 8), LT, 6);
        ink(c, 3); c.beginPath(); c.moveTo(1030, 802); c.lineTo(1030, 862); c.moveTo(1070, 802); c.lineTo(1070, 862); c.stroke();
        c.fillStyle = INK; c.font = '44px "LXGWWenKai-500"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('算力', 1050, 832);
        const lit = ss(8.3, 8.6, lt), pu = lit * (0.85 + 0.15 * bnc(tq, 0.3));
        F(c, RIG.smooth([[1026, 798], [1032, 772], [1068, 772], [1074, 798]]), MID, 5);     // 灯颈
        ink(c, 3); c.beginPath(); c.moveTo(1028, 782); c.lineTo(1072, 782); c.moveTo(1032, 790); c.lineTo(1068, 790); c.stroke();
        if (lit > 0.01) {                                                                   // 暖光（一点红）
          const gg = c.createRadialGradient(1050, 706, 0, 1050, 706, 200);
          gg.addColorStop(0, 'rgba(179,32,42,' + (0.34 * pu).toFixed(3) + ')'); gg.addColorStop(0.6, 'rgba(179,32,42,' + (0.12 * pu).toFixed(3) + ')'); gg.addColorStop(1, 'rgba(179,32,42,0)');
          c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = gg; c.beginPath(); c.arc(1050, 706, 200, 0, TAU); c.fill(); c.restore();
          c.strokeStyle = RED; c.globalAlpha = 0.55 * pu; c.lineWidth = 5;
          for (let i = 0; i < 8; i++) { const an = i / 8 * TAU + 0.2; c.beginPath(); c.moveTo(1050 + Math.cos(an) * 112, 706 + Math.sin(an) * 112); c.lineTo(1050 + Math.cos(an) * (136 + bnc(tq, 0.3) * 14), 706 + Math.sin(an) * (136 + bnc(tq, 0.3) * 14)); c.stroke(); }
          c.globalAlpha = 1;
        }
        c.beginPath(); c.arc(1050, 706, 98, 0, TAU);
        c.fillStyle = 'rgba(251,247,236,' + (0.32 + 0.3 * lit * (0.8 + 0.2 * bnc(tq, 0.3))).toFixed(3) + ')'; c.fill(); ink(c, 6); c.stroke();
        ink(c, 4); c.beginPath(); c.moveTo(1024, 770); c.lineTo(1024, 740); c.lineTo(1038, 748); c.lineTo(1050, 736); c.lineTo(1062, 748); c.lineTo(1076, 740); c.lineTo(1076, 770); c.stroke();
        if (lit > 0.01) { c.strokeStyle = RED; c.globalAlpha = pu; c.lineWidth = 5.5; c.stroke(); c.globalAlpha = 1; }      // 灯丝烧红
        c.restore();
      }, 0.6);
    })();
  }

  // ---------- 老戏院灯牌（屏上字，画面坐标：跑马灯泡逐拍跑，红色） ----------
  const MTXT = [[0.05, 2.94, '参数', 104], [3.08, 6.94, '疯狂卷参数', 82], [7.08, 10.6, '参数之外', 92]];
  function marquee(c, lt, tq) {
    for (const [t0, t1, txt, size] of MTXT) {
      const pIn = clamp((lt - t0) / 0.28, 0, 1), pOut = 1 - clamp((lt - (t1 - 0.22)) / 0.22, 0, 1);
      if (pIn <= 0 || pOut <= 0) continue;
      c.save(); c.globalAlpha = pIn * pOut;
      c.font = size + 'px "LXGWWenKai-500"'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      const tw = c.measureText(txt).width, x0 = 132, y0 = 52, bw = tw + 116, bh = size + 92, cy = y0 + bh / 2;
      const inS = 1 + 0.04 * (1 - pIn) + 0.04 * (1 - pOut);
      c.translate(x0 + 58 + tw / 2, cy); c.scale(inS, inS); c.translate(-(x0 + 58 + tw / 2), -cy);
      ink(c, 6); c.beginPath(); c.moveTo(x0 + 64, y0); c.lineTo(x0 + 64, 4); c.moveTo(x0 + bw - 64, y0); c.lineTo(x0 + bw - 64, 4); c.stroke();   // 吊链
      F(c, RR(x0, y0, bw, bh, 26), PAPER, 8);
      ink(c, 3); c.beginPath(); c.roundRect(x0 + 11, y0 + 11, bw - 22, bh - 22, 18); c.stroke();
      const bs = [];
      for (let x = x0 + 66; x < x0 + bw - 40; x += 66) { bs.push([x, y0 + 16]); bs.push([x, y0 + bh - 16]); }
      for (let y = y0 + 82; y < y0 + bh - 50; y += 66) { bs.push([x0 + 16, y]); bs.push([x0 + bw - 16, y]); }
      const li = Math.floor(tq / BEAT) % bs.length;
      bs.forEach((b, i) => {
        const on = i === li || i === (li + 1) % bs.length;
        if (on) {
          const gg = c.createRadialGradient(b[0], b[1], 0, b[0], b[1], 22);
          gg.addColorStop(0, 'rgba(179,32,42,.5)'); gg.addColorStop(1, 'rgba(179,32,42,0)');
          c.fillStyle = gg; c.beginPath(); c.arc(b[0], b[1], 22, 0, TAU); c.fill();
          F(c, circ(b[0], b[1], 8.5), RED, 2.5);
        } else F(c, circ(b[0], b[1], 7.5), LT, 2.5);
      });
      c.fillStyle = INK; c.fillText(txt, x0 + 58, cy + size * 0.36);
      c.restore();
    }
  }

  return {
    init() {
      U.assertGlyphs('104px "LXGWWenKai-500"', '参数疯狂卷之外数据方法算力量', 's33_rubberhose 屏上字/铭牌');
      U.assertGlyphs('100px "Rye-400"', '0123456789.BT+-', 's33_rubberhose 数字');
    },
    draw(c, lt, t) {
      const tq = U.stepTime(t, 12);                       // 一拍二：12 张/秒，是这个风格的味道本身
      // 抖片：老放映机的 gate weave 是慢摆不是乱抖——连续正弦微晃（帧间 <0.4px），胶片层自带随机闪烁
      const wx = 1.5 * Math.sin(t * 7.4), wy = 1.9 * Math.sin(t * 5.9 + 1.3);
      c.save(); c.translate(wx, wy);
      const z = camZ(lt);
      c.save(); c.translate(960, 540); c.scale(z, z); c.translate(-960, -540);
      c.drawImage(bgWall(), -40, -35);
      const stg = clamp(stageBlend(lt), 0, 1);          // 墙纸随密度逐档加密
      if (stg > 0) { c.globalAlpha = 0.55 * stg; c.drawImage(bgDense(), -40, -35); c.globalAlpha = 1; }
      screenSheet(c, tq, 1 - 0.7 * ss(7.5, 8.6, lt));
      tape(c, lt, tq);
      puncher(c, lt, tq);
      machine(c, lt, tq);
      beam(c, lt, tq);
      network(c, lt, tq);
      card(c, lt, tq);
      trio(c, lt, tq);
      c.restore();
      marquee(c, lt, tq);                               // 灯牌（画面坐标）
      c.restore();
      P.fade(c, { sat: 0.45, tint: '#f2e8d2' });        // 老胶片：压低饱和＋暖米黄染（一点红留在跑马灯/1T+/灯芯上）
      P.film(c, t, { grain: 's33rh', flicker: [0.014, 0.035, 0.03], scratches: 2, dust: 10, grainDensity: 0.1 });   // 闪烁、划痕、灰尘、颗粒、圆角片门（量按门禁校准）
    },
  };
})();
