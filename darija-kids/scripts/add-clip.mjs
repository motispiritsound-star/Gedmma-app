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
 * Elk formaat erin, WAV eruit: een spraakmemo van een telefoon (.m4a), iets
 * uit WhatsApp (.ogg) of uit een browser (.webm) gaat eerst door ffmpeg heen.
 * Een clip van een seconde op 16 kHz is ongeveer 20 kB, dus het hele alfabet
 * blijft ruim onder een megabyte.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { bewerk, naarWav, readWav, writeWav, PEAK } from './lib/wav.mjs'

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
    const { rate, samples } = readWav(await naarWav(file))
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
