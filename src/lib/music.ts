// Optional background soundtrack. Never autoplays: browsers block it and unexpected audio on a finance
// dashboard is hostile, so playback only ever starts from an explicit click on the music button.

export type MusicState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

const SRC = '/media/soundtrack.mp3';
const TARGET_VOLUME = 0.3; // sits under the UI; the visitor's system volume still applies on top

class MusicPlayer {
  private audio: HTMLAudioElement | null = null;
  private fadeTimer: number | undefined;
  /** What the visitor asked for, so a hidden tab pausing the audio does not override an explicit choice. */
  private wantPlaying = false;
  private listeners = new Set<() => void>();
  state: MusicState = 'idle';

  constructor() {
    if (typeof document === 'undefined') return;
    document.addEventListener('visibilitychange', () => {
      const a = this.audio;
      if (!a || !this.wantPlaying) return;
      if (document.hidden) {
        a.pause();
      } else {
        a.play().then(() => this.fadeTo(TARGET_VOLUME, 800)).catch(() => undefined);
      }
    });
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getState = (): MusicState => this.state;

  private setState(next: MusicState) {
    if (this.state === next) return;
    this.state = next;
    this.listeners.forEach((l) => l());
  }

  private ensureAudio(): HTMLAudioElement {
    if (this.audio) return this.audio;
    const a = new Audio(SRC);
    a.loop = true;
    a.preload = 'none'; // nothing is downloaded until the visitor presses play
    a.volume = 0;
    a.addEventListener('error', () => {
      this.wantPlaying = false;
      this.setState('error');
    });
    this.audio = a;
    return a;
  }

  private fadeTo(target: number, ms: number, done?: () => void) {
    const a = this.audio;
    if (!a) return;
    window.clearInterval(this.fadeTimer);
    const from = a.volume;
    const steps = Math.max(1, Math.round(ms / 40));
    let i = 0;
    this.fadeTimer = window.setInterval(() => {
      i += 1;
      a.volume = Math.min(1, Math.max(0, from + ((target - from) * i) / steps));
      if (i >= steps) {
        window.clearInterval(this.fadeTimer);
        done?.();
      }
    }, 40);
  }

  private registerMediaSession() {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({ title: 'Encryptoverse', artist: 'Encryptoverse' });
    navigator.mediaSession.setActionHandler('play', () => void this.play());
    navigator.mediaSession.setActionHandler('pause', () => this.pause());
  }

  async play(): Promise<void> {
    this.wantPlaying = true;
    const a = this.ensureAudio();
    this.setState('loading');
    try {
      await a.play();
      this.fadeTo(TARGET_VOLUME, 1200);
      this.registerMediaSession();
      this.setState('playing');
    } catch {
      this.wantPlaying = false;
      this.setState('error');
    }
  }

  pause(): void {
    this.wantPlaying = false;
    const a = this.audio;
    if (!a) return;
    this.setState('paused');
    this.fadeTo(0, 500, () => a.pause());
  }

  toggle(): void {
    if (this.state === 'playing' || this.state === 'loading') this.pause();
    else void this.play();
  }
}

export const musicPlayer = new MusicPlayer();
