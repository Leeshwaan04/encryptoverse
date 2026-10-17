import { fetchJson } from './http';

// Open-source icon set (CC0 1.0): https://github.com/spothq/cryptocurrency-icons, served by jsDelivr.
let known: { at: number; symbols: Set<string> } | null = null;
const TTL = 6 * 3600 * 1000;

async function knownSymbols(): Promise<Set<string>> {
  if (known && Date.now() - known.at < TTL) return known.symbols;
  try {
    const rows = await fetchJson<{ symbol: string }[]>('https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/manifest.json');
    known = { at: Date.now(), symbols: new Set(rows.map((r) => r.symbol.toUpperCase())) };
  } catch {
    known = { at: Date.now() - TTL + 60_000, symbols: known?.symbols ?? new Set() }; // retry in a minute
  }
  return known.symbols;
}

/** Real icon when the open-source set has one, otherwise our own generated letter avatar (same origin, never broken). */
export async function iconResolver(): Promise<(symbol: string) => string> {
  const symbols = await knownSymbols();
  return (symbol: string) => {
    const clean = symbol.replace(/[^a-z0-9]/gi, '').slice(0, 10);
    return symbols.has(clean.toUpperCase())
      ? `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/${clean.toLowerCase()}.png`
      : `/api/icon?s=${encodeURIComponent(clean.toUpperCase())}`;
  };
}
