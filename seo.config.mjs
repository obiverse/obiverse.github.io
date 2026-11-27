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
const CARD = { image: '/og-obiverse.png', imageWidth: 1200, imageHeight: 630, imageAlt: 'Every penny has an address. OBIVERSE: FlowLedger, websites, apps' };
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
      sameAs: ['https://github.com/obiverse', 'https://play.google.com/store/apps/developer?id=Obiverse'],
    },
    { '@type': 'WebSite', '@id': '#website', name: 'OBIVERSE', url: '/', publisher: { '@id': '#org' } },
  ],

  entities: {
    studio: {
      '@type': 'ProfessionalService', '@id': '/#studio', name: 'OBIVERSE', url: '/',
      parentOrganization: { '@id': '#org' }, image: '/icon-512.png',
      description: 'Systems that stop the leak for Africa\'s builders: FlowLedger, the stock, sales, debts and bank ledger that ranks every leak in naira for businesses in Nigeria, and websites live in 7 days for businesses anywhere.',
      slogan: 'Every penny has an address.', brand: { '@type': 'Brand', name: 'Kwatasoft' },
      priceRange: '₦100,000 - ₦800,000; $1,000 - $2,000', currenciesAccepted: 'NGN, USD', knowsAbout: ['Inventory and stock control', 'Distributor accounts', 'Bank reconciliation', 'Website design', 'Search engine optimization'], email: 'obiversellc@gmail.com', telephone: '+12409750431',
      address: { '@type': 'PostalAddress', addressCountry: 'US' },
      hasOfferCatalog: {
        '@type': 'OfferCatalog', name: 'What we do',
        itemListElement: [
          { '@type': 'Offer', name: 'Leak diagnostic', itemOffered: { '@id': '/flowledger.html#service' }, price: '100000', priceCurrency: 'NGN' },
          { '@type': 'Offer', name: 'Website', itemOffered: { '@id': '/website-design.html#service' }, price: '400000', priceCurrency: 'NGN', eligibleRegion: { '@type': 'Country', name: 'Nigeria' } },
          { '@type': 'Offer', name: 'Website', itemOffered: { '@id': '/website-design.html#service' }, price: '1000', priceCurrency: 'USD' },
          { '@type': 'Offer', name: 'Website with payments', itemOffered: { '@id': '/website-design.html#service' }, price: '800000', priceCurrency: 'NGN', eligibleRegion: { '@type': 'Country', name: 'Nigeria' } },
          { '@type': 'Offer', name: 'Website with payments', itemOffered: { '@id': '/website-design.html#service' }, price: '2000', priceCurrency: 'USD' },
          { '@type': 'Offer', name: 'Website care', itemOffered: { '@id': '/website-design.html#service' }, price: '25000', priceCurrency: 'NGN', description: 'Monthly', eligibleRegion: { '@type': 'Country', name: 'Nigeria' } },
          { '@type': 'Offer', name: 'Website care', itemOffered: { '@id': '/website-design.html#service' }, price: '50', priceCurrency: 'USD', description: 'Monthly' },
        ],
      },
    },
    websites: {
      '@type': 'Service', '@id': '/website-design.html#service', name: 'Website design', serviceType: 'Website design',
      url: '/website-design.html', provider: { '@id': '/#studio' },
      description: 'Business websites designed, built and launched in 7 days, with SEO, Google Maps, a WhatsApp button and 30 days of support.',
      offers: [
        { '@type': 'Offer', name: 'Website', price: '400000', priceCurrency: 'NGN', eligibleRegion: { '@type': 'Country', name: 'Nigeria' }, description: 'Multi-page site, branding and logo, SEO, Google Maps, WhatsApp button, hosting setup' },
        { '@type': 'Offer', name: 'Website', price: '1000', priceCurrency: 'USD', description: 'Multi-page site, branding and logo, SEO, Google Maps, WhatsApp button, hosting setup' },
        { '@type': 'Offer', name: 'Website with payments', price: '800000', priceCurrency: 'NGN', eligibleRegion: { '@type': 'Country', name: 'Nigeria' }, description: 'Custom design, payment integration, admin panel, analytics, priority support' },
        { '@type': 'Offer', name: 'Website with payments', price: '2000', priceCurrency: 'USD', description: 'Custom design, payment integration, admin panel, analytics, priority support' },
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
      description: 'Your identity, with a wallet inside: a Lightning wallet with Nostr identity, and sign-in by scanning a code.',
      downloadUrl: 'https://apps.apple.com/us/app/obiverse/id6759511100',
      sameAs: ['https://apps.apple.com/us/app/obiverse/id6759511100', 'https://play.google.com/store/apps/details?id=com.obiverse.obiverse'],
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, publisher: { '@id': '#org' },
    },
    ngumba: {
      '@type': 'MobileApplication', '@id': '/ngumba.html#app', name: 'Ngumba', url: '/ngumba.html',
      operatingSystem: 'iOS, Android', applicationCategory: 'BusinessApplication',
      description: 'Scan documents, write invoices, sign contracts and keep everything on your phone. Works offline. No account.',
      sameAs: ['https://apps.apple.com/us/app/ngumba/id6800842876', 'https://play.google.com/store/apps/details?id=net.obiverse.ngumba'],
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, publisher: { '@id': '#org' },
    },
    beewallet: {
      '@type': 'MobileApplication', '@id': '/beewallet.html#app', name: 'BeeWallet', url: '/beewallet.html',
      operatingSystem: 'iOS, Android', applicationCategory: 'FinanceApplication',
      description: 'Self-custody Bitcoin and Lightning wallet: a 12-word recovery phrase only you hold, a Mobinumber people can pay, amounts in your own currency.',
      downloadUrl: ['https://apps.apple.com/us/app/beewallet-civil-hive/id6758224958', 'https://obiverse.github.io/apps/'],
      sameAs: ['https://apps.apple.com/us/app/beewallet-civil-hive/id6758224958'],
      image: '/beewallet-icon.png', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, publisher: { '@id': '#org' },
    },
    store: {
      '@type': 'MobileApplication', '@id': '/apps/#app', name: 'Obiverse Apps', url: '/apps/',
      operatingSystem: 'Android', applicationCategory: 'UtilitiesApplication',
      description: 'Our apps in one place: install once, then every app installs and updates with a tap, each file checked against its maker\'s signature first.',
      downloadUrl: 'https://obiverse.github.io/apps/', image: '/apps/icons/apps.png',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, publisher: { '@id': '#org' },
    },
    osalah: {
      '@type': 'MobileApplication', '@id': '/osalah.html#app', name: 'oSalah', url: '/osalah.html',
      operatingSystem: 'iOS, Android', applicationCategory: 'LifestyleApplication',
      sameAs: ['https://apps.apple.com/us/app/osalah/id6761698261', 'https://play.google.com/store/apps/details?id=net.obiverse.osalah'],
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
      path: '/apps/', query: 'obiverse apps android download', title: 'Obiverse Apps: Our Android Apps, One Tap, Checked',
      ogTitle: 'Obiverse Apps — our apps, one place',
      description: 'Get BeeWallet, Obiverse, Ngumba and oSalah for Android from one place. Install once; every app then installs and updates with a tap, checked against its signature.',
      entities: ['store', 'beewallet', 'obiverse', 'ngumba', 'osalah'], crumbs: [home, { name: 'Apps' }], priority: '0.8',
      image: '/apps/icons/apps.png', imageWidth: 192, imageHeight: 192, imageAlt: 'The Obiverse Apps icon',
    },
    {
      path: '/', query: 'kwatasoft obiverse', title: 'OBIVERSE',
      fullTitle: 'Kwatasoft: Every Penny Has an Address — OBIVERSE',
      ogTitle: 'Every penny has an address — OBIVERSE',
      description: 'For Africa\'s builders: we read the records you already keep, show you where the money went and stop the leak. FlowLedger, websites and apps, by Kwatasoft.',
      entities: ['studio', 'flowledger', 'websites'], lastmod: '2026-08-19', priority: '1.0', ...CARD,
      graph: [faq(
        ['What is a leak diagnostic?', 'In 2–3 hours we go through the records you already keep (bank statements, sales, dispatches, stock and payments) and show you where money is leaking, ranked in naira, with the rows behind each finding. It costs ₦100,000 and is credited in full toward setup if you go ahead within 30 days.'],
        ['Do my staff have to learn new software?', 'Not in week one. We import what your systems already produce: Excel, CSV or PDF. Later, staff can record on their phones or by WhatsApp message, one role at a time, and every entry is read back before it is saved.'],
        ['Do you work outside Nigeria?', 'Websites, yes: we build for businesses anywhere, priced in naira in Nigeria and in dollars elsewhere. FlowLedger is for businesses in Nigeria, and the owner can be anywhere: many run their business at home from abroad.'],
        ['How much does a website cost?', '₦400,000 in Nigeria, $1,000 elsewhere, for a multi-page site with branding, SEO, Google Maps and a WhatsApp button, live in 7 days. ₦800,000 or $2,000 adds a custom design, payments, an admin panel and analytics. Care is ₦25,000 or $50 a month. You pay 60% to start and 40% at go-live.'],
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
      description: 'Business websites found on Google and one tap from WhatsApp, built and launched in 7 days: ₦400,000 in Nigeria, $1,000 elsewhere. 60% to start.',
      entities: ['websites', 'studio'], crumbs: [home, { name: 'Website design' }], priority: '0.9', ...CARD,
      graph: [faq(
        ['How much does a website cost?', '₦400,000 in Nigeria, $1,000 elsewhere, for a multi-page business site with branding, SEO, Google Maps, a WhatsApp button and hosting setup. ₦800,000 or $2,000 adds a custom design, payments, an admin panel and analytics. Care after launch is ₦25,000 or $50 a month.'],
        ['How long does it take?', 'Most websites are designed, built and launched in 7 days. Complex projects with custom features take 14 days.'],
        ['How do I pay?', '60% to start and 40% at go-live, when the site is live and in use. Care is billed monthly in advance.'],
      )],
    },
    {
      path: '/website-cost.html', query: 'how much does a website cost in nigeria', title: 'How Much Does a Website Cost in Nigeria? 2026 Prices',
      ogTitle: 'How much does a website cost in Nigeria?',
      description: 'A business website costs ₦400,000 with us, ₦800,000 with online payments, and ₦25,000 a month to run. What that buys, and what to ask before you pay.',
      entities: ['websites', 'studio'], crumbs: [home, { name: 'Website design', path: '/website-design.html' }, { name: 'Website prices' }], priority: '0.9', ...CARD,
      graph: [faq(
        ['How much does a website cost in Nigeria?', 'With us, ₦400,000 for a multi-page business website, ₦800,000 with online payments, and ₦25,000 a month for hosting, domain, monthly updates and support.'],
        ['How long does it take to build?', 'Most websites are designed, built and launched in 7 days. Complex projects with custom features take 14 days.'],
        ['Can a website cost less than ₦400,000?', 'We never discount, but we can reduce the scope. Tell us what you need and we quote the smaller job.'],
        ['Are there yearly costs?', 'Hosting and the domain renew every year. Our care plan covers hosting, domain, monthly updates and support for ₦25,000 a month.'],
      )],
    },
    {
      path: '/work/ogaplastic.html', query: 'website for a manufacturer in nigeria', title: 'Website for a Water Tank Manufacturer in Nigeria',
      description: 'The website we built for OGA PLASTIC, a water tank and waste bin maker in Cross River State: products, factory, 23 distributors, quotes on WhatsApp.',
      entities: ['websites', 'studio'], crumbs: [home, { name: 'Website design', path: '/website-design.html' }, { name: 'OGA PLASTIC' }], priority: '0.8',
      image: '/art/case-ogaplastic-960.webp', imageWidth: 960, imageHeight: 720, imageAlt: 'The ogaplastic.com website we built, on a laptop and a phone',
    },
    {
      path: '/work/jawacard.html', query: 'fuel card platform cameroon', title: 'The Platform Behind a Fuel Card in Cameroon',
      description: 'Jawa, a fuel card for drivers in Cameroon, runs on the platform we built: French and English, how the card works, a statement for every fill-up, a member area.',
      entities: ['websites', 'studio'], crumbs: [home, { name: 'Website design', path: '/website-design.html' }, { name: 'Jawa' }], priority: '0.8',
      image: '/art/case-jawacard-960.webp', imageWidth: 960, imageHeight: 720, imageAlt: 'The jawacard.com website, running on the platform we built, on a laptop and a phone',
    },
    {
      path: '/work/arteduxcel.html', query: 'website for a technology distributor in africa', title: 'Website for a Technology Distributor in Africa',
      description: 'The website we built for Arteduxcel: U.S. technology sourced for businesses across Africa, four steps from enquiry to delivery, quotes on WhatsApp.',
      entities: ['websites', 'studio'], crumbs: [home, { name: 'Website design', path: '/website-design.html' }, { name: 'Arteduxcel' }], priority: '0.8',
      image: '/art/case-arteduxcel-960.webp', imageWidth: 960, imageHeight: 720, imageAlt: 'The arteduxcel.com website we built, on a laptop and a phone',
    },
    {
      path: '/website-designer-calabar.html', query: 'website designer in calabar', title: 'Website Designer in Calabar: Live in 7 Days',
      ogTitle: 'A website for your Calabar business, live in 7 days',
      description: 'Websites for businesses in Calabar and Cross River, found on Google and Google Maps and one tap from WhatsApp. From ₦400,000, live in 7 days.',
      entities: ['websites', 'studio'], crumbs: [home, { name: 'Website design', path: '/website-design.html' }, { name: 'Calabar' }], priority: '0.8',
      image: '/art/case-ogaplastic-960.webp', imageWidth: 960, imageHeight: 720, imageAlt: 'ogaplastic.com, the website we built for a manufacturer in Ugep, Cross River',
      graph: [faq(
        ['Do you work with businesses in Calabar?', 'Yes. We build for businesses in Calabar and across Cross River State; OGA PLASTIC in Ugep is one. We work with you on WhatsApp and by phone.'],
        ['How long does it take?', 'Most websites are designed, built and launched in 7 days. Complex projects with custom features take 14 days.'],
        ['Will people find my business on Google?', 'Every website includes SEO and Google Maps, so people searching for what you sell can find you.'],
        ['How do I pay?', '60% to start and 40% at go-live, when the site is live and in use. Care is ₦25,000 a month, billed in advance.'],
      )],
    },
    {
      path: '/month-end-leaks.html', query: 'stock and sales not matching', title: 'Stock, Sales and Bank Not Matching? Find the Leak',
      ogTitle: 'Stock, sales and bank don\'t match? Here is where it went',
      description: 'Why stock, sales and the bank don\'t match at month-end: the six places the difference goes, and how to check each one yourself this week.',
      entities: ['flowledger', 'studio'], crumbs: [home, { name: 'FlowLedger', path: '/flowledger.html' }, { name: 'Month-end leaks' }], priority: '0.8',
      image: '/art/leak-960.webp', imageWidth: 960, imageHeight: 864, imageAlt: 'A magnifying glass over a broken gold lane where coins fall through',
      graph: [faq(
        ["Why don't my stock and sales match at month-end?", 'Because something broke one of two laws: every kilogram goes somewhere, and every naira goes somewhere. Usually it is one of six things: material given away, material unexplained, stock that moved, money owed too long, money that never arrived, or sales with no paper.'],
        ['Is it theft?', 'Not always. Products heavier than standard, sales with no paper and payments recorded but never banked all look like missing money too. The checks above tell you which it is.'],
        ['How long does a leak diagnostic take?', '2–3 hours with the records you already keep: bank statements, sales, dispatches, stock and payments. It costs ₦100,000 and is credited in full toward setup if you go ahead within 30 days.'],
      )],
    },
    {
      path: '/app.html', query: 'obiverse app bitcoin lightning wallet', title: 'Obiverse App: Bitcoin Lightning Wallet & Nostr Identity',
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
      path: '/ngumba.html', query: 'ngumba document scanner and invoice app', title: 'Ngumba: Document Scanner & Invoice App',
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
    { name: 'Bing Webmaster Tools', url: 'https://www.bing.com/webmasters/home?siteUrl=https://obiverse.github.io/', note: 'imported from Search Console 2026-11-27; feeds ChatGPT search, Copilot, DuckDuckGo' },
    { name: 'GitHub', url: 'https://github.com/obiverse' },
    { name: 'Obiverse on the App Store', url: 'https://apps.apple.com/us/app/obiverse/id6759511100' },
    { name: 'Obiverse on Google Play', url: 'https://play.google.com/store/apps/details?id=com.obiverse.obiverse' },
    { name: 'Ngumba on the App Store', url: 'https://apps.apple.com/us/app/ngumba/id6800842876' },
    { name: 'Ngumba on Google Play', url: 'https://play.google.com/store/apps/details?id=net.obiverse.ngumba' },
    { name: 'oSalah on the App Store', url: 'https://apps.apple.com/us/app/osalah/id6761698261' },
    { name: 'oSalah on Google Play', url: 'https://play.google.com/store/apps/details?id=net.obiverse.osalah' },
    { name: 'Google Business Profile', note: 'service-area business: free, shows in Maps and the knowledge panel' },
    { name: 'LinkedIn company page', note: 'then add it to the Organization sameAs' },
    { name: 'Wikidata', note: 'once an independent mention (press, directory) exists to cite' },
  ],

  llms: {
    summary: 'OBIVERSE (Obiverse LLC, home of Kwatasoft) builds systems that stop the leak for Africa\'s builders: FlowLedger, a stock, sales, debts and bank ledger on the phone and WhatsApp for manufacturers and distributors in Nigeria, which ranks every leak in naira and starts with a ₦100,000 leak diagnostic; and business websites for businesses anywhere, live in 7 days, from ₦400,000 in Nigeria or $1,000 elsewhere. It also makes its own apps: BeeWallet (a self-custody Bitcoin wallet), Obiverse (identity with a Lightning wallet inside), Ngumba (an offline scanner and invoice app) and oSalah (prayer times, Qibla and Quran), on the App Store and Google Play, and for Android from Obiverse Apps, its own store: install once, then every app installs and updates with a tap, each file checked against its signature.',
    about: 'Obiverse LLC. Contact: obiversellc@gmail.com, WhatsApp +1 240 975 0431.\n\nWebsites we built that are live: ogaplastic.com (a water tank manufacturer in Nigeria) and arteduxcel.com (technology procurement for businesses across Africa). We also built the platform behind jawacard.com (a fuel card for drivers in Cameroon), whose site was designed by JUJUMAKE. Our own products include 9scroll.com (encrypted memory for AI).',
    sections: [
      { title: 'What we do', links: ['/', '/flowledger.html', '/month-end-leaks.html', '/website-design.html', '/website-cost.html', '/website-designer-calabar.html'] },
      { title: 'Our work', links: ['/work/ogaplastic.html', '/work/jawacard.html', '/work/arteduxcel.html'] },
      { title: 'Apps', links: ['/apps/', '/beewallet.html', '/app.html', '/ngumba.html', '/osalah.html'] },
      { title: 'Support and policies', links: ['/support.html', '/osalah-support.html', '/privacy.html', '/terms.html', '/ngumba-privacy.html', '/ngumba-terms.html', '/osalah-privacy.html'] },
    ],
  },
};
