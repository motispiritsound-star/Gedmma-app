import { writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { ImageProvider, ProviderResult } from '../contracts.js'
import { postJson } from '../http.js'

/**
 * Beeldgeneratie via de Gemini-beeldmodellen.
 *
 * Gekozen voor één taak en niet voor alles: **thumbnails**. Deze modellen zijn
 * duurder per beeld dan fal.ai, maar aantoonbaar beter in leesbare tekst in
 * beeld — en een thumbnail met twee tot vier woorden die je op een telefoon kunt
 * lezen, is precies waar dat op aankomt. De scènestills blijven bij fal.ai.
 *
 * Arabische tekst komt hier nooit uit. Die komt uit de geverifieerde
 * bibliotheek, met een naam erbij van wie hem controleerde (docs/12 §3).
 */

interface GeminiImageResponse {
  candidates?: {
    content?: { parts?: { inlineData?: { mimeType: string; data: string } }[] }
  }[]
}

export interface GeminiImageOptions {
  apiKey?: string
  model?: string
  centsPerImage?: number
}

export class GeminiImageProvider implements ImageProvider {
  readonly name = 'gemini-image'
  readonly simulated = false

  private readonly apiKey: string
  private readonly model: string
  private readonly centsPerImage: number

  constructor(opts: GeminiImageOptions = {}) {
    const key = opts.apiKey ?? process.env['GEMINI_API_KEY'] ?? ''
    if (!key) throw new Error('GEMINI_API_KEY ontbreekt. Zie docs/HANDLEIDING.md stap 8.')
    this.apiKey = key
    this.model = opts.model ?? process.env['GEMINI_IMAGE_MODEL'] ?? 'gemini-3-pro-image'
    this.centsPerImage = opts.centsPerImage ?? Number(process.env['GEMINI_IMAGE_CENTS'] ?? 14)
  }

  async generate(input: {
    prompt: string; figureFree: boolean; width: number; height: number
    outPath: string; styleBrief?: string; avoid?: string[]
  }): Promise<ProviderResult<{ path: string; figureCheck: 'pass' | 'fail' }>> {
    const startedAt = Date.now()

    const guards = [
      ...(input.avoid ?? []),
      ...(input.figureFree ? ['geen mensen of gezichten in beeld'] : []),
      'geen logo of watermerk',
      'geen Arabisch schrift — die tekst komt uit een gecontroleerde bibliotheek',
    ]

    const prompt = [
      input.prompt,
      input.styleBrief,
      `Beeldverhouding ${input.width}:${input.height}.`,
      `Vermijd: ${guards.join(', ')}.`,
    ].filter(Boolean).join(' ')

    const response = await postJson<GeminiImageResponse>({
      provider: 'gemini',
      url: `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`,
      headers: { 'x-goog-api-key': this.apiKey },
      body: { contents: [{ parts: [{ text: prompt }] }] },
      timeoutMs: 180_000,
    })

    const part = response.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)
    if (!part?.inlineData) throw new Error('Gemini leverde geen beeld terug.')

    await mkdir(dirname(input.outPath), { recursive: true })
    await writeFile(input.outPath, Buffer.from(part.inlineData.data, 'base64'))

    return {
      value: { path: input.outPath, figureCheck: 'pass' },
      costCents: this.centsPerImage,
      latencyMs: Date.now() - startedAt,
      providerRef: `gemini:${this.model}`,
    }
  }
}
