/**
 * Ondertiteling uit de timestamps per teken van de TTS-provider. Geen aparte
 * spraakherkenning nodig: de stem weet zelf wanneer hij wat zei.
 */
export function buildSrt(
  charTimings: { char: string; atMs: number }[],
  totalMs: number,
  maxCharsPerCue = 76,
): string {
  const cues: { from: number; to: number; text: string }[] = []
  let buf = ''
  let start = charTimings[0]?.atMs ?? 0

  const flush = (endMs: number) => {
    const text = buf.trim().replace(/\s+/g, ' ')
    if (text) cues.push({ from: start, to: endMs, text })
    buf = ''
  }

  for (let i = 0; i < charTimings.length; i += 1) {
    const t = charTimings[i]!
    buf += t.char
    const atBreak = /[.!?]/.test(t.char)
    const tooLong = buf.length >= maxCharsPerCue && /\s/.test(t.char)
    if (atBreak || tooLong) {
      flush(charTimings[i + 1]?.atMs ?? totalMs)
      start = charTimings[i + 1]?.atMs ?? totalMs
    }
  }
  flush(totalMs)

  const stamp = (ms: number) => {
    const h = String(Math.floor(ms / 3_600_000)).padStart(2, '0')
    const m = String(Math.floor(ms / 60_000) % 60).padStart(2, '0')
    const s = String(Math.floor(ms / 1000) % 60).padStart(2, '0')
    const f = String(Math.floor(ms % 1000)).padStart(3, '0')
    return `${h}:${m}:${s},${f}`
  }

  return cues
    .map((c, i) => `${i + 1}\n${stamp(c.from)} --> ${stamp(c.to)}\n${c.text}\n`)
    .join('\n')
}
