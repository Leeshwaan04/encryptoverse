import { fetchJson, num } from './http';

interface ChartResponse {
  coins?: Record<string, { prices?: { timestamp: number; price: number }[] }>;
}

/**
 * Batched price history for many coins in one request (DefiLlama coins API, keyless).
 * Ids are CoinGecko-style; coins DefiLlama does not know are simply absent from the result.
 */
export async function llamaCharts(ids: string[], days: number, period: string, points: number): Promise<Record<string, number[]>> {
  if (ids.length === 0) return {};
  const start = Math.floor(Date.now() / 1000) - days * 86400;
  // DefiLlama rejects requests above 500 total data points (coins x span), so split into parallel batches.
  const perBatch = Math.max(1, Math.floor(500 / points));
  const batches: string[][] = [];
  for (let i = 0; i < ids.length; i += perBatch) batches.push(ids.slice(i, i + perBatch));

  const results = await Promise.allSettled(
    batches.map((batch) =>
      fetchJson<ChartResponse>(
        `https://coins.llama.fi/chart/${batch.map((i) => `coingecko:${encodeURIComponent(i)}`).join(',')}?start=${start}&span=${points}&period=${period}`,
        {},
        10000,
      ),
    ),
  );
  const out: Record<string, number[]> = {};
  for (const r of results) {
    if (r.status !== 'fulfilled') continue;
    for (const [key, v] of Object.entries(r.value.coins ?? {})) {
      const series = (v.prices ?? []).map((p) => p.price).filter((p) => Number.isFinite(p));
      if (series.length >= 2) out[key.replace('coingecko:', '')] = series;
    }
  }
  return out;
}

export async function llamaChartPoints(id: string, days: number, period: string, points: number): Promise<[number, number][]> {
  const start = Math.floor(Date.now() / 1000) - days * 86400;
  const body = await fetchJson<ChartResponse>(`https://coins.llama.fi/chart/coingecko:${encodeURIComponent(id)}?start=${start}&span=${points}&period=${period}`, {}, 10000);
  const prices = body.coins?.[`coingecko:${id}`]?.prices ?? [];
  const out = prices.filter((p) => Number.isFinite(p.price)).map((p) => [p.timestamp * 1000, p.price] as [number, number]);
  if (out.length < 2) throw new Error('DefiLlama has no history for this coin');
  return out;
}

export interface ChainTvl {
  name: string;
  symbol: string | null;
  tvl: number;
}

export async function llamaChains(): Promise<ChainTvl[]> {
  const rows = await fetchJson<{ name: string; tokenSymbol?: string | null; tvl?: number }[]>('https://api.llama.fi/v2/chains');
  return rows
    .map((r) => ({ name: r.name, symbol: r.tokenSymbol ?? null, tvl: num(r.tvl) }))
    .filter((r) => r.tvl > 0)
    .sort((a, b) => b.tvl - a.tvl);
}

export interface ChainStable {
  name: string;
  circulating: number;
}

export async function llamaStablecoinChains(): Promise<ChainStable[]> {
  const rows = await fetchJson<{ name: string; totalCirculatingUSD?: { peggedUSD?: number } }[]>('https://stablecoins.llama.fi/stablecoinchains');
  return rows
    .map((r) => ({ name: r.name, circulating: num(r.totalCirculatingUSD?.peggedUSD) }))
    .filter((r) => r.circulating > 0)
    .sort((a, b) => b.circulating - a.circulating);
}
