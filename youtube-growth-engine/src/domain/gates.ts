import type { Claim, GateKey, GateResult, Production, Shot, Asset } from './types.js'
import { screenTitles } from './titles.js'

export interface GateSpec {
  key: GateKey
  threshold: number
  blocking: boolean
  /** Strengere drempel voor gevoelige onderwerpen (gezondheid, geld, recht, religie). */
  sensitiveThreshold?: number
  /**
   * Deelcriteria die op zichzelf blokkeren, ongeacht de totaalscore.
   * Zie docs/07 (Trust) en docs/12 §7 (religieuze integriteit).
   */
  hardCriteria?: string[]
}

/**
 * Drempels uit config/defaults.yaml. Er is geen codepad dat een drempel
 * verlaagt: `withThresholds` accepteert alleen gelijke of hogere waarden.
 */
export const DEFAULT_GATES: Record<GateKey, GateSpec> = {
  niche_score: { key: 'niche_score', threshold: 75, blocking: true },
  thesis: { key: 'thesis', threshold: 70, blocking: true },
  religious_integrity: {
    key: 'religious_integrity',
    threshold: 90,
    blocking: true,
    hardCriteria: [
      'quran_provenance',
      'hadith_provenance',
      'no_generated_arabic',
      'figure_free_respected',
      'no_individual_religious_advice',
    ],
  },
  source_confidence: {
    key: 'source_confidence', threshold: 90, blocking: true, sensitiveThreshold: 95,
  },
  originality: { key: 'originality', threshold: 90, blocking: true },
  retention_readiness: { key: 'retention_readiness', threshold: 80, blocking: true },
  editorial_quality: { key: 'editorial_quality', threshold: 85, blocking: true },
  technical_qc: { key: 'technical_qc', threshold: 95, blocking: true },
  trust: {
    key: 'trust',
    threshold: 90,
    blocking: true,
    hardCriteria: [
      'title_delivered', 'thumbnail_representative',
      'no_simulated_expertise', 'ai_disclosed_when_required',
    ],
  },
  policy_risk: { key: 'policy_risk', threshold: 100, blocking: true },
}

export class ThresholdLoweringError extends Error {
  constructor(key: GateKey, from: number, to: number) {
    super(
      `Poort ${key}: drempel verlagen van ${from} naar ${to} is niet mogelijk. ` +
      `Wijzig config/defaults.yaml; die wijziging komt in het auditlog.`,
    )
    this.name = 'ThresholdLoweringError'
  }
}

/** Drempels aanscherpen mag; verlagen niet. */
export function withThresholds(
  base: Record<GateKey, GateSpec>,
  overrides: Partial<Record<GateKey, number>>,
): Record<GateKey, GateSpec> {
  const next = { ...base }
  for (const [key, value] of Object.entries(overrides) as [GateKey, number][]) {
    const spec = base[key]
    if (value < spec.threshold) throw new ThresholdLoweringError(key, spec.threshold, value)
    next[key] = { ...spec, threshold: value }
  }
  return next
}

export interface Criterion {
  criterion: string
  score: number
  max: number
  reasoning: string
}

