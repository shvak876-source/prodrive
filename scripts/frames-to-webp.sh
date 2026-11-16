#!/usr/bin/env bash
# Rendered PNG frames (scripts/shoot-frames.mjs) → public/frames/<name>/*.webp + manifest.json
#   scripts/frames-to-webp.sh <desktopPngDir> [mobilePngDir]
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=public/frames
make_set () { # <pngDir> <name> <width>
  rm -rf "$OUT/$1.tmp"; rm -rf "$OUT/$2" && mkdir -p "$OUT/$2"
  ffmpeg -loglevel error -i "$1/%04d.png" -vf "scale=$3:-2:flags=lanczos" -c:v libwebp -quality 80 -compression_level 6 "$OUT/$2/%04d.webp"
  local count; count=$(ls "$OUT/$2" | wc -l)
  local size; size=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$OUT/$2/0001.webp")
  echo "{\"dir\":\"frames/$2\",\"count\":$count,\"width\":${size%,*},\"height\":${size#*,},\"ext\":\"webp\"}"
}
desk=$(make_set "$1" desktop 1920)
if [ "${2:-}" != "" ]; then
  mob=$(make_set "$2" mobile 900)
  echo "{\"desktop\":$desk,\"mobile\":$mob}" > "$OUT/manifest.json"
else
  echo "{\"desktop\":$desk}" > "$OUT/manifest.json"
fi
cat "$OUT/manifest.json"; du -sh "$OUT"
