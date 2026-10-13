/**
 * Wanneer de app om een beoordeling vraagt — en vooral: hoe vaak.
 *
 * Sterren bepalen een groot deel van wie een app installeert, en op dag één
 * zijn het er nul. Vragen moet dus. Maar het is ook het makkelijkst te
 * verpesten onderdeel van de lijst in `docs/LANCERING.md` §12, want een app
 * die blijft vragen krijgt de beoordeling die daarbij hoort.
 *
 * Daarom staat hier vast: niet te vroeg, en precies één keer — ook als het
 * antwoord "liever niet" was. Die laatste is de regel die in de praktijk het
 * eerst sneuvelt, omdat een kruisje dat volgende week terugkomt zo onschuldig
 * lijkt.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  APPLE_ID, beoordelingsAdres, DIPLOMAS_VOOR_VRAAG, magOmBeoordelingVragen,
  onthoudGevraagd, openBeoordeling, PAKKETNAAM,
} from './beoordeling'
import { getState, setState, type State } from './store'
import { UNITS } from '../content/curriculum'

/** Een staat met n diploma's erin, zonder de echte opslag aan te raken. */
const metDiplomas = (n: number): State => ({
  ...getState(),
  beoordelingGevraagd: 0,
  diplomas: Object.fromEntries(
    UNITS.slice(0, n).map((u) => [u.id, { unitId: u.id, sterren: 3, op: 1 } as never]),
  ),
})

let geopend: Array<[string, string]> = []

beforeEach(() => {
  geopend = []
  vi.stubGlobal('window', {
    Capacitor: { getPlatform: () => 'ios' },
    open: (naar: string, hoe: string) => { geopend.push([naar, hoe]) },
  })
  setState({ beoordelingGevraagd: 0 })
})

afterEach(() => {
  vi.unstubAllGlobals()
  setState({ beoordelingGevraagd: 0 })
})

describe('wanneer de app om een beoordeling vraagt', () => {
  it('niet bij nul diploma’s, want dan is er niets te zeggen', () => {
    expect(magOmBeoordelingVragen(metDiplomas(0))).toBe(false)
  })

  it('en ook niet bij twee', () => {
    expect(magOmBeoordelingVragen(metDiplomas(DIPLOMAS_VOOR_VRAAG - 1))).toBe(false)
  })

  it('wel bij drie', () => {
    expect(magOmBeoordelingVragen(metDiplomas(DIPLOMAS_VOOR_VRAAG))).toBe(true)
  })

  it('en daarna ook, zolang er niets gevraagd is', () => {
    expect(magOmBeoordelingVragen(metDiplomas(DIPLOMAS_VOOR_VRAAG + 4))).toBe(true)
  })

  /** Op het web verkoopt de app niets en is er geen winkel om heen te gaan. */
  it('nooit op het web', () => {
    vi.stubGlobal('window', { open: () => {} })
    expect(magOmBeoordelingVragen(metDiplomas(9))).toBe(false)
  })
})

describe('en hoe vaak', () => {
  it('precies één keer, ook na het openen van de winkel', () => {
    setState(metDiplomas(DIPLOMAS_VOOR_VRAAG))
    expect(magOmBeoordelingVragen()).toBe(true)
    openBeoordeling()
    expect(magOmBeoordelingVragen()).toBe(false)
  })

  /**
   * De regel die het eerst sneuvelt. "Liever niet" is een antwoord, en een
   * kaart die volgende week terugkomt maakt er een vraag van die je niet kunt
   * weigeren.
   */
  it('en ook precies één keer als het antwoord "liever niet" was', () => {
    setState(metDiplomas(DIPLOMAS_VOOR_VRAAG))
    onthoudGevraagd()
    expect(magOmBeoordelingVragen()).toBe(false)
    expect(geopend).toEqual([])
  })

  it('en het eerste moment blijft staan, ook bij een tweede poging', () => {
    setState(metDiplomas(DIPLOMAS_VOOR_VRAAG))
    onthoudGevraagd(1000)
    onthoudGevraagd(9999)
    expect(getState().beoordelingGevraagd).toBe(1000)
  })
})

describe('waar de beoordeling geschreven wordt', () => {
  it('bij Apple op het venster dat meteen openklapt', () => {
    expect(beoordelingsAdres('ios')).toBe(`https://apps.apple.com/app/id${APPLE_ID}?action=write-review`)
  })

  /**
   * Google kent zo'n adres niet. Daar is de winkelpagina zelf de plek waar de
   * sterren staan, en doen alsof dat hetzelfde is zou betekenen dat de tekst
   * op de knop op één van de twee niet klopt.
   */
  it('bij Google op de winkelpagina zelf', () => {
    expect(beoordelingsAdres('android')).toBe(`https://play.google.com/store/apps/details?id=${PAKKETNAAM}`)
  })

  it('en de knop gaat daar ook echt heen', () => {
    setState(metDiplomas(DIPLOMAS_VOOR_VRAAG))
    openBeoordeling()
    expect(geopend).toEqual([[beoordelingsAdres('ios'), '_blank']])
  })

  /**
   * Twee plekken met hetzelfde adres is precies hoe adressen uit elkaar gaan
   * lopen. De app leest `src/site` nooit — dat is een aparte bouw — dus staan
   * ze er twee keer, en worden ze hier naast elkaar gelegd.
   */
  it('en loopt niet uit de pas met wat de website gebruikt', () => {
    const links = readFileSync('src/site/links.ts', 'utf8')
    expect(links).toContain(`apps.apple.com/app/id${APPLE_ID}`)
    expect(links).toContain(`details?id=${PAKKETNAAM}`)
    expect(links).toContain(`export const APP_ID = '${PAKKETNAAM}'`)
  })
})
