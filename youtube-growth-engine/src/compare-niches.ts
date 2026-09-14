/**
 * `npm run niches` — scoort de kandidaten uit knowledge/niches.yaml.
 *
 * De scores in dat bestand zijn een redactioneel oordeel. Wat hier gebeurt is
 * het rekenwerk dat dat oordeel niet mag doen: maxima afdwingen, optellen,
 * begrenzen en classificeren.
 */
import { readFile } from 'node:fs/promises'
import { parse } from 'yaml'
import { loadKnowledge } from './knowledge/load.js'
import { NICHE_BANDS, NICHE_CATEGORIES, checkFocus, scoreNiche } from './studio/niche.js'
import { capCategory, excludeCategories, formatScorecard } from './studio/scoring.js'
import { CreatorProfileSchema } from './knowledge/types.js'

interface Scoring {
  /** Categorieën die niet meetellen. De rest wordt herschaald naar 100. */
  excludeCategories?: string[]
}

interface Candidate {
  key: string
  proposition: string
  /** False = deze niche gebruikt de voorsprong van de maker niet. */
  usesAdvantage: boolean
  scores: Record<string, number>
  notes: string
}

async function main(): Promise<void> {
  const raw = parse(await readFile('knowledge/niches.yaml', 'utf8')) as {
    candidates: Candidate[]; scoring?: Scoring
  }
  const excluded = raw.scoring?.excludeCategories ?? []
  const { pack } = await loadKnowledge()
  const hypothesisOnly = process.env['EXTERNAL_DATA'] !== 'true'

  console.log('\n================ NICHES VERGELEKEN ================\n')
  if (excluded.length > 0) {
    console.log(`Weggelaten categorieën: ${excluded.join(', ')} — de rest is herschaald naar 100.`)
    console.log('De score meet daarmee nog alleen de markt, niet jouw positie erin.')
  } else {
    console.log(`Eigen voorsprong in het profiel: ${pack.creator.unfairAdvantage.length} punt(en)`)
    for (const a of pack.creator.unfairAdvantage) console.log(`  - ${a}`)
  }
  if (hypothesisOnly) {
    console.log('\nGeen externe data: publieksvraag en concurrentiekans krijgen een plafond.')
    console.log('Koppel vidIQ om die eraf te halen.')
  }

  const results = raw.candidates.map((c) => {
    const rows = NICHE_CATEGORIES.map((spec) => ({
      key: spec.key,
      score: c.scores[spec.key] ?? 0,
      reasoning: c.notes.trim(),
    }))

    // Een voorsprong telt alleen mee in een niche die hem gebruikt. Nederlands
    // spreken helpt je niet in een Engelstalige AI-niche, en cultuurkennis
    // helpt je niet bij hypotheekrente.
    const profile = c.usesAdvantage
      ? pack.creator
      : CreatorProfileSchema.parse({ ...pack.creator, unfairAdvantage: [] })

    let card = scoreNiche(rows, profile, { hypothesisOnly })
    if (!c.usesAdvantage && !excluded.includes('creator_advantage')) {
      card = capCategory(card, 'creator_advantage', 5,
        'Deze niche gebruikt de voorsprong van de maker niet.')
      const band = [...NICHE_BANDS].sort((a, b) => b.min - a.min).find((b) => card.total >= b.min)
      card = { ...card, classification: band?.label ?? card.classification }
    }
    if (excluded.length > 0) {
      card = excludeCategories(card, excluded)
      const band = [...NICHE_BANDS].sort((a, b) => b.min - a.min).find((b) => card.total >= b.min)
      card = { ...card, classification: band?.label ?? card.classification }
    }
    return { candidate: c, card }
  }).sort((a, b) => b.card.total - a.card.total)

  for (const { candidate, card } of results) {
    console.log(`\n${'─'.repeat(64)}`)
    console.log(`  ${card.total}/100  ${candidate.key}  — ${card.classification}`)
    console.log(`  ${candidate.proposition.trim().replace(/\s+/g, ' ')}`)
    const focus = checkFocus(candidate.proposition)
    if (!focus.focused) console.log(`  FOCUS: ${focus.reason}`)
    console.log(formatScorecard(card))
    console.log(`  ${candidate.notes.trim().replace(/\s+/g, ' ')}`)
  }

  const winner = results[0]
  const runnerUp = results[1]
  console.log(`\n${'='.repeat(64)}`)
  if (!winner) return
  console.log(`  WINNAAR: ${winner.candidate.key} (${winner.card.total}/100)`)
  if (runnerUp) {
    const gap = winner.card.total - runnerUp.card.total
    console.log(`  Verschil met nummer twee: ${gap} punt(en).`)
    if (excluded.length === 0) {
      const advantageGap =
        (winner.card.categories.find((c) => c.key === 'creator_advantage')?.score ?? 0) -
        (runnerUp.card.categories.find((c) => c.key === 'creator_advantage')?.score ?? 0)
      if (advantageGap >= gap && gap > 0) {
        console.log('\n  Het verschil zit volledig in iets dat een concurrent niet kan')
        console.log('  kopiëren. Zonder die voorsprong zouden deze twee gelijk staan.')
      }
    }
  }
  console.log()
}

main().catch((e: unknown) => { console.error(e); process.exitCode = 1 })
