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
import { dueSentenceIds, getState, gradeExtra, gradeWord, hydrate, MAX_HEARTS, setState, type State } from './store'
import { newCard, type Card } from './srs'

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

describe('een kaart waar niet meer mee te rekenen valt', () => {
  /**
   * `review` telt bij elk veld iets op. Mist er één getal — een kaart uit een
   * beschadigde opslag, of uit een versie die een veld nog niet kende — dan is
   * de uitkomst NaN, en NaN komt nooit meer terug naar een getal. Die ene
   * kaart blijft dan voor altijd stuk: hij komt nooit meer terug om te
   * herhalen en zijn sterkte blijft leeg.
   *
   * Dat is geen crash en daarom juist vervelend: het valt niemand op.
   */
  it('begint opnieuw in plaats van NaN te worden', () => {
    setState({
      cards: { salam: { id: 'salam', ease: 2.4, interval: 1, due: 0, reps: 1, lapses: 0 } as unknown as Card },
      extraCards: {},
    })
    gradeWord('salam', 'goed')
    const na = getState().cards['salam']!
    for (const [veld, n] of Object.entries(na)) {
      if (typeof n === 'number') expect(Number.isFinite(n), `${veld} werd ${n}`).toBe(true)
    }
    expect(na.reps).toBe(1)
  })

  it('laat een kaart die wél klopt met rust', () => {
    const goed = newCard('shukran')
    setState({ cards: { shukran: { ...goed, reps: 7, strength: 0.8 } }, extraCards: {} })
    gradeWord('shukran', 'goed')
    // Doorgeteld vanaf zeven, dus de geschiedenis is niet weggegooid.
    expect(getState().cards['shukran']!.reps).toBe(8)
  })

  it('doet hetzelfde voor letters en zinnen', () => {
    setState({ cards: {}, extraCards: { 'l:alif': { id: 'l:alif', ease: 2.4, due: 0, reps: 3, lapses: 0, strength: 0.4 } as unknown as Card } })
    gradeExtra('l:alif', 'goed')
    const na = getState().extraCards['l:alif']!
    expect(Number.isFinite(na.interval)).toBe(true)
    expect(Number.isFinite(na.strength)).toBe(true)
  })
})

/**
 * Een kaart voor een woord dat niet meer bestaat.
 *
 * Dit is geen verzonnen geval en ook geen half weggeschreven opslag: zodra we
 * een woord-id hernoemen of een woord weghalen, houdt iedereen die dat woord
 * al geleerd had zo'n kaart over. Die opslag staat op het toestel en komt met
 * de volgende versie gewoon weer binnen.
 *
 * `word(id)` werpt bij een onbekend id, en dat gebeurt op /herhalen in de
 * lijst "deze zitten nog het minst vast" — dus één zo'n kaart haalde de hele
 * bladzijde onderuit, foutscherm en al. Nagemeten in de browser: precies dat.
 */
describe('een kaart voor een woord dat we niet meer kennen', () => {
  const echt = 'salam'

  it('valt eruit, en de rest blijft staan', () => {
    const s = laad({
      version: 1,
      cards: {
        [echt]: newCard(echt),
        'verzonnen-woord-dat-niet-bestaat': newCard('verzonnen-woord-dat-niet-bestaat'),
      },
    })
    expect(Object.keys(s.cards)).toEqual([echt])
  })

  it('telt niet meer mee als "woorden gezien"', () => {
    const s = laad({ version: 1, cards: { weg: newCard('weg'), weg2: newCard('weg2') } })
    expect(Object.keys(s.cards)).toHaveLength(0)
  })

  /** Een echte opslag met alleen bestaande woorden mag niets kwijtraken. */
  it('laat een gezonde opslag met rust', () => {
    const ids = ['salam', 'shukran', 'afak']
    const cards = Object.fromEntries(ids.map((id) => [id, newCard(id)]))
    expect(Object.keys(laad({ version: 1, cards }).cards).sort()).toEqual([...ids].sort())
  })
})

/**
 * En hetzelfde voor de letters en de zinnen, die met een voorvoegsel in
 * `extraCards` staan. `sentence(id)` werpt net zo goed als `word(id)`, en die
 * wordt aangeroepen in `buildReviewRound` — dus een zin-id dat we weghalen
 * laat de herhaalronde omvallen op het moment dat je hem start.
 */
describe('letters en zinnen die we niet meer kennen', () => {
  it('houdt alleen sleutels die ergens bij horen', () => {
    const s = laad({
      version: 1,
      extraCards: {
        'l:alif': newCard('l:alif'),
        'l:verzonnen': newCard('l:verzonnen'),
        'z:verzonnen-zin': newCard('z:verzonnen-zin'),
        'zonder-voorvoegsel': newCard('zonder-voorvoegsel'),
      },
    })
    expect(Object.keys(s.extraCards)).toEqual(['l:alif'])
  })

  it('een zin-id dat niet meer bestaat komt niet in de wachtrij', () => {
    const s = laad({
      version: 1,
      extraCards: { 'z:verzonnen-zin': { ...newCard('z:verzonnen-zin'), due: 0 } },
    })
    expect(dueSentenceIds(s, Date.now())).toEqual([])
  })
})
