import React from 'react';
import { Activity, BarChart3, ChevronRight, TrendingUp } from 'lucide-react';
import type { CryptoToken } from '../data/cryptoData';
import type { FearGreedResult } from '../services/cryptoApi';
import { changeColor, fearGreedColor, formatPercentage, formatPrice, type Currency } from '../lib/crypto-utils';

interface MarketHighlightsProps {
  tokens: CryptoToken[];
  currency: Currency;
  fearGreed: FearGreedResult | null;
  onSelectToken: (token: CryptoToken) => void;
  onViewAll: () => void;
}

const Card: React.FC<{ title: string; icon: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }> = ({
  title,
  icon,
  action,
  children,
}) => (
  <section className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
    <div className="flex items-center justify-between gap-2">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
        {icon}
        {title}
      </h2>
      {action}
    </div>
    {children}
  </section>
);

const Row: React.FC<{ token: CryptoToken; index: number; currency: Currency; onSelect: () => void }> = ({
  token,
  index,
  currency,
  onSelect,
}) => (
  <li>
    <button
      type="button"
      onClick={onSelect}
      className="w-full flex items-center justify-between gap-2 px-2 py-2 -mx-2 min-h-11 rounded-lg hover:bg-slate-800/60 transition text-sm text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
    >
      <span className="flex items-center gap-2 min-w-0">
        <span className="text-xs text-slate-500 w-3 shrink-0 tabular-nums">{index + 1}</span>
        <img src={token.icon} alt="" loading="lazy" className="w-5 h-5 rounded-full shrink-0 bg-slate-800" />
        <span className="font-medium text-slate-100 truncate">{token.name}</span>
      </span>
      <span className="flex items-baseline gap-2 shrink-0 tabular-nums">
        <span className="text-xs text-slate-400 hidden min-[420px]:inline">{formatPrice(token.price, currency)}</span>
        <span className={`font-semibold text-xs ${changeColor(token.change24h)}`}>{formatPercentage(token.change24h)}</span>
      </span>
    </button>
  </li>
);

export const MarketHighlights: React.FC<MarketHighlightsProps> = ({
  tokens,
  currency,
  fearGreed,
  onSelectToken,
  onViewAll,
}) => {
  // "Most traded" is measurable from the data we have; a real "trending" signal would need a different endpoint.
  const mostTraded = [...tokens].sort((a, b) => b.volume24h - a.volume24h).slice(0, 3);
  const topGainers = [...tokens].sort((a, b) => b.change24h - a.change24h).slice(0, 3);

  const viewAll = (
    <button
      type="button"
      onClick={onViewAll}
      className="text-xs text-cyan-300 hover:text-cyan-200 flex items-center px-2 py-1 -mr-2 rounded"
    >
      View all <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
    </button>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <Card title="Most traded (24h)" icon={<BarChart3 className="w-4 h-4 text-cyan-400" aria-hidden="true" />} action={viewAll}>
        <ol className="space-y-0.5">
          {mostTraded.map((t, i) => (
            <Row key={t.id} token={t} index={i} currency={currency} onSelect={() => onSelectToken(t)} />
          ))}
        </ol>
      </Card>

      <Card title="Top gainers (24h)" icon={<TrendingUp className="w-4 h-4 text-emerald-400" aria-hidden="true" />} action={viewAll}>
        <ol className="space-y-0.5">
          {topGainers.map((t, i) => (
            <Row key={t.id} token={t} index={i} currency={currency} onSelect={() => onSelectToken(t)} />
          ))}
        </ol>
      </Card>

      <Card title="Fear &amp; Greed" icon={<Activity className="w-4 h-4 text-amber-400" aria-hidden="true" />}>
        {fearGreed ? (
          <>
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className={`text-3xl font-bold tabular-nums ${fearGreedColor(fearGreed.now.value)}`}>
                  {fearGreed.now.value}
                </div>
                <div className={`text-sm font-semibold ${fearGreedColor(fearGreed.now.value)}`}>{fearGreed.now.label}</div>
              </div>
              <dl className="text-right text-xs text-slate-400 space-y-0.5 tabular-nums">
                {(
                  [
                    ['Yesterday', fearGreed.yesterday],
                    ['Last week', fearGreed.lastWeek],
                    ['Last month', fearGreed.lastMonth],
                  ] as const
                ).map(([label, r]) =>
                  r ? (
                    <div key={label} className="flex justify-end gap-1.5">
                      <dt>{label}</dt>
                      <dd className="text-slate-200">{r.value}</dd>
                    </div>
                  ) : null
                )}
              </dl>
            </div>
            <div
              className="w-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500 h-1.5 rounded-full relative"
              role="meter"
              aria-label="Fear and Greed index"
              aria-valuenow={fearGreed.now.value}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="w-3 h-3 rounded-full bg-white border-2 border-slate-900 absolute -top-[3px] -translate-x-1/2 shadow"
                style={{ left: `${fearGreed.now.value}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">Source: alternative.me, updated daily</p>
          </>
        ) : (
          <p className="text-sm text-slate-400 py-5">Index unavailable right now.</p>
        )}
      </Card>
    </div>
  );
};
