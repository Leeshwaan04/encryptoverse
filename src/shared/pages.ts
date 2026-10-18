// Programmatic page families: URL scheme, data record types and the meta/facts for each page.
// Pure TypeScript with no browser or React imports, so the Cloudflare middleware (SEO HTML for crawlers) and the
// React app (what visitors see) are generated from the same functions and can never disagree.
import { bucketOf } from './bucket.ts';

export type CoinRec = { s: string; i: string; n: string; y: string; r: number; p: number | null; m: number | null; v: number | null; h1: number | null; h24: number | null; d7: number | null; c: number | null; t: number | null; x: number | null };
export type ProtocolRec = { s: string; n: string; y: string | null; u: string | null; d: string | null; k: string | null; ch: string[]; nc: number; t: number | null; c1: number | null; c1d: number | null; c7: number | null; m: number | null; tw: string | null; l: number | null; tc: [string, number][] };
export type ChainRec = { s: string; n: string; y: string | null; t: number | null; id: number | null; pc: number; tp: [string, string, string | null, number][] };
export type StableRec = { s: string; n: string; y: string; peg: string; mech: string | null; cs: number | null; c1d: number | null; c7d: number | null; c30: number | null; pr: number | null; ch: string[]; nc: number };
export type ExchangeRec = { s: string; n: string; v: number | null; ap: number | null; u: string | null; co: string | null; r?: number };
export type ConvertCoin = { s: string; n: string; y: string };

/** Fiat currencies with a converter page (all published by the ECB via Frankfurter). */
export const FIAT: Record<string, string> = {
  usd: 'US Dollar', eur: 'Euro', gbp: 'British Pound', jpy: 'Japanese Yen', cny: 'Chinese Yuan', inr: 'Indian Rupee', aud: 'Australian Dollar',
  cad: 'Canadian Dollar', chf: 'Swiss Franc', krw: 'South Korean Won', brl: 'Brazilian Real', try: 'Turkish Lira', mxn: 'Mexican Peso',
  idr: 'Indonesian Rupiah', sgd: 'Singapore Dollar', hkd: 'Hong Kong Dollar', thb: 'Thai Baht', zar: 'South African Rand', sek: 'Swedish Krona',
  nok: 'Norwegian Krone', pln: 'Polish Zloty', dkk: 'Danish Krone', nzd: 'New Zealand Dollar', czk: 'Czech Koruna',
};
export const CONVERT_FIAT_COINS = 300; // top coins that get a coin-to-fiat page for every currency above
export const CONVERT_PAIR_COINS = 100; // top coins that get a page against each other

export const SLUG_RE = /^[a-z0-9][a-z0-9._-]{0,79}$/;
export const LIST_PER_PAGE = 100;

export type PageRoute =
  | { kind: 'coin'; slug: string }
  | { kind: 'coinList'; page: number }
  | { kind: 'protocolList'; page: number }
  | { kind: 'chainList' }
  | { kind: 'stableList' }
  | { kind: 'exchangeList' }
  | { kind: 'convertHub' }
  | { kind: 'convertCoin'; coin: string }
  | { kind: 'protocol'; slug: string }
  | { kind: 'chain'; slug: string }
  | { kind: 'stable'; slug: string }
  | { kind: 'exchange'; slug: string }
  | { kind: 'convert'; from: string; to: string };

const seg = (path: string, prefix: string): string | null => {
  const rest = path.startsWith(prefix) ? path.slice(prefix.length) : '';
  return rest && !rest.includes('/') && SLUG_RE.test(rest) ? rest : null;
};

