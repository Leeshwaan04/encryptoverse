import { cached, type Ctx } from '../_lib';

const RPCS = ['https://ethereum-rpc.publicnode.com', 'https://cloudflare-eth.com', 'https://eth.llamarpc.com'];

async function gasPriceWei(): Promise<bigint> {
  let lastErr: unknown;
  for (const rpc of RPCS) {
    try {
      const res = await fetch(rpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_gasPrice', params: [] }),
      });
      if (!res.ok) throw new Error(`${rpc} HTTP ${res.status}`);
      const j = (await res.json()) as { result?: string };
      if (!j.result) throw new Error(`${rpc} no result`);
      return BigInt(j.result);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('All Ethereum RPCs failed');
}

// GET /api/gas -> Ethereum mainnet gas price in Gwei (eth_gasPrice over public RPC), cached 30s
export const onRequestGet = (ctx: Ctx) =>
  cached(ctx, 30, async () => {
    const wei = await gasPriceWei();
    // Wei -> Gwei with 3 decimals, no float precision loss on the integer part
    const gwei = Number((wei * 1000n) / 1_000_000_000n) / 1000;
    return { gwei, network: 'Ethereum mainnet', source: 'public JSON-RPC eth_gasPrice' };
  });
