import React, { useState } from 'react';
import { Pencil, Star, Wallet } from 'lucide-react';
import type { CryptoToken } from '../data/cryptoData';
import {
  changeColor,
  cypherSound,
  formatAmount,
  formatCompact,
  formatPercentage,
  formatPrice,
  isHoldingsRecord,
  readStorage,
  writeStorage,
  type Currency,
} from '../lib/crypto-utils';

interface PortfolioWatchlistProps {
  watchlist: string[];
  tokens: CryptoToken[];
  currency: Currency;
  onToggleWatchlist: (tokenId: string) => void;
  onSelectToken: (token: CryptoToken) => void;
  onBrowseMarkets: () => void;
}

const HOLDINGS_KEY = 'encryptoverse_holdings';

export const PortfolioWatchlist: React.FC<PortfolioWatchlistProps> = ({
  watchlist,
  tokens,
  currency,
  onToggleWatchlist,
  onSelectToken,
  onBrowseMarkets,
}) => {
  // Starts empty. Seeding invented holdings would show a stranger a portfolio they never entered.
  const [holdings, setHoldings] = useState<Record<string, number>>(() => readStorage(HOLDINGS_KEY, {}, isHoldingsRecord));
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const save = (tokenId: string) => {
    const amount = Number(draft);
    if (draft.trim() !== '' && Number.isFinite(amount) && amount >= 0) {
      const next = { ...holdings, [tokenId]: amount };
      if (amount === 0) delete next[tokenId];
      setHoldings(next);
      writeStorage(HOLDINGS_KEY, next);
      cypherSound.playSuccess();
    }
    setEditing(null);
    setDraft('');
  };

  // Show everything starred plus anything held, so the total always matches the rows on screen.
  const rows = tokens.filter((t) => watchlist.includes(t.id) || (holdings[t.id] ?? 0) > 0);

  let total = 0;
  let change24h = 0;
  for (const t of rows) {
    const amount = holdings[t.id] ?? 0;
    if (amount <= 0) continue;
    const value = amount * t.price;
    const previous = t.change24h > -100 ? value / (1 + t.change24h / 100) : value;
    total += value;
    change24h += value - previous;
  }
  const previousTotal = total - change24h;
  const pct = previousTotal > 0 ? (change24h / previousTotal) * 100 : 0;
  const hasHoldings = total > 0;

  return (
    <div className="space-y-6">
      <section
        aria-labelledby="portfolio-heading"
        className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/50 border border-slate-800"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div>
            <h1 id="portfolio-heading" className="text-sm text-slate-300 flex items-center gap-2 font-medium">
              <Wallet className="w-4 h-4 text-cyan-400" aria-hidden="true" />
              Portfolio value
            </h1>
            <p className="text-3xl sm:text-4xl font-bold text-white mt-1 tabular-nums">{formatPrice(total, currency)}</p>
            {hasHoldings ? (
              <p className={`mt-1 text-sm font-semibold tabular-nums ${changeColor(change24h)}`}>
                {change24h >= 0 ? '+' : '-'}
                {formatPrice(Math.abs(change24h), currency)} ({formatPercentage(pct)}) today
              </p>
            ) : (
              <p className="mt-1 text-sm text-slate-400">Add an amount to any coin below to start tracking.</p>
            )}
          </div>
          <p className="text-xs text-slate-400 max-w-[16rem] sm:text-right">
            Held only in this browser. Nothing is sent to a server or linked to your wallet.
          </p>
        </div>
      </section>

      <section aria-labelledby="watchlist-heading" className="space-y-3">
        <h2 id="watchlist-heading" className="flex items-center gap-2 font-semibold text-white">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" aria-hidden="true" />
          Watchlist <span className="text-slate-400 font-normal tabular-nums">({rows.length})</span>
        </h2>

        {rows.length === 0 ? (
          <div className="p-10 rounded-2xl bg-slate-900/50 border border-dashed border-slate-700 text-center space-y-3">
            <Star className="w-8 h-8 text-slate-600 mx-auto" aria-hidden="true" />
            <p className="text-slate-100 font-semibold">Your watchlist is empty</p>
            <p className="text-sm text-slate-400">Tap the star beside any coin to follow it here.</p>
            <button
              type="button"
              onClick={onBrowseMarkets}
              className="px-4 h-11 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-sm font-semibold"
            >
              Browse coins
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 overflow-x-auto">
            <table className="w-full text-left text-sm tabular-nums">
              <caption className="sr-only">Watchlist and holdings, valued in {currency}.</caption>
              <thead className="bg-[#0a0d14] border-b border-slate-800 text-xs text-slate-400">
                <tr>
                  <th scope="col" className="w-12 py-2.5 pl-2">
                    <span className="sr-only">Watchlist</span>
                  </th>
                  <th scope="col" className="py-2.5 px-3 font-medium">Coin</th>
                  <th scope="col" className="py-2.5 px-3 font-medium text-right">Price</th>
                  <th scope="col" className="py-2.5 px-3 font-medium text-right hidden sm:table-cell">24h</th>
                  <th scope="col" className="py-2.5 px-3 font-medium text-right hidden md:table-cell">Market cap</th>
                  <th scope="col" className="py-2.5 px-3 font-medium text-right">Holdings</th>
                  <th scope="col" className="py-2.5 px-3 font-medium text-right hidden sm:table-cell">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {rows.map((token) => {
                  const amount = holdings[token.id] ?? 0;
                  const starred = watchlist.includes(token.id);
                  const inputId = `holding-${token.id}`;
                  return (
                    <tr key={token.id} className="hover:bg-slate-900/60">
                      <td className="py-1 pl-1">
                        <button
                          type="button"
                          onClick={() => {
                            onToggleWatchlist(token.id);
                            cypherSound.playBlip(720);
                          }}
                          aria-label={starred ? `Remove ${token.name} from watchlist` : `Add ${token.name} to watchlist`}
                          aria-pressed={starred}
                          className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-slate-800/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
                        >
                          <Star className={`w-4 h-4 ${starred ? 'text-yellow-400 fill-yellow-400' : 'text-slate-500'}`} />
                        </button>
                      </td>

                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => onSelectToken(token)}
                          className="flex items-center gap-2.5 text-left rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
                        >
                          <img src={token.icon} alt="" loading="lazy" className="w-6 h-6 rounded-full bg-slate-800" />
                          <span>
                            <span className="block font-semibold text-white">{token.name}</span>
                            <span className="block text-xs text-slate-400">{token.symbol}</span>
                          </span>
                        </button>
                      </td>

                      <td className="py-3 px-3 text-right text-white font-medium whitespace-nowrap">
                        {formatPrice(token.price, currency)}
                      </td>
                      <td className={`py-3 px-3 text-right font-medium hidden sm:table-cell ${changeColor(token.change24h)}`}>
                        {formatPercentage(token.change24h)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-300 hidden md:table-cell whitespace-nowrap">
                        {formatCompact(token.marketCap, currency)}
                      </td>

                      <td className="py-3 px-3 text-right">
                        {editing === token.id ? (
                          <form
                            className="flex items-center justify-end gap-1.5"
                            onSubmit={(e) => {
                              e.preventDefault();
                              save(token.id);
                            }}
                          >
                            <label htmlFor={inputId} className="sr-only">
                              {token.symbol} amount held
                            </label>
                            <input
                              id={inputId}
                              type="number"
                              inputMode="decimal"
                              min="0"
                              step="any"
                              autoFocus
                              value={draft}
                              onChange={(e) => setDraft(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                  e.stopPropagation();
                                  setEditing(null);
                                }
                              }}
                              placeholder="0"
                              className="w-24 px-2 h-10 bg-slate-900 border border-slate-700 focus:border-cyan-500 focus:outline-none text-right text-white rounded-md"
                            />
                            <button type="submit" className="px-3 h-10 bg-cyan-400 text-slate-950 rounded-md text-xs font-semibold">
                              Save
                            </button>
                          </form>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(token.id);
                              setDraft(amount ? String(amount) : '');
                            }}
                            aria-label={`Edit ${token.symbol} holdings`}
                            className="inline-flex items-center gap-1.5 min-h-11 text-slate-300 hover:text-cyan-200 px-2 rounded-md hover:bg-slate-800"
                          >
                            {amount > 0 ? `${formatAmount(amount)} ${token.symbol}` : 'Add'}
                            <Pencil className="w-3 h-3 opacity-60" aria-hidden="true" />
                          </button>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right text-white font-medium hidden sm:table-cell whitespace-nowrap">
                        {amount > 0 ? formatPrice(amount * token.price, currency) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
