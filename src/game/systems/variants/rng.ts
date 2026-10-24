// Deterministic random number generator: the same seed — the same tasks.
// The seed is set per playthrough (for tests — via ?seed=N).

export interface Rng {
  next(): number;
  int(min: number, max: number): number;
  pick<T>(list: readonly T[]): T;
  shuffle<T>(list: readonly T[]): T[];
  chance(p: number): boolean;
}

export function makeRng(seed: number): Rng {
  let s = seed >>> 0 || 1;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number) => (max < min ? min : min + Math.floor(next() * (max - min + 1)));
  return {
    next,
    int,
    pick: <T>(list: readonly T[]) => list[Math.floor(next() * list.length)],
    shuffle: <T>(list: readonly T[]) => {
      const a = [...list];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    chance: (p: number) => next() < p,
  };
}
