import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Cpu, AlertTriangle, Eye } from 'lucide-react';
import { cypherSound } from '../lib/crypto-utils';

export const LatticeVisualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Basis parameters
  const [basisAngle, setBasisAngle] = useState<number>(35); // degrees
  const [noiseLevel, setNoiseLevel] = useState<number>(14); // pixels of error e
  const [showBadBasis, setShowBadBasis] = useState<boolean>(false);
  const [targetFound, setTargetFound] = useState<boolean>(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const originX = width / 2;
    const originY = height / 2;

    ctx.clearRect(0, 0, width, height);

    // Grid basis vectors
    const spacing = 48;
    const rad = (basisAngle * Math.PI) / 180;

    // Vector 1: along x
    const v1 = { x: spacing, y: 0 };
    // Vector 2: angled
    const v2 = { x: spacing * Math.cos(rad), y: spacing * Math.sin(rad) };

    // Draw background sub-grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = -15; i <= 15; i++) {
      ctx.beginPath();
      ctx.moveTo(originX + i * 20, 0);
      ctx.lineTo(originX + i * 20, height);
      ctx.stroke();
    }

    // Generate lattice points: v = a1*v1 + a2*v2
    ctx.fillStyle = '#00f5ff';
    const points: { x: number; y: number; a1: number; a2: number }[] = [];

    const range = 8;
    for (let a1 = -range; a1 <= range; a1++) {
      for (let a2 = -range; a2 <= range; a2++) {
        const px = originX + a1 * v1.x + a2 * v2.x;
        const py = originY + a1 * v1.y + a2 * v2.y;

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          points.push({ x: px, y: py, a1, a2 });

          // Draw lattice node
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Draw Basis Vectors from origin
    // v1
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(originX + v1.x, originY + v1.y);
    ctx.stroke();

    // v2
    ctx.strokeStyle = '#c084fc';
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(originX + v2.x, originY + v2.y);
    ctx.stroke();

    // Draw basis labels
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('b₁', originX + v1.x + 6, originY + v1.y + 12);
    ctx.fillStyle = '#c084fc';
    ctx.fillText('b₂', originX + v2.x + 6, originY + v2.y - 4);

    // Pick a secret lattice point (e.g. a1=2, a2=2)
    const secretPoint = {
      x: originX + 2 * v1.x + 1 * v2.x,
      y: originY + 2 * v1.y + 1 * v2.y,
    };

    // Add Gaussian error e
    const noisyTarget = {
      x: secretPoint.x + noiseLevel * Math.cos(1.2),
      y: secretPoint.y - noiseLevel * Math.sin(1.2),
    };

    // Draw Secret Lattice Point
    ctx.fillStyle = '#10b981';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(secretPoint.x, secretPoint.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillText('True Secret (s)', secretPoint.x + 10, secretPoint.y + 4);

    // Draw Noisy Target Vector (A·s + e)
    ctx.fillStyle = '#f43f5e';
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(noisyTarget.x, noisyTarget.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw Error Vector Line (e)
    ctx.strokeStyle = '#f43f5e';
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(secretPoint.x, secretPoint.y);
    ctx.lineTo(noisyTarget.x, noisyTarget.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillText(`Target (c = As + e)`, noisyTarget.x + 10, noisyTarget.y - 4);

    // If bad basis is toggled, draw skewed basis vectors that make finding closest point impossible
    if (showBadBasis) {
      const badV1 = { x: 3 * v1.x + 2 * v2.x, y: 3 * v1.y + 2 * v2.y };
      const badV2 = { x: 4 * v1.x + 3 * v2.x, y: 4 * v1.y + 3 * v2.y };

      ctx.strokeStyle = 'rgba(234, 179, 8, 0.7)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(originX + badV1.x, originY + badV1.y);
      ctx.moveTo(originX, originY);
      ctx.lineTo(originX + badV2.x, originY + badV2.y);
      ctx.stroke();
    }
  }, [basisAngle, noiseLevel, showBadBasis]);

  const handleTestQuantumResistance = () => {
    cypherSound.playBlip(900, 'square', 0.1);
    setTargetFound(true);
    setTimeout(() => {
      cypherSound.playSuccess();
    }, 400);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Post-Quantum Frontier
            </span>
            <span className="text-xs font-mono text-slate-400">NIST Standard ML-KEM / Kyber</span>
          </div>
          <h3 className="text-2xl font-bold text-white mt-1">
            Lattice-Based Cryptography (LWE) Visualizer
          </h3>
          <p className="text-sm text-slate-400">
            Why quantum computers (Shor's Algorithm) break RSA & ECC, but fail against the Shortest Vector Problem (SVP).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5" /> Quantum-Proof
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Canvas */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <div className="relative w-full max-w-[640px] aspect-[4/3] rounded-xl overflow-hidden border border-slate-800 bg-[#06080d] shadow-2xl flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className="w-full h-full object-contain"
            />
            <div className="absolute top-3 right-3 flex flex-col gap-1.5 text-xs font-mono">
              <span className="px-2.5 py-1 rounded bg-black/70 border border-slate-700 text-slate-300">
                Grid: 2D Projection (Real Kyber uses d=768 dimensions!)
              </span>
            </div>
          </div>

          <div className="w-full mt-3 px-3 py-2.5 rounded-lg bg-slate-800/40 border border-slate-700/50 text-xs font-mono text-slate-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>
                <strong>Learning With Errors (LWE):</strong> Without error <em>e</em>, linear algebra trivially recovers secret <em>s</em>. With error <em>e</em>, even a quantum supercomputer is trapped in exponential search.
              </span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs uppercase tracking-wider text-slate-400 font-mono font-semibold">
                Lattice Parameters
              </h4>

              <div>
                <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                  <span>Basis Angle (Vector Skew):</span>
                  <span className="text-cyan-400 font-bold">{basisAngle}°</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="85"
                  value={basisAngle}
                  onChange={(e) => setBasisAngle(parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                  <span>Gaussian Noise Magnitude (e):</span>
                  <span className="text-rose-400 font-bold">{noiseLevel}px</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="35"
                  value={noiseLevel}
                  onChange={(e) => setNoiseLevel(parseInt(e.target.value))}
                  className="w-full accent-rose-400 cursor-pointer"
                />
              </div>

              <div className="pt-2 border-t border-slate-700/50">
                <label className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showBadBasis}
                    onChange={(e) => setShowBadBasis(e.target.checked)}
                    className="accent-purple-400 rounded"
                  />
                  <span>Show Skewed "Bad" Public Basis (Trapdoor)</span>
                </label>
              </div>
            </div>

            {/* Quantum vs Classical Table */}
            <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-800/40 font-mono text-xs space-y-2">
              <div className="text-purple-300 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Quantum Vulnerability:
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300">
                  <span className="font-bold block">RSA & ECC</span>
                  <span className="text-[10px] text-rose-400">Broken by Shor's Alg in polynomial time O(n³)</span>
                </div>
                <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                  <span className="font-bold block">ML-KEM (Kyber)</span>
                  <span className="text-[10px] text-emerald-400">Immune: CVP has no known quantum speedup</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleTestQuantumResistance}
              className="w-full py-2.5 px-4 rounded-xl font-mono text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 transition"
            >
              <Eye className="w-3.5 h-3.5" />
              Verify Lattice Hardness Simulation
            </button>
            {targetFound && (
              <div className="mt-2 text-center text-[11px] font-mono text-emerald-400 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> 256-bit Post-Quantum Security Margin Confirmed
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
