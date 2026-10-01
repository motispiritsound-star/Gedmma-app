/**
 * Het paneel dat over de app heen komt — en de drie dingen die het moest leren.
 *
 * Het was een `role="dialog"` met `aria-modal="true"` erop, en verder niets
 * wat daarbij hoort. Wie met Tab werkte liep er zo weer uit en belandde op
 * knoppen achter het donkere vlak die niemand meer kon zien. Escape deed
 * niets. De terugknop van Android deed iets anders — die ging een bladzijde
 * terug in plaats van het paneel te sluiten, en dat is op Android precies
 * verkeerd om. En de bladzijde eronder schoof mee met een veeg over het vlak,
 * zodat je na het sluiten ergens anders stond dan waar je was.
 *
 * Het raakt zeven panelen tegelijk: de taalkeuze bij de eerste start, de
 * ouderpoort, de tip vóór een les, het keuzescherm, stoppen-met-een-les,
 * de terugkoppeling en het wissen van alle voortgang.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { kanTerugluisteren, opTerug } from '../engine/terug'

const bron = readFileSync(new URL('./kit.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n')

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

/**
 * Een nagebootste Capacitor-plugin, zoals Android hem aanbiedt.
 *
 * De tests draaien zonder bladzijde (`environment: 'node'`), dus `window`
 * bestaat hier niet. Dat is geen kunstgreep maar precies het geval dat de
 * broncode moet overleven: op darijaforkids.eu is er ook geen plugin.
 */
function nepPlugin() {
  const luisteraars = new Set<() => void>()
  vi.stubGlobal('window', {
    Capacitor: {
      Plugins: {
        App: {
          addListener: (naam: string, cb: () => void) => {
            if (naam !== 'backButton') return Promise.resolve({ remove: () => {} })
            luisteraars.add(cb)
            return Promise.resolve({ remove: () => luisteraars.delete(cb) })
          },
        },
      },
    },
  })
  return luisteraars
}

describe('de terugknop van Android', () => {
  it('bestaat niet in een browser, en dat mag niets stukmaken', () => {
    expect(kanTerugluisteren()).toBe(false)
    const stop = opTerug(() => { throw new Error('zou niet mogen draaien') })
    expect(() => stop()).not.toThrow()
  })

  it('roept aan wat je meegaf, en meldt zich daarna weer af', async () => {
    const luisteraars = nepPlugin()
    const gedaan = vi.fn()
    const stop = opTerug(gedaan)
    await Promise.resolve()
    expect(luisteraars.size).toBe(1)

    luisteraars.forEach((f) => f())
    expect(gedaan).toHaveBeenCalledTimes(1)

    stop()
    expect(luisteraars.size).toBe(0)
  })

  /**
   * Afmelden vóórdat de belofte rond is. Zonder deze afhandeling blijft de
   * luisteraar die daarna binnenkomt hangen, en sluit de volgende terugdruk
   * iets wat er niet meer staat.
   */
  it('laat niets hangen als je afmeldt voordat hij er is', async () => {
    const luisteraars = nepPlugin()
    const stop = opTerug(() => {})
    stop()
    await Promise.resolve()
    await Promise.resolve()
    expect(luisteraars.size).toBe(0)
  })
})

describe('wat het paneel zelf moet blijven doen', () => {
  it('haalt de focus naar binnen en zet hem daarna terug', () => {
    expect(bron).toContain('kwamVan.current = document.activeElement')
    expect(bron).toContain('kwamVan.current?.focus?.()')
    expect(bron).toMatch(/\(eerste \?\? paneel\.current\)\?\.focus\(\)/)
  })

  it('laat Tab rondlopen in plaats van eruit lopen', () => {
    expect(bron).toContain("if (e.key !== 'Tab'")
    expect(bron).toContain('laatst.focus()')
    expect(bron).toContain('eerst.focus()')
  })

  /**
   * Alleen als er een weg naar buiten ís. De taalkeuze bij de eerste start
   * heeft die niet -- daar moet eerst een taal gekozen worden -- en dan hoort
   * Escape niets te doen in plaats van een half ingevuld scherm achter te
   * laten.
   */
  it('sluit met Escape, maar alleen als er een sluitknop is', () => {
    expect(bron).toContain("if (e.key === 'Escape')")
    expect(bron).toContain('if (!sluit.current) return')
  })

  it('luistert alleen naar de terugknop als er iets te sluiten valt', () => {
    expect(bron).toContain('const stopTerug = sluit.current ? opTerug(')
    expect(bron).toContain('stopTerug()')
  })

  it('zet de bladzijde eronder stil en geeft hem daarna weer vrij', () => {
    expect(bron).toContain("document.body.style.overflow = 'hidden'")
    expect(bron).toContain('if (openPanelen === 0) document.body.style.overflow = terugNaar')
  })

  /**
   * `onClose` is bij elke gebruiker een pijlfunctie in de JSX, dus een ander
   * ding bij elke tekening. Stond hij in de afhankelijkheden, dan werd alles
   * continu opnieuw opgehangen en sprong de focus telkens terug naar het begin
   * van het paneel — middenin het typen van de rekensom van de ouderpoort.
   */
  it('hangt niet aan `onClose`, want die verandert bij elke tekening', () => {
    expect(bron).toContain('const sluit = useRef(onClose)')
    expect(bron).toMatch(/\}, \[open\]\)/)
  })
})
