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

const TALEN = Object.keys(COPY.intro)

/** Elke tekst van elke film in elke taal, met zijn herkomst erbij. */
const ALLES = Object.entries(COPY).flatMap(([film, perTaal]) =>
  Object.entries(perTaal).map(([taal, c]) => [film, taal, c] as const))

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
    for (const [film, taal, c] of ALLES) {
      expect(cijfers(c.price), `${film}/${taal}: ${c.price}`).toEqual(echt)
    }
  })

  it('en noemt nergens een prijs die nergens anders bestaat', () => {
    for (const [film, taal, c] of ALLES) {
      expect(c.price, `${film}/${taal}`).not.toMatch(/4[.,]99/)
    }
  })

  /**
   * Dezelfde drie getallen als op de website, en om dezelfde reden: ze staan
   * er als tekst en de inhoud eronder groeit.
   */
  it('telt de units, woorden en zinnen die er echt zijn', () => {
    const echt = [String(UNITS.length), String(allWords.length), String(ALL_SENTENCES.length)]
    for (const [film, taal, c] of ALLES) {
      expect(cijfers(c.feiten), `${film}/${taal}: ${c.feiten}`).toEqual(echt)
    }
  })

  /*
   * Eén regel per scherm, en de twee films hebben niet evenveel schermen: de
   * winkelfilm zeven, de korte voor WhatsApp en Facebook twee. Staat er een
   * regel te weinig, dan valt er een scherm zonder tekst in beeld; staat er
   * een te veel, dan wordt hij nooit gelezen.
   */
  const SCHERMEN: Record<string, number> = { intro: 7, bonus: 2 }

  it('en heeft per taal één regel per scherm', () => {
    for (const [film, taal, c] of ALLES) {
      expect(c.lines, `${film}/${taal}`).toHaveLength(SCHERMEN[film]!)
      for (const regel of c.lines) expect(regel.trim(), `${film}/${taal}`).not.toBe('')
    }
  })

  /* De korte film erft de slotkaart van de winkelfilm, zodat er geen tweede
     plek is waar een prijs kan verouderen -- zie de uitleg in intro-copy.ts. */
  it('laat de korte film de slotkaart van de winkelfilm erven', () => {
    for (const taal of TALEN) {
      expect(COPY.bonus[taal]!.price, taal).toBe(COPY.intro[taal]!.price)
      expect(COPY.bonus[taal]!.cta, taal).toBe(COPY.intro[taal]!.cta)
      expect(COPY.bonus[taal]!.feiten, taal).toBe(COPY.intro[taal]!.feiten)
    }
  })

  it('en geeft de korte film een eigen ondertitel en eigen regels', () => {
    for (const taal of TALEN) {
      expect(COPY.bonus[taal]!.sub, taal).not.toBe(COPY.intro[taal]!.sub)
      expect(COPY.bonus[taal]!.lines, taal).not.toEqual(COPY.intro[taal]!.lines)
    }
  })
})
