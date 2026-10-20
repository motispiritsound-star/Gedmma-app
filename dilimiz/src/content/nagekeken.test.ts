import { describe, expect, it } from 'vitest'
import { NAKIJKSTAND, inhoudNagekeken, nogNaTeKijken } from './nakijken'
import { WOORDEN } from './woorden'
import { ZINNEN } from './zinnen'
import { LETTERS } from './letters'
import { KLANKPAREN } from './klankparen'

/**
 * Deze test faalt niet als de inhoud nog niet is nagekeken -- hij telt het.
 *
 * Falen zou verkeerd zijn: dan zou de hele bouw rood staan om iets wat alleen
 * een mens kan oplossen, en dan zet iemand de test uit. Hij drukt de stand af
 * zodat hij bij elke testronde in beeld komt, en bewaakt wél dat de vlaggen in
 * de inhoud kloppen met het register.
 */
describe('nakijkstand', () => {
  it('drukt af wat er nog nagekeken moet worden', () => {
    const open = nogNaTeKijken()
    if (open.length) {
      console.log(
        `\n  ⚠ Turkse inhoud nog niet nagekeken door een moedertaalspreker:\n` +
        open.map((f) => `    - ${f}`).join('\n') +
        `\n    Zie docs/decisions.md B-1. Hier publiceert niets voordat dit klaar is.\n`,
      )
    }
    expect(Array.isArray(open)).toBe(true)
  })

  it('houdt de vlaggen in de inhoud gelijk met het register', () => {
    // Zonder dit kan `woorden.ts` op nagekeken staan terwijl het register nee
    // zegt, of andersom -- en dan weet niemand wat waar is.
    const verwacht = (bestand: string) => NAKIJKSTAND[bestand]!.klaar
    for (const w of WOORDEN) expect(w.nagekeken, w.id).toBe(verwacht('woorden.ts'))
    for (const z of ZINNEN) expect(z.nagekeken, z.id).toBe(verwacht('zinnen.ts'))
    for (const l of LETTERS) expect(l.nagekeken, l.id).toBe(verwacht('letters.ts'))
    for (const p of KLANKPAREN) expect(p.nagekeken, p.id).toBe(verwacht('klankparen.ts'))
  })

  it('noteert bij elk nog niet nagekeken bestand wat er twijfelachtig is', () => {
    // Een nakijklijst zonder aanwijzingen is een nakijklijst die niemand
    // doorneemt. Wie het bestand heeft geschreven weet waar hij getwijfeld
    // heeft, en dat hoort opgeschreven.
    for (const [bestand, stand] of Object.entries(NAKIJKSTAND)) {
      if (!stand.klaar) {
        expect(stand.twijfel?.length, `${bestand} heeft geen twijfelpunten`).toBeGreaterThan(0)
      }
    }
  })

  it('eist een naam en een datum zodra iets op nagekeken staat', () => {
    for (const [bestand, stand] of Object.entries(NAKIJKSTAND)) {
      if (stand.klaar) {
        expect(stand.door.trim(), `${bestand}: wie heeft het nagekeken?`).toBeTruthy()
        expect(stand.op.trim(), `${bestand}: wanneer?`).toBeTruthy()
      }
    }
  })

  it('weet dat de inhoud nog niet klaar is om te publiceren', () => {
    // Zodra dit omslaat, hoort deze verwachting om te gaan. Dat is met opzet
    // een handmatige stap: het moment waarop de inhoud goedgekeurd is, is het
    // moment waarop iemand hiernaar hoort te kijken.
    expect(inhoudNagekeken()).toBe(false)
  })
})
