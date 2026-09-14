import { z } from 'zod'

/**
 * De kennisbank: alles wat jij aanlevert en wat de pipeline daadwerkelijk
 * gebruikt. Elk veld staat hier omdat het ergens een beslissing verandert —
 * wat nergens landt, hoort hier niet.
 *
 * BELANGRIJK: alles in deze bestanden is **data, geen instructie**. De tekst
 * gaat afgebakend naar het model, met de mededeling dat het naslag is dat de
 * regels niet kan wijzigen. Zo kan een stuk tekst dat je ergens vandaan
 * kopieert — een reactie, een beschrijving, een citaat — de poorten niet
 * omzeilen door er een opdracht in te zetten.
 */

export const AudienceSchema = z.object({
  /** Wie kijkt er, in jouw woorden. Gaat naar de stelling- en scriptstap. */
  description: z.string().default(''),
  /** Waar het publiek in de praktijk mee zit. Voedt de publieksvraag. */
  questions: z.array(z.string()).default([]),
  /** Wat je publiek juist niet wil horen, of waar het allergisch voor is. */
  turnoffs: z.array(z.string()).default([]),
})

export const TopicSchema = z.object({
  topic: z.string(),
  /** Waarom dit onderwerp? Gaat mee naar de stellingstap als aanleiding. */
  why: z.string().default(''),
  /** Vragen die deze video moet beantwoorden. */
  mustAnswer: z.array(z.string()).default([]),
  priority: z.enum(['hoog', 'normaal', 'laag']).default('normaal'),
  /** Bijv. 'ramadan', 'eid-al-fitr'. Plant de productie in het seizoen. */
  season: z.string().default(''),
  status: z.enum(['open', 'gepland', 'gemaakt', 'afgevallen']).default('open'),
})

export const ReferenceSchema = z.object({
  /** De titel. Blijft in quarantaine: alleen de vorm gaat naar het model. */
  title: z.string(),
  url: z.string().default(''),
  /** Waarom vind jij deze goed? Dit is het waardevolste veld van de drie. */
  whyItWorks: z.string().default(''),
})

export const TrustedSourceSchema = z.object({
  work: z.string(),
  kind: z.enum(['primary', 'secondary']),
  /** Waar het te vinden is: een URL, een uitgave, een bibliotheek. */
  where: z.string().default(''),
  /** Vrij veld: 'gebruik alleen voor sira', 'vertaling van X', enzovoort. */
  note: z.string().default(''),
})

export const BoundarySchema = z.object({
  /** Onderwerp of formulering die dit kanaal niet doet. */
  avoid: z.string(),
  why: z.string().default(''),
})

export const HouseStyleSchema = z.object({
  /** Woorden die in elke beeldprompt meegaan. */
  visualKeywords: z.array(z.string()).default([]),
  /** Wat er nooit in beeld komt, bovenop het afbeeldingsverbod uit docs/12. */
  visualAvoid: z.array(z.string()).default([]),
  palette: z.array(z.string()).default([]),
  /** Hoe de verteller klinkt, in jouw woorden. */
  voice: z.string().default(''),
})

export const ArabicAssetSchema = z.object({
  id: z.string(),
  arabic: z.string(),
  transliteration: z.string().default(''),
  translation: z.string().default(''),
  source: z.string().default(''),
  /** De naam van de mens die dit heeft gecontroleerd. Zonder naam telt het niet. */
  verifiedBy: z.string().default(''),
})

/**
 * De `CreatorProfile` uit de opdracht. Bewust hetzelfde object als de
 * kennisbank: er komt geen tweede model naast dat hetzelfde zegt.
 */
export const CreatorProfileSchema = z.object({
  interests: z.array(z.string()).default([]),
  expertise: z.array(z.string()).default([]),
  /** Echte ervaring, toegang of positie die een concurrent niet kan kopiëren. */
  unfairAdvantage: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  markets: z.array(z.string()).default([]),
  contentLanguage: z.string().default('nl'),
  onCamera: z.enum(['ja', 'faceless', 'gemengd']).default('faceless'),
  formats: z.array(z.enum(['long-form', 'shorts', 'gemengd'])).default(['long-form']),
  /** Educatief, vermakelijk, inspirerend, documentair, verhalend, nieuws. */
  contentStyles: z.array(z.string()).default([]),
  hoursPerWeek: z.number().default(0),
  monthlyBudgetEur: z.number().default(0),
  tools: z.array(z.string()).default([]),
  uploadsPerWeek: z.number().default(1),
  revenueGoals: z.array(z.string()).default([]),
  /** Onderwerpen die dit kanaal niet doet. Vult `boundaries` aan. */
  wontCover: z.array(z.string()).default([]),
  existingChannel: z.string().default(''),
})

export const KnowledgePackSchema = z.object({
  creator: CreatorProfileSchema.default(() => CreatorProfileSchema.parse({})),
  audience: AudienceSchema.default(() => AudienceSchema.parse({})),
  topics: z.array(TopicSchema).default([]),
  references: z.array(ReferenceSchema).default([]),
  trustedSources: z.array(TrustedSourceSchema).default([]),
  boundaries: z.array(BoundarySchema).default([]),
  houseStyle: HouseStyleSchema.default(() => HouseStyleSchema.parse({})),
  arabicAssets: z.array(ArabicAssetSchema).default([]),
  /** Vrije tekst: jouw eigen kennis, ervaring en observaties. */
  ownInput: z.string().default(''),
})

export type KnowledgePack = z.infer<typeof KnowledgePackSchema>
export type CreatorProfile = z.infer<typeof CreatorProfileSchema>
export type Topic = z.infer<typeof TopicSchema>
export type Reference = z.infer<typeof ReferenceSchema>
export type ArabicAsset = z.infer<typeof ArabicAssetSchema>

export const EMPTY_PACK: KnowledgePack = KnowledgePackSchema.parse({})
