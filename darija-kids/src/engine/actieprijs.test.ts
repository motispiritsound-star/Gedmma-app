/**
 * Een tijdelijke korting op het jaarabonnement, en wat het scherm dan toont.
 *
 * Dit bestaat omdat de app de korting niet zóú tonen. `betaalFase` pakt de
 * laatste betaalde fase -- wat het elke periode kost -- en een korting is bij
 * beide winkels een fase dáárvóór. Het scherm zei dus € 59,99 terwijl de
 * winkel € 29,99 afschreef, met "39% voordeliger" ernaast waar het er 50%
 * zijn. Dat is de duurste soort fout: de advertentie heeft de klik al gekost
 * en dan spreekt het beslisscherm hem tegen.
 *
 * De belangrijkste eis van dit bestand staat bovenaan: **zonder actie
 * verandert er niets.** `nuFase` en `betaalFase` geven dan hetzelfde terug,
 * en elk scherm toont wat het altijd toonde.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { bedragVan, betaalFase, heeftProef, nuFase } from './billing'

/** Een product zoals de aankoopplug-in het teruggeeft. */
const product = (fasen: ({ price: string; priceMicros: number })[], pricing?: { price: string; priceMicros: number }) => ({
  pricing: pricing ?? null,
  offers: fasen.length ? [{ pricingPhases: fasen }] : [],
})

const euro = (bedrag: number) => ({ price: `€ ${bedrag.toFixed(2).replace('.', ',')}`, priceMicros: bedrag * 1e6 })
const gratis = { price: '€ 0,00', priceMicros: 0 }

describe('zonder actie verandert er niets', () => {
  /*
   * Dit is de eis waar alle andere aan ondergeschikt zijn. Op het moment van
   * schrijven staat er bij Apple op beide producten "Free for the first 3
   * days" en bij Google een proef-offer van 3 dagen. In die stand moeten de
   * twee functies hetzelfde zeggen.
   */
  it('geeft dezelfde prijs bij een product zonder enige aanbieding', () => {
    const p = product([], euro(59.99))
    expect(nuFase(p)).toEqual(betaalFase(p))
    expect(bedragVan(nuFase(p))).toBe(59.99)
  })

  it('en bij een product met alleen een gratis proefperiode — de stand van vandaag', () => {
    const p = product([gratis, euro(59.99)])
    expect(nuFase(p)).toEqual(betaalFase(p))
    expect(bedragVan(nuFase(p))).toBe(59.99)
    // De proef wordt overgeslagen, niet getoond: dat was de fout achter "$0.00 per jaar".
    expect(bedragVan(nuFase(p))).not.toBe(0)
    expect(heeftProef(p)).toBe(true)
  })

  it('en bij het e-boek, dat helemaal geen fasen heeft', () => {
    const p = product([], euro(14.99))
    expect(nuFase(p)).toEqual(betaalFase(p))
  })
})

describe('met een actie lopen ze uit elkaar', () => {
  /*
   * Google kan allebei: een offer mag meerdere fases hebben. Hun eigen
   * voorbeeld is "7 dagen gratis, daarna een maand voor $1,99, daarna de
   * basisprijs". Hier: 3 dagen gratis, een jaar voor € 29,99, daarna € 59,99.
   */
  it('bij Google: gratis proef, dan de korting, dan de volle prijs', () => {
    const p = product([gratis, euro(29.99), euro(59.99)])
    expect(bedragVan(nuFase(p)), 'dit gaat er nu af').toBe(29.99)
    expect(bedragVan(betaalFase(p)), 'dit kost het daarna').toBe(59.99)
    expect(heeftProef(p), 'de proef blijft bestaan').toBe(true)
  })

  /*
   * Apple kan dat niet. Er is één introductieaanbieding per abonnement per
   * land, en een nieuwe overschrijft de oude: "If you create new offers that
   * have overlapping dates, the latest action overwrites existing
   * introductory offers." Zet je daar 50% neer, dan is de proefperiode weg.
   */
  it('bij Apple: de korting vervangt de proef', () => {
    const p = product([euro(29.99), euro(59.99)])
    expect(bedragVan(nuFase(p))).toBe(29.99)
    expect(bedragVan(betaalFase(p))).toBe(59.99)
    expect(heeftProef(p), 'geen proef meer, en het scherm hoort dat te weten').toBe(false)
  })

  it('rekent de korting uit op de bedragen die de koper ziet', () => {
    const p = product([euro(29.99), euro(59.99)])
    const nu = bedragVan(nuFase(p))!
    const na = bedragVan(betaalFase(p))!
    expect(Math.round((1 - nu / na) * 100)).toBe(50)
  })
})

describe('de motor en het scherm', () => {
  const bron = readFileSync(new URL('./billing.ts', import.meta.url), 'utf8').replace(/\r\n/g, '\n')
  const unlock = readFileSync(new URL('../pages/Unlock.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n')

  it('vult de kaartprijs met wat er nú afgaat', () => {
    // `prices` draagt het afgeschreven bedrag, niet de verlengprijs: dat is
    // wat richtlijn 3.1.2(c) van het grootste element op de kaart verlangt.
    expect(bron).toContain('const fase = nuFase(product)')
    expect(bron).toContain('const verleng = betaalFase(product)')
  })

  it('zet `naActie` alleen als de twee bedragen verschillen', () => {
    expect(bron).toContain("if (later && later !== prijs) naActie[plan.id] = later")
  })

  it('laat de grote regel het afgeschreven bedrag zijn', () => {
    // Apple wees build 5 af op 3.1.2(c) omdat een omrekening opvallender was.
    // `prijsweergave.test.ts` bewaakt dit ook; hier staat waarom het bij een
    // actie opnieuw telt.
    expect(unlock).toContain('{priceOf(option.id)}')
  })

  it('kiest een ander bijschrift bij het doorgehaalde bedrag', () => {
    // "In plaats van" zou bij een actie onwaar zijn: dat bedrag is niet wat
    // het elders kost maar wat het hier straks zelf kost.
    expect(unlock).toContain('vergelijking.actie ? t.unlock.jaarNaActie : t.unlock.jaarInPlaatsVan')
  })

  it('noemt in de voorwaarden het bedrag van ná de actie', () => {
    // De vaste tekst zegt "en daarna elk jaar opnieuw", en dat leest bij een
    // actie als "elk jaar € 29,99".
    expect(unlock).toContain('billing.naActie.jaar && (')
    expect(unlock).toContain('t.unlock.naActieJaar(billing.naActie.jaar)')
  })
})
