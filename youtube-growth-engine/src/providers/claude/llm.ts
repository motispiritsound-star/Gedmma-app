import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'
import type { LlmProvider, ProviderResult } from '../contracts.js'
import type {
  Claim, LanguageCode, Script, Shot, Source, VideoMetadata,
} from '../../domain/types.js'
import { EDITORIAL_CHARTER, TITLE_BRIEF } from './charter.js'
import { extractTitlePattern } from '../../domain/titles.js'

/** Prijzen per miljoen tokens, om de kosten per aanroep te kunnen boeken. */
const PRICES: Record<string, { in: number; out: number }> = {
  'claude-opus-5': { in: 5, out: 25 },
  'claude-sonnet-5': { in: 2, out: 10 },
  'claude-haiku-4-5': { in: 1, out: 5 },
}

type Usage = {
  input_tokens: number
  output_tokens: number
  cache_read_input_tokens?: number | null
  cache_creation_input_tokens?: number | null
}

/** Cache-reads kosten ongeveer een tiende van verse invoer. */
function costCents(model: string, usage: Usage): number {
  const price = PRICES[model] ?? PRICES['claude-opus-5']!
  const cached = usage.cache_read_input_tokens ?? 0
  const written = usage.cache_creation_input_tokens ?? 0
  const dollars =
    (usage.input_tokens / 1e6) * price.in +
    (cached / 1e6) * price.in * 0.1 +
    (written / 1e6) * price.in * 1.25 +
    (usage.output_tokens / 1e6) * price.out
  return Math.ceil(dollars * 100)
}

// --- Schema's. Ze doen dubbel werk: ze dwingen de vorm af én ze documenteren
// --- wat elke stap moet opleveren.

const ThesisSchema = z.object({
  hasDefensibleThesis: z.boolean()
    .describe('False wanneer er geen specifieke, originele stelling in te vullen is.'),
  thesis: z.string().describe('Begint met "Deze video betoogt dat". Leeg als hasDefensibleThesis false is.'),
  originalityBrief: z.string()
    .describe('Wat de referentie behandelt, welke publieksvraag blijft, welke stelling wij innemen, welk nieuw onderzoek en welke eigen voorbeelden wij toevoegen, en waarom iemand onze video naast de referentie zou kijken.'),
  whyNot: z.string().describe('Als hasDefensibleThesis false is: waarom niet.'),
})

const SourceSchema = z.object({
  kind: z.enum(['primary', 'secondary', 'circulated']),
  work: z.string(),
  locator: z.string().describe('Soera:ayah, hadithnummer, paginanummer of URL.'),
  grading: z.string().describe('Alleen voor hadith. Leeg laten als niet van toepassing.'),
  gradedBy: z.string().describe('Wie de gradering gaf. Leeg laten als niet van toepassing.'),
  translation: z.string().describe('Voor Koranverwijzingen: de gepubliceerde vertaling. Anders leeg.'),
})

const ResearchSchema = z.object({
  brief: z.string(),
  sources: z.array(SourceSchema),
})

const ClaimSchema = z.object({
  text: z.string(),
  claimClass: z.enum(['quran', 'hadith', 'fiqh', 'history', 'general']),
  sourceIndices: z.array(z.number()).describe('Indexen in de meegegeven bronnenlijst.'),
  atSecond: z.number(),
  attributedTo: z.string().describe('Voor fiqh-claims: de school of geleerde. Anders leeg.'),
  notesScholarlyDifference: z.boolean(),
})

const ScriptSchema = z.object({
  thesis: z.string(),
  hook: z.string().describe('5 tot 15 seconden.'),
  promise: z.string(),
  segments: z.array(z.object({
    title: z.string(),
    body: z.string(),
    opensLoop: z.string().describe('Leeg als dit segment geen loop opent.'),
    closesLoop: z.string().describe('Leeg als dit segment geen loop sluit.'),
  })).describe('Drie tot vijf segmenten.'),
  counterArgument: z.string(),
  conclusion: z.string(),
  callToAction: z.string(),
  claims: z.array(ClaimSchema),
})

const ShotlistSchema = z.object({
  shots: z.array(z.object({
    fromSecond: z.number(),
    toSecond: z.number(),
    description: z.string(),
    figureFree: z.boolean()
      .describe('True zodra de scene bij een verhaal over een profeet, metgezel of engel hoort.'),
    arabicAssetId: z.string().describe('Id uit de geverifieerde bibliotheek, of leeg.'),
  })),
})

