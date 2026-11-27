#!/bin/sh
# Photograph the phone screens the scenes wear: tools/art/screens/*.png (not kept in git; rebuilt here).
cd "$(dirname "$0")/screens"
C="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
shot() { "$C" --headless --disable-gpu --hide-scrollbars --allow-file-access-from-files --virtual-time-budget=6000 "$@" 2>/dev/null; }
shot --window-size=600,1200 --screenshot="$PWD/whatsapp.png" "file://$PWD/whatsapp.html"
shot --window-size=600,1200 --screenshot="$PWD/apps.png" "file://$PWD/apps.html"
shot --window-size=1440,1000 --screenshot="$PWD/sheet.png" "file://$PWD/sheet.html"
shot --window-size=600,1200 --user-agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148" --screenshot="$PWD/site.png" "https://ogaplastic.com"
ls -la *.png
