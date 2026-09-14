import type { Band, CategorySpec, Scorecard } from './scoring.js'
import { buildScorecard, capCategory } from './scoring.js'
import { screenTitles } from '../domain/titles.js'

export const TITLE_STYLES = [
  'zoekgericht', 'nieuwsgierigheid', 'emotie', 'verhaal', 'tegendraads',
  'urgentie', 'gezag of bewijs', 'lijst', 'vraag', 'transformatie',
] as const
export type TitleStyle = typeof TITLE_STYLES[number]

export const TITLE_CATEGORIES: CategorySpec[] = [
  { key: 'clarity', label: 'Helderheid', max: 20,
    question: 'Snapt een kijker binnen twee seconden wat hij krijgt?' },
  { key: 'curiosity', label: 'Nieuwsgierigheid', max: 20,
    question: 'Wekt hij spanning zonder het onderwerp te verbergen?' },
  { key: 'relevance', label: 'Relevantie voor het publiek', max: 15,
    question: 'Raakt hij een vraag die dit specifieke publiek echt heeft?' },
  { key: 'emotion', label: 'Emotionele kracht', max: 15,
    question: 'Zit er spanning, herkenning of urgentie in die echt is?' },
  { key: 'specificity', label: 'Concreetheid', max: 10,
    question: 'Staan er specifieke woorden in plaats van algemeenheden?' },
  { key: 'search', label: 'Zoekpotentie', max: 10,
    question: 'Bevat hij woorden waarop mensen werkelijk zoeken?' },
  { key: 'credibility', label: 'Geloofwaardigheid en dekking', max: 10,
    question: 'Maakt de video letterlijk waar wat de titel belooft?' },
]

export const TITLE_BANDS: Band[] = [
  { min: 85, label: 'Sterk' },
  { min: 70, label: 'Bruikbaar, met een aanpassing' },
  { min: 55, label: 'Zwak' },
  { min: 0, label: 'Niet gebruiken' },
]

/** Constructies die alleen mogen als de inhoud ze echt draagt. */
const HOLLOW_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /je (gelooft|raadt) (het )?nooit|you won'?t believe/i, label: '"je gelooft nooit"' },
  { pattern: /dit verandert alles|this changes everything/i, label: '"dit verandert alles"' },
  { pattern: /de waarheid over|the truth about/i, label: '"de waarheid over"' },
  { pattern: /(artsen|dokters|experts) (haten|willen niet)|doctors hate/i, label: '"artsen haten dit"' },
  { pattern: /zal ons (doden|vernietigen)|will kill us/i, label: '"gaat ons vernietigen"' },
  { pattern: /niemand (vertelt|zegt) je|nobody tells you/i, label: '"niemand vertelt je"' },
  { pattern: /shocking|schokkend/i, label: '"schokkend"' },
]

export interface TitleCandidate {
  title: string
  style: TitleStyle
  /** Waarom deze titel gedekt wordt door de inhoud. Leeg = niet onderbouwd. */
  coverage: string
}

export interface ScoredTitle {
  title: string
  style: TitleStyle
  scorecard: Scorecard
  strongest: string
  weakness: string
  recommendedRevision: string
  /** Waarom de titel is afgekeurd, als dat zo is. */
  blocked?: string
}

export interface TitleLabResult {
  scored: ScoredTitle[]
  topThree: ScoredTitle[]
  winner?: ScoredTitle
  winnerReason: string
}

/**
 * Deterministische correcties, bovenop het oordeel van het model. Ze kunnen
 * een score alleen verlagen, nooit verhogen — een model dat zijn eigen titel
 * beoordeelt, is optimistisch, en dat is precies waar dit tegen beschermt.
 */
export function applyTitleRules(
  card: Scorecard, candidate: TitleCandidate,
): { card: Scorecard; blocked?: string } {
  let next = card
  const t = candidate.title

  if (t.length > 60) {
    next = capCategory(next, 'clarity', 12,
      `${t.length} tekens; boven ongeveer 60 valt het einde weg in de weergave.`)
  }

  const hollow = HOLLOW_PATTERNS.find((h) => h.pattern.test(t))
  if (hollow && !candidate.coverage) {
    return {
      card: capCategory(next, 'credibility', 0,
        `${hollow.label} zonder onderbouwing dat de video dit waarmaakt.`),
      blocked: `Gebruikt ${hollow.label} en er staat niet bij hoe de video dat waarmaakt. ` +
        'Zulke constructies mogen alleen als de inhoud ze draagt.',
    }
  }
  if (hollow) {
    next = capCategory(next, 'credibility', 6,
      `${hollow.label} is een zware belofte; de dekking is onderbouwd maar blijft een risico.`)
  }

  const shoutedWords = t.split(/\s+/).filter((w) => w.length > 3 && w === w.toUpperCase() && /\p{L}/u.test(w))
  if (shoutedWords.length > 1) {
    next = capCategory(next, 'credibility', 5,
      `${shoutedWords.length} woorden in hoofdletters. Eén mag; meer leest als schreeuwen.`)
  }
  if (/[!?]{2,}|\.{3,}/.test(t)) {
    next = capCategory(next, 'clarity', 12, 'Opeenstapeling van leestekens.')
  }
  if (!candidate.coverage) {
    next = capCategory(next, 'credibility', 5,
      'Geen onderbouwing dat de video deze belofte waarmaakt.')
  }
  return { card: next }
}

export function scoreTitles(
  candidates: TitleCandidate[],
  rawScores: Record<string, Parameters<typeof buildScorecard>[1]>,
  opts: { seedTitles: string[]; topic: string },
): TitleLabResult {
  const screened = screenTitles({
    candidates: candidates.map((c) => c.title),
    seeds: opts.seedTitles,
    topic: opts.topic,
  })
  const tooClose = new Map(screened.rejected.map((r) => [r.title, r]))

  const scored: ScoredTitle[] = candidates.map((candidate) => {
    const base = buildScorecard(TITLE_CATEGORIES, rawScores[candidate.title] ?? [], TITLE_BANDS)
    const { card, blocked } = applyTitleRules(base, candidate)

    const near = tooClose.get(candidate.title)
    const finalBlocked = near
      ? `Ligt te dicht bij een referentietitel: ${Math.round(near.distance.bigramOverlap * 100)}% ` +
        'van de woordparen is gedeeld.'
      : blocked

    const sorted = [...card.categories].sort((a, b) => (b.score / b.max) - (a.score / a.max))
    const best = sorted[0]
    const worst = sorted[sorted.length - 1]

    return {
      title: candidate.title,
      style: candidate.style,
      scorecard: card,
      strongest: best ? `${best.key}: ${best.reasoning}` : '',
      weakness: worst ? `${worst.key}: ${worst.reasoning}` : '',
      recommendedRevision: worst?.improvements[0]
        ?? 'Geen concrete verbetering voorgesteld.',
      ...(finalBlocked ? { blocked: finalBlocked } : {}),
    }
  })

  const usable = scored.filter((s) => !s.blocked)
    .sort((a, b) => b.scorecard.total - a.scorecard.total)
  const topThree = usable.slice(0, 3)
  const winner = topThree[0]

  return {
    scored,
    topThree,
    ...(winner ? { winner } : {}),
    winnerReason: winner
      ? `${winner.scorecard.total}/100 — sterkste punt: ${winner.strongest}`
      : 'Geen enkele titel haalde het. Alle opties zijn geblokkeerd of te zwak; ' +
        'genereer opnieuw met een scherpere stelling.',
  }
}
