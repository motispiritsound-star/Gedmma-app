import { existsSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { UNITS } from '../content/curriculum'
import { LANG_CODES } from '../i18n/languages'
import { EBOOK, ebookFile, PRODUCTS } from './billing'
import {
  FREE_UNITS, getState, isDone, nextLesson, resetProgress, setState,
  unitBehindPaywall, unitUnlocked, type State,
} from './store'

/** A finished course, as a state object, without touching the real store. */
const finished = (upToUnit: number, unlocked = false): State => {
  const lessons: State['lessons'] = {}
  for (const unit of UNITS.slice(0, upToUnit)) {
    for (const lesson of unit.lessons) {
      lessons[lesson.id] = { stars: 3, runs: 1, bestScore: 1, lastDone: 1 }
    }
  }
  return { ...getState(), lessons, unlocked }
}

describe('what is free and what is paid', () => {
  it('leaves the first units open to everybody', () => {
    for (const unit of UNITS.slice(0, FREE_UNITS)) {
      expect(unitBehindPaywall(unit.id, finished(0)), unit.id).toBe(false)
    }
  })

  it('puts every later unit behind the purchase', () => {
    for (const unit of UNITS.slice(FREE_UNITS)) {
      expect(unitBehindPaywall(unit.id, finished(0)), unit.id).toBe(true)
    }
    expect(UNITS.length).toBeGreaterThan(FREE_UNITS)
  })

  it('does not open a paid unit just because the free ones are finished', () => {
    const state = finished(FREE_UNITS)
    expect(unitUnlocked(UNITS[FREE_UNITS - 1]!.id, state)).toBe(true)
    expect(unitUnlocked(UNITS[FREE_UNITS]!.id, state)).toBe(false)
  })

  it('opens it once the course is bought', () => {
    const state = finished(FREE_UNITS, true)
    expect(unitUnlocked(UNITS[FREE_UNITS]!.id, state)).toBe(true)
  })

  it('still needs the previous unit finished after buying', () => {
    const state = finished(0, true)
    expect(unitUnlocked(UNITS[1]!.id, state)).toBe(false)
  })

  it('stops "continue" at the paywall instead of pointing at a locked lesson', () => {
    const state = finished(FREE_UNITS)
    const next = nextLesson(state)
    expect(isDone(next, state)).toBe(true)
    expect(unitUnlocked(UNITS[FREE_UNITS]!.id, state)).toBe(false)
  })

  it('keeps a purchase when progress is wiped', () => {
    setState({ unlocked: true, unlockedAt: 1, xp: 500 })
    resetProgress()
    expect(getState().unlocked).toBe(true)
    expect(getState().xp).toBe(0)
    setState({ unlocked: false, unlockedAt: null })
  })
})

describe('the e-book', () => {
  it('is sold under its own product id, not one of the subscriptions', () => {
    expect(PRODUCTS).not.toContain(EBOOK.product)
    expect(new Set([...PRODUCTS, EBOOK.product]).size).toBe(PRODUCTS.length + 1)
  })

  it('has a file for every language the app speaks', () => {
    for (const lang of LANG_CODES) {
      const file = path.join(process.cwd(), 'public', ebookFile(lang))
      expect(existsSync(file), file).toBe(true)
      // A PDF that never got past the cover would still exist; a real one
      // is hundreds of kilobytes.
      expect(statSync(file).size, file).toBeGreaterThan(100_000)
    }
  })

  // It was paid for once. A subscription that lapses does not take it back,
  // and neither does starting the course over.
  it('stays after progress is wiped', () => {
    setState({ ebook: true, xp: 500 })
    resetProgress()
    expect(getState().ebook).toBe(true)
    setState({ ebook: false })
  })
})
