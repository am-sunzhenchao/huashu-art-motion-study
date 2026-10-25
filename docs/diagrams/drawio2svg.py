"""把 build_huashu_design.py 生成的 .drawio 渲染为自包含 SVG。

不依赖 draw.io 桌面端 / npx：直接解析 mxGraphModel 几何，绘制
group / box / text / ortho edge，输出可嵌入 HTML 的矢量图。

用法：python3 drawio2svg.py architecture.drawio architecture.svg
"""
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from xml.sax.saxutils import escape as xescape

OUT_DIR = Path(__file__).resolve().parent

FONT = ("-apple-system, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', "
        "'Helvetica Neue', Arial, sans-serif")

DIRS = {"L": (-1, 0), "R": (1, 0), "U": (0, -1), "D": (0, 1)}


def parse_style(style):
    d = {}
    for kv in (style or "").split(";"):
        if not kv:
            continue
        k, _, v = kv.partition("=")
        d[k] = v
    return d


def val(style, key, default):
    s = style.get(key)
    return default if s is None else s


def fmt_path(pts):
    parts = []
    for i, (x, y) in enumerate(pts):
        parts.append(f"{'M' if i == 0 else 'L'} {x:.0f} {y:.0f}")
    return " ".join(parts)


def route_edge(src_rect, exit_axis, dst_rect, entry_axis, pad=20):
    """给定 source/edge 的矩形与出口轴、目标矩形与入口轴，构造正交折线。"""
    x1, y1 = exit_point(src_rect, exit_axis)
    x2, y2 = exit_point(dst_rect, entry_axis)
    d1 = axis_dir(exit_axis)
    d2 = axis_dir(entry_axis)

    if x1 == x2 and y1 == y2:
        return [(x1, y1)]
    if x1 == x2:
        return [(x1, y1), (x1, y2)]
    if y1 == y2 and d1 != d2:
        return [(x1, y1), (x2, y1)]

    # 同向绕行（U 顶部绕 / D 底部绕 / L 左侧绕 / R 右侧绕）
    if d1 == d2:
        if d1 in ("U", "D"):
            if y1 == y2:
                ym = y1 + (pad if d1 == "D" else -pad)
            else:
                ym = (max(y1, y2) + pad) if d1 == "D" else (min(y1, y2) - pad)
            return [(x1, y1), (x1, ym), (x2, ym), (x2, y2)]
        if x1 == x2:
            xm = x1 + (pad if d1 == "L" else -pad)
        else:
            xm = (max(x1, x2) + pad) if d1 == "R" else (min(x1, x2) - pad)
        return [(x1, y1), (xm, y1), (xm, y2), (x2, y2)]

    # 首段水平 → 先横后纵（R/L 与 U/D 的 Z 折）
    if d1 in ("L", "R"):
        if d2 in ("L", "R"):
            xm = (x1 + x2) // 2
            return [(x1, y1), (xm, y1), (xm, y2), (x2, y2)]
        return [(x1, y1), (x2, y1), (x2, y2)]
    # 首段垂直 → 先纵后横
    if d2 in ("L", "R"):
        return [(x1, y1), (x1, y2), (x2, y2)]
    ym = (y1 + y2) // 2
    return [(x1, y1), (x1, ym), (x2, ym), (x2, y2)]


def exit_point(rect, axis):
    x, y, w, h = rect
    if axis == "R":
        return (x + w, y + h / 2)
    if axis == "L":
        return (x, y + h / 2)
    if axis == "B":
        return (x + w / 2, y + h)
    return (x + w / 2, y)


def axis_dir(axis):
    return {"R": "R", "L": "L", "T": "U", "B": "D"}[axis]


def edge_exit(style, rect):
    ex = val(style, "exitX", 0.5)
    ey = val(style, "exitY", 0.5)
    x, y, w, h = rect
    if float(ex) in (0.0, 1.0):
        axis = "R" if float(ex) == 1.0 else "L"
    else:
        axis = "B" if float(ey) == 1.0 else "T"
    return exit_point(rect, axis), axis


