#!/usr/bin/env node
// @ts-check
// seo: the framework's two commands and its build step (docs/SEO-ELEMENTS.md Book VI).
//
//   node packages/seo/cli.mjs audit <origin | sitemap-url> [--limit N] [--json] [--via http://localhost:3000]
//   node packages/seo/cli.mjs build <seo.config.mjs> <outdir>
//   node packages/seo/cli.mjs indexnow <origin> <key> [url…] [--since YYYY-MM-DD] [--dry-run]
//   node packages/seo/cli.mjs lint <seo.config.mjs> [--strict]
//   node packages/seo/cli.mjs report <seo.config.mjs> [--days 28] [--property sc-domain:example.com]
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { audit, formatReport, locsOf } from './audit.js';
import { indexNowBody, indexNowKey, lint, llmsTxt, pageUrls, ping, robotsTxt, sitemapXml } from './index.js';
import { bingRows, formatSearchReport, gscRows, gscToken, judge } from './report.js';

const [cmd, ...rest] = process.argv.slice(2);
const flags = new Set(rest.filter((a) => a.startsWith('--')));
const args = rest.filter((a, i) => !a.startsWith('--') && !['--limit', '--via', '--since', '--days', '--property', '--psi-key'].includes(rest[i - 1] ?? ''));
const flagValue = (/** @type {string} */ name) => { const i = rest.indexOf(name); return i >= 0 ? rest[i + 1] : undefined; };

const USAGE = `usage:
  seo audit <origin | sitemap-url> [--limit N] [--json] [--via <origin>] [--psi [--psi-key K]]
                                                          check what is served: hygiene (scored) and opportunities;
                                                          --via fetches through a local server, checking as <origin>;
                                                          --psi adds Core Web Vitals from PageSpeed Insights
  seo build <seo.config.mjs> <outdir>                     write robots.txt, sitemap.xml, llms.txt (+ the IndexNow key file)
  seo lint <seo.config.mjs> [--strict]                    check the description itself; --strict exits 1 on a warning
  seo report <seo.config.mjs> [--days 28] [--property P]  Search Console (GSC_KEY_FILE or GSC_TOKEN) and Bing (BING_KEY)
                                                          numbers per page, with what to do about them
  seo indexnow <origin> <key> [url…] [--since YYYY-MM-DD] [--dry-run]
                                                          tell the engines these URLs changed; none given: the sitemap's
                                                          (--since: only those whose lastmod ≥ day)`;

/** @param {string} file @returns {Promise<import('./index.js').Site & { indexNowKey?: string }>} */
const load = async (file) => { const mod = await import(pathToFileURL(resolve(file)).href); return mod.default ?? mod.site; };

