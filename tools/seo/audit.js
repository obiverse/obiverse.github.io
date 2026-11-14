// @ts-check
// `seo audit`: fetch robots.txt, the sitemap and every page in it, and check
// Propositions 1, 2, 4, 5, 6, 8, 9 and 10 the way an engine would meet them — the
// HTML as served, no script run. Errors and warnings are hygiene and make the
// score; tips are opportunities (rich results, speed, links) and do not. Parsing is by pattern, not a DOM: enough for the tags
// a page writes about itself, and no dependency.
import { robotsAllows } from './index.js';

/**
 * @typedef {'error' | 'warn' | 'tip'} Level
 * @typedef {{ level: Level, prop: number, code: string, msg: string, url?: string }} Issue
 * @typedef {{ url: string, status: number, location?: string, title?: string, description?: string, h1: number,
 *   canonical?: string, ld: number, ogImage?: string, kb: number, words: number, issues: Issue[], checks: number,
 *   links?: string[], alternates?: { hreflang: string, href: string }[] }} PageReport
 * @typedef {{ origin: string, sitemap: string, pages: PageReport[], site: Issue[], score: number, errors: number, warnings: number, tips: number }} Report
 */

const ENT = /** @type {Record<string, string>} */ ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', hellip: '…', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', middot: '·' });
/** @param {string} s */
export const decode = (s) => s.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (m, e) =>
  e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : ENT[e.toLowerCase()] ?? m);

