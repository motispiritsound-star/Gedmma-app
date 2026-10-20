/**
 * De enige plek die `import.meta.env` leest.
 *
 * Zo is in één bestand te zien wat per omgeving verschilt, en kan een test de
 * omgeving nabootsen zonder de bouw erbij te halen. Staat dit verspreid over
 * de code, dan is "werkt dit in productie anders?" een vraag waar je de hele
 * app voor door moet.
 */

export type Omgeving = 'dev' | 'test' | 'prod'

const gelezen = (): Omgeving => {
  // In een testomgeving zonder Vite bestaat import.meta.env niet.
  const ruw = typeof import.meta.env === 'object' ? import.meta.env.VITE_OMGEVING : undefined
  if (ruw === 'dev' || ruw === 'test' || ruw === 'prod') return ruw
  // Geen waarde betekent productie. Met opzet de strengste stand: een
  // vergeten omgevingsvariabele hoort niet alle lessen open te zetten.
  return 'prod'
}

export const OMGEVING: Omgeving = gelezen()

/**
 * Of alles open staat zonder te betalen.
 *
 * Alleen in `test`. In `dev` niet, en dat is met opzet: wie tijdens het
 * ontwikkelen nooit een slotje ziet, bouwt een slotje dat niet werkt.
 */
export const allesOpen = (): boolean => OMGEVING === 'test'

/** Of de winkel nagebootst wordt in plaats van echt aangeroepen. */
export const winkelNagebootst = (): boolean => OMGEVING !== 'prod'
