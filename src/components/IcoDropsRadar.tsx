import React, { useState } from 'react';
import { ArrowRight, Clock, Inbox, Info, TrendingUp } from 'lucide-react';
import { icoProjects, type IcoProject } from '../data/cryptoData';
import { cypherSound } from '../lib/crypto-utils';
import { Modal } from './Modal';

type Status = IcoProject['status'];

const STATUS_TABS: { id: Status; label: string; icon: React.ReactNode; active: string }[] = [
  {
    id: 'active',
    label: 'Active',
    icon: <span className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true" />,
    active: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/40',
  },
  {
    id: 'upcoming',
    label: 'Upcoming',
    icon: <Clock className="w-3.5 h-3.5" aria-hidden="true" />,
    active: 'bg-amber-500/15 text-amber-200 border-amber-500/40',
  },
  {
    id: 'ended',
    label: 'Ended',
    icon: <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />,
    active: 'bg-purple-500/15 text-purple-200 border-purple-500/40',
  },
];

const CHAINS = ['All', ...Array.from(new Set(icoProjects.map((p) => p.platform)))];

/** Offsets are resolved at render so a sample "active" sale is never already over. */
const dateFromOffset = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

const relativeDays = (days: number): string => {
  if (days === 0) return 'today';
  const n = Math.abs(days);
  const unit = n === 1 ? 'day' : 'days';
  return days > 0 ? `in ${n} ${unit}` : `${n} ${unit} ago`;
};

const hypeClass = (h: IcoProject['interestHype']) =>
  h === 'Very High'
    ? 'bg-rose-500/10 text-rose-200 border-rose-500/30'
    : h === 'High'
      ? 'bg-amber-500/10 text-amber-200 border-amber-500/30'
      : 'bg-slate-800 text-slate-300 border-slate-700';

const Spec: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className = '' }) => (
  <div className={className}>
    <dt className="text-xs text-slate-400">{label}</dt>
    <dd className="text-slate-100 font-medium tabular-nums">{children}</dd>
  </div>
);

const SampleNotice: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    role="note"
    className={`flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/25 text-sm text-amber-100/90 ${className}`}
  >
    <Info className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" aria-hidden="true" />
    <p>
      These are illustrative sample listings, not live or verified token sales. Never send funds based on this page.
      Always verify a project through its own official channels.
    </p>
  </div>
);

