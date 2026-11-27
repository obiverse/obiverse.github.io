// Obiverse Apps: one catalogue (apps/index.json) feeds the Android store app and the /apps/ page.
//
//   node tools/apps.mjs add <id> <apk>... [--publish]   check and add one version of one app
//   node tools/apps.mjs build                            render apps/index.html and sign the catalogue
//
// The invariant: one package, one signing certificate, forever. The first release of an app pins its
// certificate; a later file signed by anyone else is refused here, refused by the store app, and refused
// by Android. Apps already on Google Play are signed by Google, so their file comes from Play Console
// (App bundle explorer → the version → Downloads → Signed, universal APK), never from our own build.
//
// --publish uploads the files as GitHub release <id>-v<version> of this repo. Then: node tools/seo.mjs,
// commit, sh tools/deploy.sh. The catalogue key never enters git: OBI_APPS_KEY, by default
// ~/dev/obiverse.apps/keys/catalog.pem (its public half is in the store app, Store.java).
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { basename, join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const CAT = join(ROOT, 'apps/index.json');
const REPO = 'obiverse/obiverse.github.io';
const KEY = process.env.OBI_APPS_KEY ?? join(homedir(), 'dev/obiverse.apps/keys/catalog.pem');
const TOOLS = (() => {
  const d = join(homedir(), 'Library/Android/sdk/build-tools');
  const v = execFileSync('ls', [d], { encoding: 'utf8' }).trim().split('\n').sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).at(-1);
  return join(d, v);
})();
const run = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const die = (m) => { console.error(`apps: ${m}`); process.exit(1); };
const sha256 = (f) => createHash('sha256').update(readFileSync(f)).digest('hex');
const load = () => JSON.parse(readFileSync(CAT, 'utf8'));
const save = (c) => writeFileSync(CAT, JSON.stringify(c, null, 2) + '\n');

/** What Android itself will read from the file: package, version, ABIs, signer. */
function inspect(apk) {
  const b = run(join(TOOLS, 'aapt2'), ['dump', 'badging', apk]);
  const pkg = b.match(/^package: name='([^']+)' versionCode='(\d+)' versionName='([^']*)'/m) ?? die(`${apk}: not an APK`);
  const abis = (b.match(/^native-code: (.*)$/m)?.[1] ?? '').match(/'([^']+)'/g)?.map((s) => s.slice(1, -1)) ?? [];
  const cert = run(join(TOOLS, 'apksigner'), ['verify', '--print-certs', apk]).match(/^Signer #1 certificate SHA-256 digest: ([0-9a-f]+)$/m)?.[1];
  if (!cert) die(`${apk}: not signed`);
  return { pkg: pkg[1], code: Number(pkg[2]), version: pkg[3], abi: abis.length === 1 ? abis[0] : 'universal', cert };
}

function add(id, files, publish) {
  const cat = load();
  const app = cat.apps.find((a) => a.id === id) ?? die(`no app "${id}" in apps/index.json (add its name and line by hand first)`);
  const got = files.map((f) => ({ f, ...inspect(f) }));
  const { version, cert } = got[0];
  const code = Math.min(...got.map((g) => g.code));   // split APKs carry the ABI in their versionCode
  for (const g of got) {
    if (g.pkg !== app.package) die(`${g.f} is ${g.pkg}, not ${app.package}`);
    if (g.version !== version) die('the files are different versions');
    if (g.cert !== cert) die('the files have different signers');
  }
  if (app.cert && app.cert !== cert) die(`${id} is pinned to ${app.cert}; these files are signed by ${cert}. One package, one certificate, forever.`);
  for (const g of got) if ((app.apk?.[g.abi]?.code ?? 0) > g.code) die(`${g.f} (${g.code}) is older than the catalogue's ${app.version}`);
  if (app.version !== version) app.apk = {};   // a new version replaces every file of the old one

  const tag = `${id}-v${version}`, dist = join(tmpdir(), 'obiverse-apps', tag);
  mkdirSync(dist, { recursive: true });
  const out = [];
  for (const g of got) {
    const name = `${id}-${version}-${g.abi}.apk`;
    copyFileSync(g.f, join(dist, name));
    out.push(join(dist, name));
    app.apk[g.abi] = { code: g.code, url: `https://github.com/${REPO}/releases/download/${tag}/${name}`, sha256: sha256(g.f), size: statSync(g.f).size };
  }
  delete app.code;
  Object.assign(app, { cert, version });
  if (publish) {
    let exists = true;
    try { run('gh', ['release', 'view', tag, '--repo', REPO]); } catch { exists = false; }
    if (!exists) run('gh', ['release', 'create', tag, '--repo', REPO, '--title', `${app.name} ${version}`,
      '--notes', `Signed APKs for Android. Checksums and the signing certificate: https://obiverse.github.io/apps/#check`]);
    run('gh', ['release', 'upload', tag, '--repo', REPO, ...out]);   // never --clobber: a published file never changes
    console.log(`apps: published ${tag}`);
  } else console.log(`apps: files in ${dist}; run again with --publish to upload them`);
  save(cat);
  build();
}

