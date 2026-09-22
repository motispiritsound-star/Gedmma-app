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

/**
 * De betaallinks. Dit is het enige blok dat verandert als de winkel opengaat.
 *
 * Eén regel per product: de sleutel links, het adres van de afrekenpagina
 * rechts. `npm run winkel` schrijft de lijst met welke sleutel bij welk boek
 * hoort; `docs/WINKEL-INRICHTEN.md` zegt hoe je aan die adressen komt.
 *
 * Wat er niet in staat, blijft leeg, en een leeg adres toont "Binnenkort" in
 * plaats van een knop die nergens heen gaat. Je kunt dus per deel opengaan.
 */
const LINKS: Record<string, string> = {
  // ebook: 'https://…',
  // sba1: 'https://…',
  // sba2: 'https://…',
  // sbaReeks: 'https://…',
  // sleutels1: 'https://…',
  // sleutelsReeks: 'https://…',
}

const los = (aantal: number, sleutel: string, prijs: string): Record<string, Product> =>
  Object.fromEntries(Array.from({ length: aantal }, (_, i) => {
    const id = `${sleutel}${i + 1}`
    return [id, { prijs, link: LINKS[id] ?? '' }]
  }))

const een = (id: string, prijs: string): Product => ({ prijs, link: LINKS[id] ?? '' })

export const SHOP: Record<string, Product> = {
  /** Het e-boek dat `npm run ebook` maakt: alle woorden, letters en grammatica. */
  ebook: een('ebook', PRIJS.ebook),
  /** De twaalf prentenboeken van Sba, los. */
  ...los(12, 'sba', PRIJS.sbaDeel),
  /** Alle twaalf samen. */
  sbaReeks: een('sbaReeks', PRIJS.sbaReeks),
  /** De vijftien delen van De sleutels van Marokko, los. */
  ...los(15, 'sleutels', PRIJS.sleutelsDeel),
  /** Alle vijftien samen. */
  sleutelsReeks: een('sleutelsReeks', PRIJS.sleutelsReeks),
}

/**
 * Een adres moet een echte afrekenpagina zijn.
 *
 * Een typefout in dit blok levert anders een knop op die naar niets gaat, en
 * dat merk je pas als een klant het meldt. Liever hier stuk dan in de winkel.
 */
for (const [id, link] of Object.entries(LINKS)) {
  if (link && !/^https:\/\/[^\s]+$/.test(link)) {
    throw new Error(`shop.ts: het adres bij "${id}" is geen https-adres: ${link}`)
  }
  if (link && !(id in SHOP)) {
    throw new Error(`shop.ts: "${id}" staat in LINKS maar is geen product. Draai \`npm run winkel\` voor de lijst met sleutels.`)
  }
}

/** Of er iets te koop is; zolang niets een link heeft, is de winkel dicht. */
export const WINKEL_OPEN = Object.values(SHOP).some((p) => p.link !== '')

/** Of een losse reeks al te koop is — de twee blokken staan los van elkaar. */
export const REEKS_OPEN = (sleutel: 'sba' | 'sleutels'): boolean =>
  Object.entries(SHOP).some(([id, p]) => id.startsWith(sleutel) && p.link !== '')
