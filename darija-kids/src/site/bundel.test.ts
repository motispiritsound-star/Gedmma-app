/**
 * Draait de app op de WebView die `minSdkVersion` belooft?
 *
 * `android/variables.gradle` zet `minSdkVersion = 24`: de app mág op Android 7
 * geïnstalleerd worden. Wat er daarna gebeurt hangt niet van Android af maar
 * van de WebView, en die wordt los bijgewerkt. Op een toestel waar dat nooit
 * gebeurd is, is hij stokoud.
 *
 * Het bouwdoel stond op `es2022`. Daarmee zaten `?.`, `??` en `??=` in de
 * bundel — syntaxis van Chrome 80 tot 85 — en een WebView die ouder is leest
 * het bestand niet eens in. Geen foutmelding, geen halve app, niets. Dat is
 * letterlijk wat Google's Broken Functionality-beleid beschrijft als "apps
 * that install, but don't load".
 *
 * Het doel stond eerst op `es2019`, wat die syntaxis weghaalde. Dat loste het
 * gevonden geval op maar niet de vraag: es2019 is Chrome 69, en dat volgt
 * nergens uit. De drempel die wél ergens uit volgt is minSdkVersion 24 zelf —
 * Android 7 is uitgekomen met WebView Chrome 51, en dat is `es2015`. Daar
 * staat het nu, en het kost zeven kilobyte op elfhonderd. Gemeten, niet
 * geschat.
 *
 * Deze toets kijkt naar de bron en niet naar de bundel, met opzet: `dist/`
 * staat in .gitignore, dus een test die daaruit leest faalt in CI met ENOENT.
 * De bundel zelf wordt nagekeken door `scripts/bundelcheck.mjs`, die aan de
 * bouw hangt.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const bron = (pad: string) => readFileSync(new URL(pad, import.meta.url), 'utf8')

describe('waar de app op moet kunnen draaien', () => {
  it('bouwt naar een doel dat bij minSdkVersion past', () => {
    const vite = bron('../../vite.config.ts')
    const doel = /target: '(es\d{4})'/.exec(vite)?.[1]
    expect(doel, 'er staat geen build target meer in vite.config.ts').toBeTruthy()
    // De drempel komt uit variables.gradle en niet uit een voorkeur:
    // minSdkVersion 24 is Android 7, uitgekomen met WebView Chrome 51, en dat
    // is es2015. Stond dit op es2019, dan gokte je erop dat de WebView op dat
    // toestel ooit is bijgewerkt -- en precies die gok is hier misgegaan.
    expect(Number(doel!.slice(2)), `target staat op ${doel}; minSdkVersion 24 is Chrome 51, oftewel es2015`)
      .toBeLessThanOrEqual(2015)
  })

  it('laat de bouw omvallen op een functie die een oudere WebView mist', () => {
    const pkg = JSON.parse(bron('../../package.json')) as { scripts: Record<string, string> }
    expect(pkg.scripts.build, 'bundelcheck hangt niet meer aan de bouw').toContain('bundelcheck.mjs')

    const check = bron('../../scripts/bundelcheck.mjs')
    expect(check, 'een fout laat de bouw niet meer omvallen').toContain('process.exit(1)')

    /*
      De lijst zelf staat sinds 3 oktober in `scripts/lib/tenieuw.mjs`, want er
      zijn twee lezers: deze controle leest de gebóuwde bundel (en ziet dus ook
      wat een afhankelijkheid meebrengt) en `oudewebview.test.ts` leest onze
      eigen bron in elke testronde. Die tweede is er omdat deze pas achter
      `vite build` draait: er stond een `.at(-1)` in het leerpad die de hele
      testronde groen liet en pas opviel toen de winkelbundel gebouwd werd.
    */
    const lijst = bron('../../scripts/lib/tenieuw.mjs')
    expect(check, 'de controle leest de lijst niet meer').toContain("from './lib/tenieuw.mjs'")
    expect(lijst, 'de lijst met te nieuwe functies is weg').toContain('export const TE_NIEUW')

    // En de woordgrens: zonder die kijkt hij ook naar Object.hasOwnProperty,
    // een functie die er altijd al was. Daar ben ik in getrapt — ik concludeerde
    // dat framer-motion Chrome 93 eiste en schreef er een polyfill voor die
    // niets repareerde.
    expect(lijst, 'de grens achter Object.hasOwn is weg').toContain('Object\\.hasOwn(?![A-Za-z])')
  })
})
