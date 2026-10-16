import React from 'react';
import {
  Flame,
  TrendingUp,
  Activity
} from 'lucide-react';
import { cryptoTokens, globalMarketStats, type CryptoToken, type GlobalStats } from '../data/cryptoData';

interface MarketHighlightsProps {
  onSelectToken: (tokenId: string) => void;
  tokens?: CryptoToken[];
  stats?: GlobalStats;
}

export const MarketHighlights: React.FC<MarketHighlightsProps> = ({
  onSelectToken,
  tokens = cryptoTokens,
  stats = globalMarketStats,
}) => {
  const fng = stats.fearGreed;
  const fmt = (r: { value: number; label: string } | null) => (r ? `${r.value} (${r.label})` : '—');
  const fngColor = !fng ? 'text-slate-500' : fng.now.value < 25 ? 'text-rose-400' : fng.now.value < 45 ? 'text-orange-400' : fng.now.value < 55 ? 'text-amber-300' : 'text-emerald-400';
  const sourceTokens = tokens.length > 0 ? tokens : cryptoTokens;

  // Top 3 by 24h trading volume (real data, not a popularity guess)
  const mostTraded = [...sourceTokens].sort((a, b) => b.volume24h - a.volume24h).slice(0, 3);

  // Top gainers (sorted by change24h desc)
  const topGainers = [...sourceTokens].sort((a, b) => b.change24h - a.change24h).slice(0, 3);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* 1. Trending Coins */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-3 font-mono">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-white font-bold">
            <Flame className="w-4 h-4 text-rose-500 fill-current" />
            <span>Most Traded (24h Volume)</span>
          </div>
          <span className="text-[10px] text-cyan-400">View all</span>
        </div>

        <div className="space-y-2">
          {mostTraded.map((token, idx) => (
            <div
              key={token.id}
              onClick={() => onSelectToken(token.id)}
              className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer transition text-xs"
            >
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 mr-2">
                <span className="text-[10px] text-slate-500 w-3 shrink-0">{idx + 1}</span>
                <img src={token.icon} alt={token.name} className="w-4 h-4 rounded-full shrink-0" />
                <span className="font-bold text-slate-200 truncate text-[11px] sm:text-xs max-w-[85px] sm:max-w-none">{token.name}</span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase shrink-0">{token.symbol}</span>
              </div>
              <span
                className={`font-bold flex items-center text-[11px] shrink-0 ${
                  token.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {token.change24h >= 0 ? '+' : ''}
                {token.change24h}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Top Gainers */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-3 font-mono">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-white font-bold">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Top Gainers (24h)</span>
          </div>
          <span className="text-[10px] text-emerald-400">Bullish</span>
        </div>

        <div className="space-y-2">
          {topGainers.map((token, idx) => (
            <div
              key={token.id}
              onClick={() => onSelectToken(token.id)}
              className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer transition text-xs"
            >
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 mr-2">
                <span className="text-[10px] text-slate-500 w-3 shrink-0">{idx + 1}</span>
                <img src={token.icon} alt={token.name} className="w-4 h-4 rounded-full shrink-0" />
                <span className="font-bold text-slate-200 truncate text-[11px] sm:text-xs max-w-[85px] sm:max-w-none">{token.name}</span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase shrink-0">{token.symbol}</span>
              </div>
              <span className="text-emerald-400 font-bold flex items-center text-[11px] shrink-0">
                +{token.change24h}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Fear & Greed Index */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-3 font-mono">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-white font-bold">
            <Activity className="w-4 h-4 text-amber-400" />
            <span>Fear & Greed Index</span>
          </div>
          <span className="text-[10px] text-slate-500">Source: alternative.me</span>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="shrink-0">
            <div className={`text-3xl font-extrabold ${fngColor}`}>{fng ? fng.now.value : '—'}</div>
            <div className={`text-xs font-bold uppercase tracking-wider ${fngColor}`}>{fng ? fng.now.label : 'Unavailable'}</div>
          </div>

          <div className="text-right text-[10px] text-slate-400 space-y-1 shrink-0">
            <div>Yesterday: <strong className="text-slate-300">{fmt(fng?.yesterday ?? null)}</strong></div>
            <div>Last Week: <strong className="text-slate-300">{fmt(fng?.lastWeek ?? null)}</strong></div>
            <div>Last Month: <strong className="text-slate-300">{fmt(fng?.lastMonth ?? null)}</strong></div>
          </div>
        </div>

        {/* Gauge bar */}
        <div className="w-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500 h-1.5 rounded-full relative">
          <div
            className="w-3 h-3 rounded-full bg-white border-2 border-slate-900 absolute -top-0.5 shadow"
            style={{ left: `${fng ? fng.now.value : 50}%`, opacity: fng ? 1 : 0.3 }}
          />
        </div>
      </div>
    </div>
  );
};
