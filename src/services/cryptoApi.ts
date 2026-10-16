// Encryptoverse Live Crypto Market API Service
// Connects to CoinGecko public market feeds with resilient caching and offline fallback

import { cryptoTokens, globalMarketStats, type CryptoToken, type GlobalStats, type FearGreedReading } from '../data/cryptoData';

// Same-origin Cloudflare Pages Functions proxy (see /functions/api). Handles caching and upstream rate limits.
const API_BASE = '/api';
const CACHE_KEY_PREFIX = 'encryptoverse_market_v1_';
const CACHE_TTL_MS = 90 * 1000; // 90 seconds cache to protect against rate limits

interface CoinGeckoMarketItem {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_date: string;
  atl: number;
  atl_date: string;
  price_change_percentage_1h_in_currency?: number;
  price_change_percentage_24h_in_currency?: number;
  price_change_percentage_7d_in_currency?: number;
  sparkline_in_7d?: {
    price: number[];
  };
}

// Category classifier based on coin ID and symbol
function classifyCategory(id: string, symbol: string): CryptoToken['category'] {
  const s = symbol.toLowerCase();
  const i = id.toLowerCase();

  const l2 = ['arb', 'op', 'pol', 'matic', 'strk', 'mnt', 'blast', 'base'];
  if (l2.includes(s) || i.includes('arbitrum') || i.includes('optimism') || i.includes('polygon')) {
    return 'Layer 2';
  }

  const ai = ['tao', 'render', 'fet', 'wld', 'grt', 'akt', 'ocean', 'agix'];
  if (ai.includes(s) || i.includes('bittensor') || i.includes('render') || i.includes('artificial')) {
    return 'AI & Big Data';
  }

  const meme = ['doge', 'shib', 'pepe', 'wif', 'bonk', 'floki', 'brett', 'popcat', 'bome'];
  if (meme.includes(s) || i.includes('pepe') || i.includes('shiba') || i.includes('doge') || i.includes('wif')) {
    return 'Meme';
  }

  const depin = ['hnt', 'fil', 'ar', 'io', 'grass', 'theta'];
  if (depin.includes(s) || i.includes('helium') || i.includes('filecoin') || i.includes('arweave')) {
    return 'DePIN';
  }

  const rwa = ['ondo', 'om', 'pendle', 'cfg', 'gfi'];
  if (rwa.includes(s) || i.includes('ondo') || i.includes('mantra') || i.includes('pendle')) {
    return 'RWA';
  }

  const defi = ['uni', 'link', 'aave', 'mkr', 'crv', 'snx', 'inj', 'jup', 'dydx', 'ldo', 'rune'];
  if (defi.includes(s) || i.includes('chainlink') || i.includes('uniswap') || i.includes('aave')) {
    return 'DeFi';
  }

  return 'Layer 1';
}

function sampleSparkline(prices: number[] | undefined, defaultPrice: number): number[] {
  if (!prices || prices.length === 0) {
    return [defaultPrice * 0.96, defaultPrice * 0.98, defaultPrice, defaultPrice * 1.01, defaultPrice];
  }
  if (prices.length <= 7) {
    return prices;
  }
  // Sample 7 points evenly across 168 hours
  const step = Math.floor(prices.length / 7);
  const sampled: number[] = [];
  for (let idx = 0; idx < 7; idx++) {
    sampled.push(prices[idx * step] || defaultPrice);
  }
  return sampled;
}

export interface LiveMarketResult {
  tokens: CryptoToken[];
  isLive: boolean;
  isCached: boolean;
  lastUpdated: Date;
  error?: string;
}

