import { describe, expect, it } from 'vitest'
import { buildScorecard, capCategory, type Band, type CategorySpec } from '../src/studio/scoring.js'
import { NICHE_BANDS, NICHE_CATEGORIES, checkFocus, scoreNiche } from '../src/studio/niche.js'
import { applyTitleRules, scoreTitles, TITLE_CATEGORIES, type TitleCandidate } from '../src/studio/titles.js'
import {
  ALWAYS_EXCLUDE, applyThumbnailRules, pairTitleAndThumbnail, scoreThumbnails,
  THUMBNAIL_CATEGORIES, type ThumbnailConcept,
} from '../src/studio/thumbnails.js'
import { analysePacing, BANNED_OPENINGS } from '../src/studio/pacing.js'
import { runQualityGate } from '../src/studio/quality-gate.js'
import { CreatorProfileSchema, KnowledgePackSchema } from '../src/knowledge/types.js'
import type { Script } from '../src/domain/types.js'

const specs: CategorySpec[] = [
  { key: 'a', label: 'A', max: 20, question: '' },
  { key: 'b', label: 'B', max: 10, question: '' },
]
const bands: Band[] = [{ min: 20, label: 'goed' }, { min: 0, label: 'zwak' }]

describe('scorecard', () => {
  it('telt zelf op in plaats van het totaal van het model over te nemen', () => {
    const card = buildScorecard(specs, [
      { key: 'a', score: 15, reasoning: '' }, { key: 'b', score: 6, reasoning: '' },
    ], bands)
    expect(card.total).toBe(21)
    expect(card.classification).toBe('goed')
  })

  it('begrenst een categorie die boven het maximum scoort, en zegt dat', () => {
    const card = buildScorecard(specs, [{ key: 'a', score: 40, reasoning: '' }], bands)
    expect(card.categories[0]!.score).toBe(20)
    expect(card.adjustments.join(' ')).toMatch(/teruggebracht naar het maximum/)
  })

  it('telt een ontbrekende categorie als nul', () => {
    const card = buildScorecard(specs, [{ key: 'a', score: 10, reasoning: '' }], bands)
    expect(card.total).toBe(10)
    expect(card.adjustments.join(' ')).toMatch(/geen score gegeven/)
  })

  it('herberekent het totaal na een plafond', () => {
    const card = buildScorecard(specs, [
      { key: 'a', score: 20, reasoning: '' }, { key: 'b', score: 10, reasoning: '' },
    ], bands)
    const capped = capCategory(card, 'a', 5, 'reden')
    expect(capped.total).toBe(15)
  })
})

describe('niche: focus', () => {
  it('wijst een breed onderwerp af als propositie', () => {
    expect(checkFocus('islamitische content').focused).toBe(false)
    expect(checkFocus('gezondheid').focused).toBe(false)
  })

  it('accepteert een voorstel dat publiek, vorm en invalshoek benoemt', () => {
    expect(checkFocus(
      'korte cinematische verhalen die klassieke lessen koppelen aan alledaagse ' +
      'problemen van Nederlandse gezinnen',
    ).focused).toBe(true)
  })
})

describe('niche: score kan niet gevleid worden', () => {
  const full = NICHE_CATEGORIES.map((c) => ({ key: c.key, score: c.max, reasoning: 'prima' }))

  it('begrenst eigen voorsprong wanneer het profiel er geen noemt', () => {
    const creator = CreatorProfileSchema.parse({})
    const card = scoreNiche(full, creator, { hypothesisOnly: false })
    expect(card.categories.find((c) => c.key === 'creator_advantage')!.score).toBe(5)
    expect(card.adjustments.join(' ')).toMatch(/Passie alleen is geen/)
  })

  it('geeft volle punten pas bij meerdere onnavolgbare voordelen', () => {
    const twee = CreatorProfileSchema.parse({ unfairAdvantage: ['taal', 'toegang'] })
    expect(scoreNiche(full, twee, { hypothesisOnly: false })
      .categories.find((c) => c.key === 'creator_advantage')!.score).toBe(11)

    const drie = CreatorProfileSchema.parse({ unfairAdvantage: ['taal', 'toegang', 'beroep'] })
    expect(scoreNiche(full, drie, { hypothesisOnly: false })
      .categories.find((c) => c.key === 'creator_advantage')!.score).toBe(15)
  })

  it('zet een plafond op vraag en concurrentie zonder externe data', () => {
    const creator = CreatorProfileSchema.parse({ unfairAdvantage: ['a', 'b', 'c'] })
    const card = scoreNiche(full, creator, { hypothesisOnly: true })
    expect(card.categories.find((c) => c.key === 'audience_demand')!.score).toBe(11)
    expect(card.categories.find((c) => c.key === 'competition')!.score).toBe(7)
    expect(card.total).toBeLessThan(100)
  })
})

