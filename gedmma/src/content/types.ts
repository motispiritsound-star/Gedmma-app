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
  /** Word ids taught here, in teaching order. */
  words: string[]
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