/** Which programmatic page (if any) a pathname refers to. Trailing slashes are stripped by the caller. */
export function parsePagePath(path: string): PageRoute | null {
  let s: string | null;
  if ((s = seg(path, '/coin/'))) return /^[a-z0-9-]{1,64}$/.test(s) ? { kind: 'coin', slug: s } : null;
  if (path === '/coins') return { kind: 'coinList', page: 1 };
  if ((s = seg(path, '/coins/'))) return /^[1-9][0-9]{0,3}$/.test(s) ? { kind: 'coinList', page: Number(s) } : null;
  if (path === '/defi/protocols') return { kind: 'protocolList', page: 1 };
  if ((s = seg(path, '/defi/protocols/'))) return /^[1-9][0-9]{0,3}$/.test(s) ? { kind: 'protocolList', page: Number(s) } : null;
  if (path === '/defi/chains') return { kind: 'chainList' };
  if (path === '/stablecoins') return { kind: 'stableList' };
  if (path === '/exchanges') return { kind: 'exchangeList' };
  if (path === '/convert') return { kind: 'convertHub' };
  if ((s = seg(path, '/defi/protocol/'))) return { kind: 'protocol', slug: s };
  if ((s = seg(path, '/defi/chain/'))) return { kind: 'chain', slug: s };
  if ((s = seg(path, '/stablecoins/'))) return { kind: 'stable', slug: s };
  if ((s = seg(path, '/exchange/'))) return { kind: 'exchange', slug: s };
  if ((s = seg(path, '/convert/'))) {
    if (!s.includes('-to-')) return /^[a-z0-9-]{1,64}$/.test(s) ? { kind: 'convertCoin', coin: s } : null;
    // "<coin>-to-<fiat>" or "<coin>-to-<coin>". A coin slug can itself contain "-to-", so try every split for a fiat target.
    const parts = s.split('-to-');
    for (let i = 1; i < parts.length; i++) {
      const to = parts.slice(i).join('-to-');
      if (to in FIAT) return { kind: 'convert', from: parts.slice(0, i).join('-to-'), to };
    }
    if (parts.length >= 2) return { kind: 'convert', from: parts[0], to: parts.slice(1).join('-to-') };
  }
  return null;
}

export const pathOf = (r: PageRoute): string => {
  switch (r.kind) {
    case 'coin': return `/coin/${r.slug}`;
    case 'coinList': return r.page === 1 ? '/coins' : `/coins/${r.page}`;
    case 'protocolList': return r.page === 1 ? '/defi/protocols' : `/defi/protocols/${r.page}`;
    case 'chainList': return '/defi/chains';
    case 'stableList': return '/stablecoins';
    case 'exchangeList': return '/exchanges';
    case 'convertHub': return '/convert';
    case 'convertCoin': return `/convert/${r.coin}`;
    case 'protocol': return `/defi/protocol/${r.slug}`;
    case 'chain': return `/defi/chain/${r.slug}`;
    case 'stable': return `/stablecoins/${r.slug}`;
    case 'exchange': return `/exchange/${r.slug}`;
    case 'convert': return `/convert/${r.from}-to-${r.to}`;
  }
};

/** Where the JSON for a route lives (relative to the site root). Convert pages read the coin shards. */
export function dataUrls(r: PageRoute): string[] {
  switch (r.kind) {
    case 'coin': return [`/data/coins/${bucketOf(r.slug)}.json`];
    case 'coinList': return [`/data/coins/list/${r.page}.json`];
    case 'protocolList': return [`/data/protocols/list/${r.page}.json`];
    case 'chainList': return ['/data/chains-index.json'];
    case 'stableList': return ['/data/stablecoins-index.json'];
    case 'exchangeList': return ['/data/exchanges.json'];
    case 'convertHub': return ['/data/convert-coins.json'];
    case 'convertCoin': return [`/data/coins/${bucketOf(r.coin)}.json`, '/data/convert-coins.json'];
    case 'protocol': return [`/data/protocols/${bucketOf(r.slug)}.json`];
    case 'chain': return [`/data/chains/${r.slug}.json`];
    case 'stable': return [`/data/stablecoins/${bucketOf(r.slug)}.json`];
    case 'exchange': return ['/data/exchanges.json'];
    case 'convert': return ['/data/convert-coins.json', `/data/coins/${bucketOf(r.from)}.json`, ...(r.to in FIAT ? [] : [`/data/coins/${bucketOf(r.to)}.json`])];
  }
}

// ------------------------------------------------------------------------------------------- formatting
const nf = (maximumFractionDigits: number, notation: 'standard' | 'compact' = 'standard') =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits, notation });
export const usd = (n: number | null | undefined, compact = false): string => {
  if (n === null || n === undefined || !Number.isFinite(n)) return 'n/a';
  if (compact) return `$${nf(2, 'compact').format(n)}`;
  const d = Math.abs(n) >= 1 ? 2 : Math.abs(n) >= 0.01 ? 4 : 8;
  return `$${nf(d).format(n)}`;
};
export const pct = (n: number | null | undefined): string => (n === null || n === undefined || !Number.isFinite(n) ? 'n/a' : `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`);
export const qty = (n: number | null | undefined): string => (n === null || n === undefined || !Number.isFinite(n) ? 'n/a' : nf(2, 'compact').format(n));

