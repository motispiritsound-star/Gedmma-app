import type {
  AgeBand,
  Difficulty,
  Season,
  Setting,
  WeatherSuitability,
} from '@/generated/prisma/client'

/**
 * Deterministic recommendation engine.
 *
 * This module is deliberately pure: no database, no clock, no randomness. Every
 * input is passed in, so the same context always produces the same ranking and
 * the whole thing is unit-testable. `src/modules/recommendations/service.ts`
 * gathers the inputs; `ai.ts` describes the optional re-ranking interface.
 */

export type RecommendationQuest = {
  id: string
  slug: string
  ageBands: AgeBand[]
  categorySlug: string
  skillSlugs: string[]
  durationMinutes: number
  difficulty: Difficulty
  setting: Setting
  weather: WeatherSuitability[]
  seasons: Season[]
  minParticipants: number
  maxParticipants: number
  isPremium: boolean
  /** True when the quest needs something a household is unlikely to have. */
  needsSpecialMaterials: boolean
}

export type RecommendationContext = {
  childAgeBands: AgeBand[]
  /** Category slugs derived from the child profiles' interests. */
  interestCategorySlugs: string[]
  interestSkillSlugs: string[]
  completedQuestIds: string[]
  /** Category slugs from the most recent completions, newest first. */
  recentCategorySlugs: string[]
  recentSkillSlugs: string[]
  favouriteQuestIds: string[]
  preferredDurationMinutes: number
  preferredDifficulty: Difficulty
  preferredSetting: Setting
  prefersFamilyActivity: boolean
  familySize: number
  weather: WeatherSuitability
  season: Season
  onlyCommonMaterials: boolean
}

export type ReasonKey =
  | 'age_match'
  | 'interest_category'
  | 'interest_skill'
  | 'fits_time'
  | 'difficulty_match'
  | 'setting_match'
  | 'weather_match'
  | 'season_match'
  | 'materials_at_home'
  | 'new_category'
  | 'new_skill'
  | 'family_size'
  | 'favourite'
  | 'not_done_yet'

export type RecommendationReason = {
  key: ReasonKey
  /** Substituted into the localised reason template. */
  params?: Record<string, string | number>
  weight: number
}

export type ScoredQuest = {
  quest: RecommendationQuest
  score: number
  reasons: RecommendationReason[]
  /** Hard exclusions never surface; kept for debugging and tests. */
  excluded: boolean
  exclusionReason?: 'age_band' | 'participants' | 'already_completed'
}

const WEIGHTS = {
  ageMatch: 30,
  interestCategory: 22,
  interestSkill: 12,
  fitsTime: 14,
  difficultyMatch: 10,
  settingMatch: 10,
  weatherMatch: 14,
  seasonMatch: 6,
  materialsAtHome: 8,
  newCategory: 18,
  newSkill: 8,
  familySize: 6,
  favourite: 9,
  notDoneYet: 4,
} as const

const DIFFICULTY_ORDER: Record<Difficulty, number> = { EASY: 0, MEDIUM: 1, CHALLENGING: 2 }

function settingMatches(questSetting: Setting, preferred: Setting): boolean {
  if (questSetting === 'BOTH' || preferred === 'BOTH') return true
  return questSetting === preferred
}

function weatherMatches(questWeather: WeatherSuitability[], today: WeatherSuitability): boolean {
  if (questWeather.length === 0) return true
  return questWeather.includes('ANY') || questWeather.includes(today)
}

/**
 * Scores a single quest. Returns `excluded: true` for hard mismatches so the
 * caller can filter them out while tests can still assert on the reason.
 */
