/**
 * Titels uit referentievideo's als invoer, zonder dat ze de uitvoer halen.
 *
 * Een referentietitel is analytische input: hij mag het systeem in, hij mag een
 * werktitel voeden, maar de gepubliceerde titel moet er aantoonbaar van
 * afwijken. Deze module meet die afstand deterministisch, zodat de poort geen
 * kwestie van smaak is.
 */

const STOPWORDS = new Set([
  // NL
  'de', 'het', 'een', 'en', 'of', 'maar', 'want', 'dus', 'die', 'dat', 'deze',
  'dit', 'is', 'was', 'zijn', 'wordt', 'werd', 'heeft', 'had', 'te', ' te',
  'van', 'voor', 'met', 'op', 'in', 'aan', 'bij', 'uit', 'over', 'naar', 'door',
  'als', 'ook', 'niet', 'geen', 'wel', 'er', 'je', 'jij', 'ik', 'we', 'wij',
  'hij', 'zij', 'ze', 'men', 'men', 'om', 'nog', 'al', 'meer', 'zo', 'hoe',
  'wat', 'wie', 'waarom', 'wanneer', 'waar',
  // DE
  'der', 'die', 'das', 'und', 'oder', 'aber', 'ist', 'war', 'sind', 'hat',
  'für', 'mit', 'auf', 'aus', 'über', 'nach', 'durch', 'nicht', 'kein', 'wie',
  'was', 'wer', 'warum', 'wann', 'wo', 'den', 'dem', 'des', 'ein', 'eine',
  // EN
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'was', 'are', 'were', 'has',
  'had', 'to', 'of', 'for', 'with', 'on', 'in', 'at', 'by', 'from', 'about',
  'not', 'no', 'how', 'what', 'who', 'why', 'when', 'where', 'this', 'that',
])

const normalise = (s: string): string =>
  s.toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const contentWords = (s: string): string[] =>
  normalise(s).split(' ').filter((w) => w.length > 2 && !STOPWORDS.has(w))

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0
  const overlap = [...a].filter((x) => b.has(x)).length
  return overlap / (a.size + b.size - overlap)
}

function longestCommonSubstring(a: string, b: string): number {
  if (!a || !b) return 0
  let best = 0
  // Rolling rij in plaats van een volledige matrix: titels zijn kort, maar dit
  // draait per kandidaat per seed en dat loopt op.
  let prev = new Array<number>(b.length + 1).fill(0)
  for (let i = 1; i <= a.length; i += 1) {
    const cur = new Array<number>(b.length + 1).fill(0)
    for (let j = 1; j <= b.length; j += 1) {
      if (a[i - 1] === b[j - 1]) {
        cur[j] = (prev[j - 1] ?? 0) + 1
        if (cur[j]! > best) best = cur[j]!
      }
    }
    prev = cur
  }
  return best
}

export interface TitleDistance {
  jaccard: number
  lcsRatio: number
  /**
   * Deel van de woordparen in de kandidaat dat ook in de referentie staat.
   * Dit is het signaal dat "één woord verwisseld" vangt, waar losse
   * woordoverlap en gedeelde substring allebei nét onder de drempel blijven.
   */
  bigramOverlap: number
  tooClose: boolean
  /** Woorden die beide titels delen en niet uit het onderwerp zelf komen. */
  sharedBeyondTopic: string[]
}

export interface TitleDistanceOptions {
  /** Drempel voor woordoverlap buiten het onderwerp om. */
  maxJaccard?: number
  /** Drempel voor de langste letterlijk gedeelde tekst, als deel van de kandidaat. */
  maxLcsRatio?: number
  /** Drempel voor gedeelde woordparen over de hele titel. */
  maxBigramOverlap?: number
}

function bigrams(s: string): string[] {
  const words = s.split(' ').filter(Boolean)
  return words.slice(0, -1).map((w, i) => `${w} ${words[i + 1]}`)
}

function bigramOverlapRatio(candidate: string, seed: string): number {
  const a = bigrams(candidate)
  if (a.length === 0) return 0
  const b = new Set(bigrams(seed))
  return a.filter((x) => b.has(x)).length / a.length
}

/**
 * Onderwerpwoorden worden eerst uit beide titels gehaald. Je kunt niet over
 * Medina schrijven zonder "Medina" te zeggen: die overlap is onvermijdelijk en
 * onschuldig. Wat telt is wat er daarbovenop wordt gedeeld — de formulering.
 */