export function evaluate(
  spec: GateSpec,
  criteria: Criterion[],
  opts: { sensitive?: boolean } = {},
): GateResult {
  const max = criteria.reduce((sum, c) => sum + c.max, 0)
  const earned = criteria.reduce((sum, c) => sum + c.score, 0)
  const score = max === 0 ? 0 : Math.round((earned / max) * 100)

  const threshold = opts.sensitive && spec.sensitiveThreshold
    ? spec.sensitiveThreshold
    : spec.threshold

  // Een hard criterium dat niet vol scoort, laat de hele poort vallen —
  // ongeacht hoe hoog het totaal uitkomt.
  const hardFailure = (spec.hardCriteria ?? []).some((name) => {
    const c = criteria.find((x) => x.criterion === name)
    return c !== undefined && c.score < c.max
  })

  return {
    gate: spec.key,
    score,
    threshold,
    passed: !hardFailure && score >= threshold,
    blocking: spec.blocking,
    breakdown: criteria,
    evaluatedAt: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Deterministische controles. Deze gebruiken geen taalmodel: het zijn
// eigenschappen van de data, en dat maakt ze testbaar en onomkoopbaar.
// ---------------------------------------------------------------------------

/** docs/12 §1 — klasse A: soera + ayah + genoemde gepubliceerde vertaling. */
export function checkQuranProvenance(p: Production): Criterion {
  const claims = p.claims.filter((c) => c.claimClass === 'quran')
  const bad = claims.filter((c) => {
    const sources = c.sourceIds.map((id) => p.sources.find((s) => s.id === id))
    return sources.length === 0 || sources.some(
      (s) => !s || !/^\d+:\d+/.test(s.locator) || !s.translation,
    )
  })
  return {
    criterion: 'quran_provenance',
    score: bad.length === 0 ? 20 : 0,
    max: 20,
    reasoning: bad.length === 0
      ? `${claims.length} koranverwijzing(en), elk met soera:ayah en een genoemde vertaling.`
      : `${bad.length} koranverwijzing(en) zonder soera:ayah of zonder genoemde vertaling: ` +
        bad.map((c) => `"${c.text.slice(0, 60)}…"`).join('; '),
  }
}

/** docs/12 §1 — klasse B: collectie + nummer + gradering met beoordelaar. */
export function checkHadithProvenance(p: Production): Criterion {
  const claims = p.claims.filter((c) => c.claimClass === 'hadith')
  const bad = claims.filter((c) => {
    const sources = c.sourceIds.map((id) => p.sources.find((s) => s.id === id))
    return sources.length === 0 || sources.some(
      (s) => !s || !s.work || !s.locator || !s.grading || !s.gradedBy ||
             s.grading.toLowerCase() === "mawdu'",
    )
  })
  return {
    criterion: 'hadith_provenance',
    score: bad.length === 0 ? 25 : 0,
    max: 25,
    reasoning: bad.length === 0
      ? `${claims.length} hadithverwijzing(en), elk met collectie, nummer en gradering.`
      : `${bad.length} hadith zonder volledige herkomst of als mawdu' gegradeerd. ` +
        `Niet afzwakken maar blokkeren: dit is waar taalmodellen het overtuigendst falen.`,
  }
}

/** docs/12 §2 — geen menselijke figuur waar `figureFree` geldt. */
export function checkFigureFree(shots: Shot[], assets: Asset[]): Criterion {
  const guarded = shots.filter((s) => s.figureFree)
  const violations = assets.filter((a) => a.figureCheck === 'fail')
  return {
    criterion: 'figure_free_respected',
    score: violations.length === 0 ? 15 : 0,
    max: 15,
    reasoning: violations.length === 0
      ? `${guarded.length} scène(s) met afbeeldingsverbod; geen enkele asset toont een figuur.`
      : `${violations.length} asset(s) tonen een menselijke figuur in een scène met ` +
        `afbeeldingsverbod. Opnieuw genereren; na drie pogingen naar een mens.`,
  }
}

/** docs/12 §3 — Arabische tekst komt uit de geverifieerde bibliotheek. */
export function checkNoGeneratedArabic(shots: Shot[], verifiedIds: Set<string>): Criterion {
  const withArabic = shots.filter((s) => s.arabicAssetId !== undefined)
  const unverified = withArabic.filter((s) => !verifiedIds.has(s.arabicAssetId!))
  return {
    criterion: 'no_generated_arabic',
    score: unverified.length === 0 ? 15 : 0,
    max: 15,
    reasoning: unverified.length === 0
      ? `${withArabic.length} scène(s) met Arabische tekst, alle uit de geverifieerde bibliotheek.`
      : `${unverified.length} scène(s) met Arabische tekst die niet menselijk is gecontroleerd.`,
  }
}

/** docs/12 §1 — klasse C: toeschrijven, niet stellen. */
export function checkFiqhAttribution(claims: Claim[]): Criterion {
  const fiqh = claims.filter((c) => c.claimClass === 'fiqh')
  const unattributed = fiqh.filter(
    (c) => !c.attributedTo && !c.notesScholarlyDifference,
  )
  return {
    criterion: 'fiqh_attributed',
    score: unattributed.length === 0 ? 10 : 0,
    max: 10,
    reasoning: unattributed.length === 0
      ? `${fiqh.length} claim(s) over handelingen, elk toegeschreven of met verschil benoemd.`
      : `${unattributed.length} claim(s) presenteren een oordeel als feit. Voor een ` +
        `Nederlands publiek — overwegend malikitisch en hanafitisch — vertelt dat een ` +
        `deel van de kijkers dat hun gezin het verkeerd doet.`,
  }
}

/** Elke claim, van welke klasse ook, heeft minstens één geregistreerde bron. */
export function checkEveryClaimSourced(p: Production): Criterion {
  const unsourced = p.claims.filter((c) => c.sourceIds.length === 0)
  return {
    criterion: 'every_claim_sourced',
    score: unsourced.length === 0 ? 20 : 0,
    max: 20,
    reasoning: unsourced.length === 0
      ? `Alle ${p.claims.length} claims verwijzen naar een geregistreerde bron.`
      : `${unsourced.length} claim(s) zonder bron. Dit blokkeert de build; het wordt ` +
        `niet gemarkeerd en niet afgezwakt.`,
  }
}

/** Elke asset die de montage in mag, heeft een licentiebewijs. */
export function checkLicenseProofs(assets: Asset[]): Criterion {
  const missing = assets.filter((a) => !a.licenseProofId)
  return {
    criterion: 'license_proofs_present',
    score: missing.length === 0 ? 10 : 0,
    max: 10,
    reasoning: missing.length === 0
      ? `Alle ${assets.length} assets hebben een licentiebewijs.`
      : `${missing.length} asset(s) zonder licentiebewijs.`,
  }
}

/**
 * Secundaire bronnen tellen niet mee als bewijs voor een centrale claim.
 * "Centraal" = alles wat religieus of historisch van aard is; algemene claims
 * (aantallen, context) mogen op een secundaire bron staan.
 */
export function checkCentralClaimsPrimary(p: Production): Criterion {
  const central = p.claims.filter(
    (c) => c.claimClass !== 'general',
  )
  const weak = central.filter((c) => {
    const sources = c.sourceIds.map((id) => p.sources.find((s) => s.id === id))
    return !sources.some((s) => s?.kind === 'primary')
  })
  return {
    criterion: 'central_claims_primary',
    score: weak.length === 0 ? 15 : 0,
    max: 15,
    reasoning: weak.length === 0
      ? `Alle ${central.length} centrale claims steunen op minstens één primaire bron.`
      : `${weak.length} centrale claim(s) steunen alleen op secundaire bronnen: ` +
        weak.map((c) => `"${c.text.slice(0, 50)}…"`).join('; '),
  }
}

/**
 * "Het staat overal" is geen bewijs. Bij islamitische content is het eerder een
 * waarschuwing: juist zwakke en verzonnen overleveringen worden het vaakst
 * doorgegeven, omdat ze aansprekend zijn. Een bron van soort `circulated` kan
 * daarom nooit een centrale claim dragen.
 */
export function checkCirculationNotEvidence(p: Production): Criterion {
  const central = p.claims.filter((c) => c.claimClass !== 'general')
  const leaning = central.filter((c) => {
    const sources = c.sourceIds.map((id) => p.sources.find((s) => s.id === id))
    const kinds = sources.map((s) => s?.kind)
    return kinds.length > 0 && kinds.every((k) => k === 'circulated')
  })
  return {
    criterion: 'circulation_not_evidence',
    score: leaning.length === 0 ? 10 : 0,
    max: 10,
    reasoning: leaning.length === 0
      ? 'Geen centrale claim leunt op "dit gaat overal rond".'
      : `${leaning.length} centrale claim(s) steunen alleen op wijdverbreide herhaling. ` +
        'Dat is geen bewijs maar een waarschuwing: de meest doorgegeven ' +
        'overleveringen zijn vaak juist de zwakke. Zoek de primaire bron op of ' +
        'schrap de claim.',
  }
}

/**
 * De gepubliceerde titel moet aantoonbaar afwijken van elke referentietitel.
 * Onderwerpwoorden tellen niet mee — je kunt niet over Medina schrijven zonder
 * "Medina" te zeggen.
 */
export function checkTitleDistance(
  candidates: string[],
  seeds: string[],
  topic: string,
): Criterion {
  if (seeds.length === 0) {
    return {
      criterion: 'title_distance',
      score: 15, max: 15,
      reasoning: 'Geen referentietitels aangeleverd; niets om afstand tot te meten.',
    }
  }
  const outcome = screenTitles({ candidates, seeds, topic })
  return {
    criterion: 'title_distance',
    score: outcome.ok ? 15 : 0,
    max: 15,
    reasoning: outcome.ok
      ? `${outcome.accepted.length} van ${candidates.length} titelopties staan ver genoeg ` +
        `van de referentietitels.` +
        (outcome.rejected.length > 0
          ? ` Afgevallen: ${outcome.rejected.map((r) => `"${r.title}"`).join(', ')}.`
          : '')
      : 'Alle titelopties liggen te dicht bij een referentietitel: ' +
        outcome.rejected
          .map((r) =>
            `"${r.title}" deelt ${Math.round(r.distance.bigramOverlap * 100)}% van zijn ` +
            `woordparen met "${r.seed}"`)
          .join('; '),
  }
}

// ---------------------------------------------------------------------------
// Medisch profiel (docs/16). Dezelfde machinerie als het religieuze profiel:
// een gezaghebbende tekst, een bevinding met vindplaats, een oordeel dat
// toegeschreven moet worden, een cijfer. Alleen de namen verschillen, en de
// drempels liggen hoger omdat mensen naar gezondheidsinformatie handelen.
// ---------------------------------------------------------------------------

/** Onderzoeksopzetten, van sterk naar zwak. */
const STRONG_DESIGNS = ['systematische review', 'meta-analyse', 'rct', 'richtlijn']
const WEAK_DESIGNS = ['dierstudie', 'casus', 'patiëntenserie', 'in vitro']

/**
 * Richtlijnen en standaarden: WHO, Gezondheidsraad, NHG, Voedingscentrum,
 * Cochrane. Vereist het werk, het onderdeel én het jaar — een richtlijn uit
 * 2009 zegt iets anders dan die van vorig jaar, en dat verschil is de video.
 */
export function checkGuidelineProvenance(p: Production): Criterion {
  const claims = p.claims.filter((c) => c.claimClass === 'guideline')
  const bad = claims.filter((c) => {
    const sources = c.sourceIds.map((id) => p.sources.find((s) => s.id === id))
    return sources.length === 0 || sources.some(
      (s) => !s || s.kind !== 'primary' || !s.work || !s.locator || !s.year,
    )
  })
  return {
    criterion: 'guideline_provenance',
    score: bad.length === 0 ? 20 : 0,
    max: 20,
    reasoning: bad.length === 0
      ? `${claims.length} verwijzing(en) naar een richtlijn, elk met werk, vindplaats en jaar.`
      : `${bad.length} richtlijnclaim(s) zonder primaire bron, vindplaats of jaartal. ` +
        'Een richtlijn zonder jaartal is geen bron: ze worden herzien.',
  }
}

/**
 * Onderzoeksbevindingen. Vereist tijdschrift, jaar, opzet en deelnemersaantal.
 * Dit is het medische equivalent van een hadith zonder gradering: een studie
 * zonder opzet en omvang klinkt als bewijs en is het niet.
 */
export function checkStudyProvenance(p: Production): Criterion {
  const claims = p.claims.filter((c) => c.claimClass === 'study')
  const problems: string[] = []

  for (const c of claims) {
    const sources = c.sourceIds.map((id) => p.sources.find((s) => s.id === id))
    if (sources.length === 0 || sources.some((s) => !s)) {
      problems.push(`"${c.text.slice(0, 50)}…" heeft geen bron`)
      continue
    }
    for (const s of sources) {
      if (!s) continue
      if (!s.grading || !s.gradedBy || !s.year) {
        problems.push(`${s.work}: opzet, tijdschrift of jaar ontbreekt`)
        continue
      }
      const design = s.grading.toLowerCase()
      if (WEAK_DESIGNS.some((w) => design.includes(w)) && !c.notesScholarlyDifference) {
        problems.push(
          `${s.work} is een ${s.grading} en het script benoemt die beperking niet. ` +
          'Een dierstudie is geen uitspraak over mensen.',
        )
      }
      if (s.participants !== undefined && s.participants < 30 &&
          !STRONG_DESIGNS.some((d) => design.includes(d))) {
        problems.push(`${s.work} heeft ${s.participants} deelnemers; te weinig om op te steunen`)
      }
    }
  }

  return {
    criterion: 'study_provenance',
    score: problems.length === 0 ? 25 : 0,
    max: 25,
    reasoning: problems.length === 0
      ? `${claims.length} onderzoeksverwijzing(en), elk met tijdschrift, jaar, opzet en omvang.`
      : problems.join(' | '),
  }
}

/**
 * Adviezen. Nooit als feit, nooit persoonlijk. "Neem dit supplement" is
 * individueel advies; "de Gezondheidsraad adviseert X voor volwassenen" is
 * toegeschreven en algemeen.
 */
export function checkRecommendationAttribution(claims: Claim[]): Criterion {
  const advice = claims.filter((c) => c.claimClass === 'recommendation')
  const unattributed = advice.filter((c) => !c.attributedTo)
  return {
    criterion: 'recommendation_attributed',
    score: unattributed.length === 0 ? 15 : 0,
    max: 15,
    reasoning: unattributed.length === 0
      ? `${advice.length} advies/adviezen, elk toegeschreven aan wie het geeft.`
      : `${unattributed.length} advies/adviezen zonder bron. Een kijker die hiernaar ` +
        'handelt, moet kunnen zien van wie het komt.',
  }
}

/** Cijfers verouderen. Zonder jaartal is een percentage een bewering. */
export function checkStatisticYear(p: Production): Criterion {
  const stats = p.claims.filter((c) => c.claimClass === 'statistic')
  const undated = stats.filter((c) => {
    const sources = c.sourceIds.map((id) => p.sources.find((s) => s.id === id))
    return sources.length === 0 || sources.some((s) => !s?.year)
  })
  return {
    criterion: 'statistic_dated',
    score: undated.length === 0 ? 10 : 0,
    max: 10,
    reasoning: undated.length === 0
      ? `${stats.length} cijfer(s), elk met bron en jaartal.`
      : `${undated.length} cijfer(s) zonder jaartal.`,
  }
}

/**
 * De grens tussen uitleg en advies. Het script mag uitleggen wat er bekend is;
 * het mag de kijker niet vertellen wat die moet doen met zijn eigen lichaam.
 */
const PERSONAL_ADVICE = [
  /\bjij moet\b/i, /\bstop met\b/i, /\bneem (dagelijks|elke dag)\b/i,
  /\bslik\b/i, /\bgenees\b/i, /\bbehandel je\b/i, /\bvervang je medicijn/i,
  /\bga (niet )?naar de (dokter|huisarts) als je\b/i,
]

export function checkNoPersonalMedicalAdvice(claims: Claim[]): Criterion {
  const hits = claims.filter((c) => PERSONAL_ADVICE.some((re) => re.test(c.text)))
  return {
    criterion: 'no_personal_medical_advice',
    score: hits.length === 0 ? 15 : 0,
    max: 15,
    reasoning: hits.length === 0
      ? 'Het script legt uit en schrijft niets voor.'
      : `${hits.length} zin(nen) lezen als persoonlijk medisch advies: ` +
        hits.map((c) => `"${c.text.slice(0, 60)}…"`).join('; ') +
        ' Herschrijf naar wat er bekend is, niet naar wat de kijker moet doen.',
  }
}
