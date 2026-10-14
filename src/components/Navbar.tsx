import React, { useState } from 'react';
import {
  TrendingUp,
  Search,
  Star,
  Rocket,
  Newspaper,
  Calculator,
  Wallet,
  Menu,
  X,
  Flame,
  Layers
} from 'lucide-react';
import { cypherSound } from '../lib/crypto-utils';

interface NavbarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  watchlistCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onConnectWallet: () => void;
  walletAddress: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  watchlistCount,
  searchQuery,
  onSearchChange,
  onConnectWallet,
  walletAddress,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const navItems = [
    { id: 'markets', label: 'Cryptocurrencies', icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { id: 'icodrops', label: 'ICO Drops & Launchpad', icon: <Rocket className="w-3.5 h-3.5 text-amber-400" />, badge: 'HOT' },
    { id: 'trending', label: 'Trending & Gainers', icon: <Flame className="w-3.5 h-3.5 text-rose-400" /> },
    { id: 'watchlist', label: 'Watchlist', icon: <Star className="w-3.5 h-3.5 text-yellow-400" />, count: watchlistCount },
    { id: 'news', label: 'CoinDesk News', icon: <Newspaper className="w-3.5 h-3.5 text-cyan-400" /> },
    { id: 'converter', label: 'Converter', icon: <Calculator className="w-3.5 h-3.5 text-indigo-400" /> },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#07090e]/90 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div
          onClick={() => {
            onSelectTab('markets');
            cypherSound.playBlip(520);
          }}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-[1.5px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-400/40 transition">
            <div className="w-full h-full bg-[#07090e] rounded-[10px] flex items-center justify-center">
              <Layers className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition duration-300" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-base bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent font-mono">
                ENCRYPTOVERSE
              </span>
              <span className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                PRO
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-500 -mt-0.5 tracking-tight hidden sm:block">
              Market Intelligence & ICO Launchpad
            </div>
          </div>
        </div>

        {/* Desktop Nav Items */}
        <nav className="hidden lg:flex items-center gap-1 font-mono text-xs">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  cypherSound.playBlip(640, 'sine', 0.04);
                }}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {item.badge}
                  </span>
                )}
                {typeof item.count === 'number' && item.count > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Search Bar & Connect Wallet */}
        <div className="flex items-center gap-2.5">
          {/* Quick Search */}
          <div className="relative hidden sm:block w-44 md:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search coin or ICO..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          {/* Wallet / Portfolio Connect */}
          <button
            onClick={onConnectWallet}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono text-xs font-bold transition shadow-md shadow-cyan-500/20 shrink-0"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>{walletAddress ? walletAddress : 'Connect'}</span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#07090e] border-b border-slate-800 px-4 py-3 space-y-2 font-mono text-xs">
          <div className="relative w-full mb-3">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search coins or ICOs..."
              className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
            />
          </div>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                setMobileMenuOpen(false);
                cypherSound.playBlip(640);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-900 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-amber-500/20 text-amber-300">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
