/**
 * Zeven lessen heten naar de letters die ze leren.
 *
 * "ا ب ت ث", "ج ح خ د ذ", en zo nog vijf. Die titel komt op het leerpad te
 * staan, op het scorescherm, in de kaart "Ga verder" en in de knop naar de
 * volgende les — en overal in het schreefloze lettertype van de koppen, dat
 * geen Arabische vormen heeft. De browser pakt er dan zelf iets bij, met een
 * regelafstand die niet klopt, en sneed de letters aan de boven- en
 * onderkant af. Nagekeken in de browser: op alle vier de plekken.
 *
 * De `.ar`-klasse zet het juiste lettertype, de leesrichting en een
 * regelafstand van 1.9. Hij hoort er alleen bij als er werkelijk Arabisch in
 * staat, want hij draait ook de richting om — een Nederlandse lestitel met
 * `dir: rtl` eindigt met de punt aan de verkeerde kant.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { heeftArabisch, lessonTitle } from './localise'
import { LESSONS } from './curriculum'

describe('herkennen waar Arabisch in staat', () => {
  it('ziet Arabisch schrift', () => {
    expect(heeftArabisch('ا ب ت ث')).toBe(true)
    expect(heeftArabisch('السلام')).toBe(true)
  })

  it('laat Latijnse titels met rust', () => {
    expect(heeftArabisch('Hallo en dag')).toBe(false)
    expect(heeftArabisch('Toets')).toBe(false)
    expect(heeftArabisch('')).toBe(false)
  })
})

describe('de lessen met een Arabische titel', () => {
  const arabisch = LESSONS.filter((l) => heeftArabisch(lessonTitle(l, 'nl')))

  it('bestaan, anders toetst dit niets', () => {
    expect(arabisch.length).toBe(7)
  })

  /** En ze zitten allemaal in de alfabet-unit; elders hoort het niet. */
  it('horen bij het alfabet', () => {
    for (const les of arabisch) expect(les.id.startsWith('hruf-')).toBe(true)
  })
})

describe('de vier plekken waar zo n titel terechtkomt', () => {
  const lees = (pad: string) => readFileSync(new URL(pad, import.meta.url), 'utf8').replace(/\r\n/g, '\n')

  it('het leerpad zet de klasse erbij', () => {
    const bron = lees('../pages/Learn.tsx')
    expect(bron).toMatch(/heeftArabisch\(title\) \? 'ar' : ''/)
    expect(bron).toMatch(/heeftArabisch\(lessonTitle\(volgendeLes, lang\)\) \? 'ar' : ''/)
  })

  it('het scorescherm ook, op allebei de plekken', () => {
    const bron = lees('../pages/LessonPlayer.tsx')
    expect(bron.match(/heeftArabisch\(lessonTitle\(/g)).toHaveLength(2)
  })
})
