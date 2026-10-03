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
  it('wordt op alle plekken overgeslagen', () => {
    const lees = (pad: string) => readFileSync(new URL(pad, import.meta.url), 'utf8')
    expect(lees('../pages/Unlock.tsx')).toContain('if (poortAl())')
    expect(lees('./Feedback.tsx')).toContain('poortAl()')
    expect(lees('./PostAanmelding.tsx')).toContain('poortAl()')
    // En de wisknop, die er als laatste bij kwam.
    expect(lees('../pages/Settings.tsx')).toContain('poortAl()')
  })
})

/**
 * En hij vergeet het weer zodra de app van het scherm af gaat.
 *
 * Zonder dat betekende "één keer per keer dat de app open is" in de praktijk:
 * één keer, en daarna nooit meer. Een app op een tablet gaat niet dicht, hij
 * gaat weg. De ouder maakt de som, geeft de tablet aan zijn kind, en een uur
 * later staat de poort nog open — en dan is de versoepeling geen versoepeling
 * meer maar een poort die er niet is.
 */
describe('en tussen twee keer openen', () => {
  it('hangt de poort aan het wegvallen van de app', () => {
    const app = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8')
    expect(app).toContain('useEffect(() => opPauze(poortVergeet), [])')
    expect(app).toContain("import { opPauze } from './engine/pauze'")
  })

  /**
   * `pause` en niet `appStateChange`. Dat tweede komt op iOS van
   * `willResignActive` en gaat af bij elk venster van het systeem — een
   * telefoontje, het bedieningspaneel, een melding. Dan zou de poort midden in
   * een handeling terugkomen die al liep.
   */
  it('aan pause, niet aan elk systeemvenster', () => {
    const bron = readFileSync(new URL('../engine/pauze.ts', import.meta.url), 'utf8')
    expect(bron).toContain("addListener('pause'")
    // Het woord staat in de toelichting erboven, dus kijk naar de aanroep en
    // niet naar het bestand: anders valt deze test om op zijn eigen uitleg.
    expect(bron).not.toContain("addListener('appStateChange'")
  })

  /** En meldt zich netjes af, anders blijft hij hangen na een herbouw. */
  it('en meldt zich weer af', async () => {
    const { opPauze } = await import('../engine/pauze')
    // Zonder de plugin — in de browser en in de tests — doet het niets, en
    // geeft het een opzegging die je zonder gevolgen mag aanroepen.
    expect(() => opPauze(() => {})()).not.toThrow()
  })
})
