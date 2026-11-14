// @ts-check
// The Elements of Search, as code (docs/SEO-ELEMENTS.md). Data in, strings out:
// every function here is pure, has no dependency, and runs in Node ≥ 20 or a
// static-site build alike. `ping` is the one that touches the network, and only
// through the `fetch` it is handed.

/**
 * A schema.org node. its id may be written relative — `#org`, `/okada#game` —
 * and is made absolute against the site's origin, so one data file serves
 * production, staging and a test server without a find-and-replace.
 * @typedef {Record<string, unknown>} Thing
 */

/**
 * One step of a page's trail. `path` absent means the page itself.
 * @typedef {{ name: string, path?: string }} Crumb
 */

/**
 * One page: one intent, one address (Prop. 2, 5).
 * @typedef {Object} Page
 * @property {string} path              the canonical path, `/okada`
 * @property {string} title             the intent in the seeker's words, without the brand (Prop. 5)
 * @property {string} description       what the seeker gets, ~150 characters (Prop. 5)
 * @property {string} [fullTitle]       the whole <title>, when the template does not fit (the home page)
 * @property {string} [ogTitle]         the title on a shared card; `title` by default
 * @property {string} [lang]            BCP 47; the site's by default
 * @property {string} [locale]          og:locale, `fr_FR`; the site's by default
 * @property {string} [image]           og:image, a path or a URL; the site's by default
 * @property {string} [imageAlt]
 * @property {number} [imageWidth]
 * @property {number} [imageHeight]
 * @property {string} [ogType]          `website` by default
 * @property {string} [schemaType]      the page node's schema.org type: WebPage, AboutPage, CollectionPage…
 * @property {Record<string, string>} [alternates]  hreflang → path, the page itself included (Prop. 9)
 * @property {boolean} [noindex]        a door or a secret: never indexed, never in a sitemap
 * @property {string[]} [entities]      ids of `site.entities` this page is about; the first is its mainEntity
 * @property {Thing[]} [graph]           page-only nodes (an Article, a HowTo)
 * @property {Crumb[]} [crumbs]         the trail, home first, this page last
 * @property {string} [lastmod]         YYYY-MM-DD, the day the answer last changed (Prop. 3)
 * @property {string} [changefreq]
 * @property {string} [priority]
 * @property {boolean} [sitemap]        false keeps an indexable page out of the sitemap (an app shell)
 * @property {string} [query]           the search this page should win, in the seeker's words (Prop. 5); `seo lint` and `seo report` hold the page to it
 */

/**
 * A crawler named in robots.txt (Prop. 4).
 * @typedef {Object} Crawler
 * @property {string} agent             the product token robots.txt matches
 * @property {'search'|'answer'|'training'} family
 * @property {string} owner
 */

/**
 * @typedef {Object} LlmsLink
 * @property {string} [path]            a page of this site; title and note default to the page's own
 * @property {string} [url]             or anywhere else
 * @property {string} [title]
 * @property {string} [note]
 */

/**
 * @typedef {Object} Llms
 * @property {string} summary           the blockquote: what this is, in one or two sentences
 * @property {string} [about]           paragraphs under it, plain Markdown
 * @property {{ title: string, links: (string | LlmsLink)[] }[]} sections
 */

