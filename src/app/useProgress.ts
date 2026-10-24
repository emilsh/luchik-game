import { useSyncExternalStore } from 'react';
import { progress } from '../game/systems/ProgressManager';
import type { SaveData } from '../types/game';

export function useProgress(): SaveData {
  return useSyncExternalStore(progress.subscribe, progress.getSnapshot);
}
