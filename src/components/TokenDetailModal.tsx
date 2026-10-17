import React, { useEffect, useState } from 'react';
import { Check, ExternalLink, Globe, Link2, Star } from 'lucide-react';
import type { CryptoToken } from '../data/cryptoData';
import { fetchPriceHistory, type ChartRange } from '../services/cryptoApi';
import {
  changeColor,
  cypherSound,
  formatCompact,
  formatPercentage,
  formatPrice,
  formatSupply,
  type Currency,
} from '../lib/crypto-utils';
import { Modal } from './Modal';

interface TokenDetailModalProps {
  token: CryptoToken;
  currency: Currency;
  isLive: boolean;
  onClose: () => void;
  isWatchlisted: boolean;
  onToggleWatchlist: (tokenId: string) => void;
  /** The coin is the page's main subject (/coin/<id> over the markets view), so its name is the page h1. */
  asPageHeading?: boolean;
}

const RANGES: ChartRange[] = ['1D', '7D', '1M', '1Y'];
const W = 680;
const H = 240;
const PAD = 14;

type ChartState = { status: 'loading' } | { status: 'ready'; prices: number[] } | { status: 'error' };

const PriceChart: React.FC<{ prices: number[]; currency: Currency; label: string }> = ({ prices, currency, label }) => {
  const [hover, setHover] = useState<number | null>(null);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const pts = prices.map((v, i) => ({
    x: PAD + (i / (prices.length - 1)) * (W - PAD * 2),
    y: PAD + (1 - (v - min) / range) * (H - PAD * 2),
    v,
  }));
  const line = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = `${pts[0].x.toFixed(1)},${H} ${line} ${pts[pts.length - 1].x.toFixed(1)},${H}`;
  const up = prices[prices.length - 1] >= prices[0];
  const stroke = up ? '#10b981' : '#f43f5e';
  const active = hover !== null ? pts[hover] : null;

  // Pointer events cover mouse, pen and touch in one handler.
  const track = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((x - PAD) / (W - PAD * 2)) * (prices.length - 1));
    setHover(Math.max(0, Math.min(prices.length - 1, i)));
  };

  return (
    <div>
      <div className="flex justify-between items-baseline text-xs text-slate-400 mb-1.5 tabular-nums">
        <span>High {formatPrice(max, currency)}</span>
        <span className="text-white font-semibold text-sm" aria-live="polite">
          {active ? formatPrice(active.v, currency) : ''}
        </span>
        <span>Low {formatPrice(min, currency)}</span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-48 sm:h-56 touch-none"
        role="img"
        aria-label={label}
        onPointerMove={track}
        onPointerDown={track}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="tokenChartFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 4" />
        ))}
        <polygon points={area} fill="url(#tokenChartFill)" />
        <polyline fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" points={line} />
        {active && (
          <>
            <line x1={active.x} x2={active.x} y1="0" y2={H} stroke="rgba(255,255,255,0.25)" />
            <circle cx={active.x} cy={active.y} r="5" fill="#fff" stroke={stroke} strokeWidth="2" />
          </>
        )}
      </svg>
    </div>
  );
};

const Metric: React.FC<{ label: string; children: React.ReactNode; sub?: React.ReactNode }> = ({ label, children, sub }) => (
  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
    <dt className="text-xs text-slate-400">{label}</dt>
    <dd className="font-semibold text-slate-100 mt-0.5 tabular-nums break-words">{children}</dd>
    {sub && <dd className="text-xs mt-0.5 tabular-nums">{sub}</dd>}
  </div>
);

