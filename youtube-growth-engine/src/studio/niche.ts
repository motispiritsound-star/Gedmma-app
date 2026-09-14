import type { Band, CategorySpec, Scorecard } from './scoring.js'
import { buildScorecard, capCategory } from './scoring.js'
import type { CreatorProfile } from '../knowledge/types.js'

/** Het scoremodel uit de opdracht. Tien categorieën, honderd punten. */
export const NICHE_CATEGORIES: CategorySpec[] = [
  { key: 'audience_demand', label: 'Publieksvraag', max: 15,
    question: 'Kijkt of zoekt een voldoende duidelijk publiek hier actief naar?' },
  { key: 'creator_advantage', label: 'Affiniteit en eigen voorsprong', max: 15,
    question: 'Heeft de maker kennis, ervaring, toegang, taal of cultuurbegrip dat een concurrent niet makkelijk kopieert?' },
  { key: 'original_positioning', label: 'Originele positionering', max: 15,
    question: 'Wijkt de invalshoek duidelijk af van bestaande generieke kanalen?' },
  { key: 'evergreen', label: 'Evergreen-potentie', max: 10,
    question: 'Blijft de content ook na publicatie kijkers trekken?' },
  { key: 'scalability', label: 'Schaalbaarheid van de inhoud', max: 10,
    question: 'Zijn er minstens 50 sterke, niet-herhalende video-ideeën te maken?' },
  { key: 'title_thumbnail', label: 'Titel- en thumbnailpotentie', max: 10,
    question: 'Levert het onderwerp consequent heldere beeldconcepten en sterke titels op?' },
  { key: 'competition', label: 'Concurrentiekans', max: 10,
    question: 'Is er ruimte om binnen te komen met een onderscheidend voorstel?' },
  { key: 'production_feasibility', label: 'Productiehaalbaarheid', max: 5,
    question: 'Kan de maker dit met de opgegeven tijd en het opgegeven budget volhouden?' },
  { key: 'credibility', label: 'Vertrouwen en controleerbaarheid', max: 5,
    question: 'Zijn claims te onderbouwen met betrouwbare informatie of echte deskundigheid?' },
  { key: 'monetisation', label: 'Verdienpotentie', max: 5,
    question: 'Zijn er relevante en integere inkomstenbronnen?' },
]

export const NICHE_BANDS: Band[] = [
  { min: 85, label: 'Zeer sterke kans' },
  { min: 70, label: 'Kansrijk, positionering aanscherpen' },
  { min: 55, label: 'Zwakke differentiatie of uitvoeringsrisico' },
  { min: 0, label: 'Niet aanbevolen zonder grondige herpositionering' },
]

export interface NicheProposal {
  /** Het brede onderwerp waar dit uit voortkomt. */
  broadSubject: string
  /** Het toegespitste kanaalvoorstel. Dit is wat beoordeeld wordt. */
  proposition: string
  /** Eén zin: voor wie, wat ze krijgen, waarom anders. */
  positioningStatement: string
  targetAudience: string
  whyThisCreator: string
  contentPillars: string[]
  exampleIdeas: string[]
}

export interface NicheEvaluation {
  proposal: NicheProposal
  scorecard: Scorecard
  /** Aannames die niet met data zijn onderbouwd. */
  assumptions: string[]
  risks: string[]
  improvements: string[]
  /** Score nadat de verbeteringen zouden zijn doorgevoerd. */
  improvedScore?: number
  researchSources: { url: string; note: string; retrievedAt: string }[]
  /** True wanneer er geen actuele externe data beschikbaar was. */
  hypothesisOnly: boolean
  evaluatedAt: string
}

/** Brede onderwerpen die als propositie niet volstaan. */
const BROAD_SUBJECTS = [
  'gezondheid', 'health', 'islam', 'religie', 'ai', 'technologie', 'tech',
  'reizen', 'travel', 'motivatie', 'motivation', 'geld', 'finance', 'fitness',
  'eten', 'food', 'geschiedenis', 'history', 'onderwijs', 'education',
]

