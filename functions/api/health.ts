import { coingeckoFetch, json, type Ctx } from '../_lib';

// GET /api/health -> reports what each upstream returns to the edge. Always 200: Cloudflare replaces 502/504 bodies
// from Workers with its own generic page, which hides the real cause.
export const onRequestGet = async (ctx: Ctx) => {
  const probe = async (name: string, run: () => Promise<Response>) => {
    const t0 = Date.now();
    try {
      const res = await run();
      const text = await res.text();
      return { name, status: res.status, ok: res.ok, ms: Date.now() - t0, bytes: text.length, head: res.ok ? undefined : text.slice(0, 120) };
    } catch (e) {
      return { name, status: 0, ok: false, ms: Date.now() - t0, error: e instanceof Error ? e.message : String(e) };
    }
  };
  const get = (url: string) => () => fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'Encryptoverse/1.0 (+https://encryptoverse.com)' }, signal: AbortSignal.timeout(8000) });
  const results = await Promise.all([
    probe('coinlore tickers', get('https://api.coinlore.net/api/tickers/?start=0&limit=3')),
    probe('coinlore global', get('https://api.coinlore.net/api/global/')),
    probe('defillama prices', get('https://coins.llama.fi/prices/current/coingecko:bitcoin')),
    probe('defillama chains', get('https://api.llama.fi/v2/chains')),
    probe('binance klines', get('https://data-api.binance.vision/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=2')),
    probe('coinbase candles', get('https://api.exchange.coinbase.com/products/BTC-USD/candles?granularity=3600')),
    probe('frankfurter fx', get('https://api.frankfurter.dev/v1/latest?base=USD&symbols=EUR')),
    probe('geckoterminal pools', get('https://api.geckoterminal.com/api/v2/networks/new_pools?page=1')),
    probe('snapshot', get('https://hub.snapshot.org/graphql?query=%7Bspaces(first:1)%7Bid%7D%7D')),
    probe('alternative.me', get('https://api.alternative.me/fng/?limit=1')),
    probe('coingecko ping', () => coingeckoFetch(ctx, '/ping')),
  ]);
  return json({ checkedAt: new Date().toISOString(), coingeckoKeyConfigured: Boolean(ctx.env.COINGECKO_API_KEY), results }, 200, { 'Cache-Control': 'no-store' });
};
