#!/bin/sh
# Photograph the phone screens the scenes wear: tools/art/screens/*.png (not kept in git; rebuilt here).
cd "$(dirname "$0")/screens"
C="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
shot() { "$C" --headless --disable-gpu --hide-scrollbars --allow-file-access-from-files --virtual-time-budget=6000 "$@" 2>/dev/null; }
shot --window-size=600,1200 --screenshot="$PWD/whatsapp.png" "file://$PWD/whatsapp.html"
shot --window-size=600,1200 --screenshot="$PWD/apps.png" "file://$PWD/apps.html"
shot --window-size=1440,1000 --screenshot="$PWD/sheet.png" "file://$PWD/sheet.html"
shot --window-size=600,1200 --user-agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148" --screenshot="$PWD/site.png" "https://ogaplastic.com"
for site in jawacard.com arteduxcel.com ogaplastic.com; do
  shot --window-size=600,1200 --user-agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148" --screenshot="$PWD/m-${site%%.*}.png" "https://$site"
done
# the apps' own store screenshots (demo data only)
cp "$HOME/dev/beeeeb.platform/beewallet-custody/screenshots/6.7_04_wallet_home.png" app-beewallet.png
cp "$HOME/dev/obiverse.net/apps/obiverse/ios/fastlane/screenshots/en-US/iPhone 16 Plus-10-wallet-home.png" app-obiverse.png
cp "$HOME/dev/ngumba/shots/1284x2778/4-invoice.png" app-ngumba.png
cp "$HOME/dev/obiverse.net/apps/osalah/ios/fastlane/screenshots/en-US/01_prayer_times.png" app-osalah.png
ls -la *.png
