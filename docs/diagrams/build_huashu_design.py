"""生成 huashu-art-motion 设计文档三张 drawio 图。

图1 总体架构（模式 B 四层嵌套）
图2 双管线渲染（模式 A）
图3 交付工作流与门禁（模式 A 流程图）

所有连线强制 ortho=True，source/target 均指定边中点，禁止斜线、禁止穿框。
"""
from pathlib import Path
from xml.sax.saxutils import escape as _escape
import xml.etree.ElementTree as ET

OUT_DIR = Path(__file__).resolve().parent

C_BLUE = "#E3F2FD"; C_BLUE_S = "#1976D2"
C_GREEN = "#E8F5E9"; C_GREEN_S = "#388E3C"
C_ORANGE = "#FFF3E0"; C_ORANGE_S = "#E65100"
C_PURPLE = "#F3E5F5"; C_PURPLE_S = "#7B1FA2"
C_RED = "#FFEBEE"; C_RED_S = "#C62828"
C_GREY = "#F5F5F5"; C_GREY_S = "#757575"
C_CYAN = "#E0F7FA"; C_CYAN_S = "#00838F"


def escape(s):
    return _escape(s, {'"': "&quot;", "'": "&apos;"})


def _v(label):
    return escape(label).replace("\n", "&#10;")


def cell_box(cid, x, y, w, h, label, fill="#ffffff", stroke="#666666", font=12,
             fontColor="#222222", bold=False, rounded=False, dashed=False):
    style = (
        f"rounded={'1' if rounded else '0'};whiteSpace=wrap;html=1;"
        f"fillColor={fill};strokeColor={stroke};fontSize={font};fontColor={fontColor};"
        f"align=center;verticalAlign=middle;"
        f"{'fontStyle=1;' if bold else ''}"
        f"{'dashed=1;' if dashed else ''}"
        f"spacingLeft=4;spacingRight=4;"
    )
    return (
        f'<mxCell id="{cid}" value="{_v(label)}" style="{style}" vertex="1" parent="1">'
        f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>'
    )


def cell_title(cid, x, y, w, label, font=18):
    style = (
        f"text;html=1;align=center;verticalAlign=middle;fontSize={font};fontStyle=1;"
        f"fontColor=#1a1a1a;"
    )
    return (
        f'<mxCell id="{cid}" value="{_v(label)}" style="{style}" vertex="1" parent="1">'
        f'<mxGeometry x="{x}" y="{y}" width="{w}" height="32" as="geometry"/></mxCell>'
    )


def cell_group(cid, x, y, w, h, label, fill="#fafafa", stroke="#bbbbbb"):
    style = (
        f"rounded=1;whiteSpace=wrap;html=1;fillColor={fill};strokeColor={stroke};"
        f"verticalAlign=top;align=left;fontSize=13;fontStyle=1;fontColor=#555555;"
        f"spacingTop=4;spacingLeft=8;dashed=1;"
    )
    return (
        f'<mxCell id="{cid}" value="{_v(label)}" style="{style}" vertex="1" parent="1">'
        f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>'
    )


def cell_caption(cid, x, y, w, label, font=10, italic=True, fontColor="#888888"):
    style = (
        f"text;html=1;align=center;verticalAlign=middle;fontSize={font};"
        f"fontColor={fontColor};{'fontStyle=2;' if italic else ''}"
    )
    return (
        f'<mxCell id="{cid}" value="{_v(label)}" style="{style}" vertex="1" parent="1">'
        f'<mxGeometry x="{x}" y="{y}" width="{w}" height="20" as="geometry"/></mxCell>'
    )


def edge(cid, src, dst, label="", style_extra="", dashed=False, color="#555555", ortho=True):
    eshape = "edgeStyle=orthogonalEdgeStyle;" if ortho else ""
    style = (
        f"endArrow=classic;html=1;rounded=0;{eshape}strokeColor={color};"
        f"fontSize=11;fontColor=#333333;labelBackgroundColor=#ffffff;"
        f"{'dashed=1;' if dashed else ''}{style_extra}"
    )
    return (
        f'<mxCell id="{cid}" value="{_v(label)}" style="{style}" '
        f'edge="1" parent="1" source="{src}" target="{dst}">'
        f'<mxGeometry relative="1" as="geometry"/></mxCell>'
    )