/** A coin with no market cap and no volume is a stale listing: the page exists but is kept out of search results. */
export const coinIsSubstantive = (c: CoinRec): boolean => (c.p ?? 0) > 0 && ((c.m ?? 0) > 0 || (c.v ?? 0) > 0);
export const protocolIsSubstantive = (p: ProtocolRec): boolean => (p.t ?? 0) > 0 && Boolean(p.d);
export const chainIsSubstantive = (c: ChainRec): boolean => (c.t ?? 0) > 0 && c.tp.length > 0;
export const stableIsSubstantive = (s: StableRec): boolean => (s.cs ?? 0) > 0;
export const exchangeIsSubstantive = (e: ExchangeRec): boolean => (e.v ?? 0) > 0;

export interface PageInfo {
  title: string; // full <title>
  heading: string; // h1
  description: string;
  facts: string[];
  noindex: boolean;
  /** Related internal links shown as plain anchors: [path, label]. */
  related: [string, string][];
}

const isUpper = (s: string) => s.toUpperCase();
/** Append the brand to a title only when the result still fits in a search result (about 65 characters). */
const brand = (t: string): string => (t.length + 16 <= 65 ? `${t} | Encryptoverse` : t);
/** Very long names are shortened in titles and headings only (the full name stays in the page body). */
export const shortName = (n: string, max = 42): string => (n.length > max ? `${n.slice(0, max - 1).trimEnd()}…` : n);

export function coinInfo(c: CoinRec): PageInfo {
  const sym = isUpper(c.y);
  const active = coinIsSubstantive(c);
  return {
    title: brand(`${shortName(c.n)} (${sym}) Price, Market Cap & Stats`),
    heading: `${shortName(c.n, 60)} (${sym}) price`,
    description: active
      ? `${c.n} (${sym}) ranks #${c.r} by market cap${c.m ? ` at ${usd(c.m, true)}` : ''}. Price, 24-hour volume, supply and recent changes with the data source named.`
      : `${c.n} (${sym}) is listed at rank #${c.r} but shows little or no trading activity. Last recorded price, supply and the data source are shown here.`,
    facts: [
      `Rank: #${c.r}`,
      c.p !== null ? `Last recorded price: ${usd(c.p)}` : '',
      c.m ? `Market cap: ${usd(c.m, true)}` : '',
      c.v ? `24h volume: ${usd(c.v, true)}` : '',
      c.h24 !== null ? `24h change: ${pct(c.h24)}` : '',
      c.c ? `Circulating supply: ${qty(c.c)} ${sym}` : '',
      c.x ? `Max supply: ${qty(c.x)} ${sym}` : '',
    ].filter(Boolean),
    noindex: !active,
    related: [['/coins', 'All cryptocurrencies by rank']],
  };
}

export function coinListInfo(page: number, total: number): PageInfo {
  const first = (page - 1) * LIST_PER_PAGE + 1;
  const last = Math.min(page * LIST_PER_PAGE, total);
  return {
    title: brand(`Crypto Prices by Market Cap, Rank ${first}-${last}`),
    heading: `Cryptocurrencies ranked ${first}–${last}`,
    description: `Prices, market cap and 24-hour change for the cryptocurrencies ranked ${first} to ${last} by market cap, with links to each coin's page.`,
    facts: [],
    noindex: false,
    related: [],
  };
}

export function protocolInfo(p: ProtocolRec): PageInfo {
  const good = protocolIsSubstantive(p);
  return {
    title: brand(`${shortName(p.n)} TVL, Chains & Stats`),
    heading: `${p.n}${p.y ? ` (${isUpper(p.y)})` : ''}: TVL and stats`,
    description: good
      ? `${p.n} is a ${p.k ?? 'DeFi'} protocol with ${usd(p.t, true)} total value locked across ${p.nc} chain${p.nc === 1 ? '' : 's'}. TVL changes, chain breakdown and links, from DefiLlama.`
      : `${p.n}${p.k ? ` is listed as ${p.k}` : ''}. Chains, links and the latest value-locked figures where DefiLlama tracks them.`,
    facts: [
      p.k ? `Category: ${p.k}` : '',
      p.t !== null ? `Total value locked: ${usd(p.t, true)}` : '',
      p.c1d !== null ? `TVL 24h change: ${pct(p.c1d)}` : '',
      p.c7 !== null ? `TVL 7d change: ${pct(p.c7)}` : '',
      p.m ? `Market cap: ${usd(p.m, true)}` : '',
      p.ch.length ? `Chains: ${p.ch.slice(0, 8).join(', ')}${p.nc > 8 ? ` and ${p.nc - 8} more` : ''}` : '',
    ].filter(Boolean),
    noindex: !good,
    related: [['/defi', 'DeFi overview']],
  };
}

