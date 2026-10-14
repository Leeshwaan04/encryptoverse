import React from 'react';
import { Lock, Shield, Terminal } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-24 border-t border-slate-800/80 bg-[#05070b] relative z-10 font-mono text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Quote banner */}
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 relative overflow-hidden">
          <div className="max-w-3xl space-y-2">
            <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" /> A Cypherpunk's Manifesto (Eric Hughes, 1993)
            </div>
            <p className="text-slate-300 italic text-xs sm:text-sm leading-relaxed">
              "Privacy is necessary for an open society in the electronic age... We cannot expect governments, corporations, or other large, faceless organizations to grant us privacy... We must defend our own privacy if we expect to have any. We the Cypherpunks are dedicated to building anonymous systems."
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-4">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <span className="font-bold text-white text-sm">ENCRYPTOVERSE</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              The open-source interactive universe dedicated to demystifying modern cryptography, zero-knowledge proofs, and post-quantum security.
            </p>
            <div className="flex items-center gap-2 text-emerald-400 text-[11px]">
              <Shield className="w-3.5 h-3.5" />
              <span>100% Client-Side Computing · Zero Server Logging</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-white font-bold uppercase tracking-wider text-[11px]">
              Standards & Primitives
            </div>
            <ul className="space-y-1.5 text-slate-400 text-xs">
              <li>NIST FIPS 203 (ML-KEM / Kyber)</li>
              <li>NIST FIPS 204 (ML-DSA / Dilithium)</li>
              <li>RFC 8439 (ChaCha20-Poly1305)</li>
              <li>NIST SP 800-38D (AES-GCM)</li>
              <li>SEC 2: Recommended Elliptic Curves</li>
            </ul>
          </div>

          <div className="space-y-2">
            <div className="text-white font-bold uppercase tracking-wider text-[11px]">
              Open Source
            </div>
            <ul className="space-y-1.5 text-slate-400 text-xs">
              <li>
                <a
                  href="https://github.com/Leeshwaan04/encryptoverse"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-400 flex items-center gap-1.5 transition"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  GitHub Repository
                </a>
              </li>
              <li>MIT License</li>
              <li>WebAssembly & WebCrypto Core</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © {new Date().getFullYear()} Encryptoverse. Built for cypherpunks, builders & explorers.
          </div>
          <div className="flex items-center gap-1">
            <span>Secured with open mathematical truths</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
