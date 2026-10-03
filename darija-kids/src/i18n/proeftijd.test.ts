/**
 * De drie gratis dagen staan ook in de veelgestelde vragen.
 *
 * Op de site stond het plaatje erboven wél: "Start 3 dagen gratis". De vraag
 * eronder — "Kost het iets?" — zei "met de eerste dagen gratis", zonder
 * getal. Dat is de ene plek waar iemand het nazoekt voordat hij betaalt, en
 * daar bleef het vaag. Een proefperiode zonder lengte is geen belofte: dan is
 * het een onbekend aantal dagen tot de eerste afschrijving.
 *
 * Het getal staat nu in de zin, en deze test houdt hem bij `TRIAL_DAYS`. Dat
 * is bewust geen interpolatie: `faq` krijgt alleen de winkelnamen mee, en de
 * prijzen staan er ook met de hand in. Verandert de proefperiode, dan valt
 * deze test om in alle zes de talen — en dan is de vraag niet "hoe krijg ik de
 * test groen" maar "waar staat dit getal nog meer".
 */
import { describe, expect, it } from 'vitest'
import { TRIAL_DAYS } from '../engine/billing'
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

describe('de proefperiode in de veelgestelde vragen', () => {
  it('noemt het aantal dagen in alle zes de talen', () => {
    for (const lang of LANG_CODES) {
      expect(geldvraag(lang), lang).toContain(String(TRIAL_DAYS))
    }
  })

  /**
   * En zegt wat er in die dagen gebeurt. "3 dagen gratis" alleen laat de vraag
   * open die een ouder écht heeft: word ik na die dagen afgeschreven als ik
   * niets doe, en kan ik er vóór die tijd nog uit?
   */
  it('en zegt dat er niets afgeschreven wordt als je opzegt', () => {
    const woorden = /afgeschreven|prélevé|abgebucht|cobra|addebitato|charged/i
    for (const lang of LANG_CODES) {
      expect(geldvraag(lang), lang).toMatch(woorden)
    }
  })

  /** En de app zelf zegt hetzelfde getal, want dat is dezelfde belofte. */
  it('en loopt niet uit de pas met de app', () => {
    for (const lang of LANG_CODES) {
      const tijdlijn = STRINGS[lang].unlock.tijdlijn(TRIAL_DAYS, '€ 6,99', false)
      expect(tijdlijn[0][1], lang).toContain(String(TRIAL_DAYS))
    }
  })
})
