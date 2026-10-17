// Single source of truth for site identity. Fill in `operator` and `contactEmail` with real details
// to have them appear on the About / Contact / Terms / Privacy pages (empty values are simply omitted).
export const SITE = {
  name: 'Encryptoverse',
  url: 'https://encryptoverse.com',
  github: 'https://github.com/Leeshwaan04/encryptoverse',
  /** Legal name of the person or company operating the site, e.g. "Example Pvt Ltd". */
  operator: '',
  /** Public contact address, e.g. "hello@encryptoverse.com". */
  contactEmail: '',
  lastUpdated: 'October 17, 2026',
} as const;

export interface DataSource {
  name: string;
  what: string;
  href: string;
  /** Listed in the footer. Every source is listed on the Methodology page regardless. */
  primary: boolean;
}

export const DATA_SOURCES: readonly DataSource[] = [
  { name: 'CoinLore', what: 'Coin list: prices, market cap, 24h volume, supply, 1h/24h/7d change and rank; global market totals', href: 'https://www.coinlore.com/cryptocurrency-data-api', primary: true },
  { name: 'DefiLlama', what: '7-day sparklines, long-range price history, chain TVL and stablecoin supply', href: 'https://defillama.com', primary: true },
  { name: 'Coinbase Exchange', what: 'Price-history candles from the public API (no account or key)', href: 'https://docs.cdp.coinbase.com/exchange/introduction/welcome', primary: true },
  { name: 'Binance', what: 'Fallback price-history candles from the public market-data API', href: 'https://developers.binance.com/docs/binance-spot-api-docs/faqs/market_data_only', primary: false },
  { name: 'Frankfurter (ECB)', what: 'EUR and GBP exchange rates from European Central Bank reference data', href: 'https://frankfurter.dev', primary: false },
  { name: 'GeckoTerminal', what: 'Newly created decentralised-exchange pools', href: 'https://www.geckoterminal.com', primary: true },
  { name: 'Snapshot', what: 'Active governance proposals', href: 'https://snapshot.box', primary: false },
  { name: 'alternative.me', what: 'Crypto Fear & Greed Index and its history', href: 'https://alternative.me/crypto/fear-and-greed-index/', primary: true },
  { name: 'Ethereum JSON-RPC', what: 'Current Ethereum mainnet gas price (eth_gasPrice)', href: 'https://ethereum.org/en/developers/docs/apis/json-rpc/', primary: false },
  { name: 'CoinDesk', what: 'News headlines (RSS), linked to the original article', href: 'https://www.coindesk.com', primary: true },
  { name: 'Cointelegraph', what: 'News headlines (RSS), linked to the original article', href: 'https://cointelegraph.com', primary: true },
  { name: 'Cryptocurrency Icons', what: 'Open-source (MIT) coin logos served via jsDelivr', href: 'https://github.com/spothq/cryptocurrency-icons', primary: false },
  { name: 'CoinGecko', what: 'Optional: used for market data only when an API key is configured, and as a direct fallback', href: 'https://www.coingecko.com', primary: false },
];
