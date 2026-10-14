import React from 'react';
import {
  TrendingUp,
  Fuel,
  Activity,
  DollarSign
} from 'lucide-react';
import { globalMarketStats } from '../data/cryptoData';

interface GlobalMarketHeaderProps {
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
}

export const GlobalMarketHeader: React.FC<GlobalMarketHeaderProps> = ({
  selectedCurrency,
  onCurrencyChange,
}) => {
  return (
    <div className="w-full bg-[#05070b] border-b border-slate-800 text-[11px] font-mono text-slate-400 py-1.5 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 overflow-x-auto no-scrollbar whitespace-nowrap">
        {/* Left Market Metrics */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Cryptos:</span>
            <span className="text-cyan-400 font-bold">
              {globalMarketStats.activeCryptos.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Exchanges:</span>
            <span className="text-slate-300 font-bold">{globalMarketStats.exchangesCount}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Market Cap:</span>
            <span className="text-slate-200 font-bold">
              ${(globalMarketStats.totalMarketCap / 1e12).toFixed(2)}T
            </span>
            <span className="text-emerald-400 font-bold flex items-center text-[10px]">
              <TrendingUp className="w-3 h-3 inline mr-0.5" />
              +{globalMarketStats.marketCapChange24h}%
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">24h Vol:</span>
            <span className="text-slate-200 font-bold">
              ${(globalMarketStats.volume24h / 1e9).toFixed(1)}B
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Dominance:</span>
            <span className="text-slate-300">
              BTC <strong className="text-amber-400">{globalMarketStats.btcDominance}%</strong>
            </span>
            <span className="text-slate-300">
              ETH <strong className="text-cyan-400">{globalMarketStats.ethDominance}%</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Fuel className="w-3 h-3 text-cyan-400" />
            <span className="text-slate-500">Gas:</span>
            <span className="text-cyan-300 font-bold">{globalMarketStats.gasGwei} Gwei</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-emerald-400" />
            <span className="text-slate-500">Fear & Greed:</span>
            <span className="text-emerald-400 font-bold">
              {globalMarketStats.fearGreedIndex}/100 ({globalMarketStats.fearGreedLabel})
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
