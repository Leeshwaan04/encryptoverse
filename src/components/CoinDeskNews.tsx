import React, { useState } from 'react';
import { ExternalLink, Info, Newspaper } from 'lucide-react';
import { marketNews } from '../data/cryptoData';
import { cypherSound } from '../lib/crypto-utils';

const CATEGORIES = ['All', 'Bitcoin', 'Markets', 'Regulation', 'AI'];

const sentimentClass = (s: string) =>
  s === 'Bullish'
    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
    : s === 'Bearish'
      ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
      : 'bg-slate-800 text-slate-300 border-slate-700';

export const CoinDeskNews: React.FC = () => {
  const [filter, setFilter] = useState('All');
  const articles = marketNews.filter((n) => filter === 'All' || n.category === filter);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl sm:text-2xl font-bold tracking-tight text-white">
            <Newspaper className="w-5 h-5 text-cyan-400" aria-hidden="true" />
            Market news
          </h1>
          <p className="text-sm text-slate-400 mt-1">Headlines by theme, linking out to each publisher.</p>
        </div>

        <div role="group" aria-label="Filter news by category" className="flex items-center gap-2 overflow-x-auto no-scrollbar text-sm">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              aria-pressed={filter === cat}
              onClick={() => {
                setFilter(cat);
                cypherSound.playBlip(550, 'sine', 0.03);
              }}
              className={`px-3 py-2 rounded-full whitespace-nowrap transition border ${
                filter === cat
                  ? 'bg-cyan-500/15 text-cyan-200 border-cyan-500/50 font-semibold'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Headlines ship with the bundle rather than coming from a feed, so say so plainly. */}
      <div role="note" className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-slate-300">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" aria-hidden="true" />
        <p>
          These headlines are sample content used to lay out the page, not a live feed. Each card links to the
          publisher for current coverage.
        </p>
      </div>

      {articles.length === 0 ? (
        <div className="p-10 rounded-2xl border border-dashed border-slate-700 text-center">
          <p className="text-slate-100 font-semibold">No stories in {filter}</p>
          <button type="button" onClick={() => setFilter('All')} className="text-sm text-cyan-300 hover:text-cyan-200 mt-2 min-h-11 px-3">
            Show all categories
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {articles.map((article) => (
            <li key={article.id}>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="h-full p-4 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-600 transition flex flex-col justify-between gap-3 group focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                        {article.category}
                      </span>
                      <span className="text-slate-400">{article.source}</span>
                    </div>
                    <span className={`font-semibold px-2 py-0.5 rounded-full border ${sentimentClass(article.sentiment)}`}>
                      {article.sentiment}
                    </span>
                  </div>

                  <h2 className="text-base font-semibold text-white group-hover:text-cyan-200 transition leading-snug">
                    {article.title}
                  </h2>
                  <p className="text-sm text-slate-400 leading-relaxed">{article.summary}</p>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-sm text-cyan-300 font-medium">
                  <span>Read on {article.source}</span>
                  <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" aria-hidden="true" />
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
