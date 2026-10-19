// Audits EVERY generated page (about 42,000) from the data files, without a browser or the network:
// titles, descriptions, thin content, indexing rules, internal links, orphans and click depth.
// Run after `npm run data`:  node scripts/audit-pages.mjs      (exit code 1 on any hard failure)
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolvePage } from '../functions/_providers/pageData.ts';
import { FIAT, parsePagePath } from '../src/shared/pages.ts';
import { ROUTE_TABLE } from '../src/config/seo.ts';

const PUB = new URL('../public/', import.meta.url);
const ORIGIN = 'https://encryptoverse.com';
const fileCache = new Map();
const assets = {
  async fetch(input) {
    const path = new URL(typeof input === 'string' ? input : input.url).pathname;
    let body = fileCache.get(path);
    if (body === undefined) body = existsSync(new URL(path.slice(1), PUB)) ? readFileSync(new URL(path.slice(1), PUB), 'utf8') : null;
    fileCache.set(path, body);
    return body === null ? new Response('nf', { status: 404 }) : new Response(body, { headers: { 'content-type': 'application/json' } });
  },
};

const locs = (name) => [...readFileSync(new URL(`sitemaps/${name}.xml`, PUB), 'utf8').matchAll(/<loc>https:\/\/encryptoverse\.com([^<]+)</g)].map((m) => m[1]);
const indexable = [...new Set(['hubs', 'coins', 'protocols', 'chains', 'stablecoins', 'exchanges', 'convert-fiat', 'convert-pairs'].flatMap(locs))];
const core = Object.keys(ROUTE_TABLE).filter((p) => p !== '/watchlist');
const manifest = JSON.parse(readFileSync(new URL('data/manifest.json', PUB), 'utf8'));

// Every page that exists (including noindex ones), so their rules are audited too.
const all = new Set(indexable);
for (const dir of ['coins', 'protocols', 'stablecoins']) {
  for (const f of readdirSync(new URL(`data/${dir}/`, PUB)).filter((x) => x.endsWith('.json'))) {
    for (const slug of Object.keys(JSON.parse(readFileSync(new URL(`data/${dir}/${f}`, PUB), 'utf8')))) {
      all.add(dir === 'coins' ? `/coin/${slug}` : dir === 'protocols' ? `/defi/protocol/${slug}` : `/stablecoins/${slug}`);
    }
  }
}
// Ranking pages that fail the substance rule are served (noindex) but absent from the sitemaps; audit them too.
for (let i = 1; i <= manifest.coins.listPages; i++) all.add(i === 1 ? '/coins' : `/coins/${i}`);
for (let i = 1; i <= manifest.protocols.listPages; i++) all.add(i === 1 ? '/defi/protocols' : `/defi/protocols/${i}`);
for (const f of readdirSync(new URL('data/chains/', PUB))) all.add(`/defi/chain/${f.replace('.json', '')}`);
for (const e of JSON.parse(readFileSync(new URL('data/exchanges.json', PUB), 'utf8'))) all.add(`/exchange/${e.s}`);

const problems = { hard: [], warn: [] };
const hard = (m) => problems.hard.length < 60 && problems.hard.push(m);
const warn = (m) => problems.warn.push(m);

const pages = new Map(); // path -> { info, links }
let n = 0;
for (const path of all) {
  const route = parsePagePath(path);
  if (!route) { hard(`router cannot parse ${path}`); continue; }
  const page = await resolvePage(assets, ORIGIN, route);
  if (!page) { hard(`no data for ${path}`); continue; }
  pages.set(path, page);
  if (++n % 10000 === 0) console.log(`  …${n}/${all.size}`);
}