def wrap(name, cells, w=1400, h=900):
    return (
        f'<mxfile host="codeflicker">'
        f'<diagram id="d1" name="{name}">'
        f'<mxGraphModel adaptiveColors="auto" dx="{w}" dy="{h}" grid="1" gridSize="10" '
        f'guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" '
        f'pageWidth="{w}" pageHeight="{h}" math="0" shadow="0">'
        f'<root>'
        f'<mxCell id="0"/><mxCell id="1" parent="0"/>'
        + "".join(cells) +
        f'</root></mxGraphModel></diagram></mxfile>'
    )


def build_architecture():
    """图1 四层总体架构（模式 B）。"""
    W, H = 1600, 1130
    cells = [cell_title("t1", 0, 8, W, "huashu-art-motion · 总体架构（四层 + 运行环境）")]

    # ---- 入口层 ----
    cells.append(cell_group("g_enter", 40, 60, 1520, 150, "入口层 · SKILL.md（agent 任务路由）"))
    cells.append(cell_box("e1", 70, 110, 340, 76, "任务路由表 & 硬规则\n先判断任务 · 窄桥 · 开阔地",
                          fill=C_BLUE, stroke=C_BLUE_S, bold=True))
    cells.append(cell_box("e2", 445, 110, 340, 76, "模型分档\n开阔档 vs 轨道档流程",
                          fill=C_BLUE, stroke=C_BLUE_S))
    cells.append(cell_box("e3", 820, 110, 340, 76, "六种做坏方式\n开工前 / 交付前各对一遍",
                          fill=C_BLUE, stroke=C_BLUE_S))
    cells.append(cell_box("e4", 1195, 110, 330, 76, "导演要求\n镜头是标点 · 画风服务内容",
                          fill=C_BLUE, stroke=C_BLUE_S))

    # ---- 知识层 ----
    cells.append(cell_group("g_ref", 40, 250, 1520, 170, "知识层 · references/（12 篇方法 + 卡库）"))
    cells.append(cell_box("r1", 70, 300, 340, 90, "12 篇方法文档\n01 拆解 → 04 绘制 → 13 语音\n07 正面经验 · 具体做法+证据",
                          fill=C_ORANGE, stroke=C_ORANGE_S))
    cells.append(cell_box("r2", 445, 300, 340, 90, "风格配方 35 张卡\n材料层 / 时代标本\nINDEX 总表 · 质量+短板",
                          fill=C_ORANGE, stroke=C_ORANGE_S))
    cells.append(cell_box("r3", 820, 300, 340, 90, "动画语法 9 张卡\ny1–y6 · t1–t3\n09 号选型表 + 三节镜头规律",
                          fill=C_ORANGE, stroke=C_ORANGE_S))
    cells.append(cell_box("r4", 1195, 300, 330, 90, "模板与规范\n镜头表 · 色板 · 镜头语言\n角色精细度 · 能力指南",
                          fill=C_ORANGE, stroke=C_ORANGE_S))

    # ---- 工具层 ----
    cells.append(cell_group("g_tool", 40, 460, 1520, 180, "工具层 · scripts/（CLI 门禁与配置）"))
    cells.append(cell_box("t1", 70, 510, 340, 100, "创作门禁\nqa.py · storyboard_lint.py\nsubzone_gate.py",
                          fill=C_PURPLE, stroke=C_PURPLE_S))
    cells.append(cell_box("t2", 445, 510, 340, 100, "交付门禁\nfilm_gate.py · deliver.py\n交付说明.md 指纹写入",
                          fill=C_PURPLE, stroke=C_PURPLE_S))
    cells.append(cell_box("t3", 820, 510, 340, 100, "素材与配置\ncapabilities/koubo/images\nkey_green · font_subset · analyze/",
                          fill=C_PURPLE, stroke=C_PURPLE_S))
    cells.append(cell_box("t4", 1195, 510, 330, 100, "发布审计\ncheck_release.py\nrelease-manifest.json",
                          fill=C_PURPLE, stroke=C_PURPLE_S))

    # ---- 引擎层 ----
    cells.append(cell_group("g_engine", 40, 680, 1520, 200, "引擎层 · scripts/engine/（可复制进项目代码工程/）"))
    cells.append(cell_box("n1", 70, 730, 340, 110, "Film 运行时\nengine.js · eras.js\ntransitions.js · 离屏 A/B 转场",
                          fill=C_GREEN, stroke=C_GREEN_S))
    cells.append(cell_box("n2", 445, 730, 340, 110, "Clip 运行时\nclip.js · clips/ 8 语法\nJSON spec 契约 · frame-exact",
                          fill=C_GREEN, stroke=C_GREEN_S))
    cells.append(cell_box("n3", 820, 730, 340, 110, "场景与绘制库\nscenes/ 36 · lib/ 17\nMO CAM DG TY CH UI CL MD TOON…",
                          fill=C_GREEN, stroke=C_GREEN_S))
    cells.append(cell_box("n4", 1195, 730, 330, 110, "渲染器\nrender.py\nspec_assets.py 素材白名单",
                          fill=C_GREEN, stroke=C_GREEN_S))

    # ---- 运行环境 ----
    cells.append(cell_group("g_env", 40, 940, 1520, 100, "运行环境（uv 内联依赖 · 系统工具）"))
    cells.append(cell_box("v1", 70, 985, 200, 50, "⚙️ ffmpeg / ffprobe",
                          fill=C_CYAN, stroke=C_CYAN_S, bold=True))
    cells.append(cell_box("v2", 300, 985, 250, 50, "🌐 Playwright Chromium",
                          fill=C_CYAN, stroke=C_CYAN_S))
    cells.append(cell_box("v3", 580, 985, 220, 50, "🚀 uv（PEP 723 脚本）",
                          fill=C_CYAN, stroke=C_CYAN_S))
    cells.append(cell_box("v4", 830, 985, 280, 50, "🔤 woff 字体子集 + LICENSES",
                          fill=C_CYAN, stroke=C_CYAN_S))
    cells.append(cell_caption("cap_env", 1140, 985, 410,
                              "无 npm/Node · 纯浏览器渲染 · 复制引擎即项目\n经验回流：新风格/新坑写回 references · CHANGELOG 记一行"))

    # ---- 层间链（垂直，取四列子框之间的 785–820 空隙）----
    cells.append(edge("L1", "g_enter", "g_ref", "按任务读对应文档",
                      style_extra="exitX=0.5;exitY=1;entryX=0.5;entryY=0;"))
    cells.append(edge("L2", "g_ref", "g_tool", "文档定义验收标准",
                      style_extra="exitX=0.5;exitY=1;entryX=0.5;entryY=0;"))
    cells.append(edge("L3", "g_tool", "g_engine", "驱动渲染 / 验收产物",
                      style_extra="exitX=0.5;exitY=1;entryX=0.5;entryY=0;"))
    cells.append(edge("L4", "g_engine", "g_env", "依赖可用",
                      style_extra="exitX=0.5;exitY=1;entryX=0.5;entryY=0;"))

    return wrap("architecture", cells, W, H)