const MetadataSchema = z.object({
  titleOptions: z.array(z.string()).describe('Precies drie.'),
  description: z.string(),
  chapters: z.array(z.object({ atSecond: z.number(), label: z.string() })),
  tags: z.array(z.string()),
  pinnedComment: z.string(),
  aiDisclosureRequired: z.boolean(),
})

export interface ClaudeLlmOptions {
  /** Zwaar model voor oordeelsstappen. */
  judgementModel?: string
  /** Goedkoper model voor analyse en mechanisch werk. */
  workerModel?: string
  apiKey?: string
}

/**
 * De echte redactie. Twee dingen die belangrijker zijn dan de modelkeuze:
 *
 *  1. Elke stap krijgt een schone context. De factcheck en de titelstap zien
 *     het scriptgesprek niet; een model dat zijn eigen redenering nakijkt,
 *     checkt niets.
 *  2. Het handvest staat vooraan in elke aanroep en verandert nooit, zodat
 *     prompt caching hem hergebruikt.
 */
export class ClaudeLlmProvider implements LlmProvider {
  readonly name = 'claude'
  readonly simulated = false

  private readonly client: Anthropic
  private readonly judgement: string
  private readonly worker: string

  constructor(opts: ClaudeLlmOptions = {}) {
    this.client = opts.apiKey ? new Anthropic({ apiKey: opts.apiKey }) : new Anthropic()
    this.judgement = opts.judgementModel ?? 'claude-opus-5'
    this.worker = opts.workerModel ?? 'claude-sonnet-5'
  }

  /** Eén gestructureerde aanroep met een schone context. */
  private async ask<T extends z.ZodType>(
    model: string, schema: T, prompt: string, ref: string,
  ): Promise<ProviderResult<z.infer<T>>> {
    const startedAt = Date.now()
    const response = await this.client.messages.parse({
      model,
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      output_config: { format: zodOutputFormat(schema) },
      system: [{ type: 'text', text: EDITORIAL_CHARTER, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: prompt }],
    })
    if (response.stop_reason === 'refusal') {
      throw new Error(`Model weigerde de aanvraag (${ref}): ${response.stop_details?.explanation ?? 'geen toelichting'}`)
    }
    if (!response.parsed_output) {
      throw new Error(`Model leverde geen bruikbare structuur bij ${ref}.`)
    }
    return {
      value: response.parsed_output,
      costCents: costCents(model, response.usage),
      latencyMs: Date.now() - startedAt,
      providerRef: `${model}:${ref}`,
    }
  }

  async proposeThesis(input: {
    topic: string; audienceInsight: string; referencePatterns: string[]
  }) {
    const result = await this.ask(this.judgement, ThesisSchema, `
ONDERWERP: ${input.topic}
PUBLIEK: ${input.audienceInsight}

STRUCTUURPATRONEN uit succesvolle video's in dit veld (alleen de vorm, niet de
inhoud — je krijgt geen bestaande video's te zien):
${input.referencePatterns.map((p) => `- ${p}`).join('\n')}

Bepaal of hier een stelling in te vullen is die specifiek is, een positie
inneemt en ergens tegenin gaat. Is die er niet, zet hasDefensibleThesis op
false en leg in whyNot uit waarom. Dat is een goede uitkomst, geen falen.`,
      'thesis')

    if (!result.value.hasDefensibleThesis) {
      return { ...result, value: null }
    }
    return {
      ...result,
      value: {
        thesis: result.value.thesis,
        originalityBrief: result.value.originalityBrief,
      },
    }
  }

