import { allWords } from './lexicon'
import { ALL_SENTENCES } from './sentences'
import type { Target } from './pronunciation'

/**
 * The words a Standard Arabic voice gets wrong.
 *
 * Most of what this app teaches is written in Arabic script, and for a good
 * part of it a Standard Arabic voice is fine: شكرا is "shukran" in Rabat and
 * in Cairo alike. But a slice of the vocabulary is Darija's own, and there the
 * same voice reads the letters by Standard Arabic's rules and says something
 * nobody in Morocco says — نتا becomes "anta", جدتي becomes "jaddatī", بزاف
 * becomes "bazzāfan".
 *
 * Diacritics do not save those. Writing the vowels out makes the classical
 * reading *more* certain, not less; two rounds of trying proved it. What works
 * better, until there is a recording, is to stop handing the word to an Arabic
 * voice at all and hand its Latin spelling to a European one instead: a French
 * voice reading "bezzaf" lands closer to Morocco than an Arabic voice reading
 * بزاف.
 *
 * So this is a list of ids that must never reach an Arabic voice. It grows by
 * listening, not by reasoning: every id here was reported wrong by a Moroccan
 * ear. `npm run sheet` produces the next batch.
 *
 * None of this is a substitute for a recording. It is what the app does while
 * the recording does not exist yet.
 */
export const EIGEN_IDS: string[] = [
  // Pronouns and family — where Standard Arabic inserts vowels Darija drops.
  'nta', 'nti', 'ntuma', 'hna', 'khoya', 'khti', 'jedda', 'ammti', 'khalti',
  'weld', 'drari', 'sahbi', 'sahbti',
  // Everyday words and the little ones that hold a sentence together.
  'afak', 'bslama', 'thalla', 'iyeh', 'wakha', 'yallah', 'bezzaf',
  // Numbers: the Darija forms are not the Standard Arabic ones at all.
  'tlata', 'tmnya', 'tnach', 'tltach', 'khmstach', 'mya',
  // Colours in their Moroccan short form.
  'hmer', 'khder', 'sfer',
  // Places, food and culture.
  'bhar', 'sahra', 'tomobil', 'tamazight', 'henna', 'gnawa', 'rabat', 'tanja',
  'msemmen',
]

/**
 * Which borrowed voice suits a word, read off its own Latin spelling.
 *
 * Not a judgement per word — a rule. Every language spells these sounds in its
 * own way and only some of them can make them at all:
 *
 *   kh (خ)  Dutch and German have it outright; French turns it into an r.
 *   7  (ح)  Spanish's j is the nearest thing any of them has.
 *   gh (غ)  French and German r, which is where that sound lives.
 *
 * Anything without one of those goes to French first, because Morocco's second
 * language already handles ch, ou and a uvular r, and its vowels sit closest.
 */
const STANDAARD: Target[] = ['fr', 'es', 'nl', 'de', 'it', 'en']

export function voorkeurVoor(tr: string): Target[] {
  const t = tr.toLowerCase()
  if (t.includes('kh')) return ['nl', 'de', 'es', 'fr', 'it', 'en']
  if (t.includes('7') || t.includes('h')) return ['es', 'nl', 'de', 'fr', 'it', 'en']
  if (t.includes('gh')) return ['fr', 'de', 'nl', 'es', 'it', 'en']
  return STANDAARD
}

/**
 * Arabic text → the voices that may say it, or nothing when an Arabic voice is
 * the right one after all.
 *
 * Keyed by the script rather than the id for the same reason the recordings
 * are: every caller already has the Arabic text in its hand, and none of them
 * had to change.
 */
const OP_SCRIPT: Map<string, Target[]> = (() => {
  const wanted = new Set(EIGEN_IDS)
  const map = new Map<string, Target[]>()
  for (const w of allWords) if (wanted.has(w.id)) map.set(w.ar, voorkeurVoor(w.tr))
  for (const z of ALL_SENTENCES) if (wanted.has(z.id)) map.set(z.ar, voorkeurVoor(z.tr))
  return map
})()

export const eigenVoorkeur = (arabic: string): Target[] | undefined => OP_SCRIPT.get(arabic)

/** Every id in the list that no longer matches a word, for the test to catch. */
export const zwevendeIds = (): string[] => {
  const bekend = new Set<string>([...allWords.map((w) => w.id), ...ALL_SENTENCES.map((z) => z.id)])
  return EIGEN_IDS.filter((id) => !bekend.has(id))
}
