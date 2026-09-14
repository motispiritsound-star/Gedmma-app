import type { Claim, GateKey, GateResult, Production, Shot, Asset } from './types.js'

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
