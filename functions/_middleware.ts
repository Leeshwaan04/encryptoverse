// Serves each page its own <title>, description, canonical and social tags in the initial HTML.
// The app also sets these client-side, but link-preview bots and some crawlers never run JavaScript.
import { ROUTE_TABLE, SITE_URL, coinIdFromPath, coinMeta, documentTitle, type RouteMeta } from '../src/config/seo';
import { coinFacts, topCoins } from './_providers/coinMeta';

interface Element {
  setAttribute(name: string, value: string): unknown;
  setInnerContent(content: string): unknown;
}
interface Rewriter {
  on(selector: string, handlers: { element(el: Element): void }): Rewriter;
  transform(res: Response): Response;
}
declare const HTMLRewriter: new () => Rewriter;

interface MiddlewareCtx {
  request: Request;
  next: () => Promise<Response>;
}

export const onRequest = async (ctx: MiddlewareCtx): Promise<Response> => {
  const url0 = new URL(ctx.request.url);
  // One canonical host: www.* redirects to the apex.
  if (url0.hostname.startsWith('www.')) {
    url0.hostname = url0.hostname.slice(4);
    return Response.redirect(url0.toString(), 301);
  }

  const res = await ctx.next();
  // A missing hashed asset must be a real 404, not the SPA shell cached as "immutable" for a year.
  if (url0.pathname.startsWith('/assets/') && res.headers.get('content-type')?.includes('text/html')) {
    return new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' } });
  }
  if (ctx.request.method !== 'GET' || !res.headers.get('content-type')?.includes('text/html')) return res;

  const path = url0.pathname.replace(/\/+$/, '') || '/';
  let meta: RouteMeta | undefined = ROUTE_TABLE[path];
  let status = res.status;
  const coinId = coinIdFromPath(path);
  if (!meta && coinId) {
    const coins = await topCoins(url0.origin);
    const coin = coins?.find((c) => c.id === coinId);
    if (coin) {
      meta = coinMeta(coinFacts(coin));
    } else if (coins) {
      // The list loaded and this id is not in it: a real 404 (the page still renders and redirects client-side).
      status = 404;
      meta = { ...ROUTE_TABLE['/'], path: '/' };
    } else {
      meta = coinMeta({ id: coinId, name: coinId.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()), symbol: coinId.slice(0, 5) });
    }
  }
  if (!meta) return res;

  const title = documentTitle(meta);
  const url = `${SITE_URL}${path}`;
  const attr = (name: string, value: string) => ({ element: (el: Element) => void el.setAttribute(name, value) });

  return new HTMLRewriter()
    .on('title', { element: (el) => void el.setInnerContent(title) })
    .on('meta[name="description"]', attr('content', meta.description))
    .on('link[rel="canonical"]', attr('href', url))
    .on('meta[property="og:title"]', attr('content', title))
    .on('meta[property="og:description"]', attr('content', meta.description))
    .on('meta[property="og:url"]', attr('content', url))
    .on('meta[name="twitter:title"]', attr('content', title))
    .on('meta[name="twitter:description"]', attr('content', meta.description))
    .transform(status === res.status ? res : new Response(res.body, { status, headers: res.headers }));
};
