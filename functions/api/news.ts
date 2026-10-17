import { cached, type Ctx } from '../_lib';

const FEEDS = [
  { source: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss' },
  { source: 'Cointelegraph', url: 'https://cointelegraph.com/rss' },
];

const decode = (s: string) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&(lt|gt|quot|#0?39|amp);/g, (_m, e: string) => ({ lt: '<', gt: '>', quot: '"', amp: '&' })[e] ?? "'")
    .trim();
const strip = (s: string) => decode(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const tag = (item: string, name: string) => {
  const m = item.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? m[1] : '';
};

// GET /api/news -> merged headlines from CoinDesk + Cointelegraph RSS. Headline, short excerpt and a link to the
// original article only (no republishing of full text). Cached 5min.
export const onRequestGet = (ctx: Ctx) =>
  cached(ctx, 300, async () => {
    const results = await Promise.allSettled(
      FEEDS.map(async (f) => {
        const res = await fetch(f.url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EncryptoverseBot/1.0; +https://encryptoverse.com)', Accept: 'application/rss+xml, application/xml' } });
        if (!res.ok) throw new Error(`${f.source} HTTP ${res.status}`);
        const xml = await res.text();
        return (xml.match(/<item[\s\S]*?<\/item>/gi) || []).slice(0, 15).map((item) => {
          const link = strip(tag(item, 'link'));
          const published = new Date(strip(tag(item, 'pubDate'))).getTime();
          const excerpt = strip(tag(item, 'description'));
          return {
            title: strip(tag(item, 'title')),
            url: link,
            source: f.source,
            category: strip(tag(item, 'category')) || 'Markets',
            publishedAt: Number.isFinite(published) ? new Date(published).toISOString() : null,
            summary: excerpt.length > 220 ? excerpt.slice(0, 217).trimEnd() + '…' : excerpt,
          };
        });
      }),
    );
    const items = results
      .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
      .filter((n) => n.title && /^https:\/\//.test(n.url))
      .sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''))
      .slice(0, 24);
    if (items.length === 0) throw new Error('No news feeds reachable');
    return { data: { items, sources: FEEDS.map((f) => f.source) }, source: FEEDS.map((f) => f.source).join(' · ') };
  });