def edge_entry(style, rect):
    ex = val(style, "entryX", 0.5)
    ey = val(style, "entryY", 0.5)
    x, y, w, h = rect
    if float(ex) in (0.0, 1.0):
        axis = "R" if float(ex) == 1.0 else "L"
    else:
        axis = "B" if float(ey) == 1.0 else "T"
    return exit_point(rect, axis), axis


def split_label(value):
    return value.replace("&#10;", "\n").split("\n")


def text_label(x, y, w, label, style, anchor=None, is_text=False, height=0):
    fs = int(val(style, "fontSize", 12))
    fc = val(style, "fontColor", "#222222")
    bold = "fontStyle=1" in (style.get("fontStyle") or "")
    italic = "fontStyle=2" in (style.get("fontStyle") or "")
    weight = "bold" if bold else "normal"
    align = val(style, "align", "center")
    valign = val(style, "verticalAlign", "middle")
    if anchor is None:
        anchor = {"left": "start", "center": "middle", "right": "end"}.get(align, "middle")
    lines = split_label(label)
    lh = fs * 1.35
    block_h = lh * len(lines)
    if valign == "top":
        base0 = y + 6 + fs * 0.85
        y0 = y + 2
    elif valign == "bottom":
        y0 = y + height - 6 - block_h
        base0 = y0 + fs * 0.85
    else:
        y0 = y + (height - block_h) / 2
        base0 = y0 + fs * 0.85
    if anchor == "start":
        x_text = x + (8 if valign == "top" else 4)
    elif anchor == "end":
        x_text = x - 4
    else:
        x_text = x
    tspans = []
    for i, ln in enumerate(lines):
        tspans.append(
            f'<tspan x="{x_text:.0f}" y="{base0 + lh * i:.0f}">{xescape(ln)}</tspan>'
        )
    return (
        f'<text x="{x_text:.0f}" y="{y0:.0f}" text-anchor="{anchor}" '
        f'font-family="{FONT}" font-size="{fs}" fill="{fc}" '
        f'font-weight="{weight}" {"font-style=italic" if italic else ""}>'
        + "".join(tspans) +
        "</text>"
    )


def round_rect(x, y, w, h, rx, fill, stroke, sw=1, dashed=False, dash="6,4"):
    dash_attr = f' stroke-dasharray="{dash}"' if dashed else ""
    return (
        f'<rect x="{x:.0f}" y="{y:.0f}" width="{w:.0f}" height="{h:.0f}" rx="{rx}" '
        f'fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{dash_attr}/>'
    )


