/**
 * Twee momenten die de app wel bijhield maar nooit noemde.
 *
 * `goalMet` stond in de engine en werd door geen enkel scherm gelezen: het
 * dagdoel was een balkje in de kopbalk dat vol liep en verder niets. En de
 * reeks telde door zonder dat er ooit iets van werd gezegd.
 *
 * Het zijn precies de twee momenten waarop iemand besluit om morgen terug te
 * komen, dus ze horen aan het eind van een les te staan — één keer, op de dag
 * dat ze waar worden.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { getState, goalMet, isMijlpaal, REEKS_MIJLPALEN, setState, today, xpToday } from './store'

beforeEach(() => setState({
  daily: {}, xp: 0, settings: { ...getState().settings, dailyGoal: 30 },
}))

describe('het dagdoel', () => {
  it('is niet gehaald met minder dan het doel', () => {
    setState({ daily: { [today()]: 28 } })
    expect(xpToday()).toBe(28)
    expect(goalMet()).toBe(false)
  })

  it('is gehaald vanaf precies het doel', () => {
    setState({ daily: { [today()]: 30 } })
    expect(goalMet()).toBe(true)
  })

  /**
   * Gisteren telt niet mee. Zonder dat zou het doel op de eerste les van een
   * nieuwe dag al gehaald lijken, en dan is het bericht onzin.
   */
  it('kijkt alleen naar vandaag', () => {
    setState({ daily: { '2020-01-01': 500 } })
    expect(goalMet()).toBe(false)
  })
})

describe('de mijlpalen van de reeks', () => {
  it('viert de dagen uit de lijst', () => {
    for (const dag of REEKS_MIJLPALEN) expect(isMijlpaal(dag)).toBe(true)
  })

  it('viert de dagen ertussen niet', () => {
    for (const dag of [1, 2, 4, 5, 6, 8, 13, 15, 29, 31, 99, 101]) expect(isMijlpaal(dag)).toBe(false)
  })

  /**
   * Ze horen uit elkaar te lopen. Elke dag feest is geen feest meer, en een
   * lijst die ergens in het midden dichter op elkaar komt te staan is een
   * vergissing die je niet ziet aan één getal.
   */
  it('staat op volgorde en loopt steeds verder uit elkaar', () => {
    const gaten = REEKS_MIJLPALEN.slice(1).map((d, i) => d - REEKS_MIJLPALEN[i]!)
    expect([...REEKS_MIJLPALEN].sort((a, b) => a - b)).toEqual(REEKS_MIJLPALEN)
    for (let i = 1; i < gaten.length; i++) expect(gaten[i]!).toBeGreaterThanOrEqual(gaten[i - 1]!)
  })

  it('begint niet op dag één', () => {
    expect(isMijlpaal(1)).toBe(false)
  })
})

describe('hoe het scorescherm het meet', () => {
  /**
   * Vóór de rónde, niet vóór het afronden. Dat verschil is het hele punt.
   *
   * Een goed antwoord betaalt meteen uit: `scoreCorrect` roept `addXp` aan
   * middenin de les. Tegen de tijd dat `finish` draait is de reeks dus allang
   * opgehoogd en een vriesdag allang afgeschreven — vergelijken met de staat
   * van dát moment is iets met zichzelf vergelijken.
   *
   * Zo is het ook misgegaan: nagemeten op een echte les stond de reeks op 3,
   * dat is een mijlpaal, en er kwam niets in beeld. De test leest de bron,
   * want dit is precies het soort regel dat bij een opruimbeurt "korter" wordt
   * gemaakt door `start` door `before` te vervangen.
   */
  it('vergelijkt met de staat van vóór de ronde', async () => {
    const { readFileSync } = await import('node:fs')
    const bron = readFileSync(new URL('../pages/LessonPlayer.tsx', import.meta.url), 'utf8')
      .replace(/\r\n/g, '\n')

    // De staat van vóór de ronde wordt bij elke poging opnieuw vastgelegd.
    expect(bron).toContain('const voorRonde = useRef(getState())')
    expect(bron).toContain("useEffect(() => { voorRonde.current = getState() }, [lessonId, attempt])")

    // En de drie berichten hangen allemaal aan díé staat, niet aan `before`.
    expect(bron).toContain('const start = voorRonde.current')
    expect(bron).toContain('doel: !doelVoor && goalMet(now)')
    expect(bron).toContain('const doelVoor = goalMet(start)')
    expect(bron).toContain('now.streak > start.streak && isMijlpaal(now.streak)')
    expect(bron).toContain('vries: now.freezes < start.freezes')

    // `before` blijft wél wat het was: waar de les zelf bovenop kwam.
    expect(bron).toContain('const levelBefore = levelOf(before.xp).level')
  })
})
