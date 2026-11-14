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
export function gscToken(keyFile: string, f?: typeof fetch | undefined): Promise<string>;
/**
 * Search Console rows for the last `days` (data lags ~2 days), by page and by page × query.
 * @param {string} property   `sc-domain:example.com` or `https://example.com/`
 * @param {string} token
 * @param {number} days
 * @param {typeof fetch} [f]
 * @returns {Promise<{ pages: Row[], queries: Row[] }>}
 */
export function gscRows(property: string, token: string, days: number, f?: typeof fetch | undefined): Promise<{
    pages: Row[];
    queries: Row[];
}>;
/**
 * Bing Webmaster rows (Bing also feeds ChatGPT search, Copilot and DuckDuckGo).
 * API key: Bing Webmaster Tools → Settings → API access.
 * @param {string} siteUrl   `https://example.com/`, as verified in Bing
 * @param {string} key
 * @param {typeof fetch} [f]
 * @returns {Promise<{ pages: Row[], queries: Row[] }>}
 */
export function bingRows(siteUrl: string, key: string, f?: typeof fetch | undefined): Promise<{
    pages: Row[];
    queries: Row[];
}>;
/**
 * Each page of the site with its numbers and what to do about them.
 * @param {import('./index.js').Site} site
 * @param {string} engine
 * @param {{ pages: Row[], queries: Row[] }} rows
 * @returns {{ pages: PageStat[], unlisted: Row[] }}
 */
export function judge(site: import("./index.js").Site, engine: string, rows: {
    pages: Row[];
    queries: Row[];
}): {
    pages: PageStat[];
    unlisted: Row[];
};
/**
 * The report as text: lint and presence first (free), then each engine.
 * @param {import('./index.js').Site} site
 * @param {{ engine: string, pages: PageStat[], unlisted: Row[] }[]} engines
 * @param {string[]} [notes]
 */
export function formatSearchReport(site: import("./index.js").Site, engines: {
    engine: string;
    pages: PageStat[];
    unlisted: Row[];
}[], notes?: string[] | undefined): string;
export function expectedCtr(pos: number): 0.25 | 0.13 | 0.08 | 0.05 | 0.02 | 0.005;
export type Row = {
    page: string;
    query?: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
};
export type PageStat = {
    path: string;
    url: string;
    query?: string;
    engine: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
    top: Row[];
    verdicts: string[];
};
