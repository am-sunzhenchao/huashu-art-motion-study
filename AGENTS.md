# AGENTS.md

This file provides guidance to myflicker when working with code in this repository.

## WHY: Purpose and Goals

huashu-art-motion 是一个 agent skill 包：让 coding agent **纯用代码**产出动画视频。通过 HTML5 Canvas 渲染引擎，由 headless Chromium 逐帧驱动、ffmpeg 合成。包含 35 张风格配方卡、9 种解释类视频"语法"、拆解/QA/交付门禁工具链。

**首要入口是 `SKILL.md`**（任务路由表、硬规则、质量门禁），本文件不重复其内容。

## WHAT: Technical Stack

- 无 npm/Node 构建系统。渲染引擎为 **vanilla JS（ES5 IIFE，Canvas 2D）**
- CLI 工具为 **Python 3**，经 [uv](https://docs.astral.sh/uv/) 运行（PEP 723 内联依赖）
- 外部依赖：`uv`、`ffmpeg`/`ffprobe`、Playwright Chromium（首次：`uv run --with playwright playwright install chromium`）
- 测试：Python stdlib `unittest`（需 `requests`、`Pillow`）

## HOW: Core Development Workflow

```sh
# 渲染静态帧试渲
uv run --with playwright python scripts/engine/render.py --solo 09_postimp --stills 0.3 --out 试渲

# 按 spec 渲染参数化 clip
uv run --with playwright python scripts/engine/render.py --spec scripts/engine/examples/t3_finance_chart.json --out 财经图表.mp4

# 测试
python -m unittest discover -s tests -v

# QA / 交付门禁
uv run scripts/qa.py --project <工程>
uv run scripts/deliver.py 成片.mp4 --root <项目> --qa <项目>/qa/<镜> --out output/
```

## Progressive Disclosure

- `SKILL.md` — agent 入口路由表与硬规则（**先读这个**）
- `docs/agent/development_commands.md` — 全部渲染/QA/门禁/发布命令
- `docs/agent/architecture.md` — 双管线架构（film 模式 / clip 模式）与模块结构
- `docs/agent/testing.md` — unittest 约定、CI、自动跳过机制
- `docs/agent/conventions.md` — 命名、确定性契约、创作规则

**接到任务先判断需要哪份文档，只读相关的。**
