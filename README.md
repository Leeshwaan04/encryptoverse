# 🪐 ENCRYPTOVERSE (`encryptoverse.com`)

> **The Interactive Universe of Modern Cryptography, Zero-Knowledge Proofs, and Post-Quantum Security.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![NIST Standards](https://img.shields.io/badge/NIST-FIPS_203_%26_204_Ready-00f5ff.svg)](#the-post-quantum-frontier)
[![Privacy](https://img.shields.io/badge/Client--Side-100%25_Zero--Telemetry-10b981.svg)](#100-client-side-privacy-guarantee)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF.svg)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev/)

---

## 🌟 Vision

Most developers and cypherpunks encounter modern cryptography as impenetrable mathematical formulas, dry RFCs, or black-box libraries.

**Encryptoverse** transforms abstract mathematics into **tangible, visual, and interactive simulations**:
- Understand why **Elliptic Curve scalar multiplication** powers Bitcoin and Ethereum.
- Witness how **Zero-Knowledge proofs** verify truth without leaking a single bit of private information.
- Explore **High-Dimensional Lattice grids** that will safeguard civilization against quantum decryption (Shor's algorithm).
- Encrypt messages and files locally using standard **AES-256-GCM** with zero data leaving your machine.

---

## 🔬 Core Product Pillars

### 0. 🪙 Encryptoverse Token ($ECV) ICO & Presale Portal
- **Decentralized Token Presale Launchpad:**
  - Multi-stage public token sale dashboard with live countdown clock and soft/hard cap indicators.
  - Multi-currency swap portal supporting **ETH**, **USDT**, **USDC**, and **SOL**.
  - Dynamic Cypherpunk tier bonus calculation (+3% to +15% based on acquisition volume).
  - Web3 wallet connect simulation with instant allocation confirmations and smart contract verification badge.
- **Cyphernomics (Token Distribution):**
  - **35%** Public ICO / Presale (linear 6-month unlock)
  - **20%** Zero-Knowledge & Post-Quantum R&D Treasury
  - **18%** Staking & Privacy Verifier Rewards
  - **12%** CTF Quests & Community Bug Bounties
  - **10%** Core Cypherpunks & Contributors (18-month vesting, 6-month cliff)
  - **5%** DEX/CEX Launch Liquidity Pool (Permanently locked)
- **Token Utilities:**
  - **ZK Gas Subsidy:** 50% discount on client/server zero-knowledge proof generation and validation.
  - **Quantum-Safe Vaults:** Stake $ECV to unlock end-to-end encrypted decentralized IPFS/Arweave cloud storage quotas.
  - **DAO Protocol Governance:** Quadratic voting on supported cryptographic primitives and privacy grants.

### 1. 🌌 The Cryptography Holodeck (60fps Canvas Simulations)
- **Elliptic Curve Group Law Simulator:**
  - Interactive Weierstrass cubic curve ($y^2 = x^3 + ax + b$).
  - Dynamic parameters $a$ and $b$ (including presets like Bitcoin's `secp256k1`: $a=0, b=7$).
  - Real-time secant and tangent line intersections, vertical reflections, and group addition $R = P + Q$.
  - Step-by-step group law algebra ($\lambda$, $x_3$, $y_3$).
  - Interactive double-and-add scalar multiplication simulation demonstrating the Discrete Logarithm Problem (ECDLP).
- **Post-Quantum Lattice-Based Cryptography (LWE) Visualizer:**
  - 2D basis vector projection ($b_1, b_2$) demonstrating the Learning With Errors (LWE) problem.
  - Gaussian error noise injection showing why linear algebra fails to recover the secret without the private basis trapdoor.
  - Architectural breakdown of NIST standards **ML-KEM (Kyber)** and **ML-DSA (Dilithium)**.

### 2. 🛡️ The Zero-Knowledge (ZK) Lab
- **Interactive Sigma / Schnorr Proof of Knowledge:**
  - Real-time simulation between **Prover (Peggy)** and **Verifier (Victor)** over finite field $\mathbb{F}_{23}$.
  - Toggle between **Honest Prover** (knows secret $x$) and **Impostor** (trying to cheat Victor).
  - 4-step interactive protocol: Commitment ($T = g^r \pmod p$) $\to$ Coin-Flip Challenge ($c \in \{0, 1\}$) $\to$ Proof Response ($s = r + c \cdot x$) $\to$ Verification check ($g^s \equiv T \cdot Y^c \pmod p$).
  - Soundness error accumulator tracking cheating probability drop ($2^{-n}$ decay).

### 3. 🧰 The Cypherpunk Privacy Suite (100% In-Browser)
- **AES-256-GCM Vault:**
  - Authenticated encryption with 100,000 PBKDF2 iterations using native hardware-accelerated `window.crypto.subtle`.
  - Generates armored Base64 encrypted JSON payloads with initialization vector, salt, and authentication tags.
- **Strict Avalanche Effect Lab:**
  - Live side-by-side comparison of SHA-256 digests.
  - Bit-flip meter showing exact percentage of flipped bits from a single character change.
- **Post-Quantum Standards Inspector:**
  - Key-size footprint and quantum resilience comparison (ML-KEM-768 vs ML-DSA-87 vs Ed25519 vs RSA-4096).

### 4. ⚔️ The Cryptoverse Quests (CTF Arena)
- **Quest 01:** The Roman Intercept (Rotational Caesar cipher with live frequency decoder).
- **Quest 02:** Proof-of-Work Miner (Search for SHA-256 hash preimages with leading zeroes).
- **Quest 03:** The Flawed Two-Time Pad (Understanding why XORing nonces exposes plaintexts).

### 5. 📜 The Constellation Chronicles
- Explorable timeline of cryptographic breakthroughs:
  - **Era 01:** Classical & Mechanical Ciphers (Scytale, Vigenère, Enigma)
  - **Era 02:** The Public-Key Revolution (Shannon, Diffie-Hellman, RSA)
  - **Era 03:** Elliptic Curves & Web3 (Koblitz, Cypherpunk Manifesto, Bitcoin)
  - **Era 04:** Zero-Knowledge & Homomorphic Compute (Groth16, ZK-Rollups, FHE)
  - **Era 05:** The Post-Quantum Frontier (NIST FIPS 203/204 Lattice Standards)

---

## 🔒 100% Client-Side Privacy Guarantee

Encryptoverse does not require account creation, cookies, tracking, or telemetry. All cryptographic computations execute entirely within your browser's native WebCrypto engine.

---

## 🚀 Quickstart & Development

### Prerequisites
- [Node.js](https://nodejs.org/) v20+
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)

### Installation

```bash
# Clone the repository
git clone https://github.com/Leeshwaan04/encryptoverse.git
cd encryptoverse

# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build

```bash
npm run build
npm run preview
```

---

## 🛠️ Tech Stack

- **Framework:** [React 19](https://react.dev/) + [Vite 8](https://vitejs.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Visuals:** Native HTML5 2D Canvas & WebGL
- **Audio Feedback:** Synthesizer Web Audio API
- **Confetti:** `canvas-confetti`

---

## 📜 Manifesto

> *"Privacy is necessary for an open society in the electronic age... We cannot expect governments, corporations, or other large, faceless organizations to grant us privacy... We must defend our own privacy if we expect to have any. We the Cypherpunks are dedicated to building anonymous systems."*  
> — **Eric Hughes, 1993**

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.
