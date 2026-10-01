/**
 * Waar de app begint, en waar de website begint.
 *
 * Dat is niet dezelfde plek, en dat was het wel. `/` toonde overal de
 * landingsbladzijde: zeventien units op een rij, waarom je kind het onthoudt,
 * wat het kost. Op darijaforkids.eu is dat precies goed — daar staat iemand
 * die de app nog niet heeft.
 *
 * In de app was het zes schermen scrollen voordat een kind bij zijn les was,
 * elke keer dat het de app opende, om iets te lezen waarvan het antwoord al ja
 * was: hij staat er immers al op.
 *
 * Nagemeten in Chromium: op het web komt `/` uit op de landingsbladzijde, met
 * `Capacitor.getPlatform()` op ios of android komt hij uit op `/leren`.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const app = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n')

describe('het startscherm', () => {
  it('stuurt de app naar het leerpad en laat de website zijn landingsbladzijde', () => {
    expect(app).toContain("platform() === 'web' ? <Landing /> : <Navigate to=\"/leren\" replace />")
  })

  /**
   * `replace` en niet een gewone navigatie.
   *
   * Zonder dat zet de omleiding een stap in de geschiedenis, en dan valt de
   * terugknop van Android terug op een bladzijde waar de gebruiker nooit is
   * geweest — die hem meteen weer vooruit stuurt. Een knop die niets doet.
   */
  it('vervangt de stap in de geschiedenis in plaats van er een toe te voegen', () => {
    expect(app).toMatch(/<Navigate to="\/leren" replace \/>/)
  })

  /**
   * De landingsbladzijde blijft bestaan, want darijaforkids.eu draait erop.
   * Weghalen zou de website haar startpagina kosten.
   */
  it('houdt de landingsbladzijde in de bouw', () => {
    expect(app).toContain("import { Landing } from './pages/Landing'")
  })
})
