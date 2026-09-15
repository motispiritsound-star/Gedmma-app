/**
 * Voice-over via Google Cloud Text-to-Speech, met Chirp 3: HD.
 *
 * Gekozen op volume, niet op recensies: dit kanaal spreekt ongeveer 26.000
 * tekens per maand in en Google geeft er een miljoen gratis. Zie docs/22.
 *
 * Eén ding kan Chirp 3 niet wat ElevenLabs wel doet: tijdstempels per teken
 * teruggeven. Daar hing de ondertiteling aan, dus die komt hier ergens anders
 * vandaan — en op een manier die eerlijker is dan schatten.
 *
 * Wat er gebeurt: de tekst wordt per zin ingesproken, elk stukje audio wordt
 * MET FFPROBE OPGEMETEN, en pas daarna aan elkaar gezet. Elke zin weet
 * daardoor exact wanneer hij begint en hoe lang hij duurt — gemeten, niet
 * berekend. Binnen een zin verdelen we naar tekenaantal, en dát is wel een
 * schatting; hij zit er hooguit een paar honderd milliseconden naast op een
 * regel ondertiteling die toch als geheel in beeld staat.
 *
 * [status: geschreven tegen de gepubliceerde API-vorm, niet tegen de dienst
 * getest — deze sessie had geen sleutel en de documentatie was geblokkeerd.
 * Controleer bij de eerste echte aanroep of de foutmelding klopt met wat hier
 * staat, en corrigeer dan dit bestand in plaats van eromheen te werken.]
 */
import { mkdir, writeFile, rm } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { mkdtempSync } from 'node:fs'
import type { ProviderResult, TtsProvider } from '../contracts.js'
import type { LanguageCode } from '../../domain/types.js'
import { postJson } from '../http.js'
import { ffmpeg, probeDurationMs } from '../../lib/ffmpeg.js'

const ENDPOINT = 'https://texttospeech.googleapis.com/v1/text:synthesize'

/** Chirp 3: HD kent geen SSML. Dit blijft dus platte tekst, met opzet. */
interface SynthesizeResponse { audioContent?: string }

export interface GoogleTtsOptions {
  apiKey?: string
  /** Bijvoorbeeld `nl-NL-Chirp3-HD-Aoede`. */
  voiceName?: string
  languageCode?: string
  /** Prijs per 1.000 tekens in dollarcent. Chirp 3: HD is $30 per miljoen. */
  centsPerThousandChars?: number
}

const TAAL: Record<string, string> = { nl: 'nl-NL', de: 'de-DE', en: 'en-US' }

/**
 * Splitst op zinsgrens. Kort houden is hier geen limietkwestie maar een
 * ontwerpkeuze: hoe fijner de stukjes, hoe nauwkeuriger de gemeten timing.
 * Te fijn en de prosodie breekt, want de stem hoort de vorige zin niet meer.
 * Eén zin per stuk is het punt waarop allebei nog goed gaat.
 */
export function splitZinnen(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((z) => z.trim())
    .filter(Boolean)
}

/**
 * Verdeelt een gemeten zinsduur over de tekens van die zin.
 *
 * Naar tekenaantal en niet naar woord: spaties en leestekens kosten ook tijd,
 * en een woord van twaalf letters duurt nu eenmaal langer dan een van twee.
 */
export function verdeelTekens(
  zin: string, startMs: number, duurMs: number,
): { char: string; atMs: number }[] {
  const tekens = [...zin]
  if (tekens.length === 0) return []
  const perTeken = duurMs / tekens.length
  return tekens.map((char, i) => ({ char, atMs: Math.round(startMs + i * perTeken) }))
}

export class GoogleTtsProvider implements TtsProvider {
  readonly name = 'google-chirp3'
  readonly simulated = false

  private readonly apiKey: string
  private readonly voiceName: string
  private readonly languageCode: string | undefined
  private readonly centsPerThousandChars: number

