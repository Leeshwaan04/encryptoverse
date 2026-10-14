import React, { useState } from 'react';
import {
  Newspaper,
  ExternalLink,
  Clock
} from 'lucide-react';
import { marketNews } from '../data/cryptoData';
import { cypherSound } from '../lib/crypto-utils';

export const CoinDeskNews: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<string>('All');

  const categories = ['All', 'Bitcoin', 'Markets', 'Regulation', 'AI'];

  const filteredNews = marketNews.filter((n) => {
    if (selectedFilter === 'All') return true;
    return n.category === selectedFilter;
  });

  return (
    <div className="space-y-5 font-mono text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              CoinDesk Price & Market Intelligence Wire
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Real-time market insights, ETF flows, on-chain dynamics, and regulatory developments.
          </p>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedFilter(cat);
                cypherSound.playBlip(550, 'sine', 0.03);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                selectedFilter === cat
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* News List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredNews.map((article) => (
          <a
            key={article.id}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition duration-150 space-y-3 flex flex-col justify-between group"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-[10px]">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-bold">
                    {article.category}
                  </span>
                  <span className="text-slate-500">{article.source}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-bold px-1.5 py-0.2 rounded ${
                      article.sentiment === 'Bullish'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : article.sentiment === 'Bearish'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {article.sentiment}
                  </span>
                  <span className="text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {article.timeAgo}
                  </span>
                </div>
              </div>

              <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition leading-snug">
                {article.title}
              </h4>

              <p className="text-slate-400 text-[11px] leading-relaxed">
                {article.summary}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-cyan-400 font-bold">
              <span>Read on {article.source}</span>
              <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};
