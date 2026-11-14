/**
 * True for a path no engine should hold: a bearer secret, a door, an
 * interface for machines. A prefix ending in `/` covers everything under it;
 * any other covers itself and its children, so `/g` holds `/g/x` but not `/games`.
 * @param {Site} site
 * @param {string} path
 */
export function isPrivate(site: Site, path: string): boolean;
/**
 * The page's graph: the site's own nodes, the page, the things it is about,
 * its trail. One graph, so a machine reads one connected description.
 * @param {Site} site
 * @param {Page} page
 * @returns {{ '@context': string, '@graph': Thing[] }}
 */
export function graph(site: Site, page: Page): {
    "@context": string;
    "@graph": Thing[];
};
/**
 * Every head tag a page needs to be found, understood and shared: title,
 * description, canonical, hreflang, robots, Open Graph, the Twitter card and
 * one JSON-LD graph. The caller writes `<html lang>` (langOf) and the rest of
 * its own head.
 * @param {Site} site
 * @param {Page} page
 * @returns {string}
 */
export function head(site: Site, page: Page): string;
/**
 * Everything a page says about itself, as data: what head() writes as tags and
 * nextMetadata() hands to Next, from one place so the two cannot drift.
 * @param {Site} site
 * @param {Page} page
 */
export function meta(site: Site, page: Page): {
    url: string;
    title: string;
    card: string;
    description: string;
    lang: string;
    robots: string;
    alternates: {
        [k: string]: string;
    };
    /** @type {Record<string, string>} */
    verify: Record<string, string>;
    ogType: string;
    locale: string;
    localeAlternates: string[];
    image: {
        url: string;
        alt: string | undefined;
        width: number | undefined;
        height: number | undefined;
    } | undefined;
    jsonld: {
        '@context': string;
        '@graph': Thing[];
    } | undefined;
};
/**
 * The same page as Next's `Metadata` (app router), without importing Next:
 * `export const metadata = nextMetadata(SITE, pageAt('/x/'))`. The JSON-LD is
 * not part of Metadata; render `meta(site, page).jsonld` in a <script>.
 * @param {Site} site
 * @param {Page} page
 */
export function nextMetadata(site: Site, page: Page): {
    openGraph: {
        images?: {
            url: string;
            width: number | undefined;
            height: number | undefined;
            alt: string | undefined;
        }[] | undefined;
        alternateLocale?: string[] | undefined;
        locale?: string | undefined;
        type: "website" | "article";
        siteName: string;
        url: string;
        title: string;
        description: string;
    };
    twitter: {
        site?: string | undefined;
        images?: string[] | undefined;
        card: string;
        title: string;
        description: string;
    };
    other?: Record<string, string> | undefined;
    title: {
        absolute: string;
    };
    description: string;
    alternates: {
        languages?: {
            [k: string]: string;
        } | undefined;
        canonical: string;
    };
    robots: {
        index: boolean;
        follow: boolean;
        'max-image-preview'?: undefined;
    } | {
        index: boolean;
        follow: boolean;
        'max-image-preview': "large";
    };
};
/**
 * The description itself, checked before anything is served (Prop. 5, 6):
 * lengths, duplicates, a target query the title does not carry, an entity no
 * page names. Same issue shape as the audit.
 * @param {Site} site
 * @returns {{ level: 'error' | 'warn' | 'tip', prop: number, code: string, msg: string, url?: string }[]}
 */
export function lint(site: Site): {
    level: "error" | "warn" | "tip";
    prop: number;
    code: string;
    msg: string;
    url?: string;
}[];
/**
 * robots.txt: every named crawler and everyone else let in, the private
 * prefixes shut to all of them, the blocked shut out, and the sitemap.
 * @param {Site} site
 * @returns {string}
 */
export function robotsTxt(site: Site): string;
/**
 * Would this robots.txt let `agent` fetch `path`? RFC 9309: the group naming
 * the agent, else `*`; the longest matching rule wins, Allow on a tie; `*` and
 * `$` as Google and Bing read them. For checking our own file, not for crawling.
 * @param {string} txt
 * @param {string} agent
 * @param {string} path
 */
