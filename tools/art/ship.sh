#!/bin/sh
# Renders → web images: art/<name>-960.webp and art/<name>-480.webp (phones take the small one via srcset).
#   sh tools/art/ship.sh [name...]      default: every render in tools/art/out
cd "$(dirname "$0")/../.."
mkdir -p art
if [ $# -gt 0 ]; then set -- $(for n; do printf 'tools/art/out/%s.png ' "$n"; done); else set -- tools/art/out/*.png; fi
for png; do
  n=$(basename "$png" .png)
  for w in 960 480; do cwebp -quiet -q 80 -alpha_q 85 -m 6 -resize $w 0 "$png" -o "art/$n-$w.webp"; done
  printf '%-10s %s\n' "$n" "$(du -k art/$n-960.webp art/$n-480.webp | awk '{printf "%sK ", $1}')"
done
