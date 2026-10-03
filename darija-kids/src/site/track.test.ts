/**
 * Een release die niet is ingestuurd staat stil.
 *
 * `npm run track` zette de bundel op de gesloten test en legde de wijziging
 * vast met `changesNotSentForReview=true`. Daar stond een redenering onder die
 * geloofwaardig was en niet klopte: het rapport vóór lancering zou van de
 * geüploade bundel komen en geen beoordeling nodig hebben, dus niet insturen
 * was juist de bedoeling — eerst lezen, dan insturen.
 *
 * Versiecode 5 en 7 zijn allebei zo geüpload. Bij allebei bleef het scherm
 * zeggen "Upload artifacts to generate pre-launch reports", en in de console
 * staat bij de release waarom:
 *
 *     1.3 — Not yet sent for review. 1 version code
 *
 * Google doet niets met zo'n release. De testers krijgen hem niet en er valt
 * niets te rapporteren. Twee bundels lang is er gewacht op een rapport dat
 * niet kon komen.
 *
 * Insturen blijft met opzet een keuze — het is een handeling naar buiten. Maar
 * wie hem niet maakt hoort te lezen dat de release stilstaat, niet de belofte
 * van een rapport.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const track = readFileSync(new URL('../../scripts/naartrack.mjs', import.meta.url), 'utf8').replace(/\r\n/g, '\n')

describe('insturen', () => {
  it('kan, met een vlag', () => {
    expect(track).toContain("const INSTUREN = process.argv.includes('--insturen')")
    expect(track).toMatch(/if \(INSTUREN\) \{\s*await leggenVast\(''\)/)
  })

  it('en blijft uit als je er niet om vraagt', () => {
    expect(track).toContain("await leggenVast('?changesNotSentForReview=true')")
    expect(track).toMatch(/let ingestuurd = INSTUREN/)
  })

  /** Het punt van deze hele reparatie. */
  it('en zonder insturen zegt het script dat de release stilstaat', () => {
    expect(track).toContain('LET OP: hij staat stil.')
    expect(track).toContain('Not yet sent for')
    expect(track).toContain('npm run track -- --insturen')
  })

  /**
   * En belooft dan géén rapport. Dat was de hele fout: de uitvoer zei dat
   * Google "nu vanzelf" begint, terwijl er niets gebeurde.
   */
  it('en belooft dan geen rapport', () => {
    const stil = track.slice(track.indexOf('LET OP: hij staat stil.'))
    expect(stil).toContain('géén rapport')
    expect(stil).not.toContain('begint nu vanzelf')
  })

  it('maar wel als hij wel is ingestuurd', () => {
    const wel = track.slice(track.indexOf('if (ingestuurd) {'), track.indexOf('LET OP: hij staat stil.'))
    expect(wel).toContain('Pre-launch report')
    expect(wel).toContain('raakt de winkelvermelding niet')
  })
})

/**
 * De releasenotities moeten bij de upload mee, en dat deden ze niet.
 *
 * Het script zocht de zes teksten op met `bundel.versionName` -- het antwoord
 * van Google op de upload. Dat antwoord draagt alleen `versionCode`, `sha1` en
 * `sha256`, dus de naam was altijd `undefined`, en het script zocht keurig
 * naar `store/wat-is-nieuw-undefined.md`. Dat bestand bestaat niet, dus meldde
 * het doodleuk "deze release krijgt geen notities" en ging door.
 *
 * Zo is versiecode 8 op de testbaan beland zonder één van de zes teksten die
 * er klaarlagen. Op een testbaan is dat cosmetisch; op productie is het de
 * tekst die elke bezoeker van de winkel leest.
 *
 * De naam komt nu uit `docs/versies.json`, waar `maak-aab.mjs` hem bij het
 * bouwen in schrijft.
 */
describe('de naam van de versie', () => {
  it('komt uit het register en niet uit het antwoord van Google', () => {
    expect(track).toContain('naamVan(ROOT, bundel.versionCode)')
    // En nergens meer als enige bron.
    expect(track).not.toContain('nieuwsVoor(ROOT, bundel.versionName')
  })

  /**
   * `naamVan` en niet `hoogsteNaam`: een oudere bundel opsturen mag (`--oud`),
   * en dan is de hoogste naam precies de verkeerde.
   */
  it('en hoort bij dít nummer, niet bij het hoogste', () => {
    expect(track).not.toContain('nieuwsVoor(ROOT, hoogsteNaam(')
  })

  it('en zegt het als hij hem niet vindt', () => {
    expect(track).toContain('geen naam gevonden bij versiecode')
  })
})

describe('de nummers in de opdrachten', () => {
  it('komen uit het versieboek, niet uit build.gradle alleen', () => {
    expect(track).toContain("import { hoogste, hoogsteNaam, naamVan } from './lib/versies.mjs'")
    expect(track).toMatch(/Math\.max\(Number\(bron\.match\(\/versionCode \(\\d\+\)\/\)\?\.\[1\]\) \|\| 0, hoogste\(ROOT\)\)/)
  })

  /** Punthaken worden letterlijk geplakt. Dat is hier al misgegaan. */
  it('en staan er zonder punthaken in', () => {
    for (const regel of track.split('\n')) {
      if (!regel.includes('npm run aab -- ')) continue
      expect(regel).not.toMatch(/<[a-z.]+>/)
    }
  })

  /** Productie blijft met opzet onbereikbaar: dat is een bewuste handeling. */
  it('en productie kan hier nog steeds niet', () => {
    const tracks = track.slice(track.indexOf('const TRACKS'), track.indexOf('const TRACK ='))
    expect(tracks).not.toContain('production')
  })
})
