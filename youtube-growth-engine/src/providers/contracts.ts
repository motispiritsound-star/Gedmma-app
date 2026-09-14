import type {
  Claim, LanguageCode, Script, Shot, Source, VideoMetadata,
} from '../domain/types.js'

/**
 * Elke provideraanroep rapporteert verplicht wat hij kostte. Kostenregistratie
 * is daarmee een bijproduct van het contract en geen aparte administratie:
 * een provider aanroepen zonder kosten te loggen kan niet.
 */
export interface ProviderResult<T> {
  value: T
  costCents: number
  latencyMs: number
  providerRef: string
}

export interface ProviderMeta {
  /** Naam zoals hij in kostenoverzichten en het auditlog verschijnt. */
  name: string
  /** True wanneer dit een mock is. Het dashboard toont dat expliciet. */
  simulated: boolean
}

export interface LlmProvider extends ProviderMeta {
  proposeThesis(input: {
    topic: string
    audienceInsight: string
    referencePatterns: string[]
  }): Promise<ProviderResult<{ thesis: string; originalityBrief: string } | null>>

  research(input: {
    thesis: string
    language: LanguageCode
  }): Promise<ProviderResult<{ brief: string; sources: Source[] }>>

  writeScript(input: {
    thesis: string
    brief: string
    sources: Source[]
    language: LanguageCode
    targetSeconds: number
  }): Promise<ProviderResult<{ script: Script; claims: Claim[] }>>

  buildShotlist(input: {
    script: Script
    claims: Claim[]
    totalSeconds: number
  }): Promise<ProviderResult<Shot[]>>

  writeMetadata(input: {
    script: Script
    language: LanguageCode
    hasPhotorealisticScenes: boolean
  }): Promise<ProviderResult<VideoMetadata>>

  /** Gespreksvragen bij een hoofdstuk van het werkboek. */
  writeWorkbookQuestions(input: {
    script: Script
    language: LanguageCode
    count: number
  }): Promise<ProviderResult<string[]>>

  /** Vertaalt een bestaand script; hergebruikt onderzoek, bronnen en beeld. */
  translateScript(input: {
    script: Script
    from: LanguageCode
    to: LanguageCode
  }): Promise<ProviderResult<Script>>
}

export interface SearchProvider extends ProviderMeta {
  find(query: string, limit: number): Promise<ProviderResult<Source[]>>
}

export interface TtsProvider extends ProviderMeta {
  speak(input: {
    text: string
    language: LanguageCode
    outPath: string
  }): Promise<ProviderResult<{
    path: string
    durationMs: number
    /** Timestamps per teken; hieruit komt de ondertiteling, zonder aparte ASR. */
    charTimings: { char: string; atMs: number }[]
  }>>
}

export interface ImageProvider extends ProviderMeta {
  generate(input: {
    prompt: string
    /** Wanneer true: geen menselijke figuur. Wordt na generatie gecontroleerd. */
    figureFree: boolean
    width: number
    height: number
    outPath: string
  }): Promise<ProviderResult<{ path: string; figureCheck: 'pass' | 'fail' }>>
}

export interface VideoClipProvider extends ProviderMeta {
  generate(input: {
    prompt: string
    seconds: number
    outPath: string
  }): Promise<ProviderResult<{ path: string }>>
}

export interface MusicProvider extends ProviderMeta {
  /** `vocalsAndDuffOnly` is de standaard; zie docs/12 §4. */
  score(input: {
    seconds: number
    mood: string
    vocalsAndDuffOnly: boolean
    outPath: string
  }): Promise<ProviderResult<{ path: string; licenseUri: string }>>
}

export interface RenderProvider extends ProviderMeta {
  assemble(input: {
    shots: { imagePath: string; fromSecond: number; toSecond: number; caption: string }[]
    voiceOverPath: string
    musicPath?: string
    width: number
    height: number
    outPath: string
  }): Promise<ProviderResult<{ path: string; durationMs: number }>>
}

export interface Providers {
  llm: LlmProvider
  ebook: EbookProvider
  search: SearchProvider
  tts: TtsProvider
  image: ImageProvider
  videoClip: VideoClipProvider
  music: MusicProvider
  render: RenderProvider
}

/**
 * Een ebook of werkboek uit materiaal dat de pipeline toch al maakt: het
 * script, de bronnen en de illustraties liggen er. Dit is de goedkoopste
 * inkomstenbron in het hele systeem, omdat de productiekosten al betaald zijn.
 */
export interface EbookProvider extends ProviderMeta {
  compile(input: {
    title: string
    subtitle: string
    language: LanguageCode
    chapters: {
      heading: string
      body: string
      imagePath?: string
      questions: string[]
      sources: { work: string; locator: string }[]
    }[]
    outDir: string
  }): Promise<ProviderResult<{ htmlPath: string; pdfPath?: string }>>
}
