// CoinLore's ids differ from CoinGecko's for some assets. Chart and logo lookups use CoinGecko-style ids,
// so map the known differences; unmapped coins keep their CoinLore id (and fall back to symbol-based sources).
const OVERRIDES: Record<string, string> = {
  'binance-coin': 'binancecoin',
  'near-protocol': 'near',
  dfinity: 'internet-computer',
  avalanche: 'avalanche-2',
  toncoin: 'the-open-network',
  render: 'render-token',
  cronos: 'crypto-com-chain',
  polygon: 'matic-network',
  'staked-ether': 'staked-ether',
  'bitget-token': 'bitget-token',
  'world-liberty-financial-wlfi': 'world-liberty-financial',
  'first-digital-usd': 'first-digital-usd',
  'ethena-usde': 'ethena-usde',
};

export const geckoId = (nameid: string): string => OVERRIDES[nameid] ?? nameid;
