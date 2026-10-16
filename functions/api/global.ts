import { cached, coingeckoFetch, upstreamJson, type Ctx } from '../_lib';

// GET /api/global -> CoinGecko /global (market cap, volume, dominance), cached 120s
export const onRequestGet = (ctx: Ctx) =>
  cached(ctx, 120, async () => {
    const body = await upstreamJson<{ data: Record<string, unknown> }>(await coingeckoFetch(ctx, '/global'), 'CoinGecko global');
    // CoinGecko's global total_volume is unreliable, so also report the summed 24h volume of the top 50 coins (USD).
    let top50VolumeUsd: number | undefined;
    try {
      const coins = await upstreamJson<{ total_volume?: number }[]>(
        await coingeckoFetch(ctx, '/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false'),
        'CoinGecko markets',
      );
      const sum = coins.reduce((s, c) => s + (Number.isFinite(c.total_volume) ? (c.total_volume as number) : 0), 0);
      if (sum > 0) top50VolumeUsd = sum;
    } catch {
      // leave undefined; the client falls back to a sanity-checked figure or hides volume
    }
    return { ...body.data, top50_volume_usd: top50VolumeUsd };
  });
