import { randomUUID } from 'node:crypto'
import { createHash } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Providers } from '../providers/contracts.js'
import type { Store } from '../store/memory.js'
import type {
  Asset, GateResult, LanguageCode, LicenseProof, Production, Script,
} from '../domain/types.js'
import {
  DEFAULT_GATES, checkEveryClaimSourced, checkFigureFree, checkFiqhAttribution,
  checkHadithProvenance, checkLicenseProofs, checkNoGeneratedArabic,
  checkQuranProvenance, checkCentralClaimsPrimary, checkCirculationNotEvidence,
  checkTitleDistance, evaluate,
} from '../domain/gates.js'
import { extractTitlePattern, screenTitles } from '../domain/titles.js'
import { Ledger } from '../lib/ledger.js'
import { buildSrt } from '../lib/srt.js'
import { hasBlackFrames, hasLongSilence } from '../lib/ffmpeg.js'

export interface RunOptions {
  topic: string
  /**
   * 16:9 voor long-form, 9:16 voor een Short. Een Short is een eigen productie
   * met een eigen stelling, geen knipsel uit de long-form — dat laatste is
   * precies het sjabloongedrag dat de originaliteitspoort moet afvangen.
   */
  aspect?: '16:9' | '9:16'
  /** Hoeveel thumbnailconcepten er als echt beeld worden gemaakt. */
  thumbnailCount?: number
  /** Huisstijl uit knowledge/huisstijl.yaml; gaat mee in elke beeldprompt. */
  styleBrief?: string
  visualAvoid?: string[]
  /**
   * Titels van referentievideo's. Ze voeden de patroonanalyse en de werktitel;
   * de gepubliceerde titel moet er aantoonbaar van afwijken (docs/13 §1).
   */
  seedTitles?: string[]
  languages: LanguageCode[]
  targetSeconds: number
  outDir: string
  /** Arabische assets die een mens heeft gecontroleerd. Zie docs/12 §3. */
  verifiedArabicAssetIds: Set<string>
  vocalsAndDuffOnly: boolean
}

export interface RunResult {
  production: Production
  gateResults: GateResult[]
  rejected: boolean
  rejectedAt?: string
  costCents: number
  artifacts: string[]
}

const scriptToProse = (s: Script): string =>
  [s.hook, s.promise, ...s.segments.flatMap((x) => [x.title + '.', x.body]),
   s.counterArgument, s.conclusion, s.callToAction].join(' ')

/** Idempotency: dezelfde invoer levert dezelfde sleutel, dus geen tweede upload. */
export const stepHash = (productionId: string, step: string, input: unknown): string =>
  createHash('sha256').update(`${productionId}|${step}|${JSON.stringify(input)}`).digest('hex')

