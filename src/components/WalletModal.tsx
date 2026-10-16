import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  FlaskConical,
  ShieldCheck,
} from 'lucide-react';
import { cypherSound } from '../lib/crypto-utils';
import { Modal } from './Modal';

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  isRabby?: boolean;
}

interface SolanaProvider {
  connect: () => Promise<{ publicKey: { toString: () => string } }>;
  disconnect?: () => Promise<void>;
  isPhantom?: boolean;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
    solana?: SolanaProvider;
    phantom?: { solana?: SolanaProvider };
  }
}

/** EIP-6963 lets each extension announce itself, so we address the one the user picked. */
interface ProviderDetail {
  info: { uuid: string; name: string; icon: string; rdns: string };
  provider: EthereumProvider;
}

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
  onSetWalletAddress: (address: string) => void;
  network: string;
  onSetNetwork: (network: string) => void;
}

interface EvmChain {
  name: string;
  chainId: string;
  explorer: string;
}

const EVM_CHAINS: EvmChain[] = [
  { name: 'Ethereum Mainnet', chainId: '0x1', explorer: 'https://etherscan.io/address/' },
  { name: 'Arbitrum One', chainId: '0xa4b1', explorer: 'https://arbiscan.io/address/' },
  { name: 'Base', chainId: '0x2105', explorer: 'https://basescan.org/address/' },
  { name: 'Optimism', chainId: '0xa', explorer: 'https://optimistic.etherscan.io/address/' },
  { name: 'BNB Smart Chain', chainId: '0x38', explorer: 'https://bscscan.com/address/' },
  { name: 'Polygon PoS', chainId: '0x89', explorer: 'https://polygonscan.com/address/' },
];

const SOLANA = { name: 'Solana Mainnet', explorer: 'https://solscan.io/account/' };

const INSTALL_LINKS = [
  { name: 'MetaMask', rdns: 'io.metamask', url: 'https://metamask.io/download/' },
  { name: 'Coinbase Wallet', rdns: 'com.coinbase.wallet', url: 'https://www.coinbase.com/wallet/downloads' },
  { name: 'Rabby', rdns: 'io.rabby', url: 'https://rabby.io' },
  { name: 'Phantom', rdns: 'app.phantom', url: 'https://phantom.com/download' },
];

type Session =
  | { kind: 'evm'; name: string; provider: EthereumProvider }
  | { kind: 'solana'; name: string; provider: SolanaProvider }
  | { kind: 'demo'; name: string };

const chainById = (id: string) => EVM_CHAINS.find((c) => c.chainId.toLowerCase() === id.toLowerCase());

const isProviderDetail = (d: unknown): d is ProviderDetail => {
  const x = d as ProviderDetail;
  return !!x?.info?.uuid && typeof x.info.name === 'string' && typeof x.provider?.request === 'function';
};

