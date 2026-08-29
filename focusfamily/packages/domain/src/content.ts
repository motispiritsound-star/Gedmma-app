import { z } from 'zod';
import { locales } from './people.js';

/**
 * Library content is stored as text in both languages rather than as message
 * keys: articles are edited by people who are not developers, and a family
 * should never see an untranslated key where a paragraph belongs.
 */
export const localizedTextSchema = z.object({
  nl: z.string().min(1),
  en: z.string().min(1),
});
export type LocalizedText = z.infer<typeof localizedTextSchema>;

export const localizedParagraphsSchema = z.object({
  nl: z.array(z.string().min(1)).min(1),
  en: z.array(z.string().min(1)).min(1),
});
export type LocalizedParagraphs = z.infer<typeof localizedParagraphsSchema>;

export function pick(text: LocalizedText, locale: (typeof locales)[number]): string {
  return text[locale] ?? text.nl;
}

/**
 * Offline activity suggestions. `questlyRef` is the only hook towards a future
 * Questly integration; it is inert today and documented as planned, not built.
 */
export const activityCategories = [
  'outdoors',
  'kitchen',
  'making',
  'games',
  'talking',
  'movement',
] as const;
export type ActivityCategory = (typeof activityCategories)[number];

export const activitySuggestionSchema = z
  .object({
    id: z.string(),
    category: z.enum(activityCategories),
    title: localizedTextSchema,
    body: localizedTextSchema,
    minutes: z.number().int().min(5).max(180),
    minAge: z.number().int().min(4).max(17),
    maxAge: z.number().int().min(4).max(99),
    /** Most of them need an adult, on purpose. */
    needsAdult: z.boolean().default(true),
    pack: z.enum(['core', 'extra']).default('core'),
    questlyRef: z.string().nullable().default(null),
  })
  .strict();
export type ActivitySuggestion = z.infer<typeof activitySuggestionSchema>;

export const articleTopics = [
  'social_media',
  'gaming',
  'sleep',
  'conversations',
  'school',
  'privacy',
] as const;
export type ArticleTopic = (typeof articleTopics)[number];

export const educationalArticleSchema = z
  .object({
    id: z.string(),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    topic: z.enum(articleTopics),
    title: localizedTextSchema,
    summary: localizedTextSchema,
    body: localizedParagraphsSchema,
    readMinutes: z.number().int().min(1).max(30),
    audience: z.enum(['guardian', 'teen', 'everyone']).default('guardian'),
    /** Where the guidance comes from, so a parent can check it themselves. */
    sourceNote: localizedTextSchema,
    updatedAt: z.coerce.date(),
  })
  .strict();
export type EducationalArticle = z.infer<typeof educationalArticleSchema>;

export function suggestionsForAge(
  suggestions: readonly ActivitySuggestion[],
  age: number,
  options: { includeExtraPacks: boolean },
): ActivitySuggestion[] {
  return suggestions.filter(
    (suggestion) =>
      age >= suggestion.minAge &&
      age <= suggestion.maxAge &&
      (options.includeExtraPacks || suggestion.pack === 'core'),
  );
}

/** Flatten library content into a catalogue the copy audit can scan. */
export function contentCopy(args: {
  activities: readonly ActivitySuggestion[];
  articles: readonly EducationalArticle[];
}): Record<string, string> {
  const out: Record<string, string> = {};
  for (const activity of args.activities) {
    out[`activity:${activity.id}:title:nl`] = activity.title.nl;
    out[`activity:${activity.id}:title:en`] = activity.title.en;
    out[`activity:${activity.id}:body:nl`] = activity.body.nl;
    out[`activity:${activity.id}:body:en`] = activity.body.en;
  }
  for (const article of args.articles) {
    out[`article:${article.slug}:title:nl`] = article.title.nl;
    out[`article:${article.slug}:title:en`] = article.title.en;
    out[`article:${article.slug}:summary:nl`] = article.summary.nl;
    out[`article:${article.slug}:summary:en`] = article.summary.en;
    article.body.nl.forEach((paragraph, index) => {
      out[`article:${article.slug}:body:nl:${index}`] = paragraph;
    });
    article.body.en.forEach((paragraph, index) => {
      out[`article:${article.slug}:body:en:${index}`] = paragraph;
    });
  }
  return out;
}
