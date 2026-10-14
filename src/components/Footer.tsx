import React from 'react';
import { Layers } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-20 border-t border-slate-800 bg-[#05070b] font-mono text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand Info (2 cols) */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center">
                <Layers className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-white text-base">ENCRYPTOVERSE</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              The premier all-in-one crypto market intelligence, price analytics, and verified ICO/IDO launchpad radar.
            </p>
            <div className="text-[11px] text-slate-500">
              Inspired by the depth of CoinMarketCap, CoinGecko, CoinDesk Price, and ICO Drops.
            </div>
          </div>

          {/* Products */}
          <div className="space-y-2">
            <div className="text-white font-bold uppercase tracking-wider text-[11px]">
              Market Data
            </div>
            <ul className="space-y-1.5 text-slate-400 text-xs">
              <li>Cryptocurrencies (Top 100)</li>
              <li>Market Capitalization</li>
              <li>24h Volume & Liquidity</li>
              <li>Fear & Greed Index</li>
              <li>Gas Price Tracker</li>
            </ul>
          </div>

          {/* ICO Launchpad */}
          <div className="space-y-2">
            <div className="text-white font-bold uppercase tracking-wider text-[11px]">
              ICO Drops Radar
            </div>
            <ul className="space-y-1.5 text-slate-400 text-xs">
              <li>Active Token Presales</li>
              <li>Upcoming Whitelists</li>
              <li>Ended ICOs & Historical ROI</li>
              <li>Multi-Chain IDOs</li>
              <li>Tokenomics & Vesting</li>
            </ul>
          </div>

          {/* Open Source & Links */}
          <div className="space-y-2">
            <div className="text-white font-bold uppercase tracking-wider text-[11px]">
              Ecosystem
            </div>
            <ul className="space-y-1.5 text-slate-400 text-xs">
              <li>
                <a
                  href="https://github.com/Leeshwaan04/encryptoverse"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-400 flex items-center gap-1.5 transition"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  GitHub Repository
                </a>
              </li>
              <li>Portfolio Tracker</li>
              <li>Crypto Price Converter</li>
            </ul>
          </div>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="pt-6 border-t border-slate-800/80 space-y-2 text-[10px] text-slate-500 leading-relaxed">
          <p>
            <strong>Disclaimer:</strong> Content published on Encryptoverse is provided for general informational and educational purposes only. None of the price data, token evaluations, or ICO information constitutes financial, investment, or legal advice. Cryptocurrencies and token presales carry substantial market volatility and risk.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2">
            <div>© 2026 Encryptoverse. All rights reserved.</div>
            <div>Built for the global Web3 community</div>
          </div>
        </div>
      </div>
    </footer>
  );
};
