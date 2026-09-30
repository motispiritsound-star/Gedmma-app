import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * De "wat is er nieuw"-teksten moeten passen in het veld waar ze in gaan.
 *
 * Play Console kapt niet af en waarschuwt niet vooraf: het uploaden van een
 * release met een te lange tekst faalt, en dat merk je op het moment dat de
 * bundel er al staat. Apple geeft 4000 tekens, Play 500 — per taal.
 *
 * De zes talen moeten er alle zes zijn. Een ontbrekende taal houdt in Play
 * Console de tekst van de vórige versie, en dan vertelt de winkel in het Duits
 * over een verbetering die er een release geleden al was.
 */
const WORTEL = path.join(process.cwd(), 'store')
const TALEN = ['nl-NL', 'fr-FR', 'de-DE', 'es-ES', 'it-IT', 'en-US']
const PLAY_MAX = 500

const bestanden = (): string[] =>
  readdirSync(WORTEL).filter((naam) => /^wat-is-nieuw-.*\.md$/.test(naam))

/** De tekst per taal, dus alles onder een `## <taal>` tot de volgende kop. */
const perTaal = (inhoud: string): Map<string, string> => {
  const uit = new Map<string, string>()
  const delen = inhoud.split(/^## /m).slice(1)
  for (const deel of delen) {
    const eind = deel.indexOf('\n')
    uit.set(deel.slice(0, eind).trim(), deel.slice(eind).trim())
  }
  return uit
}

describe('de winkelteksten bij een release', () => {
  const namen = bestanden()

  it('er is er minstens één', () => {
    expect(namen.length).toBeGreaterThan(0)
  })

  for (const naam of namen) {
    const inhoud = readFileSync(path.join(WORTEL, naam), 'utf8')
    const talen = perTaal(inhoud)

    it(`${naam} heeft alle zes de talen`, () => {
      expect([...talen.keys()].sort()).toEqual([...TALEN].sort())
    })

    for (const taal of TALEN) {
      it(`${naam} · ${taal} past in het veld van Play`, () => {
        const tekst = talen.get(taal)
        expect(tekst, `${taal} ontbreekt in ${naam}`).toBeTruthy()
        expect(tekst!.length).toBeLessThanOrEqual(PLAY_MAX)
      })

      it(`${naam} · ${taal} is niet leeg`, () => {
        expect((talen.get(taal) ?? '').length).toBeGreaterThan(40)
      })
    }
  }
})
