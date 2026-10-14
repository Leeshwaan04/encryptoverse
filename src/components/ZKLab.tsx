import React, { useState } from 'react';
import { Shield, Lock, CheckCircle2, XCircle, ArrowRight, RefreshCw, KeyRound } from 'lucide-react';
import { cypherSound } from '../lib/crypto-utils';
import confetti from 'canvas-confetti';

interface ZkRoundLog {
  round: number;
  challenge: number;
  isHonest: boolean;
  success: boolean;
  cheatProbability: number;
}

export const ZKLab: React.FC = () => {
  // Public Parameters: p = 23 (prime), g = 5 (generator)
  const p = 23;
  const g = 5;

  // Secret known by Peggy: x = 7
  const secretX = 7;
  // Public Y = g^x mod p = 5^7 mod 23 = 10
  const publicY = 10;

  // State
  const [isHonest, setIsHonest] = useState<boolean>(true);
  const [currentStep, setCurrentStep] = useState<number>(0); // 0: Idle, 1: Committed, 2: Challenged, 3: Verified
  const [randomR, setRandomR] = useState<number>(4);
  const [commitmentT, setCommitmentT] = useState<number>(0);
  const [challengeC, setChallengeC] = useState<number>(0);
  const [responseS, setResponseS] = useState<number>(0);
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null);
  const [history, setHistory] = useState<ZkRoundLog[]>([]);

  // Modular exponentiation helper
  const modPow = (base: number, exp: number, mod: number): number => {
    let res = 1;
    base = base % mod;
    while (exp > 0) {
      if (exp % 2 === 1) res = (res * base) % mod;
      base = (base * base) % mod;
      exp = Math.floor(exp / 2);
    }
    return res;
  };

  // Step 1: Peggy generates commitment T = g^r mod p
  const handleCommit = () => {
    const r = Math.floor(Math.random() * 15) + 2;
    setRandomR(r);

    let t: number;
    if (isHonest) {
      t = modPow(g, r, p);
    } else {
      // Impostor tries to guess challenge beforehand
      // If impostor guesses c=0: sets T = g^r
      // If impostor guesses c=1: sets T = g^r / Y
      t = modPow(g, r, p);
    }
    setCommitmentT(t);
    setCurrentStep(1);
    setVerificationResult(null);
    cypherSound.playBlip(620, 'sine');
  };

  // Step 2: Victor issues random challenge c in {0, 1}
  const handleChallenge = () => {
    const c = Math.random() > 0.5 ? 1 : 0;
    setChallengeC(c);
    setCurrentStep(2);
    cypherSound.playBlip(740, 'triangle');
  };

  // Step 3 & 4: Peggy responds and Victor verifies
  const handleRespondAndVerify = () => {
    let s: number;
    let verified = false;

    if (isHonest) {
      s = randomR + challengeC * secretX;
      // Victor checks: g^s mod p == (T * Y^c) mod p
      const left = modPow(g, s, p);
      const right = (commitmentT * modPow(publicY, challengeC, p)) % p;
      verified = left === right;
    } else {
      // Impostor doesn't know secretX
      // If challenge happened to match impostor's guess, they might fool Victor for 1 round!
      // But if challenge does not match, impostor fails!
      const impostorGuess = 0; // Assume guessed c=0
      if (challengeC === impostorGuess) {
        s = randomR;
        verified = true;
      } else {
        s = randomR + 99; // arbitrary junk
        verified = false;
      }
    }

    setResponseS(s);
    setVerificationResult(verified);
    setCurrentStep(3);

    const newRound = history.length + 1;
    const cheatProb = Math.pow(0.5, newRound);

    setHistory((prev) => [
      {
        round: newRound,
        challenge: challengeC,
        isHonest,
        success: verified,
        cheatProbability: cheatProb,
      },
      ...prev.slice(0, 7),
    ]);

    if (verified) {
      cypherSound.playSuccess();
      if (history.length >= 4) {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
      }
    } else {
      cypherSound.playBlip(220, 'sawtooth', 0.2);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setHistory([]);
    setVerificationResult(null);
    cypherSound.playBlip(440);
  };

  const currentCheatProbability = Math.pow(0.5, history.filter((h) => h.success).length);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Zero-Knowledge Protocol
            </span>
            <span className="text-xs font-mono text-slate-400">Sigma Interactive Proof</span>
          </div>
          <h3 className="text-2xl font-bold text-white mt-1">
            Zero-Knowledge Proof (ZKP) Simulator
          </h3>
          <p className="text-sm text-slate-400">
            Proving to the Verifier you know a secret <code className="text-emerald-300 font-mono">x</code> without disclosing a single bit of information about it.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Honest vs Impostor Toggle */}
          <div className="flex p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
            <button
              onClick={() => {
                setIsHonest(true);
                handleReset();
              }}
              className={`px-3 py-1.5 rounded-lg transition ${
                isHonest
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Honest Prover
            </button>
            <button
              onClick={() => {
                setIsHonest(false);
                handleReset();
              }}
              className={`px-3 py-1.5 rounded-lg transition ${
                !isHonest
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Impostor (No Secret)
            </button>
          </div>

          <button
            onClick={handleReset}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            title="Reset simulation"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Simulation Board */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: The Protocol Steps */}
        <div className="lg:col-span-8 space-y-4">
          {/* Public Parameters bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-400">Public Parameters:</span>
              <span className="text-cyan-300">p = {p} (Prime)</span>
              <span className="text-slate-600">|</span>
              <span className="text-cyan-300">g = {g} (Generator)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Public Key Y = gˣ mod p:</span>
              <span className="text-purple-400 font-bold">{publicY}</span>
            </div>
          </div>

          {/* Interactive Protocol Flow */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Peggy (Prover) */}
            <div className={`p-4 rounded-xl border transition-all ${
              isHonest
                ? 'bg-emerald-950/20 border-emerald-500/30'
                : 'bg-rose-950/20 border-rose-500/30'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  Prover (Peggy)
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                  isHonest
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {isHonest ? 'Has Secret x = 7' : 'Secret Unknown'}
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                {/* Step 1: Commitment */}
                <div className="p-3 rounded-lg bg-black/40 border border-slate-800">
                  <div className="text-slate-400 text-[11px] mb-1">
                    1. Generate Random Nonce & Commitment
                  </div>
                  {currentStep >= 1 ? (
                    <div className="text-cyan-300">
                      Nonce r = {randomR} <br />
                      Commitment <span className="font-bold">T = gʳ mod p = {commitmentT}</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleCommit}
                      className="w-full py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition flex items-center justify-center gap-1 text-xs"
                    >
                      Step 1: Send Commitment (T) <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Step 3: Response */}
                <div className="p-3 rounded-lg bg-black/40 border border-slate-800">
                  <div className="text-slate-400 text-[11px] mb-1">
                    3. Compute Proof Response (s)
                  </div>
                  {currentStep >= 3 ? (
                    <div className="text-purple-300">
                      Response <span className="font-bold">s = r + c·x = {responseS}</span>
                    </div>
                  ) : currentStep === 2 ? (
                    <button
                      onClick={handleRespondAndVerify}
                      className="w-full py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold transition flex items-center justify-center gap-1 text-xs"
                    >
                      Step 3: Respond to Challenge <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span className="text-slate-600">Waiting for Victor's challenge...</span>
                  )}
                </div>
              </div>
            </div>

            {/* Victor (Verifier) */}
            <div className="p-4 rounded-xl border bg-slate-950/50 border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-cyan-400" />
                    Verifier (Victor)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    Knows Only Y = 10
                  </span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  {/* Step 2: Challenge */}
                  <div className="p-3 rounded-lg bg-black/40 border border-slate-800">
                    <div className="text-slate-400 text-[11px] mb-1">
                      2. Issue Random Coin-Flip Challenge
                    </div>
                    {currentStep >= 2 ? (
                      <div className="text-amber-300">
                        Challenge <span className="font-bold">c = {challengeC}</span>
                      </div>
                    ) : currentStep === 1 ? (
                      <button
                        onClick={handleChallenge}
                        className="w-full py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold transition flex items-center justify-center gap-1 text-xs"
                      >
                        Step 2: Flip Coin Challenge (c) <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-slate-600">Waiting for Peggy's commitment...</span>
                    )}
                  </div>

                  {/* Step 4: Verification Check */}
                  <div className="p-3 rounded-lg bg-black/40 border border-slate-800">
                    <div className="text-slate-400 text-[11px] mb-1">
                      4. Verify: gˢ ≡ T · Yᶜ (mod p)
                    </div>
                    {verificationResult !== null ? (
                      <div className="flex items-center gap-2">
                        {verificationResult ? (
                          <div className="flex items-center gap-1 text-emerald-400 font-bold">
                            <CheckCircle2 className="w-4 h-4" /> Proof Validated!
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-rose-400 font-bold">
                            <XCircle className="w-4 h-4" /> Cheater Caught! Failed.
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-600">Ready to evaluate equation...</span>
                    )}
                  </div>
                </div>
              </div>

              {currentStep === 3 && (
                <div className="pt-3 border-t border-slate-800 mt-3">
                  <button
                    onClick={handleCommit}
                    className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 transition"
                  >
                    Run Next Verification Round →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Soundness & Cheat Probability Accumulator */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 font-mono text-xs space-y-3">
            <h4 className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center justify-between">
              <span>Soundness Error (Cheater Risk)</span>
              <span className="text-amber-400 font-bold">
                {(currentCheatProbability * 100).toFixed(4)}%
              </span>
            </h4>

            {/* Probability Progress Bar */}
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, (1 - currentCheatProbability) * 100))}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-400">
              Each round cuts the impostor's chance in half (2⁻ⁿ). In 30 rounds, the chance of faking a proof is less than <strong>1 in a billion</strong>.
            </p>

            {/* Recent Rounds Log */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[10px] uppercase text-slate-500 block mb-1">
                Round History ({history.length} runs)
              </span>
              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                {history.length === 0 ? (
                  <div className="text-slate-600 text-[11px]">No rounds run yet. Click Step 1 to begin.</div>
                ) : (
                  history.map((h, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-2 py-1 rounded bg-slate-900 border border-slate-800/80 text-[11px]"
                    >
                      <span className="text-slate-400">Round #{h.round}</span>
                      <span className="text-slate-400">c={h.challenge}</span>
                      <span className={h.success ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {h.success ? 'PASSED' : 'CAUGHT'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Real-World Zero-Knowledge Cards */}
          <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-xs font-mono space-y-1.5">
            <div className="text-emerald-300 font-semibold">Real-World Zero-Knowledge (ZKP):</div>
            <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
              <li><strong>ZK-Rollups:</strong> Compress 10,000 blockchain transactions into 1 tiny verifiable proof.</li>
              <li><strong>Anonymous ID:</strong> Prove you are over 18 without revealing your name, birthdate, or ID number.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
