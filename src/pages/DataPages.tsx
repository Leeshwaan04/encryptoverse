import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Info } from 'lucide-react';
import {
  FIAT, LIST_PER_PAGE, chainInfo, chainListInfo, coinInfo, coinIsSubstantive, coinListInfo, convertHubInfo, convertInfo, exchangeInfo,
  exchangeListInfo, pathOf, pct, protocolInfo, protocolListInfo, qty, stableInfo, stableListInfo, usd,
  type PageInfo, type PageRoute,
} from '../shared/pages';
import { applyRouteMeta } from '../lib/routeMeta';
import { changeColor } from '../lib/crypto-utils';
import {
  loadLiveCoin, loadManifest, loadPage, loadRates, type LiveCoin, type LoadedPage, type Manifest,
} from '../services/pageData';

type Nav = (to: string) => void;

// ------------------------------------------------------------------------------------------------ primitives
const plain = (e: React.MouseEvent) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

const L: React.FC<{ to: string; nav: Nav; className?: string; children: React.ReactNode }> = ({ to, nav, className = 'text-cyan-300 hover:text-cyan-200 underline-offset-2 hover:underline', children }) => (
  <a
    href={to}
    onClick={(e) => {
      if (!plain(e)) return;
      e.preventDefault();
      nav(to);
    }}
    className={className}
  >
    {children}
  </a>
);

const Crumbs: React.FC<{ nav: Nav; trail: [string, string][]; current: string }> = ({ nav, trail, current }) => (
  <nav aria-label="Breadcrumb" className="text-xs text-slate-400 flex flex-wrap gap-x-1.5">
    <L to="/" nav={nav} className="hover:text-cyan-300">Home</L>
    {trail.map(([to, label]) => (
      <React.Fragment key={to}>
        <span aria-hidden="true">/</span>
        <L to={to} nav={nav} className="hover:text-cyan-300">{label}</L>
      </React.Fragment>
    ))}
    <span aria-hidden="true">/</span>
    <span className="text-slate-300">{current}</span>
  </nav>
);

const Stat: React.FC<{ label: string; value: React.ReactNode; sub?: React.ReactNode }> = ({ label, value, sub }) => (
  <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-3.5 py-3">
    <div className="text-[11px] uppercase tracking-wider text-slate-400">{label}</div>
    <div className="mt-1 text-lg font-bold text-white tabular-nums break-words">{value}</div>
    {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
  </div>
);

const Change: React.FC<{ v: number | null | undefined }> = ({ v }) =>
  v === null || v === undefined ? <span className="text-slate-400">n/a</span> : <span className={changeColor(v)}>{pct(v)}</span>;

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-3">
    <h2 className="text-lg font-bold text-white">{title}</h2>
    {children}
  </section>
);

const Notice: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div role="note" className="flex items-start gap-3 rounded-xl border border-slate-700 bg-slate-900/70 p-3.5 text-sm text-slate-300">
    <Info className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" aria-hidden="true" />
    <p>{children}</p>
  </div>
);

const Pager: React.FC<{ nav: Nav; page: number; pages: number; make: (p: number) => PageRoute }> = ({ nav, page, pages, make }) => {
  const nums: number[] = [];
  for (let p = Math.max(1, page - 3); p <= Math.min(pages, page + 3); p++) nums.push(p);
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center gap-2 text-sm">
      {page > 1 && <L to={pathOf(make(page - 1))} nav={nav}>← Previous</L>}
      {nums.map((p) =>
        p === page ? (
          <span key={p} aria-current="page" className="rounded-lg bg-cyan-500/20 px-2.5 py-1 font-semibold text-cyan-200">{p}</span>
        ) : (
          <L key={p} to={pathOf(make(p))} nav={nav} className="rounded-lg border border-slate-800 px-2.5 py-1 text-slate-300 hover:text-white">{p}</L>
        ),
      )}
      {page < pages && <L to={pathOf(make(page + 1))} nav={nav}>Next →</L>}
      <span className="text-slate-400">of {pages}</span>
    </nav>
  );
};