export function robotsAllows(txt: string, agent: string, path: string): boolean;
/**
 * Why a URL may not be in a sitemap, or undefined when it may.
 * @param {Site} site
 * @param {string} loc
 */
export function sitemapRefusal(site: Site, loc: string): "not a URL" | "another origin" | "a query or fragment is a variant, not a page" | "private" | undefined;
/**
 * The sitemap: canonical addresses only, with the day each changed and its
 * other-language twins. A private path, a query, a fragment or another origin
 * is refused rather than escaped: a secret must not be one typo from shipping.
 * @param {Site} site
 * @param {SitemapUrl[]} urls
 * @returns {string}
 */
export function sitemapXml(site: Site, urls: SitemapUrl[]): string;
/**
 * /llms.txt in the llmstxt.org shape: an H1 with the name, a blockquote that
 * says what this is, plain paragraphs, then H2 sections of `- [title](url): note`.
 * @param {Site} site
 * @returns {string}
 */
export function llmsTxt(site: Site): string;
/**
 * The key, checked: 8–128 of a-z, A-Z, 0-9 and `-`. It is served as the
 * whole body of `/<key>.txt`; it is public by design, it proves only that
 * whoever pings controls the site.
 * @param {string} key
 * @returns {string}
 */
export function indexNowKey(key: string): string;
/**
 * The POST body for one host: absolute URLs on that host only, 10,000 at most.
 * @param {string} origin
 * @param {string} key
 * @param {string[]} urls
 */
export function indexNowBody(origin: string, key: string, urls: string[]): {
    host: string;
    key: string;
    keyLocation: string;
    urlList: string[];
};
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
export function ping(origin: string, key: string, urls: string[], o?: {
    fetch?: typeof fetch;
    endpoint?: string;
} | undefined): Promise<{
    status: number;
    ok: boolean;
    sent: number;
}>;
export function esc(s: unknown): string;
export function xmlEsc(s: unknown): string;
export function scriptJson(v: unknown): string;
export function abs(site: Site, pathOrUrl: string): string;
export function titleOf(site: Site, page: Page): string;
export function langOf(site: Site, page: Page): string;
export function terms(s: string): string[];
/**
 * Who is let in by name, and why. A crawler that can send a seeker to us is
 * welcome: the indexes, the answer engines that fetch for a person, and the
 * training crawlers, because a model that learned about us can name us to
 * someone who never searched (docs/SEO-ELEMENTS.md Prop. 4). Naming them is
 * not needed for `*` to admit them; it is there so that a later blanket rule
 * cannot shut one out by accident, and so the policy can be read.
 * @type {Crawler[]}
 */
export const CRAWLERS: Crawler[];
export function pageUrls(site: Site): SitemapUrl[];
export const INDEXNOW_ENDPOINT: "https://api.indexnow.org/indexnow";
/**
 * A schema.org node. its id may be written relative — `#org`, `/okada#game` —
 * and is made absolute against the site's origin, so one data file serves
 * production, staging and a test server without a find-and-replace.
 */
export type Thing = Record<string, unknown>;
/**
 * One step of a page's trail. `path` absent means the page itself.
 */
export type Crumb = {
    name: string;
    path?: string;
};
/**
 * One page: one intent, one address (Prop. 2, 5).
 */