/**
 * The site, described once (Prop. 6, common notion 2).
 * @typedef {Object} Site
 * @property {string} origin            `https://kwataverse.com`, no trailing slash
 * @property {string} name              the brand, as it is written everywhere
 * @property {string} [titleTemplate]   `%s — kwataverse` by default
 * @property {string} [lang]            `en` by default
 * @property {string} [locale]          og:locale, e.g. `en_GB`
 * @property {string} [image]           the default card, a path or a URL
 * @property {string} [twitter]         the handle, with its at-sign
 * @property {Thing[]} [graph]           nodes on every page: the Organization, the WebSite
 * @property {Record<string, Thing>} [entities]  nodes on the pages that are about them: a game, an app
 * @property {Page[]} [pages]
 * @property {string[]} [private]       path prefixes never crawled, indexed or listed; `/g` means `/g` and `/g/…`, `/apk/` means everything under it
 * @property {Crawler[]} [crawlers]     named and let in; CRAWLERS by default
 * @property {string[]} [blocked]       product tokens shut out entirely
 * @property {string} [robotsNote]      the comment robots.txt opens with
 * @property {Llms} [llms]
 * @property {{ google?: string, bing?: string, yandex?: string }} [verify]  ownership tokens for Search Console, Bing Webmaster, Yandex; written on the home page
 * @property {{ name: string, url?: string, note?: string }[]} [presence]  the work no tag does (Prop. 7): each place the entity should be; `url` once it is there
 */

// ---- small things ----------------------------------------------------------

