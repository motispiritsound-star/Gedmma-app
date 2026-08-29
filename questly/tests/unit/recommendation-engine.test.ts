import { describe, expect, it } from 'vitest'
import {
  recommendQuests,
  scoreQuest,
  seasonForDate,
  type RecommendationContext,
  type RecommendationQuest,
} from '@/modules/recommendations/engine'

/** The engine is pure, so these tests need no database and no clock. */

const baseQuest: RecommendationQuest = {
  id: 'quest-1',
  slug: 'leaf-detective',
  ageBands: ['AGE_6_8'],
  categorySlug: 'nature',
  skillSlugs: ['nature-awareness'],
  durationMinutes: 45,
  difficulty: 'EASY',
  setting: 'OUTDOOR',
  weather: ['DRY'],
  seasons: ['SPRING'],
  minParticipants: 1,
  maxParticipants: 6,
  isPremium: false,
  needsSpecialMaterials: false,
}

const baseContext: RecommendationContext = {
  childAgeBands: ['AGE_6_8'],
  interestCategorySlugs: [],
  interestSkillSlugs: [],
  completedQuestIds: [],
  recentCategorySlugs: [],
  recentSkillSlugs: [],
  favouriteQuestIds: [],
  preferredDurationMinutes: 60,
  preferredDifficulty: 'EASY',
  preferredSetting: 'BOTH',
  prefersFamilyActivity: true,
  familySize: 4,
  weather: 'DRY',
  season: 'SPRING',
  onlyCommonMaterials: false,
}

describe('scoreQuest', () => {
  it('excludes a quest outside the children’s age band', () => {
    const result = scoreQuest(
      { ...baseQuest, ageBands: ['AGE_12_15'] },
      { ...baseContext, childAgeBands: ['AGE_6_8'] },
    )
    expect(result.excluded).toBe(true)
    expect(result.exclusionReason).toBe('age_band')
  })

  it('includes a quest when any child’s age band matches', () => {
    const result = scoreQuest(
      { ...baseQuest, ageBands: ['AGE_12_15'] },
      { ...baseContext, childAgeBands: ['AGE_6_8', 'AGE_12_15'] },
    )
    expect(result.excluded).toBe(false)
  })

  it('excludes a quest the family has already completed', () => {
    const result = scoreQuest(baseQuest, { ...baseContext, completedQuestIds: ['quest-1'] })
    expect(result.exclusionReason).toBe('already_completed')
  })

  it('excludes a quest needing more participants than the family has', () => {
    const result = scoreQuest(
      { ...baseQuest, minParticipants: 6 },
      { ...baseContext, familySize: 3 },
    )
    expect(result.exclusionReason).toBe('participants')
  })

  it('scores an interest match higher than no interest match', () => {
    const withInterest = scoreQuest(baseQuest, {
      ...baseContext,
      interestCategorySlugs: ['nature'],
    })
    const without = scoreQuest(baseQuest, baseContext)
    expect(withInterest.score).toBeGreaterThan(without.score)
    expect(withInterest.reasons.map((reason) => reason.key)).toContain('interest_category')
  })

  it('rewards a category the family has not explored recently', () => {
    const fresh = scoreQuest(baseQuest, baseContext)
    const repeated = scoreQuest(baseQuest, { ...baseContext, recentCategorySlugs: ['nature'] })
    expect(fresh.score).toBeGreaterThan(repeated.score)
    expect(fresh.reasons.map((reason) => reason.key)).toContain('new_category')
  })

  it('penalises a quest that does not suit the weather', () => {
    const dry = scoreQuest(baseQuest, { ...baseContext, weather: 'DRY' })
    const rain = scoreQuest(baseQuest, { ...baseContext, weather: 'RAIN_FRIENDLY' })
    expect(dry.score).toBeGreaterThan(rain.score)
  })

  it('gives a rain-friendly reason on a rainy afternoon', () => {
    const result = scoreQuest(
      { ...baseQuest, weather: ['RAIN_FRIENDLY'], setting: 'INDOOR' },
      { ...baseContext, weather: 'RAIN_FRIENDLY' },
    )
    expect(result.reasons.map((reason) => reason.key)).toContain('weather_match')
  })

  it('prefers a quest that fits inside the available time', () => {
    const fits = scoreQuest({ ...baseQuest, durationMinutes: 45 }, baseContext)
    const overruns = scoreQuest({ ...baseQuest, durationMinutes: 150 }, baseContext)
    expect(fits.score).toBeGreaterThan(overruns.score)
  })

  it('rewards quests using materials most homes have', () => {
    const common = scoreQuest(baseQuest, baseContext)
    const special = scoreQuest({ ...baseQuest, needsSpecialMaterials: true }, baseContext)
    expect(common.score).toBeGreaterThan(special.score)
  })
})

