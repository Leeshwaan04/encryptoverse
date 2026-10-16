import type { Ctx } from '../_lib';

// GET /api/icon?s=SYM -> deterministic letter avatar (SVG) for coins without an open-source logo.
export const onRequestGet = (ctx: Ctx) => {
  const raw = new URL(ctx.request.url).searchParams.get('s') ?? '?';
  const sym = raw.replace(/[^a-z0-9]/gi, '').slice(0, 10).toUpperCase() || '?';
  let h = 0;
  for (const c of sym) h = (h * 31 + c.charCodeAt(0)) % 360;
  const label = sym.length <= 4 ? sym : sym.slice(0, 3);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${h},70%,45%)"/><stop offset="1" stop-color="hsl(${(h + 50) % 360},70%,30%)"/></linearGradient></defs>` +
    `<circle cx="32" cy="32" r="32" fill="url(#g)"/>` +
    `<text x="32" y="38" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="700" font-size="${label.length > 3 ? 18 : label.length > 2 ? 21 : 26}" fill="#fff">${label}</text></svg>`;
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400', 'X-Content-Type-Options': 'nosniff' } });
};
