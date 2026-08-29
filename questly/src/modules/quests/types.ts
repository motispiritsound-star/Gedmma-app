import type {
  AgeBand,
  Difficulty,
  Locale,
  QuestStatus,
  SafetySeverity,
  Season,
  Setting,
  WeatherSuitability,
} from '@/generated/prisma/client'

export type QuestCardView = {
  id: string
  slug: string
  title: string
  shortDescription: string
  imageKey: string
  category: { slug: string; name: string; colorToken: string; icon: string }
  ageBands: AgeBand[]
  durationMinutes: number
  difficulty: Difficulty
  setting: Setting
  minParticipants: number
  maxParticipants: number
  requiresAdult: boolean
  isPremium: boolean
  skills: Array<{ slug: string; name: string }>
  materials: Array<{ slug: string; name: string; optional: boolean }>
  hasSafetyWarnings: boolean
  locked: boolean
}

export type QuestStepView = {
  id: string
  position: number
  estimatedMinutes: number
  requiresAdult: boolean
  title: string
  instruction: string
  audioScript: string | null
}

export type QuestDetailView = QuestCardView & {
  status: QuestStatus
  story: string
  educationalObjective: string
  expectedResult: string
  preparation: string[]
  reflectionQuestions: string[]
  weather: WeatherSuitability[]
  seasons: Season[]
  steps: QuestStepView[]
  safety: Array<{ id: string; position: number; severity: SafetySeverity; text: string }>
  materialsDetailed: Array<{ slug: string; name: string; quantity: string | null; optional: boolean }>
  locale: Locale
}

export type QuestFilters = {
  ageBands?: AgeBand[]
  categorySlugs?: string[]
  skillSlugs?: string[]
  maxDurationMinutes?: number
  setting?: Setting | 'ANY'
  difficulty?: Difficulty[]
  weather?: WeatherSuitability
  participants?: number
  onlyCommonMaterials?: boolean
  access?: 'all' | 'free'
  search?: string
}
