'use server'

import { cookies } from 'next/headers'
import { LOCALE_COOKIE, isLocale } from '@/modules/localisation'

/** Stores the visitor's language choice for a year. */
export async function setLocaleAction(locale: string): Promise<void> {
  if (!isLocale(locale)) return
  const cookieStore = await cookies()
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 365 * 24 * 60 * 60,
    sameSite: 'lax',
    httpOnly: false,
  })
}
