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
   * En het breekt het bouwen wél af.
   *
   * Hier stond het omgekeerde, met het argument dat je soms met voordacht een
   * oudere stand bouwt. Dat argument klopt, maar het weegt niet op tegen wat
   * er twee keer bijna gebeurd is:
   *
   *   20 oktober  de aab kwam uit commit 0dcfba2, 41 commits achter
   *   22 oktober  build 11 voor iOS kwam uit 0b729a7, 96 commits achter — de
   *               app van 3 oktober, met 1.5 op het etiket
   *
   * Allebei keren stond de waarschuwing er gewoon. De volgorde is het
   * probleem: na deze melding schrijft de beller het versie- en buildnummer
   * weg en meldt `versie → 1.5` en `build → 11`. Dat zijn de laatste twee
   * regels op het scherm en die lezen als "gelukt".
   *
   * Dus stoppen, en voor dat wegschrijven — dat is het stuk dat niet terug
   * kan. Wie met opzet oud bouwt geeft `--ook-als-oud` mee.
   */
  it('stopt voordat er een nummer op oude code gaat', () => {
    expect(stand).toMatch(/process\.exit\(1\)/)
    expect(stand).toContain('--ook-als-oud')
  })

  /** Maar een machine zonder git of zonder net houdt het bouwen niet tegen. */
  it('overleeft een machine zonder git of zonder net', () => {
    expect(stand.match(/catch/g)?.length).toBeGreaterThanOrEqual(2)
    // Beide vangnetten keren terug in plaats van te stoppen.
    expect(stand).toMatch(/\/\/ Geen git, of geen repository\. Dat mag; het bouwen gaat gewoon door\.\n    return/)
    expect(stand).toMatch(/Niet nagekeken bij origin[^\n]*\n    return/)
  })
})

/**
 * En dezelfde melding nog een keer onderaan, náást het bestand dat eruit kwam.
 *
 * De regel bovenaan scrollt weg achter een paar honderd regels Gradle. Dan sta
 * je naar het eind van de uitvoer te kijken — "Klaar", het pad, het aantal MB
 * — zonder te weten wat erin zit, en precies dat is vier keer misgegaan. Wat
 * je het laatst leest hoort te zeggen wat je in handen hebt.
 */
describe('de korte vorm, voor onderaan', () => {
  it('bestaat en haalt niets op', () => {
    expect(stand).toMatch(/export function standKort\(wortel\)/)
    const lijf = stand.slice(stand.indexOf('export function standKort'), stand.indexOf('export function toonStand'))
    expect(lijf).not.toContain('fetch')
  })

  it('staat bij het bestand dat eruit kwam', () => {
    expect(aab).toMatch(/console\.log\(`  uit \$\{uit\}`\)/)
    expect(aab).toMatch(/versionCode \$\{versie \?\? '\?'\} · versionName/)
  })

  it('en na het aantal MB, want dat is waar je stopt met lezen', () => {
    expect(aab.indexOf('${mb} MB')).toBeLessThan(aab.indexOf('`  uit ${uit}`'))
  })
})

describe('de twee scripts die een bundel maken', () => {
  it('de Android-bundel meldt het', () => {
    expect(aab).toMatch(/import \{ standKort, toonStand \} from '\.\/lib\/stand\.mjs'/)
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