/** HTML-escape text or an attribute value. */
export const esc = (/** @type {unknown} */ s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** XML-escape a text node or an attribute. */
export const xmlEsc = (/** @type {unknown} */ s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

/**
 * JSON that is safe inside <script>: `</script>`, `<!--` and the two line
 * separators JavaScript once refused are all escaped, so no string in the data
 * can end the element or the statement.
 * @param {unknown} v
 */
export const scriptJson = (v) =>
  JSON.stringify(v).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

/**
 * A path or a URL, made absolute against the site.
 * @param {Site} site
 * @param {string} pathOrUrl
 */
export const abs = (site, pathOrUrl) =>
  /^https?:\/\//.test(pathOrUrl) ? pathOrUrl : site.origin.replace(/\/+$/, '') + (pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`);

/**
 * True for a path no engine should hold: a bearer secret, a door, an
 * interface for machines. A prefix ending in `/` covers everything under it;
 * any other covers itself and its children, so `/g` holds `/g/x` but not `/games`.
 * @param {Site} site
 * @param {string} path
 */
export function isPrivate(site, path) {
  const p = (path.split(/[?#]/)[0] ?? '') || '/';
  return (site.private ?? []).some((x) => (x.endsWith('/') ? p.startsWith(x) : p === x || p.startsWith(`${x}/`)));
}

/**
 * The <title>: the intent, then the brand (Prop. 5).
 * @param {Site} site
 * @param {Page} page
 */
export const titleOf = (site, page) =>
  page.fullTitle ?? (page.title === site.name ? site.name : (site.titleTemplate ?? `%s — ${site.name}`).replace('%s', page.title));

/** @param {Site} site @param {Page} page */
export const langOf = (site, page) => page.lang ?? site.lang ?? 'en';

// ---- the entity graph (Prop. 6) -------------------------------------------

const URL_KEYS = new Set(['@id', 'url', 'image', 'logo', 'item', 'contentUrl', 'thumbnailUrl', 'installUrl', 'downloadUrl', 'screenshot', 'mainEntityOfPage', 'target']);

/**
 * Every relative id and URL-valued field, made absolute.
 * @param {Site} site
 * @param {unknown} v
 * @param {string} [key]
 * @returns {unknown}
 */
function absolutize(site, v, key) {
  if (Array.isArray(v)) return v.map((x) => absolutize(site, x, key));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, absolutize(site, x, k)]));
  if (typeof v === 'string' && key && URL_KEYS.has(key)) {
    if (v.startsWith('#')) return `${site.origin}/${v}`;
    if (v.startsWith('/') && !v.startsWith('//')) return site.origin + v;
  }
  return v;
}

/** @param {Site} site @param {string} type */
const idOfType = (site, type) => {
  const n = (site.graph ?? []).find((x) => x['@type'] === type || (Array.isArray(x['@type']) && x['@type'].includes(type)));
  return typeof n?.['@id'] === 'string' ? /** @type {string} */ (absolutize(site, n['@id'], '@id')) : undefined;
};

/**
 * The page's graph: the site's own nodes, the page, the things it is about,
 * its trail. One graph, so a machine reads one connected description.
 * @param {Site} site
 * @param {Page} page
 * @returns {{ '@context': string, '@graph': Thing[] }}
 */
export function graph(site, page) {
  const url = abs(site, page.path);
  const ents = (page.entities ?? []).map((/** @type {string} */ id) => {
    const n = site.entities?.[id];
    if (!n) throw new Error(`seo: page ${page.path} names an entity "${id}" the site does not describe`);
    return n;
  });
  const refs = ents.map((/** @type {Thing} */ n) => ({ '@id': n['@id'] }));
  const crumbs = page.crumbs && page.crumbs.length > 1 ? page.crumbs : undefined;
  const website = idOfType(site, 'WebSite');
  const image = page.image ?? site.image;
  /** @type {Thing} */
  const webpage = {
    '@type': page.schemaType ?? 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: titleOf(site, page),
    description: page.description,
    inLanguage: langOf(site, page),
    ...(website ? { isPartOf: { '@id': website } } : {}),
    ...(image ? { primaryImageOfPage: { '@type': 'ImageObject', url: image } } : {}),
    ...(crumbs ? { breadcrumb: { '@id': `${url}#breadcrumb` } } : {}),
    ...(refs.length ? { mainEntity: refs[0], about: refs } : {}),
    ...(page.lastmod ? { dateModified: page.lastmod } : {}),
  };
  /** @type {Thing[]} */
  const nodes = [...(site.graph ?? []), webpage, ...ents, ...(page.graph ?? [])];
  if (crumbs) {
    nodes.push({
      '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`,
      itemListElement: crumbs.map((/** @type {Crumb} */ c, /** @type {number} */ i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.path ?? page.path })),
    });
  }
  return { '@context': 'https://schema.org', '@graph': /** @type {Thing[]} */ (absolutize(site, nodes)) };
}

// ---- the head (Props. 1, 2, 5, 6, 8, 9) -----------------------------------

const LOCALES = /** @type {Record<string, string>} */ ({ en: 'en_GB', fr: 'fr_FR', pt: 'pt_PT', ar: 'ar_AR', sw: 'sw_KE', ha: 'ha_NG', yo: 'yo_NG', ig: 'ig_NG' });

/**
 * Every head tag a page needs to be found, understood and shared: title,
 * description, canonical, hreflang, robots, Open Graph, the Twitter card and
 * one JSON-LD graph. The caller writes `<html lang>` (langOf) and the rest of
 * its own head.
 * @param {Site} site
 * @param {Page} page
 * @returns {string}
 */
export function head(site, page) {
  const m = meta(site, page);
  /** @param {string} p @param {unknown} c */
  const og = (p, c) => `<meta property="${p}" content="${esc(c)}">`;
  /** @param {string} n @param {unknown} c */
  const nm = (n, c) => `<meta name="${n}" content="${esc(c)}">`;
  const tags = [
    `<title>${esc(m.title)}</title>`,
    nm('description', m.description),
    `<link rel="canonical" href="${esc(m.url)}">`,
    ...Object.entries(m.alternates).map(([hl, u]) => `<link rel="alternate" hreflang="${esc(hl)}" href="${esc(u)}">`),
    nm('robots', m.robots),
    ...Object.entries(m.verify).map(([n, c]) => nm(n, c)),
    og('og:type', m.ogType),
    og('og:site_name', site.name),
    og('og:title', m.card),
    og('og:description', m.description),
    og('og:url', m.url),
    ...(m.locale ? [og('og:locale', m.locale)] : []),
    ...m.localeAlternates.map((l) => og('og:locale:alternate', l)),
    ...(m.image ? [og('og:image', m.image.url)] : []),
    ...(m.image?.alt ? [og('og:image:alt', m.image.alt)] : []),
    ...(m.image?.width ? [og('og:image:width', m.image.width)] : []),
    ...(m.image?.height ? [og('og:image:height', m.image.height)] : []),
    nm('twitter:card', m.image ? 'summary_large_image' : 'summary'),
    ...(site.twitter ? [nm('twitter:site', site.twitter)] : []),
    nm('twitter:title', m.card),
    nm('twitter:description', m.description),
    ...(m.image ? [nm('twitter:image', m.image.url)] : []),
    ...(m.jsonld ? [`<script type="application/ld+json">${scriptJson(m.jsonld)}</script>`] : []),
  ];
  return tags.join('\n');
}

const VERIFY = /** @type {const} */ ({ google: 'google-site-verification', bing: 'msvalidate.01', yandex: 'yandex-verification' });

/**
 * Everything a page says about itself, as data: what head() writes as tags and
 * nextMetadata() hands to Next, from one place so the two cannot drift.
 * @param {Site} site
 * @param {Page} page
 */
export function meta(site, page) {
  const lang = langOf(site, page);
  const imageRaw = page.image ?? site.image;
  const alts = Object.entries(page.alternates ?? {});
  return {
    url: abs(site, page.path),
    title: titleOf(site, page),
    card: page.ogTitle ?? page.title,
    description: page.description,
    lang,
    robots: page.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large',
    alternates: Object.fromEntries(alts.map(([hl, p]) => [hl, abs(site, p)])),
    /** @type {Record<string, string>} */
    verify: page.path === '/' ? Object.fromEntries(Object.entries(site.verify ?? {}).map(([k, v]) => [VERIFY[/** @type {keyof typeof VERIFY} */ (k)] ?? k, v])) : {},
    ogType: page.ogType ?? 'website',
    locale: page.locale ?? (page.lang ? LOCALES[page.lang] : site.locale) ?? LOCALES[lang],
    localeAlternates: alts.filter(([hl]) => hl !== 'x-default' && hl !== lang).map(([hl]) => LOCALES[hl] ?? '').filter(Boolean),
    image: imageRaw ? { url: abs(site, imageRaw), alt: page.imageAlt, width: page.imageWidth, height: page.imageHeight } : undefined,
    jsonld: page.noindex ? undefined : graph(site, page),
  };
}

/**
 * The same page as Next's `Metadata` (app router), without importing Next:
 * `export const metadata = nextMetadata(SITE, pageAt('/x/'))`. The JSON-LD is
 * not part of Metadata; render `meta(site, page).jsonld` in a <script>.
 * @param {Site} site
 * @param {Page} page
 */
export function nextMetadata(site, page) {
  const m = meta(site, page);
  return {
    title: { absolute: m.title },
    description: m.description,
    alternates: { canonical: m.url, ...(Object.keys(m.alternates).length ? { languages: m.alternates } : {}) },
    robots: page.noindex ? { index: false, follow: false } : { index: true, follow: true, 'max-image-preview': /** @type {const} */ ('large') },
    ...(Object.keys(m.verify).length ? { other: m.verify } : {}),
    openGraph: {
      type: m.ogType === 'article' ? /** @type {const} */ ('article') : /** @type {const} */ ('website'),
      siteName: site.name, url: m.url, title: m.card, description: m.description,
      ...(m.locale ? { locale: m.locale } : {}),
      ...(m.localeAlternates.length ? { alternateLocale: m.localeAlternates } : {}),
      ...(m.image ? { images: [{ url: m.image.url, width: m.image.width, height: m.image.height, alt: m.image.alt }] } : {}),
    },
    twitter: { card: m.image ? 'summary_large_image' : 'summary', title: m.card, description: m.description, ...(m.image ? { images: [m.image.url] } : {}), ...(site.twitter ? { site: site.twitter } : {}) },
  };
}

/** Words of a query worth finding in a title: 3+ letters, no stopwords, a plural's s dropped. @param {string} s */
export const terms = (s) => (s.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) ?? []).filter((w) => !['the', 'and', 'for', 'with', 'your', 'les', 'des', 'pour', 'avec'].includes(w)).map((w) => (w.length > 4 ? w.replace(/s$/, '') : w));

