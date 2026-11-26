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
const CARD = { image: '/og-obiverse.png', imageWidth: 1200, imageHeight: 630, imageAlt: 'Every naira has an address. OBIVERSE: leak diagnostic, FlowLedger, websites' };
// FAQPage nodes: answer engines read them (Google shows no snippet). Keep each answer the page's visible text.
const faq = (...qa) => ({ '@type': 'FAQPage', mainEntity: qa.map(([name, text]) => ({ '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text } })) });
const BEE = { image: '/beewallet-icon.png', imageWidth: 512, imageHeight: 512, imageAlt: 'The BeeWallet icon' };

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
      logo: '/icon-512.png', email: 'obiversellc@gmail.com', telephone: '+12409750431',
      sameAs: ['https://github.com/obiverse'],
    },
    { '@type': 'WebSite', '@id': '#website', name: 'OBIVERSE', url: '/', publisher: { '@id': '#org' } },
  ],

  entities: {
    studio: {
      '@type': 'ProfessionalService', '@id': '/#studio', name: 'OBIVERSE', url: '/',
      parentOrganization: { '@id': '#org' }, image: '/icon-512.png',
      description: 'Systems that stop the leak for Africa\'s builders: FlowLedger, the stock, sales, debts and bank ledger that ranks every leak in naira, and websites live in 7 days.',
      slogan: 'Every naira has an address.', brand: { '@type': 'Brand', name: 'Kwatasoft' },
      priceRange: '₦100,000 - ₦800,000', currenciesAccepted: 'NGN', knowsAbout: ['Inventory and stock control', 'Distributor accounts', 'Bank reconciliation', 'Website design', 'Search engine optimization'], email: 'obiversellc@gmail.com', telephone: '+12409750431',
      address: { '@type': 'PostalAddress', addressCountry: 'US' }, areaServed: { '@type': 'Country', name: 'Nigeria' },
      hasOfferCatalog: {
        '@type': 'OfferCatalog', name: 'What we do',
        itemListElement: [
          { '@type': 'Offer', name: 'Leak diagnostic', itemOffered: { '@id': '/flowledger.html#service' }, price: '100000', priceCurrency: 'NGN' },
          { '@type': 'Offer', name: 'Website', itemOffered: { '@id': '/website-design.html#service' }, price: '400000', priceCurrency: 'NGN' },
          { '@type': 'Offer', name: 'Website with payments', itemOffered: { '@id': '/website-design.html#service' }, price: '800000', priceCurrency: 'NGN' },
          { '@type': 'Offer', name: 'Website care', itemOffered: { '@id': '/website-design.html#service' }, price: '25000', priceCurrency: 'NGN', description: 'Monthly' },
        ],
      },
    },
    websites: {
      '@type': 'Service', '@id': '/website-design.html#service', name: 'Website design', serviceType: 'Website design',
      url: '/website-design.html', provider: { '@id': '/#studio' }, areaServed: { '@type': 'Country', name: 'Nigeria' },
      description: 'Business websites designed, built and launched in 7 days, with SEO, Google Maps, a WhatsApp button and 30 days of support.',
      offers: [
        { '@type': 'Offer', name: 'Website', price: '400000', priceCurrency: 'NGN', description: 'Multi-page site, branding and logo, SEO, Google Maps, WhatsApp button, hosting setup' },
        { '@type': 'Offer', name: 'Website with payments', price: '800000', priceCurrency: 'NGN', description: 'Custom design, payment integration, admin panel, analytics, priority support' },
      ],
    },
    flowledger: {
      '@type': 'Service', '@id': '/flowledger.html#service', name: 'FlowLedger', serviceType: 'Stock, sales, debts and bank ledger',
      brand: { '@type': 'Brand', name: 'Kwatasoft' }, url: '/flowledger.html', provider: { '@id': '/#studio' },
      areaServed: { '@type': 'Country', name: 'Nigeria' }, audience: { '@type': 'BusinessAudience', name: 'Manufacturers and distributors' },
      description: 'A ledger on the phone and on WhatsApp that follows every kilogram and every naira, ranks each leak in naira and sends the owner a summary every night at 9pm.',
      offers: { '@type': 'Offer', name: 'Leak diagnostic', price: '100000', priceCurrency: 'NGN', description: 'Credited in full toward setup within 30 days' },
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
    beewallet: {
      '@type': 'MobileApplication', '@id': '/beewallet.html#app', name: 'BeeWallet', url: '/beewallet.html',
      operatingSystem: 'iOS, Android', applicationCategory: 'FinanceApplication',
      description: 'Self-custody Bitcoin and Lightning wallet: a 12-word recovery phrase only you hold, a Mobinumber people can pay, amounts in your own currency.',
      downloadUrl: ['https://apps.apple.com/us/app/beewallet-civil-hive/id6758224958', 'https://obiverse.github.io/beewallet-android.html'],
      sameAs: ['https://apps.apple.com/us/app/beewallet-civil-hive/id6758224958'],
      image: '/beewallet-icon.png', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, publisher: { '@id': '#org' },
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
      path: '/beewallet.html', query: 'beewallet bitcoin wallet', title: 'BeeWallet: Self-Custody Bitcoin & Lightning Wallet',
      fullTitle: 'BeeWallet: Self-Custody Bitcoin & Lightning Wallet — OBIVERSE',
      description: 'BeeWallet is a self-custody Bitcoin and Lightning wallet for iPhone and Android: your 12 words, a Mobinumber people can pay, amounts in your own currency.',
      entities: ['beewallet'], crumbs: [home, { name: 'BeeWallet' }], ...BEE,
    },
    {
      path: '/beewallet-android.html', query: 'beewallet android apk download', title: 'Download BeeWallet for Android (APK)',
      description: 'Download the BeeWallet Android app: signed APKs for 64-bit and 32-bit phones, with SHA-256 checksums and the signing certificate to check before you install.',
      entities: ['beewallet'], crumbs: [home, { name: 'BeeWallet', path: '/beewallet.html' }, { name: 'Android' }], ...BEE,
    },
    {
      path: '/', query: 'kwatasoft obiverse', title: 'OBIVERSE',
      fullTitle: 'Kwatasoft: Every Naira Has an Address — OBIVERSE',
      ogTitle: 'Every naira has an address — OBIVERSE',
      description: 'For Africa\'s builders: we read the records you already keep, show you where the money went, ranked in naira, and stop the leak. FlowLedger and websites, by Kwatasoft.',
      entities: ['studio', 'flowledger', 'websites'], lastmod: '2026-08-19', priority: '1.0', ...CARD,
      graph: [faq(
        ['What is a leak diagnostic?', 'In 2–3 hours we go through the records you already keep (bank statements, sales, dispatches, stock and payments) and show you where money is leaking, ranked in naira, with the rows behind each finding. It costs ₦100,000 and is credited in full toward setup if you go ahead within 30 days.'],
        ['Do my staff have to learn new software?', 'Not in week one. We import what your systems already produce: Excel, CSV or PDF. Later, staff can record on their phones or by WhatsApp message, one role at a time, and every entry is read back before it is saved.'],
        ['How much does a website cost?', '₦400,000 for a multi-page site with branding, SEO, Google Maps and a WhatsApp button, live in 7 days. ₦800,000 adds a custom design, payments, an admin panel and analytics. Care is ₦25,000 a month. You pay 60% to start and 40% at go-live.'],
        ['Do you give discounts?', 'No. If the budget is tight we reduce the scope, never the price, so what you get is always done properly.'],
      )],
    },
    {
      path: '/flowledger.html', query: 'kwatasoft flowledger stock sales and debts ledger', title: 'FlowLedger by Kwatasoft: Stock, Sales & Debts Ledger',
      ogTitle: 'FlowLedger: know where every kilogram and every naira went',
      description: 'The stock, sales, debts and bank ledger for manufacturers and distributors in Nigeria, on your phone and on WhatsApp. Every leak ranked in naira, every night at 9pm.',
      entities: ['flowledger', 'studio'], crumbs: [home, { name: 'FlowLedger' }], priority: '0.9', ...CARD,
      graph: [faq(
        ['Who is FlowLedger for?', 'Businesses that turn inputs into outputs and sell them through others: manufacturers, and the distributors and shops they supply. If materials go in, goods go out and money comes back, FlowLedger can follow it.'],
        ['Why not just tell me the price?', 'Because the price only makes sense next to the leak. The diagnostic tells you what the leak costs you each month. Then we give you two options, out loud, and you choose.'],
      )],
    },
    {
      path: '/website-design.html', query: 'website design for businesses in nigeria', title: 'Website Design for Businesses in Nigeria, Live in 7 Days',
      description: 'Business websites found on Google and one tap from WhatsApp, designed, built and launched in 7 days: ₦400,000, or ₦800,000 with payments. 60% to start.',
      entities: ['websites', 'studio'], crumbs: [home, { name: 'Website design' }], priority: '0.9', ...CARD,
      graph: [faq(
        ['How much does a website cost?', '₦400,000 for a multi-page business site with branding, SEO, Google Maps, a WhatsApp button and hosting setup. ₦800,000 adds a custom design, payments, an admin panel and analytics. Care after launch is ₦25,000 a month.'],
        ['How long does it take?', 'Most websites are designed, built and launched in 7 days. Complex projects with custom features take 14 days.'],
        ['How do I pay?', '60% to start and 40% at go-live, when the site is live and in use. Care is billed monthly in advance.'],
      )],
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
    { name: 'Google Search Console', url: 'https://search.google.com/search-console?resource_id=https%3A%2F%2Fobiverse.github.io%2F', note: 'verified 2026-11-14 by google90d55d1a2c34c119.html (never delete it)' },
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
    summary: 'OBIVERSE (Obiverse LLC, home of Kwatasoft) builds systems that stop the leak for Africa\'s builders: FlowLedger, a stock, sales, debts and bank ledger on the phone and WhatsApp for manufacturers and distributors in Nigeria, which ranks every leak in naira and starts with a ₦100,000 leak diagnostic; and business websites live in 7 days from ₦400,000. It also makes its own apps: Obiverse (a Bitcoin Lightning wallet with Nostr identity), BeeWallet (a self-custody Bitcoin and Lightning wallet), Ngumba (an offline scanner and invoice app) and oSalah (prayer times, Qibla and Quran).',
    about: 'Obiverse LLC. Contact: obiversellc@gmail.com, WhatsApp +1 240 975 0431.\n\nWebsites we built that are live: ogaplastic.com (a water tank manufacturer in Nigeria), jawacard.com (a fuel card for drivers in Cameroon) and arteduxcel.com (technology procurement for businesses across Africa). Our own products include 9scroll.com (encrypted memory for AI).',
    sections: [
      { title: 'What we do', links: ['/', '/flowledger.html', '/website-design.html'] },
      { title: 'Apps', links: ['/app.html', '/beewallet.html', '/beewallet-android.html', '/ngumba.html', '/osalah.html'] },
      { title: 'Support and policies', links: ['/support.html', '/osalah-support.html', '/privacy.html', '/terms.html', '/ngumba-privacy.html', '/ngumba-terms.html', '/osalah-privacy.html'] },
    ],
  },
};
