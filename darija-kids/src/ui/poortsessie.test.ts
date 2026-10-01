/**
 * De ouderpoort vraagt het één keer per keer dat de app open is.
 *
 * Hij kwam bij élke tik terug — drie mailknoppen, het aanmeldformulier, het
 * beheren van het abonnement — en wie de app aan het inrichten is doet die som
 * tien keer op een avond. Een poort die zo vaak komt, is een poort waar men
 * blind langs klikt, en dan bewaakt hij niets meer.
 *
 * Wat hier vastligt is de grens van die versoepeling: één keer per start, en
 * niets ervan op de schijf. Richtlijn 1.3 van de Kinderen-categorie vraagt een
 * poort vóór een aankoop en vóór een link naar buiten — niet dat die poort bij
 * elke tik opnieuw komt. Maar als dit per ongeluk zou blijven staan tussen
 * twee starts door, is het geen versoepeling meer maar een poort die weg is.
 */
import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it } from 'vitest'
import { poortAl, poortVergeet } from './OuderPoort'

beforeEach(poortVergeet)

describe('de ouderpoort binnen één sessie', () => {
  it('staat bij het opstarten dicht', () => {
    expect(poortAl()).toBe(false)
  })

  /**
   * De som zelf staat in een React-onderdeel en wordt hier niet gedraaid; wat
   * telt is dat het vlaggetje alleen van binnenuit aangaat en van buitenaf
   * niet te zetten is. Er is dus geen `poortZetAan` geëxporteerd, met opzet.
   */
  it('is van buitenaf niet open te zetten', async () => {
    const mod = await import('./OuderPoort')
    expect(Object.keys(mod)).not.toContain('poortZetAan')
    expect(Object.keys(mod)).not.toContain('gehaald')
  })

  it('bewaart niets op de schijf', () => {
    const bron = readFileSync(new URL('./OuderPoort.tsx', import.meta.url), 'utf8')
    expect(bron).not.toContain('localStorage')
    expect(bron).not.toContain('sessionStorage')
    // Het vlaggetje staat in het geheugen van de module, nergens anders.
    expect(bron).toMatch(/^let gehaald = false$/m)
  })

  /**
   * Alle vier de plekken slaan de poort op dezelfde manier over.
   *
   * Eén die het vergeet, is een scherm dat de som wél blijft stellen terwijl
   * de rest hem overslaat — en dat voelt als een storing.
   */
  it('wordt op alle vier de plekken overgeslagen', () => {
    const lees = (pad: string) => readFileSync(new URL(pad, import.meta.url), 'utf8')
    expect(lees('../pages/Unlock.tsx')).toContain('if (poortAl())')
    expect(lees('./Feedback.tsx')).toContain('poortAl()')
    expect(lees('./PostAanmelding.tsx')).toContain('poortAl()')
  })
})
