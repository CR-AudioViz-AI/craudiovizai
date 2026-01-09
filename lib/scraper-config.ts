/**
 * CR AudioViz AI Scraper Configuration
 * Defines all scraper targets and schedules
 */

export interface ScraperConfig {
  id: string;
  name: string;
  description: string;
  targets: ScraperTarget[];
  schedule: string; // cron expression
  outputTable: string;
  enabled: boolean;
}

export interface ScraperTarget {
  url: string;
  selector?: string;
  dataType: string;
  fields?: Record<string, string>;
}

export const SCRAPER_CONFIGS: ScraperConfig[] = [
  // ============================================================================
  // FINANCIAL DATA SCRAPERS
  // ============================================================================
  {
    id: 'mortgage-rates',
    name: 'Mortgage Rate Scraper',
    description: 'Scrapes current mortgage rates from multiple sources',
    schedule: '0 */2 * * *', // Every 2 hours
    outputTable: 'mortgage_rates',
    enabled: true,
    targets: [
      { url: 'https://www.bankrate.com/mortgages/mortgage-rates/', dataType: 'mortgage-rates' },
      { url: 'https://www.nerdwallet.com/mortgages/mortgage-rates', dataType: 'mortgage-rates' },
      { url: 'https://www.zillow.com/mortgage-rates/', dataType: 'mortgage-rates' },
      { url: 'https://www.freddiemac.com/pmms', dataType: 'mortgage-rates' },
    ],
  },
  {
    id: 'stock-data',
    name: 'Stock Market Scraper',
    description: 'Scrapes stock prices and market data',
    schedule: '*/15 9-16 * * 1-5', // Every 15 min during market hours
    outputTable: 'sector_financial_stocks',
    enabled: true,
    targets: [
      { url: 'https://finance.yahoo.com/', dataType: 'stocks' },
    ],
  },
  {
    id: 'crypto-data',
    name: 'Cryptocurrency Scraper',
    description: 'Scrapes crypto prices from major exchanges',
    schedule: '*/5 * * * *', // Every 5 minutes
    outputTable: 'sector_financial_crypto',
    enabled: true,
    targets: [
      { url: 'https://coinmarketcap.com/', dataType: 'crypto' },
      { url: 'https://www.coingecko.com/', dataType: 'crypto' },
    ],
  },

  // ============================================================================
  // COLLECTORS DATA SCRAPERS
  // ============================================================================
  {
    id: 'tcg-prices',
    name: 'Trading Card Prices',
    description: 'Scrapes trading card prices from major platforms',
    schedule: '0 */4 * * *', // Every 4 hours
    outputTable: 'collector_prices',
    enabled: true,
    targets: [
      { url: 'https://www.tcgplayer.com/', dataType: 'cards' },
      { url: 'https://www.cardmarket.com/', dataType: 'cards' },
      { url: 'https://www.ebay.com/b/Sports-Trading-Cards/261328/bn_1854750', dataType: 'cards' },
    ],
  },
  {
    id: 'coin-prices',
    name: 'Coin & Currency Prices',
    description: 'Scrapes numismatic prices',
    schedule: '0 */6 * * *', // Every 6 hours
    outputTable: 'collector_prices',
    enabled: true,
    targets: [
      { url: 'https://www.ngccoin.com/', dataType: 'coins' },
      { url: 'https://www.pcgs.com/', dataType: 'coins' },
      { url: 'https://www.apmex.com/', dataType: 'coins' },
    ],
  },
  {
    id: 'vinyl-prices',
    name: 'Vinyl Record Prices',
    description: 'Scrapes vinyl record prices from Discogs and others',
    schedule: '0 */6 * * *',
    outputTable: 'collector_prices',
    enabled: true,
    targets: [
      { url: 'https://www.discogs.com/', dataType: 'vinyl' },
    ],
  },
  {
    id: 'watch-prices',
    name: 'Luxury Watch Prices',
    description: 'Scrapes watch prices from major platforms',
    schedule: '0 */12 * * *', // Every 12 hours
    outputTable: 'collector_prices',
    enabled: true,
    targets: [
      { url: 'https://www.chrono24.com/', dataType: 'watches' },
      { url: 'https://www.watchbox.com/', dataType: 'watches' },
    ],
  },
  {
    id: 'comic-prices',
    name: 'Comic Book Prices',
    description: 'Scrapes comic book prices and grading data',
    schedule: '0 */6 * * *',
    outputTable: 'collector_prices',
    enabled: true,
    targets: [
      { url: 'https://www.cgccomics.com/', dataType: 'comics' },
      { url: 'https://www.mycomicshop.com/', dataType: 'comics' },
    ],
  },
  {
    id: 'spirits-prices',
    name: 'Spirits & Whiskey Prices',
    description: 'Scrapes rare spirits and whiskey prices',
    schedule: '0 */12 * * *',
    outputTable: 'collector_prices',
    enabled: true,
    targets: [
      { url: 'https://www.wine-searcher.com/spirits', dataType: 'spirits' },
      { url: 'https://www.totalwine.com/', dataType: 'spirits' },
    ],
  },
  {
    id: 'disney-collectibles',
    name: 'Disney Collectibles Prices',
    description: 'Scrapes Disney memorabilia prices',
    schedule: '0 */6 * * *',
    outputTable: 'collector_prices',
    enabled: true,
    targets: [
      { url: 'https://www.ebay.com/b/Disneyana/137/bn_1843537', dataType: 'disney' },
    ],
  },

  // ============================================================================
  // REAL ESTATE SCRAPERS
  // ============================================================================
  {
    id: 'realestate-listings',
    name: 'Real Estate Listings',
    description: 'Scrapes property listings from major platforms',
    schedule: '0 */4 * * *',
    outputTable: 'sector_realestate_listings',
    enabled: true,
    targets: [
      { url: 'https://www.zillow.com/', dataType: 'listings' },
      { url: 'https://www.realtor.com/', dataType: 'listings' },
      { url: 'https://www.redfin.com/', dataType: 'listings' },
    ],
  },

  // ============================================================================
  // CRAFT PATTERN SCRAPERS
  // ============================================================================
  {
    id: 'crochet-patterns',
    name: 'Crochet Patterns',
    description: 'Scrapes free crochet patterns from multiple sources',
    schedule: '0 0 * * *', // Daily
    outputTable: 'assets_patterns',
    enabled: true,
    targets: [
      { url: 'https://www.ravelry.com/patterns/search#craft=crochet&availability=free', dataType: 'patterns' },
      { url: 'https://www.yarnspirations.com/patterns?prefn1=patternSkillTypeString&prefv1=Crochet', dataType: 'patterns' },
    ],
  },
  {
    id: 'knitting-patterns',
    name: 'Knitting Patterns',
    description: 'Scrapes free knitting patterns',
    schedule: '0 0 * * *',
    outputTable: 'assets_patterns',
    enabled: true,
    targets: [
      { url: 'https://www.ravelry.com/patterns/search#craft=knitting&availability=free', dataType: 'patterns' },
    ],
  },

  // ============================================================================
  // DEVELOPER DOCUMENTATION SCRAPERS
  // ============================================================================
  {
    id: 'mdn-docs',
    name: 'MDN Web Docs',
    description: 'Scrapes MDN documentation for Javari learning',
    schedule: '0 0 * * 0', // Weekly
    outputTable: 'javari_knowledge',
    enabled: true,
    targets: [
      { url: 'https://developer.mozilla.org/en-US/docs/Web', dataType: 'documentation' },
    ],
  },
  {
    id: 'devdocs',
    name: 'DevDocs.io',
    description: 'Scrapes developer documentation',
    schedule: '0 0 * * 0',
    outputTable: 'javari_knowledge',
    enabled: true,
    targets: [
      { url: 'https://devdocs.io/', dataType: 'documentation' },
    ],
  },

  // ============================================================================
  // NEWS & CONTENT SCRAPERS
  // ============================================================================
  {
    id: 'tech-news',
    name: 'Tech News',
    description: 'Scrapes tech news for Javari knowledge',
    schedule: '0 */4 * * *',
    outputTable: 'javari_knowledge',
    enabled: true,
    targets: [
      { url: 'https://news.ycombinator.com/', dataType: 'news' },
      { url: 'https://techcrunch.com/', dataType: 'news' },
    ],
  },
];

export default SCRAPER_CONFIGS;
