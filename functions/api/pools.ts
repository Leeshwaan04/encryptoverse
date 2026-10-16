import { cached, type Ctx } from '../_lib';
import { fetchJson, num } from '../_providers/http';

interface GtPool {
  id: string;
  attributes: {
    name: string;
    address: string;
    pool_created_at?: string;
    base_token_price_usd?: string;
    reserve_in_usd?: string;
    fdv_usd?: string | null;
    price_change_percentage?: { h24?: string };
    volume_usd?: { h24?: string };
    transactions?: { h24?: { buys?: number; sells?: number } };
  };
  relationships?: { network?: { data?: { id: string } }; dex?: { data?: { id: string } } };
}

// GET /api/pools -> newly created DEX pools across chains (GeckoTerminal, free, keyless). Cached 5 min.
// Brand-new tokens are high risk, so liquidity and age are returned for the UI to show prominently.
export const onRequestGet = (ctx: Ctx) =>
  cached(ctx, 300, async () => {
    const body = await fetchJson<{ data?: GtPool[] }>('https://api.geckoterminal.com/api/v2/networks/new_pools?page=1');
    const pools = (body.data ?? []).map((p) => {
      const a = p.attributes;
      const network = p.relationships?.network?.data?.id ?? '';
      return {
        name: String(a.name).slice(0, 60),
        network,
        dex: p.relationships?.dex?.data?.id ?? '',
        createdAt: a.pool_created_at ?? null,
        priceUsd: num(a.base_token_price_usd, 0),
        liquidityUsd: num(a.reserve_in_usd, 0),
        fdvUsd: a.fdv_usd == null ? null : num(a.fdv_usd, 0),
        change24h: num(a.price_change_percentage?.h24, 0),
        volume24hUsd: num(a.volume_usd?.h24, 0),
        txns24h: num(a.transactions?.h24?.buys, 0) + num(a.transactions?.h24?.sells, 0),
        url: `https://www.geckoterminal.com/${encodeURIComponent(network)}/pools/${encodeURIComponent(a.address)}`,
      };
    });
    if (pools.length === 0) throw new Error('GeckoTerminal returned no pools');
    return { data: { pools }, source: 'GeckoTerminal' };
  });
