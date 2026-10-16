import { cached, type Ctx } from '../_lib';
import { llamaChains, llamaStablecoinChains } from '../_providers/defillama';
import { fetchJson } from '../_providers/http';

interface SnapshotProposal {
  id: string;
  title: string;
  end: number;
  space?: { id: string; name: string };
}

// GET /api/defi -> DeFi snapshot from open data: chain TVL ranking and stablecoin supply by chain (DefiLlama)
// plus active governance votes (Snapshot). Cached 10 min.
export const onRequestGet = (ctx: Ctx) =>
  cached(ctx, 600, async () => {
    const [chains, stables, gov] = await Promise.allSettled([
      llamaChains(),
      llamaStablecoinChains(),
      fetchJson<{ data?: { proposals?: SnapshotProposal[] } }>(
        'https://hub.snapshot.org/graphql?query=' +
          encodeURIComponent('{proposals(first:8,where:{state:"active"},orderBy:"created",orderDirection:desc){id title end space{id name}}}'),
      ),
    ]);
    if (chains.status === 'rejected' && stables.status === 'rejected') throw new Error('DefiLlama unavailable');

    const chainRows = chains.status === 'fulfilled' ? chains.value : [];
    const totalTvl = chainRows.reduce((s, c) => s + c.tvl, 0);
    const stableRows = stables.status === 'fulfilled' ? stables.value : [];
    const proposals = gov.status === 'fulfilled' ? (gov.value.data?.proposals ?? []) : [];

    return {
      data: {
        totalTvl,
        chains: chainRows.slice(0, 15).map((c) => ({ ...c, share: totalTvl > 0 ? c.tvl / totalTvl : 0 })),
        stablecoins: {
          total: stableRows.reduce((s, c) => s + c.circulating, 0),
          chains: stableRows.slice(0, 10),
        },
        governance: proposals
          .filter((p) => p.id && p.title && p.space?.id)
          .map((p) => ({ title: p.title.slice(0, 140), space: p.space?.name ?? p.space?.id, endsAt: new Date(p.end * 1000).toISOString(), url: `https://snapshot.box/#/s:${p.space?.id}/proposal/${p.id}` })),
      },
      source: 'DefiLlama · Snapshot',
    };
  });