def convert(src, dst):
    root = ET.parse(OUT_DIR / src).getroot()
    diagram = root.find(".//diagram")
    model = diagram.find("mxGraphModel")
    cells = {}
    edges = []
    for cell in model.iter("mxCell"):
        if cell.get("vertex") == "1":
            cells[cell.get("id")] = cell
        elif cell.get("edge") == "1":
            edges.append(cell)

    geoms = {}
    for cid, cell in cells.items():
        g = cell.find("mxGeometry")
        geoms[cid] = (float(g.get("x")), float(g.get("y")),
                      float(g.get("width")), float(g.get("height")))

    xs = [g[0] for g in geoms.values()]
    ys = [g[1] for g in geoms.values()]
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    for e in edges:
        for k in ("source", "target"):
            g = geoms.get(e.get(k))
            if g:
                min_x = min(min_x, g[0])
                max_x = max(max_x, g[0] + g[2])
                min_y = min(min_y, g[1])
                max_y = max(max_y, g[1] + g[3])
    pad = 14
    min_x -= pad
    min_y -= pad - 16
    width = max_x - min_x + pad * 2
    height = max_y - min_y + pad * 2

    # 刻度线（grid）
    grid = ""
    STEP = 40
    gx0 = int(min_x // STEP) * STEP
    for gx in range(gx0, int(max_x) + STEP, STEP):
        grid += f'<line x1="{gx}" y1="{min_y}" x2="{gx}" y2="{min_y + height}" stroke="#f0f0f0" stroke-width="1"/>'
    gy0 = int(min_y // STEP) * STEP
    for gy in range(gy0, int(max_y) + STEP, STEP):
        grid += f'<line x1="{min_x}" y1="{gy}" x2="{min_x + width}" y2="{gy}" stroke="#f0f0f0" stroke-width="1"/>'

    bg = (
        f'<rect x="{min_x}" y="{min_y}" width="{width}" height="{height}" '
        f'fill="#ffffff" stroke="#cccccc" stroke-width="1"/>'
    )

    # 分两层：底层 group/box/text，上层 edge
    body_low = []
    body_edge = []
    text_els = []

    for cid, cell in cells.items():
        st = parse_style(cell.get("style"))
        x, y, w, h = geoms[cid]
        if st.get("text") is not None:
            text_els.append(text_label(x + w / 2, y, w, cell.get("value", ""), st,
                                       anchor="middle", is_text=True, height=h))
            continue
        fill = val(st, "fillColor", "#ffffff")
        stroke = val(st, "strokeColor", "#666666")
        dashed = st.get("dashed") == "1"
        is_group = dashed and st.get("verticalAlign") == "top"
        if is_group:
            body_low.append(round_rect(x, y, w, h, 6, fill, stroke, 1.2, dashed=True, dash="8,5"))
        else:
            rounded = st.get("rounded") == "1"
            body_low.append(round_rect(x, y, w, h, 6 if rounded else 0, fill, stroke, 1.4))
        body_low.append(text_label(x + w / 2, y, w, cell.get("value", ""), st,
                                   anchor="middle", height=h))

    defs_arrow = (
        '<defs><marker id="arw" viewBox="0 0 10 10" refX="9" refY="5" '
        'markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
        '<path d="M 0 1 L 10 5 L 0 9 z" fill="#444444"/></marker></defs>'
    )

    for cell in edges:
        st = parse_style(cell.get("style"))
        color = val(st, "strokeColor", "#555555")
        dashed = st.get("dashed") == "1"
        srect = geoms[cell.get("source")]
        trect = geoms[cell.get("target")]
        (p1, axis1) = edge_exit(st, srect)
        (p2, axis2) = edge_entry(st, trect)
        pts = route_edge(srect, axis1, trect, axis2)
        d = fmt_path(pts)
        dash_attr = f' stroke-dasharray="7,5"' if dashed else ""
        body_edge.append(
            f'<path d="{d}" fill="none" stroke="{color}" '
            f'stroke-width="1.6"{dash_attr} marker-end="url(#arw)"/>'
        )
        label = cell.get("value")
        if label:
            lx, ly = None, None
            segs = []
            for i in range(len(pts) - 1):
                a, b = pts[i], pts[i + 1]
                if a[0] == b[0]:
                    segs.append(((a[1] + b[1]) / 2, a[0], "v", abs(b[1] - a[1])))
                else:
                    segs.append((a[1], (a[0] + b[0]) / 2, "h", abs(b[0] - a[0])))
            if segs:
                seg = max(segs, key=lambda s: s[3])
                if seg[2] == "v":
                    lx, ly = seg[1], seg[0]
                else:
                    lx, ly = seg[1], seg[0]
            else:
                mid = pts[len(pts) // 2]
                lx, ly = mid
            lw = len(label.split("\n")) * 0 + max(len(line) for line in label.split("\n"))
            bw = min(340, lw * 13 + 18)
            txt = label
            body_edge.append(
                f'<rect x="{lx - bw / 2:.0f}" y="{ly - 10:.0f}" width="{bw:.0f}" height="20" '
                f'fill="#ffffff" opacity="0.92" stroke="none"/>'
                + text_label(lx, ly, 0, txt, {"fontSize": "11", "fontColor": "#333333"},
                             anchor="middle")
            )

    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{min_x:.0f} {min_y:.0f} '
        f'{width:.0f} {height:.0f}" width="{width:.0f}" height="{height:.0f}" '
        f'font-family="{FONT}">'
        f'{defs_arrow}{bg}{grid}' + "".join(body_low) + "".join(text_els) +
        "".join(body_edge) +
        "</svg>"
    )
    (OUT_DIR / dst).write_text(svg, encoding="utf-8")
    print(f"OK  {dst} ({len(svg)} bytes)")


if __name__ == "__main__":
    convert(sys.argv[1], sys.argv[2])