// ---- the page --------------------------------------------------------------------------------

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const mb = (n) => (n < 1048576 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${Math.round(n / 1048576)} MB`);
const ABI = { 'arm64-v8a': 'most phones, 64-bit', 'armeabi-v7a': 'older 32-bit phones', 'x86_64': 'x86 tablets and emulators', universal: 'every phone' };

function page(cat) {
  const store = cat.apps.find((a) => a.id === 'apps');
  const storeApk = store?.apk?.universal;
  const apps = cat.apps.filter((a) => a.id !== 'apps');
  const android = (a) => {
    const k = a.apk?.['arm64-v8a'] ?? a.apk?.universal;
    if (k) return `<a href="${esc(k.url)}" class="bo">Android &middot; ${mb(k.size)}</a>`;
    if (a.play) return `<a href="${esc(a.play)}" class="bo" target="_blank" rel="noopener">Google Play</a>`;
    return '';
  };
  const card = (a) => `
      <div class="card app" id="${esc(a.id)}">
        <img src="/apps/icons/${esc(a.id)}.png" alt="" width="64" height="64" loading="lazy">
        <h3>${esc(a.name)}</h3>
        <p>${esc(a.line)}</p>
        <p class="ctas">${a.ios ? `<a href="${esc(a.ios)}" class="bo" target="_blank" rel="noopener">App Store</a>` : ''}${android(a)}</p>
        ${a.page ? `<a href="${esc(a.page.replace('https://obiverse.github.io', ''))}" class="go">About ${esc(a.name)} &rarr;</a>` : ''}
      </div>`;
  const check = cat.apps.filter((a) => a.cert).map((a) => `
      <h3 style="margin-top:24px">${esc(a.name)} ${esc(a.version)}</h3>
      <p class="small muted">Signing certificate (SHA-256)<br><code>${esc(a.cert)}</code></p>
      ${Object.entries(a.apk ?? {}).map(([abi, k]) => `<p class="small"><a href="${esc(k.url)}">${esc(basename(k.url))}</a> (${ABI[abi] ?? esc(abi)}, ${mb(k.size)})<br><code>${esc(k.sha256)}</code></p>`).join('')}`).join('');
  const pub = existsSync(KEY) ? run('openssl', ['ec', '-in', KEY, '-pubout']).trim() : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!-- seo -->
  <!-- /seo -->
  <meta name="theme-color" content="#c97d1d">
  <link rel="icon" href="/logo-64.png" type="image/png">
  <link rel="apple-touch-icon" href="/icon-512.png">
  <script src="/theme.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=IBM+Plex+Sans:wght@400;600&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
  <noscript><link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=IBM+Plex+Sans:wght@400;600&display=swap" rel="stylesheet"></noscript>
  <link rel="stylesheet" href="/studio.css">
  <style>
    .app img{border-radius:22%;margin-bottom:14px}
    .app .ctas{justify-content:flex-start;margin:14px 0 6px}
    .app .ctas a{padding:8px 16px;font-size:14px}
    code{font-size:12px;word-break:break-all}
  </style>
</head>
<body>
<!-- Written by tools/apps.mjs from apps/index.json. Edit those, not this. -->
<header>
  <div class="wrap">
    <a href="/" class="logo"><img src="/logo-64.png" alt="" width="26" height="26">OBIVERSE</a>
    <nav>
      <a href="/flowledger.html" class="nl">FlowLedger</a>
      <a href="/website-design.html" class="nl">Websites</a>
      <a href="/apps/" class="nl">Apps</a>
      <a href="/#work" class="nl">Work</a>
      <a href="/#start" class="btn">Talk to us</a>
      <button class="theme" onclick="obiThemeCycle()" aria-label="Change theme" title="Change theme"><span class="theme-icon" aria-hidden="true">&#x25D0;</span></button>
    </nav>
  </div>
</header>

<main>
<section class="hero center">
  <div class="wrap">
    <p class="eyebrow">Obiverse Apps</p>
    <h1>Our apps. <br>One place.</h1>
    <p class="lead">Install Obiverse Apps once. After that every app installs with a tap, updates with a tap, and is checked against its maker&rsquo;s signature before it touches your phone.</p>
    <div class="ctas">
      ${storeApk ? `<a href="${esc(storeApk.url)}" class="btn">Get Obiverse Apps for Android &middot; ${mb(storeApk.size)}</a>` : ''}
      <a href="#apps" class="bo">See the apps</a>
    </div>
    <p class="facts"><span><b>Install once</b>, one permission</span><span><b>One tap</b> after that</span><span><b>Checked</b> every time</span></p>
  </div>
</section>

<section id="apps" class="band">
  <div class="wrap">
    <p class="eyebrow">The apps</p>
    <h2 style="margin-bottom:32px">Made by us. Signed by us.</h2>
    <div class="grid g2">${apps.map(card).join('')}
    </div>
    <p class="muted small" style="margin-top:20px">On iPhone, each app is on the App Store.</p>
  </div>
</section>

<section>
  <div class="wrap narrow">
    <p class="eyebrow">How to start</p>
    <h2 style="margin-bottom:24px">Three steps, once.</h2>
    <div class="grid g3 steps">
      <div class="step"><h3>Download</h3><p>Tap <b>Get Obiverse Apps</b> on your Android phone and open the file.</p></div>
      <div class="step"><h3>Allow, once</h3><p>Android asks whether your browser may install apps. Say yes for this one file. Obiverse Apps asks the same once for itself.</p></div>
      <div class="step"><h3>Tap Get</h3><p>Pick an app. It downloads, is checked, and installs. When there is an update, it says <b>Update</b>.</p></div>
    </div>
  </div>
</section>

<section class="band">
  <div class="wrap narrow">
    <p class="eyebrow">Questions</p>
    <h2 style="margin-bottom:24px">What people ask first.</h2>
    <details><summary>Is it safe to allow installing apps?</summary><p>You allow one app, Obiverse Apps, and nothing else. Before it installs anything it checks the file three ways: the list of apps is signed by us, the file must match the checksum on that list, and the app inside must be signed by its maker&rsquo;s certificate. If any check fails, nothing is installed. Android then refuses any later update signed by someone else.</p></details>
    <details><summary>Why not just Google Play?</summary><p>Our apps are on Google Play too, where Play allows them. Obiverse Apps works on phones without Google, for people without a Google account, and the day we ship, not the day a review finishes.</p></details>
    <details><summary>I already have one of these from Google Play.</summary><p>Keep it. An app is signed by one key, and a copy from Google Play keeps updating there. Obiverse Apps sees it, says so, and leaves it alone.</p></details>
    <details><summary>Will my data survive an update?</summary><p>Yes. An update installs over the app you have, so its data stays. For a wallet, keep your recovery words written down whatever happens.</p></details>
  </div>
</section>

<section id="check">
  <div class="wrap narrow">
    <p class="eyebrow">Check what you install</p>
    <h2 style="margin-bottom:16px">Every file, and who signed it.</h2>
    <p class="muted">Obiverse Apps does these checks for you. To check a file by hand, its SHA-256 must match below, and the app&rsquo;s signing certificate must match on every release; the free AppVerifier app shows the certificate of an installed app. The list itself is <a href="/apps/index.json">index.json</a>, signed in <a href="/apps/index.json.sig">index.json.sig</a> by this key:</p>
    ${pub ? `<p class="small"><code>${esc(pub).replace(/\n/g, '<br>')}</code></p>` : ''}${check}
  </div>
</section>
</main>

<footer>
  <div class="wrap">
    <div><a href="/" class="logo" style="margin-bottom:10px"><img src="/logo-64.png" alt="" width="26" height="26">OBIVERSE</a><p class="muted small">Obiverse LLC, home of Kwatasoft: systems that stop the leak.</p></div>
    <div><h4>What we do</h4><a href="/flowledger.html">FlowLedger</a><a href="/website-design.html">Websites</a><a href="/#start">Talk to us</a></div>
    <div><h4>Our apps</h4><a href="/apps/">Obiverse Apps</a>${apps.map((a) => a.page ? `<a href="${esc(a.page.replace('https://obiverse.github.io', ''))}">${esc(a.name)}</a>` : '').join('')}</div>
    <div><h4>Contact</h4><a href="https://wa.me/12409750431" target="_blank" rel="noopener">WhatsApp</a><a href="mailto:obiversellc@gmail.com">obiversellc@gmail.com</a><a href="/privacy.html">Privacy</a><a href="/terms.html">Terms</a></div>
  </div>
</footer>
<script src="/studio.js" defer></script>
</body>
</html>
`;
}

