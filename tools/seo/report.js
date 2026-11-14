// @ts-check
// `seo report`: what the engines saw, page by page — Google Search Console and
// Bing Webmaster Tools — held against what each page is for (its `query`).
// The loop the tags cannot close: shown but not clicked → rewrite the title;
// on page two → strengthen the page; found for other words → re-aim it.
import { createSign } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { abs, lint, terms } from './index.js';

/**
 * @typedef {{ page: string, query?: string, clicks: number, impressions: number, ctr: number, position: number }} Row
 * @typedef {{ path: string, url: string, query?: string, engine: string, clicks: number, impressions: number, ctr: number, position: number, top: Row[], verdicts: string[] }} PageStat
 */

/**
 * An access token from a Google service-account key file (the account must be
 * added as a user of the Search Console property). Signed here: no SDK.
 * @param {string} keyFile
 * @param {typeof fetch} [f]
 */
export async function gscToken(keyFile, f = fetch) {
  const k = JSON.parse(await readFile(keyFile, 'utf8'));
  const aud = k.token_uri ?? 'https://oauth2.googleapis.com/token';
  const now = Math.floor(Date.now() / 1000);
  const b64 = (/** @type {unknown} */ o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iss: k.client_email, scope: 'https://www.googleapis.com/auth/webmasters.readonly', aud, iat: now, exp: now + 3600 })}`;
  const sig = createSign('RSA-SHA256').update(unsigned).sign(k.private_key).toString('base64url');
  const r = await f(aud, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${sig}` }) });
  const j = /** @type {any} */ (await r.json());
  if (!j.access_token) throw new Error(`Search Console token: ${r.status} ${j.error_description ?? j.error ?? ''}`);
  return /** @type {string} */ (j.access_token);
}

const day = (/** @type {number} */ ago) => new Date(Date.now() - ago * 864e5).toISOString().slice(0, 10);

/**
 * Search Console rows for the last `days` (data lags ~2 days), by page and by page × query.
 * @param {string} property   `sc-domain:example.com` or `https://example.com/`
 * @param {string} token
 * @param {number} days
 * @param {typeof fetch} [f]
 * @returns {Promise<{ pages: Row[], queries: Row[] }>}
 */
