"""组装设计文档：把 docs/diagrams/*.svg 内联进模板，输出 docs/设计文档.html。

SVG 内联时去掉固定 width/height（保留 viewBox），由 CSS 控制 100% 宽自适应。
"""
import re
from pathlib import Path

DOCS = Path(__file__).resolve().parent
FIGS = {
    "{{FIG_ARCH}}": DOCS / "diagrams/architecture.svg",
    "{{FIG_PIPE}}": DOCS / "diagrams/pipelines.svg",
    "{{FIG_FLOW}}": DOCS / "diagrams/workflow.svg",
}
CAPTIONS = {
    "{{FIG_ARCH}}": "图 1 · 总体架构：入口层 / 知识层 / 工具层 / 引擎层 + 运行环境（源：docs/diagrams/architecture.drawio）",
    "{{FIG_PIPE}}": "图 2 · 双管线渲染：Film 与 Clip 模式汇入同一渲染内核（源：docs/diagrams/pipelines.drawio）",
    "{{FIG_FLOW}}": "图 3 · 轨道档交付工作流：六步流水线 + 三条红灯门禁（源：docs/diagrams/workflow.drawio）",
}


def inline_svg(path: Path, caption: str) -> str:
    svg = path.read_text(encoding="utf-8")
    svg = re.sub(r'(<svg[^>]*?)\s+width="\d+(\.\d+)?"', r"\1", svg, count=1)
    svg = re.sub(r'(<svg[^>]*?)\s+height="\d+(\.\d+)?"', r"\1", svg, count=1)
    return f'<figure>{svg}<figcaption>{caption}</figcaption></figure>'


def main():
    tpl = (DOCS / "design_doc.template.html").read_text(encoding="utf-8")
    for key, path in FIGS.items():
        assert key in tpl, f"模板缺占位符 {key}"
        tpl = tpl.replace(key, inline_svg(path, CAPTIONS[key]))
    out = DOCS / "设计文档.html"
    out.write_text(tpl, encoding="utf-8")
    print(f"OK  {out} ({len(tpl)} bytes)")


if __name__ == "__main__":
    main()
