import { LETTERS } from '../content/alphabet'
import { allWords } from '../content/lexicon'
import { ALL_SENTENCES } from '../content/sentences'

/**
 * Recordings, and why the app leans on them rather than on a voice.
 *
 * Every speech engine on every phone is trained on Modern Standard Arabic.
 * There is no Darija voice, not even behind an `ar-MA` label. Hand such an
 * engine نتا and it says "natā"; hand it جدتي and it says "jaddatī", which is
 * the grandmother of a textbook. Vowel marks do not fix that — they make the
 * classical reading *more* certain, not less. Darija out of a synthesiser is
 * not a tuning problem. It is not available.
 *
 * So: a recording wins, always. Drop a file into `src/audio/` named after the
 * thing it says and that thing is spoken by whoever recorded it, everywhere
 * in the app.
 *
 *     src/audio/letters/ta.wav        →  ت
 *     src/audio/woorden/salam.wav     →  سلام
 *     src/audio/zinnen/groeten-1-a.wav →  that sentence
 *
 * The lookup is by Arabic text rather than by id, which is why nothing else
 * had to change: `say()` already receives the Arabic, so every button, every
 * exercise and every story line picks up a recording the moment the file
 * exists. Anything without one falls back to the voice, and the app says out
 * loud that what you are hearing is Standard Arabic rather than Darija.
 */

const FILES = {
  ...(import.meta.glob('../audio/letters/*.{webm,m4a,mp3,ogg,wav}', {
    eager: true, query: '?url', import: 'default',
  }) as Record<string, string>),
  ...(import.meta.glob('../audio/woorden/*.{webm,m4a,mp3,ogg,wav}', {
    eager: true, query: '?url', import: 'default',
  }) as Record<string, string>),
  ...(import.meta.glob('../audio/zinnen/*.{webm,m4a,mp3,ogg,wav}', {
    eager: true, query: '?url', import: 'default',
  }) as Record<string, string>),
}

const idOf = (path: string): string => path.split('/').pop()!.replace(/\.[^.]+$/, '')

/** Id → the URL of its recording. Ids are unique within their own folder. */
export const CLIPS: Record<string, string> = Object.fromEntries(
  Object.entries(FILES).map(([path, url]) => [idOf(path), url]),
)

/**
 * The Arabic a recording belongs to.
 *
 * Built once from the content, so a file named after a word is found by every
 * caller that only knows the word's spelling — which is all of them.
 */
const BY_ARABIC: Map<string, string> = (() => {
  const map = new Map<string, string>()
  const add = (ar: string, id: string) => {
    const url = CLIPS[id]
    if (url && ar && !map.has(ar)) map.set(ar, url)
  }
  for (const l of LETTERS) add(l.ar, l.id)
  for (const w of allWords) add(w.ar, w.id)
  for (const z of ALL_SENTENCES) add(z.ar, z.id)
  return map
})()

export const hasClip = (id: string): boolean => id in CLIPS
export const clipFor = (arabic: string): string | undefined => BY_ARABIC.get(arabic)

/** How much of the app is spoken by a person rather than by a machine. */
export const clipCounts = () => ({
  letters: LETTERS.filter((l) => hasClip(l.id)).length,
  lettersTotal: LETTERS.length,
  woorden: allWords.filter((w) => hasClip(w.id)).length,
  woordenTotal: allWords.length,
  zinnen: ALL_SENTENCES.filter((z) => hasClip(z.id)).length,
  zinnenTotal: ALL_SENTENCES.length,
})

const decoded = new Map<string, AudioBuffer>()

/**
 * Plays a recording, and says whether it managed to.
 *
 * Returns false when there is no clip, when the file will not decode, or when
 * there is no audio context to play it through — and the caller falls back to
 * the voice, which is why this never throws.
 */
/**
 * De bytes achter een opname, zonder het netwerkpad waar dat kan.
 *
 * Safari weigert `fetch()` op een grote `data:`-URL met "TypeError: Load
 * failed". In de app zelf komt dat niet voor — daar zijn opnames gewoon
 * bestanden — maar in een build waarin ze in het document zitten wel, en dan
 * valt elke opname stil terwijl er niets aan het bestand mankeert. Een
 * data-URL is bovendien geen netwerkverkeer: hem zelf uitlezen is korter én
 * het werkt overal.
 */
async function bytesVan(url: string): Promise<ArrayBuffer> {
  if (!url.startsWith('data:')) return (await fetch(url)).arrayBuffer()
  const base64 = url.slice(url.indexOf(',') + 1)
  const binair = atob(base64)
  const bytes = new Uint8Array(binair.length)
  for (let i = 0; i < binair.length; i++) bytes[i] = binair.charCodeAt(i)
  return bytes.buffer
}

export async function playClip(
  url: string,
  ac: AudioContext | null,
  out: AudioNode | null,
  opts: { rate?: number } = {},
): Promise<boolean> {
  if (!url || !ac || !out) return false
  try {
    let buffer = decoded.get(url)
    if (!buffer) {
      const bytes = await bytesVan(url)
      buffer = await ac.decodeAudioData(bytes)
      decoded.set(url, buffer)
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
