import React, { useEffect, useState } from 'react';
import { Newspaper, ExternalLink, Clock } from 'lucide-react';
import { cypherSound } from '../lib/crypto-utils';
import { EDGE_PROXY_ENABLED } from '../services/cryptoApi';

interface NewsItem {
  title: string;
  url: string;
  source: string;
  category: string;
  publishedAt: string | null;
  summary: string;
}

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
}

export const CoinDeskNews: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [items, setItems] = useState<NewsItem[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>(EDGE_PROXY_ENABLED ? 'loading' : 'error');
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!EDGE_PROXY_ENABLED) return;
    let ignore = false;
    fetch('/api/news')
      .then((r) => {
        if (!r.ok) throw new Error(`news HTTP ${r.status}`);
        return r.json() as Promise<{ fetchedAt: string; data: { items: NewsItem[] } }>;
      })
      .then((j) => {
        if (ignore) return;
        setItems(j.data.items.filter((n) => typeof n.url === 'string' && n.url.startsWith('https://')));
        setFetchedAt(j.fetchedAt);
        setState('ready');
      })
      .catch(() => {
        if (!ignore) setState('error');
      });
    return () => {
      ignore = true;
    };
  }, []);

  const sources = ['All', ...Array.from(new Set(items.map((n) => n.source)))];
  const filteredNews = items.filter((n) => selectedFilter === 'All' || n.source === selectedFilter);

  return (
    <div className="space-y-5 font-mono text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-cyan-400" />
            <h1 className="text-xs font-bold text-white uppercase tracking-wider">Crypto Market News</h1>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Latest headlines aggregated from CoinDesk and Cointelegraph RSS feeds. Each card links to the original article;
            Encryptoverse does not write or edit this content.
            {fetchedAt && <> Updated {timeAgo(fetchedAt)}.</>}
          </p>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {sources.map((src) => (
            <button
              key={src}
              onClick={() => {
                setSelectedFilter(src);
                cypherSound.playBlip(550, 'sine', 0.03);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap ${
                selectedFilter === src
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {src}
            </button>
          ))}
        </div>
      </div>

      {state === 'loading' && <div className="py-10 text-center text-slate-400">Loading latest headlines…</div>}
      {state === 'error' && (
        <div className="py-10 text-center text-slate-400">
          News feeds are temporarily unavailable. Please try again shortly, or read directly at{' '}
          <a className="text-cyan-400 underline" href="https://www.coindesk.com" target="_blank" rel="noopener noreferrer">
            coindesk.com
          </a>
          .
        </div>
      )}

      {state === 'ready' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNews.map((article) => (
            <a
              key={article.url}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition duration-150 space-y-3 flex flex-col justify-between group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-[10px]">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-bold truncate">
                      {article.category}
                    </span>
                    <span className="text-slate-400 shrink-0">{article.source}</span>
                  </div>
                  <span className="text-slate-400 flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" /> {timeAgo(article.publishedAt)}
                  </span>
                </div>
                <h2 className="text-sm font-bold text-white group-hover:text-cyan-300 transition leading-snug">{article.title}</h2>
                {article.summary && <p className="text-slate-400 text-[11px] leading-relaxed">{article.summary}</p>}
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-cyan-400 font-bold">
                <span>Read on {article.source}</span>
                <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};
