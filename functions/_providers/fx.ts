import { fetchJson } from './http';

/** USD -> fiat rate for a 3-letter code, from the ECB via Frankfurter (open source, free), falling back to Coinbase. */
export async function fiatPerUsd(code: 'EUR' | 'GBP'): Promise<number> {
  try {
    const r = await fetchJson<{ rates?: Record<string, number> }>(`https://api.frankfurter.dev/v1/latest?base=USD&symbols=${code}`);
    const v = r.rates?.[code];
    if (Number.isFinite(v) && (v as number) > 0) return v as number;
  } catch {
    // fall through to Coinbase
  }
  const r = await fetchJson<{ data?: { rates?: Record<string, string> } }>('https://api.coinbase.com/v2/exchange-rates?currency=USD');
  const v = Number(r.data?.rates?.[code]);
  if (!Number.isFinite(v) || v <= 0) throw new Error(`No FX rate for ${code}`);
  return v;
}