export async function gscRows(property, token, days, f = fetch) {
  const q = async (/** @type {string[]} */ dimensions) => {
    const r = await f(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`, {
      method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ startDate: day(days + 2), endDate: day(2), dimensions, rowLimit: 25000 }),
    });
    const j = /** @type {any} */ (await r.json());
    if (r.status !== 200) throw new Error(`Search Console ${r.status}: ${j.error?.message ?? ''} (is the key's client_email a user of ${property}?)`);
    return /** @type {any[]} */ (j.rows ?? []).map((x) => ({ page: x.keys[0], query: x.keys[1], clicks: x.clicks, impressions: x.impressions, ctr: x.ctr, position: x.position }));
  };
  const [pages, queries] = await Promise.all([q(['page']), q(['page', 'query'])]);
  return { pages, queries };
}

/**
 * Bing Webmaster rows (Bing also feeds ChatGPT search, Copilot and DuckDuckGo).
 * API key: Bing Webmaster Tools → Settings → API access.
 * @param {string} siteUrl   `https://example.com/`, as verified in Bing
 * @param {string} key
 * @param {typeof fetch} [f]
 * @returns {Promise<{ pages: Row[], queries: Row[] }>}
 */
export async function bingRows(siteUrl, key, f = fetch) {
  const call = async (/** @type {string} */ method) => {
    const r = await f(`https://ssl.bing.com/webmaster/api.svc/json/${method}?siteUrl=${encodeURIComponent(siteUrl)}&apikey=${encodeURIComponent(key)}`);
    if (r.status !== 200) throw new Error(`Bing ${method} ${r.status}: ${(await r.text()).slice(0, 200)}`);
    return /** @type {any[]} */ ((/** @type {any} */ (await r.json())).d ?? []);
  };
  /** @param {any[]} rows @param {(x: any) => string} keyOf */
  const sum = (rows, keyOf) => {
    /** @type {Map<string, Row>} */
    const by = new Map();
    for (const x of rows) {
      const k = keyOf(x);
      const a = by.get(k) ?? { page: k, clicks: 0, impressions: 0, ctr: 0, position: 0 };
      a.position = (a.position * a.impressions + (x.AvgImpressionPosition ?? 0) * x.Impressions) / Math.max(1, a.impressions + x.Impressions);
      a.clicks += x.Clicks; a.impressions += x.Impressions; a.ctr = a.impressions ? a.clicks / a.impressions : 0;
      by.set(k, a);
    }
    return [...by.values()];
  };
  const [pages, queries] = await Promise.all([call('GetPageStats'), call('GetQueryStats')]);
  return { pages: sum(pages, (x) => x.Query), queries: sum(queries, (x) => x.Query).map((r) => ({ ...r, query: r.page, page: '' })) };
}

/** The click-through a result at this position earns on average (organic, 2024–25 studies, rounded down). */
export const expectedCtr = (/** @type {number} */ pos) => (pos < 1.5 ? 0.25 : pos < 2.5 ? 0.13 : pos < 3.5 ? 0.08 : pos < 5.5 ? 0.05 : pos < 10.5 ? 0.02 : 0.005);

const words = (/** @type {string} */ s) => new Set(terms(s));

/**
 * Each page of the site with its numbers and what to do about them.
 * @param {import('./index.js').Site} site
 * @param {string} engine
 * @param {{ pages: Row[], queries: Row[] }} rows
 * @returns {{ pages: PageStat[], unlisted: Row[] }}
 */
export function judge(site, engine, rows) {
  const norm = (/** @type {string} */ u) => u.replace(/\/index\.html?$/, '/').replace(/[?#].*$/, '');
  const listed = new Set((site.pages ?? []).map((p) => norm(abs(site, p.path))));
  /** @type {PageStat[]} */
  const pages = [];
  for (const p of site.pages ?? []) {
    if (p.noindex || p.sitemap === false) continue;
    const url = norm(abs(site, p.path));
    const t = rows.pages.find((r) => norm(r.page) === url) ?? { page: url, clicks: 0, impressions: 0, ctr: 0, position: 0 };
    const top = rows.queries.filter((r) => norm(r.page) === url).sort((a, b) => b.impressions - a.impressions).slice(0, 5);
    /** @type {string[]} */
    const verdicts = [];
    if (!t.impressions) verdicts.push('never shown: check it is indexed (URL Inspection), then give it links from pages that are');
    else {
      if (t.impressions >= 50 && t.ctr < expectedCtr(t.position) / 2) verdicts.push(`shown ${t.impressions}× at ${t.position.toFixed(1)} but clicked ${(t.ctr * 100).toFixed(1)}% (expect ~${(expectedCtr(t.position) * 100).toFixed(0)}%): rewrite title and description toward "${top[0]?.query ?? p.query ?? p.title}"`);
      if (t.position > 7.5 && t.position <= 20 && t.impressions >= 20) verdicts.push(`average position ${t.position.toFixed(1)}: within reach of page one; deepen the answer and link to it from stronger pages`);
      if (p.query && top.length) {
        const want = words(p.query);
        const hit = top.some((r) => [...words(r.query ?? '')].filter((w) => want.has(w)).length >= Math.ceil(want.size / 2));
        if (!hit) verdicts.push(`aimed at "${p.query}" but found for ${top.slice(0, 3).map((r) => `"${r.query}"`).join(', ')}: re-aim the page, or make one for those`);
      }
    }
    pages.push({ path: p.path, url, query: p.query, engine, clicks: t.clicks, impressions: t.impressions, ctr: t.ctr, position: t.position, top, verdicts });
  }
  const unlisted = rows.pages.filter((r) => r.page && !listed.has(norm(r.page)) && r.impressions > 0).sort((a, b) => b.impressions - a.impressions);
  return { pages, unlisted };
}

/**
 * The report as text: lint and presence first (free), then each engine.
 * @param {import('./index.js').Site} site
 * @param {{ engine: string, pages: PageStat[], unlisted: Row[] }[]} engines
 * @param {string[]} [notes]
 */
export function formatSearchReport(site, engines, notes = []) {
  const out = [`seo report ${site.origin}`, ''];
  const l = lint(site);
  out.push(l.length ? l.map((i) => `${i.level.padEnd(5)} P${i.prop} ${i.code.padEnd(18)} ${i.url ? `${new URL(i.url).pathname}: ` : ''}${i.msg}`).join('\n') : 'lint: clean');
  for (const e of engines) {
    out.push('', `── ${e.engine} ──`, `${'impr'.padStart(6)} ${'clicks'.padStart(6)} ${'ctr'.padStart(6)} ${'pos'.padStart(5)}  path`);
    for (const p of [...e.pages].sort((a, b) => b.impressions - a.impressions)) {
      out.push(`${String(p.impressions).padStart(6)} ${String(p.clicks).padStart(6)} ${`${(p.ctr * 100).toFixed(1)}%`.padStart(6)} ${(p.position ? p.position.toFixed(1) : '—').padStart(5)}  ${p.path}${p.query ? `  [${p.query}]` : ''}`);
      for (const r of p.top) if (r.query) out.push(`${''.padStart(27)}  · ${r.query} (${r.impressions}, pos ${r.position.toFixed(1)})`);
      for (const v of p.verdicts) out.push(`${''.padStart(27)}  → ${v}`);
    }
    if (e.unlisted.length) out.push('', 'shown, but not in the site description (add, redirect or noindex):', ...e.unlisted.slice(0, 10).map((r) => `  ${r.impressions} ${r.page}`));
  }
  if (notes.length) out.push('', ...notes);
  return `${out.join('\n')}\n`;
}
