import { SITE_URL, documentTitle, type RouteMeta } from '../config/seo';

const setMeta = (selector: string, attr: string, value: string) => {
  document.head.querySelector(selector)?.setAttribute(attr, value);
};

/** Keep the head in step with the view. The server (middleware) sets the same values for crawlers. */
export function applyRouteMeta(meta: RouteMeta): void {
  const title = documentTitle(meta);
  document.title = title;
  const url = `${SITE_URL}${meta.path === '/' ? '/' : meta.path}`;
  setMeta('meta[name="description"]', 'content', meta.description);
  setMeta('meta[name="robots"]', 'content', meta.noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large');
  setMeta('link[rel="canonical"]', 'href', url);
  setMeta('meta[property="og:title"]', 'content', title);
  setMeta('meta[property="og:description"]', 'content', meta.description);
  setMeta('meta[property="og:url"]', 'content', url);
  setMeta('meta[name="twitter:title"]', 'content', title);
  setMeta('meta[name="twitter:description"]', 'content', meta.description);
}
