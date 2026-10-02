/**
 * Zit de app wel echt in de bundel?
 *
 * Twee keer achter elkaar heeft Google de app afgewezen omdat hij niet opende,
 * en beide keren was de bundel zelf leeg. `MainActivity.java` stond niet in de
 * repository — `.gitignore` sloot `android/` uit met een uitzondering op de
 * oude projectnaam — dus elke bouw uit een verse kloon leverde een geldig
 * Android-project zonder app erin. Gradle slaagt, Play keurt goed, en Android
 * sluit af met `ClassNotFoundException` voordat er een letter op het scherm
 * staat.
 *
 * Dezelfde dag bleek er een tweede gat van hetzelfde soort: `cap sync android`
 * vond op Windows één plugin waar de Mac er drie vond, omdat node_modules daar
 * achterliep. Ook stil, ook een bundel die slaagt — alleen trilt de telefoon
 * niet meer en komt de herinnering nooit.
 *
 * Twee controles dus, en ze staan expres op twee momenten: vóór het bouwen
 * (klopt de inschrijving?) en erna (staat de klasse er echt in?). De tweede is
 * de enige die de afwijzing had kunnen tegenhouden.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dexNaam, kwijtInDex, pluginklacht, pluginstand, verwachteKlassen } from '../../scripts/lib/plugins.mjs'

const WORTEL = new URL('../../', import.meta.url).pathname
const lees = (pad: string) => readFileSync(new URL(pad, import.meta.url), 'utf8').replace(/\r\n/g, '\n')

const aab = lees('../../scripts/maak-aab.mjs')
const watzitin = lees('../../scripts/watzitin.mjs')

describe('welke plugins horen erin', () => {
  /**
   * Niet op naam: `@capacitor/core` heet ook `@capacitor/...` en is geen
   * plugin. Het veld `capacitor` in de package.json van het pakket zelf is wat
   * `cap sync` gebruikt, dus dat gebruiken wij ook.
   */
  it('herkent een plugin aan het veld waar cap sync op afgaat', () => {
    const { verwacht } = pluginstand(WORTEL, 'android')
    expect(verwacht).toContain('@capacitor/app')
    expect(verwacht).toContain('@capacitor/haptics')
    expect(verwacht).toContain('@capacitor/local-notifications')
    expect(verwacht).not.toContain('@capacitor/core')
  })

  it('en in deze werkmap zitten ze er allemaal in', () => {
    const { ontbreekt, nietGeinstalleerd } = pluginstand(WORTEL, 'android')
    expect(ontbreekt).toEqual([])
    expect(nietGeinstalleerd).toEqual([])
    expect(pluginklacht(WORTEL, 'android')).toBeNull()
  })
})

describe('welke klassen horen erin', () => {
  it('de app zelf, uit de naamruimte en het manifest samen', () => {
    const klassen = verwachteKlassen(WORTEL)
    const ik = klassen.find((k) => k.wat === 'de app zelf')
    expect(ik?.klasse).toBe('app.darijaforkids.learn.MainActivity')
  })

  it('en elke ingeschreven plugin', () => {
    const klassen = verwachteKlassen(WORTEL).map((k) => k.wat)
    expect(klassen).toContain('@capacitor/haptics')
    expect(klassen).toContain('@capacitor/local-notifications')
  })

  /** In een dex staat `app.x.Y` als `Lapp/x/Y;`. Letterlijk, als tekst. */
  it('zoekt op de vorm waarin een dex de naam opschrijft', () => {
    expect(dexNaam('app.darijaforkids.learn.MainActivity')).toBe('Lapp/darijaforkids/learn/MainActivity;')
  })

  it('en vindt wat er niet in staat', () => {
    const klassen = verwachteKlassen(WORTEL)
    const zonderDeApp = Buffer.from(
      klassen
        .slice(1)
        .map((k) => dexNaam(k.klasse))
        .join('\u0000'),
    )
    const kwijt = kwijtInDex(zonderDeApp, klassen)
    expect(kwijt).toHaveLength(1)
    expect(kwijt[0].wat).toBe('de app zelf')

    const alles = Buffer.from(klassen.map((k) => dexNaam(k.klasse)).join('\u0000'))
    expect(kwijtInDex(alles, klassen)).toEqual([])
  })
})

describe('de controle vóór het bouwen', () => {
  it('staat in het bouwscript', () => {
    expect(aab).toContain("import { pluginklacht } from './lib/plugins.mjs'")
    expect(aab).toMatch(/const klacht = pluginklacht\(ROOT, 'android'\)/)
  })

  /**
   * Vóór Gradle, niet erna — anders wacht je eerst een paar minuten voor niets.
   *
   * De ondergrens erbij: `indexOf` geeft −1 als het er niet staat, en −1 is
   * altijd kleiner dan wat dan ook. Zonder die regel slaagt deze test ook als
   * de controle helemaal weg is.
   */
  it('en wel vóór Gradle begint', () => {
    const controle = aab.indexOf('pluginklacht(ROOT')
    const gradle = aab.indexOf('execFileSync(programma')
    expect(controle).toBeGreaterThan(0)
    expect(gradle).toBeGreaterThan(0)
    expect(controle).toBeLessThan(gradle)
  })

  it('en breekt af, want een halve bundel is erger dan geen', () => {
    const blok = aab.slice(aab.indexOf('const klacht = pluginklacht'), aab.indexOf('const nieuwsteBron'))
    expect(blok).toContain('process.exit(1)')
  })
})

describe('de controle ná het bouwen', () => {
  it('leest de dex uit de bundel', () => {
    expect(watzitin).toMatch(/classes\\d\*\\\.dex/)
    expect(watzitin).toContain('kwijtInDex(dex, verwacht)')
  })

  it('en weigert een bundel zonder native code', () => {
    const blok = watzitin.slice(watzitin.indexOf('if (kwijt.length) {'))
    expect(blok).toContain('process.exit(1)')
    expect(blok).toContain('ClassNotFoundException')
  })

  /**
   * Een bundel zonder dex is geen bundel van deze app. Dat moet afbreken
   * voordat er iets over het javascript gezegd wordt, want dat zegt niets over
   * of de app opent.
   */
  it('en een bundel zonder enige dex ook', () => {
    expect(watzitin).toContain('Er zit geen enkele classes.dex in deze bundel.')
    const dex = watzitin.indexOf('dexNamen.length')
    const js = watzitin.indexOf('const jsNamen')
    expect(dex).toBeGreaterThan(0)
    expect(js).toBeGreaterThan(0)
    expect(dex).toBeLessThan(js)
  })
})
