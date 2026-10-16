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
  lastUpdated: 'October 16, 2026',
} as const;

export const DATA_SOURCES = [
  { name: 'CoinGecko', what: 'Prices, market cap, volume, supply, price history, global market totals', href: 'https://www.coingecko.com' },
  { name: 'alternative.me', what: 'Crypto Fear & Greed Index and its history', href: 'https://alternative.me/crypto/fear-and-greed-index/' },
  { name: 'Ethereum JSON-RPC', what: 'Current Ethereum mainnet gas price (eth_gasPrice)', href: 'https://ethereum.org/en/developers/docs/apis/json-rpc/' },
  { name: 'CoinDesk', what: 'News headlines (RSS), linked to the original article', href: 'https://www.coindesk.com' },
  { name: 'Cointelegraph', what: 'News headlines (RSS), linked to the original article', href: 'https://cointelegraph.com' },
] as const;
