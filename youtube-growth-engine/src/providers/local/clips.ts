import { readdir, stat } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import type { ProviderResult, VideoClipProvider } from '../contracts.js'
import { probeDurationMs } from '../../lib/ffmpeg.js'

/**
 * Clips die met de hand zijn gemaakt, uit een map.
 *
 * Sommige goede gereedschappen hebben geen API — Neural Frames bijvoorbeeld,
 * of het dashboard van een abonnementsdienst. Die kunnen dan geen stap in de
 * pipeline zijn, maar ze hoeven ook niet te vervallen: je exporteert de clip en
 * zet hem in `assets/clips/`. Deze adapter pakt hem op alsof hij gegenereerd is.
 *
 * De bestandsnaam is de koppeling:
 *
 *   assets/clips/scene-05-gemaal.mp4   -> scène 5
 *
 * Wat je inlevert ten opzichte van een API: het is geen geautomatiseerde stap
 * meer. Iemand moet exporteren en neerzetten. Dat is een keuze per tool, geen
 * gebrek in het systeem.
 */

const VIDEO_EXT = new Set(['.mp4', '.mov', '.webm', '.m4v'])

export interface LocalClipOptions {
  dir?: string
  /**
   * 'skip' laat de scène zonder clip staan — de stills doen dan het werk.
   * 'error' stopt de productie, voor als je zeker weet dat hij er hoort te zijn.
   */
  onMissing?: 'skip' | 'error'
  /** Waarmee de clips gemaakt zijn; gaat mee in het auditlog. */
  madeWith?: string
}

export class LocalClipProvider implements VideoClipProvider {
  readonly name: string
  /** Niet gesimuleerd: echte clips, alleen niet door ons gegenereerd. */
  readonly simulated = false

  private readonly dir: string
  private readonly onMissing: 'skip' | 'error'
  private readonly madeWith: string
  private index: Map<string, string> | undefined

  constructor(opts: LocalClipOptions = {}) {
    this.dir = opts.dir ?? process.env['LOCAL_CLIPS_DIR'] ?? 'assets/clips'
    this.onMissing = opts.onMissing ?? 'skip'
    this.madeWith = opts.madeWith ?? process.env['LOCAL_CLIPS_MADE_WITH'] ?? 'handmatig'
    this.name = `local-clips:${this.madeWith}`
  }

  private async load(): Promise<Map<string, string>> {
    if (this.index) return this.index
    const found = new Map<string, string>()
    try {
      for (const entry of await readdir(this.dir)) {
        if (!VIDEO_EXT.has(extname(entry).toLowerCase())) continue
        const path = join(this.dir, entry)
        if (!(await stat(path)).isFile()) continue
        found.set(basename(entry, extname(entry)).toLowerCase(), path)
      }
    } catch { /* map bestaat niet: dan liggen er geen clips */ }
    this.index = found
    return found
  }

  /**
   * De pipeline zet de scènesleutel tussen blokhaken vooraan de prompt. We
   * nemen het langste passende voorvoegsel, zodat `scene-05-gemaal` wint van
   * `scene-0`.
   */
  async generate(input: { prompt: string; seconds: number; outPath: string }) {
    const clips = await this.load()
    const key = /^\[(?<k>[^\]]+)\]/.exec(input.prompt)?.groups?.['k']?.toLowerCase()

    const match = key
      ? [...clips.entries()]
          .filter(([name]) => name.startsWith(key))
          .sort((a, b) => b[0].length - a[0].length)[0]?.[1]
      : undefined

    if (!match) {
      if (this.onMissing === 'error') {
        throw new Error(
          `Geen clip gevonden voor "${key ?? input.prompt.slice(0, 40)}" in ${this.dir}. ` +
          'Exporteer hem en zet hem daar neer, of zet onMissing op "skip".',
        )
      }
      return {
        value: { path: '' },
        costCents: 0, latencyMs: 1,
        providerRef: `local:ontbreekt:${key ?? 'onbekend'}`,
      } satisfies ProviderResult<{ path: string }>
    }

    const durationMs = await probeDurationMs(match)
    if (Math.abs(durationMs / 1000 - input.seconds) > 2) {
      process.stderr.write(
        `  let op: ${basename(match)} duurt ${Math.round(durationMs / 1000)}s, ` +
        `de scène vraagt ${Math.round(input.seconds)}s\n`,
      )
    }

    return {
      value: { path: match },
      // De kosten zijn al betaald bij de tool waarmee hij gemaakt is: die horen
      // in de vaste maandlasten, niet per clip.
      costCents: 0, latencyMs: 2,
      providerRef: `local:${this.madeWith}:${basename(match)}`,
    } satisfies ProviderResult<{ path: string }>
  }

  async inventory(): Promise<{ dir: string; clips: string[] }> {
    const clips = await this.load()
    return { dir: this.dir, clips: [...clips.keys()].sort() }
  }
}
