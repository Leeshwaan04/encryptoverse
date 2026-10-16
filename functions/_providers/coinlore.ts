import { fetchJson, num } from './http';

// CoinLore: free public API, no key, ~1 request/second. https://www.coinlore.com/cryptocurrency-data-api
export interface CoinLoreTicker {
  id: string;
  symbol: string;
  name: string;
  nameid: string;
  rank: number;
  price_usd: string;
  percent_change_24h: string;
  percent_change_1h: string;
  percent_change_7d: string;
  market_cap_usd: string;
  volume24: number;
  csupply: string | null;
  tsupply: string | null;
  msupply: string | null;
}

export async function coinloreTickers(limit = 50): Promise<CoinLoreTicker[]> {
  const body = await fetchJson<{ data?: CoinLoreTicker[] }>(`https://api.coinlore.net/api/tickers/?start=0&limit=${limit}`);
  if (!Array.isArray(body.data) || body.data.length === 0) throw new Error('CoinLore returned no tickers');
  return body.data;
}

export interface CoinLoreGlobal {
  coins_count: number;
  active_markets: number;
  total_mcap: number;
  total_volume: number;
  btc_d: string;
  eth_d: string;
  mcap_change: string;
}

export async function coinloreGlobal(): Promise<CoinLoreGlobal> {
  const body = await fetchJson<CoinLoreGlobal[]>('https://api.coinlore.net/api/global/');
  if (!Array.isArray(body) || !body[0]) throw new Error('CoinLore returned no global data');
  return body[0];
}

export const toNum = num;
