// Server-side lookup of the top-50 coin list, used by the middleware (per-coin titles) and the sitemap.
export interface MarketCoin {
  id: string;
  name: string;
  symbol: string;
  current_price?: number;
  market_cap?: number;
  market_cap_rank?: number;
  price_change_percentage_24h?: number;
}

/** Top coins from our own cached /api/markets (USD). Returns null when it cannot be read. */
export async function topCoins(origin: string): Promise<MarketCoin[] | null> {
  try {
    const res = await fetch(`${origin}/api/markets?currency=usd`, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: MarketCoin[] };
    const rows = (body.data ?? []).filter((c) => typeof c.id === 'string' && /^[a-z0-9-]{1,64}$/.test(c.id) && typeof c.name === 'string');
    return rows.length ? rows : null;
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
