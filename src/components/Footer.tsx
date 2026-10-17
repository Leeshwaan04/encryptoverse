import React from 'react';
import { ArrowUp, ExternalLink, Layers } from 'lucide-react';
import { DATA_SOURCES, SITE } from '../config/site';
import { tabPath, type TabId } from '../lib/navTabs';

interface FooterProps {
  onNavigate: (to: string) => void;
  onSelectTab: (tabId: TabId) => void;
  isLive: boolean;
}

const GithubIcon = () => (
  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const YEAR = new Date().getFullYear();
const linkCls = 'text-slate-400 hover:text-amber-200 transition-colors';

export const Footer: React.FC<FooterProps> = ({ onNavigate, onSelectTab, isLive }) => {
  const go = (to: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    onNavigate(to);
  };
  const tab = (id: TabId) => (e: React.MouseEvent) => {
    e.preventDefault();
    onSelectTab(id);
  };

  return (
    <footer className="relative isolate mt-20 overflow-hidden border-t border-amber-200/10 bg-[#05060a] font-mono text-xs text-slate-400">
      {/* Decorative golden orb backdrop */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <img
          src="/media/footer-orb.jpg"
          alt=""
          loading="lazy"
          className="absolute right-[-12%] bottom-[-18%] w-[95%] max-w-[1100px] object-contain opacity-[0.28] lg:right-[-4%] lg:w-[62%] [mask-image:radial-gradient(closest-side,black_55%,transparent_100%)]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#05060a] via-[#05060a]/85 to-[#05060a]/20" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10 space-y-12">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-x-6 gap-y-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-2 space-y-4">
            <a href="/" onClick={go('/')} className="inline-flex items-center gap-2.5 group">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-300/90 to-amber-600 shadow-lg shadow-amber-500/20">
                <Layers className="h-4 w-4 text-[#05060a]" />
              </span>
              <span className="text-base font-extrabold tracking-wider text-white">ENCRYPTOVERSE</span>
            </a>
            <p className="max-w-sm leading-relaxed text-slate-400">
              An independent, read-only dashboard for cryptocurrency market data. Named sources, documented methods and no paid placements.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/15 bg-white/[0.03] px-3 py-1.5 text-[11px] text-slate-300 backdrop-blur">
              <span className={`h-1.5 w-1.5 rounded-full ${isLive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              {isLive ? 'Live market feed operational' : 'Live feed currently unavailable'}
            </div>
            <div>
              <a href={SITE.github} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1.5 ${linkCls}`}>
                <GithubIcon /> Open source on GitHub
              </a>
            </div>
          </div>

          {/* Markets */}
          <nav aria-label="Markets" className="space-y-3">
            <h2 className="font-bold uppercase tracking-wider text-[11px] text-amber-100">Markets</h2>
            <ul className="space-y-2">
              {([
                ['markets', 'Cryptocurrencies'],
                ['trending', 'Gainers & losers'],
                ['defi', 'DeFi'],
                ['icodrops', 'ICOs & token sales'],
                ['news', 'News'],
                ['converter', 'Converter'],
                ['watchlist', 'Watchlist'],
              ] as const).map(([id, label]) => (
                <li key={id}>
                  <a href={tabPath(id)} onClick={tab(id)} className={linkCls}>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Company */}
          <nav aria-label="About" className="space-y-3">
            <h2 className="font-bold uppercase tracking-wider text-[11px] text-amber-100">About</h2>
            <ul className="space-y-2">
              <li><a href="/about" onClick={go('/about')} className={linkCls}>About us</a></li>
              <li><a href="/methodology" onClick={go('/methodology')} className={linkCls}>Methodology</a></li>
              <li><a href="/contact" onClick={go('/contact')} className={linkCls}>Contact &amp; corrections</a></li>
            </ul>
          </nav>

          {/* Legal */}
          <nav aria-label="Legal" className="space-y-3">
            <h2 className="font-bold uppercase tracking-wider text-[11px] text-amber-100">Legal</h2>
            <ul className="space-y-2">
              <li><a href="/privacy" onClick={go('/privacy')} className={linkCls}>Privacy</a></li>
              <li><a href="/terms" onClick={go('/terms')} className={linkCls}>Terms</a></li>
              <li><a href="/risk-disclosure" onClick={go('/risk-disclosure')} className={linkCls}>Risk disclosure</a></li>
            </ul>
          </nav>

          {/* Data sources */}
          <div className="space-y-3">
            <h2 className="font-bold uppercase tracking-wider text-[11px] text-amber-100">Data by</h2>
            <ul className="space-y-2">
              {DATA_SOURCES.filter((s) => s.primary).map((s) => (
                <li key={s.name}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 ${linkCls}`}>
                    {s.name} <ExternalLink className="h-3 w-3 opacity-60" />
                  </a>
                </li>
              ))}
              <li>
                <a href="/methodology" onClick={go('/methodology')} className={`${linkCls} underline underline-offset-2`}>
                  All sources
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer & copyright */}
        <div className="space-y-4 border-t border-white/10 pt-6 text-[11px] leading-relaxed text-slate-400">
          <p>
            <strong className="text-slate-300">Risk warning:</strong> cryptoassets are highly volatile and you can lose all of the money you put in.
            Encryptoverse provides information only — not financial, investment, tax or legal advice. Data is sourced from third parties, may be
            delayed by up to a minute and may contain errors. See the{' '}
            <a href="/risk-disclosure" onClick={go('/risk-disclosure')} className="underline hover:text-amber-200">full risk disclosure</a>.
          </p>
          <div className="flex flex-col-reverse items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>© {YEAR} {SITE.operator || SITE.name}. All rights reserved. Third-party names and logos belong to their owners.</div>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200/20 bg-white/[0.03] px-3 py-1.5 text-slate-300 transition hover:border-amber-200/50 hover:text-amber-100"
            >
              <ArrowUp className="h-3.5 w-3.5" /> Back to top
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