export async function fetchLiveCryptoTokens(currency = 'USD'): Promise<LiveMarketResult> {
  const curr = currency.toLowerCase();
  const cacheKey = `${CACHE_KEY_PREFIX}${curr}`;

  // 1. Check browser sessionStorage
  if (typeof window !== 'undefined') {
    try {
      const cachedStr = sessionStorage.getItem(cacheKey);
      if (cachedStr) {
        const cached = JSON.parse(cachedStr);
        const age = Date.now() - cached.timestamp;
        if (age < CACHE_TTL_MS && Array.isArray(cached.tokens) && cached.tokens.length > 0) {
          return {
            tokens: cached.tokens,
            isLive: true,
            isCached: true,
            lastUpdated: new Date(cached.timestamp),
          };
        }
      }
    } catch {
      // Ignore cache parse failure
    }
  }

  // 2. Fetch fresh market data from CoinGecko public API
  try {
    const response = await fetch(`${API_BASE}/markets?currency=${curr}`, { headers: { Accept: 'application/json' } });

    if (!response.ok) {
      throw new Error(`Market data HTTP error: ${response.status}`);
    }

    const payload: { fetchedAt: string; data: CoinGeckoMarketItem[] } = await response.json();
    const data = payload.data;
    const servedStale = response.headers.get('X-Stale') === '1';
    const fetchedAt = new Date(payload.fetchedAt);

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Empty coin list received from CoinGecko');
    }

    const mappedTokens: CryptoToken[] = data.map((item, index) => {
      const price = item.current_price ?? 0;
      const sparkline = sampleSparkline(item.sparkline_in_7d?.price, price);

      return {
        id: item.id,
        rank: item.market_cap_rank || index + 1,
        name: item.name,
        symbol: item.symbol.toUpperCase(),
        icon: item.image,
        price: price,
        change1h: Number((item.price_change_percentage_1h_in_currency ?? 0).toFixed(2)),
        change24h: Number((item.price_change_percentage_24h_in_currency ?? 0).toFixed(2)),
        change7d: Number((item.price_change_percentage_7d_in_currency ?? 0).toFixed(2)),
        volume24h: item.total_volume ?? 0,
        marketCap: item.market_cap ?? 0,
        circulatingSupply: item.circulating_supply ?? 0,
        maxSupply: item.max_supply ?? item.total_supply ?? null,
        category: classifyCategory(item.id, item.symbol),
        sparkline: sparkline,
        ath: item.ath ?? price * 1.4,
        athDate: item.ath_date ? new Date(item.ath_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'Nov 2021',
        atl: item.atl ?? price * 0.05,
        atlDate: item.atl_date ? new Date(item.atl_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'Oct 2015',
        description: `${item.name} (${item.symbol.toUpperCase()}) is a leading digital asset ranked #${item.market_cap_rank || index + 1} by global market capitalization.`,
        website: `https://www.coingecko.com/en/coins/${item.id}`,
        explorer: `https://etherscan.io`,
      };
    });

    // Save to cache
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({
            timestamp: Date.now(),
            tokens: mappedTokens,
          })
        );
      } catch {
        // Storage full fallback
      }
    }

    return {
      tokens: mappedTokens,
      isLive: true,
      isCached: servedStale,
      lastUpdated: fetchedAt,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Market data unreachable';
    // Prefer the last real data this browser received (any age) over the built-in snapshot
    if (typeof window !== 'undefined') {
      try {
        const old = JSON.parse(sessionStorage.getItem(cacheKey) || 'null');
        if (old && Array.isArray(old.tokens) && old.tokens.length > 0) {
          return { tokens: old.tokens, isLive: true, isCached: true, lastUpdated: new Date(old.timestamp), error: errorMsg };
        }
      } catch {
        // fall through to snapshot
      }
    }
    // Last resort: illustrative built-in snapshot (the UI flags this as not live)
    return {
      tokens: cryptoTokens,
      isLive: false,
      isCached: false,
      lastUpdated: new Date(),
      error: errorMsg,
    };
  }
}

export interface GlobalStatsResult {
  stats: GlobalStats;
  isLive: boolean;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${path} HTTP ${res.status}`);
  return ((await res.json()) as { data: T }).data;
}

interface FngPayload {
  now: FearGreedReading;
  yesterday: FearGreedReading | null;
  lastWeek: FearGreedReading | null;
  lastMonth: FearGreedReading | null;
}

export async function fetchLiveGlobalStats(): Promise<GlobalStatsResult> {
  const [globalRes, fngRes, gasRes] = await Promise.allSettled([
    getJson<{
      total_market_cap?: { usd: number };
      market_cap_change_percentage_24h_usd?: number;
      market_cap_percentage?: { btc?: number; eth?: number };
      active_cryptocurrencies?: number;
      markets?: number;
    }>('/global'),
    getJson<FngPayload>('/fng'),
    getJson<{ gwei: number }>('/gas'),
  ]);

  const d = globalRes.status === 'fulfilled' ? globalRes.value : null;
  const live = Boolean(d?.total_market_cap?.usd);

  return {
    isLive: live,
    stats: {
      ...globalMarketStats,
      ...(live && d
        ? {
            totalMarketCap: d.total_market_cap!.usd,
            marketCapChange24h: Number((d.market_cap_change_percentage_24h_usd ?? 0).toFixed(2)),
            btcDominance: Number((d.market_cap_percentage?.btc ?? globalMarketStats.btcDominance).toFixed(1)),
            ethDominance: Number((d.market_cap_percentage?.eth ?? globalMarketStats.ethDominance).toFixed(1)),
            activeCryptos: d.active_cryptocurrencies ?? globalMarketStats.activeCryptos,
            exchangesCount: d.markets ?? globalMarketStats.exchangesCount,
          }
        : {}),
      fearGreed: fngRes.status === 'fulfilled' ? fngRes.value : null,
      gasGwei: gasRes.status === 'fulfilled' ? gasRes.value.gwei : null,
    },
  };
}

/** CoinGecko's /global total_volume is not reliable, so 24h volume is the sum over the listed top coins. */
export function withTopCoinVolume(stats: GlobalStats, tokens: CryptoToken[]): GlobalStats {
  const total = tokens.reduce((sum, t) => sum + (t.volume24h || 0), 0);
  return total > 0 ? { ...stats, volume24h: total } : stats;
}
