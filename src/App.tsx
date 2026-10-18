import { useCallback, useEffect, useRef, useState } from 'react';
import { GlobalMarketHeader } from './components/GlobalMarketHeader';
import { Navbar } from './components/Navbar';
import { NAV_TABS, tabPath, type TabId } from './lib/navTabs';
import { COIN_ID_RE, ROUTE_TABLE, TAB_ROUTES, coinIdFromPath, coinMeta, coinPath } from './config/seo';
import { applyRouteMeta } from './lib/routeMeta';
import { MarketHighlights } from './components/MarketHighlights';
import { CryptoTable } from './components/CryptoTable';
import { TokenDetailModal } from './components/TokenDetailModal';
import { TokenSalesGuide } from './components/TokenSalesGuide';
import { TrendingMoversView } from './components/TrendingMoversView';
import { CoinDeskNews } from './components/CoinDeskNews';
import { DefiView } from './components/DefiView';
import { PortfolioWatchlist } from './components/PortfolioWatchlist';
import { CryptoConverter } from './components/CryptoConverter';
import { WalletModal } from './components/WalletModal';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { InfoPage } from './pages/InfoPage';
import { pageForPath } from './pages/InfoPages';
import { DataPage } from './pages/DataPages';
import { parsePagePath } from './shared/pages';
import { cryptoTokens, globalMarketStats, type CryptoToken } from './data/cryptoData';
import {
  fetchFearGreed,
  fetchGasGwei,
  fetchLiveCryptoTokens,
  fetchLiveGlobalStats,
  type FearGreedResult,
} from './services/cryptoApi';
import {
  CURRENCIES,
  isStringArray,
  formatCompact,
  formatPercentage,
  formatPrice,
  readStorage,
  writeStorage,
  type Currency,
} from './lib/crypto-utils';

const AUTO_REFRESH_MS = 120_000;
const DEFAULT_WATCHLIST = ['bitcoin', 'ethereum', 'solana'];

interface ViewState {
  /** null on a /coin/<id> URL: the coin opens over whichever tab the visitor came from. */
  tab: TabId | null;
  coin: string | null;
  currency: Currency;
}

/** View state lives in the URL so reload, Back/Forward and sharing all work: the tab is the path, the rest is the query. */
function readUrl(): ViewState {
  const p = new URLSearchParams(window.location.search);
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
  // Old links used `/?tab=defi`; they still resolve and are rewritten to `/defi`.
  const legacy = p.get('tab');
  const legacyTab = NAV_TABS.find((t) => t.id === legacy)?.id;
  const coinFromPath = coinIdFromPath(pathname);
  const tab = coinFromPath ? null : (pathname === '/' && legacyTab) || NAV_TABS.find((t) => t.path === pathname)?.id || 'markets';
  const cur = p.get('cur')?.toUpperCase();
  const legacyCoin = p.get('coin');
  return {
    tab,
    coin: coinFromPath ?? (legacyCoin && COIN_ID_RE.test(legacyCoin) ? legacyCoin : null),
    currency: (CURRENCIES.includes(cur as Currency) ? cur : 'USD') as Currency,
  };
}

function writeUrl(state: ViewState & { tab: TabId }, push: boolean): void {
  const p = new URLSearchParams();
  if (state.currency !== 'USD') p.set('cur', state.currency);
  const qs = p.toString();
  const next = `${state.coin ? coinPath(state.coin) : tabPath(state.tab)}${qs ? `?${qs}` : ''}`;
  if (next === `${window.location.pathname}${window.location.search}`) return;
  if (push) window.history.pushState(null, '', next);
  else window.history.replaceState(null, '', next);
}

