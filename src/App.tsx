import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { LatticeCanvas } from './components/LatticeCanvas';
import { EllipticCurveVisualizer } from './components/EllipticCurveVisualizer';
import { LatticeVisualizer } from './components/LatticeVisualizer';
import { ZKLab } from './components/ZKLab';
import { CypherSuite } from './components/CypherSuite';
import { QuestArena } from './components/QuestArena';
import { ConstellationTimeline } from './components/ConstellationTimeline';
import { Footer } from './components/Footer';
import { Sparkles, Layers } from 'lucide-react';
import { cypherSound } from './lib/crypto-utils';

export function App() {
  const [activeSection, setActiveSection] = useState<string>('hero');
  const [holodeckTab, setHolodeckTab] = useState<'ecc' | 'lattice'>('ecc');

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    if (id === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -75;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 relative selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background Interactive Lattice */}
      <LatticeCanvas />

      {/* Persistent Navigation */}
      <Navbar activeSection={activeSection} onNavigate={scrollToSection} />

      <main className="relative z-10">
        {/* Hero Section with Live Cypher Input */}
        <div id="hero">
          <Hero onExplore={scrollToSection} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24 pt-6">
          {/* SECTION 1: THE HOLODECK (Interactive Visualizers) */}
          <section id="holodeck" className="scroll-mt-24 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                    Pillar 01
                  </span>
                </div>
                <h2 className="text-3xl font-extrabold text-white mt-1">
                  The Cryptography Holodeck
                </h2>
                <p className="text-sm text-slate-400 font-mono">
                  Interactive mathematical simulations rendered in 60fps canvas.
                </p>
              </div>

              {/* Sub-tab switcher: ECC vs Lattice */}
              <div className="flex p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
                <button
                  onClick={() => {
                    setHolodeckTab('ecc');
                    cypherSound.playBlip(600);
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition ${
                    holodeckTab === 'ecc'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Elliptic Curves (ECC)
                </button>
                <button
                  onClick={() => {
                    setHolodeckTab('lattice');
                    cypherSound.playBlip(600);
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition ${
                    holodeckTab === 'lattice'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  Post-Quantum Lattice (LWE)
                </button>
              </div>
            </div>

            {holodeckTab === 'ecc' ? <EllipticCurveVisualizer /> : <LatticeVisualizer />}
          </section>

          {/* SECTION 2: ZERO-KNOWLEDGE LAB */}
          <section id="zklab" className="scroll-mt-24 space-y-6">
            <div className="border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                  Pillar 02
                </span>
              </div>
              <h2 className="text-3xl font-extrabold text-white mt-1">
                The Zero-Knowledge (ZK) Lab
              </h2>
              <p className="text-sm text-slate-400 font-mono">
                Real-time interactive Sigma proof simulation. Prove truth without revealing secrets.
              </p>
            </div>

            <ZKLab />
          </section>

          {/* SECTION 3: CYPHER SUITE (100% IN-BROWSER PRIVACY TOOLS) */}
          <section id="suite" className="scroll-mt-24 space-y-6">
            <div className="border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                  Pillar 03
                </span>
              </div>
              <h2 className="text-3xl font-extrabold text-white mt-1">
                The Cypherpunk Privacy Suite
              </h2>
              <p className="text-sm text-slate-400 font-mono">
                Hardware-accelerated client-side WebCrypto. Zero tracking, zero telemetry.
              </p>
            </div>

            <CypherSuite />
          </section>

          {/* SECTION 4: CTF QUESTS */}
          <section id="quests" className="scroll-mt-24 space-y-6">
            <div className="border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                  Pillar 04
                </span>
              </div>
              <h2 className="text-3xl font-extrabold text-white mt-1">
                The Cryptoverse Quests
              </h2>
              <p className="text-sm text-slate-400 font-mono">
                Learn cryptanalysis hands-on. Break rotational shifts, mine PoW hashes, and exploit flawed nonces.
              </p>
            </div>

            <QuestArena />
          </section>

          {/* SECTION 5: CHRONICLES & TIMELINE */}
          <section id="timeline" className="scroll-mt-24 space-y-6">
            <div className="border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">
                  Chronicles
                </span>
              </div>
              <h2 className="text-3xl font-extrabold text-white mt-1">
                The Evolution of Cryptography
              </h2>
              <p className="text-sm text-slate-400 font-mono">
                From ancient Spartan Scytales to Post-Quantum Lattice grids.
              </p>
            </div>

            <ConstellationTimeline />
          </section>
        </div>
      </main>

      {/* Footer with Eric Hughes Cypherpunk Manifesto & Open Source Links */}
      <Footer />
    </div>
  );
}

export default App;
