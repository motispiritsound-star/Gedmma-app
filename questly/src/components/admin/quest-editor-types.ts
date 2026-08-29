/** Shapes the quest editor works with, shared between server and client code. */

export type EditorLocaleText = {
  title: string
  shortDescription: string
  story: string
  educationalObjective: string
  expectedResult: string
  preparation: string[]
  reflectionQuestions: string[]
}

export type EditorStep = {
  position: number
  estimatedMinutes: number
  requiresAdult: boolean
  en: { title: string; instruction: string; audioScript?: string | null }
  nl: { title: string; instruction: string; audioScript?: string | null }
}

export type EditorSafety = {
  position: number
  severity: 'INFO' | 'CAUTION' | 'ADULT_REQUIRED'
  textEn: string
  textNl: string
}

export type EditorQuest = {
  slug: string
  categorySlug: string
  ageBands: string[]
  durationMinutes: number
  difficulty: string
  setting: string
  weather: string[]
  seasons: string[]
  minParticipants: number
  maxParticipants: number
  requiresAdult: boolean
  isPremium: boolean
  imageKey: string
  skillSlugs: string[]
  materials: Array<{ slug: string; quantity?: string | null; optional: boolean }>
  safety: EditorSafety[]
  steps: EditorStep[]
  en: EditorLocaleText
  nl: EditorLocaleText
}
