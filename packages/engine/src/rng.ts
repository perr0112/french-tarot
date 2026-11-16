/** A source of uniform numbers in [0, 1). */
export type Rng = () => number;

/** Small seeded PRNG (mulberry32) so a deal is reproducible from its seed (ADR-0003). */
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Uniform integer in [0, max). */
export function randomInt(rng: Rng, max: number): number {
  return Math.floor(rng() * max);
}

/** Fisher–Yates shuffle returning a new array. */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(rng, i + 1);
    [result[i], result[j]] = [result[j] as T, result[i] as T];
  }
  return result;
}
