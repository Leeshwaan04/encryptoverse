import React, { useState, useEffect } from 'react';
import {
  Shield,
  Sparkles,
  ArrowRight,
  Terminal,
  Lock,
  Cpu,
  Binary
} from 'lucide-react';
import { computeSha256, encryptText, cypherSound } from '../lib/crypto-utils';

interface HeroProps {
  onExplore: (section: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onExplore }) => {
  const [heroInput, setHeroInput] = useState<string>('Encryptoverse');
  const [shaHash, setShaHash] = useState<string>('');
  const [binaryStream, setBinaryStream] = useState<string>('');
  const [sampleEncrypted, setSampleEncrypted] = useState<string>('');

  useEffect(() => {
    let isCancelled = false;
    const processCrypto = async () => {
      const { hex, binary } = await computeSha256(heroInput || ' ');
      if (!isCancelled) {
        setShaHash(hex);
        setBinaryStream(binary.slice(0, 32));
      }
      try {
        const enc = await encryptText(heroInput || ' ', 'cypher-key');
        if (!isCancelled) {
          setSampleEncrypted(enc.slice(0, 28) + '...');
        }
      } catch {
        // Fallback
      }
    };
    processCrypto();
    return () => {
      isCancelled = true;
    };
  }, [heroInput]);

  return (
    <section className="relative pt-12 pb-20 overflow-hidden">
      {/* Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-500/10 via-purple-500/10 to-indigo-500/0 blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-5xl mx-auto px-4 text-center relative z-10 space-y-6">
        {/* Top Badges */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 backdrop-blur-md shadow-xl text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-slate-300">The Interactive Cryptography Holodeck</span>
          <span className="text-slate-600">|</span>
          <span className="text-cyan-400 font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> WebAssembly & Zero-Knowledge
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
          Explore the Hidden Math of <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent">
            Privacy & Encryption
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed font-light">
          Simulate <strong>Elliptic Curve</strong> point additions, interact with <strong>Zero-Knowledge</strong> sigma proofs, inspect <strong>Post-Quantum Lattices</strong>, and test client-side ciphers without trusting any third party.
        </p>

        {/* Call to Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => {
              onExplore('ico');
              cypherSound.playBlip(800, 'triangle');
            }}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-mono text-xs sm:text-sm font-bold shadow-lg shadow-amber-500/25 transition duration-200 flex items-center gap-2 group"
          >
            <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
            Join $ECV Presale ($0.035)
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition duration-200" />
          </button>

          <button
            onClick={() => {
              onExplore('holodeck');
              cypherSound.playBlip(750);
            }}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono text-xs sm:text-sm font-bold shadow-lg shadow-cyan-500/25 transition duration-200 flex items-center gap-2 group"
          >
            The Holodeck
          </button>

          <button
            onClick={() => {
              onExplore('zklab');
              cypherSound.playBlip(650);
            }}
            className="px-6 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-mono text-xs sm:text-sm font-semibold transition flex items-center gap-2"
          >
            <Shield className="w-4 h-4 text-emerald-400" />
            ZK Lab
          </button>

          <button
            onClick={() => {
              onExplore('suite');
              cypherSound.playBlip(550);
            }}
            className="px-6 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-mono text-xs sm:text-sm font-semibold transition flex items-center gap-2"
          >
            <Lock className="w-4 h-4 text-purple-400" />
            Cypher Vault
          </button>
        </div>

        {/* Live Interactive Hero Cypher Console */}
        <div className="pt-8 max-w-3xl mx-auto">
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-2xl backdrop-blur-xl text-left font-mono">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  Live Cypher Engine: Real-Time Transformations
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>WebCrypto Native</span>
              </div>
            </div>

            {/* Input prompt */}
            <div className="mb-4">
              <label className="text-[11px] text-slate-500 block mb-1">
                Type anything to watch cryptographic bit transformation in real time:
              </label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm">
                <span className="text-cyan-400 font-bold">{'>'}</span>
                <input
                  type="text"
                  value={heroInput}
                  onChange={(e) => {
                    setHeroInput(e.target.value);
                    cypherSound.playBlip(600 + (e.target.value.length % 8) * 40, 'sine', 0.03);
                  }}
                  placeholder="Enter text to encrypt..."
                  className="w-full bg-transparent text-white font-mono focus:outline-none placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Three output streams */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {/* SHA-256 */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/70">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1">
                  <Binary className="w-3 h-3 text-cyan-400" />
                  SHA-256 Hex
                </div>
                <div className="text-cyan-300 font-mono text-[11px] break-all leading-relaxed font-bold">
                  {shaHash ? shaHash.slice(0, 24) + '...' : '...'}
                </div>
              </div>

              {/* Bit Stream */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/70">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1">
                  <Cpu className="w-3 h-3 text-purple-400" />
                  Binary Bits (First 32)
                </div>
                <div className="text-purple-300 font-mono text-[11px] break-all tracking-wider font-bold">
                  {binaryStream || '...'}
                </div>
              </div>

              {/* AES-GCM Encrypted */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/70">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  AES-256-GCM Vault
                </div>
                <div className="text-emerald-300 font-mono text-[11px] break-all font-bold">
                  {sampleEncrypted || '...'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
