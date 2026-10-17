import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown, SearchX, Star } from 'lucide-react';
import type { CryptoToken } from '../data/cryptoData';
import { coinPath } from '../config/seo';
import {
  changeColor,
  cypherSound,
  formatCompact,
  formatPercentage,
  formatPrice,
  type Currency,
} from '../lib/crypto-utils';
import { Sparkline } from './Sparkline';

interface CryptoTableProps {
  tokens: CryptoToken[];
  currency: Currency;
  isLoading?: boolean;
  searchQuery?: string;
  onClearSearch?: () => void;
  watchlist: string[];
  onToggleWatchlist: (tokenId: string) => void;
  onSelectToken: (token: CryptoToken) => void;
}

const CATEGORIES = ['All', 'Layer 1', 'Layer 2', 'AI & Big Data', 'DeFi', 'Meme', 'DePIN', 'RWA'];

type SortField = 'rank' | 'name' | 'price' | 'change1h' | 'change24h' | 'change7d' | 'marketCap' | 'volume24h';

const COLUMNS: { field: SortField; label: string; right?: boolean; cls?: string }[] = [
  { field: 'rank', label: '#', cls: 'w-12 hidden sm:table-cell' },
  { field: 'name', label: 'Coin' },
  { field: 'price', label: 'Price', right: true },
  { field: 'change1h', label: '1h', right: true, cls: 'hidden md:table-cell' },
  { field: 'change24h', label: '24h', right: true },
  { field: 'change7d', label: '7d', right: true, cls: 'hidden md:table-cell' },
  { field: 'volume24h', label: '24h volume', right: true, cls: 'hidden xl:table-cell' },
  { field: 'marketCap', label: 'Market cap', right: true, cls: 'hidden sm:table-cell' },
];

const ChangeCell: React.FC<{ value: number; className?: string }> = ({ value, className = '' }) => (
  <td className={`py-3 px-3 text-right font-medium whitespace-nowrap ${changeColor(value)} ${className}`}>
    {formatPercentage(value)}
  </td>
);

