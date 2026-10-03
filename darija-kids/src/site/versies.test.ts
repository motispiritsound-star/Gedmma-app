/**
 * Tot waar staan de versienummers al?
 *
 * Play weigert een versionCode die hij al gezien heeft, ook van een upload die
 * weer is ingetrokken. Dat nummer staat nergens waar je het terugvindt:
 * `android/app/build.gradle` wordt bij elke bouw ter plekke overschreven en
 * gaat niet mee terug de repository in, dus daar staat nog `versionCode 1`.
 * Wie uit een verse kloon bouwt leest dus 1 waar Play er al vijf heeft gehad.
 *
 * Dat is misgegaan: op 1 oktober is `--naam 1.1` geadviseerd terwijl 1.2 al
 * live stond. Daarom gaat `docs/versies.json` wél mee, en schrijft de bouw er
 * zelf in bij.
 */
import { describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import type { Bouw } from '../../scripts/lib/versies.mjs'
import { gebouwd, hoogste, hoogsteNaam, naamVan, schrijfBij } from '../../scripts/lib/versies.mjs'

const WORTEL = new URL('../../', import.meta.url).pathname
const lees = (pad: string) => readFileSync(new URL(pad, import.meta.url), 'utf8').replace(/\r\n/g, '\n')

const aab = lees('../../scripts/maak-aab.mjs')
const watzitin = lees('../../scripts/watzitin.mjs')

describe('het boek zelf', () => {
  it('is te lezen en elke regel is volledig', () => {
    const boek: Bouw[] = gebouwd(WORTEL)
    expect(boek.length).toBeGreaterThan(0)
    for (const r of boek) {
      expect(typeof r.code).toBe('number')
      expect(r.code).toBeGreaterThan(0)
      expect(typeof r.naam).toBe('string')
      expect(r.datum).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('en staat op volgorde, zonder twee keer hetzelfde nummer', () => {
    const codes = gebouwd(WORTEL).map((r) => r.code)
    expect(codes).toEqual([...codes].sort((a, b) => a - b))
    expect(new Set(codes).size).toBe(codes.length)
  })

  /**
   * Het punt van het hele bestand. Wat in de repository staat is 1; wat Play
   * gezien heeft is meer. Zijn die weer gelijk, dan zegt het boek niets meer.
   */
  it('weet meer dan build.gradle', () => {
    const inGradle = Number(lees('../../android/app/build.gradle').match(/versionCode (\d+)/)?.[1])
    expect(hoogste(WORTEL)).toBeGreaterThan(inGradle)
  })

  /**
   * Niet op een vast nummer: dat verandert bij elke bouw, en dan valt deze
   * test om op iets dat juist goed ging. Hij stond op '1.3' en viel om toen
   * versiecode 8 (1.4) erbij kwam. Wat hier telt is dat de naam bij de hoogste
   * code hoort en niet bij een willekeurige regel.
   */
  it('en kent de naam die bij het hoogste nummer hoort', () => {
    const boek = gebouwd(WORTEL)
    const top = boek.reduce((h, r) => (Number(r.code) >= Number(h.code) ? r : h))
    expect(hoogsteNaam(WORTEL)).toBe(top.naam)
    expect(Number(top.code)).toBe(hoogste(WORTEL))
  })

  /**
   * En de naam bij één bepaald nummer. `hoogsteNaam` is bijna altijd hetzelfde
   * antwoord -- behalve als er iets ouders opgestuurd wordt (`--oud`), en dan
   * is "bijna altijd" precies verkeerd.
   */
  it('en de naam bij elk afzonderlijk nummer', () => {
    for (const regel of gebouwd(WORTEL)) {
      expect(naamVan(WORTEL, regel.code), String(regel.code)).toBe(regel.naam)
    }
    expect(naamVan(WORTEL, 9999)).toBeNull()
  })
})

describe('bijschrijven', () => {
  const nieuweMap = () => mkdtempSync(path.join(tmpdir(), 'versies-'))

  it('zet een nieuw nummer erbij', () => {
    const map = nieuweMap()
    schrijfBij(map, 7, '1.4')
    expect(hoogste(map)).toBe(7)
    expect(hoogsteNaam(map)).toBe('1.4')
  })

  /**
   * Hetzelfde nummer twee keer bouwen is geen fout: dat is precies wat je doet
   * als de vorige bundel niet deugde. Dan hoort er één regel te staan, niet
   * twee.
   */
  it('en werkt een bestaand nummer bij in plaats van het te verdubbelen', () => {
    const map = nieuweMap()
    schrijfBij(map, 7, '1.4')
    schrijfBij(map, 7, '1.5')
    const boek: Bouw[] = gebouwd(map)
    expect(boek).toHaveLength(1)
    expect(boek[0].naam).toBe('1.5')
  })

  it('en houdt de volgorde bij, ook als je ze door elkaar bijschrijft', () => {
    const map = nieuweMap()
    schrijfBij(map, 9, '1.6')
    schrijfBij(map, 7, '1.4')
    schrijfBij(map, 8, '1.5')
    expect(gebouwd(map).map((r) => r.code)).toEqual([7, 8, 9])
    expect(hoogste(map)).toBe(9)
  })

  it('en een lege map is geen fout, alleen een leeg boek', () => {
    expect(gebouwd(nieuweMap())).toEqual([])
    expect(hoogste(nieuweMap())).toBe(0)
    expect(hoogsteNaam(nieuweMap())).toBeNull()
  })
})

describe('wie het gebruikt', () => {
  it('de bouw schrijft bij, maar alleen voor een echte bundel', () => {
    expect(aab).toContain("import { hoogste, hoogsteNaam, schrijfBij } from './lib/versies.mjs'")
    expect(aab).toMatch(/if \(!alsApk\) \{[\s\S]*schrijfBij\(ROOT, gebouwdeCode, gebouwdeNaam\)/)
  })

  /** Pas als er iets ligt. Een bouw die op Gradle strandt verbruikt geen nummer. */
  it('en pas nadat de bundel er echt ligt', () => {
    const bij = aab.indexOf('schrijfBij(ROOT')
    const controle = aab.indexOf('if (!existsSync(RESULTAAT))')
    expect(bij).toBeGreaterThan(0)
    expect(controle).toBeGreaterThan(0)
    expect(controle).toBeLessThan(bij)
  })

  /**
   * En het voorstel voor de volgende bouw komt uit het hoogste van de twee:
   * build.gradle weet wat déze machine gebouwd heeft, het boek wat welke
   * machine dan ook gebouwd heeft.
   */
  it('en beide scripts stellen een nummer voor dat echt vrij is', () => {
    expect(aab).toMatch(/Math\.max\(huidig, hoogste\(ROOT\)\)/)
    expect(watzitin).toMatch(/Math\.max\(Number\(bron\.match\(\/versionCode \(\\d\+\)\/\)\?\.\[1\]\) \|\| 0, hoogste\(ROOT\)\)/)
  })

  /** Geen punthaken in een opdracht die iemand plakt. Dat is hier al misgegaan. */
  it('en zonder punthaken, want die worden letterlijk geplakt', () => {
    for (const bron of [aab, watzitin]) {
      for (const regel of bron.split('\n')) {
        if (!regel.includes('npm run aab')) continue
        expect(regel).not.toMatch(/<[a-z.]+>/)
      }
    }
  })
})
