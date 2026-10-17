import { INFO_ROUTES, SITE_URL, TAB_ROUTES, coinPath } from '../src/config/seo';
import { topCoins } from './_providers/coinMeta';

// GET /sitemap.xml -> static routes plus one URL per coin currently in the top-50 list. Watchlist is personal and left out.
export const onRequestGet = async (ctx: { request: Request }): Promise<Response> => {
  const origin = new URL(ctx.request.url).origin;
  const statics = [
    ...Object.entries(TAB_ROUTES).filter(([id]) => id !== 'watchlist').map(([, m]) => m.path),
    ...Object.values(INFO_ROUTES).map((m) => m.path),
  ];
  const coins = (await topCoins(origin)) ?? [];
  const paths = [...statics, ...coins.map((c) => coinPath(c.id))];
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    paths.map((p) => `  <url><loc>${SITE_URL}${p}</loc></url>\n`).join('') +
    '</urlset>\n';
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
};
