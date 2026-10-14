// Encryptoverse Live Crypto Market API Service
// Connects to CoinGecko public market feeds with resilient caching and offline fallback

import { cryptoTokens, globalMarketStats, type CryptoToken } from '../data/cryptoData';

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
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${curr}&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=1h%2C24h%2C7d`;
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`CoinGecko HTTP error: ${response.status}`);
    }

    const data: CoinGeckoMarketItem[] = await response.json();

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
      isCached: false,
      lastUpdated: new Date(),
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'CoinGecko API unreachable';
    // Graceful offline fallback to rich local token list
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
  stats: typeof globalMarketStats;
  isLive: boolean;
}

export async function fetchLiveGlobalStats(): Promise<GlobalStatsResult> {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/global');
    if (!res.ok) throw new Error('Global stats failed');
    const json = await res.json();
    const d = json?.data;

    if (d && d.total_market_cap) {
      return {
        stats: {
          totalMarketCap: d.total_market_cap.usd || globalMarketStats.totalMarketCap,
          marketCapChange24h: Number((d.market_cap_change_percentage_24h_usd || 0).toFixed(2)),
          volume24h: d.total_volume.usd || globalMarketStats.volume24h,
          btcDominance: Number((d.market_cap_percentage.btc || 56.4).toFixed(1)),
          ethDominance: Number((d.market_cap_percentage.eth || 15.2).toFixed(1)),
          gasGwei: globalMarketStats.gasGwei,
          fearGreedIndex: globalMarketStats.fearGreedIndex,
          fearGreedLabel: globalMarketStats.fearGreedLabel,
          activeCryptos: d.active_cryptocurrencies || globalMarketStats.activeCryptos,
          exchangesCount: d.markets || globalMarketStats.exchangesCount,
        },
        isLive: true,
      };
    }
  } catch {
    // Offline fallback
  }

  return {
    stats: globalMarketStats,
    isLive: false,
  };
}

