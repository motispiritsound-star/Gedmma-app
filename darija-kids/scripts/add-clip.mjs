/**
 * Prepares a recording of a letter for the app.
 *
 * A raw take is never ready. The five that started this came in at peaks
 * between 0.18 and 1.00 — two of them clipped — each with a quarter-second of
 * room tone at either end. Played one after another in the alphabet that is a
 * child turning the volume up and down, and the app plays a clip exactly as
 * it finds it. So: trim the silence, level them all to the same peak, and
 * write them where the app looks.
 *
 * Run with:
 *   node scripts/add-clip.mjs <bestand>=<id> [...] [--map <map>]
 *   node scripts/add-clip.mjs opname.wav=ya andere.wav=waw
 *   node scripts/add-clip.mjs salam.wav=salam --map woorden
 *
 * WAV in, WAV out — no encoder to install. A one-second clip at 16 kHz is
 * about 20 kB, so the whole alphabet is well under a megabyte.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { bewerk, readWav, writeWav, PEAK } from './lib/wav.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
/** Which folder an id belongs in. `--map letters` forces one. */
const FOLDERS = ['letters', 'woorden', 'zinnen']

const jobs = process.argv.slice(2).filter((a) => a.includes('=') && !a.startsWith('--'))
if (!jobs.length) {
  console.error('gebruik: node scripts/add-clip.mjs <bestand>=<letter-id> [...]')
  process.exit(1)
}

const gevraagd = process.argv.indexOf('--map')
const map = gevraagd > 0 ? process.argv[gevraagd + 1] : 'letters'
if (!FOLDERS.includes(map)) {
  console.error(`--map moet een van ${FOLDERS.join(', ')} zijn`)
  process.exit(1)
}
const OUT = path.join(ROOT, 'src', 'audio', map)
await mkdir(OUT, { recursive: true })
for (const job of jobs) {
  const cut = job.lastIndexOf('=')
  const file = job.slice(0, cut)
  const id = job.slice(cut + 1)
  try {
    const { rate, samples } = readWav(await readFile(file))
    const klaar = bewerk(rate, samples)
    if (!klaar) { console.error(`${id}: alleen stilte, overgeslagen`); continue }

    await writeFile(path.join(OUT, `${id}.wav`), writeWav(rate, klaar.samples))
    console.log(
      `${id}: ${klaar.was.toFixed(2)}s → ${klaar.nu.toFixed(2)}s · piek ${klaar.piek.toFixed(2)} → ${PEAK}`
      + (klaar.piek >= 0.999 ? ' (was overstuurd)' : ''),
    )
  } catch (e) {
    console.error(`${id}: ${e.message}`)
  }
}
