import type { ProviderResult, VideoClipProvider } from '../contracts.js'
import { download, postJson } from '../http.js'

/**
 * Generatieve videoclips via fal.ai, per seconde afgerekend.
 *
 * Het ontwerp gebruikt deze clips als accent — 20 tot 30 seconden per video —
 * en niet als hoofdbeeld. Elf minuten volledig generatief kost meer dan het
 * hele maandbudget; zie docs/11 §5.
 */

interface FalVideoResponse {
  video?: { url: string }
}

export interface FalVideoOptions {
  apiKey?: string
  model?: string
  /** Prijs per seconde in dollarcent. */
  centsPerSecond?: number
}

export class FalVideoProvider implements VideoClipProvider {
  readonly name = 'fal-video'
  readonly simulated = false

  private readonly apiKey: string
  private readonly model: string
  private readonly centsPerSecond: number

  constructor(opts: FalVideoOptions = {}) {
    const key = opts.apiKey ?? process.env['FAL_KEY'] ?? ''
    if (!key) throw new Error('FAL_KEY ontbreekt. Zie docs/HANDLEIDING.md stap 8.')
    this.apiKey = key
    this.model = opts.model ?? process.env['FAL_VIDEO_MODEL'] ?? 'fal-ai/kling-video/v2/standard/text-to-video'
    this.centsPerSecond = opts.centsPerSecond ?? Number(process.env['FAL_VIDEO_CENTS_PER_SEC'] ?? 3)
  }

  async generate(input: { prompt: string; seconds: number; outPath: string }) {
    const startedAt = Date.now()
    const response = await postJson<FalVideoResponse>({
      provider: 'fal.ai',
      url: `https://fal.run/${this.model}`,
      headers: { authorization: `Key ${this.apiKey}` },
      body: {
        prompt: input.prompt,
        duration: String(Math.round(input.seconds)),
        negative_prompt: 'mensen, gezichten, logo, watermerk, tekst',
      },
      // Videogeneratie duurt minuten, geen seconden.
      timeoutMs: 600_000,
      maxTries: 3,
    })

    const url = response.video?.url
    if (!url) throw new Error('fal.ai leverde geen video terug.')
    await download(url, input.outPath)

    return {
      value: { path: input.outPath },
      costCents: Math.ceil(input.seconds * this.centsPerSecond),
      latencyMs: Date.now() - startedAt,
      providerRef: `fal:${this.model}`,
    } satisfies ProviderResult<{ path: string }>
  }
}