function build() {
  const cat = load();
  const file = join(ROOT, 'apps/index.html');
  const old = existsSync(file) ? readFileSync(file, 'utf8') : '';
  let html = page(cat);
  const seo = old.match(/<!-- seo -->[\s\S]*?<!-- \/seo -->/)?.[0];   // keep the head tools/seo.mjs wrote
  if (seo) html = html.replace(/<!-- seo -->[\s\S]*?<!-- \/seo -->/, seo);
  writeFileSync(file, html);
  if (!existsSync(KEY)) die(`no catalogue key at ${KEY}; the page is written, the catalogue is NOT signed`);
  run('openssl', ['dgst', '-sha256', '-sign', KEY, '-out', join(ROOT, 'apps/index.json.sig'), CAT]);
  const pub = join(tmpdir(), 'obiverse-apps.pub.pem');
  writeFileSync(pub, run('openssl', ['ec', '-in', KEY, '-pubout']));
  run('openssl', ['dgst', '-sha256', '-verify', pub, '-signature', join(ROOT, 'apps/index.json.sig'), CAT]);
  console.log('apps: wrote apps/index.html, signed apps/index.json');
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === 'add') add(rest[0], rest.slice(1).filter((a) => !a.startsWith('--')), rest.includes('--publish'));
else if (cmd === 'build') build();
else die('usage: node tools/apps.mjs add <id> <apk>... [--publish] | build');
