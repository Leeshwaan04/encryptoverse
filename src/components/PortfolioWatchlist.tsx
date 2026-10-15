import React, { useState } from 'react';
import {
  Star,
  TrendingUp,
  TrendingDown,
  Wallet
} from 'lucide-react';
import type { CryptoToken } from '../data/cryptoData';
import { cypherSound } from '../lib/crypto-utils';

interface PortfolioWatchlistProps {
  watchlist: string[];
  tokens: CryptoToken[];
  onToggleWatchlist: (tokenId: string) => void;
  onSelectToken: (token: CryptoToken) => void;
}

export const PortfolioWatchlist: React.FC<PortfolioWatchlistProps> = ({
  watchlist,
  tokens,
  onToggleWatchlist,
  onSelectToken,
}) => {
  // Holdings state: { tokenId: amount }
  const [holdings, setHoldings] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('encryptoverse_holdings');
      return saved ? JSON.parse(saved) : { bitcoin: 0.25, ethereum: 2.0, solana: 15 };
    } catch {
      return { bitcoin: 0.25, ethereum: 2.0, solana: 15 };
    }
  });

  const [editingToken, setEditingToken] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');

  const saveHoldings = (newHoldings: Record<string, number>) => {
    setHoldings(newHoldings);
    try {
      localStorage.setItem('encryptoverse_holdings', JSON.stringify(newHoldings));
    } catch {
      // Storage fallback
    }
  };

  const handleUpdateHolding = (tokenId: string) => {
    const amt = parseFloat(editAmount);
    if (!isNaN(amt) && amt >= 0) {
      const updated = { ...holdings, [tokenId]: amt };
      if (amt === 0) delete updated[tokenId];
      saveHoldings(updated);
      cypherSound.playSuccess();
    }
    setEditingToken(null);
    setEditAmount('');
  };

  // Compute total portfolio valuation
  const watchlistedTokens = tokens.filter((t) => watchlist.includes(t.id));

  let totalPortfolioValue = 0;
  let total24hProfitLoss = 0;

  tokens.forEach((t) => {
    const amt = holdings[t.id] || 0;
    if (amt > 0) {
      const curVal = amt * t.price;
      const prevVal = curVal / (1 + t.change24h / 100);
      totalPortfolioValue += curVal;
      total24hProfitLoss += curVal - prevVal;
    }
  });

  const portfolioPercentChange =
    totalPortfolioValue > 0
      ? (total24hProfitLoss / (totalPortfolioValue - total24hProfitLoss)) * 100
      : 0;

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Portfolio Summary Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900 to-indigo-950/40 border border-slate-800 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
              <Wallet className="w-4 h-4 text-cyan-400" />
              Simulated Portfolio Valuation
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              ${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`font-bold text-xs flex items-center ${
                  total24hProfitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {total24hProfitLoss >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5 mr-1" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 mr-1" />
                )}
                {total24hProfitLoss >= 0 ? '+' : ''}$
                {Math.abs(total24hProfitLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                ({portfolioPercentChange.toFixed(2)}% 24h)
              </span>
            </div>
          </div>

          <div className="text-right text-[11px] text-slate-400">
            <span>Client-side Storage · 100% Private</span>
          </div>
        </div>
      </div>

      {/* Watchlist Table */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Your Watchlist ({watchlistedTokens.length})
            </h3>
          </div>
          <span className="text-slate-500 text-[10px] sm:text-[11px]">Click star icon on any coin to add or remove</span>
        </div>

        {watchlistedTokens.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
            <Star className="w-8 h-8 text-slate-700 mx-auto" />
            <div className="text-slate-300 font-bold">Your watchlist is currently empty.</div>
            <p className="text-slate-500 text-[11px]">
              Browse the Cryptocurrencies market table and tap the star icon to track your favorite coins.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden shadow-lg">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left font-mono text-xs min-w-[340px]">
                <thead className="bg-[#05070b] border-b border-slate-800 text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-wider select-none">
                  <tr>
                    <th className="py-2.5 sm:py-3 px-2 sm:px-3 w-8 sm:w-10 text-center"></th>
                    <th className="py-2.5 sm:py-3 px-2 sm:px-3">Coin</th>
                    <th className="py-2.5 sm:py-3 px-2 sm:px-4 text-right">Price</th>
                    <th className="py-2.5 sm:py-3 px-2 sm:px-3 text-right">24h %</th>
                    <th className="py-2.5 sm:py-3 px-2 sm:px-4 text-right hidden md:table-cell">Market Cap</th>
                    <th className="py-2.5 sm:py-3 px-2 sm:px-4 text-right">Holdings</th>
                    <th className="py-2.5 sm:py-3 px-2 sm:px-4 text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {watchlistedTokens.map((token) => {
                    const myAmount = holdings[token.id] || 0;
                    const myValue = myAmount * token.price;

                    return (
                      <tr key={token.id} className="hover:bg-slate-900/50 cursor-pointer">
                        <td
                          onClick={() => {
                            onToggleWatchlist(token.id);
                            cypherSound.playBlip(720);
                          }}
                          className="py-3 px-3 text-center"
                        >
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        </td>

                        <td onClick={() => onSelectToken(token)} className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <img src={token.icon} alt={token.name} className="w-5 h-5 rounded-full" />
                            <span className="font-bold text-white">{token.name}</span>
                            <span className="text-[10px] text-slate-500">{token.symbol}</span>
                          </div>
                        </td>

                        <td onClick={() => onSelectToken(token)} className="py-3 px-4 text-right font-bold text-white">
                          ${token.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        <td
                          onClick={() => onSelectToken(token)}
                          className={`py-3 px-3 text-right font-bold ${
                            token.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {token.change24h >= 0 ? '+' : ''}{token.change24h}%
                        </td>

                        <td onClick={() => onSelectToken(token)} className="py-3 px-4 text-right text-slate-300">
                          ${(token.marketCap / 1e9).toFixed(2)}B
                        </td>

                        {/* Holdings Edit */}
                        <td className="py-3 px-4 text-right">
                          {editingToken === token.id ? (
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="number"
                                step="any"
                                value={editAmount}
                                onChange={(e) => setEditAmount(e.target.value)}
                                placeholder="Amount"
                                className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 text-right text-white text-xs rounded"
                              />
                              <button
                                onClick={() => handleUpdateHolding(token.id)}
                                className="px-2 py-1 bg-cyan-600 text-white rounded text-[10px] font-bold"
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingToken(token.id);
                                setEditAmount(myAmount ? myAmount.toString() : '');
                              }}
                              className="text-slate-400 hover:text-cyan-300 underline font-semibold"
                            >
                              {myAmount > 0 ? `${myAmount} ${token.symbol}` : '+ Add'}
                            </button>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right font-bold text-white">
                          ${myValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
