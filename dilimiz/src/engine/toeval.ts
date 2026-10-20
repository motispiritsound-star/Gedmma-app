/**
 * Toeval dat zich laat herhalen.
 *
 * Een oefenronde wordt uit een zaadje gebouwd, zodat dezelfde les twee keer
 * dezelfde ronde geeft -- en zodat een test kan nameten wat eruit komt.
 * `Math.random()` zou dat allebei onmogelijk maken.
 */

/** mulberry32: klein, snel, en goed genoeg voor het schudden van kaarten. */
export function mulberry32(zaadje: number): () => number {
  let a = zaadje >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const zaadjeUit = (tekst: string): number => {
  let h = 2166136261
  for (let i = 0; i < tekst.length; i++) {
    h ^= tekst.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Fisher-Yates, op een kopie. */
export function schud<T>(lijst: readonly T[], rnd: () => number): T[] {
  const uit = [...lijst]
  for (let i = uit.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[uit[i], uit[j]] = [uit[j]!, uit[i]!]
  }
  return uit
}

export const kies = <T,>(lijst: readonly T[], rnd: () => number): T =>
  lijst[Math.floor(rnd() * lijst.length)]!
