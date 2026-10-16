import { useState, useEffect, useCallback } from 'react';
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
import { WalletModal } from './components/WalletModal';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { InfoPage } from './pages/InfoPage';
import { pageForPath } from './pages/InfoPages';
import { cryptoTokens, globalMarketStats, type CryptoToken } from './data/cryptoData';
import {
  fetchLiveCryptoTokens,
  fetchLiveGlobalStats,
  withTopCoinVolume,
  type LiveMarketResult,
  type GlobalStatsResult,
} from './services/cryptoApi';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('markets');
  // Lightweight path router for the static info pages (About, Methodology, Privacy, ...)
  const [path, setPath] = useState<string>(() => window.location.pathname);
  const infoPage = pageForPath(path);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const navigate = useCallback((to: string) => {
    if (window.location.pathname !== to) window.history.pushState({}, '', to);
    setPath(to);
    window.scrollTo({ top: 0 });
  }, []);
  const selectTab = useCallback(
    (id: string) => {
      setActiveTab(id);
      if (window.location.pathname !== '/') navigate('/');
    },
    [navigate],
  );
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedToken, setSelectedToken] = useState<CryptoToken | null>(null);

  // Live Market & Global Data State
  const [tokens, setTokens] = useState<CryptoToken[]>(cryptoTokens);
  const [marketStats, setMarketStats] = useState<typeof globalMarketStats>(globalMarketStats);
  const [isLiveFeed, setIsLiveFeed] = useState<boolean>(false);
  const [isCachedFeed, setIsCachedFeed] = useState<boolean>(false);
  const [isLoadingFeed, setIsLoadingFeed] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(() => new Date());

  // Web3 Wallet Modal & State
  const [isWalletModalOpen, setIsWalletModalOpen] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [walletNetwork, setWalletNetwork] = useState<string>('Ethereum Mainnet');

  // Watchlist stored in localStorage
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('encryptoverse_watchlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const loadMarketData = useCallback(async (currency: string) => {
    setIsLoadingFeed(true);
    try {
      const [tokenRes, statsRes]: [LiveMarketResult, GlobalStatsResult] = await Promise.all([
        fetchLiveCryptoTokens(currency),
        fetchLiveGlobalStats(),
      ]);

      if (tokenRes.tokens && tokenRes.tokens.length > 0) {
        setTokens(tokenRes.tokens);
      }
      if (statsRes.stats) {
        setMarketStats(tokenRes.isLive ? withTopCoinVolume(statsRes.stats, tokenRes.tokens) : statsRes.stats);
      }
      setIsLiveFeed(tokenRes.isLive);
      setIsCachedFeed(tokenRes.isCached);
      setLastUpdated(tokenRes.lastUpdated);
    } catch {
      // Offline fallback already handled in service
    } finally {
      setIsLoadingFeed(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      setIsLoadingFeed(true);
      try {
        const [tokenRes, statsRes]: [LiveMarketResult, GlobalStatsResult] = await Promise.all([
          fetchLiveCryptoTokens(selectedCurrency),
          fetchLiveGlobalStats(),
        ]);
        if (!ignore) {
          if (tokenRes.tokens && tokenRes.tokens.length > 0) {
            setTokens(tokenRes.tokens);
          }
          if (statsRes.stats) {
            setMarketStats(tokenRes.isLive ? withTopCoinVolume(statsRes.stats, tokenRes.tokens) : statsRes.stats);
          }
          setIsLiveFeed(tokenRes.isLive);
          setIsCachedFeed(tokenRes.isCached);
          setLastUpdated(tokenRes.lastUpdated);
        }
      } catch {
        // Fallback handled in service
      } finally {
        if (!ignore) {
          setIsLoadingFeed(false);
        }
      }
    };
    run();
    return () => {
      ignore = true;
    };
  }, [selectedCurrency]);

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

  // Search filtering
  const displayedTokens = tokens.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.symbol.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden w-full max-w-full">
      {/* 1. CoinMarketCap/CoinGecko Top Ticker Bar */}
      <GlobalMarketHeader
        selectedCurrency={selectedCurrency}
        onCurrencyChange={setSelectedCurrency}
        stats={marketStats}
        isLive={isLiveFeed}
        isCached={isCachedFeed}
        isLoading={isLoadingFeed}
        onRefresh={() => loadMarketData(selectedCurrency)}
        lastUpdated={lastUpdated}
      />

      {/* 2. Main Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={selectTab}
        watchlistCount={watchlist.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onConnectWallet={() => setIsWalletModalOpen(true)}
        walletAddress={walletAddress}
        network={walletNetwork}
      />

      {!isLiveFeed && !isLoadingFeed && (
        <div role="status" className="bg-amber-500/10 border-b border-amber-500/30 text-amber-200 text-[11px] font-mono px-4 py-2 text-center">
          Live market data is temporarily unavailable. The figures below are an illustrative snapshot, not current prices — please do not use them for trading decisions.
        </div>
      )}

      {!infoPage && activeTab === 'markets' && (
        <Hero
          tokens={tokens}
          stats={marketStats}
          currency={selectedCurrency}
          isLive={isLiveFeed}
          onSelectToken={setSelectedToken}
          onOpenConverter={() => selectTab('converter')}
        />
      )}

      {/* 3. Main Content Router */}
      {infoPage && (
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 min-w-0">
          <InfoPage page={infoPage} onNavigate={navigate} />
        </main>
      )}
      <main hidden={Boolean(infoPage)} className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-8 min-w-0">
        {/* View: Markets (Default Home) */}
        {activeTab === 'markets' && (
          <div className="space-y-6">
            <div id="markets" className="scroll-mt-24" />
            {/* Highlights row */}
            <MarketHighlights
              tokens={tokens}
              stats={marketStats}
              onSelectToken={(tokenId) => {
                const found = tokens.find((t) => t.id === tokenId);
                if (found) setSelectedToken(found);
              }}
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
          <TrendingMoversView tokens={tokens} onSelectToken={setSelectedToken} />
        )}

        {/* View: Watchlist & Portfolio */}
        {activeTab === 'watchlist' && (
          <PortfolioWatchlist
            watchlist={watchlist}
            tokens={tokens}
            onToggleWatchlist={handleToggleWatchlist}
            onSelectToken={setSelectedToken}
          />
        )}

        {/* View: CoinDesk News */}
        {activeTab === 'news' && <CoinDeskNews />}

        {/* View: Converter */}
        {activeTab === 'converter' && <CryptoConverter tokens={tokens} />}
      </main>

      {/* In-Depth Token Modal (CoinGecko / CoinDesk style) */}
      {selectedToken && (
        <TokenDetailModal
          token={selectedToken}
          onClose={() => setSelectedToken(null)}
          isWatchlisted={watchlist.includes(selectedToken.id)}
          onToggleWatchlist={handleToggleWatchlist}
          currency={selectedCurrency}
        />
      )}

      {/* Interactive Web3 Wallet Modal */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        walletAddress={walletAddress}
        onSetWalletAddress={setWalletAddress}
        network={walletNetwork}
        onSetNetwork={setWalletNetwork}
      />

      {/* Footer */}
      <Footer onNavigate={navigate} onSelectTab={selectTab} isLive={isLiveFeed} />
    </div>
  );
}

export default App;
