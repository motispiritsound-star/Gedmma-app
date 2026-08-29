import type { ActivityCategory, ActivityLevel, AgeBand } from '@prisma/client';
import type { Locale } from './index';

export const AGE_BAND_LABELS: Record<AgeBand, Record<Locale, string>> = {
  AGE_6_8: { nl: '6–8 jaar', en: 'ages 6–8' },
  AGE_9_11: { nl: '9–11 jaar', en: 'ages 9–11' },
  AGE_12_14: { nl: '12–14 jaar', en: 'ages 12–14' },
  AGE_15_17: { nl: '15–17 jaar', en: 'ages 15–17' },
};

export const AGE_BAND_ORDER: AgeBand[] = ['AGE_6_8', 'AGE_9_11', 'AGE_12_14', 'AGE_15_17'];

export const CATEGORY_LABELS: Record<ActivityCategory, Record<Locale, string>> = {
  SPORTS: { nl: 'Sport', en: 'Sports' },
  MUSIC: { nl: 'Muziek', en: 'Music' },
  COOKING: { nl: 'Koken', en: 'Cooking' },
  ART: { nl: 'Kunst', en: 'Art' },
  CRAFTS: { nl: 'Handvaardigheid', en: 'Crafts' },
  TECHNOLOGY: { nl: 'Techniek', en: 'Technology' },
  NATURE: { nl: 'Natuur', en: 'Nature' },
  THEATRE: { nl: 'Theater', en: 'Theatre' },
  PRACTICAL_SKILLS: { nl: 'Praktische vaardigheden', en: 'Practical skills' },
  DANCE: { nl: 'Dans', en: 'Dance' },
  LANGUAGES: { nl: 'Talen', en: 'Languages' },
  SCIENCE: { nl: 'Wetenschap', en: 'Science' },
};

export const LEVEL_LABELS: Record<ActivityLevel, Record<Locale, string>> = {
  BEGINNER: { nl: 'Beginner', en: 'Beginner' },
  INTERMEDIATE: { nl: 'Gevorderd', en: 'Intermediate' },
  ADVANCED: { nl: 'Vergevorderd', en: 'Advanced' },
  ALL_LEVELS: { nl: 'Alle niveaus', en: 'All levels' },
};

export function ageBandLabel(band: AgeBand, locale: Locale): string {
  return AGE_BAND_LABELS[band][locale];
}

export function categoryLabel(category: ActivityCategory, locale: Locale): string {
  return CATEGORY_LABELS[category][locale];
}

export function levelLabel(level: ActivityLevel, locale: Locale): string {
  return LEVEL_LABELS[level][locale];
}

/** Age bands are ordered; an activity accepts every band in its range. */
export function ageBandsInRange(min: AgeBand, max: AgeBand): AgeBand[] {
  const from = AGE_BAND_ORDER.indexOf(min);
  const to = AGE_BAND_ORDER.indexOf(max);
  return AGE_BAND_ORDER.slice(Math.min(from, to), Math.max(from, to) + 1);
}

export function isAgeAppropriate(child: AgeBand, min: AgeBand, max: AgeBand): boolean {
  return ageBandsInRange(min, max).includes(child);
}
