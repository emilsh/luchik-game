import type { LevelDef } from '../../types/game';
import { level1 } from './level1';
import { level2 } from './level2';
import { level3 } from './level3';
import { level4 } from './level4';
import { level5 } from './level5';
import { level6 } from './level6';
import { level7 } from './level7';
import { level8 } from './level8';
import { level9 } from './level9';
import { level10 } from './level10';
import { level11 } from './level11';
import { level12 } from './level12';

export const LEVELS: LevelDef[] = [
  level1,
  level2,
  level3,
  level4,
  level5,
  level6,
  level7,
  level8,
  level9,
  level10,
  level11,
  level12,
];

export function getLevel(id: number): LevelDef {
  const l = LEVELS.find((lv) => lv.id === id);
  if (!l) throw new Error(`Unknown level ${id}`);
  return l;
}

/** Все награды за уровень: основная и дополнительные. */
export function levelRewards(l: LevelDef) {
  return [l.reward, ...(l.extraRewards ?? [])];
}
