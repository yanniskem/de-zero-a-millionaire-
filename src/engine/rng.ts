// Générateur pseudo-aléatoire déterministe (mulberry32).
// L'état (un entier 32 bits) est stocké dans la partie : une même graine rejoue le même scénario.

export interface Rng {
  next(): number;
  chance(p: number): boolean;
  range(min: number, max: number): number;
  int(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
  normal(mean: number, sd: number): number;
  weighted<T>(items: readonly T[], weight: (item: T) => number): T | undefined;
  readonly state: number;
}

export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rng: Rng = {
    next,
    chance: (p) => next() < p,
    range: (min, max) => min + next() * (max - min),
    int: (min, max) => Math.floor(min + next() * (max - min + 1)),
    pick: (items) => items[Math.floor(next() * items.length)],
    normal: (mean, sd) => {
      // Box-Muller
      const u = Math.max(next(), 1e-9);
      const v = next();
      return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    },
    weighted: (items, weight) => {
      const ws = items.map((i) => Math.max(0, weight(i)));
      const total = ws.reduce((s, w) => s + w, 0);
      if (total <= 0) return undefined;
      let r = next() * total;
      for (let i = 0; i < items.length; i++) {
        r -= ws[i];
        if (r < 0) return items[i];
      }
      return items[items.length - 1];
    },
    get state() {
      return a;
    },
  };
  return rng;
}

export function randomSeed(): number {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    return crypto.getRandomValues(new Uint32Array(1))[0];
  }
  return Math.floor(Math.random() * 2 ** 32);
}
