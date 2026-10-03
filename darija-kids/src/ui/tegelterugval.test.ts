/**
 * Het zellige-raster moet ook iets tekenen op een WebView van Android 7.
 *
 * `.zellige` is de laag die de app Marokkaans laat aanvoelen vóór de eerste
 * les: een strook erboven op het startscherm, de vloer onder het leerpad, het
 * watermerk op een unitkop. Hij tekende met `color-mix(in oklab, ...)` en met
 * de dubbele kleurstop (`<kleur> 0 2px`), en een WebView van Android 7 kent
 * geen van beide. Een waarde die zo'n browser niet begrijpt gooit de hele
 * `background-image` weg — dus daar stond niets. Geen patroon, geen terugval,
 * en niets wat erop wijst dat er iets mist: op het scherm van wie het bouwt
 * klopt alles.
 *
 * De bouw mikt op es2015 juist voor dat toestel, dus dat is geen theorie.
 *
 * Nu staan er twee regels: dezelfde tekening in oude taal, en daarna die in
 * nieuwe. Wie de tweede begrijpt gebruikt die, en wie hem niet begrijpt houdt
 * de eerste over. Deze test houdt die twee bij elkaar — een terugval die naar
 * een andere kleur wijst dan het origineel is erger dan geen terugval, want
 * dan is het verschil alleen op dat ene toestel te zien.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8').replace(/\r\n/g, '\n')
const regel = css.slice(css.indexOf('.zellige {'), css.indexOf('}', css.indexOf('.zellige {')))

/** #14b8a6 -> "20, 184, 166" */
const alsRgb = (hex: string): string =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ')

const waarde = (naam: string): string => {
  const m = css.match(new RegExp(`--color-${naam}:\\s*(#[0-9a-f]{6})`, 'i'))
  expect(m, `--color-${naam} staat niet in index.css`).toBeTruthy()
  return m![1]!
}

describe('de terugval van het zellige-raster', () => {
  it('zet de oude schrijfwijze eerst en de nieuwe daarna', () => {
    const oud = regel.indexOf('rgba(')
    const nieuw = regel.indexOf('color-mix(')
    expect(oud, 'geen rgba-terugval').toBeGreaterThan(-1)
    expect(nieuw, 'geen color-mix').toBeGreaterThan(-1)
    // Wie de tweede begrijpt gebruikt die; wie hem niet begrijpt houdt de
    // eerste over. Omgekeerd zou de moderne browser de oude krijgen.
    expect(oud).toBeLessThan(nieuw)
  })

  /**
   * En de terugval gebruikt geen enkele schrijfwijze die het toestel waarvoor
   * hij bedoeld is niet kent: geen `color-mix`, en elke kleurstop apart in
   * plaats van `<kleur> 0 2px` (die dubbele stop komt uit Images 4 en kan pas
   * vanaf Chrome 72).
   */
  it('en die terugval is in taal van vóór 2016', () => {
    const terugval = regel.slice(0, regel.indexOf('color-mix('))
    expect(terugval).not.toContain('color-mix')
    expect(terugval).not.toContain('var(--color-')
    expect(terugval).not.toMatch(/\)\s+0\s+2px/)
  })

  it('en wijst naar dezelfde twee kleuren als het origineel', () => {
    for (const [naam, deel] of [['zellige-500', '0.22'], ['saffron-500', '0.16']] as const) {
      const rgb = alsRgb(waarde(naam))
      expect(regel, `${naam} (${rgb}) staat niet in de terugval`).toContain(`rgba(${rgb}, ${deel})`)
      // En de nieuwe regel noemt diezelfde variabele, dus de twee gaan over
      // hetzelfde.
      expect(regel).toContain(`var(--color-${naam}) ${Math.round(Number(deel) * 100)}%`)
    }
  })
})
