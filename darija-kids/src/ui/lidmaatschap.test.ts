/**
 * Wat er verandert als iemand betaald heeft.
 *
 * Tot nu toe: niets zichtbaars. Sloten verdwenen en de knop in de kopbalk ging
 * weg, maar er kwam nergens iets voor in de plaats. Voor iemand die net zestig
 * euro heeft uitgegeven is dat de verkeerde eerste indruk — de vraag die dan
 * opkomt is "is het wel gelukt?", en die hoort de app zelf te beantwoorden en
 * niet de bon in een mailbox.
 *
 * Nagemeten in Chromium op 390 pixels: zonder abonnement staat er niets, met
 * abonnement een gouden rand om de kaart, een ring om de avatar en het woord
 * onder de naam.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { STRINGS } from '../i18n'
import { LANG_CODES } from '../i18n/languages'

const bron = readFileSync(new URL('../pages/Profile.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n')

describe('het lidmaatschap op de profielkaart', () => {
  it('staat er alleen voor wie betaald heeft', () => {
    expect(bron).toContain('const lid = state.unlocked')
    expect(bron).toContain('{lid && (')
    // De rand en de ring hangen aan dezelfde voorwaarde.
    expect(bron.match(/\blid \?/g)?.length).toBe(2)
  })

  /**
   * `unlockedAt` lag er al sinds het begin en werd nergens gelezen. Nu draagt
   * het de datum onder de naam.
   */
  it('gebruikt de dag waarop de toegang begon', () => {
    expect(bron).toContain('state.unlockedAt')
  })

  /**
   * "Lid sinds" en niet "betaald op".
   *
   * De eerste dagen zijn gratis, dus de dag waarop de toegang begon is niet de
   * dag waarop er geld af ging. Dat verschil op het scherm omdraaien is een
   * kleine onwaarheid op precies de plek waar iemand zijn aankoop controleert.
   */
  it('belooft in geen enkele taal dat er die dag betaald is', () => {
    for (const taal of LANG_CODES) {
      const p = STRINGS[taal].profile
      expect(p.lidTitel.length, taal).toBeGreaterThan(4)
      expect(p.lidSinds('1 oktober'), taal).toContain('1 oktober')
      expect(p.lidSinds('1 oktober').toLowerCase(), taal).not.toMatch(/betaald|payé|bezahlt|pagado|pagato|paid/)
    }
  })
})
