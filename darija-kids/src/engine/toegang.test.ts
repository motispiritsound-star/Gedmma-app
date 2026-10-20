/**
 * De levensloop van een abonnement, van kopen tot opzeggen tot terugzetten.
 *
 * `billing.test.ts` legt de losse beslissingen vast -- wat is gratis, welke
 * fase is de echte prijs, wat betekent een ja van de winkel. Dit bestand
 * speelt de volgorde af waarin ze op een echt toestel langskomen, want daar
 * zitten de fouten die je in een losse beslissing niet ziet.
 *
 * De vier die de masterprompt van versie 1.5 noemt en die hier staan:
 * een verse aankoop, een bestaande abonnee, een verlopen abonnement en een
 * aankoop die wordt teruggezet. Plus het e-boek, dat door al die gevallen
 * heen één regel moet volgen: eenmaal van de koper, nooit meer afgenomen.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { ebookKlaar, ebookWachtTot, grantEbook, keurEbook, toegangNa, TRIAL_DAYS } from './billing'
import { getState, resetProgress, setState } from './store'

const DAG = 864e5

/** Een verse installatie: niets gekocht, niets toegezegd. */
const vers = () => {
  resetProgress()
  setState({ unlocked: false, unlockedAt: null, ebook: false, ebookVanaf: null, proefGestart: 0 })
}

/** Wat `syncFromStore` doet met een antwoord van de winkel, zonder de plugin. */
const winkelZegt = (owned: boolean, bonnenBinnen = true) => {
  const wat = toegangNa({ owned, bonnenBinnen })
  if (wat === 'open' && !getState().unlocked) setState({ unlocked: true, unlockedAt: Date.now() })
  else if (wat === 'dicht' && getState().unlocked) setState({ unlocked: false, unlockedAt: null })
  keurEbook()
}

beforeEach(vers)

describe('een verse aankoop', () => {
  it('opent de cursus en zegt het boek toe voor na de proefperiode', () => {
    winkelZegt(true)
    grantEbook(true)

    expect(getState().unlocked).toBe(true)
    expect(ebookKlaar()).toBe(false)
    const wacht = ebookWachtTot()
    expect(wacht).not.toBeNull()
    // Drie dagen vooruit, de proefperiode lang.
    expect(Math.round((wacht! - Date.now()) / DAG)).toBe(TRIAL_DAYS)
  })

  /*
   * Dit was de fout in de eerste versie: wie op dag twee opzegde en op dag
   * vier terugkwam had een datum die voorbij was en kreeg het boek alsnog --
   * nul betaald. De datum is een afspraak, geen sleutel.
   */
  it('geeft het boek niet vrij aan wie tijdens de proefperiode opzegde', () => {
    winkelZegt(true)
    grantEbook(true)
    const vanaf = getState().ebookVanaf!

    // Dag twee: de winkel zegt dat het abonnement weg is.
    winkelZegt(false)
    expect(getState().unlocked).toBe(false)

    // Dag vier: de dag is er, maar er is niets betaald.
    keurEbook(vanaf + DAG)
    expect(ebookKlaar(), 'het boek hoort dicht te blijven').toBe(false)
  })

  it('geeft het boek wel vrij als de dag er is en het abonnement loopt', () => {
    winkelZegt(true)
    grantEbook(true)
    keurEbook(getState().ebookVanaf! + 1)
    expect(ebookKlaar()).toBe(true)
  })
})

describe('een bestaande abonnee', () => {
  /*
   * Wie al langer betaalt dan de proefperiode duurt, wacht nergens op: zijn
   * proef is allang geweest en de winkel geeft er geen tweede. Zonder deze
   * regel zou een trouwe maandklant die op het jaar overstapt drie dagen op
   * zijn boek wachten terwijl hij meteen betaalt.
   */
  it('krijgt het boek meteen als hij al langer betaalt dan de proefperiode', () => {
    setState({ unlocked: true, unlockedAt: Date.now() - (TRIAL_DAYS + 1) * DAG })
    grantEbook(true)
    expect(ebookKlaar()).toBe(true)
  })

  it('houdt zijn toegang als de winkel even niets zegt', () => {
    setState({ unlocked: true, unlockedAt: Date.now() })
    // Geen bonnen binnen: een vlucht zonder bereik mag een betalend gezin
    // niet buitensluiten.
    winkelZegt(false, false)
    expect(getState().unlocked).toBe(true)
  })

  it('en de toezegging schuift niet mee met elke keer opstarten', () => {
    winkelZegt(true)
    grantEbook(true)
    const eerst = getState().ebookVanaf
    grantEbook(true)
    grantEbook(true)
    expect(getState().ebookVanaf, 'anders komt de dag nooit').toBe(eerst)
  })
})

describe('een verlopen abonnement', () => {
  it('sluit de cursus zodra de bonnen zeggen dat er niets meer loopt', () => {
    winkelZegt(true)
    winkelZegt(false)
    expect(getState().unlocked).toBe(false)
  })

  /*
   * Het boek is een losse aankoop die ooit is vrijgegeven, en dat is van de
   * koper. Een abonnement dat afloopt neemt het niet mee.
   */
  it('neemt het boek niet af dat al vrijgegeven was', () => {
    winkelZegt(true)
    grantEbook(true)
    keurEbook(getState().ebookVanaf! + 1)
    expect(ebookKlaar()).toBe(true)

    winkelZegt(false)
    expect(getState().unlocked).toBe(false)
    expect(ebookKlaar(), 'het boek blijft van de koper').toBe(true)
  })
})

describe('een aankoop terugzetten', () => {
  it('opent de cursus weer na een herinstallatie', () => {
    // Verse installatie, en dan zegt de winkel dat er een bon is.
    expect(getState().unlocked).toBe(false)
    winkelZegt(true)
    expect(getState().unlocked).toBe(true)
  })

  /*
   * Een los gekocht boek gaat meteen open: daar hoort geen proefperiode
   * overheen. Dit is ook het pad na een herstel.
   */
  it('geeft een los gekocht boek meteen vrij, zonder te wachten', () => {
    grantEbook(false)
    expect(ebookKlaar()).toBe(true)
    expect(ebookWachtTot()).toBeNull()
  })

  it('zet geen tweede proefperiode aan bij een herstel', () => {
    // `proefGestart` wordt alleen bij het bestellen gezet, niet bij een
    // herstel -- zie `proefBijKoop` in billing.ts.
    winkelZegt(true)
    expect(getState().proefGestart, 'terugzetten is geen nieuwe proefperiode').toBe(0)
  })
})
