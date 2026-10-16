import React from 'react';
import { BarChart3, TrendingDown, TrendingUp } from 'lucide-react';
import type { CryptoToken } from '../data/cryptoData';
import { changeColor, formatCompact, formatPercentage, formatPrice, type Currency } from '../lib/crypto-utils';

interface TrendingMoversViewProps {
  tokens: CryptoToken[];
  currency: Currency;
  onSelectToken: (token: CryptoToken) => void;
}

const Column: React.FC<{
  title: string;
  icon: React.ReactNode;
  tokens: CryptoToken[];
  currency: Currency;
  detail: (t: CryptoToken) => React.ReactNode;
  onSelectToken: (t: CryptoToken) => void;
}> = ({ title, icon, tokens, currency, detail, onSelectToken }) => (
  <section className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
    <h2 className="flex items-center gap-2 font-semibold text-white">
      {icon}
      {title}
    </h2>
    <ol className="space-y-0.5">
      {tokens.map((token, i) => (
        <li key={token.id}>
          <button
            type="button"
            onClick={() => onSelectToken(token)}
            className="w-full flex items-center justify-between gap-3 p-2 min-h-11 rounded-lg hover:bg-slate-800/60 transition text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <span className="text-xs text-slate-500 w-4 tabular-nums">{i + 1}</span>
              <img src={token.icon} alt="" loading="lazy" className="w-6 h-6 rounded-full shrink-0 bg-slate-800" />
              <span className="min-w-0">
                <span className="block font-medium text-white truncate">{token.name}</span>
                <span className="block text-xs text-slate-400">{token.symbol}</span>
              </span>
            </span>
            <span className="text-right tabular-nums shrink-0">
              <span className="block text-sm text-slate-100">{formatPrice(token.price, currency)}</span>
              <span className="block text-xs">{detail(token)}</span>
            </span>
          </button>
        </li>
      ))}
    </ol>
  </section>
);

export const TrendingMoversView: React.FC<TrendingMoversViewProps> = ({ tokens, currency, onSelectToken }) => {
  const byChange = [...tokens].sort((a, b) => b.change24h - a.change24h);
  const gainers = byChange.slice(0, 6);
  const losers = byChange.slice(-6).reverse();
  const mostTraded = [...tokens].sort((a, b) => b.volume24h - a.volume24h).slice(0, 6);
  const pct = (t: CryptoToken) => <span className={`font-semibold ${changeColor(t.change24h)}`}>{formatPercentage(t.change24h)}</span>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Market movers</h1>
        <p className="text-sm text-slate-400 mt-1">
          Largest 24-hour moves and heaviest traded coins, across the top 50 by market cap.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Column
          title="Top gainers (24h)"
          icon={<TrendingUp className="w-4 h-4 text-emerald-400" aria-hidden="true" />}
          tokens={gainers}
          currency={currency}
          detail={pct}
          onSelectToken={onSelectToken}
        />
        <Column
          title="Top losers (24h)"
          icon={<TrendingDown className="w-4 h-4 text-rose-400" aria-hidden="true" />}
          tokens={losers}
          currency={currency}
          detail={pct}
          onSelectToken={onSelectToken}
        />
        <Column
          title="Most traded (24h)"
          icon={<BarChart3 className="w-4 h-4 text-cyan-400" aria-hidden="true" />}
          tokens={mostTraded}
          currency={currency}
          detail={(t) => <span className="text-slate-400">{formatCompact(t.volume24h, currency)}</span>}
          onSelectToken={onSelectToken}
        />
      </div>
    </div>
  );
};
