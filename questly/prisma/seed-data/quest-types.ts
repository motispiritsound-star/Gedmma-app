export type SeedLocaleText = {
  title: string
  shortDescription: string
  story: string
  educationalObjective: string
  expectedResult: string
  preparation: string[]
  reflectionQuestions: string[]
}

export type SeedStep = {
  minutes: number
  requiresAdult?: boolean
  en: { title: string; instruction: string; audioScript?: string }
  nl: { title: string; instruction: string; audioScript?: string }
}

export type SeedSafety = {
  severity: 'INFO' | 'CAUTION' | 'ADULT_REQUIRED'
  en: string
  nl: string
}

export type SeedQuest = {
  slug: string
  category: string
  ageBands: Array<'AGE_6_8' | 'AGE_9_11' | 'AGE_12_15'>
  durationMinutes: number
  difficulty: 'EASY' | 'MEDIUM' | 'CHALLENGING'
  setting: 'INDOOR' | 'OUTDOOR' | 'BOTH'
  weather: Array<'ANY' | 'DRY' | 'RAIN_FRIENDLY' | 'SNOW' | 'WARM'>
  seasons?: Array<'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER'>
  minParticipants: number
  maxParticipants: number
  requiresAdult?: boolean
  isPremium?: boolean
  skills: string[]
  materials: Array<{ slug: string; quantity?: string; optional?: boolean }>
  safety?: SeedSafety[]
  steps: SeedStep[]
  en: SeedLocaleText
  nl: SeedLocaleText
}