export const IcoDropsRadar: React.FC = () => {
  const [status, setStatus] = useState<Status>('active');
  const [chain, setChain] = useState('All');
  const [selected, setSelected] = useState<IcoProject | null>(null);

  const projects = icoProjects.filter((p) => p.status === status && (chain === 'All' || p.platform === chain));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Token sales &amp; launchpad radar</h1>
          <p className="text-sm text-slate-400 mt-1">Sale stages, fundraising progress and post-launch returns.</p>
        </div>

        <div role="group" aria-label="Sale status" className="flex w-full md:w-auto p-1 rounded-xl bg-slate-900 border border-slate-800 text-sm">
          {STATUS_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={status === t.id}
              onClick={() => {
                setStatus(t.id);
                cypherSound.playBlip(600);
              }}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3.5 h-10 rounded-lg transition whitespace-nowrap border ${
                status === t.id ? `${t.active} font-semibold` : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <SampleNotice />

      <div className="flex items-center justify-between gap-4">
        <div
          role="group"
          aria-label="Filter by chain"
          className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 text-sm"
        >
          {CHAINS.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={chain === c}
              onClick={() => {
                setChain(c);
                cypherSound.playBlip(550, 'sine', 0.03);
              }}
              className={`px-3 py-2 rounded-full whitespace-nowrap transition border ${
                chain === c
                  ? 'bg-cyan-500/15 text-cyan-200 border-cyan-500/50 font-semibold'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <span className="text-sm text-slate-400 hidden sm:block shrink-0 tabular-nums" aria-live="polite">
          {projects.length} {projects.length === 1 ? 'listing' : 'listings'}
        </span>
      </div>

      {projects.length === 0 ? (
        <div className="p-10 rounded-2xl border border-dashed border-slate-700 text-center space-y-2">
          <Inbox className="w-8 h-8 text-slate-600 mx-auto" aria-hidden="true" />
          <p className="text-slate-100 font-semibold">
            No {status} listings{chain !== 'All' ? ` on ${chain}` : ''}
          </p>
          {chain !== 'All' && (
            <button type="button" onClick={() => setChain('All')} className="text-sm text-cyan-300 hover:text-cyan-200 min-h-11 px-3">
              Show all chains
            </button>
          )}
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => {
            const progress = p.targetRaise > 0 ? Math.min(100, Math.round((p.raisedAmount / p.targetRaise) * 100)) : 0;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setSelected(p)}
                  className="w-full h-full text-left p-5 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/50 transition flex flex-col justify-between gap-4 group focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
                >
                  <div className="space-y-3 w-full">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={p.icon} alt="" loading="lazy" className="w-10 h-10 rounded-xl bg-slate-900 p-1 border border-slate-800" />
                        <div className="min-w-0">
                          <div className="font-semibold text-white group-hover:text-cyan-200 transition truncate">{p.name}</div>
                          <div className="text-xs text-slate-400">
                            {p.symbol} · <span className="text-cyan-300">{p.platform}</span>
                          </div>
                        </div>
                      </div>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${hypeClass(p.interestHype)}`}>
                        {p.interestHype}
                      </span>
                    </div>

                    <p className="text-sm text-slate-300 leading-relaxed line-clamp-2">{p.description}</p>

                    <dl className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-sm">
                      <Spec label="Token price">${p.tokenPrice}</Spec>
                      <Spec label="Target" className="text-right">${(p.targetRaise / 1e6).toFixed(2)}M</Spec>
                    </dl>

                    {p.status === 'active' && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs tabular-nums">
                          <span className="text-slate-400">Raised ${(p.raisedAmount / 1e6).toFixed(2)}M</span>
                          <span className="text-cyan-300 font-semibold">{progress}%</span>
                        </div>
                        <div
                          className="w-full bg-slate-800 h-2 rounded-full overflow-hidden"
                          role="progressbar"
                          aria-label="Amount raised"
                          aria-valuenow={progress}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <div className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-full rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                        <p className="text-xs text-slate-400">Ends {relativeDays(p.endsInDays)}</p>
                      </div>
                    )}

                    {p.status === 'upcoming' && (
                      <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-800/30 text-xs space-y-1">
                        <div className="flex justify-between gap-2 text-amber-200">
                          <span>Whitelist: {p.whitelist ? 'Required' : 'Open'}</span>
                          <span>KYC: {p.kyc ? 'Yes' : 'No'}</span>
                        </div>
                        <p className="text-slate-400">Starts {relativeDays(p.startsInDays)}</p>
                      </div>
                    )}

                    {p.status === 'ended' && (
                      <dl className="grid grid-cols-2 gap-2 text-center">
                        <div className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-800/30">
                          <dt className="text-xs text-slate-400">USD return</dt>
                          <dd className="text-emerald-300 font-bold">{p.roiUsd || '—'}</dd>
                        </div>
                        <div className="p-2 rounded-lg bg-indigo-950/20 border border-indigo-800/30">
                          <dt className="text-xs text-slate-400">ETH return</dt>
                          <dd className="text-indigo-200 font-bold">{p.roiEth || '—'}</dd>
                        </div>
                      </dl>
                    )}
                  </div>

                  <div className="w-full pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400 truncate">{p.category}</span>
                    <span className="text-cyan-300 font-semibold flex items-center gap-1 shrink-0">
                      Details <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" aria-hidden="true" />
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {selected && (
        <Modal
          onClose={() => setSelected(null)}
          closeLabel="Close listing details"
          title={
            <div className="flex items-center gap-3 min-w-0">
              <img src={selected.icon} alt="" className="w-10 h-10 rounded-xl bg-slate-900 p-1 border border-slate-800" />
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-white truncate">{selected.name}</h2>
                <p className="text-xs text-slate-400 truncate">
                  {selected.symbol} · {selected.platform} · {selected.stage}
                </p>
              </div>
            </div>
          }
        >
          <div className="space-y-5 text-sm">
            <p className="text-slate-300 leading-relaxed">{selected.description}</p>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
              <Spec label="Token price">${selected.tokenPrice}</Spec>
              <Spec label="Target raise">${(selected.targetRaise / 1e6).toFixed(2)}M</Spec>
              <Spec label="Whitelist">{selected.whitelist ? 'Required' : 'Open'}</Spec>
              <Spec label="KYC">{selected.kyc ? 'Required' : 'No'}</Spec>
              <Spec label="Starts">{dateFromOffset(selected.startsInDays)}</Spec>
              <Spec label="Ends">{dateFromOffset(selected.endsInDays)}</Spec>
              <Spec label="Raised">${(selected.raisedAmount / 1e6).toFixed(2)}M</Spec>
              <Spec label="Category">{selected.category}</Spec>
            </dl>
            {/* No outbound project links: several sample domains are unregistered, and linking
                them would hand a phishing site a trusted referral the moment anyone buys one. */}
            <SampleNotice />
          </div>
        </Modal>
      )}
    </div>
  );
};
