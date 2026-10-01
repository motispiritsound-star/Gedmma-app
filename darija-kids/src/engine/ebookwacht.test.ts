/**
 * Het e-boek, de proefperiode, en wat er met opzeggen gebeurt.
 *
 * Het boek is een pdf, en een pdf houd je zodra je hem één keer opent. Bij het
 * jaarabonnement zitten de eerste drie dagen gratis, dus zonder grens kon
 * iemand het jaar afsluiten, het boek opslaan en op dag twee opzeggen: nul
 * betaald, een product van € 14,99 mee.
 *
 * De eerste reparatie was een datum — open vanaf dag vier — en die was niet
 * genoeg. Wie op dag twee opzegde en op dag vier terugkwam, had een datum die
 * voorbij was en kreeg het boek alsnog. Een datum zegt dat er tijd verstreken
 * is, niet dat er betaald is.
 *
 * Daarom staan er twee dingen in de staat: `ebookVanaf` is de toezegging en
 * `ebook` is het boek. De tweede komt er alleen als de eerste voorbij is én
 * het abonnement op dat moment nog loopt.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { ebookKlaar, ebookWachtTot, grantEbook, hasEbook, keurEbook, TRIAL_DAYS } from './billing'
import { getState, setState } from './store'

const DAG = 864e5
const NU = 1_760_000_000_000
const NA_DE_PROEF = NU + TRIAL_DAYS * DAG

/** Zoals de staat eruitziet vlak na het afsluiten van het jaarabonnement. */
const jaarAfgesloten = () =>
  setState({ unlocked: true, unlockedAt: NU, ebook: false, ebookVanaf: NA_DE_PROEF })

beforeEach(() => setState({ ebook: false, ebookVanaf: null, unlocked: false, unlockedAt: null }))

describe('het e-boek bij het jaarabonnement', () => {
  it('blijft dicht zolang de gratis dagen lopen', () => {
    jaarAfgesloten()
    keurEbook(NU)
    expect(ebookKlaar(getState())).toBe(false)
    expect(ebookWachtTot(getState(), NU)).toBe(NA_DE_PROEF)

    keurEbook(NA_DE_PROEF - 1)
    expect(ebookKlaar(getState())).toBe(false)
  })

  it('gaat open op dag vier, als het abonnement dan nog loopt', () => {
    jaarAfgesloten()
    keurEbook(NA_DE_PROEF)
    expect(ebookKlaar(getState())).toBe(true)
    expect(ebookWachtTot(getState(), NA_DE_PROEF)).toBe(null)
  })

  /**
   * Dit is het gat waar het allemaal om begonnen is.
   *
   * Opzeggen tijdens de proef zet `unlocked` uit — de winkel zegt dan dat er
   * niets meer loopt. De dag is dan wel voorbij, en precies daarom mag de dag
   * alleen niet genoeg zijn.
   */
  it('gaat niet open als er tijdens de proef is opgezegd', () => {
    jaarAfgesloten()
    setState({ unlocked: false, unlockedAt: null })   // opgezegd op dag twee
    keurEbook(NA_DE_PROEF)
    expect(ebookKlaar(getState())).toBe(false)
    keurEbook(NU + 400 * DAG)
    expect(ebookKlaar(getState()), 'ook een jaar later niet').toBe(false)
  })

  /**
   * En wie zich bedenkt en alsnog betaalt, krijgt het gewoon.
   *
   * De toezegging blijft staan; er is niets dat opnieuw gezet hoeft te worden.
   */
  it('gaat alsnog open als iemand later opnieuw een abonnement neemt', () => {
    jaarAfgesloten()
    setState({ unlocked: false, unlockedAt: null })
    keurEbook(NA_DE_PROEF)
    expect(ebookKlaar(getState())).toBe(false)

    setState({ unlocked: true, unlockedAt: NU + 30 * DAG })
    keurEbook(NU + 30 * DAG)
    expect(ebookKlaar(getState())).toBe(true)
  })
})

describe('het e-boek verder', () => {
  /**
   * Eenmaal vrijgegeven blijft het van de koper, ook als het abonnement
   * afloopt. Dat is wat `boek.vanJou` op het scherm belooft, en het is het
   * enige deel van deze regeling dat nooit terug mag kunnen.
   */
  it('wordt nooit meer afgenomen zodra het open is', () => {
    jaarAfgesloten()
    keurEbook(NA_DE_PROEF)
    setState({ unlocked: false, unlockedAt: null })
    keurEbook(NU + 400 * DAG)
    expect(ebookKlaar(getState())).toBe(true)
    expect(hasEbook()).toBe(true)
  })

  it('is meteen open als het los gekocht is, want daar zit geen proef bij', () => {
    setState({ ebook: true, ebookVanaf: NU })
    expect(ebookKlaar(getState())).toBe(true)
    expect(ebookWachtTot(getState(), NU)).toBe(null)
  })

  /**
   * Een maandklant die overstapt op het jaar betaalt meteen: de winkel geeft
   * geen tweede proefperiode. Hem drie dagen op zijn boek laten wachten zou
   * hem straffen voor het overstappen.
   */
  it('laat een bestaande abonnee niet opnieuw wachten', () => {
    setState({ unlocked: true, unlockedAt: Date.now() - (TRIAL_DAYS + 1) * DAG })
    grantEbook(true)
    expect(ebookKlaar(getState())).toBe(true)
  })

  it('zegt nee tegen wie er niets voor gedaan heeft', () => {
    expect(ebookKlaar(getState())).toBe(false)
    expect(ebookWachtTot(getState(), NU)).toBe(null)
    keurEbook(NU)
    expect(ebookKlaar(getState())).toBe(false)
  })

  /**
   * Zonder abonnement is er ook geen toezegging om te keuren. Dat lijkt
   * vanzelfsprekend tot iemand `ebookVanaf` ergens anders zet.
   */
  it('keurt niets zonder toezegging, hoe lang je ook wacht', () => {
    setState({ unlocked: true, unlockedAt: NU })
    keurEbook(NU + 400 * DAG)
    expect(ebookKlaar(getState())).toBe(false)
  })
})