export interface FocusCheck {
  focused: boolean
  reason: string
}

/**
 * Controleert of een propositie toegespitst genoeg is. "Islamitische content"
 * is geen kanaal; "korte cinematische verhalen die klassieke lessen aan
 * alledaagse problemen koppelen" wel.
 *
 * De maat is grof met opzet: hij hoeft alleen het verschil te zien tussen een
 * onderwerp en een voorstel.
 */
export function checkFocus(proposition: string): FocusCheck {
  const words = proposition.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/).filter((w) => w.length > 2)

  if (words.length < 6) {
    return {
      focused: false,
      reason: `"${proposition}" is een onderwerp, geen voorstel. Een propositie ` +
        'benoemt publiek, vorm en invalshoek, en dat kost meer dan een paar woorden.',
    }
  }
  const onlyBroad = words.every((w) => BROAD_SUBJECTS.includes(w) ||
    ['content', 'video', 'kanaal', 'over', 'voor', 'channel', 'videos'].includes(w))
  if (onlyBroad) {
    return {
      focused: false,
      reason: `"${proposition}" bestaat alleen uit brede termen. Vertaal het naar ` +
        'een voorstel: voor wie, in welke vorm, met welke invalshoek.',
    }
  }
  return { focused: true, reason: 'Propositie benoemt publiek, vorm of invalshoek.' }
}

/**
 * Rekent de nichescore uit en past twee begrenzingen toe die het model niet
 * zelf mag omzeilen:
 *
 *  - Geen eigen voorsprong in het makersprofiel? Dan kan categorie 2 niet hoog
 *    scoren, hoe enthousiast de onderbouwing ook is. Dit is de enige categorie
 *    waarin een model geneigd is te vleien, omdat "passie" altijd te beweren is.
 *  - Geen actuele externe data? Dan gaat er een plafond op publieksvraag en
 *    concurrentiekans, want dat zijn precies de twee die je zonder cijfers niet
 *    kunt weten.
 */
export function scoreNiche(
  raw: Parameters<typeof buildScorecard>[1],
  creator: CreatorProfile,
  opts: { hypothesisOnly: boolean },
): Scorecard {
  let card = buildScorecard(NICHE_CATEGORIES, raw, NICHE_BANDS)

  const advantages = creator.unfairAdvantage.filter((a) => a.trim().length > 0)
  if (advantages.length === 0) {
    card = capCategory(card, 'creator_advantage', 5,
      'Het makersprofiel noemt geen eigen voorsprong. Passie alleen is geen ' +
      'voorsprong: een concurrent kan die ook hebben.')
  } else if (advantages.length < 3) {
    card = capCategory(card, 'creator_advantage', 11,
      `Het profiel noemt ${advantages.length} punt(en) voorsprong. Volle punten ` +
      'vragen meerdere dingen die samen niet te kopiëren zijn.')
  }

  if (opts.hypothesisOnly) {
    card = capCategory(card, 'audience_demand', 11,
      'Geen actuele externe data beschikbaar; publieksvraag is een hypothese.')
    card = capCategory(card, 'competition', 7,
      'Geen actuele externe data beschikbaar; concurrentiebeeld is een hypothese.')
  }

  const band = [...NICHE_BANDS].sort((a, b) => b.min - a.min).find((b) => card.total >= b.min)
  return { ...card, classification: band?.label ?? card.classification }
}

export function recommendation(evaluation: NicheEvaluation): string {
  const { total } = evaluation.scorecard
  if (total >= 85) return 'Beginnen. Deze propositie is scherp genoeg.'
  if (total >= 70) {
    return 'Kansrijk, maar scherp de positionering aan voordat je begint. ' +
      'De verbeteringen hieronder zijn niet optioneel.'
  }
  if (total >= 55) {
    return 'Nog niet. De differentiatie is te zwak of de uitvoering te zwaar; ' +
      'herpositioneer eerst en scoor opnieuw.'
  }
  return 'Afgeraden in deze vorm. Terug naar het makersprofiel: waar zit de ' +
    'voorsprong die niemand kan kopiëren?'
}
