/**
 * De reeks zoals hij vandaag is, niet zoals hij was toen je wegging.
 *
 * `streak` wordt alleen bijgewerkt in `addXp`, en die draait pas als je een
 * antwoord geeft. Tot dat moment staat het oude getal er gewoon. Nagemeten in
 * de browser met vijf profielen — gisteren, eergisteren met en zonder
 * vriesdag, acht dagen en veertig dagen weg: alle vijf toonden 🔥 12 in de
 * kopbalk.
 *
 * Dat is niet alleen onwaar, het maakt het moment van terugkomen naar. Je doet
 * een les in het vertrouwen dat je reeks doorloopt, en bij het eerste goede
 * antwoord springt hij naar 1 zonder dat er iets wordt gezegd.
 */
import { describe, expect, it } from 'vitest'
import { reeksNu, type State } from './store'

const DAG = 86_400_000
const dagen = (n: number): string => new Date(Date.UTC(2026, 0, 20) - n * DAG).toISOString().slice(0, 10)
const vandaag = dagen(0)

const profiel = (p: Partial<State>): State => ({ streak: 12, freezes: 0, lastDay: dagen(1), ...p } as State)

describe('wanneer een reeks nog leeft', () => {
  it('vandaag geoefend', () => {
    expect(reeksNu(profiel({ lastDay: vandaag }), vandaag)).toBe(12)
  })

  it('gisteren geoefend', () => {
    expect(reeksNu(profiel({ lastDay: dagen(1) }), vandaag)).toBe(12)
  })

  /** Eergisteren mag, maar alleen met een vriesdag achter de hand. */
  it('eergisteren met een vriesdag', () => {
    expect(reeksNu(profiel({ lastDay: dagen(2), freezes: 1 }), vandaag)).toBe(12)
  })
})

describe('wanneer hij voorbij is', () => {
  it('eergisteren zonder vriesdag', () => {
    expect(reeksNu(profiel({ lastDay: dagen(2), freezes: 0 }), vandaag)).toBe(0)
  })

  /** Een vriesdag dekt één gemiste dag, niet twee. */
  it('drie dagen terug, ook met vriesdagen', () => {
    expect(reeksNu(profiel({ lastDay: dagen(3), freezes: 2 }), vandaag)).toBe(0)
  })

  it('veertig dagen weg', () => {
    expect(reeksNu(profiel({ lastDay: dagen(40), freezes: 2 }), vandaag)).toBe(0)
  })
})

describe('randgevallen', () => {
  it('een profiel dat nog nooit geoefend heeft', () => {
    expect(reeksNu(profiel({ streak: 0, lastDay: '' }), vandaag)).toBe(0)
  })

  /** Een reeks van nul blijft nul; er valt niets te verliezen. */
  it('reeks nul met een oude dag', () => {
    expect(reeksNu(profiel({ streak: 0, lastDay: dagen(99) }), vandaag)).toBe(0)
  })

  /**
   * Een opgeslagen dag in de toekomst — een toestel met de klok verzet, of een
   * reis naar een andere tijdzone. Die hoort de reeks niet weg te gooien, maar
   * hem ook niet eeuwig in leven te houden: hij telt alleen als hij vandaag of
   * gisteren is.
   */
  it('een dag in de toekomst telt niet mee', () => {
    expect(reeksNu(profiel({ lastDay: dagen(-3) }), vandaag)).toBe(0)
  })
})