describe('recommendQuests', () => {
  const quests: RecommendationQuest[] = [
    { ...baseQuest, id: 'a', slug: 'a-quest', categorySlug: 'nature' },
    { ...baseQuest, id: 'b', slug: 'b-quest', categorySlug: 'science', skillSlugs: ['curiosity'] },
    { ...baseQuest, id: 'c', slug: 'c-quest', ageBands: ['AGE_12_15'] },
  ]

  it('never returns a quest outside the age band', () => {
    const result = recommendQuests(quests, baseContext)
    expect(result.map((entry) => entry.quest.id)).not.toContain('c')
  })

  it('ranks an interest match first', () => {
    const result = recommendQuests(quests, { ...baseContext, interestCategorySlugs: ['science'] })
    expect(result[0]?.quest.id).toBe('b')
  })

  it('is deterministic across repeated calls', () => {
    const first = recommendQuests(quests, baseContext).map((entry) => entry.quest.id)
    const second = recommendQuests(quests, baseContext).map((entry) => entry.quest.id)
    expect(first).toEqual(second)
  })

  it('respects the limit', () => {
    expect(recommendQuests(quests, baseContext, 1)).toHaveLength(1)
  })

  it('spreads the feed across categories instead of repeating one', () => {
    // Five quests in one category and two in others: a plain sort would fill
    // the feed with the first category alone.
    const crowded: RecommendationQuest[] = [
      ...['a', 'b', 'c', 'd', 'e'].map((slug) => ({
        ...baseQuest,
        id: `nature-${slug}`,
        slug: `nature-${slug}`,
        categorySlug: 'nature',
      })),
      { ...baseQuest, id: 'science-a', slug: 'science-a', categorySlug: 'science' },
      { ...baseQuest, id: 'cooking-a', slug: 'cooking-a', categorySlug: 'cooking' },
    ]

    const feed = recommendQuests(crowded, baseContext, 4)
    const categories = feed.map((entry) => entry.quest.categorySlug)

    expect(feed).toHaveLength(4)
    expect(new Set(categories).size).toBeGreaterThan(1)
    expect(categories.filter((slug) => slug === 'nature').length).toBeLessThanOrEqual(2)
  })

  it('still prefers a much better quest over variety', () => {
    const context = { ...baseContext, interestCategorySlugs: ['nature'] }
    const mixed: RecommendationQuest[] = [
      { ...baseQuest, id: 'n1', slug: 'nature-one', categorySlug: 'nature' },
      { ...baseQuest, id: 'n2', slug: 'nature-two', categorySlug: 'nature' },
      // Wrong season and wrong weather: a genuinely poor match.
      {
        ...baseQuest,
        id: 'x1',
        slug: 'other-one',
        categorySlug: 'history-culture',
        seasons: ['WINTER'],
        weather: ['SNOW'],
        difficulty: 'CHALLENGING',
      },
    ]

    const feed = recommendQuests(mixed, context, 2)
    expect(feed.map((entry) => entry.quest.slug)).toEqual(['nature-one', 'nature-two'])
  })
})

describe('seasonForDate', () => {
  it('maps months to northern-hemisphere seasons', () => {
    expect(seasonForDate(new Date('2026-04-15'))).toBe('SPRING')
    expect(seasonForDate(new Date('2026-07-15'))).toBe('SUMMER')
    expect(seasonForDate(new Date('2026-10-15'))).toBe('AUTUMN')
    expect(seasonForDate(new Date('2026-01-15'))).toBe('WINTER')
  })
})
