/**
 * `.ar` wint van elke Tailwind-klasse, en dat is twee keer misgegaan.
 *
 * De regel staat buiten elke laag in `index.css`, en Tailwind zet zijn klassen
 * in `@layer utilities`. In CSS wint een regel zonder laag altijd van een regel
 * in een laag — ongeacht volgorde of specificiteit. Alles wat in `.ar` staat
 * wint dus van de klasse ernaast.
 *
 * Gevolg één: op het leerpad stond `hidden sm:block` op de Arabische unitnaam,
 * en die verborg niets. Nagemeten op een scherm van 320px: de naam nam 70 van
 * de 248 pixels in en de ondertitel van de unit hield er 88 over — zes Duitse
 * woorden over zes regels. Na de reparatie 170.
 *
 * Gevolg twee: drie elementen droegen een `leading-*` die niets deed. Die zijn
 * weg; ze wekken de indruk dat er iets is afgesproken wat er niet is. En
 * `.ar` is met opzet níet alsnog in een laag gezet: dan zouden die drie ineens
 * wél werken, en `leading-tight` snijdt Arabisch af.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const lees = (pad: string) => readFileSync(new URL(pad, import.meta.url), 'utf8').replace(/\r\n/g, '\n')

describe('de regel zelf', () => {
  const css = lees('../index.css')

  it('staat buiten elke laag, met de reden erbij', () => {
    expect(css).toMatch(/Een regel zonder laag wint altijd van een regel in een\n \* laag/)
    expect(css).toMatch(/\n\.ar \{/)
  })

  /** Komt hij ooit in een laag, dan moeten die drie regelafstanden terug. */
  it('is niet in een laag gezet', () => {
    expect(css).not.toMatch(/@layer [^{]*\{[^}]*\.ar \{/s)
  })
})

describe('geen Tailwind-klasse die niets doet op een .ar', () => {
  const bestanden = [
    '../pages/Learn.tsx', '../pages/Landing.tsx', '../pages/Games.tsx',
    '../pages/Words.tsx', '../pages/Profile.tsx', '../ui/exercises.tsx',
    '../ui/WordChip.tsx', '../ui/Round.tsx',
  ]

  it.each(bestanden)('%s', (pad) => {
    const bron = lees(pad)
    for (const m of bron.matchAll(/className="([^"]*\bar\b[^"]*)"/g)) {
      const klassen = m[1]!.split(/\s+/)
      if (!klassen.includes('ar')) continue
      const dood = klassen.filter((k) =>
        /^(hidden|block|inline|inline-block|flex|grid)$/.test(k)
        || /^(sm|md|lg|xl):(hidden|block|inline|inline-block|flex|grid)$/.test(k)
        || /^leading-/.test(k))
      expect(dood).toEqual([])
    }
  })
})

describe('het pad zet de displayklasse op een omhulsel', () => {
  it('verbergt de Arabische unitnaam op een smal scherm', () => {
    expect(lees('../pages/Learn.tsx')).toContain('<span className="ms-auto hidden shrink-0 sm:block">')
  })
})
