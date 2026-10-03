/**
 * Eén warme schaduw, en één vraag of beweging uit moet.
 *
 * Vijf ontwerpers hebben tegelijk aan vijf oppervlakken van deze app gewerkt,
 * elk in een eigen werkmap, met de opdracht geen gedeelde bestanden te raken.
 * Dat was goed voor het samenvoegen en slecht voor de app: drie van hen
 * bouwden los van elkaar hun eigen warme slagschaduw, met drie verschillende
 * bruinen -- rgba(120,82,36) op het startscherm, rgba(94,62,27) op het
 * leerpad, rgba(122,58,30) op het profiel -- en twee schreven hun eigen halve
 * versie van "staat beweging uit".
 *
 * Geen van die vijf is een fout die je kunt aanwijzen. Je ziet het alleen
 * samen: drie schermen die een kind achter elkaar ziet, met schaduwen die net
 * niet dezelfde zijn, en een startscherm dat `prefers-reduced-motion` negeert
 * terwijl de les het wel leest. Dan hangt de app niet in één wereld.
 *
 * Daarom deze test. Hij kijkt niet of het mooi is maar of het er één keer
 * staat, en hij valt om bij de volgende ontwerper die een eigen bruin kiest.
 * Dat is dan geen reden om de test aan te passen maar om de bestaande waarde
 * te gebruiken -- of om hier uit te leggen waarom er écht twee nodig zijn.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, sep } from 'node:path'
import { describe, expect, it } from 'vitest'

/** Alle app-bestanden; de site is een eigen bouw met een eigen stijlblad. */
function appBestanden(map = 'src'): string[] {
  const uit: string[] = []
  for (const naam of readdirSync(map)) {
    const pad = join(map, naam)
    if (statSync(pad).isDirectory()) {
      if (pad === join('src', 'site') || pad === join('src', 'content')) continue
      uit.push(...appBestanden(pad))
    } else if (/\.tsx?$/.test(naam) && !naam.includes('.test.')) {
      uit.push(pad.split(sep).join('/'))
    }
  }
  return uit
}

const bestanden = appBestanden()
const bron = (pad: string) => readFileSync(pad, 'utf8').replace(/\r\n/g, '\n')
const css = bron('src/index.css')

describe('de warme schaduw', () => {
  /**
   * Eén bruin. `rgba(84, 56, 24)` is het bruin dat er het langst staat en dat
   * `Round.tsx` ook voor de rand van zijn onderbalk gebruikt.
   */
  it('heeft één kleur in de hele app', () => {
    /*
     * Alleen regels die werkelijk een schaduw zetten, en geen toelichting.
     * De drie afgewezen bruinen staan met naam en al in de toelichting bij
     * `--schaduw-hoog` en in `zweef.ts` -- juist zodat de volgende lezer weet
     * waarom er één is. Een test die op het hele bestand kijkt valt dus om op
     * zijn eigen uitleg, en dat is precies de val die hier al drie keer
     * dichtgegooid is.
     */
    const zetEenSchaduw = (regel: string) =>
      /box-shadow|shadow-\[|--schaduw-[a-z]+:|--richel:/.test(regel)
      && !/^\s*(\*|\/\/|\/\*)/.test(regel)

    const bruinen = new Set<string>()
    for (const pad of [...bestanden, 'src/index.css']) {
      for (const regel of bron(pad).split('\n').filter(zetEenSchaduw)) {
        for (const m of regel.matchAll(/rgba?\(\s*(\d{2,3})\s*,?\s*(\d{1,3})\s*,?\s*(\d{1,3})\s*[,)\/]/g)) {
          const [r, g, b] = [Number(m[1]), Number(m[2]), Number(m[3])]
          // Alleen de warme tinten: rood boven groen boven blauw, en niet grijs.
          if (r > g && g > b && r - b > 30) bruinen.add(`${r},${g},${b}`)
        }
      }
    }
    expect([...bruinen].sort()).toEqual(['84,56,24'])
  })

  /** En hij staat als hoogte in het stijlblad, niet als losse klasse per plek. */
  it('staat als twee hoogtes in het stijlblad', () => {
    expect(css).toContain('--schaduw-laag:')
    expect(css).toContain('--schaduw-hoog:')
    // In de donkere stand óók, want daar is zwart op bijna-zwart niets.
    expect(css.match(/--schaduw-hoog:/g)!.length).toBe(3)
  })

  /**
   * En de klasse die een kaart laat zweven wijst naar die variabele in plaats
   * van het getal te herhalen. Zo staat het getal op één plek, en kan dezelfde
   * hoogte ook rechtstreeks in een `box-shadow` of in `--shadow-press`.
   */
  it('en de ZWEEF-klasse wijst ernaar', () => {
    expect(bron('src/ui/zweef.ts')).toContain("export const ZWEEF = 'shadow-[var(--schaduw-hoog)]'")
  })
})

describe('de vraag of beweging uit moet', () => {
  it('wordt op één plek gesteld', () => {
    const eigen = bestanden.filter((p) => bron(p).includes('function useRustig'))
    expect(eigen).toEqual(['src/ui/rustig.ts'])
  })

  /**
   * En nergens anders de halve versie. `settings.motion !== 'full'` leest
   * alleen de knop in de app; wie `prefers-reduced-motion` op zijn toestel
   * aanzet heeft daar een reden voor, en die reden geldt ook op het eerste
   * scherm. Gemeten op het startscherm toen het daar nog zo stond: de deur
   * deed er 297 milliseconde over terwijl er geen beweging had moeten zijn.
   */
  it('en niet nog eens half, ergens anders', () => {
    const half = bestanden.filter((p) =>
      p !== 'src/ui/rustig.ts' && /settings\.motion\) !== 'full'/.test(bron(p)))
    expect(half).toEqual([])
  })
})
