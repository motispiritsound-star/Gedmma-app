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

/**
 * Waar het om gaat is het label, niet het aantal kolommen.
 *
 * Deze test eiste eerst van élke `grid-cols-3` dat hij onder de 360 punten
 * terugviel op twee. Dat klopt voor de drie stattegels op Review, Bonus en
 * LessonPlayer: daar staat één woord per tegel, en op 320 punten paste geen
 * enkele maat meer.
 *
 * Voor het memoryspel is het precies verkeerd. Daar liggen twaalf vierkante
 * tegels, en twee kolommen maken er zes rijen van. Gemeten met de echte
 * app-CSS op een venster van 320 bij 568:
 *
 *   twee kolommen   tegel 139px, bord 884px, onderkant 484px onder de vouw
 *   drie kolommen   tegel  89px, bord 387px, past met ruimte over
 *
 * Een memoryspel waarbij je moet scrollen om de kaarten te zien is geen
 * memoryspel: je kunt de posities niet onthouden als je ze niet samen ziet.
 *
 * De eis eronder blijft wel staan, want die was terecht: een lang woord mag
 * niet buiten zijn tegel steken. Alleen is twee kolommen daar niet het middel
 * voor — breken wel.
 */
const STATRIJEN = [
  '../pages/Review.tsx',
  '../pages/Bonus.tsx',
  '../pages/LessonPlayer.tsx',
]

describe('de tegels', () => {
  it('vallen op een smalle telefoon terug op twee kolommen', () => {
    for (const pad of STATRIJEN) {
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

  it('laten het memoryspel op één scherm staan, en laten het woord breken', () => {
    const spel = bron('../pages/Games.tsx')
    // Twaalf tegels in twee kolommen worden zes rijen: 884 punten hoog, en dan
    // staat meer dan de helft onder de vouw.
    expect(spel, 'het memorybord valt terug op twee kolommen')
      .not.toMatch(/grid-cols-2 min-\[360px\]:grid-cols-3 gap-2\.5/)

    // En dan moet het label wel binnen de tegel blijven. `w-full min-w-0` is
    // het stuk dat het werkelijk doet: in een `flex-col items-center` krijgt
    // een kind de breedte van zijn inhoud, en dan is er geen regel om op te
    // breken. Gemeten: met alleen `break-words` stak Geschwisterkind nog
    // steeds vijftien punten buiten zijn tegel, met `w-full min-w-0` erbij
    // niets meer, in geen enkele richting.
    const labels = spel.match(/className="[^"]*text-\[11px\][^"]*"/g) ?? []
    expect(labels.length, 'de labels in de tegels zijn niet gevonden').toBeGreaterThan(1)
    for (const l of labels) {
      expect(l, `dit label kan buiten zijn tegel steken: ${l}`).toContain('w-full')
      expect(l).toContain('min-w-0')
      expect(l).toContain('break-words')
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
