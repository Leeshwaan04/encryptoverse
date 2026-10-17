// Serves each page its own <title>, description, canonical and social tags in the initial HTML.
// The app also sets these client-side, but link-preview bots and some crawlers never run JavaScript.
import { ROUTE_TABLE, SITE_URL, documentTitle } from '../src/config/seo';

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
  const res = await ctx.next();
  if (ctx.request.method !== 'GET' || !res.headers.get('content-type')?.includes('text/html')) return res;

  const path = new URL(ctx.request.url).pathname.replace(/\/+$/, '') || '/';
  const meta = ROUTE_TABLE[path];
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
    .transform(res);
};
