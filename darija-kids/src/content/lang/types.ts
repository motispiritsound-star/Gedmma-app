/**
 * Everything a learner reads, in one language.
 *
 * The Arabic script and the Latin spelling of Darija never change, so a pack
 * only carries what is written in the learner's own language: the meanings,
 * the usage notes, the titles on the path and the stories.
 */
export interface ContentPack {
  /** Word id → meaning. Dutch and English live in words.ts instead. */
  meanings: Record<string, string>
  /** Word id → the short usage note under a new word. */
  notes: Record<string, string>
  /** Unit id → the line under the unit's Darija name. */
  units: Record<string, string>
  /** Lesson id → its title. The key `toets` covers every checkpoint. */
  lessons: Record<string, string>
  /** Lesson id → the tip shown once before that lesson. */
  tips: Record<string, { title: string; body: string }>
  stories: Record<string, {
    title: string
    intro: string
    /** One per line of the dialogue, in order. */
    lines: string[]
    quiz: { q: string; options: string[] }[]
  }>
}
