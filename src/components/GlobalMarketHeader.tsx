import React from 'react';
import { Activity, RefreshCw, TrendingDown, TrendingUp, Wifi, WifiOff } from 'lucide-react';
import { globalMarketStats } from '../data/cryptoData';
import type { FearGreedResult } from '../services/cryptoApi';
import {
  CURRENCIES,
  changeColor,
  cypherSound,
  fearGreedColor,
  formatCompact,
  formatPercentage,
  type Currency,
} from '../lib/crypto-utils';

interface GlobalMarketHeaderProps {
  currency: Currency;
  onCurrencyChange: (currency: Currency) => void;
  stats?: typeof globalMarketStats;
  fearGreed?: FearGreedResult | null;
  isLive?: boolean;
  isCached?: boolean;
  isLoading?: boolean;
  error?: string;
  onRefresh?: () => void;
  lastUpdated?: Date;
}

const Stat: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-center gap-1.5">
    <span className="text-slate-400">{label}</span>
    {children}
  </div>
);

export const GlobalMarketHeader: React.FC<GlobalMarketHeaderProps> = ({
  currency,
  onCurrencyChange,
  stats = globalMarketStats,
  fearGreed,
  isLive = true,
  isCached = false,
  isLoading = false,
  error,
  onRefresh,
  lastUpdated,
}) => {
  const change = stats.marketCapChange24h;

  return (
    <section
      aria-label="Global market statistics"
      className="w-full bg-[#05070b] border-b border-slate-800 text-xs text-slate-300 py-2 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-5 overflow-x-auto no-scrollbar whitespace-nowrap min-w-0 tabular-nums">
          <div className="flex items-center gap-1.5 pr-4 border-r border-slate-800" aria-live="polite">
            {isLive ? (
              <span className="flex items-center gap-1.5 text-emerald-300 font-semibold text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25">
                <Wifi className="w-3 h-3" aria-hidden="true" />
                {isCached ? 'Cached' : 'Live'}
              </span>
            ) : (
              // Never claim live data when the feed failed; say which it is.
              <span
                title={error}
                className="flex items-center gap-1.5 text-amber-300 font-semibold text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25"
              >
                <WifiOff className="w-3 h-3" aria-hidden="true" />
                {isLoading ? 'Connecting' : 'Sample data'}
              </span>
            )}

            {onRefresh && (
              <button
                type="button"
                onClick={() => {
                  cypherSound.playBlip(680, 'sine', 0.05);
                  onRefresh();
                }}
                disabled={isLoading}
                aria-label={lastUpdated ? `Refresh prices. Last updated ${lastUpdated.toLocaleTimeString()}` : 'Refresh prices'}
                title={lastUpdated ? `Last updated ${lastUpdated.toLocaleTimeString()}` : 'Refresh'}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-cyan-300 transition rounded disabled:opacity-40"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} aria-hidden="true" />
              </button>
            )}
          </div>

          <Stat label="Market cap">
            <span className="text-white font-semibold">{formatCompact(stats.totalMarketCap, 'USD')}</span>
            <span className={`font-semibold flex items-center ${changeColor(change)}`}>
              {change >= 0 ? (
                <TrendingUp className="w-3 h-3 mr-0.5" aria-hidden="true" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-0.5" aria-hidden="true" />
              )}
              {formatPercentage(change)}
            </span>
          </Stat>

          <Stat label="24h volume">
            <span className="text-white font-semibold">{formatCompact(stats.volume24h, 'USD')}</span>
          </Stat>

          <Stat label="Dominance">
            <span>
              BTC <strong className="text-amber-300 font-semibold">{stats.btcDominance}%</strong>
            </span>
            <span>
              ETH <strong className="text-cyan-300 font-semibold">{stats.ethDominance}%</strong>
            </span>
          </Stat>

          {fearGreed && (
            <div className="flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-slate-400" aria-hidden="true" />
              <span className="text-slate-400">Fear &amp; Greed</span>
              <span className={`font-semibold ${fearGreedColor(fearGreed.now.value)}`}>
                {fearGreed.now.value} · {fearGreed.now.label}
              </span>
            </div>
          )}

          <Stat label="Coins">
            <span className="text-white font-semibold">{stats.activeCryptos.toLocaleString('en-US')}</span>
          </Stat>
        </div>

        <div className="flex items-center gap-2 pl-4 border-l border-slate-800 shrink-0">
          <label htmlFor="currency-select" className="sr-only">
            Display currency
          </label>
          <select
            id="currency-select"
            value={currency}
            onChange={(e) => onCurrencyChange(e.target.value as Currency)}
            className="bg-slate-900 border border-slate-800 rounded-md px-2 h-8 text-slate-200 hover:text-white focus:outline-none focus:border-cyan-500 cursor-pointer font-semibold text-xs"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
};
