/**
 * Klopt wat de promofilm zegt nog met wat de app verkoopt?
 *
 * `npm run intro` neemt achtentwintig seconden van de echte app op en zet er
 * zes tekstkaarten overheen. Die kaarten staan in `dev/intro.ts` als gewone
 * tekst, per taal, en dat is precies het soort plek waar een getal blijft
 * staan nadat het elders is veranderd.
 *
 * Dat is ook gebeurd. De slotkaart zei in alle zes talen **€ 4,99 per maand**,
 * en die prijs is losgelaten voordat de app ooit in een winkel stond: Apple
 * kent geen € 59,88 als prijspunt, dus het jaar staat in beide winkels op
 * € 59,99 — oftewel € 5,00 per maand. Het staat zo in README.md en zo in
 * `PLANS`. Alleen de film wist het niet, en die film gaat naar de App Store,
 * naar Google Play en naar TikTok. Gevonden op 11 oktober door een beeld uit
 * de opname te vergelijken met `billing.ts`, niet door een test.
 *
 * Daarom deze: de prijs en de getallen op de slotkaart worden hier naast de
 * echte inhoud gelegd. Niet de formulering — die mag per taal anders — maar
 * het bedrag en de aantallen.
 */
import { describe, expect, it } from 'vitest'
import { COPY } from '../../dev/intro-copy'
import { planOf } from '../engine/billing'
import { allWords } from '../content/lexicon'
import { ALL_SENTENCES } from '../content/sentences'
import { UNITS } from '../content/curriculum'

const TALEN = Object.keys(COPY)

/** Alleen de cijfers, zodat "€ 5,00" en "5.00 €" hetzelfde opleveren. */
const cijfers = (tekst: string) => (tekst.match(/\d+[.,]\d{2}|\d+/g) ?? []).map((n) => n.replace(',', '.'))

describe('de slotkaart van de promofilm', () => {
  it('noemt zes talen, en geen daarvan ontbreekt', () => {
    expect(TALEN.sort()).toEqual(['de', 'en', 'es', 'fr', 'it', 'nl'])
  })

  /**
   * Het goedkoopste wat je per maand kwijt bent is het jaarplan gedeeld door
   * twaalf, en dat is wat `perMonth` zegt. De maandprijs zelf is hoger, dus
   * "vanaf" hoort bij het jaarplan te staan.
   */
  it('noemt het bedrag dat de app echt vraagt', () => {
    const echt = cijfers(planOf('jaar').perMonth)
    expect(echt).toEqual(['5.00'])
    for (const taal of TALEN) {
      expect(cijfers(COPY[taal]!.price), `${taal}: ${COPY[taal]!.price}`).toEqual(echt)
    }
  })

  it('en noemt nergens een prijs die nergens anders bestaat', () => {
    for (const taal of TALEN) {
      expect(COPY[taal]!.price, taal).not.toMatch(/4[.,]99/)
    }
  })

  /**
   * Dezelfde drie getallen als op de website, en om dezelfde reden: ze staan
   * er als tekst en de inhoud eronder groeit.
   */
  it('telt de units, woorden en zinnen die er echt zijn', () => {
    const echt = [String(UNITS.length), String(allWords.length), String(ALL_SENTENCES.length)]
    for (const taal of TALEN) {
      expect(cijfers(COPY[taal]!.feiten), `${taal}: ${COPY[taal]!.feiten}`).toEqual(echt)
    }
  })

  it('en heeft per taal zeven regels, één per scherm', () => {
    for (const taal of TALEN) {
      expect(COPY[taal]!.lines, taal).toHaveLength(7)
      for (const regel of COPY[taal]!.lines) expect(regel.trim(), taal).not.toBe('')
    }
  })
})
