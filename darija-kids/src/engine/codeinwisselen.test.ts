/**
 * "Ik heb een code" — wie wisselt hem in?
 *
 * Niet wij. Codes bijhouden vraagt een server, een eigen administratie en een
 * manier om fraude tegen te houden, en dat is allemaal al twee keer gebouwd:
 * Apple noemt ze *offer codes*, Google *promo codes*. Je maakt ze in de
 * console en de winkel rekent zelf uit of er recht op bestaat.
 *
 * Wat de app wél moet doen is de koper bij het juiste venster brengen, en de
 * twee winkels doen dat verschillend. Dat verschil is precies wat hier wordt
 * vastgezet, want het is onzichtbaar: op een iPhone werkt het, en of het op
 * Android ook werkt merk je pas als een weekendschool belt dat het niet lukt.
 *
 * Waarom dit ertoe doet: zonder deze knop is geen schoolactie en geen
 * influencercampagne te meten. `docs/LANCERING.md` §12 zet hem daarom
 * bovenaan de lijst van wat er in de app moet.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { codeMogelijk, wisselCodeIn } from './billing'

/**
 * De hele bundel draait in node, zonder dom — zie `vite.config.ts`. Daar
 * bestaat `window` niet, en dat is geen tekortkoming: de app leest `window`
 * alleen om te zien of de plugin er is. Dus zetten we er zelf een neer, met
 * precies wat de koopmachine eruit haalt en niets meer.
 */
let geopend: Array<[string, string]> = []

function zetWinkel(opties: { apple?: boolean; winkel?: boolean } = {}) {
  const sheet = vi.fn(() => Promise.resolve())
  const winkel = opties.winkel === false
    ? undefined
    : {
        store: {
          getAdapter: (platform: string) =>
            opties.apple && platform === 'APPLE' ? { presentCodeRedemptionSheet: sheet } : undefined,
        },
        Platform: { APPLE_APPSTORE: 'APPLE', GOOGLE_PLAY: 'GOOGLE' },
      }
  geopend = []
  vi.stubGlobal('window', {
    CdvPurchase: winkel,
    open: (naar: string, hoe: string) => { geopend.push([naar, hoe]) },
  })
  return sheet
}

afterEach(() => {
  vi.unstubAllGlobals()
  geopend = []
})

describe('een code inwisselen', () => {
  it('kan niet op het web, want daar verkoopt de app niets', () => {
    zetWinkel({ winkel: false })
    expect(codeMogelijk()).toBe(false)
    wisselCodeIn('IETS')
    expect(geopend).toEqual([])
  })

  it('kan wel zodra de winkel er is', () => {
    zetWinkel()
    expect(codeMogelijk()).toBe(true)
  })

  /**
   * Apple heeft er een eigen venster voor. Daarin typt de koper zijn code, en
   * de app ziet daarna gewoon een aankoop binnenkomen — dus wat iemand in ons
   * eigen veld zou typen gaat niet mee, en daarom staat dat veld er op iOS
   * ook niet.
   */
  it('laat Apple zijn eigen venster openen, en gaat de app niet uit', () => {
    const sheet = zetWinkel({ apple: true })
    wisselCodeIn()
    expect(sheet).toHaveBeenCalledOnce()
    expect(geopend).toEqual([])
  })

  it('en negeert daar een meegegeven code, want Apple vraagt er zelf om', () => {
    const sheet = zetWinkel({ apple: true })
    wisselCodeIn('SCHOOL-AMSTERDAM')
    expect(sheet).toHaveBeenCalledOnce()
    expect(geopend).toEqual([])
  })

  /** Google heeft dat venster niet; daar gaat het via de Play Store-app. */
  it('stuurt Google naar de Play Store, met de code erin', () => {
    zetWinkel()
    wisselCodeIn('SCHOOL-AMSTERDAM')
    expect(geopend).toEqual([['https://play.google.com/redeem?code=SCHOOL-AMSTERDAM', '_blank']])
  })

  /**
   * Een code uit een appje heeft bijna altijd een spatie ervoor of erachter,
   * en een plakkende spatie in een adres is een code die niet bestaat.
   */
  it('en haalt de spaties eraf die uit een appje meekomen', () => {
    zetWinkel()
    wisselCodeIn('  MOSKEE-GOUDA \n')
    expect(geopend).toEqual([['https://play.google.com/redeem?code=MOSKEE-GOUDA', '_blank']])
  })

  it('en codeert wat in een adres niet mag staan', () => {
    zetWinkel()
    wisselCodeIn('A&B C')
    expect(geopend).toEqual([['https://play.google.com/redeem?code=A%26B%20C', '_blank']])
  })

  /** Zonder code naar de inwisselpagina zelf, niet naar `?code=`. */
  it('opent zonder code de inwisselpagina zonder lege vraag erachter', () => {
    zetWinkel()
    wisselCodeIn('   ')
    expect(geopend).toEqual([['https://play.google.com/redeem', '_blank']])
  })
})
