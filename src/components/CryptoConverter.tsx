import React, { useState } from 'react';
import {
  ArrowDownUp,
  Calculator
} from 'lucide-react';
import { cryptoTokens } from '../data/cryptoData';
import { cypherSound } from '../lib/crypto-utils';

export const CryptoConverter: React.FC = () => {
  const [amountFrom, setAmountFrom] = useState<string>('1');
  const [tokenFromId, setTokenFromId] = useState<string>('bitcoin');
  const [tokenToId, setTokenToId] = useState<string>('ethereum');

  const tokenFrom = cryptoTokens.find((t) => t.id === tokenFromId) || cryptoTokens[0];
  const tokenTo = cryptoTokens.find((t) => t.id === tokenToId) || cryptoTokens[1];

  const parsedAmount = Math.max(0, parseFloat(amountFrom) || 0);
  const usdValue = parsedAmount * tokenFrom.price;
  const convertedToAmount = tokenTo.price > 0 ? usdValue / tokenTo.price : 0;

  const handleSwapTokens = () => {
    const prevFrom = tokenFromId;
    setTokenFromId(tokenToId);
    setTokenToId(prevFrom);
    cypherSound.playBlip(650, 'triangle');
  };

  return (
    <div className="max-w-2xl mx-auto p-6 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-xl font-mono text-xs space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Real-Time Crypto Converter & Price Calculator
          </h3>
        </div>
        <span className="text-[10px] text-cyan-400 font-bold">Live Rates</span>
      </div>

      <div className="space-y-4">
        {/* From Token */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex justify-between text-slate-400 text-[11px]">
            <span>You Send / Convert:</span>
            <span>Current Price: ${tokenFrom.price.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="0"
              step="any"
              value={amountFrom}
              onChange={(e) => setAmountFrom(e.target.value)}
              className="w-full bg-transparent text-xl font-bold text-white focus:outline-none"
              placeholder="0.0"
            />
            <select
              value={tokenFromId}
              onChange={(e) => setTokenFromId(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white font-bold px-3 py-2 rounded-lg cursor-pointer text-xs"
            >
              {cryptoTokens.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap button */}
        <div className="flex justify-center -my-2 relative z-10">
          <button
            onClick={handleSwapTokens}
            className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg transition duration-200"
            title="Swap tokens"
          >
            <ArrowDownUp className="w-4 h-4" />
          </button>
        </div>

        {/* To Token */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex justify-between text-slate-400 text-[11px]">
            <span>You Receive (Estimated):</span>
            <span>Current Price: ${tokenTo.price.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="text-xl font-extrabold text-cyan-300">
              {convertedToAmount < 0.0001
                ? convertedToAmount.toFixed(8)
                : convertedToAmount.toLocaleString(undefined, { maximumFractionDigits: 6 })}
            </div>
            <select
              value={tokenToId}
              onChange={(e) => setTokenToId(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white font-bold px-3 py-2 rounded-lg cursor-pointer text-xs"
            >
              {cryptoTokens.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary Rate Strip */}
        <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 text-[11px] text-slate-400 flex flex-wrap justify-between items-center gap-2">
          <div>
            1 {tokenFrom.symbol} = {(tokenFrom.price / tokenTo.price).toFixed(6)} {tokenTo.symbol}
          </div>
          <div>Total Value: ≈ ${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</div>
        </div>
      </div>
    </div>
  );
};
