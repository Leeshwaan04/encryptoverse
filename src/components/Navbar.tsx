import React, { useEffect, useRef, useState } from 'react';
import { Layers, Menu, Search, Volume2, VolumeX, Wallet, X } from 'lucide-react';
import { cypherSound } from '../lib/crypto-utils';
import { NAV_TABS, type TabId } from '../lib/navTabs';


interface NavbarProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  watchlistCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onConnectWallet: () => void;
  walletAddress: string;
  network?: string;
}

const SearchField: React.FC<{
  id: string;
  value: string;
  onChange: (v: string) => void;
  inputRef?: React.Ref<HTMLInputElement>;
  className?: string;
}> = ({ id, value, onChange, inputRef, className = '' }) => (
  <div className={`relative ${className}`}>
    <label htmlFor={id} className="sr-only">
      Search coins
    </label>
    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" aria-hidden="true" />
    <input
      id={id}
      ref={inputRef}
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onChange('');
      }}
      placeholder="Search coins"
      autoComplete="off"
      className="w-full pl-9 pr-9 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/70 focus:ring-2 focus:ring-cyan-500/20 transition [&::-webkit-search-cancel-button]:hidden"
    />
    {value ? (
      <button
        type="button"
        onClick={() => onChange('')}
        aria-label="Clear search"
        className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    ) : (
      <kbd className="hidden lg:flex absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 items-center justify-center text-[11px] text-slate-500 border border-slate-700 rounded pointer-events-none">
        /
      </kbd>
    )}
  </div>
);

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(cypherSound.enabled);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable;
      // "/" is the conventional jump-to-search shortcut; never steal it from a dialog.
      if (e.key === '/' && !typing && !document.querySelector('[role=dialog]')) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const shortAddress = walletAddress
    ? walletAddress.length > 12
      ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`
      : walletAddress
    : null;

  const selectTab = (id: TabId) => {
    onSelectTab(id);
    setMenuOpen(false);
    cypherSound.playBlip(640, 'sine', 0.04);
  };

  const toggleSound = () => {
    const next = !soundOn;
    cypherSound.setEnabled(next);
    setSoundOn(next);
    if (next) cypherSound.playBlip(720, 'triangle', 0.05);
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#07090e]/90 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => selectTab('markets')}
          aria-label="Encryptoverse home"
          className="flex items-center gap-2.5 group shrink-0 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
        >
          <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-px shadow-lg shadow-cyan-500/20">
            <span className="w-full h-full bg-[#07090e] rounded-[11px] flex items-center justify-center">
              <Layers className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition" aria-hidden="true" />
            </span>
          </span>
          <span className="hidden min-[380px]:block lg:hidden xl:block text-left">
            <span className="block font-bold tracking-tight text-[15px] text-white">Encryptoverse</span>
            <span className="hidden 2xl:block text-[11px] text-slate-400 -mt-0.5">Market intelligence &amp; ICO radar</span>
          </span>
        </button>

        <nav aria-label="Primary" className="hidden lg:flex items-center gap-0.5 text-sm min-w-0">
          {NAV_TABS.map(({ id, label, short, icon: Icon, tone }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => selectTab(id)}
                aria-current={active ? 'page' : undefined}
                className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap ${
                  active ? 'text-white bg-slate-800/80 font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${tone}`} aria-hidden="true" />
                {/* Short label on screen (the 7xl container cannot fit full labels + search); full label for assistive tech. */}
                <span className="sr-only">{label}</span>
                <span aria-hidden="true">{short}</span>
                {id === 'watchlist' && watchlistCount > 0 && (
                  <span className="text-[11px] font-semibold min-w-[1.25rem] px-1.5 rounded-full bg-cyan-500/20 text-cyan-200 tabular-nums">
                    {watchlistCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <SearchField
            id="search-desktop"
            value={searchQuery}
            onChange={onSearchChange}
            inputRef={searchRef}
            className="hidden sm:block w-40 md:w-48 lg:w-36 xl:w-56"
          />

          <button
            type="button"
            onClick={toggleSound}
            aria-label={soundOn ? 'Mute interface sounds' : 'Enable interface sounds'}
            aria-pressed={soundOn}
            className="hidden sm:flex lg:hidden xl:flex w-10 h-10 items-center justify-center rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onConnectWallet}
            className={`flex items-center gap-2 px-3 h-10 rounded-lg text-sm font-semibold transition border ${
              shortAddress
                ? 'bg-slate-900 hover:bg-slate-800 text-cyan-200 border-cyan-500/40'
                : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 border-transparent'
            }`}
          >
            {shortAddress ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" aria-hidden="true" />
                <span className="font-mono text-xs">{shortAddress}</span>
                {network && (
                  <span className="hidden xl:inline text-[11px] font-normal px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-100">
                    {network.split(' ')[0]}
                  </span>
                )}
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Connect</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Search stays on screen at phone widths rather than hiding behind the hamburger. */}
      <div className="sm:hidden px-4 pb-3">
        <SearchField id="search-mobile" value={searchQuery} onChange={onSearchChange} />
      </div>

      {menuOpen && (
        <nav
          id="mobile-nav"
          aria-label="Primary"
          className="lg:hidden border-t border-slate-800 bg-[#07090e] px-4 py-3 grid grid-cols-2 gap-2 text-sm max-h-[70dvh] overflow-y-auto"
        >
          {NAV_TABS.map(({ id, label, icon: Icon, tone }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => selectTab(id)}
                aria-current={active ? 'page' : undefined}
                className={`text-left px-3 py-3 rounded-xl transition flex items-center gap-2.5 border ${
                  active
                    ? 'bg-cyan-500/10 text-cyan-200 font-semibold border-cyan-500/40'
                    : 'text-slate-300 border-slate-800 hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${tone}`} aria-hidden="true" />
                <span className="truncate">{label}</span>
                {id === 'watchlist' && watchlistCount > 0 && (
                  <span className="ml-auto text-[11px] px-1.5 rounded-full bg-cyan-500/20 text-cyan-200 tabular-nums">
                    {watchlistCount}
                  </span>
                )}
              </button>
            );
          })}
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={soundOn}
            className="col-span-2 text-left px-3 py-3 rounded-xl border border-slate-800 text-slate-300 flex items-center gap-2.5"
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            Interface sounds: {soundOn ? 'On' : 'Off'}
          </button>
        </nav>
      )}
    </header>
  );
};
