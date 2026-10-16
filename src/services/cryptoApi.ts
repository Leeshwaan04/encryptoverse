// Encryptoverse market data layer.
// Talks to CoinGecko's public API with timeouts, caching, and graceful degradation.

import { cryptoTokens, globalMarketStats, type CryptoToken } from '../data/cryptoData';

const API_BASE = 'https://api.coingecko.com/api/v3';
const CACHE_PREFIX = 'encryptoverse_market_v2_';
const CACHE_TTL_MS = 90_000; // Public API allows ~10-30 calls/min; cache keeps us well under.
const CHART_TTL_MS = 300_000;
const TIMEOUT_MS = 10_000;
const SPARKLINE_POINTS = 48;

interface CoinGeckoMarketItem {
  id?: string;
  symbol?: string;
  name?: string;
  image?: string;
  current_price?: number | null;
  market_cap?: number | null;
  market_cap_rank?: number | null;
  total_volume?: number | null;
  circulating_supply?: number | null;
  total_supply?: number | null;
  max_supply?: number | null;
  ath?: number | null;
  ath_date?: string | null;
  atl?: number | null;
  atl_date?: string | null;
  price_change_percentage_1h_in_currency?: number | null;
  price_change_percentage_24h_in_currency?: number | null;
  price_change_percentage_7d_in_currency?: number | null;
  sparkline_in_7d?: { price?: number[] | null } | null;
}

interface CoinGeckoGlobalData {
  total_market_cap?: Record<string, number>;
  total_volume?: Record<string, number>;
  market_cap_percentage?: Record<string, number>;
  market_cap_change_percentage_24h_usd?: number;
  active_cryptocurrencies?: number;
  markets?: number;
}

/** Native-chain explorers. Anything unmapped falls back to its CoinGecko page. */
const EXPLORERS: Record<string, string> = {
  bitcoin: 'https://mempool.space',
  ethereum: 'https://etherscan.io',
  solana: 'https://solscan.io',
  binancecoin: 'https://bscscan.com',
  ripple: 'https://xrpscan.com',
  cardano: 'https://cardanoscan.io',
  dogecoin: 'https://dogechain.info',
  tron: 'https://tronscan.org',
  'avalanche-2': 'https://snowtrace.io',
  polkadot: 'https://polkadot.subscan.io',
  litecoin: 'https://litecoinspace.org',
  sui: 'https://suiscan.xyz/mainnet',
  near: 'https://nearblocks.io',
  aptos: 'https://explorer.aptoslabs.com',
  stellar: 'https://stellar.expert/explorer/public',
  'the-open-network': 'https://tonviewer.com',
  arbitrum: 'https://arbiscan.io',
  optimism: 'https://optimistic.etherscan.io',
  'matic-network': 'https://polygonscan.com',
  'polygon-ecosystem-token': 'https://polygonscan.com',
  filecoin: 'https://filfox.info',
  arweave: 'https://viewblock.io/arweave',
  hedera: 'https://hashscan.io/mainnet',
};

export function explorerFor(id: string): string {
  return EXPLORERS[id] ?? `https://www.coingecko.com/en/coins/${encodeURIComponent(id)}`;
}

function classifyCategory(id: string, symbol: string): CryptoToken['category'] {
  const s = symbol.toLowerCase();
  const i = id.toLowerCase();

  const l2 = ['arb', 'op', 'pol', 'matic', 'strk', 'mnt', 'blast', 'base'];
  if (l2.includes(s) || i.includes('arbitrum') || i.includes('optimism') || i.includes('polygon')) return 'Layer 2';

  const ai = ['tao', 'render', 'fet', 'wld', 'grt', 'akt', 'ocean', 'agix'];
  if (ai.includes(s) || i.includes('bittensor') || i.includes('render') || i.includes('artificial')) return 'AI & Big Data';

  const meme = ['doge', 'shib', 'pepe', 'wif', 'bonk', 'floki', 'brett', 'popcat', 'bome'];
  if (meme.includes(s) || i.includes('pepe') || i.includes('shiba') || i.includes('doge') || i.includes('wif')) return 'Meme';

  const depin = ['hnt', 'fil', 'ar', 'io', 'grass', 'theta'];
  if (depin.includes(s) || i.includes('helium') || i.includes('filecoin') || i.includes('arweave')) return 'DePIN';

  const rwa = ['ondo', 'om', 'pendle', 'cfg', 'gfi'];
  if (rwa.includes(s) || i.includes('ondo') || i.includes('mantra') || i.includes('pendle')) return 'RWA';

  const defi = ['uni', 'link', 'aave', 'mkr', 'crv', 'snx', 'inj', 'jup', 'dydx', 'ldo', 'rune'];
  if (defi.includes(s) || i.includes('chainlink') || i.includes('uniswap') || i.includes('aave')) return 'DeFi';

  return 'Layer 1';
}

