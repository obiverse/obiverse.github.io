#!/bin/sh
# Deploy a GitHub Pages site with no Actions (free): check, push, wait for the Pages build,
# tell IndexNow exactly which pages changed, then audit the live site.
#   sh tools/deploy.sh            PSI_KEY=… adds Core Web Vitals (free key: Google Cloud → PageSpeed Insights API)
set -e
cd "$(git rev-parse --show-toplevel)"
node tools/seo.mjs --check >/dev/null || { node tools/seo.mjs --check | grep '^stale'; echo "run: node tools/seo.mjs, commit, deploy again"; exit 1; }
[ -z "$(git status --porcelain -- seo.config.mjs seo.lock.json robots.txt sitemap.xml llms.txt)" ] || { echo "commit the seo files first"; exit 1; }
branch=$(git rev-parse --abbrev-ref HEAD)
git fetch -q origin "$branch" 2>/dev/null || true
base=$(git rev-parse -q --verify "origin/$branch" || git rev-list --max-parents=0 HEAD | tail -1)
git push origin "$branch"
head=$(git rev-parse HEAD)
eval "$(node -e "import('./seo.config.mjs').then(({default:s})=>console.log('ORIGIN='+s.origin+'; KEY='+(s.indexNowKey??'')))")"

if command -v gh >/dev/null 2>&1 && repo=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null); then
  printf 'Pages build'
  i=0; while [ $i -lt 90 ]; do
    b=$(gh api "repos/$repo/pages/builds/latest" --jq '.status+" "+.commit' 2>/dev/null || echo "? ?")
    [ "$b" = "built $head" ] && break
    [ "$b" = "errored $head" ] && { echo " errored: see repo Settings → Pages"; exit 1; }
    printf '.'; sleep 10; i=$((i+1))
  done; echo " ${b%% *}"
else echo "no gh: waiting 90 s for the build"; sleep 90; fi
sleep 30   # the CDN catches up

urls=$(node tools/seo.mjs --changed "$base")
if [ -n "$KEY" ] && [ -n "$urls" ]; then node tools/seo/cli.mjs indexnow "$ORIGIN" "$KEY" $urls; else echo "IndexNow: no page changed"; fi
node tools/seo/cli.mjs audit "$ORIGIN" ${PSI_KEY:+--psi --psi-key "$PSI_KEY"}
