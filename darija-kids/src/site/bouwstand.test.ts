/**
 * Het bouwscript zegt zelf uit welke commit het bouwt.
 *
 * Op 2 oktober zijn er vier bundels gebouwd van code van de dag ervoor:
 * Windows stond 94 commits achter, de Mac 65. Daar is bij het bouwen niets
 * van te zien — hetzelfde aantal MB, hetzelfde "BUILD SUCCESSFUL", en het
 * versienummer dat je meegeeft klopt gewoon. Het kwam pas uit doordat er
 * achteraf drie keer naar `git log` is gevraagd.
 *
 * Een bundel met een nieuw versienummer en oude code is het ergste soort
 * fout: hij slaagt, hij is te uploaden, en hij haalt een beoordeling. Pas bij
 * de gebruiker merk je dat er niets in zit.
 *
 * Daarom staat het er nu vóór het bouwt, en kijkt het na bij `origin` — met
 * een `git fetch`, want de lokale `origin/main` is net zo oud als de laatste
 * keer dat er getrokken is, en dat was hier precies het probleem.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const lees = (pad: string) => readFileSync(new URL(pad, import.meta.url), 'utf8').replace(/\r\n/g, '\n')

const stand = lees('../../scripts/lib/stand.mjs')
const aab = lees('../../scripts/maak-aab.mjs')
const plist = lees('../../scripts/ios-plist.mjs')

describe('de melder zelf', () => {
  it('toont de commit waaruit gebouwd wordt', () => {
    expect(stand).toMatch(/log', '-1', '--format=%h {2}%cd {2}%s'/)
    expect(stand).toMatch(/Gebouwd uit: \$\{hier\}/)
  })

  /**
   * Zonder `fetch` vergelijk je met een `origin/main` die net zo oud is als de
   * laatste keer dat er getrokken is. Op de machine waar dit misging stond
   * die op dezelfde commit als HEAD, dus een vergelijking zonder fetch had
   * gezegd dat alles bij was.
   */
  it('haalt eerst op bij origin, anders vergelijkt het met niets', () => {
    expect(stand).toMatch(/git\(\['fetch', 'origin', tak\], wortel\)/)
    expect(stand).toMatch(/rev-list', '--count', `HEAD\.\.origin\/\$\{tak\}`/)
  })

  it('zegt wat je eraan doet', () => {
    expect(stand).toContain('git pull origin ${tak}')
    expect(stand).toContain('git checkout -- android/app/build.gradle')
  })

  /**
   * En het breekt het bouwen niet af. Soms bouw je met voordacht een oudere
   * stand, bijvoorbeeld om een foutmelding na te doen — maar dan heb je het
   * zelf gekozen en staat het zwart op wit.
   */
  it('breekt niet af, en overleeft een machine zonder git of zonder net', () => {
    expect(stand).not.toMatch(/process\.exit/)
    expect(stand.match(/catch/g)?.length).toBeGreaterThanOrEqual(2)
  })
})

describe('de twee scripts die een bundel maken', () => {
  it('de Android-bundel meldt het', () => {
    expect(aab).toContain("import { toonStand } from './lib/stand.mjs'")
    expect(aab).toMatch(/^toonStand\(ROOT\)$/m)
  })

  it('de iOS-voorbereiding meldt het', () => {
    expect(plist).toContain("import { toonStand } from './lib/stand.mjs'")
    expect(plist).toMatch(/^toonStand\(ROOT\)$/m)
  })

  /** Vóór het werk, niet erna — anders lees je het pas als de bundel er ligt. */
  it('allebei vóór ze iets schrijven', () => {
    expect(aab.indexOf('toonStand(ROOT)')).toBeLessThan(aab.indexOf('writeFileSync(GRADLE'))
    expect(plist.indexOf('toonStand(ROOT)')).toBeLessThan(plist.indexOf('execFileSync(BUDDY'))
  })
})