async function main() {
  if (cmd === 'audit' && args[0]) {
    const limit = flagValue('--limit');
    const r = await audit(args[0], { limit: limit ? Number(limit) : undefined, via: flagValue('--via'), psi: flags.has('--psi'), psiKey: flagValue('--psi-key') ?? process.env.PSI_KEY, log: flags.has('--verbose') ? (s) => process.stderr.write(`${s}\n`) : undefined });
    process.stdout.write(flags.has('--json') ? `${JSON.stringify(r, null, 2)}\n` : formatReport(r));
    return r.errors ? 1 : 0;
  }
  if (cmd === 'build' && args[0] && args[1]) {
    const site = await load(args[0]);
    const out = resolve(args[1]);
    await mkdir(out, { recursive: true });
    const files = /** @type {[string, string][]} */ ([['robots.txt', robotsTxt(site)], ['sitemap.xml', sitemapXml(site, pageUrls(site))]]);
    if (site.llms) files.push(['llms.txt', llmsTxt(site)]);
    if (site.indexNowKey) files.push([`${indexNowKey(site.indexNowKey)}.txt`, site.indexNowKey]);
    for (const [name, body] of files) await writeFile(join(out, name), body);
    process.stdout.write(`${files.map(([n, b]) => `${n} ${b.length} B`).join('\n')}\n→ ${out}\n`);
    return 0;
  }
  if (cmd === 'lint' && args[0]) {
    const site = await load(args[0]);
    const issues = lint(site);
    process.stdout.write(issues.length ? `${issues.map((i) => `${i.level.padEnd(5)} P${i.prop} ${i.code.padEnd(18)} ${i.url ? `${new URL(i.url).pathname}: ` : ''}${i.msg}`).join('\n')}\n` : 'lint: clean\n');
    return flags.has('--strict') && issues.some((i) => i.level !== 'tip') ? 1 : 0;
  }
  if (cmd === 'report' && args[0]) {
    const site = await load(args[0]);
    const days = Number(flagValue('--days') ?? 28);
    const engines = [];
    const notes = [];
    const { GSC_KEY_FILE, GSC_TOKEN, BING_KEY } = process.env;
    if (GSC_KEY_FILE || GSC_TOKEN) {
      const token = GSC_TOKEN || await gscToken(/** @type {string} */ (GSC_KEY_FILE));
      const property = flagValue('--property') ?? `${site.origin}/`;
      engines.push({ engine: `Google Search Console, ${days} days`, ...judge(site, 'google', await gscRows(property, token, days)) });
    } else notes.push('Google: set GSC_KEY_FILE (service-account JSON, added as a user of the property) or GSC_TOKEN.');
    if (BING_KEY) engines.push({ engine: 'Bing Webmaster (feeds ChatGPT search, Copilot, DuckDuckGo)', ...judge(site, 'bing', await bingRows(`${site.origin}/`, BING_KEY)) });
    else notes.push('Bing: set BING_KEY (Bing Webmaster Tools → Settings → API access).');
    process.stdout.write(formatSearchReport(site, engines, notes));
    return 0;
  }
  if (cmd === 'indexnow' && args[0] && args[1]) {
    const origin = new URL(args[0]).origin;
    const key = indexNowKey(args[1]);
    const robots = await (await fetch(`${origin}/robots.txt`)).text().catch(() => '');
    const map = /^\s*sitemap:\s*(\S+)/im.exec(robots)?.[1] ?? `${origin}/sitemap.xml`;
    const given = args.slice(2);
    const xml = given.length ? '' : await (await fetch(map)).text();
    const since = flagValue('--since');
    const urls = given.length ? given : since
      ? [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => ({ loc: /<loc>\s*([^<\s]+)/.exec(m[1] ?? '')?.[1], mod: /<lastmod>\s*([^<\s]+)/.exec(m[1] ?? '')?.[1] ?? '' }))
        .filter((u) => u.loc && u.mod.slice(0, 10) >= since).map((u) => /** @type {string} */ (u.loc))
      : locsOf(xml);
    if (!urls.length) { process.stdout.write(`IndexNow: nothing changed since ${since}\n`); return 0; }
    const body = indexNowBody(origin, key, urls);
    const served = await fetch(body.keyLocation).then(async (r) => (r.status === 200 ? (await r.text()).trim() : '')).catch(() => '');
    if (served !== key) process.stderr.write(`warning: ${body.keyLocation} does not serve the key; the engines will answer 403\n`);
    if (flags.has('--dry-run')) { process.stdout.write(`${JSON.stringify(body, null, 2)}\n`); return 0; }
    const r = await ping(origin, key, urls);
    process.stdout.write(`IndexNow ${r.status}${r.ok ? ' ok' : ''}: ${r.sent} URLs${given.length ? '' : ` from ${map}`}\n`);
    return r.ok ? 0 : 1;
  }
  process.stderr.write(`${USAGE}\n`);
  return 2;
}

main().then((code) => { process.exitCode = code; }, (e) => { process.stderr.write(`${e?.stack ?? e}\n`); process.exitCode = 1; });
