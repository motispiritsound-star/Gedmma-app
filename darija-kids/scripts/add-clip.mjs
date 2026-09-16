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

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
/** Which folder an id belongs in. `--map letters` forces one. */
const FOLDERS = ['letters', 'woorden', 'zinnen']

/** The peak every clip is levelled to. Short of 1.0, so nothing clips. */
const PEAK = 0.89
/** Anything under this counts as room tone rather than speech. */
const FLOOR = 0.02
/** Kept either side of the speech, so a consonant is not clipped off. */
const MARGIN = 0.04

/** Reads a mono or stereo PCM WAV into one channel of floats. */
function readWav(buffer) {
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error('geen WAV-bestand')
  }
  let at = 12
  let fmt = null
  let data = null
  while (at + 8 <= buffer.length) {
    const id = buffer.toString('ascii', at, at + 4)
    const size = buffer.readUInt32LE(at + 4)
    const body = buffer.subarray(at + 8, at + 8 + size)
    if (id === 'fmt ') {
      fmt = {
        format: body.readUInt16LE(0),
        channels: body.readUInt16LE(2),
        rate: body.readUInt32LE(4),
        bits: body.readUInt16LE(14),
      }
    } else if (id === 'data') data = body
    at += 8 + size + (size % 2)
  }
  if (!fmt || !data) throw new Error('WAV mist fmt of data')
  if (fmt.format !== 1 || fmt.bits !== 16) throw new Error(`alleen 16-bits PCM, dit is ${fmt.bits}-bits formaat ${fmt.format}`)

  const frames = data.length / 2 / fmt.channels
  const mono = new Float32Array(frames)
  for (let i = 0; i < frames; i++) {
    let sum = 0
    for (let c = 0; c < fmt.channels; c++) sum += data.readInt16LE((i * fmt.channels + c) * 2) / 32768
    mono[i] = sum / fmt.channels
  }
  return { rate: fmt.rate, samples: mono }
}

function writeWav(rate, samples) {
  const data = Buffer.alloc(samples.length * 2)
  for (let i = 0; i < samples.length; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]))
    data.writeInt16LE(Math.round(v * 32767), i * 2)
  }
  const head = Buffer.alloc(44)
  head.write('RIFF', 0, 'ascii')
  head.writeUInt32LE(36 + data.length, 4)
  head.write('WAVE', 8, 'ascii')
  head.write('fmt ', 12, 'ascii')
  head.writeUInt32LE(16, 16)
  head.writeUInt16LE(1, 20)
  head.writeUInt16LE(1, 22)
  head.writeUInt32LE(rate, 24)
  head.writeUInt32LE(rate * 2, 28)
  head.writeUInt16LE(2, 32)
  head.writeUInt16LE(16, 34)
  head.write('data', 36, 'ascii')
  head.writeUInt32LE(data.length, 40)
  return Buffer.concat([head, data])
}

/** Where the speech actually is, measured in 10 ms buckets. */
function speechRange(samples, rate) {
  const step = Math.max(1, Math.round(rate / 100))
  let first = -1
  let last = -1
  for (let i = 0; i < samples.length; i += step) {
    let energy = 0
    const end = Math.min(i + step, samples.length)
    for (let k = i; k < end; k++) energy += samples[k] * samples[k]
    if (Math.sqrt(energy / (end - i)) <= FLOOR) continue
    if (first < 0) first = i
    last = end
  }
  if (first < 0) return null
  const margin = Math.round(rate * MARGIN)
  return [Math.max(0, first - margin), Math.min(samples.length, last + margin)]
}

/** A short fade at each end, so a trim never leaves a click. */
function fade(samples, rate) {
  const n = Math.min(Math.round(rate * 0.008), Math.floor(samples.length / 2))
  for (let i = 0; i < n; i++) {
    const g = i / n
    samples[i] *= g
    samples[samples.length - 1 - i] *= g
  }
}

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
    const range = speechRange(samples, rate)
    if (!range) { console.error(`${id}: alleen stilte, overgeslagen`); continue }

    const cutOut = samples.slice(range[0], range[1])
    const peak = cutOut.reduce((m, v) => Math.max(m, Math.abs(v)), 0)
    const gain = peak > 0 ? PEAK / peak : 1
    for (let i = 0; i < cutOut.length; i++) cutOut[i] *= gain
    fade(cutOut, rate)

    const target = path.join(OUT, `${id}.wav`)
    await writeFile(target, writeWav(rate, cutOut))
    const was = (samples.length / rate).toFixed(2)
    const now = (cutOut.length / rate).toFixed(2)
    console.log(`${id}: ${was}s → ${now}s · piek ${peak.toFixed(2)} → ${PEAK}${peak >= 0.999 ? ' (was overstuurd)' : ''}`)
  } catch (e) {
    console.error(`${id}: ${e.message}`)
  }
}
