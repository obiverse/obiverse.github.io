// One command for a static site: lint the description, date each page by its content, write each head
// between <!-- seo --> and <!-- /seo -->, and write robots.txt, sitemap.xml, llms.txt and the IndexNow key.
//   node tools/seo.mjs [seo.config.mjs]          write everything
//   node tools/seo.mjs [seo.config.mjs] --check  write nothing; exit 1 if anything is stale (pre-commit hook)
//   node tools/seo.mjs --changed <git-ref>       print the URLs of pages changed since <ref> (deploy.sh → IndexNow);
//                                                every page when the config changed
// lastmod (Prop. 3) is never typed: seo.lock.json keeps a hash of each page without its seo block; when
// the hash changes the page's lastmod becomes today. A page new to the lock starts from page.lastmod, then
// its last git commit, then today. Commit seo.lock.json.
// Pages live beside the config: `/` → index.html, `/a.html` → a.html, `/a/` → a/index.html, `/a` → a.html.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { head, indexNowKey, langOf, lint, llmsTxt, pageUrls, robotsTxt, sitemapXml } from './seo/index.js';

const argv = process.argv.slice(2);
const changedFrom = argv.includes('--changed') ? argv[argv.indexOf('--changed') + 1] : undefined;
const config = resolve(argv.find((a, i) => !a.startsWith('--') && argv[i - 1] !== '--changed') ?? 'seo.config.mjs');
const root = dirname(config);
const site = (await import(pathToFileURL(config).href)).default;
const check = process.argv.includes('--check');
const today = new Date().toISOString().slice(0, 10);
const MARKED = /<!-- seo -->[\s\S]*?<!-- \/seo -->/;
const OWNED = [
  /[ \t]*<!-- Structured Data for SEO -->\n?/g,
  /[ \t]*<meta\s+name="(description|robots|twitter:[^"]+|google-site-verification|msvalidate\.01|yandex-verification)"[^>]*>\n?/g,
  /[ \t]*<meta\s+property="og:[^"]+"[^>]*>\n?/g,
  /[ \t]*<link\s+rel="canonical"[^>]*>\n?/g,
  /[ \t]*<link\s+rel="alternate"\s+hreflang="[^"]*"[^>]*>\n?/g,
  /[ \t]*<script type="application\/ld\+json">[\s\S]*?<\/script>\n?/g,
];
const fileOf = (p) => {
  if (p === '/') return 'index.html';
  const rel = p.replace(/^\//, '');
  if (rel.endsWith('/')) return `${rel}index.html`;
  return /\.html?$/.test(rel) || !existsSync(join(root, `${rel}.html`)) ? rel : `${rel}.html`;
};
const gitDay = (file) => { try { return execFileSync('git', ['log', '-1', '--format=%ad', '--date=short', '--', file], { cwd: root, encoding: 'utf8' }).trim(); } catch { return ''; } };
if (changedFrom) {
  const files = execFileSync('git', ['diff', '--name-only', changedFrom, 'HEAD', '--', '.'], { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean);
  const top = execFileSync('git', ['rev-parse', '--show-prefix'], { cwd: root, encoding: 'utf8' }).trim();
  const rel = new Set(files.map((f) => (f.startsWith(top) ? f.slice(top.length) : f)));
  const all = rel.has(config.slice(root.length + 1));
  for (const p of site.pages ?? []) if (!p.noindex && p.sitemap !== false && (all || rel.has(fileOf(p.path)))) console.log(site.origin + p.path);
  process.exit(0);
}
let stale = 0;
const put = (file, body) => {
  const at = join(root, file);
  if (existsSync(at) && readFileSync(at, 'utf8') === body) return;
  stale++;
  if (!check) writeFileSync(at, body);
  console.log(`${check ? 'stale' : 'wrote'} ${file}`);
};

for (const i of lint(site)) console.log(`${i.level.padEnd(5)} P${i.prop} ${i.code.padEnd(16)} ${i.url ? `${new URL(i.url).pathname}: ` : ''}${i.msg}`);

const lockFile = join(root, 'seo.lock.json');
const lock = existsSync(lockFile) ? JSON.parse(readFileSync(lockFile, 'utf8')) : {};
const nextLock = {};
const htmls = new Map();
for (const page of site.pages ?? []) {
  const file = fileOf(page.path);
  const html = readFileSync(join(root, file), 'utf8');
  htmls.set(page.path, html);
  // The content, not its head tags: the seo block, and the old tags it replaces on a first run.
  let body = html.replace(MARKED, '');
  for (const re of OWNED) body = body.replace(re, '');
  const hash = createHash('sha256').update(body.replace(/<title>[\s\S]*?<\/title>/, '').replace(/\s+/g, ' ')).digest('hex').slice(0, 16);
  const was = lock[page.path];
  const lastmod = !was ? page.lastmod ?? (gitDay(file) || today) : was.hash === hash ? was.lastmod : today;
  nextLock[page.path] = { hash, lastmod };
  page.lastmod = lastmod;
}

for (const page of site.pages ?? []) {
  const file = fileOf(page.path);
  const html = htmls.get(page.path);
  const block = `<!-- seo -->\n  ${head(site, page).split('\n').join('\n  ')}\n  <!-- /seo -->`;
  let next;
  if (MARKED.test(html)) next = html.replace(MARKED, () => block);
  else {
    const i = html.indexOf('</head>');
    let h = html.slice(0, i).replace(/<title>[\s\S]*?<\/title>/, '\u0000');
    for (const re of OWNED) h = h.replace(re, '');
    if (!h.includes('\u0000')) h = h.replace(/(<meta name="viewport"[^>]*>\n?)/, `$1  \u0000\n`);
    next = h.replace('\u0000', () => block) + html.slice(i);
  }
  if (!new RegExp(`<html[^>]*\\blang="${langOf(site, page)}"`).test(next)) console.warn(`${file}: <html lang> is not "${langOf(site, page)}"`);
  if (next !== html) put(file, next);
}

put('seo.lock.json', `${JSON.stringify(nextLock, null, 2)}\n`);
put('robots.txt', robotsTxt(site));
put('sitemap.xml', sitemapXml(site, pageUrls(site)));
if (site.llms) put('llms.txt', llmsTxt(site));
if (site.indexNowKey) put(`${indexNowKey(site.indexNowKey)}.txt`, site.indexNowKey);
if (check && stale) console.log('\nstale: run `node tools/seo.mjs` and commit');
process.exitCode = check && stale ? 1 : 0;
