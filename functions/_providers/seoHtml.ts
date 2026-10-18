// HTML the middleware injects for crawlers and link-preview bots that do not run JavaScript.
// React replaces #root on load (createRoot), so visitors never see this; it mirrors what the app renders.
import { SITE_NAME, SITE_URL, TAB_ROUTES, INFO_ROUTES, coinPath, type RouteMeta } from '../../src/config/seo.ts';
import type { MarketCoin } from './coinMeta';

export const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const link = (path: string, label: string) => `<li><a href="${esc(path)}" class="text-cyan-300">${esc(label)}</a></li>`;

const NAV = [
  ...Object.entries(TAB_ROUTES).filter(([id]) => id !== 'watchlist').map(([, m]) => link(m.path, m.title)),
  ...Object.values(INFO_ROUTES).map((m) => link(m.path, m.title)),
].join('');

export function fallbackHtml(meta: RouteMeta, opts: { coins?: MarketCoin[] | null; facts?: string[]; heading?: string; links?: [string, string][] } = {}): string {
  const coins = opts.coins?.length
    ? `<h2>Top cryptocurrencies by market cap</h2><ol>${opts.coins.map((c) => link(coinPath(c.id), `${c.name} (${c.symbol.toUpperCase()})`)).join('')}</ol>`
    : '';
  const related = opts.links?.length ? `<h2>Related</h2><ul>${opts.links.map(([p, l]) => link(p, l)).join('')}</ul>` : '';
  const facts = opts.facts?.length ? `<ul>${opts.facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : '';
  return (
    `<main id="seo-fallback"><h1>${esc(opts.heading ?? (meta.path === '/' ? 'Encryptoverse: the crypto market in one clear view' : meta.title))}</h1>` +
    `<p>${esc(meta.description)}</p>${facts}${coins}${related}` +
    `<nav aria-label="Site pages"><ul>${NAV}</ul></nav>` +
    `<p>Generated automatically from named public data sources and not individually reviewed. Informational only, not financial advice. See the <a href="/methodology" class="text-cyan-300">methodology</a>, the <a href="/editorial-policy" class="text-cyan-300">editorial and corrections policy</a> and the <a href="/risk-disclosure" class="text-cyan-300">risk disclosure</a>.</p></main>`
  );
}

/** JSON-LD (a data block, never executed). `<` is escaped so a value can never close the script tag. */
export function jsonLd(meta: RouteMeta, title: string, dateModified?: string): string {
  const url = `${SITE_URL}${meta.path}`;
  const graph =
    meta.path === '/'
      ? [
          { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, url: `${SITE_URL}/`, name: SITE_NAME, description: meta.description, inLanguage: 'en' },
          {
            '@type': 'Organization',
            '@id': `${SITE_URL}/#org`,
            name: SITE_NAME,
            url: `${SITE_URL}/`,
            logo: `${SITE_URL}/icon-512.png`,
            sameAs: ['https://github.com/Leeshwaan04/encryptoverse'],
          },
        ]
      : [
          {
            '@type': 'WebPage',
            '@id': url,
            url,
            name: title,
            isPartOf: { '@id': `${SITE_URL}/#website` },
            ...(dateModified ? { dateModified } : {}),
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
              { '@type': 'ListItem', position: 2, name: title, item: url },
            ],
          },
        ];
  const body = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">${body}</script>`;
}
