/**
 * Blijft de app uit de systeembalken?
 *
 * `android/variables.gradle` zet `targetSdkVersion 36`. Vanaf Android 15 tekent
 * een app die 35 of hoger target standaard tot in de hoeken van het scherm:
 * het toestel geeft de volle hoogte en verwacht dat de app zelf om de klok, het
 * batterijpictogram en de navigatiebalk heen werkt. Doet de app dat niet, dan
 * ligt er inhoud onder die balken.
 *
 * Play Console meldt het als "Edge-to-edge may not display for all users". Het
 * is daar een aanbeveling en geen eis, maar op het scherm van een les is het
 * meer dan dat: daar staat het kruisje om te stoppen tegen de bovenrand, en als
 * dat onder de statusbalk ligt kan een kind de les niet verlaten.
 *
 * Deze toets kijkt naar de bron en niet naar de bundel, met opzet: `dist/` staat
 * in .gitignore, dus een test die daaruit leest faalt in CI met ENOENT.
 *
 * Nagemeten in Chromium op 390x844, met `env(safe-area-inset-top)` vervangen
 * door 48px, tegen dezelfde bouw met 0px:
 *
 *   logo in de balk              4 -> 52
 *   navigatie openingsscherm    24 -> 72
 *   kruisje in een les         326 -> 374
 *
 * En met `env(safe-area-inset-bottom)` op 48px, voor de gebarenbalk:
 *
 *   paneel van onderen        24px -> 72px opvulling, knop 819 -> 771
 *   lesbalk met doorgaan      16px -> 64px opvulling
 *
 * Telkens precies 48 erbij, terwijl de achtergrond op 0 respectievelijk 844
 * bleef staan — de strookjes onder de klok en boven de gebarenbalk blijven dus
 * gevuld, en er valt geen gat.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const bron = (pad: string) => readFileSync(new URL(pad, import.meta.url), 'utf8')

/** Zonder dit vult de WebView de inset met nul en is al het andere zinloos. */
const DEKKING = 'viewport-fit=cover'

describe('de app houdt afstand van de systeembalken', () => {
  it('vraagt het toestel om de volle hoogte', () => {
    expect(bron('../../index.html'), `${DEKKING} is weg; dan blijft env(safe-area-inset-*) nul`)
      .toContain(DEKKING)
  })

  it('target nog steeds een Android die edge-to-edge afdwingt', () => {
    // Zakt dit ooit onder 35, dan is de rest hieronder overbodig geworden en
    // mag hij weg. Zolang het 35 of hoger is, is hij nodig.
    const gradle = bron('../../android/variables.gradle')
    const doel = Number(/targetSdkVersion\s*=\s*(\d+)/.exec(gradle)?.[1])
    expect(doel, 'targetSdkVersion staat niet meer in variables.gradle').toBeGreaterThan(0)
    expect(doel).toBeGreaterThanOrEqual(35)
  })

  /**
   * Elk scherm heeft precies één plek waar de bovenkant wordt getekend, en die
   * plek moet de inset dragen. Ze staan hier bij naam, want een vierde scherm
   * dat erbij komt hoort deze lijst te laten omvallen en niet stilletjes onder
   * de klok te verdwijnen.
   */
  const BOVEN: Array<[string, string]> = [
    ['../ui/TopBar.tsx', 'de kopbalk op bijna elk scherm'],
    ['../pages/Landing.tsx', 'het openingsscherm, dat geen kopbalk heeft'],
    ['../ui/Round.tsx', 'een les, waar het kruisje tegen de bovenrand staat'],
  ]

  it.each(BOVEN)('%s houdt de bovenkant vrij (%s)', (pad, wat) => {
    expect(bron(pad), `${wat}: de ruimte bovenaan is weg`).toContain('var(--rand-boven)')
  })

  /**
   * En de onderkant, want edge-to-edge tekent ook onder de gebarenbalk door.
   *
   * De tabbalk had dit al. De twee andere niet, en die zijn erger: het paneel
   * dat van onderen opkomt draagt de knop van de taalkeuze bij de eerste start
   * en van de tip vóór een les, en de balk in een les draagt de knop naar de
   * volgende vraag. Ligt zo'n knop onder de gebarenbalk, dan loopt het vast.
   */
  const ONDER: Array<[string, string]> = [
    ['../App.tsx', 'de tabbalk'],
    ['./kit.tsx', 'het paneel dat op een telefoon van onderen opkomt'],
    ['./Round.tsx', 'de balk in een les met de knop naar de volgende vraag'],
  ]

  it.each(ONDER)('%s houdt de onderkant vrij (%s)', (pad, wat) => {
    expect(bron(pad), `${wat}: de ruimte onderaan is weg`).toContain('var(--rand-onder)')
  })

  /**
   * De twee variabelen, en de uitzondering die erachter zit.
   *
   * Op iOS staat `contentInset: 'always'` in capacitor.config.ts, en die
   * schuift de inhoud van de WebView al onder de inkeping vandaan. Geeft
   * `env()` daar óók een waarde, dan staat de marge er twee keer. Wat het daar
   * werkelijk doet is niet vast te stellen zonder een echt toestel, dus op iOS
   * staan ze op nul en blijft alles zoals het was. Alleen Android verandert —
   * en dat is precies het platform waar Google erover klaagde.
   */
  it('leest de ruimte van het toestel, behalve op iOS', () => {
    const css = bron('../index.css')
    expect(css, '--rand-boven komt niet meer van env()').toMatch(
      /--rand-boven:\s*env\(safe-area-inset-top\)/,
    )
    expect(css, '--rand-onder komt niet meer van env()').toMatch(
      /--rand-onder:\s*env\(safe-area-inset-bottom\)/,
    )
    const opIos = /:root\[data-stelsel="ios"\]\s*\{[^}]*\}/.exec(css)?.[0] ?? ''
    expect(opIos, 'de uitzondering voor iOS is weg; dan kan de marge daar dubbel staan')
      .toMatch(/--rand-boven:\s*0px/)
    expect(opIos).toMatch(/--rand-onder:\s*0px/)
  })

  it('weet op welk stelsel het draait voordat er iets getekend wordt', () => {
    // Zonder deze regel is data-stelsel leeg, geldt de iOS-uitzondering nooit,
    // en is de hele voorzorg hierboven een dode letter.
    expect(bron('../main.tsx'), 'data-stelsel wordt niet meer gezet')
      .toContain('document.documentElement.dataset.stelsel')
  })
})
