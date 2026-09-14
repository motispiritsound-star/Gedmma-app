import type { KnowledgePack } from '../knowledge/types.js'
import type { NicheEvaluation } from './niche.js'
import { checkFocus } from './niche.js'
import type { ScoredTitle } from './titles.js'
import type { ScoredThumbnail } from './thumbnails.js'
import type { PacingReport } from './pacing.js'

/**
 * De kwaliteitspoort uit stap 13. Belangrijk verschil met de poorten in
 * `domain/gates.ts`: die blokkeren een productie. Deze poort **wijst niet af
 * maar stuurt terug**, met per bevinding genoeg houvast om er een betere versie
 * van te maken. Een afwijzing zonder aanwijzing levert alleen een tweede poging
 * op die net zo goed mis kan zijn.
 */

export type Severity = 'blokkeert' | 'herzien' | 'let op'

export interface Finding {
  check: string
  severity: Severity
  what: string
  /** Concreet: wat er anders moet in de volgende versie. */
  revise: string
}

export interface QualityGateResult {
  passed: boolean
  findings: Finding[]
  /** Instructie voor de hergeneratie. Leeg wanneer alles goed is. */
  revisionBrief: string
}

export interface GateInput {
  pack: KnowledgePack
  niche?: NicheEvaluation
  titles?: ScoredTitle[]
  thumbnails?: ScoredThumbnail[]
  pacing?: PacingReport
  /** Aantal video-ideeën dat de niche kan dragen. */
  ideaCount?: number
  /** Uren per week die de gekozen frequentie kost, geschat. */
  estimatedHoursPerWeek?: number
  /** Claims die geen bron hebben. */
  unsourcedClaims?: string[]
  /** Concepten die te veel op een eerder idee lijken. */
  duplicateOf?: string
}

