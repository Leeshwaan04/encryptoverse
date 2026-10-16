// Encryptoverse formatting, storage and feedback utilities.

export type Currency = 'USD' | 'EUR' | 'GBP' | 'BTC' | 'ETH';

export const CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP', 'BTC', 'ETH'];

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  BTC: '₿',
  ETH: 'Ξ',
};

export function currencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency as Currency] ?? '$';
}

/**
 * Price with precision scaled to magnitude, in the selected currency.
 * Crypto denominations need far more decimals than fiat.
 */
export function formatPrice(value: number, currency: string = 'USD'): string {
  if (!Number.isFinite(value)) return '—';
  const symbol = currencySymbol(currency);
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  const crypto = currency === 'BTC' || currency === 'ETH';

  let opts: Intl.NumberFormatOptions;
  if (abs === 0) opts = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  else if (crypto && abs < 1) opts = { maximumSignificantDigits: 6 };
  else if (abs >= 1000) opts = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  else if (abs >= 1) opts = { minimumFractionDigits: 2, maximumFractionDigits: crypto ? 6 : 4 };
  else if (abs >= 0.01) opts = { minimumFractionDigits: 4, maximumFractionDigits: 4 };
  else opts = { maximumSignificantDigits: 4 };

  return `${sign}${symbol}${abs.toLocaleString('en-US', opts)}`;
}

/** Large values compacted with the right unit and symbol, e.g. $1.35T, €312.40B, ₿19.7K */
export function formatCompact(value: number, currency: string = 'USD'): string {
  if (!Number.isFinite(value)) return '—';
  const symbol = currencySymbol(currency);
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1e12) return `${sign}${symbol}${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}${symbol}${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}${symbol}${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}${symbol}${(abs / 1e3).toFixed(1)}K`;
  return `${sign}${symbol}${abs.toFixed(2)}`;
}

/** Signed percentage. Only positives get a '+', so negatives never render as "+-1.83%". */
export function formatPercentage(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
}

/** Token amounts: enough precision for sub-cent coins without scientific notation. */
export function formatAmount(value: number, maxFractionDigits = 6): string {
  if (!Number.isFinite(value)) return '—';
  if (value !== 0 && Math.abs(value) < 1e-6) return value.toExponential(2);
  return value.toLocaleString('en-US', { maximumFractionDigits: maxFractionDigits });
}

/** Whole-token supply figures. */
export function formatSupply(value: number, symbol: string): string {
  if (!Number.isFinite(value) || value <= 0) return '—';
  return `${value.toLocaleString('en-US', { maximumFractionDigits: 0 })} ${symbol}`;
}

export function calculateSupplyRatio(circulating: number, max: number | null): number {
  if (!max || max <= 0 || !Number.isFinite(circulating)) return 0;
  return Math.min(100, Math.max(0, Math.round((circulating / max) * 100)));
}

export function changeColor(value: number): string {
  if (!Number.isFinite(value)) return 'text-slate-400';
  return value >= 0 ? 'text-emerald-400' : 'text-rose-400';
}

export function fearGreedColor(value: number): string {
  if (value <= 25) return 'text-rose-400';
  if (value <= 45) return 'text-orange-400';
  if (value <= 55) return 'text-amber-300';
  return 'text-emerald-400';
}

/**
 * Read JSON from localStorage behind a type guard. Anything corrupt, tampered
 * with, or written by an older version falls back instead of crashing the app.
 */
export function readStorage<T>(key: string, fallback: T, validate: (v: unknown) => v is T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    return validate(parsed) ? parsed : fallback;
  } catch {
    // Unavailable in private mode, or the value is not JSON.
    return fallback;
  }
}

export function writeStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or storage disabled; state stays in memory for this session.
  }
}

export const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === 'string');

export const isHoldingsRecord = (v: unknown): v is Record<string, number> =>
  typeof v === 'object' &&
  v !== null &&
  !Array.isArray(v) &&
  Object.values(v).every((n) => typeof n === 'number' && Number.isFinite(n) && n >= 0);

/**
 * Optional UI sound. Off by default and remembered per browser, because
 * unexpected audio on a finance dashboard is hostile.
 */
export class CypherAudio {
  private ctx: AudioContext | null = null;
  public enabled: boolean = readStorage('encryptoverse_sound', false, (v): v is boolean => typeof v === 'boolean');

  setEnabled(on: boolean) {
    this.enabled = on;
    writeStorage('encryptoverse_sound', on);
  }

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playBlip(freq = 880, type: OscillatorType = 'sine', duration = 0.08) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, this.ctx.currentTime + duration);
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Autoplay policy or unsupported context; silence is an acceptable outcome.
    }
  }

  playSuccess() {
    this.playBlip(523.25, 'triangle', 0.1);
    setTimeout(() => this.playBlip(659.25, 'triangle', 0.1), 80);
    setTimeout(() => this.playBlip(1046.5, 'sine', 0.2), 160);
  }
}

export const cypherSound = new CypherAudio();