export function chainInfo(c: ChainRec): PageInfo {
  const good = chainIsSubstantive(c);
  return {
    title: brand(`${c.n} TVL and Top Protocols`),
    heading: `${c.n}: TVL and top protocols`,
    description: `${c.n} holds ${usd(c.t, true)} in total value locked across ${c.pc} protocol${c.pc === 1 ? '' : 's'}. See the largest protocols on ${c.n}, from DefiLlama.`,
    facts: [
      c.t !== null ? `Total value locked: ${usd(c.t, true)}` : '',
      `Protocols: ${c.pc}`,
      c.y ? `Native token: ${isUpper(c.y)}` : '',
      c.tp[0] ? `Largest protocol: ${c.tp[0][1]} (${usd(c.tp[0][3], true)} on this chain)` : '',
      c.tp[0] && c.t && c.t > 0 && c.tp[0][3] <= c.t ? `Share held by the largest protocol: ${((c.tp[0][3] / c.t) * 100).toFixed(1)}%` : '',
    ].filter(Boolean),
    noindex: !good,
    related: [['/defi', 'DeFi overview']],
  };
}

export function stableInfo(s: StableRec): PageInfo {
  const good = stableIsSubstantive(s);
  return {
    title: brand(`${s.n} (${isUpper(s.y)}) Supply, Peg & Chains`),
    heading: `${s.n} (${isUpper(s.y)}) stablecoin`,
    description: `${s.n} (${isUpper(s.y)}) has ${usd(s.cs, true)} in circulation across ${s.nc} chain${s.nc === 1 ? '' : 's'}. Peg type, mechanism, price and supply changes, from DefiLlama.`,
    facts: [
      `Peg: ${s.peg}${s.mech ? `, ${s.mech}` : ''}`,
      s.cs !== null ? `Circulating: ${usd(s.cs, true)}` : '',
      s.pr !== null ? `Price: ${usd(s.pr)}` : '',
      s.c7d && s.cs ? `7d supply change: ${pct(((s.cs - s.c7d) / s.c7d) * 100)}` : '',
      s.ch.length ? `Chains: ${s.ch.slice(0, 8).join(', ')}${s.nc > 8 ? ` and ${s.nc - 8} more` : ''}` : '',
    ].filter(Boolean),
    noindex: !good,
    related: [['/defi', 'DeFi overview']],
  };
}

export function exchangeInfo(e: ExchangeRec): PageInfo {
  return {
    title: brand(`${e.n} Exchange: 24h Volume & Trading Pairs`),
    heading: `${e.n} exchange`,
    description: `${e.n} reports ${usd(e.v, true)} in 24-hour trading volume across ${e.ap ?? 'n/a'} active pairs${e.co ? ` (${e.co})` : ''}. Data from CoinLore.`,
    facts: [e.v !== null ? `24h volume: ${usd(e.v, true)}` : '', e.ap !== null ? `Active pairs: ${e.ap}` : '', e.r ? `Volume rank among tracked exchanges: #${e.r}` : '', e.co ? `Country: ${e.co}` : ''].filter(Boolean),
    noindex: !exchangeIsSubstantive(e),
    related: [['/coins', 'Cryptocurrencies by rank']],
  };
}

export function convertInfo(from: ConvertCoin, to: { code: string; name: string } | ConvertCoin): PageInfo {
  const toLabel = 'code' in to ? `${to.name} (${to.code.toUpperCase()})` : `${to.n} (${to.y.toUpperCase()})`;
  const fromSym = from.y.toUpperCase();
  const toSym = 'code' in to ? to.code.toUpperCase() : to.y.toUpperCase();
  return {
    title: brand(`${fromSym} to ${toSym}: Convert ${from.n} to ${'code' in to ? to.name : to.n}`),
    heading: `${from.n} (${fromSym}) to ${toLabel}`,
    description: `Convert ${from.n} to ${'code' in to ? to.name : to.n} at the current rate. Enter any amount of ${fromSym} and see the ${toSym} value, with a table of common amounts.`,
    facts: [],
    noindex: false,
    related: [['/converter', 'Full converter']],
  };
}

