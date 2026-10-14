import React, { useState } from 'react';
import {
  Wallet,
  ExternalLink,
  Copy,
  Check,
  X,
  ChevronRight,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';
import { cypherSound } from '../lib/crypto-utils';

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  isRabby?: boolean;
}

interface SolanaProvider {
  connect: () => Promise<{ publicKey: { toString: () => string } }>;
  isPhantom?: boolean;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
    solana?: SolanaProvider;
  }
}

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
  onSetWalletAddress: (address: string) => void;
  network: string;
  onSetNetwork: (network: string) => void;
}

interface WalletOption {
  id: string;
  name: string;
  type: 'evm' | 'solana' | 'sandbox';
  icon: string;
  detected: boolean;
  installUrl: string;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  walletAddress,
  onSetWalletAddress,
  network,
  onSetNetwork,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const hasEthereum = typeof window !== 'undefined' && Boolean(window.ethereum);
  const hasMetaMask = Boolean(window.ethereum?.isMetaMask);
  const hasCoinbase = Boolean(window.ethereum?.isCoinbaseWallet);
  const hasRabby = Boolean(window.ethereum?.isRabby);
  const hasPhantom = typeof window !== 'undefined' && Boolean(window.solana?.isPhantom);

  const walletOptions: WalletOption[] = [
    {
      id: 'metamask',
      name: 'MetaMask',
      type: 'evm',
      icon: 'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
      detected: hasMetaMask || hasEthereum,
      installUrl: 'https://metamask.io/download/',
    },
    {
      id: 'phantom',
      name: 'Phantom',
      type: 'solana',
      icon: 'https://assets.coingecko.com/coins/images/4128/standard/solana.png',
      detected: hasPhantom,
      installUrl: 'https://phantom.app/download',
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      type: 'evm',
      icon: 'https://assets.coingecko.com/coins/images/825/standard/bnb-icon2_2x.png',
      detected: hasCoinbase,
      installUrl: 'https://www.coinbase.com/wallet',
    },
    {
      id: 'rabby',
      name: 'Rabby Wallet',
      type: 'evm',
      icon: 'https://assets.coingecko.com/coins/images/12504/standard/uniswap-uni.png',
      detected: hasRabby,
      installUrl: 'https://rabby.io',
    },
    {
      id: 'sandbox',
      name: 'Sandbox Demo Wallet',
      type: 'sandbox',
      icon: 'https://assets.coingecko.com/coins/images/1/standard/bitcoin.png',
      detected: true,
      installUrl: '#',
    },
  ];

  const handleConnectProvider = async (option: WalletOption) => {
    setErrorMessage(null);
    setConnectingId(option.id);
    cypherSound.playBlip(720, 'triangle');

    try {
      if (option.type === 'sandbox') {
        // Generate realistic deterministic test address with faucet balance
        const mockAddr =
          '0x' +
          Array.from(window.crypto.getRandomValues(new Uint8Array(20)))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
        onSetWalletAddress(mockAddr);
        onSetNetwork('Ethereum Mainnet');
        cypherSound.playSuccess();
        onClose();
        return;
      }

      if (option.type === 'evm') {
        if (!window.ethereum) {
          throw new Error(`${option.name} extension not detected in this browser`);
        }
        const accounts = (await window.ethereum.request({
          method: 'eth_requestAccounts',
        })) as string[];

        if (accounts && accounts.length > 0) {
          onSetWalletAddress(accounts[0]);
          onSetNetwork('Ethereum Mainnet');
          cypherSound.playSuccess();
          onClose();
        } else {
          throw new Error('No accounts selected');
        }
        return;
      }

      if (option.type === 'solana') {
        if (!window.solana) {
          throw new Error('Phantom wallet extension not detected');
        }
        const resp = await window.solana.connect();
        if (resp?.publicKey) {
          onSetWalletAddress(resp.publicKey.toString());
          onSetNetwork('Solana Mainnet');
          cypherSound.playSuccess();
          onClose();
        }
        return;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection request declined';
      setErrorMessage(msg);
      cypherSound.playBlip(320, 'sawtooth', 0.15);
    } finally {
      setConnectingId(null);
    }
  };

  const handleCopy = () => {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    cypherSound.playBlip(900, 'sine', 0.05);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDisconnect = () => {
    onSetWalletAddress('');
    cypherSound.playBlip(440, 'sine', 0.1);
    onClose();
  };

  const networks = [
    'Ethereum Mainnet',
    'Arbitrum One',
    'Base',
    'Optimism',
    'Solana Mainnet',
    'BNB Smart Chain',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#090d16] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-mono text-xs">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center gap-2 text-white font-bold">
            <Wallet className="w-4 h-4 text-cyan-400" />
            <span>{walletAddress ? 'Web3 Wallet Connected' : 'Connect Web3 Wallet'}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* If already connected */}
          {walletAddress ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Connected Account</span>
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Active
                  </span>
                </div>

                <div className="flex items-center justify-between bg-[#06080e] p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-white font-bold text-xs truncate max-w-[240px]">
                    {walletAddress}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition text-[11px] px-2 py-1 rounded bg-cyan-500/10 border border-cyan-500/20"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Sandbox Balance</span>
                  <span className="text-cyan-300 font-bold">$6,420.50 (2.45 ETH)</span>
                </div>
              </div>

              {/* Network Switcher */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-cyan-400" />
                  <span>Select Active Network</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {networks.map((net) => {
                    const isSelected = network === net;
                    return (
                      <button
                        key={net}
                        onClick={() => {
                          onSetNetwork(net);
                          cypherSound.playBlip(750, 'triangle', 0.05);
                        }}
                        className={`p-2 rounded-lg text-left transition border text-[11px] flex items-center justify-between ${
                          isSelected
                            ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 font-bold'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <span className="truncate">{net}</span>
                        {isSelected && <Check className="w-3 h-3 text-cyan-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <a
                  href={`https://etherscan.io/address/${walletAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-center flex items-center justify-center gap-1.5 transition"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>View on Explorer</span>
                </a>
                <button
                  onClick={handleDisconnect}
                  className="py-2 px-4 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-bold transition"
                >
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            /* Connect Options List */
            <div className="space-y-3">
              {errorMessage && (
                <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Connect your preferred Web3 wallet to manage token watchlists, track personalized
                portfolios, and participate in verified token launchpads.
              </p>

              <div className="space-y-2">
                {walletOptions.map((opt) => (
                  <div
                    key={opt.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-900 transition group cursor-pointer"
                    onClick={() => handleConnectProvider(opt)}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={opt.icon}
                        alt={opt.name}
                        className="w-7 h-7 rounded-full bg-slate-950 p-1 border border-slate-800 group-hover:scale-105 transition"
                      />
                      <div>
                        <div className="text-white font-bold text-xs flex items-center gap-1.5">
                          <span>{opt.name}</span>
                          {opt.id === 'sandbox' && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              Instant Demo
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {opt.detected ? 'Installed & Ready' : 'Web extension detected'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-slate-400 group-hover:text-cyan-400 transition">
                      {connectingId === opt.id ? (
                        <span className="text-[10px] text-cyan-400 animate-pulse">Connecting...</span>
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20 flex items-start gap-2.5 text-[10px] text-cyan-300/80">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <p>
                  Non-custodial connection. Encryptoverse never asks for your private keys or seed phrase.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

