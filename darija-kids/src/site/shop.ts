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
 * De betaallinks. Dit is het enige blok dat verandert als de winkel opengaat.
 *
 * Twee regels, meer niet: één voor elke reeks. `docs/WINKEL-INRICHTEN.md`
 * zegt hoe je aan die adressen komt.
 *
 * Wat er niet in staat, blijft leeg, en een leeg adres toont "Binnenkort" in
 * plaats van een knop die nergens heen gaat. De twee reeksen kunnen dus los
 * van elkaar opengaan.
 */
const LINKS: Record<string, string> = {
  // sbaReeks: 'https://…',
  // sleutelsReeks: 'https://…',
  // ebook: 'https://…',
}

/**
 * De prijzen.
 *
 * Eén prijs per reeks, en geen losse delen. Dat is een bewuste keuze en het
 * is de goede: tien euro voor één prentenboek van dertig bladzijden vraagt
 * van een ouder een afweging bij elk deel, twaalf keer achter elkaar. Voor
 * vijfendertig euro krijgt hij de hele reeks en is de afweging één keer.
 *
 * Per deel komt dat op ongeveer drie euro. Dat is minder dan een boek in de
 * winkel en het is meer dan wat er in totaal binnenkomt bij twaalf losse
 * beslissingen waarvan er negen niet genomen worden.
 */
export const PRIJS = {
  sbaReeks: '€ 34,99',
  sleutelsReeks: '€ 34,99',
  ebook: '€ 14,99',
} as const

export const SHOP: Record<string, Product> = {
  /** Het e-boek dat `npm run ebook` maakt: alle woorden, letters en grammatica. */
  ebook: { prijs: PRIJS.ebook, link: LINKS.ebook ?? '' },
  /** De twaalf prentenboeken van Sba, samen. */
  sbaReeks: { prijs: PRIJS.sbaReeks, link: LINKS.sbaReeks ?? '' },
  /** De vijftien delen van De sleutels van Marokko, samen. */
  sleutelsReeks: { prijs: PRIJS.sleutelsReeks, link: LINKS.sleutelsReeks ?? '' },
}

/** Of er iets te koop is; zolang niets een link heeft, is de winkel dicht. */
export const WINKEL_OPEN = Object.values(SHOP).some((p) => p.link !== '')

/** Of een van de twee reeksen al te koop is; ze gaan los van elkaar open. */
export const REEKS_OPEN = (sleutel: 'sba' | 'sleutels'): boolean =>
  SHOP[`${sleutel}Reeks`]?.link !== ''
