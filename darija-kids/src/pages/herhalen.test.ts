/**
 * De tab die over oefenen gaat, moet je altijd laten oefenen.
 *
 * Wie bij is heeft een lege wachtrij, en dat is juist het moment waarop
 * iemand die wil oefenen op "Herhalen" tikt. Daar stond dan een slapende
 * mascotte, één zin die zegt dat je later terug moet komen, en een knop naar
 * het leerpad. De enige plek in de app waar je niets kon doen was de plek die
 * over doen gaat.
 *
 * Nu valt hij terug op de twaalf woorden die het minst vastzitten — dezelfde
 * lijst die er toch al onder stond, maar om mee te oefenen in plaats van om
 * naar te kijken.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { nl } from '../i18n/nl'
import { de } from '../i18n/de'
import { en } from '../i18n/en'
import { es } from '../i18n/es'
import { fr } from '../i18n/fr'
import { it as italiaans } from '../i18n/it'

const code = readFileSync(new URL('./Review.tsx', import.meta.url), 'utf8')
  .replace(/\r\n/g, '\n')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')

describe('oefenen kan ook als er niets klaarstaat', () => {
  it('bouwt een ronde uit de zwakste kaarten als de wachtrij leeg is', () => {
    expect(code).toMatch(/due\.length > 0 \? buildReviewRound\(due, seed, dueSentences\) : buildReviewRound\(oefenIds, seed\)/)
  })

  it('neemt daarvoor de twaalf zwakste', () => {
    expect(code).toMatch(/zwakste\.slice\(0, 12\)\.map/)
  })

  /** Een knop die een lege ronde start stuurt je meteen weer terug. */
  it('biedt het niet aan bij een lege kaartenbak', () => {
    expect(code).toMatch(/oefenIds\.length > 0 && \(/)
  })

  it('de knop staat in alle zes de talen', () => {
    for (const taal of [nl, fr, de, es, italiaans, en]) {
      expect(taal.review.tochOefenen.length).toBeGreaterThan(3)
      expect(taal.review.tochUitleg(12)).toContain('12')
    }
  })
})

describe('niet twee knoppen naar dezelfde plek', () => {
  /**
   * Bij een lege wachtrij stonden "Naar het leerpad" in de kaart en "Terug
   * naar het pad" eronder: twee knoppen naar hetzelfde, op één scherm. Dat
   * leest niet als een keuze maar als twijfel.
   */
  it('de losse knop onderaan staat er alleen als de kaart er niet al naar wijst', () => {
    expect(code).toMatch(/\{due\.length > 0 && \(\s*<div className="mt-8 text-center">/)
  })
})
