// Shared helpers for Encryptoverse Pages Functions (edge proxy with caching).
// Every endpoint is cached at the Cloudflare edge so upstream free-tier APIs
// are hit at most once per TTL per colo, regardless of visitor count.

export interface Env {
  /** Optional CoinGecko Demo/Pro key. Set with: wrangler pages secret put COINGECKO_API_KEY */
  COINGECKO_API_KEY?: string;
}

export interface Ctx {
  request: Request;
  env: Env;
  waitUntil: (p: Promise<unknown>) => void;
}

const edgeCache = (): Cache => (caches as unknown as { default: Cache }).default;

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
};

export function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...JSON_HEADERS, ...extra } });
}

export interface Produced {
  data: unknown;
  /** Human-readable name of the provider(s) that supplied the data, shown as attribution in the UI. */
  source?: string;
}

/**
 * Serve from edge cache when fresh; otherwise call `produce`, store the result
 * (fresh + long-lived stale copy) and return it. If every upstream fails, serve
 * the stale copy (flagged with X-Stale) instead of an error whenever possible.
 */
export async function cached(
  ctx: Ctx,
  ttlSeconds: number,
  produce: () => Promise<Produced>,
  staleSeconds = 6 * 3600,
): Promise<Response> {
  const cache = edgeCache();
  const freshKey = new Request(ctx.request.url, { method: 'GET' });
  const staleKey = new Request(ctx.request.url + (ctx.request.url.includes('?') ? '&' : '?') + '__stale=1', { method: 'GET' });

  const hit = await cache.match(freshKey);
  if (hit) return hit;

  try {
    const { data, source } = await produce();
    const fetchedAt = new Date().toISOString();
    const body = JSON.stringify({ fetchedAt, source, data });
    const headers = {
      ...JSON_HEADERS,
      'Cache-Control': `public, max-age=${Math.min(ttlSeconds, 30)}, s-maxage=${ttlSeconds}`,
      'X-Fetched-At': fetchedAt,
    };
    const fresh = new Response(body, { headers });
    ctx.waitUntil(
      Promise.all([
        cache.put(freshKey, fresh.clone()),
        cache.put(staleKey, new Response(body, { headers: { ...headers, 'Cache-Control': `public, max-age=${staleSeconds}` } })),
      ]),
    );
    return fresh;
  } catch (err) {
    const stale = await cache.match(staleKey);
    if (stale) {
      const h = new Headers(stale.headers);
      h.set('X-Stale', '1');
      h.set('Cache-Control', 'public, max-age=15');
      return new Response(stale.body, { headers: h });
    }
    const message = err instanceof Error ? err.message : 'Upstream unavailable';
    // 503 rather than 502: Cloudflare replaces Worker 502/504 bodies with a generic error page.
    return json({ error: message }, 503, { 'Cache-Control': 'no-store' });
  }
}

export function coingeckoFetch(ctx: Ctx, path: string): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json', 'User-Agent': 'Encryptoverse/1.0 (+https://encryptoverse.com)' };
  if (ctx.env.COINGECKO_API_KEY) headers['x-cg-demo-api-key'] = ctx.env.COINGECKO_API_KEY;
  return fetch(`https://api.coingecko.com/api/v3${path}`, { headers });
}

export async function upstreamJson<T>(res: Response, label: string): Promise<T> {
  if (!res.ok) throw new Error(`${label} HTTP ${res.status}`);
  return (await res.json()) as T;
}
