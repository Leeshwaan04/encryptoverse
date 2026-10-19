// Edge layer for every request:
//  - one canonical URL (www -> apex, trailing slash removed),
//  - real 404s for paths that do not exist (the SPA shell would otherwise answer 200 "soft 404" for everything),
//  - per-page <title>, description, canonical, robots, social tags, JSON-LD and crawler-readable fallback content
//    in the initial HTML, because link-preview bots and many crawlers never run JavaScript.
import { ROUTE_TABLE, SITE_URL, coinMeta, documentTitle, type RouteMeta } from '../src/config/seo';
import { parsePagePath } from '../src/shared/pages';
import { resolvePage, type Assets } from './_providers/pageData';
import { coinFacts, topCoins, type MarketCoin } from './_providers/coinMeta';
import { fallbackHtml, jsonLd } from './_providers/seoHtml';

interface Element {
  setAttribute(name: string, value: string): unknown;
  setInnerContent(content: string, opts?: { html: boolean }): unknown;
  append(content: string, opts?: { html: boolean }): unknown;
}
interface Rewriter {
  on(selector: string, handlers: { element(el: Element): void }): Rewriter;
  transform(res: Response): Response;
}
declare const HTMLRewriter: new () => Rewriter;

interface MiddlewareCtx {
  request: Request;
  next: () => Promise<Response>;
  env: { ASSETS?: Assets };
}

const redirect = (to: URL) => Response.redirect(to.toString(), 301);

export const onRequest = async (ctx: MiddlewareCtx): Promise<Response> => {
  const url = new URL(ctx.request.url);

  // One canonical host: www.* redirects to the apex.
  if (url.hostname.startsWith('www.')) {
    url.hostname = url.hostname.slice(4);
    return redirect(url);
  }
  // One canonical path: /defi/ -> /defi.
  if (url.pathname.length > 1 && url.pathname.endsWith('/') && !url.pathname.startsWith('/api/')) {
    url.pathname = url.pathname.replace(/\/+$/, '') || '/';
    return redirect(url);
  }

  // Page 1 of a ranking is the bare list URL; /coins/1 would be a second copy of it.
  if (url.pathname === '/coins/1' || url.pathname === '/defi/protocols/1') {
    url.pathname = url.pathname.slice(0, -2);
    return redirect(url);
  }

  const res = await ctx.next();
  const isHtml = res.headers.get('content-type')?.includes('text/html');

  // A missing hashed asset must be a real 404, not the SPA shell cached as "immutable" for a year.
  if (url.pathname.startsWith('/assets/') && isHtml) {
    return new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' } });
  }
  if ((ctx.request.method !== 'GET' && ctx.request.method !== 'HEAD') || !isHtml) return res;

  const path = url.pathname;
  let meta: RouteMeta | undefined = ROUTE_TABLE[path];
  let status = 200;
  let coins: MarketCoin[] | null = null;
  let facts: string[] = [];

  let heading: string | undefined;
  let links: [string, string][] = [];
  let dateModified: string | undefined;
  const route = meta ? null : parsePagePath(path);
  if (route && ctx.env.ASSETS) {
    // The ten live top coins keep their live-price description; every other page comes from the static data build.
    if (route.kind === 'coin') {
      const live = (await topCoins(url.origin))?.find((c) => c.id === route.slug);
      if (live) {
        const f = coinFacts(live);
        meta = coinMeta(f);
        facts = [f.rank ? `Market cap rank: #${f.rank}` : '', f.price ? `Price: ${f.price}` : '', f.marketCap ? `Market cap: ${f.marketCap}` : '', f.change24h ? `24h change: ${f.change24h}` : ''].filter(Boolean);
      }
    }
    const page = await resolvePage(ctx.env.ASSETS, url.origin, route);
    if (page) {
      try {
        const m = await ctx.env.ASSETS.fetch(new Request(`${url.origin}/data/manifest.json`));
        if (m.ok) dateModified = ((await m.json()) as { generatedAt?: string }).generatedAt;
      } catch {
        // freshness is optional metadata
      }
    }
    if (!page && !meta) {
      status = 404;
    } else if (page) {
      links = page.links;
      heading = page.info.heading;
      if (!meta) {
        meta = { path, title: page.info.title, description: page.info.description, noindex: page.info.noindex, exact: true };
        facts = page.info.facts;
      }
    }
  } else if (!meta) {
    status = 404; // not a page we serve: a real 404 that the app still renders (and rewrites to the home view)
  }
  if (path === '/') coins = await topCoins(url.origin, false); // cache only: never delay the home page on a cold cache

  const notFound = status === 404;
  const page: RouteMeta = meta ?? { ...ROUTE_TABLE['/'], noindex: true };
  const title = documentTitle(page);
  const canonical = `${SITE_URL}${page.path}`;
  const robots = page.noindex || notFound ? 'noindex,nofollow' : 'index,follow,max-image-preview:large';
  const attr = (name: string, value: string) => ({ element: (el: Element) => void el.setAttribute(name, value) });

  const rewritten = new HTMLRewriter()
    .on('title', { element: (el) => void el.setInnerContent(title) })
    .on('meta[name="description"]', attr('content', page.description))
    .on('meta[name="robots"]', attr('content', robots))
    .on('link[rel="canonical"]', attr('href', canonical))
    .on('meta[property="og:title"]', attr('content', title))
    .on('meta[property="og:description"]', attr('content', page.description))
    .on('meta[property="og:url"]', attr('content', canonical))
    .on('meta[name="twitter:title"]', attr('content', title))
    .on('meta[name="twitter:description"]', attr('content', page.description))
    .on('head', { element: (el) => void (notFound || el.append(jsonLd(page, heading ?? page.title, dateModified), { html: true })) })
    .on('#root', { element: (el) => void el.setInnerContent(fallbackHtml(page, { coins, facts, heading, links }), { html: true }) })
    .transform(res);

  if (!notFound) return rewritten;
  const headers = new Headers(rewritten.headers);
  headers.set('Cache-Control', 'no-store');
  return new Response(rewritten.body, { status: 404, headers });
};
