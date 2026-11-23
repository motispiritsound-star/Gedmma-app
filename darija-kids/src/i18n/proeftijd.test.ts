/**
 * Wat de veelgestelde vragen over geld zeggen.
 *
 * Dit bestand heette zo omdat het de drie gratis dagen bewaakte: de vraag
 * "Kost het iets?" zei eerst "met de eerste dagen gratis", zonder getal, en
 * dat is de ene plek waar iemand het nazoekt voordat hij betaalt. Een
 * proefperiode zonder lengte is geen belofte maar een onbekend aantal dagen
 * tot de eerste afschrijving, dus stond het getal er daarna in, bewaakt tegen
 * `TRIAL_DAYS`.
 *
 * Op 23 november is de proefperiode vervallen, en het gratis deel erna. Wat
 * deze test nu bewaakt is de andere kant van dezelfde zorg: dat er in geen
 * enkele taal nog iets gratis belooft wordt op de plek waar een ouder de prijs
 * nazoekt. Het is de tekst die ook met de winkelinzending meegaat, en een
 * onware mededeling over geld is bij Apple een grond voor verwijdering van de
 * app (richtlijn 2.3.1).
 */
import { describe, expect, it } from 'vitest'
import { STRINGS } from '.'
import { LANG_CODES } from './languages'
import { winkelnamen } from './winkels'

/** De vraag die over geld gaat; de eerste woorden verschillen per taal. */
const geldvraag = (lang: typeof LANG_CODES[number]) => {
  const rijen = STRINGS[lang].landing.faq(winkelnamen(lang))
  const rij = rijen.find(([, antwoord]) => antwoord.includes('59'))
  expect(rij, `${lang}: geen vraag over de prijs gevonden`).toBeTruthy()
  return rij![1]
}

describe('de vraag over de prijs', () => {
  /**
   * Geen proefperiode, in geen enkele taal.
   *
   * De woordenlijst is dezelfde als in `proef.test.ts`: dat waren de woorden
   * waarmee de proefperiode uit de teksten werd gehaald, en ze staan hier om
   * dezelfde reden opnieuw.
   */
  it('belooft in geen enkele taal nog iets gratis', () => {
    /*
     * "Gratis te downloaden" mag, want dat is waar: de app kost niets, de
     * cursus is het abonnement. Al het andere niet -- geen gratis les, geen
     * gratis unit, geen gratis dag.
     *
     * Dus geen lijst met toegestane zinnen per taal, want die is bij de eerste
     * herformulering achterhaald en valt dan om op iets wat juist is. De regel
     * is: elk woord voor "gratis" moet in dezelfde ademtocht over downloaden
     * gaan. Staat het ergens anders, dan is het een belofte.
     */
    const gratis = /gratis|gratuit\w*|kostenlos\w*|gratuita|gratuito|free/gi
    const download = /download|t[\u00e9e]l[\u00e9e]charg|herunterladen|descarga|scarica/i
    for (const lang of LANG_CODES) {
      const antwoord = geldvraag(lang)
      for (const m of antwoord.matchAll(gratis)) {
        const rond = antwoord.slice(Math.max(0, m.index - 40), m.index + m[0].length + 40)
        expect(download.test(rond), `${lang}: "${m[0]}" gaat hier niet over downloaden -- ${rond.trim()}`).toBe(true)
      }
    }
  })

  /**
   * En zegt wel wat er gebeurt. "Een abonnement" alleen laat de vraag open die
   * een ouder écht heeft: wanneer wordt er afgeschreven, en kan ik eruit?
   */
  it('zegt wanneer er wordt afgeschreven', () => {
    const woorden = /afgeschreven|prélev|abgebucht|cobra|addebit|charged/i
    for (const lang of LANG_CODES) {
      expect(geldvraag(lang), lang).toMatch(woorden)
    }
  })

  /** En het jaarbedrag en het maandbedrag staan er beide, met de btw erbij. */
  it('noemt beide bedragen', () => {
    for (const lang of LANG_CODES) {
      const antwoord = geldvraag(lang)
      /* Het Engels zet een punt waar de rest een komma zet. */
      expect(antwoord, `${lang}: het jaarbedrag`).toMatch(/59[.,]99/)
      expect(antwoord, `${lang}: het maandbedrag`).toMatch(/6[.,]99/)
    }
  })
})
