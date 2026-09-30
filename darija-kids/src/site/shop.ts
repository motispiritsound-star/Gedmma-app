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
  sbaReeks: 'https://venshipper.gumroad.com/l/sbadeleeuw',
  sleutelsReeks: 'https://venshipper.gumroad.com/l/sleutels',
  // ebook: 'https://…',
}

/**
 * Wat er op 30 september leek mis te gaan, en het niet was.
 *
 * Het afrekenen strandde met *"Invalid parameter owner[name]. Owner name must
 * be at least 3 characters long."* De winkel is die dag dichtgezet, en dat was
 * de goede volgorde: een knop naar een kapotte kassa kost een bezoeker die
 * niet terugkomt.
 *
 * Twee dingen bleken geen storing.
 *
 * `owner[name]` komt niet van Gumroad maar van Stripe eronder, en het is de
 * naam die de kóper in *Full name* typt — niet de naam van de verkoper. Er
 * waren twee letters ingevuld en Stripe eist er drie. Met een gewone naam
 * loopt het afrekenen door tot het iDEAL-scherm; nagekeken in een privévenster
 * met een echte afrekening van € 42,33, inclusief btw.
 *
 * En wie met het eigen adres van de maker afrekent, krijgt van Gumroad *"this
 * will be a test purchase ... your payment method will not be charged"*. Dat
 * hangt aan het account waarmee je bent ingelogd en niet aan het mailadres dat
 * je intypt. Een vreemde die dat adres kent, wordt gewoon belast; het is dus
 * geen gat.
 */

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
