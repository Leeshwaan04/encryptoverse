// Deterministic CoinGecko fixtures so the audit never depends on live API or rate limits.

const COINS = [
  ['bitcoin', 'btc', 'Bitcoin', 68450.25, 1.35e12, 3.1],
  ['ethereum', 'eth', 'Ethereum', 2642.18, 3.18e11, -1.2],
  ['solana', 'sol', 'Solana', 162.4, 7.5e10, 5.4],
  ['binancecoin', 'bnb', 'BNB', 598.1, 8.8e10, 0.4],
  ['bittensor', 'tao', 'Bittensor', 412.9, 3.0e9, 8.9],
  ['sui', 'sui', 'Sui', 1.92, 5.2e9, -3.3],
  ['pepe', 'pepe', 'Pepe', 0.0000092, 3.9e9, 12.5],
  ['chainlink', 'link', 'Chainlink', 11.42, 7.1e9, -0.8],
  ['arbitrum', 'arb', 'Arbitrum', 0.62, 2.2e9, -2.1],
  ['ondo', 'ondo', 'Ondo', 0.78, 1.1e9, 4.2],
  ['dogecoin', 'doge', 'Dogecoin', 0.112, 1.6e10, 1.1],
  ['filecoin', 'fil', 'Filecoin', 3.68, 2.1e9, -4.6],
];

// Rates relative to USD, so currency switching is verifiable.
export const RATES = { usd: 1, eur: 0.92, gbp: 0.79, btc: 1 / 68450.25, eth: 1 / 2642.18 };

const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 997, 7);

export function markets(currency = 'usd') {
  const r = RATES[currency] ?? 1;
  return COINS.map(([id, sym, name, usd, cap, ch], i) => {
    const h = hash(id);
    return {
      id,
      symbol: sym,
      name,
      image: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      current_price: usd * r,
      market_cap: cap * r,
      market_cap_rank: i + 1,
      total_volume: cap * r * 0.04,
      circulating_supply: cap / usd,
      total_supply: cap / usd,
      max_supply: id === 'bitcoin' ? 21000000 : null,
      ath: usd * 1.6 * r,
      ath_date: '2024-03-14T00:00:00.000Z',
      atl: usd * 0.04 * r,
      atl_date: '2015-10-20T00:00:00.000Z',
      price_change_percentage_1h_in_currency: ((h % 40) - 20) / 10,
      price_change_percentage_24h_in_currency: ch,
      price_change_percentage_7d_in_currency: ((h % 160) - 80) / 10,
      // 168 hourly points, shaped per coin so charts differ
      sparkline_in_7d: { price: Array.from({ length: 168 }, (_, k) => usd * r * (1 + Math.sin((k + h) / 12) * 0.06)) },
    };
  });
}

export const global_ = {
  data: {
    total_market_cap: { usd: 2.41e12 },
    total_volume: { usd: 9.2e10 },
    market_cap_percentage: { btc: 56.4, eth: 13.2 },
    market_cap_change_percentage_24h_usd: -1.83, // negative, to catch "+-1.83%" bugs
    active_cryptocurrencies: 14850,
    markets: 1120,
  },
};

export function chart(id, days) {
  const h = hash(id);
  const n = days === '1' ? 24 : days === '7' ? 168 : 180;
  const base = COINS.find((c) => c[0] === id)?.[3] ?? 100;
  const now = Date.now();
  return { prices: Array.from({ length: n }, (_, k) => [now - (n - k) * 3.6e6, base * (1 + Math.sin((k + h) / 9) * 0.1)]) };
}

export const fng = {
  data: [
    { value: '63', value_classification: 'Greed' },
    { value: '58', value_classification: 'Greed' },
    ...Array.from({ length: 29 }, (_, i) => ({ value: String(40 + (i % 30)), value_classification: 'Neutral' })),
  ],
};

/** Attach deterministic routes to a Playwright page/context. */
export async function mockApi(page, { fail = false, status = 200 } = {}) {
  await page.route(/assets\.coingecko\.com|googleapis\.com|gstatic\.com/, (r) =>
    r.fulfill({ status: 200, contentType: 'image/gif', body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64') })
  );
  await page.route(/api\.alternative\.me/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fng) }));
  await page.route(/api\.coingecko\.com/, (r) => {
    if (fail) return r.abort();
    const url = new URL(r.request().url());
    if (status !== 200) return r.fulfill({ status, contentType: 'application/json', body: '{"status":{"error_code":' + status + '}}' });
    if (url.pathname.endsWith('/coins/markets')) {
      return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(markets(url.searchParams.get('vs_currency') || 'usd')) });
    }
    if (url.pathname.endsWith('/global')) {
      return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(global_) });
    }
    const m = url.pathname.match(/\/coins\/([^/]+)\/market_chart/);
    if (m) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(chart(m[1], url.searchParams.get('days'))) });
    return r.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
}