const Table: React.FC<{ head: string[]; children: React.ReactNode; caption: string }> = ({ head, children, caption }) => (
  <div className="overflow-x-auto rounded-xl border border-slate-800">
    <table className="w-full text-sm">
      <caption className="sr-only">{caption}</caption>
      <thead className="bg-slate-900/70 text-left text-xs uppercase tracking-wider text-slate-400">
        <tr>
          {head.map((h, i) => (
            <th key={h} scope="col" className={`px-3 py-2 font-medium ${i > 0 ? 'text-right' : ''}`}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-800/80 text-slate-200">{children}</tbody>
    </table>
  </div>
);
const Td: React.FC<{ children: React.ReactNode; left?: boolean }> = ({ children, left }) => <td className={`px-3 py-2 tabular-nums ${left ? '' : 'text-right'}`}>{children}</td>;

const SourceNote: React.FC<{ nav: Nav; source: string; live?: boolean; generatedAt?: string }> = ({ nav, source, live, generatedAt }) => (
  <p className="text-xs text-slate-400">
    {live ? `Live figures from ${source}.` : `Data from ${source}${generatedAt ? `, snapshot taken ${new Date(generatedAt).toUTCString().replace(' GMT', ' UTC')}` : ''}.`} Not financial advice. How we collect and check data:{' '}
    <L to="/methodology" nav={nav}>methodology</L>.
  </p>
);

// ------------------------------------------------------------------------------------------------ info for meta
export function infoFor(p: LoadedPage): PageInfo {
  switch (p.kind) {
    case 'coin': return coinInfo(p.coin);
    case 'coinList': return coinListInfo(p.page, p.total);
    case 'protocol': return protocolInfo(p.protocol);
    case 'protocolList': return protocolListInfo(p.page, p.total);
    case 'chain': return chainInfo(p.chain);
    case 'chainList': return chainListInfo();
    case 'stable': return stableInfo(p.stable);
    case 'stableList': return stableListInfo();
    case 'exchange': return exchangeInfo(p.exchange);
    case 'exchangeList': return exchangeListInfo();
    case 'convertHub': return convertHubInfo();
    case 'convert':
      return 'fiat' in p.to
        ? convertInfo({ s: p.from.s, n: p.from.n, y: p.from.y }, { code: p.to.fiat, name: FIAT[p.to.fiat] })
        : convertInfo({ s: p.from.s, n: p.from.n, y: p.from.y }, { s: p.to.coin.s, n: p.to.coin.n, y: p.to.coin.y });
  }
}

// ------------------------------------------------------------------------------------------------ coin
const CoinView: React.FC<{ p: Extract<LoadedPage, { kind: 'coin' }>; nav: Nav; manifest: Manifest | null }> = ({ p, nav, manifest }) => {
  const [live, setLive] = useState<LiveCoin | null>(null);
  useEffect(() => {
    let alive = true;
    void loadLiveCoin(p.coin.s).then((l) => alive && setLive(l));
    return () => {
      alive = false;
    };
  }, [p.coin.s]);
  const c = p.coin;
  const v = live ? { p: live.p, m: live.m, v: live.v, h1: live.h1, h24: live.h24, d7: live.d7, c: live.c, t: live.t, x: live.x } : c;
  const sym = c.y.toUpperCase();
  const active = coinIsSubstantive({ ...c, p: v.p, m: v.m, v: v.v });
  return (
    <div className="space-y-8">
      <Crumbs nav={nav} trail={[['/coins', 'Cryptocurrencies']]} current={c.n} />
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{c.n} <span className="text-slate-400 text-xl font-semibold">{sym}</span> price</h1>
        <p className="text-sm text-slate-300">Ranked #{c.r} by market cap.{live ? ' Figures update every two minutes.' : ''}</p>
      </header>
      {!active && <Notice>This coin shows little or no recorded trading activity, so the figures below may be stale. They are the last values reported by the data source.</Notice>}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Price (USD)" value={usd(v.p)} sub={<Change v={v.h24} />} />
        <Stat label="Market cap" value={usd(v.m, true)} sub={`Rank #${c.r}`} />
        <Stat label="24h volume" value={usd(v.v, true)} />
        <Stat label="1h / 7d change" value={<><Change v={v.h1} /> <span className="text-slate-500">/</span> <Change v={v.d7} /></>} />
        <Stat label="Circulating supply" value={`${qty(v.c)} ${sym}`} />
        <Stat label="Total supply" value={v.t ? `${qty(v.t)} ${sym}` : 'n/a'} />
        <Stat label="Max supply" value={v.x ? `${qty(v.x)} ${sym}` : 'n/a'} />
        <Stat label="Data" value={live ? 'Live' : 'Snapshot'} sub={live ? 'CoinLore' : manifest ? new Date(manifest.generatedAt).toLocaleString() : ''} />
      </div>
      {live && live.markets.length > 0 && (
        <Section title={`Where ${c.n} trades`}>
          <Table head={['Exchange', 'Pair', 'Price (USD)', '24h volume']} caption={`Top markets for ${c.n}`}>
            {live.markets.map((m, i) => (
              <tr key={`${m.ex}-${m.pair}-${i}`}>
                <Td left>{m.ex}</Td>
                <Td>{m.pair}</Td>
                <Td>{usd(m.p)}</Td>
                <Td>{usd(m.v, true)}</Td>
              </tr>
            ))}
          </Table>
        </Section>
      )}
      <Section title={`About ${c.n}`}>
        <p className="text-sm text-slate-300 leading-relaxed">
          {c.n} ({sym}) is listed at rank #{c.r} by market capitalisation{v.m ? `, with a market cap of ${usd(v.m, true)}` : ''}.{' '}
          {v.c ? `${qty(v.c)} ${sym} are in circulation` : 'Circulating supply is not reported'}
          {v.x ? ` out of a maximum of ${qty(v.x)}` : v.t ? ` out of ${qty(v.t)} in existence` : ''}. Encryptoverse does not review projects or recommend assets; it republishes market data and names the source of every figure.
        </p>
      </Section>
      {p.near.length > 0 && (
        <Section title="Nearby in the rankings">
          <ul className="flex flex-wrap gap-2 text-sm">
            {p.near.map(([s, n, y, r]) => (
              <li key={s}><L to={`/coin/${s}`} nav={nav} className="inline-block rounded-lg border border-slate-800 px-2.5 py-1 text-slate-200 hover:text-white">#{r} {n} <span className="text-slate-400">{y.toUpperCase()}</span></L></li>
            ))}
          </ul>
        </Section>
      )}
      <Section title="Convert">
        {p.convertible ? (
          <ul className="flex flex-wrap gap-2 text-sm">
            {['usd', 'eur', 'gbp', 'inr', 'jpy', 'aud'].map((f) => (
              <li key={f}><L to={`/convert/${c.s}-to-${f}`} nav={nav} className="inline-block rounded-lg border border-slate-800 px-2.5 py-1 text-slate-200 hover:text-white">{sym} to {f.toUpperCase()}</L></li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">Converter pages are published for the 300 largest actively traded coins.</p>
        )}
      </Section>
      <SourceNote nav={nav} source="CoinLore" live={Boolean(live)} generatedAt={manifest?.generatedAt} />
    </div>
  );
};

// ------------------------------------------------------------------------------------------------ lists
const CoinListView: React.FC<{ p: Extract<LoadedPage, { kind: 'coinList' }>; nav: Nav; manifest: Manifest | null }> = ({ p, nav, manifest }) => {
  const info = coinListInfo(p.page, p.total);
  return (
    <div className="space-y-6">
      <Crumbs nav={nav} trail={[]} current="Cryptocurrencies" />
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{info.heading}</h1>
        <p className="text-sm text-slate-300">{p.total.toLocaleString('en-US')} cryptocurrencies, ranked by market cap. Prices are a periodic snapshot; open a coin for live figures.</p>
      </header>
      <Table head={['Coin', 'Price', '24h', 'Market cap']} caption={info.heading}>
        {p.rows.map(([s, n, y, r, price, h24, m]) => (
          <tr key={s}>
            <Td left><span className="text-slate-500 mr-2">{r}</span><L to={`/coin/${s}`} nav={nav}>{n}</L> <span className="text-slate-400">{y.toUpperCase()}</span></Td>
            <Td>{usd(price)}</Td>
            <Td><Change v={h24} /></Td>
            <Td>{usd(m, true)}</Td>
          </tr>
        ))}
      </Table>
      <Pager nav={nav} page={p.page} pages={p.pages} make={(page) => ({ kind: 'coinList', page })} />
      <SourceNote nav={nav} source="CoinLore" generatedAt={manifest?.generatedAt} />
    </div>
  );
};

const ProtocolListView: React.FC<{ p: Extract<LoadedPage, { kind: 'protocolList' }>; nav: Nav; manifest: Manifest | null }> = ({ p, nav, manifest }) => {
  const info = protocolListInfo(p.page, p.total);
  return (
    <div className="space-y-6">
      <Crumbs nav={nav} trail={[['/defi', 'DeFi']]} current="Protocols" />
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{info.heading}</h1>
        <p className="text-sm text-slate-300">{p.total.toLocaleString('en-US')} DeFi protocols tracked by DefiLlama, ranked by total value locked (TVL).</p>
      </header>
      <Table head={['Protocol', 'Category', 'TVL', '24h']} caption={info.heading}>
        {p.rows.map(([s, n, k, t, c1d], i) => (
          <tr key={s}>
            <Td left><span className="text-slate-500 mr-2">{(p.page - 1) * LIST_PER_PAGE + i + 1}</span><L to={`/defi/protocol/${s}`} nav={nav}>{n}</L></Td>
            <Td>{k ?? 'n/a'}</Td>
            <Td>{usd(t, true)}</Td>
            <Td><Change v={c1d} /></Td>
          </tr>
        ))}
      </Table>
      <Pager nav={nav} page={p.page} pages={p.pages} make={(page) => ({ kind: 'protocolList', page })} />
      <SourceNote nav={nav} source="DefiLlama" generatedAt={manifest?.generatedAt} />
    </div>
  );
};

const SimpleList: React.FC<{ nav: Nav; info: PageInfo; trail: [string, string][]; current: string; intro: string; head: string[]; rows: React.ReactNode; source: string; manifest: Manifest | null }> = ({ nav, info, trail, current, intro, head, rows, source, manifest }) => (
  <div className="space-y-6">
    <Crumbs nav={nav} trail={trail} current={current} />
    <header className="space-y-2">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{info.heading}</h1>
      <p className="text-sm text-slate-300">{intro}</p>
    </header>
    <Table head={head} caption={info.heading}>{rows}</Table>
    <SourceNote nav={nav} source={source} generatedAt={manifest?.generatedAt} />
  </div>
);

// ------------------------------------------------------------------------------------------------ DeFi entities
const ProtocolView: React.FC<{ p: Extract<LoadedPage, { kind: 'protocol' }>; nav: Nav; manifest: Manifest | null }> = ({ p, nav, manifest }) => {
  const x = p.protocol;
  const chainSlug = (name: string) => name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  return (
    <div className="space-y-8">
      <Crumbs nav={nav} trail={[['/defi', 'DeFi'], ['/defi/protocols', 'Protocols']]} current={x.n} />
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{x.n}{x.y ? <span className="text-slate-400 text-xl font-semibold"> {x.y.toUpperCase()}</span> : null}: TVL and stats</h1>
        {x.k && <p className="text-sm text-slate-300">Category: {x.k}</p>}
      </header>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Total value locked" value={usd(x.t, true)} />
        <Stat label="TVL 24h" value={<Change v={x.c1d} />} />
        <Stat label="TVL 7d" value={<Change v={x.c7} />} />
        <Stat label="Market cap" value={usd(x.m, true)} />
      </div>
      {x.d && (
        <Section title={`About ${x.n}`}>
          <p className="text-sm text-slate-300 leading-relaxed">{x.d}</p>
        </Section>
      )}
      {x.tc.length > 0 && (
        <Section title="TVL by chain">
          <Table head={['Chain', 'TVL']} caption={`${x.n} TVL by chain`}>
            {x.tc.map(([chain, v]) => (
              <tr key={chain}>
                <Td left><L to={`/defi/chain/${chainSlug(chain)}`} nav={nav}>{chain}</L></Td>
                <Td>{usd(v, true)}</Td>
              </tr>
            ))}
          </Table>
        </Section>
      )}
      <Section title="Links">
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {x.u && <li><a href={x.u} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200">Official website <ExternalLink className="w-3 h-3" aria-hidden="true" /></a></li>}
          {x.tw && /^[A-Za-z0-9_]{1,30}$/.test(x.tw) && <li><a href={`https://x.com/${x.tw}`} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200">@{x.tw} <ExternalLink className="w-3 h-3" aria-hidden="true" /></a></li>}
          <li><L to="/defi/protocols" nav={nav}>All protocols</L></li>
        </ul>
        <p className="text-xs text-slate-400">External sites are the projects’ own and are not endorsed by Encryptoverse.</p>
      </Section>
      <SourceNote nav={nav} source="DefiLlama" generatedAt={manifest?.generatedAt} />
    </div>
  );
};

const ChainView: React.FC<{ p: Extract<LoadedPage, { kind: 'chain' }>; nav: Nav; manifest: Manifest | null }> = ({ p, nav, manifest }) => {
  const c = p.chain;
  return (
    <div className="space-y-8">
      <Crumbs nav={nav} trail={[['/defi', 'DeFi'], ['/defi/chains', 'Chains']]} current={c.n} />
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{c.n}: TVL and top protocols</h1>
      </header>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Total value locked" value={usd(c.t, true)} />
        <Stat label="Protocols" value={c.pc.toLocaleString('en-US')} />
        <Stat label="Native token" value={c.y ? c.y.toUpperCase() : 'n/a'} />
        <Stat label="Chain id" value={c.id ?? 'n/a'} />
      </div>
      {c.tp.length > 0 && (
        <Section title={`Largest protocols on ${c.n}`}>
          <Table head={['Protocol', 'Category', 'TVL on chain']} caption={`Top protocols on ${c.n}`}>
            {c.tp.map(([s, n, k, v]) => (
              <tr key={s}>
                <Td left><L to={`/defi/protocol/${s}`} nav={nav}>{n}</L></Td>
                <Td>{k ?? 'n/a'}</Td>
                <Td>{usd(v, true)}</Td>
              </tr>
            ))}
          </Table>
        </Section>
      )}
      <SourceNote nav={nav} source="DefiLlama" generatedAt={manifest?.generatedAt} />
    </div>
  );
};

const StableView: React.FC<{ p: Extract<LoadedPage, { kind: 'stable' }>; nav: Nav; manifest: Manifest | null }> = ({ p, nav, manifest }) => {
  const s = p.stable;
  const chainSlug = (name: string) => name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  const wk = s.c7d && s.cs ? ((s.cs - s.c7d) / s.c7d) * 100 : null;
  const mo = s.c30 && s.cs ? ((s.cs - s.c30) / s.c30) * 100 : null;
  return (
    <div className="space-y-8">
      <Crumbs nav={nav} trail={[['/stablecoins', 'Stablecoins']]} current={s.n} />
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{s.n} <span className="text-slate-400 text-xl font-semibold">{s.y.toUpperCase()}</span> stablecoin</h1>
        <p className="text-sm text-slate-300">Pegged to {s.peg}{s.mech ? `, ${s.mech}` : ''}.</p>
      </header>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Circulating" value={usd(s.cs, true)} />
        <Stat label="Price" value={usd(s.pr)} />
        <Stat label="7d supply change" value={<Change v={wk} />} />
        <Stat label="30d supply change" value={<Change v={mo} />} />
      </div>
      {s.ch.length > 0 && (
        <Section title={`Chains (${s.nc})`}>
          <ul className="flex flex-wrap gap-2 text-sm">
            {s.ch.map((ch) => (
              <li key={ch}><L to={`/defi/chain/${chainSlug(ch)}`} nav={nav} className="inline-block rounded-lg border border-slate-800 px-2.5 py-1 text-slate-200 hover:text-white">{ch}</L></li>
            ))}
          </ul>
        </Section>
      )}
      <SourceNote nav={nav} source="DefiLlama" generatedAt={manifest?.generatedAt} />
    </div>
  );
};

const ExchangeView: React.FC<{ p: Extract<LoadedPage, { kind: 'exchange' }>; nav: Nav; manifest: Manifest | null }> = ({ p, nav, manifest }) => {
  const e = p.exchange;
  return (
    <div className="space-y-8">
      <Crumbs nav={nav} trail={[['/exchanges', 'Exchanges']]} current={e.n} />
      <header><h1 className="text-2xl sm:text-3xl font-extrabold text-white">{e.n} exchange</h1></header>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="24h volume" value={usd(e.v, true)} />
        <Stat label="Active pairs" value={e.ap ?? 'n/a'} />
        <Stat label="Country" value={e.co ?? 'n/a'} />
      </div>
      {e.u && <p className="text-sm"><a href={e.u} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200">Official website <ExternalLink className="w-3 h-3" aria-hidden="true" /></a></p>}
      <Section title="Other exchanges">
        <ul className="flex flex-wrap gap-2 text-sm">
          {p.others.map((o) => (
            <li key={o.s}><L to={`/exchange/${o.s}`} nav={nav} className="inline-block rounded-lg border border-slate-800 px-2.5 py-1 text-slate-200 hover:text-white">{o.n}</L></li>
          ))}
        </ul>
      </Section>
      <p className="text-xs text-slate-400">Volume is self-reported or estimated by the data source and is not audited. Exchange listings are not endorsements.</p>
      <SourceNote nav={nav} source="CoinLore" generatedAt={manifest?.generatedAt} />
    </div>
  );
};

// ------------------------------------------------------------------------------------------------ converters
const AMOUNTS = [1, 5, 10, 50, 100, 500, 1000];

const ConvertView: React.FC<{ p: Extract<LoadedPage, { kind: 'convert' }>; nav: Nav; manifest: Manifest | null }> = ({ p, nav, manifest }) => {
  const [amount, setAmount] = useState('1');
  const [liveFrom, setLiveFrom] = useState<LiveCoin | null>(null);
  const [liveTo, setLiveTo] = useState<LiveCoin | null>(null);
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const toCoin = 'coin' in p.to ? p.to.coin : null;
  const fiat = 'fiat' in p.to ? p.to.fiat : null;

  useEffect(() => {
    let alive = true;
    void loadLiveCoin(p.from.s).then((l) => alive && setLiveFrom(l));
    if (toCoin) void loadLiveCoin(toCoin.s).then((l) => alive && setLiveTo(l));
    if (fiat) void loadRates().then((r) => alive && setRates(r));
    return () => {
      alive = false;
    };
  }, [p.from.s, toCoin, fiat]);

  const fromUsd = liveFrom?.p ?? p.from.p;
  const toUsd = toCoin ? (liveTo?.p ?? toCoin.p) : null;
  const unit = useMemo(() => {
    if (fiat) {
      const rate = rates?.[fiat];
      return fromUsd && rate ? fromUsd * rate : fiat === 'usd' && fromUsd ? fromUsd : null;
    }
    return fromUsd && toUsd ? fromUsd / toUsd : null;
  }, [fiat, fromUsd, rates, toUsd]);

  const fromSym = p.from.y.toUpperCase();
  const toSym = fiat ? fiat.toUpperCase() : (toCoin?.y ?? '').toUpperCase();
  const toName = fiat ? FIAT[fiat] : toCoin?.n;
  const fmt = (n: number): string => {
    if (fiat) {
      try {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: fiat.toUpperCase(), maximumFractionDigits: n >= 1 ? 2 : 6 }).format(n);
      } catch {
        return `${n.toFixed(2)} ${toSym}`;
      }
    }
    return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: n >= 1 ? 4 : 8 }).format(n)} ${toSym}`;
  };
  const amt = Number(amount);
  const live = Boolean(liveFrom) && (fiat ? Boolean(rates) || fiat === 'usd' : Boolean(liveTo));

  return (
    <div className="space-y-8">
      <Crumbs nav={nav} trail={[['/convert', 'Converter']]} current={`${fromSym} to ${toSym}`} />
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{p.from.n} ({fromSym}) to {toName} ({toSym})</h1>
        <p className="text-sm text-slate-300">{unit ? `1 ${fromSym} = ${fmt(unit)}` : 'Rate unavailable right now.'}</p>
      </header>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5 space-y-3">
        <label htmlFor="amount" className="text-sm text-slate-300">Amount of {p.from.n} ({fromSym})</label>
        <input
          id="amount"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, '').slice(0, 18))}
          className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2.5 text-lg text-white tabular-nums focus:outline-none focus:border-cyan-500"
        />
        <p className="text-2xl font-bold text-white tabular-nums" aria-live="polite">
          {unit && Number.isFinite(amt) ? fmt(amt * unit) : 'n/a'}
        </p>
      </div>
      {unit && (
        <Section title={`${fromSym} to ${toSym} conversion table`}>
          <Table head={[fromSym, toSym]} caption={`${fromSym} to ${toSym}`}>
            {AMOUNTS.map((a) => (
              <tr key={a}>
                <Td left>{a} {fromSym}</Td>
                <Td>{fmt(a * unit)}</Td>
              </tr>
            ))}
          </Table>
        </Section>
      )}
      <Section title="More conversions">
        <ul className="flex flex-wrap gap-2 text-sm">
          <li><L to={`/coin/${p.from.s}`} nav={nav} className="inline-block rounded-lg border border-slate-800 px-2.5 py-1 text-slate-200 hover:text-white">{p.from.n} price</L></li>
          {toCoin && <li><L to={`/convert/${toCoin.s}-to-${p.from.s}`} nav={nav} className="inline-block rounded-lg border border-slate-800 px-2.5 py-1 text-slate-200 hover:text-white">{toSym} to {fromSym}</L></li>}
          {Object.keys(FIAT).filter((f) => f !== fiat).slice(0, 8).map((f) => (
            <li key={f}><L to={`/convert/${p.from.s}-to-${f}`} nav={nav} className="inline-block rounded-lg border border-slate-800 px-2.5 py-1 text-slate-200 hover:text-white">{fromSym} to {f.toUpperCase()}</L></li>
          ))}
        </ul>
      </Section>
      <p className="text-xs text-slate-400">
        {live ? 'Live rate.' : 'Rate from the latest data snapshot.'} Crypto prices from CoinLore{fiat ? '; currency rates are European Central Bank reference rates via Frankfurter' : ''}. Rates are indicative: real exchanges add spreads and fees.
        {manifest && !live ? ` Snapshot: ${new Date(manifest.generatedAt).toUTCString().replace(' GMT', ' UTC')}.` : ''} <L to="/methodology" nav={nav}>Methodology</L>.
      </p>
    </div>
  );
};

const ConvertHubView: React.FC<{ p: Extract<LoadedPage, { kind: 'convertHub' }>; nav: Nav }> = ({ p, nav }) => (
  <div className="space-y-8">
    <Crumbs nav={nav} trail={[]} current="Converter" />
    <header className="space-y-2">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Crypto converter</h1>
      <p className="text-sm text-slate-300">Convert {p.coins.length} cryptocurrencies into {Object.keys(FIAT).length} currencies, or between the largest coins. Pick a coin below.</p>
    </header>
    <Section title="Popular conversions">
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 text-sm">
        {p.coins.slice(0, 60).map((c) => (
          <li key={c.s}><L to={`/convert/${c.s}-to-usd`} nav={nav} className="block rounded-lg border border-slate-800 px-2.5 py-1.5 text-slate-200 hover:text-white">{c.n} to USD</L></li>
        ))}
      </ul>
    </Section>
    <Section title={`${p.coins[0]?.n ?? 'Bitcoin'} in every currency`}>
      <ul className="flex flex-wrap gap-2 text-sm">
        {Object.keys(FIAT).map((f) => (
          <li key={f}><L to={`/convert/${p.coins[0]?.s ?? 'bitcoin'}-to-${f}`} nav={nav} className="inline-block rounded-lg border border-slate-800 px-2.5 py-1 text-slate-200 hover:text-white">{(p.coins[0]?.y ?? 'BTC').toUpperCase()} to {f.toUpperCase()}</L></li>
        ))}
      </ul>
    </Section>
  </div>
);

// ------------------------------------------------------------------------------------------------ switchboard
export const DataPage: React.FC<{ route: PageRoute; nav: Nav }> = ({ route, nav }) => {
  const key = pathOf(route);
  const [state, setState] = useState<{ key: string; page: LoadedPage | null } | null>(null);
  const [manifest, setManifest] = useState<Manifest | null>(null);

  useEffect(() => {
    let alive = true;
    void loadPage(route).then((page) => alive && setState({ key, page }));
    void loadManifest().then((m) => alive && setManifest(m)).catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [route, key]);

  const ready = state?.key === key ? state : null;
  const page = ready?.page ?? null;
  const missing = ready !== null && page === null;

  useEffect(() => {
    if (page) {
      const info = infoFor(page);
      applyRouteMeta({ path: key, title: info.title, description: info.description, noindex: info.noindex });
    } else if (missing) {
      applyRouteMeta({ path: key, title: 'Page not found | Encryptoverse', description: 'This page does not exist.', noindex: true });
    }
  }, [page, missing, key]);

  if (missing) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold text-white">Page not found</h1>
        <p className="text-sm text-slate-300">We have no data for this address. It may be mistyped or the listing may have been removed.</p>
        <p className="text-sm"><L to="/coins" nav={nav}>Browse all cryptocurrencies</L></p>
      </div>
    );
  }
  if (!page) {
    return (
      <div className="space-y-4" aria-busy="true" aria-live="polite">
        <div className="h-8 w-64 rounded-lg bg-slate-800/60 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-slate-800/40 animate-pulse" />)}
        </div>
        <p className="sr-only">Loading…</p>
      </div>
    );
  }

  switch (page.kind) {
    case 'coin': return <CoinView p={page} nav={nav} manifest={manifest} />;
    case 'coinList': return <CoinListView p={page} nav={nav} manifest={manifest} />;
    case 'protocol': return <ProtocolView p={page} nav={nav} manifest={manifest} />;
    case 'protocolList': return <ProtocolListView p={page} nav={nav} manifest={manifest} />;
    case 'chain': return <ChainView p={page} nav={nav} manifest={manifest} />;
    case 'stable': return <StableView p={page} nav={nav} manifest={manifest} />;
    case 'exchange': return <ExchangeView p={page} nav={nav} manifest={manifest} />;
    case 'convert': return <ConvertView p={page} nav={nav} manifest={manifest} />;
    case 'convertHub': return <ConvertHubView p={page} nav={nav} />;
    case 'chainList':
      return (
        <SimpleList nav={nav} info={chainListInfo()} trail={[['/defi', 'DeFi']]} current="Chains" manifest={manifest} source="DefiLlama"
          intro={`${page.rows.length} blockchains tracked by DefiLlama, ranked by DeFi total value locked.`} head={['Chain', 'TVL', 'Protocols']}
          rows={page.rows.map(([s, n, t, pc], i) => (
            <tr key={s}><Td left><span className="text-slate-500 mr-2">{i + 1}</span><L to={`/defi/chain/${s}`} nav={nav}>{n}</L></Td><Td>{usd(t, true)}</Td><Td>{pc}</Td></tr>
          ))} />
      );
    case 'stableList':
      return (
        <SimpleList nav={nav} info={stableListInfo()} trail={[['/defi', 'DeFi']]} current="Stablecoins" manifest={manifest} source="DefiLlama"
          intro={`${page.rows.length} stablecoins tracked by DefiLlama, ranked by circulating supply.`} head={['Stablecoin', 'Circulating']}
          rows={page.rows.map(([s, n, y, cs], i) => (
            <tr key={s}><Td left><span className="text-slate-500 mr-2">{i + 1}</span><L to={`/stablecoins/${s}`} nav={nav}>{n}</L> <span className="text-slate-400">{y.toUpperCase()}</span></Td><Td>{usd(cs, true)}</Td></tr>
          ))} />
      );
    case 'exchangeList':
      return (
        <SimpleList nav={nav} info={exchangeListInfo()} trail={[]} current="Exchanges" manifest={manifest} source="CoinLore"
          intro={`${page.rows.length} exchanges ranked by reported 24-hour volume. Volumes are self-reported and unaudited.`} head={['Exchange', '24h volume', 'Pairs']}
          rows={page.rows.map((e, i) => (
            <tr key={e.s}><Td left><span className="text-slate-500 mr-2">{i + 1}</span><L to={`/exchange/${e.s}`} nav={nav}>{e.n}</L></Td><Td>{usd(e.v, true)}</Td><Td>{e.ap ?? 'n/a'}</Td></tr>
          ))} />
      );
  }
};