export function runQualityGate(input: GateInput): QualityGateResult {
  const findings: Finding[] = []
  const add = (check: string, severity: Severity, what: string, revise: string) =>
    findings.push({ check, severity, what, revise })

  // --- Publiek en focus ----------------------------------------------------
  if (!input.pack.audience.description.trim()) {
    add('publiek_expliciet', 'blokkeert',
      'Het doelpubliek staat nergens beschreven.',
      'Vul `audience.description` in knowledge/publiek.yaml. Zonder publiek is ' +
      'elke andere beoordeling een gok.')
  }

  if (input.niche) {
    const focus = checkFocus(input.niche.proposal.proposition)
    if (!focus.focused) {
      add('niche_toegespitst', 'herzien', focus.reason,
        'Zet het brede onderwerp om in een voorstel dat publiek, vorm én ' +
        'invalshoek benoemt. Niet "islamitische content" maar wat het precies is.')
    }

    const advantage = input.niche.scorecard.categories.find((c) => c.key === 'creator_advantage')
    if (advantage && advantage.score < 8) {
      add('eigen_voorsprong', 'herzien',
        `Eigen voorsprong scoort ${advantage.score}/${advantage.max}.`,
        'Zoek de invalshoek waar de maker wél voorsprong heeft: taal, cultuur, ' +
        'toegang, beroep. Zonder die voorsprong wint het kanaal het niet van ' +
        'iemand met meer budget.')
    }

    const original = input.niche.scorecard.categories.find((c) => c.key === 'original_positioning')
    if (original && original.score < 8) {
      add('betekenisvol_anders', 'herzien',
        `Originele positionering scoort ${original.score}/${original.max}.`,
        'Benoem één ding dat dit kanaal doet en de bestaande kanalen niet. ' +
        'Lukt dat niet, dan is er nog geen kanaal.')
    }

    if (input.niche.scorecard.total < 55) {
      add('nichescore', 'blokkeert',
        `Nichescore ${input.niche.scorecard.total}/100 — onder de ondergrens.`,
        'Herpositioneer vanaf het makersprofiel en scoor opnieuw.')
    }
  }

  if (input.ideaCount !== undefined && input.ideaCount < 50) {
    add('vijftig_videos', 'herzien',
      `De niche draagt ${input.ideaCount} ideeën; vijftig is de ondergrens.`,
      'Verbreed de inhoudspijlers, of accepteer dat dit een serie is en geen kanaal.')
  }

  // --- Titel ---------------------------------------------------------------
  const usableTitles = (input.titles ?? []).filter((t) => !t.blocked)
  if (input.titles && usableTitles.length === 0) {
    add('titel_dekt_inhoud', 'blokkeert',
      'Geen enkele titeloptie is bruikbaar.',
      'Genereer opnieuw vanuit de stelling. Laat holle constructies weg en ' +
      'schrijf per titel op hoe de video de belofte waarmaakt.')
  }
  for (const t of input.titles ?? []) {
    if (t.blocked) {
      add('titel_misleidend', 'herzien', `"${t.title}" — ${t.blocked}`, t.recommendedRevision)
    }
  }

  // --- Thumbnail -----------------------------------------------------------
  const usableThumbs = (input.thumbnails ?? []).filter((t) => !t.blocked)
  if (input.thumbnails && usableThumbs.length === 0) {
    add('thumbnail_bruikbaar', 'blokkeert',
      'Geen enkel thumbnailconcept is bruikbaar.',
      'Neem de uitsluitingslijst op in elk concept en beperk de tekst tot vier woorden.')
  }
  for (const t of input.thumbnails ?? []) {
    if (t.blocked) {
      add('thumbnail_overladen', 'herzien', `"${t.concept.conceptName}" — ${t.blocked}`,
        'Eén dominant beeld, maximaal vier woorden, en de uitsluitingen expliciet.')
    }
    const mobile = t.scorecard.categories.find((c) => c.key === 'mobile_readability')
    if (mobile && mobile.score < mobile.max * 0.5) {
      add('mobiel_leesbaar', 'herzien',
        `"${t.concept.conceptName}" scoort ${mobile.score}/${mobile.max} op mobiel.`,
        'Groter hoofdonderwerp, minder tekst, meer contrast tussen voor- en achtergrond.')
    }
  }

  // --- Script en tempo -----------------------------------------------------
  for (const problem of input.pacing?.problems ?? []) {
    add('tempo', 'herzien', problem,
      'Herschrijf het betreffende deel; de hook voorop, de haken vaker, en de ' +
      'eerste beloning binnen dertig seconden.')
  }

  // --- Feiten --------------------------------------------------------------
  for (const claim of input.unsourcedClaims ?? []) {
    add('claims_controleerbaar', 'blokkeert',
      `Claim zonder bron: "${claim.slice(0, 80)}"`,
      'Zoek de vindplaats op, of laat de claim weg. Niet afzwakken.')
  }

  // --- Herhaling en haalbaarheid -------------------------------------------
  if (input.duplicateOf) {
    add('dubbel_concept', 'herzien',
      `Lijkt te sterk op een eerder idee: ${input.duplicateOf}.`,
      'Stel een andere vraag over hetzelfde onderwerp, of kies een ander onderwerp. ' +
      'Twee video\'s die hetzelfde zeggen, tellen als sjabloon.')
  }

  const budget = input.pack.creator.hoursPerWeek
  if (budget > 0 && input.estimatedHoursPerWeek && input.estimatedHoursPerWeek > budget) {
    add('werkdruk_realistisch', 'herzien',
      `Geschat ${input.estimatedHoursPerWeek} uur per week tegen ${budget} beschikbaar.`,
      'Verlaag de frequentie of vereenvoudig het format. Een plan dat niet past, ' +
      'wordt na drie weken stilletjes verlaten.')
  }

  const blocking = findings.filter((f) => f.severity === 'blokkeert')
  const revise = findings.filter((f) => f.severity === 'herzien')

  const revisionBrief = findings.length === 0 ? '' : [
    'Maak een sterkere versie. Wat er precies anders moet:',
    ...[...blocking, ...revise].map((f, i) => `${i + 1}. ${f.what}\n   → ${f.revise}`),
    '',
    'Leg bij de nieuwe versie uit wat je hebt veranderd en waarom dat het ' +
    'genoemde probleem oplost.',
  ].join('\n')

  return { passed: blocking.length === 0 && revise.length === 0, findings, revisionBrief }
}
