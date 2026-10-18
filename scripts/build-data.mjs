// Builds the static data behind the programmatic pages (public/data, public/sitemaps).
// Free, keyless sources only. Run with: npm run data   (CI runs it before every build and every few hours).
// Node >= 22.18 strips the TypeScript types of the two shared modules imported below.
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { geckoId } from '../functions/_providers/ids.ts';
import { bucketOf } from '../src/shared/bucket.ts';
import {
  CONVERT_FIAT_COINS, CONVERT_PAIR_COINS, FIAT,
  chainIsSubstantive, coinIsSubstantive, exchangeIsSubstantive, protocolIsSubstantive, stableIsSubstantive,
} from '../src/shared/pages.ts';

const OUT = new URL('../public/data/', import.meta.url);
const SITEMAPS = new URL('../public/sitemaps/', import.meta.url);
const SITE = 'https://encryptoverse.com';
const UA = 'Encryptoverse/1.0 (+https://encryptoverse.com)';
const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7);
const maxPages = Number(process.argv.find((a) => a.startsWith('--max-pages='))?.slice(12) ?? Infinity);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function getJson(url, tries = 4) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(45_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      last = e;
      await sleep(1500 * (i + 1));
    }
  }
  throw new Error(`${url}: ${last?.message ?? last}`);
}

/** Parse numbers that upstreams sometimes send as strings or junk such as "0?" or "". */
const num = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[^0-9eE+.-]/g, ''));
  return Number.isFinite(n) ? n : null;
};
const slugOk = /^[a-z0-9][a-z0-9._-]{0,79}$/;

async function writeBuckets(dir, records, keyOf) {
  const buckets = new Map();
  for (const r of records) {
    const b = bucketOf(keyOf(r));
    if (!buckets.has(b)) buckets.set(b, {});
    buckets.get(b)[keyOf(r)] = r;
  }
  await mkdir(new URL(dir, OUT), { recursive: true });
  await Promise.all([...buckets].map(([b, obj]) => writeFile(new URL(`${dir}${b}.json`, OUT), JSON.stringify(obj))));
  return buckets.size;
}

