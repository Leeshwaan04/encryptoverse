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
  network?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  watchlistCount,
  searchQuery,
  onSearchChange,
  onConnectWallet,
  walletAddress,
  network,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const navItems = [
    { id: 'markets', label: 'Cryptocurrencies', icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { id: 'icodrops', label: 'ICO Drops & Launchpad', short: 'ICO Drops', icon: <Rocket className="w-3.5 h-3.5 text-amber-400" />, badge: 'HOT' },
    { id: 'trending', label: 'Trending & Gainers', short: 'Trending', icon: <Flame className="w-3.5 h-3.5 text-rose-400" /> },
    { id: 'watchlist', label: 'Watchlist', icon: <Star className="w-3.5 h-3.5 text-yellow-400" />, count: watchlistCount },
    { id: 'news', label: 'CoinDesk News', short: 'News', icon: <Newspaper className="w-3.5 h-3.5 text-cyan-400" /> },
    { id: 'converter', label: 'Converter', icon: <Calculator className="w-3.5 h-3.5 text-indigo-400" /> },
  ];

  const formattedAddress = walletAddress
    ? walletAddress.length > 10
      ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-3)}`
      : walletAddress
    : null;

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#07090e]/95 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo */}
        <div
          onClick={() => {
            onSelectTab('markets');
            cypherSound.playBlip(520);
          }}
          className="flex items-center gap-2 sm:gap-3 cursor-pointer group shrink-0 select-none"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-[1.5px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-400/40 transition">
            <div className="w-full h-full bg-[#07090e] rounded-[10px] flex items-center justify-center">
              <Layers className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition duration-300" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="font-extrabold tracking-wider text-xs sm:text-base bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent font-mono">
                ENCRYPTOVERSE
              </span>
              <span className="hidden sm:inline-block text-[9px] sm:text-[10px] font-mono px-1 sm:px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                PRO
              </span>
            </div>
            <div className="text-[9px] sm:text-[10px] font-mono text-slate-500 -mt-0.5 tracking-tight hidden md:block xl:hidden">
              Market Intelligence & ICO Launchpad
            </div>
          </div>
        </div>

        {/* Desktop Nav Items */}
        <nav className="hidden xl:flex items-center gap-0.5 font-mono text-xs">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  cypherSound.playBlip(640, 'sine', 0.04);
                }}
                className={`px-2 py-1.5 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                {item.icon}
                <span>{item.short ?? item.label}</span>
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

        {/* Search Bar & Connect Wallet & Hamburger */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Quick Search on Tablets & Desktops */}
          <div className="relative hidden sm:block w-36 md:w-48 xl:w-40">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search coin..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 font-mono text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/60 transition"
            />
          </div>

          {/* Wallet / Portfolio Connect */}
          <button
            onClick={onConnectWallet}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition shadow-md shrink-0 border ${
              formattedAddress
                ? 'bg-slate-900/90 hover:bg-slate-800 text-cyan-300 border-cyan-500/40 shadow-cyan-500/10'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-transparent shadow-cyan-500/20'
            }`}
          >
            {formattedAddress ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="font-mono text-[11px] sm:text-xs">{formattedAddress}</span>
                {network && (
                  <span className="hidden xl:inline text-[9px] font-normal px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-200">
                    {network.split(' ')[0]}
                  </span>
                )}
              </>
            ) : (
              <>
                <Wallet className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden xs:inline">Connect</span>
                <span className="xs:hidden">Wallet</span>
              </>
            )}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            className="xl:hidden p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-[#07090e]/98 border-b border-slate-800 px-4 py-3 space-y-2 font-mono text-xs max-h-[85vh] overflow-y-auto">
          <div className="relative w-full mb-3">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search coins or launchpads..."
              className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
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
              className={`w-full text-left px-3 py-2.5 rounded-lg transition flex items-center justify-between ${
                activeTab === item.id
                  ? 'bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/30'
                  : 'text-slate-300 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {item.icon}
                <span className="text-xs">{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
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
