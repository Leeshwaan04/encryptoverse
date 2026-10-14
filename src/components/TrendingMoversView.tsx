import React from 'react';
import {
  Flame,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { cryptoTokens, type CryptoToken } from '../data/cryptoData';

interface TrendingMoversViewProps {
  onSelectToken: (token: CryptoToken) => void;
}

export const TrendingMoversView: React.FC<TrendingMoversViewProps> = ({ onSelectToken }) => {
  // Gainers
  const gainers = [...cryptoTokens].sort((a, b) => b.change24h - a.change24h).slice(0, 6);

  // Losers
  const losers = [...cryptoTokens].sort((a, b) => a.change24h - b.change24h).slice(0, 6);

  // Most visited / Trending
  const trending = [cryptoTokens[0], cryptoTokens[2], cryptoTokens[5], cryptoTokens[4], cryptoTokens[6], cryptoTokens[1]];

  return (
    <div className="space-y-6 font-mono text-xs">
      <div className="border-b border-slate-800 pb-3">
        <h2 className="text-xl font-extrabold text-white">Market Movers & Trending Analytics</h2>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Real-time tracking of top performers, highest search volume coins, and sharpest market pullbacks.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: Trending Coins */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 font-bold text-white text-sm">
            <Flame className="w-4 h-4 text-rose-500 fill-current" />
            <span>Most Trending</span>
          </div>

          <div className="space-y-2">
            {trending.map((token, idx) => (
              <div
                key={token.id}
                onClick={() => onSelectToken(token)}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-900 cursor-pointer transition"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] text-slate-500 font-bold w-3">{idx + 1}</span>
                  <img src={token.icon} alt={token.name} className="w-5 h-5 rounded-full" />
                  <div>
                    <div className="font-bold text-white">{token.name}</div>
                    <div className="text-[10px] text-slate-500 uppercase">{token.symbol}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-200">${token.price.toLocaleString()}</div>
                  <div className={`text-[10px] font-bold ${token.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {token.change24h >= 0 ? '+' : ''}{token.change24h}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Top Gainers */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 font-bold text-white text-sm">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Top Gainers (24h)</span>
          </div>

          <div className="space-y-2">
            {gainers.map((token, idx) => (
              <div
                key={token.id}
                onClick={() => onSelectToken(token)}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-900 cursor-pointer transition"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] text-slate-500 font-bold w-3">{idx + 1}</span>
                  <img src={token.icon} alt={token.name} className="w-5 h-5 rounded-full" />
                  <div>
                    <div className="font-bold text-white">{token.name}</div>
                    <div className="text-[10px] text-slate-500 uppercase">{token.symbol}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-200">${token.price.toLocaleString()}</div>
                  <div className="text-[10px] font-bold text-emerald-400">
                    +{token.change24h}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Top Losers / Pullbacks */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 font-bold text-white text-sm">
            <TrendingDown className="w-4 h-4 text-rose-400" />
            <span>Top Losers (24h)</span>
          </div>

          <div className="space-y-2">
            {losers.map((token, idx) => (
              <div
                key={token.id}
                onClick={() => onSelectToken(token)}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-900 cursor-pointer transition"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] text-slate-500 font-bold w-3">{idx + 1}</span>
                  <img src={token.icon} alt={token.name} className="w-5 h-5 rounded-full" />
                  <div>
                    <div className="font-bold text-white">{token.name}</div>
                    <div className="text-[10px] text-slate-500 uppercase">{token.symbol}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-200">${token.price.toLocaleString()}</div>
                  <div className="text-[10px] font-bold text-rose-400">
                    {token.change24h}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
