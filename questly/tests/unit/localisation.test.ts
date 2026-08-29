import { describe, expect, it } from 'vitest'
import { fill, getDictionary, isLocale, LOCALES } from '@/modules/localisation'
import { en } from '@/modules/localisation/dictionaries/en'
import { nl } from '@/modules/localisation/dictionaries/nl'
import { formatDuration, formatMoney } from '@/modules/localisation/format'

/** Guards against a half-translated release reaching a family. */

function leafPaths(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix]
  if (Array.isArray(value)) return [prefix]
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    leafPaths(child, prefix ? `${prefix}.${key}` : key),
  )
}

function valueAt(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (typeof current !== 'object' || current === null) return undefined
    return (current as Record<string, unknown>)[key]
  }, source)
}

describe('dictionaries', () => {
  it('supports exactly the launch locales', () => {
    expect(LOCALES).toEqual(['nl', 'en'])
    expect(isLocale('nl')).toBe(true)
    expect(isLocale('de')).toBe(false)
  })

  it('has the same keys in Dutch and English', () => {
    expect(leafPaths(nl).sort()).toEqual(leafPaths(en).sort())
  })

  it('has no empty strings and no untranslated leftovers', () => {
    for (const path of leafPaths(en)) {
      const english = valueAt(en, path)
      const dutch = valueAt(nl, path)
      if (Array.isArray(english)) {
        expect(Array.isArray(dutch), path).toBe(true)
        expect((dutch as string[]).length, path).toBe(english.length)
        continue
      }
      expect(String(english).trim().length, path).toBeGreaterThan(0)
      expect(String(dutch).trim().length, path).toBeGreaterThan(0)
    }
  })

  it('actually differs between the two languages for key copy', () => {
    expect(nl.nav.library).not.toBe(en.nav.library)
    expect(nl.landing.heroTitle).not.toBe(en.landing.heroTitle)
    expect(getDictionary('nl').common.signIn).toBe('Inloggen')
    expect(getDictionary('en').common.signIn).toBe('Sign in')
  })

  it('keeps the same placeholders in both languages', () => {
    const placeholders = (value: string) => (value.match(/\{\w+\}/g) ?? []).sort()
    for (const path of leafPaths(en)) {
      const english = valueAt(en, path)
      const dutch = valueAt(nl, path)
      if (typeof english !== 'string' || typeof dutch !== 'string') continue
      expect(placeholders(dutch), path).toEqual(placeholders(english))
    }
  })
})

describe('fill', () => {
  it('substitutes named placeholders', () => {
    expect(fill('Hello {name}', { name: 'Sam' })).toBe('Hello Sam')
  })

  it('leaves unknown placeholders untouched', () => {
    expect(fill('Hello {name}', {})).toBe('Hello {name}')
  })
})

describe('formatting', () => {
  it('formats durations per locale', () => {
    expect(formatDuration(45, 'nl')).toBe('45 min')
    expect(formatDuration(90, 'nl')).toBe('1 u 30 min')
    expect(formatDuration(90, 'en')).toBe('1 h 30 min')
    expect(formatDuration(120, 'en')).toBe('2 h')
  })

  it('formats money in euros', () => {
    expect(formatMoney(799, 'nl')).toContain('7,99')
    expect(formatMoney(799, 'en')).toContain('7.99')
  })
})
