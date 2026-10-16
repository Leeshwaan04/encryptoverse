import { cached, coingeckoFetch, upstreamJson, json, type Ctx } from '../_lib';
import { binanceCloses, coinbaseCloses, type Range } from '../_providers/exchanges';
import { llamaChartPoints } from '../_providers/defillama';
import { fiatPerUsd } from '../_providers/fx';
import { firstSuccess } from '../_providers/http';

// CoinGecko's public API only serves the past 365 days, and the exchange feeds are similar, so there is no "max" range.
const RANGES = new Set(['1', '7', '30', '365']);
const LLAMA: Record<Range, { days: number; period: string; points: number }> = {
  '1': { days: 1, period: '15m', points: 96 },
  '7': { days: 7, period: '1h', points: 168 },
  '30': { days: 30, period: '4h', points: 180 },
  '365': { days: 365, period: '1d', points: 365 },
};

type Points = [number, number][];

// GET /api/chart?id=bitcoin&symbol=BTC&days=7&currency=usd -> USD price history converted to the quote currency.
// Provider order: Coinbase -> Binance -> DefiLlama (CoinGecko first when a key is configured). Pairs are quoted in USDT/USD,
// treated as USD. Cached 10 min.
export const onRequestGet = async (ctx: Ctx) => {
  const q = new URL(ctx.request.url).searchParams;
  const id = q.get('id') || '';
  const symbol = (q.get('symbol') || '').replace(/[^a-z0-9]/gi, '').slice(0, 12);
  const days = q.get('days') || '7';
  const currency = (q.get('currency') || 'usd').toLowerCase();
  if (!/^[a-z0-9-]{1,64}$/.test(id) || !RANGES.has(days) || !['usd', 'eur', 'gbp', 'btc', 'eth'].includes(currency)) {
    return json({ error: 'Bad parameters' }, 400);
  }
  const range = days as Range;

  return cached(ctx, range === '1' ? 180 : 600, async () => {
    const attempts: { name: string; run: () => Promise<{ points: Points; source: string }> }[] = [];
    if (ctx.env.COINGECKO_API_KEY) {
      attempts.push({
        name: 'CoinGecko',
        run: async () => {
          const body = await upstreamJson<{ prices: Points }>(await coingeckoFetch(ctx, `/coins/${id}/market_chart?vs_currency=usd&days=${days}`), 'CoinGecko market_chart');
          return { points: body.prices, source: 'CoinGecko' };
        },
      });
    }
    if (symbol) {
      // Coinbase first: Binance's public API answers 403 to Cloudflare's edge network, so it is only a fallback here.
      attempts.push({ name: 'Coinbase', run: async () => ({ points: await coinbaseCloses(symbol, range), source: 'Coinbase' }) });
      attempts.push({ name: 'Binance', run: async () => ({ points: await binanceCloses(symbol, range), source: 'Binance' }) });
    }
    const l = LLAMA[range];
    attempts.push({ name: 'DefiLlama', run: async () => ({ points: await llamaChartPoints(id, l.days, l.period, l.points), source: 'DefiLlama' }) });

    const { value } = await firstSuccess(attempts);
    let points = value.points;

    // Convert from USD to the requested quote currency.
    if (currency === 'eur' || currency === 'gbp') {
      const rate = await fiatPerUsd(currency === 'eur' ? 'EUR' : 'GBP');
      points = points.map(([t, p]) => [t, p * rate]);
    } else if (currency === 'btc' || currency === 'eth') {
      // Divide by the BTC/ETH price at the same timestamps for a true ratio history.
      const ref = currency === 'btc' ? 'BTC' : 'ETH';
      if (symbol.toUpperCase() === ref) {
        points = points.map(([t]) => [t, 1]);
      } else {
        const refSeries = await coinbaseCloses(ref, range).catch(() => binanceCloses(ref, range));
        points = points.map(([t, p]) => {
          let best = refSeries[0];
          for (const r of refSeries) if (Math.abs(r[0] - t) < Math.abs(best[0] - t)) best = r;
          return [t, p / best[1]];
        });
      }
    }

    const step = Math.max(1, Math.ceil(points.length / 120));
    return { data: { id, days, currency, points: points.filter((_, i) => i % step === 0 || i === points.length - 1) }, source: value.source };
  });
};