/**
 * The description itself, checked before anything is served (Prop. 5, 6):
 * lengths, duplicates, a target query the title does not carry, an entity no
 * page names. Same issue shape as the audit.
 * @param {Site} site
 * @returns {{ level: 'error' | 'warn' | 'tip', prop: number, code: string, msg: string, url?: string }[]}
 */
export function lint(site) {
  /** @type {ReturnType<typeof lint>} */
  const out = [];
  const pages = site.pages ?? [];
  const seen = new Map();
  for (const p of pages) {
    const url = abs(site, p.path);
    const t = titleOf(site, p);
    if (p.description.length < 70 || p.description.length > 170) out.push({ level: 'warn', prop: 5, code: 'description-length', msg: `description is ${p.description.length} characters (70–170)`, url });
    if (p.title.length > 62 && !p.fullTitle) out.push({ level: 'warn', prop: 5, code: 'title-long', msg: `title is ${p.title.length} characters before the brand (~60)`, url });
    for (const k of /** @type {const} */ (['title', 'description'])) {
      const v = k === 'title' ? t : p.description;
      if (seen.has(`${k}:${v}`)) out.push({ level: 'warn', prop: 5, code: `duplicate-${k}`, msg: `same ${k} as ${seen.get(`${k}:${v}`)}`, url });
      else seen.set(`${k}:${v}`, p.path);
    }
    if (p.query && !p.noindex) {
      const want = terms(p.query);
      const have = new Set(terms(`${t} ${p.description}`));
      const missing = want.filter((w) => !have.has(w));
      if (missing.length > want.length / 2) out.push({ level: 'warn', prop: 5, code: 'query-missing', msg: `target "${p.query}": the title and description do not say ${missing.join(', ')}`, url });
    } else if (!p.noindex && p.sitemap !== false) out.push({ level: 'tip', prop: 5, code: 'query', msg: 'no target query: which search should this page win?', url });
  }
  const named = new Set(pages.flatMap((p) => p.entities ?? []));
  for (const id of Object.keys(site.entities ?? {})) if (!named.has(id)) out.push({ level: 'tip', prop: 6, code: 'entity-unused', msg: `entity "${id}" is on no page` });
  for (const p of site.presence ?? []) if (!p.url) out.push({ level: 'tip', prop: 7, code: 'presence', msg: `not yet: ${p.name}${p.note ? ` (${p.note})` : ''}` });
  return out;
}

