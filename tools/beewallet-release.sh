#!/usr/bin/env bash
# Publish a BeeWallet Android release on this site (beewallet-android.html).
#
#   tools/beewallet-release.sh 1.4.0 <dir with app-arm64-v8a-release.apk and app-armeabi-v7a-release.apk> [--publish]
#
# Checks both APKs carry the BeeWallet release certificate, renders
# beewallet-android.html from tools/beewallet-android.template.html (sizes,
# SHA-256, certificate), and refreshes the SEO files. --publish uploads the
# APKs as GitHub release beewallet-v<version> of this repo. Then commit and
# sh tools/deploy.sh.
set -euo pipefail
cd "$(dirname "$0")/.."
v="$1"; src="$2"; publish="${3:-}"
repo="obiverse/obiverse.github.io"
expect_cert="2cb297af5a7e36f25dc025d5fdad163d0ca9fadc773ef6346294a4a7878f7864"  # CN=BeeWallet, O=Obiverse LLC
apksigner="$(ls -d "$HOME"/Library/Android/sdk/build-tools/* | sort -V | tail -1)/apksigner"
mkdir -p "${TMPDIR:-/tmp}/beewallet-dist"; dist="${TMPDIR:-/tmp}/beewallet-dist"
declare -A vars=([VERSION]="$v")
for abi in arm64-v8a:ARM64 armeabi-v7a:ARM; do
  name="${abi%%:*}"; key="${abi##*:}"
  file="beewallet-$v-$name.apk"
  cp "$src/app-$name-release.apk" "$dist/$file"
  cert="$("$apksigner" verify --print-certs "$dist/$file" | sed -n 's/^Signer #1 certificate SHA-256 digest: //p')"
  [[ "$cert" == "$expect_cert" ]] || { echo "release.sh: $file is not signed with the release key ($cert)" >&2; exit 1; }
  vars[${key}_FILE]="$file"
  vars[${key}_URL]="https://github.com/$repo/releases/download/beewallet-v$v/$file"
  vars[${key}_SHA256]="$(shasum -a 256 "$dist/$file" | cut -d' ' -f1)"
  vars[${key}_SIZE]="$(( $(stat -f%z "$dist/$file") / 1048576 )) MB"
done
vars[CERT_SHA256]="$expect_cert"
page="$(cat tools/beewallet-android.template.html)"
for k in "${!vars[@]}"; do page="${page//\{\{$k\}\}/${vars[$k]}}"; done
grep -q '{{' <<<"$page" && { echo "release.sh: unfilled placeholder" >&2; exit 1; }
printf '%s\n' "$page" > beewallet-android.html
node tools/seo.mjs
echo "release.sh: beewallet-android.html ready for $v"
if [[ "$publish" == "--publish" ]]; then
  gh release create "beewallet-v$v" "$dist"/beewallet-$v-*.apk --repo "$repo" --title "BeeWallet $v" \
    --notes "Signed APKs for Android. SHA-256 and the signing certificate: https://obiverse.github.io/beewallet-android.html"
fi
