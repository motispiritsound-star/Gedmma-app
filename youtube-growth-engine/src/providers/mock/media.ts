import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type {
  ImageProvider, MusicProvider, ProviderResult, RenderProvider,
  SearchProvider, TtsProvider, VideoClipProvider,
} from '../contracts.js'
import type { LanguageCode, Source } from '../../domain/types.js'
import { FONT, ffmpeg, probeDurationMs } from '../../lib/ffmpeg.js'

const ok = <T>(value: T, costCents: number, ref: string): ProviderResult<T> =>
  ({ value, costCents, latencyMs: 60, providerRef: ref })

const ensureDir = (p: string) => mkdir(dirname(p), { recursive: true })

/** Wikkelt tekst zodat drawtext hem leesbaar over meerdere regels zet. */
function wrap(text: string, perLine: number): string {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    if ((line + ' ' + w).trim().length > perLine) { lines.push(line.trim()); line = w }
    else line += ' ' + w
  }
  if (line.trim()) lines.push(line.trim())
  return lines.join('\n')
}

export class MockSearchProvider implements SearchProvider {
  readonly name = 'mock-search'
  readonly simulated = true
  async find(query: string, limit: number) {
    const sources: Source[] = Array.from({ length: limit }, (_, i) => ({
      id: `mock-src-${i}`, kind: i === 0 ? 'primary' : 'secondary',
      work: `Gesimuleerde bron ${i + 1}`, locator: `zoekopdracht: ${query}`,
      retrievedAt: new Date().toISOString(),
    }))
    return ok(sources, 2, 'mock:search')
  }
}

/**
 * Levert een zachte toon van precies de juiste lengte, plus timestamps per
 * teken. Uit die timestamps komt de ondertiteling — bij de echte provider ook,
 * zodat er geen aparte spraakherkenning nodig is.
 */
export class MockTtsProvider implements TtsProvider {
  readonly name = 'mock-tts'
  readonly simulated = true

  async speak(input: { text: string; language: LanguageCode; outPath: string }) {
    // ~2,2 woorden per seconde is een rustig Nederlands voorleestempo.
    const words = input.text.trim().split(/\s+/).length
    const seconds = Math.max(1, words / 2.2)
    await ensureDir(input.outPath)
    await ffmpeg([
      '-f', 'lavfi', '-i', `sine=frequency=196:sample_rate=44100:duration=${seconds.toFixed(2)}`,
      '-af', 'volume=-28dB', '-ac', '1', input.outPath,
    ])
    const durationMs = await probeDurationMs(input.outPath)
    const perChar = durationMs / Math.max(1, input.text.length)
    const charTimings = [...input.text].map((char, i) => ({
      char, atMs: Math.round(i * perChar),
    }))
    // EUR 0,10 per 1.000 tekens bij de echte provider; hier ter illustratie.
    const costCents = Math.ceil((input.text.length / 1000) * 10)
    return ok({ path: input.outPath, durationMs, charTimings }, costCents, 'mock:tts')
  }
}

/**
 * Tekent een gekleurde kaart met de scènebeschrijving erop. `figureFree` wordt
 * gerespecteerd omdat er per definitie geen figuur getekend wordt — bij een
 * echte provider is dit de plek waar de visuele controle uit docs/12 §2 draait.
 */
export class MockImageProvider implements ImageProvider {
  readonly name = 'mock-image'
  readonly simulated = true
  private n = 0

  async generate(input: {
    prompt: string; figureFree: boolean; width: number; height: number; outPath: string
  }) {
    const palette = ['0x14332b', '0x1b3a4b', '0x3a2f1b', '0x2b2140', '0x143033']
    const bg = palette[this.n % palette.length]!
    this.n += 1
    await ensureDir(input.outPath)
    const textPath = `${input.outPath}.txt`
    await writeFile(textPath, wrap(input.prompt, 34), 'utf8')
    const badge = input.figureFree ? 'figuurvrije scene' : 'figuur toegestaan'
    const badgePath = `${input.outPath}.badge.txt`
    await writeFile(badgePath, badge, 'utf8')
    await ffmpeg([
      '-f', 'lavfi', '-i', `color=c=${bg}:s=${input.width}x${input.height}`,
      '-vf', [
        `drawtext=fontfile=${FONT}:textfile=${textPath}:fontcolor=0xF2EFE6:` +
          `fontsize=${Math.round(input.height / 18)}:x=(w-text_w)/2:y=(h-text_h)/2:line_spacing=14`,
        `drawtext=fontfile=${FONT}:textfile=${badgePath}:fontcolor=0x8FBF9F:` +
          `fontsize=${Math.round(input.height / 40)}:x=40:y=h-th-40`,
      ].join(','),
      '-frames:v', '1', input.outPath,
    ])
    return ok(
      { path: input.outPath, figureCheck: 'pass' as const },
      4, `mock:image:${this.n}`,
    )
  }
}

