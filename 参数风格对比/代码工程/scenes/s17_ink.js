// 中国水墨写意 · 「大模型参数」三问 · s17_ink —— 一幅「参数山水」（35 风格横向对比样片之一）。
// 参数＝宣纸上的墨点。三拍单镜：
//   拍一 0–3s「参数」：三颗墨点在宣纸上晕开洇染，行楷小数字 0.73 / -1.2 / 2.4 墨色忽浓忽淡，
//     几枝干笔飞白从旁逐笔写出扫过；墨点呼吸颤动（近景缓推端详）。
//   拍二 3–7s「疯狂卷参数」：墨点自三颗主角滴成串增殖，连缀成两道山脊之间的叶脉云纹之网
//     （飞白流线连线、虾须细须摆动），淡墨远山随密度浮现；右缘竖排题跋账册计数滚动
//     1.5B→175B→540B→1T+，1T+ 揭示一次墨晕重音（行波从中心扫过全网）（缓拉远看全幅）。
//   拍三 7–10s「参数之外」：增殖停住；线装书（数据）、罗盘（方法）、灯盏（算力）自低雾中
//     依次升起归位，罗盘针缓摆定向、灯焰燃起明灭；墨点由"变多"转为"变浓变精"并点朱砂点睛，
//     网络收稳；钤一方朱砂白文印「参数之外」，印泥缓缓洇开。
// 笔法沿 17_ink 卡：纸是底、墨只加不铺（multiply），晕染两遍（外晕＋本体），毛笔飞白（笔毛连续、
// butt 头），留白用纸色雾带；随机全用种子；无角色；做旧（纸纹、暗角）只上背景。
// 性能与确定性的两个关键做法：
//   ① 笔画层＝恒等栅格下累积的 done 画布＋每帧清空的 live 画布，随相机一起重采样——写完与写着
//     的笔走同一条栅格路径，逐帧连续且可复现（先烘后画/边画边烘会在相机缩放下产生两套抗锯齿）。
//   ② 晕染只对内容所在的子矩形做两遍 multiply 模糊；远山用 1/4 分辨率画、4 倍上采（双线性即墨晕）。
SCENES['s17_ink'] = (() => {
  const W = 1920, H = 1080, TAU = Math.PI * 2;
  const { clamp, lerp, rng, ss, ease } = U, P = PAINT, K = KIT;
  const INK = [16, 14, 12], PAPER = '#efe6d0', OCHRE = [196, 122, 60];
  const CINNABAR = '#c4281e';
  const CX = 990, CY = 548;                       // 相机推拉中心（网心）

  // ---------- 宣纸（缓存；做旧只在这里） ----------
  const paper = () => P.cached('s17_paper', W, H, (g) => {
    g.drawImage(P.texture('s17_xuan', PAPER, { scale: 0.0025, amt: 9, grain: 7, seed: 5 }), 0, 0);
    const r = rng(41); g.lineCap = 'round';
    for (let i = 0; i < 1800; i++) {              // 纸纤维短弧，亮暗混合
      const x = r() * W, y = r() * H, a = r() * TAU, l = 6 + r() * 26;
      g.strokeStyle = r() < 0.5 ? `rgba(150,125,90,${0.05 + r() * 0.08})` : `rgba(255,252,240,${0.12 + r() * 0.15})`;
      g.lineWidth = 0.6 + r() * 0.8; g.beginPath(); g.moveTo(x, y);
      g.quadraticCurveTo(x + Math.cos(a + 0.6) * l * 0.5, y + Math.sin(a + 0.6) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
    const vg = g.createRadialGradient(W / 2, H / 2, 500, W / 2, H / 2, 1250);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(120,90,50,.22)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  });

  // ---------- 山脊：墨网生长其上（远脊淡、近脊浓） ----------
  const ridgePts = (base, amp, f, seed, n) => { const o = []; for (let i = 0; i <= n; i++) { const x = lerp(130, 1590, i / n); o.push([x, base - amp * (0.5 + 0.5 * P.fbm(x * f + seed, seed * 3.1, 3))]); } return o; };
  const RA = ridgePts(470, 92, 0.0042, 5.2, 72);
  const RB = ridgePts(636, 78, 0.005, 9.7, 72);
  const yOn = (pts, x) => pts[clamp(Math.round((x - 130) / 1460 * 72), 0, 72)][1];

  // ---------- 墨点网络（确定性：全部种子） ----------
  const NR = rng(20261024);
  const nodes = [];
  const addN = (x, y, r, tone, kind) => nodes.push({ x, y, r, tone, kind, ph: NR() * TAU, seed: 300 + nodes.length * 7, wob: 0.14 + NR() * 0.1 });
  for (let i = 0; i < 30; i++) { const x = 155 + i * (1430 / 29) + (NR() - 0.5) * 30; addN(x, yOn(RA, x) + (NR() - 0.5) * 16, 6 + NR() * 5, 0.42, 'A'); }
  for (let i = 0; i < 30; i++) { const x = 155 + i * (1430 / 29) + (NR() - 0.5) * 30; addN(x, yOn(RB, x) + (NR() - 0.5) * 16, 7 + NR() * 6, 0.6, 'B'); }
  for (let i = 0; i < 16; i++) { const x = 200 + NR() * 1260; addN(x, lerp(yOn(RA, x), yOn(RB, x), 0.3 + NR() * 0.45), 6 + NR() * 6, 0.5, 'V'); }
  for (let i = 0; i < 40; i++) { const x = 170 + NR() * 1380; const onA = NR() < 0.5; addN(x, clamp(yOn(onA ? RA : RB, x) + (NR() - 0.5) * 60, 380, 720), 2.2 + NR() * 2.6, 0.5, 'M'); }
  nodes.forEach((nd) => {
    const d = Math.abs(nd.x - 1000) / 820;
    nd.born = nd.kind === 'M' ? 5.2 + NR() * 1.45 : 3.15 + Math.pow(d, 0.9) * (2.3 + NR() * 0.7) + (nd.kind === 'B' ? 0.18 : 0);
    nd.grow = 0.34 + NR() * 0.2;
  });

  // 三颗主角墨点（拍一即有；网从它们身上长出去）
  const hero = [
    { x: 820, y: 585, r: 58, tone: 0.9, born: 0.0, seed: 205, num: '0.73', nx: 898, ny: 540 },
    { x: 1180, y: 505, r: 44, tone: 0.74, born: 0.5, seed: 206, num: '-1.2', nx: 1252, ny: 462 },
    { x: 1088, y: 668, r: 34, tone: 0.58, born: 0.85, seed: 207, num: '2.4', nx: 1146, ny: 712 },
  ];
  hero.forEach((h, hi) => { h.sats = []; const r = rng(77 + hi); const n = 3 + (r() * 2 | 0);
    for (let i = 0; i < n; i++) { const a = -0.4 + r() * 2.2 - (r() < 0.5 ? Math.PI : 0);
      h.sats.push({ dx: Math.cos(a), dy: Math.sin(a) * 0.8, dr: h.r * (1.45 + r() * 0.8), r: 3.5 + r() * 5.5, ph: r() * TAU, seed: 900 + hi * 10 + i }); } });

  // 脉线：脊上串珠链、谷地连两脊、云纹横脉、主角滴各发两条
  const E = [];
  const link = (a, b) => { const len = Math.hypot(a.x - b.x, a.y - b.y);
    E.push({ a, b, born: Math.max(a.born, b.born) + 0.08, w: clamp(3.3 - len * 0.008, 1.5, 3.2), tone: 0.34 + (a.tone + b.tone) * 0.16, seed: 400 + E.length * 3 }); };
  const A = nodes.filter(n => n.kind === 'A'), B = nodes.filter(n => n.kind === 'B'), V = nodes.filter(n => n.kind === 'V');
  const chain = (L) => { const s = L.slice().sort((p, q) => p.x - q.x); for (let i = 0; i < s.length - 1; i++) link(s[i], s[i + 1]); };
  chain(A); chain(B);
  V.forEach(v => { const near = (L) => L.reduce((m, n) => Math.abs(n.x - v.x) < Math.abs(m.x - v.x) ? n : m); link(v, near(A)); link(v, near(B)); });
  for (let i = 0; i < 14; i++) { const a = A[(NR() * A.length) | 0]; const cand = B.filter(b => Math.abs(b.x - a.x) < 170); if (cand.length) link(a, cand[(NR() * cand.length) | 0]); }
  hero.forEach(h => { const s = [...A, ...B, ...V].sort((p, q) => Math.hypot(p.x - h.x, p.y - h.y) - Math.hypot(q.x - h.x, q.y - h.y)); link(h, s[0]); link(h, s[1]); });
  E.sort((a, b) => a.born - b.born);   // 按 birth 排序：完成序恒等于数组序——冷渲（一帧全烘）与热渲（逐帧烘）的叠笔次序一致，确定性

  // 虾须：从主角滴与谷地节点伸出的细须
  const whisks = [];
  hero.forEach(h => { for (let k = 0; k < 2; k++) whisks.push({ x: h.x, y: h.y - h.r * 0.4, ang: -0.75 - k * 0.9, L: 200 + NR() * 130, ph: NR() * TAU, born: h.born + 0.55 }); });
  V.slice(0, 2).forEach((v, i) => whisks.push({ x: v.x, y: v.y, ang: -1.25 + i * 0.7, L: 170 + NR() * 90, ph: NR() * TAU, born: v.born + 0.55 }));

  // 拍一的几枝干笔飞白（写完烘进 done 层）
  const SWEEPS = [
    { p: [[350, 352], [760, 292], [1170, 330], [1520, 262]], w: 26, tone: 0.42, dry: 0.72, seed: 11, d: 0.02, l: 1.0 },
    { p: [[300, 520], [452, 470], [580, 506]], w: 12, tone: 0.5, dry: 0.62, seed: 14, d: 1.3, l: 0.55 },
    { p: [[210, 762], [420, 706], [640, 742]], w: 15, tone: 0.5, dry: 0.6, seed: 12, d: 1.55, l: 0.7 },
    { p: [[1420, 622], [1560, 662], [1622, 772]], w: 9, tone: 0.55, dry: 0.55, seed: 13, d: 2.15, l: 0.6 },
    { p: [[660, 250], [820, 218], [980, 244]], w: 8, tone: 0.38, dry: 0.65, seed: 15, d: 2.75, l: 0.5 },
  ];
  const REDN = [nodes[2], nodes[9], nodes[17], nodes[24], nodes[31]];   // 点朱的网节点

  // ---------- 计数（真实序列：账册滚动） ----------
  const SEGS = [[3.35, 1.5], [3.95, 1.5], [4.5, 175], [5.55, 540], [6.55, 1000]];
  const valAt = (lt) => {
    if (lt < SEGS[0][0]) return SEGS[0][1] * ss(3.15, 3.35, lt);
    if (lt >= SEGS[4][0]) return 1000;
    for (let i = 0; i < 4; i++) { const [t0, v0] = SEGS[i], [t1, v1] = SEGS[i + 1];
      if (lt < t1) return Math.exp(lerp(Math.log(v0), Math.log(v1), ss(t0, t1, lt))); }
    return 1000;
  };
  const fmtB = (v) => v >= 1000 ? '1T+' : (v >= 10 ? Math.round(v) + 'B' : v.toFixed(1) + 'B');
  const rowAt = (lt) => 1 + (lt >= 4.5 ? 1 : 0) + (lt >= 5.55 ? 1 : 0) + (lt >= 6.55 ? 1 : 0);

  // 罗盘针：升起时缓摆，收稳定向（留一点余摆——画要活）
  const needleAngle = (lt, t) => {
    const st = ease.out(ss(7.9, 9.0, lt));
    return lerp(-2.6, -1.72, st) + (1 - st) * Math.sin(t * 3.1) * 0.28 + 0.035 * Math.sin(t * 2.3) * (1 - 0.55 * st);
  };

  // 线装书（数据）三册
  const BOOKS = [
    { x: 420, y: 726, w: 224, h: 48, a: 0.012 },
    { x: 416, y: 678, w: 212, h: 46, a: -0.03 },
    { x: 422, y: 632, w: 196, h: 42, a: 0.045 },
  ];

  const SWEPT = [], EDONE = [];      // 烘焙标记（内容单调，烘过即等价）

  // 局部晕染（免 filter——GPU blur 滤镜一帧 50ms+，是超时大头）：
  //   blob 画在 1/2 分辨率 H 上；本体＝H 2× 上采（双线性≈2px 软边），每点另画一圈 r·1.35 的淡晕；
  //   外晕＝H 再经 M(1/4)、Q(1/8) 两级减半降到 240×135，8× 上采＋外扩（≈7px 漫散晕）。
  //   全程只有双线性重采样，逐像素可复现。
  const washSoft = (c, key, rect, grow, fn, o) => {
    if (grow <= 0) return;
    const Hc = P.cached('hw_' + key, 960, 540, () => {});
    const g = Hc.getContext('2d'); g.reset(); g.clearRect(0, 0, 960, 540);
    g.save(); g.scale(0.5, 0.5); fn(g); g.restore();                    // fn 画在世界全幅坐标
    const pad = o.halo + 34;
    const sx = Math.max(0, rect[0] - pad), sy = Math.max(0, rect[1] - pad);
    const sw = Math.min(W, rect[0] + rect[2] + pad) - sx, sh = Math.min(H, rect[1] + rect[3] + pad) - sy;
    if (sw <= 0 || sh <= 0) return;
    const Mc = P.cached('mw_' + key, 480, 270, () => {});
    const m = Mc.getContext('2d'); m.reset(); m.clearRect(0, 0, 480, 270); m.drawImage(Hc, 0, 0, 960, 540, 0, 0, 480, 270);
    const Qc = P.cached('qw_' + key, 240, 135, () => {});
    const q = Qc.getContext('2d'); q.reset(); q.clearRect(0, 0, 240, 135); q.drawImage(Mc, 0, 0, 480, 270, 0, 0, 240, 135);
    c.save(); c.globalCompositeOperation = 'multiply';
    const ex = o.halo * 0.7;
    c.globalAlpha = o.haloA * grow;                                     // 外晕：漫散
    c.drawImage(Qc, sx / 8, sy / 8, sw / 8, sh / 8, sx - ex, sy - ex, sw + ex * 2, sh + ex * 2);
    c.globalAlpha = o.alpha * ss(0, 0.6, grow);                          // 本体：2× 上采
    c.drawImage(Hc, sx / 2, sy / 2, sw / 2, sh / 2, sx, sy, sw, sh);
    c.restore();
  };

  return {
    init() { U.assertGlyphs('LXGWWenKai-500', '参数疯狂卷之外数据方法算力0123456789.-+BT', 's17_ink 屏上字'); },
    draw(c, lt, t) {
      lt += 0.15;                                   // 第 0 帧已经落下前几笔，不是一张白纸
      // —— 相机：一条思路——近景缓推端详 → 缓拉远看全幅 → 收稳
      let z;
      if (lt < 3) z = 1 + 0.07 * ss(0.1, 3, lt);
      else if (lt < 7) z = 1.07 - 0.13 * ss(3, 7, lt);
      else z = 0.94 + 0.03 * ss(7, 9.2, lt);
      c.drawImage(paper(), 0, 0);                   // 纸是底：相机在纸上推拉
      c.save(); c.translate(CX, CY); c.scale(z, z); c.translate(-CX, -CY);

      // 1T+ 墨晕重音：一次行波从网心扫过
      const q1 = ss(6.5, 7.25, lt);
      const bump = q1 > 0 && q1 < 1 ? Math.sin(q1 * Math.PI) : 0;
      const frontR = 60 + 950 * q1;
      const boostAt = (x, y) => bump * 0.17 * Math.exp(-Math.pow((Math.hypot(x - 1000, y - 560) - frontR) / 150, 2));

      // ---------- 淡墨远山（1/4 分辨率画、4 倍上采＝双线性即墨晕；随密度浮现） ----------
      const mFade = ss(3.45, 4.6, lt);
      if (mFade > 0) {
        const S = P.cached('s17_mtnq', 480, 270, () => {});
        const g = S.getContext('2d'); g.reset(); g.clearRect(0, 0, 480, 270);
        g.save(); g.scale(0.25, 0.25);
        const fill = (pts, a, drop) => {
          let y0 = 1e9, y1 = -1e9; pts.forEach(p => { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
          const gr = g.createLinearGradient(0, y0, 0, y1 + drop);
          gr.addColorStop(0, `rgba(40,40,44,${a})`); gr.addColorStop(1, 'rgba(40,40,44,0)');
          g.fillStyle = gr; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]));
          g.lineTo(pts[pts.length - 1][0], y1 + drop); g.lineTo(pts[0][0], y1 + drop); g.closePath(); g.fill();
        };
        fill(RA, 0.3, 150);
        fill(RB, 0.5 * ss(4.9, 6.1, lt), 130);
        g.restore();
        const env = mFade * (0.85 + 0.15 * ss(4.6, 10, lt));
        c.save(); c.globalCompositeOperation = 'multiply';
        c.globalAlpha = 0.5 * env; c.drawImage(S, 22, 80, 410, 120, 88, 320, 1640, 480);
        c.globalAlpha = env; c.drawImage(S, 22, 80, 410, 120, 88, 320, 1640, 480);
        c.restore();
      }

      // ---------- 雾（纸色软晕团，径向渐变＝天然羽化，不用 blur 滤镜） ----------
      const mist = (x, y, rx, ry, a) => {
        if (a <= 0.005) return;
        const gr = c.createRadialGradient(0, 0, 0, 0, 0, rx);
        gr.addColorStop(0, `rgba(242,234,214,${a})`); gr.addColorStop(0.6, `rgba(242,234,214,${a * 0.75})`); gr.addColorStop(1, 'rgba(242,234,214,0)');
        c.save(); c.translate(x, y); c.scale(1, ry / rx); c.fillStyle = gr; c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill(); c.restore();
      };
      const mB = 0.34 * (0.72 + 0.28 * Math.sin(lt * 0.5)) * (1 - 0.3 * ss(8.6, 10, lt));
      mist(1150 - lt * 14, 748, 300, 52, mB);
      mist(1390 - lt * 11, 795, 300, 40, mB * 0.8);

      // ---------- 脉线与飞白：done 层（写完的）＋live 层（写着的），同一条栅格路径 ----------
      const done = P.cached('s17_done', W, H, () => {});
      const liveCv = P.cached('s17_live', W, H, () => {});
      const lg = liveCv.getContext('2d'); lg.reset(); lg.clearRect(0, 0, W, H);
      const dg = done.getContext('2d');
      let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;       // live 层内容包围盒（只贴这一块）
      const span = (p) => { for (const q of p) { bx0 = Math.min(bx0, q[0]); by0 = Math.min(by0, q[1]); bx1 = Math.max(bx1, q[0]); by1 = Math.max(by1, q[1]); } };
      SWEEPS.forEach((sw, i) => {
        const rv = ss(sw.d, sw.d + sw.l, lt); if (rv <= 0 || SWEPT[i]) return;
        const o = { w: sw.w, tone: sw.tone, dry: sw.dry, seed: sw.seed, reveal: rv };
        if (rv >= 1) { P.brush(dg, sw.p, { ...o, reveal: 1 }); SWEPT[i] = true; }
        else { P.brush(lg, sw.p, o); span(sw.p); }
      });
      E.forEach((e, i) => {
        const rv = ss(e.born, e.born + 0.34, lt); if (rv <= 0 || EDONE[i]) return;
        const older = e.a.born <= e.born ? e.a : e.b, newer = older === e.a ? e.b : e.a;
        const pts = [[older.x, older.y], [(older.x + newer.x) / 2 + (newer.y - older.y) * 0.08, (older.y + newer.y) / 2 - (newer.x - older.x) * 0.08], [newer.x, newer.y]];
        const o = { w: e.w, tone: e.tone, dry: 0.5, seed: e.seed, reveal: rv, bristles: 3, head: 0.15, tail: 0.45 };
        if (rv >= 1) { P.brush(dg, pts, { ...o, reveal: 1 }); EDONE[i] = true; }
        else { P.brush(lg, pts, o); span(pts); }
      });
      c.drawImage(done, 0, 0);
      if (bx1 > bx0) {
        const m = 34;                                                     // 笔宽余量
        const sx2 = Math.max(0, bx0 - m), sy2 = Math.max(0, by0 - m);
        const sw2 = Math.min(W, bx1 + m) - sx2, sh2 = Math.min(H, by1 + m) - sy2;
        c.drawImage(liveCv, sx2, sy2, sw2, sh2, sx2, sy2, sw2, sh2);
      }

      // ---------- 墨点层（scratch 里画全部点，局部两遍 multiply＝墨在纸上洇开） ----------
      // 性能：约 160 颗墨点按 tone 分 12 桶，每桶一条路径一次 fill——160 次小 fill 会把每帧拖到 200ms
      const nGrow = 0.5 + 0.5 * Math.min(1, lt / 8.5);
      const tightAt = (nd) => { const d = Math.abs(nd.x - 1000) / 820; return ss(7.3 + d * 1.15, 8.6 + d * 1.15, lt); };
      washSoft(c, 's17net', [60, 320, 1560, 460], nGrow, (g) => {
        const bk = [];
        const put = (x, y, r, seed, wob, tone) => { const k = clamp(Math.round(tone / 0.085), 0, 11); (bk[k] || (bk[k] = [])).push([x, y, r, seed, wob]); };
        hero.forEach((h) => {
          const hg = ss(h.born, h.born + 1.1, lt); if (hg <= 0) return;
          const tq = tightAt(h);
          const br = 1 + 0.055 * Math.sin(t * 1.3 + h.seed);
          const rr = h.r * (0.25 + 0.75 * hg) * br * (1 - 0.13 * tq);
          put(h.x, h.y, rr, h.seed, 0.16, clamp(h.tone + tq * 0.1 + boostAt(h.x, h.y), 0, 0.92) * hg * 0.92);
          h.sats.forEach((s) => {
            const sg2 = ss(h.born + 0.15, h.born + 0.6, lt); if (sg2 <= 0) return;
            const dr = s.dr * (1 + 0.16 * Math.sin(t * 1.2 + s.ph));      // 溅珠绕滴收放
            const sx = h.x + s.dx * dr, sy = h.y + s.dy * dr;
            put(sx, sy, s.r * (0.4 + 0.6 * hg), s.seed, 0.22, clamp(h.tone * 0.65 + boostAt(sx, sy), 0, 0.7) * sg2);
          });
        });
        nodes.forEach((nd) => {
          const gg = ss(nd.born, nd.born + nd.grow, lt); if (gg <= 0) return;
          const tq = tightAt(nd);
          const br = 1 + 0.06 * Math.sin(t * 1.35 + nd.ph);
          const rr = nd.r * (0.3 + 0.7 * gg) * br * (1 - 0.15 * tq);
          const tone = clamp((nd.tone + 0.24 * tq + boostAt(nd.x, nd.y)) * gg, 0.05, 0.95);
          put(nd.x, nd.y, rr, nd.seed, nd.wob, tone);
          if (nd.r > 5) put(nd.x + rr * 0.15, nd.y - rr * 0.1, rr * 1.35, nd.seed + 1, 0.24, tone * 0.32);  // 点周淡晕（洇）
        });
        bk.forEach((list, k) => {
          if (!list || !list.length) return;
          g.beginPath(); list.forEach(b => K.blob(g, b[0], b[1], b[2], b[3], b[4], 10));
          g.fillStyle = P.rgb(INK, clamp(k * 0.085, 0.05, 0.95)); g.fill();
        });
      }, { blur: 2.2, halo: 8, haloA: 0.2, alpha: 1 });

      // ---------- 虾须细须（摆动；拍三收稳） ----------
      whisks.forEach((wk) => {
        const rv = ss(wk.born, wk.born + 0.6, lt); if (rv <= 0) return;
        const calm = 1 - 0.65 * ss(7.2, 9.1, lt);
        const amp = calm * (1 + 0.6 * bump);
        const pts = [];
        for (let j = 0; j <= 22; j++) { const q = j / 22; const wob = Math.sin(t * 1.05 + q * 3.6 + wk.ph) * 11 * q * amp;
          pts.push([wk.x + Math.cos(wk.ang) * wk.L * q * rv - Math.sin(wk.ang) * wob, wk.y + Math.sin(wk.ang) * wk.L * q * rv + Math.cos(wk.ang) * wob]); }
        c.fillStyle = P.rgb(INK, 0.5 * rv); c.fill(K.ribbon(pts, q => 2.6 * (1 - q) + 0.4));
      });

      // ---------- 谷中雾带（远山时隐时现；收势变淡） ----------
      const calmM = 1 - 0.45 * ss(7.2, 9.4, lt);
      const mA = ss(3.7, 4.9, lt) * 0.6 * calmM;
      if (mA > 0.01) {
        mist(1420 - lt * 26, 548, 250, 78, mA);
        mist(1230 - lt * 21, 600, 250, 62, mA * 0.85);
        mist(1610 - lt * 32, 522, 250, 52, mA * 0.7);
      }

      // ---------- 拍三：朱砂点睛 ----------
      REDN.concat(hero).forEach((nd, i) => {
        const q = ss(7.75 + i * 0.09, 8.18 + i * 0.09, lt); if (q <= 0) return;
        c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = q;
        c.fillStyle = CINNABAR; c.beginPath(); K.blob(c, nd.x, nd.y, (nd.sats ? 5 : 3.6) * (0.5 + 0.5 * ease.out(q)), (nd.seed || 3) + 5, 0.2, 8); c.fill();
        c.restore();
      });

      // ---------- 主角滴旁的小数字（浓淡闪动＋轻浮；拍三转焦墨） ----------
      hero.forEach((h, i) => {
        const a = ss(h.born + 0.25, h.born + 0.75, lt); if (a <= 0) return;
        const shim = 0.72 + 0.28 * Math.sin(t * 1.15 + i * 2.1);
        const tone = lerp(0.88 * shim, 0.95, ss(7.3, 8.7, lt));
        const dx = Math.sin(t * 0.9 + i) * 2.5, dy = Math.sin(t * 0.7 + i * 1.9) * 2.5;
        c.save(); c.font = '46px "LXGWWenKai-500"'; c.textAlign = 'left'; c.textBaseline = 'middle';
        c.filter = 'blur(1.2px)'; c.fillStyle = P.rgb(INK, 0.3 * a); c.fillText(h.num, h.nx + dx, h.ny + dy);
        c.filter = 'none'; c.fillStyle = P.rgb(INK, tone * a); c.fillText(h.num, h.nx + dx, h.ny + dy);
        c.restore();
      });

      // ---------- 拍三：三件水墨物升起归位 ----------
      const rise = (t0) => ss(t0, t0 + 0.75, lt);
      const qB = rise(7.25), qC = rise(7.6), qL = rise(8.0);
      const dyB = (1 - ease.out(qB)) * 95, dyC = (1 - ease.out(qC)) * 95, dyL = (1 - ease.out(qL)) * 95;
      const cx0 = 960, cy0 = 738, lx = 1405, ly0 = 724;
      const th = needleAngle(lt, t);
      if (qB > 0 || qC > 0 || qL > 0) {
        washSoft(c, 's17obj', [280, 600, 1280, 340], 1, (g) => {         // 洗出三物的墨身（multiply 晕染）
          if (qB > 0) { g.save(); g.translate(0, dyB);
            BOOKS.forEach((b) => { g.save(); g.translate(b.x, b.y); g.rotate(b.a);
              g.fillStyle = P.rgb(OCHRE, 0.5 * qB); g.fillRect(-b.w / 2, -b.h / 2, b.w, b.h); g.restore(); }); g.restore(); }
          if (qC > 0) { g.save(); g.translate(0, dyC);
            g.fillStyle = P.rgb(INK, 0.14 * qC); g.beginPath(); K.blob(g, cx0, cy0, 82, 510, 0.03, 20); g.fill();
            g.save(); g.translate(cx0, cy0); g.rotate(th);
            g.fillStyle = P.rgb(OCHRE, 0.5 * qC); g.beginPath();
            g.moveTo(56, 0); g.lineTo(0, 7); g.lineTo(0, -7); g.closePath();
            g.moveTo(-34, 0); g.lineTo(0, 4.5); g.lineTo(0, -4.5); g.closePath(); g.fill();
            g.restore(); g.restore(); }
          if (qL > 0) { g.save(); g.translate(0, dyL);
            g.beginPath(); g.moveTo(lx - 52, ly0 - 14); g.quadraticCurveTo(lx - 34, ly0 + 46, lx, ly0 + 50);
            g.quadraticCurveTo(lx + 34, ly0 + 46, lx + 52, ly0 - 14); g.closePath();
            g.fillStyle = P.rgb(OCHRE, 0.42 * qL); g.fill(); g.restore(); }
        }, { blur: 2.4, halo: 9, haloA: 0.2, alpha: 1 });
        // —— 线装书（数据）：焦墨勾勒＋线装针脚＋书口页线＋题签 ——
        if (qB > 0) {
          c.save(); c.translate(0, dyB); c.globalAlpha = qB; c.lineJoin = 'round';
          BOOKS.forEach((b, i) => {
            c.save(); c.translate(b.x, b.y); c.rotate(b.a);
            P.roughPath(c, [[-b.w / 2, -b.h / 2], [b.w / 2, -b.h / 2], [b.w / 2, b.h / 2], [-b.w / 2, b.h / 2]], { amp: 1.7, seed: 71 + i, closed: true });
            c.strokeStyle = P.rgb(INK, 0.8); c.lineWidth = 2.6; c.stroke();
            c.strokeStyle = P.rgb(INK, 0.72); c.lineWidth = 2;
            c.beginPath();
            for (let s = 0; s < 4; s++) { const sx = -b.w / 2 + 20 + s * (b.w - 40) / 3;
              c.moveTo(sx - 3, -b.h / 2 + 7); c.lineTo(sx - 3, b.h / 2 - 7); c.moveTo(sx + 3, -b.h / 2 + 7); c.lineTo(sx + 3, b.h / 2 - 7); }
            c.stroke();
            c.strokeStyle = P.rgb(INK, 0.32); c.lineWidth = 1.2; c.beginPath();
            [[-b.h / 2 + 6, b.h / 2 - 6, b.w / 2 - 5], [-b.h / 2 + 10, b.h / 2 - 10, b.w / 2 - 13], [-b.h / 2 + 13, b.h / 2 - 13, b.w / 2 - 21]]
              .forEach(([y0, y1, sx]) => { c.moveTo(sx, y0); c.quadraticCurveTo(sx + 3, (y0 + y1) / 2, sx, y1); });
            c.stroke();
            c.restore();
          });
          const top = BOOKS[2];
          c.save(); c.translate(top.x, top.y); c.rotate(top.a);
          P.roughPath(c, [[-top.w / 2 + 12, -30], [-top.w / 2 + 46, -30], [-top.w / 2 + 46, 28], [-top.w / 2 + 12, 28]], { amp: 1.2, seed: 76, closed: true });
          c.strokeStyle = P.rgb(INK, 0.5); c.lineWidth = 1.5; c.stroke(); c.restore();
          c.restore();
        }
        // —— 罗盘（方法）：双环＋廿四向刻度＋缓摆定向的针 ——
        if (qC > 0) {
          c.save(); c.translate(0, dyC); c.globalAlpha = qC;
          c.strokeStyle = P.rgb(INK, 0.85); c.lineWidth = 3.2; c.beginPath(); K.blob(c, cx0, cy0, 84, 511, 0.03, 18); c.stroke();
          c.strokeStyle = P.rgb(INK, 0.5); c.lineWidth = 1.4; c.beginPath(); K.blob(c, cx0, cy0, 64, 512, 0.03, 16); c.stroke();
          const tick = (sel) => {          // 廿四向刻度：长短短短，各并成一条路径
            c.beginPath();
            for (let k = 0; k < 24; k++) { if ((k % 6 === 0) !== sel) continue; const a2 = k / 24 * TAU;
              const r0 = sel ? 52 : 64;
              c.moveTo(cx0 + Math.cos(a2) * r0, cy0 + Math.sin(a2) * r0); c.lineTo(cx0 + Math.cos(a2) * 76, cy0 + Math.sin(a2) * 76); }
            c.stroke();
          };
          c.strokeStyle = P.rgb(INK, 0.66); c.lineWidth = 2; tick(true);
          c.strokeStyle = P.rgb(INK, 0.42); c.lineWidth = 1.2; tick(false);
          P.leaf(c, cx0, cy0, th, 58, 9, 0.5, OCHRE);
          P.leaf(c, cx0, cy0, th, 50, 5, 0.9, INK);
          P.leaf(c, cx0, cy0, th + Math.PI, 32, 4, 0.6, INK);
          c.fillStyle = P.rgb(INK, 0.85); c.beginPath(); c.arc(cx0, cy0, 5, 0, TAU); c.fill();
          c.restore();
        }
        // —— 灯盏（算力）：碗、灯芯、燃起的焰（画里唯一"亮"处） ——
        if (qL > 0) {
          c.save(); c.translate(0, dyL); c.globalAlpha = qL;
          c.strokeStyle = P.rgb(INK, 0.8); c.lineWidth = 3;
          c.beginPath(); c.moveTo(lx - 52, ly0 - 14); c.quadraticCurveTo(lx - 34, ly0 + 46, lx, ly0 + 50);
          c.quadraticCurveTo(lx + 34, ly0 + 46, lx + 52, ly0 - 14); c.stroke();
          c.beginPath(); c.moveTo(lx - 54, ly0 - 14); c.quadraticCurveTo(lx, ly0 - 8, lx + 54, ly0 - 14); c.stroke();
          c.lineWidth = 2.2; c.beginPath(); c.moveTo(lx - 12, ly0 + 50); c.lineTo(lx - 15, ly0 + 66); c.moveTo(lx + 12, ly0 + 50); c.lineTo(lx + 15, ly0 + 66); c.stroke();
          c.beginPath(); c.ellipse(lx, ly0 + 68, 30, 7, 0, 0, TAU); c.stroke();
          c.fillStyle = P.rgb(INK, 0.85); c.beginPath(); c.arc(lx, ly0 - 20, 3.5, 0, TAU); c.fill();
          c.restore();
          const qi = ss(8.62, 9.0, lt);
          if (qi > 0) {
            const f = qi * (1 + 0.2 * Math.sin(t * 9.3) + 0.12 * Math.sin(t * 23.7 + 1.7)) * (0.9 + 0.1 * Math.sin(t * 5.1 + 0.6));
            const gR = 95 * (0.88 + 0.14 * Math.sin(t * 7.7));
            const glow = c.createRadialGradient(lx, ly0 - 54, 8, lx, ly0 - 54, gR);
            glow.addColorStop(0, `rgba(216,85,63,${0.17 * qi * (0.72 + 0.28 * Math.sin(t * 9.3))})`); glow.addColorStop(1, 'rgba(216,85,63,0)');
            c.fillStyle = glow; c.beginPath(); c.arc(lx, ly0 - 54, gR, 0, TAU); c.fill();
            c.save(); c.translate(lx, ly0 - 50); c.scale(0.6, 1);
            c.fillStyle = `rgba(216,85,63,${0.5 * qi})`; c.beginPath(); K.blob(c, 0, -6, 24 * f, 531, 0.22, 10); c.fill();
            c.fillStyle = `rgba(196,40,30,${0.85 * qi})`; c.beginPath(); K.blob(c, 0, -4, 15 * f, 532, 0.2, 9); c.fill();
            c.fillStyle = `rgba(232,178,72,${0.95 * qi})`; c.beginPath(); K.blob(c, 0, -1, 7 * f, 533, 0.25, 8); c.fill();
            c.restore();
          }
        }
        // —— 三物铭文（字长在物上） ——
        const label = (txt, x, y, q, dy) => {
          if (q <= 0) return;
          c.save(); c.translate(0, dy); c.font = '34px "LXGWWenKai-500"'; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillStyle = P.rgb(INK, 0.78 * q);
          [...txt].forEach((ch, i) => c.fillText(ch, x, y + i * 42));
          c.restore();
        };
        label('数据', 585, 648, ss(7.75, 8.2, lt), dyB);
        label('方法', 1092, 644, ss(8.1, 8.55, lt), dyC);
        label('算力', 1306, 604, ss(8.5, 8.95, lt), dyL);
      }

      // ---------- 屏上字（都是画上的题跋，不做金句卡） ----------
      // 拍一「参数」：竖排浓墨题字，随墨晕洇出，拍末收去
      const env1 = ss(0.1, 0.85, lt) * (1 - ss(2.5, 3.05, lt));
      if (env1 > 0) {
        c.save(); c.font = '112px "LXGWWenKai-500"'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.translate(243, 352); c.rotate(-0.02);
        ['参', '数'].forEach((ch, i) => {
          const y = -61 + i * 122;
          c.filter = 'blur(2px)'; c.fillStyle = P.rgb(INK, 0.25 * env1); c.fillText(ch, 0, y);
          c.filter = 'none'; c.fillStyle = P.rgb(INK, (i ? 0.78 : 0.9) * env1); c.fillText(ch, 0, y);
        }); c.restore();
      }
      // 拍二「疯狂卷参数」：竖排题跋，浓淡交替逐字落下
      const env2 = ss(3.25, 3.9, lt) * (1 - ss(6.9, 7.5, lt));
      if (env2 > 0) {
        const T2 = [0.9, 0.62, 0.8, 0.55, 0.85];
        c.save(); c.font = '74px "LXGWWenKai-500"'; c.textAlign = 'center'; c.textBaseline = 'middle';
        [...'疯狂卷参数'].forEach((ch, i) => {
          const aIn = ss(3.3 + i * 0.09, 3.72 + i * 0.09, lt); if (aIn <= 0) return;
          c.save(); c.translate(1654, 178 + i * 92); c.rotate(i % 2 ? 0.025 : -0.02);
          c.filter = 'blur(1.6px)'; c.fillStyle = P.rgb(INK, 0.22 * env2 * aIn); c.fillText(ch, 0, 0);
          c.filter = 'none'; c.fillStyle = P.rgb(INK, T2[i] * env2 * aIn); c.fillText(ch, 0, 0);
          c.restore();
        }); c.restore();
      }
      // 拍二账册：真实序列计数器（当前行滚动，已过的记淡墨，未到的留影；1T+ 重音一记）
      const envL = ss(3.35, 3.85, lt) * (1 - ss(6.95, 7.6, lt));
      if (envL > 0) {
        const v = valAt(lt);
        const k = rowAt(lt);
        const rows = ['1.5B', '175B', '540B', '1T+'];
        c.save(); c.textAlign = 'right'; c.textBaseline = 'middle';
        rows.forEach((row, idx) => {
          const isCur = idx === k - 1;
          const size = isCur && k === 4 ? 54 * (1 + 0.12 * bump) : (isCur ? 54 : 40);
          const txt = isCur ? (k >= 4 ? '1T+' : fmtB(v)) : row;
          const a = isCur ? 0.92 : (idx < k - 1 ? 0.4 : 0.13);
          c.font = `${size | 0}px "LXGWWenKai-500"`;
          c.fillStyle = P.rgb(INK, a * envL);
          c.fillText(txt, 1756, 648 + idx * 64);
        });
        c.strokeStyle = P.rgb(INK, 0.3 * envL); c.lineWidth = 1.4;
        c.beginPath(); c.moveTo(1778, 606); c.lineTo(1778, 846); c.stroke();
        c.fillStyle = P.rgb(INK, 0.55 * envL); c.beginPath(); c.arc(1778, 648 + (k - 1) * 64, 4.5, 0, TAU); c.fill();
        c.restore();
      }
      // 拍三钤印：朱砂白文「参数之外」，先放大再压实；印泥缓缓洇开
      const qS = ss(9.02, 9.5, lt);
      if (qS > 0) {
        const seal = P.cached('s17_seal', 100, 100, (g) => {
          g.translate(50, 50);
          g.fillStyle = CINNABAR; g.fillRect(-42, -42, 84, 84);
          g.globalCompositeOperation = 'destination-out';
          g.font = '30px "LXGWWenKai-500"'; g.textAlign = 'center'; g.textBaseline = 'middle';
          g.fillText('参', 21, -18); g.fillText('数', 21, 18); g.fillText('之', -21, -18); g.fillText('外', -21, 18);
          const r = rng(7); for (let i = 0; i < 46; i++) g.fillRect(-42 + r() * 84, -42 + r() * 84, 1 + r() * 3, 1 + r() * 2);
        });
        const qH = ss(9.35, 9.95, lt);                    // 印泥洇开
        if (qH > 0) {
          c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.13 * (1 - 0.55 * qH);
          c.filter = 'blur(6px)'; c.fillStyle = CINNABAR;
          c.beginPath(); c.arc(1566, 764, 56 + 30 * qH, 0, TAU); c.fill(); c.filter = 'none'; c.restore();
        }
        const s = 1.45 - 0.45 * ease.out(qS);
        c.save(); c.translate(1566, 764); c.scale(s, s); c.globalAlpha = Math.min(1, qS * 1.7);
        c.globalCompositeOperation = 'multiply'; c.drawImage(seal, -50, -50); c.restore();
      }
      c.restore();
    },
  };
})();
