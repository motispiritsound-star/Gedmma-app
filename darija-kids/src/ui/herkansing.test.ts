/**
 * Een gemiste vraag komt één keer terug, niet eindeloos.
 *
 * De ronde hing achter elke fout een kopie aan de rij — ook achter de fout op
 * de kopie. Met hartjes loopt dat vanzelf dood: op is op. Maar `hearts` is een
 * schakelaar die een ouder voor een jonger kind juist uitzet, en dan is er
 * geen bodem meer. Wie één woord niet onder de knie krijgt, krijgt het de hele
 * avond terug, en de enige uitgang is het kruisje — dat de les weggooit.
 * Precies het kind dat de ronde het hardst nodig heeft.
 *
 * Eén herkansing is genoeg. Het antwoord is al als fout genoteerd, dus de
 * planning zet het woord vanzelf bovenaan de volgende herhaling. Daar hoort
 * het thuis, niet in een ronde zonder eind.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const code = readFileSync(new URL('./Round.tsx', import.meta.url), 'utf8')
  .replace(/\r\n/g, '\n')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '')

describe('de rij van een ronde', () => {
  it('hangt een gemiste vraag achteraan', () => {
    expect(code).toMatch(/setQueue\(\(q\) => \[\.\.\.q, \{ \.\.\.exercise, id: `\$\{exercise\.id\}-again` \}\]\)/)
  })

  it('maar niet achter een herkansing', () => {
    expect(code).toMatch(/v === 'fout' && !exercise\.id\.endsWith\('-again'\)/)
  })

  /**
   * Waarmee de rij hoogstens twee keer zo lang wordt als hij begon. Dat is de
   * hele garantie: elke ronde eindigt, ook met hartjes uit, ook als je alles
   * fout doet.
   */
  it('de kopie draagt het merkteken dat de bodem legt', () => {
    const regel = code.split('\n').find((r) => r.includes('-again` }]'))
    expect(regel).toBeDefined()
    expect(regel).toContain('`${exercise.id}-again`')
  })
})

/**
 * Nagerekend op de regel zelf: één keer fout op een verse vraag geeft een
 * kopie, fout op die kopie geeft er geen.
 */
describe('hoe vaak een vraag terugkomt', () => {
  const herkanst = (id: string): boolean => !id.endsWith('-again')

  it('een verse vraag krijgt een herkansing', () => {
    expect(herkanst('review-3')).toBe(true)
  })

  it('een herkansing krijgt er geen', () => {
    expect(herkanst('review-3-again')).toBe(false)
  })

  it('zo wordt een ronde van twaalf er hoogstens vierentwintig', () => {
    const start = Array.from({ length: 12 }, (_, i) => `les-${i}`)
    const rij = [...start]
    // alles fout, twee keer rond
    for (const id of start) if (herkanst(id)) rij.push(`${id}-again`)
    for (const id of rij.slice(12)) if (herkanst(id)) rij.push(`${id}-again`)
    expect(rij).toHaveLength(24)
  })
})
