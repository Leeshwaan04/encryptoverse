import React from 'react';
import { ExternalLink, Info, ShieldCheck } from 'lucide-react';
import { DUE_DILIGENCE, PAST_SALES, SALE_PLATFORMS, VERIFIED_ON } from '../data/tokenSales';

const ext = { target: '_blank', rel: 'noopener noreferrer' } as const;
const linkCls = 'inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200 underline-offset-2 hover:underline';

export const TokenSalesGuide: React.FC = () => (
  <div className="space-y-10">
    <header className="space-y-3 max-w-3xl">
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">ICOs &amp; token sales</h1>
      <p className="text-sm text-slate-300 leading-relaxed">
        Where public token sales happen today, how a few well-documented ones were structured, and what to check before taking part.
      </p>
      <div role="note" className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/70 border border-slate-700 text-sm text-slate-300">
        <Info className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" aria-hidden="true" />
        <p>
          This page is written by hand and is not a live feed or a list of recommended sales. Free, neutral sale listings do not exist, so
          open sales are not shown here; follow the platform links for current ones. Facts were checked against the sources shown on{' '}
          {VERIFIED_ON} and can go stale. Encryptoverse takes no payment for placement and has no stake in any sale.
        </p>
      </div>
    </header>

    <section aria-labelledby="platforms" className="space-y-4">
      <h2 id="platforms" className="text-lg font-bold text-white">
        Where public sales happen
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        {SALE_PLATFORMS.map((p) => (
          <article key={p.name} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5 space-y-3">
            <h3 className="text-base font-semibold text-white">{p.name}</h3>
            <p className="text-sm text-slate-300 leading-relaxed">{p.summary}</p>
            <ul className="space-y-1.5 text-sm text-slate-400 list-disc pl-5">
              {p.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm pt-1">
              <a href={p.href} {...ext} className={linkCls}>
                Official site <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </a>
              {p.docs && (
                <a href={p.docs.href} {...ext} className={linkCls}>
                  {p.docs.label} <ExternalLink className="w-3 h-3" aria-hidden="true" />
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>

    <section aria-labelledby="past" className="space-y-4">
      <div>
        <h2 id="past" className="text-lg font-bold text-white">
          Notable completed sales
        </h2>
        <p className="text-sm text-slate-400 mt-1">Historical examples with published terms. Not endorsements, and past sales say nothing about future returns.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {PAST_SALES.map((s) => (
          <article key={s.symbol} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5 space-y-3">
            <div>
              <h3 className="text-base font-semibold text-white">
                {s.name} <span className="font-mono text-xs text-slate-400">{s.symbol}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {s.when} · {s.platform}
              </p>
            </div>
            <ul className="space-y-1 text-sm text-slate-200 list-disc pl-5">
              {s.terms.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <p className="text-sm text-slate-400 leading-relaxed">{s.outcome}</p>
            <p className="text-xs text-slate-400">
              Sources:{' '}
              {s.sources.map((src, i) => (
                <React.Fragment key={src.href}>
                  {i > 0 && ' · '}
                  <a href={src.href} {...ext} className="text-cyan-300 hover:text-cyan-200 underline-offset-2 hover:underline">
                    {src.label}
                  </a>
                </React.Fragment>
              ))}
            </p>
          </article>
        ))}
      </div>
    </section>

    <section aria-labelledby="diligence" className="space-y-4">
      <h2 id="diligence" className="flex items-center gap-2 text-lg font-bold text-white">
        <ShieldCheck className="w-5 h-5 text-emerald-400" aria-hidden="true" />
        Before you take part
      </h2>
      <ol className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {DUE_DILIGENCE.map((d, i) => (
          <li key={d.title} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-1">
            <p className="text-sm font-semibold text-white">
              <span className="font-mono text-cyan-300 mr-2">{i + 1}.</span>
              {d.title}
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">{d.body}</p>
          </li>
        ))}
      </ol>
      <p className="text-xs text-slate-400">
        General information only, not financial advice. See the{' '}
        <a href="/risk-disclosure" className="text-cyan-300 hover:text-cyan-200 underline">
          risk disclosure
        </a>
        .
      </p>
    </section>
  </div>
);
