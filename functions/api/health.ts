import { cached, coingeckoFetch, type Ctx } from '../_lib';

// GET /api/health -> reports whether each upstream answers from the edge (status, latency, size). Cached 60 s.
export const onRequestGet = (ctx: Ctx) =>
  cached(ctx, 60, async () => {
  const probe = async (name: string, run: () => Promise<Response>) => {
    const t0 = Date.now();
    try {
      const res = await run();
      const text = await res.text();
      return { name, status: res.status, ok: res.ok, ms: Date.now() - t0, bytes: text.length };
    } catch {
      return { name, status: 0, ok: false, ms: Date.now() - t0 };
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
  // Cached for a minute so the page cannot be used to fan requests out to every provider. Provider error bodies and
  // configuration flags are deliberately not exposed.
  return { data: { checkedAt: new Date().toISOString(), results }, source: 'Encryptoverse' };
});
