// Encryptoverse E2E audit. Usage: node audit.mjs <baseUrl> <outDir>
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { mockApi } from './fixtures.mjs';
import { bucketOf } from '../src/shared/bucket.ts';
import { parsePagePath } from '../src/shared/pages.ts';

const require = createRequire(import.meta.url);
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const BASE = process.argv[2] || 'http://localhost:4173/';
const BYPASS = process.argv[4] === 'bypass-csp'; // needed to inject axe into a CSP-protected origin
const OUT = process.argv[3] || 'tests/out';
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const rec = (area, name, pass, detail = '') => {
  results.push({ area, name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} [${area}] ${name}${detail ? ' :: ' + detail : ''}`);
};
const check = async (area, name, fn) => {
  try {
    const r = await fn();
    if (r === true || r === undefined) rec(area, name, true);
    else if (r === false) rec(area, name, false);
    else rec(area, name, !!r.pass, r.detail);
  } catch (e) {
    rec(area, name, false, 'threw: ' + String(e.message).split('\n')[0].slice(0, 120));
  }
};

const browser = await chromium.launch({ headless: true, ...(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}) });
async function ctx(viewport, opts = {}, mock = {}) {
  const c = await browser.newContext({ viewport, bypassCSP: BYPASS, ...opts });
  const p = await c.newPage();
  if (mock !== false) await mockApi(p, mock);
  p._err = [];
  p.on('pageerror', (e) => p._err.push('pageerror: ' + e.message));
  p.on('console', (m) => m.type() === 'error' && p._err.push('console: ' + m.text().slice(0, 140)));
  return { c, p };
}
const shot = (p, n) => p.screenshot({ path: path.join(OUT, n + '.png'), fullPage: false });
const tab = (p, label) => p.getByRole('link', { name: new RegExp(label, 'i') }).first();
const overflow = (p) => p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
const txt = (p) => p.locator('body').innerText();
// A stuck overlay intercepts pointer events; clear it so later checks still run.
async function clearOverlay(p) {
  for (let i = 0; i < 3; i++) {
    const n = await p.locator('[role=dialog], .fixed.inset-0').count().catch(() => 0);
    if (!n) return;
    await p.keyboard.press('Escape').catch(() => {});
    await p.waitForTimeout(150);
    const btn = p.locator('[aria-label*="Close" i], button:has-text("\u2715")').first();
    if (await btn.count().catch(() => 0)) await btn.click({ timeout: 1500 }).catch(() => {});
    await p.waitForTimeout(150);
  }
  if (await p.locator('[role=dialog], .fixed.inset-0').count().catch(() => 0)) {
    await p.reload({ waitUntil: 'networkidle' }).catch(() => {});
    await p.waitForTimeout(1000);
  }
}

// ---------------------------------------------------------------- DESKTOP
{
  const { c, p } = await ctx({ width: 1440, height: 900 });
  await p.goto(BASE, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1800);
  await shot(p, 'desktop-markets');

  await check('Data', 'Market table renders rows', async () => {
    const n = await p.locator('tbody tr').count();
    return { pass: n >= 10, detail: `${n} rows` };
  });

  // ---- currency correctness
  await check('Currency', 'EUR shows € not $', async () => {
    await p.locator('select').first().selectOption('EUR');
    await p.waitForTimeout(2600);
    const price = await p.locator('tbody tr').first().locator('td').nth(3).innerText();
    return { pass: price.includes('€'), detail: `first row: ${price}` };
  });
  await check('Currency', 'EUR market cap not labelled $', async () => {
    const row = await p.locator('tbody tr').first().innerText();
    return { pass: !row.includes('$'), detail: row.replace(/\s+/g, ' ').slice(0, 110) };
  });
  await check('Currency', 'BTC denomination sane (not $0.02B cap)', async () => {
    await p.locator('select').first().selectOption('BTC');
    await p.waitForTimeout(2600);
    const row = await p.locator('tbody tr').first().innerText();
    await p.locator('select').first().selectOption('USD');
    await p.waitForTimeout(2200);
    return { pass: !row.includes('$'), detail: row.replace(/\s+/g, ' ').slice(0, 110) };
  });

  // ---- numeric formatting
  await check('Formatting', 'No "+-" malformed percentages anywhere', async () => {
    const t = await txt(p);
    return { pass: !t.includes('+-'), detail: (t.match(/\+-[\d.]+%/g) || []).slice(0, 3).join(', ') };
  });
  await check('Formatting', 'No NaN / undefined / Infinity on screen', async () => {
    const t = await txt(p);
    const bad = ['NaN', 'undefined', 'Infinity'].filter((w) => t.includes(w));
    return { pass: bad.length === 0, detail: bad.join(', ') };
  });

  // ---- search UX
  await check('Search', 'Filters results', async () => {
    const i = p.locator('input[type=text], input[type=search]').first();
    await i.fill('eth');
    await p.waitForTimeout(400);
    const n = await p.locator('tbody tr').count();
    return { pass: n > 0 && n < 50, detail: `${n} rows for "eth"` };
  });
  await check('Search', 'Empty state when nothing matches', async () => {
    const i = p.locator('input[type=text], input[type=search]').first();
    await i.fill('zzzqqq');
    await p.waitForTimeout(400);
    const has = await p.locator('text=/no (coins|results|matches)/i').count();
    await shot(p, 'desktop-search-empty');
    await i.fill('');
    return { pass: has > 0, detail: has ? 'present' : 'blank table, no message' };
  });
  await check('Search', 'Clear-search affordance exists', async () => {
    const i = p.locator('input[type=text], input[type=search]').first();
    await i.fill('btc');
    await p.waitForTimeout(300);
    const btn = await p.getByRole('button', { name: /clear/i }).count();
    await i.fill('');
    return { pass: btn > 0, detail: btn ? 'yes' : 'no clear button' };
  });
  await check('Search', 'Searching from another tab surfaces results', async () => {
    await tab(p, 'Converter').click();
    await p.waitForTimeout(300);
    const i = p.locator('input[type=text], input[type=search]').first();
    await i.fill('sol');
    await p.waitForTimeout(400);
    const rows = await p.locator('tbody tr').count();
    await i.fill('');
    return { pass: rows > 0, detail: `${rows} rows visible after typing on Converter tab` };
  });

  // ---- deep linking / state
  await check('State', 'Tab survives reload (URL-backed)', async () => {
    await tab(p, 'Converter').click();
    await p.waitForTimeout(300);
    const url = p.url();
    await p.reload({ waitUntil: 'networkidle' });
    await p.waitForTimeout(600);
    const still = (await txt(p)).toLowerCase().includes('converter');
    return { pass: still, detail: `url=${url}` };
  });
  await check('State', 'Browser Back works between tabs', async () => {
    await tab(p, 'Cryptocurrencies').click();
    await p.waitForTimeout(300);
    await tab(p, 'Watchlist').click();
    await p.waitForTimeout(300);
    const before = p.url();
    await p.goBack();
    await p.waitForTimeout(600);
    const stillInApp = p.url().startsWith(BASE.replace(/\/$/, ''));
    const t = stillInApp ? (await txt(p)).toLowerCase() : '';
    if (!stillInApp) { await p.goto(BASE, { waitUntil: 'networkidle' }); await p.waitForTimeout(1200); }
    return { pass: stillInApp && t.includes('market cap'), detail: stillInApp ? 'returned to Markets' : `left the app (${before} had no in-app history)` };
  });

  // ---- a11y structure
  await check('A11y', 'Sortable headers are real buttons', async () => {
    await tab(p, 'Cryptocurrencies').click();
    await p.waitForTimeout(400);
    const n = await p.locator('thead button').count();
    return { pass: n > 0, detail: `${n} header buttons` };
  });
  await check('A11y', 'aria-sort on sorted column', async () => {
    const n = await p.locator('thead [aria-sort]').count();
    return { pass: n > 0, detail: `${n} columns expose aria-sort` };
  });
  await check('A11y', 'Star buttons have accessible names', async () => {
    const bad = await p.locator('tbody tr td:first-child button').evaluateAll((e) => e.filter((x) => !x.getAttribute('aria-label') && !x.textContent.trim()).length);
    return { pass: bad === 0, detail: `${bad} unnamed` };
  });
  await check('A11y', 'Token row reachable by keyboard', async () => {
    const n = await p.locator('tbody tr button, tbody tr a, tbody tr[tabindex]').count();
    return { pass: n > 0, detail: `${n} focusable row targets` };
  });
  await check('A11y', 'Skip-to-content link', async () => {
    const n = await p.locator('a[href="#main"], a[href^="#"]:has-text("Skip")').count();
    return { pass: n > 0, detail: n ? 'present' : 'absent' };
  });
  await check('A11y', 'Exactly one h1', async () => {
    const n = await p.locator('h1').count();
    return { pass: n === 1, detail: `${n} h1 elements` };
  });

  // ---- modal behaviour
  await check('Modal', 'Opens on row click', async () => {
    await p.locator('tbody tr').first().locator('td').nth(2).click();
    await p.waitForTimeout(600);
    const open = (await p.locator('[role=dialog]').count()) > 0;
    await shot(p, 'desktop-token-modal');
    return open;
  });
  await check('Modal', 'role=dialog + aria-modal', async () => {
    const n = await p.locator('[role=dialog][aria-modal=true]').count();
    return { pass: n > 0, detail: `${n}` };
  });
  await check('Modal', 'Escape closes', async () => {
    await p.keyboard.press('Escape');
    await p.waitForTimeout(400);
    const closed = !(await txt(p)).toLowerCase().includes('price performance');
    return closed;
  });
  await clearOverlay(p);
  await check('Modal', 'Backdrop click closes', async () => {
    const open = (await txt(p)).toLowerCase().includes('chart') && (await p.locator('[role=dialog]').count()) > 0;
    if (!open) await p.locator('tbody tr').first().locator('td').nth(2).click();
    await p.waitForTimeout(400);
    await p.mouse.click(8, 450);
    await p.waitForTimeout(400);
    const closed = (await p.locator('[role=dialog]').count()) === 0 || !(await txt(p)).toLowerCase().includes('price performance');
    return closed;
  });
  await clearOverlay(p);
  await check('Modal', 'Body scroll locked while open', async () => {
    await p.locator('tbody tr').first().locator('td').nth(2).click();
    await p.waitForTimeout(400);
    const locked = await p.evaluate(() => getComputedStyle(document.body).overflow === 'hidden');
    return { pass: locked, detail: locked ? 'locked' : 'page scrolls behind modal' };
  });
  await clearOverlay(p);
  await check('Modal', 'Chart differs per coin (real data, not a template)', async () => {
    const a = await p.locator('svg polyline').last().getAttribute('points');
    await p.keyboard.press('Escape');
    await p.waitForTimeout(400);
    await p.locator('tbody tr').nth(4).locator('td').nth(2).click();
    await p.waitForTimeout(900);
    const b = await p.locator('svg polyline').last().getAttribute('points');
    return { pass: a !== b, detail: a === b ? 'identical shape for different coins' : 'differs' };
  });
  await check('Modal', 'Explorer link is coin-specific', async () => {
    const hrefs = await p.locator('[role=dialog] a, .fixed a').evaluateAll((a) => a.map((x) => x.href));
    const generic = hrefs.filter((h) => h === 'https://etherscan.io/');
    return { pass: generic.length === 0, detail: generic.length ? 'every coin links to etherscan.io root' : 'specific' };
  });
  await p.keyboard.press('Escape').catch(() => {});

  // ---- honesty of data
  await clearOverlay(p);
  await check('Honesty', 'No hardcoded wallet balance shown', async () => {
    const t = await txt(p);
    return { pass: !t.includes('6,420.50'), detail: t.includes('6,420.50') ? 'fake $6,420.50 balance present' : 'clean' };
  });
  await check('Honesty', 'Token sales page is sourced, dated and has no fake listings', async () => {
    await tab(p, 'ICO').click();
    await p.waitForTimeout(600);
    await shot(p, 'desktop-ico');
    const t = await txt(p);
    const sourced = (await p.locator('main a[href^="https://"][target=_blank]').count()) >= 8;
    const dated = /checked against the sources shown on/i.test(t);
    const fake = t.includes('Encryptoverse Network');
    return { pass: sourced && dated && !fake, detail: `sourcedLinks=${sourced} dated=${dated} fake=${fake}` };
  });
  await check('Routing', 'Each tab has its own URL, title and canonical', async () => {
    const out = [];
    for (const [label, path] of [['ICO', '/token-sales'], ['Trending', '/trending'], ['DeFi', '/defi'], ['News', '/news'], ['Convert', '/converter']]) {
      await tab(p, label).click();
      await p.waitForTimeout(500);
      const u = new URL(p.url()).pathname;
      const canon = await p.locator('link[rel=canonical]').getAttribute('href');
      const ok = u === path && canon === 'https://encryptoverse.com' + path && (await p.title()).includes('Encryptoverse');
      if (!ok) out.push(`${label}: path=${u} canonical=${canon}`);
    }
    return { pass: out.length === 0, detail: out.join(' | ') || 'all 5 tabs routed' };
  });
  await check('Routing', 'Coin rows are real /coin/<id> links that open the detail modal', async () => {
    await p.goto(BASE, { waitUntil: 'networkidle' });
    await p.waitForTimeout(800);
    const link = p.locator('tbody a[href^="/coin/"]').first();
    const href = await link.getAttribute('href');
    await link.click();
    await p.waitForTimeout(700);
    const open = (await p.locator('[role=dialog]').count()) > 0;
    const urlOk = new URL(p.url()).pathname === href;
    const title = await p.title();
    await p.keyboard.press('Escape');
    await p.waitForTimeout(500);
    const back = new URL(p.url()).pathname === '/';
    return { pass: Boolean(href) && open && urlOk && /Price, Market Cap/.test(title) && back, detail: `href=${href} modal=${open} url=${urlOk} title="${title}" closedToHome=${back}` };
  });
  await check('Routing', '/coin/<id> cold load is a standalone page (no swap to a modal); unknown coin shows not-found', async () => {
    await p.goto(BASE + 'coin/bitcoin', { waitUntil: 'networkidle' });
    await p.waitForTimeout(1500);
    const modal = (await p.locator('[role=dialog]').count()) > 0;
    const h1 = await p.locator('h1').first().innerText();
    await p.goto(BASE + 'coin/definitely-not-a-coin', { waitUntil: 'networkidle' });
    await p.waitForTimeout(900);
    const nf = /Page not found/i.test(await p.locator('h1').first().innerText());
    await p.goto(BASE, { waitUntil: 'networkidle' });
    return { pass: !modal && /bitcoin/i.test(h1) && nf, detail: `modal=${modal} h1="${h1}" unknownNotFound=${nf}` };
  });
  await check('Routing', 'Closing the coin modal does not leave a Back entry that reopens it', async () => {
    await p.goto(BASE, { waitUntil: 'networkidle' });
    await p.waitForTimeout(600);
    await p.locator('tbody a[href^="/coin/"]').first().click();
    await p.waitForTimeout(500);
    await p.keyboard.press('Escape');
    await p.waitForTimeout(500);
    const closedAt = new URL(p.url()).pathname;
    const reopened = (await p.locator('[role=dialog]').count()) > 0;
    return { pass: closedAt === '/' && !reopened, detail: `afterClose=${closedAt} modal=${reopened}` };
  });
  await check('SEO', 'Exactly one h1 on every tab and while a coin is open', async () => {
    const bad = [];
    for (const path of ['/', '/token-sales', '/trending', '/defi', '/news', '/converter', '/watchlist', '/coin/bitcoin']) {
      await p.goto(BASE + path.slice(1), { waitUntil: 'networkidle' });
      await p.waitForTimeout(900);
      const n = await p.locator('h1').count();
      if (n !== 1) bad.push(`${path}=${n}`);
    }
    await p.goto(BASE, { waitUntil: 'networkidle' });
    return { pass: bad.length === 0, detail: bad.join(' ') || 'all 8 views have one h1' };
  });
  await check('Layout', 'Music button reachable at 1024, 1100 and 1279px without overflow', async () => {
    const bad = [];
    for (const w of [1024, 1100, 1279]) {
      await p.setViewportSize({ width: w, height: 800 });
      await p.waitForTimeout(300);
      const vis = await p.getByRole('button', { name: /background music/i }).filter({ visible: true }).count();
      const over = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (vis < 1 || over > 0) bad.push(`${w}: visible=${vis} overflow=${over}`);
    }
    await p.setViewportSize({ width: 1440, height: 900 });
    return { pass: bad.length === 0, detail: bad.join(' | ') || 'ok' };
  });
  // ---- programmatic pages (generated data under public/data, built by `npm run data`)
  const dataDir = new URL('../public/data/', import.meta.url);
  const sitemapPaths = (name) => [...fs.readFileSync(new URL(`../public/sitemaps/${name}.xml`, import.meta.url), 'utf8').matchAll(/<loc>https:\/\/encryptoverse\.com([^<]+)</g)].map((m) => m[1]);
  const manifest = JSON.parse(fs.readFileSync(new URL('manifest.json', dataDir), 'utf8'));
  await check('Pages', 'Generated data is consistent: buckets, sitemaps and routes agree', async () => {
    const problems = [];
    const coinFiles = fs.readdirSync(new URL('coins/', dataDir)).filter((f) => f.endsWith('.json'));
    let recs = 0;
    for (const f of coinFiles) {
      const bucket = JSON.parse(fs.readFileSync(new URL(`coins/${f}`, dataDir), 'utf8'));
      for (const slug of Object.keys(bucket)) {
        recs++;
        if (bucketOf(slug) + '.json' !== f) problems.push(`coin ${slug} is in ${f}, expected ${bucketOf(slug)}.json`);
      }
    }
    if (recs !== manifest.coins.total) problems.push(`coin records ${recs} != manifest ${manifest.coins.total}`);
    const counts = { coins: manifest.coins.indexable, protocols: manifest.protocols.indexable, chains: manifest.chains.indexable, stablecoins: manifest.stablecoins.indexable, exchanges: manifest.exchanges.indexable };
    for (const [name, n] of Object.entries(counts)) if (sitemapPaths(name).length !== n) problems.push(`${name}.xml has ${sitemapPaths(name).length}, manifest says ${n}`);
    let total = 0;
    for (const name of ['coins', 'hubs', 'protocols', 'chains', 'stablecoins', 'exchanges', 'convert-fiat', 'convert-pairs']) {
      const paths = sitemapPaths(name);
      total += paths.length;
      if (paths.length > 45000) problems.push(`${name}.xml near the 50,000 URL limit`);
      const bad = paths.filter((_, i) => i % 7 === 0).filter((x) => !parsePagePath(x));
      if (bad.length) problems.push(`${name}.xml has ${bad.length} paths the router cannot parse, e.g. ${bad[0]}`);
      if (new Set(paths).size !== paths.length) problems.push(`${name}.xml has duplicate URLs`);
    }
    return { pass: problems.length === 0 && total >= 25000, detail: problems.join(' | ') || `${recs} coin records, ${total} sitemap URLs (>= 25,000)` };
  });
  const sampleProtocol = sitemapPaths('protocols')[2];
  const deadCoin = (() => {
    for (const f of fs.readdirSync(new URL('coins/', dataDir)).filter((x) => x.endsWith('.json'))) {
      const b = JSON.parse(fs.readFileSync(new URL(`coins/${f}`, dataDir), 'utf8'));
      const hit = Object.values(b).find((c) => (c.p ?? 0) > 0 && !(c.m > 0) && !(c.v > 0));
      if (hit) return hit.s;
    }
    return null;
  })();
  await check('Pages', 'Every page family renders: one h1, own title, no NaN, no overflow', async () => {
    const bad = [];
    for (const path of ['/coin/pepe', '/coins', '/coins/3', sampleProtocol, '/defi/protocols', '/defi/chain/ethereum', '/defi/chains', '/stablecoins/tether', '/stablecoins', '/exchange/binance', '/exchanges', '/convert/bitcoin-to-usd', '/convert/bitcoin-to-ethereum', '/convert']) {
      await p.goto(BASE + path.slice(1), { waitUntil: 'networkidle' });
      await p.waitForTimeout(700);
      const r = await p.evaluate(() => ({ h1: document.querySelectorAll('h1').length, title: document.title, text: document.body.innerText, over: document.documentElement.scrollWidth - document.documentElement.clientWidth, canon: document.querySelector('link[rel=canonical]')?.href }));
      if (r.h1 !== 1) bad.push(`${path}: h1=${r.h1}`);
      if (/\bNaN\b|\bundefined\b|\[object|[$:+-]Infinity/.test(r.text)) bad.push(`${path}: NaN/undefined text`);
      if (r.over > 0) bad.push(`${path}: overflow ${r.over}`);
      if (!r.title.includes('Encryptoverse') || r.title === 'Encryptoverse | Live Crypto Prices & Fear and Greed Index') bad.push(`${path}: generic title "${r.title}"`);
      if (r.canon !== 'https://encryptoverse.com' + path) bad.push(`${path}: canonical ${r.canon}`);
    }
    await p.goto(BASE, { waitUntil: 'networkidle' });
    return { pass: bad.length === 0, detail: bad.join(' | ') || 'all 14 sampled pages ok' };
  });
  await check('Pages', 'Converter page recalculates from the typed amount', async () => {
    await p.goto(BASE + 'convert/bitcoin-to-usd', { waitUntil: 'networkidle' });
    await p.waitForTimeout(700);
    const one = await p.locator('main p[aria-live=polite]').innerText();
    await p.locator('#amount').fill('2');
    await p.waitForTimeout(200);
    const two = await p.locator('main p[aria-live=polite]').innerText();
    const n = (t) => Number(t.replace(/[^0-9.]/g, ''));
    await p.goto(BASE, { waitUntil: 'networkidle' });
    return { pass: n(one) > 0 && Math.abs(n(two) - 2 * n(one)) / n(one) < 0.001, detail: `1 BTC=${one}, 2 BTC=${two}` };
  });
  await check('Pages', 'Dead coins are noindex; unknown pages show a not-found view', async () => {
    if (!deadCoin) return { pass: true, detail: 'no dead coin in this data build' };
    await p.goto(BASE + 'coin/' + deadCoin, { waitUntil: 'networkidle' });
    await p.waitForTimeout(700);
    const robots = await p.locator('meta[name=robots]').getAttribute('content');
    await p.goto(BASE + 'defi/protocol/definitely-not-a-protocol', { waitUntil: 'networkidle' });
    await p.waitForTimeout(700);
    const nf = /Page not found/i.test(await p.locator('h1').innerText());
    const nfRobots = await p.locator('meta[name=robots]').getAttribute('content');
    await p.goto(BASE, { waitUntil: 'networkidle' });
    return { pass: /noindex/.test(robots) && nf && /noindex/.test(nfRobots), detail: `dead=${deadCoin} robots=${robots}; notFoundView=${nf} robots=${nfRobots}` };
  });
  await check('Trust', 'Editorial policy exists, is linked, and data pages say how they are made', async () => {
    const problems = [];
    await p.goto(BASE + 'editorial-policy', { waitUntil: 'networkidle' });
    await p.waitForTimeout(500);
    const ed = await p.locator('main').innerText();
    for (const w of ['How pages are produced', 'Corrections', 'Independence']) if (!ed.includes(w)) problems.push(`policy lacks "${w}"`);
    if ((await p.locator('footer a[href="/editorial-policy"]').count()) < 1) problems.push('footer lacks the policy link');
    await p.goto(BASE + 'methodology', { waitUntil: 'networkidle' });
    await p.waitForTimeout(400);
    const meth = await p.locator('main').innerText();
    if (/Only 50 assets are covered/.test(meth)) problems.push('methodology still claims only 50 assets');
    if (!/Data pages/.test(meth)) problems.push('methodology does not describe the data pages');
    const midCoin = JSON.parse(fs.readFileSync(new URL('coins/list/5.json', dataDir), 'utf8'))[0][0];
    for (const path of ['/coin/' + midCoin, '/defi/protocol/lido', '/convert/bitcoin-to-usd', '/convert/bitcoin', '/stablecoins/tether']) {
      await p.goto(BASE + path.slice(1), { waitUntil: 'networkidle' });
      await p.waitForTimeout(600);
      const box = p.locator('aside[aria-label="How this page is made"]');
      const t = (await box.count()) ? await box.innerText() : '';
      if (!/not individually reviewed/i.test(t)) problems.push(`${path}: missing "how this page is made"`);
      for (const href of ['/methodology', '/editorial-policy', '/risk-disclosure']) if ((await box.locator(`a[href="${href}"]`).count()) < 1) problems.push(`${path}: box lacks ${href}`);
    }
    await p.goto(BASE, { waitUntil: 'networkidle' });
    return { pass: problems.length === 0, detail: problems.join(' | ') || 'policy, methodology and 4 page types ok' };
  });
  // ---- regressions found by the independent functional QA pass
  await check('Pages', 'Converter input: decimal comma, thousands separator and invalid text are handled explicitly', async () => {
    const problems = [];
    await p.goto(BASE + 'convert/bitcoin-to-usd', { waitUntil: 'networkidle' });
    await p.waitForTimeout(600);
    const out = async (v) => { await p.locator('#amount').fill(v); await p.waitForTimeout(120); return (await p.locator('main p[aria-live=polite]').innerText()).replace(/[^0-9.]/g, ''); };
    const one = Number(await out('1'));
    const half = Number(await out('0,5'));
    const thousand = Number(await out('1,000'));
    if (Math.abs(half - one / 2) > 0.01 * one) problems.push(`"0,5" gave ${half} (1 BTC = ${one})`);
    if (Math.abs(thousand - one * 1000) > 0.001 * one * 1000) problems.push(`"1,000" gave ${thousand}`);
    for (const bad of ['abc', '', '1.2.3', '-5']) {
      await p.locator('#amount').fill(bad);
      await p.waitForTimeout(120);
      const msg = await p.locator('#amount-error').count();
      const invalid = await p.locator('#amount').getAttribute('aria-invalid');
      if (!msg || invalid !== 'true') problems.push(`"${bad}" not flagged (error=${msg}, aria-invalid=${invalid})`);
    }
    await p.goto(BASE, { waitUntil: 'networkidle' });
    return { pass: problems.length === 0, detail: problems.join(' | ') || 'comma, thousands and 4 invalid inputs ok' };
  });
  await check('Pages', 'Search from a data page goes to the markets table; nav does not mark Cryptocurrencies current', async () => {
    await p.goto(BASE + 'coins/2', { waitUntil: 'networkidle' });
    await p.waitForTimeout(600);
    const cur = await p.locator('header nav[aria-label=Primary] a[aria-current=page]').count();
    await p.locator('#search-desktop').fill('bitcoin');
    await p.waitForTimeout(700);
    const url = new URL(p.url()).pathname;
    const rows = await p.locator('tbody tr').count();
    await p.goto(BASE, { waitUntil: 'networkidle' });
    return { pass: cur === 0 && url === '/' && rows > 0, detail: `currentOnDataPage=${cur} afterSearch=${url} rows=${rows}` };
  });
  await check('Pages', 'Unrecognised URLs show a not-found page, not the home page', async () => {
    const bad = [];
    for (const path of ['coin/Bitcoin', 'coins/0', 'defi/protocol/Aave-V3', 'convert/BITCOIN-to-usd', 'totally/unknown']) {
      await p.goto(BASE + path, { waitUntil: 'networkidle' });
      await p.waitForTimeout(500);
      const h1 = await p.locator('h1').first().innerText();
      const robots = await p.locator('meta[name=robots]').getAttribute('content');
      if (!/Page not found/i.test(h1) || !/noindex/.test(robots)) bad.push(`${path}: h1="${h1.slice(0, 30)}" robots=${robots}`);
    }
    await p.goto(BASE, { waitUntil: 'networkidle' });
    return { pass: bad.length === 0, detail: bad.join(' | ') || '5 URLs show the not-found page with noindex' };
  });
  await check('Honesty', 'A coin outside the live top 50 never shows bundled sample figures in a modal', async () => {
    const { c: cf, p: pf } = await ctx({ width: 1280, height: 800 }, {}, { fail: true });
    try {
      await pf.goto(BASE + 'coin/arbitrum', { waitUntil: 'networkidle' });
      await pf.waitForTimeout(1500);
      const modal = await pf.locator('[role=dialog]').count();
      const txt = await pf.locator('body').innerText();
      const sample = /\$68,450|sample figures/i.test(txt) && modal > 0;
      return { pass: modal === 0 && !sample && (await pf.locator('h1').first().innerText()).toLowerCase().includes('arbitrum'), detail: `modal=${modal}` };
    } finally {
      await cf.close();
    }
  });
  await check('Pages', 'Coin page copy does not claim two-minute updates; fiat rates fall back to the snapshot', async () => {
    await p.goto(BASE + 'coin/pepe', { waitUntil: 'networkidle' });
    await p.waitForTimeout(800);
    const t = await p.locator('main').innerText();
    const copyOk = !/update every two minutes/i.test(t);
    const rates = JSON.parse(fs.readFileSync(new URL('rates.json', dataDir), 'utf8'));
    const { c: cr, p: pr } = await ctx({ width: 1280, height: 800 });
    let lead = '';
    try {
      await pr.route('**/api/rates', (r) => r.fulfill({ status: 500, body: 'x' }));
      await pr.goto(BASE + 'convert/bitcoin-to-eur', { waitUntil: 'networkidle' });
      await pr.waitForTimeout(800);
      lead = await pr.locator('header p').first().innerText();
    } finally {
      await cr.close();
    }
    await p.goto(BASE, { waitUntil: 'networkidle' });
    return { pass: copyOk && /1 BTC = /.test(lead) && Object.keys(rates.rates).length >= 10, detail: `copyOk=${copyOk} lead="${lead}"` };
  });
  await check('Routing', 'Old ?tab= links redirect to the new path', async () => {
    await p.goto(BASE + '?tab=defi', { waitUntil: 'networkidle' });
    await p.waitForTimeout(500);
    const res = { pass: new URL(p.url()).pathname === '/defi' && !p.url().includes('tab='), detail: p.url() };
    await p.goto(BASE, { waitUntil: 'networkidle' });
    return res;
  });
  await check('Security', 'No links to unregistered domains', async () => {
    const hrefs = await p.locator('a').evaluateAll((a) => a.map((x) => x.href));
    const dead = ['aerodex.exchange', 'solarpunk.energy', 'suiforge.games', 'omnizk.network'];
    const hit = dead.filter((d) => hrefs.some((h) => h.includes(d)));
    return { pass: hit.length === 0, detail: hit.length ? `links to unregistered: ${hit.join(', ')}` : 'none' };
  });

  // ---- portfolio
  await check('Portfolio', 'New visitor sees empty portfolio', async () => {
    const { c: c2, p: p2 } = await ctx({ width: 1440, height: 900 });
    await p2.goto(BASE, { waitUntil: 'networkidle' });
    await p2.waitForTimeout(1200);
    await tab(p2, 'Watchlist').click();
    await p2.waitForTimeout(600);
    const v = await p2.locator('[aria-labelledby=portfolio-heading] p.tabular-nums').first().innerText().catch(() => '');
    await c2.close();
    return { pass: /^[^\d]*0\.00$/.test(v.trim()), detail: `portfolio headline reads "${v.trim()}"` };
  });
  await check('Portfolio', 'Total matches the rows shown', async () => {
    await p.evaluate(() => {
      localStorage.setItem('encryptoverse_watchlist', JSON.stringify(['ethereum']));
      localStorage.setItem('encryptoverse_holdings', JSON.stringify({ bitcoin: 1 }));
    });
    await p.reload({ waitUntil: 'networkidle' });
    await p.waitForTimeout(1200);
    await tab(p, 'Watchlist').click();
    await p.waitForTimeout(600);
    const v = await p.locator('[aria-labelledby=portfolio-heading] p.tabular-nums').first().innerText().catch(() => '');
    const counted = /[1-9]/.test(v.replace(/^[^\d]*/, '').split('.')[0] || '');
    const listed = await p.locator('tbody').getByText('Bitcoin', { exact: false }).count().then((n) => n > 0).catch(() => false);
    return { pass: !counted || listed, detail: `total ${v.trim()}, BTC row listed: ${listed}` };
  });

  // ---- converter
  await check('Converter', '1 BTC -> ETH plausible', async () => {
    await tab(p, 'Converter').click();
    await p.waitForTimeout(600);
    const t = await txt(p);
    const nums = [...t.matchAll(/\b(\d{1,3}(?:\.\d+)?)\b/g)].map((x) => parseFloat(x[1]));
    const plausible = nums.some((n) => n > 5 && n < 200);
    return { pass: plausible, detail: plausible ? 'in range' : 'no plausible BTC/ETH rate found' };
  });
  await check('Converter', 'Form controls are labelled', async () => {
    const bad = await p.locator('main input, main select').evaluateAll((e) => e.filter((x) => !x.labels?.length && !x.getAttribute('aria-label')).length);
    return { pass: bad === 0, detail: `${bad} unlabelled` };
  });

  // ---- wallet
  await clearOverlay(p);
  await check('Wallet', 'Uninstalled wallets not shown as detected', async () => {
    await p.getByRole('button', { name: /connect|wallet/i }).first().click();
    await p.waitForTimeout(600);
    await shot(p, 'desktop-wallet');
    const t = await txt(p);
    const lies = (t.match(/Web extension detected/g) || []).length;
    return { pass: lies === 0, detail: lies ? `${lies} wallets falsely marked detected` : 'honest' };
  });
  await check('Wallet', 'Options are keyboard-focusable buttons', async () => {
    const n = await p.getByRole('button', { name: /metamask|phantom|demo/i }).count();
    return { pass: n > 0, detail: `${n} focusable wallet options` };
  });
  await p.keyboard.press('Escape').catch(() => {});

  // ---- axe
  await clearOverlay(p);
  for (const [label, go] of [['markets', 'Cryptocurrencies'], ['ico', 'ICO'], ['watchlist', 'Watchlist']]) {
    await check('A11y', `axe scan: ${label}`, async () => {
      await tab(p, go).click();
      await p.waitForTimeout(700);
      await p.addScriptTag({ content: AXE });
      const v = await p.evaluate(async () => (await window.axe.run(document, { resultTypes: ['violations'] })).violations.map((x) => `${x.id}(${x.impact}) x${x.nodes.length}`));
      fs.writeFileSync(path.join(OUT, `axe-${label}.json`), JSON.stringify(v, null, 2));
      return { pass: v.length === 0, detail: v.join(', ') || 'clean' };
    });
  }

  await check('Runtime', 'No console or page errors (desktop)', async () => {
    const real = p._err.filter((e) => !e.includes('requestfailed'));
    return { pass: real.length === 0, detail: real.slice(0, 3).join(' | ') };
  });
  await c.close();
}

// ---------------------------------------------------------------- MOBILE
{
  const { c, p } = await ctx({ width: 390, height: 844 }, { isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await p.goto(BASE, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  await shot(p, 'mobile-markets');

  await check('Mobile', 'No horizontal overflow', async () => {
    const { sw, iw } = await overflow(p);
    return { pass: sw <= iw + 1, detail: `scrollWidth ${sw} vs ${iw}` };
  });
  await check('Mobile', 'Search reachable without opening menu', async () => {
    const boxes = p.locator('input[type=text], input[type=search]');
    const n = await boxes.count();
    let vis = false;
    for (let i = 0; i < n; i++) if (await boxes.nth(i).isVisible().catch(() => false)) vis = true;
    return { pass: vis, detail: vis ? `visible (${n} search inputs, one shown)` : 'hidden behind hamburger' };
  });
  await check('Mobile', 'Tap targets >= 40px (star column)', async () => {
    const s = await p.locator('tbody tr td:first-child button').evaluateAll((e) => e.slice(0, 5).map((x) => Math.round(x.getBoundingClientRect().height)));
    return { pass: s.length > 0 && s.every((x) => x >= 40), detail: `heights: ${s.join(',')} (WCAG min 44, 40 tolerated)` };
  });
  await check('Mobile', 'Nav menu opens', async () => {
    await p.getByRole('button', { name: /menu|navigation/i }).first().click();
    await p.waitForTimeout(500);
    await shot(p, 'mobile-menu');
    return (await p.locator('text=/ICO/i').count()) > 0;
  });
  await check('Mobile', 'Modal fits viewport', async () => {
    await p.keyboard.press('Escape').catch(() => {});
    await p.locator('tbody tr').first().locator('td').nth(2).click();
    await p.waitForTimeout(700);
    await shot(p, 'mobile-modal');
    const { sw, iw } = await overflow(p);
    return { pass: sw <= iw + 1, detail: `scrollWidth ${sw}` };
  });
  await check('Runtime', 'No console or page errors (mobile)', async () => {
    const real = p._err.filter((e) => !e.includes('requestfailed') && !e.includes('CORS') && !e.includes('ERR_FAILED'));
    return { pass: real.length === 0, detail: real.slice(0, 3).join(' | ') };
  });
  await c.close();
}

// ---------------------------------------------------------------- RESILIENCE (backend/data layer)
{
  const { c, p } = await ctx({ width: 1280, height: 800 }, {}, { fail: true });
  await p.goto(BASE, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);
  await shot(p, 'offline');
  await check('Resilience', 'API down -> clear offline indicator + data', async () => {
    const t = (await txt(p)).toLowerCase();
    const flagged = t.includes('offline') || t.includes('sample') || t.includes('unavailable');
    const rows = await p.locator('tbody tr').count();
    return { pass: flagged && rows > 0, detail: `flagged=${flagged}, ${rows} fallback rows` };
  });
  await check('Resilience', 'Does not claim "Live" while offline', async () => {
    await tab(p, 'Converter').click();
    await p.waitForTimeout(500);
    const t = await txt(p);
    return { pass: !/live rates/i.test(t), detail: /live rates/i.test(t) ? '"Live Rates" shown with no API' : 'honest' };
  });
  await c.close();
}
{
  const { c, p } = await ctx({ width: 1280, height: 800 }, {}, { status: 429 });
  await p.goto(BASE, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);
  await check('Resilience', 'Rate limit (429) handled gracefully', async () => {
    const rows = await p.locator('tbody tr').count();
    const errs = p._err.filter((e) => e.startsWith('pageerror'));
    return { pass: rows > 0 && errs.length === 0, detail: `${rows} rows, ${errs.length} page errors` };
  });
  await c.close();
}
{
  const { c, p } = await ctx({ width: 1280, height: 800 });
  await p.unroute(/api\.coingecko\.com/).catch(() => {});
  await p.route(/coingecko\.com\/api\/v3\/coins\/markets/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 'x', symbol: 'x', name: 'X', image: '', current_price: null, market_cap: null, market_cap_rank: null, total_volume: null, circulating_supply: null, total_supply: null, max_supply: null, ath: null, ath_date: null, atl: null, atl_date: null }]) }));
  await p.goto(BASE, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);
  await check('Resilience', 'Malformed API payload (nulls) handled', async () => {
    const t = await txt(p);
    const bad = ['NaN', 'undefined', 'Infinity'].filter((w) => t.includes(w));
    const errs = p._err.filter((e) => e.startsWith('pageerror'));
    return { pass: bad.length === 0 && errs.length === 0, detail: `bad tokens: ${bad.join(',') || 'none'}; errors: ${errs.length}` };
  });
  await c.close();
}

// ---------------------------------------------------------------- STORAGE ROBUSTNESS
for (const [name, key, val] of [
  ['watchlist is an object', 'encryptoverse_watchlist', '{}'],
  ['watchlist is null', 'encryptoverse_watchlist', 'null'],
  ['watchlist has non-strings', 'encryptoverse_watchlist', '[1,2,{"a":1}]'],
  ['holdings are strings', 'encryptoverse_holdings', '{"bitcoin":"abc"}'],
  ['holdings are negative', 'encryptoverse_holdings', '{"bitcoin":-5}'],
  ['holdings prototype pollution', 'encryptoverse_holdings', '{"__proto__":{"x":1},"bitcoin":1}'],
]) {
  const { c, p } = await ctx({ width: 1280, height: 800 });
  await p.addInitScript(([k, v]) => { try { localStorage.setItem(k, v); } catch {} }, [key, val]);
  await p.goto(BASE, { waitUntil: 'networkidle' }).catch(() => {});
  await p.waitForTimeout(900);
  await check('Robustness', `Corrupt storage: ${name}`, async () => {
    if (key.includes('holdings')) await tab(p, 'Watchlist').click().catch(() => {});
    await p.waitForTimeout(600);
    const html = await p.locator('#root').innerHTML().catch(() => '');
    const blank = html.length < 200;
    const t = await txt(p).catch(() => '');
    const nan = t.includes('NaN');
    const errs = p._err.filter((e) => e.startsWith('pageerror'));
    return { pass: !blank && !nan && errs.length === 0, detail: `blank=${blank} NaN=${nan} ${errs[0] || ''}`.slice(0, 120) };
  });
  await c.close();
}

await browser.close();
fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
const f = results.filter((r) => !r.pass);
console.log(`\n${'='.repeat(60)}\nTOTAL ${results.length} | PASS ${results.length - f.length} | FAIL ${f.length}`);
const byArea = {};
for (const r of results) {
  byArea[r.area] ??= { p: 0, f: 0 };
  if (r.pass) byArea[r.area].p++;
  else byArea[r.area].f++;
}
for (const [a, v] of Object.entries(byArea)) console.log(`  ${a.padEnd(14)} ${v.p}/${v.p + v.f}`);
