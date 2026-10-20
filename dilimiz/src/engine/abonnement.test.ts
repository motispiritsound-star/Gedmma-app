// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import {
  belooftNietsOnwaars, HET_PLAN, inProef, koopRegels, legKoopVast, legVerlopenVast,
  platformNu, planVan, PLANNEN, PROEFDAGEN, proefDagenOpScherm, proefRest, winkelNaam,
} from './abonnement'
import { dagenUit, nagebootsteWinkel, type WinkelProduct } from './winkel'
import { haalStaat, _zetTerugVoorTest } from './opslag'
import { MERK, noemtVerbodenNaam } from '../merk/merk'
import { TEKSTEN } from '../i18n'
import { TAALCODES } from '../i18n/talen'

beforeEach(() => {
  localStorage.clear()
  _zetTerugVoorTest()
})

const product = (deel: Partial<WinkelProduct> = {}): WinkelProduct => ({
  product: MERK.abonnement.maand,
  prijs: '€ 5,99',
  heeftProef: false,
  proefDagen: null,
  inBezit: false,
  ...deel,
})

describe('het plan waarmee gelanceerd wordt', () => {
  it('is er één: maandelijks', () => {
    // Elk extra product is een product dat in beide consoles aangemaakt,
    // geprijsd en nagekeken moet worden.
    expect(PLANNEN).toHaveLength(1)
    expect(HET_PLAN.id).toBe('maand')
    expect(planVan()).toBe(HET_PLAN)
  })

  it('kost € 5,99', () => {
    expect(HET_PLAN.lijst).toBe('€ 5,99')
  })

  it('gebruikt het product-id uit merk.ts, zodat er één bron is', () => {
    expect(HET_PLAN.product).toBe(MERK.abonnement.maand)
  })

  it('hergebruikt geen product-id van de andere app', () => {
    expect(noemtVerbodenNaam(HET_PLAN.product)).toBeNull()
  })

  it('zegt in elke taal dat het maandelijks opzegbaar is', () => {
    // Dat is de belofte waarmee gelanceerd wordt, en in Duitsland is het ook
    // wat een koper verwacht te lezen vóór hij op de knop drukt.
    for (const taal of TAALCODES) {
      expect(TEKSTEN[taal].abonnement.maandelijksOpzegbaar.trim(), taal).toBeTruthy()
    }
    expect(TEKSTEN.de.abonnement.maandelijksOpzegbaar).toContain('kündbar')
  })
})

describe('de proefperiode belooft niets onwaars', () => {
  /*
   * De duurste les uit de overdracht van de vorige app: daar stond de
   * proefperiode wekenlang alleen op het maandplan terwijl het scherm hem aan
   * iedereen beloofde. Deze test kan niet zien wat er in de Play Console
   * staat -- hij dwingt af dat het scherm alleen zegt wat de winkel meldt.
   */
  it('zegt niets als de winkel geen proefperiode meldt', () => {
    expect(belooftNietsOnwaars(product({ heeftProef: false }))).toBe(false)
    expect(proefDagenOpScherm(product({ heeftProef: false }))).toBeNull()
  })

  it('zegt niets als er helemaal geen winkelgegevens zijn', () => {
    expect(belooftNietsOnwaars(null)).toBe(false)
    expect(proefDagenOpScherm(null)).toBeNull()
  })

  it('noemt het aantal dagen dat de winkel geeft, en niet het eigen getal', () => {
    expect(proefDagenOpScherm(product({ heeftProef: true, proefDagen: 7 }))).toBe(7)
  })

  it('valt op het eigen getal terug als de winkel geen aantal geeft', () => {
    expect(proefDagenOpScherm(product({ heeftProef: true, proefDagen: null }))).toBe(PROEFDAGEN)
  })

  it('lanceert zonder proefperiode, en past zich aan als die er later op komt', () => {
    // Geen codewijziging nodig: het scherm leest de winkel.
    expect(proefDagenOpScherm(nagebootsteWinkel().product(MERK.abonnement.maand))).toBeNull()
    const metProef = nagebootsteWinkel({ heeftProef: true, proefDagen: 3 })
    expect(proefDagenOpScherm(metProef.product(MERK.abonnement.maand))).toBe(3)
  })
})

describe('de duur uit de winkel lezen', () => {
  it('rekent ISO-8601 om naar dagen', () => {
    expect(dagenUit('P3D')).toBe(3)
    expect(dagenUit('P1W')).toBe(7)
    expect(dagenUit('P1M')).toBe(30)
    expect(dagenUit('P2W')).toBe(14)
  })

  it('geeft null bij iets wat geen duur is', () => {
    // Dan zegt het scherm `PROEFDAGEN` of niets, in plaats van NaN dagen.
    expect(dagenUit(undefined)).toBeNull()
    expect(dagenUit('')).toBeNull()
    expect(dagenUit('drie dagen')).toBeNull()
    expect(dagenUit('P0D')).toBeNull()
  })
})

