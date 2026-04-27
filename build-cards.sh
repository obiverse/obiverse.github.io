#!/bin/bash
# Exports print-ready PDF + social share PNG for the Obiverse card.
# Requires Google Chrome installed at the standard macOS path.
set -e
cd "$(dirname "$0")"
DIR="$(pwd)"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

if [ ! -x "$CHROME" ]; then
  echo "Chrome not found at: $CHROME"
  echo "Install Google Chrome, or edit this script to point to chromium/edge."
  exit 1
fi

echo "→ Rendering Obiverse printer PDF (3.75 × 2.25 in, front + back, crop marks)…"
"$CHROME" --headless --disable-gpu --no-pdf-header-footer \
  --print-to-pdf-no-header \
  --print-to-pdf="$DIR/obiverse-card-PRINT.pdf" \
  "file://$DIR/business-card.html" 2>/dev/null

echo "→ Rendering OGA Plastic printer PDF (3.75 × 2.25 in, front + back, crop marks)…"
"$CHROME" --headless --disable-gpu --no-pdf-header-footer \
  --print-to-pdf-no-header \
  --print-to-pdf="$DIR/oga-card-PRINT.pdf" \
  "file://$DIR/oga-card.html" 2>/dev/null

echo "→ Rendering OGA face PNGs (600 DPI)…"
pdftoppm -r 600 -png "$DIR/oga-card-PRINT.pdf" "$DIR/oga-card"
mv -f "$DIR/oga-card-1.png" "$DIR/oga-card-front.png"
mv -f "$DIR/oga-card-2.png" "$DIR/oga-card-back.png"

echo "→ Rendering Obiverse social share PNG (1080 × 1350)…"
"$CHROME" --headless --disable-gpu \
  --hide-scrollbars \
  --window-size=1080,1350 \
  --screenshot="$DIR/obiverse-card-SHARE.png" \
  --default-background-color=00000000 \
  "file://$DIR/card-share.html" 2>/dev/null

echo "→ Rendering OGA Plastic social share PNG (1080 × 1350)…"
"$CHROME" --headless --disable-gpu \
  --hide-scrollbars \
  --window-size=1080,1350 \
  --screenshot="$DIR/oga-card-SHARE.png" \
  --default-background-color=00000000 \
  "file://$DIR/oga-card-share.html" 2>/dev/null

echo ""
echo "✓ Done."
echo "  Obiverse PDF:   obiverse-card-PRINT.pdf   → send to print shop"
echo "  OGA PDF:        oga-card-PRINT.pdf        → send to print shop"
echo "  Obiverse Share: obiverse-card-SHARE.png   → WhatsApp / IG / LinkedIn"
echo "  OGA Share:      oga-card-SHARE.png        → WhatsApp / IG / LinkedIn"
