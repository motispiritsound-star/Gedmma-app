import { en } from "./dictionaries/en";
import { nl } from "./dictionaries/nl";
import { DEFAULT_LOCALE, type AppLocale, type Dictionary, type TranslationKey, type Translate } from "./types";

const DICTIONARIES: Record<AppLocale, Dictionary> = { nl, en };

export function getDictionary(locale: AppLocale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
}

/**
 * Builds a translator. Missing keys fall back to the default locale and then to
 * the key itself, so a partial translation degrades rather than crashes.
 */
export function createTranslator(locale: AppLocale): Translate {
  const dictionary = getDictionary(locale);
  const fallback = getDictionary(DEFAULT_LOCALE);

  return (key: TranslationKey, params?: Record<string, string | number>) => {
    const template = dictionary[key] ?? fallback[key] ?? key;
    if (!params) return template;
    return template.replace(/\{(\w+)\}/g, (match, name: string) =>
      Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match,
    );
  };
}

/** Picks the localised column pair used on content tables (nameNl / nameEn). */
export function pickText(locale: AppLocale, nlText: string, enText: string): string {
  return locale === "en" ? enText : nlText;
}

/** Maps the app locale onto the database `Locale` enum. */
export function toDbLocale(locale: AppLocale): "NL" | "EN" {
  return locale === "en" ? "EN" : "NL";
}

export function fromDbLocale(locale: "NL" | "EN"): AppLocale {
  return locale === "EN" ? "en" : "nl";
}

export function parseLocale(value: string | null | undefined): AppLocale | null {
  if (value === "nl" || value === "en") return value;
  return null;
}

/** Best-effort negotiation from an Accept-Language header. */
export function negotiateLocale(acceptLanguage: string | null | undefined): AppLocale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const entries = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag = "", ...rest] = part.trim().split(";");
      const q = rest.find((r) => r.trim().startsWith("q="));
      return { tag: tag.toLowerCase(), q: q ? Number(q.split("=")[1]) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of entries) {
    if (tag.startsWith("nl")) return "nl";
    if (tag.startsWith("en")) return "en";
  }
  return DEFAULT_LOCALE;
}
