import { coingeckoFetch, json, type Ctx } from '../_lib';

// GET /api/health -> reports what each upstream returns to the edge. Always 200, because Cloudflare replaces 502/504
// bodies from Workers with its own generic error page, which hides the real cause.
export const onRequestGet = async (ctx: Ctx) => {
  const probe = async (name: string, run: () => Promise<Response>) => {
    try {
      const res = await run();
      const text = await res.text();
      return { name, status: res.status, ok: res.ok, bytes: text.length, head: res.ok ? undefined : text.slice(0, 160) };
    } catch (e) {
      return { name, status: 0, ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  };
  const results = await Promise.all([
    probe('coingecko /ping', () => coingeckoFetch(ctx, '/ping')),
    probe('coingecko /global', () => coingeckoFetch(ctx, '/global')),
    probe('coingecko /coins/markets', () => coingeckoFetch(ctx, '/coins/markets?vs_currency=usd&per_page=5&page=1')),
    probe('alternative.me', () => fetch('https://api.alternative.me/fng/?limit=1')),
  ]);
  return json({ checkedAt: new Date().toISOString(), keyConfigured: Boolean(ctx.env.COINGECKO_API_KEY), results }, 200, { 'Cache-Control': 'no-store' });
};
