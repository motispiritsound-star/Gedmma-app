import { describe, expect, it } from 'vitest'
import { DELEN } from './prentenboek'
import { VERTALINGEN, VORDERING, deelIn } from './prentenboek-talen'

/**
 * Een vertaling die niet past, is erger dan geen vertaling.
 *
 * De tekeningen liggen vast: bladzijde zeven van deel drie is in elke taal
 * dezelfde plaat. Als er in het Frans elf bladzijden staan waar er twaalf
 * horen, schuift alles op en staat het woord bij de verkeerde tekening. Dat
 * zie je niet in de code en wel in een gedrukt boek.
 */
describe('de vertalingen van de prentenboeken', () => {
  for (const [taal, vertaling] of Object.entries(VERTALINGEN)) {
    describe(taal, () => {
      for (const deel of DELEN) {
        const vertaald = vertaling[deel.nummer]
        if (!vertaald) continue

        it(`deel ${deel.nummer} heeft evenveel bladzijden als het Nederlands`, () => {
          expect(vertaald.bladen.length).toBe(deel.bladen.length)
        })

        it(`deel ${deel.nummer} heeft op elke bladzijde tekst en een betekenis`, () => {
          for (const [i, blad] of vertaald.bladen.entries()) {
            expect(blad.tekst.length, `deel ${deel.nummer}, bladzijde ${i + 1}`).toBeGreaterThan(0)
            expect(blad.tekst.every((r) => r.trim().length > 0)).toBe(true)
            expect(blad.woord.trim().length, `deel ${deel.nummer}, bladzijde ${i + 1}`).toBeGreaterThan(0)
          }
        })

        it(`deel ${deel.nummer} houdt het Darija-woord en de tekening aan`, () => {
          const samen = deelIn(taal, deel.nummer)
          expect(samen.bladen.map((b) => b.woord.tr)).toEqual(deel.bladen.map((b) => b.woord.tr))
          expect(samen.bladen.map((b) => b.scene)).toEqual(deel.bladen.map((b) => b.scene))
          expect(samen.bladen.map((b) => b.echo)).toEqual(deel.bladen.map((b) => b.echo))
        })
      }

      it('is nog niet af, of helemaal af — niets ertussenin blijft onopgemerkt', () => {
        const { klaar, totaal } = VORDERING[taal]
        expect(klaar, `${taal}: ${klaar} van de ${totaal} delen vertaald`).toBeGreaterThan(0)
      })
    })
  }

  it('valt terug op het Nederlands voor een deel dat nog niet vertaald is', () => {
    const nl = DELEN[DELEN.length - 1]
    expect(deelIn('fr', nl.nummer).bladen.length).toBe(nl.bladen.length)
  })
})