/** Evenly sample the 7-day series; keeps sparklines cheap but still shaped like the real curve. */
function sampleSparkline(prices: number[] | null | undefined, fallback: number): number[] {
  const clean = (prices ?? []).filter((n) => Number.isFinite(n));
  if (clean.length < 2) return Number.isFinite(fallback) ? [fallback, fallback] : [0, 0];
  if (clean.length <= SPARKLINE_POINTS) return clean;
  const step = (clean.length - 1) / (SPARKLINE_POINTS - 1);
  return Array.from({ length: SPARKLINE_POINTS }, (_, i) => clean[Math.round(i * step)]);
}

const num = (v: number | null | undefined, fallback = 0): number => (Number.isFinite(v) ? (v as number) : fallback);

const formatDate = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

export class RateLimitError extends Error {
  constructor() {
    super('CoinGecko rate limit reached. Showing the most recent data available.');
    this.name = 'RateLimitError';
  }
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  });
  if (res.status === 429) throw new RateLimitError();
  if (!res.ok) throw new Error(`CoinGecko returned ${res.status}`);
  return (await res.json()) as T;
}

const readCache = <T>(key: string, ttl: number): T | null => {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > ttl) return null;
    return parsed.value as T;
  } catch {
    return null;
  }
};

const writeCache = (key: string, value: unknown): void => {
  try {
    sessionStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), value }));
  } catch {
    // Session storage full or unavailable; caching is best-effort.
  }
};

export interface LiveMarketResult {
  tokens: CryptoToken[];
  isLive: boolean;
  isCached: boolean;
  lastUpdated: Date;
  error?: string;
}

export async function fetchLiveCryptoTokens(
  currency = 'USD',
  { force = false, signal }: { force?: boolean; signal?: AbortSignal } = {}
): Promise<LiveMarketResult> {
  const curr = currency.toLowerCase();
  const cacheKey = `${CACHE_PREFIX}${curr}`;

  if (!force) {
    const cached = readCache<{ tokens: CryptoToken[]; at: number }>(cacheKey, CACHE_TTL_MS);
    if (cached?.tokens?.length) {
      return { tokens: cached.tokens, isLive: true, isCached: true, lastUpdated: new Date(cached.at) };
    }
  }

  try {
    const url =
      `${API_BASE}/coins/markets?vs_currency=${encodeURIComponent(curr)}` +
      '&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=1h%2C24h%2C7d';
    const data = await getJson<CoinGeckoMarketItem[]>(url, signal);
    if (!Array.isArray(data) || data.length === 0) throw new Error('CoinGecko returned an empty market list');

    // Drop entries without the fields the UI depends on, rather than rendering NaN.
    const tokens: CryptoToken[] = data
      .filter((item) => item && typeof item.id === 'string' && typeof item.symbol === 'string')
      .map((item, index) => {
        const id = item.id as string;
        const symbol = (item.symbol as string).toUpperCase();
        const price = num(item.current_price);
        const rank = num(item.market_cap_rank, index + 1);
        return {
          id,
          rank,
          name: item.name || symbol,
          symbol,
          icon: item.image || '',
          price,
          change1h: Number(num(item.price_change_percentage_1h_in_currency).toFixed(2)),
          change24h: Number(num(item.price_change_percentage_24h_in_currency).toFixed(2)),
          change7d: Number(num(item.price_change_percentage_7d_in_currency).toFixed(2)),
          volume24h: num(item.total_volume),
          marketCap: num(item.market_cap),
          circulatingSupply: num(item.circulating_supply),
          maxSupply: Number.isFinite(item.max_supply) ? (item.max_supply as number) : Number.isFinite(item.total_supply) ? (item.total_supply as number) : null,
          category: classifyCategory(id, symbol),
          sparkline: sampleSparkline(item.sparkline_in_7d?.price, price),
          ath: num(item.ath),
          athDate: formatDate(item.ath_date),
          atl: num(item.atl),
          atlDate: formatDate(item.atl_date),
          description: `${item.name || symbol} (${symbol}) is ranked #${rank} by market capitalisation.`,
          website: `https://www.coingecko.com/en/coins/${encodeURIComponent(id)}`,
          explorer: explorerFor(id),
        };
      });

    if (tokens.length === 0) throw new Error('No usable entries in the CoinGecko response');

    writeCache(cacheKey, { tokens, at: Date.now() });
    return { tokens, isLive: true, isCached: false, lastUpdated: new Date() };
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;

    // Prefer a stale cache over bundled sample data: it is at least real and recent.
    const stale = readCache<{ tokens: CryptoToken[]; at: number }>(cacheKey, Infinity);
    const message = err instanceof Error ? err.message : 'CoinGecko is unreachable';
    if (stale?.tokens?.length) {
      return { tokens: stale.tokens, isLive: false, isCached: true, lastUpdated: new Date(stale.at), error: message };
    }
    return { tokens: cryptoTokens, isLive: false, isCached: false, lastUpdated: new Date(), error: message };
  }
}