// ---- robots.txt (Prop. 4) --------------------------------------------------

/**
 * Who is let in by name, and why. A crawler that can send a seeker to us is
 * welcome: the indexes, the answer engines that fetch for a person, and the
 * training crawlers, because a model that learned about us can name us to
 * someone who never searched (docs/SEO-ELEMENTS.md Prop. 4). Naming them is
 * not needed for `*` to admit them; it is there so that a later blanket rule
 * cannot shut one out by accident, and so the policy can be read.
 * @type {Crawler[]}
 */
export const CRAWLERS = [
  { agent: 'Googlebot', family: 'search', owner: 'Google' },
  { agent: 'Bingbot', family: 'search', owner: 'Microsoft (also DuckDuckGo, Yahoo, Ecosia, ChatGPT search)' },
  { agent: 'Applebot', family: 'search', owner: 'Apple (Spotlight, Siri, Safari)' },
  { agent: 'Yandex', family: 'search', owner: 'Yandex' },
  { agent: 'DuckDuckBot', family: 'search', owner: 'DuckDuckGo' },
  { agent: 'Baiduspider', family: 'search', owner: 'Baidu' },
  { agent: 'Yeti', family: 'search', owner: 'Naver' },
  { agent: 'SeznamBot', family: 'search', owner: 'Seznam' },
  { agent: 'PetalBot', family: 'search', owner: 'Huawei Petal Search (the default on Huawei phones, common in Africa)' },
  { agent: 'OAI-SearchBot', family: 'answer', owner: 'OpenAI, ChatGPT search' },
  { agent: 'ChatGPT-User', family: 'answer', owner: 'OpenAI, a fetch for a person' },
  { agent: 'PerplexityBot', family: 'answer', owner: 'Perplexity' },
  { agent: 'Perplexity-User', family: 'answer', owner: 'Perplexity, a fetch for a person' },
  { agent: 'Claude-SearchBot', family: 'answer', owner: 'Anthropic, Claude search' },
  { agent: 'Claude-User', family: 'answer', owner: 'Anthropic, a fetch for a person' },
  { agent: 'DuckAssistBot', family: 'answer', owner: 'DuckDuckGo answers' },
  { agent: 'MistralAI-User', family: 'answer', owner: 'Mistral Le Chat, a fetch for a person' },
  { agent: 'Amazonbot', family: 'answer', owner: 'Amazon (Alexa, Rufus)' },
  { agent: 'GPTBot', family: 'training', owner: 'OpenAI' },
  { agent: 'ClaudeBot', family: 'training', owner: 'Anthropic' },
  { agent: 'Google-Extended', family: 'training', owner: 'Google Gemini (a token, not a fetcher)' },
  { agent: 'Applebot-Extended', family: 'training', owner: 'Apple Intelligence (a token, not a fetcher)' },
  { agent: 'CCBot', family: 'training', owner: 'Common Crawl, the open corpus most models start from' },
  { agent: 'Meta-ExternalAgent', family: 'training', owner: 'Meta AI' },
  { agent: 'Bytespider', family: 'training', owner: 'ByteDance (Doubao, TikTok search)' },
];