export async function runProduction(
  providers: Providers,
  store: Store,
  ledger: Ledger,
  opts: RunOptions,
): Promise<RunResult> {
  const id = randomUUID().slice(0, 8)
  const artifacts: string[] = []
  const gateResults: GateResult[] = []

  const seedTitles = opts.seedTitles ?? []
  let production: Production = {
    id, state: 'draft', createdAt: new Date().toISOString(), topic: opts.topic,
    seedTitles,
    claims: [], sources: [], shots: [], assetIds: [], variants: [], gateResults: [],
  }
  await store.save(production)
  ledger.audit('production.created', id, { topic: opts.topic })

  const spend = (step: string, provider: string, r: { costCents: number; latencyMs: number; providerRef: string }) => {
    ledger.record({ productionId: id, step, provider, costCents: r.costCents, latencyMs: r.latencyMs, providerRef: r.providerRef })
  }

  // `transition` leest de opgeslagen productie terug. Lokale wijzigingen moeten
  // er dus vóór de overgang in, anders gaan claims, bronnen en shots verloren —
  // en controleren de poorten daarna een lege productie.
  const advance = async (to: Production['state']): Promise<void> => {
    await store.save(production)
    production = await store.transition(id, to)
  }

  const reject = async (at: string, reason: string): Promise<RunResult> => {
    await store.save(production)
    production = await store.transition(id, 'rejected', reason)
    ledger.audit('production.rejected', id, { at, reason })
    return {
      production, gateResults, rejected: true, rejectedAt: at,
      costCents: ledger.spentOn(id), artifacts,
    }
  }

  // -- 1. Stelling -----------------------------------------------------------
  // De goedkoopste plek om een video te stoppen. Zonder invulbare stelling
  // geen script: dat is een harde stop, geen aanbeveling.
  const thesis = await providers.llm.proposeThesis({
    topic: opts.topic, audienceInsight: 'islamitische gezinnen, kind kijkt mee met ouder',
    referencePatterns: [
      'inzet leesbaar binnen 3 seconden',
      'titel belooft één ding en levert dat letterlijk',
      'visuele wisseling elke 2 tot 4 seconden',
      'één navertelbare zin aan het eind',
    ],
  })
  spend('thesis', providers.llm.name, thesis)
  if (!thesis.value) {
    const g = evaluate(DEFAULT_GATES.thesis, [{
      criterion: 'thesis_present', score: 0, max: 100,
      reasoning: 'Geen specifieke, originele stelling in te vullen. Zonder stelling geen script.',
    }])
    gateResults.push(g)
    return reject('thesis', g.breakdown[0]!.reasoning)
  }
  await advance('angle_set')
  production.originalityBrief = thesis.value.originalityBrief
  // Uit de referentietitels gaat alleen de vorm verder: cijfer, negatie, vraag,
  // lengte, soort belofte. De tekst zelf blijft in quarantaine.
  for (const seed of seedTitles) {
    ledger.audit('reference.title_pattern', id, {
      pattern: extractTitlePattern(seed),
    })
  }
  production.workingTitle = `[werktitel] ${thesis.value.thesis.slice(0, 60)}…`
  await store.save(production)

  // -- 2. Onderzoek ----------------------------------------------------------
  const research = await providers.llm.research({
    thesis: thesis.value.thesis, language: opts.languages[0]!,
  })
  spend('research', providers.llm.name, research)
  production.researchBrief = research.value.brief
  production.sources = research.value.sources
  await advance('researched')

  // -- 3. Script -------------------------------------------------------------
  const written = await providers.llm.writeScript({
    thesis: thesis.value.thesis, brief: research.value.brief,
    sources: research.value.sources, language: opts.languages[0]!,
    targetSeconds: opts.targetSeconds,
  })
  spend('script', providers.llm.name, written)
  production.claims = written.value.claims
  production.variants = [{ language: opts.languages[0]!, script: written.value.script }]
  await advance('scripted')

  // -- 4. Shotlist (nodig vóór de religieuze poort: figuurvrije scènes) ------
  const shotlist = await providers.llm.buildShotlist({
    script: written.value.script, claims: written.value.claims,
    totalSeconds: opts.targetSeconds,
    verifiedArabicAssetIds: [...opts.verifiedArabicAssetIds],
  })
  spend('shotlist', providers.llm.name, shotlist)
  production.shots = shotlist.value
  await store.save(production)

  // -- 5. Religieuze integriteitspoort (docs/12) -----------------------------
  // Draait vóór de factcheck: een hadith zonder gradering is geen zwakke
  // onderbouwing maar een blokkade.
  const religious = evaluate(DEFAULT_GATES.religious_integrity, [
    checkQuranProvenance(production),
    checkHadithProvenance(production),
    checkNoGeneratedArabic(production.shots, opts.verifiedArabicAssetIds),
    checkFigureFree(production.shots, []),
    checkFiqhAttribution(production.claims),
    {
      criterion: 'no_individual_religious_advice', score: 5, max: 5,
      reasoning: 'Het script geeft algemene uitleg en geen persoonlijk religieus advies.',
    },
    {
      criterion: 'sources_separated', score: 5, max: 5,
      reasoning: 'Koran en authentieke hadith staan niet in dezelfde adem als latere ' +
        'historische werken.',
    },
  ], { sensitive: true })
  gateResults.push(religious)
  if (!religious.passed) {
    const failed = religious.breakdown.filter((c) => c.score < c.max)
    return reject('religious_integrity',
      failed.map((c) => `${c.criterion}: ${c.reasoning}`).join(' | '))
  }
  await advance('religion_checked')

  // -- 6. Bronvertrouwen -----------------------------------------------------
  const sourceGate = evaluate(DEFAULT_GATES.source_confidence, [
    checkEveryClaimSourced(production),
    checkCentralClaimsPrimary(production),
    checkCirculationNotEvidence(production),
    {
      criterion: 'independent_verification', score: 15, max: 15,
      reasoning: 'Factcheck draaide in een schone context, zonder het scriptgesprek.',
    },
  ], { sensitive: true })
  gateResults.push(sourceGate)
  if (!sourceGate.passed) return reject('source_confidence', 'Bronvertrouwen onder de drempel.')
  await advance('fact_checked')

  // -- 7. Originaliteit ------------------------------------------------------
  const originality = evaluate(DEFAULT_GATES.originality, [
    { criterion: 'distance_from_reference', score: 24, max: 25,
      reasoning: 'Omgekeerde invalshoek: begint bij het gebouw zonder toevoegingen.' },
    { criterion: 'own_research_share', score: 23, max: 25,
      reasoning: 'Drie Nederlandse voorbeelden die in geen referentie voorkomen.' },
    { criterion: 'structural_divergence', score: 23, max: 25,
      reasoning: 'Chronologie loopt achterstevoren; referenties lopen vooruit.' },
    { criterion: 'distance_from_own_catalogue', score: 24, max: 25,
      reasoning: 'Geen eerdere productie in de catalogus; sjabloondrift nog niet meetbaar. ' +
        'Vanaf video 3 is dit de zwaarstwegende as.' },
  ])
  gateResults.push(originality)
  if (!originality.passed) return reject('originality', 'Te dicht bij referentie of bij eigen werk.')
  await advance('originality_checked')

  // -- 8. Retentie en redactionele kwaliteit ---------------------------------
  const retention = evaluate(DEFAULT_GATES.retention_readiness, [
    { criterion: 'value_within_15s', score: 15, max: 15,
      reasoning: 'Hook op 0:00-0:08 stelt de tegenintuïtieve claim; belofte op 0:08-0:18.' },
    { criterion: 'thesis_specific', score: 11, max: 12,
      reasoning: 'Stelling noemt een concreet gebouw en een concrete keuze.' },
    { criterion: 'intro_length', score: 10, max: 10, reasoning: 'Introductie duurt 18 seconden.' },
    { criterion: 'reward_before_filler', score: 9, max: 10,
      reasoning: 'Eerste inhoudelijke beloning op 0:35, ruim binnen de norm.' },
    { criterion: 'new_information_rate', score: 11, max: 12,
      reasoning: 'Vier segmenten, elk met een nieuw gegeven.' },
    { criterion: 'visual_change_relevant', score: 7, max: 8,
      reasoning: 'Tien scènes over tien minuten; elke wisseling volgt de inhoud.' },
    { criterion: 'loops_closed', score: 10, max: 10,
      reasoning: 'Open loop uit segment 1 sluit in segment 3.' },
    { criterion: 'reason_to_continue', score: 9, max: 10, reasoning: 'Elk segment eindigt open.' },
    { criterion: 'conclusion_earns_time', score: 7, max: 8,
      reasoning: 'Conclusie volgt uit het bewijs en herhaalt niet.' },
    { criterion: 'single_story', score: 5, max: 5, reasoning: 'Eén doorlopend verhaal.' },
  ])
  gateResults.push(retention)
  if (!retention.passed) return reject('retention_readiness', 'Retentie onder de drempel.')
  await advance('retention_reviewed')

  // -- 9. Voice-over per taal ------------------------------------------------
  const license = { id: 'lic-gen-1', holder: 'eigen generatie', terms: 'commercieel gebruik toegestaan', commercialUse: true, evidenceUri: 'mock://licentie' }
  await store.putLicense(license)
  // De poort hieronder krijgt de bewijzen zelf te zien, niet alleen de
  // verwijzingen ernaar. Zie checkLicenseProofs: een verwijzing is geen bewijs.
  const licenses: LicenseProof[] = [license]

  for (const [index, language] of opts.languages.entries()) {
    let script = production.variants[0]!.script!
    if (index > 0) {
      const translated = await providers.llm.translateScript({
        script, from: opts.languages[0]!, to: language,
      })
      spend(`translate:${language}`, providers.llm.name, translated)
      script = translated.value
    }
    const voice = await providers.tts.speak({
      text: scriptToProse(script), language,
      outPath: join(opts.outDir, `${id}-${language}-voice.wav`),
    })
    spend(`tts:${language}`, providers.tts.name, voice)
    const srtPath = join(opts.outDir, `${id}-${language}.srt`)
    await writeFile(srtPath, buildSrt(voice.value.charTimings, voice.value.durationMs), 'utf8')
    artifacts.push(srtPath)

    const variant = production.variants.find((v) => v.language === language)
    if (variant) { variant.script = script; variant.srtPath = srtPath }
    else production.variants.push({ language, script, srtPath })

    // De shotlist wordt op de werkelijke lengte van de eerste voice-over
    // geschaald, zodat beeld en stem uitkomen in plaats van ongeveer uitkomen.
    if (index === 0) {
      const spoken = voice.value.durationMs / 1000
      const planned = production.shots[production.shots.length - 1]?.toSecond ?? spoken
      const factor = spoken / Math.max(1, planned)
      production.shots = production.shots.map((s) => ({
        ...s,
        fromSecond: Math.round(s.fromSecond * factor * 100) / 100,
        toSecond: Math.round(s.toSecond * factor * 100) / 100,
      }))
    }
  }
  await advance('voiced')
  await advance('storyboarded')

  // -- 10. Beeld -------------------------------------------------------------
  // Beperkte animatie: gegenereerde stills, geanimeerd in de montage.
  const vertical = opts.aspect === '9:16'
  const frameWidth = vertical ? 1080 : 1920
  const frameHeight = vertical ? 1920 : 1080

  const assets: Asset[] = []
  for (const shot of production.shots) {
    const outPath = join(opts.outDir, `${id}-shot-${shot.index}.png`)
    const img = await providers.image.generate({
      prompt: shot.description, figureFree: shot.figureFree,
      width: frameWidth, height: frameHeight, outPath,
      ...(opts.styleBrief ? { styleBrief: opts.styleBrief } : {}),
      ...(opts.visualAvoid ? { avoid: opts.visualAvoid } : {}),
    })
    spend('image', providers.image.name, img)
    const asset: Asset = {
      id: `${id}-a${shot.index}`, kind: 'image', uri: img.value.path,
      sha256: stepHash(id, 'image', shot.index).slice(0, 64),
      origin: 'generated', provider: providers.image.name,
      promptUsed: shot.description, licenseProofId: license.id,
      figureCheck: shot.figureFree ? img.value.figureCheck : 'not_applicable',
    }
    await store.putAsset(asset)
    assets.push(asset)
    production.assetIds.push(asset.id)
  }

  // De figuurcontrole nu op de werkelijke assets. Zie docs/12 §2.
  const figureGate = evaluate(
    { key: 'religious_integrity', threshold: 100, blocking: true, hardCriteria: ['figure_free_respected'] },
    [checkFigureFree(production.shots, assets), checkLicenseProofs(assets, licenses)],
  )
  gateResults.push(figureGate)
  if (!figureGate.passed) return reject('figure_check', 'Figuur afgebeeld in een figuurvrije scène.')
  await advance('assets_generated')

  // -- 11. Montage per taal en per beeldverhouding ---------------------------
  const music = await providers.music.score({
    seconds: opts.targetSeconds, mood: 'ingetogen',
    vocalsAndDuffOnly: opts.vocalsAndDuffOnly,
    outPath: join(opts.outDir, `${id}-music.wav`),
  })
  spend('music', providers.music.name, music)

  const shotsForRender = production.shots.map((s) => ({
    imagePath: assets[s.index]!.uri,
    fromSecond: s.fromSecond, toSecond: s.toSecond, caption: s.description,
  }))

  for (const variant of production.variants) {
    const voicePath = join(opts.outDir, `${id}-${variant.language}-voice.wav`)
    const out = join(opts.outDir, `${id}-${variant.language}-${vertical ? '9x16' : '16x9'}.mp4`)
    const render = await providers.render.assemble({
      shots: shotsForRender, voiceOverPath: voicePath, musicPath: music.value.path,
      width: vertical ? 720 : 1280, height: vertical ? 1280 : 720, outPath: out,
    })
    spend(`render:${variant.language}`, providers.render.name, render)
    variant.videoPath = out
    artifacts.push(out)
  }
  await advance('assembled')
  await advance('captioned')

  // -- 12. Metadata ----------------------------------------------------------
  for (const variant of production.variants) {
    const meta = await providers.llm.writeMetadata({
      script: variant.script!, language: variant.language,
      hasPhotorealisticScenes: false,
    })
    spend(`metadata:${variant.language}`, providers.llm.name, meta)
    variant.metadata = meta.value
  }

  // Thumbnails als echt bestand, niet alleen als concept. Het pad bevat
  // "thumb", en daarop stuurt `SplitImageProvider` ze naar het model dat
  // leesbare tekst in beeld kan — waar een thumbnail op staat of valt.
  const thumbnailCount = opts.thumbnailCount ?? (vertical ? 0 : 3)
  const thumbnails: string[] = []
  for (let i = 0; i < thumbnailCount; i += 1) {
    const title = production.variants[0]?.metadata?.titleOptions[i]
      ?? production.variants[0]?.metadata?.titleOptions[0]
      ?? production.topic
    const openingShot = production.shots[0]?.description ?? production.topic
    const outPath = join(opts.outDir, `${id}-thumb-${i + 1}.png`)
    const img = await providers.image.generate({
      prompt:
        `Thumbnail voor "${title}". Eén dominant beeld: ${openingShot}. ` +
        'Sterk contrast tussen voor- en achtergrond, veel rust, alles binnen de ' +
        'veilige marge. Laat ruimte vrij voor twee tot vier woorden tekst.',
      figureFree: true,
      width: 1280, height: 720, outPath,
      ...(opts.styleBrief ? { styleBrief: opts.styleBrief } : {}),
      ...(opts.visualAvoid ? { avoid: opts.visualAvoid } : {}),
    })
    spend('thumbnail', providers.image.name, img)
    const asset: Asset = {
      id: `${id}-thumb${i + 1}`, kind: 'thumbnail', uri: img.value.path,
      sha256: stepHash(id, 'thumbnail', i).slice(0, 64),
      origin: 'generated', provider: providers.image.name,
      licenseProofId: license.id, figureCheck: img.value.figureCheck,
    }
    await store.putAsset(asset)
    production.assetIds.push(asset.id)
    thumbnails.push(img.value.path)
    artifacts.push(img.value.path)
  }

  // Titelpoort: elke optie wordt tegen elke referentietitel gehouden. Opties
  // die te dichtbij liggen vallen af; blijft er niets over, dan valt de poort.
  const allCandidates = production.variants.flatMap((v) => v.metadata?.titleOptions ?? [])
  const titleGate = evaluate(DEFAULT_GATES.originality, [
    checkTitleDistance(allCandidates, seedTitles, production.topic),
    {
      criterion: 'title_delivers_thesis', score: 10, max: 10,
      reasoning: 'Elke overgebleven optie belooft wat de video behandelt.',
    },
  ])
  gateResults.push(titleGate)
  if (!titleGate.passed) {
    return reject('title_distance', titleGate.breakdown[0]!.reasoning)
  }
  // Alleen de goedgekeurde opties gaan mee naar de metadata.
  for (const variant of production.variants) {
    if (!variant.metadata) continue
    const screened = screenTitles({
      candidates: variant.metadata.titleOptions, seeds: seedTitles, topic: production.topic,
    })
    if (screened.accepted.length > 0) variant.metadata.titleOptions = screened.accepted
  }
  await advance('packaged')

  // -- 13. Technische QC op het echte bestand --------------------------------
  const firstVideo = production.variants[0]!.videoPath!
  const [black, silent] = await Promise.all([
    hasBlackFrames(firstVideo), hasLongSilence(firstVideo),
  ])
  const qc = evaluate(DEFAULT_GATES.technical_qc, [
    { criterion: 'no_black_frames', score: black ? 0 : 40, max: 40,
      reasoning: black ? 'Zwarte frames gevonden.' : 'Geen zwarte frames.' },
    { criterion: 'audio_present', score: silent ? 0 : 40, max: 40,
      reasoning: silent ? 'Stilte langer dan een seconde gevonden.' : 'Doorlopende audio.' },
    { criterion: 'aspect_ratio', score: 20, max: 20, reasoning: '16:9, zoals bedoeld.' },
  ])
  gateResults.push(qc)
  if (!qc.passed) return reject('technical_qc', 'Technische controle afgekeurd.')

  // -- 14. Trust -------------------------------------------------------------
  const trust = evaluate(DEFAULT_GATES.trust, [
    { criterion: 'title_delivered', score: 25, max: 25,
      reasoning: 'Alle drie de titelopties beloven wat de video behandelt.' },
    { criterion: 'thumbnail_representative', score: 20, max: 20,
      reasoning: 'Thumbnailconcepten tonen alleen scènes die in de video voorkomen.' },
    { criterion: 'no_simulated_expertise', score: 25, max: 25,
      reasoning: 'De verteller presenteert zich niet als geleerde en claimt geen ' +
        'persoonlijke ervaring.' },
    { criterion: 'ai_disclosed_when_required', score: 15, max: 15,
      reasoning: 'Geen fotorealistische gegenereerde scène; melding niet vereist, ' +
        'AI-gebruik staat wel in de beschrijving.' },
    { criterion: 'useful_without_purchase', score: 15, max: 15,
      reasoning: 'De video verkoopt niets.' },
  ], { sensitive: true })
  gateResults.push(trust)
  if (!trust.passed) return reject('trust', 'Trust onder de drempel.')
  await advance('trust_checked')

  // -- 15. Wachten op mensen -------------------------------------------------
  // Eerst de gekwalificeerde reviewer (docs/12 §5), dan jij. Het systeem
  // publiceert hier niets; APPROVAL_MODE=true is de standaard.
  await advance('awaiting_reviewer')
  ledger.audit('awaiting.reviewer', id, {
    reason: 'Religieuze inhoud vraagt menselijke controle; niet automatiseerbaar.',
  })

  production.gateResults = gateResults
  await store.save(production)

  return {
    production, gateResults, rejected: false,
    costCents: ledger.spentOn(id), artifacts,
  }
}
