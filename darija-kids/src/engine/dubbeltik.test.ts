/**
 * Twee keer drukken mag nooit twee keer betalen.
 *
 * Een kind drukt op een knop die iets oplevert, ziet niet meteen iets
 * gebeuren, en drukt nog een keer. Dat is geen randgeval maar het normale
 * gedrag van de doelgroep, en achter drie van deze knoppen zit een beloning.
 *
 * Nagemeten in de browser: een missieknop twintig keer achter elkaar
 * ingedrukt levert eenentwintig edelstenen op — en dat is precies de som van
 * alle vijf de missies (3+5+5+4+4), niet één missie die vier keer uitbetaalde.
 * Deze test legt dat vast zonder browser.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import {
  claimQuest, getState, kanHartenKopen, koopHarten, koopVriesdag, MAX_HEARTS, MAX_VRIESDAGEN,
  PRIJS_HARTEN, PRIJS_VRIESDAG, QUESTS, setState, today,
} from './store'

/** Alle vijf de missies gehaald, nog niets opgehaald. */
const allesGehaald = () => setState({
  gems: 0,
  quests: { day: today(), goed: 99, herhaald: 99, zinnen: 99, lessen: 9, bonus: 9, claimed: [] },
})

beforeEach(() => setState({
  gems: 0, hearts: MAX_HEARTS, heartsAt: Date.now(), freezes: 0,
  settings: { ...getState().settings, hearts: true },
}))

describe('een missie ophalen', () => {
  it('betaalt één keer, hoe vaak je ook drukt', () => {
    allesGehaald()
    const eerste = QUESTS[0]!
    expect(claimQuest(eerste.id)).toBe(eerste.gems)
    for (let i = 0; i < 19; i++) expect(claimQuest(eerste.id)).toBe(0)
    expect(getState().gems).toBe(eerste.gems)
  })

  it('betaalt samen precies de som van de vijf', () => {
    allesGehaald()
    // Twintig keer kriskras drukken, zoals een ongeduldige vinger het doet.
    for (let i = 0; i < 20; i++) claimQuest(QUESTS[i % QUESTS.length]!.id)
    expect(getState().gems).toBe(QUESTS.reduce((a, q) => a + q.gems, 0))
    expect(getState().quests.claimed).toHaveLength(QUESTS.length)
  })

  it('betaalt niets voor een missie die nog niet af is', () => {
    setState({ gems: 0, quests: { day: today(), goed: 0, herhaald: 0, zinnen: 0, lessen: 0, bonus: 0, claimed: [] } })
    for (const q of QUESTS) expect(claimQuest(q.id)).toBe(0)
    expect(getState().gems).toBe(0)
  })
})

describe('de twee dingen die edelstenen kosten', () => {
  it('vult de hartjes één keer aan, hoe vaak je ook drukt', () => {
    setState({ hearts: 0, heartsAt: Date.now(), gems: 3 * PRIJS_HARTEN })
    expect(koopHarten()).toBe(true)
    for (let i = 0; i < 10; i++) expect(koopHarten()).toBe(false)
    expect(getState().gems).toBe(2 * PRIJS_HARTEN)
    expect(kanHartenKopen()).toBe(false)
  })

  it('stapelt vriesdagen niet voorbij het maximum, hoe vaak je ook drukt', () => {
    setState({ gems: 20 * PRIJS_VRIESDAG, freezes: 0 })
    for (let i = 0; i < 20; i++) koopVriesdag()
    expect(getState().freezes).toBe(MAX_VRIESDAGEN)
    expect(getState().gems).toBe(20 * PRIJS_VRIESDAG - MAX_VRIESDAGEN * PRIJS_VRIESDAG)
  })

  /**
   * De reden dat dit werkt zonder een vlag of een slot: `setState` zet de
   * nieuwe staat er synchroon in. De tweede druk leest dus al de uitkomst van
   * de eerste. Zou daar ooit iets asynchroons tussen komen, dan valt deze test
   * om — en dat is precies de bedoeling.
   */
  it('ziet bij de tweede druk al wat de eerste deed', () => {
    setState({ gems: 100, freezes: 0 })
    koopVriesdag()
    expect(getState().freezes).toBe(1)
    expect(getState().gems).toBe(100 - PRIJS_VRIESDAG)
  })
})
