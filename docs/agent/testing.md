# 测试

## 框架与运行

- Python stdlib `unittest`（无 pytest）
- 依赖：`pip install requests Pillow`；系统需 `ffmpeg`
- 运行：`python -m unittest discover -s tests -v`

## 位置与文件

`tests/` 下：`test_capabilities.py`、`test_clip_theme.py`、`test_clip_world.py`、`test_film_gate.py`、`test_film_gate_blank.py`、`test_film_gate_color.py`、`test_images.py`、`test_local_server.py`、`test_release.py`、`test_storyboard_lint.py`；fixture `tests/fixtures/y4_storytime_test_frames.json`。

## 特点

- **集成型渲染测试**：通过 `uv run --with playwright` 真实启动 `render.py`，用 Pillow 断言像素；uv/Playwright/ffmpeg 缺失时**自动 skip**。
- `test_film_gate.py` 渲染合成的慢/快/平滑影片并断言 gate 判定。
- **JS 引擎无单元测试**——质量由 `qa.py`/`film_gate.py`/`deliver.py` 在交付时强制。

## CI（.github/workflows/tests.yml）

- job `contracts`：ubuntu，Python 3.10 & 3.12，unittest discover + `check_release.py check`
- job `windows-render`：Windows 冒烟——渲染 `09_postimp` stills + `qa.py --fps 5`，上传 artifacts
