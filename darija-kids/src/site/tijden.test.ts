/**
 * De database bewaart seconden. Alles wat eraan raakt moet dat weten.
 *
 * `nu()` staat twee keer in de worker en levert allebei de keren seconden.
 * De opdrachten in `scripts/` lezen en schrijven diezelfde kolommen, maar
 * staan in een ander bestand, een andere taal-variant en een ander hoofd — en
 * daar ging het mis: `npm run bestellingen` deelde `gekocht_op` door duizend
 * en toonde bij elke echte bestelling een datum in 1970.
 *
 * Dat bleef verborgen omdat de próéfgegevens in milliseconden waren gezet.
 * De verkeerde vraag op de verkeerde gegevens gaf het goede antwoord. Vandaar
 * deze test: hij kijkt naar de afspraak zelf, niet naar een uitkomst.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const lees = (pad: string) => readFileSync(pad, 'utf8')

describe('de eenheid van een tijdstempel', () => {
  it('is in de worker overal seconden', () => {
    for (const pad of ['server/src/index.ts', 'server/src/portaal.ts']) {
      expect(lees(pad), pad).toContain('const nu = (): number => Math.floor(Date.now() / 1000)')
    }
  })

  it('wordt door geen enkele opdracht door duizend gedeeld', () => {
    // `gekocht_op / 1000` is precies de fout die dit bestand heeft opgeleverd.
    for (const pad of ['scripts/bestellingen.mjs', 'scripts/intrekken.mjs']) {
      expect(lees(pad), pad).not.toMatch(/_op\s*\/\s*1000/)
    }
  })

  it('wordt door geen enkele opdracht in milliseconden weggeschreven', () => {
    const bron = lees('scripts/intrekken.mjs')
    // Date.now() is milliseconden; de kolom is seconden.
    expect(bron).not.toMatch(/ingetrokken\s*=\s*\$\{Date\.now\(\)\}/)
    expect(bron).toContain('Math.floor(Date.now() / 1000)')
  })
})
