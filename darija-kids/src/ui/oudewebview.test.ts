/**
 * Niets in onze eigen bron dat een oudere WebView niet kent.
 *
 * `minSdkVersion` is 24, dus de app mag op Android 7 geïnstalleerd worden, en
 * daar kan een WebView van Chrome 51 op staan. Een functie die pas later
 * bestaat is daar geen half werkende functie maar een harde fout op het moment
 * dat de regel draait — en als die regel in het leerpad staat, is dat meteen
 * bij het openen.
 *
 * `bundelcheck.mjs` bewaakt dit al, en beter dan deze test: hij leest de
 * gebóuwde bundel, dus hij ziet ook wat een afhankelijkheid meebrengt. Maar
 * hij draait pas achter `vite build`, op de bouwmachine. Op 3 oktober stond er
 * daardoor een `.at(-1)` in het leerpad die de hele testronde groen liet en
 * pas opviel toen de bundel voor de winkel gebouwd werd — met een halve bouw
 * ernaast en een dag die anders gepland was.
 *
 * Deze test is de vroege helft van hetzelfde: dezelfde lijst, op onze eigen
 * bron, in elke testronde. Valt hij om, dan is het antwoord niet "zet hem in
 * de lijst" maar: gebruik iets dat er wel is, of zet hem in `src/polyfill.ts`
 * en importeer die als eerste regel van `src/main.tsx`.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, sep } from 'node:path'
import { describe, expect, it } from 'vitest'
import { TE_NIEUW } from '../../scripts/lib/tenieuw.mjs'

/** Alles wat in de app terechtkomt. De site is een eigen bouw. */
function appBestanden(map = 'src'): string[] {
  const uit: string[] = []
  for (const naam of readdirSync(map)) {
    const pad = join(map, naam)
    if (statSync(pad).isDirectory()) {
      if (pad === join('src', 'site')) continue
      uit.push(...appBestanden(pad))
    } else if (/\.tsx?$/.test(naam) && !naam.includes('.test.')) {
      uit.push(pad.split(sep).join('/'))
    }
  }
  return uit
}

/**
 * De polyfill dekt wat er wél in mag. Hij is er nu niet, en dat is goed nieuws:
 * elke regel erin is een stukje javascript dat op elk toestel meegestuurd
 * wordt voor een handvol oude WebViews.
 */
const polyfill = (() => {
  try { return readFileSync('src/polyfill.ts', 'utf8') } catch { return '' }
})()

describe('wat een WebView van Android 7 niet kent', () => {
  it('staat nergens in onze eigen bron', () => {
    /*
      Zonder de toelichtingen, want die noemen deze namen juist.

      De regel die dit allemaal uitlokte staat nu als `.at(-1)` in een
      toelichting in `Learn.tsx`, met de reden erbij waarom hij daar weg moest.
      Een test die op het hele bestand kijkt valt dan om op precies de uitleg
      die hem overbodig maakt — in deze ronde al vier keer gebeurd. Wat
      bewaakt wordt is de code.

      `bundelcheck.mjs` heeft dit niet nodig: die leest de gebouwde bundel, en
      daar staan geen toelichtingen meer in.
    */
    const zonderUitleg = (bron: string) =>
      bron.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

    const gevonden: string[] = []
    for (const pad of appBestanden()) {
      const bron = zonderUitleg(readFileSync(pad, 'utf8'))
      for (const [naam, patroon, chrome] of TE_NIEUW) {
        if (polyfill.includes(naam)) continue
        // De reguliere expressie draagt een `g`, dus zijn `lastIndex` loopt
        // door tussen twee bestanden. Een verse kopie per bestand voorkomt dat
        // de tweede treffer gemist wordt.
        const vers = new RegExp(patroon.source, patroon.flags)
        if (vers.test(bron)) gevonden.push(`${naam} (Chrome ${chrome}) in ${pad}`)
      }
    }
    expect(gevonden.sort()).toEqual([])
  })

  /** En de lijst staat op één plek, zodat die twee lezers niet uit elkaar lopen. */
  it('en de bundelcontrole leest dezelfde lijst', () => {
    const check = readFileSync('scripts/bundelcheck.mjs', 'utf8')
    expect(check).toContain("import { TE_NIEUW } from './lib/tenieuw.mjs'")
    expect(check).not.toContain('const TE_NIEUW = [')
    expect(TE_NIEUW.length).toBeGreaterThanOrEqual(8)
  })
})
