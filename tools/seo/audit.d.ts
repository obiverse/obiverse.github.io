/**
 * What a page says about itself, read from the served HTML.
 * @param {string} html
 */
export function parseHtml(html: string): {
    lang: string | undefined;
    title: string | undefined;
    description: string | undefined;
    robots: string | undefined;
    canonical: string;
    alternates: {
        hreflang: string;
        href: string;
    }[];
    h1: number;
    viewport: boolean;
    anchors: {
        href: string;
        text: string;
        label: string;
    }[];
    imgNoAlt: number;
    ld: ({
        ok: boolean;
        value: unknown;
        error?: undefined;
    } | {
        ok: boolean;
        error: string;
        value?: undefined;
    })[];
    og: {
        title: string | undefined;
        description: string | undefined;
        image: string | undefined;
        url: string | undefined;
    };
    bytes: number;
    words: number;
};
/**
 * What Google needs before a node can show as a rich result, as tips: a
 * missing piece costs the enhancement, not the listing. Real data only: a
 * rating or a review that is not genuine is a manual action, not a tip.
 * @param {unknown} ld   the parsed JSON-LD of one script
 * @returns {string[]}
 */
export function richResults(ld: unknown): string[];
/**
 * Every check on one fetched page. `inSitemap` is the set of every URL the sitemap lists.
 * @param {string} url
 * @param {{ status: number, location?: string, robotsHeader?: string, html: string }} got
 * @param {{ robots?: string, inSitemap: Set<string> }} ctx
 * @returns {PageReport}
 */
export function checkPage(url: string, got: {
    status: number;
    location?: string;
    robotsHeader?: string;
    html: string;
}, ctx: {
    robots?: string;
    inSitemap: Set<string>;
}): PageReport;
/**
 * Pages that share a title or a description split one answer in two (common notion 1).
 * @param {PageReport[]} pages
 * @returns {Issue[]}
 */
export function duplicates(pages: PageReport[]): Issue[];
/**
 * The audit: robots.txt, the sitemap, every page, every card image.
 * @param {string} target   an origin, or a sitemap URL
 * @param {{ fetch?: typeof fetch, limit?: number, concurrency?: number, log?: (s: string) => void, via?: string, linkLimit?: number, psi?: boolean, psiKey?: string }} [o]
 *   `via`: fetch through another origin (a local or staging server) while checking every URL as the target's,
 *   so a production canonical on a server running locally is still a self canonical.
 * @returns {Promise<Report>}
 */
export function audit(target: string, o?: {
    fetch?: typeof fetch;
    limit?: number;
    concurrency?: number;
    log?: (s: string) => void;
    via?: string;
    linkLimit?: number;
    psi?: boolean;
    psiKey?: string;
} | undefined): Promise<Report>;
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
export function linkGraph(pages: PageReport[], origin: string, get: (u: string, manual?: boolean) => Promise<Response>, limit: number, live?: ((u: string) => Promise<Response>) | undefined): Promise<Issue[]>;
/**
 * hreflang is a pair or nothing: if A names B, B must name A (Prop. 9).
 * @param {PageReport[]} pages
 * @returns {Issue[]}
 */
export function hreflangPairs(pages: PageReport[]): Issue[];
/**
 * Core Web Vitals from PageSpeed Insights (Prop. 8): the field data real
 * Chrome users report when Google has enough, the lab run when it does not.
 * Thresholds are Google's "good": LCP ≤ 2.5 s, CLS ≤ 0.1, INP ≤ 200 ms.
 * @param {string[]} urls
 * @param {typeof fetch} f
 * @param {string} [key]
 * @returns {Promise<Issue[]>}
 */
export function speed(urls: string[], f: typeof fetch, key?: string | undefined): Promise<Issue[]>;
/**
 * The report as a terminal table, then every issue.
 * @param {Report} r
 * @returns {string}
 */
export function formatReport(r: Report): string;
export function decode(s: string): string;
export function intentOf(title: string): string;
export function locsOf(xml: string): string[];
export type Level = "error" | "warn" | "tip";
export type Issue = {
    level: Level;
    prop: number;
    code: string;
    msg: string;
    url?: string;
};
export type PageReport = {
    url: string;
    status: number;
    location?: string;
    title?: string;
    description?: string;
    h1: number;
    canonical?: string;
    ld: number;
    ogImage?: string;
    kb: number;
    words: number;
    issues: Issue[];
    checks: number;
    links?: string[];
    alternates?: {
        hreflang: string;
        href: string;
    }[];
};
export type Report = {
    origin: string;
    sitemap: string;
    pages: PageReport[];
    site: Issue[];
    score: number;
    errors: number;
    warnings: number;
    tips: number;
};
