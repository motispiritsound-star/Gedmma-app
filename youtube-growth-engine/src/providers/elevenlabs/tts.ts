import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { ProviderResult, TtsProvider } from '../contracts.js'
import type { LanguageCode } from '../../domain/types.js'
import { postJson } from '../http.js'
import { probeDurationMs } from '../../lib/ffmpeg.js'

/**
 * Voice-over via ElevenLabs, met tijdstempels per teken.
 *
 * Die tijdstempels zijn het hele selectiecriterium: daaruit komt de
 * ondertiteling, exact uitgelijnd, zonder aparte spraakherkenning erbij. Dat
 * scheelt een stap, een leverancier en een foutbron. Zie docs/05 §4.
 *
 * [status: adapter is geschreven maar niet tegen de dienst getest — deze
 * sessie had geen sleutel en kon de documentatie niet bereiken]
 */

interface TimestampResponse {
  audio_base64?: string
  alignment?: {
    characters?: string[]
    character_start_times_seconds?: number[]
  }
  normalized_alignment?: {
    characters?: string[]
    character_start_times_seconds?: number[]
  }
}

export interface ElevenLabsOptions {
  apiKey?: string
  voiceId?: string
  modelId?: string
  /** Prijs per 1.000 tekens in dollarcent. */
  centsPerThousandChars?: number
}

/** ElevenLabs kapt lange teksten af; splitsen op zinsgrens houdt de prosodie heel. */
function splitOnSentences(text: string, maxChars: number): string[] {
  const sentences = text.match(/[^.!?]+[.!?]*\s*/g) ?? [text]
  const chunks: string[] = []
  let current = ''
  for (const sentence of sentences) {
    if (current.length + sentence.length > maxChars && current) {
      chunks.push(current.trim())
      current = sentence
    } else {
      current += sentence
    }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks
}

export class ElevenLabsTtsProvider implements TtsProvider {
  readonly name = 'elevenlabs'
  readonly simulated = false

  private readonly apiKey: string
  private readonly voiceId: string
  private readonly modelId: string
  private readonly centsPerThousandChars: number

  constructor(opts: ElevenLabsOptions = {}) {
    const key = opts.apiKey ?? process.env['TTS_API_KEY'] ?? ''
    if (!key) throw new Error('TTS_API_KEY ontbreekt. Zie docs/HANDLEIDING.md stap 5.')
    this.apiKey = key
    const voice = opts.voiceId ?? process.env['TTS_VOICE_ID'] ?? ''
    if (!voice) {
      throw new Error(
        'TTS_VOICE_ID ontbreekt. Kies de stem pas ná de stemtest uit stap 5: ' +
        'Nederlands is de taal waarin een synthetische stem het snelst wordt ' +
        'ontmaskerd, en geen specificatie voorspelt dat.',
      )
    }
    this.voiceId = voice
    this.modelId = opts.modelId ?? process.env['TTS_MODEL_ID'] ?? 'eleven_multilingual_v2'
    this.centsPerThousandChars = opts.centsPerThousandChars
      ?? Number(process.env['TTS_CENTS_PER_1K'] ?? 10)
  }

  async speak(input: { text: string; language: LanguageCode; outPath: string }) {
    const startedAt = Date.now()
    const chunks = splitOnSentences(input.text, 4500)

    const audioParts: Buffer[] = []
    const charTimings: { char: string; atMs: number }[] = []
    let offsetMs = 0

    for (const chunk of chunks) {
      const response = await postJson<TimestampResponse>({
        provider: 'elevenlabs',
        url: `https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}/with-timestamps`,
        headers: { 'xi-api-key': this.apiKey },
        body: {
          text: chunk,
          model_id: this.modelId,
          voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0 },
        },
        timeoutMs: 300_000,
      })

      if (!response.audio_base64) throw new Error('ElevenLabs leverde geen audio terug.')
      const audio = Buffer.from(response.audio_base64, 'base64')
      audioParts.push(audio)

      const alignment = response.alignment ?? response.normalized_alignment
      const characters = alignment?.characters ?? []
      const starts = alignment?.character_start_times_seconds ?? []
      for (const [i, char] of characters.entries()) {
        charTimings.push({ char, atMs: offsetMs + Math.round((starts[i] ?? 0) * 1000) })
      }

      // Het volgende stuk begint waar dit eindigde. Zonder deze verschuiving
      // lopen de ondertitels van stuk twee terug naar nul.
      const lastStart = starts[starts.length - 1] ?? 0
      offsetMs += Math.round(lastStart * 1000) + 400
    }

    await mkdir(dirname(input.outPath), { recursive: true })
    await writeFile(input.outPath, Buffer.concat(audioParts))
    const durationMs = await probeDurationMs(input.outPath)

    return {
      value: { path: input.outPath, durationMs, charTimings },
      costCents: Math.ceil((input.text.length / 1000) * this.centsPerThousandChars),
      latencyMs: Date.now() - startedAt,
      providerRef: `elevenlabs:${this.modelId}:${this.voiceId}`,
    } satisfies ProviderResult<{
      path: string; durationMs: number; charTimings: { char: string; atMs: number }[]
    }>
  }
}

export { splitOnSentences }
