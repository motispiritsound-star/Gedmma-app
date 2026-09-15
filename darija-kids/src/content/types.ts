/** The shape of everything the learner ever sees. */

export type Topic =
  | 'groeten' | 'ik-en-jij' | 'familie' | 'cijfers' | 'kleuren' | 'eten'
  | 'huis' | 'school' | 'dieren' | 'tijd' | 'lichaam' | 'werkwoorden'
  | 'vragen' | 'winkelen' | 'weg' | 'cultuur'

export interface Word {
  /** Stable id. Never renamed — progress and the review queue key on it. */
  id: string
  /** Darija written in Arabic script, the way Moroccans actually write it. */
  ar: string
  /** Latin transliteration (Arabizi): 3=ع, 7=ح, 9/q=ق, kh=خ, gh=غ, sh=ش. */
  tr: string
  /** Dutch meaning. */
  nl: string
  /** English meaning, for the second interface language. */
  en: string
  topic: Topic
  emoji?: string
  /** A short usage note in Dutch: when to say it, or what it literally means. */
  note?: string
  /** Marks a full sentence rather than a single word. */
  phrase?: boolean
}

export type LessonKind = 'woorden' | 'zinnen' | 'letters' | 'verhaal' | 'toets'

export interface LessonTip {
  title: string
  body: string
}

export interface Lesson {
  id: string
  title: string
  kind: LessonKind
  /** Word ids taught here, in teaching order. Empty for a letter lesson. */
  words: string[]
  /** Letter ids taught here. Only letter lessons have these. */
  letters?: string[]
  /**
   * Sentence ids practised after the words, at the end of the round. Every
   * word lesson ends this way: single words are worth little until they stand
   * next to each other in a sentence.
   */
  sentences?: string[]
  tip?: LessonTip
}

export interface Unit {
  id: string
  /** Darija name of the unit, in Arabic script. */
  ar: string
  title: string
  subtitle: string
  emoji: string
  /** CEFR-ish band, shown on the unit header. */
  level: 'A0' | 'A1' | 'A2'
  /** Tailwind-ish accent key, resolved in the UI to a real gradient. */
  accent: 'saffron' | 'terra' | 'zellige' | 'mint' | 'violet' | 'sky'
  lessons: Lesson[]
}

/**
 * A short sentence built from the words of one lesson.
 *
 * Sentences are content, not generated: Darija word order, the ka- prefix and
 * the clitics that glue words together are not something to guess at, so every
 * sentence here is written out.
 */
export interface Sentence {
  id: string
  /** Arabic script, with the clitics attached the way Moroccans write them. */
  ar: string
  /** Latin spelling. The word bank of the build exercise is made from this. */
  tr: string
  nl: string
  en: string
}

export interface Letter {
  id: string
  /** Isolated form. */
  ar: string
  name: string
  tr: string
  sound: string
  forms: { initial: string; medial: string; final: string }
  exampleWordId?: string
}

export interface StoryLine {
  speaker: string
  ar: string
  tr: string
  nl: string
}

export interface Story {
  id: string
  title: string
  emoji: string
  level: 'A0' | 'A1' | 'A2'
  intro: string
  lines: StoryLine[]
  /** Comprehension questions, answered after reading. */
  quiz: { q: string; options: string[]; answer: number }[]
}