const Avatar: React.FC<{ name: string; icon?: string }> = ({ name, icon }) =>
  icon ? (
    <img src={icon} alt="" className="w-8 h-8 rounded-lg bg-slate-950 p-0.5 border border-slate-800" />
  ) : (
    <span
      aria-hidden="true"
      className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-slate-200"
    >
      {name.charAt(0)}
    </span>
  );

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  walletAddress,
  onSetWalletAddress,
  network,
  onSetNetwork,
}) => {
  const [detected, setDetected] = useState<ProviderDetail[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Wallet event listeners outlive individual renders, so they read through a ref.
  const cb = useRef({ onSetWalletAddress, onSetNetwork });
  useEffect(() => {
    cb.current = { onSetWalletAddress, onSetNetwork };
  });

  useEffect(() => {
    const onAnnounce = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!isProviderDetail(detail)) return;
      setDetected((prev) => (prev.some((p) => p.info.uuid === detail.info.uuid) ? prev : [...prev, detail]));
    };
    window.addEventListener('eip6963:announceProvider', onAnnounce);
    window.dispatchEvent(new Event('eip6963:requestProvider'));
    return () => window.removeEventListener('eip6963:announceProvider', onAnnounce);
  }, []);

  // Follow account and chain changes made inside the wallet itself.
  useEffect(() => {
    if (session?.kind !== 'evm') return;
    const { provider } = session;
    const onAccounts = (...args: unknown[]) => {
      const accounts = args[0] as string[] | undefined;
      if (!accounts?.length) {
        cb.current.onSetWalletAddress('');
        setSession(null);
      } else {
        cb.current.onSetWalletAddress(accounts[0]);
      }
    };
    const onChain = (...args: unknown[]) => {
      const raw = String(args[0]);
      const chain = chainById(raw);
      cb.current.onSetNetwork(chain ? chain.name : `Chain ${Number.parseInt(raw, 16)}`);
    };
    provider.on?.('accountsChanged', onAccounts);
    provider.on?.('chainChanged', onChain);
    return () => {
      provider.removeListener?.('accountsChanged', onAccounts);
      provider.removeListener?.('chainChanged', onChain);
    };
  }, [session]);

  if (!isOpen) return null;

  const phantom = window.phantom?.solana ?? (window.solana?.isPhantom ? window.solana : undefined);
  // Only fall back to window.ethereum when no wallet announced itself properly.
  const legacyEvm = detected.length === 0 ? window.ethereum : undefined;

  const fail = (err: unknown) => {
    const code = (err as { code?: number })?.code;
    setError(
      code === 4001
        ? 'Request rejected in your wallet.'
        : code === 4902
          ? 'That network is not configured in your wallet yet. Add it there, then try again.'
          : err instanceof Error
            ? err.message
            : 'The wallet request failed.'
    );
    cypherSound.playBlip(320, 'sawtooth', 0.15);
  };

  const connectEvm = async (name: string, provider: EthereumProvider) => {
    setError(null);
    setBusy(name);
    try {
      const accounts = (await provider.request({ method: 'eth_requestAccounts' })) as string[];
      if (!accounts?.length) throw new Error('No account was selected.');
      const chainId = String(await provider.request({ method: 'eth_chainId' }));
      const chain = chainById(chainId);
      setSession({ kind: 'evm', name, provider });
      onSetWalletAddress(accounts[0]);
      onSetNetwork(chain ? chain.name : `Chain ${Number.parseInt(chainId, 16)}`);
      cypherSound.playSuccess();
    } catch (err) {
      fail(err);
    } finally {
      setBusy(null);
    }
  };

  const connectSolana = async (provider: SolanaProvider) => {
    setError(null);
    setBusy('Phantom');
    try {
      const res = await provider.connect();
      setSession({ kind: 'solana', name: 'Phantom', provider });
      onSetWalletAddress(res.publicKey.toString());
      onSetNetwork(SOLANA.name);
      cypherSound.playSuccess();
    } catch (err) {
      fail(err);
    } finally {
      setBusy(null);
    }
  };

  const connectDemo = () => {
    setError(null);
    const addr =
      '0x' +
      Array.from(window.crypto.getRandomValues(new Uint8Array(20)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    setSession({ kind: 'demo', name: 'Demo wallet' });
    onSetWalletAddress(addr);
    onSetNetwork('Ethereum Mainnet');
    cypherSound.playSuccess();
  };

  const switchNetwork = async (chain: EvmChain) => {
    setError(null);
    if (session?.kind === 'evm') {
      setBusy(chain.name);
      try {
        await session.provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: chain.chainId }] });
        onSetNetwork(chain.name);
      } catch (err) {
        fail(err);
      } finally {
        setBusy(null);
      }
    } else {
      onSetNetwork(chain.name);
    }
    cypherSound.playBlip(750, 'triangle', 0.05);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      cypherSound.playBlip(900, 'sine', 0.05);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('The browser blocked clipboard access.');
    }
  };

  const disconnect = async () => {
    if (session?.kind === 'evm') {
      // Best effort: ask the wallet to forget this site entirely.
      await session.provider
        .request({ method: 'wallet_revokePermissions', params: [{ eth_accounts: {} }] })
        .catch(() => undefined);
    } else if (session?.kind === 'solana') {
      await session.provider.disconnect?.().catch(() => undefined);
    }
    setSession(null);
    onSetWalletAddress('');
    cypherSound.playBlip(440, 'sine', 0.1);
    onClose();
  };

  const isDemo = session?.kind === 'demo';
  const explorerBase =
    network === SOLANA.name ? SOLANA.explorer : (EVM_CHAINS.find((c) => c.name === network)?.explorer ?? EVM_CHAINS[0].explorer);

  const notInstalled = INSTALL_LINKS.filter(
    (w) =>
      !detected.some((d) => d.info.rdns.startsWith(w.rdns)) &&
      !(w.rdns === 'app.phantom' && phantom) &&
      !(
        legacyEvm &&
        ((w.rdns === 'io.metamask' && legacyEvm.isMetaMask) ||
          (w.rdns === 'io.rabby' && legacyEvm.isRabby) ||
          (w.rdns === 'com.coinbase.wallet' && legacyEvm.isCoinbaseWallet))
      )
  );

  const optionClass =
    'w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 transition text-left disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400';

  return (
    <Modal
      onClose={onClose}
      closeLabel="Close wallet dialog"
      maxWidth="max-w-md"
      title={<h2 className="text-base font-bold text-white">{walletAddress ? 'Wallet connected' : 'Connect a wallet'}</h2>}
    >
      <div className="space-y-4 text-sm">
        {error && (
          <div role="alert" className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {walletAddress ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                <span>{session?.name ?? 'Connected account'}</span>
                {isDemo ? (
                  <span className="flex items-center gap-1 text-amber-300 font-semibold">
                    <FlaskConical className="w-3.5 h-3.5" aria-hidden="true" /> Demo
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true" />
                    {network}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 bg-[#06080e] p-2.5 rounded-lg border border-slate-800">
                <span className="text-white font-mono text-xs break-all">{walletAddress}</span>
                <button
                  type="button"
                  onClick={copy}
                  className="shrink-0 flex items-center gap-1 text-cyan-200 text-xs px-2 h-9 rounded-md bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>

              {isDemo && (
                <p className="text-xs text-amber-200/90">
                  A randomly generated address for exploring the interface. It holds no funds and cannot sign anything.
                </p>
              )}
            </div>

            {session?.kind !== 'solana' && (
              <fieldset>
                <legend className="text-xs text-slate-400 mb-2">
                  {isDemo ? 'Preview network' : 'Switch network'}
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  {EVM_CHAINS.map((chain) => {
                    const selected = network === chain.name;
                    return (
                      <button
                        key={chain.chainId}
                        type="button"
                        aria-pressed={selected}
                        disabled={busy !== null}
                        onClick={() => void switchNetwork(chain)}
                        className={`p-2.5 min-h-11 rounded-lg text-left transition border text-xs flex items-center justify-between gap-1 ${
                          selected
                            ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-100 font-semibold'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <span className="truncate">{busy === chain.name ? 'Confirm in wallet' : chain.name}</span>
                        {selected && <Check className="w-3.5 h-3.5 text-cyan-300 shrink-0" aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}

            <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
              {!isDemo && (
                <a
                  href={`${explorerBase}${walletAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 h-11 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  Explorer
                </a>
              )}
              <button
                type="button"
                onClick={() => void disconnect()}
                className="flex-1 h-11 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-200 border border-rose-500/30 font-semibold"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-slate-300 leading-relaxed">
              Connecting shares only your public address. Encryptoverse never requests signatures, transactions, private
              keys or seed phrases.
            </p>

            <ul className="space-y-2">
              {detected.map(({ info, provider }) => (
                <li key={info.uuid}>
                  <button type="button" disabled={busy !== null} onClick={() => void connectEvm(info.name, provider)} className={optionClass}>
                    <span className="flex items-center gap-3">
                      {/* Only data: icons are rendered; a remote URL here would be an unvetted third-party fetch. */}
                      <Avatar name={info.name} icon={info.icon?.startsWith('data:image/') ? info.icon : undefined} />
                      <span>
                        <span className="block font-semibold text-white">{info.name}</span>
                        <span className="block text-xs text-emerald-300">Installed</span>
                      </span>
                    </span>
                    {busy === info.name ? (
                      <span className="text-xs text-cyan-300">Check your wallet</span>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
                    )}
                  </button>
                </li>
              ))}

              {legacyEvm && (
                <li>
                  <button type="button" disabled={busy !== null} onClick={() => void connectEvm('Browser wallet', legacyEvm)} className={optionClass}>
                    <span className="flex items-center gap-3">
                      <Avatar name="Browser wallet" />
                      <span>
                        <span className="block font-semibold text-white">Browser wallet</span>
                        <span className="block text-xs text-emerald-300">Installed</span>
                      </span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
                  </button>
                </li>
              )}

              {phantom && (
                <li>
                  <button type="button" disabled={busy !== null} onClick={() => void connectSolana(phantom)} className={optionClass}>
                    <span className="flex items-center gap-3">
                      <Avatar name="Phantom" />
                      <span>
                        <span className="block font-semibold text-white">Phantom</span>
                        <span className="block text-xs text-emerald-300">Installed · Solana</span>
                      </span>
                    </span>
                    {busy === 'Phantom' ? (
                      <span className="text-xs text-cyan-300">Check your wallet</span>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
                    )}
                  </button>
                </li>
              )}

              <li>
                <button type="button" onClick={connectDemo} className={optionClass}>
                  <span className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                      <FlaskConical className="w-4 h-4 text-amber-300" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block font-semibold text-white">Try a demo wallet</span>
                      <span className="block text-xs text-slate-400">No extension, no real funds</span>
                    </span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
                </button>
              </li>
            </ul>

            {notInstalled.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs text-slate-400">Not installed</h3>
                <ul className="grid grid-cols-2 gap-2">
                  {notInstalled.map((w) => (
                    <li key={w.rdns}>
                      <a
                        href={w.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-2 p-2.5 min-h-11 rounded-lg border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900 text-xs"
                      >
                        <span className="truncate">{w.name}</span>
                        <Download className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span className="sr-only">Install {w.name}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20 flex items-start gap-2.5 text-xs text-cyan-100/80">
              <ShieldCheck className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" aria-hidden="true" />
              <p>Read-only connection. Install wallets only from their official sites, linked above.</p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
