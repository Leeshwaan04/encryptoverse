import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  Copy,
  Check,
  Hash,
  Shield,
  Layers,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import {
  encryptText,
  decryptText,
  computeSha256,
  calculateAvalanche,
  cypherSound
} from '../lib/crypto-utils';

export const CypherSuite: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'vault' | 'hash' | 'pq'>('vault');

  // Vault state
  const [passphrase, setPassphrase] = useState<string>('super-cypherpunk-secret-2026');
  const [plaintext, setPlaintext] = useState<string>(
    'Encryptoverse: Privacy is the power to selectively reveal oneself to the world.'
  );
  const [ciphertext, setCiphertext] = useState<string>('');
  const [decryptInput, setDecryptInput] = useState<string>('');
  const [decryptedOutput, setDecryptedOutput] = useState<string>('');
  const [decryptPassphrase, setDecryptPassphrase] = useState<string>('super-cypherpunk-secret-2026');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [copiedCipher, setCopiedCipher] = useState<boolean>(false);

  // Hash state
  const [hashInput1, setHashInput1] = useState<string>('Encryptoverse');
  const [hashInput2, setHashInput2] = useState<string>('encryptoverse');
  const [hash1, setHash1] = useState<{ hex: string; binary: string }>({ hex: '', binary: '' });
  const [hash2, setHash2] = useState<{ hex: string; binary: string }>({ hex: '', binary: '' });
  const [avalanche, setAvalanche] = useState<{ flippedBits: number; percentage: number; diffIndices: number[] }>({
    flippedBits: 0,
    percentage: 0,
    diffIndices: [],
  });

  // Post Quantum Inspector state
  const [selectedAlgo, setSelectedAlgo] = useState<'kyber768' | 'dilithium3' | 'ed25519' | 'rsa4096'>('kyber768');
  const [generatedKey, setGeneratedKey] = useState<{ pubKey: string; privKey: string; size: string; status: string }>({
    pubKey: '0x_ML_KEM_768_PUB_f7a28b49c0d12e84...[1,184 bytes total]',
    privKey: '0x_ML_KEM_768_PRIV_90c34e12fa78bc90...[2,400 bytes total]',
    size: '1,184 Bytes Public | 2,400 Bytes Private',
    status: 'NIST FIPS 203 Standard (Post-Quantum Secure)',
  });

  // Handle encryption
  const handleEncrypt = async () => {
    try {
      setErrorMsg('');
      const enc = await encryptText(plaintext, passphrase);
      setCiphertext(enc);
      setDecryptInput(enc);
      cypherSound.playSuccess();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Encryption error');
      }
    }
  };

  // Handle decryption
  const handleDecrypt = async () => {
    try {
      setErrorMsg('');
      const dec = await decryptText(decryptInput, decryptPassphrase);
      setDecryptedOutput(dec);
      cypherSound.playSuccess();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Decryption failed. Check passphrase or payload.');
      }
    }
  };

  // Run hash calculations
  useEffect(() => {
    const runHash = async () => {
      const h1 = await computeSha256(hashInput1);
      const h2 = await computeSha256(hashInput2);
      setHash1(h1);
      setHash2(h2);
      const av = await calculateAvalanche(hashInput1, hashInput2);
      setAvalanche(av);
    };
    runHash();
  }, [hashInput1, hashInput2]);

  // Generate simulated PQ / classical keys
  const generateKeysForAlgo = (algo: 'kyber768' | 'dilithium3' | 'ed25519' | 'rsa4096') => {
    setSelectedAlgo(algo);
    cypherSound.playBlip(700, 'triangle');

    const randHex = (len: number) => {
      const arr = new Uint8Array(len);
      window.crypto.getRandomValues(arr);
      return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
    };

    switch (algo) {
      case 'kyber768':
        setGeneratedKey({
          pubKey: `0x_ML_KEM_768_PUB_${randHex(32)}...[1,184 bytes total]`,
          privKey: `0x_ML_KEM_768_PRIV_${randHex(32)}...[2,400 bytes total]`,
          size: '1,184 Bytes Public | 2,400 Bytes Private',
          status: 'NIST FIPS 203 Standard (Post-Quantum Secure)',
        });
        break;
      case 'dilithium3':
        setGeneratedKey({
          pubKey: `0x_ML_DSA_87_PUB_${randHex(32)}...[1,952 bytes total]`,
          privKey: `0x_ML_DSA_87_PRIV_${randHex(32)}...[4,000 bytes total]`,
          size: '1,952 Bytes Public | 4,000 Bytes Private',
          status: 'NIST FIPS 204 Standard (Post-Quantum Digital Signature)',
        });
        break;
      case 'ed25519':
        setGeneratedKey({
          pubKey: `0x_ED25519_PUB_${randHex(32)}`,
          privKey: `0x_ED25519_PRIV_${randHex(32)}`,
          size: '32 Bytes Public | 64 Bytes Private',
          status: 'Classical (Vulnerable to Shor\'s Quantum Alg)',
        });
        break;
      case 'rsa4096':
        setGeneratedKey({
          pubKey: `-----BEGIN PUBLIC KEY-----\nMIIBojANBgkqhkiG9w0BAQEFAAOCAY8A...[512 bytes]\n-----END PUBLIC KEY-----`,
          privKey: `-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0...[4,096 bit modulus]\n-----END RSA PRIVATE KEY-----`,
          size: '512 Bytes Public | 2,400 Bytes Private',
          status: 'Classical (Vulnerable to Quantum Computers)',
        });
        break;
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              100% In-Browser Privacy
            </span>
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> Zero Data Leaves Your Device
            </span>
          </div>
          <h3 className="text-2xl font-bold text-white mt-1">
            Cypherpunk Developer & Privacy Suite
          </h3>
          <p className="text-sm text-slate-400">
            Hardware-accelerated WebCrypto primitives, authenticated encryption, and post-quantum inspection.
          </p>
        </div>

        {/* Tab navigation */}
        <div className="flex p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
          <button
            onClick={() => {
              setActiveTab('vault');
              cypherSound.playBlip(500);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'vault'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" /> AES-256 Vault
          </button>
          <button
            onClick={() => {
              setActiveTab('hash');
              cypherSound.playBlip(500);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'hash'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Hash className="w-3.5 h-3.5" /> Avalanche Lab
          </button>
          <button
            onClick={() => {
              setActiveTab('pq');
              cypherSound.playBlip(500);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'pq'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Post-Quantum NIST
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs font-mono text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tab 1: In-Browser Vault */}
      {activeTab === 'vault' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Encryption Panel */}
          <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Lock className="w-4 h-4" /> Authenticated Encryption (AES-GCM-256)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
                PBKDF2 · 100,000 Iterations
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Passphrase / Secret Key:</label>
              <input
                type="text"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-white focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Plaintext Message to Shield:</label>
              <textarea
                rows={3}
                value={plaintext}
                onChange={(e) => setPlaintext(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            <button
              onClick={handleEncrypt}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono text-xs font-bold shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" /> Encrypt In-Browser
            </button>

            {ciphertext && (
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between items-center text-xs font-mono text-slate-400">
                  <span>Armored Ciphertext (Base64 JSON):</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(ciphertext);
                      setCopiedCipher(true);
                      setTimeout(() => setCopiedCipher(false), 2000);
                    }}
                    className="flex items-center gap-1 text-cyan-400 hover:underline"
                  >
                    {copiedCipher ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedCipher ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-cyan-300 break-all max-h-24 overflow-y-auto">
                  {ciphertext}
                </div>
              </div>
            )}
          </div>

          {/* Decryption Panel */}
          <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <Unlock className="w-4 h-4" /> Authenticated Decryption
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40">
                Integrity Checked
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Passphrase for Decryption:</label>
              <input
                type="text"
                value={decryptPassphrase}
                onChange={(e) => setDecryptPassphrase(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-white focus:outline-none focus:border-purple-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Encrypted Payload:</label>
              <textarea
                rows={3}
                value={decryptInput}
                onChange={(e) => setDecryptInput(e.target.value)}
                placeholder="Paste base64 ciphertext payload here..."
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-200 focus:outline-none focus:border-purple-500 transition"
              />
            </div>

            <button
              onClick={handleDecrypt}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono text-xs font-bold shadow-lg shadow-purple-500/20 transition flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" /> Decrypt & Verify Tag
            </button>

            {decryptedOutput && (
              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Recovered Plaintext:
                </span>
                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 font-mono text-xs text-emerald-200">
                  {decryptedOutput}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Avalanche Effect Lab */}
      {activeTab === 'hash' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <label className="text-xs font-mono text-slate-400">Input String 1:</label>
              <input
                type="text"
                value={hashInput1}
                onChange={(e) => setHashInput1(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-cyan-300"
              />
              <div className="pt-2 text-[11px] font-mono text-slate-400 break-all">
                <span className="text-slate-500 block">SHA-256 Hex:</span>
                <span className="text-cyan-400 font-bold">{hash1.hex}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <label className="text-xs font-mono text-slate-400">Input String 2 (Slightly modified):</label>
              <input
                type="text"
                value={hashInput2}
                onChange={(e) => setHashInput2(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-purple-300"
              />
              <div className="pt-2 text-[11px] font-mono text-slate-400 break-all">
                <span className="text-slate-500 block">SHA-256 Hex:</span>
                <span className="text-purple-400 font-bold">{hash2.hex}</span>
              </div>
            </div>
          </div>

          {/* Avalanche Metric */}
          <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                The Avalanche Effect (Strict Avalanche Criterion)
              </span>
              <span className="text-cyan-400 font-bold text-base">
                {avalanche.flippedBits} / 256 bits flipped ({avalanche.percentage}%)
              </span>
            </div>

            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-400 to-purple-500 h-full transition-all duration-300"
                style={{ width: `${avalanche.percentage}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              In a cryptographically secure hash function (like SHA-256), flipping a single bit in the input must cause each output bit to flip with 50% probability. This guarantees zero predictability or correlation.
            </p>

            {/* Bit Stream Comparison Preview */}
            <div className="space-y-1 pt-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                First 64 Bits Comparison (Red = Flipped):
              </span>
              <div className="p-2 rounded bg-slate-900 font-mono text-[11px] flex flex-wrap gap-1 leading-none">
                {hash1.binary.slice(0, 64).split('').map((bit, idx) => {
                  const isDiff = hash2.binary[idx] !== bit;
                  return (
                    <span
                      key={idx}
                      className={`px-1 py-0.5 rounded text-[10px] ${
                        isDiff
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                          : 'bg-slate-800/80 text-slate-400'
                      }`}
                    >
                      {bit}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Post-Quantum Standards Inspector */}
      {activeTab === 'pq' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'kyber768', label: 'ML-KEM (Kyber-768)', type: 'Lattice KEM' },
              { id: 'dilithium3', label: 'ML-DSA (Dilithium-3)', type: 'Lattice Signature' },
              { id: 'ed25519', label: 'Ed25519', type: 'Classical ECC' },
              { id: 'rsa4096', label: 'RSA-4096', type: 'Classical Factoring' },
            ].map((algo) => (
              <button
                key={algo.id}
                onClick={() => generateKeysForAlgo(algo.id as any)}
                className={`p-3 rounded-xl border text-left font-mono transition ${
                  selectedAlgo === algo.id
                    ? 'bg-purple-950/40 border-purple-500/60 text-white'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold">{algo.label}</div>
                <div className="text-[10px] text-slate-500">{algo.type}</div>
              </button>
            ))}
          </div>

          <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <span className="text-slate-400 text-xs block">Key Size Footprint:</span>
                <span className="text-cyan-300 font-bold">{generatedKey.size}</span>
              </div>
              <div>
                <span className="text-slate-400 text-xs block">Quantum Resilience:</span>
                <span className={generatedKey.status.includes('Secure') || generatedKey.status.includes('NIST') ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {generatedKey.status}
                </span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block mb-1">Public Key Representation:</span>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400 text-[11px] break-all">
                {generatedKey.pubKey}
              </div>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block mb-1">Private Key Representation:</span>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-purple-400 text-[11px] break-all">
                {generatedKey.privKey}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
