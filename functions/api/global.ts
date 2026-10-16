import { cached, coingeckoFetch, upstreamJson, type Ctx } from '../_lib';

// GET /api/global -> CoinGecko /global (market cap, volume, dominance), cached 120s
export const onRequestGet = (ctx: Ctx) =>
  cached(ctx, 120, async () => {
    const body = await upstreamJson<{ data: unknown }>(await coingeckoFetch(ctx, '/global'), 'CoinGecko global');
    return body.data;
  });
