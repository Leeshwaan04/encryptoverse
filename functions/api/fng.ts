import { cached, upstreamJson, type Ctx } from '../_lib';

interface FngRow { value: string; value_classification: string; timestamp: string }

// GET /api/fng -> Crypto Fear & Greed Index (alternative.me) with yesterday / last week / last month, cached 15min
export const onRequestGet = (ctx: Ctx) =>
  cached(ctx, 900, async () => {
    const res = await fetch('https://api.alternative.me/fng/?limit=31&format=json', { headers: { Accept: 'application/json' } });
    const body = await upstreamJson<{ data: FngRow[] }>(res, 'alternative.me');
    const rows = body.data || [];
    if (rows.length < 2) throw new Error('Fear & Greed returned no data');
    const pick = (i: number) => (rows[i] ? { value: Number(rows[i].value), label: rows[i].value_classification } : null);
    return {
      data: {
      now: pick(0),
      yesterday: pick(1),
      lastWeek: pick(7),
      lastMonth: pick(30),
      asOf: new Date(Number(rows[0].timestamp) * 1000).toISOString(),
      source: 'alternative.me',
      },
      source: 'alternative.me',
    };
  });
