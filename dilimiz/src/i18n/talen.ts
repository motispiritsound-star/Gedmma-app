/**
 * De interfacetalen: de dagelijkse talen van de Turkse diaspora in Europa.
 *
 * Vier in de MVP. Duits eerst in omvang -- de grootste Turkse gemeenschap van
 * Europa woont in Duitsland, en dat is geen detail voor een app die bereik
 * nodig heeft.
 *
 * De lijst is uitbreidbaar: een taal erbij is een regel hier, een bestand in
 * deze map en een veld in elke `Betekenis` in src/content/. `i18n.test.ts`
 * controleert dat er niets half vertaald blijft staan.
 */
export const TALEN = [
  { code: 'de', naam: 'Deutsch', waar: 'Deutschland, Österreich, Schweiz' },
  { code: 'nl', naam: 'Nederlands', waar: 'Nederland en België' },
  { code: 'fr', naam: 'Français', waar: 'France, Belgique, Suisse' },
  // Geen vlag: deze regel is ook voor Engeland, de Verenigde Staten, Canada,
  // Australië en overal elders. Een Union Jack zou vier vijfde van die lezers
  // vertellen dat ze op de verkeerde plek staan.
  { code: 'en', naam: 'English', waar: 'everywhere else' },
] as const

export type Taal = (typeof TALEN)[number]['code']

export const TAALCODES = TALEN.map((t) => t.code) as readonly Taal[]

export const isTaal = (waarde: unknown): waarde is Taal =>
  typeof waarde === 'string' && (TAALCODES as readonly string[]).includes(waarde)

/**
 * Welk land welke van onze talen spreekt, voor een toestel dat in een taal
 * staat die wij niet hebben -- een Turks of Koerdisch ingestelde telefoon in
 * Keulen of Rotterdam. De taal van het toestel gaat voor; dit is de terugval.
 *
 * België is het lastige geval: een Nederlands ingestelde telefoon (nl-BE)
 * komt een stap eerder al op Nederlands uit, dus wat hier aankomt is een
 * Belgisch toestel in een andere taal. De meeste Turkse gezinnen in België
 * wonen in Brussel, Antwerpen en Limburg; Nederlands is daar de betere gok.
 */
const LAND: Record<string, Taal> = {
  DE: 'de', AT: 'de', CH: 'de', LI: 'de',
  NL: 'nl', BE: 'nl', SR: 'nl',
  FR: 'fr', LU: 'fr', MC: 'fr',
  TR: 'de', // Een Turks toestel in Europa: Duitsland is de grootste kans.
  GB: 'en', IE: 'en', US: 'en', CA: 'en', AU: 'en', NZ: 'en',
}

/**
 * De taal om in te starten, afgeleid uit het toestel.
 *
 * Wat eruit komt is een voorstel: het welkomstscherm toont hem geselecteerd en
 * laat hem veranderen. Een kind dat de app van een Duitse telefoon in het
 * Nederlands wil, moet dat kunnen.
 */
export function vindTaal(tags: readonly string[] = toestelTalen()): Taal {
  for (const tag of tags) {
    const code = tag.toLowerCase().split('-')[0]
    if (isTaal(code)) return code
  }
  for (const tag of tags) {
    const land = tag.split('-')[1]?.toUpperCase()
    if (land && LAND[land]) return LAND[land]
  }
  return 'en'
}

function toestelTalen(): readonly string[] {
  if (typeof navigator === 'undefined') return []
  return navigator.languages?.length ? navigator.languages : [navigator.language]
}

/** BCP-47 voor `<html lang>`. Engels blijft `en`: de app is niet Brits. */
export const localeVan = (taal: Taal): string =>
  ({ de: 'de-DE', nl: 'nl-NL', fr: 'fr-FR', en: 'en' })[taal]
