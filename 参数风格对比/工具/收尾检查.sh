#!/bin/bash
# 半成品风格官方检查：静帧 → 查帧 → qa → 参照主色，只出数字不修复、不出成片。
# 用法：工具/收尾检查.sh s17_ink s24_hopper …
cd "$(dirname "$0")/../.."
for id in "$@"; do
  orig="${id#s}"
  echo "===== $id"
  uv run --with playwright python 参数风格对比/代码工程/render.py --film "$id" --solo "$id" --stills 1,3.5,5.5,8.5 --out "参数风格对比/静帧/$id" >/dev/null 2>&1 && echo "[静帧 ok]" || echo "[静帧 失败]"
  uv run --with pillow --with numpy python 参数风格对比/工具/查帧.py "参数风格对比/静帧/$id" 2>/dev/null | tail -9
  uv run scripts/qa.py --project 参数风格对比/代码工程 --film "$id" --ids "$id" --fps 30 --sub-band 0 --out "参数风格对比/qa/$id" 2>&1 | tail -3
  uv run --with playwright python 参数风格对比/代码工程/render.py --film gallery --solo "$orig" --stills 0.3 --out "参数风格对比/参照/$id" >/dev/null 2>&1 && uv run --with pillow --with numpy python 参数风格对比/工具/查帧.py "参数风格对比/参照/$id" 2>/dev/null | grep 主色 | head -1
done
echo "===== 完成"