describe('titels', () => {
  const fullScore = TITLE_CATEGORIES.map((c) => ({ key: c.key, score: c.max, reasoning: 'ok' }))
  const card = () => buildScorecard(TITLE_CATEGORIES, fullScore, [{ min: 0, label: 'x' }])

  it('blokkeert een holle constructie zonder onderbouwing', () => {
    const result = applyTitleRules(card(), {
      title: 'De waarheid over de eerste moskee', style: 'tegendraads', coverage: '',
    })
    expect(result.blocked).toMatch(/de waarheid over/i)
  })

  it('laat dezelfde constructie door als de dekking is onderbouwd, met aftrek', () => {
    const result = applyTitleRules(card(), {
      title: 'De waarheid over de eerste moskee', style: 'tegendraads',
      coverage: 'de video toont de drie bronnen die elkaar tegenspreken',
    })
    expect(result.blocked).toBeUndefined()
    expect(result.card.categories.find((c) => c.key === 'credibility')!.score).toBe(6)
  })

  it('straft een te lange titel op helderheid', () => {
    const long = 'Waarom de allereerste moskee in Medina er compleet anders uitzag dan je nu denkt'
    expect(long.length).toBeGreaterThan(60)
    const result = applyTitleRules(card(), { title: long, style: 'vraag', coverage: 'ja' })
    expect(result.card.categories.find((c) => c.key === 'clarity')!.score).toBe(12)
  })

  it('straft schreeuwen', () => {
    const result = applyTitleRules(card(), {
      title: 'DEZE MOSKEE HAD GEEN MINARET', style: 'emotie', coverage: 'ja',
    })
    expect(result.card.categories.find((c) => c.key === 'credibility')!.score).toBeLessThanOrEqual(5)
  })

  it('kiest een winnaar en blokkeert wat te dicht bij de referentie ligt', () => {
    const candidates: TitleCandidate[] = [
      { title: 'De eerste moskee had geen minaret. Dat was geen toeval.', style: 'tegendraads', coverage: 'ja' },
      { title: 'Waarom een gebedsruimte eeuwen zonder toren werkte', style: 'vraag', coverage: 'ja' },
    ]
    const raw = Object.fromEntries(candidates.map((c) => [c.title, fullScore]))
    const result = scoreTitles(candidates, raw, {
      seedTitles: ['De eerste moskee had geen koepel. Dat was geen toeval.'],
      topic: 'de eerste moskee in Medina',
    })
    expect(result.scored.find((s) => s.title === candidates[0]!.title)!.blocked)
      .toMatch(/te dicht bij een referentietitel/)
    expect(result.winner!.title).toBe(candidates[1]!.title)
  })
})

describe('thumbnails', () => {
  const base: ThumbnailConcept = {
    conceptName: 'Silhouet bij zonsopgang',
    visualSubject: 'daklijn zonder minaret',
    emotionalSignal: 'stilte voor het gebed',
    background: 'ochtendlucht',
    composition: 'onderwerp links, tekst rechts',
    text: 'GEEN MINARET',
    palette: ['#14332b', '#f2efe6'],
    contrastStrategy: 'donker silhouet op lichte lucht',
    supportingSymbol: 'palmstam',
    exclude: [...ALWAYS_EXCLUDE],
    imagePrompt: '...',
    whyItComplementsTheTitle: 'de titel stelt de vraag, het beeld toont het gemis',
  }
  const fullScore = THUMBNAIL_CATEGORIES.map((c) => ({ key: c.key, score: c.max, reasoning: 'ok' }))
  const card = () => buildScorecard(THUMBNAIL_CATEGORIES, fullScore, [{ min: 0, label: 'x' }])

  it('blokkeert een concept zonder het afbeeldingsverbod in de uitsluitingen', () => {
    const result = applyThumbnailRules(card(), { ...base, exclude: [] }, 'titel')
    expect(result.blocked).toMatch(/profeten of metgezellen/)
  })

  it('straft te veel tekst op leesbaarheid', () => {
    const result = applyThumbnailRules(
      card(), { ...base, text: 'dit is veel te veel tekst' }, 'titel')
    expect(result.card.categories.find((c) => c.key === 'mobile_readability')!.score).toBe(7)
  })

  it('straft een thumbnailtekst die de titel herhaalt', () => {
    const result = applyThumbnailRules(card(), { ...base, text: 'geen minaret' },
      'De eerste moskee had geen minaret')
    expect(result.card.categories.find((c) => c.key === 'alignment')!.score).toBe(4)
  })

  it('straft de combinatie wanneer beide hetzelfde zeggen', () => {
    const scored = scoreThumbnails([base], { [base.conceptName]: fullScore }, 'titel')
    const pairs = pairTitleAndThumbnail(
      [{ title: 'De eerste moskee had geen minaret', total: 90 }], scored)
    expect(pairs[0]!.combined).toBeLessThan(90)
    expect(pairs[0]!.note).toMatch(/ook in de titel staat/)
  })
})

