// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import {
  belooftNietsOnwaars, inProef, koopRegels, legKoopVast, legVerlopenVast,
  planVan, PLANNEN, PROEFDAGEN, proefDagenOpScherm, proefRest, winkelNaam,
  type WinkelProduct,
} from './abonnement'
import { haalStaat, _zetTerugVoorTest } from './opslag'
import { MERK, noemtVerbodenNaam } from '../merk/merk'
import { TEKSTEN } from '../i18n'
import { TAALCODES } from '../i18n/talen'

beforeEach(() => {
  localStorage.clear()
  _zetTerugVoorTest()
})

const product = (deel: Partial<WinkelProduct> = {}): WinkelProduct => ({
  product: MERK.abonnement.jaar,
  prijs: '€ 59,99',
  heeftProef: false,
  proefDagen: null,
  ...deel,
})

describe('de plannen', () => {
  it('zijn er twee, jaar en maand, met het jaar vooropgezet', () => {
    expect(PLANNEN.map((p) => p.id)).toEqual(['jaar', 'maand'])
    expect(PLANNEN.filter((p) => p.beste)).toHaveLength(1)
    expect(planVan('jaar').beste).toBe(true)
  })

  it('gebruikt de product-ids uit merk.ts, zodat er één bron is', () => {
    expect(planVan('jaar').product).toBe(MERK.abonnement.jaar)
    expect(planVan('maand').product).toBe(MERK.abonnement.maand)
  })

  it('hergebruikt geen enkel product-id van de andere app', () => {
    for (const p of PLANNEN) expect(noemtVerbodenNaam(p.product), p.product).toBeNull()
  })

  it('is per maand voordeliger bij het jaarplan', () => {
    const getal = (s: string) => Number(s.replace(/[^\d,]/g, '').replace(',', '.'))
    expect(getal(planVan('jaar').perMaand)).toBeLessThan(getal(planVan('maand').perMaand))
  })
})

describe('de proefperiode belooft niets onwaars', () => {
  /*
   * Dit is de duurste les uit de overdracht van de vorige app: daar stond de
   * proefperiode wekenlang alleen op het maandplan terwijl het scherm hem aan
   * iedereen beloofde. Deze test kan niet zien wat er in de Play Console
   * staat -- hij kan wél afdwingen dat het scherm alleen zegt wat de winkel
   * terugmeldt.
   */
  it('zegt niets over een proefperiode als de winkel die niet meldt', () => {
    expect(belooftNietsOnwaars(product({ heeftProef: false }))).toBe(false)
    expect(proefDagenOpScherm(product({ heeftProef: false }))).toBeNull()
  })

  it('zegt niets als er helemaal geen winkelgegevens zijn', () => {
    // Het web, of een winkel die niet antwoordt. Zwijgen is beter dan een
    // belofte die niet nagekomen wordt.
    expect(belooftNietsOnwaars(null)).toBe(false)
    expect(proefDagenOpScherm(null)).toBeNull()
  })

  it('noemt het aantal dagen dat de winkel geeft, en niet het eigen getal', () => {
    expect(proefDagenOpScherm(product({ heeftProef: true, proefDagen: 7 }))).toBe(7)
  })

  it('valt op het eigen getal terug als de winkel geen aantal geeft', () => {
    expect(proefDagenOpScherm(product({ heeftProef: true, proefDagen: null }))).toBe(PROEFDAGEN)
  })
})

describe('wat er vóór de koopknop moet staan', () => {
  it('geeft prijs, proefduur, verlenging en opzeggen', () => {
    // Winkeleis van beide partijen, en het eerlijke minimum.
    const regels = koopRegels(planVan('jaar'), product({ heeftProef: true, proefDagen: 3 }))
    expect(regels.prijs).toBeTruthy()
    expect(regels.proefDagen).toBe(3)
    expect(regels.verlengtAutomatisch).toBe(true)
    expect(regels.opzeggenUitgelegd).toBe(true)
  })

  it('gebruikt de prijs van de winkel en niet de lijstprijs', () => {
    // De winkelprijs staat in de munt van de koper en inclusief zijn btw.
    expect(koopRegels(planVan('jaar'), product({ prijs: '₺ 1.299,00' })).prijs).toBe('₺ 1.299,00')
  })

  it('valt op de lijstprijs terug als er geen winkel te vragen is', () => {
    expect(koopRegels(planVan('maand'), null).prijs).toBe(planVan('maand').lijst)
  })

  it('heeft in elke taal een tekst voor verlenging en opzeggen', () => {
    for (const taal of TAALCODES) {
      expect(TEKSTEN[taal].abonnement.verlenging.trim(), taal).toBeTruthy()
      expect(TEKSTEN[taal].abonnement.opzeggen.trim(), taal).toBeTruthy()
    }
  })

  it('gebruikt in geen enkele taal een aftelklok of kunstmatige haast', () => {
    // Geen dark patterns. Zie docs/privacy-and-safety.md.
    for (const taal of TAALCODES) {
      const tekst = JSON.stringify(TEKSTEN[taal].abonnement).toLowerCase()
      for (const woord of ['nog maar', 'laatste kans', 'verloopt over', 'nur noch', 'letzte chance', 'only today', 'hurry', 'dernière chance']) {
        expect(tekst, `${taal}: ${woord}`).not.toContain(woord)
      }
    }
  })
})

describe('de levensloop van een abonnement', () => {
  it('legt een koop met proefperiode vast op het moment van bestellen', () => {
    /*
     * Niet later uit de winkel af te leiden: zodra de koop rond is laat die de
     * aanbieding bij dat product weg. Zonder dit zou het welkomstscherm ná het
     * betalen tegen iedereen zeggen dat de eerste dagen gratis waren -- ook
     * tegen wie meteen is afgeschreven.
     */
    const nu = 1_700_000_000_000
    legKoopVast('jaar', true, nu)
    expect(haalStaat().abonnement).toEqual({ actief: true, sinds: nu, proefGestart: nu, plan: 'jaar' })
  })

  it('legt een koop zónder proefperiode vast als er geen bij zat', () => {
    legKoopVast('maand', false, 1_700_000_000_000)
    expect(haalStaat().abonnement.proefGestart).toBe(0)
    expect(inProef(1_700_000_000_000)).toBe(false)
  })

  it('rekent de resterende proefdagen af vanaf het bestelmoment', () => {
    const nu = 1_700_000_000_000
    legKoopVast('jaar', true, nu)
    expect(proefRest(nu)).toBe(PROEFDAGEN)
    expect(proefRest(nu + 1.5 * 86_400_000)).toBe(2)
    expect(proefRest(nu + 3.5 * 86_400_000)).toBe(0)
    expect(inProef(nu + 3.5 * 86_400_000)).toBe(false)
  })

  it('zet bij verlopen het abonnement uit maar houdt vast wat er gekocht was', () => {
    const nu = 1_700_000_000_000
    legKoopVast('jaar', true, nu)
    legVerlopenVast()
    const a = haalStaat().abonnement
    expect(a.actief).toBe(false)
    expect(a.plan).toBe('jaar')
    expect(a.sinds).toBe(nu)
  })

  it('noemt de winkel waarin gekocht wordt', () => {
    expect(winkelNaam('ios')).toBe('App Store')
    expect(winkelNaam('android')).toBe('Google Play')
    expect(winkelNaam('web')).toBe('')
  })
})
