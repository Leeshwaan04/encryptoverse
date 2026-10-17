// Server-side lookup of the top-50 coin list, used by the middleware (per-coin titles) and the sitemap.
import { canonicalUrl } from '../_lib';
export interface MarketCoin {
  id: string;
  name: string;
  symbol: string;
  current_price?: number;
  market_cap?: number;
  market_cap_rank?: number;
  price_change_percentage_24h?: number;
}

const parseCoins = (body: { data?: MarketCoin[] }): MarketCoin[] | null => {
  const rows = (body.data ?? []).filter((c) => typeof c.id === 'string' && /^[a-z0-9-]{1,64}$/.test(c.id) && typeof c.name === 'string');
  return rows.length ? rows : null;
};

/**
 * Top coins from our own /api/markets. The edge cache is read first; only when `fetchOnMiss` is set does a cold cache
 * trigger the upstream providers (pages that cannot be described without the list). Returns null when unavailable.
 */
export async function topCoins(origin: string, fetchOnMiss = true): Promise<MarketCoin[] | null> {
  try {
    const hit = await (caches as unknown as { default: Cache }).default.match(new Request(canonicalUrl(`${origin}/api/markets?currency=usd`)));
    if (hit) return parseCoins((await hit.json()) as { data?: MarketCoin[] });
    if (!fetchOnMiss) return null;
    const res = await fetch(`${origin}/api/markets?currency=usd`, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    return parseCoins((await res.json()) as { data?: MarketCoin[] });
  } catch {
    return null;
  }
}

const usd = (n: number, compact = false) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 2 : n >= 1 ? 2 : 6,
  }).format(n);

export const coinFacts = (c: MarketCoin) => ({
  id: c.id,
  name: c.name,
  symbol: c.symbol,
  rank: c.market_cap_rank,
  ...(typeof c.current_price === 'number' && typeof c.market_cap === 'number'
    ? {
        price: usd(c.current_price),
        marketCap: usd(c.market_cap, true),
        ...(typeof c.price_change_percentage_24h === 'number'
          ? { change24h: `${c.price_change_percentage_24h >= 0 ? '+' : ''}${c.price_change_percentage_24h.toFixed(2)}%` }
          : {}),
      }
    : {}),
});
