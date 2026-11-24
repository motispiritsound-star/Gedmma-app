/**
 * Staan de achtentwintig letterbeschrijvingen in élke taal?
 *
 * Dit was het laatste stuk inhoud dat in het Nederlands bleef staan, en het
 * is op 24 november gevonden door naar een plaatje te kijken en niet door een
 * test. In de Fránse app stond onder de eerste letter:
 *
 *   Se prononce : aa, zoals in “maan”
 *
 * Een Nederlandse bijzin in een Franse zin, met een Nederlands voorbeeldwoord.
 * `/letters` is de tweede schermafbeelding in beide winkels, dus het stond ook
 * op de Franse winkelbladzijde — en dáár viel het op.
 *
 * Waarom het zo lang kon blijven staan: `vertaald.test.ts` bewaakt `src/i18n`,
 * de teksten van de app zelf, en die waren compleet. `alphabet.ts` is inhoud,
 * net als `words.ts`, en inhoud wordt vertaald via de pakken in `lang/`. Daar
 * zat voor letters geen veld, dus er was ook niets te missen. Dit bestand is
 * de rem die er toen niet was.
 *
 * ## Wat hier níét wordt bewaakt, en waarom dat met opzet is
 *
 * Of het voorbeeldwoord bij de taal past. "s as in sock" hoort in het Frans
 * geen vertaling van "sok" te zijn maar een Frans woord dat een Frans kind
 * kent, en dat is niet te meten — een test kan niet zien of "sac" bekender is
 * dan "sole". Wat wél te meten is: dat er iets staat, dat het niet het
 * Nederlands is, en dat de bekende Nederlandse wendingen er niet in zijn
 * blijven hangen. De rest is nalezen.
 */
import { describe, expect, it } from 'vitest'
import { LETTERS } from './alphabet'
import { soundOf } from './localise'
import { fr } from './lang/fr'
import { de } from './lang/de'
import { es } from './lang/es'
import { it as italiaans } from './lang/it'
import { en } from './lang/en'

const PAKKEN = { fr, de, es, it: italiaans, en } as const
const TALEN = Object.keys(PAKKEN) as (keyof typeof PAKKEN)[]

describe('de letterbeschrijvingen', () => {
  it('zijn er achtentwintig, en elke letter heeft er een in het Nederlands', () => {
    expect(LETTERS).toHaveLength(28)
    for (const letter of LETTERS) {
      expect(letter.sound.length, letter.id).toBeGreaterThan(2)
    }
  })

  it.each(TALEN)('%s heeft alle achtentwintig', (taal) => {
    const ontbreekt = LETTERS.filter((l) => !PAKKEN[taal].letters?.[l.id]).map((l) => l.id)
    expect(ontbreekt, `deze letters hebben geen ${taal}e beschrijving`).toEqual([])
  })

  it.each(TALEN)('%s heeft er geen die er niet is', (taal) => {
    const bekend = new Set(LETTERS.map((l) => l.id))
    const vreemd = Object.keys(PAKKEN[taal].letters ?? {}).filter((id) => !bekend.has(id))
    expect(vreemd, `deze sleutels horen bij geen enkele letter`).toEqual([])
  })

  /**
   * En ze staan er niet nog in het Nederlands.
   *
   * Een enkele letter kán in twee talen gelijk zijn — "a heavy t" en "zware t"
   * niet, maar iets als een losse klank wel. Daarom per letter en niet in
   * totaal: één gelijke tekst is een vergeten regel, en die wil je bij naam
   * zien in plaats van in een aantal.
   */
  it.each(TALEN)('%s is niet het Nederlands', (taal) => {
    const zelfde = LETTERS
      .filter((l) => PAKKEN[taal].letters?.[l.id] === l.sound)
      .map((l) => `${l.id}: "${l.sound}"`)
    expect(zelfde, `deze staan er nog in het Nederlands`).toEqual([])
  })

  /**
   * De Nederlandse wendingen die bij een half vertaalde regel blijven hangen.
   *
   * Dit is precies hoe de fout eruitzag: de zin was vertaald tot aan "zoals
   * in" en daarna niet meer. `van` staat er niet bij — dat is in het Frans
   * een gewoon woord.
   */
  const NEDERLANDS = /\bzoals in\b|\bzoals de\b|\bzware\b|\bgewone\b|\bdiep uit de keel\b|\brollende\b|\bbrouwende\b|\bknijp in de keel\b|\bgeblazen\b/i

  it.each(TALEN)('%s heeft geen Nederlandse wending laten staan', (taal) => {
    const verdacht = LETTERS
      .map((l) => [l.id, PAKKEN[taal].letters?.[l.id] ?? ''] as const)
      .filter(([, tekst]) => NEDERLANDS.test(tekst))
      .map(([id, tekst]) => `${id}: "${tekst}"`)
    expect(verdacht, `hier is halverwege gestopt met vertalen`).toEqual([])
  })

  /**
   * En `soundOf` pakt ze ook werkelijk op.
   *
   * De drie schermen die een klank tonen deden dat met `letter.sound`, en dat
   * is het Nederlandse veld. Een pak vullen zonder de schermen om te zetten
   * verandert niets wat een gebruiker ziet.
   */
  it.each(TALEN)('%s komt door soundOf heen', (taal) => {
    for (const letter of LETTERS) {
      expect(soundOf(letter, taal), `${taal} ${letter.id}`).toBe(PAKKEN[taal].letters?.[letter.id])
      expect(soundOf(letter, taal), `${taal} ${letter.id}`).not.toBe(letter.sound)
    }
  })

  it('en het Nederlands blijft zichzelf', () => {
    for (const letter of LETTERS) {
      expect(soundOf(letter, 'nl'), letter.id).toBe(letter.sound)
    }
  })
})
