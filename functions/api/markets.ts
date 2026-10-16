import { cached, coingeckoFetch, upstreamJson, json, type Ctx } from '../_lib';

const CURRENCIES = new Set(['usd', 'eur', 'gbp', 'inr', 'jpy', 'aud', 'cad', 'chf', 'cny', 'krw', 'brl', 'aed', 'sgd', 'btc', 'eth']);

// GET /api/markets?currency=usd  -> top 50 coins by market cap (CoinGecko /coins/markets), cached 60s
export const onRequestGet = async (ctx: Ctx) => {
  const currency = (new URL(ctx.request.url).searchParams.get('currency') || 'usd').toLowerCase();
  if (!CURRENCIES.has(currency)) return json({ error: 'Unsupported currency' }, 400);
  return cached(ctx, 60, async () =>
    upstreamJson(
      await coingeckoFetch(
        ctx,
        `/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=1h%2C24h%2C7d`,
      ),
      'CoinGecko markets',
    ),
  );
};
