// Per-route titles and descriptions. Pure data (no React) so the Cloudflare Pages middleware can
// import it and serve the right <title>, description and social tags to crawlers that do not run JS.

export const SITE_NAME = 'Encryptoverse';
export const SITE_URL = 'https://encryptoverse.com';

export interface RouteMeta {
  path: string;
  /** Page heading / short title. The document title is "<title> | Encryptoverse" except on the home page. */
  title: string;
  description: string;
  /** Keep out of search results (personal or error pages). */
  noindex?: boolean;
}

export const HOME_TITLE = 'Encryptoverse | Live Crypto Prices & Fear and Greed Index';

/** The seven app views. `markets` is the home page; the rest live at their own paths. */
export const TAB_ROUTES: Record<'markets' | 'icodrops' | 'trending' | 'defi' | 'watchlist' | 'news' | 'converter', RouteMeta> = {
  markets: {
    path: '/',
    title: 'Live Crypto Prices',
    description:
      'Independent crypto dashboard: live prices, market cap, volume, price history, Fear & Greed index and news for the top 50 coins. Every data source disclosed.',
  },
  icodrops: {
    path: '/token-sales',
    title: 'ICOs & Token Sales',
    description:
      'Where public token sales happen, how Monad, Pump.fun and Plasma structured theirs, and a checklist for judging a sale. Sourced, not a paid listing.',
  },
  trending: {
    path: '/trending',
    title: 'Trending Cryptocurrencies',
    description: 'Top gainers, losers and most-traded cryptocurrencies over the last 24 hours, ranked from live market data.',
  },
  defi: {
    path: '/defi',
    title: 'DeFi: TVL, Stablecoins & New Pools',
    description:
      'Total value locked by blockchain, stablecoin supply by chain, active governance votes and new DEX pools, from DefiLlama, Snapshot and GeckoTerminal.',
  },
  watchlist: {
    path: '/watchlist',
    title: 'Watchlist & Portfolio',
    description: 'Your personal watchlist and portfolio, stored only in your browser.',
    noindex: true,
  },
  news: {
    path: '/news',
    title: 'Crypto News',
    description: 'Headlines from CoinDesk and Cointelegraph feeds, linked to the original publishers.',
  },
  converter: {
    path: '/converter',
    title: 'Crypto Price Converter',
    description: 'Convert between cryptocurrencies and fiat currencies using live market prices.',
  },
};

export const INFO_ROUTES = {
  '/about': { path: '/about', title: 'About Encryptoverse', description: 'What Encryptoverse is, what it is not, where its data comes from and how it is maintained.' },
  '/methodology': { path: '/methodology', title: 'Methodology & Data Sources', description: 'Exactly where every number on Encryptoverse comes from, how often it refreshes, and its known limitations.' },
  '/risk-disclosure': { path: '/risk-disclosure', title: 'Risk Disclosure', description: 'Cryptoassets are volatile and can lose all of their value. Read this before acting on any information.' },
  '/privacy': { path: '/privacy', title: 'Privacy Policy', description: 'What data Encryptoverse collects, what stays in your browser, and which third parties are involved.' },
  '/terms': { path: '/terms', title: 'Terms of Use', description: 'The terms that apply when you use Encryptoverse.' },
  '/contact': { path: '/contact', title: 'Contact', description: 'How to reach Encryptoverse to report errors, ask questions or request corrections.' },
} as const satisfies Record<string, RouteMeta>;

export const documentTitle = (m: RouteMeta): string =>
  m.path === '/' ? HOME_TITLE : m.title.includes(SITE_NAME) ? m.title : `${m.title} | ${SITE_NAME}`;

/** Every path that has its own title, keyed by pathname. */
export const ROUTE_TABLE: Record<string, RouteMeta> = Object.fromEntries(
  [...Object.values(TAB_ROUTES), ...Object.values(INFO_ROUTES)].map((m) => [m.path, m]),
);

export const COIN_PREFIX = '/coin/';
/** Coin ids are lowercase slugs (CoinGecko-style), e.g. "bitcoin", "usd-coin". */
export const COIN_ID_RE = /^[a-z0-9-]{1,64}$/;
export const coinPath = (id: string): string => `${COIN_PREFIX}${id}`;
/** The coin id when `pathname` is `/coin/<id>`, else null. */
export const coinIdFromPath = (pathname: string): string | null => {
  const m = pathname.replace(/\/+$/, '').startsWith(COIN_PREFIX) ? pathname.replace(/\/+$/, '').slice(COIN_PREFIX.length) : '';
  return COIN_ID_RE.test(m) ? m : null;
};

export interface CoinFacts {
  id: string;
  name: string;
  symbol: string;
  /** Pre-formatted, e.g. "$67,250.12". Omitted when no live price is available. */
  price?: string;
  marketCap?: string;
  change24h?: string;
  rank?: number;
}

export const coinMeta = (c: CoinFacts): RouteMeta => ({
  path: coinPath(c.id),
  title: `${c.name} (${c.symbol.toUpperCase()}) Price, Market Cap & Chart`,
  description:
    c.price && c.marketCap
      ? `${c.name} (${c.symbol.toUpperCase()}) is trading at ${c.price}${c.change24h ? ` (${c.change24h} in 24h)` : ''}, with a market cap of ${c.marketCap}${c.rank ? ` (rank #${c.rank})` : ''}. Live price, price history and key facts, with the data source named.`
      : `${c.name} (${c.symbol.toUpperCase()}) live price, market cap, volume and price history, with the data source named.`,
});
