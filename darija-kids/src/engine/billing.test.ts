import { existsSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { UNITS } from '../content/curriculum'
import { LANG_CODES } from '../i18n/languages'
import { EBOOK, ebookFile, PRODUCTS } from './billing'
import {
  FREE_LESSONS, getState, GRATIS_LESSEN, isDone, lessonBehindPaywall, lessonUnlocked,
  nextLesson, resetProgress, setState, unitBehindPaywall, unitUnlocked, type State,
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

/** De lessen die gratis horen te zijn, in de volgorde van het pad. */
const gratisLessen = UNITS.flatMap((u) => u.lessons.slice(0, GRATIS_LESSEN[u.id] ?? 0).map((l) => l.id))

describe('what is free and what is paid', () => {
  it('counts the free lessons the way the app quotes them', () => {
    expect(gratisLessen).toHaveLength(FREE_LESSONS)
    expect(FREE_LESSONS).toBeGreaterThan(0)
  })

  it('leaves exactly those lessons open to everybody', () => {
    const leeg = finished(0)
    for (const id of gratisLessen) {
      expect(lessonBehindPaywall(id, leeg), id).toBe(false)
    }
    const alle = UNITS.flatMap((u) => u.lessons.map((l) => l.id))
    for (const id of alle.filter((id) => !gratisLessen.includes(id))) {
      expect(lessonBehindPaywall(id, leeg), id).toBe(true)
    }
    expect(alle.length).toBeGreaterThan(gratisLessen.length)
  })

  it('opens the free lesson of the next unit without finishing the paid half of this one', () => {
    // Drie stukken alfabet gedaan; de rest van het alfabet zit achter het slot.
    const lessons: State['lessons'] = {}
    for (const id of UNITS[0]!.lessons.slice(0, GRATIS_LESSEN[UNITS[0]!.id]!).map((l) => l.id)) {
      lessons[id] = { stars: 3, runs: 1, bestScore: 1, lastDone: 1 }
    }
    const state: State = { ...getState(), lessons, unlocked: false }
    expect(lessonUnlocked(UNITS[0]!.lessons[3]!.id, state)).toBe(false)
    expect(lessonUnlocked(UNITS[1]!.lessons[0]!.id, state)).toBe(true)
    expect(lessonUnlocked(UNITS[1]!.lessons[1]!.id, state)).toBe(false)
  })

  it('puts a unit without any free lesson behind the purchase', () => {
    const leeg = finished(0)
    const betaald = UNITS.filter((u) => !(GRATIS_LESSEN[u.id] ?? 0))
    expect(betaald.length).toBeGreaterThan(0)
    for (const unit of betaald) {
      expect(unitBehindPaywall(unit.id, leeg), unit.id).toBe(true)
    }
  })

  it('opens everything once the course is bought', () => {
    const gekocht = finished(UNITS.length, true)
    for (const unit of UNITS) {
      expect(unitBehindPaywall(unit.id, gekocht), unit.id).toBe(false)
    }
  })

  it('still needs the previous unit finished after buying', () => {
    const state = finished(0, true)
    expect(unitUnlocked(UNITS[1]!.id, state)).toBe(false)
  })

  it('never points "continue" at a locked lesson', () => {
    for (const state of [finished(0), finished(1), finished(2)]) {
      const next = nextLesson(state)
      expect(lessonUnlocked(next, state) || isDone(next, state), next).toBe(true)
      expect(lessonBehindPaywall(next, state), next).toBe(false)
    }
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
