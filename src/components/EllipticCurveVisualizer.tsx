import React, { useState, useEffect, useRef, useId } from 'react';
import { Play, RotateCcw, Info, Sparkles } from 'lucide-react';
import { cypherSound } from '../lib/crypto-utils';

export const EllipticCurveVisualizer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Curve parameters: y^2 = x^3 + ax + b
  const [paramA, setParamA] = useState<number>(-3);
  const [paramB, setParamB] = useState<number>(5);

  // Slider input IDs
  const paramAId = useId();
  const paramBId = useId();

  // Selected points
  const [pX, setPX] = useState<number>(-1.5);
  const [qX, setQX] = useState<number>(1.2);
  const [scalarK, setScalarK] = useState<number>(3);
  const [animating, setAnimating] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<string>('Select points P and Q to compute group sum P + Q');

  // Calculate y for a given x on y^2 = x^3 + ax + b
  const getY = (x: number, a: number, b: number): number | null => {
    const rhs = x * x * x + a * x + b;
    if (rhs < 0) return null;
    return Math.sqrt(rhs);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Coordinate transforms: Center (width/2, height/2), scale factor
    const scale = 40; // 40px = 1 unit
    const originX = width / 2;
    const originY = height / 2;

    const toCanvasX = (x: number) => originX + x * scale;
    const toCanvasY = (y: number) => originY - y * scale;

    ctx.clearRect(0, 0, width, height);

    // Draw Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = -10; x <= 10; x++) {
      ctx.beginPath();
      ctx.moveTo(toCanvasX(x), 0);
      ctx.lineTo(toCanvasX(x), height);
      ctx.stroke();
    }
    for (let y = -10; y <= 10; y++) {
      ctx.beginPath();
      ctx.moveTo(0, toCanvasY(y));
      ctx.lineTo(width, toCanvasY(y));
      ctx.stroke();
    }

    // Draw Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, height);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#64748b';
    ctx.font = '10px monospace';
    ctx.fillText('X', width - 15, originY - 8);
    ctx.fillText('Y', originX + 8, 15);

    // Draw Elliptic Curve: y^2 = x^3 + ax + b
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#00f5ff';
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur = 10;

    // Top branch
    ctx.beginPath();
    let started = false;
    for (let cx = 0; cx < width; cx += 2) {
      const mathX = (cx - originX) / scale;
      const mathY = getY(mathX, paramA, paramB);
      if (mathY !== null) {
        const cy = toCanvasY(mathY);
        if (!started) {
          ctx.moveTo(cx, cy);
          started = true;
        } else {
          ctx.lineTo(cx, cy);
        }
      } else {
        started = false;
      }
    }
    ctx.stroke();

    // Bottom branch
    ctx.beginPath();
    started = false;
    for (let cx = 0; cx < width; cx += 2) {
      const mathX = (cx - originX) / scale;
      const mathY = getY(mathX, paramA, paramB);
      if (mathY !== null) {
        const cy = toCanvasY(-mathY);
        if (!started) {
          ctx.moveTo(cx, cy);
          started = true;
        } else {
          ctx.lineTo(cx, cy);
        }
      } else {
        started = false;
      }
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Compute Point P
    const pYVal = getY(pX, paramA, paramB);
    const qYVal = getY(qX, paramA, paramB);

    if (pYVal !== null && qYVal !== null) {
      const P = { x: pX, y: pYVal };
      const Q = { x: qX, y: qYVal };

      // Slope lambda
      let lambda: number;
      let isTangent = false;
      if (Math.abs(P.x - Q.x) < 0.001) {
        // Tangent doubling
        lambda = (3 * P.x * P.x + paramA) / (2 * P.y);
        isTangent = true;
      } else {
        lambda = (Q.y - P.y) / (Q.x - P.x);
      }

      // Intersection x3 = lambda^2 - x1 - x2
      const x3 = lambda * lambda - P.x - Q.x;
      const y3Negative = lambda * (P.x - x3) - P.y; // -R
      const y3 = -y3Negative; // R = P + Q

      // Draw Secant / Tangent line across the canvas
      ctx.strokeStyle = isTangent ? 'rgba(236, 72, 153, 0.7)' : 'rgba(168, 85, 247, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);

      const xLeft = -8;
      const yLeft = lambda * (xLeft - P.x) + P.y;
      const xRight = 8;
      const yRight = lambda * (xRight - P.x) + P.y;

      ctx.beginPath();
      ctx.moveTo(toCanvasX(xLeft), toCanvasY(yLeft));
      ctx.lineTo(toCanvasX(xRight), toCanvasY(yRight));
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw vertical reflection line from -R to R
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.6)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(toCanvasX(x3), toCanvasY(y3Negative));
      ctx.lineTo(toCanvasX(x3), toCanvasY(y3));
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Points
      // Point P
      drawPoint(ctx, toCanvasX(P.x), toCanvasY(P.y), '#38bdf8', 'P');
      // Point Q
      drawPoint(ctx, toCanvasX(Q.x), toCanvasY(Q.y), '#c084fc', 'Q');
      // Point -R (intersection)
      drawPoint(ctx, toCanvasX(x3), toCanvasY(y3Negative), '#94a3b8', '-R');
      // Point R (final reflected point P + Q)
      drawPoint(ctx, toCanvasX(x3), toCanvasY(y3), '#10b981', 'R = P + Q', true);
    }
  }, [paramA, paramB, pX, qX]);

  const drawPoint = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    color: string,
    label: string,
    glow = false
  ) => {
    if (glow) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
    }
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(label, cx + 10, cy - 8);
  };

  const handleSimulateScalar = () => {
    setAnimating(true);
    cypherSound.playBlip(700, 'sawtooth', 0.1);
    setActiveStep(`Computing 2P, 3P... up to ${scalarK}P using double-and-add algorithm...`);

    let currentK = 1;
    const interval = setInterval(() => {
      currentK++;
      if (currentK > scalarK) {
        clearInterval(interval);
        setAnimating(false);
        cypherSound.playSuccess();
        setActiveStep(
          `Completed! Computed point Q = ${scalarK}·P. In Bitcoin (secp256k1), finding k from Q and P would take trillions of years.`
        );
      } else {
        cypherSound.playBlip(600 + currentK * 80, 'sine', 0.08);
        setActiveStep(`Step: Adding point P (${currentK}·P)...`);
      }
    }, 450);
  };

  const pY = getY(pX, paramA, paramB);
  const qY = getY(qX, paramA, paramB);
  let slopeStr = 'N/A';
  let rXStr = 'N/A';
  let rYStr = 'N/A';

  if (pY !== null && qY !== null) {
    const lam = Math.abs(pX - qX) < 0.001 ? (3 * pX * pX + paramA) / (2 * pY) : (qY - pY) / (qX - pX);
    const rx = lam * lam - pX - qX;
    const ry = -(lam * (pX - rx) - pY);
    slopeStr = lam.toFixed(3);
    rXStr = rx.toFixed(3);
    rYStr = ry.toFixed(3);
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Interactive Holodeck
            </span>
            <span className="text-xs font-mono text-slate-400">ECC Curve Geometry</span>
          </div>
          <h3 className="text-2xl font-bold text-white mt-1">
            Elliptic Curve Group Law Simulator
          </h3>
          <p className="text-sm text-slate-400">
            Formula: <code className="text-cyan-300 font-mono">y² = x³ + ax + b</code> (Weierstrass Form)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setParamA(-3);
              setParamB(5);
              setPX(-1.5);
              setQX(1.2);
              cypherSound.playBlip(440);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-mono transition"
            title="Reset parameters"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Canvas Section */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <div className="relative w-full max-w-[640px] aspect-[4/3] rounded-xl overflow-hidden border border-slate-800 bg-[#06080d] shadow-2xl flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className="w-full h-full object-contain"
            />
            <div className="absolute top-3 left-3 flex flex-wrap gap-2 text-xs font-mono">
              <span className="px-2 py-1 rounded bg-black/60 border border-slate-700/80 text-cyan-300 backdrop-blur">
                P({pX.toFixed(2)}, {pY?.toFixed(2) ?? 'undef'})
              </span>
              <span className="px-2 py-1 rounded bg-black/60 border border-slate-700/80 text-purple-300 backdrop-blur">
                Q({qX.toFixed(2)}, {qY?.toFixed(2) ?? 'undef'})
              </span>
              <span className="px-2 py-1 rounded bg-black/60 border border-emerald-500/40 text-emerald-300 font-bold backdrop-blur">
                R = P+Q ({rXStr}, {rYStr})
              </span>
            </div>
          </div>

          <div className="w-full mt-3 px-3 py-2 rounded-lg bg-slate-800/40 border border-slate-700/50 text-xs font-mono text-cyan-300 flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{activeStep}</span>
          </div>
        </div>

        {/* Controls & Math Breakdown */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs uppercase tracking-wider text-slate-400 font-mono font-semibold">
                Curve Parameters
              </h4>
              <div>
                <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                  <label htmlFor={paramAId}>Parameter a:</label>
                  <span className="text-cyan-400 font-bold">{paramA}</span>
                </div>
                <input
                  id={paramAId}
                  type="range"
                  min="-5"
                  max="5"
                  step="0.5"
                  value={paramA}
                  onChange={(e) => setParamA(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                  <label htmlFor={paramBId}>Parameter b:</label>
                  <span className="text-cyan-400 font-bold">{paramB}</span>
                </div>
                <input
                  id={paramBId}
                  type="range"
                  min="-5"
                  max="10"
                  step="0.5"
                  value={paramB}
                  onChange={(e) => setParamB(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div className="pt-2 border-t border-slate-700/50 flex gap-2">
                <button
                  onClick={() => {
                    setParamA(0);
                    setParamB(7);
                    setPX(1.5);
                    setQX(2.5);
                  }}
                  className="text-[11px] px-2 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 font-mono transition"
                >
                  Load Bitcoin (secp256k1 shape: a=0, b=7)
                </button>
              </div>
            </div>

            {/* Point Shift Sliders */}
            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs uppercase tracking-wider text-slate-400 font-mono font-semibold">
                Point Coordinates
              </h4>
              <div>
                <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                  <span>Point P (x₁):</span>
                  <span className="text-cyan-300">{pX.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="-2"
                  max="3"
                  step="0.1"
                  value={pX}
                  onChange={(e) => setPX(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                  <span>Point Q (x₂):</span>
                  <span className="text-purple-300">{qX.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="-2"
                  max="3"
                  step="0.1"
                  value={qX}
                  onChange={(e) => setQX(parseFloat(e.target.value))}
                  className="w-full accent-purple-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Real Computed Math Breakdown */}
            <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-800/40 font-mono text-xs space-y-1.5">
              <div className="text-cyan-400 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Group Operation Mechanics:
              </div>
              <div className="text-slate-300 text-[11px]">
                1. Slope λ = (y₂ - y₁) / (x₂ - x₁) = <span className="text-cyan-300">{slopeStr}</span>
              </div>
              <div className="text-slate-300 text-[11px]">
                2. Intersection x₃ = λ² - x₁ - x₂ = <span className="text-purple-300">{rXStr}</span>
              </div>
              <div className="text-slate-300 text-[11px]">
                3. Reflect across x-axis: y₃ = -(λ(x₁ - x₃) - y₁) = <span className="text-emerald-300">{rYStr}</span>
              </div>
            </div>
          </div>

          {/* Scalar Multiplication Simulation */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-2">
              <span>Scalar Multiplier (k):</span>
              <div className="flex gap-1.5">
                {[2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    onClick={() => {
                      setScalarK(val);
                      cypherSound.playBlip(500 + val * 50);
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      scalarK === val
                        ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    k={val}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleSimulateScalar}
              disabled={animating}
              className={`w-full py-2.5 px-4 rounded-xl font-mono text-xs font-semibold flex items-center justify-center gap-2 transition ${
                animating
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-lg shadow-cyan-500/20'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {animating ? 'Simulating Double-and-Add...' : `Simulate Scalar k·P (Public Key Derivation)`}
            </button>
            <p className="text-[10px] text-slate-500 font-mono text-center mt-1.5">
              Demonstrates ECDLP (The trapdoor one-way math underpinning Bitcoin & Ethereum)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
