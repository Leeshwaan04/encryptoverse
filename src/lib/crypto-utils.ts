// Encryptoverse Financial & Market Calculation Utilities
// Real-time market analytics, currency formatting, and sound synthesis

export function formatCurrency(value: number, currency: string = 'USD'): string {
  const symbolMap: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    BTC: '₿',
    ETH: 'Ξ',
  };

  const symbol = symbolMap[currency] || '$';

  if (currency === 'BTC') {
    return `${symbol}${value.toFixed(6)}`;
  }
  if (currency === 'ETH') {
    return `${symbol}${value.toFixed(4)}`;
  }

  if (value >= 1) {
    return `${symbol}${value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  if (value >= 0.0001) {
    return `${symbol}${value.toLocaleString('en-US', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 6,
    })}`;
  }

  return `${symbol}${value.toFixed(8)}`;
}

export function formatCompactNumber(value: number): string {
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`;
  }
  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  }
  if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  }
  if (value >= 1e3) {
    return `$${(value / 1e3).toFixed(1)}K`;
  }
  return `$${value.toFixed(2)}`;
}

export function formatPercentage(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function calculateSupplyRatio(circulating: number, max: number | null): number {
  if (!max || max <= 0) return 100;
  return Math.min(100, Math.round((circulating / max) * 100));
}

/**
 * Audio synthesis helper for futuristic cyberpunk feedback
 */
export class CypherAudio {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  playBlip(freq = 880, type: OscillatorType = 'sine', duration = 0.08) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
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
      // Audio autoplay policy fallback
    }
  }

  playSuccess() {
    this.playBlip(523.25, 'triangle', 0.1);
    setTimeout(() => this.playBlip(659.25, 'triangle', 0.1), 80);
    setTimeout(() => this.playBlip(1046.5, 'sine', 0.2), 160);
  }
}

export const cypherSound = new CypherAudio();
