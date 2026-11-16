#!/usr/bin/env bash
# Turns the hero video(s) into scroll frames + manifest for the site.
#
#   scripts/video-to-frames.sh desktop.mp4 [mobile.mp4]
#
# Several clips can be joined first (e.g. "door opens" + "camera enters"):
#   ffmpeg -i a.mp4 -i b.mp4 -filter_complex "[0:v][1:v]concat=n=2:v=1[v]" -map "[v]" joined.mp4
#
# Output: public/frames/desktop/0001.webp … , public/frames/mobile/… , public/frames/manifest.json
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=public/frames
FPS=${FPS:-30}          # frames per second of video kept (≈ smoothness of the scrub)
MAXF=${MAXF:-180}       # cap on frames per set (download size)

make_set () { # <video> <name> <width>
  local src=$1 name=$2 width=$3
  rm -rf "$OUT/$name" && mkdir -p "$OUT/$name"
  local dur; dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$src")
  # keep at most MAXF frames spread over the whole clip
  local rate; rate=$(python3 -c "print(min($FPS, $MAXF / max(0.1, $dur)))")
  ffmpeg -loglevel error -i "$src" -vf "fps=$rate,scale=$width:-2:flags=lanczos" -c:v libwebp -quality 74 -compression_level 5 "$OUT/$name/%04d.webp"
  local count; count=$(ls "$OUT/$name" | wc -l)
  local size; size=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$OUT/$name/0001.webp")
  echo "{\"dir\":\"frames/$name\",\"count\":$count,\"width\":${size%,*},\"height\":${size#*,},\"ext\":\"webp\"}"
}

desk=$(make_set "$1" desktop 1920)
if [ "${2:-}" != "" ]; then
  mob=$(make_set "$2" mobile 1080)
  echo "{\"desktop\":$desk,\"mobile\":$mob}" > "$OUT/manifest.json"
else
  echo "{\"desktop\":$desk}" > "$OUT/manifest.json"
fi
cat "$OUT/manifest.json"
du -sh "$OUT"
