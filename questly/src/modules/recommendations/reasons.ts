import type { Locale } from '@/modules/localisation'
import type { RecommendationReason } from './engine'

/**
 * Turns a machine reason into a sentence a parent can read. Category, skill and
 * weather parameters arrive as slugs and are looked up in the caller-supplied
 * label maps so the sentence reads naturally in both languages.
 */

type Templates = Record<RecommendationReason['key'], string>

const TEMPLATES: Record<Locale, Templates> = {
  en: {
    age_match: 'Suitable for your children’s age band.',
    interest_category: 'Matches an interest in {category}.',
    interest_skill: 'Builds on an interest in {skill}.',
    fits_time: 'Fits in about {minutes} minutes.',
    difficulty_match: 'Matches the challenge level you prefer.',
    setting_match: 'Fits where you like to be.',
    weather_match: 'Suitable for {weather}.',
    season_match: 'A good fit for this time of year.',
    materials_at_home: 'Uses things most homes already have.',
    new_category: 'Explores {category}, which you have not done recently.',
    new_skill: 'Develops {skill}, a skill not practised recently.',
    family_size: 'Works well for the whole family together.',
    favourite: 'One of your saved favourites.',
    not_done_yet: 'You have not done this one yet.',
  },
  nl: {
    age_match: 'Past bij de leeftijdsgroep van jullie kinderen.',
    interest_category: 'Sluit aan bij interesse in {category}.',
    interest_skill: 'Bouwt voort op interesse in {skill}.',
    fits_time: 'Past in ongeveer {minutes} minuten.',
    difficulty_match: 'Past bij de uitdaging die jullie prettig vinden.',
    setting_match: 'Past bij waar jullie graag zijn.',
    weather_match: 'Geschikt voor {weather}.',
    season_match: 'Past goed bij dit seizoen.',
    materials_at_home: 'Gebruikt spullen die de meeste huizen al hebben.',
    new_category: 'Verkent {category}, dat jullie recent nog niet deden.',
    new_skill: 'Ontwikkelt {skill}, een vaardigheid die je onlangs niet oefende.',
    family_size: 'Werkt goed met het hele gezin samen.',
    favourite: 'Eén van jullie favorieten.',
    not_done_yet: 'Dit avontuur deden jullie nog niet.',
  },
}

const WEATHER_LABELS: Record<Locale, Record<string, string>> = {
  en: {
    ANY: 'any weather',
    DRY: 'a dry day',
    RAIN_FRIENDLY: 'a rainy afternoon',
    SNOW: 'snow',
    WARM: 'warm weather',
  },
  nl: {
    ANY: 'elk weer',
    DRY: 'een droge dag',
    RAIN_FRIENDLY: 'een regenachtige middag',
    SNOW: 'sneeuw',
    WARM: 'warm weer',
  },
}

export type LabelMaps = {
  categories: Record<string, string>
  skills: Record<string, string>
}

export function renderReason(
  reason: RecommendationReason,
  locale: Locale,
  labels: LabelMaps,
): string {
  const template = TEMPLATES[locale][reason.key]
  const params = reason.params ?? {}
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const raw = params[key]
    if (raw === undefined) return match
    if (key === 'category') return labels.categories[String(raw)] ?? String(raw)
    if (key === 'skill') return labels.skills[String(raw)] ?? String(raw)
    if (key === 'weather') return WEATHER_LABELS[locale][String(raw)] ?? String(raw)
    return String(raw)
  })
}

/** The two or three reasons worth showing on a card. */
export function topReasons(
  reasons: readonly RecommendationReason[],
  locale: Locale,
  labels: LabelMaps,
  limit = 3,
): string[] {
  const preferred: RecommendationReason['key'][] = [
    'interest_category',
    'new_category',
    'weather_match',
    'interest_skill',
    'fits_time',
    'new_skill',
    'materials_at_home',
    'difficulty_match',
    'family_size',
    'favourite',
    'season_match',
    'setting_match',
    'age_match',
    'not_done_yet',
  ]
  const ordered = [...reasons].sort(
    (a, b) => preferred.indexOf(a.key) - preferred.indexOf(b.key),
  )
  return ordered.slice(0, limit).map((reason) => renderReason(reason, locale, labels))
}