const xmlUrls = (paths) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map((p) => `  <url><loc>${SITE}${p}</loc></url>\n`).join('')}</urlset>\n`;

// ---------------------------------------------------------------------------------------------------- coins
async function buildCoins(manifest) {
  console.log('coins: fetching CoinLore tickers…');
  const first = await getJson('https://api.coinlore.net/api/tickers/?start=0&limit=100');
  const total = first.info?.coins_num ?? first.data.length;
  const pages = Math.min(Math.ceil(total / 100), maxPages);
  const rows = [...first.data];
  for (let p = 1; p < pages; p++) {
    const body = await getJson(`https://api.coinlore.net/api/tickers/?start=${p * 100}&limit=100`);
    rows.push(...(body.data ?? []));
    if (p % 25 === 0) console.log(`  …${rows.length}/${total}`);
    await sleep(150);
  }

  const seen = new Set();
  const coins = [];
  for (const c of rows) {
    const slug = geckoId(String(c.nameid ?? ''));
    if (!/^[a-z0-9-]{1,64}$/.test(slug) || seen.has(slug) || !c.name || !c.symbol) continue;
    seen.add(slug);
    const rec = {
      s: slug,
      i: String(c.id),
      n: String(c.name).slice(0, 80),
      y: String(c.symbol).slice(0, 20),
      r: num(c.rank) ?? coins.length + 1,
      p: num(c.price_usd),
      m: num(c.market_cap_usd),
      v: num(c.volume24),
      h1: num(c.percent_change_1h),
      h24: num(c.percent_change_24h),
      d7: num(c.percent_change_7d),
      c: num(c.csupply),
      t: num(c.tsupply),
      x: num(c.msupply),
    };
    coins.push(rec);
  }
  coins.sort((a, b) => a.r - b.r);

  const nb = await writeBuckets('coins/', coins, (c) => c.s);

  const PER = 100;
  await mkdir(new URL('coins/list/', OUT), { recursive: true });
  const listPages = Math.ceil(coins.length / PER);
  for (let i = 0; i < listPages; i++) {
    const slice = coins.slice(i * PER, (i + 1) * PER).map((c) => [c.s, c.n, c.y, c.r, c.p, c.h24, c.m]);
    await writeFile(new URL(`coins/list/${i + 1}.json`, OUT), JSON.stringify(slice));
  }

  // A page is "substantive" (indexable, in the sitemap) only when it has real data; the rules live in src/shared/pages.ts.
  const good = coins.filter(coinIsSubstantive);
  await mkdir(SITEMAPS, { recursive: true });
  await writeFile(new URL('coins.xml', SITEMAPS), xmlUrls([...good.map((c) => `/coin/${c.s}`)]));
  // Converter pages: top coins against every fiat currency, and the very top coins against each other.
  const convCoins = good.filter((c) => !c.s.includes('-to-')).slice(0, Math.max(CONVERT_FIAT_COINS, CONVERT_PAIR_COINS));
  await writeFile(new URL('convert-coins.json', OUT), JSON.stringify(convCoins.map((c) => [c.s, c.n, c.y])));
  const fiatPaths = convCoins.slice(0, CONVERT_FIAT_COINS).flatMap((c) => Object.keys(FIAT).map((f) => `/convert/${c.s}-to-${f}`));
  const pairCoins = convCoins.slice(0, CONVERT_PAIR_COINS);
  const pairPaths = pairCoins.flatMap((a) => pairCoins.filter((b) => b.s !== a.s).map((b) => `/convert/${a.s}-to-${b.s}`));
  await writeFile(new URL('convert-fiat.xml', SITEMAPS), xmlUrls(fiatPaths));
  await writeFile(new URL('convert-pairs.xml', SITEMAPS), xmlUrls(pairPaths));
  manifest.convert = { fiatPages: fiatPaths.length, pairPages: pairPaths.length, coinHubs: convCoins.slice(0, CONVERT_FIAT_COINS).length };
  manifest._convertHubs = convCoins.slice(0, CONVERT_FIAT_COINS).map((c) => `/convert/${c.s}`);
  manifest.coins = { total: coins.length, indexable: good.length, listPages, buckets: nb, perPage: PER };
  console.log(`coins: ${coins.length} records, ${good.length} substantive, ${listPages} list pages, ${nb} buckets`);
}

const slugify = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
const trimText = (s, n) => {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t;
};
const top = (obj, n) =>
  Object.entries(obj ?? {})
    .map(([k, v]) => [k, num(v)])
    .filter(([k, v]) => v && v > 0 && !/[-](borrowed|staking|pool2|vesting|doublecounted|liquidstaking|treasury)/i.test(k) && !k.includes('-'))
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);

