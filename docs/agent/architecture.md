# 架构

## 定位

无框架、无打包器的自研引擎：本地 HTTP server + headless Chromium 打开 `index.html` / `clip.html`，逐帧调用 `window.renderFrame(t)`，像素流管道送 ffmpeg。

## 双管线

### 1. Film 模式（风格长片）
```
eras.js / eras_gallery.js 段落表（id, eighths|dur, transition, 计数卡）
  → engine.js（t → frame；BPM 八分音符或 dur 节拍栅格时间线；离屏缓冲 A/B 做转场）
  → scenes/<id>.js 的 draw(c, lt, t)
  → render.py（Playwright → ffmpeg）
```

### 2. Clip 模式（解释类视频，主产线）
```
JSON spec {grammar, duration, fps, width, height, safe, theme, data, cues[]}
  → clip.js 运行时 + clips/<grammar>.js（注册进 CLIPS[grammar]）
  → render.py --spec
```
spec 内的本地资源路径由 `spec_assets.py` 校验重写，仅白名单文件经 `/__file__/` 提供。

## 目录

- `SKILL.md` — agent 入口路由（硬规则、门禁、模型分档）
- `references/` — 知识库：12 篇方法文档、`风格配方/`（35 张卡）、`动画语法/`（9 种语法卡）、镜头表模板等
- `scripts/engine/`
  - `scenes/` — 35+ 编号场景（`01_cave.js`…`36_picasso_blue.js`）
  - `clips/` — 8 个语法运行时（`y1_kurzgesagt.js`…`t3_finance_chart.js`）
  - `lib/` — 17 个库：brush, camera, chart, collage, diagram, fonts（含 woff 与 LICENSES.md）, media, motion, paint, palettes, post, rig, rig_huashu, toon, typo, ui, util, kit
  - `demos/` — 各语法示范片 + `long_scroll/` 长卷骨架
  - `examples/` — spec JSON 与素材
  - `reference_films/spacex/` — 全口播代码快照（角色/音频自带）
- `scripts/` — analyze/breakdown.py、qa.py、film_gate.py、deliver.py、storyboard_lint.py、subzone_gate.py、capabilities.py、check_release.py 等
- `defaults/media.json` + `schemas/media.schema.json` — 公共媒体配置默认值（策略默认 `ask`）
- `release-manifest.json` — 发布审计清单

## "轨道档"工作流（SKILL.md 定义）

镜头表（`镜头表.md`）→ lint → 拷贝 `scripts/engine` 到 `<项目>/代码工程` → 逐镜渲染 `镜NN.mp4` → ffmpeg concat → qa → deliver。

## 契约要点

- **确定性**：所有随机性必须播种；同一 t 必须渲染出相同像素；QA 做冷热双渲染像素比对。
- **Clip 时长 frame-exact**：`round(duration×fps)`；cue 首次可见于帧 `t = at`，局部时间从 `at − 1/fps` 起。
- 配置分离：用户私密凭证必须在安装目录之外，升级不得覆盖。
