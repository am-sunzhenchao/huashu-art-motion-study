# 开发命令

所有 CLI 均为 PEP 723 内联依赖的 Python 脚本，用 `uv run` 执行；`E = scripts/engine`。

## 环境准备

```sh
uv run --with playwright playwright install chromium   # 首次安装 Playwright Chromium
pip install requests Pillow                             # 测试依赖（系统 ffmpeg 必须可用）
```

## 渲染（scripts/engine/render.py）

```sh
# 单一时代（era）静态帧试渲
uv run --with playwright python scripts/engine/render.py --solo 09_postimp --stills 0.3 --out 试渲

# 按参数化 JSON spec 渲染 clip（frame-exact H.264）
uv run --with playwright python scripts/engine/render.py --spec scripts/engine/examples/t3_finance_chart.json --out 财经图表.mp4

# 渲染整片（eras.js 时间线），可加音轨
uv run --with playwright python scripts/engine/render.py --out 成片.mp4 --audio 配乐.wav

# 透明通道输出（ProRes 4444）
# render.py --alpha
```

## 分析与对比

```sh
# 参考视频拆解（剪辑点/节拍栅格/运动热图）
uv run scripts/analyze/breakdown.py --video 参考.mp4 --out 拆解/

# 双画面对比图
python3 scripts/engine/compare.py --a 参考.mp4 --b 成片.mp4 --times 1.5,2.0 --out 对比.jpg
```

## 质量门禁

```sh
uv run scripts/qa.py --project <工程>                 # 数值验收：稳定性/确定性/成本/运动/平滑度
uv run scripts/film_gate.py 成片.mp4                  # 红黄绿灯：快推帧比、空白帧、蓝紫帧比
uv run scripts/storyboard_lint.py <项目>/镜头表.md [--script <项目>/文稿.txt]
uv run --with numpy python scripts/subzone_gate.py 成片.mp4   # 字幕区入侵检查（仅浅底）
```

## 交付

```sh
uv run scripts/deliver.py 成片.mp4 --root <项目> --qa <项目>/qa/<镜> --out output/
# 交付说明.md 由脚本指纹化写入；--verify 校验
```

## 其他工具

```sh
python scripts/capabilities.py status --explain       # 媒体能力状态
python scripts/check_release.py check --repo . --ref HEAD --base HEAD~1   # 发布清单审计
uv run scripts/font_subset.py                         # 字体子集化
uv run scripts/key_green.py / scripts/key_split.py    # 抠像
```

## 音轨

`scripts/audio/synth_艺术史速通.py` 为代码合成配乐模板。
