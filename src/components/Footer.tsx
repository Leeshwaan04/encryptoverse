import React from 'react';
import { Layers } from 'lucide-react';

const YEAR = new Date().getFullYear();

const COLUMNS = [
  {
    title: 'Market data',
    items: ['Top 50 by market cap', 'Market capitalisation', '24h volume', 'Fear & Greed index'],
  },
  {
    title: 'Launchpad radar',
    items: ['Active token sales', 'Upcoming whitelists', 'Completed sales & returns', 'Multi-chain listings'],
  },
];

export const Footer: React.FC = () => (
  <footer className="mt-16 border-t border-slate-800 bg-[#05070b] text-sm text-slate-400">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" aria-hidden="true" />
            </span>
            <span className="font-bold text-white text-base">Encryptoverse</span>
          </div>
          <p className="max-w-sm leading-relaxed">
            Cryptocurrency prices, market analytics, a portfolio tracker and a token launchpad radar, in one place.
          </p>
          <p className="text-xs text-slate-400">
            Price data from CoinGecko. Fear &amp; Greed index from alternative.me. Token sale listings and news
            headlines are sample content.
          </p>
        </div>

        {COLUMNS.map(({ title, items }) => (
          <nav key={title} aria-label={title} className="space-y-2">
            <h2 className="text-white font-semibold text-xs uppercase tracking-wider">{title}</h2>
            <ul className="space-y-1.5">
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="pt-6 border-t border-slate-800/80 space-y-3 text-xs text-slate-400 leading-relaxed">
        <p>
          <strong className="text-slate-400">Not financial advice.</strong> Everything here is for general information
          only. Prices, token valuations and sale listings are not investment, financial or legal advice.
          Cryptocurrencies and token sales carry substantial risk, including total loss.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2">
          <p>© {YEAR} Encryptoverse</p>
          <a
            href="https://github.com/Leeshwaan04/encryptoverse"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-cyan-300 transition"
          >
            Source on GitHub
          </a>
        </div>
      </div>
    </div>
  </footer>
);
