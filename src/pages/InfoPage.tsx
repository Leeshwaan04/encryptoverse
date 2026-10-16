import React, { useEffect } from 'react';
import { SITE } from '../config/site';
import type { InfoPageDef } from './InfoPages';

interface InfoPageProps {
  page: InfoPageDef;
  onNavigate: (to: string) => void;
}

export const InfoPage: React.FC<InfoPageProps> = ({ page, onNavigate }) => {
  useEffect(() => {
    const prev = document.title;
    document.title = `${page.title} | ${SITE.name}`;
    const meta = document.querySelector('meta[name="description"]');
    const prevDesc = meta?.getAttribute('content') ?? '';
    meta?.setAttribute('content', page.description);
    const canonical = document.querySelector('link[rel="canonical"]');
    const prevCanon = canonical?.getAttribute('href') ?? '';
    canonical?.setAttribute('href', `${SITE.url}${page.path}`);
    return () => {
      document.title = prev;
      meta?.setAttribute('content', prevDesc);
      canonical?.setAttribute('href', prevCanon);
    };
  }, [page]);

  return (
    <article className="max-w-3xl mx-auto font-mono text-xs space-y-4 py-4">
      <nav aria-label="Breadcrumb" className="text-[11px] text-slate-400">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('/');
          }}
          className="hover:text-cyan-400"
        >
          Home
        </a>{' '}
        / <span className="text-slate-300">{page.title}</span>
      </nav>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{page.title}</h1>
      <div className="space-y-3 text-[13px]">{page.body}</div>
      <p className="pt-6 text-[11px] text-slate-400">Last updated {SITE.lastUpdated}</p>
    </article>
  );
};