export function scoreQuest(
  quest: RecommendationQuest,
  context: RecommendationContext,
): ScoredQuest {
  const reasons: RecommendationReason[] = []
  let score = 0

  // --- hard filters -------------------------------------------------------
  const ageMatch =
    context.childAgeBands.length === 0 ||
    quest.ageBands.some((band) => context.childAgeBands.includes(band))
  if (!ageMatch) {
    return { quest, score: 0, reasons: [], excluded: true, exclusionReason: 'age_band' }
  }

  const participants = Math.max(1, context.familySize)
  if (quest.minParticipants > participants) {
    return { quest, score: 0, reasons: [], excluded: true, exclusionReason: 'participants' }
  }

  if (context.completedQuestIds.includes(quest.id)) {
    return { quest, score: 0, reasons: [], excluded: true, exclusionReason: 'already_completed' }
  }

  // --- positive signals ---------------------------------------------------
  score += WEIGHTS.ageMatch
  reasons.push({ key: 'age_match', weight: WEIGHTS.ageMatch })

  if (context.interestCategorySlugs.includes(quest.categorySlug)) {
    score += WEIGHTS.interestCategory
    reasons.push({
      key: 'interest_category',
      params: { category: quest.categorySlug },
      weight: WEIGHTS.interestCategory,
    })
  }

  const matchedSkill = quest.skillSlugs.find((slug) => context.interestSkillSlugs.includes(slug))
  if (matchedSkill) {
    score += WEIGHTS.interestSkill
    reasons.push({
      key: 'interest_skill',
      params: { skill: matchedSkill },
      weight: WEIGHTS.interestSkill,
    })
  }

  // Time fit: full marks when the quest fits inside the preferred window,
  // tapering off as it overruns.
  const overrun = quest.durationMinutes - context.preferredDurationMinutes
  if (overrun <= 0) {
    score += WEIGHTS.fitsTime
    reasons.push({
      key: 'fits_time',
      params: { minutes: quest.durationMinutes },
      weight: WEIGHTS.fitsTime,
    })
  } else {
    score += Math.max(-10, WEIGHTS.fitsTime - Math.round(overrun / 5) * 3)
  }

  const difficultyGap = Math.abs(
    DIFFICULTY_ORDER[quest.difficulty] - DIFFICULTY_ORDER[context.preferredDifficulty],
  )
  if (difficultyGap === 0) {
    score += WEIGHTS.difficultyMatch
    reasons.push({ key: 'difficulty_match', weight: WEIGHTS.difficultyMatch })
  } else {
    score -= difficultyGap * 5
  }

  if (settingMatches(quest.setting, context.preferredSetting)) {
    score += WEIGHTS.settingMatch
    reasons.push({ key: 'setting_match', weight: WEIGHTS.settingMatch })
  } else {
    score -= 8
  }

  if (weatherMatches(quest.weather, context.weather)) {
    score += WEIGHTS.weatherMatch
    if (context.weather !== 'ANY') {
      reasons.push({
        key: 'weather_match',
        params: { weather: context.weather },
        weight: WEIGHTS.weatherMatch,
      })
    }
  } else {
    score -= 16
  }

  if (quest.seasons.length === 0 || quest.seasons.includes(context.season)) {
    score += WEIGHTS.seasonMatch
    if (quest.seasons.length > 0) {
      reasons.push({
        key: 'season_match',
        params: { season: context.season },
        weight: WEIGHTS.seasonMatch,
      })
    }
  } else {
    score -= 10
  }

  if (!quest.needsSpecialMaterials) {
    score += WEIGHTS.materialsAtHome
    reasons.push({ key: 'materials_at_home', weight: WEIGHTS.materialsAtHome })
  } else if (context.onlyCommonMaterials) {
    score -= 14
  }

  // Exploration: reward categories and skills the family has not touched lately.
  if (!context.recentCategorySlugs.includes(quest.categorySlug)) {
    score += WEIGHTS.newCategory
    reasons.push({
      key: 'new_category',
      params: { category: quest.categorySlug },
      weight: WEIGHTS.newCategory,
    })
  } else {
    // Softly discourage a third woodland walk in a row.
    const position = context.recentCategorySlugs.indexOf(quest.categorySlug)
    score -= Math.max(2, 10 - position * 2)
  }

  const freshSkill = quest.skillSlugs.find((slug) => !context.recentSkillSlugs.includes(slug))
  if (freshSkill) {
    score += WEIGHTS.newSkill
    reasons.push({ key: 'new_skill', params: { skill: freshSkill }, weight: WEIGHTS.newSkill })
  }

  if (context.prefersFamilyActivity && quest.maxParticipants >= Math.max(2, participants)) {
    score += WEIGHTS.familySize
    reasons.push({ key: 'family_size', weight: WEIGHTS.familySize })
  }

  if (context.favouriteQuestIds.includes(quest.id)) {
    score += WEIGHTS.favourite
    reasons.push({ key: 'favourite', weight: WEIGHTS.favourite })
  }

  score += WEIGHTS.notDoneYet
  reasons.push({ key: 'not_done_yet', weight: WEIGHTS.notDoneYet })

  reasons.sort((a, b) => b.weight - a.weight)

  return { quest, score: Math.max(0, score), reasons, excluded: false }
}

/**
 * Penalty applied to each further quest from a category already chosen for this
 * feed. Large enough to break up a run of near-identical suggestions, small
 * enough that a genuinely much better second quest still wins.
 */
const CATEGORY_REPEAT_PENALTY = 12

/**
 * Ranks quests and returns a feed.
 *
 * Selection is greedy rather than a plain sort: after each pick, the remaining
 * quests in that category are penalised. Without this a family whose interests
 * point at one category gets six near-identical cards, each explaining itself
 * with the same reason. Ties break on slug, so the feed is stable across
 * refreshes - a family should not see a reshuffle every time they look.
 */
export function recommendQuests(
  quests: readonly RecommendationQuest[],
  context: RecommendationContext,
  limit = 6,
): ScoredQuest[] {
  const candidates = quests
    .map((quest) => scoreQuest(quest, context))
    .filter((scored) => !scored.excluded)

  const chosen: ScoredQuest[] = []
  const categoryCounts = new Map<string, number>()

  while (chosen.length < limit && candidates.length > 0) {
    let bestIndex = 0
    let bestValue = -Infinity

    for (const [index, candidate] of candidates.entries()) {
      const repeats = categoryCounts.get(candidate.quest.categorySlug) ?? 0
      const value = candidate.score - repeats * CATEGORY_REPEAT_PENALTY
      const best = candidates[bestIndex]
      if (
        value > bestValue ||
        (value === bestValue && best && candidate.quest.slug.localeCompare(best.quest.slug) < 0)
      ) {
        bestValue = value
        bestIndex = index
      }
    }

    const [picked] = candidates.splice(bestIndex, 1)
    if (!picked) break
    categoryCounts.set(
      picked.quest.categorySlug,
      (categoryCounts.get(picked.quest.categorySlug) ?? 0) + 1,
    )
    chosen.push(picked)
  }

  return chosen
}

/** Season for a given date on the northern hemisphere (the launch market). */
export function seasonForDate(date: Date): Season {
  const month = date.getMonth() + 1
  if (month >= 3 && month <= 5) return 'SPRING'
  if (month >= 6 && month <= 8) return 'SUMMER'
  if (month >= 9 && month <= 11) return 'AUTUMN'
  return 'WINTER'
}
