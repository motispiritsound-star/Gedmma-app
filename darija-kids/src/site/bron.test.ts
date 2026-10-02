/**
 * Een testbestand is geen app.
 *
 * `npm run aab` en `npm run track` weigeren allebei een bundel die ouder is
 * dan de code — terecht, want een bundel blijft op zijn uitvoerplek liggen ook
 * als het bouwen daarna mislukt, en dan upload je de app van vorige week
 * zonder dat er iets misgaat wat je kunt zien.
 *
 * Maar die telling liep over heel `src/`, en daar staan ook de tests. Een `git
 * pull` die alleen `track.test.ts` toevoegde liet `npm run track` afbreken met
 * "deze bundel is ouder dan de code", terwijl er aan de app niets veranderd
 * was. Dat is erger dan geen bewaking: een waarschuwing die te vaak loos
 * afgaat leer je wegklikken, en dan mis je de keer dat hij gelijk heeft.
 *
 * Testbestanden worden nooit door de app geïmporteerd en komen dus niet in de
 * bundel. Ze zeggen niets over hoe oud hij is.
 */
import { describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { nieuwsteBron, nieuwsteVan } from '../../scripts/lib/bron.mjs'

/** Een map met twee bestanden erin, elk met een eigen ouderdom. */
function maak(bestanden: Record<string, number>): string {
  const map = mkdtempSync(path.join(tmpdir(), 'bron-'))
  for (const [naam, seconden] of Object.entries(bestanden)) {
    const pad = path.join(map, naam)
    mkdirSync(path.dirname(pad), { recursive: true })
    writeFileSync(pad, '// niets\n')
    utimesSync(pad, seconden, seconden)
  }
  return map
}

const OUD = 1_700_000_000
const NIEUW = 1_800_000_000

describe('hoe oud is de code', () => {
  it('neemt de nieuwste van alles wat meetelt', () => {
    const map = maak({ 'a.ts': OUD, 'b.ts': NIEUW })
    expect(nieuwsteBron(map)).toBe(NIEUW * 1000)
  })

  /** Het punt van deze hele reparatie. */
  it('en telt een testbestand niet mee, hoe nieuw ook', () => {
    const map = maak({ 'a.ts': OUD, 'a.test.ts': NIEUW })
    expect(nieuwsteBron(map)).toBe(OUD * 1000)
  })

  it('in welke vorm dan ook', () => {
    for (const naam of ['x.test.ts', 'x.test.tsx', 'x.test.js', 'x.test.mjs', 'x.test.cjs']) {
      const map = maak({ 'a.ts': OUD, [naam]: NIEUW })
      expect(nieuwsteBron(map), naam).toBe(OUD * 1000)
    }
  })

  /** Maar een bestand met "test" in de naam dat géén test is, telt wel mee. */
  it('en laat zich niet foppen door een naam die er alleen op lijkt', () => {
    const map = maak({ 'a.ts': OUD, 'testen.ts': NIEUW })
    expect(nieuwsteBron(map)).toBe(NIEUW * 1000)
  })

  it('kijkt ook in onderliggende mappen', () => {
    const map = maak({ 'a.ts': OUD, 'diep/in/b.ts': NIEUW })
    expect(nieuwsteBron(map)).toBe(NIEUW * 1000)
  })

  it('slaat node_modules en verborgen mappen over', () => {
    const map = maak({ 'a.ts': OUD, 'node_modules/p/b.ts': NIEUW, '.cache/c.ts': NIEUW })
    expect(nieuwsteBron(map)).toBe(OUD * 1000)
  })

  it('en een map die er niet is, is geen fout', () => {
    expect(nieuwsteBron(path.join(tmpdir(), 'bestaat-echt-niet-bron'))).toBe(0)
  })

  it('en over meerdere mappen wint de nieuwste', () => {
    expect(nieuwsteVan(maak({ 'a.ts': OUD }), maak({ 'b.ts': NIEUW }))).toBe(NIEUW * 1000)
    expect(nieuwsteVan()).toBe(0)
  })
})

describe('wie het gebruikt', () => {
  const lees = (pad: string) =>
    // eslint-disable-next-line
    require('node:fs').readFileSync(new URL(pad, import.meta.url), 'utf8').replace(/\r\n/g, '\n')

  it('allebei de scripts, en geen van beide heeft nog een eigen kopie', () => {
    for (const naam of ['../../scripts/maak-aab.mjs', '../../scripts/naartrack.mjs']) {
      const bron = lees(naam)
      expect(bron, naam).toContain("from './lib/bron.mjs'")
      expect(bron, naam).not.toContain('const nieuwsteBron = (map)')
    }
  })
})
