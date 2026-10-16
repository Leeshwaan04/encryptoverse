import { cached, coingeckoFetch, upstreamJson, type Ctx } from '../_lib';
import { coinloreGlobal, coinloreTickers, toNum } from '../_providers/coinlore';
import { firstSuccess } from '../_providers/http';

// GET /api/global -> market totals shaped like CoinGecko's /global `data`, plus top50_volume_usd, cached 5 min.
// 24h volume is the summed volume of the top 50 coins (the sources' own global volume fields are unreliable).
export const onRequestGet = (ctx: Ctx) =>
  cached(ctx, 300, async () => {
    const attempts: { name: string; run: () => Promise<{ data: unknown; source: string }> }[] = [];
    if (ctx.env.COINGECKO_API_KEY) {
      attempts.push({
        name: 'CoinGecko',
        run: async () => {
          const body = await upstreamJson<{ data: Record<string, unknown> }>(await coingeckoFetch(ctx, '/global'), 'CoinGecko global');
          const coins = await upstreamJson<{ total_volume?: number }[]>(
            await coingeckoFetch(ctx, '/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false'),
            'CoinGecko markets',
          );
          const sum = coins.reduce((s, c) => s + toNum(c.total_volume), 0);
          return { data: { ...body.data, top50_volume_usd: sum > 0 ? sum : undefined }, source: 'CoinGecko' };
        },
      });
    }
    attempts.push({
      name: 'CoinLore',
      run: async () => {
        const [g, top] = await Promise.all([coinloreGlobal(), coinloreTickers(50)]);
        const top50 = top.reduce((s, t) => s + toNum(t.volume24), 0);
        return {
          data: {
            total_market_cap: { usd: toNum(g.total_mcap) },
            market_cap_change_percentage_24h_usd: toNum(g.mcap_change),
            market_cap_percentage: { btc: toNum(g.btc_d), eth: toNum(g.eth_d) },
            active_cryptocurrencies: toNum(g.coins_count),
            markets: toNum(g.active_markets),
            top50_volume_usd: top50 > 0 ? top50 : undefined,
          },
          source: 'CoinLore',
        };
      },
    });
    return (await firstSuccess(attempts)).value;
  });