export function protocolListInfo(page: number, total: number): PageInfo {
  const first = (page - 1) * LIST_PER_PAGE + 1;
  const last = Math.min(page * LIST_PER_PAGE, total);
  return {
    title: brand(`DeFi Protocols by TVL, Rank ${first}-${last}`),
    heading: `DeFi protocols ranked ${first}–${last} by TVL`,
    description: `DeFi protocols ranked ${first} to ${last} by total value locked, with category and 24-hour TVL change, from DefiLlama.`,
    facts: [],
    noindex: false,
    related: [['/defi', 'DeFi overview']],
  };
}
export const chainListInfo = (): PageInfo => ({
  title: brand('Blockchains Ranked by DeFi TVL'),
  heading: 'Blockchains ranked by DeFi TVL',
  description: 'Every blockchain tracked by DefiLlama, ranked by the total value locked in its DeFi protocols.',
  facts: [], noindex: false, related: [['/defi', 'DeFi overview']],
});
export const stableListInfo = (): PageInfo => ({
  title: brand('Stablecoins Ranked by Circulating Supply'),
  heading: 'Stablecoins ranked by circulating supply',
  description: 'Every stablecoin tracked by DefiLlama, ranked by circulating supply, with peg type and chain count.',
  facts: [], noindex: false, related: [['/defi', 'DeFi overview']],
});
export const exchangeListInfo = (): PageInfo => ({
  title: brand('Crypto Exchanges Ranked by 24h Volume'),
  heading: 'Crypto exchanges ranked by 24h volume',
  description: 'Cryptocurrency exchanges ranked by reported 24-hour trading volume, with active pairs and country, from CoinLore.',
  facts: [], noindex: false, related: [['/coins', 'Cryptocurrencies by rank']],
});
export const convertHubInfo = (): PageInfo => ({
  title: brand(`Crypto Converter: ${CONVERT_FIAT_COINS} Coins to ${Object.keys(FIAT).length} Currencies`),
  heading: 'Crypto converter',
  description: `Convert the top ${CONVERT_FIAT_COINS} cryptocurrencies into ${Object.keys(FIAT).length} currencies, or between the top ${CONVERT_PAIR_COINS} coins, at current rates.`,
  facts: [], noindex: false, related: [['/converter', 'Full converter']],
});

/**
 * Which converter pages exist. `order` is the ranked slug list in /data/convert-coins.json. Pages exist only for the
 * combinations that are published (top coins x fiat, top coins x top coins), never for arbitrary slugs, so the page
 * space is bounded and crawlers cannot wander into millions of near-identical URLs.
 */
export function convertAllowed(route: Extract<PageRoute, { kind: 'convert' | 'convertCoin' }>, order: string[]): boolean {
  const idx = (slug: string) => order.indexOf(slug);
  if (route.kind === 'convertCoin') return idx(route.coin) >= 0;
  const a = idx(route.from);
  if (a < 0) return false;
  if (route.to in FIAT) return a < CONVERT_FIAT_COINS;
  const b = idx(route.to);
  return a < CONVERT_PAIR_COINS && b >= 0 && b < CONVERT_PAIR_COINS && a !== b;
}

/** Pagination links: neighbours, first/last and every tenth page, so any page is only a few clicks from page 1. */
export function jumpPages(page: number, pages: number): number[] {
  const set = new Set<number>([1, pages]);
  for (let p = page - 3; p <= page + 3; p++) if (p >= 1 && p <= pages) set.add(p);
  for (let p = 10; p <= pages; p += 10) set.add(p);
  return [...set].sort((a, b) => a - b);
}

export function convertCoinInfo(coin: ConvertCoin, hasPairs: boolean): PageInfo {
  const sym = coin.y.toUpperCase();
  const nFiat = Object.keys(FIAT).length;
  return {
    title: brand(`${coin.n} (${sym}) Converter: ${sym} to ${nFiat} Currencies`),
    heading: `${coin.n} (${sym}) converter`,
    description: `Convert ${coin.n} (${sym}) into ${nFiat} currencies${hasPairs ? ` or ${CONVERT_PAIR_COINS - 1} other cryptocurrencies` : ''} at the current rate, with a table of live conversion rates.`,
    facts: [`Currencies: ${nFiat}`, ...(hasPairs ? [`Crypto pairs: ${CONVERT_PAIR_COINS - 1}`] : [])],
    noindex: false,
    related: [['/convert', 'Crypto converter']],
  };
}
