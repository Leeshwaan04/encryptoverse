import { Calculator, Coins, Flame, Newspaper, Rocket, Star, TrendingUp } from 'lucide-react';

/** Lives outside the component file so Fast Refresh keeps working. */
export const NAV_TABS = [
  { id: 'markets', label: 'Cryptocurrencies', short: 'Coins', icon: TrendingUp, tone: '' },
  { id: 'icodrops', label: 'ICO Drops', short: 'ICOs', icon: Rocket, tone: 'text-amber-400' },
  { id: 'trending', label: 'Trending', short: 'Trending', icon: Flame, tone: 'text-rose-400' },
  { id: 'defi', label: 'DeFi', short: 'DeFi', icon: Coins, tone: 'text-emerald-400' },
  { id: 'watchlist', label: 'Watchlist', short: 'Watch', icon: Star, tone: 'text-yellow-400' },
  { id: 'news', label: 'News', short: 'News', icon: Newspaper, tone: 'text-cyan-400' },
  { id: 'converter', label: 'Converter', short: 'Convert', icon: Calculator, tone: 'text-indigo-400' },
] as const;

export type TabId = (typeof NAV_TABS)[number]['id'];
