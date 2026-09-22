/**
 * Wat er te koop is, en waar je dan heen gaat.
 *
 * Net als `links.ts`: leeg tot er een echte betaallink is. De website leest
 * die leegte en toont "in de maak" in plaats van een knop die nergens heen
 * gaat — zodat de dag dat de afrekenpagina klaarstaat, dit bestand het enige
 * is dat verandert.
 *
 * De links wijzen naar een *merchant of record* (zie docs/BETALEN.md). Dat
 * bedrijf is de verkoper: het int de btw in elk land, levert het bestand en
 * doet de terugbetalingen. Daarom staat hier een adres en geen bedrag in
 * code: de prijs staat ook in hun systeem en dit is alleen wat de bezoeker
 * leest.
 */

export interface Product {
  /** Wat de bezoeker leest. */
  prijs: string
  /** De afrekenpagina. Leeg zolang hij nog niet bestaat. */
  link: string
}

export const SHOP: Record<string, Product> = {
  /** Het e-boek dat `npm run ebook` maakt: alle woorden, letters en grammatica. */
  ebook: { prijs: '€ 14,99', link: '' },
  /** Deel 1 van Sbaa, los. */
  sbaa1: { prijs: '€ 12,95', link: '' },
  /** De eerste vijf delen samen. */
  sbaaReeks: { prijs: '€ 49,95', link: '' },
}

/** Of er iets te koop is; zolang niets een link heeft, is de winkel dicht. */
export const WINKEL_OPEN = Object.values(SHOP).some((p) => p.link !== '')