/**
 * The Disallow lines for one private prefix. robots.txt matches by prefix, so
 * `Disallow: /g` would also shut `/games`; a prefix without a trailing slash
 * is written as itself (`$`), its children (`/`) and its queries (`?`).
 * @param {string} p
 */
const disallowsFor = (p) => (p.endsWith('/') ? [p] : [`${p}$`, `${p}/`, `${p}?`]).map((x) => `Disallow: ${x}`);

/**
 * robots.txt: every named crawler and everyone else let in, the private
 * prefixes shut to all of them, the blocked shut out, and the sitemap.
 * @param {Site} site
 * @returns {string}
 */
export function robotsTxt(site) {
  const crawlers = site.crawlers ?? CRAWLERS;
  const rules = ['Allow: /', ...(site.private ?? []).flatMap(disallowsFor)].join('\n');
  const fam = /** @param {Crawler['family']} f */ (f) => crawlers.filter((c) => c.family === f).map((c) => c.agent).join(', ');
  const note = (site.robotsNote ?? `${site.name}: written by packages/seo from one description of the site.`).split('\n').map((l) => `# ${l}`).join('\n');
  const named = crawlers.length
    ? `# Let in by name (docs/SEO-ELEMENTS.md Prop. 4). Search: ${fam('search')}.
# Answer engines: ${fam('answer')}.
# Training: ${fam('training')}.
${crawlers.map((c) => `User-agent: ${c.agent}`).join('\n')}
${rules}

`
    : '';
  const blocked = (site.blocked ?? []).map((a) => `User-agent: ${a}\nDisallow: /\n\n`).join('');
  return `${note}

${named}${blocked}User-agent: *
${rules}

Sitemap: ${abs(site, '/sitemap.xml')}
`;
}

/**
 * Would this robots.txt let `agent` fetch `path`? RFC 9309: the group naming
 * the agent, else `*`; the longest matching rule wins, Allow on a tie; `*` and
 * `$` as Google and Bing read them. For checking our own file, not for crawling.
 * @param {string} txt
 * @param {string} agent
 * @param {string} path
 */
