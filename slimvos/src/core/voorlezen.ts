/**
 * Maakt van een vraag een zin die prettig klinkt als hij wordt voorgelezen.
 * Rekentekens worden uitgesproken, want "8 × 7 = ?" leest een stem anders voor
 * als "acht x zeven is vraagteken".
 */
export function voorleesTekst(stam: string, context?: string): string {
  const uitgesproken = stam
    .replace(/×/g, ' keer ')
    .replace(/÷|:/g, ' gedeeld door ')
    .replace(/−|-/g, ' min ')
    .replace(/\+/g, ' plus ')
    .replace(/=\s*\?/g, ' is hoeveel?')
    .replace(/=/g, ' is ')
    .replace(/%/g, ' procent ')
    .replace(/€\s*/g, ' euro ')
    .replace(/²/g, ' vierkant ')
    .replace(/³/g, ' kubieke ')
    .replace(/_{2,}/g, ' wat? ')
    .replace(/\s+/g, ' ')
    .trim();
  return context ? `${context}. ${uitgesproken}` : uitgesproken;
}
