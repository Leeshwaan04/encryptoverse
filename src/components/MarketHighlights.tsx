import React from 'react';
import {
  Flame,
  TrendingUp,
  Rocket,
  Activity
} from 'lucide-react';
import { cryptoTokens, icoProjects, globalMarketStats, type CryptoToken } from '../data/cryptoData';

interface MarketHighlightsProps {
  onSelectToken: (tokenId: string) => void;
  onSelectIco: (icoId: string) => void;
  tokens?: CryptoToken[];
}

export const MarketHighlights: React.FC<MarketHighlightsProps> = ({
  onSelectToken,
  onSelectIco,
  tokens = cryptoTokens,
}) => {
  const sourceTokens = tokens.length > 0 ? tokens : cryptoTokens;

  // Top 3 trending
  const trending = [sourceTokens[0], sourceTokens[2] || sourceTokens[0], sourceTokens[4] || sourceTokens[1]];

  // Top gainers (sorted by change24h desc)
  const topGainers = [...sourceTokens].sort((a, b) => b.change24h - a.change24h).slice(0, 3);

  // Spotlight active ICO
  const spotlightIco = icoProjects[0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Trending Coins */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-3 font-mono">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-white font-bold">
            <Flame className="w-4 h-4 text-rose-500 fill-current" />
            <span>Trending Coins</span>
          </div>
          <span className="text-[10px] text-cyan-400">View all</span>
        </div>

        <div className="space-y-2">
          {trending.map((token, idx) => (
            <div
              key={token.id}
              onClick={() => onSelectToken(token.id)}
              className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer transition text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 w-3">{idx + 1}</span>
                <img src={token.icon} alt={token.name} className="w-4 h-4 rounded-full" />
                <span className="font-bold text-slate-200">{token.name}</span>
                <span className="text-[10px] text-slate-500">{token.symbol}</span>
              </div>
              <span
                className={`font-bold flex items-center text-[11px] ${
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
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 w-3">{idx + 1}</span>
                <img src={token.icon} alt={token.name} className="w-4 h-4 rounded-full" />
                <span className="font-bold text-slate-200">{token.name}</span>
                <span className="text-[10px] text-slate-500">{token.symbol}</span>
              </div>
              <span className="text-emerald-400 font-bold flex items-center text-[11px]">
                +{token.change24h}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Spotlight ICO Drop */}
      <div
        onClick={() => onSelectIco(spotlightIco.id)}
        className="p-4 rounded-xl bg-gradient-to-br from-slate-900/80 to-cyan-950/30 border border-cyan-800/40 backdrop-blur-md space-y-3 font-mono cursor-pointer hover:border-cyan-500/60 transition group"
      >
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
            <Rocket className="w-4 h-4 text-amber-400" />
            <span>Spotlight Presale</span>
          </div>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            STAGE 2 LIVE
          </span>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition">
              {spotlightIco.name}
            </span>
            <span className="text-xs text-amber-400 font-bold">${spotlightIco.tokenPrice}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {spotlightIco.stage} · {spotlightIco.category}
          </div>
        </div>

        {/* Mini progress bar */}
        <div className="space-y-1">
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-full rounded-full"
              style={{ width: `${(spotlightIco.raisedAmount / spotlightIco.targetRaise) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Raised: ${(spotlightIco.raisedAmount / 1e6).toFixed(2)}M</span>
            <span className="text-cyan-400 font-bold">
              {((spotlightIco.raisedAmount / spotlightIco.targetRaise) * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* 4. Fear & Greed Index */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-3 font-mono">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-white font-bold">
            <Activity className="w-4 h-4 text-amber-400" />
            <span>Fear & Greed Index</span>
          </div>
          <span className="text-[10px] text-slate-500">Updated today</span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div>
            <div className="text-3xl font-extrabold text-emerald-400">
              {globalMarketStats.fearGreedIndex}
            </div>
            <div className="text-xs text-emerald-300 font-bold uppercase tracking-wider">
              {globalMarketStats.fearGreedLabel}
            </div>
          </div>

          <div className="text-right text-[10px] text-slate-400 space-y-1">
            <div>Yesterday: <strong className="text-slate-300">71 (Greed)</strong></div>
            <div>Last Week: <strong className="text-slate-300">65 (Greed)</strong></div>
            <div>Last Month: <strong className="text-slate-400">54 (Neutral)</strong></div>
          </div>
        </div>

        {/* Gauge bar */}
        <div className="w-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500 h-1.5 rounded-full relative">
          <div
            className="w-3 h-3 rounded-full bg-white border-2 border-slate-900 absolute -top-0.5 shadow"
            style={{ left: `${globalMarketStats.fearGreedIndex}%` }}
          />
        </div>
      </div>
    </div>
  );
};
