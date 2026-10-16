// Tiny fetch helper shared by all upstream providers.

const UA = 'Encryptoverse/1.0 (+https://encryptoverse.com)';

export async function fetchJson<T>(url: string, init: RequestInit = {}, timeoutMs = 8000): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { Accept: 'application/json', 'User-Agent': UA, ...(init.headers as Record<string, string> | undefined) },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`${new URL(url).hostname} HTTP ${res.status}`);
  return (await res.json()) as T;
}

export const num = (v: unknown, fallback = 0): number => {
  const n = typeof v === 'string' ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : fallback;
};

/** Run async tasks, returning the first that resolves; throws an aggregate error if all fail. */
export async function firstSuccess<T>(attempts: { name: string; run: () => Promise<T> }[]): Promise<{ value: T; name: string }> {
  const errors: string[] = [];
  for (const a of attempts) {
    try {
      return { value: await a.run(), name: a.name };
    } catch (e) {
      errors.push(`${a.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  throw new Error(errors.join(' | ') || 'no providers configured');
}
