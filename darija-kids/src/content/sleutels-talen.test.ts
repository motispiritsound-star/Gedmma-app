import { describe, expect, it } from 'vitest'
import { REEKS, type Sleuteldeel } from './sleutels'
import { DEEL1_HOOFDSTUKKEN } from './sleutels-deel1'
import { DEEL2_HOOFDSTUKKEN } from './sleutels-deel2'
import { DEEL3_HOOFDSTUKKEN } from './sleutels-deel3'
import { DEEL4_HOOFDSTUKKEN } from './sleutels-deel4'
import { DEEL5_HOOFDSTUKKEN } from './sleutels-deel5'
import { DEEL6_HOOFDSTUKKEN } from './sleutels-deel6'
import { DEEL7_HOOFDSTUKKEN } from './sleutels-deel7'
import { DEEL8_HOOFDSTUKKEN } from './sleutels-deel8'
import { DEEL9_HOOFDSTUKKEN } from './sleutels-deel9'
import { DEEL10_HOOFDSTUKKEN } from './sleutels-deel10'
import { DEEL11_HOOFDSTUKKEN } from './sleutels-deel11'
import { DEEL12_HOOFDSTUKKEN } from './sleutels-deel12'
import { DEEL13_HOOFDSTUKKEN } from './sleutels-deel13'
import { SLEUTEL_VERTALINGEN, SLEUTEL_SCHIL, sleuteldeelIn } from './sleutels-talen'

/** De Nederlandse delen die al geschreven zijn, op nummer. */
const NL: Record<number, Sleuteldeel> = {
  1: { ...REEKS[0], hoofdstukken: DEEL1_HOOFDSTUKKEN } as Sleuteldeel,
  2: { ...REEKS[1], hoofdstukken: DEEL2_HOOFDSTUKKEN } as Sleuteldeel,
  3: { ...REEKS[2], hoofdstukken: DEEL3_HOOFDSTUKKEN } as Sleuteldeel,
  4: { ...REEKS[3], hoofdstukken: DEEL4_HOOFDSTUKKEN } as Sleuteldeel,
  5: { ...REEKS[4], hoofdstukken: DEEL5_HOOFDSTUKKEN } as Sleuteldeel,
  6: { ...REEKS[5], hoofdstukken: DEEL6_HOOFDSTUKKEN } as Sleuteldeel,
  7: { ...REEKS[6], hoofdstukken: DEEL7_HOOFDSTUKKEN } as Sleuteldeel,
  8: { ...REEKS[7], hoofdstukken: DEEL8_HOOFDSTUKKEN } as Sleuteldeel,
  9: { ...REEKS[8], hoofdstukken: DEEL9_HOOFDSTUKKEN } as Sleuteldeel,
  10: { ...REEKS[9], hoofdstukken: DEEL10_HOOFDSTUKKEN } as Sleuteldeel,
  11: { ...REEKS[10], hoofdstukken: DEEL11_HOOFDSTUKKEN } as Sleuteldeel,
  12: { ...REEKS[11], hoofdstukken: DEEL12_HOOFDSTUKKEN } as Sleuteldeel,
  13: { ...REEKS[12], hoofdstukken: DEEL13_HOOFDSTUKKEN } as Sleuteldeel,
}

describe('De sleutels in andere talen', () => {
  for (const [taal, vertaling] of Object.entries(SLEUTEL_VERTALINGEN)) {
    describe(taal, () => {
      for (const nummer of Object.keys(vertaling).map(Number)) {
        const basis = NL[nummer]
        if (!basis) continue

        it(`deel ${nummer} heeft evenveel hoofdstukken als het Nederlands`, () => {
          expect(vertaling[nummer].hoofdstukken).toHaveLength(basis.hoofdstukken.length)
        })

        /* Eén alinea in het Nederlands is één alinea hier. Een samengevoegde
           alinea haalt de stiltes uit een hoofdstuk, en daar leeft dit boek
           van — dus dat mag de test niet laten passeren. */
        it(`deel ${nummer} heeft per hoofdstuk evenveel alinea's`, () => {
          vertaling[nummer].hoofdstukken.forEach((h, i) => {
            expect(h.tekst.length, `hoofdstuk ${i + 1}`).toBe(basis.hoofdstukken[i].tekst.length)
          })
        })

        it(`deel ${nummer} heeft nergens een lege regel`, () => {
          for (const h of vertaling[nummer].hoofdstukken) {
            expect(h.titel.trim()).not.toBe('')
            for (const regel of h.tekst) expect(regel.trim()).not.toBe('')
          }
        })

        it(`deel ${nummer} legt zich netjes over het Nederlands heen`, () => {
          const uit = sleuteldeelIn(taal, basis)
          expect(uit.nummer).toBe(basis.nummer)
          expect(uit.titel).toBe(vertaling[nummer].titel)
          expect(uit.hoofdstukken.map((h) => h.nummer)).toEqual(basis.hoofdstukken.map((h) => h.nummer))
        })
      }

      it('heeft een eigen schil', () => {
        expect(SLEUTEL_SCHIL[taal]).toBeDefined()
        expect(SLEUTEL_SCHIL[taal].disclaimer.length).toBe(SLEUTEL_SCHIL.nl.disclaimer.length)
      })
    })
  }

  /* Zonder deze test glipt een vertaald deel waarvoor hier geen Nederlands
     staat er ongemerkt langs, en dan controleert de rest van dit bestand het
     nooit. */
  it('heeft voor elk vertaald deel een Nederlands deel om tegen te leggen', () => {
    for (const vertaling of Object.values(SLEUTEL_VERTALINGEN)) {
      for (const nummer of Object.keys(vertaling).map(Number)) {
        expect(NL[nummer], `deel ${nummer} ontbreekt in deze test`).toBeDefined()
      }
    }
  })

  it('valt terug op het Nederlands voor een taal die er niet is', () => {
    expect(sleuteldeelIn('is', NL[1])).toBe(NL[1])
  })

  it('weigert een vertaling met een ander aantal hoofdstukken', () => {
    const kort = { ...NL[1], hoofdstukken: NL[1].hoofdstukken.slice(0, 3) }
    expect(() => sleuteldeelIn('fr', kort)).toThrow(/hoofdstukken/)
  })
})
