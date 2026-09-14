/**
 * Het domeinmodel. Eén `Production` is één video-idee; taal is een dimensie
 * daarvan en geen kopie ervan (zie docs/11 §4), zodat onderzoek, bronnen,
 * shotlist en beeld gedeeld worden en alleen script, stem, ondertiteling en
 * metadata per taal verschillen.
 */

export type LanguageCode = 'nl' | 'de' | 'en'

export type ProductionState =
  | 'draft'
  | 'angle_set'
  | 'researched'
  | 'scripted'
  | 'religion_checked'
  | 'fact_checked'
  | 'originality_checked'
  | 'retention_reviewed'
  | 'voiced'
  | 'storyboarded'
  | 'assets_generated'
  | 'assembled'
  | 'captioned'
  | 'packaged'
  | 'trust_checked'
  | 'awaiting_reviewer'
  | 'awaiting_approval'
  | 'approved'
  | 'uploaded_private'
  | 'scheduled'
  | 'published'
  | 'measured'
  | 'rejected'

/** Klassen uit docs/12 §1. A t/m D hebben een harde herkomsteis. */
export type ClaimClass = 'quran' | 'hadith' | 'fiqh' | 'history' | 'general'

export interface Source {
  id: string
  /**
   * `circulated` = "dit is wat overal rondgaat". Dat is uitdrukkelijk géén
   * bewijs: bij islamitische content is wijdverbreide herhaling eerder een
   * waarschuwing dan een bevestiging, omdat juist zwakke en verzonnen
   * overleveringen het vaakst worden doorgegeven. Zie docs/12 §8.
   */
  kind: 'primary' | 'secondary' | 'circulated'
  /** Bijv. 'Koran', 'Sahih al-Bukhari', 'CBS', 'Sira Ibn Hisham'. */
  work: string
  /** Soera:ayah, hadithnummer, paginanummer of URL. */
  locator: string
  /** Alleen voor hadith: sahih | hasan | da'if | mawdu'. */
  grading?: string
  /** Wie de gradering gaf. Verplicht zodra `grading` is gezet. */
  gradedBy?: string
  /** Voor Koranvertalingen: de bij naam genoemde gepubliceerde vertaling. */
  translation?: string
  retrievedAt: string
}

export interface Claim {
  id: string
  text: string
  claimClass: ClaimClass
  /** Leeg = de claim heeft geen bron. Dat blokkeert de build. */
  sourceIds: string[]
  /** Waar in het script, in seconden vanaf het begin. */
  atSecond: number
  /** Gesteld als feit, of toegeschreven aan een school/geleerde? */
  attributedTo?: string
  /** True wanneer het script benoemt dat geleerden hierover verschillen. */
  notesScholarlyDifference: boolean
}

/**
 * `figureFree` betekent: in deze scène mag geen menselijke figuur worden
 * afgebeeld. Zie docs/12 §2 — dit is geen promptinstructie maar een
 * shotlist-eigenschap die de assetcontrole afdwingt.
 */
export interface Shot {
  index: number
  fromSecond: number
  toSecond: number
  description: string
  figureFree: boolean
  /** Arabische tekst komt uit de geverifieerde bibliotheek, nooit uit een model. */
  arabicAssetId?: string
}

export interface LicenseProof {
  id: string
  holder: string
  terms: string
  commercialUse: boolean
  evidenceUri: string
}

export interface Asset {
  id: string
  kind: 'image' | 'video' | 'audio' | 'music' | 'thumbnail'
  uri: string
  sha256: string
  origin: 'generated' | 'licensed' | 'own'
  provider: string
  promptUsed?: string
  modelVersion?: string
  /** Verplicht. Een asset zonder licentiebewijs kan de montage niet in. */
  licenseProofId: string
  /** Uitkomst van de figuurcontrole; null wanneer niet van toepassing. */
  figureCheck?: 'pass' | 'fail' | 'not_applicable'
}

export interface LanguageVariant {
  language: LanguageCode
  script?: Script
  voiceOverAssetId?: string
  srtPath?: string
  metadata?: VideoMetadata
  videoPath?: string
}

export interface Script {
  /** "Deze video betoogt dat…" — zonder invulbare stelling geen script. */
  thesis: string
  hook: string
  promise: string
  segments: ScriptSegment[]
  counterArgument: string
  conclusion: string
  callToAction: string
  wordCount: number
}

export interface ScriptSegment {
  title: string
  body: string
  /** Open loop die in een later segment wordt gesloten. */
  opensLoop?: string
  closesLoop?: string
}

export interface VideoMetadata {
  titleOptions: string[]
  description: string
  chapters: { atSecond: number; label: string }[]
  tags: string[]
  pinnedComment: string
  aiDisclosureRequired: boolean
}

export interface GateResult {
  gate: GateKey
  score: number
  threshold: number
  passed: boolean
  blocking: boolean
  /** Per deelcriterium een score met onderbouwing. Een kaal getal is nutteloos. */
  breakdown: { criterion: string; score: number; max: number; reasoning: string }[]
  evaluatedAt: string
}

export type GateKey =
  | 'niche_score'
  | 'thesis'
  | 'religious_integrity'
  | 'source_confidence'
  | 'originality'
  | 'retention_readiness'
  | 'editorial_quality'
  | 'technical_qc'
  | 'trust'
  | 'policy_risk'

export interface CostEntry {
  id: string
  productionId: string
  step: string
  provider: string
  costCents: number
  latencyMs: number
  providerRef: string
  at: string
}

export interface AuditEvent {
  id: string
  productionId: string | null
  kind: string
  detail: Record<string, unknown>
  at: string
}

export interface Production {
  id: string
  state: ProductionState
  createdAt: string
  topic: string
  /**
   * Titels van referentievideo's, als invoer. Ze staan in quarantaine: ze
   * voeden de werktitel en de patroonanalyse, maar mogen de gepubliceerde
   * metadata niet halen. `screenTitles` bewaakt dat. Zie docs/13 §1.
   */
  seedTitles: string[]
  /** Interne werktitel tijdens de productie; nooit de gepubliceerde titel. */
  workingTitle?: string
  /** Waarom deze video naast de referentie bestaansrecht heeft. */
  originalityBrief?: string
  researchBrief?: string
  claims: Claim[]
  sources: Source[]
  shots: Shot[]
  assetIds: string[]
  variants: LanguageVariant[]
  gateResults: GateResult[]
  rejectedReason?: string
  /** Idempotency-sleutel voor de upload; voorkomt dubbele publicatie. */
  uploadKey?: string
  youtubeVideoId?: string
}
