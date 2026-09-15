import { describe, expect, it } from 'vitest'
import { STRINGS, LANG_CODES, detectLang, isLang, localeOf } from './index'
import { nl } from './nl'
import { UNITS, LESSONS } from '../content/curriculum'
import { allWords } from '../content/lexicon'
import { STORIES } from '../content/stories'
import { meaningOf, noteOf, lessonTitle, packOf, storyOf, tipOf, unitSubtitle } from '../content/localise'
import { BADGES } from '../engine/store'

/**
 * The type system already guarantees that every interface key exists in every
 * language. These tests cover what it cannot: that nothing was left in Dutch
 * by accident, and that the content packs are complete.
 */

const OTHERS = LANG_CODES.filter((l) => l !== 'nl')

/** Walks a strings object and yields every leaf string, with its path. */
function* leaves(value: unknown, path = ''): Generator<[string, string]> {
  if (typeof value === 'string') yield [path, value]
  else if (Array.isArray(value)) for (const [i, v] of value.entries()) yield* leaves(v, `${path}[${i}]`)
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) yield* leaves(v, path ? `${path}.${k}` : k)
  }
}

describe('interface languages', () => {
  it('starts in the language of the device, and otherwise of the country', () => {
    // The device language decides whenever we speak it.
    expect(detectLang(['fr-FR'])).toBe('fr')
    expect(detectLang(['nl-BE'])).toBe('nl')
    expect(detectLang(['fr-BE'])).toBe('fr')
    expect(detectLang(['de-AT'])).toBe('de')
    expect(detectLang(['de-CH', 'fr-CH'])).toBe('de')
    expect(detectLang(['en-GB'])).toBe('en')

    // A phone in a language we do not speak falls back to its country.
    expect(detectLang(['ar-MA'])).toBe('fr')
    expect(detectLang(['ar', 'ar-NL'])).toBe('nl')
    expect(detectLang(['tr-DE'])).toBe('de')
    expect(detectLang(['es-ES'])).toBe('es')
    expect(detectLang(['ar-ES'])).toBe('es')
    expect(detectLang(['pt-PT'])).toBe('en')

    // A second preference still counts, before the country does.
    expect(detectLang(['ar-FR', 'nl-NL'])).toBe('nl')
    expect(detectLang([])).toBe('en')
  })

  it('knows the four languages', () => {
    expect(LANG_CODES).toEqual(['nl', 'fr', 'de', 'es', 'en'])
    expect(isLang('fr')).toBe(true)
    expect(isLang('ar')).toBe(false)
    expect(localeOf('de')).toBe('de-DE')
    expect(isLang(detectLang())).toBe(true)
  })

  it('has the same keys in every language', () => {
    const keys = [...leaves(nl)].map(([p]) => p).sort()
    for (const lang of OTHERS) {
      expect([...leaves(STRINGS[lang])].map(([p]) => p).sort(), lang).toEqual(keys)
    }
  })

  it('actually translated the prose, rather than copying the Dutch', () => {
    // A short label can legitimately match across languages; a long sentence
    // that is byte-identical to the Dutch is a forgotten translation.
    const dutch = new Map([...leaves(nl)])
    for (const lang of OTHERS) {
      for (const [path, value] of leaves(STRINGS[lang])) {
        if (value.length > 40 && dutch.get(path) === value) {
          expect.fail(`${lang}: ${path} is still Dutch`)
        }
      }
    }
  })

  it('names every badge in every language', () => {
    for (const lang of LANG_CODES) {
      for (const badge of BADGES) {
        expect(STRINGS[lang].badges[badge.id].naam, `${lang}/${badge.id}`).toBeTruthy()
      }
    }
  })
})

describe('content packs', () => {
  it('gives every word a meaning in every language', () => {
    for (const lang of LANG_CODES) {
      for (const w of allWords) {
        expect(meaningOf(w, lang), `${lang}/${w.id}`).toBeTruthy()
      }
    }
  })

  it('has a French, German and Spanish meaning for every single word', () => {
    // meaningOf() falls back to English when an entry is missing, and that
    // fallback would be invisible here — so look in the pack itself.
    for (const lang of ['fr', 'de', 'es'] as const) {
      const pack = packOf(lang)!
      for (const w of allWords) {
        expect(pack.meanings[w.id], `${lang}/${w.id}`).toBeTruthy()
      }
    }
  })

  it('translates every usage note', () => {
    for (const lang of LANG_CODES) {
      for (const w of allWords.filter((x) => x.note)) {
        expect(noteOf(w, lang), `${lang}/${w.id}`).toBeTruthy()
      }
    }
  })

  it('translates every unit, lesson and tip', () => {
    for (const lang of OTHERS) {
      const pack = packOf(lang)!
      for (const unit of UNITS) {
        expect(pack.units[unit.id], `${lang}/${unit.id}`).toBeTruthy()
        expect(unitSubtitle(unit, lang)).toBe(pack.units[unit.id])
      }
      for (const lesson of LESSONS) {
        const key = lesson.kind === 'toets' ? 'toets' : lesson.id
        expect(pack.lessons[key], `${lang}/${lesson.id}`).toBeTruthy()
        expect(lessonTitle(lesson, lang)).toBe(pack.lessons[key])
        if (lesson.tip) {
          expect(pack.tips[lesson.id], `${lang}/${lesson.id}`).toBeTruthy()
          expect(tipOf(lesson, lang)!.body).toBe(pack.tips[lesson.id]!.body)
        }
      }
    }
  })

  it('translates every story line and quiz option', () => {
    for (const lang of LANG_CODES) {
      for (const story of STORIES) {
        const local = storyOf(story, lang)
        expect(local.lines.length).toBe(story.lines.length)
        for (const line of local.lines) expect(line.text, `${lang}/${story.id}`).toBeTruthy()
        expect(local.quiz.length).toBe(story.quiz.length)
        for (const [i, q] of local.quiz.entries()) {
          expect(q.options.length, `${lang}/${story.id}/${i}`).toBe(story.quiz[i]!.options.length)
          expect(q.options[q.answer], `${lang}/${story.id}/${i}`).toBeTruthy()
          if (lang !== 'nl') {
            expect(packOf(lang)!.stories[story.id]?.quiz[i]?.q, `${lang}/${story.id}/${i}`).toBeTruthy()
          }
        }
      }
    }
  })
})
