/**
 * Krijgt déze koper de proefperiode nog, en zegt het scherm dat ook?
 *
 * `TRIAL_DAYS` is bewoording en geen belofte — dat staat al bij die constante
 * in billing.ts. Maar het abonnementsscherm gebruikte hem wél als belofte: in
 * de knop stond "Start 3 dagen gratis" en in de voorwaarden "na 3 gratis
 * dagen", onvoorwaardelijk. Tegen iemand die zijn proef al had gehad betekende
 * dat: drie gratis dagen beloofd, meteen afgerekend.
 *
 * Dat is twee dingen tegelijk. Het is een onjuiste mededeling op precies het
 * scherm waar iemand besluit te betalen, en het is een terugboeking met een
 * boze recensie eronder. Het overkomt bovendien niet een randgeval maar de
 * meest betrokken gebruiker: wie opnieuw installeert, wie een tweede toestel
 * neemt, wie van maand naar jaar wil.
 *
 * De winkel weet het antwoord en stuurt het mee in de prijsfasen. Dit bestand
 * legt vast dat we die lezen in plaats van te gokken, en dat onbekend als
 * "geen proef" telt — want beloven wat je niet weet is hetzelfde probleem.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { heeftProef } from './billing'

/** Een abonnement met proefperiode: eerst een gratis fase, dan de echte. */
const metProef = {
  offers: [{ pricingPhases: [
    { price: '€ 0,00', priceMicros: 0, currency: 'EUR' },
    { price: '€ 59,99', priceMicros: 59_990_000, currency: 'EUR' },
  ] }],
}

/** Hetzelfde product nadat het account de aanbieding al gebruikt heeft. */
const zonderProef = {
  offers: [{ pricingPhases: [{ price: '€ 59,99', priceMicros: 59_990_000, currency: 'EUR' }] }],
}

describe('of de winkel nog een proefperiode aanbiedt', () => {
  it('ziet de gratis eerste fase', () => {
    expect(heeftProef(metProef)).toBe(true)
  })

  it('ziet dat hij weg is zodra de winkel hem weglaat', () => {
    expect(heeftProef(zonderProef)).toBe(false)
  })

  /*
   * Apple en Google laten de gratis fase weg zodra het account hem gebruikt
   * heeft. Eén fase betekent dus niet "dit product heeft nooit een proef",
   * maar "voor deze koper is er geen proef meer" -- en dat is precies het
   * geval dat hier fout ging.
   */
  it('telt een lege fase ook als gratis, want zo komt hij soms terug', () => {
    expect(heeftProef({ offers: [{ pricingPhases: [{}, { price: '€ 6,99', priceMicros: 6_990_000 }] }] })).toBe(true)
  })

  it('belooft niets als de winkel nog niets gezegd heeft', () => {
    expect(heeftProef(null)).toBe(false)
    expect(heeftProef(undefined)).toBe(false)
    expect(heeftProef({})).toBe(false)
    expect(heeftProef({ offers: [] })).toBe(false)
  })

  it('en niets bij een los product, dat geen fasen heeft', () => {
    expect(heeftProef({ pricing: { price: '€ 14,99', priceMicros: 14_990_000 } })).toBe(false)
  })
})

describe('het abonnementsscherm', () => {
  const unlock = readFileSync(new URL('../pages/Unlock.tsx', import.meta.url), 'utf8')

  it('hangt knop én voorwaarden aan wat de winkel zei', () => {
    expect(unlock).toContain('const magProef = billing.proef[plan] === true')
    expect(unlock).toContain('magProef ? t.unlock.koop(TRIAL_DAYS) : t.unlock.koopDirect')
  })

  /*
   * De kern: nergens meer een TRIAL_DAYS die niet achter `magProef` staat.
   * Zonder deze test sluipt de onvoorwaardelijke belofte er bij de eerstvolgende
   * herschrijving zo weer in.
   */
  it('noemt de proefperiode nergens meer onvoorwaardelijk', () => {
    const blok = unlock.slice(unlock.indexOf('billing.available ? ('), unlock.indexOf('billing.error &&'))
    for (const stuk of blok.split('\n')) {
      if (!stuk.includes('TRIAL_DAYS')) continue
      expect(stuk.includes('magProef') || blok.slice(0, blok.indexOf(stuk)).includes('magProef'),
        `deze regel belooft een proef zonder te kijken of hij er is: ${stuk.trim()}`).toBe(true)
    }
  })

  it('heeft voor allebei de plannen een tekst zonder proef', () => {
    expect(unlock).toContain('t.unlock.voorwaardenJaarDirect(price, winkel)')
    expect(unlock).toContain('t.unlock.voorwaardenDirect(price, winkel)')
  })
})

describe('de teksten zelf', () => {
  const TALEN = ['nl', 'fr', 'de', 'es', 'it', 'en'] as const

  it('beloven in geen enkele taal iets gratis als er geen proef is', async () => {
    const gratis = /gratis|gratuit|kostenlos|gratuita|gratuito|free trial|essai/i
    for (const taal of TALEN) {
      const { [taal]: woorden } = await import(`../i18n/${taal}.ts`) as Record<string, { unlock: Record<string, unknown> }>
      const u = woorden.unlock as {
        voorwaardenJaarDirect: (p: string, w: string) => string
        voorwaardenDirect: (p: string, w: string) => string
        koopDirect: string
      }
      for (const tekst of [u.voorwaardenJaarDirect('€ 59,99', 'x'), u.voorwaardenDirect('€ 6,99', 'x')]) {
        // "geen gratis proefperiode" mag wél: dat is de mededeling zelf.
        const zonderOntkenning = tekst
          .replace(/geen gratis proefperiode|Aucune période d’essai gratuite|keine kostenlose Testphase|ninguna prueba gratuita|alcun periodo di prova gratuito|No free trial/gi, '')
        expect(zonderOntkenning, `${taal}: ${tekst}`).not.toMatch(gratis)
      }
      expect(u.koopDirect, taal).toBeTruthy()
      expect(u.koopDirect, taal).not.toMatch(gratis)
    }
  })
})
