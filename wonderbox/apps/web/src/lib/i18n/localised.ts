import { z } from 'zod';
import { FALLBACK_CHAIN, SUPPORTED_LOCALES, type Locale } from './locale.ts';

/**
 * Content copy is stored as a locale map. Reading it always goes through
 * `resolve`, so the fallback behaviour is one implementation with one test.
 */

export const LocalisedTextSchema = z
  .record(z.string(), z.string())
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Localised text must contain at least one locale',
  });

export type LocalisedText = Record<string, string>;

export interface Resolved {
  readonly value: string;
  /** The locale actually used. Differs from the request when a fallback fired. */
  readonly locale: Locale;
  readonly usedFallback: boolean;
}

export class MissingTranslationError extends Error {
  constructor(requested: Locale) {
    super(`No translation available for "${requested}" or any of its fallbacks`);
    this.name = 'MissingTranslationError';
  }
}

/** Parses an untyped Json column into a locale map, dropping empty strings. */
export function toLocalised(value: unknown): LocalisedText {
  const parsed = LocalisedTextSchema.safeParse(value);
  if (!parsed.success) return {};
  return Object.fromEntries(
    Object.entries(parsed.data).filter(([, text]) => text.trim().length > 0),
  );
}

/**
 * Resolves a locale map, walking the documented fallback chain and, as a last
 * resort, any remaining supported locale. Returns null rather than throwing so
 * callers can decide whether a gap is fatal.
 */
export function tryResolve(source: unknown, requested: Locale): Resolved | null {
  const map = toLocalised(source);
  for (const candidate of FALLBACK_CHAIN[requested]) {
    const value = map[candidate];
    if (value) {
      return { value, locale: candidate, usedFallback: candidate !== requested };
    }
  }
  for (const candidate of SUPPORTED_LOCALES) {
    const value = map[candidate];
    if (value) return { value, locale: candidate, usedFallback: true };
  }
  return null;
}

export function resolve(source: unknown, requested: Locale): Resolved {
  const found = tryResolve(source, requested);
  if (!found) throw new MissingTranslationError(requested);
  return found;
}

/** The common case: "just give me the string". */
export function text(source: unknown, requested: Locale, fallback = ''): string {
  return tryResolve(source, requested)?.value ?? fallback;
}

/** Ordered list of steps, each of which is itself a locale map. */
export function textList(source: unknown, requested: Locale): string[] {
  if (!Array.isArray(source)) return [];
  return source.map((entry) => text(entry, requested)).filter((entry) => entry.length > 0);
}

/** Which locales are still missing — what the studio's coverage badge shows. */
export function missingLocales(source: unknown): Locale[] {
  const map = toLocalised(source);
  return SUPPORTED_LOCALES.filter((locale) => !map[locale]);
}
