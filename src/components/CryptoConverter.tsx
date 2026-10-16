import React, { useState } from 'react';
import { ArrowDownUp, Calculator } from 'lucide-react';
import { cryptoTokens, type CryptoToken } from '../data/cryptoData';
import { cypherSound, formatAmount, formatPrice, type Currency } from '../lib/crypto-utils';

interface CryptoConverterProps {
  tokens: CryptoToken[];
  currency: Currency;
  isLive: boolean;
}

const SELECT =
  'bg-slate-800 border border-slate-700 text-white font-medium px-3 h-11 rounded-lg cursor-pointer text-sm w-full sm:w-56 shrink-0 focus:outline-none focus:border-cyan-500';

export const CryptoConverter: React.FC<CryptoConverterProps> = ({ tokens, currency, isLive }) => {
  const source = tokens.length > 0 ? tokens : cryptoTokens;
  const [amount, setAmount] = useState('1');
  const [fromId, setFromId] = useState('bitcoin');
  const [toId, setToId] = useState('ethereum');

  const from = source.find((t) => t.id === fromId) ?? source[0];
  const to = source.find((t) => t.id === toId) ?? source[1] ?? source[0];

  const parsed = Math.max(0, Number(amount) || 0);
  const fiatValue = parsed * from.price;
  // Guard the division: a zero or missing price would otherwise produce Infinity.
  const converted = to.price > 0 ? fiatValue / to.price : 0;
  const rate = to.price > 0 ? from.price / to.price : 0;

  const swap = () => {
    setFromId(to.id);
    setToId(from.id);
    cypherSound.playBlip(650, 'triangle');
  };

  const options = source.map((t) => (
    <option key={t.id} value={t.id}>
      {t.name} ({t.symbol})
    </option>
  ));

  return (
    <div className="max-w-2xl mx-auto p-5 sm:p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-lg font-bold text-white">
          <Calculator className="w-5 h-5 text-cyan-400" aria-hidden="true" />
          Converter
        </h1>
        {/* Must reflect the real feed state: claiming "live" on stale data is a lie. */}
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-full border ${
            isLive
              ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10'
              : 'text-amber-300 border-amber-500/30 bg-amber-500/10'
          }`}
        >
          {isLive ? 'Live rates' : 'Sample rates'}
        </span>
      </div>

      <div className="space-y-2">
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
          <div className="flex justify-between gap-2 text-xs text-slate-400">
            <label htmlFor="convert-amount">Amount</label>
            <span className="tabular-nums">
              1 {from.symbol} = {formatPrice(from.price, currency)}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <input
              id="convert-amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-transparent text-2xl font-semibold text-white focus:outline-none tabular-nums"
              placeholder="0"
            />
            <label htmlFor="convert-from" className="sr-only">
              Convert from
            </label>
            <select id="convert-from" value={from.id} onChange={(e) => setFromId(e.target.value)} className={SELECT}>
              {options}
            </select>
          </div>
        </div>

        <div className="flex justify-center -my-1 relative z-10">
          <button
            type="button"
            onClick={swap}
            aria-label="Swap the two currencies"
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white transition"
          >
            <ArrowDownUp className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
          <div className="flex justify-between gap-2 text-xs text-slate-400">
            <span>You get (estimate)</span>
            <span className="tabular-nums">
              1 {to.symbol} = {formatPrice(to.price, currency)}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <output
              htmlFor="convert-amount convert-from convert-to"
              aria-live="polite"
              className="text-2xl font-semibold text-cyan-200 tabular-nums break-all"
            >
              {formatAmount(converted, 8)}
            </output>
            <label htmlFor="convert-to" className="sr-only">
              Convert to
            </label>
            <select id="convert-to" value={to.id} onChange={(e) => setToId(e.target.value)} className={SELECT}>
              {options}
            </select>
          </div>
        </div>
      </div>

      <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 text-sm text-slate-300 flex flex-wrap justify-between gap-2 tabular-nums">
        <span>
          1 {from.symbol} = {formatAmount(rate, 8)} {to.symbol}
        </span>
        <span>
          Total ≈ {formatPrice(fiatValue, currency)}
        </span>
      </div>
    </div>
  );
};
