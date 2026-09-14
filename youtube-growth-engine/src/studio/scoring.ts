/**
 * Gedeeld scoregereedschap voor de niche-, titel- en thumbnailbeoordeling.
 *
 * Het model levert per categorie een score met onderbouwing; de code rekent,
 * begrenst en classificeert. Dat scheelt de discussie of een 92 nu echt een 92
 * was: het totaal is een som, geen indruk.
 */

export interface CategorySpec {
  key: string
  label: string
  max: number
  /** Wat deze categorie meet, in één zin. Gaat mee naar het model. */
  question: string
}

export interface CategoryScore {
  key: string
  score: number
  max: number
  reasoning: string
  assumptions: string[]
  weaknesses: string[]
  improvements: string[]
}

export interface Scorecard {
  categories: CategoryScore[]
  total: number
  classification: string
  /** Aanpassingen die de code op de modelscore heeft toegepast, met reden. */
  adjustments: string[]
}

export interface Band {
  min: number
  label: string
}

/**
 * Rekent de scorecard uit. Twee dingen gebeuren hier en niet in de prompt:
 * het maximum per categorie wordt afgedwongen, en het totaal is de som. Een
 * model dat zijn eigen totaal mag opgeven, geeft het totaal dat het wil.
 */
export function buildScorecard(
  specs: CategorySpec[],
  raw: { key: string; score: number; reasoning: string; assumptions?: string[]; weaknesses?: string[]; improvements?: string[] }[],
  bands: Band[],
  extraAdjustments: string[] = [],
): Scorecard {
  const adjustments = [...extraAdjustments]
  const categories: CategoryScore[] = specs.map((spec) => {
    const found = raw.find((r) => r.key === spec.key)
    const given = found?.score ?? 0
    const score = Math.max(0, Math.min(spec.max, Math.round(given)))
    if (found && given > spec.max) {
      adjustments.push(`${spec.label}: ${given} teruggebracht naar het maximum ${spec.max}.`)
    }
    if (!found) {
      adjustments.push(`${spec.label}: geen score gegeven, geteld als 0.`)
    }
    return {
      key: spec.key,
      score,
      max: spec.max,
      reasoning: found?.reasoning ?? 'Niet beoordeeld.',
      assumptions: found?.assumptions ?? [],
      weaknesses: found?.weaknesses ?? [],
      improvements: found?.improvements ?? [],
    }
  })

  const total = categories.reduce((sum, c) => sum + c.score, 0)
  const band = [...bands].sort((a, b) => b.min - a.min).find((b) => total >= b.min)

  return {
    categories,
    total,
    classification: band?.label ?? bands[bands.length - 1]?.label ?? 'onbekend',
    adjustments,
  }
}

/** Zet een plafond op één categorie, met de reden erbij in `adjustments`. */
export function capCategory(
  card: Scorecard, key: string, max: number, reason: string,
): Scorecard {
  const categories = card.categories.map((c) => {
    if (c.key !== key || c.score <= max) return c
    return { ...c, score: max }
  })
  const capped = card.categories.find((c) => c.key === key && c.score > max)
  if (!capped) return card
  const total = categories.reduce((sum, c) => sum + c.score, 0)
  return {
    ...card,
    categories,
    total,
    adjustments: [...card.adjustments, `${key}: begrensd op ${max}. ${reason}`],
  }
}

export function applyBands(card: Scorecard, bands: Band[]): Scorecard {
  const band = [...bands].sort((a, b) => b.min - a.min).find((b) => card.total >= b.min)
  return { ...card, classification: band?.label ?? card.classification }
}

export function formatScorecard(card: Scorecard, width = 34): string {
  const lines = card.categories.map((c) => {
    const bar = '#'.repeat(Math.round((c.score / c.max) * 10)).padEnd(10, '.')
    return `  ${c.key.padEnd(width)} ${bar} ${String(c.score).padStart(2)}/${c.max}`
  })
  lines.push(`  ${'TOTAAL'.padEnd(width)} ${' '.repeat(10)} ${card.total}/100  — ${card.classification}`)
  if (card.adjustments.length > 0) {
    lines.push('  correcties op de modelscore:')
    for (const a of card.adjustments) lines.push(`    - ${a}`)
  }
  return lines.join('\n')
}

/**
 * Laat categorieën weg en herschaalt naar 100.
 *
 * Bedoeld voor het geval dat de maker zegt: die categorie ben ik zelf, reken
 * hem niet mee. Dat mag, en het heeft één gevolg dat de moeite is om te weten:
 * eigen voorsprong is de enige categorie die een concurrent niet kan
 * inhalen. Haal je hem weg, dan meet de score nog uitsluitend de markt — en
 * meet hij dus voor jou hetzelfde als voor ieder ander die deze niche overweegt.
 */
export function excludeCategories(
  card: Scorecard, keys: string[], rescaleTo = 100,
): Scorecard {
  const kept = card.categories.filter((c) => !keys.includes(c.key))
  const dropped = card.categories.filter((c) => keys.includes(c.key))
  if (dropped.length === 0) return card

  const maxKept = kept.reduce((sum, c) => sum + c.max, 0)
  const earned = kept.reduce((sum, c) => sum + c.score, 0)
  const total = maxKept === 0 ? 0 : Math.round((earned / maxKept) * rescaleTo)

  return {
    ...card,
    categories: kept,
    total,
    adjustments: [
      ...card.adjustments,
      `${dropped.map((d) => d.key).join(', ')} weggelaten op verzoek; ` +
      `${earned}/${maxKept} herschaald naar ${total}/${rescaleTo}.`,
    ],
  }
}