/** @param {string} tag */
const attrs = (tag) => {
  /** @type {Record<string, string>} */
  const out = {};
  for (const m of tag.matchAll(/([\w:-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g)) out[(m[1] ?? '').toLowerCase()] = decode(m[3] ?? m[4] ?? m[5] ?? '');
  return out;
};

/**
 * What a page says about itself, read from the served HTML.
 * @param {string} html
 */
export function parseHtml(html) {
  const bare = html.replace(/<!--[\s\S]*?-->/g, '');
  const tags = (/** @type {string} */ name) => [...bare.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((m) => attrs(m[0]));
  const metas = tags('meta');
  const meta = (/** @type {string} */ k) => metas.find((m) => m.name?.toLowerCase() === k || m.property?.toLowerCase() === k)?.content;
  const links = tags('link');
  const rel = (/** @type {string} */ r) => links.filter((l) => (l.rel ?? '').toLowerCase().split(/\s+/).includes(r));
  const ld = [...bare.matchAll(/<script[^>]*type=["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => {
    try { return { ok: true, value: /** @type {unknown} */ (JSON.parse(m[1] ?? '')) }; } catch (e) { return { ok: false, error: String(/** @type {Error} */ (e).message) }; }
  });
  // The words a reader gets with scripting off: no script, style, template or drawing.
  const text = decode(bare.replace(/<(script|style|template|svg)\b[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
  const visible = bare.replace(/<(script|style|template)\b[\s\S]*?<\/\1>/gi, '');
  const titleM = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(bare);
  const anchors = [...visible.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map((m) => ({
    href: attrs(`<a ${m[1] ?? ''}>`).href ?? '',
    text: decode((m[2] ?? '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim(),
    label: attrs(`<a ${m[1] ?? ''}>`)['aria-label'] ?? '',
  }));
  return {
    lang: /<html\b[^>]*\blang=["']?([\w-]+)/i.exec(bare)?.[1],
    title: titleM ? decode(titleM[1] ?? '').trim() : undefined,
    description: meta('description'),
    robots: meta('robots'),
    canonical: rel('canonical')[0]?.href,
    alternates: rel('alternate').filter((l) => l.hreflang).map((l) => ({ hreflang: l.hreflang ?? '', href: l.href ?? '' })),
    h1: (visible.match(/<h1\b/gi) ?? []).length,
    viewport: !!meta('viewport'),
    anchors,
    imgNoAlt: [...visible.matchAll(/<img\b[^>]*>/gi)].filter((m) => attrs(m[0]).alt === undefined).length,
    ld,
    og: { title: meta('og:title'), description: meta('og:description'), image: meta('og:image'), url: meta('og:url') },
    bytes: Buffer.byteLength(html),
    words: text ? text.split(' ').length : 0,
  };
}

/** The part of a title before the brand: what the seeker typed (Prop. 5). */
export const intentOf = (/** @type {string} */ title) => {
  const m = /^(.*\S)\s+[—–|·-]\s+[^—–|·-]+$/.exec(title);
  return m ? m[1] ?? title : title;
};

const LOCAL = /^(LocalBusiness|ProfessionalService|Store|Restaurant|AutoRepair|HomeAndConstructionBusiness|MedicalBusiness|LegalService|FinancialService|FoodEstablishment|LodgingBusiness|HealthAndBeautyBusiness|SportsActivityLocation)$/;
const APP = /^(SoftwareApplication|MobileApplication|WebApplication|VideoGame)$/;

/**
 * What Google needs before a node can show as a rich result, as tips: a
 * missing piece costs the enhancement, not the listing. Real data only: a
 * rating or a review that is not genuine is a manual action, not a tip.
 * @param {unknown} ld   the parsed JSON-LD of one script
 * @returns {string[]}
 */
export function richResults(ld) {
  /** @type {Record<string, any>[]} */
  const nodes = [];
  const walk = (/** @type {any} */ v) => { if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') { if (v['@type']) nodes.push(v); Object.values(v).forEach(walk); } };
  walk(ld);
  /** @type {string[]} */
  const out = [];
  for (const n of nodes) {
    const types = [n['@type']].flat().map(String);
    const has = (/** @type {string} */ k) => n[k] !== undefined && n[k] !== '';
    const name = n.name ?? types[0];
    if (types.includes('FAQPage')) out.push('FAQPage: since 2023 Google shows FAQ rich results only for well-known government and health sites; keep it for answer engines, expect no snippet');
    if (types.includes('HowTo')) out.push('HowTo: Google retired HowTo rich results in 2023');
    if (types.some((t) => APP.test(t)) && !(has('aggregateRating') || has('review'))) out.push(`${name}: an app rich result needs aggregateRating or review (real ones, from the store)`);
    if (types.some((t) => APP.test(t)) && !n.offers) out.push(`${name}: an app rich result needs offers.price (0 for free)`);
    if (types.includes('Product') && !(has('offers') || has('review') || has('aggregateRating'))) out.push(`${name}: a product rich result needs offers, review or aggregateRating`);
    if (types.some((t) => LOCAL.test(t)) && !n.address?.streetAddress) out.push(`${name}: a local business needs a full address (streetAddress, locality) for the map pack and knowledge panel`);
    if (types.includes('Organization') && !has('logo')) out.push(`${name}: an Organization without a logo cannot show one in results`);
    if (types.includes('Organization') && !(n.sameAs ?? []).length) out.push(`${name}: no sameAs; profiles elsewhere are how an engine knows this is one entity (Prop. 6, 7)`);
    if (types.some((t) => /Article$/.test(t)) && !(has('headline') && has('image') && has('datePublished'))) out.push(`${name}: an article needs headline, image and datePublished`);
  }
  return [...new Set(out)];
}

const GENERIC = /^(click here|here|read more|more|learn more|this|link|en savoir plus|ici|cliquez ici)$/i;

/**
 * Every check on one fetched page. `inSitemap` is the set of every URL the sitemap lists.
 * @param {string} url
 * @param {{ status: number, location?: string, robotsHeader?: string, html: string }} got
 * @param {{ robots?: string, inSitemap: Set<string> }} ctx
 * @returns {PageReport}
 */
export function checkPage(url, got, ctx) {
  /** @type {Issue[]} */
  const issues = [];
  let checks = 0;
  /** @param {boolean} ok @param {Level} level @param {number} prop @param {string} code @param {string} msg */
  const want = (ok, level, prop, code, msg) => { checks++; if (!ok) issues.push({ level, prop, code, msg, url }); };
  const path = new URL(url).pathname + new URL(url).search;
  if (ctx.robots !== undefined) {
    const shut = ['Googlebot', 'Bingbot', 'OAI-SearchBot', 'ClaudeBot', 'PerplexityBot'].filter((a) => !robotsAllows(/** @type {string} */ (ctx.robots), a, path));
    want(!shut.length, 'error', 4, 'robots-blocked', `robots.txt shuts out ${shut.join(', ')}`);
  }
  if (got.status !== 200) {
    want(false, 'error', 2, got.status >= 300 && got.status < 400 ? 'redirect' : 'status',
      got.status >= 300 && got.status < 400 ? `the sitemap lists a redirect (${got.status} → ${got.location ?? '?'})` : `answers ${got.status}, not 200`);
    return { url, status: got.status, location: got.location, h1: 0, ld: 0, kb: 0, words: 0, issues, checks };
  }
  checks++;
  const p = parseHtml(got.html);
  const noindex = /noindex/i.test(p.robots ?? '') || /noindex/i.test(got.robotsHeader ?? '');
  want(!noindex, 'error', 2, 'noindex', 'listed in the sitemap but says noindex');
  want(!!p.lang, 'error', 1, 'lang', '<html> has no lang');
  want(!!p.title, 'error', 1, 'title', 'no <title>');
  if (p.title) {
    const intent = intentOf(p.title);
    want(intent !== p.title || p.title.length >= 20, 'warn', 5, 'title-intent', `title "${p.title}" names no intent, only a name`);
    want(intent.length <= 62, 'warn', 5, 'title-long', `title is ${intent.length} characters before the brand (~60)`);
  }
  want(!!p.description, 'error', 1, 'description', 'no meta description');
  if (p.description) want(p.description.length >= 70 && p.description.length <= 170, 'warn', 5, 'description-length', `description is ${p.description.length} characters (70–170)`);
  want(p.h1 > 0, 'error', 1, 'h1', 'no <h1>');
  if (p.h1 > 1) want(false, 'warn', 1, 'h1-many', `${p.h1} <h1>s, one answer has one`);
  want(p.words >= 80, 'warn', 1, 'thin', `${p.words} words without a script; the answer should be in the HTML`);
  want(!!p.canonical, 'error', 2, 'canonical', 'no canonical link');
  if (p.canonical) {
    const canon = new URL(p.canonical, url).href;
    want(canon === url, 'error', 2, 'canonical-other', `canonical is ${canon}${ctx.inSitemap.has(canon) ? '' : ' (not in the sitemap)'}: the sitemap lists a non-canonical address`);
  }
  for (const a of p.alternates) {
    const href = new URL(a.href, url).href;
    want(ctx.inSitemap.has(href), 'warn', 9, 'hreflang', `hreflang ${a.hreflang} → ${href} is not in the sitemap`);
  }
  const bad = p.ld.filter((x) => !x.ok);
  want(p.ld.length > 0, 'warn', 6, 'jsonld', 'no JSON-LD: a machine has to guess what this page is about');
  want(!bad.length, 'error', 6, 'jsonld-parse', `JSON-LD does not parse: ${bad.map((x) => x.error).join('; ')}`);
  want(!!p.og.image, 'warn', 8, 'og-image', 'no og:image: a shared link shows no picture');
  want(!!p.og.title && !!p.og.description, 'warn', 8, 'og', 'og:title or og:description missing');
  want(p.bytes <= 100 * 1024, 'warn', 8, 'size', `${Math.round(p.bytes / 1024)} KB of HTML (budget 100 KB)`);
  want(p.viewport, 'warn', 8, 'viewport', 'no <meta name="viewport">: Google indexes the phone view, and this page has none');
  want(!p.imgNoAlt, 'warn', 8, 'img-alt', `${p.imgNoAlt} <img> without alt: image search and screen readers get nothing (alt="" for decoration)`);
  /** @param {string} code @param {number} prop @param {string} msg */
  const tip = (code, prop, msg) => issues.push({ level: 'tip', prop, code, msg, url });
  for (const x of p.ld) if (x.ok) for (const m of richResults(x.value)) tip('rich-result', 6, m);
  const generic = [...new Set(p.anchors.filter((a) => !a.label && GENERIC.test(a.text)).map((a) => a.text))];
  if (generic.length) tip('anchor-text', 5, `links that say only ${generic.map((t) => `"${t}"`).join(', ')}: anchor text tells an engine what the target is about`);
  const origin = new URL(url).origin;
  /** @type {string[]} */
  const links = [];
  for (const a of p.anchors) {
    if (!a.href || /^(mailto|tel|javascript|data|sms|whatsapp):/i.test(a.href)) continue;
    try { const u = new URL(a.href, url); if (u.origin === origin) { u.hash = ''; links.push(u.href); } } catch { /* not a URL */ }
  }
  return {
    url, status: got.status, title: p.title, description: p.description, h1: p.h1, canonical: p.canonical, ld: p.ld.length,
    ogImage: p.og.image ? new URL(p.og.image, url).href : undefined, kb: Math.round(p.bytes / 1024), words: p.words, issues, checks,
    links: [...new Set(links)], alternates: p.alternates.map((a) => ({ hreflang: a.hreflang, href: new URL(a.href, url).href })),
  };
}

/** Every <loc> in a sitemap or sitemap index. @param {string} xml */
export const locsOf = (xml) => [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => decode(m[1] ?? ''));

/**
 * Pages that share a title or a description split one answer in two (common notion 1).
 * @param {PageReport[]} pages
 * @returns {Issue[]}
 */
export function duplicates(pages) {
  /** @type {Issue[]} */
  const out = [];
  for (const k of /** @type {const} */ (['title', 'description'])) {
    /** @type {Map<string, string[]>} */
    const by = new Map();
    for (const p of pages) if (p[k]) by.set(/** @type {string} */ (p[k]), [...(by.get(/** @type {string} */ (p[k])) ?? []), p.url]);
    for (const [v, urls] of by) if (urls.length > 1) out.push({ level: 'warn', prop: 5, code: `duplicate-${k}`, msg: `${urls.length} pages share the ${k} "${v.slice(0, 70)}": ${urls.map((u) => new URL(u).pathname).join(', ')}` });
  }
  return out;
}

/**
 * The audit: robots.txt, the sitemap, every page, every card image.
 * @param {string} target   an origin, or a sitemap URL
 * @param {{ fetch?: typeof fetch, limit?: number, concurrency?: number, log?: (s: string) => void, via?: string, linkLimit?: number, psi?: boolean, psiKey?: string }} [o]
 *   `via`: fetch through another origin (a local or staging server) while checking every URL as the target's,
 *   so a production canonical on a server running locally is still a self canonical.
 * @returns {Promise<Report>}
 */
export async function audit(target, o = {}) {
  const f = o.fetch ?? fetch;
  const ua = { 'user-agent': 'seo-audit/1 (packages/seo; +https://github.com/obiverse)' };
  const isMap = /\.xml(\?|$)/.test(target);
  const origin = new URL(target).origin;
  const via = o.via ? new URL(o.via).origin : undefined;
  const through = (/** @type {string} */ u) => (via && u.startsWith(`${origin}/`) ? via + u.slice(origin.length) : u);
  const get = (/** @type {string} */ u, manual = false) => f(through(u), { headers: ua, redirect: manual ? 'manual' : 'follow' });
  /** @type {Issue[]} */
  const site = [];
  /** @type {string | undefined} */
  let robots;
  try {
    const r = await get(`${origin}/robots.txt`);
    if (r.status === 200) robots = await r.text();
    else site.push({ level: 'error', prop: 4, code: 'robots', msg: `/robots.txt answers ${r.status}` });
  } catch (e) { site.push({ level: 'error', prop: 4, code: 'robots', msg: `/robots.txt: ${/** @type {Error} */ (e).message}` }); }
  const declared = robots ? [...robots.matchAll(/^\s*sitemap:\s*(\S+)/gim)].map((m) => m[1] ?? '') : [];
  if (robots && !declared.length) site.push({ level: 'warn', prop: 2, code: 'robots-sitemap', msg: 'robots.txt names no Sitemap' });
  const sitemap = isMap ? target : declared[0] ?? `${origin}/sitemap.xml`;
  /** @type {string[]} */
  let urls = [];
  try {
    const r = await get(sitemap);
    if (r.status !== 200) site.push({ level: 'error', prop: 2, code: 'sitemap', msg: `${sitemap} answers ${r.status}` });
    else {
      const xml = await r.text();
      urls = locsOf(xml);
      if (/<sitemapindex/i.test(xml)) {
        const kids = await Promise.all(urls.map(async (u) => locsOf(await (await get(u)).text())));
        urls = kids.flat();
      }
    }
  } catch (e) { site.push({ level: 'error', prop: 2, code: 'sitemap', msg: `${sitemap}: ${/** @type {Error} */ (e).message}` }); }
  if (!urls.length && !site.some((i) => i.code === 'sitemap')) site.push({ level: 'error', prop: 2, code: 'sitemap-empty', msg: 'the sitemap lists nothing' });
  const dupes = urls.filter((u, i) => urls.indexOf(u) !== i);
  if (dupes.length) site.push({ level: 'error', prop: 2, code: 'sitemap-duplicate', msg: `listed twice: ${[...new Set(dupes)].join(', ')}` });
  for (const u of urls) if (/[?#]/.test(u)) site.push({ level: 'warn', prop: 2, code: 'sitemap-variant', msg: `a query or fragment is a variant, not a page: ${u}` });
  try {
    const l = await get(`${origin}/llms.txt`);
    if (l.status !== 200) site.push({ level: 'warn', prop: 10, code: 'llms', msg: `/llms.txt answers ${l.status}` });
    else if (!/^# \S/.test(await l.text())) site.push({ level: 'warn', prop: 10, code: 'llms', msg: '/llms.txt does not open with an H1' });
  } catch { site.push({ level: 'warn', prop: 10, code: 'llms', msg: '/llms.txt could not be fetched' }); }

  const inSitemap = new Set(urls);
  const todo = [...inSitemap].slice(0, o.limit ?? 500);
  /** @type {PageReport[]} */
  const pages = new Array(todo.length);
  let next = 0;
  const worker = async () => {
    while (next < todo.length) {
      const i = next++;
      const url = /** @type {string} */ (todo[i]);
      try {
        const r = await get(url, true);
        const html = r.status === 200 ? await r.text() : '';
        pages[i] = checkPage(url, { status: r.status, location: r.headers.get('location') ?? undefined, robotsHeader: r.headers.get('x-robots-tag') ?? undefined, html }, { robots, inSitemap });
      } catch (e) {
        pages[i] = { url, status: 0, h1: 0, ld: 0, kb: 0, words: 0, checks: 1, issues: [{ level: 'error', prop: 1, code: 'fetch', msg: /** @type {Error} */ (e).message, url }] };
      }
      o.log?.(`${pages[i]?.status} ${url}`);
    }
  };
  await Promise.all(Array.from({ length: Math.min(o.concurrency ?? 6, todo.length) }, worker));

  // A card a chat cannot draw is no card (Prop. 8): each image once.
  /** @type {Map<string, string | undefined>} */
  const images = new Map();
  for (const img of new Set(pages.map((p) => p.ogImage).filter(Boolean))) {
    const u = /** @type {string} */ (img);
    try {
      const r = await get(u);
      const type = r.headers.get('content-type') ?? '';
      await r.arrayBuffer().catch(() => undefined);
      images.set(u, r.status === 200 && type.startsWith('image/') ? undefined : `og:image ${u} answers ${r.status} ${type}`);
    } catch (e) { images.set(u, `og:image ${u}: ${/** @type {Error} */ (e).message}`); }
  }
  for (const p of pages) {
    if (!p.ogImage) continue;
    p.checks++;
    const why = images.get(p.ogImage);
    if (why) p.issues.push({ level: 'error', prop: 8, code: 'og-image-broken', msg: why, url: p.url });
  }
  site.push(...duplicates(pages));
  site.push(...await linkGraph(pages, origin, get, o.linkLimit ?? 200, via ? (u) => f(u, { headers: ua, redirect: 'manual' }) : undefined));
  site.push(...hreflangPairs(pages));

  // A missing page must say so: a 200 there teaches the engine that any URL is a page (Prop. 1).
  try {
    const r = await get(`${origin}/seo-audit-probe-${Date.now().toString(36)}`, true);
    await r.arrayBuffer().catch(() => undefined);
    if (r.status === 200) site.push({ level: 'error', prop: 1, code: 'soft-404', msg: 'a page that does not exist answers 200, not 404' });
  } catch { /* the host is down; the pages say so */ }
  // One host, one scheme: http and the other www twin must redirect here (Prop. 2). Only the real host can say.
  if (!via) {
    const u = new URL(origin);
    const twins = [`http://${u.host}/`, ...(u.hostname.split('.').length === 2 ? [`${u.protocol}//www.${u.host}/`] : []), ...(u.hostname.startsWith('www.') ? [`${u.protocol}//${u.host.slice(4)}/`] : [])];
    for (const t of twins) {
      if (t === `${origin}/`) continue;
      try {
        const r = await f(t, { headers: ua, redirect: 'manual' });
        const loc = r.headers.get('location') ?? '';
        if (!(r.status >= 300 && r.status < 400 && new URL(loc, t).origin === origin)) site.push({ level: 'warn', prop: 2, code: 'host-twin', msg: `${t} answers ${r.status}${loc ? ` → ${loc}` : ''}, not a redirect to ${origin}` });
      } catch { /* no such host: nothing to split */ }
    }
  }
  if (o.psi) site.push(...await speed(pages.filter((p) => p.status === 200).map((p) => p.url), f, o.psiKey));

  const all = [...site, ...pages.flatMap((p) => p.issues)];
  const checks = pages.reduce((n, p) => n + p.checks, 0) + 6;
  const errors = all.filter((i) => i.level === 'error').length;
  const tips = all.filter((i) => i.level === 'tip').length;
  const warnings = all.length - errors - tips;
  const score = checks ? Math.max(0, Math.round(100 * (checks - 3 * errors - warnings / 2) / checks)) : 0;
  return { origin, sitemap, pages, site, score, errors, warnings, tips };
}

/**
 * The internal link graph (Prop. 2, 5): a page in the sitemap that no other page
 * links to is found only by the sitemap and ranks like it; a link that answers
 * 404 spends the reader and the crawler on nothing.
 * @param {PageReport[]} pages
 * @param {string} origin
 * @param {(u: string, manual?: boolean) => Promise<Response>} get
 * @param {number} limit   most link targets outside the sitemap to fetch
 * @param {(u: string) => Promise<Response>} [live]   under --via, a second opinion from the real host: another
 *   project can live under the same origin (GitHub Pages /repo/), which the local server cannot serve
 * @returns {Promise<Issue[]>}
 */
export async function linkGraph(pages, origin, get, limit, live) {
  /** @type {Issue[]} */
  const out = [];
  const listed = new Map(pages.map((p) => [p.url, p]));
  const norm = (/** @type {string} */ u) => u.replace(/\/index\.html?$/, '/');
  /** @type {Map<string, Set<string>>} */
  const into = new Map();
  for (const p of pages) for (const l of p.links ?? []) if (norm(l) !== norm(p.url)) into.set(norm(l), (into.get(norm(l)) ?? new Set()).add(p.url));
  const home = `${origin}/`;
  if (pages.length > 1) for (const p of pages) if (p.status === 200 && norm(p.url) !== home && !into.has(norm(p.url))) out.push({ level: 'warn', prop: 2, code: 'orphan', msg: 'no page in the sitemap links here', url: p.url });
  const known = new Set(pages.map((p) => norm(p.url)));
  const targets = [...into.keys()].filter((u) => !known.has(u) && !listed.has(u) && !/\.(png|jpe?g|webp|gif|svg|pdf|zip|apk|mp4|vcf|txt|xml|json|css|js)$/i.test(new URL(u).pathname)).slice(0, limit);
  await Promise.all(targets.map(async (u) => {
    try {
      let r = await get(u, true);
      await r.arrayBuffer().catch(() => undefined);
      if (r.status === 404 && live) { r = await live(u).catch(() => r); await r.arrayBuffer().catch(() => undefined); }
      const from = [...(into.get(u) ?? [])].map((x) => new URL(x).pathname).join(', ');
      const at = new URL(u).pathname + new URL(u).search;
      if (r.status >= 400) out.push({ level: 'error', prop: 1, code: 'broken-link', msg: `${at} answers ${r.status}; linked from ${from}` });
      else if (r.status >= 300) out.push({ level: 'tip', prop: 2, code: 'link-redirect', msg: `${at} redirects (${r.status}); link the final address. From ${from}` });
    } catch { /* unreachable: the pages report fetch errors */ }
  }));
  return out;
}

/**
 * hreflang is a pair or nothing: if A names B, B must name A (Prop. 9).
 * @param {PageReport[]} pages
 * @returns {Issue[]}
 */
export function hreflangPairs(pages) {
  const by = new Map(pages.map((p) => [p.url, p]));
  /** @type {Issue[]} */
  const out = [];
  for (const p of pages) for (const a of p.alternates ?? []) {
    if (a.href === p.url) continue;
    const back = by.get(a.href);
    if (back && !(back.alternates ?? []).some((x) => x.href === p.url)) out.push({ level: 'warn', prop: 9, code: 'hreflang-oneway', msg: `names ${a.href} (${a.hreflang}), which does not name it back`, url: p.url });
  }
  return out;
}

/**
 * Core Web Vitals from PageSpeed Insights (Prop. 8): the field data real
 * Chrome users report when Google has enough, the lab run when it does not.
 * Thresholds are Google's "good": LCP ≤ 2.5 s, CLS ≤ 0.1, INP ≤ 200 ms.
 * @param {string[]} urls
 * @param {typeof fetch} f
 * @param {string} [key]
 * @returns {Promise<Issue[]>}
 */
export async function speed(urls, f, key) {
  /** @type {Issue[]} */
  const out = [];
  for (const url of urls.slice(0, 25)) {
    try {
      const r = await f(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=performance${key ? `&key=${key}` : ''}`);
      if (r.status !== 200) { out.push({ level: 'tip', prop: 8, code: 'psi', msg: `PageSpeed Insights answered ${r.status}${r.status === 429 ? ' (rate limit: pass --psi-key)' : ''}`, url }); continue; }
      const j = /** @type {any} */ (await r.json());
      const field = j.loadingExperience?.metrics;
      if (field && j.loadingExperience?.overall_category) {
        const slow = Object.entries(field).filter(([, v]) => /** @type {any} */ (v).category && /** @type {any} */ (v).category !== 'FAST').map(([k, v]) => `${k.replace(/_MS$|_SCORE$/, '').toLowerCase()} ${/** @type {any} */ (v).percentile} (${/** @type {any} */ (v).category})`);
        if (slow.length) out.push({ level: 'warn', prop: 8, code: 'cwv-field', msg: `real users, phone, p75: ${slow.join(', ')}`, url });
      } else {
        const a = j.lighthouseResult?.audits ?? {};
        const lcp = a['largest-contentful-paint']?.numericValue, cls = a['cumulative-layout-shift']?.numericValue, tbt = a['total-blocking-time']?.numericValue;
        const bad = [lcp > 2500 && `LCP ${(lcp / 1000).toFixed(1)} s`, cls > 0.1 && `CLS ${cls.toFixed(2)}`, tbt > 200 && `TBT ${Math.round(tbt)} ms`].filter(Boolean);
        if (bad.length) out.push({ level: 'tip', prop: 8, code: 'cwv-lab', msg: `lab run, slow phone: ${bad.join(', ')} (no field data yet)`, url });
      }
    } catch (e) { out.push({ level: 'tip', prop: 8, code: 'psi', msg: `PageSpeed Insights: ${/** @type {Error} */ (e).message}`, url }); }
  }
  return out;
}

/** @param {string} s @param {number} n */
const cut = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s.padEnd(n));

/**
 * The report as a terminal table, then every issue.
 * @param {Report} r
 * @returns {string}
 */
export function formatReport(r) {
  const head = `${'st'.padEnd(4)}${'title'.padEnd(6)}${'desc'.padEnd(5)}h1 ${'canon'.padEnd(6)}ld ${'og'.padEnd(3)}${'KB'.padStart(4)} ${'words'.padStart(5)}  path`;
  const rows = r.pages.map((p) => {
    const u = new URL(p.url);
    const canon = !p.canonical ? '—' : new URL(p.canonical, p.url).href === p.url ? 'self' : 'other';
    return `${String(p.status).padEnd(4)}${String(p.title?.length ?? '—').padEnd(6)}${String(p.description?.length ?? '—').padEnd(5)}${String(p.h1).padEnd(3)}${canon.padEnd(6)}${String(p.ld).padEnd(3)}${(p.ogImage ? 'y' : '—').padEnd(3)}${String(p.kb).padStart(4)} ${String(p.words).padStart(5)}  ${cut(u.pathname + u.search, 60)}`;
  });
  const issues = [...r.site, ...r.pages.flatMap((p) => p.issues)];
  const line = (/** @type {Issue} */ i) => `${i.level === 'error' ? 'ERROR' : i.level === 'warn' ? 'warn ' : 'tip  '} P${i.prop} ${i.code.padEnd(18)} ${i.url ? `${new URL(i.url).pathname}: ` : ''}${i.msg}`;
  const lines = issues.filter((i) => i.level !== 'tip').map(line);
  /** @type {Map<string, Issue[]>} */
  const byTip = new Map();
  for (const i of issues.filter((x) => x.level === 'tip')) byTip.set(`${i.code} ${i.msg}`, [...(byTip.get(`${i.code} ${i.msg}`) ?? []), i]);
  const tips = [...byTip.values()].map((g) => (g.length === 1 ? line(/** @type {Issue} */ (g[0])) : `${line({ ...(/** @type {Issue} */ (g[0])), url: undefined })} (${g.length} pages)`));
  return `seo audit ${r.origin} (${r.sitemap}): ${r.pages.length} pages
${head}
${rows.join('\n')}

${lines.join('\n') || 'no issues'}
${tips.length ? `\nopportunities (not scored):\n${tips.join('\n')}\n` : ''}
hygiene ${r.score}/100 · ${r.errors} error${r.errors === 1 ? '' : 's'} · ${r.warnings} warning${r.warnings === 1 ? '' : 's'} · ${r.tips} opportunit${r.tips === 1 ? 'y' : 'ies'}
`;
}
