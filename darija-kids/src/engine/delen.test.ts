/**
 * Delen: wanneer de kaart komt, en wat er precies in het bericht staat.
 *
 * `docs/LANCERING.md` §4 noemt WhatsApp "de motor", en §12 vraagt om twee
 * kaarten die hem aanzetten. Het risico van zo'n kaart is niet dat hij niet
 * werkt maar dat hij te vaak komt: een app die bij elk woord vraagt of je het
 * wilt delen, wordt een app die je wegklikt.
 *
 * En het bericht zelf. "Nour kent al 100 woorden Darija" is iets waar een oma
 * blij van wordt; "ik gebruik deze app" is een advertentie die je je familie
 * aandoet. Dat onderscheid is het halve plan, dus staat het hier vast.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  deelAdres, deelNaarWhatsApp, gehaaldeMijlpaal, MIJLPALEN,
  nieuweMijlpaal, onthoudMijlpaal, woordenVast,
} from './delen'
import { getState, setState, type State } from './store'
import { STRINGS } from '../i18n'
import { LANG_CODES } from '../i18n/languages'

/** Een staat met n woorden die echt vastzitten, en m die alleen gezien zijn. */
const metWoorden = (vast: number, gezien = 0): State => {
  const cards: State['cards'] = {}
  for (let i = 0; i < vast; i++) cards[`w${i}`] = { strength: 0.9, due: 0, reps: 3 } as never
  for (let i = 0; i < gezien; i++) cards[`z${i}`] = { strength: 0.2, due: 0, reps: 1 } as never
  return { ...getState(), cards, mijlpaalGedeeld: 0 }
}

let geopend: Array<[string, string]> = []

beforeEach(() => {
  geopend = []
  vi.stubGlobal('window', { open: (naar: string, hoe: string) => { geopend.push([naar, hoe]) } })
  setState({ mijlpaalGedeeld: 0 })
})
afterEach(() => { vi.unstubAllGlobals(); setState({ mijlpaalGedeeld: 0 }) })

describe('wat telt als een woord dat je kent', () => {
  /**
   * Niet "gezien". Een woord dat één keer voorbijkwam is geen woord dat je
   * kent, en een deelbericht dat dat beweert is een bericht waar de ontvanger
   * de app op afrekent.
   */
  it('alleen wat vastzit, niet wat langsgekomen is', () => {
    expect(woordenVast(metWoorden(30, 200))).toBe(30)
  })
})

describe('wanneer de deelkaart komt', () => {
  it('niet bij vierentwintig woorden', () => {
    expect(nieuweMijlpaal(metWoorden(MIJLPALEN[0] - 1))).toBe(0)
  })

  it('wel bij de eerste mijlpaal', () => {
    expect(nieuweMijlpaal(metWoorden(MIJLPALEN[0]))).toBe(MIJLPALEN[0])
  })

  it('en noemt de hoogste die gehaald is, niet de eerste', () => {
    expect(gehaaldeMijlpaal(metWoorden(150))).toBe(100)
    expect(nieuweMijlpaal(metWoorden(150))).toBe(100)
  })

  /** Eén kaart per mijlpaal. Wie wegklikt, krijgt hem niet opnieuw. */
  it('en komt per mijlpaal maar één keer', () => {
    setState(metWoorden(MIJLPALEN[0]))
    expect(nieuweMijlpaal()).toBe(MIJLPALEN[0])
    onthoudMijlpaal(MIJLPALEN[0])
    expect(nieuweMijlpaal()).toBe(0)
  })

  /**
   * Maar bij de vólgende wel weer: tussen vijfentwintig en vijftig woorden
   * zitten weken, en dat is een nieuw feit en geen herhaalde vraag.
   */
  it('maar bij de volgende mijlpaal weer wel', () => {
    setState({ ...metWoorden(MIJLPALEN[1]), mijlpaalGedeeld: MIJLPALEN[0] })
    expect(nieuweMijlpaal()).toBe(MIJLPALEN[1])
  })

  it('en gaat nooit terug als er al een hogere afgehandeld is', () => {
    setState({ ...metWoorden(MIJLPALEN[2]), mijlpaalGedeeld: MIJLPALEN[3] })
    expect(nieuweMijlpaal()).toBe(0)
  })
})

describe('het bericht', () => {
  it('opent WhatsApp zonder nummer, zodat de verzender kiest naar wie', () => {
    deelNaarWhatsApp('hallo')
    expect(geopend).toEqual([['https://wa.me/?text=hallo', '_blank']])
  })

  it('en codeert wat in een adres niet mag', () => {
    expect(deelAdres('100 woorden & meer\n')).toBe('https://wa.me/?text=100%20woorden%20%26%20meer%0A')
  })

  /**
   * In elke taal: het gaat over het kind, de app staat eronder. Niet
   * andersom — zie §2 van het draaiboek, "raakt dit de snaar of leg ik een
   * functie uit".
   */
  it('gaat in elke taal over het kind en noemt het aantal', () => {
    for (const taal of LANG_CODES) {
      const met = STRINGS[taal].delen.bericht('Nour', 100)
      const zonder = STRINGS[taal].delen.berichtZonderNaam(100)
      expect(met, taal).toContain('Nour')
      expect(met, taal).toContain('100')
      expect(zonder, taal).toContain('100')
      expect(zonder, taal).not.toContain('Nour')
      // De naam staat vooraan: de eerste regel gaat over het kind.
      expect(met.indexOf('Nour'), taal).toBeLessThan(met.indexOf('Darijaforkids'))
    }
  })

  it('en stuurt de lezer naar de website, niet naar één van de twee winkels', () => {
    const site = readFileSync('src/site/links.ts', 'utf8')
    expect(site).toContain("SITE_URL = 'https://darijaforkids.eu'")
    for (const taal of LANG_CODES) {
      expect(STRINGS[taal].delen.bericht('Nour', 50), taal).toContain('darijaforkids.eu')
    }
  })
})
