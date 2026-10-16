import { cached, coingeckoFetch, upstreamJson, json, type Ctx } from '../_lib';
import { coinloreTickers, toNum } from '../_providers/coinlore';
import { fiatPerUsd } from '../_providers/fx';
import { geckoId } from '../_providers/ids';
import { iconResolver } from '../_providers/icons';
import { llamaCharts } from '../_providers/defillama';
import { firstSuccess } from '../_providers/http';

const CURRENCIES = new Set(['usd', 'eur', 'gbp', 'btc', 'eth']);

/** Output mirrors CoinGecko's /coins/markets items so the client has one shape to parse. */
async function fromCoinLore(currency: string) {
  const rows = await coinloreTickers(50);
  const toQuote = await quoteRate(currency, rows);
  const ids = rows.map((r) => geckoId(r.nameid));

  // Sparklines: batched DefiLlama calls (7 days, 8h steps). Best effort: charts still work without them.
  const [icon, sparks] = await Promise.all([
    iconResolver(),
    llamaCharts(ids, 7, '8h', 21).catch(() => ({}) as Record<string, number[]>),
  ]);

  return rows.map((r, i) => {
    const id = ids[i];
    const price = toNum(r.price_usd);
    const spark = sparks[id];
    return {
      id,
      symbol: r.symbol.toLowerCase(),
      name: r.name,
      image: icon(r.symbol),
      current_price: price * toQuote,
      market_cap: toNum(r.market_cap_usd) * toQuote,
      market_cap_rank: r.rank,
      total_volume: toNum(r.volume24) * toQuote,
      circulating_supply: toNum(r.csupply),
      total_supply: r.tsupply ? toNum(r.tsupply) : null,
      max_supply: r.msupply ? toNum(r.msupply) : null,
      // CoinLore does not provide ATH/ATL; the client shows these as unavailable.
      ath: null,
      ath_date: null,
      atl: null,
      atl_date: null,
      // Percentage changes are USD-based regardless of the quote currency.
      price_change_percentage_1h_in_currency: toNum(r.percent_change_1h),
      price_change_percentage_24h_in_currency: toNum(r.percent_change_24h),
      price_change_percentage_7d_in_currency: toNum(r.percent_change_7d),
      sparkline_in_7d: spark ? { price: spark.map((p) => p * toQuote) } : { price: [] },
    };
  });
}

/** How many units of the quote currency one USD buys. BTC/ETH come from the same ticker feed, so they stay consistent. */
async function quoteRate(currency: string, rows: { nameid: string; price_usd: string }[]): Promise<number> {
  if (currency === 'usd') return 1;
  if (currency === 'eur') return fiatPerUsd('EUR');
  if (currency === 'gbp') return fiatPerUsd('GBP');
  const ref = rows.find((r) => r.nameid === (currency === 'btc' ? 'bitcoin' : 'ethereum'));
  const usd = toNum(ref?.price_usd);
  if (usd <= 0) throw new Error(`No reference price for ${currency}`);
  return 1 / usd;
}

// GET /api/markets?currency=usd -> top 50 coins by market cap, shaped like CoinGecko /coins/markets, cached 2 min.
// Provider order: CoinGecko only when an API key is configured (the keyless tier is throttled on shared edge IPs),
// otherwise CoinLore (keyless) + DefiLlama sparklines + ECB FX.
export const onRequestGet = async (ctx: Ctx) => {
  const currency = (new URL(ctx.request.url).searchParams.get('currency') || 'usd').toLowerCase();
  if (!CURRENCIES.has(currency)) return json({ error: 'Unsupported currency' }, 400);
  return cached(ctx, 120, async () => {
    const attempts: { name: string; run: () => Promise<{ data: unknown; source: string }> }[] = [];
    if (ctx.env.COINGECKO_API_KEY) {
      attempts.push({
        name: 'CoinGecko',
        run: async () => ({
          data: await upstreamJson(
            await coingeckoFetch(ctx, `/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=1h%2C24h%2C7d`),
            'CoinGecko markets',
          ),
          source: 'CoinGecko',
        }),
      });
    }
    attempts.push({ name: 'CoinLore', run: async () => ({ data: await fromCoinLore(currency), source: 'CoinLore · DefiLlama' }) });
    return (await firstSuccess(attempts)).value;
  });
};
