import type { Lang } from '../i18n/languages'
import type { Lesson, LessonTip, Story, Unit, Word } from './types'
import type { ContentPack } from './lang/types'
import { fr } from './lang/fr'
import { de } from './lang/de'
import { es } from './lang/es'
import { en } from './lang/en'

/**
 * Dutch is the source: it lives in words.ts, curriculum.ts and stories.ts.
 * Every other language is a pack that overrides what a learner reads, while
 * the Arabic script and the Latin spelling of Darija stay exactly as they are.
 */
const PACKS: Record<Exclude<Lang, 'nl'>, ContentPack> = { fr, de, es, en }

export const packOf = (lang: Lang): ContentPack | null => (lang === 'nl' ? null : PACKS[lang])

export function meaningOf(word: Word, lang: Lang): string {
  if (lang === 'nl') return word.nl
  if (lang === 'en') return word.en
  return PACKS[lang].meanings[word.id] ?? word.en
}

export function noteOf(word: Word, lang: Lang): string | undefined {
  if (!word.note) return undefined
  if (lang === 'nl') return word.note
  return PACKS[lang].notes[word.id]
}

export const unitSubtitle = (unit: Unit, lang: Lang): string =>
  lang === 'nl' ? unit.subtitle : PACKS[lang].units[unit.id] ?? unit.subtitle

export function lessonTitle(lesson: Lesson, lang: Lang): string {
  if (lang === 'nl') return lesson.title
  const pack = PACKS[lang].lessons
  return (lesson.kind === 'toets' ? pack.toets : pack[lesson.id]) ?? lesson.title
}

export function tipOf(lesson: Lesson, lang: Lang): LessonTip | undefined {
  if (!lesson.tip) return undefined
  return lang === 'nl' ? lesson.tip : PACKS[lang].tips[lesson.id] ?? lesson.tip
}

export interface LocalisedStory {
  title: string
  intro: string
  lines: { speaker: string; ar: string; tr: string; text: string }[]
  quiz: { q: string; options: string[]; answer: number }[]
}

/** A story with every readable part swapped for the learner's language. */
export function storyOf(story: Story, lang: Lang): LocalisedStory {
  const pack = lang === 'nl' ? null : PACKS[lang].stories[story.id]
  return {
    title: pack?.title ?? story.title,
    intro: pack?.intro ?? story.intro,
    lines: story.lines.map((line, i) => ({
      speaker: line.speaker,
      ar: line.ar,
      tr: line.tr,
      text: pack?.lines[i] ?? line.nl,
    })),
    quiz: story.quiz.map((q, i) => ({
      q: pack?.quiz[i]?.q ?? q.q,
      options: pack?.quiz[i]?.options ?? q.options,
      answer: q.answer,
    })),
  }
}
