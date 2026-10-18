import { INFO_ROUTES, SITE_URL, TAB_ROUTES } from '../src/config/seo';

// GET|HEAD /sitemap-core.xml -> the hand-written pages: the app views and the info/trust pages. The Watchlist is
// personal and left out. Coin, DeFi and converter pages are in the sitemaps under /sitemaps/.
export const onRequest = (ctx: { request: Request }): Response => {
  if (ctx.request.method !== 'GET' && ctx.request.method !== 'HEAD') return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
  const paths = [
    ...Object.entries(TAB_ROUTES).filter(([id]) => id !== 'watchlist').map(([, m]) => m.path),
    ...Object.values(INFO_ROUTES).map((m) => m.path),
  ];
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    paths.map((p) => `  <url><loc>${SITE_URL}${p}</loc></url>\n`).join('') +
    '</urlset>\n';
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
};
