/**
 * Edelstenen werden verdiend en nergens uitgegeven.
 *
 * Vijf missies per dag leveren er eenentwintig op en elke reeks van vijf goede
 * antwoorden nog één. Ze stapelden zich op tot een getal in de kopbalk dat
 * niets deed — en een beloning die nergens voor telt is na een week geen
 * beloning meer.
 *
 * Er lagen twee bestemmingen klaar die allebei nooit werden bereikt:
 *
 * - `refillHearts(kosten)` stond in `store.ts` en werd door niemand
 *   aangeroepen. Het scherm "je hartjes zijn op" had één knop: terug.
 * - `addXp` kende de vriesdag — een gemiste dag breekt de reeks niet als er
 *   een op zak zit — maar nergens ging dat aantal omhoog. Die tak kon dus
 *   nooit uitgevoerd worden.
 *
 * Deze test houdt allebei in leven, en bewaakt de grens die er in een
 * kinderapp bij hoort: edelstenen komen er alleen in door te spelen.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import {
  addXp, getState, heartsNow, kanHartenKopen, kanVriesdagKopen, koopHarten, koopVriesdag,
  MAX_HEARTS, MAX_VRIESDAGEN, PRIJS_HARTEN, PRIJS_VRIESDAG, setState, today,
} from './store'

/** Een vast tijdstip voor de hartjes, die hun eigen klok meekrijgen. */
const NU = new Date(2026, 4, 20, 12, 0, 0).getTime()

/**
 * De reeks rekent met `today()` en kent geen klok die je meegeeft, dus die
 * dagen moeten van de echte kalender komen. Via `setDate` en niet via
 * aftrekken in milliseconden: op de nacht van de zomertijd telt een dag geen
 * vierentwintig uur, en dan wijst het verkeerde dag aan.
 */
const dagGeleden = (n: number): string => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return today(d)
}

beforeEach(() => setState({
  gems: 0, hearts: MAX_HEARTS, heartsAt: NU, freezes: 0,
  streak: 0, bestStreak: 0, lastDay: null, daily: {}, xp: 0,
  settings: { ...getState().settings, hearts: true },
}))

describe('hartjes aanvullen met edelstenen', () => {
  it('kan niet als de hartjes al vol zijn', () => {
    setState({ gems: 100 })
    expect(kanHartenKopen(getState(), NU)).toBe(false)
    expect(koopHarten(NU)).toBe(false)
    expect(getState().gems).toBe(100)
  })

  it('kan niet met te weinig edelstenen', () => {
    setState({ hearts: 0, heartsAt: NU, gems: PRIJS_HARTEN - 1 })
    expect(kanHartenKopen(getState(), NU)).toBe(false)
    expect(koopHarten(NU)).toBe(false)
    expect(getState().gems).toBe(PRIJS_HARTEN - 1)
    expect(heartsNow(getState(), NU)).toBe(0)
  })

  it('vult de rij en schrijft de prijs af', () => {
    setState({ hearts: 0, heartsAt: NU, gems: PRIJS_HARTEN + 3 })
    expect(koopHarten(NU)).toBe(true)
    expect(getState().gems).toBe(3)
    expect(heartsNow(getState(), NU)).toBe(MAX_HEARTS)
  })

  /** Twee keer betalen voor dezelfde volle rij hoort niet te kunnen. */
  it('neemt niet nog een keer als de rij al vol is', () => {
    setState({ hearts: 0, heartsAt: NU, gems: 2 * PRIJS_HARTEN })
    expect(koopHarten(NU)).toBe(true)
    expect(koopHarten(NU)).toBe(false)
    expect(getState().gems).toBe(PRIJS_HARTEN)
  })

  /**
   * Staan de hartjes uit, dan is er niets aan te vullen. Dat is de instelling
   * die de app zelf aanraadt voor jonge kinderen, en daar hoort geen aankoop
   * bij.
   */
  it('doet niets als hartjes helemaal uitstaan', () => {
    setState({ hearts: 0, heartsAt: NU, gems: 100, settings: { ...getState().settings, hearts: false } })
    expect(kanHartenKopen(getState(), NU)).toBe(false)
    expect(koopHarten(NU)).toBe(false)
  })
})