  async research(input: { thesis: string; language: LanguageCode }) {
    const startedAt = Date.now()
    // Stap 1: zoeken. Server-side websearch levert vrije tekst met vindplaatsen;
    // structured output en server tools gaan niet samen in één aanroep.
    const searched = await this.client.messages.create({
      model: this.judgement,
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      system: [{ type: 'text', text: EDITORIAL_CHARTER, cache_control: { type: 'ephemeral' } }],
      tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 8 }],
      messages: [{
        role: 'user',
        content: `Zoek de bronnen bij deze stelling: "${input.thesis}"

Zoek naar primaire bronnen: wetteksten, statistiekbureaus, klassieke werken,
hadithcollecties met nummer en gradering. Noteer per bron precies waar iets
staat. Vind je alleen bronnen die naar elkaar verwijzen zonder oorspronkelijke
vindplaats, zeg dat dan expliciet — dat is een bevinding, geen tekort.`,
      }],
    })
    const searchText = searched.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text).join('\n')

    // Stap 2: structureren, in een schone context.
    const structured = await this.ask(this.worker, ResearchSchema, `
STELLING: ${input.thesis}
TAAL: ${input.language}

ZOEKRESULTAAT:
${searchText}

Zet dit om in een onderzoeksbrief en een bronnenlijst. Markeer een bron als
"circulated" wanneer hij alleen aantoont dat iets veel wordt herhaald, zonder
oorspronkelijke vindplaats. Vul grading en gradedBy alleen bij hadith, en alleen
wanneer je ze allebei kent.`, 'research:structure')

    const sources: Source[] = structured.value.sources.map((s, i) => ({
      id: `src-${i}`,
      kind: s.kind,
      work: s.work,
      locator: s.locator,
      ...(s.grading ? { grading: s.grading } : {}),
      ...(s.gradedBy ? { gradedBy: s.gradedBy } : {}),
      ...(s.translation ? { translation: s.translation } : {}),
      retrievedAt: new Date().toISOString(),
    }))

    return {
      value: { brief: structured.value.brief, sources },
      costCents: costCents(this.judgement, searched.usage) + structured.costCents,
      latencyMs: Date.now() - startedAt,
      providerRef: 'claude:research',
    }
  }

  async writeScript(input: {
    thesis: string; brief: string; sources: Source[]
    language: LanguageCode; targetSeconds: number
  }) {
    const sourceList = input.sources.map((s, i) =>
      `[${i}] ${s.kind} — ${s.work}, ${s.locator}` +
      (s.grading ? ` (${s.grading}, volgens ${s.gradedBy})` : '') +
      (s.translation ? ` [vertaling: ${s.translation}]` : '')).join('\n')

    const result = await this.ask(this.judgement, ScriptSchema, `
STELLING: ${input.thesis}
DOELLENGTE: ${input.targetSeconds} seconden (ongeveer ${Math.round(input.targetSeconds * 2.2)} woorden)
TAAL: ${input.language}

ONDERZOEKSBRIEF:
${input.brief}

BESCHIKBARE BRONNEN:
${sourceList}

Schrijf het script. Elke inhoudelijke bewering wordt een claim met verwijzing
naar een index uit de lijst hierboven. Een bewering waarvoor geen bron in de
lijst staat, laat je weg — je verzint er geen bron bij en je zwakt hem niet af.`,
      'script')

    const claims: Claim[] = result.value.claims.map((c, i) => ({
      id: `c${i}`,
      text: c.text,
      claimClass: c.claimClass,
      sourceIds: c.sourceIndices
        .map((idx) => input.sources[idx]?.id)
        .filter((id): id is string => id !== undefined),
      atSecond: c.atSecond,
      ...(c.attributedTo ? { attributedTo: c.attributedTo } : {}),
      notesScholarlyDifference: c.notesScholarlyDifference,
    }))

    const script: Script = {
      thesis: result.value.thesis,
      hook: result.value.hook,
      promise: result.value.promise,
      segments: result.value.segments.map((s) => ({
        title: s.title,
        body: s.body,
        ...(s.opensLoop ? { opensLoop: s.opensLoop } : {}),
        ...(s.closesLoop ? { closesLoop: s.closesLoop } : {}),
      })),
      counterArgument: result.value.counterArgument,
      conclusion: result.value.conclusion,
      callToAction: result.value.callToAction,
      wordCount: result.value.segments.reduce((n, s) => n + s.body.split(/\s+/).length, 0),
    }
    return { ...result, value: { script, claims } }
  }

  async buildShotlist(input: { script: Script; claims: Claim[]; totalSeconds: number }) {
    const result = await this.ask(this.worker, ShotlistSchema, `
SCRIPT:
${[input.script.hook, input.script.promise,
   ...input.script.segments.map((s) => `${s.title}: ${s.body}`),
   input.script.counterArgument, input.script.conclusion].join('\n\n')}

TOTALE LENGTE: ${input.totalSeconds} seconden

Maak een shotlist. Zet figureFree op true bij elke scene die bij een verhaal
over een profeet, metgezel of engel hoort — daar wordt geen menselijke figuur
afgebeeld. Beschrijf dan wat er wél in beeld is: landschap, architectuur,
objecten, kalligrafie, licht, silhouetten, handen zonder gezicht.

Mik op een visuele wisseling elke 2 tot 6 seconden waar het tempo dat vraagt,
en op rustiger scenes waar de inhoud ruimte nodig heeft.`, 'shotlist')

    const shots: Shot[] = result.value.shots.map((s, index) => ({
      index,
      fromSecond: s.fromSecond,
      toSecond: s.toSecond,
      description: s.description,
      figureFree: s.figureFree,
      ...(s.arabicAssetId ? { arabicAssetId: s.arabicAssetId } : {}),
    }))
    return { ...result, value: shots }
  }

  async writeMetadata(input: {
    script: Script; language: LanguageCode; hasPhotorealisticScenes: boolean
    seedTitles?: string[]
  }) {
    // Alleen de VORM van de referentietitels gaat mee. De tekst niet.
    const patterns = (input.seedTitles ?? []).map(extractTitlePattern)
    const patternLines = patterns.length > 0
      ? patterns.map((p, i) =>
          `- vorm ${i + 1}: ${p.shape}, ${p.wordCount} woorden` +
          `${p.hasNumber ? ', met getal' : ''}${p.hasNegation ? ', met ontkenning' : ''}` +
          `${p.hasQuestion ? ', als vraag' : ''}${p.hasSuperlative ? ', met superlatief' : ''}`)
        .join('\n')
      : '- geen patronen aangeleverd'

    const result = await this.ask(this.judgement, MetadataSchema, `
${TITLE_BRIEF}

VORMEN DIE IN DIT VELD WERKEN:
${patternLines}

STELLING: ${input.script.thesis}
HOOK: ${input.script.hook}
BELOFTE: ${input.script.promise}
SEGMENTEN: ${input.script.segments.map((s) => s.title).join(' | ')}
CONCLUSIE: ${input.script.conclusion}
TAAL: ${input.language}

Zet aiDisclosureRequired op ${input.hasPhotorealisticScenes ? 'true' : 'false'}:
${input.hasPhotorealisticScenes
  ? 'er zitten fotorealistische gegenereerde scenes in.'
  : 'de beelden zijn duidelijk gestileerd.'}
Vermeld AI-gebruik hoe dan ook in de beschrijving.`, 'metadata')

    const meta: VideoMetadata = result.value
    return { ...result, value: meta }
  }

  async writeWorkbookQuestions(input: { script: Script; language: LanguageCode; count: number }) {
    const schema = z.object({ questions: z.array(z.string()) })
    const result = await this.ask(this.worker, schema, `
Schrijf ${input.count} gespreksvragen bij dit hoofdstuk, voor een werkboek dat
een ouder met een kind doorneemt. Open vragen, geen quizvragen met één goed
antwoord. Taal: ${input.language}.

BELOFTE: ${input.script.promise}
SEGMENTEN: ${input.script.segments.map((s) => `${s.title}: ${s.body}`).join('\n')}
CONCLUSIE: ${input.script.conclusion}`, 'workbook-questions')
    return { ...result, value: result.value.questions }
  }

  async translateScript(input: { script: Script; from: LanguageCode; to: LanguageCode }) {
    const schema = z.object({
      hook: z.string(), promise: z.string(),
      segments: z.array(z.object({ title: z.string(), body: z.string() })),
      counterArgument: z.string(), conclusion: z.string(), callToAction: z.string(),
    })
    const result = await this.ask(this.worker, schema, `
Zet dit script om van ${input.from} naar ${input.to}. Geen letterlijke
vertaling: schrijf het opnieuw zodat het in de doeltaal natuurlijk loopt, met
dezelfde stelling, dezelfde cijfers en dezelfde bronnen. Laat namen, citaten en
verwijzingen ongewijzigd.

HOOK: ${input.script.hook}
BELOFTE: ${input.script.promise}
${input.script.segments.map((s) => `${s.title}\n${s.body}`).join('\n\n')}
TEGENARGUMENT: ${input.script.counterArgument}
CONCLUSIE: ${input.script.conclusion}
CALL TO ACTION: ${input.script.callToAction}`, `translate:${input.to}`)

    const script: Script = {
      ...input.script,
      hook: result.value.hook,
      promise: result.value.promise,
      segments: result.value.segments,
      counterArgument: result.value.counterArgument,
      conclusion: result.value.conclusion,
      callToAction: result.value.callToAction,
    }
    return { ...result, value: script }
  }
}
