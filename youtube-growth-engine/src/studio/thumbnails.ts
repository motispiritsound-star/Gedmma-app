import type { Band, CategorySpec, Scorecard } from './scoring.js'
import { buildScorecard, capCategory } from './scoring.js'

export const THUMBNAIL_CATEGORIES: CategorySpec[] = [
  { key: 'immediate_clarity', label: 'Directe helderheid', max: 20,
    question: 'Is in een oogopslag duidelijk waar dit over gaat?' },
  { key: 'visual_impact', label: 'Visuele kracht', max: 20,
    question: 'Valt hij op tussen twintig andere thumbnails?' },
  { key: 'mobile_readability', label: 'Leesbaarheid op mobiel', max: 15,
    question: 'Werkt hij op een duimnagel van 4 centimeter?' },
  { key: 'emotion', label: 'Emotionele kracht', max: 15,
    question: 'Zit er spanning of herkenning in?' },
  { key: 'curiosity', label: 'Nieuwsgierigheid', max: 10,
    question: 'Roept hij een vraag op die de titel niet al beantwoordt?' },
  { key: 'brand_consistency', label: 'Merkherkenning', max: 10,
    question: 'Herkent een terugkerende kijker dit als ons kanaal?' },
  { key: 'alignment', label: 'Aansluiting op titel en video', max: 10,
    question: 'Belooft hij hetzelfde als de titel, zonder het te herhalen?' },
]

export const THUMBNAIL_BANDS: Band[] = [
  { min: 85, label: 'Sterk' },
  { min: 70, label: 'Bruikbaar' },
  { min: 55, label: 'Zwak' },
  { min: 0, label: 'Niet gebruiken' },
]

export interface ThumbnailConcept {
  conceptName: string
  visualSubject: string
  /** Bij een faceless kanaal: het emotionele signaal zonder gezicht. */
  emotionalSignal: string
  background: string
  composition: string
  /** Twee tot vier woorden. Niet de titel herhalen. */
  text: string
  palette: string[]
  contrastStrategy: string
  supportingSymbol: string
  exclude: string[]
  imagePrompt: string
  whyItComplementsTheTitle: string
}

export interface ScoredThumbnail {
  concept: ThumbnailConcept
  scorecard: Scorecard
  blocked?: string
}

export interface PairScore {
  title: string
  concept: string
  titleScore: number
  thumbnailScore: number
  /** Gewogen: titel en thumbnail wegen even zwaar, min de overlapstraf. */
  combined: number
  note: string
}

const SAFE_TEXT_WORDS = 4

/** Woorden die in elke thumbnail van dit kanaal verboden blijven. */
export const ALWAYS_EXCLUDE = [
  'gezicht van een profeet of metgezel',
  'realistisch mensportret dat als historische figuur leest',
  'logo van een derde partij',
  'watermerk',
]

/**
 * Deterministische correcties. Net als bij titels kunnen ze alleen verlagen.
 * Ze vangen precies de dingen die op een groot scherm goed lijken en op een
 * telefoon verdwijnen.
 */
export function applyThumbnailRules(
  card: Scorecard, concept: ThumbnailConcept, title: string,
): { card: Scorecard; blocked?: string } {
  let next = card
  const words = concept.text.trim().split(/\s+/).filter(Boolean)

  if (words.length > SAFE_TEXT_WORDS) {
    next = capCategory(next, 'mobile_readability', 7,
      `${words.length} woorden tekst. Boven de ${SAFE_TEXT_WORDS} is het op een ` +
      'telefoon niet meer te lezen.')
  }

  const normalise = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').trim()
  if (normalise(concept.text) && normalise(title).includes(normalise(concept.text))) {
    next = capCategory(next, 'alignment', 4,
      'De thumbnailtekst staat letterlijk in de titel. Samen vertellen ze dan ' +
      'één ding in plaats van twee die elkaar versterken.')
  }

  // Eén dominant idee. Een opsomming in het onderwerp verraadt er meer.
  const subjectParts = concept.visualSubject.split(/,| en | plus /i).filter((p) => p.trim())
  if (subjectParts.length > 2) {
    next = capCategory(next, 'immediate_clarity', 11,
      `${subjectParts.length} visuele onderwerpen. Eén dominant idee leest sneller.`)
  }

  if (concept.palette.length === 0) {
    next = capCategory(next, 'brand_consistency', 5, 'Geen kleuren vastgelegd.')
  }

  const missingGuard = ALWAYS_EXCLUDE.filter(
    (rule) => !concept.exclude.some((e) => e.toLowerCase().includes(rule.split(' ')[0]!.toLowerCase())),
  )
  if (missingGuard.length > 0) {
    return {
      card: next,
      blocked: `De uitsluitingslijst mist: ${missingGuard.join('; ')}. Dit kanaal ` +
        'beeldt geen profeten of metgezellen af, en dat hoort in elke prompt te staan.',
    }
  }

  return { card: next }
}

export function scoreThumbnails(
  concepts: ThumbnailConcept[],
  rawScores: Record<string, Parameters<typeof buildScorecard>[1]>,
  title: string,
): ScoredThumbnail[] {
  return concepts.map((concept) => {
    const base = buildScorecard(THUMBNAIL_CATEGORIES, rawScores[concept.conceptName] ?? [], THUMBNAIL_BANDS)
    const { card, blocked } = applyThumbnailRules(base, concept, title)
    return { concept, scorecard: card, ...(blocked ? { blocked } : {}) }
  })
}

/**
 * Combineert titel en thumbnail. De straf is het punt: als beide hetzelfde
 * zeggen, is de combinatie zwakker dan de delen. De titel geeft context, de
 * thumbnail maakt de spanning — niet twee keer hetzelfde.
 */
export function pairTitleAndThumbnail(
  titles: { title: string; total: number }[],
  thumbnails: ScoredThumbnail[],
): PairScore[] {
  const pairs: PairScore[] = []
  const words = (s: string) => new Set(
    s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter((w) => w.length > 3),
  )

  for (const t of titles) {
    for (const th of thumbnails) {
      if (th.blocked) continue
      const a = words(t.title)
      const b = words(th.concept.text)
      const shared = [...b].filter((w) => a.has(w)).length
      const overlap = b.size === 0 ? 0 : shared / b.size
      const penalty = Math.round(overlap * 15)
      const combined = Math.round((t.total + th.scorecard.total) / 2) - penalty
      pairs.push({
        title: t.title,
        concept: th.concept.conceptName,
        titleScore: t.total,
        thumbnailScore: th.scorecard.total,
        combined,
        note: penalty > 0
          ? `-${penalty} omdat ${Math.round(overlap * 100)}% van de thumbnailtekst ook in de titel staat.`
          : 'Titel en thumbnail zeggen elk iets anders.',
      })
    }
  }
  return pairs.sort((x, y) => y.combined - x.combined)
}
