/**
 * Een opslag die niet meer klopt.
 *
 * Veertien kapotte staten door de app gehaald, en vier lieten hem omvallen bij
 * het opstarten: `daily`, `cards`, `lessons` of `extraCards` op `null` is
 * genoeg. `Object.keys(null)` werpt, en dat gebeurt in de eerste tekening van
 * het leerpad.
 *
 * Het foutscherm ving het op en biedt de ouder een uitweg, dus niemand zat
 * voorgoed vast. Maar die uitweg is "wis alles", en dan is er een jaar
 * voortgang weg om één kapot veld. Dit is de enige plek waar de voortgang van
 * een kind staat.
 *
 * Hoe komt een opslag kapot? Een versie die later iets anders schrijft en dan
 * wordt teruggedraaid, een browser die bij een volle schijf half wegschrijft,
 * of gewoon een fout van ons.
 */
import { describe, expect, it } from 'vitest'
import { hydrate, MAX_HEARTS, type State } from './store'

/** Zoals `load()` het doet: alles erin, kijken wat eruit komt. */
const laad = (ruw: unknown): State => hydrate(ruw as Partial<State>)

describe('wat er met een kapotte opslag gebeurt', () => {
  it.each([
    ['daily', { daily: null }],
    ['cards', { cards: null }],
    ['lessons', { lessons: null }],
    ['extraCards', { extraCards: null }],
    ['badges', { badges: null }],
    ['history', { history: null }],
    ['seenTips', { seenTips: null }],
    ['settings', { settings: null }],
    ['quests', { quests: null }],
    ['bonus', { bonus: null }],
  ])('overleeft %s op null', (_naam, kapot) => {
    const s = laad({ version: 1, ...kapot })
    // De vier die de app lieten omvallen deden dat hierop.
    expect(() => Object.keys(s.cards)).not.toThrow()
    expect(() => Object.keys(s.lessons)).not.toThrow()
    expect(() => Object.keys(s.daily)).not.toThrow()
    expect(() => Object.keys(s.extraCards)).not.toThrow()
    expect(Array.isArray(s.badges)).toBe(true)
    expect(Array.isArray(s.history)).toBe(true)
    expect(Array.isArray(s.seenTips)).toBe(true)
    expect(typeof s.settings.lang).toBe('string')
  })

  it('overleeft een opslag die helemaal geen voorwerp is', () => {
    const s = laad('gewoon een tekst')
    expect(s.xp).toBe(0)
    expect(Object.keys(s.cards)).toEqual([])
    expect(s.hearts).toBe(MAX_HEARTS)
  })

  /**
   * Een lijst waar een verzameling hoort is net zo goed fout: `Object.keys`
   * geeft dan indexen terug, en dan staat er een kaart met de naam "0".
   */
  it('neemt een lijst niet aan voor een verzameling', () => {
    expect(Object.keys(laad({ cards: ['a', 'b'] }).cards)).toEqual([])
  })

  it('neemt een tekst niet aan voor een verzameling', () => {
    expect(Object.keys(laad({ cards: 'oeps' }).cards)).toEqual([])
  })

  /**
   * Een teller die geen getal is wordt NaN zodra er iets bij opgeteld wordt,
   * en NaN komt daarna nooit meer terug naar een getal. Dat is geen crash maar
   * wel een profiel dat voorgoed "NaN XP" zegt.
   */
  it.each(['xp', 'gems', 'hearts', 'heartsAt', 'streak', 'bestStreak', 'freezes', 'sentencesDone'])(
    'houdt %s een getal', (veld) => {
      for (const rommel of [null, 'veel', {}, [], NaN, Infinity, undefined]) {
        const s = laad({ [veld]: rommel }) as unknown as Record<string, unknown>
        expect(Number.isFinite(s[veld]), `${veld} werd ${String(rommel)}`).toBe(true)
      }
    },
  )
})

describe('wat er wél bewaard blijft', () => {
  /**
   * Het punt van de hele reparatie: één kapot veld mag de rest niet meenemen.
   */
  it('houdt de voortgang die nog wél klopt', () => {
    const s = laad({
      version: 1,
      xp: 14000,
      streak: 120,
      daily: null,
      lessons: { 'hruf-1': { stars: 3, runs: 4, bestScore: 1, lastDone: 123 } },
      badges: ['missies'],
    })
    expect(s.xp).toBe(14000)
    expect(s.streak).toBe(120)
    expect(Object.keys(s.lessons)).toEqual(['hruf-1'])
    expect(s.badges).toEqual(['missies'])
    // En alleen het kapotte veld valt terug.
    expect(s.daily).toEqual({})
  })

  it('vult aan wat een oudere versie nog niet kende', () => {
    const s = laad({ version: 1, xp: 50 })
    expect(s.quests.claimed).toEqual([])
    expect(s.bonus.total).toBe(0)
    expect(s.freezes).toBe(0)
  })
})
