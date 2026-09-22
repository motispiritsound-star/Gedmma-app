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
 * leest. Wie ze uit elkaar laat lopen, krijgt een bezoeker die op de knop
 * drukt en een ander bedrag ziet — reken daar één keer per prijswijziging op.
 */

export interface Product {
  /** Wat de bezoeker leest. */
  prijs: string
  /** De afrekenpagina. Leeg zolang hij nog niet bestaat. */
  link: string
}

/**
 * De prijzen op één plek.
 *
 * Een los prentenboek is een avond voorlezen en kost daarom minder dan een
 * leesboek waar een kind van twaalf een week mee zoet is. De bundel is
 * ongeveer een derde goedkoper dan de losse delen bij elkaar: genoeg om te
 * kiezen voor de reeks, niet zoveel dat een los deel kopen dom voelt.
 */
export const PRIJS = {
  sbaDeel: '€ 9,99',
  sbaReeks: '€ 79,95',
  sleutelsDeel: '€ 12,95',
  sleutelsReeks: '€ 129,95',
  ebook: '€ 14,99',
} as const

const los = (aantal: number, sleutel: string, prijs: string): Record<string, Product> =>
  Object.fromEntries(Array.from({ length: aantal }, (_, i) => [`${sleutel}${i + 1}`, { prijs, link: '' }]))

export const SHOP: Record<string, Product> = {
  /** Het e-boek dat `npm run ebook` maakt: alle woorden, letters en grammatica. */
  ebook: { prijs: PRIJS.ebook, link: '' },
  /** De twaalf prentenboeken van Sba, los. */
  ...los(12, 'sba', PRIJS.sbaDeel),
  /** Alle twaalf samen. */
  sbaReeks: { prijs: PRIJS.sbaReeks, link: '' },
  /** De vijftien delen van De sleutels van Marokko, los. */
  ...los(15, 'sleutels', PRIJS.sleutelsDeel),
  /** Alle vijftien samen. */
  sleutelsReeks: { prijs: PRIJS.sleutelsReeks, link: '' },
}

/** Of er iets te koop is; zolang niets een link heeft, is de winkel dicht. */
export const WINKEL_OPEN = Object.values(SHOP).some((p) => p.link !== '')

/** Of een losse reeks al te koop is — de twee blokken staan los van elkaar. */
export const REEKS_OPEN = (sleutel: 'sba' | 'sleutels'): boolean =>
  Object.entries(SHOP).some(([id, p]) => id.startsWith(sleutel) && p.link !== '')
