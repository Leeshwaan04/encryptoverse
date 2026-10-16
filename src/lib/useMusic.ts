import { useSyncExternalStore } from 'react';
import { musicPlayer, type MusicState } from './music';

export function useMusicState(): MusicState {
  return useSyncExternalStore(musicPlayer.subscribe, musicPlayer.getState, () => 'idle' as MusicState);
}
