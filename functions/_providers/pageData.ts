// Server-side lookup for the programmatic pages: reads the static JSON the build wrote to /data and returns the
// SEO info (title, description, facts, related links) the middleware injects for crawlers.
import {
  CONVERT_PAIR_COINS, FIAT, LIST_PER_PAGE, chainInfo, convertAllowed, convertCoinInfo, jumpPages, chainListInfo, coinInfo, coinListInfo, convertHubInfo, convertInfo, exchangeInfo, exchangeListInfo,
  pathOf, protocolInfo, protocolListInfo, stableInfo, stableListInfo, usd, dataUrls,
  type ChainRec, type CoinRec, type ConvertCoin, type ExchangeRec, type PageInfo, type PageRoute, type ProtocolRec, type StableRec,
} from '../../src/shared/pages.ts';
import { bucketOf } from '../../src/shared/bucket.ts';

export interface Assets {
  fetch(input: Request | string): Promise<Response>;
}

export interface ResolvedPage {
  info: PageInfo;
  /** Plain internal links for crawlers: [path, label]. */
  links: [string, string][];
  /** Present on list pages so the fallback can show the entries. */
  generatedAt?: string;
}

async function read<T>(assets: Assets, origin: string, path: string): Promise<T | null> {
  try {
    const res = await assets.fetch(new Request(`${origin}${path}`));
    if (!res.ok || !(res.headers.get('content-type') ?? '').includes('json')) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

const bucketRecord = async <T>(assets: Assets, origin: string, dir: string, slug: string): Promise<T | null> =>
  (await read<Record<string, T>>(assets, origin, `/data/${dir}/${bucketOf(slug)}.json`))?.[slug] ?? null;

const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

async function chainSlugs(assets: Assets, origin: string): Promise<Set<string>> {
  const rows = await read<[string, string, number | null, number][]>(assets, origin, '/data/chains-index.json');
  return new Set((rows ?? []).map((r) => r[0]));
}

export async function resolvePage(assets: Assets, origin: string, route: PageRoute): Promise<ResolvedPage | null> {
  switch (route.kind) {
    case 'coin': {
      const c = await bucketRecord<CoinRec>(assets, origin, 'coins', route.slug);
      if (!c) return null;
      const page = Math.ceil(c.r / LIST_PER_PAGE);
      const [list, conv] = await Promise.all([
        read<[string, string, string, number][]>(assets, origin, `/data/coins/list/${page}.json`),
        read<[string, string, string][]>(assets, origin, '/data/convert-coins.json'),
      ]);
      const near = (list ?? []).filter(([s, , , rank]) => s !== c.s && Math.abs(rank - c.r) <= 5);
      const links: [string, string][] = near.map(([s, n, y]) => [`/coin/${s}`, `${n} (${y.toUpperCase()})`]);
      links.push([pathOf({ kind: 'coinList', page }), `Cryptocurrencies ranked ${(page - 1) * LIST_PER_PAGE + 1}–${page * LIST_PER_PAGE}`]);
      if (conv?.some(([s]) => s === c.s)) {
        links.push([`/convert/${c.s}`, `All ${c.y.toUpperCase()} conversions`]);
        for (const f of Object.keys(FIAT)) links.push([`/convert/${c.s}-to-${f}`, `${c.y.toUpperCase()} to ${f.toUpperCase()}`]);
      }
      return { info: coinInfo(c), links };
    }
    case 'coinList': {
      const rows = await read<[string, string, string, number, number | null, number | null, number | null][]>(assets, origin, `/data/coins/list/${route.page}.json`);
      const manifest = await read<{ coins?: { total: number; listPages: number } }>(assets, origin, '/data/manifest.json');
      if (!rows || !manifest?.coins) return null;
      const links: [string, string][] = rows.map(([s, n, y]) => [`/coin/${s}`, `${n} (${y.toUpperCase()})`]);
      const pages = manifest.coins.listPages;
      for (const p of jumpPages(route.page, pages)) if (p !== route.page) links.push([pathOf({ kind: 'coinList', page: p }), `Page ${p}`]);
      return { info: coinListInfo(route.page, manifest.coins.total), links };
    }
    case 'protocol': {
      const p = await bucketRecord<ProtocolRec>(assets, origin, 'protocols', route.slug);
      if (!p) return null;
      const known = await chainSlugs(assets, origin);
      const links: [string, string][] = p.tc.filter(([chain]) => known.has(slugify(chain))).slice(0, 8).map(([chain]) => [`/defi/chain/${slugify(chain)}`, `${chain} DeFi`]);
      return { info: protocolInfo(p), links };
    }
    case 'protocolList': {
      const rows = await read<[string, string, string | null, number | null, number | null][]>(assets, origin, `/data/protocols/list/${route.page}.json`);
      const manifest = await read<{ protocols?: { total: number; listPages: number } }>(assets, origin, '/data/manifest.json');
      if (!rows || !manifest?.protocols) return null;
      const links: [string, string][] = rows.map(([s, n]) => [`/defi/protocol/${s}`, n]);
      for (const p of jumpPages(route.page, manifest.protocols.listPages)) if (p !== route.page) links.push([pathOf({ kind: 'protocolList', page: p }), `Page ${p}`]);
      return { info: protocolListInfo(route.page, manifest.protocols.total), links };
    }
    case 'chain': {
      const c = await read<ChainRec>(assets, origin, `/data/chains/${route.slug}.json`);
      if (!c) return null;
      return { info: chainInfo(c), links: c.tp.map(([s, n, , tvl]) => [`/defi/protocol/${s}`, `${n} (${usd(tvl, true)} TVL)`] as [string, string]) };
    }
    case 'chainList': {
      const rows = await read<[string, string, number | null, number][]>(assets, origin, '/data/chains-index.json');
      return rows ? { info: chainListInfo(), links: rows.map(([s, n]) => [`/defi/chain/${s}`, n] as [string, string]) } : null;
    }
    case 'stable': {
      const s = await bucketRecord<StableRec>(assets, origin, 'stablecoins', route.slug);
      if (!s) return null;
      const known = await chainSlugs(assets, origin);
      return { info: stableInfo(s), links: s.ch.filter((ch) => known.has(slugify(ch))).slice(0, 8).map((ch) => [`/defi/chain/${slugify(ch)}`, `${ch} DeFi`] as [string, string]) };
    }
    case 'stableList': {
      const rows = await read<[string, string, string, number | null][]>(assets, origin, '/data/stablecoins-index.json');
      return rows ? { info: stableListInfo(), links: rows.map(([s, n, y]) => [`/stablecoins/${s}`, `${n} (${y.toUpperCase()})`] as [string, string]) } : null;
    }
    case 'exchange': {
      const rows = await read<ExchangeRec[]>(assets, origin, '/data/exchanges.json');
      const e = rows?.find((x) => x.s === route.slug);
      return e ? { info: exchangeInfo(e), links: (rows ?? []).filter((x) => x.s !== e.s).slice(0, 10).map((x) => [`/exchange/${x.s}`, x.n] as [string, string]) } : null;
    }
    case 'exchangeList': {
      const rows = await read<ExchangeRec[]>(assets, origin, '/data/exchanges.json');
      return rows ? { info: exchangeListInfo(), links: rows.map((x) => [`/exchange/${x.s}`, x.n] as [string, string]) } : null;
    }
    case 'convertHub': {
      const rows = await read<[string, string, string][]>(assets, origin, '/data/convert-coins.json');
      if (!rows) return null;
      return { info: convertHubInfo(), links: rows.map(([s, n, y]) => [`/convert/${s}`, `${n} (${y.toUpperCase()}) converter`] as [string, string]) };
    }
    case 'convertCoin': {
      const order = await read<[string, string, string][]>(assets, origin, '/data/convert-coins.json');
      if (!order || !convertAllowed(route, order.map((r) => r[0]))) return null;
      const c = await bucketRecord<CoinRec>(assets, origin, 'coins', route.coin);
      if (!c) return null;
      const pairs = order.findIndex((r) => r[0] === route.coin) < CONVERT_PAIR_COINS;
      const info = convertCoinInfo({ s: c.s, n: c.n, y: c.y }, pairs);
      if (c.p) info.facts.push(`${c.n} price at the last data build: ${usd(c.p)}`);
      const links: [string, string][] = [[`/coin/${c.s}`, `${c.n} price and stats`]];
      for (const f of Object.keys(FIAT)) links.push([`/convert/${c.s}-to-${f}`, `${c.y.toUpperCase()} to ${f.toUpperCase()}`]);
      if (pairs) for (const [s, , y] of order.slice(0, CONVERT_PAIR_COINS)) if (s !== c.s) links.push([`/convert/${c.s}-to-${s}`, `${c.y.toUpperCase()} to ${y.toUpperCase()}`]);
      return { info, links };
    }
    case 'convert': {
      const order = await read<[string, string, string][]>(assets, origin, '/data/convert-coins.json');
      if (!order || !convertAllowed(route, order.map((r) => r[0]))) return null;
      const from = await bucketRecord<CoinRec>(assets, origin, 'coins', route.from);
      if (!from) return null;
      const fromC: ConvertCoin = { s: from.s, n: from.n, y: from.y };
      const links: [string, string][] = [[`/convert/${from.s}`, `All ${from.y.toUpperCase()} conversions`], [`/coin/${from.s}`, `${from.n} price and stats`]];
      let info: PageInfo;
      if (route.to in FIAT) {
        info = convertInfo(fromC, { code: route.to, name: FIAT[route.to] });
        for (const f of Object.keys(FIAT)) if (f !== route.to) links.push([`/convert/${from.s}-to-${f}`, `${from.y.toUpperCase()} to ${f.toUpperCase()}`]);
      } else {
        const to = await bucketRecord<CoinRec>(assets, origin, 'coins', route.to);
        if (!to) return null;
        info = convertInfo(fromC, { s: to.s, n: to.n, y: to.y });
        links.push([`/convert/${to.s}-to-${from.s}`, `${to.y.toUpperCase()} to ${from.y.toUpperCase()}`], [`/convert/${from.s}-to-usd`, `${from.y.toUpperCase()} to USD`]);
      }
      if (from.p) info.facts.push(`${from.n} price at the last data build: ${usd(from.p)}`);
      return { info, links };
    }
  }
}

export const hasData = (route: PageRoute): boolean => dataUrls(route).length > 0;
