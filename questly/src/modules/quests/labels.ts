import type { Locale } from '@/modules/localisation'
import type {
  AgeBand,
  Difficulty,
  SafetySeverity,
  Season,
  Setting,
  WeatherSuitability,
} from '@/generated/prisma/client'

/** Localised labels for the enums that appear all over the interface. */

type Pair = { en: string; nl: string }
const pick = (pair: Pair, locale: Locale) => pair[locale]

const AGE_BANDS: Record<AgeBand, Pair> = {
  AGE_6_8: { en: '6-8 years', nl: '6-8 jaar' },
  AGE_9_11: { en: '9-11 years', nl: '9-11 jaar' },
  AGE_12_15: { en: '12-15 years', nl: '12-15 jaar' },
}

const DIFFICULTIES: Record<Difficulty, Pair> = {
  EASY: { en: 'Gentle', nl: 'Rustig' },
  MEDIUM: { en: 'Medium', nl: 'Gemiddeld' },
  CHALLENGING: { en: 'Challenging', nl: 'Uitdagend' },
}

const SETTINGS: Record<Setting, Pair> = {
  INDOOR: { en: 'Indoor', nl: 'Binnen' },
  OUTDOOR: { en: 'Outdoor', nl: 'Buiten' },
  BOTH: { en: 'Indoor or outdoor', nl: 'Binnen of buiten' },
}

const SEVERITIES: Record<SafetySeverity, Pair> = {
  INFO: { en: 'Good to know', nl: 'Goed om te weten' },
  CAUTION: { en: 'Take care', nl: 'Let op' },
  ADULT_REQUIRED: { en: 'Adult required', nl: 'Volwassene nodig' },
}

const WEATHER: Record<WeatherSuitability, Pair> = {
  ANY: { en: 'Any weather', nl: 'Elk weer' },
  DRY: { en: 'Dry weather', nl: 'Droog weer' },
  RAIN_FRIENDLY: { en: 'Rain friendly', nl: 'Ook bij regen' },
  SNOW: { en: 'Snow', nl: 'Sneeuw' },
  WARM: { en: 'Warm weather', nl: 'Warm weer' },
}

const SEASONS: Record<Season, Pair> = {
  SPRING: { en: 'Spring', nl: 'Lente' },
  SUMMER: { en: 'Summer', nl: 'Zomer' },
  AUTUMN: { en: 'Autumn', nl: 'Herfst' },
  WINTER: { en: 'Winter', nl: 'Winter' },
}

const ENVIRONMENTS: Record<'CITY' | 'SUBURB' | 'RURAL', Pair> = {
  CITY: { en: 'City', nl: 'Stad' },
  SUBURB: { en: 'Suburb', nl: 'Buitenwijk' },
  RURAL: { en: 'Countryside', nl: 'Platteland' },
}

const TIMES_OF_DAY: Record<'MORNING' | 'AFTERNOON' | 'EVENING', Pair> = {
  MORNING: { en: 'Morning', nl: 'Ochtend' },
  AFTERNOON: { en: 'Afternoon', nl: 'Middag' },
  EVENING: { en: 'Evening', nl: 'Avond' },
}

export const ageBandLabel = (value: AgeBand, locale: Locale) => pick(AGE_BANDS[value], locale)
export const difficultyLabel = (value: Difficulty, locale: Locale) => pick(DIFFICULTIES[value], locale)
export const settingLabel = (value: Setting, locale: Locale) => pick(SETTINGS[value], locale)
export const severityLabel = (value: SafetySeverity, locale: Locale) => pick(SEVERITIES[value], locale)
export const weatherLabel = (value: WeatherSuitability, locale: Locale) => pick(WEATHER[value], locale)
export const seasonLabel = (value: Season, locale: Locale) => pick(SEASONS[value], locale)
export const environmentLabel = (value: 'CITY' | 'SUBURB' | 'RURAL', locale: Locale) =>
  pick(ENVIRONMENTS[value], locale)
export const timeOfDayLabel = (value: 'MORNING' | 'AFTERNOON' | 'EVENING', locale: Locale) =>
  pick(TIMES_OF_DAY[value], locale)

export const ALL_AGE_BANDS: AgeBand[] = ['AGE_6_8', 'AGE_9_11', 'AGE_12_15']
export const ALL_DIFFICULTIES: Difficulty[] = ['EASY', 'MEDIUM', 'CHALLENGING']
export const ALL_SETTINGS: Setting[] = ['INDOOR', 'OUTDOOR', 'BOTH']
export const ALL_WEATHER: WeatherSuitability[] = ['ANY', 'DRY', 'RAIN_FRIENDLY', 'SNOW', 'WARM']
export const ALL_SEASONS: Season[] = ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER']
