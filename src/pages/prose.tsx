import React from 'react';

export const H2: React.FC<React.PropsWithChildren> = ({ children }) => (
  <h2 className="text-base font-bold text-white pt-4">{children}</h2>
);
export const P: React.FC<React.PropsWithChildren> = ({ children }) => <p className="text-slate-300 leading-relaxed">{children}</p>;
export const UL: React.FC<React.PropsWithChildren> = ({ children }) => <ul className="list-disc pl-5 space-y-1.5 text-slate-300 leading-relaxed">{children}</ul>;
export const A: React.FC<React.PropsWithChildren<{ href: string }>> = ({ href, children }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300">
    {children}
  </a>
);

