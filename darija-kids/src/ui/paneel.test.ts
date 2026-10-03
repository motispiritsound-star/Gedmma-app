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

  /**
   * En het vierde ding, later gevonden: wat boven de bovenrand uitkwam was
   * onbereikbaar.
   *
   * Dit omhulsel staat `fixed inset-0` met `items-end`, en de bladzijde eronder
   * staat op `overflow: hidden` zolang er een paneel openstaat -- met goede
   * reden, zie de test hieronder. Maar het paneel zelf had geen maximale hoogte
   * en geen eigen scroll, dus een paneel dat hoger werd dan het scherm groeide
   * de bovenrand uit en daar hielp geen wiel en geen veeg tegen.
   *
   * Gevonden op het startscherm en nagemeten op 320 bij 568 in het Duits: de
   * kop van drie van de vier stappen stond boven de rand (-7, -15, -91), en op
   * stap drie begon het scherm midden in een zin. De knoppen bleven staan, dus
   * de app bleef bedienbaar; wat weg was, is de vraag die de knoppen uitlegt.
   * Op 360 bij 640 -- de klasse toestel waarvoor er op es2015 gebouwd wordt --
   * gold hetzelfde voor stap twee en drie.
   *
   * Het raakt elk paneel: de kopieerknop in Instellingen zet er een veld van
   * 160 pixels in, en een vertaling die langer uitvalt kon elk ander paneel
   * over de rand duwen.
   */
  it('kan scrollen als de inhoud hoger is dan het scherm', () => {
    expect(bron).toContain('max-h-full')
    expect(bron).toContain('overflow-y-auto')
    // En de veeg blijft binnen het paneel, zodat hij niet doorslaat naar wat
    // eronder ligt.
    expect(bron).toContain('overscroll-contain')
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
    expect(bron).toContain('const sluit = useRef(onTerug ?? onClose)')
    expect(bron).toMatch(/\}, \[open\]\)/)
  })
})

describe('het verschil tussen ernaast tikken en terug drukken', () => {
  /**
   * Niet elk paneel mag op dezelfde manier dicht.
   *
   * Het keuzescherm na de taalkeuze komt één keer voorbij in het leven van een
   * installatie. Een kinderduim die naast het paneel landt zou het voorgoed
   * wegnemen, dus de tik ernaast doet daar niets. Escape en de terugknop van
   * Android zijn wél bewuste handelingen, en die doen hetzelfde als de knop
   * "later".
   *
   * Zonder dat onderscheid stond er op dat scherm geen luisteraar op de
   * terugknop, en deed Android zijn standaardding: op een verse installatie is
   * er geen bladzijde om naar terug te gaan, dus dat is de app verlaten — bij
   * het tweede scherm dat een nieuwe gebruiker ooit ziet. Nagemeten in de
   * browser met een nagebootste plugin: ernaast tikken laat het staan, Escape
   * en de terugknop sluiten het.
   */
  it('kent een sluitweg die niet aan het donkere vlak hangt', () => {
    expect(bron).toContain('onTerug?: () => void')
    expect(bron).toContain('const sluit = useRef(onTerug ?? onClose)')
    // Het donkere vlak luistert nog altijd alleen naar `onClose`.
    expect(bron).toContain('sm:items-center sm:p-6" onClick={onClose}')
  })

  it('gebruikt die weg op het keuzescherm na de taalkeuze', () => {
    const aanbod = readFileSync(new URL('./Aanbod.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n')
    expect(aanbod).toContain('<Sheet open onTerug={sluit} labelledBy="aanbod-title">')
    expect(aanbod).not.toContain('onClose={sluit}')
  })
})

describe('de terugknop middenin een les', () => {
  /**
   * Een veeg vanaf de rand liep de les gewoon uit: geen vraag, geen weg terug
   * naar waar je was. Het kruisje rechtsboven vraagt het wél, en dat is niet
   * voor niets — halverwege weglopen is het enige wat in deze app iets kost.
   *
   * Nagemeten met een nagebootste plugin: in de les één luisteraar; terug →
   * "Stoppen met deze les?" en twee luisteraars; terug → de vraag weg en weer
   * één; terug → de vraag weer terug. De les zelf blijft staan.
   */
  it('stelt dezelfde vraag als het kruisje', () => {
    const ronde = readFileSync(new URL('./Round.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n')
    expect(ronde).toContain("import { opTerug } from '../engine/terug'")
    expect(ronde).toContain('useEffect(() => opTerug(() => { if (!vraagStaat.current) { sfx.back(); setQuit(true) } }), [])')
  })

  /**
   * De ref is geen omweg maar de hele truc: zonder hem houdt de luisteraar de
   * `quit` van de eerste tekening vast, en dan opent een tweede terugdruk de
   * vraag opnieuw terwijl `Sheet` hem net sluit.
   */
  it('leest de stand van de vraag uit een ref, niet uit de sluiting', () => {
    const ronde = readFileSync(new URL('./Round.tsx', import.meta.url), 'utf8')
    expect(ronde).toContain('const vraagStaat = useRef(false)')
    expect(ronde).toContain('vraagStaat.current = quit')
  })
})
