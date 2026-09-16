/**
 * Recorded letters, when there are any.
 *
 * Everything the app says is synthesised, and synthesis has a ceiling: a
 * phone voice reading تَاءْ is close, and a Moroccan saying it is right. This
 * is the way in for the second kind. Drop a file into `src/audio/letters/`
 * named after the letter — `ta.webm`, `qaf.m4a` — and that letter is spoken
 * by whoever recorded it, everywhere in the app. Nothing else changes: no
 * manifest to keep in step, no list to update, no setting to switch on.
 *
 * Letters with no file keep the synthesised voice, so the two live side by
 * side and the set can be filled in one letter at a time.
 *
 * The clips go through the same bus as the rest of the sound, so the mute
 * switch and the media-channel routing apply to them exactly as they do to a
 * darbuka — an `<audio>` element would sit outside all of that.
 */

const FILES = import.meta.glob('../audio/letters/*.{webm,m4a,mp3,ogg,wav}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

/** Letter id → the URL of its recording. Empty until somebody records one. */
export const CLIPS: Record<string, string> = Object.fromEntries(
  Object.entries(FILES).map(([path, url]) => [path.split('/').pop()!.replace(/\.[^.]+$/, ''), url]),
)

export const hasClip = (id: string): boolean => id in CLIPS

/** How many of the letters are spoken by a person rather than a machine. */
export const clipCount = (): number => Object.keys(CLIPS).length

const decoded = new Map<string, AudioBuffer>()

/**
 * Plays a letter's recording, and says whether it managed to.
 *
 * Returns false when there is no clip, when the file will not decode, or
 * when there is no audio context to play it through — and the caller then
 * falls back to the voice, which is why this never throws.
 */
export async function playClip(
  id: string,
  ac: AudioContext | null,
  out: AudioNode | null,
  opts: { rate?: number } = {},
): Promise<boolean> {
  const url = CLIPS[id]
  if (!url || !ac || !out) return false
  try {
    let buffer = decoded.get(id)
    if (!buffer) {
      const bytes = await (await fetch(url)).arrayBuffer()
      buffer = await ac.decodeAudioData(bytes)
      decoded.set(id, buffer)
    }
    const source = ac.createBufferSource()
    source.buffer = buffer
    source.playbackRate.value = opts.rate ?? 1
    source.connect(out)
    source.start()
    return true
  } catch {
    // A codec the browser will not take, or a file that never arrived.
    return false
  }
}
