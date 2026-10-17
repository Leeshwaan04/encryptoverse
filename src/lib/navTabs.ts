import { TAB_ROUTES } from '../config/seo';
import { Calculator, Coins, Flame, Newspaper, Rocket, Star, TrendingUp } from 'lucide-react';

/** Lives outside the component file so Fast Refresh keeps working. */
export const NAV_TABS = [
  { id: 'markets', path: TAB_ROUTES.markets.path, label: 'Cryptocurrencies', short: 'Coins', icon: TrendingUp, tone: '' },
  { id: 'icodrops', path: TAB_ROUTES.icodrops.path, label: 'ICOs & Token Sales', short: 'ICOs', icon: Rocket, tone: 'text-amber-400' },
  { id: 'trending', path: TAB_ROUTES.trending.path, label: 'Trending', short: 'Trending', icon: Flame, tone: 'text-rose-400' },
  { id: 'defi', path: TAB_ROUTES.defi.path, label: 'DeFi', short: 'DeFi', icon: Coins, tone: 'text-emerald-400' },
  { id: 'watchlist', path: TAB_ROUTES.watchlist.path, label: 'Watchlist', short: 'Watch', icon: Star, tone: 'text-yellow-400' },
  { id: 'news', path: TAB_ROUTES.news.path, label: 'News', short: 'News', icon: Newspaper, tone: 'text-cyan-400' },
  { id: 'converter', path: TAB_ROUTES.converter.path, label: 'Converter', short: 'Convert', icon: Calculator, tone: 'text-indigo-400' },
] as const;

/** Path for a tab, e.g. `/defi`. The home page is the Cryptocurrencies tab. */
export const tabPath = (id: TabId): string => NAV_TABS.find((t) => t.id === id)?.path ?? '/';

export type TabId = (typeof NAV_TABS)[number]['id'];
