/** Kleine, deterministische random-generator zodat vragen reproduceerbaar zijn in tests. */
export type Rng = () => number;

export function maakRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Willekeurig geheel getal in [min, max] (beide inclusief). */
export function heelGetal(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function kies<T>(rng: Rng, lijst: readonly T[]): T {
  return lijst[Math.floor(rng() * lijst.length)];
}

/** Fisher-Yates op een kopie. */
export function husselen<T>(rng: Rng, lijst: readonly T[]): T[] {
  const uit = [...lijst];
  for (let i = uit.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [uit[i], uit[j]] = [uit[j], uit[i]];
  }
  return uit;
}

/** Kies `aantal` verschillende elementen; herhaalt pas als de lijst op is. */
export function kiesUniek<T>(rng: Rng, lijst: readonly T[], aantal: number): T[] {
  if (lijst.length === 0) return [];
  const uit: T[] = [];
  let voorraad = husselen(rng, lijst);
  while (uit.length < aantal) {
    if (voorraad.length === 0) voorraad = husselen(rng, lijst);
    uit.push(voorraad.pop()!);
  }
  return uit;
}
