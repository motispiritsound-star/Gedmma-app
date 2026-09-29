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
 * Telkens precies 48 erbij, terwijl de achtergrond van de balk op 0 bleef staan
 * en het strookje onder de klok dus gevuld blijft.
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
    expect(bron(pad), `${wat}: geen env(safe-area-inset-top) meer`)
      .toContain('env(safe-area-inset-top)')
  })

  it('houdt de onderkant vrij bij de tabbalk', () => {
    // Deze was er al vóór de rest; hij staat hier zodat hij niet sneuvelt bij
    // een opruimactie in App.tsx.
    expect(bron('../App.tsx')).toContain('env(safe-area-inset-bottom)')
  })
})
