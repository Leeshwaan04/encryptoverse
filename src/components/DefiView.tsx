import React, { useEffect, useState } from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { EDGE_PROXY_ENABLED, fetchDefi, fetchNewPools, type DefiSnapshot, type NewPool } from '../services/cryptoApi';
import { changeColor, formatCompact, formatPercentage } from '../lib/crypto-utils';

type View = 'chains' | 'stablecoins' | 'governance' | 'pools';

const VIEWS: { id: View; label: string }[] = [
  { id: 'chains', label: 'Chains (TVL)' },
  { id: 'stablecoins', label: 'Stablecoins' },
  { id: 'governance', label: 'Governance' },
  { id: 'pools', label: 'New pools' },
];

type Loaded<T> = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: T; source: string; fetchedAt: string };

function ageLabel(iso: string | null): string {
  if (!iso) return '—';
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.round(mins / 60)}h`;
  return `${Math.round(mins / 1440)}d`;
}

const Th: React.FC<React.PropsWithChildren<{ right?: boolean }>> = ({ children, right }) => (
  <th scope="col" className={`px-3 py-2.5 font-semibold ${right ? 'text-right' : 'text-left'}`}>
    {children}
  </th>
);

const Notice: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-sm text-slate-300 text-center">{children}</div>
);

export const DefiView: React.FC = () => {
  const [view, setView] = useState<View>('chains');
  const [defi, setDefi] = useState<Loaded<DefiSnapshot>>(EDGE_PROXY_ENABLED ? { status: 'loading' } : { status: 'error' });
  const [pools, setPools] = useState<Loaded<{ pools: NewPool[] }>>(EDGE_PROXY_ENABLED ? { status: 'loading' } : { status: 'error' });

  useEffect(() => {
    if (!EDGE_PROXY_ENABLED) return;
    const c = new AbortController();
    void fetchDefi(c.signal).then((r) => setDefi(r ? { status: 'ready', ...r } : { status: 'error' }));
    void fetchNewPools(c.signal).then((r) => setPools(r ? { status: 'ready', ...r } : { status: 'error' }));
    return () => c.abort();
  }, []);

  const active = view === 'pools' ? pools : defi;

  return (
    <section aria-labelledby="defi-heading" className="space-y-5">
      <div>
        <h1 id="defi-heading" className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          DeFi &amp; on-chain overview
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Open data on where value sits on-chain: TVL by blockchain, stablecoin supply, live governance votes and brand-new DEX pools.
          {active.status === 'ready' && ` Source: ${active.source}.`}
        </p>
      </div>

      <div role="group" aria-label="DeFi sections" className="flex flex-wrap gap-2">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            aria-pressed={view === v.id}
            onClick={() => setView(v.id)}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium border transition min-h-10 ${
              view === v.id ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-200' : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {active.status === 'loading' && <Notice>Loading on-chain data…</Notice>}
      {active.status === 'error' && (
        <Notice>
          {EDGE_PROXY_ENABLED
            ? 'This data source is temporarily unavailable. Please try again shortly.'
            : 'DeFi data is served by the Encryptoverse edge API, which is not available in a local or static preview.'}
        </Notice>
      )}

      {view === 'chains' && defi.status === 'ready' && (
        <div className="space-y-3">
          <p className="text-sm text-slate-300">
            Total value locked across chains:{' '}
            <strong className="text-white tabular-nums">{formatCompact(defi.data.totalTvl, 'USD')}</strong>
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-sm">
              <caption className="sr-only">Top blockchains by total value locked</caption>
              <thead className="bg-slate-900/70 text-xs text-slate-400">
                <tr>
                  <Th>#</Th>
                  <Th>Chain</Th>
                  <Th right>TVL</Th>
                  <Th right>Share</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {defi.data.chains.map((c, i) => (
                  <tr key={c.name}>
                    <td className="px-3 py-2.5 text-slate-400 tabular-nums">{i + 1}</td>
                    <td className="px-3 py-2.5 font-medium text-white">
                      {c.name} {c.symbol && <span className="text-xs text-slate-400">{c.symbol}</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-100">{formatCompact(c.tvl, 'USD')}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-300">
                      <span className="inline-flex items-center gap-2 justify-end">
                        <span className="hidden sm:inline-block w-24 h-1.5 rounded-full bg-slate-800 overflow-hidden" aria-hidden="true">
                          <span className="block h-full bg-cyan-500" style={{ width: `${Math.min(100, c.share * 100 * 2)}%` }} />
                        </span>
                        {(c.share * 100).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === 'stablecoins' && defi.status === 'ready' && (
        <div className="space-y-3">
          <p className="text-sm text-slate-300">
            Stablecoins in circulation (all chains):{' '}
            <strong className="text-white tabular-nums">{formatCompact(defi.data.stablecoins.total, 'USD')}</strong>
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-sm">
              <caption className="sr-only">Stablecoin supply by blockchain</caption>
              <thead className="bg-slate-900/70 text-xs text-slate-400">
                <tr>
                  <Th>#</Th>
                  <Th>Chain</Th>
                  <Th right>Stablecoin supply</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {defi.data.stablecoins.chains.map((c, i) => (
                  <tr key={c.name}>
                    <td className="px-3 py-2.5 text-slate-400 tabular-nums">{i + 1}</td>
                    <td className="px-3 py-2.5 font-medium text-white">{c.name}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-100">{formatCompact(c.circulating, 'USD')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === 'governance' && defi.status === 'ready' && (
        <div className="space-y-3">
          <p className="text-sm text-slate-300">Open votes on Snapshot. Anyone can create a proposal, so inclusion here is not an endorsement.</p>
          {defi.data.governance.length === 0 ? (
            <Notice>No active proposals right now.</Notice>
          ) : (
            <ul className="space-y-2">
              {defi.data.governance.map((g) => (
                <li key={g.url}>
                  <a
                    href={g.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4 hover:border-slate-600 transition"
                  >
                    <span>
                      <span className="block text-sm font-medium text-white">{g.title}</span>
                      <span className="block text-xs text-slate-400 mt-1">
                        {g.space} · ends {new Date(g.endsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </span>
                    <ExternalLink className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {view === 'pools' && pools.status === 'ready' && (
        <div className="space-y-3">
          <div role="note" className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
            <p>
              Brand-new tokens are extremely high risk. Many are scams or lose most of their value within hours. This list shows what has just been
              created on-chain; it is not a recommendation and none of these tokens have been reviewed by Encryptoverse.
            </p>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-sm">
              <caption className="sr-only">Newly created decentralised exchange pools</caption>
              <thead className="bg-slate-900/70 text-xs text-slate-400">
                <tr>
                  <Th>Pool</Th>
                  <Th>Chain</Th>
                  <Th right>Age</Th>
                  <Th right>Liquidity</Th>
                  <Th right>24h volume</Th>
                  <Th right>24h</Th>
                  <Th right>Txns</Th>
                  <Th>
                    <span className="sr-only">Link</span>
                  </Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {pools.data.pools.map((p) => (
                  <tr key={p.url}>
                    <td className="px-3 py-2.5 font-medium text-white whitespace-nowrap">
                      {p.name}
                      {p.liquidityUsd < 10_000 && (
                        <span className="ml-2 text-[11px] font-semibold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">Low liquidity</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-slate-300 capitalize">{p.network}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-300">{ageLabel(p.createdAt)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-100">{formatCompact(p.liquidityUsd, 'USD')}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-300">{formatCompact(p.volume24hUsd, 'USD')}</td>
                    <td className={`px-3 py-2.5 text-right tabular-nums ${changeColor(p.change24h)}`}>{formatPercentage(p.change24h)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-300">{p.txns24h.toLocaleString('en-US')}</td>
                    <td className="px-3 py-2.5">
                      <a href={p.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200 whitespace-nowrap">
                        View <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                        <span className="sr-only">{p.name} on GeckoTerminal</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};
