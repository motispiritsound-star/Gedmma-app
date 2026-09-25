import { describe, expect, it } from 'vitest'
import { REGISTRATIE_VINKJES, TOESTEMMING, toestemmingVan } from './toestemming'

const TALEN = ['nl', 'fr', 'de', 'es', 'it', 'en']

describe('toestemming', () => {
  it('bestaat in alle zes de talen', () => {
    expect(Object.keys(TOESTEMMING).sort()).toEqual([...TALEN].sort())
  })

  it('laat niets onvertaald', () => {
    for (const taal of TALEN) {
      const t = toestemmingVan(taal)
      for (const sleutel of ['voorwaarden', 'leeftijd', 'nieuwsbrief', 'herroeping'] as const) {
        expect(t[sleutel].tekst.length, `${taal}.${sleutel}`).toBeGreaterThan(20)
      }
      expect(t.privacyNoot.length).toBeGreaterThan(20)
      expect(t.waaromEmail.length).toBeGreaterThan(20)
    }
  })

  /**
   * Toestemming die je moet geven om iets anders te kunnen doen is geen
   * toestemming. Wordt de nieuwsbrief ooit verplicht gezet, dan is hij
   * onrechtmatig — en dat hoort de build te weten, niet de toezichthouder.
   */
  it('houdt de nieuwsbrief vrijwillig, in elke taal', () => {
    for (const taal of TALEN) expect(toestemmingVan(taal).nieuwsbrief.verplicht, taal).toBe(false)
  })

  it('houdt voorwaarden, leeftijd en herroeping verplicht', () => {
    for (const taal of TALEN) {
      const t = toestemmingVan(taal)
      expect(t.voorwaarden.verplicht && t.leeftijd.verplicht && t.herroeping.verplicht, taal).toBe(true)
    }
  })

  it('zet het herroepingsvinkje niet bij de registratie', () => {
    expect(REGISTRATIE_VINKJES).not.toContain('herroeping')
  })

  it('valt terug op het Nederlands bij een onbekende taal', () => {
    expect(toestemmingVan('pt')).toBe(TOESTEMMING.nl)
  })
})
