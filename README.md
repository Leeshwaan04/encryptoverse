# Encryptoverse

An independent, read-only crypto market-data site at [encryptoverse.com](https://encryptoverse.com). It shows prices,
market cap, volume, price history, sentiment, DeFi totals and news, and names the source of every figure. There are no
accounts, no advertising, no affiliate links and no paid placements, and nothing on the site is financial advice.

[![CI](https://github.com/Leeshwaan04/encryptoverse/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/Leeshwaan04/encryptoverse/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## What is on the site

| Area | What it is | Source |
|---|---|---|
| Home and tabs | Top 50 coins, trending, DeFi overview, news, watchlist and portfolio (stored only in your browser), converter | CoinLore, DefiLlama, Coinbase candles, Frankfurter (ECB), alternative.me, CoinDesk and Cointelegraph feeds |
| Coin pages | `/coin/<slug>` for about 15,000 coins, ranked lists at `/coins` | CoinLore |
| DeFi pages | About 8,700 protocols, blockchains, stablecoins | DefiLlama |
| Exchanges | `/exchange/<slug>` | CoinLore |
| Converters | Coin to currency and coin to coin, `/convert/...` | CoinLore prices, ECB rates |
| Token sales | A hand-written, sourced guide to public token sales (not a live feed) | Cited sources on the page |
| Trust pages | About, methodology, editorial and corrections policy, risk disclosure, privacy, terms, contact | Written by hand |

Pages with little or no real data (for example coins with no market cap and no trading volume) are served but marked
`noindex` and left out of the sitemaps. The rules live in [`src/shared/pages.ts`](src/shared/pages.ts).

## How it is built

- **Front end:** React 19, TypeScript, Vite, Tailwind CSS v4. State that matters is in the URL (tab is the path).
- **Edge layer:** Cloudflare Pages Functions in [`functions/`](functions). They proxy and cache the data APIs
  (`/api/*`), and a middleware adds the right title, description, canonical, robots tag, structured data and
  crawler-readable content to each page, plus real 404s and redirects.
- **Data pages:** [`scripts/build-data.mjs`](scripts/build-data.mjs) pulls the free public APIs and writes static JSON
  to `public/data` in 256 hashed buckets, plus the sitemaps in `public/sitemaps`. Both are generated and git-ignored.
  CI rebuilds them before every deploy and every six hours. The hashing keeps the site far below Cloudflare Pages'
  20,000-files-per-deployment limit.
- **Shared logic:** [`src/shared/`](src/shared) is imported by the browser app, the edge middleware and the build
  script, so URLs, titles and indexing rules cannot drift apart.

## Run it locally

Requires Node 22.18 or newer (the data scripts import TypeScript directly).

```bash
npm install
npm run data        # about a minute: builds public/data and public/sitemaps (needed once, then as you like)
npm run dev         # http://localhost:5173
```

Edge functions can be tried against a production build:

```bash
npm run build
npx wrangler pages dev dist --port 8799
```

## Checks

```bash
npm run lint          # oxlint
npm run build         # type check and production build
npm run audit:pages   # audits every generated page: titles, duplicates, thin content, indexing rules, links, orphans
npm run preview &     # then:
npm run test:qa       # end-to-end browser suite (Playwright)
npm run test:security # client-side security suite
```

CI runs all of these on every push and deploys only if they pass.

## Optional configuration

`COINGECKO_API_KEY` (a Cloudflare Pages secret) is optional. Without it the site uses only keyless sources.

## Policies

How pages are produced and corrected is described on the site's
[editorial policy](https://encryptoverse.com/editorial-policy) and
[methodology](https://encryptoverse.com/methodology) pages. To report an error, open an issue on this repository.

## License

Source code is distributed under the **MIT License**. See `LICENSE` for more information.

**Media is not covered by the MIT licence.** Files in `public/media/` have their own terms: the hero video and
poster are AI-generated artwork, the soundtrack is licensed from Pixabay under the
[Pixabay Content License](https://pixabay.com/service/license-summary/), and coin logos come from the CC0
[cryptocurrency-icons](https://github.com/spothq/cryptocurrency-icons) set. Do not reuse these files without checking those terms.
