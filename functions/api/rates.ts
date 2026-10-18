import { cached, type Ctx } from '../_lib';
import { fetchJson } from '../_providers/http';

// GET /api/rates -> units of each fiat currency per 1 USD (ECB reference rates via Frankfurter), cached 1 hour.
export const onRequestGet = (ctx: Ctx) =>
  cached(ctx, 3600, async () => {
    const body = await fetchJson<{ base: string; date: string; rates: Record<string, number> }>('https://api.frankfurter.dev/v1/latest?base=USD');
    if (!body?.rates || typeof body.rates !== 'object') throw new Error('Frankfurter returned no rates');
    const rates: Record<string, number> = { usd: 1 };
    for (const [k, v] of Object.entries(body.rates)) if (typeof v === 'number' && Number.isFinite(v) && v > 0) rates[k.toLowerCase()] = v;
    return { source: 'ECB via Frankfurter', data: { date: body.date, rates } };
  });
