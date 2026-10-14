import React, { useState } from 'react';
import { Compass, Shield, Key, Eye, Cpu } from 'lucide-react';
import { cypherSound } from '../lib/crypto-utils';

interface Era {
  id: string;
  eraNumber: string;
  title: string;
  years: string;
  tagline: string;
  icon: React.ReactNode;
  milestones: { year: string; name: string; description: string }[];
  color: string;
  borderColor: string;
  glowColor: string;
}

export const ConstellationTimeline: React.FC = () => {
  const [activeEraId, setActiveEraId] = useState<string>('zk');

  const eras: Era[] = [
    {
      id: 'classical',
      eraNumber: 'ERA 01',
      title: 'Classical & Mechanical Ciphers',
      years: '400 BC – 1945',
      tagline: 'Physical rotors, transposition grids, and letter substitution.',
      icon: <Compass className="w-5 h-5 text-amber-400" />,
      color: 'text-amber-400',
      borderColor: 'border-amber-500/40',
      glowColor: 'bg-amber-500/10',
      milestones: [
        { year: '400 BC', name: 'Spartan Scytale', description: 'Early transposition cylinder for military battlefield dispatches.' },
        { year: '1553', name: 'Vigenère Cipher', description: 'Polyalphabetic substitution, declared "le chiffre indéchiffrable" for 300 years.' },
        { year: '1940', name: 'Enigma & Alan Turing', description: 'Electro-mechanical rotor machine broken at Bletchley Park using the Bombe.' },
      ],
    },
    {
      id: 'asymmetric',
      eraNumber: 'ERA 02',
      title: 'The Public-Key Revolution',
      years: '1948 – 1978',
      tagline: 'Solving the impossible key-exchange problem without meeting in secret.',
      icon: <Key className="w-5 h-5 text-cyan-400" />,
      color: 'text-cyan-400',
      borderColor: 'border-cyan-500/40',
      glowColor: 'bg-cyan-500/10',
      milestones: [
        { year: '1948', name: "Shannon's Information Theory", description: 'Proved the One-Time Pad is mathematically unbreakable (perfect secrecy).' },
        { year: '1976', name: 'Diffie-Hellman Key Exchange', description: 'Invented asymmetric math using discrete logarithms over modular arithmetic.' },
        { year: '1977', name: 'RSA (Rivest, Shamir, Adleman)', description: 'Prime factorization trapdoor function enabling worldwide internet encryption.' },
      ],
    },
    {
      id: 'elliptic',
      eraNumber: 'ERA 03',
      title: 'Elliptic Curves & Cypherpunk Web3',
      years: '1985 – 2010',
      tagline: 'Higher cryptographic strength with 10x smaller key footprints.',
      icon: <Shield className="w-5 h-5 text-indigo-400" />,
      color: 'text-indigo-400',
      borderColor: 'border-indigo-500/40',
      glowColor: 'bg-indigo-500/10',
      milestones: [
        { year: '1985', name: 'ECC Proposed (Koblitz & Miller)', description: 'Algebraic geometry on cubic curves replaces massive 4096-bit RSA keys with 256-bit points.' },
        { year: '1993', name: 'Cypherpunk Manifesto', description: 'Eric Hughes declares cryptography is the foundation of civil liberties in the digital age.' },
        { year: '2008', name: 'Bitcoin & secp256k1', description: 'Satoshi Nakamoto deploys peer-to-peer electronic cash secured by ECDSA and SHA-256.' },
      ],
    },
    {
      id: 'zk',
      eraNumber: 'ERA 04',
      title: 'Zero-Knowledge & Confidential Compute',
      years: '2012 – Present',
      tagline: 'Mathematical proof of truth without revealing underlying private data.',
      icon: <Eye className="w-5 h-5 text-emerald-400" />,
      color: 'text-emerald-400',
      borderColor: 'border-emerald-500/40',
      glowColor: 'bg-emerald-500/10',
      milestones: [
        { year: '1985-2016', name: 'GMR to Groth16', description: 'Goldwasser-Micali-Rackoff theory transformed into sub-second verifiable zk-SNARKs.' },
        { year: '2020', name: 'ZK-Rollups & Scaling', description: 'Validating thousands of transactions in a single succinct zero-knowledge certificate.' },
        { year: 'Today', name: 'Fully Homomorphic Encryption (FHE)', description: 'Computing arbitrary functions directly on encrypted data without ever decrypting it.' },
      ],
    },
    {
      id: 'quantum',
      eraNumber: 'ERA 05',
      title: 'The Post-Quantum Frontier',
      years: '2024 – 2030+',
      tagline: 'Shielding the future from Shor’s algorithm and quantum decryption.',
      icon: <Cpu className="w-5 h-5 text-purple-400" />,
      color: 'text-purple-400',
      borderColor: 'border-purple-500/40',
      glowColor: 'bg-purple-500/10',
      milestones: [
        { year: '1994', name: "Shor's Algorithm", description: 'Peter Shor demonstrates a theoretical quantum computer breaks RSA and ECC in polynomial time.' },
        { year: '2024', name: 'NIST Post-Quantum Standards Released', description: 'FIPS 203 (ML-KEM/Kyber) and FIPS 204 (ML-DSA/Dilithium) finalized as global standards.' },
        { year: '2026+', name: 'Global Quantum Migration', description: 'Web, TLS 1.4, military, and financial rails transition to lattice-based mathematics.' },
      ],
    },
  ];

  const currentEra = eras.find((e) => e.id === activeEraId) || eras[3];

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Constellation Map
            </span>
            <span className="text-xs font-mono text-slate-400">Chronicles of Privacy</span>
          </div>
          <h3 className="text-2xl font-bold text-white mt-1">
            The Cryptographic Ages
          </h3>
          <p className="text-sm text-slate-400">
            From Spartan scytales to Zero-Knowledge and Post-Quantum Lattice grids.
          </p>
        </div>
      </div>

      {/* Constellation Selector Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-8">
        {eras.map((era) => {
          const isActive = era.id === activeEraId;
          return (
            <button
              key={era.id}
              onClick={() => {
                setActiveEraId(era.id);
                cypherSound.playBlip(550, 'sine');
              }}
              className={`p-3 rounded-xl border text-left transition-all duration-300 relative ${
                isActive
                  ? `${era.glowColor} ${era.borderColor} shadow-lg shadow-cyan-500/5`
                  : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
                  {era.eraNumber}
                </span>
                {era.icon}
              </div>
              <div className={`text-xs font-bold leading-tight ${isActive ? era.color : 'text-slate-200'}`}>
                {era.title}
              </div>
              <div className="text-[10px] font-mono text-slate-500 mt-1">{era.years}</div>
            </button>
          );
        })}
      </div>

      {/* Active Era Focus Card */}
      <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800 pb-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono font-bold ${currentEra.color}`}>
                {currentEra.eraNumber} · {currentEra.years}
              </span>
            </div>
            <h4 className="text-xl font-bold text-white mt-0.5">{currentEra.title}</h4>
            <p className="text-xs text-slate-400 mt-1">{currentEra.tagline}</p>
          </div>
        </div>

        {/* Milestones Horizontal / Vertical Track */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {currentEra.milestones.map((m, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 relative space-y-1.5 hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">
                  {m.year}
                </span>
                <span className="text-[10px] font-mono text-slate-600">Phase 0{idx + 1}</span>
              </div>
              <div className="text-sm font-bold text-slate-200 pt-1">{m.name}</div>
              <p className="text-xs text-slate-400 leading-relaxed">{m.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
