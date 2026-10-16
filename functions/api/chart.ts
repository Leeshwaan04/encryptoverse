import { cached, coingeckoFetch, upstreamJson, json, type Ctx } from '../_lib';

// CoinGecko's public API only serves the past 365 days ("max" requires a paid plan)
const RANGES: Record<string, string> = { '1': '1', '7': '7', '30': '30', '365': '365' };

// GET /api/chart?id=bitcoin&days=7&currency=usd -> price history (CoinGecko /market_chart), downsampled to <=120 points
export const onRequestGet = async (ctx: Ctx) => {
  const q = new URL(ctx.request.url).searchParams;
  const id = q.get('id') || '';
  const days = RANGES[q.get('days') || '7'];
  const currency = (q.get('currency') || 'usd').toLowerCase();
  if (!/^[a-z0-9-]{1,64}$/.test(id) || !days || !/^[a-z]{3,4}$/.test(currency)) return json({ error: 'Bad parameters' }, 400);

  const ttl = days === '1' ? 120 : 600;
  return cached(ctx, ttl, async () => {
    const body = await upstreamJson<{ prices: [number, number][] }>(
      await coingeckoFetch(ctx, `/coins/${id}/market_chart?vs_currency=${currency}&days=${days}`),
      'CoinGecko market_chart',
    );
    const prices = body.prices || [];
    const step = Math.max(1, Math.ceil(prices.length / 120));
    return { id, days, currency, points: prices.filter((_, i) => i % step === 0 || i === prices.length - 1) };
  });
};
