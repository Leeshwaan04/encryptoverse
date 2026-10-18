// Client-side loading for the programmatic pages: static JSON from /data (written by the data build) plus two small
// live endpoints. Everything is cached in memory for the session.
import { CONVERT_PAIR_COINS, FIAT, LIST_PER_PAGE, convertAllowed, dataUrls, type ChainRec, type CoinRec, type ConvertCoin, type ExchangeRec, type PageRoute, type ProtocolRec, type StableRec } from '../shared/pages';
import { bucketOf } from '../shared/bucket';

const cache = new Map<string, Promise<unknown>>();

export function loadJson<T>(path: string): Promise<T> {
  let p = cache.get(path) as Promise<T> | undefined;
  if (!p) {
    p = fetch(path, { headers: { Accept: 'application/json' } }).then((r) => {
      if (!r.ok || !(r.headers.get('content-type') ?? '').includes('json')) throw new Error(`HTTP ${r.status}`);
      return r.json() as Promise<T>;
    });
    cache.set(path, p);
    p.catch(() => cache.delete(path)); // do not remember failures
  }
  return p;
}

export interface Manifest {
  generatedAt: string;
  coins?: { total: number; listPages: number };
  protocols?: { total: number; listPages: number };
}
export const loadManifest = () => loadJson<Manifest>('/data/manifest.json');

export type CoinListRow = [slug: string, name: string, symbol: string, rank: number, price: number | null, change24h: number | null, marketCap: number | null];
export type ProtocolListRow = [slug: string, name: string, category: string | null, tvl: number | null, change1d: number | null];

export interface LiveCoin {
  p: number | null; m: number | null; v: number | null; h1: number | null; h24: number | null; d7: number | null;
  c: number | null; t: number | null; x: number | null; r: number | null;
  markets: { ex: string; pair: string; p: number | null; v: number | null }[];
}
interface Envelope<T> {
  fetchedAt: string;
  source?: string;
  data: T;
}

/** Live CoinLore figures for any coin. Resolves to null on any failure: pages then show the data snapshot. */
export async function loadLiveCoin(slug: string): Promise<LiveCoin | null> {
  try {
    const r = await fetch(`/api/coin?slug=${encodeURIComponent(slug)}`, { headers: { Accept: 'application/json' } });
    if (!r.ok || !(r.headers.get('content-type') ?? '').includes('json')) return null;
    return ((await r.json()) as Envelope<LiveCoin>).data ?? null;
  } catch {
    return null;
  }
}

export async function loadRates(): Promise<Record<string, number> | null> {
  try {
    const r = await fetch('/api/rates', { headers: { Accept: 'application/json' } });
    if (!r.ok || !(r.headers.get('content-type') ?? '').includes('json')) return null;
    return ((await r.json()) as Envelope<{ rates: Record<string, number> }>).data?.rates ?? null;
  } catch {
    return null;
  }
}

export type LoadedPage =
  | { kind: 'coin'; coin: CoinRec; near: CoinListRow[]; convertible: boolean }
  | { kind: 'coinList'; page: number; rows: CoinListRow[]; pages: number; total: number }
  | { kind: 'protocol'; protocol: ProtocolRec; chainSlugs: Set<string> }
  | { kind: 'protocolList'; page: number; rows: ProtocolListRow[]; pages: number; total: number }
  | { kind: 'chain'; chain: ChainRec }
  | { kind: 'chainList'; rows: [string, string, number | null, number][] }
  | { kind: 'stable'; stable: StableRec; chainSlugs: Set<string> }
  | { kind: 'stableList'; rows: [string, string, string, number | null][] }
  | { kind: 'exchange'; exchange: ExchangeRec; others: ExchangeRec[] }
  | { kind: 'exchangeList'; rows: ExchangeRec[] }
  | { kind: 'convertHub'; coins: ConvertCoin[] }
  | { kind: 'convertCoin'; coin: CoinRec; pairs: boolean; others: ConvertCoin[] }
  | { kind: 'convert'; from: CoinRec; to: { fiat: string } | { coin: CoinRec } };

export const loadChainSlugs = async (): Promise<Set<string>> => {
  const rows = await loadJson<[string, string, number | null, number][]>('/data/chains-index.json').catch(() => []);
  return new Set(rows.map((r) => r[0]));
};
const loadConvertOrder = async (): Promise<[string, string, string][]> => loadJson<[string, string, string][]>('/data/convert-coins.json').catch(() => []);

