// s04_roman · 庞贝马赛克（opus tessellatum）×「大模型参数」风格样片（10s 单镜头三拍）。
// 题材构图（不搬速通片的房间：窗左上、猫左下、少女右端杯）：参数＝一块块 tessera 石砖——
//   拍一 0–3s   灰泥墙上三块大石砖（象牙/庞贝红/维苏威蓝），砖上刻痕小数字 0.73、-1.2、2.4；
//              光沿砖面小石间流过、砖面碎金般明灭、晕圈随呼吸泛光；底部楔形铭文碑逐格凿出「参数」；镜头停住端详；
//   拍二 3–7s   石砖从砖群一圈圈翻面扩散（灰泥→拱起压暗→闪白→落砖），缆索把三块砖连线、环缆与辐索随砖浪錾出，
//              铺满整面墙到边框；铭文碑滚动 1.5B→175B→540B→1T+，1T+ 时金色涟漪扫过全场（唯一重音），
//              铺开的砖随密度掺进暗红石；镜头停住，让砖浪自己展开；
//   拍三 7–10s  增殖停住；莎草纸卷轴（数据）/太阳轮（方法）/三足火盆（算力）三块嵌片立碑依次升起归位
//              （卷轴轻晃、太阳轮缓转、火盆砖火窜动），一道描金扫过全场——砖从变多转为变亮变精，砖浪收稳；
//              维苏威砖画冒烟溅火星收尾；镜头微缓推收全貌。
// 管线（照风格卡 04_roman 的镶嵌渲染器）：init 一次算好石块布局——距离场等值线沿轮廓走线放石（andamento）＋
//   规则成行补洞＋加权 L∞ Voronoi 光栅成 ID 图（相邻石块间灰浆缝）＋每像素斜面明暗（左上受光）；
//   每帧：平涂底稿（含滚动计数器、逐格凿出的铭文、维苏威烟火星）→ getImageData → 全部石块按类重上色
//   （墙砖出生/描金/洗色都走颜色，不走布局——「石块不动，颜色在石块间流动」）→ 相机折进像素遍：
//   按屏幕像素反查世界锚定的 ID 图取样（图案随镜头连贯缩放，不整幅重采样噪点底图），putImageData 直写主画布；
//   边框「传送带」与嵌片道具再按 c 变换贴上。墙的出生表也预存到每像素（WBIRTH）——灰泥缝跟着砖浪一起拱起、闪白、落浆。
// 确定性：随机全用 U.rng/U.hash 种子；做旧不上身；无角色；帧内 ms 目标 ≤150。
SCENES['s04_roman'] = (() => {
  const W = 1920, H = 1080, TAU = Math.PI * 2;
  const { clamp, lerp, rng, hash, ss, ease } = U, P = PAINT;
  const BW = 84, PER = 81;                                // 外框带宽 / 卷涡周期
  const GOLD = [208, 162, 60], FLASH = [246, 238, 214];   // 描金 / 翻面闪白
  const PLASTER = [206, 194, 166];                        // 未铺砖的灰泥墙
  const C = {
    wall: '#e4ddcd', halo: '#f5f1e8', outline: '#46322a',
    floor: '#dac9a0', floorLine: '#8f6c40', ground: '#cba344', ground2: '#a67d2a',
    red: '#a8322a', red2: '#7c221d', gold: '#d0a23c', gold2: '#9f7420',
    bW: '#ece6d8', bK: '#24201d',
    sky: '#9ec0d8', sky2: '#d3e3e4', cloud: '#88847d', cloud2: '#a9a49b',
    cone: '#4e5796', coneL: '#7c84b8', coneD: '#2f3672', ridge: '#373e7c',
    green: '#6f9341', green2: '#92b254', cyp: '#2b5a2f',
    lava: '#d64a22', lava2: '#f2952c',
  };
  // 石块类别：尺寸 / 沿轮廓圈数（99=全部沿轮廓）/ 颜色抖动
  const K_WALL = 0, K_HALO = 1, K_NET = 2, K_PIC = 3, K_BAND = 4, K_TABL = 5, K_INSU = 6;
  const SZ = [12, 8, 9, 9, 8, 7, 7];
  const KR = [1, 99, 99, 2, 99, 99, 99];
  const JIT = [.08, .05, .06, .06, .05, .05, .05];

  // ---------- 几何 ----------
  const NC = { x: 960, y: 530 };                          // 砖浪圆心（石砖群重心）
  const BAND = { y0: 108, y1: 258 };                      // 顶部红横带（铭文带）
  const TAB = { x0: 770, y0: 768, x1: 1150, y1: 876 };    // 底部楔形铭文碑
  const PIC = { x0: 1560, y0: 64, x1: 1836, y1: 336 };    // 右上维苏威砖画
  const STONES = [                                        // 三块参数石砖（一排立在墙心）
    { x: 490, y: 545, r: 0.16, h: 146, col: '#ece6d8', num: '0.73', ns: 78 },
    { x: 960, y: 505, r: -0.3, h: 148, col: '#a8322a', num: '-1.2', ns: 78 },
    { x: 1330, y: 545, r: 0.38, h: 138, col: '#4e5796', num: '2.4', ns: 66 },
  ];
  const stonePath = (s, m) => {
    const k = s.h + (m || 0), p = new Path2D(), ca = Math.cos(s.r), sa = Math.sin(s.r);
    const q = (dx, dy) => [s.x + dx * ca - dy * sa, s.y + dx * sa + dy * ca];
    const pts = [q(-k, -k), q(k, -k), q(k, k), q(-k, k)];
    p.moveTo(...pts[0]); pts.slice(1).forEach(pt => p.lineTo(...pt)); p.closePath(); return p;
  };
  const RINGS = [560, 700], OUTB = [760, 795], NSP = 12;
  // 出生表：距圆心的归一距离 → 时刻（环缆 560→4.9s、外带→5.6s、墙角→6.3s＝1T+，灰泥缝用每像素 hash 抖动）
  const birthOf = (nd, j) => 3.0 + 3.3 * clamp(nd / 980, 0, 1.05) + j * 0.3;
  // 拍三三物（嵌片立碑）：卷轴=数据 太阳轮=方法 火盆=算力
  const OBJ = [
    { x: 440, y: 830, rise: 7.15, sp: 'scroll' },
    { x: 960, y: 716, rise: 7.55, sp: 'wheel' },
    { x: 1468, y: 822, rise: 7.95, sp: 'brazier' },
  ];
  // 计数器（真实序列：1.5B→175B→540B→1T+）
  const CK = [[3.5, 0], [3.8, 1.5], [4.15, 1.5], [4.65, 175], [5.0, 175], [5.55, 540], [5.9, 540], [6.35, 1000], [1e9, 1000]];
  function countVal(lt) {
    for (let i = 0; i < CK.length - 1; i++) if (lt >= CK[i][0] && lt <= CK[i + 1][0])
      return lerp(CK[i][1], CK[i + 1][1], ease.inOut(clamp((lt - CK[i][0]) / (CK[i + 1][0] - CK[i][0]), 0, 1)));
    return lt < 3.5 ? 0 : 1000;
  }
  const density = lt => 0.5 * ease.inOut(clamp((lt - 3.2) / 3.4, 0, 1));   // 铺开的墙砖掺暗红石的比例

  // ---------- 缆索（结构/上色两用）：红带＋两股正弦金缆 ----------
  function cable(g, pts, bandCol, strandCol) {
    g.strokeStyle = bandCol; g.lineWidth = 26; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke();
    const n = pts.length, L = [];
    for (let i = 0; i < n - 1; i++) L.push(Math.max(1e-6, Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1])));
    const PERL = 88, AMP = 5.5;
    g.strokeStyle = strandCol; g.lineWidth = 6.5;
    for (const sgn of [1, -1]) {
      let sAcc = 0; g.beginPath();
      for (let i = 0; i < n - 1; i++) {
        const ux = (pts[i + 1][0] - pts[i][0]) / L[i], uy = (pts[i + 1][1] - pts[i][1]) / L[i], nx = -uy, ny = ux;
        const steps = Math.max(2, Math.round(L[i] / 12));
        for (let q = 0; q <= steps; q++) {
          const u = q / steps, s = sAcc + u * L[i], off = sgn * AMP * Math.sin(s / PERL * TAU);
          const X = pts[i][0] + ux * L[i] * u + nx * off, Y = pts[i][1] + uy * L[i] * u + ny * off;
          (i === 0 && q === 0) ? g.moveTo(X, Y) : g.lineTo(X, Y);
        }
        sAcc += L[i];
      }
      g.stroke();
    }
  }
  const bez = (p0, p1, p2, n) => { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]); } return o; };
  function ringPts(r, n) {
    n = n || 120; const pts = [];
    for (let i = 0; i <= n; i++) { const a = i / n * TAU; pts.push([NC.x + Math.cos(a) * r, NC.y + Math.sin(a) * r]); }
    return pts;
  }
  function drawNet(g, col) {                                // col 给定＝结构图单色；不给＝真实色
    const band = col || C.red2, strand = col || C.gold;
    g.lineCap = 'round'; g.lineJoin = 'round';
    // 三砖连线（A-B、B-C、C-A 绕到铭文碑背后）
    const s = STONES;
    cable(g, bez([s[0].x, s[0].y], [725, 480], [s[1].x, s[1].y], 26), band, strand);
    cable(g, bez([s[1].x, s[1].y], [1160, 470], [s[2].x, s[2].y], 26), band, strand);
    cable(g, bez([s[2].x, s[2].y], [910, 1350], [s[0].x, s[0].y], 34), band, strand);
    // 环缆与辐索
    for (const r of RINGS) cable(g, ringPts(r), band, strand);
    for (let k = 0; k < NSP; k++) {
      const a = k * TAU / NSP;
      const p0 = [NC.x + Math.cos(a) * 500, NC.y + Math.sin(a) * 500], p1 = [NC.x + Math.cos(a) * 790, NC.y + Math.sin(a) * 790];
      if (k % 2 === 0) cable(g, [p0, p1], band, strand);
      else {
        g.strokeStyle = col || C.red; g.lineWidth = 16;
        g.beginPath(); g.moveTo(...p0); g.lineTo(...p1); g.stroke();
        g.strokeStyle = strand; g.lineWidth = 4;
        const ux = p1[0] - p0[0], uy = p1[1] - p0[1], l = Math.hypot(ux, uy), nx = -uy / l * 9, ny = ux / l * 9;
        for (const sg of [1, -1]) { g.beginPath(); g.moveTo(p0[0] + nx * sg, p0[1] + ny * sg); g.lineTo(p1[0] + nx * sg, p1[1] + ny * sg); g.stroke(); }
      }
    }
    // 外圈红带
    g.strokeStyle = col || C.red; g.lineWidth = 35;
    g.beginPath(); g.arc(NC.x, NC.y, (OUTB[0] + OUTB[1]) / 2, 0, TAU); g.stroke();
    if (!col) { g.strokeStyle = C.gold; g.lineWidth = 4.5; for (const r of OUTB) { g.beginPath(); g.arc(NC.x, NC.y, r, 0, TAU); g.stroke(); } }
    // 节点花饰
    for (const r of RINGS) for (let k = 0; k < NSP; k++) {
      const a = k * TAU / NSP, x = NC.x + Math.cos(a) * r, y = NC.y + Math.sin(a) * r;
      g.fillStyle = col || C.gold; g.beginPath(); g.arc(x, y, 17, 0, TAU); g.fill();
      g.strokeStyle = col || C.red2; g.lineWidth = 6; g.stroke();
      if (!col) { g.fillStyle = C.red2; g.beginPath(); g.arc(x, y, 6, 0, TAU); g.fill(); }
    }
  }
  // 网的保留区（横带/铭文碑/砖画）：缆索从中让开，砖块沿区边成排
  function clearReserves(g) {
    g.clearRect(0, 0, W, BAND.y1 + 22);
    g.clearRect(TAB.x0 - 14, TAB.y0 - 14, TAB.x1 - TAB.x0 + 28, TAB.y1 - TAB.y0 + 28);
    g.clearRect(PIC.x0 - 10, PIC.y0 - 10, PIC.x1 - PIC.x0 + 20, PIC.y1 - PIC.y0 + 20);
  }

  // ---------- 平涂底稿：静态 ----------
  function staticBase(g) {
    g.fillStyle = '#cec2a6'; g.fillRect(0, 0, W, H);       // 灰泥墙（砖还没铺）
    // 顶部红横带（庞贝红铭文带）
    g.fillStyle = C.red2; g.fillRect(100, BAND.y0, 1720, BAND.y1 - BAND.y0);
    g.fillStyle = C.bK; g.fillRect(100, BAND.y0, 1720, 3); g.fillRect(100, BAND.y1 - 3, 1720, 3);
    g.fillStyle = C.gold; g.fillRect(100, BAND.y0 + 8, 1720, 5); g.fillRect(100, BAND.y1 - 13, 1720, 5);
    // 底部楔形铭文碑 tabula ansata
    const cy = (TAB.y0 + TAB.y1) / 2, w = TAB.x1 - TAB.x0, h = TAB.y1 - TAB.y0;
    g.fillStyle = C.red;
    g.beginPath(); g.moveTo(TAB.x0 + 8, TAB.y0 + 14); g.lineTo(TAB.x0 - 34, cy); g.lineTo(TAB.x0 + 8, TAB.y1 - 14); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(TAB.x1 - 8, TAB.y0 + 14); g.lineTo(TAB.x1 + 34, cy); g.lineTo(TAB.x1 - 8, TAB.y1 - 14); g.closePath(); g.fill();
    g.fillStyle = C.floor; g.fillRect(TAB.x0, TAB.y0, w, h);
    g.strokeStyle = C.red; g.lineWidth = 8; g.strokeRect(TAB.x0 + 4, TAB.y0 + 4, w - 8, h - 8);
    g.strokeStyle = C.red2; g.lineWidth = 3; g.strokeRect(TAB.x0 + 15, TAB.y0 + 15, w - 30, h - 30);
    // 右上维苏威砖画（框＋静态景物；烟/火星每帧重画）
    g.fillStyle = C.red; g.fillRect(PIC.x0, PIC.y0, PIC.x1 - PIC.x0, PIC.y1 - PIC.y0);
    g.fillStyle = C.red2; g.fillRect(PIC.x0 + 12, PIC.y0 + 12, PIC.x1 - PIC.x0 - 24, PIC.y1 - PIC.y0 - 24);
    g.fillStyle = C.gold; g.fillRect(PIC.x0 + 17, PIC.y0 + 17, PIC.x1 - PIC.x0 - 34, PIC.y1 - PIC.y0 - 34);
    const ix = PIC.x0 + 22, iy = PIC.y0 + 22, iw = PIC.x1 - PIC.x0 - 44, ih = PIC.y1 - PIC.y0 - 44;
    g.fillStyle = '#3a2a22'; g.fillRect(ix, iy, iw, ih);
    const sg = g.createLinearGradient(0, iy, 0, iy + ih); sg.addColorStop(0, C.sky); sg.addColorStop(1, C.sky2);
    g.fillStyle = sg; g.fillRect(ix, iy, iw, ih);
    g.strokeStyle = '#e4eeee'; g.lineWidth = 3;
    [[ix + 14, iy + 42, ix + 92, iy + 42], [ix + 150, iy + 34, ix + 218, iy + 34], [ix + 20, iy + 66, ix + 62, iy + 66]].forEach(l => { g.beginPath(); g.moveTo(l[0], l[1]); g.lineTo(l[2], l[3]); g.stroke(); });
    const poly = (pts, col) => { g.fillStyle = col; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fill(); };
    poly([[ix + 12, iy + ih], [ix + 146, iy + 30], [ix + 156, iy + 30], [ix + 112, iy + ih]], C.coneL);
    poly([[ix + 156, iy + 30], [ix + 162, iy + 30], [ix + 196, iy + ih], [ix + 112, iy + ih]], C.cone);
    poly([[ix + 162, iy + 30], [ix + iw, iy + ih], [ix + 196, iy + ih]], C.coneD);
    g.strokeStyle = C.ridge; g.lineWidth = 4;
    [[[ix + 148, iy + 32], [ix + 120, iy + 96], [ix + 104, iy + 158]], [[ix + 160, iy + 32], [ix + 176, iy + 98], [ix + 186, iy + 156]]].forEach(l => { g.beginPath(); l.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); });
    g.fillStyle = '#2a2c48'; g.beginPath(); g.ellipse(ix + 158, iy + 30, 15, 5, 0, 0, TAU); g.fill();
    g.lineCap = 'round';
    g.strokeStyle = C.lava; g.lineWidth = 7; g.beginPath(); g.moveTo(ix + 160, iy + 34); g.lineTo(ix + 172, iy + 74); g.lineTo(ix + 184, iy + 108); g.stroke();
    g.strokeStyle = C.lava2; g.lineWidth = 4; g.beginPath(); g.moveTo(ix + 150, iy + 36); g.lineTo(ix + 142, iy + 70); g.stroke();
    g.fillStyle = C.green; g.fillRect(ix, iy + ih - 20, iw, 20);
    g.fillStyle = C.green2; g.fillRect(ix, iy + ih - 13, iw, 13);
    for (const [x, s] of [[ix + 200, 1], [ix + 16, 0.7]]) {
      g.fillStyle = C.cyp; g.beginPath(); g.moveTo(x, iy + ih - 62); g.quadraticCurveTo(x + 10 * s, iy + ih - 38, x + 7 * s, iy + ih - 20); g.lineTo(x - 7 * s, iy + ih - 20); g.quadraticCurveTo(x - 10 * s, iy + ih - 38, x, iy + ih - 62); g.fill();
    }
    // 三块参数石砖：晕圈（白石沿轮廓）→深描边→砖体→左右明暗面
    for (const s of STONES) {
      g.lineJoin = 'round';
      g.strokeStyle = C.halo; g.lineWidth = 40; g.stroke(stonePath(s, 14));
      g.strokeStyle = C.outline; g.lineWidth = 10; g.stroke(stonePath(s));
      g.fillStyle = s.col; g.fill(stonePath(s));
      g.save(); g.clip(stonePath(s)); g.translate(s.x, s.y); g.rotate(s.r);
      g.fillStyle = 'rgba(255,252,240,.20)'; g.fillRect(-s.h, -s.h, s.h, s.h * 2);
      g.fillStyle = 'rgba(30,20,14,.16)'; g.fillRect(0, -s.h, s.h, s.h * 2);
      g.restore();
    }
  }

  // ---------- 平涂底稿：每帧重画的部分 ----------
  function tabletText(g, lt) {                             // 铭文碑：参数 → 计数器；拍三凿去（换字都走 wipe，不整块硬切）
    g.save();
    const cx = (TAB.x0 + TAB.x1) / 2, cy = (TAB.y0 + TAB.y1) / 2 + 2;
    let txt = null, wipe = 1, cn = false;
    if (lt < 3.45) { txt = '参数'; wipe = ss(0.45, 1.15, lt) * (1 - ss(3.15, 3.45, lt)); }
    else if (lt < 7.5) {
      const v = countVal(lt);
      txt = v >= 999.5 ? '1T+' : (v < 10 ? v.toFixed(1) : String(Math.round(v))) + 'B';
      cn = true; wipe = lt < 3.9 ? ss(3.5, 3.9, lt) : (lt > 7.15 ? 1 - ss(7.15, 7.5, lt) : 1);
    }
    if (txt && wipe > 0.01) {
      g.font = cn ? '700 88px "Cinzel-700"' : '92px "LXGWWenKai-500"';
      g.letterSpacing = cn ? '8px' : '22px';
      g.fillStyle = C.bK; g.strokeStyle = C.bK; g.lineJoin = 'round'; g.lineWidth = cn ? 12 : 9;
      const wpx = g.measureText(txt).width + 44;
      g.save(); g.beginPath(); g.rect(cx - wpx / 2, TAB.y0, wpx * wipe, TAB.y1 - TAB.y0); g.clip();
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.strokeText(txt, cx, cy); g.fillText(txt, cx, cy);
      g.restore(); g.letterSpacing = '0px';
    }
    g.restore();
  }
  const FRZ = [
    { txt: '疯狂卷参数', t0: 3.25, t1: 3.95, out0: 7.15, out1: 7.55 },
    { txt: '参数之外', t0: 7.65, t1: 8.2 },
  ];
  function friezeText(g, lt) {                             // 顶部红横带铭文：逐格凿出
    g.save();
    for (const f of FRZ) {
      const a = ss(f.t0, f.t1, lt) * (f.out0 ? 1 - ss(f.out0, f.out1, lt) : 1);
      if (a <= 0.01) continue;
      g.font = '112px "LXGWWenKai-500"'; g.letterSpacing = '18px';
      g.fillStyle = C.bW; g.strokeStyle = C.bW; g.lineJoin = 'round'; g.lineWidth = 6;
      const wpx = g.measureText(f.txt).width + 56;
      g.save(); g.beginPath(); g.rect(960 - wpx / 2, BAND.y0, wpx * a, BAND.y1 - BAND.y0); g.clip();
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.strokeText(f.txt, 960, 192); g.fillText(f.txt, 960, 192);
      g.restore(); g.letterSpacing = '0px';
    }
    g.restore();
  }
  function volcanoFX(g, lt, t) {                           // 维苏威：云带右漂＋烟团＋火星＋熔岩脉动（拍三加旺）
    const boost = 1 + 0.6 * ss(8.9, 9.7, lt);
    g.save(); g.beginPath(); g.rect(PIC.x0 + 22, PIC.y0 + 22, PIC.x1 - PIC.x0 - 44, PIC.y1 - PIC.y0 - 44); g.clip();
    const bx = PIC.x0 + 180, by = PIC.y0 + 52;             // 火山口
    const cx0 = (t * 40) % 340;
    for (const ox of [-340, 0])
      [[24, 150, 40, 14, C.cloud], [112, 144, 48, 13, C.cloud2], [212, 148, 46, 14, C.cloud], [296, 152, 52, 13, C.cloud2]]
        .forEach(q => { g.fillStyle = q[4]; g.beginPath(); g.ellipse(PIC.x0 + 22 + q[0] + ox + cx0, PIC.y0 + 22 + q[1] - 60, q[2], q[3], 0, 0, TAU); g.fill(); });
    const N = 8;
    for (let i = 0; i < N; i++) {
      const q = ((t * 0.8 + i / N) % 1), e = 1 - Math.pow(1 - q, 1.6);
      const x = bx + e * 145 * boost + Math.sin(t * 2 + i * 2.1) * 8, y = by - e * 52 - Math.sin(e * 3.1) * 13, r = (10 + q * 32) * boost;
      const col = P.mix(P.hex('#3f3c3a'), P.hex('#a29c94'), Math.min(1, q * 1.1));
      g.globalAlpha = q > 0.8 ? (1 - q) / 0.2 : 0.9;
      g.fillStyle = P.rgb(col); g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
      g.fillStyle = P.rgb(P.mix(col, [255, 255, 255], 0.3)); g.beginPath(); g.arc(x - r * 0.3, y - r * 0.3, r * 0.42, 0, TAU); g.fill();
    }
    g.globalAlpha = 1;
    const r = rng(79), NS = Math.round(11 * boost);
    for (let i = 0; i < NS; i++) {
      const ang = -Math.PI / 2 + (r() - 0.5) * 2.1, sp = 55 + r() * 65, ph = r();
      const q = (t * 1.3 + ph) % 1, tt = q * 0.85;
      const x = bx + Math.cos(ang) * sp * tt, y = by + Math.sin(ang) * sp * tt + 140 * tt * tt;
      g.fillStyle = r() < 0.5 ? '#f6d23c' : '#f08a22';
      g.fillRect(x - 4, y - 4, 8, 8);
    }
    g.fillStyle = 'rgba(246,160,40,' + (0.5 + 0.45 * Math.sin(t * 8)).toFixed(2) + ')';
    g.beginPath(); g.ellipse(bx, by + 4, 14, 5, 0, 0, TAU); g.fill();
    g.restore();
  }
  function basePaint(g, lt, t) {
    g.drawImage(S.sb, 0, 0);
    const d = density(lt);
    if (d > 0.002) { g.fillStyle = 'rgba(46,20,16,' + (0.11 * d / 0.5).toFixed(3) + ')'; g.fillRect(0, 0, W, H); }
    // 砖上刻痕数字（砖体吃到 mood 压暗，数字每帧重画保持清晰）
    g.save(); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    g.fillStyle = C.bK; g.strokeStyle = C.bK;
    for (const s of STONES) {
      g.font = s.ns + 'px "Cinzel-700"'; g.lineWidth = s.ns * 0.17;
      g.strokeText(s.num, s.x, s.y + 2); g.fillText(s.num, s.x, s.y + 2);
    }
    g.restore();
    tabletText(g, lt);
    friezeText(g, lt);
    volcanoFX(g, lt, t);
  }

  // ---------- 外框「传送带」：周期 = 卷涡周期 81px 的石块条，石块跟着图案一起走 ----------
  const SIDES = [[1, 0, 0, 1, 0, 0, W], [0, 1, -1, 0, W, 0, H], [-1, 0, 0, -1, W, H, W], [0, -1, 1, 0, 0, H, H]];
  function borderStrip() {
    const NP = 26, SL = PER * NP, NR = 11, bs = BW / NR;
    const pc = P.canvas(SL, BW), pg = pc.getContext('2d', { willReadFrequently: true });
    pg.fillStyle = C.bW; pg.fillRect(0, 0, SL, BW); pg.fillStyle = C.bK; pg.fillRect(0, 0, SL, 8); pg.fillRect(0, 66, SL, BW - 66);
    pg.strokeStyle = C.bK; pg.lineWidth = 13; pg.lineCap = 'round'; pg.lineJoin = 'round';
    for (let k = -1; k <= NP; k++) {
      const u0 = k * PER, cx = u0 + PER * 0.52, cy = 38, r0 = 24;
      pg.beginPath(); pg.moveTo(u0 - 6, 68); pg.quadraticCurveTo(u0 + 2, 42, cx - r0, cy);
      for (let th = Math.PI; th <= Math.PI * 3.25; th += 0.14) { const r = r0 - (th - Math.PI) / (Math.PI * 2.25) * (r0 - 5); pg.lineTo(cx + Math.cos(th) * r, cy + Math.sin(th) * r); }
      pg.stroke();
    }
    const pd = pg.getImageData(0, 0, SL, BW).data, sc = P.canvas(SL, BW), g = sc.getContext('2d');
    g.fillStyle = 'rgb(112,103,92)'; g.fillRect(0, 0, SL, BW);
    for (let j = 0; j < NR; j++) {
      const r = rng(500 + j), n = Math.round(PER / bs), ws = Array.from({ length: n }, () => 0.84 + r() * 0.32), sum = ws.reduce((a, b) => a + b, 0);
      const tiles = []; let u = (j % 2) * bs * 0.5;
      ws.forEach(w0 => { const w = w0 / sum * PER; tiles.push([u, w, Array.from({ length: 8 }, () => (r() - .5) * 1.4), (r() - .5) * 0.12, (r() - .5) * 14]); u += w; });
      for (let k = -1; k <= NP; k++) for (const [u0, w, jt, jl, ja] of tiles) {
        const x0 = k * PER + u0, y0 = j * bs, cx = x0 + w / 2, cy = y0 + bs / 2;
        if (cx < -w || cx > SL + w) continue;
        const o = (Math.min(BW - 1, cy | 0) * SL + Math.max(0, Math.min(SL - 1, cx | 0))) * 4, f = 1 + jl;
        const col = [pd[o] * f + ja, pd[o + 1] * f + ja, pd[o + 2] * f + ja];
        const q = [[x0 + 0.9, y0 + 0.9], [x0 + w - 0.9, y0 + 0.9], [x0 + w - 0.9, y0 + bs - 0.9], [x0 + 0.9, y0 + bs - 0.9]].map((p, i) => [p[0] + jt[i * 2] * 0.6, p[1] + jt[i * 2 + 1] * 0.6]);
        g.fillStyle = P.rgb(col); g.beginPath(); q.forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.closePath(); g.fill();
        g.strokeStyle = P.rgb(P.mix(col, [255, 255, 255], 0.22)); g.lineWidth = 1; g.beginPath(); g.moveTo(...q[0]); g.lineTo(...q[1]); g.stroke();
        g.strokeStyle = P.rgb(P.mix(col, [0, 0, 0], 0.18)); g.beginPath(); g.moveTo(...q[3]); g.lineTo(...q[2]); g.stroke();
      }
    }
    return sc;
  }
  function drawBorder(c, lt) {
    const off = ((18 * lt) % PER + PER) % PER;
    for (const [a, b, c2, d, e, f, len] of SIDES) {
      c.save(); c.transform(a, b, c2, d, e, f);
      c.beginPath(); c.rect(BW, 0, len - 2 * BW, BW); c.clip();
      c.drawImage(S.strip, BW - 2 * PER + off, 0);
      c.restore();
    }
    for (const [x, y] of [[0, 0], [W - BW, 0], [0, H - BW], [W - BW, H - BW]]) {
      c.fillStyle = C.bK; c.fillRect(x, y, BW, BW);
      c.fillStyle = C.bW; c.fillRect(x + 10, y + 10, BW - 20, BW - 20);
      c.fillStyle = C.bK; c.fillRect(x + 22, y + 22, BW - 44, BW - 44);
      c.fillStyle = C.red; c.fillRect(x + 32, y + 32, BW - 64, BW - 64);
    }
  }

  // ---------- 嵌片（emblema）拼片：小石块预拼的道具，随手移动 ----------
  function emblema(w, h, tile, seed, paint) {
    const fc = P.canvas(w, h), fg = fc.getContext('2d', { willReadFrequently: true });
    fg.lineJoin = 'round'; fg.lineCap = 'round';
    paint(fg);
    const fd = fg.getImageData(0, 0, w, h).data;
    const sp = P.canvas(w, h), sg = sp.getContext('2d');
    sg.drawImage(fc, 0, 0);
    sg.globalCompositeOperation = 'source-in'; sg.fillStyle = 'rgb(104,95,82)'; sg.fillRect(0, 0, w, h); sg.globalCompositeOperation = 'source-over';
    const r = rng(seed);
    for (let y = 0; y < h; y += tile) for (let x = ((y / tile) % 2) * tile * 0.5 - tile; x < w; x += tile) {
      const cx = x + tile / 2, cy = y + tile / 2; if (cx < 0 || cx >= w || cy >= h) continue;
      const o = ((cy | 0) * w + (cx | 0)) * 4; if (fd[o + 3] < 110) continue;
      const f = 1 + (r() - .5) * 0.14;
      const col = [fd[o] * f, fd[o + 1] * f, fd[o + 2] * f], px = x + 0.8 + (r() - .5) * 1.1, py = y + 0.8 + (r() - .5) * 1.1, s = tile - 1.6;
      sg.fillStyle = P.rgb(col); sg.fillRect(px, py, s, s);
      sg.fillStyle = 'rgba(255,255,255,.16)'; sg.fillRect(px, py, s, 1.6);
      sg.fillStyle = 'rgba(20,14,10,.18)'; sg.fillRect(px, py + s - 1.6, s, 1.6);
    }
    return sp;
  }
  function buildSprites() {
    // 莎草纸卷轴（数据）
    const scroll = emblema(250, 150, 5.5, 201, g => {
      g.translate(125, 78);
      g.strokeStyle = C.outline; g.lineWidth = 6;
      g.fillStyle = C.floor; g.beginPath(); g.moveTo(-86, -26); g.quadraticCurveTo(0, -40, 86, -26); g.lineTo(86, 26); g.quadraticCurveTo(0, 40, -86, 26); g.closePath(); g.fill(); g.stroke();
      g.strokeStyle = C.floorLine; g.lineWidth = 2.5;
      for (let yy = -16; yy <= 16; yy += 8) { g.beginPath(); g.moveTo(-72, yy); for (let x = -72; x <= 72; x += 24) g.quadraticCurveTo(x + 6, yy + (x / 24 % 2 ? 2 : -2), x + 12, yy); g.stroke(); }
      for (const dx of [-104, 104]) {
        g.fillStyle = C.ground; g.strokeStyle = C.outline; g.lineWidth = 5;
        g.beginPath(); g.roundRect(dx - 11, -32, 22, 64, 9); g.fill(); g.stroke();
        g.fillStyle = C.ground2; g.beginPath(); g.arc(dx, -34, 6, 0, TAU); g.fill(); g.beginPath(); g.arc(dx, 34, 6, 0, TAU); g.fill();
        g.fillStyle = C.gold; g.beginPath(); g.arc(dx, -34, 3, 0, TAU); g.fill(); g.beginPath(); g.arc(dx, 34, 3, 0, TAU); g.fill();
      }
    });
    // 太阳轮罗盘（方法）
    const wheel = emblema(290, 290, 5.5, 202, g => {
      g.translate(145, 145);
      for (let i = 0; i < 8; i++) {
        const a0 = i * TAU / 8 - 0.24, a1 = i * TAU / 8 + 0.24;
        g.fillStyle = i % 2 ? C.gold : C.red;
        g.beginPath(); g.moveTo(Math.cos(a0) * 44, Math.sin(a0) * 44); g.arc(0, 0, 126, a0, a1); g.closePath(); g.fill();
        g.strokeStyle = C.outline; g.lineWidth = 4; g.stroke();
      }
      g.strokeStyle = C.outline; g.lineWidth = 8; g.beginPath(); g.arc(0, 0, 132, 0, TAU); g.stroke();
      g.strokeStyle = C.gold; g.lineWidth = 10; g.beginPath(); g.arc(0, 0, 124, 0, TAU); g.stroke();
      g.fillStyle = C.red2; g.beginPath(); g.arc(0, 0, 42, 0, TAU); g.fill();
      g.strokeStyle = C.gold; g.lineWidth = 7; g.stroke();
      g.fillStyle = C.gold2; g.beginPath(); g.arc(0, 0, 18, 0, TAU); g.fill();
    });
    // 三足火盆（算力）
    const brazier = emblema(230, 250, 5.5, 203, g => {
      g.translate(115, 130);
      g.strokeStyle = C.outline; g.lineWidth = 11; g.lineCap = 'round';
      for (const [dx, dy] of [[-34, 108], [34, 108], [0, 114]]) { g.beginPath(); g.moveTo(dx * 0.4, 26); g.lineTo(dx, dy); g.stroke(); }
      g.fillStyle = C.red2; g.strokeStyle = C.outline; g.lineWidth = 7;
      g.beginPath(); g.moveTo(-64, 4); g.quadraticCurveTo(-52, -40, 0, -44); g.quadraticCurveTo(52, -40, 64, 4); g.quadraticCurveTo(0, 22, -64, 4); g.closePath(); g.fill(); g.stroke();
      g.strokeStyle = C.gold; g.lineWidth = 6; g.beginPath(); g.moveTo(-58, -2); g.quadraticCurveTo(0, 14, 58, -2); g.stroke();
      g.fillStyle = C.lava2; g.beginPath(); g.ellipse(0, -40, 40, 9, 0, 0, TAU); g.fill();
      const r = rng(88);
      for (let i = 0; i < 12; i++) { g.fillStyle = i % 2 ? C.lava : '#b3311c'; g.fillRect(-38 + r() * 76, -46 + r() * 10, 7, 6); }
      g.fillStyle = C.gold2; g.fillRect(-6, -18, 12, 20);
    });
    return { scroll, wheel, brazier };
  }
  // 火盆砖火：方石沿正弦上窜（白石热气同款）
  function flames(c, x, y, t) {
    const r = rng(5150);
    for (let i = 0; i < 9; i++) {
      const ph = r(), sp = 0.6 + r() * 0.5, dx0 = (r() - .5) * 30;
      const q = ((t * sp + ph) % 1), fx = x + dx0 + Math.sin(t * 5 + i * 2.3) * 6 * (1 - q), fy = y - q * 58;
      const s = 8.5 - q * 5, a = q > 0.75 ? (1 - q) / 0.25 : 1;
      c.globalAlpha = a * 0.95;
      c.fillStyle = 'rgb(96,86,74)'; c.fillRect(fx - s / 2 - 1, fy - s / 2 - 1, s + 2, s + 2);
      c.fillStyle = i % 3 === 0 ? '#f2952c' : '#d64a22'; c.fillRect(fx - s / 2, fy - s / 2, s, s);
      if (i % 3 === 0 && s > 5) { c.fillStyle = '#f6d23c'; c.fillRect(fx - s / 4, fy - s / 4, s / 2, s / 2); }
    }
    c.globalAlpha = 1;
  }
  function drawObjects(c, lt, t) {
    for (let q = 0; q < 3; q++) {
      const o = OBJ[q], k = clamp((lt - o.rise) / 0.85, 0, 1);
      if (k <= 0) continue;
      const dy = (1 - ease.outBack(k)) * 250;
      c.save(); c.translate(o.x, o.y + dy);
      if (o.sp === 'wheel') { c.rotate(lt * 0.22); c.drawImage(S.spr.wheel, -145, -145); }
      else if (o.sp === 'scroll') { c.translate(0, Math.sin(t * 1.2) * 3 * k); c.drawImage(S.spr.scroll, -125, -75); }
      else { c.drawImage(S.spr.brazier, -115, -120); flames(c, 0, -40, t); }
      c.restore();
    }
  }

  // ---------- 相机：停住看砖浪自己展开，末尾微缓推收全貌（噪点底图上运镜会整幅翻搅） ----------
  function camOf(lt) {
    return { z: 1 + 0.02 * ease.inOut(ss(9.3, 9.98, lt)), cx: 960, cy: 540 };
  }

  // ---------- 镶嵌渲染器：布局（只算一次） ----------
  let S = null;
  function edt(F, w, h) {                                   // 2D 平方欧氏距离变换（Felzenszwalb–Huttenlocher）
    const n = Math.max(w, h), f = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
    const pass = (len) => {
      let k = 0; v[0] = 0; z[0] = -1e30; z[1] = 1e30;
      for (let q = 1; q < len; q++) { let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); while (s <= z[k]) { k--; s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); } k++; v[k] = q; z[k] = s; z[k + 1] = 1e30; }
      k = 0; for (let q = 0; q < len; q++) { while (z[k + 1] < q) k++; d[q] = (q - v[k]) * (q - v[k]) + f[v[k]]; }
    };
    const out = new Float64Array(w * h);
    for (let x = 0; x < w; x++) { for (let y = 0; y < h; y++) f[y] = F[y * w + x]; pass(h); for (let y = 0; y < h; y++) out[y * w + x] = d[y]; }
    for (let y = 0; y < h; y++) { for (let x = 0; x < w; x++) f[x] = out[y * w + x]; pass(w); for (let x = 0; x < w; x++) out[y * w + x] = d[x]; }
    return out;
  }
  function build() {
    const t0 = performance.now();
    const mk = () => { const cv = P.canvas(); return [cv, cv.getContext('2d', { willReadFrequently: true })]; };
    // 静态底稿（灰泥墙＋嵌板＋石砖） + 缆索网上色图（保留区让开）+ 结构图
    const sb = P.canvas(), sbg = sb.getContext('2d'); staticBase(sbg);
    const ncol = P.canvas(), ncg = ncol.getContext('2d'); drawNet(ncg, null); clearReserves(ncg);
    const sc = P.canvas(), sg = sc.getContext('2d', { willReadFrequently: true });
    sg.drawImage(sb, 0, 0); sg.drawImage(ncol, 0, 0);
    // 类别图
    const [cc, cg] = mk(), cs = k => 'rgb(' + (k * 16) + ',0,0)';
    cg.fillStyle = cs(K_WALL); cg.fillRect(0, 0, W, H);
    drawNet(cg, cs(K_NET)); clearReserves(cg);
    cg.fillStyle = cs(K_BAND); cg.fillRect(100, BAND.y0, 1720, BAND.y1 - BAND.y0);
    cg.fillStyle = cs(K_TABL); cg.fillRect(TAB.x0, TAB.y0, TAB.x1 - TAB.x0, TAB.y1 - TAB.y0);
    cg.fillStyle = cs(K_PIC); cg.fillRect(PIC.x0, PIC.y0, PIC.x1 - PIC.x0, PIC.y1 - PIC.y0);
    cg.lineJoin = 'round'; cg.strokeStyle = cs(K_HALO); cg.lineWidth = 40;
    for (const s of STONES) cg.stroke(stonePath(s, 14));
    for (const s of STONES) { cg.fillStyle = cs(K_INSU); cg.fill(stonePath(s)); }
    const cd = cg.getImageData(0, 0, W, H).data, CL = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) CL[i] = Math.round(cd[i * 4] / 16);
    // 半分辨率：边缘 → 精确欧氏距离变换
    const HW = 960, HH = 540, N = HW * HH;
    const hc = P.canvas(HW, HH), hg = hc.getContext('2d', { willReadFrequently: true }); hg.drawImage(sc, 0, 0, HW, HH);
    const hd = hg.getImageData(0, 0, HW, HH).data;
    const CH = new Uint8Array(N); for (let y = 0; y < HH; y++) for (let x = 0; x < HW; x++) CH[y * HW + x] = CL[(2 * y) * W + 2 * x];
    const F = new Float64Array(N);
    for (let y = 0; y < HH; y++) for (let x = 0; x < HW; x++) {
      const i = y * HW + x, o = i * 4; let e = false;
      if (x < HW - 1) { const q = o + 4; e = Math.abs(hd[o] - hd[q]) + Math.abs(hd[o + 1] - hd[q + 1]) + Math.abs(hd[o + 2] - hd[q + 2]) > 34; }
      if (!e && y < HH - 1) { const q = o + HW * 4; e = Math.abs(hd[o] - hd[q]) + Math.abs(hd[o + 1] - hd[q + 1]) + Math.abs(hd[o + 2] - hd[q + 2]) > 34; }
      F[i] = e ? 0 : 1e20;
    }
    const D = edt(F, HW, HH);
    for (let i = 0; i < N; i++) D[i] = Math.sqrt(D[i]) * 2;
    const tangent = (i) => { const x = i % HW, y = (i / HW) | 0; const gx = D[i + (x < HW - 1 ? 1 : 0)] - D[i - (x > 0 ? 1 : 0)], gy = D[i + (y < HH - 1 ? HW : 0)] - D[i - (y > 0 ? HW : 0)]; return Math.atan2(gy, gx) + Math.PI / 2; };
    // 石块种子：空间哈希保证最小间距
    const sx = [], sy = [], ssz = [], sa = [], scl = [];
    const CS = 24, GWc = Math.ceil(W / CS), GHc = Math.ceil(H / CS), cell = Array.from({ length: GWc * GHc }, () => []);
    const ok = (x, y, s, f) => {
      const cx = (x / CS) | 0, cy = (y / CS) | 0;
      for (let j = cy - 1; j <= cy + 1; j++) for (let i = cx - 1; i <= cx + 1; i++) {
        if (i < 0 || j < 0 || i >= GWc || j >= GHc) continue;
        for (const k of cell[j * GWc + i]) { const m = f * (s + ssz[k]) / 2, dx = sx[k] - x, dy = sy[k] - y; if (dx * dx + dy * dy < m * m) return false; }
      } return true;
    };
    const add = (x, y, s, a, c) => { const k = sx.length; sx.push(x); sy.push(y); ssz.push(s); sa.push(a); scl.push(c); cell[((y / CS) | 0) * GWc + ((x / CS) | 0)].push(k); return k; };
    // ① 沿轮廓：距离场等值线上走线放石
    const r = rng(2079);
    const cand = new Uint8Array(N), vis = new Uint8Array(N);
    for (let i = 0; i < N; i++) { const c = CH[i], s = SZ[c], d = D[i]; if (d < 1) continue; const k = Math.floor(d / s); if (k >= KR[c]) continue; if (Math.abs(d - (k + 0.5) * s) < 1.5) cand[i] = 1; }
    const NB = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
    for (let i0 = 0; i0 < N; i0++) {
      if (!cand[i0] || vis[i0]) continue;
      let cur = i0, px = -1e9, py = -1e9, dx = 1, dy = 0;
      for (;;) {
        vis[cur] = 1; const hx = cur % HW, hy = (cur / HW) | 0, x = 2 * hx + 1, y = 2 * hy + 1, c = CH[cur], s = SZ[c];
        if ((x - px) ** 2 + (y - py) ** 2 >= s * s * 0.98 && ok(x, y, s, 0.86)) { add(x, y, s, tangent(cur), c); px = x; py = y; }
        let best = -1, bd = -9, bx = 0, by = 0;
        for (const [ox, oy] of NB) {
          const nx = hx + ox, ny = hy + oy; if (nx < 0 || ny < 0 || nx >= HW || ny >= HH) continue;
          const n = ny * HW + nx; if (!cand[n] || vis[n]) continue;
          const l = Math.hypot(ox, oy), dt = (ox * dx + oy * dy) / l; if (dt > bd) { bd = dt; best = n; bx = ox / l; by = oy / l; }
        }
        if (best < 0) break;
        dx = dx * 0.6 + bx * 0.4; dy = dy * 0.6 + by * 0.4; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l; cur = best;
      }
    }
    // ② 规则成行（砖缝错半块）＋补洞
    for (let c = 0; c < SZ.length; c++) {
      const s = SZ[c];
      for (let j = 0; (j + 0.5) * s < H; j++) for (let i = -1; (i + 0.5) * s < W; i++) {
        const x = (i + 0.5 + (j % 2) * 0.5) * s + (r() - .5) * 0.18 * s, y = (j + 0.5) * s + (r() - .5) * 0.1 * s;
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        if (CL[(y | 0) * W + (x | 0)] !== c) continue;
        const hi = Math.min(HH - 1, (y / 2) | 0) * HW + Math.min(HW - 1, (x / 2) | 0);
        const contour = KR[c] >= 99 || D[hi] < KR[c] * s;
        if (ok(x, y, s, 0.9)) add(x, y, s, contour ? tangent(hi) : (r() - .5) * 0.07, c);
      }
    }
    // ③ 光栅化：加权 L∞ Voronoi（四边独立抖动的旋转方块 → 不规则石块，平分线处灰浆）
    const n = sx.length;
    const HUP = new Float32Array(n), HUM = new Float32Array(n), HVP = new Float32Array(n), HVM = new Float32Array(n), CA = new Float32Array(n), SA = new Float32Array(n);
    const JL = new Float32Array(n), TR = new Float32Array(n), TG = new Float32Array(n), TB = new Float32Array(n), SIDX = new Int32Array(n);
    for (let k = 0; k < n; k++) {
      const h = ssz[k] / 2, c = scl[k];
      HUP[k] = h * (1.08 + r() * 0.2); HUM[k] = h * (1.08 + r() * 0.2); HVP[k] = h * (1.08 + r() * 0.2); HVM[k] = h * (1.08 + r() * 0.2);
      const a = sa[k] + (r() - .5) * 0.12; CA[k] = Math.cos(a); SA[k] = Math.sin(a);
      JL[k] = (r() - .5) * 2 * JIT[c]; const ad = (r() - .5) * 14; TR[k] = ad; TG[k] = ad; TB[k] = ad;
      const q = r(); if (q < 0.09) { TR[k] += 12; TG[k] += 4; TB[k] -= 8; } else if (q < 0.16) { TR[k] -= 6; TB[k] += 9; }
      if (c === K_WALL && r() < 0.07) JL[k] -= 0.12;
      SIDX[k] = clamp(Math.round(sy[k]), 0, H - 1) * W + clamp(Math.round(sx[k]), 0, W - 1);
    }
    const D1 = new Float32Array(W * H).fill(9), D2 = new Float32Array(W * H).fill(9), ID = new Int32Array(W * H).fill(-1);
    for (let k = 0; k < n; k++) {
      const cx = sx[k], cy = sy[k], ca = CA[k], sn = SA[k], hm = Math.max(HUP[k], HUM[k], HVP[k], HVM[k]), R = Math.ceil(hm * 1.5) + 1;
      const x0 = Math.max(0, (cx - R) | 0), x1 = Math.min(W - 1, (cx + R) | 0), y0 = Math.max(0, (cy - R) | 0), y1 = Math.min(H - 1, (cy + R) | 0);
      const hup = HUP[k], hum = HUM[k], hvp = HVP[k], hvm = HVM[k];
      for (let y = y0; y <= y1; y++) { const ddy = y + 0.5 - cy; let p = y * W + x0; for (let x = x0; x <= x1; x++, p++) {
        const ddx = x + 0.5 - cx, u = ddx * ca + ddy * sn, v = -ddx * sn + ddy * ca;
        const du = u > 0 ? u / hup : -u / hum, dv = v > 0 ? v / hvp : -v / hvm, Dd = du > dv ? du : dv;
        if (Dd < D1[p]) { D2[p] = D1[p]; D1[p] = Dd; ID[p] = k; } else if (Dd < D2[p]) D2[p] = Dd;
      } }
    }
    // ④ 每像素：石块 or 灰浆；石面斜面明暗（左上受光）＋颗粒；灰浆噪声一次预存
    const SH = new Uint8Array(W * H), MORT = new Int8Array(W * H), LX = -0.6, LY = -0.8, gr = rng(7), grr = rng(13);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const p = y * W + x, k = ID[p]; MORT[p] = (grr() - .5) * 16;
      if (k < 0) continue;
      const h = (HUP[k] + HUM[k] + HVP[k] + HVM[k]) / 4, g = clamp(0.1 * ssz[k], 0.5, 1.25), d1 = D1[p];
      const gap = (D2[p] - d1) * h / 2;
      if (d1 > 1 || gap < g) { ID[p] = -1; continue; }
      const e = Math.min((1 - d1) * h, gap - g);
      let sh = 1 - 0.05 * d1 * d1 + (gr() - 0.5) * 0.06;
      if (e < 2.2) {
        const ddx = x + 0.5 - sx[k], ddy = y + 0.5 - sy[k], ca = CA[k], sn = SA[k], u = ddx * ca + ddy * sn, v = -ddx * sn + ddy * ca;
        const du = u > 0 ? u / HUP[k] : -u / HUM[k], dv = v > 0 ? v / HVP[k] : -v / HVM[k];
        const nx = du > dv ? Math.sign(u) * ca : -Math.sign(v) * sn, ny = du > dv ? Math.sign(u) * sn : Math.sign(v) * ca;
        sh += 0.16 * (1 - e / 2.2) * (nx * LX + ny * LY);
      }
      SH[p] = clamp(Math.round(sh * 128), 0, 255);
    }
    // ⑤ 每石块静态属性：类别 / 网底色 / 墙底色（灰泥墙之外的真石色）/ 出生时刻 / 密度序 / 晕圈呼吸 / 描金坐标
    const ndata = ncg.getImageData(0, 0, W, H).data;
    const WALLC = P.hex(C.wall);
    const CAT = new Uint8Array(n), NBr = new Float32Array(n), NBg = new Float32Array(n), NBb = new Float32Array(n);
    const WBr = new Float32Array(n), WBg = new Float32Array(n), WBb = new Float32Array(n);
    const birth = new Float32Array(n), rank = new Float32Array(n), haloA = new Float32Array(n), haloP = new Float32Array(n);
    const phk = new Float32Array(n), gsx = new Float32Array(n), ndk = new Float32Array(n), wxk = new Float32Array(n), wyk = new Float32Array(n);
    for (let k = 0; k < n; k++) {
      const c = scl[k]; CAT[k] = c;
      const x = sx[k], y = sy[k], f = 1 + JL[k], o = SIDX[k] * 4;
      const nd = Math.hypot(x - NC.x, y - NC.y);
      ndk[k] = nd;
      birth[k] = birthOf(nd, hash(k * 3 + 11, 7));
      if (c === K_NET) { NBr[k] = ndata[o] * f + TR[k]; NBg[k] = ndata[o + 1] * f + TG[k]; NBb[k] = ndata[o + 2] * f + TB[k]; }
      else if (c === K_WALL) { WBr[k] = WALLC[0] * f + TR[k]; WBg[k] = WALLC[1] * f + TG[k]; WBb[k] = WALLC[2] * f + TB[k]; rank[k] = hash(k * 7 + 1, 3); }
      let ha = 0, hp = 0;
      for (let q = 0; q < 3; q++) { const s = STONES[q], dd = Math.hypot(x - s.x, y - s.y), a = clamp(1 - (dd - (s.h + 30)) / 80, 0, 1); if (a > ha) { ha = a; hp = q * 2.1; } }
      haloA[k] = ha; haloP[k] = hp;
      phk[k] = hash(k, 17) * TAU; gsx[k] = 0.62 * x + 0.78 * y;
      wxk[k] = x * 0.0035; wyk[k] = y * 0.0021;
    }
    // 每像素墙出生表（灰泥缝跟着砖浪走）：WBIRTH
    const WBIRTH = new Float32Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const p = y * W + x;
      WBIRTH[p] = birthOf(Math.hypot(x - NC.x, y - NC.y), hash(x * 3 + 1, y * 7 + 5));
    }
    // 底稿画布 / 全幅像素缓冲
    const bgc = P.canvas(), bg = bgc.getContext('2d', { willReadFrequently: true });
    const img = bg.createImageData(W, H);
    S = { sb, ncol, bgc, bg, img, ID, SH, MORT, WBIRTH, SIDX, CAT, NBr, NBg, NBb, WBr, WBg, WBb, birth, rank, haloA, haloP, phk, gsx, ndk, wxk, wyk, n,
      TCr: new Uint8ClampedArray(n), TCg: new Uint8ClampedArray(n), TCb: new Uint8ClampedArray(n),
      strip: borderStrip(), spr: buildSprites(), ms: performance.now() - t0, sx, sy, scl };
    const cnt = {}; for (let k = 0; k < n; k++) cnt[scl[k]] = (cnt[scl[k]] || 0) + 1;
    window.__sr4_stats = { tiles: n, buildMs: Math.round(S.ms), cnt, CL_probe: [[490, 545], [960, 505], [1330, 545], [960, 822], [960, 190], [1700, 200], [700, 300], [300, 900], [960, 530]].map(p => [p[0], p[1], CL[p[1] * W + p[0]], ID[p[1] * W + p[0]]]) };
  }

  // ---------- 每帧重上色（石块不动，颜色流过） ----------
  function recolor(lt, t, bd) {
    const d = density(lt), calm = 1 - 0.55 * ss(8.6, 9.8, lt);         // 收稳：波动衰减
    const gsw = lt > 7.85 && lt < 9.7 ? -350 + (lt - 7.85) * 2050 : -1e9; // 描金扫场（拍三：变亮变精）
    const ripA = ss(6.35, 6.47, lt) * (1 - ss(7.05, 7.2, lt));           // 1T+ 金色涟漪（唯一重音，起收都渐变）
    const rip = ripA > 0 ? (lt - 6.35) * 950 - 80 : -1;
    const { TCr, TCg, TCb, CAT, SIDX, NBr, NBg, NBb, WBr, WBg, WBb, birth, rank, haloA, haloP, phk, gsx, ndk, wxk, wyk, n } = S;
    for (let k = 0; k < n; k++) {
      const cat = CAT[k], o = SIDX[k] * 4;
      let cr, cg2, cb;
      if (cat === K_NET || cat === K_WALL) {                 // 网石与墙石：出生走「灰泥 → 拱起压暗 → 闪白 → 落砖」
        const bt = birth[k];
        if (lt < bt - 0.35) {
          const q = clamp((bt - 0.35 - lt) / 0.35, 0, 1), dk = 1 - 0.10 * (1 - q);
          cr = bd[o] * dk; cg2 = bd[o + 1] * dk; cb = bd[o + 2] * dk;
        } else if (lt < bt) {
          const q = (lt - (bt - 0.35)) / 0.35;
          cr = lerp(bd[o], FLASH[0], q * 0.85); cg2 = lerp(bd[o + 1], FLASH[1], q * 0.85); cb = lerp(bd[o + 2], FLASH[2], q * 0.85);
        } else if (lt < bt + 0.22) {
          const q = (lt - bt) / 0.22;
          const R = cat === K_NET ? NBr[k] : WBr[k], G = cat === K_NET ? NBg[k] : WBg[k], B = cat === K_NET ? NBb[k] : WBb[k];
          cr = lerp(FLASH[0], R, q); cg2 = lerp(FLASH[1], G, q); cb = lerp(FLASH[2], B, q);
        } else {
          const gl = 1 + (hash(k, (t * 8) | 0) - 0.5) * (cat === K_NET ? 0.07 : 0.03) * calm;   // 石面碎金般明灭（网砖明显，墙砖隐约）
          if (cat === K_NET) { cr = NBr[k] * gl; cg2 = NBg[k] * gl; cb = NBb[k] * gl; }
          else {
            cr = WBr[k]; cg2 = WBg[k]; cb = WBb[k];
            const rk = rank[k];
            if (rk < d) { const f = clamp((d - rk) / 0.06, 0, 1) * 0.34; cr += (124 - cr) * f; cg2 += (34 - cg2) * f; cb += (29 - cb) * f; }
            const wsh = 1 + 0.055 * Math.sin(wxk[k] + wyk[k] - lt * 0.55 + phk[k]) * calm;      // 墙色慢波（环境呼吸）
            cr *= gl * wsh; cg2 *= gl * wsh; cb *= gl * wsh;
          }
        }
      } else {
        cr = bd[o]; cg2 = bd[o + 1]; cb = bd[o + 2];
        if (cat === K_INSU) {                                 // 砖面洗色：光沿小石间流过
          const wsh = 1 + 0.09 * Math.sin(wxk[k] * 3 + wyk[k] * 2.2 + t * 2.1 + phk[k]);
          const gl = 1 + (hash(k, (t * 8) | 0) - 0.5) * 0.06;
          cr *= wsh * gl; cg2 *= wsh * gl; cb *= wsh * gl;
        }
      }
      {                                                        // 晕圈呼吸（灰泥阶段也泛光，围着石砖）
        const ha = haloA[k];
        if (ha > 0) { const hb = 1 + ha * 0.11 * Math.sin(t * 1.25 + haloP[k]) * calm; cr *= hb; cg2 *= hb; cb *= hb; }
      }
      if (gsw > -1e8) {                                       // 描金扫场
        const q = gsw - gsx[k];
        if (q >= 0) {
          const g0 = q > 100 ? 0.12 : 0.12 + 0.43 * Math.sin(Math.PI * q / 100);
          if (g0 > 0) { const gf = cat === K_NET || cat === K_WALL ? 1 : 0.45; cr += (GOLD[0] - cr) * g0 * gf; cg2 += (GOLD[1] - cg2) * g0 * gf; cb += (GOLD[2] - cb) * g0 * gf; }
        }
      }
      if (rip > 0) {                                          // 1T+ 涟漪
        const dr = Math.abs(ndk[k] - rip);
        if (dr < 80) { const g0 = 0.5 * (1 - dr / 80) * ripA; cr += (GOLD[0] - cr) * g0; cg2 += (GOLD[1] - cg2) * g0; cb += (GOLD[2] - cb) * g0; }
      }
      TCr[k] = cr; TCg[k] = cg2; TCb[k] = cb;
    }
  }

  return {
    init() {
      if (!S) build();
      U.assertGlyphs('112px "LXGWWenKai-500"', '参数疯狂卷之外', 's04_roman 屏上字');
      U.assertGlyphs('96px "Cinzel-700"', '0123456789.-BT+', 's04_roman 数字');
    },
    draw(c, lt, t) {
      if (!S) build();
      const cam = camOf(lt);
      S.bg.setTransform(1, 0, 0, 1, 0, 0);
      basePaint(S.bg, lt, t);
      const bd = S.bg.getImageData(0, 0, W, H).data;
      recolor(lt, t, bd);
      // 相机折进像素遍：按屏幕像素反查世界锚定的 ID 图（石块布局在世界里纹丝不动）。
      // 灰浆缝（ID<0）读每像素出生表 WBIRTH：未铺＝灰泥色，砖浪到 → 拱起 → 闪白 → 落浆。
      const { img, ID, SH, MORT, WBIRTH, TCr, TCg, TCb } = S, dd = img.data;
      const iw = 1 / cam.z, x0w = cam.cx + (0.5 - W / 2) * iw, y0w = cam.cy + (0.5 - H / 2) * iw;
      let p4 = 0;
      for (let py = 0; py < H; py++) {
        const wyi = Math.min(H - 1, Math.max(0, (y0w + py * iw) | 0)) * W;
        let wx = x0w;
        for (let px = 0; px < W; px++, p4 += 4) {
          const wxi = Math.min(W - 1, Math.max(0, wx | 0));
          wx += iw;
          const p = wyi + wxi, k = ID[p];
          if (k < 0) {
            const b = WBIRTH[p];
            if (lt < b - 0.35) { dd[p4] = PLASTER[0]; dd[p4 + 1] = PLASTER[1]; dd[p4 + 2] = PLASTER[2]; }
            else if (lt < b) { const q = (lt - (b - 0.35)) / 0.35, dk = 1 - 0.10 * (1 - q); dd[p4] = PLASTER[0] * dk; dd[p4 + 1] = PLASTER[1] * dk; dd[p4 + 2] = PLASTER[2] * dk; }
            else if (lt < b + 0.22) { const q = (lt - b) / 0.22, nz = MORT[p]; dd[p4] = lerp(FLASH[0], 112 + nz, q); dd[p4 + 1] = lerp(FLASH[1], 103 + nz, q); dd[p4 + 2] = lerp(FLASH[2], 92 + nz, q); }
            else { const nz = MORT[p]; dd[p4] = 112 + nz; dd[p4 + 1] = 103 + nz; dd[p4 + 2] = 92 + nz; }
          } else {
            const sh = SH[p];
            dd[p4] = (TCr[k] * sh) >> 7; dd[p4 + 1] = (TCg[k] * sh) >> 7; dd[p4 + 2] = (TCb[k] * sh) >> 7;
          }
          dd[p4 + 3] = 255;
        }
      }
      c.putImageData(img, 0, 0);
      c.save();
      c.translate(W / 2, H / 2); c.scale(cam.z, cam.z); c.translate(-cam.cx, -cam.cy);
      drawBorder(c, lt);
      drawObjects(c, lt, t);
      c.restore();
    },
  };
})();