const idxSet = new Set(indexable);
const titles = new Map();
const descs = new Map();
const stats = { titleLong: 0, titleShort: 0, descLong: 0, descShort: 0, thin: 0, bad: 0 };
const BAD = /\bNaN\b|\bundefined\b|\[object|\bnull\b|[$:+-]Infinity/;
for (const [path, { info }] of pages) {
  const inSitemap = idxSet.has(path);
  if (inSitemap && info.noindex) hard(`${path} is in a sitemap but marked noindex`);
  // Converter pages are deliberately indexable but not announced in the sitemap index (held back), so skip them here.
  if (!inSitemap && !info.noindex) hard(`${path} is indexable but missing from the sitemaps`);
  const text = [info.title, info.heading, info.description, ...info.facts].join(' | ');
  if (BAD.test(text)) { stats.bad++; hard(`bad token in ${path}: ${text.slice(0, 120)}`); }
  if (!inSitemap) continue;
  if (info.title.length > 100) hard(`title ${info.title.length} chars: ${path}`);
  if (info.title.length > 65) { stats.titleLong++; warn(`title ${info.title.length} chars: ${path}`); }
  if (info.title.length < 20) { stats.titleShort++; warn(`title too short: ${path}`); }
  if (info.description.length > 175) { stats.descLong++; warn(`description ${info.description.length} chars: ${path}`); }
  if (info.description.length < 70) { stats.descShort++; warn(`description too short: ${path}`); }
  const isHubOrConvert = path.startsWith('/convert/') || /^\/(coins|defi\/protocols|defi\/chains|stablecoins|exchanges|convert)(\/\d+)?$/.test(path);
  if (!isHubOrConvert && info.facts.length < 3) { stats.thin++; hard(`thin page (${info.facts.length} facts): ${path}`); }
  titles.set(info.title, [...(titles.get(info.title) ?? []), path]);
  descs.set(info.description, [...(descs.get(info.description) ?? []), path]);
}
const dupT = [...titles].filter(([, p]) => p.length > 1);
const dupD = [...descs].filter(([, p]) => p.length > 1);
if (dupT.length) hard(`${dupT.length} duplicate titles among indexable pages, e.g. "${dupT[0][0]}" on ${dupT[0][1].slice(0, 3).join(', ')}`);
if (dupD.length) hard(`${dupD.length} duplicate descriptions among indexable pages, e.g. ${dupD[0][1].slice(0, 3).join(', ')}`);

// Internal links: every target must exist; every indexable page needs an inbound link and a short click path from home.
const navLinks = [...core, '/coins', '/defi/protocols', '/defi/chains', '/stablecoins', '/exchanges', '/convert'];
const inbound = new Map();
const edges = new Map([['/', navLinks]]);
for (const p of core) edges.set(p, navLinks);
let broken = 0;
const exists = (target) => pages.has(target) || core.includes(target) || target === '/' || target === '/watchlist';
for (const [path, { links }] of pages) {
  const out = [...navLinks];
  for (const [to] of links) {
    out.push(to);
    if (!exists(to)) { broken++; hard(`broken internal link on ${path} -> ${to}`); }
    inbound.set(to, (inbound.get(to) ?? 0) + 1);
  }
  edges.set(path, out);
}
const depth = new Map([['/', 0]]);
const q = ['/'];
while (q.length) {
  const cur = q.shift();
  for (const to of edges.get(cur) ?? []) if (!depth.has(to)) { depth.set(to, depth.get(cur) + 1); q.push(to); }
}
const orphans = indexable.filter((p) => !inbound.get(p) && !navLinks.includes(p));
const unreachable = indexable.filter((p) => !depth.has(p));
const deep = indexable.filter((p) => (depth.get(p) ?? 99) > 4);
if (orphans.length) hard(`${orphans.length} indexable pages have no inbound internal link, e.g. ${orphans.slice(0, 3).join(', ')}`);
if (unreachable.length) hard(`${unreachable.length} indexable pages cannot be reached by clicking from the home page, e.g. ${unreachable.slice(0, 3).join(', ')}`);
if (deep.length) warn(`${deep.length} indexable pages are more than 4 clicks from home, e.g. ${deep.slice(0, 3).join(', ')}`);
const maxDepth = Math.max(...depth.values());

const summary = {
  pagesAudited: pages.size, inSitemaps: indexable.length + core.length, noindex: [...pages.values()].filter((p) => p.info.noindex).length,
  fiatCurrencies: Object.keys(FIAT).length, dataBuiltAt: manifest.generatedAt,
  titleLong: stats.titleLong, titleShort: stats.titleShort, descLong: stats.descLong, descShort: stats.descShort, thin: stats.thin,
  duplicateTitles: dupT.length, duplicateDescriptions: dupD.length, brokenLinks: broken, orphans: orphans.length, unreachable: unreachable.length, maxClickDepth: maxDepth, over4Clicks: deep.length,
};
console.log(JSON.stringify(summary, null, 2));
if (problems.warn.length) console.log(`warnings (${problems.warn.length}), first 8:\n  ` + problems.warn.slice(0, 8).join('\n  '));
if (problems.hard.length) {
  console.log(`HARD FAILURES (${problems.hard.length}${problems.hard.length >= 60 ? '+' : ''}):\n  ` + problems.hard.slice(0, 25).join('\n  '));
  process.exit(1);
}
console.log('page audit passed');
