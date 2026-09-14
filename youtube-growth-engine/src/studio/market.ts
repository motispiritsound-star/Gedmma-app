/**
 * Marktgegevens, en wat er moet gebeuren als ze er niet zijn.
 *
 * Zonder externe data mag het systeem geen publieksvraag of concurrentiebeeld
 * beweren. Het zegt dan dat het een hypothese is, begrenst de twee categorieën
 * die je zonder cijfers niet kunt weten, en levert een onderzoekschecklist op
 * die jij later kunt afvinken. Verzonnen zoekvolumes zijn erger dan geen.
 */

export interface CompetitorSnapshot {
  channel: string
  url: string
  positioning: string
  recurringFormats: string[]
  recentTitles: string[]
  thumbnailPatterns: string[]
  doesWell: string[]
  isGeneric: string[]
}

export interface MarketData {
  /** Waar het vandaan komt, bijv. 'vidIQ' of 'handmatig'. */
  provider: string
  retrievedAt: string
  competitors: CompetitorSnapshot[]
  /** Zoekvraag, als die gemeten is. Nooit geschat. */
  searchDemand?: { term: string; volume: number; source: string }[]
  gaps: string[]
  barriers: string[]
  recommendedAngle: string
  sources: { url: string; note: string }[]
}

export interface ResearchChecklist {
  reason: string
  steps: { task: string; where: string; feedsInto: string }[]
}

/**
 * De checklist die je krijgt zolang er geen data is. Elk punt zegt erbij welke
 * score ermee omhooggaat, zodat duidelijk is waarom het de moeite is.
 */
export function researchChecklist(niche: string): ResearchChecklist {
  return {
    reason:
      `Er is geen actuele externe data over "${niche}". De beoordeling hieronder ` +
      'is daarom een hypothese. Publieksvraag is begrensd op 11 van de 15 en ' +
      'concurrentiekans op 7 van de 10 — die plafonds gaan eraf zodra er cijfers zijn.',
    steps: [
      {
        task: 'Zoek vijf kanalen die hetzelfde publiek bedienen en noteer hun positionering',
        where: 'YouTube-zoekresultaten, of de vidIQ-connector',
        feedsInto: 'concurrentiekans (10 punten)',
      },
      {
        task: 'Noteer per kanaal de drie best bekeken video\'s van het afgelopen jaar',
        where: 'kanaalpagina, sorteren op populair',
        feedsInto: 'publieksvraag (15 punten)',
      },
      {
        task: 'Schrijf op welk terugkerend format ze gebruiken en wat daaraan generiek is',
        where: 'eigen observatie',
        feedsInto: 'originele positionering (15 punten)',
      },
      {
        task: 'Zoek op vijf termen die jouw publiek zou intikken en kijk wat er komt',
        where: 'YouTube-zoekbalk, autocomplete',
        feedsInto: 'zoekpotentie van titels (10 punten)',
      },
      {
        task: 'Noteer welke vraag in de reacties terugkomt en nergens beantwoord wordt',
        where: 'reacties onder de best bekeken video\'s',
        feedsInto: 'publieksvraag, en de stelling van je eerste video',
      },
      {
        task: 'Onderscheid wat evergreen is van wat een piek was',
        where: 'publicatiedatum naast het aantal views',
        feedsInto: 'evergreen-potentie (10 punten)',
      },
    ],
  }
}

export function formatChecklist(list: ResearchChecklist): string {
  return [
    list.reason,
    '',
    'Onderzoekschecklist:',
    ...list.steps.map((s, i) =>
      `  ${i + 1}. ${s.task}\n     waar: ${s.where}\n     verhoogt: ${s.feedsInto}`),
  ].join('\n')
}

/**
 * Zet marktgegevens om in de vorm die de nichebeoordeling verwacht. Alleen
 * gemeten cijfers gaan mee: een leeg veld blijft leeg in plaats van geschat.
 */
export function summariseMarket(data: MarketData): string {
  const parts: string[] = [
    `MARKTGEGEVENS (${data.provider}, opgehaald ${data.retrievedAt.slice(0, 10)})`,
  ]
  for (const c of data.competitors) {
    parts.push(
      `- ${c.channel}: ${c.positioning}`,
      `    doet goed: ${c.doesWell.join('; ') || 'niet genoteerd'}`,
      `    generiek:  ${c.isGeneric.join('; ') || 'niet genoteerd'}`,
      `    formats:   ${c.recurringFormats.join('; ') || 'niet genoteerd'}`,
    )
  }
  if (data.searchDemand && data.searchDemand.length > 0) {
    parts.push('GEMETEN ZOEKVRAAG:')
    for (const d of data.searchDemand) {
      parts.push(`- "${d.term}": ${d.volume} (${d.source})`)
    }
  } else {
    parts.push('GEMETEN ZOEKVRAAG: geen. Niet schatten.')
  }
  if (data.gaps.length > 0) parts.push(`GATEN: ${data.gaps.join('; ')}`)
  if (data.barriers.length > 0) parts.push(`DREMPELS: ${data.barriers.join('; ')}`)
  if (data.recommendedAngle) parts.push(`VOORGESTELDE HOEK: ${data.recommendedAngle}`)
  return parts.join('\n')
}

/** True zodra er genoeg gemeten is om de plafonds te laten vervallen. */
export function liftsHypothesisCaps(data: MarketData | undefined): boolean {
  if (!data) return false
  return data.competitors.length >= 3 && data.sources.length > 0
}
