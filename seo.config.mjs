// The site, described once: every head tag, robots.txt, sitemap.xml and llms.txt come from here
// (tools/seo, from kwataverse packages/seo via the Claude `seo` skill).
//
//   node tools/seo.mjs                  after any page or config change: heads, lastmod, crawl files (commit all)
//   node tools/seo/cli.mjs audit https://obiverse.github.io [--psi]   what is served
//   node tools/seo/cli.mjs report seo.config.mjs                      Search Console + Bing (GSC_KEY_FILE, BING_KEY)
//   CI (.github/workflows/seo.yml): freshness on push; IndexNow + live audit after each Pages build.
// lastmod is computed from content (seo.lock.json); `lastmod` below only seeded the lock.
//
// The business cards and their print rigs (card*, business-card, *-card*) are not described here:
// they are shared by hand, carry their own heads, and stay out of the sitemap.

const IMG = { image: '/icon-512.png', imageWidth: 512, imageHeight: 512, imageAlt: 'The OBIVERSE mark' };
const home = { name: 'OBIVERSE', path: '/' };

export default {
  origin: 'https://obiverse.github.io',
  name: 'OBIVERSE',
  titleTemplate: '%s — OBIVERSE',
  lang: 'en',
  locale: 'en_US',
  image: '/icon-512.png',
  indexNowKey: 'obiverse-4f9c2a7e1b6d8350',

  graph: [
    {
      '@type': 'Organization', '@id': '#org', name: 'OBIVERSE', legalName: 'Obiverse LLC', url: '/',
      logo: '/icon-512.png', email: 'admin@obiverse.net', telephone: '+12409750431',
      sameAs: ['https://github.com/obiverse'],
    },
    { '@type': 'WebSite', '@id': '#website', name: 'OBIVERSE', url: '/', publisher: { '@id': '#org' } },
  ],

  entities: {
    studio: {
      '@type': 'ProfessionalService', '@id': '/#studio', name: 'OBIVERSE', url: '/',
      parentOrganization: { '@id': '#org' }, image: '/icon-512.png',
      description: 'Professional websites, mobile apps and business systems, designed, built and launched in 7 days. From $100.',
      priceRange: '$100 - $700', email: 'admin@obiverse.net', telephone: '+12409750431',
      address: { '@type': 'PostalAddress', addressCountry: 'US' }, areaServed: 'Worldwide',
      hasOfferCatalog: {
        '@type': 'OfferCatalog', name: 'Digital Services',
        itemListElement: [
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Business Launch Pack', description: 'Professional website in 7 days' }, price: '100', priceCurrency: 'USD' },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Business Desk', description: 'Invoices, inventory, and operations dashboard' }, price: '150', priceCurrency: 'USD' },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Managed Presence', description: 'Monthly digital management and support' }, price: '15', priceCurrency: 'USD' },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Institution Pack', description: 'Websites and portals for schools, churches, clinics' }, price: '200', priceCurrency: 'USD' },
        ],
      },
    },
    obiverse: {
      '@type': 'MobileApplication', '@id': '/app.html#app', name: 'Obiverse', url: '/app.html',
      operatingSystem: 'iOS, Android', applicationCategory: 'FinanceApplication',
      description: 'Sovereign identity and Lightning wallet. Your keys, your identity, your money.',
      downloadUrl: 'https://apps.apple.com/us/app/obiverse/id6759511100',
      sameAs: ['https://apps.apple.com/us/app/obiverse/id6759511100', 'https://play.google.com/store/apps/details?id=com.obiverse.obiverse'],
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, publisher: { '@id': '#org' },
    },
    ngumba: {
      '@type': 'MobileApplication', '@id': '/ngumba.html#app', name: 'Ngumba', url: '/ngumba.html',
      operatingSystem: 'iOS, Android', applicationCategory: 'BusinessApplication',
      description: 'Scan documents, write invoices, sign contracts and keep everything on your phone. Works offline. No account.',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, publisher: { '@id': '#org' },
    },
    osalah: {
      '@type': 'MobileApplication', '@id': '/osalah.html#app', name: 'oSalah', url: '/osalah.html',
      operatingSystem: 'iOS', applicationCategory: 'LifestyleApplication',
      description: 'Prayer times, Qibla compass, Quran reader, dhikr counter, zakat calculator and the 99 Names. Offline, no ads, no tracking.',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, publisher: { '@id': '#org' },
    },
  },

  pages: [
    {
      path: '/', query: 'website and app development for businesses', title: 'OBIVERSE', fullTitle: 'Websites, Apps & Business Systems in 7 Days — OBIVERSE',
      ogTitle: 'OBIVERSE — Digital Tools That Grow Your Business',
      description: 'OBIVERSE builds professional websites, mobile apps, and business systems for businesses worldwide. Starting from $100. Designed, built, and launched in 7 days.',
      entities: ['studio'], lastmod: '2026-08-19', priority: '1.0', ...IMG,
    },
    {
      path: '/app.html', query: 'bitcoin lightning wallet africa', title: 'Obiverse App: Bitcoin Lightning Wallet & Nostr Identity',
      ogTitle: 'Obiverse App — Sovereign Identity & Wallet',
      description: 'Your keys, your identity, your money. Obiverse is a sovereign Bitcoin Lightning wallet with Nostr identity, built for Africa.',
      entities: ['obiverse'], crumbs: [home, { name: 'Obiverse App' }], lastmod: '2026-08-19', ...IMG,
    },
    {
      path: '/support.html', query: 'obiverse app support', title: 'Obiverse App Support', schemaType: 'ContactPage',
      description: 'Get help with the Obiverse app: answers to common questions, troubleshooting steps for wallet and identity, and how to reach the team.',
      entities: ['obiverse'], crumbs: [home, { name: 'Obiverse App', path: '/app.html' }, { name: 'Support' }], lastmod: '2026-04-10', ...IMG,
    },
    {
      path: '/privacy.html', query: 'obiverse privacy policy', title: 'Privacy Policy',
      description: 'How OBIVERSE protects your data: your keys, your data, your rules. What the Obiverse app stores, where it lives, and what never leaves your device.',
      crumbs: [home, { name: 'Privacy Policy' }], lastmod: '2026-04-10', ...IMG,
    },
    {
      path: '/terms.html', query: 'obiverse terms of service', title: 'Terms of Service',
      description: 'The terms of service for the OBIVERSE platform and the Obiverse app. Sovereign computing: you hold your keys, and with them the responsibility.',
      crumbs: [home, { name: 'Terms of Service' }], lastmod: '2026-04-10', ...IMG,
    },
    {
      path: '/ngumba.html', query: 'document scanner and invoice app', title: 'Ngumba: Document Scanner & Invoice App',
      fullTitle: 'Ngumba: Document Scanner & Invoice App — OBIVERSE', ogTitle: 'Ngumba — Scan, invoice, sign, keep',
      description: 'The business centre in your pocket. Scan a page and it comes out straight, clean and small enough to send. Write an invoice in a minute. Everything stays on your phone.',
      entities: ['ngumba'], crumbs: [home, { name: 'Ngumba' }], lastmod: '2026-08-19', ...IMG,
    },
    {
      path: '/ngumba-privacy.html', query: 'ngumba privacy policy', title: 'Ngumba Privacy Policy',
      description: 'Ngumba collects nothing. Your documents stay on your phone. There is no account and no server, so there is nothing of yours for anyone to hold.',
      entities: ['ngumba'], crumbs: [home, { name: 'Ngumba', path: '/ngumba.html' }, { name: 'Privacy' }], lastmod: '2026-08-21', ...IMG,
    },
    {
      path: '/ngumba-terms.html', query: 'ngumba terms of use', title: 'Ngumba Terms of Use',
      description: 'The terms for using Ngumba, the offline scanner and invoice app. It is free, there is no account, and the documents you make are yours.',
      entities: ['ngumba'], crumbs: [home, { name: 'Ngumba', path: '/ngumba.html' }, { name: 'Terms' }], lastmod: '2026-08-21', ...IMG,
    },
    {
      path: '/osalah.html', query: 'offline prayer times qibla quran app', title: 'oSalah: Prayer Times, Qibla & Quran',
      fullTitle: 'oSalah — Prayer Times, Qibla & Quran, Offline', ogTitle: 'oSalah — Prayer Times, Qibla & Quran',
      description: 'Your complete Muslim daily companion. Prayer times, Qibla compass, Quran reader, dhikr counter, zakat calculator, and 99 Names of Allah. Offline. No ads.',
      entities: ['osalah'], crumbs: [home, { name: 'oSalah' }], lastmod: '2026-04-10', ...IMG,
    },
    {
      path: '/osalah-privacy.html', query: 'osalah privacy policy', title: 'oSalah Privacy Policy', fullTitle: 'Privacy Policy — oSalah',
      description: 'oSalah privacy policy. Your data stays on your device: no account, no tracking, no ads. Location is used only to work out prayer times and the Qibla.',
      entities: ['osalah'], crumbs: [home, { name: 'oSalah', path: '/osalah.html' }, { name: 'Privacy' }], lastmod: '2026-04-10', ...IMG,
    },
    {
      path: '/osalah-support.html', query: 'osalah support', title: 'oSalah Support', fullTitle: 'Support — oSalah', schemaType: 'ContactPage',
      description: 'Get help with oSalah: prayer times, Qibla compass, Quran reader, dhikr counter and more. Answers to common questions and how to contact us.',
      entities: ['osalah'], crumbs: [home, { name: 'oSalah', path: '/osalah.html' }, { name: 'Support' }], lastmod: '2026-04-10', ...IMG,
    },
  ],

  verify: {},   // { google: '<Search Console HTML-tag token>', bing: '<msvalidate.01 token>' } → home page
  presence: [   // Prop. 7, the work no tag does: add `url` as each is done; `node tools/seo.mjs` lists the rest
    { name: 'Google Search Console', note: 'verify (verify.google), submit /sitemap.xml' },
    { name: 'Bing Webmaster Tools', note: 'import from Search Console; feeds ChatGPT search, Copilot, DuckDuckGo' },
    { name: 'GitHub', url: 'https://github.com/obiverse' },
    { name: 'Obiverse on the App Store', url: 'https://apps.apple.com/us/app/obiverse/id6759511100' },
    { name: 'Obiverse on Google Play', url: 'https://play.google.com/store/apps/details?id=com.obiverse.obiverse' },
    { name: 'Ngumba on the App Store and Google Play', note: 'add the links to entities.ngumba.sameAs and the page' },
    { name: 'oSalah on the App Store', note: 'add the link to entities.osalah.sameAs and the page' },
    { name: 'Google Business Profile', note: 'service-area business: free, shows in Maps and the knowledge panel' },
    { name: 'LinkedIn company page', note: 'then add it to the Organization sameAs' },
    { name: 'Wikidata', note: 'once an independent mention (press, directory) exists to cite' },
  ],

  llms: {
    summary: 'OBIVERSE builds websites, mobile apps and business systems for businesses worldwide, launched in 7 days from $100, and makes its own apps: Obiverse (a Bitcoin Lightning wallet with Nostr identity), Ngumba (an offline scanner and invoice app) and oSalah (prayer times, Qibla and Quran).',
    about: 'Obiverse LLC. Contact: admin@obiverse.net, WhatsApp +1 240 975 0431.',
    sections: [
      { title: 'Services', links: ['/'] },
      { title: 'Apps', links: ['/app.html', '/ngumba.html', '/osalah.html'] },
      { title: 'Support and policies', links: ['/support.html', '/osalah-support.html', '/privacy.html', '/terms.html', '/ngumba-privacy.html', '/ngumba-terms.html', '/osalah-privacy.html'] },
    ],
  },
};