describe('tempo', () => {
  const script = (over: Partial<Script> = {}): Script => ({
    thesis: 'Deze video betoogt dat...',
    hook: 'De bekendste moskee ter wereld had geen koepel.',
    promise: 'In tien minuten weet je welk onderdeel er als eerste was.',
    segments: [
      { title: 'Een', body: 'x '.repeat(60), opensLoop: 'iets', closesLoop: 'iets' },
    ],
    counterArgument: 'x', conclusion: 'x', callToAction: 'x', wordCount: 0,
    ...over,
  })

  it('keurt een hook binnen vijf seconden goed', () => {
    expect(analysePacing(script(), 120).hookWithinFive).toBe(true)
  })

  it('herkent een te lange aanloop', () => {
    const report = analysePacing(script({ hook: 'woord '.repeat(40) }), 120)
    expect(report.hookWithinFive).toBe(false)
    expect(report.problems.join(' ')).toMatch(/eerste vijf beslissen/)
  })

  it('herkent elke verboden opening', () => {
    for (const banned of BANNED_OPENINGS) {
      const report = analysePacing(script({ hook: `${banned}, vandaag iets nieuws` }), 120)
      expect(report.bannedOpening).toBe(banned)
    }
  })

  it('meet de haakdichtheid tegen ongeveer één per 45 seconden', () => {
    const report = analysePacing(script(), 600)
    expect(report.loopsExpected).toBe(13)
    expect(report.loopDensityOk).toBe(false)
  })

  it('meldt een haak die nooit gesloten wordt', () => {
    const report = analysePacing(
      script({ segments: [{ title: 'a', body: 'x', opensLoop: 'iets' }] }), 45)
    expect(report.problems.join(' ')).toMatch(/nooit gesloten/)
  })
})

describe('kwaliteitspoort', () => {
  const pack = KnowledgePackSchema.parse({
    audience: { description: 'Nederlandse islamitische gezinnen' },
  })

  it('stuurt terug met een concrete herzieningsopdracht in plaats van alleen af te wijzen', () => {
    const result = runQualityGate({ pack, ideaCount: 12 })
    expect(result.passed).toBe(false)
    expect(result.revisionBrief).toMatch(/Maak een sterkere versie/)
    expect(result.revisionBrief).toMatch(/→/)
  })

  it('blokkeert op een claim zonder bron', () => {
    const result = runQualityGate({ pack, unsourcedClaims: ['de moskee was 30 meter breed'] })
    expect(result.findings.some((f) => f.severity === 'blokkeert')).toBe(true)
  })

  it('blokkeert wanneer het publiek nergens staat', () => {
    const leeg = KnowledgePackSchema.parse({})
    const result = runQualityGate({ pack: leeg })
    expect(result.findings.some((f) => f.check === 'publiek_expliciet')).toBe(true)
  })

  it('signaleert een plan dat niet in de beschikbare uren past', () => {
    const met = KnowledgePackSchema.parse({
      audience: { description: 'x' }, creator: { hoursPerWeek: 6 },
    })
    const result = runQualityGate({ pack: met, estimatedHoursPerWeek: 14 })
    expect(result.findings.some((f) => f.check === 'werkdruk_realistisch')).toBe(true)
  })

  it('laat alles door wanneer er niets mis is', () => {
    const result = runQualityGate({ pack, ideaCount: 60 })
    expect(result.passed).toBe(true)
    expect(result.revisionBrief).toBe('')
  })
})
