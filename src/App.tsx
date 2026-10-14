import { useState } from 'react';
import { GlobalMarketHeader } from './components/GlobalMarketHeader';
import { Navbar } from './components/Navbar';
import { MarketHighlights } from './components/MarketHighlights';
import { CryptoTable } from './components/CryptoTable';
import { TokenDetailModal } from './components/TokenDetailModal';
import { IcoDropsRadar } from './components/IcoDropsRadar';
import { TrendingMoversView } from './components/TrendingMoversView';
import { CoinDeskNews } from './components/CoinDeskNews';
import { PortfolioWatchlist } from './components/PortfolioWatchlist';
import { CryptoConverter } from './components/CryptoConverter';
import { Footer } from './components/Footer';
import { cryptoTokens, type CryptoToken } from './data/cryptoData';
import { cypherSound } from './lib/crypto-utils';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('markets');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedToken, setSelectedToken] = useState<CryptoToken | null>(null);
  const [walletAddress, setWalletAddress] = useState<string>('');

  // Watchlist stored in localStorage
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('encryptoverse_watchlist');
      return saved ? JSON.parse(saved) : ['bitcoin', 'ethereum', 'solana', 'bittensor'];
    } catch {
      return ['bitcoin', 'ethereum', 'solana', 'bittensor'];
    }
  });

  const handleToggleWatchlist = (tokenId: string) => {
    let next: string[];
    if (watchlist.includes(tokenId)) {
      next = watchlist.filter((id) => id !== tokenId);
    } else {
      next = [...watchlist, tokenId];
    }
    setWatchlist(next);
    try {
      localStorage.setItem('encryptoverse_watchlist', JSON.stringify(next));
    } catch {
      // Storage fallback
    }
  };

  const handleConnectWallet = () => {
    cypherSound.playBlip(750, 'triangle');
    if (!walletAddress) {
      const mockAddr = '0x' + Array.from(window.crypto.getRandomValues(new Uint8Array(20)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      setWalletAddress(mockAddr.slice(0, 6) + '...' + mockAddr.slice(-4));
    } else {
      setWalletAddress('');
    }
  };

  // Search filtering
  const displayedTokens = cryptoTokens.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.symbol.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 1. CoinMarketCap/CoinGecko Top Ticker Bar */}
      <GlobalMarketHeader
        selectedCurrency={selectedCurrency}
        onCurrencyChange={setSelectedCurrency}
      />

      {/* 2. Main Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        watchlistCount={watchlist.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onConnectWallet={handleConnectWallet}
        walletAddress={walletAddress}
      />

      {/* 3. Main Content Router */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* View: Markets (Default Home) */}
        {activeTab === 'markets' && (
          <div className="space-y-6">
            {/* Highlights row */}
            <MarketHighlights
              onSelectToken={(tokenId) => {
                const found = cryptoTokens.find((t) => t.id === tokenId);
                if (found) setSelectedToken(found);
              }}
              onSelectIco={() => setActiveTab('icodrops')}
            />

            {/* Cryptocurrencies Table */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h1 className="text-xl font-extrabold text-white">
                    Top Cryptocurrency Prices by Market Cap
                  </h1>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                    Live market data, 24h trading volume, circulating supply, and 7-day sparklines.
                  </p>
                </div>
              </div>

              <CryptoTable
                tokens={displayedTokens}
                watchlist={watchlist}
                onToggleWatchlist={handleToggleWatchlist}
                onSelectToken={setSelectedToken}
              />
            </div>
          </div>
        )}

        {/* View: ICO Drops & Launchpad */}
        {activeTab === 'icodrops' && <IcoDropsRadar />}

        {/* View: Trending & Movers */}
        {activeTab === 'trending' && (
          <TrendingMoversView onSelectToken={setSelectedToken} />
        )}

        {/* View: Watchlist & Portfolio */}
        {activeTab === 'watchlist' && (
          <PortfolioWatchlist
            watchlist={watchlist}
            tokens={cryptoTokens}
            onToggleWatchlist={handleToggleWatchlist}
            onSelectToken={setSelectedToken}
          />
        )}

        {/* View: CoinDesk News */}
        {activeTab === 'news' && <CoinDeskNews />}

        {/* View: Converter */}
        {activeTab === 'converter' && <CryptoConverter />}
      </main>

      {/* In-Depth Token Modal (CoinGecko / CoinDesk style) */}
      {selectedToken && (
        <TokenDetailModal
          token={selectedToken}
          onClose={() => setSelectedToken(null)}
          isWatchlisted={watchlist.includes(selectedToken.id)}
          onToggleWatchlist={handleToggleWatchlist}
        />
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