function App() {
  const [activeTab, setActiveTab] = useState<TabId>(() => readUrl().tab ?? 'markets');
  const [currency, setCurrency] = useState<Currency>(() => readUrl().currency);
  const [selectedCoinId, setSelectedCoinId] = useState<string | null>(() => readUrl().coin);
  const [searchQuery, setSearchQuery] = useState('');
  // A URL the server answered with 404 (unknown path): the app shows the markets view but must stay out of search results.
  const [landedOnUnknown] = useState(() => {
    const p = window.location.pathname.replace(/\/+$/, '') || '/';
    return !(p in ROUTE_TABLE) && !parsePagePath(p);
  });
  // True while the coin modal was opened by an in-app push, so closing it can pop that entry instead of stacking another.
  const modalPushed = useRef(false);

  const [tokens, setTokens] = useState<CryptoToken[]>(cryptoTokens);
  const [marketStats, setMarketStats] = useState<typeof globalMarketStats>(globalMarketStats);
  const [fearGreed, setFearGreed] = useState<FearGreedResult | null>(null);
  const [gasGwei, setGasGwei] = useState<number | null>(null);
  const [dataSource, setDataSource] = useState('CoinGecko');
  // Static info pages (About, Methodology, ...) live at their own paths; the app itself stays on "/".
  const [path, setPath] = useState(() => window.location.pathname);
  const infoPage = pageForPath(path);
  const [isLive, setIsLive] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [feedError, setFeedError] = useState<string | undefined>();
  const [lastUpdated, setLastUpdated] = useState<Date>(() => new Date());

  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletNetwork, setWalletNetwork] = useState('Ethereum Mainnet');

  const [watchlist, setWatchlist] = useState<string[]>(() =>
    readStorage('encryptoverse_watchlist', DEFAULT_WATCHLIST, isStringArray)
  );

  // Rapid currency switches would otherwise let a slow earlier response
  // overwrite a newer one, showing prices in the wrong denomination.
  const requestId = useRef(0);

  const load = useCallback(async (cur: Currency, force = false) => {
    const id = ++requestId.current;
    setIsLoading(true);
    const [tokenRes, statsRes] = await Promise.all([
      fetchLiveCryptoTokens(cur, { force }),
      fetchLiveGlobalStats(),
    ]);
    if (id !== requestId.current) return;
    if (tokenRes.tokens.length > 0) setTokens(tokenRes.tokens);
    setMarketStats(statsRes.stats);
    setIsLive(tokenRes.isLive);
    setIsCached(tokenRes.isCached);
    setFeedError(tokenRes.error);
    setLastUpdated(tokenRes.lastUpdated);
    if (tokenRes.source) setDataSource(tokenRes.source);
    setIsLoading(false);
    void fetchGasGwei().then(setGasGwei);
  }, []);

  useEffect(() => {
    void load(currency);
    const timer = window.setInterval(() => {
      // Don't burn rate limit on a tab nobody is looking at.
      if (document.visibilityState === 'visible') void load(currency);
    }, AUTO_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [currency, load]);

  useEffect(() => {
    void fetchFearGreed().then(setFearGreed);
  }, []);

  // Programmatic pages (/coin/<any coin>, /defi/protocol/<slug>, /convert/..., hubs) render as standalone pages.
  // A top-50 coin keeps its modal over the markets table; every other coin is a standalone page.
  const parsedRoute = infoPage ? null : parsePagePath(path.replace(/\/+$/, '') || '/');
  const pageRoute = parsedRoute && !(parsedRoute.kind === 'coin' && tokens.some((t) => t.id === parsedRoute.slug)) ? parsedRoute : null;
  const standalone = Boolean(infoPage || pageRoute);

  // A coin id that is not in the live top-50 list has nothing to show, so the URL falls back to the tab.
  const knownCoinId = selectedCoinId && (!isLive || tokens.some((t) => t.id === selectedCoinId)) ? selectedCoinId : null;

  useEffect(() => {
    if (!standalone) writeUrl({ tab: activeTab, coin: knownCoinId, currency }, false);
  }, [activeTab, knownCoinId, currency, standalone]);

  useEffect(() => {
    if (standalone) return;
    const coin = knownCoinId ? tokens.find((t) => t.id === knownCoinId) : undefined;
    applyRouteMeta(
      coin
        ? coinMeta({
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol,
            rank: coin.rank,
            ...(isLive ? { price: formatPrice(coin.price, currency), marketCap: formatCompact(coin.marketCap, currency), change24h: formatPercentage(coin.change24h) } : {}),
          })
        : landedOnUnknown
          ? { ...TAB_ROUTES[activeTab], noindex: true }
          : TAB_ROUTES[activeTab],
    );
  }, [activeTab, standalone, knownCoinId, tokens, isLive, currency, landedOnUnknown]);

  useEffect(() => {
    const onPop = () => {
      modalPushed.current = false;
      setPath(window.location.pathname);
      const s = readUrl();
      setActiveTab((prev) => s.tab ?? prev);
      setSelectedCoinId(s.coin);
      setCurrency(s.currency);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  /** Open one of the static info pages. */
  const navigateInfo = (to: string) => {
    const target = parsePagePath(to.split('?')[0]);
    if (target?.kind === 'coin' && tokens.some((t) => t.id === target.slug)) {
      // A top-50 coin opens its modal over the markets view.
      window.history.pushState(null, '', to);
      setPath(to);
      setActiveTab('markets');
      setSelectedCoinId(target.slug);
      modalPushed.current = true;
      window.scrollTo({ top: 0 });
      return;
    }
    window.history.pushState(null, '', to);
    setPath(to);
    setSelectedCoinId(null);
    window.scrollTo({ top: 0 });
  };

  const selectTab = (tab: TabId) => {
    if (standalone) {
      // Leaving an info or data page: go back to the app on the chosen tab.
      window.history.pushState(null, '', tabPath(tab));
      setPath(tabPath(tab));
      setActiveTab(tab);
      setSelectedCoinId(null);
      window.scrollTo({ top: 0 });
      return;
    }
    if (tab === activeTab) return;
    writeUrl({ tab, coin: null, currency }, true);
    setActiveTab(tab);
    setSelectedCoinId(null);
    window.scrollTo({ top: 0 });
  };

  const openToken = (token: CryptoToken) => {
    writeUrl({ tab: activeTab, coin: token.id, currency }, true);
    modalPushed.current = true;
    setSelectedCoinId(token.id);
  };

  const closeToken = () => {
    setSelectedCoinId(null);
    if (modalPushed.current) {
      // Pop the entry that opened the modal, so Back does not reopen it.
      modalPushed.current = false;
      window.history.back();
    } else {
      writeUrl({ tab: activeTab, coin: null, currency }, false);
    }
  };

  // Search filters the market table, so typing anywhere brings that table into view.
  const onSearchChange = (q: string) => {
    setSearchQuery(q);
    if (q && activeTab !== 'markets') selectTab('markets');
  };

  const toggleWatchlist = (tokenId: string) => {
    setWatchlist((prev) => {
      const next = prev.includes(tokenId) ? prev.filter((id) => id !== tokenId) : [...prev, tokenId];
      writeStorage('encryptoverse_watchlist', next);
      return next;
    });
  };

  const selectedToken = selectedCoinId ? (tokens.find((t) => t.id === selectedCoinId) ?? null) : null;

  const q = searchQuery.trim().toLowerCase();
  const displayedTokens = q
    ? tokens.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.symbol.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      )
    : tokens;

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-100">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-cyan-400 focus:text-slate-950 focus:font-semibold"
      >
        Skip to content
      </a>

      <GlobalMarketHeader
        currency={currency}
        onCurrencyChange={setCurrency}
        stats={marketStats}
        fearGreed={fearGreed}
        gasGwei={gasGwei}
        isLive={isLive}
        isCached={isCached}
        isLoading={isLoading}
        error={feedError}
        onRefresh={() => void load(currency, true)}
        lastUpdated={lastUpdated}
      />

      <Navbar
        activeTab={activeTab}
        onSelectTab={selectTab}
        watchlistCount={watchlist.length}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        onConnectWallet={() => setIsWalletOpen(true)}
        walletAddress={walletAddress}
        network={walletNetwork}
      />

      {!standalone && activeTab === 'markets' && (
        <Hero
          tokens={tokens}
          stats={marketStats}
          fearGreed={fearGreed}
          currency={currency}
          isLive={isLive}
          source={dataSource}
          onSelectToken={openToken}
          onOpenConverter={() => selectTab('converter')}
          coinOpen={Boolean(selectedToken)}
        />
      )}

      <main id="main" className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {infoPage && <InfoPage page={infoPage} onNavigate={(to) => (to === '/' ? selectTab('markets') : navigateInfo(to))} />}

        {pageRoute && <DataPage route={pageRoute} nav={(to) => (to === '/' ? selectTab('markets') : navigateInfo(to))} />}

        {!standalone && activeTab === 'markets' && (
          <div className="space-y-8">
            <MarketHighlights
              tokens={tokens}
              currency={currency}
              fearGreed={fearGreed}
              onSelectToken={openToken}
              onViewAll={() => selectTab('trending')}
            />

            <section aria-labelledby="markets-heading" className="space-y-4">
              <div>
                <h2 id="markets-heading" className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Cryptocurrency prices by market cap
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  {isLive
                    ? `Top 50 coins in ${currency}, from ${dataSource}. Refreshes every 2 minutes.`
                    : isLoading
                      ? 'Loading live prices…'
                      : 'Live prices are unavailable, so these are bundled sample figures and may be out of date.'}
                </p>
              </div>

              <CryptoTable
                tokens={displayedTokens}
                currency={currency}
                isLoading={isLoading && !isLive}
                searchQuery={searchQuery}
                onClearSearch={() => setSearchQuery('')}
                watchlist={watchlist}
                onToggleWatchlist={toggleWatchlist}
                onSelectToken={openToken}
              />
            </section>
          </div>
        )}

        {!standalone && activeTab === 'icodrops' && <TokenSalesGuide />}

        {!standalone && activeTab === 'trending' && (
          <TrendingMoversView tokens={tokens} currency={currency} onSelectToken={openToken} />
        )}

        {!standalone && activeTab === 'defi' && <DefiView />}

        {!standalone && activeTab === 'watchlist' && (
          <PortfolioWatchlist
            watchlist={watchlist}
            tokens={tokens}
            currency={currency}
            onToggleWatchlist={toggleWatchlist}
            onSelectToken={openToken}
            onBrowseMarkets={() => selectTab('markets')}
          />
        )}

        {!standalone && activeTab === 'news' && <CoinDeskNews />}

        {!standalone && activeTab === 'converter' && (
          <CryptoConverter tokens={tokens} currency={currency} isLive={isLive} />
        )}
      </main>

      {selectedToken && (
        <TokenDetailModal
          token={selectedToken}
          currency={currency}
          isLive={isLive}
          onClose={closeToken}
          isWatchlisted={watchlist.includes(selectedToken.id)}
          asPageHeading={activeTab === 'markets'}
          onToggleWatchlist={toggleWatchlist}
        />
      )}

      {/* Stays mounted while closed so the wallet session and its event listeners survive. */}
      <WalletModal
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        walletAddress={walletAddress}
        onSetWalletAddress={setWalletAddress}
        network={walletNetwork}
        onSetNetwork={setWalletNetwork}
      />

      <Footer onNavigate={navigateInfo} onSelectTab={selectTab} isLive={isLive} />
    </div>
  );
}

export default App;