const bucketRec = async <T>(dir: string, slug: string): Promise<T | null> => (await loadJson<Record<string, T>>(`/data/${dir}/${bucketOf(slug)}.json`))[slug] ?? null;

/** Load everything a page needs. Resolves to null when the page does not exist (the caller shows a 404 view). */
export async function loadPage(route: PageRoute): Promise<LoadedPage | null> {
  try {
    switch (route.kind) {
      case 'coin': {
        const coin = await bucketRec<CoinRec>('coins', route.slug);
        if (!coin) return null;
        const listPage = Math.ceil(coin.r / LIST_PER_PAGE);
        const [list, conv] = await Promise.all([loadJson<CoinListRow[]>(`/data/coins/list/${listPage}.json`).catch(() => []), loadJson<[string, string, string][]>('/data/convert-coins.json').catch(() => [])]);
        return { kind: 'coin', coin, near: list.filter((r) => r[0] !== coin.s && Math.abs(r[3] - coin.r) <= 5), convertible: conv.some((c) => c[0] === coin.s) };
      }
      case 'coinList': {
        const [rows, m] = await Promise.all([loadJson<CoinListRow[]>(dataUrls(route)[0]), loadManifest()]);
        return m.coins ? { kind: 'coinList', page: route.page, rows, pages: m.coins.listPages, total: m.coins.total } : null;
      }
      case 'protocol': {
        const protocol = await bucketRec<ProtocolRec>('protocols', route.slug);
        return protocol ? { kind: 'protocol', protocol, chainSlugs: await loadChainSlugs() } : null;
      }
      case 'protocolList': {
        const [rows, m] = await Promise.all([loadJson<ProtocolListRow[]>(dataUrls(route)[0]), loadManifest()]);
        return m.protocols ? { kind: 'protocolList', page: route.page, rows, pages: m.protocols.listPages, total: m.protocols.total } : null;
      }
      case 'chain':
        return { kind: 'chain', chain: await loadJson<ChainRec>(dataUrls(route)[0]) };
      case 'chainList':
        return { kind: 'chainList', rows: await loadJson(dataUrls(route)[0]) };
      case 'stable': {
        const stable = await bucketRec<StableRec>('stablecoins', route.slug);
        return stable ? { kind: 'stable', stable, chainSlugs: await loadChainSlugs() } : null;
      }
      case 'stableList':
        return { kind: 'stableList', rows: await loadJson(dataUrls(route)[0]) };
      case 'exchange': {
        const all = await loadJson<ExchangeRec[]>(dataUrls(route)[0]);
        const exchange = all.find((e) => e.s === route.slug);
        return exchange ? { kind: 'exchange', exchange, others: all.filter((e) => e.s !== exchange.s).slice(0, 10) } : null;
      }
      case 'exchangeList':
        return { kind: 'exchangeList', rows: await loadJson(dataUrls(route)[0]) };
      case 'convertHub': {
        const rows = await loadJson<[string, string, string][]>(dataUrls(route)[0]);
        return { kind: 'convertHub', coins: rows.map(([s, n, y]) => ({ s, n, y })) };
      }
      case 'convertCoin': {
        const order = await loadConvertOrder();
        if (!convertAllowed(route, order.map((r) => r[0]))) return null;
        const coin = await bucketRec<CoinRec>('coins', route.coin);
        if (!coin) return null;
        const pairs = order.findIndex((r) => r[0] === route.coin) < CONVERT_PAIR_COINS;
        const others = order.slice(0, CONVERT_PAIR_COINS).filter((r) => r[0] !== route.coin).map(([s, n, y]) => ({ s, n, y }));
        return { kind: 'convertCoin', coin, pairs, others };
      }
      case 'convert': {
        const order = await loadConvertOrder();
        if (!convertAllowed(route, order.map((r) => r[0]))) return null;
        const from = await bucketRec<CoinRec>('coins', route.from);
        if (!from) return null;
        if (route.to in FIAT) return { kind: 'convert', from, to: { fiat: route.to } };
        const coin = await bucketRec<CoinRec>('coins', route.to);
        return coin ? { kind: 'convert', from, to: { coin } } : null;
      }
    }
  } catch {
    return null;
  }
}