export function robotsAllows(txt, agent, path) {
  /** @type {{ agents: string[], rules: [boolean, string][] }[]} */
  const groups = [];
  let open = false;
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim();
    const m = /^([A-Za-z-]+)\s*:\s*(.*)$/.exec(line);
    if (!m) continue;
    const k = (m[1] ?? '').toLowerCase(), v = (m[2] ?? '').trim();
    if (k === 'user-agent') {
      if (!open) groups.push({ agents: [], rules: [] });
      groups[groups.length - 1]?.agents.push(v.toLowerCase());
      open = true;
    } else if (k === 'allow' || k === 'disallow') {
      open = false;
      if (v) groups[groups.length - 1]?.rules.push([k === 'allow', v]);
    } else open = false;
  }
  const a = agent.toLowerCase();
  let mine = groups.filter((g) => g.agents.includes(a));
  if (!mine.length) mine = groups.filter((g) => g.agents.includes('*'));
  /** @param {string} pat */
  const matches = (pat) => {
    const end = pat.endsWith('$');
    const body = (end ? pat.slice(0, -1) : pat).replace(/[.+?^{}()|[\]\\$]/g, '\\$&').replace(/\*/g, '.*');
    return new RegExp(`^${body}${end ? '$' : ''}`).test(path);
  };
  let best = -1, allow = true;
  for (const [ok, pat] of mine.flatMap((g) => g.rules)) {
    if (!matches(pat)) continue;
    if (pat.length > best || (pat.length === best && ok)) { best = pat.length; allow = ok; }
  }
  return allow;
}

// ---- sitemap.xml (Props. 2, 3, 9) -----------------------------------------

/**
 * @typedef {Object} SitemapUrl
 * @property {string} loc                a path or a URL on this site
 * @property {string | Date} [lastmod]
 * @property {Record<string, string>} [alternates]  hreflang → path
 * @property {string} [changefreq]
 * @property {string} [priority]
 */

/** @param {string | Date | undefined} d */
const dayOf = (d) => {
  if (!d) return undefined;
  if (d instanceof Date) return Number.isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:\d{2}))?$/.test(d) ? d : undefined;
};

/**
 * Why a URL may not be in a sitemap, or undefined when it may.
 * @param {Site} site
 * @param {string} loc
 */
export function sitemapRefusal(site, loc) {
  const url = abs(site, loc);
  let u;
  try { u = new URL(url); } catch { return 'not a URL'; }
  if (u.origin !== new URL(site.origin).origin) return 'another origin';
  if (u.search || u.hash || url.includes('#') || url.includes('?')) return 'a query or fragment is a variant, not a page';
  if (isPrivate(site, u.pathname)) return 'private';
  return undefined;
}

/**
 * The sitemap: canonical addresses only, with the day each changed and its
 * other-language twins. A private path, a query, a fragment or another origin
 * is refused rather than escaped: a secret must not be one typo from shipping.
 * @param {Site} site
 * @param {SitemapUrl[]} urls
 * @returns {string}
 */