export type Page = {
    /**
     * the canonical path, `/okada`
     */
    path: string;
    /**
     * the intent in the seeker's words, without the brand (Prop. 5)
     */
    title: string;
    /**
     * what the seeker gets, ~150 characters (Prop. 5)
     */
    description: string;
    /**
     * the whole <title>, when the template does not fit (the home page)
     */
    fullTitle?: string | undefined;
    /**
     * the title on a shared card; `title` by default
     */
    ogTitle?: string | undefined;
    /**
     * BCP 47; the site's by default
     */
    lang?: string | undefined;
    /**
     * og:locale, `fr_FR`; the site's by default
     */
    locale?: string | undefined;
    /**
     * og:image, a path or a URL; the site's by default
     */
    image?: string | undefined;
    imageAlt?: string | undefined;
    imageWidth?: number | undefined;
    imageHeight?: number | undefined;
    /**
     * `website` by default
     */
    ogType?: string | undefined;
    /**
     * the page node's schema.org type: WebPage, AboutPage, CollectionPage…
     */
    schemaType?: string | undefined;
    /**
     * hreflang → path, the page itself included (Prop. 9)
     */
    alternates?: Record<string, string> | undefined;
    /**
     * a door or a secret: never indexed, never in a sitemap
     */
    noindex?: boolean | undefined;
    /**
     * ids of `site.entities` this page is about; the first is its mainEntity
     */
    entities?: string[] | undefined;
    /**
     * page-only nodes (an Article, a HowTo)
     */
    graph?: Thing[] | undefined;
    /**
     * the trail, home first, this page last
     */
    crumbs?: Crumb[] | undefined;
    /**
     * YYYY-MM-DD, the day the answer last changed (Prop. 3)
     */
    lastmod?: string | undefined;
    changefreq?: string | undefined;
    priority?: string | undefined;
    /**
     * false keeps an indexable page out of the sitemap (an app shell)
     */
    sitemap?: boolean | undefined;
    /**
     * the search this page should win, in the seeker's words (Prop. 5); `seo lint` and `seo report` hold the page to it
     */
    query?: string | undefined;
};
/**
 * A crawler named in robots.txt (Prop. 4).
 */
export type Crawler = {
    /**
     * the product token robots.txt matches
     */
    agent: string;
    family: "search" | "answer" | "training";
    owner: string;
};
export type LlmsLink = {
    /**
     * a page of this site; title and note default to the page's own
     */
    path?: string | undefined;
    /**
     * or anywhere else
     */
    url?: string | undefined;
    title?: string | undefined;
    note?: string | undefined;
};
export type Llms = {
    /**
     * the blockquote: what this is, in one or two sentences
     */
    summary: string;
    /**
     * paragraphs under it, plain Markdown
     */
    about?: string | undefined;
    sections: {
        title: string;
        links: (string | LlmsLink)[];
    }[];
};
/**
 * The site, described once (Prop. 6, common notion 2).
 */
export type Site = {
    /**
     * `https://kwataverse.com`, no trailing slash
     */
    origin: string;
    /**
     * the brand, as it is written everywhere
     */
    name: string;
    /**
     * `%s — kwataverse` by default
     */
    titleTemplate?: string | undefined;
    /**
     * `en` by default
     */
    lang?: string | undefined;
    /**
     * og:locale, e.g. `en_GB`
     */
    locale?: string | undefined;
    /**
     * the default card, a path or a URL
     */
    image?: string | undefined;
    /**
     * the handle, with its at-sign
     */
    twitter?: string | undefined;
    /**
     * nodes on every page: the Organization, the WebSite
     */
    graph?: Thing[] | undefined;
    /**
     * nodes on the pages that are about them: a game, an app
     */
    entities?: Record<string, Thing> | undefined;
    pages?: Page[] | undefined;
    /**
     * path prefixes never crawled, indexed or listed; `/g` means `/g` and `/g/…`, `/apk/` means everything under it
     */
    private?: string[] | undefined;
    /**
     * named and let in; CRAWLERS by default
     */
    crawlers?: Crawler[] | undefined;
    /**
     * product tokens shut out entirely
     */
    blocked?: string[] | undefined;
    /**
     * the comment robots.txt opens with
     */
    robotsNote?: string | undefined;
    llms?: Llms | undefined;
    /**
     * ownership tokens for Search Console, Bing Webmaster, Yandex; written on the home page
     */
    verify?: {
        google?: string;
        bing?: string;
        yandex?: string;
    } | undefined;
    /**
     * the work no tag does (Prop. 7): each place the entity should be; `url` once it is there
     */
    presence?: {
        name: string;
        url?: string;
        note?: string;
    }[] | undefined;
};
export type SitemapUrl = {
    /**
     * a path or a URL on this site
     */
    loc: string;
    lastmod?: string | Date | undefined;
    /**
     * hreflang → path
     */
    alternates?: Record<string, string> | undefined;
    changefreq?: string | undefined;
    priority?: string | undefined;
};