export class MockVideoClipProvider implements VideoClipProvider {
  readonly name = 'mock-videoclip'
  readonly simulated = true
  async generate(input: { prompt: string; seconds: number; outPath: string }) {
    await ensureDir(input.outPath)
    await ffmpeg([
      '-f', 'lavfi', '-i', `testsrc=size=1280x720:rate=25:duration=${input.seconds}`,
      '-pix_fmt', 'yuv420p', input.outPath,
    ])
    // USD 0,10 per seconde is de ordegrootte bij echte aanbieders.
    return ok({ path: input.outPath }, Math.ceil(input.seconds * 9), 'mock:videoclip')
  }
}

export class MockMusicProvider implements MusicProvider {
  readonly name = 'mock-music'
  readonly simulated = true
  async score(input: {
    seconds: number; mood: string; vocalsAndDuffOnly: boolean; outPath: string
  }) {
    await ensureDir(input.outPath)
    // Bij `vocalsAndDuffOnly` (de standaard, zie docs/12 §4) levert de mock
    // alleen percussie-achtige tikken, geen melodisch instrument.
    const src = input.vocalsAndDuffOnly
      ? `sine=frequency=90:sample_rate=44100:duration=${input.seconds}`
      : `sine=frequency=294:sample_rate=44100:duration=${input.seconds}`
    await ffmpeg(['-f', 'lavfi', '-i', src, '-af', 'volume=-34dB', '-ac', '1', input.outPath])
    return ok(
      { path: input.outPath, licenseUri: 'mock://licentie/abonnement-met-commercieel-gebruik' },
      0, 'mock:music',
    )
  }
}

/**
 * Dit is de enige "mock" die echt werk doet: FFmpeg monteert de beelden en de
 * voice-over tot een echte MP4. Bij de echte stack verandert hier niets — dit
 * is meteen de productie-renderer.
 */
export class FfmpegRenderProvider implements RenderProvider {
  readonly name = 'ffmpeg-local'
  readonly simulated = false

  async assemble(input: {
    shots: { imagePath: string; fromSecond: number; toSecond: number; caption: string }[]
    voiceOverPath: string
    musicPath?: string
    width: number
    height: number
    outPath: string
  }) {
    await ensureDir(input.outPath)
    const listPath = `${input.outPath}.concat.txt`
    const lines: string[] = []
    for (const s of input.shots) {
      const d = Math.max(0.5, s.toSecond - s.fromSecond)
      lines.push(`file '${s.imagePath}'`, `duration ${d.toFixed(3)}`)
    }
    const last = input.shots[input.shots.length - 1]
    if (last) lines.push(`file '${last.imagePath}'`)
    await writeFile(listPath, lines.join('\n'), 'utf8')

    const args = ['-f', 'concat', '-safe', '0', '-i', listPath, '-i', input.voiceOverPath]
    if (input.musicPath) args.push('-i', input.musicPath)

    if (input.musicPath) {
      args.push('-filter_complex', '[1:a][2:a]amix=inputs=2:duration=first:dropout_transition=0[a]',
        '-map', '0:v', '-map', '[a]')
    } else {
      args.push('-map', '0:v', '-map', '1:a')
    }
    args.push(
      '-vf', `scale=${input.width}:${input.height}:force_original_aspect_ratio=decrease,` +
             `pad=${input.width}:${input.height}:(ow-iw)/2:(oh-ih)/2`,
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', '25',
      '-c:a', 'aac', '-b:a', '128k', '-shortest', input.outPath,
    )
    await ffmpeg(args)
    const durationMs = await probeDurationMs(input.outPath)
    return ok({ path: input.outPath, durationMs }, 1, 'ffmpeg:local')
  }
}
