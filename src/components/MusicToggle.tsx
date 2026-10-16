import React from 'react';
import { Music } from 'lucide-react';
import { MUSIC_CREDIT, musicPlayer } from '../lib/music';
import { useMusicState } from '../lib/useMusic';

/** Floating, opt-in soundtrack control. Stays out of the way (low, left) and is hidden behind modals. */
export const MusicToggle: React.FC = () => {
  const state = useMusicState();
  const playing = state === 'playing' || state === 'loading';
  const label =
    state === 'error' ? 'Music unavailable. Try again' : playing ? 'Pause background music' : 'Play background music';

  return (
    <button
      type="button"
      onClick={() => musicPlayer.toggle()}
      aria-label={label}
      title={`${MUSIC_CREDIT.title} — ${MUSIC_CREDIT.artist}`}
      className="fixed left-3 bottom-3 sm:left-4 sm:bottom-4 z-30 flex items-center justify-center gap-2.5 h-11 min-w-11 px-3 sm:pl-3.5 sm:pr-4 rounded-full border border-slate-700 bg-[#0b0f17]/90 backdrop-blur text-slate-100 text-xs font-semibold shadow-lg shadow-black/40 hover:border-cyan-400 hover:text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
    >
      {playing ? (
        <span className="flex items-end gap-[3px] h-4" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="eq-bar w-[3px] h-full rounded-sm bg-cyan-400" style={{ animationDelay: `${i * 0.18}s` }} />
          ))}
        </span>
      ) : (
        <Music className="w-4 h-4 text-cyan-300" aria-hidden="true" />
      )}
      <span className="hidden sm:inline" aria-hidden="true">{state === 'error' ? 'Unavailable' : playing ? 'Playing' : 'Music'}</span>
    </button>
  );
};
