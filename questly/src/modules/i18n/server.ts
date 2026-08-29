import { cookies, headers } from "next/headers";
import { createTranslator, negotiateLocale, parseLocale } from "./translate";
import { LOCALE_COOKIE, type AppLocale, type Translate } from "./types";

/** Resolves the active locale: explicit cookie first, then Accept-Language. */
export async function getLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  const explicit = parseLocale(cookieStore.get(LOCALE_COOKIE)?.value);
  if (explicit) return explicit;
  const headerStore = await headers();
  return negotiateLocale(headerStore.get("accept-language"));
}

export async function getTranslator(): Promise<{ locale: AppLocale; t: Translate }> {
  const locale = await getLocale();
  return { locale, t: createTranslator(locale) };
}
