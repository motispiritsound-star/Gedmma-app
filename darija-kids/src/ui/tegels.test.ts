/**
 * Drie tegels naast elkaar passen niet op elke telefoon.
 *
 * Op het herhaalscherm stond letterlijk "VASTGEZE" met op de regel eronder
 * "T". Het component probeerde het al netjes te doen — `min-w-0` zodat een
 * lange Duitse samenstelling de bladzijde niet zijwaarts wegduwt, en
 * `hyphens-auto` met de taal erbij zodat hij op een koppelteken breekt.
 *
 * Maar `hyphens: auto` vuurt alleen als de browser een woordenboek voor die
 * taal heeft, en dat is lang niet overal zo. Vuurt hij niet, dan grijpt
 * `break-words` in, en die knipt waar hij uitkomt: midden in het woord.
 *
 * Gemeten op 320 en 390 pixels in alle zes de talen. Op 390 hielp het
 * weghalen van de letterspatiëring en een pixel eraf; op 320 hielp geen enkele
 * maat meer — ook niet negen pixels, en dat is al te klein om te lezen. Drie
 * kolommen ís daar gewoon te smal. Vandaar twee kolommen onder de 360.
 *
 * `break-words` blijft staan als laatste redmiddel: komt er ooit een woord dat
 * alsnog niet past, dan is een lelijke afbreking beter dan een bladzijde die
 * je opzij kunt schuiven.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const bron = (pad: string) => readFileSync(new URL(pad, import.meta.url), 'utf8')

/** Elke bladzijde die een rij tegels naast elkaar zet. */
const RIJEN = [
  '../pages/Review.tsx',
  '../pages/Bonus.tsx',
  '../pages/Games.tsx',
  '../pages/LessonPlayer.tsx',
]

describe('de tegels', () => {
  it('vallen op een smalle telefoon terug op twee kolommen', () => {
    for (const pad of RIJEN) {
      const tekst = bron(pad)
      const drie = [...tekst.matchAll(/grid-cols-3/g)]
      expect(drie.length, `${pad} heeft geen rij van drie meer?`).toBeGreaterThan(0)

      // Elke `grid-cols-3` die bij tegels hoort, hoort een smalle variant te
      // hebben. De responsieve rijen (`sm:grid-cols-2 lg:grid-cols-3`) zijn
      // iets anders en mogen blijven.
      const kaal = tekst.match(/className="[^"]*\bgrid-cols-3\b[^"]*"/g) ?? []
      for (const regel of kaal) {
        const responsief = /(sm|md|lg):grid-cols-3/.test(regel)
        const smal = /min-\[360px\]:grid-cols-3/.test(regel)
        expect(responsief || smal, `${pad}: ${regel} past niet op een smal scherm`).toBe(true)
      }
    }
  })

  it('houden het label zonder letterspatiëring', () => {
    // Bij hoofdletters telt `tracking-wide` op: elke letter een stukje breder,
    // in een tegel die nog geen tachtig pixels binnenwerk heeft.
    const kit = bron('./kit.tsx')
    const label = /lang=\{lang\}\s*className="([^"]*)"/.exec(kit)?.[1] ?? ''
    expect(label, 'het labelblok is niet gevonden').not.toBe('')
    expect(label, 'tracking-wide maakt het label onnodig breed').not.toContain('tracking-wide')
    expect(label, 'min-w-0 en break-words horen te blijven als vangnet').toContain('break-words')
    expect(label).toContain('hyphens-auto')
  })

  it('houden het vangnet tegen een bladzijde die zijwaarts wegschuift', () => {
    const kit = bron('./kit.tsx')
    expect(kit).toContain('min-w-0')
  })
})