export interface GlobalStatsResult {
  stats: typeof globalMarketStats;
  isLive: boolean;
}

export async function fetchLiveGlobalStats(signal?: AbortSignal): Promise<GlobalStatsResult> {
  try {
    const json = await getJson<{ data?: CoinGeckoGlobalData }>(`${API_BASE}/global`, signal);
    const d = json?.data;
    if (d?.total_market_cap) {
      return {
        stats: {
          ...globalMarketStats,
          totalMarketCap: num(d.total_market_cap.usd, globalMarketStats.totalMarketCap),
          marketCapChange24h: Number(num(d.market_cap_change_percentage_24h_usd).toFixed(2)),
          volume24h: num(d.total_volume?.usd, globalMarketStats.volume24h),
          btcDominance: Number(num(d.market_cap_percentage?.btc, globalMarketStats.btcDominance).toFixed(1)),
          ethDominance: Number(num(d.market_cap_percentage?.eth, globalMarketStats.ethDominance).toFixed(1)),
          activeCryptos: num(d.active_cryptocurrencies, globalMarketStats.activeCryptos),
          exchangesCount: num(d.markets, globalMarketStats.exchangesCount),
        },
        isLive: true,
      };
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
  }
  return { stats: globalMarketStats, isLive: false };
}

export interface FearGreedReading {
  value: number;
  label: string;
}

export interface FearGreedResult {
  now: FearGreedReading;
  yesterday?: FearGreedReading;
  lastWeek?: FearGreedReading;
  lastMonth?: FearGreedReading;
}

/** Fear & Greed index from alternative.me: free, CORS-enabled, no key, updated daily. */
export async function fetchFearGreed(signal?: AbortSignal): Promise<FearGreedResult | null> {
  const cached = readCache<FearGreedResult>('encryptoverse_fng_v1', CHART_TTL_MS);
  if (cached) return cached;
  try {
    const json = await getJson<{ data?: { value: string; value_classification: string }[] }>(
      'https://api.alternative.me/fng/?limit=31',
      signal
    );
    const rows = json.data ?? [];
    const read = (i: number): FearGreedReading | undefined => {
      const row = rows[i];
      if (!row) return undefined;
      const value = Number(row.value);
      return Number.isFinite(value) ? { value, label: row.value_classification } : undefined;
    };
    const now = read(0);
    if (!now) return null;
    const result: FearGreedResult = { now, yesterday: read(1), lastWeek: read(7), lastMonth: read(30) };
    writeCache('encryptoverse_fng_v1', result);
    return result;
  } catch {
    return null;
  }
}

export type ChartRange = '1D' | '7D' | '1M' | '1Y' | 'ALL';

const RANGE_DAYS: Record<ChartRange, string> = { '1D': '1', '7D': '7', '1M': '30', '1Y': '365', ALL: 'max' };

/** Real historical prices for the detail chart. Returns null when unavailable. */
export async function fetchPriceHistory(
  id: string,
  currency: string,
  range: ChartRange,
  signal?: AbortSignal
): Promise<number[] | null> {
  const key = `encryptoverse_chart_v1_${id}_${currency}_${range}`;
  const cached = readCache<number[]>(key, CHART_TTL_MS);
  if (cached) return cached;

  try {
    const url =
      `${API_BASE}/coins/${encodeURIComponent(id)}/market_chart` +
      `?vs_currency=${encodeURIComponent(currency.toLowerCase())}&days=${RANGE_DAYS[range]}`;
    const json = await getJson<{ prices?: [number, number][] }>(url, signal);
    const raw = (json.prices ?? []).map((p) => p?.[1]).filter((v): v is number => Number.isFinite(v));
    if (raw.length < 2) return null;
    // Cap at ~120 points: more than that is invisible at this chart size.
    const step = Math.max(1, Math.floor(raw.length / 120));
    const prices = raw.filter((_, i) => i % step === 0 || i === raw.length - 1);
    writeCache(key, prices);
    return prices;
  } catch {
    return null;
  }
}
