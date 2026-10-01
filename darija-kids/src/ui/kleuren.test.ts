/**
 * Elke kleur die een klasse noemt, moet ook bestaan.
 *
 * Tailwind 4 maakt een klasse als `text-zellige-200` alleen aan als er een
 * `--color-zellige-200` in `index.css` staat. Staat hij er niet, dan is het
 * geen fout en geen waarschuwing: de regel verdwijnt gewoon, en het element
 * houdt de kleur die het al had.
 *
 * Zes van zulke klassen stonden in de app, en vijf ervan waren
 * `dark:`-varianten — precies de regels die je in de lichte stand niet ziet
 * missen. Het badje "incl. e-boek" op het abonnementsscherm viel daardoor in
 * de donkere stand terug op zijn lichte kleur: 2,06 op 1, waar 4,5 de norm is.
 *
 * Deze test leest de klassen uit de bron en legt ze naast de tokens. Hij is er
 * voor de volgende keer, want dit is bij uitstek het soort fout dat je er bij
 * het schrijven niet uit ziet komen.
 */
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const SRC = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const css = readFileSync(path.join(SRC, 'index.css'), 'utf8')

/** De reeksen die we zelf verzinnen; de rest komt van Tailwind. */
const EIGEN = ['zellige', 'saffron', 'terra', 'mint', 'night', 'khatim', 'alam']

const gedefinieerd = new Set(
  [...css.matchAll(/--color-([a-z]+)-(\d+):/g)].map((m) => `${m[1]}-${m[2]}`),
)

/** Elk voorvoegsel waarmee Tailwind een kleur kan opmaken. */
const EIGENSCHAP =
  'text|bg|border|from|to|via|ring|fill|stroke|accent|decoration|outline|shadow|caret|divide|placeholder'

function bronnen(map: string, uit: string[] = []): string[] {
  for (const item of readdirSync(map, { withFileTypes: true })) {
    const p = path.join(map, item.name)
    if (item.isDirectory()) bronnen(p, uit)
    else if (/\.tsx?$/.test(item.name) && !item.name.includes('.test.')) uit.push(p)
  }
  return uit
}

describe('de kleuren van de app', () => {
  it('noemt geen tint die niet in `index.css` staat', () => {
    const patroon = new RegExp(
      `\\b(?:[a-z-]+:)*(?:${EIGENSCHAP})-(${EIGEN.join('|')})-(\\d+)`,
      'g',
    )
    const mist = new Map<string, Set<string>>()
    for (const bestand of bronnen(SRC)) {
      for (const m of readFileSync(bestand, 'utf8').matchAll(patroon)) {
        const tint = `${m[1]}-${m[2]}`
        if (gedefinieerd.has(tint)) continue
        if (!mist.has(tint)) mist.set(tint, new Set())
        mist.get(tint)!.add(path.relative(SRC, bestand))
      }
    }
    expect(
      [...mist].map(([t, waar]) => `${t} (${[...waar].join(', ')})`),
      'deze tinten worden gebruikt maar bestaan niet',
    ).toEqual([])
  })

  /**
   * En de tinten lopen op. Een reeks waarin 600 lichter is dan 500 is geen
   * reeks meer, en dan kiest iemand de verkeerde trede zonder het te zien.
   */
  it('houdt elke reeks van licht naar donker', () => {
    const lum = (hex: string): number => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      const f = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
      return 0.2126 * f(r!) + 0.7152 * f(g!) + 0.0722 * f(b!)
    }
    const perReeks = new Map<string, [number, number][]>()
    for (const m of css.matchAll(/--color-([a-z]+)-(\d+):\s*(#[0-9a-f]{6})/gi)) {
      if (!EIGEN.includes(m[1]!)) continue
      if (!perReeks.has(m[1]!)) perReeks.set(m[1]!, [])
      perReeks.get(m[1]!)!.push([Number(m[2]), lum(m[3]!)])
    }
    for (const [naam, treden] of perReeks) {
      const op = [...treden].sort((a, b) => a[0] - b[0])
      for (let i = 1; i < op.length; i++) {
        expect(op[i]![1], `${naam}-${op[i]![0]} is lichter dan ${naam}-${op[i - 1]![0]}`)
          .toBeLessThan(op[i - 1]![1])
      }
    }
  })
})

describe('wat er leesbaar moet blijven', () => {
  const tint = (naam: string): string =>
    css.match(new RegExp(`--color-${naam}:\\s*(#[0-9a-f]{6})`, 'i'))?.[1] ?? ''

  const verhouding = (a: string, b: string): number => {
    const lum = (hex: string) => {
      const [r, g, bl] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      const f = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
      return 0.2126 * f(r!) + 0.7152 * f(g!) + 0.0722 * f(bl!)
    }
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
    return (x! + 0.05) / (y! + 0.05)
  }

  const WIT = '#ffffff'

  /**
   * `zellige-600` is de kleur van de transcriptie: "salam" onder het Arabisch,
   * op driehonderdvier regels in het woordenboek alleen al. Dat is gewone
   * tekst, dus 4,5 op 1.
   */
  it('houdt de transcriptie leesbaar op een witte kaart', () => {
    expect(verhouding(tint('zellige-600'), WIT)).toBeGreaterThanOrEqual(4.5)
  })

  /** Wit erop telt ook: het niveaubadje op de profielpagina staat zo. */
  it('houdt wit leesbaar op datzelfde groen', () => {
    expect(verhouding(WIT, tint('zellige-600'))).toBeGreaterThanOrEqual(4.5)
  })

  it('houdt het wit op de wisknop leesbaar', () => {
    expect(verhouding(WIT, tint('terra-600'))).toBeGreaterThanOrEqual(4.5)
  })
})
