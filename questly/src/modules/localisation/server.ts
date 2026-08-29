import 'server-only'
import { cookies, headers } from 'next/headers'
import { getEnv } from '@/env'
import { getDictionary, isLocale, type Dictionary, type Locale, LOCALE_COOKIE } from './index'

/**
 * Server-only locale resolution. Kept out of `index.ts` so client components can
 * import the dictionaries and `fill()` without pulling in `next/headers`.
 */

function fromAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null
  for (const part of header.split(',')) {
    const tag = part.split(';')[0]?.trim().toLowerCase() ?? ''
    if (tag.startsWith('nl')) return 'nl'
    if (tag.startsWith('en')) return 'en'
  }
  return null
}

/**
 * Resolution order: explicit cookie, then the browser's Accept-Language, then
 * the configured default. See PRODUCT_DECISIONS.md for why the MVP uses a
 * cookie rather than a URL prefix.
 */
export async function resolveLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value
  if (isLocale(fromCookie)) return fromCookie

  const headerStore = await headers()
  const negotiated = fromAcceptLanguage(headerStore.get('accept-language'))
  if (negotiated) return negotiated

  return getEnv().DEFAULT_LOCALE
}

export async function getTranslations(): Promise<{ locale: Locale; d: Dictionary }> {
  const locale = await resolveLocale()
  return { locale, d: getDictionary(locale) }
}
