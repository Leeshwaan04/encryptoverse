// Encryptoverse market data layer.
// Talks to CoinGecko's public API with timeouts, caching, and graceful degradation.

import { cryptoTokens, globalMarketStats, type CryptoToken, type GlobalStats } from '../data/cryptoData';

const API_BASE = 'https://api.coingecko.com/api/v3';
// Same-origin Cloudflare Pages Functions proxy (see /functions/api): edge-cached, shields us from rate limits.
const PROXY_BASE = '/api';
/**
 * The proxy only exists on a real deployment. Static previews and local dev have no functions (they would answer
 * /api/* with 404s), so use direct calls there. Set VITE_FORCE_PROXY=1 when building to test the proxy locally.
 */
export const EDGE_PROXY_ENABLED =
  typeof window !== 'undefined' &&
  (import.meta.env.VITE_FORCE_PROXY === '1' || !['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname));
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

function explorerFor(id: string): string {
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
function sampleSparkline(prices: number[] | null | undefined): number[] {
  const clean = (prices ?? []).filter((n) => Number.isFinite(n));
  // No history available: return nothing rather than a flat line that would imply "no movement".
  if (clean.length < 2) return [];
  if (clean.length <= SPARKLINE_POINTS) return clean;
  const step = (clean.length - 1) / (SPARKLINE_POINTS - 1);
  return Array.from({ length: SPARKLINE_POINTS }, (_, i) => clean[Math.round(i * step)]);
}

const num = (v: number | null | undefined, fallback = 0): number => (Number.isFinite(v) ? (v as number) : fallback);

/**
 * Only let http(s) URLs out of the API layer and into the DOM.
 * A compromised or spoofed upstream could otherwise hand us `javascript:` or
 * `data:text/html` and have us render it into an href or src.
 */
function safeUrl(value: string | null | undefined): string {
  if (!value) return '';
  try {
    const url = new URL(value, window.location.origin);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : '';
  } catch {
    return '';
  }
}

const formatDate = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

class RateLimitError extends Error {
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

/**
 * Prefer the edge proxy; if it is absent (static preview, local dev) or failing, call the upstream directly.
 * A static host answers /api/* with index.html, so anything that is not JSON counts as "no proxy".
 */
async function getProxied<T>(
  proxyPath: string,
  directUrl: string,
  signal?: AbortSignal,
  fromDirect: (raw: unknown) => T = (raw) => raw as T
): Promise<{ data: T; viaProxy: boolean; source: string }> {
  try {
    if (!EDGE_PROXY_ENABLED) throw new Error('edge proxy disabled');
    const timeout = AbortSignal.timeout(TIMEOUT_MS);
    const res = await fetch(`${PROXY_BASE}${proxyPath}`, {
      headers: { Accept: 'application/json' },
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
    if (res.ok && (res.headers.get('content-type') ?? '').includes('application/json')) {
      const body = (await res.json()) as { data?: T; source?: string } | null;
      if (body && body.data !== undefined && body.data !== null) {
        return { data: body.data, viaProxy: true, source: typeof body.source === 'string' ? body.source.slice(0, 60) : 'Encryptoverse API' };
      }
    }
  } catch (err) {
    if (signal?.aborted) throw err;
  }
  return { data: fromDirect(await getJson<unknown>(directUrl, signal)), viaProxy: false, source: 'CoinGecko' };
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
  /** Which provider(s) supplied the figures, for attribution. */
  source?: string;
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
    const { data, source } = await getProxied<CoinGeckoMarketItem[]>(`/markets?currency=${encodeURIComponent(curr)}`, url, signal);
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
          icon: safeUrl(item.image),
          price,
          change1h: Number(num(item.price_change_percentage_1h_in_currency).toFixed(2)),
          change24h: Number(num(item.price_change_percentage_24h_in_currency).toFixed(2)),
          change7d: Number(num(item.price_change_percentage_7d_in_currency).toFixed(2)),
          volume24h: num(item.total_volume),
          marketCap: num(item.market_cap),
          circulatingSupply: num(item.circulating_supply),
          maxSupply: Number.isFinite(item.max_supply) ? (item.max_supply as number) : Number.isFinite(item.total_supply) ? (item.total_supply as number) : null,
          category: classifyCategory(id, symbol),
          sparkline: sampleSparkline(item.sparkline_in_7d?.price),
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
    return { tokens, isLive: true, isCached: false, lastUpdated: new Date(), source };
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
  stats: GlobalStats;
  isLive: boolean;
}

/** CoinGecko's own /global volume field is unreliable (it has returned tens of trillions), so reject implausible values. */
const plausibleVolume = (volume: number | undefined, marketCap: number | undefined): number | null =>
  Number.isFinite(volume) && Number.isFinite(marketCap) && (volume as number) > 0 && (volume as number) < (marketCap as number) * 0.5
    ? (volume as number)
    : null;

export async function fetchLiveGlobalStats(signal?: AbortSignal): Promise<GlobalStatsResult> {
  try {
    const { data: d } = await getProxied<(CoinGeckoGlobalData & { top50_volume_usd?: number }) | undefined>(
      '/global',
      `${API_BASE}/global`,
      signal,
      (raw) => (raw as { data?: CoinGeckoGlobalData } | null)?.data
    );
    if (d?.total_market_cap) {
      const cap = num(d.total_market_cap.usd, globalMarketStats.totalMarketCap);
      return {
        stats: {
          ...globalMarketStats,
          totalMarketCap: cap,
          marketCapChange24h: Number(num(d.market_cap_change_percentage_24h_usd).toFixed(2)),
          volume24h: plausibleVolume(d.top50_volume_usd, cap) ?? plausibleVolume(d.total_volume?.usd, cap),
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

/** Current Ethereum gas price in Gwei. Only the edge proxy provides it, so it is simply absent without one. */
export async function fetchGasGwei(signal?: AbortSignal): Promise<number | null> {
  if (!EDGE_PROXY_ENABLED) return null;
  try {
    const res = await fetch(`${PROXY_BASE}/gas`, { headers: { Accept: 'application/json' }, signal });
    if (!res.ok || !(res.headers.get('content-type') ?? '').includes('application/json')) return null;
    const body = (await res.json()) as { data?: { gwei?: number } };
    return Number.isFinite(body.data?.gwei) ? (body.data!.gwei as number) : null;
  } catch {
    return null;
  }
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
    const { data, viaProxy } = await getProxied<unknown>('/fng', 'https://api.alternative.me/fng/?limit=31', signal);
    let result: FearGreedResult | null = null;
    if (viaProxy) {
      const d = data as { now?: FearGreedReading | null; yesterday?: FearGreedReading | null; lastWeek?: FearGreedReading | null; lastMonth?: FearGreedReading | null };
      if (d.now && Number.isFinite(d.now.value)) {
        result = { now: d.now, yesterday: d.yesterday ?? undefined, lastWeek: d.lastWeek ?? undefined, lastMonth: d.lastMonth ?? undefined };
      }
    } else {
      const rows = (data as { data?: { value: string; value_classification: string }[] }).data ?? [];
      const read = (i: number): FearGreedReading | undefined => {
        const row = rows[i];
        if (!row) return undefined;
        const value = Number(row.value);
        return Number.isFinite(value) ? { value, label: row.value_classification } : undefined;
      };
      const now = read(0);
      if (now) result = { now, yesterday: read(1), lastWeek: read(7), lastMonth: read(30) };
    }
    if (!result) return null;
    writeCache('encryptoverse_fng_v1', result);
    return result;
  } catch {
    return null;
  }
}

// CoinGecko's public API only serves the past 365 days, so there is no "ALL" range.
export type ChartRange = '1D' | '7D' | '1M' | '1Y';

const RANGE_DAYS: Record<ChartRange, string> = { '1D': '1', '7D': '7', '1M': '30', '1Y': '365' };

/** Real historical prices for the detail chart. Returns null when unavailable. */
export async function fetchPriceHistory(
  id: string,
  currency: string,
  range: ChartRange,
  signal?: AbortSignal,
  symbol?: string
): Promise<number[] | null> {
  const key = `encryptoverse_chart_v1_${id}_${currency}_${range}`;
  const cached = readCache<number[]>(key, CHART_TTL_MS);
  if (cached) return cached;

  try {
    const url =
      `${API_BASE}/coins/${encodeURIComponent(id)}/market_chart` +
      `?vs_currency=${encodeURIComponent(currency.toLowerCase())}&days=${RANGE_DAYS[range]}`;
    const { data: json } = await getProxied<{ points?: [number, number][] }>(
      `/chart?id=${encodeURIComponent(id)}&symbol=${encodeURIComponent(symbol ?? '')}&days=${RANGE_DAYS[range]}&currency=${encodeURIComponent(currency.toLowerCase())}`,
      url,
      signal,
      (raw) => ({ points: (raw as { prices?: [number, number][] } | null)?.prices })
    );
    const raw = (json.points ?? []).map((p) => p?.[1]).filter((v): v is number => Number.isFinite(v));
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

// ---------------------------------------------------------------- DeFi and new pools (edge proxy only)

export interface DefiSnapshot {
  totalTvl: number;
  chains: { name: string; symbol: string | null; tvl: number; share: number }[];
  stablecoins: { total: number; chains: { name: string; circulating: number }[] };
  governance: { title: string; space: string; endsAt: string; url: string }[];
}

export interface NewPool {
  name: string;
  network: string;
  dex: string;
  createdAt: string | null;
  priceUsd: number;
  liquidityUsd: number;
  fdvUsd: number | null;
  change24h: number;
  volume24hUsd: number;
  txns24h: number;
  url: string;
}

async function proxyOnly<T>(path: string, signal?: AbortSignal): Promise<{ data: T; fetchedAt: string; source: string } | null> {
  if (!EDGE_PROXY_ENABLED) return null;
  try {
    const res = await fetch(`${PROXY_BASE}${path}`, { headers: { Accept: 'application/json' }, signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(TIMEOUT_MS)]) : AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok || !(res.headers.get('content-type') ?? '').includes('application/json')) return null;
    const body = (await res.json()) as { data?: T; fetchedAt?: string; source?: string };
    if (body.data === undefined || body.data === null) return null;
    return { data: body.data, fetchedAt: body.fetchedAt ?? '', source: typeof body.source === 'string' ? body.source.slice(0, 60) : '' };
  } catch {
    return null;
  }
}

/** Only https links from the API are ever rendered as hrefs. */
const httpsOnly = (u: unknown): string => (typeof u === 'string' && u.startsWith('https://') ? u : '');

export async function fetchDefi(signal?: AbortSignal) {
  const r = await proxyOnly<DefiSnapshot>('/defi', signal);
  if (!r) return null;
  return { ...r, data: { ...r.data, governance: (r.data.governance ?? []).map((g) => ({ ...g, url: httpsOnly(g.url) })).filter((g) => g.url) } };
}

export async function fetchNewPools(signal?: AbortSignal) {
  const r = await proxyOnly<{ pools: NewPool[] }>('/pools', signal);
  if (!r) return null;
  return { ...r, data: { pools: (r.data.pools ?? []).map((p) => ({ ...p, url: httpsOnly(p.url) })).filter((p) => p.url) } };
}
