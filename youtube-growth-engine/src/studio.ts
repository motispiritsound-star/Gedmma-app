/**
 * `npm run studio` — de werkstroom van makersprofiel tot gekozen titel en
 * thumbnail. Alles wordt opgeslagen, dus je kunt later verder.
 *
 *   npm run studio                    # hele stroom, slaat een project op
 *   npm run studio -- --project <id>  # verder op een bestaand project
 *   npm run studio -- --list          # welke projecten er zijn
 */
import { loadKnowledge } from './knowledge/load.js'
import { MockStudioProvider, type StudioProvider } from './studio/provider.js'
import { ProjectStore, compareNiches, type VideoIdea } from './studio/project.js'
import { checkFocus, recommendation, scoreNiche, type NicheEvaluation } from './studio/niche.js'
import { scoreTitles } from './studio/titles.js'
import { pairTitleAndThumbnail, scoreThumbnails } from './studio/thumbnails.js'
import { runQualityGate } from './studio/quality-gate.js'
import { formatScorecard } from './studio/scoring.js'
import { randomUUID } from 'node:crypto'

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}
const has = (name: string) => process.argv.includes(`--${name}`)

const rule = (t: string) => `\n${'='.repeat(64)}\n  ${t}\n${'='.repeat(64)}`

async function main(): Promise<void> {
  const store = new ProjectStore(process.env['PROJECT_PATH'] ?? '.data/projecten.json')

  if (has('list')) {
    const all = await store.list()
    if (all.length === 0) console.log('\nNog geen projecten. Draai `npm run studio`.\n')
    for (const p of all) {
      console.log(`  ${p.id}  ${p.name.padEnd(34)} ${p.ideas.length} ideeën  ${p.updatedAt.slice(0, 10)}`)
    }
    return
  }

  const { pack, filesRead, warnings } = await loadKnowledge()
  const studio: StudioProvider = new MockStudioProvider()

  console.log(rule('1. MAKERSPROFIEL'))
  console.log(`  gelezen: ${filesRead.length > 0 ? filesRead.join(', ') : 'niets — knowledge/ is leeg'}`)
  for (const w of warnings) console.log(`  let op: ${w}`)
  console.log(`  eigen voorsprong: ${pack.creator.unfairAdvantage.length} punt(en)`)
  if (pack.creator.unfairAdvantage.length === 0) {
    console.log('  → Zonder eigen voorsprong wordt categorie 2 begrensd op 5 van de 15.')
    console.log('    Vul knowledge/publiek.yaml aan bij `creator.unfairAdvantage`.')
  }
  console.log(`  redactie: ${studio.name} ${studio.simulated ? '(GESIMULEERD)' : '(ECHT)'}`)

  const existingId = arg('project')
  let project = existingId ? await store.get(existingId) : undefined
  if (existingId && !project) { console.error(`\nProject ${existingId} bestaat niet.\n`); process.exit(1) }
  project ??= await store.create(arg('name') ?? 'Naamloos kanaal', pack.creator)

  // --- 2. Niches -----------------------------------------------------------
  console.log(rule('2. NICHEVOORSTELLEN'))
  const hypothesisOnly = process.env['EXTERNAL_DATA'] !== 'true'
  if (hypothesisOnly) {
    console.log('  Geen actuele externe data. Alles hieronder is hypothese, en')
    console.log('  publieksvraag en concurrentiekans krijgen daarom een plafond.')
  }

  if (!project.locked.includes('niches') || project.evaluations.length === 0) {
    const proposals = await studio.proposeNiches(pack, 2)
    const evaluations: NicheEvaluation[] = []
    for (const proposal of proposals) {
      const focus = checkFocus(proposal.proposition)
      const raw = await studio.scoreNiche(proposal, pack)
      const card = scoreNiche(raw, pack.creator, { hypothesisOnly })
      evaluations.push({
        proposal,
        scorecard: card,
        assumptions: raw.flatMap((r) => r.assumptions ?? []),
        risks: focus.focused ? [] : [focus.reason],
        improvements: raw.flatMap((r) => r.improvements ?? []),
        researchSources: [],
        hypothesisOnly,
        evaluatedAt: new Date().toISOString(),
      })
    }
    project.evaluations = evaluations
    await store.save(project)
  }

  for (const [i, e] of project.evaluations.entries()) {
    console.log(`\n  #${i + 1}  ${e.proposal.proposition}`)
    const focus = checkFocus(e.proposal.proposition)
    if (!focus.focused) console.log(`      FOCUS: ${focus.reason}`)
    console.log(formatScorecard(e.scorecard))
    console.log(`  ${recommendation(e)}`)
  }

  console.log(rule('3. NAAST ELKAAR'))
  console.log(compareNiches(project.evaluations))

  const best = [...project.evaluations].sort((a, b) => b.scorecard.total - a.scorecard.total)[0]
  if (!best || best.scorecard.total < 55) {
    console.log('\n  Geen enkele propositie haalt de ondergrens. Terug naar het profiel.\n')
    return
  }
  project.selectedNiche = best.proposal.proposition
  project.positioning = await studio.buildPositioning(best.proposal, pack)
  await store.save(project)

  // --- 4. Positionering en ideeën -------------------------------------------
  console.log(rule('4. POSITIONERING'))
  const pos = project.positioning
  console.log(`  ${pos.statement}`)
  console.log(`  publiek:        ${pos.audience}`)
  console.log(`  onderscheidend: ${pos.differentiator}`)
  console.log(`  pijlers:        ${pos.contentPillars.join(' · ')}`)
  console.log(`  ritme:          ${pos.publicationRhythm}`)

  const wanted = Number(arg('ideas') ?? 30)
  if (project.ideas.length === 0) {
    const generated = await studio.generateIdeas(pos, wanted)
    project.ideas = generated.map((g) => ({ ...g, id: randomUUID().slice(0, 6), status: 'open', revision: 1 }))
    await store.save(project)
  }
  console.log(`\n  ${project.ideas.length} video-ideeën, verdeeld over ${new Set(project.ideas.map((i) => i.contentPillar)).size} pijlers.`)

  // --- 5. Titel- en thumbnaillab op het eerste idee -------------------------
  const idea: VideoIdea = project.ideas[0]!
  console.log(rule(`5. TITEL LAB — "${idea.concept}"`))

  const candidates = await studio.generateTitles(idea, pos)
  const rawTitleScores: Record<string, Awaited<ReturnType<StudioProvider['scoreTitle']>>> = {}
  for (const c of candidates) rawTitleScores[c.title] = await studio.scoreTitle(c, idea)

  const seeds = pack.references.map((r) => r.title).filter(Boolean)
  const titleResult = scoreTitles(candidates, rawTitleScores, { seedTitles: seeds, topic: idea.concept })

  for (const t of [...titleResult.scored].sort((a, b) => b.scorecard.total - a.scorecard.total)) {
    const mark = t.blocked ? 'GEBLOKKEERD' : String(t.scorecard.total).padStart(3) + '/100'
    console.log(`  ${mark}  [${t.style.padEnd(22)}] ${t.title}`)
    if (t.blocked) console.log(`            ${t.blocked}`)
  }
  console.log(`\n  Beste drie:`)
  for (const t of titleResult.topThree) console.log(`    ${t.scorecard.total}/100  ${t.title}`)
  console.log(`\n  Aanbevolen: ${titleResult.winner?.title ?? '—'}`)
  console.log(`  ${titleResult.winnerReason}`)

  if (!titleResult.winner) return
  const chosenTitle = titleResult.winner.title

  console.log(rule('6. THUMBNAIL LAB'))
  const concepts = await studio.generateThumbnails(idea, chosenTitle, pack, 5)
  const rawThumbScores: Record<string, Awaited<ReturnType<StudioProvider['scoreThumbnail']>>> = {}
  for (const c of concepts) rawThumbScores[c.conceptName] = await studio.scoreThumbnail(c, chosenTitle)
  const thumbs = scoreThumbnails(concepts, rawThumbScores, chosenTitle)

  for (const t of [...thumbs].sort((a, b) => b.scorecard.total - a.scorecard.total)) {
    const mark = t.blocked ? 'GEBLOKKEERD' : String(t.scorecard.total).padStart(3) + '/100'
    console.log(`  ${mark}  ${t.concept.conceptName.padEnd(26)} "${t.concept.text}"`)
    if (t.blocked) console.log(`            ${t.blocked}`)
  }

  console.log(rule('7. BESTE COMBINATIE'))
  const pairs = pairTitleAndThumbnail(
    titleResult.topThree.map((t) => ({ title: t.title, total: t.scorecard.total })), thumbs)
  for (const p of pairs.slice(0, 3)) {
    console.log(`  ${String(p.combined).padStart(3)}  "${p.title}"`)
    console.log(`       + ${p.concept}  (titel ${p.titleScore}, beeld ${p.thumbnailScore})`)
    console.log(`       ${p.note}`)
  }

  const winner = pairs[0]
  if (winner) {
    idea.selectedTitle = winner.title
    idea.selectedThumbnail = winner.concept
    idea.titles = titleResult.scored
    idea.thumbnails = thumbs
    idea.pairs = pairs.slice(0, 5)
  }

  // --- 8. Kwaliteitspoort ---------------------------------------------------
  console.log(rule('8. KWALITEITSPOORT'))
  const gate = runQualityGate({
    pack, niche: best, titles: titleResult.scored, thumbnails: thumbs,
    ideaCount: project.ideas.length,
    estimatedHoursPerWeek: pack.creator.uploadsPerWeek * 6,
  })
  if (gate.passed) {
    console.log('  Niets aan te merken.')
  } else {
    for (const f of gate.findings) {
      console.log(`  [${f.severity.toUpperCase().padEnd(10)}] ${f.check}`)
      console.log(`      ${f.what}`)
      console.log(`      → ${f.revise}`)
    }
    console.log('\n  Dit is geen afwijzing maar een herzieningsopdracht. Wat er in de')
    console.log('  volgende ronde anders moet, staat hierboven per punt.')
  }
  idea.findings = gate.findings
  await store.save(project)

  console.log(rule('OPGESLAGEN'))
  console.log(`  project ${project.id} — ${project.name}`)
  console.log(`  verder met:  npm run studio -- --project ${project.id}`)
  console.log(`  vastzetten:  npm run studio -- --project ${project.id} --lock niches`)
  console.log(`  produceren:  npm run produce -- --topic "${idea.concept}"\n`)
}

main().catch((error: unknown) => { console.error(error); process.exitCode = 1 })
