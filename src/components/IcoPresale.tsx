import React, { useState, useEffect } from 'react';
import {
  Coins,
  Wallet,
  Timer,
  TrendingUp,
  CheckCircle,
  Copy,
  Check,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { cypherSound } from '../lib/crypto-utils';
import confetti from 'canvas-confetti';

export const IcoPresale: React.FC = () => {
  // Presale stats
  const tokenSymbol = '$ECV';
  const tokenName = 'Encryptoverse Token';
  const currentStage = 2;
  const currentPrice = 0.035; // USD
  const nextStagePrice = 0.050; // USD
  const listingPrice = 0.080; // USD
  const totalRaiseTarget = 2500000; // $2.5M USD
  const [raisedAmount, setRaisedAmount] = useState<number>(1648250);

  // Time remaining countdown (e.g. 3 days 14 hours 22 mins)
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number }>({
    d: 3,
    h: 14,
    m: 22,
    s: 45,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.s > 0) return { ...prev, s: prev.s - 1 };
        if (prev.m > 0) return { ...prev, m: 59, s: 59 };
        if (prev.h > 0) return { ...prev, h: prev.h - 1, m: 59, s: 59 };
        if (prev.d > 0) return { ...prev, d: prev.d - 1, h: 23, m: 59, s: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Purchase Calculator State
  const [paymentCurrency, setPaymentCurrency] = useState<'ETH' | 'USDT' | 'USDC' | 'SOL'>('ETH');
  const [payAmount, setPayAmount] = useState<string>('0.5');
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [isPurchasing, setIsPurchasing] = useState<boolean>(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<boolean>(false);
  const [copiedContract, setCopiedContract] = useState<boolean>(false);

  // Currency exchange rates for simulation
  const rates = {
    ETH: 3200,
    USDT: 1.0,
    USDC: 1.0,
    SOL: 160,
  };

  const rawVal = parseFloat(payAmount);
  const parsedPay = isNaN(rawVal) || rawVal < 0 ? 0 : rawVal;
  const usdValue = parsedPay * rates[paymentCurrency];
  const baseTokens = Math.floor(usdValue / currentPrice);
  const bonusRate = usdValue >= 1000 ? 0.15 : usdValue >= 250 ? 0.08 : 0.03;
  const bonusTokens = Math.floor(baseTokens * bonusRate);
  const totalTokens = baseTokens + bonusTokens;

  const contractAddress = '0x71C9F4E7e6c3F6C3b5a195487B2E3d71ec902026';

  const handleConnectWallet = () => {
    cypherSound.playBlip(750, 'triangle');
    // Simulated web3 wallet connection
    const mockAddr = '0x' + Array.from(window.crypto.getRandomValues(new Uint8Array(20)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    setWalletAddress(mockAddr.slice(0, 6) + '...' + mockAddr.slice(-4));
    setIsWalletConnected(true);
  };

  const handleBuyTokens = () => {
    if (!isWalletConnected) {
      handleConnectWallet();
      return;
    }
    if (parsedPay <= 0) return;

    setIsPurchasing(true);
    cypherSound.playBlip(620, 'sawtooth', 0.15);

    setTimeout(() => {
      setIsPurchasing(false);
      setPurchaseSuccess(true);
      setRaisedAmount((prev) => prev + usdValue);
      cypherSound.playSuccess();
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
    }, 1200);
  };

  const percentRaised = Math.min(100, (raisedAmount / totalRaiseTarget) * 100);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-mono font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              Public Presale Live · Stage 0{currentStage}
            </span>
            <span className="text-xs font-mono text-purple-400 font-bold">1 {tokenSymbol} = ${currentPrice} (Next: ${nextStagePrice})</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            {tokenName} ({tokenSymbol}) ICO
          </h3>
          <p className="text-sm text-slate-400 font-mono">
            Empowering client-side Zero-Knowledge provers, quantum-proof data vaults, and decentralized governance.
          </p>
        </div>

        {/* Contract Address Pill */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono">
          <span className="text-slate-500 pl-1 hidden sm:inline">Contract:</span>
          <code className="text-cyan-300 font-bold px-1.5">
            {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
          </code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(contractAddress);
              setCopiedContract(true);
              cypherSound.playBlip(800, 'sine', 0.05);
              setTimeout(() => setCopiedContract(false), 2000);
            }}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Copy Contract Address"
          >
            {copiedContract ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Grid: Presale Card & Cyphernomics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Interactive Presale Terminal (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Presale Progress Bar & Timer */}
          <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs text-slate-400 font-mono block">Total Raised / Soft Cap:</span>
                <span className="text-xl sm:text-2xl font-extrabold text-white font-mono">
                  ${raisedAmount.toLocaleString()} <span className="text-slate-500 text-sm font-normal">/ ${totalRaiseTarget.toLocaleString()}</span>
                </span>
              </div>

              {/* Countdown clock */}
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <Timer className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-slate-400">Stage Price Increase:</span>
                <div className="flex gap-1 text-amber-300 font-bold">
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">{timeLeft.d}d</span>:
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">{timeLeft.h}h</span>:
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">{timeLeft.m}m</span>:
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">{timeLeft.s}s</span>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div
                  className="bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 h-full rounded-full transition-all duration-700 shadow-lg shadow-cyan-500/30"
                  style={{ width: `${percentRaised}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 mt-1.5">
                <span>Stage 1: $0.020 (Completed)</span>
                <span className="text-cyan-400 font-bold">{percentRaised.toFixed(1)}% Sold</span>
                <span>Listing: ${listingPrice} (+128% Upside)</span>
              </div>
            </div>
          </div>

          {/* Interactive Token Buy Interface */}
          <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-cyan-400" /> Token Purchase Portal
              </span>
              <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Audited & Verified
              </div>
            </div>

            {/* Currency selector buttons */}
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1.5">Select Payment Asset:</label>
              <div className="grid grid-cols-4 gap-2 font-mono text-xs">
                {(['ETH', 'USDT', 'USDC', 'SOL'] as const).map((curr) => (
                  <button
                    key={curr}
                    onClick={() => {
                      setPaymentCurrency(curr);
                      cypherSound.playBlip(550, 'sine', 0.04);
                    }}
                    className={`py-2 px-3 rounded-lg border font-bold transition flex items-center justify-center gap-1.5 ${
                      paymentCurrency === curr
                        ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 shadow-md shadow-cyan-500/10'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <span>{curr}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount input & conversion */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">
                  You Pay ({paymentCurrency}):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-sm text-white focus:outline-none focus:border-cyan-500 transition"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-500">
                    ≈ ${usdValue.toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">
                  You Receive ({tokenSymbol}):
                </label>
                <div className="px-3 py-2.5 rounded-lg bg-slate-900/60 border border-slate-800 font-mono text-sm text-cyan-300 flex items-center justify-between">
                  <span className="font-bold">{totalTokens.toLocaleString()}</span>
                  <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    +{(bonusRate * 100).toFixed(0)}% Bonus
                  </span>
                </div>
              </div>
            </div>

            {/* Bonus tier badge */}
            <div className="p-2.5 rounded-lg bg-cyan-950/20 border border-cyan-800/30 text-xs font-mono text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-cyan-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Active Cypherpunk Tier Bonus:
              </span>
              <span className="text-amber-400 font-bold">+{bonusTokens.toLocaleString()} $ECV Extra</span>
            </div>

            {/* Action Button: Connect or Buy */}
            <div className="space-y-2 pt-1">
              {!isWalletConnected ? (
                <button
                  onClick={handleConnectWallet}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-mono text-sm font-bold shadow-lg shadow-cyan-500/25 transition flex items-center justify-center gap-2"
                >
                  <Wallet className="w-4 h-4" /> Connect Web3 Wallet to Purchase
                </button>
              ) : (
                <button
                  onClick={handleBuyTokens}
                  disabled={isPurchasing}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-mono text-sm font-bold shadow-lg shadow-emerald-500/25 transition flex items-center justify-center gap-2"
                >
                  <Coins className="w-4 h-4 fill-current" />
                  {isPurchasing ? 'Processing Smart Contract Swap...' : `Confirm & Acquire ${totalTokens.toLocaleString()} $ECV`}
                </button>
              )}

              {isWalletConnected && (
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 px-1">
                  <span>Connected: <strong className="text-slate-300">{walletAddress}</strong></span>
                  <button
                    onClick={() => setIsWalletConnected(false)}
                    className="text-slate-400 hover:text-rose-400 transition"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>

            {/* Success Confirmation Modal / Banner */}
            {purchaseSuccess && (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/50 font-mono text-xs text-emerald-200 space-y-1 animate-fadeIn">
                <div className="flex items-center gap-2 font-bold text-emerald-300 text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Presale Allocation Confirmed!
                </div>
                <p className="text-[11px] text-slate-300">
                  You successfully acquired <strong>{totalTokens.toLocaleString()} $ECV</strong> at ${currentPrice}/token. Tokens will be automatically claimable or airdropped upon Token Generation Event (TGE).
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Tokenomics & Utility Matrix (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Cyphernomics Allocation Card */}
          <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-purple-400" /> Cyphernomics (Tokenomics)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40">
                1B Total Supply
              </span>
            </div>

            {/* Allocation Breakdown */}
            <div className="space-y-2.5 font-mono text-xs">
              {[
                { label: 'Public ICO / Presale', percent: 35, color: 'bg-cyan-400', desc: 'Linear unlock over 6 months' },
                { label: 'ZK & Post-Quantum R&D', percent: 20, color: 'bg-indigo-400', desc: 'Protocol development & security' },
                { label: 'Staking & Privacy Rewards', percent: 18, color: 'bg-purple-400', desc: 'Incentivize honest ZK verifiers' },
                { label: 'CTF Quests & Bug Bounties', percent: 12, color: 'bg-amber-400', desc: 'Community hackers & cryptanalysts' },
                { label: 'Core Cypherpunks & Team', percent: 10, color: 'bg-emerald-400', desc: '18-month vesting with 6m cliff' },
                { label: 'DEX/CEX Launch Liquidity', percent: 5, color: 'bg-rose-400', desc: 'Locked permanently in Uniswap/Raydium' },
              ].map((item, idx) => (
                <div key={idx} className="p-2 rounded-lg bg-slate-900 border border-slate-800/60 space-y-1">
                  <div className="flex justify-between items-center text-slate-200">
                    <span className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                      {item.label}
                    </span>
                    <span className="font-bold text-white">{item.percent}%</span>
                  </div>
                  <div className="text-[10px] text-slate-500 pl-4">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Token Utility Features */}
          <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 font-mono text-xs">
            <h4 className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> $ECV Ecosystem Utilities:
            </h4>
            <ul className="space-y-2 text-[11px] text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">1.</span>
                <span><strong>ZK-Proof Gas Discount:</strong> 50% discount on client & server-side zero-knowledge proof generation and verification.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">2.</span>
                <span><strong>Quantum-Proof Storage Vaults:</strong> Stake $ECV to unlock end-to-end encrypted decentralized IPFS/Arweave cloud storage quotas.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">3.</span>
                <span><strong>DAO Governance:</strong> Vote on proposed cryptographic primitives, CTF bounties, and protocol treasury grants.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
