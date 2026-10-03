/**
 * Marokko 360°: wat er wel en niet gepubliceerd mag worden.
 *
 * Dit bestand is de rem. Al het andere in deze map is inhoud; dit is de regel
 * die bepaalt of die inhoud de openbare site haalt.
 *
 * De regel is met opzet streng en met opzet machinaal. Een redactionele afspraak
 * dat "we alleen publiceren wat nagekeken is" houdt het ongeveer drie maanden
 * vol. Een functie die `false` teruggeeft, houdt het altijd vol.
 */

import { BRONNEN, bronVan, draagbaar } from './bronnen'
import { DELEN } from './delen'
import { WALILI, WALILI_PLAATS } from './hoofdstukken/walili'
import type { Lang } from '../../i18n/languages'
import type { Blok, Bron, Hoofdstuk, Plaats } from './types'

export * from './types'
export { BRONNEN, bronVan, draagbaar } from './bronnen'
export { DELEN, deelVan } from './delen'

export const HOOFDSTUKKEN: Hoofdstuk[] = [WALILI]
export const PLAATSEN: Plaats[] = [WALILI_PLAATS]

export const hoofdstukVan = (id: string): Hoofdstuk | undefined =>
  HOOFDSTUKKEN.find((h) => h.id === id)

/** De blokken die iets beweren. De rest is verbindende tekst en kopjes. */
export const feiten = (h: Hoofdstuk): Extract<Blok, { soort: 'feit' }>[] =>
  h.blokken.filter((b): b is Extract<Blok, { soort: 'feit' }> => b.soort === 'feit')

/**
 * Waarom dit hoofdstuk nog niet gepubliceerd kan worden.
 *
 * Geeft een lege lijst terug als er niets in de weg staat. Teruggeven wát er in
 * de weg staat en niet alleen dát er iets in de weg staat, want anders wordt
 * dit een poort waar iemand omheen gaat werken.
 *
 * De vijf eisen, en waarom ze er zijn:
 *
 * 1. **Elk feitelijk blok wijst naar minstens één bron.** Zonder dit is er geen
 *    verschil tussen een encyclopedie en een mening.
 * 2. **Die bronnen bestaan in het register.** Een id dat nergens heen wijst
 *    leest als een bronvermelding en is er geen.
 * 3. **Minstens één bron per blok is gelezen.** Dit is de eis die er echt toe
 *    doet. Een bron waarvan alleen de URL bekend is, draagt niets.
 * 4. **Een betwiste bewering zegt waaróver de discussie gaat.** "Betwist"
 *    zonder uitleg is een slag om de arm, geen informatie.
 * 5. **De tijdlijn staat onder dezelfde regels.** Een jaartal is een bewering.
 */
export function waaromNietPubliceerbaar(h: Hoofdstuk): string[] {
  const klachten: string[] = []

  const bronnenKloppen = (ids: string[], waar: string) => {
    if (!ids.length) {
      klachten.push(`${waar}: geen bron`)
      return
    }
    const gevonden = ids.map((id) => ({ id, bron: bronVan(id) }))
    for (const { id, bron } of gevonden) {
      if (!bron) klachten.push(`${waar}: bron "${id}" staat niet in het register`)
    }
    const echt = gevonden.map((g) => g.bron).filter((b): b is Bron => Boolean(b))
    if (echt.length && !echt.some(draagbaar)) {
      klachten.push(`${waar}: geen van de bronnen is gelezen (${echt.map((b) => b.id).join(', ')})`)
    }
  }

  feiten(h).forEach((blok, i) => {
    const waar = `blok ${i + 1}`
    bronnenKloppen(blok.bronnen, waar)
    if (blok.zekerheid === 'betwist' && !blok.discussie?.trim()) {
      klachten.push(`${waar}: betwist, maar zonder uitleg waarover`)
    }
  })

  h.tijdlijn.forEach((m) => {
    bronnenKloppen(m.bronnen, `tijdlijn "${m.id}"`)
  })

  if (!h.zekerEnOnzeker.length) {
    klachten.push('geen "wat weten we zeker en waarover bestaat discussie"')
  }

  return klachten
}

/** Of dit hoofdstuk op de openbare site mag. */
export const publiceerbaar = (h: Hoofdstuk): boolean =>
  h.stand === 'gepubliceerd' && waaromNietPubliceerbaar(h).length === 0

/**
 * Wat de site in een taal laat zien.
 *
 * Een hoofdstuk verschijnt alleen in een taal die het werkelijk heeft. Geen
 * terugval op het Nederlands: een encyclopedie die in het Spaans een
 * Nederlandse bladzijde toont, doet alsof ze zes talen spreekt.
 */
export const publiekeHoofdstukken = (lang: Lang): Hoofdstuk[] =>
  HOOFDSTUKKEN.filter((h) => publiceerbaar(h) && h.talen.includes(lang))

/** Alles wat geschreven is maar nog niet mag: voor de interne conceptbladzijde. */
export const conceptHoofdstukken = (): Hoofdstuk[] =>
  HOOFDSTUKKEN.filter((h) => !publiceerbaar(h))

/** Hoe ver het register is. Voor de redactiebladzijde en het eindrapport. */
export function bronnenstand(): { totaal: number; gelezen: number; gevonden: number; betwist: number } {
  return {
    totaal: BRONNEN.length,
    gelezen: BRONNEN.filter((b) => b.stand === 'gelezen').length,
    gevonden: BRONNEN.filter((b) => b.stand === 'gevonden').length,
    betwist: BRONNEN.filter((b) => b.stand === 'betwist').length,
  }
}

/** Hoeveel delen al een hoofdstuk hebben. Zegt eerlijk hoe leeg de reeks nog is. */
export const deelstand = () => DELEN.map((d) => ({
  deel: d,
  hoofdstukken: HOOFDSTUKKEN.filter((h) => h.deel === d.id).length,
  gepubliceerd: HOOFDSTUKKEN.filter((h) => h.deel === d.id && publiceerbaar(h)).length,
}))
