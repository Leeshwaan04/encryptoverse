import { SITE_URL } from '../../src/config/seo';
import type { Env } from '../_lib';

// Builds the sitemap INDEX served at /sitemap.xml (and at the legacy /sitemap_index.xml, which Search Console already knows). Core pages come from /sitemap-core.xml; each programmatic page family
// has its own static sitemap (written by the data build) so no single file nears the 50,000-URL limit.
export const sitemapIndex = async (ctx: { request: Request; env: Env }): Promise<Response> => {
  if (ctx.request.method !== 'GET' && ctx.request.method !== 'HEAD') return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
  const origin = new URL(ctx.request.url).origin;
  const names = ['/sitemap-core.xml'];
  try {
    const res = await ctx.env.ASSETS?.fetch(new Request(`${origin}/data/manifest.json`));
    if (res?.ok) {
      const m = (await res.json()) as Record<string, unknown>;
      const add = (key: string, file: string) => m[key] && names.push(`/sitemaps/${file}`);
      add('coins', 'coins.xml');
      add('hubs', 'hubs.xml');
      add('protocols', 'protocols.xml');
      add('chains', 'chains.xml');
      add('stablecoins', 'stablecoins.xml');
      add('exchanges', 'exchanges.xml');
      add('convert', 'convert-fiat.xml');
      add('convert', 'convert-pairs.xml');
    }
  } catch {
    // data not built: the index lists only the core sitemap
  }
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    names.map((n) => `  <sitemap><loc>${SITE_URL}${n}</loc></sitemap>\n`).join('') +
    '</sitemapindex>\n';
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
};
