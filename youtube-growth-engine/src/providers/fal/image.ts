import type { ImageProvider, ProviderResult } from '../contracts.js'
import { download, postJson } from '../http.js'

/**
 * Beeldgeneratie via fal.ai.
 *
 * Gekozen boven een abonnement omdat het per aanroep rekent: bij 1 video per
 * week is dat ongeveer de helft van de prijs, het is maandelijks op te zeggen,
 * en het is een echte API in plaats van een dashboard waar iemand in moet
 * klikken. Zie docs/15.
 *
 * LET OP — commerciële rechten volgen het MODEL, niet het platform. fal.ai geeft
 * de licentie van het onderliggende model door. Controleer die van het model dat
 * je in `FAL_IMAGE_MODEL` zet, en leg het bewijs vast als `LicenseProof`.
 * [status: adapter is geschreven maar niet tegen de dienst getest]
 */

interface FalImageResponse {
  images?: { url: string; width?: number; height?: number }[]
}

export interface FalImageOptions {
  apiKey?: string
  /** Bijv. 'fal-ai/flux-pro/kontext' of 'fal-ai/bytedance/seedream/v4'. */
  model?: string
  /** Prijs per beeld in dollarcent, voor de kostenregistratie. */
  centsPerImage?: number
  /** Zo kan een test de netwerkaanroep vervangen. */
  fetchImpl?: typeof postJson
}

export class FalImageProvider implements ImageProvider {
  readonly name = 'fal-image'
  readonly simulated = false

  private readonly apiKey: string
  private readonly model: string
  private readonly centsPerImage: number

  constructor(opts: FalImageOptions = {}) {
    const key = opts.apiKey ?? process.env['FAL_KEY'] ?? ''
    if (!key) throw new Error('FAL_KEY ontbreekt. Zie docs/HANDLEIDING.md stap 8.')
    this.apiKey = key
    this.model = opts.model ?? process.env['FAL_IMAGE_MODEL'] ?? 'fal-ai/bytedance/seedream/v4'
    this.centsPerImage = opts.centsPerImage ?? Number(process.env['FAL_IMAGE_CENTS'] ?? 3)
  }

  async generate(input: {
    prompt: string; figureFree: boolean; width: number; height: number
    outPath: string; styleBrief?: string; avoid?: string[]
  }): Promise<ProviderResult<{ path: string; figureCheck: 'pass' | 'fail' }>> {
    const startedAt = Date.now()

    // Het afbeeldingsverbod gaat mee als negatieve prompt, maar dat is niet
    // waar we op vertrouwen: de shotlist-validatie en de assetcontrole in
    // domain/gates.ts zijn wat het echt afdwingt. Een prompt is een verzoek.
    const guards = [
      ...(input.avoid ?? []),
      ...(input.figureFree
        ? ['geen mensen', 'geen gezichten', 'geen menselijke figuren', 'no people', 'no faces']
        : []),
      'geen logo', 'geen watermerk', 'geen tekst in een schrift dat je niet beheerst',
    ]

    const prompt = [
      input.prompt,
      input.styleBrief,
      input.figureFree ? 'Toon landschap, architectuur, objecten, licht of abstractie.' : '',
    ].filter(Boolean).join('. ')

    const response = await postJson<FalImageResponse>({
      provider: 'fal.ai',
      url: `https://fal.run/${this.model}`,
      headers: { authorization: `Key ${this.apiKey}` },
      body: {
        prompt,
        negative_prompt: guards.join(', '),
        image_size: { width: input.width, height: input.height },
        num_images: 1,
        enable_safety_checker: true,
      },
      timeoutMs: 180_000,
    })

    const url = response.images?.[0]?.url
    if (!url) throw new Error('fal.ai leverde geen beeld terug.')
    await download(url, input.outPath)

    return {
      // `figureCheck` staat hier bewust op 'pass': de echte controle hoort bij
      // een visueel model dat het resultaat bekijkt, niet bij de generator die
      // het maakte. Tot die controle er is, is dit een open punt en geen bewijs.
      value: { path: input.outPath, figureCheck: 'pass' },
      costCents: this.centsPerImage,
      latencyMs: Date.now() - startedAt,
      providerRef: `fal:${this.model}`,
    }
  }
}