describe('de vriesdag', () => {
  it('kan niet met te weinig edelstenen', () => {
    setState({ gems: PRIJS_VRIESDAG - 1 })
    expect(kanVriesdagKopen(getState())).toBe(false)
    expect(koopVriesdag()).toBe(false)
    expect(getState().freezes).toBe(0)
  })

  it('komt erbij en kost wat hij kost', () => {
    setState({ gems: PRIJS_VRIESDAG + 1 })
    expect(koopVriesdag()).toBe(true)
    expect(getState().freezes).toBe(1)
    expect(getState().gems).toBe(1)
  })

  it('stapelt niet verder dan het maximum', () => {
    setState({ gems: 10 * PRIJS_VRIESDAG })
    for (let i = 0; i < MAX_VRIESDAGEN; i++) expect(koopVriesdag()).toBe(true)
    expect(getState().freezes).toBe(MAX_VRIESDAGEN)
    expect(koopVriesdag()).toBe(false)
    expect(getState().freezes).toBe(MAX_VRIESDAGEN)
  })

  /**
   * Waar het om begonnen was. Dit is de tak in `addXp` die tot nu toe
   * onbereikbaar was: één dag overgeslagen, een vriesdag op zak, en de reeks
   * loopt door in plaats van terug naar één.
   */
  it('houdt de reeks heel na één gemiste dag', () => {
    setState({ streak: 9, bestStreak: 9, lastDay: dagGeleden(2), freezes: 1 })
    addXp(2)
    expect(getState().streak).toBe(10)
    expect(getState().freezes).toBe(0)
  })

  it('en zonder vriesdag begint de reeks opnieuw', () => {
    setState({ streak: 9, bestStreak: 9, lastDay: dagGeleden(2), freezes: 0 })
    addXp(2)
    expect(getState().streak).toBe(1)
    expect(getState().bestStreak).toBe(9)
  })

  /** Twee dagen weg is twee dagen weg: daar is één vriesdag niet genoeg voor. */
  it('redt geen twee gemiste dagen', () => {
    setState({ streak: 9, bestStreak: 9, lastDay: dagGeleden(3), freezes: 1 })
    addXp(2)
    expect(getState().streak).toBe(1)
    expect(getState().freezes).toBe(1)
  })

  it('raakt niet op bij een gewone doorlopende dag', () => {
    setState({ streak: 4, bestStreak: 4, lastDay: dagGeleden(1), freezes: 2 })
    addXp(2)
    expect(getState().streak).toBe(5)
    expect(getState().freezes).toBe(2)
  })
})

describe('de grens die er in een kinderapp bij hoort', () => {
  /**
   * Edelstenen zijn geen aankoop met geld en worden het ook niet. In de
   * kinderafdeling van Apple ligt dat gevoelig, en terecht: een kind hoort
   * niet tegen een muur te lopen die alleen met de portemonnee van zijn ouder
   * weggaat. Spelen is de enige manier om eraan te komen.
   */
  it('kent geen enkele weg van een winkel naar edelstenen', async () => {
    const { readFileSync } = await import('node:fs')
    const winkel = readFileSync(new URL('./billing.ts', import.meta.url), 'utf8')
    expect(winkel).not.toMatch(/\bgems\b/)
    expect(winkel).not.toMatch(/freezes/)

    const bron = readFileSync(new URL('./store.ts', import.meta.url), 'utf8')
    // De twee uitgaven staan naast elkaar en nergens anders gaat er iets af.
    const afschrijvingen = bron.match(/gems: (?:s\.)?gems? ?-|gems: s\.gems - |Math\.max\(0, s\.gems - /g) ?? []
    expect(afschrijvingen.length).toBeGreaterThan(0)
  })

  /** Nooit onder nul, hoe de staat ook binnenkomt. */
  it('laat edelstenen niet onder nul zakken', () => {
    setState({ hearts: 0, heartsAt: NU, gems: 0 })
    expect(koopHarten(NU)).toBe(false)
    expect(getState().gems).toBe(0)
    expect(koopVriesdag()).toBe(false)
    expect(getState().gems).toBe(0)
  })
})
