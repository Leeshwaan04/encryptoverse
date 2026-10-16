import React, { useState } from 'react';
import {
  Star,
  TrendingUp,
  TrendingDown,
  ArrowUpDown
} from 'lucide-react';
import type { CryptoToken } from '../data/cryptoData';
import { cypherSound } from '../lib/crypto-utils';

interface CryptoTableProps {
  tokens: CryptoToken[];
  watchlist: string[];
  onToggleWatchlist: (tokenId: string) => void;
  onSelectToken: (token: CryptoToken) => void;
}

export const CryptoTable: React.FC<CryptoTableProps> = ({
  tokens,
  watchlist,
  onToggleWatchlist,
  onSelectToken,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortField, setSortField] = useState<keyof CryptoToken>('rank');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const categories = [
    'All',
    'Layer 1',
    'Layer 2',
    'AI & Big Data',
    'DeFi',
    'Meme',
    'DePIN',
    'RWA',
  ];

  const handleSort = (field: keyof CryptoToken) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'rank' || field === 'name');
    }
    cypherSound.playBlip(550, 'sine', 0.03);
  };

  // Filter tokens by category
  const filteredTokens = tokens.filter((t) => {
    if (selectedCategory === 'All') return true;
    return t.category === selectedCategory;
  });

  // Sort tokens
  const sortedTokens = [...filteredTokens].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortAsc ? valA - valB : valB - valA;
    }
    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return 0;
  });

  // Mini sparkline SVG renderer
  const renderSparkline = (points: number[], positive: boolean) => {
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const width = 110;
    const height = 32;

    const coords = points.map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((p - min) / range) * (height - 8) - 4;
      return `${x},${y}`;
    });

    const color = positive ? '#10b981' : '#f43f5e';

    return (
      <svg width={width} height={height} className="overflow-visible inline-block">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={coords.join(' ')}
        />
      </svg>
    );
  };

  return (
    <div className="space-y-3.5">
      {/* Category Filter Chips Bar */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1 font-mono text-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setSelectedCategory(cat);
              cypherSound.playBlip(600, 'sine', 0.03);
            }}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg whitespace-nowrap transition font-bold text-[11px] sm:text-xs ${
              selectedCategory === cat
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Table Container */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/70 backdrop-blur-md overflow-hidden shadow-lg">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left font-mono text-xs">
            {/* Table Header */}
            <thead className="bg-[#05070b] border-b border-slate-800/80 text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-wider select-none">
              <tr>
                <th className="py-2.5 sm:py-3 px-2 sm:px-3 w-8 sm:w-10 text-center"></th>
                <th
                  onClick={() => handleSort('rank')}
                  className="py-2.5 sm:py-3 px-1.5 sm:px-3 cursor-pointer hover:text-cyan-400"
                >
                  <div className="flex items-center gap-1">
                    <span>#</span>
                    <ArrowUpDown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="py-2.5 sm:py-3 px-2 sm:px-4 cursor-pointer hover:text-cyan-400"
                >
                  <div className="flex items-center gap-1">
                    <span>Name</span>
                    <ArrowUpDown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('price')}
                  className="py-2.5 sm:py-3 px-2 sm:px-4 text-right cursor-pointer hover:text-cyan-400"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Price</span>
                    <ArrowUpDown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('change24h')}
                  className="py-2.5 sm:py-3 px-2 sm:px-3 text-right cursor-pointer hover:text-cyan-400"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>24h %</span>
                    <ArrowUpDown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('change1h')}
                  className="py-2.5 sm:py-3 px-2 sm:px-3 text-right cursor-pointer hover:text-cyan-400 hidden sm:table-cell"
                >
                  <span>1h %</span>
                </th>
                <th
                  onClick={() => handleSort('change7d')}
                  className="py-2.5 sm:py-3 px-2 sm:px-3 text-right cursor-pointer hover:text-cyan-400 hidden md:table-cell"
                >
                  <span>7d %</span>
                </th>
                <th
                  onClick={() => handleSort('marketCap')}
                  className="py-2.5 sm:py-3 px-2 sm:px-4 text-right cursor-pointer hover:text-cyan-400 hidden sm:table-cell"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Market Cap</span>
                    <ArrowUpDown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('volume24h')}
                  className="py-2.5 sm:py-3 px-2 sm:px-4 text-right cursor-pointer hover:text-cyan-400 hidden lg:table-cell"
                >
                  <span>24h Vol</span>
                </th>
                <th className="py-2.5 sm:py-3 px-3 sm:px-4 text-center hidden xl:table-cell">
                  Circulating Supply
                </th>
                <th className="py-2.5 sm:py-3 px-3 sm:px-4 text-center hidden md:table-cell">
                  Last 7 Days
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-800/60">
              {sortedTokens.map((token) => {
                const isFav = watchlist.includes(token.id);
                const isPos1h = token.change1h >= 0;
                const isPos24h = token.change24h >= 0;
                const isPos7d = token.change7d >= 0;

                return (
                  <tr
                    key={token.id}
                    className="hover:bg-slate-900/60 cursor-pointer transition duration-150 group"
                  >
                    {/* Star Favorite Toggle */}
                    <td
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWatchlist(token.id);
                        cypherSound.playBlip(720, 'sine', 0.05);
                      }}
                      className="py-2.5 sm:py-3.5 px-2 sm:px-3 text-center"
                    >
                      <button className="text-slate-600 hover:text-yellow-400 transition p-1">
                        <Star
                          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                            isFav ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'
                          }`}
                        />
                      </button>
                    </td>

                    {/* Rank */}
                    <td
                      onClick={() => onSelectToken(token)}
                      className="py-2.5 sm:py-3.5 px-1.5 sm:px-3 text-slate-500 font-bold text-[11px] sm:text-xs"
                    >
                      {token.rank}
                    </td>

                    {/* Name & Symbol */}
                    <td onClick={() => onSelectToken(token)} className="py-2.5 sm:py-3.5 px-2 sm:px-4">
                      <div className="flex items-center gap-2 sm:gap-2.5">
                        <img
                          src={token.icon}
                          alt={token.name}
                          className="w-5 h-5 sm:w-6 sm:h-6 rounded-full group-hover:scale-110 transition duration-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-white group-hover:text-cyan-300 transition truncate text-[11px] sm:text-xs max-w-[100px] sm:max-w-none">
                            {token.name}
                          </div>
                          <div className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-semibold">
                            {token.symbol}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Price */}
                    <td
                      onClick={() => onSelectToken(token)}
                      className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-right font-bold text-white text-xs sm:text-[13px] whitespace-nowrap"
                    >
                      {token.price < 0.01
                        ? `$${token.price.toFixed(8)}`
                        : `$${token.price.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`}
                    </td>

                    {/* 24h Change */}
                    <td
                      onClick={() => onSelectToken(token)}
                      className={`py-2.5 sm:py-3.5 px-2 sm:px-3 text-right font-bold text-[11px] sm:text-xs whitespace-nowrap ${
                        isPos24h ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                        {isPos24h ? (
                          <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                        ) : (
                          <TrendingDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                        )}
                        <span>
                          {isPos24h ? '+' : ''}
                          {token.change24h}%
                        </span>
                      </div>
                    </td>

                    {/* 1h Change */}
                    <td
                      onClick={() => onSelectToken(token)}
                      className={`py-2.5 sm:py-3.5 px-2 sm:px-3 text-right font-semibold hidden sm:table-cell text-[11px] sm:text-xs ${
                        isPos1h ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isPos1h ? '+' : ''}
                      {token.change1h}%
                    </td>

                    {/* 7d Change */}
                    <td
                      onClick={() => onSelectToken(token)}
                      className={`py-2.5 sm:py-3.5 px-2 sm:px-3 text-right font-semibold hidden md:table-cell text-[11px] sm:text-xs ${
                        isPos7d ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isPos7d ? '+' : ''}
                      {token.change7d}%
                    </td>

                    {/* Market Cap */}
                    <td
                      onClick={() => onSelectToken(token)}
                      className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-right font-bold text-slate-200 hidden sm:table-cell text-[11px] sm:text-xs whitespace-nowrap"
                    >
                      ${(token.marketCap / 1e9).toFixed(2)}B
                    </td>

                    {/* 24h Volume */}
                    <td
                      onClick={() => onSelectToken(token)}
                      className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-right text-slate-300 hidden lg:table-cell text-[11px] sm:text-xs whitespace-nowrap"
                    >
                      ${(token.volume24h / 1e6).toLocaleString(undefined, { maximumFractionDigits: 1 })}M
                    </td>

                    {/* Circulating Supply */}
                    <td
                      onClick={() => onSelectToken(token)}
                      className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-center hidden xl:table-cell"
                    >
                      <div className="space-y-1">
                        <div className="text-slate-300 text-[11px]">
                          {token.circulatingSupply.toLocaleString()} {token.symbol}
                        </div>
                        {token.maxSupply && (
                          <div className="w-24 xl:w-28 mx-auto bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-cyan-400 h-full rounded-full"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (token.circulatingSupply / token.maxSupply) * 100
                                )}%`,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Sparkline Chart */}
                    <td
                      onClick={() => onSelectToken(token)}
                      className="py-2.5 sm:py-3.5 px-2 sm:px-4 text-center hidden md:table-cell"
                    >
                      <div className="flex items-center justify-center">
                        {renderSparkline(token.sparkline, isPos7d)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
