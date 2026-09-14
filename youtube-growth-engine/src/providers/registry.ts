import type { ImageProvider, Providers, ProviderResult, VideoClipProvider } from './contracts.js'
import { MockLlmProvider } from './mock/llm.js'
import {
  FfmpegRenderProvider, MockImageProvider, MockMusicProvider,
  MockSearchProvider, MockTtsProvider, MockVideoClipProvider,
} from './mock/media.js'
import { LocalEbookProvider } from './ebook.js'
import { ClaudeLlmProvider } from './claude/llm.js'
import { FalImageProvider } from './fal/image.js'
import { FalVideoProvider } from './fal/video.js'
import { GeminiImageProvider } from './google/image.js'
import { ElevenLabsTtsProvider } from './elevenlabs/tts.js'
import { LocalClipProvider } from './local/clips.js'

/**
 * Kiest de providers op grond van wat er in de omgeving staat. Ontbreekt een
 * sleutel, dan valt die rol terug op de mock — de pipeline blijft dan draaien
 * en zegt erbij wat er gesimuleerd is, in plaats van halverwege te stoppen.
 *
 * Dit is waar de belofte uit docs/04 wordt ingelost: een leverancier vervangen
 * is een regel in deze tabel plus een adapter, niet een verbouwing.
 */

/**
 * Stuurt thumbnails naar een ander model dan scenestills.
 *
 * De reden is één eigenschap: leesbare tekst in beeld. Een thumbnail heeft twee
 * tot vier woorden nodig die op een telefoon te lezen zijn; een scenestill heeft
 * dat niet. Het duurdere model alleen daarvoor gebruiken scheelt bij ~310
 * beelden per maand ongeveer een tientje, en dat is precies het soort verschil
 * dat bij een budget van EUR 100 telt.
 */
export class SplitImageProvider implements ImageProvider {
  readonly name: string
  readonly simulated: boolean

  constructor(
    private readonly stills: ImageProvider,
    private readonly thumbnails: ImageProvider,
  ) {
    this.name = `${stills.name}+${thumbnails.name}`
    this.simulated = stills.simulated && thumbnails.simulated
  }

  async generate(input: Parameters<ImageProvider['generate']>[0]) {
    // Een thumbnail is 16:9 en breed; scenestills ook, dus het onderscheid komt
    // uit het pad dat de pipeline meegeeft.
    const isThumbnail = /thumb/i.test(input.outPath)
    return (isThumbnail ? this.thumbnails : this.stills).generate(input)
  }
}

export interface ProviderReport {
  role: string
  name: string
  simulated: boolean
  /** Wat er ontbreekt om deze rol echt te maken. */
  missing?: string
}

export interface BuiltProviders {
  providers: Providers
  report: ProviderReport[]
}

function pickImage(): { provider: ImageProvider; missing?: string } {
  const hasFal = Boolean(process.env['FAL_KEY'])
  const hasGemini = Boolean(process.env['GEMINI_API_KEY'])

  if (hasFal && hasGemini) {
    return {
      provider: new SplitImageProvider(new FalImageProvider(), new GeminiImageProvider()),
    }
  }
  if (hasFal) {
    return { provider: new FalImageProvider(), missing: 'GEMINI_API_KEY voor thumbnails met leesbare tekst' }
  }
  if (hasGemini) {
    return { provider: new GeminiImageProvider(), missing: 'FAL_KEY — scenestills zijn daar ongeveer vier keer goedkoper' }
  }
  return { provider: new MockImageProvider(), missing: 'FAL_KEY en GEMINI_API_KEY' }
}

function pickVideo(): { provider: VideoClipProvider; missing?: string } {
  // Handgemaakte clips gaan voor: heb je ze geëxporteerd uit een tool zonder
  // API, dan wil je die gebruiken en niet ernaast nog eens laten genereren.
  if (process.env['LOCAL_CLIPS_DIR']) {
    return { provider: new LocalClipProvider() }
  }
  if (process.env['FAL_KEY']) return { provider: new FalVideoProvider() }
  return {
    provider: new MockVideoClipProvider(),
    missing: 'FAL_KEY — of LOCAL_CLIPS_DIR als je clips met de hand aanlevert',
  }
}

export function buildProviders(): BuiltProviders {
  const report: ProviderReport[] = []
  const note = (role: string, p: { name: string; simulated: boolean }, missing?: string) => {
    report.push({ role, name: p.name, simulated: p.simulated, ...(missing ? { missing } : {}) })
  }

  const llm = process.env['ANTHROPIC_API_KEY']
    ? new ClaudeLlmProvider()
    : new MockLlmProvider()
  note('redactie', llm, process.env['ANTHROPIC_API_KEY'] ? undefined : 'ANTHROPIC_API_KEY')

  const image = pickImage()
  note('beeld', image.provider, image.missing)

  const video = pickVideo()
  note('videoclips', video.provider, video.missing)

  // De stem wordt pas echt als er én een sleutel én een gekozen stem is. Dat
  // tweede is geen formaliteit: de stemtest uit stap 5 kan niemand overslaan.
  const canSpeak = Boolean(process.env['TTS_API_KEY'] && process.env['TTS_VOICE_ID'])
  const tts = canSpeak ? new ElevenLabsTtsProvider() : new MockTtsProvider()
  note('stem', tts, canSpeak ? undefined
    : process.env['TTS_API_KEY']
      ? 'TTS_VOICE_ID — kies de stem pas ná de stemtest uit stap 5'
      : 'TTS_API_KEY en TTS_VOICE_ID')

  const search = new MockSearchProvider()
  const music = new MockMusicProvider()
  const render = new FfmpegRenderProvider()
  const ebook = new LocalEbookProvider()
  note('zoeken', search, 'gaat via de redactie zodra die echt is')
  note('muziek', music, 'MUSIC_API_KEY')
  note('montage', render)
  note('werkboek', ebook)

  return {
    providers: { llm, search, tts, image: image.provider, videoClip: video.provider, music, render, ebook },
    report,
  }
}

/** Wat een maand kost bij het huidige tempo, met de gekozen providers. */
export function monthlyEstimate(opts: {
  longFormPerMonth: number
  imagesPerVideo: number
  thumbnailsPerVideo: number
  clipSecondsPerVideo: number
}): { images: number; thumbnails: number; clips: number; totalCents: number } {
  const falCents = Number(process.env['FAL_IMAGE_CENTS'] ?? 3)
  const geminiCents = Number(process.env['GEMINI_IMAGE_CENTS'] ?? 14)
  const clipCents = Number(process.env['FAL_VIDEO_CENTS_PER_SEC'] ?? 3)

  const images = Math.round(opts.longFormPerMonth * opts.imagesPerVideo)
  const thumbnails = Math.round(opts.longFormPerMonth * opts.thumbnailsPerVideo)
  const clipSeconds = Math.round(opts.longFormPerMonth * opts.clipSecondsPerVideo)

  return {
    images,
    thumbnails,
    clips: clipSeconds,
    totalCents: images * falCents + thumbnails * geminiCents + clipSeconds * clipCents,
  }
}

export type { ProviderResult }