export function sitemapXml(site, urls) {
  const seen = new Set();
  const rows = [];
  let hasAlt = false;
  for (const u of urls) {
    if (sitemapRefusal(site, u.loc)) continue;
    const loc = abs(site, u.loc);
    if (seen.has(loc)) continue;
    seen.add(loc);
    const lm = dayOf(u.lastmod);
    const alts = Object.entries(u.alternates ?? {});
    if (alts.length) hasAlt = true;
    rows.push(`  <url><loc>${xmlEsc(loc)}</loc>${lm ? `<lastmod>${lm}</lastmod>` : ''}${u.changefreq ? `<changefreq>${xmlEsc(u.changefreq)}</changefreq>` : ''}${u.priority ? `<priority>${xmlEsc(u.priority)}</priority>` : ''}${alts.map(([hl, p]) => `<xhtml:link rel="alternate" hreflang="${xmlEsc(hl)}" href="${xmlEsc(abs(site, p))}"/>`).join('')}</url>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${hasAlt ? ' xmlns:xhtml="http://www.w3.org/1999/xhtml"' : ''}>
${rows.join('\n')}
</urlset>
`;
}

/**
 * The site's own pages as sitemap rows: indexable ones, minus any kept out.
 * @param {Site} site
 * @returns {SitemapUrl[]}
 */
export const pageUrls = (site) =>
  (site.pages ?? []).filter((p) => !p.noindex && p.sitemap !== false).map((p) => ({
    loc: p.path,
    ...(p.lastmod ? { lastmod: p.lastmod } : {}),
    ...(p.alternates ? { alternates: p.alternates } : {}),
    ...(p.changefreq ? { changefreq: p.changefreq } : {}),
    ...(p.priority ? { priority: p.priority } : {}),
  }));

// ---- llms.txt (Prop. 10) ---------------------------------------------------

/**
 * /llms.txt in the llmstxt.org shape: an H1 with the name, a blockquote that
 * says what this is, plain paragraphs, then H2 sections of `- [title](url): note`.
 * @param {Site} site
 * @returns {string}
 */
export function llmsTxt(site) {
  const l = site.llms;
  if (!l) throw new Error('seo: site.llms is not described');
  const md = (/** @type {string} */ s) => s.replace(/([[\]])/g, '\\$1');
  const line = (/** @type {string | LlmsLink} */ x) => {
    const link = typeof x === 'string' ? { path: x } : x;
    const page = link.path ? (site.pages ?? []).find((p) => p.path === link.path) : undefined;
    const url = link.url ?? abs(site, link.path ?? '/');
    const title = link.title ?? page?.title ?? url;
    const note = link.note ?? page?.description;
    return `- [${md(title)}](${url})${note ? `: ${note}` : ''}`;
  };
  return `# ${site.name}

> ${l.summary.replace(/\n+/g, ' ')}
${l.about ? `\n${l.about.trim()}\n` : ''}
${l.sections.map((s) => `## ${s.title}\n\n${s.links.map(line).join('\n')}\n`).join('\n')}`;
}

// ---- IndexNow (Prop. 3) ----------------------------------------------------

export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

/**
 * The key, checked: 8–128 of a-z, A-Z, 0-9 and `-`. It is served as the
 * whole body of `/<key>.txt`; it is public by design, it proves only that
 * whoever pings controls the site.
 * @param {string} key
 * @returns {string}
 */
export function indexNowKey(key) {
  if (!/^[A-Za-z0-9-]{8,128}$/.test(key)) throw new Error('seo: an IndexNow key is 8–128 characters of a-z, A-Z, 0-9 and -');
  return key;
}

/**
 * The POST body for one host: absolute URLs on that host only, 10,000 at most.
 * @param {string} origin
 * @param {string} key
 * @param {string[]} urls
 */
export function indexNowBody(origin, key, urls) {
  const host = new URL(origin).host;
  const list = [...new Set(urls.map((u) => new URL(u, origin).href))].filter((u) => new URL(u).host === host).slice(0, 10_000);
  return { host, key: indexNowKey(key), keyLocation: `${new URL(origin).origin}/${key}.txt`, urlList: list };
}

/**
 * Tell the engines these URLs changed: one POST reaches Bing, Yandex, Naver,
 * Seznam and Yep. 200 and 202 are success; 403 means the key file is not
 * where `keyLocation` says; 422 means a URL is not on the host.
 * @param {string} origin
 * @param {string} key
 * @param {string[]} urls
 * @param {{ fetch?: typeof fetch, endpoint?: string }} [o]
 * @returns {Promise<{ status: number, ok: boolean, sent: number }>}
 */
export async function ping(origin, key, urls, o = {}) {
  const body = indexNowBody(origin, key, urls);
  if (!body.urlList.length) return { status: 0, ok: false, sent: 0 };
  const f = o.fetch ?? fetch;
  const r = await f(o.endpoint ?? INDEXNOW_ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify(body) });
  return { status: r.status, ok: r.status === 200 || r.status === 202, sent: body.urlList.length };
}
