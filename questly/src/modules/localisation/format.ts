import type { Locale } from './index'

const BCP47: Record<Locale, string> = { nl: 'nl-NL', en: 'en-GB' }

export function formatDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(BCP47[locale], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function formatShortDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(BCP47[locale], { day: 'numeric', month: 'short' }).format(date)
}

export function formatWeekday(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(BCP47[locale], { weekday: 'long' }).format(date)
}

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(BCP47[locale]).format(value)
}

/** "1 h 45 min" / "1 u 45 min" - never a bare decimal number of hours. */
export function formatDuration(minutes: number, locale: Locale): string {
  const hourUnit = locale === 'nl' ? 'u' : 'h'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours} ${hourUnit}` : `${hours} ${hourUnit} ${rest} min`
}

export function formatMoney(cents: number, locale: Locale, currency = 'EUR'): string {
  return new Intl.NumberFormat(BCP47[locale], { style: 'currency', currency }).format(cents / 100)
}
