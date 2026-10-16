import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowDown, Calculator } from 'lucide-react';
import type { CryptoToken, GlobalStats } from '../data/cryptoData';
import type { FearGreedResult } from '../services/cryptoApi';
import { changeColor, cypherSound, fearGreedColor, formatPercentage, formatPrice, type Currency } from '../lib/crypto-utils';

interface HeroProps {
  tokens: CryptoToken[];
  stats: GlobalStats;
  fearGreed: FearGreedResult | null;
  currency: Currency;
  isLive: boolean;
  onSelectToken: (token: CryptoToken) => void;
  onOpenConverter: () => void;
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Animates a number from its previous value to `target` (instant under reduced motion). */
function useCountUp(target: number, duration = 1100): number {
  const [value, setValue] = useState(prefersReducedMotion() ? target : 0);
  const from = useRef(prefersReducedMotion() ? target : 0);
  useEffect(() => {
    if (prefersReducedMotion()) {
      from.current = target;
      return;
    }
    const start = performance.now();
    const origin = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      const next = origin + (target - origin) * eased;
      from.current = next;
      setValue(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return prefersReducedMotion() ? target : value;
}

const formatTrillions = (n: number) => `$${(n / 1e12).toFixed(2)}T`;

export const Hero: React.FC<HeroProps> = ({ tokens, stats, fearGreed, currency, isLive, onSelectToken, onOpenConverter }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const videoWrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [allowVideo] = useState(() => {
    if (typeof window === 'undefined' || prefersReducedMotion()) return false;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    return !conn?.saveData;
  });

  // Pointer parallax (desktop pointers only), throttled with rAF.
  useEffect(() => {
    const section = sectionRef.current;
    const wrap = videoWrapRef.current;
    if (!section || !wrap || prefersReducedMotion() || !window.matchMedia('(pointer: fine)').matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = section.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        wrap.style.transform = `translate3d(${(-x * 26).toFixed(1)}px, ${(-y * 16).toFixed(1)}px, 0) scale(1.07)`;
      });
    };
    const onLeave = () => {
      wrap.style.transform = 'translate3d(0,0,0) scale(1.07)';
    };
    section.addEventListener('pointermove', onMove);
    section.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      section.removeEventListener('pointermove', onMove);
      section.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  // Only play while visible and while the tab is active (saves CPU / battery).
  useEffect(() => {
    const video = videoRef.current;
    const section = sectionRef.current;
    if (!video || !section) return;
    let inView = true;
    const sync = () => {
      if (inView && !document.hidden) video.play().catch(() => undefined);
      else video.pause();
    };
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    }, { threshold: 0.05 });
    io.observe(section);
    document.addEventListener('visibilitychange', sync);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, [allowVideo]);

  const marketCap = useCountUp(stats.totalMarketCap);
  const btcDom = useCountUp(stats.btcDominance);
  const fng = useCountUp(fearGreed?.now.value ?? 0);
  // Stale sample figures are never shown as a live ticker.
  const ticker = isLive ? tokens.slice(0, 14) : [];

  const scrollToMarket = () => {
    cypherSound.playBlip(600, 'sine', 0.04);
    document.getElementById('markets')?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  };

  const delay = (s: number) => ({ '--d': `${s}s` }) as React.CSSProperties;

  return (
    <section ref={sectionRef} className="relative isolate w-full overflow-hidden bg-[#07090e] border-b border-slate-800/70" aria-label="Encryptoverse introduction">
      {/* Background video (poster shown first, video fades in once playable) */}
      <div ref={videoWrapRef} className="absolute inset-x-0 top-0 h-[68%] lg:inset-0 lg:h-auto -z-20 will-change-transform transition-transform duration-300 ease-out" style={{ transform: 'scale(1.07)' }}>
        <img
          src="/media/hero-galaxy-poster.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-[66%_center] lg:object-[68%_center]"
          fetchPriority="high"
        />
        {allowVideo && (
          <video
            ref={videoRef}
            className={`absolute inset-0 w-full h-full object-cover object-[66%_center] lg:object-[68%_center] transition-opacity duration-1000 ${videoReady ? 'opacity-100' : 'opacity-0'}`}
            poster="/media/hero-galaxy-poster.jpg"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
            tabIndex={-1}
            onCanPlay={() => setVideoReady(true)}
          >
            <source src="/media/hero-galaxy-720.mp4" type="video/mp4" media="(max-width: 767px)" />
            <source src="/media/hero-galaxy-1280.mp4" type="video/mp4" />
          </video>
        )}
      </div>

      {/* Legibility + blending overlays */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,rgba(7,9,14,0.15)_0%,rgba(7,9,14,0)_30%,#07090e_62%)] lg:bg-none lg:bg-gradient-to-r lg:from-[#07090e] lg:via-[#07090e]/90 lg:via-50% lg:to-transparent" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-[#07090e] to-transparent" />
      <div className="hero-glow pointer-events-none absolute -left-24 top-1/3 -z-10 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[250px] pb-28 sm:pt-[300px] sm:pb-32 min-h-[520px] lg:min-h-[600px] lg:pt-24 lg:pb-36 flex flex-col justify-center">
        <div className="max-w-xl lg:max-w-2xl space-y-5 [text-shadow:0_1px_14px_rgba(7,9,14,0.95)]">
          <div className="hero-rise inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 font-mono text-[11px] text-cyan-300 backdrop-blur" style={delay(0.05)}>
            <span className="relative flex h-2 w-2">
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${isLive ? 'animate-ping bg-emerald-400' : 'bg-amber-400'}`} />
              <span className={`relative inline-flex h-2 w-2 rounded-full ${isLive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            </span>
            {isLive ? 'Live data · CoinGecko · refreshed every minute' : 'Live feed unavailable · showing snapshot'}
          </div>

          <h1 className="hero-rise text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight text-white" style={delay(0.15)}>
            The crypto market,
            <br />
            <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-indigo-400 bg-clip-text text-transparent">in one clear view.</span>
          </h1>

          <p className="hero-rise text-sm sm:text-base text-slate-300/90 leading-relaxed max-w-lg" style={delay(0.3)}>
            Prices, market cap, volume and sentiment for the top 50 cryptocurrencies. Every figure links back to a named source — no hidden
            rankings, no paid placements.
          </p>

          <div className="hero-rise flex flex-wrap items-center gap-3 pt-1" style={delay(0.45)}>
            <button
              onClick={scrollToMarket}
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 font-mono text-xs font-bold text-white shadow-lg shadow-cyan-500/25 transition hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-400/40"
            >
              Explore the market
              <ArrowDown className="h-3.5 w-3.5 transition group-hover:translate-y-0.5" />
            </button>
            <button
              onClick={() => {
                cypherSound.playBlip(640, 'sine', 0.04);
                onOpenConverter();
              }}
              className="group inline-flex items-center gap-2 rounded-xl border border-slate-600/60 bg-[#07090e]/70 px-5 py-2.5 font-mono text-xs font-bold text-slate-200 backdrop-blur transition hover:border-cyan-500/50 hover:text-white"
            >
              <Calculator className="h-3.5 w-3.5 text-indigo-300" />
              Price converter
              <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* Live stat glass cards */}
          <div className="hero-rise grid grid-cols-3 gap-2 sm:gap-3 pt-3 max-w-lg font-mono" style={delay(0.6)}>
            {[
              { label: 'Market cap', value: isLive ? formatTrillions(marketCap) : '—', sub: isLive ? formatPercentage(stats.marketCapChange24h) + ' 24h' : 'unavailable', tone: isLive ? changeColor(stats.marketCapChange24h) : 'text-slate-400' },
              { label: 'BTC dominance', value: isLive ? `${btcDom.toFixed(1)}%` : '—', sub: isLive ? `ETH ${stats.ethDominance}%` : 'unavailable', tone: 'text-slate-400' },
              { label: 'Fear & Greed', value: fearGreed ? `${Math.round(fng)}` : '—', sub: fearGreed ? fearGreed.now.label : 'unavailable', tone: fearGreed ? fearGreedColor(fearGreed.now.value) : 'text-slate-400' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-white/10 bg-[#07090e]/75 px-2.5 py-2 sm:px-3 sm:py-2.5 backdrop-blur-md">
                <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400 truncate">{s.label}</div>
                <div className="mt-0.5 text-sm sm:text-lg font-extrabold text-white tabular-nums">{s.value}</div>
                <div className={`text-[9px] sm:text-[10px] ${s.tone} truncate`}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live price marquee */}
      {ticker.length > 0 && (
        <div className="hero-marquee absolute inset-x-0 bottom-0 border-t border-white/10 bg-[#07090e]/70 backdrop-blur-md overflow-hidden">
          <div className="hero-marquee-track flex w-max items-center gap-8 py-2.5 pr-8 font-mono text-[11px] motion-reduce:w-full motion-reduce:overflow-x-auto">
            {[...ticker, ...ticker].map((t, i) => (
              <button
                key={`${t.id}-${i}`}
                onClick={() => onSelectToken(t)}
                tabIndex={i >= ticker.length ? -1 : 0}
                aria-hidden={i >= ticker.length}
                className="flex shrink-0 items-center gap-2 text-slate-300 transition hover:text-white"
              >
                <img src={t.icon} alt="" className="h-4 w-4 rounded-full" loading="lazy" />
                <span className="font-bold">{t.symbol}</span>
                <span className="tabular-nums text-slate-400">{formatPrice(t.price, currency)}</span>
                <span className={`tabular-nums font-bold ${changeColor(t.change24h)}`}>
                  {t.change24h >= 0 ? '▲' : '▼'} {Math.abs(t.change24h).toFixed(2)}%
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