export const CryptoTable: React.FC<CryptoTableProps> = ({
  tokens,
  currency,
  isLoading = false,
  searchQuery = '',
  onClearSearch,
  watchlist,
  onToggleWatchlist,
  onSelectToken,
}) => {
  const [category, setCategory] = useState('All');
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc((a) => !a);
    } else {
      setSortField(field);
      // Rank and name read naturally ascending; numbers are more useful highest-first.
      setSortAsc(field === 'rank' || field === 'name');
    }
    cypherSound.playBlip(550, 'sine', 0.03);
  };

  const filtered = category === 'All' ? tokens : tokens.filter((t) => t.category === category);
  const sorted = [...filtered].sort((a, b) => {
    const x = a[sortField];
    const y = b[sortField];
    if (typeof x === 'number' && typeof y === 'number') return sortAsc ? x - y : y - x;
    if (typeof x === 'string' && typeof y === 'string') return sortAsc ? x.localeCompare(y) : y.localeCompare(x);
    return 0;
  });

  return (
    <div className="space-y-3">
      <div
        role="group"
        aria-label="Filter by category"
        className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 text-sm"
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            aria-pressed={category === cat}
            onClick={() => {
              setCategory(cat);
              cypherSound.playBlip(600, 'sine', 0.03);
            }}
            className={`px-3 py-2 rounded-full whitespace-nowrap transition border ${
              category === cat
                ? 'bg-cyan-500/15 text-cyan-200 border-cyan-500/50 font-semibold'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/70 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm tabular-nums">
            <caption className="sr-only">
              Cryptocurrency prices in {currency}, sorted by {sortField}, {sortAsc ? 'ascending' : 'descending'}.
            </caption>
            <thead className="bg-[#0a0d14] border-b border-slate-800 text-xs text-slate-400">
              <tr>
                <th scope="col" className="w-12 py-2.5 pl-2">
                  <span className="sr-only">Watchlist</span>
                </th>
                {COLUMNS.map(({ field, label, right, cls }) => {
                  const active = sortField === field;
                  const Icon = active ? (sortAsc ? ChevronUp : ChevronDown) : ChevronsUpDown;
                  return (
                    <th
                      key={field}
                      scope="col"
                      aria-sort={active ? (sortAsc ? 'ascending' : 'descending') : 'none'}
                      className={`py-2.5 px-3 font-medium ${right ? 'text-right' : ''} ${cls ?? ''}`}
                    >
                      <button
                        type="button"
                        onClick={() => handleSort(field)}
                        aria-label={`Sort by ${label}`}
                        className={`inline-flex items-center gap-1 rounded hover:text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                          right ? 'flex-row-reverse' : ''
                        } ${active ? 'text-cyan-300' : ''}`}
                      >
                        <span>{label}</span>
                        <Icon className={`w-3.5 h-3.5 ${active ? '' : 'opacity-40'}`} aria-hidden="true" />
                      </button>
                    </th>
                  );
                })}
                <th scope="col" className="py-2.5 px-3 font-medium text-right hidden lg:table-cell">
                  Last 7 days
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {isLoading
                ? Array.from({ length: 8 }, (_, i) => (
                    <tr key={i}>
                      <td colSpan={10} className="py-3 px-3">
                        <div className="h-6 rounded bg-slate-800/60 animate-pulse" />
                        <span className="sr-only">Loading prices</span>
                      </td>
                    </tr>
                  ))
                : sorted.map((token) => {
                    const starred = watchlist.includes(token.id);
                    return (
                      <tr
                        key={token.id}
                        onClick={() => onSelectToken(token)}
                        className="hover:bg-slate-900/70 cursor-pointer transition-colors group"
                      >
                        <td className="py-1 pl-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleWatchlist(token.id);
                              cypherSound.playBlip(720, 'sine', 0.05);
                            }}
                            aria-label={starred ? `Remove ${token.name} from watchlist` : `Add ${token.name} to watchlist`}
                            aria-pressed={starred}
                            className="w-11 h-11 flex items-center justify-center rounded-lg text-slate-500 hover:text-yellow-400 hover:bg-slate-800/60 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
                          >
                            <Star className={`w-4 h-4 ${starred ? 'text-yellow-400 fill-yellow-400' : ''}`} />
                          </button>
                        </td>

                        <td className="py-3 px-3 text-slate-400 hidden sm:table-cell">{token.rank}</td>

                        <td className="py-3 px-3">
                          {/* A real link (/coin/<id>) so the row is crawlable, reachable and operable by keyboard. */}
                          <a
                            href={coinPath(token.id)}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // let "open in new tab" work
                              e.preventDefault();
                              onSelectToken(token);
                            }}
                            className="flex items-center gap-2.5 text-left rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
                          >
                            <img
                              src={token.icon}
                              alt=""
                              loading="lazy"
                              width={24}
                              height={24}
                              className="w-6 h-6 rounded-full shrink-0 bg-slate-800"
                            />
                            <span className="min-w-0">
                              <span className="block font-semibold text-white group-hover:text-cyan-200 transition truncate max-w-[8rem] sm:max-w-[14rem]">
                                {token.name}
                              </span>
                              <span className="block text-xs text-slate-400">{token.symbol}</span>
                            </span>
                          </a>
                        </td>

                        <td className="py-3 px-3 text-right font-semibold text-white whitespace-nowrap">
                          {formatPrice(token.price, currency)}
                        </td>
                        <ChangeCell value={token.change1h} className="hidden md:table-cell" />
                        <ChangeCell value={token.change24h} />
                        <ChangeCell value={token.change7d} className="hidden md:table-cell" />
                        <td className="py-3 px-3 text-right text-slate-300 whitespace-nowrap hidden xl:table-cell">
                          {formatCompact(token.volume24h, currency)}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-200 whitespace-nowrap hidden sm:table-cell">
                          {formatCompact(token.marketCap, currency)}
                        </td>
                        <td className="py-2 px-3 text-right hidden lg:table-cell">
                          <Sparkline
                            points={token.sparkline}
                            positive={token.change7d >= 0}
                            label={`${token.name} 7 day trend, ${formatPercentage(token.change7d)}`}
                          />
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>

        {!isLoading && sorted.length === 0 && (
          <div className="py-14 px-4 text-center space-y-3" role="status">
            <SearchX className="w-8 h-8 text-slate-600 mx-auto" aria-hidden="true" />
            <p className="text-slate-100 font-semibold">
              {searchQuery ? `No coins match "${searchQuery}"` : `No coins in ${category}`}
            </p>
            <p className="text-sm text-slate-400">This table covers the top 50 coins by market cap.</p>
            <div className="flex justify-center gap-2 pt-1">
              {searchQuery && onClearSearch && (
                <button
                  type="button"
                  onClick={onClearSearch}
                  className="px-4 py-2 rounded-lg text-sm bg-slate-800 hover:bg-slate-700 text-white font-medium"
                >
                  Clear search
                </button>
              )}
              {category !== 'All' && (
                <button
                  type="button"
                  onClick={() => setCategory('All')}
                  className="px-4 py-2 rounded-lg text-sm bg-slate-800 hover:bg-slate-700 text-white font-medium"
                >
                  Show all categories
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