describe('wat er vóór de koopknop moet staan', () => {
  it('geeft prijs, proefduur, verlenging en opzeggen', () => {
    const regels = koopRegels(HET_PLAN, product({ heeftProef: true, proefDagen: 3 }))
    expect(regels.prijs).toBeTruthy()
    expect(regels.proefDagen).toBe(3)
    expect(regels.verlengtAutomatisch).toBe(true)
    expect(regels.opzeggenUitgelegd).toBe(true)
  })

  it('gebruikt de prijs van de winkel en niet de lijstprijs', () => {
    // De winkelprijs staat in de munt van de koper en inclusief zijn btw. Een
    // Duitse koper ziet € 5,99 met 19% MwSt erin; dat rekent Google uit.
    expect(koopRegels(HET_PLAN, product({ prijs: '5,99 €' })).prijs).toBe('5,99 €')
  })

  it('valt op de lijstprijs terug als er geen winkel te vragen is', () => {
    expect(koopRegels(HET_PLAN, null).prijs).toBe(HET_PLAN.lijst)
  })

  it('heeft in elke taal een tekst voor verlenging en opzeggen', () => {
    for (const taal of TAALCODES) {
      expect(TEKSTEN[taal].abonnement.verlenging.trim(), taal).toBeTruthy()
      expect(TEKSTEN[taal].abonnement.opzeggen.trim(), taal).toBeTruthy()
    }
  })

  it('gebruikt in geen enkele taal een aftelklok of kunstmatige haast', () => {
    for (const taal of TAALCODES) {
      const tekst = JSON.stringify(TEKSTEN[taal].abonnement).toLowerCase()
      for (const woord of ['nog maar', 'laatste kans', 'verloopt over', 'nur noch', 'letzte chance', 'only today', 'hurry', 'dernière chance']) {
        expect(tekst, `${taal}: ${woord}`).not.toContain(woord)
      }
    }
  })
})

describe('de nagebootste winkel', () => {
  it('levert het product met de lanceerprijs', () => {
    const p = nagebootsteWinkel().product(MERK.abonnement.maand)
    expect(p?.prijs).toBe('€ 5,99')
    expect(p?.inBezit).toBe(false)
  })

  it('kent geen ander product dan het onze', () => {
    expect(nagebootsteWinkel().product('app.iets.anders')).toBeNull()
  })

  it('verkoopt, en weet daarna dat er bezit is', async () => {
    const w = nagebootsteWinkel()
    expect(await w.herstel()).toBe(false)
    const uitkomst = await w.koop(MERK.abonnement.maand)
    expect(uitkomst.stand).toBe('gekocht')
    expect(await w.herstel()).toBe(true)
    expect(w.product(MERK.abonnement.maand)?.inBezit).toBe(true)
  })

  it('kan een mislukte koop nabootsen, zonder iets vast te leggen', async () => {
    const w = nagebootsteWinkel({ faalt: true })
    const uitkomst = await w.koop(MERK.abonnement.maand)
    expect(uitkomst.stand).toBe('mislukt')
    expect(await w.herstel()).toBe(false)
  })

  it('kan een winkel nabootsen die er niet is, zoals op het web', async () => {
    const w = nagebootsteWinkel({ beschikbaar: false })
    expect(w.beschikbaar()).toBe(false)
    expect(w.product(MERK.abonnement.maand)).toBeNull()
    expect((await w.koop(MERK.abonnement.maand)).stand).toBe('nietBeschikbaar')
  })
})

describe('de levensloop van een abonnement', () => {
  it('legt een koop met proefperiode vast op het moment van bestellen', () => {
    const nu = 1_700_000_000_000
    legKoopVast('maand', true, nu)
    expect(haalStaat().abonnement).toEqual({ actief: true, sinds: nu, proefGestart: nu, plan: 'maand' })
  })

  it('legt een koop zónder proefperiode vast, zoals bij de lancering', () => {
    legKoopVast('maand', false, 1_700_000_000_000)
    expect(haalStaat().abonnement.proefGestart).toBe(0)
    expect(inProef(1_700_000_000_000)).toBe(false)
  })

  it('rekent de resterende proefdagen af vanaf het bestelmoment', () => {
    const nu = 1_700_000_000_000
    legKoopVast('maand', true, nu)
    expect(proefRest(nu)).toBe(PROEFDAGEN)
    expect(proefRest(nu + 1.5 * 86_400_000)).toBe(2)
    expect(proefRest(nu + 3.5 * 86_400_000)).toBe(0)
  })

  it('zet bij verlopen het abonnement uit maar houdt vast wat er gekocht was', () => {
    const nu = 1_700_000_000_000
    legKoopVast('maand', false, nu)
    legVerlopenVast()
    const a = haalStaat().abonnement
    expect(a.actief).toBe(false)
    expect(a.plan).toBe('maand')
    expect(a.sinds).toBe(nu)
  })
})

describe('het platform', () => {
  it('noemt de winkel waarin gekocht wordt', () => {
    expect(winkelNaam('ios')).toBe('App Store')
    expect(winkelNaam('android')).toBe('Google Play')
    expect(winkelNaam('web')).toBe('')
  })

  it('zegt web als er geen native schil omheen zit', () => {
    // Een iPad die de app in een browser opent is geen App Store-aankoop.
    expect(platformNu()).toBe('web')
  })
})