  constructor(opts: GoogleTtsOptions = {}) {
    const key = opts.apiKey ?? process.env['TTS_API_KEY'] ?? ''
    if (!key) throw new Error('TTS_API_KEY ontbreekt. Zie docs/22.')
    this.apiKey = key

    const stem = opts.voiceName ?? process.env['TTS_VOICE_ID'] ?? ''
    if (!stem) {
      throw new Error(
        'TTS_VOICE_ID ontbreekt. Voor Chirp 3: HD is dat de volledige naam, ' +
        'bijvoorbeeld nl-NL-Chirp3-HD-Aoede. Doe eerst npm run stemtest.',
      )
    }
    this.voiceName = stem
    this.languageCode = opts.languageCode ?? process.env['TTS_LANGUAGE_CODE']
    this.centsPerThousandChars = opts.centsPerThousandChars
      ?? Number(process.env['TTS_CENTS_PER_1K'] ?? 3)
  }

  /**
   * De taalcode staat in de stemnaam, dus die is de eerste bron. Staat hij er
   * niet in, dan de instelling, en anders de taal van de video. Een taalcode
   * die niet bij de stem past, geeft een 400 die nergens naar verwijst.
   */
  private taalcode(language: LanguageCode): string {
    const uitNaam = /^([a-z]{2}-[A-Z]{2})-/.exec(this.voiceName)?.[1]
    return uitNaam ?? this.languageCode ?? TAAL[language] ?? 'nl-NL'
  }

  async speak(input: { text: string; language: LanguageCode; outPath: string }) {
    const startedAt = Date.now()
    const zinnen = splitZinnen(input.text)
    if (zinnen.length === 0) throw new Error('Geen tekst om in te spreken.')

    const werkmap = mkdtempSync(join(tmpdir(), 'chirp-'))
    const delen: string[] = []
    const charTimings: { char: string; atMs: number }[] = []

    try {
      for (const [i, zin] of zinnen.entries()) {
        const response = await postJson<SynthesizeResponse>({
          provider: 'google-tts',
          // De sleutel gaat in de querystring omdat Google dat voor deze API zo
          // doet. Hij komt daarmee wel in serverlogs terecht; dat is een reden
          // te meer om er een sleutel voor te maken die alleen deze API mag.
          url: `${ENDPOINT}?key=${encodeURIComponent(this.apiKey)}`,
          headers: {},
          body: {
            input: { text: zin },
            voice: { languageCode: this.taalcode(input.language), name: this.voiceName },
            audioConfig: { audioEncoding: 'MP3' },
          },
          timeoutMs: 120_000,
        })

        if (!response.audioContent) {
          throw new Error(`Google leverde geen audio voor zin ${i + 1}: "${zin.slice(0, 60)}"`)
        }
        const deel = join(werkmap, `${String(i).padStart(4, '0')}.mp3`)
        await writeFile(deel, Buffer.from(response.audioContent, 'base64'))
        delen.push(deel)
      }

      // Meten vóór het samenvoegen. Andersom zou je één totaal hebben en zou de
      // ondertiteling weer een schatting zijn.
      let offsetMs = 0
      for (const [i, deel] of delen.entries()) {
        const duur = await probeDurationMs(deel)
        charTimings.push(...verdeelTekens(zinnen[i] ?? '', offsetMs, duur))
        offsetMs += duur
      }

      const lijst = join(werkmap, 'delen.txt')
      await writeFile(lijst, delen.map((d) => `file '${d}'`).join('\n'))
      await mkdir(dirname(input.outPath), { recursive: true })
      await ffmpeg(['-hide_banner', '-loglevel', 'error', '-y',
        '-f', 'concat', '-safe', '0', '-i', lijst, '-c', 'copy', input.outPath])

      const durationMs = await probeDurationMs(input.outPath)
      return {
        value: { path: input.outPath, durationMs, charTimings },
        costCents: Math.ceil((input.text.length / 1000) * this.centsPerThousandChars),
        latencyMs: Date.now() - startedAt,
        providerRef: `google-chirp3:${this.voiceName}`,
      } satisfies ProviderResult<{
        path: string; durationMs: number; charTimings: { char: string; atMs: number }[]
      }>
    } finally {
      await rm(werkmap, { recursive: true, force: true })
    }
  }
}
