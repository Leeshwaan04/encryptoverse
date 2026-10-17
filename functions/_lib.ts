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
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
};

/** Query parameters that change a response. Anything else is ignored, so it cannot mint new cache entries. */
const CACHE_PARAMS: Record<string, string[]> = {
  '/api/chart': ['currency', 'days', 'id', 'symbol'],
  '/api/markets': ['currency'],
};

/** Canonical, attacker-proof cache key: path + allow-listed params only, sorted and lower-cased. */
export function canonicalUrl(url: string): string {
  const u = new URL(url);
  const allowed = CACHE_PARAMS[u.pathname] ?? [];
  const qs = allowed
    .filter((k) => u.searchParams.has(k))
    .map((k) => `${k}=${encodeURIComponent((u.searchParams.get(k) ?? '').toLowerCase().slice(0, 64))}`)
    .join('&');
  return `${u.origin}${u.pathname}${qs ? `?${qs}` : ''}`;
}

/** Coin ids currently in the cached top-50 list (null when that list is not cached yet). Bounds /api/chart to real coins. */
export async function knownCoinIds(ctx: Ctx): Promise<Set<string> | null> {
  const hit = await edgeCache().match(new Request(canonicalUrl(`${new URL(ctx.request.url).origin}/api/markets?currency=usd`)));
  if (!hit) return null;
  try {
    const body = (await hit.clone().json()) as { data?: { id?: string }[] };
    const ids = (body.data ?? []).map((c) => c.id).filter((x): x is string => typeof x === 'string');
    return ids.length ? new Set(ids) : null;
  } catch {
    return null;
  }
}

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
  const canonical = canonicalUrl(ctx.request.url);
  const freshKey = new Request(canonical, { method: 'GET' });
  // The stale copy lives on a host nobody can request, so clients cannot read or poison it.
  const staleKey = new Request(canonical.replace(/^https?:\/\/[^/]+/, 'https://stale.cache.invalid'), { method: 'GET' });

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
    // Detail stays in the logs (wrangler tail); clients only learn that the upstream is unavailable.
    console.warn(`upstream failure for ${canonical}: ${err instanceof Error ? err.message : String(err)}`);
    // 503 rather than 502: Cloudflare replaces Worker 502/504 bodies with a generic error page.
    // Cached briefly so a burst of requests for a failing key cannot hammer the upstreams.
    const failure = json({ error: 'Upstream unavailable' }, 503, { 'Cache-Control': 'public, max-age=10, s-maxage=20' });
    ctx.waitUntil(cache.put(freshKey, failure.clone()));
    return failure;
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
