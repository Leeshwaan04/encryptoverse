import { cached, json, type Ctx } from '../_lib';
import { fetchJson } from '../_providers/http';
import { bucketOf } from '../../src/shared/bucket';
import type { CoinRec } from '../../src/shared/pages';

// GET /api/coin?slug=pepe -> live CoinLore ticker + top markets for ANY listed coin (the page falls back to the data snapshot if
// this is unavailable). The slug is validated against the static data build, so only real coins
// (about 15,000) can ever reach the upstream and the cache keyspace is bounded.
interface Ticker {
  price_usd: string; percent_change_24h: string; percent_change_1h: string; percent_change_7d: string;
  market_cap_usd: string; volume24: number; csupply: string | null; tsupply: string | null; msupply: string | null; rank: number;
}
interface Market { name: string; base: string; quote: string; price_usd: number; volume_usd: number }

export const onRequestGet = async (ctx: Ctx) => {
  const slug = new URL(ctx.request.url).searchParams.get('slug') ?? '';
  if (!/^[a-z0-9-]{1,64}$/.test(slug) || !ctx.env.ASSETS) return json({ error: 'Bad parameters' }, 400);
  const bucket = await ctx.env.ASSETS.fetch(new Request(`${new URL(ctx.request.url).origin}/data/coins/${bucketOf(slug)}.json`));
  const rec = bucket.ok ? ((await bucket.json()) as Record<string, CoinRec>)[slug] : undefined;
  if (!rec) return json({ error: 'Unknown coin' }, 404, { 'Cache-Control': 'public, max-age=300' });

  // 15 minutes: long-tail coin pages must never be able to burn CoinLore's ~1 request/second allowance that the main
  // price table also depends on. Pages fall back to the data snapshot if this endpoint is unavailable.
  return cached(ctx, 900, async () => {
    const [ticker, markets] = await Promise.all([
      fetchJson<Ticker[]>(`https://api.coinlore.net/api/ticker/?id=${rec.i}`),
      fetchJson<Market[]>(`https://api.coinlore.net/api/coin/markets/?id=${rec.i}`).catch(() => [] as Market[]),
    ]);
    const t = ticker[0];
    if (!t) throw new Error('CoinLore returned no ticker');
    const n = (v: unknown) => {
      const x = typeof v === 'number' ? v : Number(String(v ?? '').replace(/[^0-9eE+.-]/g, ''));
      return v === '' || v === null || v === undefined || !Number.isFinite(x) ? null : x;
    };
    return {
      source: 'CoinLore',
      data: {
        slug,
        p: n(t.price_usd), m: n(t.market_cap_usd), v: n(t.volume24), h1: n(t.percent_change_1h), h24: n(t.percent_change_24h), d7: n(t.percent_change_7d),
        c: n(t.csupply), t: n(t.tsupply), x: n(t.msupply), r: n(t.rank),
        // CoinLore occasionally lists a market with a wrong USD price (for example a KRW pair priced as USD). Drop rows that
        // disagree with the coin's own price by more than 5x either way, so one bad row cannot mislead readers.
        markets: (Array.isArray(markets) ? markets : [])
          .filter((m) => m && typeof m.name === 'string')
          .filter((m) => {
            const ref = n(t.price_usd);
            const price = n(m.price_usd);
            return !ref || ref <= 0 || (price !== null && price > ref / 5 && price < ref * 5);
          })
          .sort((a, b) => (b.volume_usd ?? 0) - (a.volume_usd ?? 0))
          .slice(0, 10)
          .map((m) => ({ ex: String(m.name).slice(0, 40), pair: `${String(m.base).slice(0, 12)}/${String(m.quote).slice(0, 12)}`, p: n(m.price_usd), v: n(m.volume_usd) })),
      },
    };
  });
};