// ------------------------------------------------------------------------------- DeFi: protocols, chains
async function buildDefi(manifest) {
  console.log('defi: fetching DefiLlama protocols + chains…');
  const [protocols, chains] = await Promise.all([getJson('https://api.llama.fi/protocols'), getJson('https://api.llama.fi/v2/chains')]);

  const seen = new Set();
  const recs = [];
  for (const p of protocols) {
    const slug = String(p.slug ?? '');
    if (!slugOk.test(slug) || seen.has(slug) || !p.name) continue;
    seen.add(slug);
    recs.push({
      s: slug,
      n: trimText(p.name, 80),
      y: p.symbol && p.symbol !== '-' ? trimText(p.symbol, 20) : null,
      u: typeof p.url === 'string' && p.url.startsWith('https://') ? p.url.slice(0, 200) : null,
      d: trimText(p.description, 320) || null,
      k: trimText(p.category, 40) || null,
      ch: (Array.isArray(p.chains) ? p.chains : []).slice(0, 12),
      nc: Array.isArray(p.chains) ? p.chains.length : 0,
      t: num(p.tvl),
      c1: num(p.change_1h),
      c1d: num(p.change_1d),
      c7: num(p.change_7d),
      m: num(p.mcap),
      tw: typeof p.twitter === 'string' ? p.twitter.slice(0, 40) : null,
      l: num(p.listedAt),
      tc: top(p.chainTvls, 8),
    });
  }
  recs.sort((a, b) => (b.t ?? -1) - (a.t ?? -1));
  const pnb = await writeBuckets('protocols/', recs, (r) => r.s);
  const goodP = recs.filter(protocolIsSubstantive);
  await mkdir(new URL('protocols/list/', OUT), { recursive: true });
  const pListPages = Math.ceil(recs.length / 100);
  for (let i = 0; i < pListPages; i++) {
    await writeFile(new URL(`protocols/list/${i + 1}.json`, OUT), JSON.stringify(recs.slice(i * 100, (i + 1) * 100).map((r) => [r.s, r.n, r.k, r.t, r.c1d])));
  }

  // Chains: TVL plus the protocols that hold the most value on each one (derived from the protocol data above).
  const bySlug = new Map();
  const chainRecs = [];
  for (const c of chains) {
    const slug = slugify(c.name);
    if (!slug || bySlug.has(slug)) continue;
    const topProtocols = recs
      .map((r) => [r, r.tc.find(([name]) => name === c.name)?.[1] ?? 0])
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([r, v]) => [r.s, r.n, r.k, Math.round(v)]);
    const rec = {
      s: slug,
      n: trimText(c.name, 60),
      y: c.tokenSymbol ? trimText(c.tokenSymbol, 20) : null,
      t: num(c.tvl),
      id: num(c.chainId),
      pc: recs.filter((r) => r.ch.includes(c.name) || r.tc.some(([name]) => name === c.name)).length,
      tp: topProtocols,
    };
    bySlug.set(slug, rec);
    chainRecs.push(rec);
  }
  chainRecs.sort((a, b) => (b.t ?? -1) - (a.t ?? -1));
  await mkdir(new URL('chains/', OUT), { recursive: true });
  await Promise.all(chainRecs.map((c) => writeFile(new URL(`chains/${c.s}.json`, OUT), JSON.stringify(c))));
  await writeFile(new URL('chains-index.json', OUT), JSON.stringify(chainRecs.map((c) => [c.s, c.n, c.t, c.pc])));
  const goodC = chainRecs.filter(chainIsSubstantive);

  await mkdir(SITEMAPS, { recursive: true });
  await writeFile(new URL('protocols.xml', SITEMAPS), xmlUrls(goodP.map((r) => `/defi/protocol/${r.s}`)));
  await writeFile(new URL('chains.xml', SITEMAPS), xmlUrls(goodC.map((c) => `/defi/chain/${c.s}`)));
  manifest.protocols = { total: recs.length, indexable: goodP.length, buckets: pnb, listPages: pListPages };
  manifest.chains = { total: chainRecs.length, indexable: goodC.length };
  console.log(`protocols: ${recs.length} records, ${goodP.length} substantive | chains: ${chainRecs.length}, ${goodC.length} substantive`);
}