def build_pipelines():
    """图2 双管线渲染（模式 A）。"""
    W, H = 1560, 720
    cells = [cell_title("t2", 0, 10, W, "双管线渲染 · Film 模式 与 Clip 模式 共用同一渲染内核")]

    # ---- Film 模式 ----
    cells.append(cell_group("g_film", 50, 70, 900, 220, "Film 模式 · 风格长片（eras 段落表 → 场景）"))
    cells.append(cell_box("f1", 80, 140, 180, 100, "eras.js 段落表\nid · eighths/dur\ntransition · 计数卡",
                          fill=C_BLUE, stroke=C_BLUE_S, bold=True))
    cells.append(cell_box("f2", 310, 140, 190, 100, "engine.js 运行时\nt → frame\nBPM 栅格 · 离屏 A/B",
                          fill=C_BLUE, stroke=C_BLUE_S))
    cells.append(cell_box("f3", 550, 140, 180, 100, "scenes/<id>.js\n35+ 场景\ndraw(c, lt, t)",
                          fill=C_BLUE, stroke=C_BLUE_S))
    cells.append(cell_box("f4", 770, 140, 155, 100, "render.py\n--film / --solo",
                          fill=C_BLUE, stroke=C_BLUE_S, bold=True))
    cells.append(edge("ef1", "f1", "f2", "段落表", style_extra="exitX=1;exitY=0.5;entryX=0;entryY=0.5;"))
    cells.append(edge("ef2", "f2", "f3", "时间线 t", style_extra="exitX=1;exitY=0.5;entryX=0;entryY=0.5;"))
    cells.append(edge("ef3", "f3", "f4", "逐段", style_extra="exitX=1;exitY=0.5;entryX=0;entryY=0.5;"))

    # ---- Clip 模式 ----
    cells.append(cell_group("g_clip", 50, 350, 900, 220, "Clip 模式 · 解释类片段（JSON spec → 语法运行时）"))
    cells.append(cell_box("c1", 80, 420, 180, 100, "JSON spec\ngrammar·duration·cues[]\ntheme · data · safe",
                          fill=C_ORANGE, stroke=C_ORANGE_S, bold=True))
    cells.append(cell_box("c2", 310, 420, 190, 100, "clip.js 运行时\n+ clips/<语法>.js\n8 语法注册 CLIPS",
                          fill=C_ORANGE, stroke=C_ORANGE_S))
    cells.append(cell_box("c3", 550, 420, 180, 100, "spec_assets.py\n素材白名单校验\n改写 /__file__/ URL",
                          fill=C_ORANGE, stroke=C_ORANGE_S))
    cells.append(cell_box("c4", 770, 420, 155, 100, "render.py\n--spec",
                          fill=C_ORANGE, stroke=C_ORANGE_S, bold=True))
    cells.append(edge("ec1", "c1", "c2", "spec 解析", style_extra="exitX=1;exitY=0.5;entryX=0;entryY=0.5;"))
    cells.append(edge("ec2", "c2", "c3", "素材就绪", style_extra="exitX=1;exitY=0.5;entryX=0;entryY=0.5;"))
    cells.append(edge("ec3", "c3", "c4", "逐片", style_extra="exitX=1;exitY=0.5;entryX=0;entryY=0.5;"))

    # 双流共用库（虚线）
    cells.append(edge("shared", "f3", "c2", "共用 lib 绘制库 / 色板",
                      dashed=True, color=C_PURPLE_S,
                      style_extra="exitX=0.6;exitY=1;entryX=0.4;entryY=0;"))

    # ---- 渲染与合成 ----
    cells.append(cell_group("g_out", 1010, 70, 500, 600, "渲染与合成 · render.py 统一入口"))
    cells.append(cell_box("E0", 1040, 120, 220, 120, "render.py\n--film / --solo / --spec\n（同一渲染内核）",
                          fill=C_GREY, stroke=C_GREY_S, bold=True))
    cells.append(cell_box("R1", 1040, 280, 330, 130, "本地 HTTP server + 无头 Chromium\n逐帧调用 window.renderFrame(t)\nHTML5 Canvas 2D 像素流",
                          fill=C_GREY, stroke=C_GREY_S))
    cells.append(cell_box("R2", 1040, 450, 330, 100, "ffmpeg 合成\nH.264 yuv420p（frame-exact）\nProRes 4444（--alpha 透明）",
                          fill=C_GREY, stroke=C_GREY_S))
    cells.append(cell_box("R3", 1040, 580, 330, 70, "产物\n镜NN.mp4 · 片段.mp4 · 成片.mp4",
                          fill=C_GREEN, stroke=C_GREEN_S, bold=True))
    cells.append(edge("e0r1", "E0", "R1", "矩阵 → 帧像素",
                      style_extra="exitX=0.5;exitY=1;entryX=0.5;entryY=0;"))
    cells.append(edge("e1r2", "R1", "R2", "像素流",
                      style_extra="exitX=0.5;exitY=1;entryX=0.5;entryY=0;"))
    cells.append(edge("e2r3", "R2", "R3", "编码",
                      style_extra="exitX=0.5;exitY=1;entryX=0.5;entryY=0;"))
    cells.append(edge("ef4", "f4", "E0", "", style_extra="exitX=1;exitY=0.5;entryX=0;entryY=0.4;"))
    cells.append(edge("ec4", "c4", "E0", "", style_extra="exitX=1;exitY=0.5;entryX=0;entryY=0.85;"))

    cells.append(cell_caption("cap2", 60, 660, 1400,
                              "确定性契约：所有随机播种 · 同一时刻两次渲染逐像素一致 · clip 时长 frame-exact（round(duration×fps)）"))

    return wrap("pipelines", cells, W, H)


