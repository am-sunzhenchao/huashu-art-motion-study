"""几何自检：解析 .drawio，检查
1) 每条 ortho 边的分段线不穿过任何非端点的实体方框（虚线 group 除外）
2) 边标签的白底矩形不与方框重叠
3) 方框内文字宽度估算是否溢出（按每中文字符 ~= fontSize px）
输出违规清单；全绿则通过。
"""
import sys
from pathlib import Path
import xml.etree.ElementTree as ET

import drawio2svg as d2s

OUT_DIR = Path(__file__).resolve().parent


def seg_rect_overlap(p1, p2, rect, margin=0):
    """线段 (axis-aligned) 与矩形是否相交（含 margin 扩张）。"""
    x, y, w, h = rect
    x -= margin; y -= margin; w += 2 * margin; h += 2 * margin
    (ax, ay), (bx, by) = p1, p2
    if ax == bx:  # 垂直
        lo, hi = sorted((ay, by))
        return x <= ax <= x + w and not (hi < y or lo > y + h)
    if ay == by:  # 水平
        lo, hi = sorted((ax, bx))
        return y <= ay <= y + h and not (hi < x or lo > x + w)
    return True  # 斜线（不应出现）


def rect_overlap(r1, r2):
    return not (r1[0] + r1[2] < r2[0] or r2[0] + r2[2] < r1[0] or
                r1[1] + r1[3] < r2[1] or r2[1] + r2[3] < r1[1])


def text_w(label, fs):
    wide = sum(1 for ch in label if ord(ch) > 0x2E7F)
    narrow = len(label) - wide
    return wide * fs + narrow * fs * 0.6


def check(fname):
    root = ET.parse(OUT_DIR / fname).getroot()
    model = root.find(".//diagram").find("mxGraphModel")
    boxes, groups, texts, edges = {}, {}, {}, []
    for cell in model.iter("mxCell"):
        if cell.get("vertex") == "1":
            g = cell.find("mxGeometry")
            rect = (float(g.get("x")), float(g.get("y")),
                    float(g.get("width")), float(g.get("height")))
            st = d2s.parse_style(cell.get("style"))
            if st.get("text") is not None:
                texts[cell.get("id")] = rect
            elif st.get("dashed") == "1" and st.get("verticalAlign") == "top":
                groups[cell.get("id")] = rect
            else:
                boxes[cell.get("id")] = (rect, cell.get("value", ""), st)
        elif cell.get("edge") == "1":
            edges.append(cell)

    problems = []

    for cell in edges:
        st = d2s.parse_style(cell.get("style"))
        s_id, t_id = cell.get("source"), cell.get("target")
        srect = (boxes[s_id][0] if s_id in boxes else
                 groups.get(s_id) or texts.get(s_id))
        trect = (boxes[t_id][0] if t_id in boxes else
                 groups.get(t_id) or texts.get(t_id))
        if not srect or not trect:
            problems.append(f"边 {cell.get('id')} 端点缺失")
            continue
        _, axis1 = d2s.edge_exit(st, srect)
        _, axis2 = d2s.edge_entry(st, trect)
        pts = d2s.route_edge(srect, axis1, trect, axis2)
        # 斜线检查
        for i in range(len(pts) - 1):
            a, b = pts[i], pts[i + 1]
            if a[0] != b[0] and a[1] != b[1]:
                problems.append(f"边 {cell.get('id')} 第{i}段是斜线 {a}->{b}")
        # 穿框检查（实线方框，端点方框除外，margin 2px 容差）
        for bid, (rect, _, _) in boxes.items():
            if bid in (s_id, t_id):
                continue
            for i in range(len(pts) - 1):
                if seg_rect_overlap(pts[i], pts[i + 1], rect, margin=2):
                    problems.append(
                        f"边 {cell.get('id')} 第{i}段穿过方框 {bid}")
                    break
        # 标签检查
        label = cell.get("value")
        if label:
            longest = max(len(l) for l in label.split("\n"))
            bw = min(340, text_w(max(label.split("\n"), key=len), 11) + 18)
            segs = []
            for i in range(len(pts) - 1):
                a, b = pts[i], pts[i + 1]
                if a[0] == b[0]:
                    segs.append((abs(b[1] - a[1]), a[0], (a[1] + b[1]) / 2))
                else:
                    segs.append((abs(b[0] - a[0]), (a[0] + b[0]) / 2, a[1]))
            seg = max(segs)
            lx, ly = seg[1], seg[2]
            lrect = (lx - bw / 2, ly - 10, bw, 20)
            for bid, (rect, _, _) in boxes.items():
                if bid in (s_id, t_id):
                    continue
                if rect_overlap(lrect, rect):
                    problems.append(
                        f"边 {cell.get('id')} 标签『{label}』压到方框 {bid}")
            for tid, rect in texts.items():
                if rect_overlap(lrect, rect):
                    problems.append(
                        f"边 {cell.get('id')} 标签『{label}』压到文字 {tid}")

    # 方框文字溢出检查（粗略）
    for bid, (rect, label, st) in boxes.items():
        fs = int(st.get("fontSize", 12))
        for ln in label.replace("&#10;", "\n").split("\n"):
            if text_w(ln, fs) > rect[2] - 8:
                problems.append(f"方框 {bid} 文字『{ln}』可能溢出宽 {rect[2]:.0f}px")

    return problems


def main():
    all_ok = True
    for f in ("architecture.drawio", "pipelines.drawio", "workflow.drawio"):
        problems = check(f)
        if problems:
            all_ok = False
            print(f"[FAIL] {f}")
            for p in problems:
                print(f"  - {p}")
        else:
            print(f"[PASS] {f}")
    sys.exit(0 if all_ok else 1)


if __name__ == "__main__":
    main()
