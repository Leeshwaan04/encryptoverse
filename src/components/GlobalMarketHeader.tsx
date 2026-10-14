import React from 'react';
import {
  TrendingUp,
  Fuel,
  Activity,
  DollarSign,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import { globalMarketStats } from '../data/cryptoData';
import { cypherSound } from '../lib/crypto-utils';

interface GlobalMarketHeaderProps {
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
  stats?: typeof globalMarketStats;
  isLive?: boolean;
  isCached?: boolean;
  isLoading?: boolean;
  onRefresh?: () => void;
  lastUpdated?: Date;
}

export const GlobalMarketHeader: React.FC<GlobalMarketHeaderProps> = ({
  selectedCurrency,
  onCurrencyChange,
  stats = globalMarketStats,
  isLive = true,
  isCached = false,
  isLoading = false,
  onRefresh,
  lastUpdated,
}) => {
  const currentStats = stats || globalMarketStats;

  return (
    <div className="w-full bg-[#05070b] border-b border-slate-800 text-[11px] font-mono text-slate-400 py-1.5 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 overflow-x-auto no-scrollbar whitespace-nowrap">
        {/* Left Market Metrics */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Live Feed Status Badge */}
          <div className="flex items-center gap-2 pr-3 border-r border-slate-800">
            {isLive ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                <Wifi className="w-3 h-3 text-emerald-400" />
                <span>{isCached ? 'CACHED' : 'LIVE API'}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-400 font-bold text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                <WifiOff className="w-3 h-3 text-amber-400" />
                <span>OFFLINE DATA</span>
              </span>
            )}

            {onRefresh && (
              <button
                onClick={() => {
                  cypherSound.playBlip(680, 'sine', 0.05);
                  onRefresh();
                }}
                disabled={isLoading}
                title={lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Refresh feed'}
                className="text-slate-500 hover:text-cyan-400 transition p-0.5 rounded disabled:opacity-40"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Cryptos:</span>
            <span className="text-cyan-400 font-bold">
              {currentStats.activeCryptos.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Exchanges:</span>
            <span className="text-slate-300 font-bold">{currentStats.exchangesCount}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Market Cap:</span>
            <span className="text-slate-200 font-bold">
              ${(currentStats.totalMarketCap / 1e12).toFixed(2)}T
            </span>
            <span className="text-emerald-400 font-bold flex items-center text-[10px]">
              <TrendingUp className="w-3 h-3 inline mr-0.5" />
              +{currentStats.marketCapChange24h}%
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">24h Vol:</span>
            <span className="text-slate-200 font-bold">
              ${(currentStats.volume24h / 1e9).toFixed(1)}B
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Dominance:</span>
            <span className="text-slate-300">
              BTC <strong className="text-amber-400">{currentStats.btcDominance}%</strong>
            </span>
            <span className="text-slate-300">
              ETH <strong className="text-cyan-400">{currentStats.ethDominance}%</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Fuel className="w-3 h-3 text-cyan-400" />
            <span className="text-slate-500">Gas:</span>
            <span className="text-cyan-300 font-bold">{currentStats.gasGwei} Gwei</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-emerald-400" />
            <span className="text-slate-500">Fear & Greed:</span>
            <span className="text-emerald-400 font-bold">
              {currentStats.fearGreedIndex}/100 ({currentStats.fearGreedLabel})
            </span>
          </div>
        </div>

        {/* Currency Switcher */}
        <div className="flex items-center gap-2 pl-4 border-l border-slate-800">
          <DollarSign className="w-3 h-3 text-slate-500" />
          <select
            value={selectedCurrency}
            onChange={(e) => onCurrencyChange(e.target.value)}
            className="bg-transparent text-slate-300 hover:text-white focus:outline-none cursor-pointer font-bold text-[11px]"
          >
            <option value="USD" className="bg-slate-900 text-slate-200">USD ($)</option>
            <option value="EUR" className="bg-slate-900 text-slate-200">EUR (€)</option>
            <option value="GBP" className="bg-slate-900 text-slate-200">GBP (£)</option>
            <option value="BTC" className="bg-slate-900 text-slate-200">BTC (₿)</option>
            <option value="ETH" className="bg-slate-900 text-slate-200">ETH (Ξ)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
