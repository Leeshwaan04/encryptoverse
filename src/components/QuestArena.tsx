import React, { useState } from 'react';
import {
  CheckCircle,
  Zap,
  Flame
} from 'lucide-react';
import { computeSha256, cypherSound } from '../lib/crypto-utils';
import confetti from 'canvas-confetti';

export const QuestArena: React.FC = () => {
  const [activeQuest, setActiveQuest] = useState<number>(1);

  // Quest 1: Caesar Cipher
  // Ciphertext: "KHOOR HQFUBSWRYHUVH" with shift = 3 -> "HELLO ENCRYPTOVERSE"
  const quest1Cipher = "KHOOR HQFUBSWRYHUVH";
  const [shiftGuess, setShiftGuess] = useState<number>(0);
  const [quest1Solved, setQuest1Solved] = useState<boolean>(false);

  // Compute Caesar shift
  const decodeCaesar = (str: string, shift: number) => {
    return str
      .split('')
      .map((c) => {
        const code = c.charCodeAt(0);
        if (code >= 65 && code <= 90) {
          return String.fromCharCode(((code - 65 - shift + 26) % 26) + 65);
        }
        return c;
      })
      .join('');
  };

  const currentCaesarDecoded = decodeCaesar(quest1Cipher, shiftGuess);

  const handleCheckQuest1 = () => {
    if (currentCaesarDecoded === 'HELLO ENCRYPTOVERSE') {
      setQuest1Solved(true);
      cypherSound.playSuccess();
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
    } else {
      cypherSound.playBlip(220, 'sawtooth');
    }
  };

  // Quest 2: Hash Preimage / Proof of Work Hunter
  const targetPrefix = '000';
  const [nonceInput, setNonceInput] = useState<number>(0);
  const [currentHash, setCurrentHash] = useState<string>('');
  const [mining, setMining] = useState<boolean>(false);
  const [hashRate, setHashRate] = useState<number>(0);
  const [quest2Solved, setQuest2Solved] = useState<boolean>(false);

  const handleTestNonce = async (n: number) => {
    const input = `encryptoverse-${n}`;
    const res = await computeSha256(input);
    setCurrentHash(res.hex);
    if (res.hex.startsWith(targetPrefix)) {
      setQuest2Solved(true);
      cypherSound.playSuccess();
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.7 } });
      return true;
    }
    return false;
  };

  const handleStartMining = async () => {
    setMining(true);
    let n = nonceInput;
    let found = false;
    const startTime = performance.now();

    const mineBatch = async () => {
      for (let i = 0; i < 200; i++) {
        n++;
        const input = `encryptoverse-${n}`;
        const res = await computeSha256(input);
        if (res.hex.startsWith(targetPrefix)) {
          setCurrentHash(res.hex);
          setNonceInput(n);
          setQuest2Solved(true);
          setMining(false);
          cypherSound.playSuccess();
          confetti({ particleCount: 80, spread: 90, origin: { y: 0.7 } });
          found = true;
          break;
        }
      }
      if (!found && n - nonceInput < 50000) {
        setNonceInput(n);
        const elapsed = (performance.now() - startTime) / 1000;
        setHashRate(Math.round((n - nonceInput) / elapsed));
        requestAnimationFrame(mineBatch);
      } else {
        setMining(false);
      }
    };

    mineBatch();
  };

  // Quest 3: The Flawed Two-Time Pad
  const [quest3Answer, setQuest3Answer] = useState<string>('');
  const [quest3Solved, setQuest3Solved] = useState<boolean>(false);
  const [quest3Error, setQuest3Error] = useState<string>('');

  const handleCheckQuest3 = () => {
    if (quest3Answer.trim().toLowerCase() === 'keystream' || quest3Answer.trim().toLowerCase() === 'key') {
      setQuest3Solved(true);
      setQuest3Error('');
      cypherSound.playSuccess();
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
    } else {
      setQuest3Error('Incorrect. Hint: C₁ ⊕ C₂ cancels out the one-time...?');
      cypherSound.playBlip(220, 'sawtooth');
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              CTF Arena
            </span>
            <span className="text-xs font-mono text-slate-400">Learn by Breaking</span>
          </div>
          <h3 className="text-2xl font-bold text-white mt-1">
            The Cryptoverse Quests
          </h3>
          <p className="text-sm text-slate-400">
            Interactive cryptanalysis challenges. Break historical ciphers, hunt hash preimages, and uncover vulnerabilities.
          </p>
        </div>

        {/* Quest Tabs */}
        <div className="flex p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveQuest(1)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeQuest === 1
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {quest1Solved && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
            Quest 01: Roman Cipher
          </button>
          <button
            onClick={() => setActiveQuest(2)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeQuest === 2
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {quest2Solved && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
            Quest 02: Proof-of-Work
          </button>
          <button
            onClick={() => setActiveQuest(3)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeQuest === 3
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {quest3Solved && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
            Quest 03: The Reused Pad
          </button>
        </div>
      </div>

      {/* Quest 1 Content */}
      {activeQuest === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                Intercepted Transmission (Rotational Cipher)
              </span>
              <span className="text-xs font-mono text-slate-500">Difficulty: Novice</span>
            </div>

            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 font-mono text-center">
              <span className="text-xs text-slate-500 block mb-1">Encrypted Payload:</span>
              <span className="text-xl font-bold tracking-widest text-cyan-400">{quest1Cipher}</span>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>Shift Rotation Key (0 - 25):</span>
                <span className="text-amber-400 font-bold">{shiftGuess}</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                value={shiftGuess}
                onChange={(e) => {
                  setShiftGuess(parseInt(e.target.value));
                  cypherSound.playBlip(400 + parseInt(e.target.value) * 15, 'sine', 0.04);
                }}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 font-mono text-center">
              <span className="text-xs text-slate-500 block mb-1">Live Decoded Stream:</span>
              <span className="text-xl font-bold tracking-widest text-emerald-400">
                {currentCaesarDecoded}
              </span>
            </div>

            <button
              onClick={handleCheckQuest1}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 fill-current" />
              Verify Intercept Decryption
            </button>

            {quest1Solved && (
              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/50 font-mono text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Solved! You cracked the Caesar cipher. In classical antiquity, 26 possible keys was enough; today, modern computers test 26 keys in 0.00001 microseconds.
              </div>
            )}
          </div>

          <div className="lg:col-span-4 p-5 rounded-xl bg-slate-950/60 border border-slate-800 font-mono text-xs space-y-3">
            <h4 className="text-xs uppercase text-slate-400 font-bold">Cryptanalysis Intel:</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Monoalphabetic ciphers preserve letter frequency. In English, the letter <strong>E</strong> appears 12.7% of the time, followed by <strong>T</strong> (9.1%) and <strong>A</strong> (8.2%).
            </p>
            <div className="p-2.5 rounded bg-slate-900 text-[11px] text-slate-300">
              <strong>Vulnerability:</strong> Key space size of only 26 allows instant brute-force enumeration.
            </div>
          </div>
        </div>
      )}

      {/* Quest 2 Content */}
      {activeQuest === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                Proof-of-Work: SHA-256 Mining Sandbox
              </span>
              <span className="text-xs font-mono text-slate-500">Difficulty: Medium</span>
            </div>

            <p className="text-xs font-mono text-slate-400">
              Find a nonce such that <code className="text-cyan-300">SHA256("encryptoverse-" + nonce)</code> starts with prefix <strong className="text-amber-400">"{targetPrefix}"</strong>.
            </p>

            <div className="flex gap-2">
              <input
                type="number"
                value={nonceInput}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setNonceInput(val);
                  handleTestNonce(val);
                }}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-white"
                placeholder="Enter nonce manually..."
              />
              <button
                onClick={handleStartMining}
                disabled={mining}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold transition flex items-center gap-1.5 shrink-0"
              >
                <Flame className="w-4 h-4" />
                {mining ? 'Mining Nonce...' : 'Auto Mine Nonce'}
              </button>
            </div>

            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Evaluated Nonce: {nonceInput}</span>
                {hashRate > 0 && <span>Speed: {hashRate} hashes/sec</span>}
              </div>
              <div className="break-all text-[11px]">
                <span className="text-slate-500 block">Calculated Hash:</span>
                <span className={currentHash.startsWith(targetPrefix) ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                  {currentHash || 'Ready to compute...'}
                </span>
              </div>
            </div>

            {quest2Solved && (
              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/50 font-mono text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Valid Block Minted! Nonce {nonceInput} generates a hash with leading zeros. This proves computational work without trust.
              </div>
            )}
          </div>

          <div className="lg:col-span-4 p-5 rounded-xl bg-slate-950/60 border border-slate-800 font-mono text-xs space-y-3">
            <h4 className="text-xs uppercase text-slate-400 font-bold">Proof of Work Anatomy:</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Because cryptographic hash outputs are pseudo-random, the only way to find a hash starting with <em>k</em> zeros is guessing on average <strong>2⁴ᵏ</strong> trials.
            </p>
            <div className="p-2.5 rounded bg-slate-900 text-[11px] text-slate-300">
              <strong>Satoshi's Breakthrough:</strong> Difficult to compute, trivial for anyone to verify with 1 single hash check!
            </div>
          </div>
        </div>
      )}

      {/* Quest 3 Content */}
      {activeQuest === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                The Fatal Flaw: Two-Time Pad Reuse
              </span>
              <span className="text-xs font-mono text-slate-500">Difficulty: Advanced</span>
            </div>

            <p className="text-xs font-mono text-slate-400 leading-relaxed">
              The One-Time Pad is mathematically unbreakable (Shannon perfect secrecy) — <em>only if the key is never reused</em>.
              If two messages M₁ and M₂ are encrypted with the same key K:
            </p>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs space-y-1 text-cyan-300">
              <div>C₁ = M₁ ⊕ K</div>
              <div>C₂ = M₂ ⊕ K</div>
              <div className="text-amber-400 font-bold">C₁ ⊕ C₂ = (M₁ ⊕ K) ⊕ (M₂ ⊕ K) = M₁ ⊕ M₂</div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-300 block">
                Question: What component is completely eliminated when XORing the two ciphertexts together?
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={quest3Answer}
                  onChange={(e) => setQuest3Answer(e.target.value)}
                  placeholder="Enter word (e.g., key or keystream)..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-white"
                />
                <button
                  onClick={handleCheckQuest3}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold transition"
                >
                  Submit
                </button>
              </div>
            </div>

            {quest3Error && <div className="text-xs font-mono text-rose-400">{quest3Error}</div>}

            {quest3Solved && (
              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/50 font-mono text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Correct! The secret key is completely cancelled out, leaving the plaintexts vulnerable to crib-dragging frequency attacks!
              </div>
            )}
          </div>

          <div className="lg:col-span-4 p-5 rounded-xl bg-slate-950/60 border border-slate-800 font-mono text-xs space-y-3">
            <h4 className="text-xs uppercase text-slate-400 font-bold">Historical Context:</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              During the Cold War, the Soviet Union accidentally reused one-time pad pages. The United States' <strong>Project VENONA</strong> intercepted and decrypted thousands of KGB diplomatic cables as a result!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
