/**
 * Making a raw take fit to play.
 *
 * A recording is never ready as it comes off a microphone or out of a speech
 * engine: peaks land anywhere between a whisper and clipping, and there is a
 * quarter-second of room tone at either end. Played one after another in the
 * alphabet that is a child turning the volume up and down. So every clip that
 * enters the app goes through here first — trimmed, levelled to one peak, and
 * faded so a cut never leaves a click.
 *
 * WAV in, WAV out: no encoder to install. A one-second clip at 16 kHz is about
 * 20 kB, so the whole alphabet is well under a megabyte.
 */

/** The peak every clip is levelled to. Short of 1.0, so nothing clips. */
export const PEAK = 0.89
/** Anything under this counts as room tone rather than speech. */
const FLOOR = 0.02
/** Kept either side of the speech, so a consonant is not clipped off. */
const MARGIN = 0.04

/** Reads a mono or stereo PCM WAV into one channel of floats. */
export function readWav(buffer) {
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

export function writeWav(rate, samples) {
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
export function speechRange(samples, rate) {
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
export function fade(samples, rate) {
  const n = Math.min(Math.round(rate * 0.008), Math.floor(samples.length / 2))
  for (let i = 0; i < n; i++) {
    const g = i / n
    samples[i] *= g
    samples[samples.length - 1 - i] *= g
  }
}

/**
 * The whole treatment in one call: trim, level, fade.
 *
 * Returns null for a take that is only silence — a microphone that was not
 * open, or an engine that returned nothing.
 */
export function bewerk(rate, samples) {
  const range = speechRange(samples, rate)
  if (!range) return null
  const uit = samples.slice(range[0], range[1])
  const piek = uit.reduce((m, v) => Math.max(m, Math.abs(v)), 0)
  const gain = piek > 0 ? PEAK / piek : 1
  for (let i = 0; i < uit.length; i++) uit[i] *= gain
  fade(uit, rate)
  return { samples: uit, piek, was: samples.length / rate, nu: uit.length / rate }
}

/* ------------------------------------------------ alles wat geen WAV is */

/**
 * Elk geluidsbestand naar mono 16 kHz WAV, via ffmpeg.
 *
 * Een spraakmemo van een telefoon is een .m4a, WhatsApp stuurt .ogg, en een
 * browser levert .webm. Dit leest ze alle drie, zodat wie iets instuurt zich
 * geen zorgen hoeft te maken over het formaat — en dat is precies de drempel
 * die je niet wilt opwerpen bij iemand die je een dienst bewijst.
 *
 * 16 kHz mono is ruim voor spraak: alles wat een stem doet zit onder de 8 kHz,
 * en het scheelt driekwart aan bestandsgrootte in een app die offline werkt.
 */
export async function naarWav(pad) {
  const { execFile } = await import('node:child_process')
  const { promisify } = await import('node:util')
  const { readFile: lees, unlink } = await import('node:fs/promises')
  const { tmpdir } = await import('node:os')
  const path = (await import('node:path')).default
  const ffmpeg = (await import('ffmpeg-static')).default

  if (pad.toLowerCase().endsWith('.wav')) return lees(pad)

  const uit = path.join(tmpdir(), `knip-${Date.now()}-${Math.random().toString(36).slice(2)}.wav`)
  try {
    await promisify(execFile)(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-i', pad, '-ac', '1', '-ar', '16000', uit])
    return await lees(uit)
  } finally {
    await unlink(uit).catch(() => {})
  }
}
