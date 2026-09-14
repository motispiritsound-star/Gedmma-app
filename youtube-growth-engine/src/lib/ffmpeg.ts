import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const run = promisify(execFile)

export const FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'

export async function ffmpeg(args: string[]): Promise<void> {
  await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
    maxBuffer: 32 * 1024 * 1024,
  })
}

export async function probeDurationMs(path: string): Promise<number> {
  const { stdout } = await run('ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1', path,
  ])
  return Math.round(parseFloat(stdout.trim()) * 1000)
}

/** Detecteert volledig zwarte frames — onderdeel van de technische QC. */
export async function hasBlackFrames(path: string): Promise<boolean> {
  const { stderr } = await run('ffmpeg', [
    '-hide_banner', '-i', path, '-vf', 'blackdetect=d=0.5:pic_th=0.98',
    '-f', 'null', '-',
  ], { maxBuffer: 32 * 1024 * 1024 }).catch((e: { stderr?: string }) => ({ stderr: e.stderr ?? '' }))
  return (stderr ?? '').includes('black_start')
}

/** Detecteert stiltes langer dan een seconde — ontbrekende of kapotte audio. */
export async function hasLongSilence(path: string): Promise<boolean> {
  const { stderr } = await run('ffmpeg', [
    '-hide_banner', '-i', path, '-af', 'silencedetect=n=-50dB:d=1.0',
    '-f', 'null', '-',
  ], { maxBuffer: 32 * 1024 * 1024 }).catch((e: { stderr?: string }) => ({ stderr: e.stderr ?? '' }))
  return (stderr ?? '').includes('silence_start')
}
