// Encryptoverse Cryptographic Utilities
// Pure in-browser client-side WebCrypto implementation

/**
 * Derives an AES-GCM key from a passphrase using PBKDF2
 */
export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts plaintext with AES-256-GCM
 * Returns armored base64 JSON payload containing salt, iv, and ciphertext
 */
export async function encryptText(plaintext: string, secretKey: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(secretKey, salt);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    enc.encode(plaintext)
  );

  const payload = {
    alg: 'AES-256-GCM',
    kdf: 'PBKDF2-SHA256-100K',
    salt: Array.from(salt),
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encryptedBuffer)),
    timestamp: new Date().toISOString(),
  };

  return btoa(JSON.stringify(payload));
}

/**
 * Decrypts an armored base64 JSON payload with AES-256-GCM
 */
export async function decryptText(armoredPayload: string, secretKey: string): Promise<string> {
  try {
    const rawJson = atob(armoredPayload.trim());
    const payload = JSON.parse(rawJson);

    if (!payload.salt || !payload.iv || !payload.data) {
      throw new Error('Malformed Encryptoverse payload');
    }

    const salt = new Uint8Array(payload.salt);
    const iv = new Uint8Array(payload.iv);
    const encryptedData = new Uint8Array(payload.data);

    const key = await deriveKey(secretKey, salt);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encryptedData
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw new Error(`Decryption failed: Incorrect key or corrupted payload (${err.message})`);
    }
    throw new Error('Decryption failed: Incorrect key or corrupted ciphertext.');
  }
}

/**
 * Computes SHA-256 of string and returns hex and binary representation
 */
export async function computeSha256(input: string): Promise<{ hex: string; binary: string }> {
  const enc = new TextEncoder();
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', enc.encode(input));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  const binary = hashArray.map((b) => b.toString(2).padStart(8, '0')).join('');
  return { hex, binary };
}

/**
 * Measures bit avalanche effect between two texts
 */
export async function calculateAvalanche(
  textA: string,
  textB: string
): Promise<{ flippedBits: number; percentage: number; diffIndices: number[] }> {
  const hashA = await computeSha256(textA);
  const hashB = await computeSha256(textB);

  let flipped = 0;
  const diffIndices: number[] = [];

  for (let i = 0; i < hashA.binary.length; i++) {
    if (hashA.binary[i] !== hashB.binary[i]) {
      flipped++;
      diffIndices.push(i);
    }
  }

  const percentage = Math.round((flipped / 256) * 100);
  return { flippedBits: flipped, percentage, diffIndices };
}

/**
 * Audio synthesis helper for futuristic cyberpunk feedback
 */
export class CypherAudio {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  playBlip(freq = 880, type: OscillatorType = 'sine', duration = 0.08) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, this.ctx.currentTime + duration);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  playSuccess() {
    this.playBlip(523.25, 'triangle', 0.1);
    setTimeout(() => this.playBlip(659.25, 'triangle', 0.1), 80);
    setTimeout(() => this.playBlip(1046.5, 'sine', 0.2), 160);
  }
}

export const cypherSound = new CypherAudio();
