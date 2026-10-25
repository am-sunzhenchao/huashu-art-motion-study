#!/bin/bash
# 给成片批量加配音：无声版备份到 无声版/，成片/ 里替换为有声版。
# 安全防护：只处理 180 秒未再写入、且 ffprobe 能完整读出（moov 完整）的无声文件；
# 渲染中/损坏/已有音轨的一律跳过。混流先写临时文件，成功后才移动原片（可重复运行）。
cd "$(dirname "$0")/.."
n=0
for f in 成片/*.mp4; do
  [ -e "$f" ] || continue
  age=$(( $(date +%s) - $(stat -f %m "$f") ))
  [ "$age" -lt 180 ] && continue
  ffprobe -v error -show_entries format=duration -of csv=p=0 "$f" >/dev/null 2>&1 || continue
  if ffprobe -v error -select_streams a -show_entries stream=codec_type -of csv=p=0 "$f" 2>/dev/null | grep -q audio; then
    continue
  fi
  mkdir -p 无声版
  if ffmpeg -y -v error -i "$f" -i 口播/音轨_10s.wav \
    -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -t 10 -movflags +faststart "有声_临时.mp4"; then
    mv "$f" "无声版/$(basename "$f")" && mv 有声_临时.mp4 "$f"
    n=$((n+1))
  else
    rm -f 有声_临时.mp4
    echo "跳过（混流失败）：$f"
  fi
done
echo "本次加配音 $n 支；成片共 $(ls 成片/*.mp4 2>/dev/null | wc -l | tr -d ' ') 支"