export const TokenDetailModal: React.FC<TokenDetailModalProps> = ({
  token,
  currency,
  isLive,
  onClose,
  isWatchlisted,
  onToggleWatchlist,
  asPageHeading = false,
}) => {
  const Heading = asPageHeading ? 'h1' : 'h2';
  const [range, setRange] = useState<ChartRange>('7D');
  const [chart, setChart] = useState<ChartState>({ status: 'loading' });
  const [copied, setCopied] = useState(false);

  const { id: tokenId, sparkline, symbol } = token;

  useEffect(() => {
    const controller = new AbortController();
    setChart({ status: 'loading' });

    const load = isLive
      ? fetchPriceHistory(tokenId, currency, range, controller.signal, symbol)
      : Promise.resolve(null);

    void load.then((prices) => {
      if (controller.signal.aborted) return;
      if (prices && prices.length > 1) setChart({ status: 'ready', prices });
      // The 7-day window is already in the market payload, so fall back to it.
      else if (range === '7D' && sparkline.length > 1) setChart({ status: 'ready', prices: sparkline });
      else setChart({ status: 'error' });
    });

    return () => controller.abort();
  }, [tokenId, currency, range, isLive, sparkline, symbol]);

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked; the URL bar already holds the shareable link.
    }
  };

  const athDrop = token.ath > 0 ? ((token.price - token.ath) / token.ath) * 100 : null;
  const atlGain = token.atl > 0 ? ((token.price - token.atl) / token.atl) * 100 : null;

  return (
    <Modal
      onClose={onClose}
      closeLabel="Close token details"
      maxWidth="max-w-3xl"
      title={
        <div className="flex items-center gap-3 min-w-0">
          <img src={token.icon} alt="" className="w-9 h-9 rounded-full shrink-0 bg-slate-800" />
          <div className="min-w-0">
            <Heading className="text-lg font-bold text-white truncate">
              {token.name} <span className="text-sm font-medium text-slate-400">{token.symbol}</span>
            </Heading>
            <p className="text-xs text-slate-400">
              Rank #{token.rank} · {token.category}
            </p>
          </div>
        </div>
      }
      headerExtra={
        <button
          type="button"
          onClick={share}
          aria-label={copied ? 'Link copied' : 'Copy link to this coin'}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Link2 className="w-4 h-4" />}
        </button>
      }
    >
      <div className="space-y-6 text-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-3xl font-bold text-white tabular-nums">{formatPrice(token.price, currency)}</div>
            <div className="flex items-center gap-3 mt-1 tabular-nums">
              <span className={`font-semibold ${changeColor(token.change24h)}`}>{formatPercentage(token.change24h)} 24h</span>
              <span className={changeColor(token.change7d)}>{formatPercentage(token.change7d)} 7d</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onToggleWatchlist(token.id);
              cypherSound.playBlip(750);
            }}
            aria-pressed={isWatchlisted}
            className={`flex items-center gap-1.5 px-3 h-10 rounded-lg border text-sm transition ${
              isWatchlisted
                ? 'bg-yellow-500/15 border-yellow-500/50 text-yellow-200 font-semibold'
                : 'bg-slate-900 border-slate-700 text-slate-200 hover:text-white'
            }`}
          >
            <Star className={`w-4 h-4 ${isWatchlisted ? 'fill-yellow-400 text-yellow-400' : ''}`} aria-hidden="true" />
            {isWatchlisted ? 'On watchlist' : 'Add to watchlist'}
          </button>
        </div>

        <section aria-label="Price chart" className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-200">Price</h3>
            <div role="group" aria-label="Chart range" className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
              {RANGES.map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={range === r}
                  onClick={() => {
                    setRange(r);
                    cypherSound.playBlip(550, 'sine', 0.03);
                  }}
                  className={`px-2.5 py-1.5 rounded-md transition ${
                    range === r ? 'bg-slate-700 text-white font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-[#05070b] border border-slate-800 p-3 min-h-[15rem] flex flex-col justify-center">
            {chart.status === 'loading' && (
              <div className="h-52 rounded-lg bg-slate-800/40 animate-pulse" role="status" aria-label="Loading price history" />
            )}
            {chart.status === 'error' && (
              <p className="text-center text-slate-400 py-16 px-4">
                {isLive
                  ? 'Price history is temporarily unavailable, usually an upstream rate limit. Try again shortly.'
                  : 'Price history needs the live feed, which is currently unavailable.'}
              </p>
            )}
            {chart.status === 'ready' && (
              <PriceChart prices={chart.prices} currency={currency} label={`${token.name} price over ${range}`} />
            )}
          </div>
        </section>

        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Metric label="Market cap">{formatCompact(token.marketCap, currency)}</Metric>
          <Metric label="24h volume">{formatCompact(token.volume24h, currency)}</Metric>
          <Metric label="Circulating supply">{formatSupply(token.circulatingSupply, token.symbol)}</Metric>
          <Metric label="Max supply">
            {token.maxSupply ? formatSupply(token.maxSupply, token.symbol) : 'No fixed cap'}
          </Metric>
          {athDrop !== null && (
            <Metric
              label="All-time high"
              sub={
                <span className="text-rose-400">
                  {formatPercentage(athDrop)}
                  {token.athDate && ` · ${token.athDate}`}
                </span>
              }
            >
              {formatPrice(token.ath, currency)}
            </Metric>
          )}
          {atlGain !== null && (
            <Metric
              label="All-time low"
              sub={
                <span className="text-emerald-400">
                  {formatPercentage(atlGain)}
                  {token.atlDate && ` · ${token.atlDate}`}
                </span>
              }
            >
              {formatPrice(token.atl, currency)}
            </Metric>
          )}
        </dl>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
          <h3 className="text-sm font-semibold text-white">About {token.name}</h3>
          <p className="text-slate-300 leading-relaxed">{token.description}</p>
          <div className="flex flex-wrap gap-2">
            <a
              href={token.website}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-200 flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5" aria-hidden="true" />
              {token.website.includes('coingecko.com') ? 'View on CoinGecko' : 'Official website'}
            </a>
            {token.explorer && token.explorer !== token.website && (
              <a
                href={token.explorer}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-200 flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                Block explorer
              </a>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
