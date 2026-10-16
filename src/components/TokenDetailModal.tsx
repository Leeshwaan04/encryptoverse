import React, { useEffect, useState } from 'react';
import {
  X,
  Star,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Globe,
  Share2,
  Check
} from 'lucide-react';
import type { CryptoToken } from '../data/cryptoData';
import { cypherSound } from '../lib/crypto-utils';

interface TokenDetailModalProps {
  token: CryptoToken | null;
  onClose: () => void;
  isWatchlisted: boolean;
  onToggleWatchlist: (tokenId: string) => void;
  currency?: string;
}

export const TokenDetailModal: React.FC<TokenDetailModalProps> = ({
  token,
  onClose,
  isWatchlisted,
  onToggleWatchlist,
  currency = 'usd',
}) => {
  const [timeRange, setTimeRange] = useState<'1D' | '7D' | '1M' | '1Y'>('7D');
  const [hoveredPrice, setHoveredPrice] = useState<number | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const tokenId = token?.id;
  // Keyed result: "loading" is derived (result.key !== current key), so no synchronous setState in the effect.
  const chartKey = `${tokenId}|${timeRange}|${currency}`;
  const [chartResult, setChartResult] = useState<{ key: string; series: number[] | null }>({ key: '', series: null });
  const chartState: 'loading' | 'ready' | 'error' =
    chartResult.key !== chartKey ? 'loading' : chartResult.series ? 'ready' : 'error';

  // Real price history from /api/chart (CoinGecko market_chart via the edge proxy)
  useEffect(() => {
    if (!tokenId) return;
    let ignore = false;
    const days = { '1D': '1', '7D': '7', '1M': '30', '1Y': '365' }[timeRange];
    const key = `${tokenId}|${timeRange}|${currency}`;
    fetch(`/api/chart?id=${encodeURIComponent(tokenId)}&days=${days}&currency=${currency.toLowerCase()}`)
      .then((r) => {
        if (!r.ok) throw new Error(`chart HTTP ${r.status}`);
        return r.json() as Promise<{ data: { points: [number, number][] } }>;
      })
      .then((j) => {
        const prices = j.data.points.map((pt) => pt[1]);
        if (prices.length < 2) throw new Error('not enough data');
        if (!ignore) setChartResult({ key, series: prices });
      })
      .catch(() => {
        if (!ignore) setChartResult({ key, series: null });
      });
    return () => {
      ignore = true;
    };
  }, [tokenId, timeRange, currency]);

  if (!token) return null;

  const chartData = chartState === 'ready' && chartResult.series ? chartResult.series : [];
  const minVal = chartData.length ? Math.min(...chartData) : 0;
  const maxVal = chartData.length ? Math.max(...chartData) : 0;
  const range = maxVal - minVal || 1;

  const width = 680;
  const height = 240;

  const pointsCoords = chartData.map((val, idx) => {
    const x = (idx / (chartData.length - 1)) * (width - 40) + 20;
    const y = height - 30 - ((val - minVal) / range) * (height - 60);
    return { x, y, val };
  });

  const polylineStr = pointsCoords.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPath = pointsCoords.length
    ? `${pointsCoords[0].x},${height} ${polylineStr} ${pointsCoords[pointsCoords.length - 1].x},${height}`
    : '';

  const isPositive = token.change24h >= 0;
  const strokeColor = isPositive ? '#10b981' : '#f43f5e';
  const fillColor = isPositive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)';

  const athDrop = (((token.price - token.ath) / token.ath) * 100).toFixed(1);
  const atlGain = (((token.price - token.atl) / token.atl) * 100).toFixed(0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto no-scrollbar rounded-2xl bg-[#090b11] border border-slate-800 shadow-2xl p-4 sm:p-6 font-mono text-xs space-y-4 sm:space-y-6">
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close Token Details Modal"
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 pr-10 sm:pr-12">
          <div className="flex items-center gap-3">
            <img src={token.icon} alt={token.name} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full shrink-0" />
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h3 className="text-lg sm:text-xl font-extrabold text-white">{token.name}</h3>
                <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold uppercase">
                  {token.symbol}
                </span>
                <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold">
                  Rank #{token.rank}
                </span>
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">Category: {token.category}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Watchlist toggle */}
            <button
              onClick={() => {
                onToggleWatchlist(token.id);
                cypherSound.playBlip(750);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition ${
                isWatchlisted
                  ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${isWatchlisted ? 'fill-yellow-400' : ''}`} />
              <span>{isWatchlisted ? 'Watchlisted' : 'Add to Watchlist'}</span>
            </button>

            {/* Share link */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
              }}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Live Price Display & 24h High/Low */}
        <div className="flex flex-wrap items-baseline justify-between gap-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800/80">
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              {token.price < 0.01
                ? `$${token.price.toFixed(8)}`
                : `$${(hoveredPrice || token.price).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`font-bold text-xs flex items-center ${
                  isPositive ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isPositive ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
                {isPositive ? '+' : ''}
                {token.change24h}% (24h)
              </span>
              <span className="text-slate-500 text-[11px]">|</span>
              <span className="text-slate-400 text-[11px]">7d: {token.change7d >= 0 ? '+' : ''}{token.change7d}%</span>
            </div>
          </div>

          <div className="text-right text-[11px] text-slate-400 space-y-1">
            <div>Market Cap: <strong className="text-white">${(token.marketCap / 1e9).toFixed(2)}B</strong></div>
            <div>24h Volume: <strong className="text-white">${(token.volume24h / 1e6).toFixed(1)}M</strong></div>
          </div>
        </div>

        {/* Interactive SVG Price Chart */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Price Performance Chart ({timeRange})
            </span>

            {/* Timeframe Buttons */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
              {(['1D', '7D', '1M', '1Y'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setTimeRange(t);
                    cypherSound.playBlip(550, 'sine', 0.03);
                  }}
                  className={`px-2 py-0.5 rounded transition ${
                    timeRange === t
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Canvas Area */}
          <div className="w-full bg-[#05070b] border border-slate-800/80 rounded-xl p-3 relative overflow-hidden">
            {chartState !== 'ready' ? (
              <div className="w-full h-48 flex items-center justify-center text-[11px] text-slate-500">
                {chartState === 'loading' ? 'Loading price history…' : 'Price history is temporarily unavailable.'}
              </div>
            ) : (
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-48 overflow-visible"
              onMouseLeave={() => setHoveredPrice(null)}
            >
              {/* Horizontal guide lines */}
              <line x1="0" y1={height / 4} x2={width} y2={height / 4} stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
              <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
              <line x1="0" y1={(3 * height) / 4} x2={width} y2={(3 * height) / 4} stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />

              {/* Area polygon */}
              <polygon points={areaPath} fill={fillColor} />

              {/* Line path */}
              <polyline
                fill="none"
                stroke={strokeColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={polylineStr}
              />

              {/* Hoverable points */}
              {pointsCoords.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r="5"
                  fill="transparent"
                  stroke="none"
                  className="cursor-crosshair hover:fill-white"
                  onMouseEnter={() => setHoveredPrice(p.val)}
                />
              ))}
            </svg>
            )}
          </div>
        </div>

        {/* Detailed Metrics Grid (CoinGecko / CoinDesk style) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-[10px] text-slate-500 uppercase">Circulating Supply</div>
            <div className="font-bold text-slate-200 mt-0.5">
              {token.circulatingSupply.toLocaleString()} {token.symbol}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-[10px] text-slate-500 uppercase">Max Supply</div>
            <div className="font-bold text-slate-200 mt-0.5">
              {token.maxSupply ? `${token.maxSupply.toLocaleString()} ${token.symbol}` : 'Infinite'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-[10px] text-slate-500 uppercase">All-Time High (ATH)</div>
            <div className="font-bold text-slate-200 mt-0.5">${token.ath.toLocaleString()}</div>
            <div className="text-[10px] text-rose-400">{athDrop}% ({token.athDate})</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-[10px] text-slate-500 uppercase">All-Time Low (ATL)</div>
            <div className="font-bold text-slate-200 mt-0.5">${token.atl.toLocaleString()}</div>
            <div className="text-[10px] text-emerald-400">+{atlGain}% ({token.atlDate})</div>
          </div>
        </div>

        {/* Description & Links */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
          <div className="text-xs font-bold text-white uppercase tracking-wider">About {token.name}</div>
          <p className="text-slate-400 leading-relaxed text-[11px]">{token.description}</p>
          <div className="flex flex-wrap gap-2 pt-2">
            <a
              href={token.website}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-cyan-400 hover:underline flex items-center gap-1"
            >
              <Globe className="w-3 h-3" /> Website
            </a>
            <a
              href={token.explorer}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-cyan-400 hover:underline flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" /> Blockchain Explorer
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
