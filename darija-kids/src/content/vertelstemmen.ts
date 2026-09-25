/**
 * De vijf vertellers.
 *
 * Een spraakmotor van een telefoon leest óp; een verteller vertelt. Het
 * verschil zit in ritme en in stiltes, en dat is precies wat een boek over
 * een brand in een olijfpers nodig heeft. Daarvoor zijn opnames nodig, en
 * deze vijf zijn de stemmen waaruit een lezer straks kiest.
 *
 * Waarom vijf en niet één: voorlezen is smaak. De een wil de grootvader bij
 * het vuur, de ander een stem die klinkt als de grote broer die het boek
 * meebracht. Vijf is genoeg om iedereen iets te geven en weinig genoeg om ze
 * alle vijf te kunnen betalen.
 *
 * Waarom geen id's in dit bestand: een stem-id hoort bij één account, en een
 * id die hier verkeerd staat levert een boek in de verkeerde stem op zonder
 * dat iemand het merkt. `scripts/make-vertelstem.mjs` zoekt ze op bij naam,
 * in de bibliotheek van het account dat de opnames maakt.
 *
 * Eerlijk over deze vijf: het zijn meertalige stemmen van Engelse oorsprong.
 * Ze spreken Nederlands, maar een Nederlands oor kan er een lichte tongval in
 * horen. Dat is de reden dat er eerst één hoofdstuk gezet wordt en niet
 * vijftien delen — zie `--proef`.
 */

export interface Vertelstem {
  /** De naam in de stembibliotheek; hiermee wordt de id opgezocht. */
  naam: string
  /** Wat een lezer kiest, in het Nederlands. */
  toon: string
  /** Waarom deze erbij staat, en wanneer je hem wilt. */
  waarom: string
  /** De drie schuiven van ElevenLabs, per stem afgestemd. */
  vast: number
  gelijkend: number
  tempo: number
}

export const VERTELSTEMMEN: Vertelstem[] = [
  {
    naam: 'George',
    toon: 'De grootvader',
    waarom: 'Warm en bedaard, met de rust van iemand die het verhaal al kent. De stem voor het laatste half uur van de dag.',
    vast: 0.55, gelijkend: 0.8, tempo: 0.9,
  },
  {
    naam: 'Brian',
    toon: 'De verteller',
    waarom: 'Diep en dragend, zoals een luisterboek hoort te klinken. Als je er één kiest en verder niet wilt nadenken, is het deze.',
    vast: 0.5, gelijkend: 0.75, tempo: 0.95,
  },
  {
    naam: 'Callum',
    toon: 'De spannende',
    waarom: 'Donker en geladen; hij laat een stilte vallen waar het eng wordt. Past bij de delen waarin het misgaat.',
    vast: 0.4, gelijkend: 0.75, tempo: 0.95,
  },
  {
    naam: 'Daniel',
    toon: 'De geschiedschrijver',
    waarom: 'Helder en precies, zonder opsmuk. De stem die je wilt bij "Wat hiervan is echt gebeurd".',
    vast: 0.6, gelijkend: 0.7, tempo: 1,
  },
  {
    naam: 'Charlie',
    toon: 'De grote broer',
    waarom: 'Jonger en losser, dichter bij de leeftijd van wie het leest. Voor een kind dat een plechtige stem wegklikt.',
    vast: 0.45, gelijkend: 0.75, tempo: 1,
  },
]

/** Een stem op naam, of de eerste — dat is de stem die overal standaard staat. */
export const vertelstemVan = (naam: string | null | undefined): Vertelstem =>
  VERTELSTEMMEN.find((s) => s.naam.toLowerCase() === String(naam).toLowerCase()) ?? VERTELSTEMMEN[0]!