export function titleDistance(
  candidate: string,
  seed: string,
  topic: string,
  opts: TitleDistanceOptions = {},
): TitleDistance {
  const maxJaccard = opts.maxJaccard ?? 0.4
  const maxLcsRatio = opts.maxLcsRatio ?? 0.5
  const maxBigramOverlap = opts.maxBigramOverlap ?? 0.5

  const topicWords = new Set(contentWords(topic))
  const a = new Set(contentWords(candidate).filter((w) => !topicWords.has(w)))
  const b = new Set(contentWords(seed).filter((w) => !topicWords.has(w)))

  const j = jaccard(a, b)
  const normCandidate = normalise(candidate)
  const normSeed = normalise(seed)
  const lcs = longestCommonSubstring(normCandidate, normSeed)
  const lcsRatio = normCandidate.length === 0 ? 0 : lcs / normCandidate.length
  const bigram = bigramOverlapRatio(normCandidate, normSeed)

  return {
    jaccard: Math.round(j * 100) / 100,
    lcsRatio: Math.round(lcsRatio * 100) / 100,
    bigramOverlap: Math.round(bigram * 100) / 100,
    tooClose: j > maxJaccard || lcsRatio > maxLcsRatio || bigram > maxBigramOverlap,
    sharedBeyondTopic: [...a].filter((w) => b.has(w)).sort(),
  }
}

export interface TitleGateInput {
  candidates: string[]
  seeds: string[]
  topic: string
}

export interface TitleGateOutcome {
  ok: boolean
  /** Kandidaten die de poort halen. Alleen deze mogen naar de metadata. */
  accepted: string[]
  rejected: { title: string; seed: string; distance: TitleDistance }[]
}

/**
 * Elke kandidaat wordt tegen elke seed gehouden. Eén te korte afstand is
 * genoeg om de kandidaat te laten vallen; de overige kandidaten blijven staan.
 * De poort valt pas als er niets overblijft.
 */
export function screenTitles(
  input: TitleGateInput,
  opts: TitleDistanceOptions = {},
): TitleGateOutcome {
  const accepted: string[] = []
  const rejected: TitleGateOutcome['rejected'] = []

  for (const candidate of input.candidates) {
    let worst: { seed: string; distance: TitleDistance } | undefined
    for (const seed of input.seeds) {
      const distance = titleDistance(candidate, seed, input.topic, opts)
      const severity = Math.max(distance.jaccard, distance.lcsRatio, distance.bigramOverlap)
      const worstSeverity = worst
        ? Math.max(worst.distance.jaccard, worst.distance.lcsRatio, worst.distance.bigramOverlap)
        : -1
      if (distance.tooClose && severity > worstSeverity) worst = { seed, distance }
    }
    if (worst) rejected.push({ title: candidate, ...worst })
    else accepted.push(candidate)
  }

  return { ok: accepted.length > 0, accepted, rejected }
}

/**
 * Wat er uit een referentietitel meegenomen mág worden: de vorm, niet de tekst.
 * Dit is het enige dat de titelstap van de referentie te zien krijgt.
 */
export interface TitlePattern {
  hasNumber: boolean
  hasNegation: boolean
  hasQuestion: boolean
  hasSuperlative: boolean
  wordCount: number
  /** Bijv. 'belofte', 'vraag', 'tegenintuitieve-claim', 'lijst'. */
  shape: 'lijst' | 'vraag' | 'tegenintuitieve-claim' | 'belofte'
}

const SUPERLATIVES = /\b(beste|grootste|meest|nooit|altijd|enige|ultieme|schokkend|ongelooflijk|best|biggest|most|never|always|only|ultimate|shocking|unbelievable)\b/i

export function extractTitlePattern(title: string): TitlePattern {
  const words = normalise(title).split(' ').filter(Boolean)
  const hasNumber = /\d/.test(title)
  const hasQuestion = /\?/.test(title) || /^(hoe|waarom|wat|wie|wanneer|how|why|what|who|when|wie|warum|was)\b/i.test(title.trim())
  const hasNegation = /\b(niet|geen|nooit|zonder|not|no|never|without|nicht|kein|nie|ohne)\b/i.test(title)

  const shape: TitlePattern['shape'] = hasNumber
    ? 'lijst'
    : hasQuestion
      ? 'vraag'
      : hasNegation
        ? 'tegenintuitieve-claim'
        : 'belofte'

  return {
    hasNumber,
    hasNegation,
    hasQuestion,
    hasSuperlative: SUPERLATIVES.test(title),
    wordCount: words.length,
    shape,
  }
}