def build_workflow():
    """图3 交付工作流与门禁（模式 A 流程图）。"""
    W, H = 1560, 600
    cells = [cell_title("t3", 0, 8, W, "轨道档交付工作流 · 六步 + 三条红旗门禁")]

    steps = [
        ("s1", "① 写镜头表\n锁画风 · 色板 · 角色\n每行：物/动作/镜头/屏上字",
         "每镜 2–6s · 文字镜 ≤30% · 开场是具体小场景"),
        ("s2", "② storyboard_lint\n红灯不许写码\n--script 核对口播数字",
         "红灯：画风锁缺失/文字墙/连续三镜推近"),
        ("s3", "③ 逐镜渲染\n--spec / --solo\n每镜 镜NN.mp4",
         "同宽高同 fps · 单片段 ≤8s · 一镜 ≤2 种语法"),
        ("s4", "④ ffmpeg 拼接\nconcat 硬切 · 可选混音\n或整片 scenes 一次出",
         "同衬底同 fps · 混音 --shortest"),
        ("s5", "⑤ qa 验收\n确定性/动感/流畅/框景\n+ 独立审片 agent",
         "2s 内单调推拉横移记镜头事件 · 审片写 <项目>/审片/"),
        ("s6", "⑥ deliver.py\n先过 film_gate 门禁\n绿/黄灯才复制成片",
         "红灯不复制成片 · 非零退出"),
    ]
    for i, (cid, label, cap) in enumerate(steps):
        x = 40 + i * 250
        cells.append(cell_box(cid, x, 150, 220, 110, label,
                              fill=C_BLUE, stroke=C_BLUE_S,
                              bold=(cid in ("s1", "s6"))))
        cells.append(cell_caption(f"cap_{cid}", x, 263, 220, cap, italic=True))

    # 步骤横向箭头
    for i in range(5):
        a, b = f"s{i+1}", f"s{i+2}"
        cells.append(edge(f"st_{i}", a, b, "",
                          style_extra="exitX=1;exitY=0.5;entryX=0;entryY=0.5;"))

    # s2 顶部红灯回流（s1）
    cells.append(edge("rv1", "s2", "s1", "红灯 → 改镜头表重跑",
                      dashed=True, color=C_RED_S,
                      style_extra="exitX=0.5;exitY=0;entryX=0.5;entryY=0;"))

    # ---- 门禁带 ----
    cells.append(cell_group("g_gate", 40, 330, 1480, 200, "交付门禁 · film_gate（deliver.py 先跑）"))
    cells.append(cell_box("gg1", 70, 398, 330, 84, "🚦 红灯 ①\n快速运动帧占比 < 0.035\n（< 0.06 为黄灯）",
                          fill=C_RED, stroke=C_RED_S))
    cells.append(cell_box("gg2", 435, 398, 330, 84, "🚦 红灯 ②\n成片中段连续 ≥ 0.3s\n空画面 / 近乎纯色（给时间码）",
                          fill=C_RED, stroke=C_RED_S))
    cells.append(cell_box("gg3", 800, 398, 330, 84, "🚦 红灯 ③\n蓝紫底帧 ≥ 30%\n--allow-blue-purple 降黄",
                          fill=C_RED, stroke=C_RED_S))
    cells.append(cell_box("gg4", 1165, 398, 330, 84, "✅ 绿/黄灯 · 交付\n复制成片 + 写 交付说明.md\n事实段指纹 · --verify 校验",
                          fill=C_GREEN, stroke=C_GREEN_S))

    # deliver 先跑门禁
    cells.append(edge("to_gate", "s6", "g_gate", "跑 film_gate 门禁",
                      style_extra="exitX=0.5;exitY=1;entryX=0.15;entryY=0;"))

    cells.append(cell_caption("cap_gate", 70, 500, 1200,
                              "红灯不交付 → 照打印的修法改完重渲、重跑 qa；qa.py 交付前先跑；独立审片结论须写 <项目>/审片/*.md",
                              font=10, italic=False, fontColor="#C62828"))

    return wrap("workflow", cells, W, H)


def main():
    diagrams = {
        "architecture.drawio": build_architecture(),
        "pipelines.drawio": build_pipelines(),
        "workflow.drawio": build_workflow(),
    }
    for name, xml in diagrams.items():
        p = OUT_DIR / name
        p.write_text(xml, encoding="utf-8")
        ET.parse(p)  # 校验 well-formed
        print(f"OK  {p.name} ({len(xml)} bytes)")


if __name__ == "__main__":
    main()
