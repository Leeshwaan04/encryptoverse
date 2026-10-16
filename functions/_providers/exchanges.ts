import { fetchJson, num } from './http';

export type Range = '1' | '7' | '30' | '365';

// Binance public market data (no key): https://developers.binance.com/docs/binance-spot-api-docs/faqs/market_data_only
const BINANCE: Record<Range, { interval: string; limit: number }> = {
  '1': { interval: '15m', limit: 96 },
  '7': { interval: '1h', limit: 168 },
  '30': { interval: '4h', limit: 180 },
  '365': { interval: '1d', limit: 365 },
};

export async function binanceCloses(symbol: string, range: Range): Promise<[number, number][]> {
  const { interval, limit } = BINANCE[range];
  const rows = await fetchJson<unknown[][]>(`https://data-api.binance.vision/api/v3/klines?symbol=${symbol.toUpperCase()}USDT&interval=${interval}&limit=${limit}`);
  const out = rows.map((r) => [num(r[0]), num(r[4])] as [number, number]).filter((p) => p[1] > 0);
  if (out.length < 2) throw new Error('Binance returned no candles');
  return out;
}

// Coinbase Exchange public candles (no key): max 300 per request.
const COINBASE: Record<Range, { granularity: number; limit: number }> = {
  '1': { granularity: 900, limit: 96 },
  '7': { granularity: 3600, limit: 168 },
  '30': { granularity: 21600, limit: 120 },
  '365': { granularity: 86400, limit: 300 },
};

export async function coinbaseCloses(symbol: string, range: Range): Promise<[number, number][]> {
  const { granularity, limit } = COINBASE[range];
  const rows = await fetchJson<number[][]>(`https://api.exchange.coinbase.com/products/${symbol.toUpperCase()}-USD/candles?granularity=${granularity}`);
  // Rows are [time, low, high, open, close, volume], newest first.
  const out = rows
    .slice(0, limit)
    .map((r) => [num(r[0]) * 1000, num(r[4])] as [number, number])
    .filter((p) => p[1] > 0)
    .reverse();
  if (out.length < 2) throw new Error('Coinbase returned no candles');
  return out;
}