// ------------------------------------------------------------------------------------- stablecoins, exchanges
async function buildStablesAndExchanges(manifest) {
  console.log('stablecoins + exchanges…');
  const [stable, ex] = await Promise.all([
    getJson('https://stablecoins.llama.fi/stablecoins?includePrices=true'),
    getJson('https://api.coinlore.net/api/exchanges/'),
  ]);

  const seenS = new Set();
  const stables = [];
  for (const a of stable.peggedAssets ?? []) {
    let slug = slugify(`${a.name}`);
    if (!slug) continue;
    if (seenS.has(slug)) slug = `${slug}-${slugify(a.symbol)}`;
    if (seenS.has(slug)) continue;
    seenS.add(slug);
    const peg = a.pegType ?? '';
    stables.push({
      s: slug,
      n: trimText(a.name, 80),
      y: trimText(a.symbol, 20),
      peg: String(peg).replace('peggedUSD', 'USD').replace('pegged', '').slice(0, 20),
      mech: trimText(a.pegMechanism, 40) || null,
      cs: num(a.circulating?.[peg]),
      c1d: num(a.circulatingPrevDay?.[peg]),
      c7d: num(a.circulatingPrevWeek?.[peg]),
      c30: num(a.circulatingPrevMonth?.[peg]),
      pr: num(a.price),
      ch: (Array.isArray(a.chains) ? a.chains : []).slice(0, 12),
      nc: Array.isArray(a.chains) ? a.chains.length : 0,
    });
  }
  stables.sort((a, b) => (b.cs ?? -1) - (a.cs ?? -1));
  const snb = await writeBuckets('stablecoins/', stables, (r) => r.s);
  const goodS = stables.filter(stableIsSubstantive);
  await writeFile(new URL('stablecoins-index.json', OUT), JSON.stringify(stables.map((r) => [r.s, r.n, r.y, r.cs])));

  const exRecs = Object.values(ex)
    .filter((e) => e && e.name_id && /^[a-z0-9-]{1,60}$/.test(e.name_id))
    .map((e) => ({ s: e.name_id, n: trimText(e.name, 80), v: num(e.volume_usd), ap: num(e.active_pairs), u: typeof e.url === 'string' && e.url.startsWith('https://') ? e.url.slice(0, 200) : null, co: trimText(e.country, 40) || null }))
    .sort((a, b) => (b.v ?? -1) - (a.v ?? -1))
    .map((e, i) => ({ ...e, r: i + 1 }));
  await writeFile(new URL('exchanges.json', OUT), JSON.stringify(exRecs));
  const goodE = exRecs.filter(exchangeIsSubstantive);

  await writeFile(new URL('stablecoins.xml', SITEMAPS), xmlUrls(goodS.map((r) => `/stablecoins/${r.s}`)));
  await writeFile(new URL('exchanges.xml', SITEMAPS), xmlUrls(goodE.map((r) => `/exchange/${r.s}`)));
  manifest.stablecoins = { total: stables.length, indexable: goodS.length, buckets: snb };
  manifest.exchanges = { total: exRecs.length, indexable: goodE.length };
  console.log(`stablecoins: ${stables.length} (${goodS.length} substantive) | exchanges: ${exRecs.length} (${goodE.length})`);
}

const manifest = { generatedAt: new Date().toISOString() };
if (!only) {
  await rm(OUT, { recursive: true, force: true });
  await rm(SITEMAPS, { recursive: true, force: true });
}
await mkdir(OUT, { recursive: true });
if (!only || only === 'coins') await buildCoins(manifest);
if (!only || only === 'defi') await buildDefi(manifest);
if (!only || only === 'stables') await buildStablesAndExchanges(manifest);
if (!only || only === 'coins' || only === 'defi') {
  const hubs = ['/coins', ...Array.from({ length: Math.max(0, (manifest.coins?.listPages ?? 1) - 1) }, (_, i) => `/coins/${i + 2}`)];
  if (manifest.protocols) hubs.push('/defi/protocols', ...Array.from({ length: Math.max(0, manifest.protocols.listPages - 1) }, (_, i) => `/defi/protocols/${i + 2}`), '/defi/chains');
  hubs.push('/stablecoins', '/exchanges', '/convert', ...(manifest._convertHubs ?? []));
  await mkdir(SITEMAPS, { recursive: true });
  await writeFile(new URL('hubs.xml', SITEMAPS), xmlUrls(hubs));
  manifest.hubs = hubs.length;
}
delete manifest._convertHubs;
await writeFile(new URL('manifest.json', OUT), JSON.stringify(manifest));
console.log('done', JSON.stringify(manifest));
