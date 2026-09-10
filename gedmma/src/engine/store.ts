import { useSyncExternalStore } from 'react'
import type { Card } from './srs'
import { newCard, review, type Grade } from './srs'
import { LESSONS, UNITS } from '../content/curriculum'

/**
 * All progress lives in the browser. Nothing is uploaded, there is no account,
 * and a child can use the app without anyone collecting a thing.
 */

const KEY = 'gedmma.v1'
export const MAX_HEARTS = 5
export const HEART_REFILL_MS = 20 * 60_000

export interface Settings {
  theme: 'system' | 'light' | 'dark'
  lang: 'nl' | 'en'
  showScript: boolean
  showTranslit: boolean
  sound: boolean
  speech: boolean
  hearts: boolean
  motion: 'full' | 'calm'
  reading: 'normal' | 'dyslexia'
  dailyGoal: number
  voiceRate: number
}

export interface LessonRecord {
  stars: number
  runs: number
  bestScore: number
  lastDone: number
}

export interface State {
  version: 1
  name: string
  avatar: string
  createdAt: number
  xp: number
  gems: number
  hearts: number
  heartsAt: number
  streak: number
  bestStreak: number
  lastDay: string | null
  freezes: number
  daily: Record<string, number>
  lessons: Record<string, LessonRecord>
  cards: Record<string, Card>
  badges: string[]
  seenTips: string[]
  settings: Settings
}

export const today = (d = new Date()): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const dayBefore = (iso: string): string => {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y!, m! - 1, d!)
  dt.setDate(dt.getDate() - 1)
  return today(dt)
}

const initial = (): State => ({
  version: 1,
  name: '',
  avatar: '🦉',
  createdAt: Date.now(),
  xp: 0,
  gems: 0,
  hearts: MAX_HEARTS,
  heartsAt: Date.now(),
  streak: 0,
  bestStreak: 0,
  lastDay: null,
  freezes: 0,
  daily: {},
  lessons: {},
  cards: {},
  badges: [],
  seenTips: [],
  settings: {
    theme: 'system',
    lang: 'nl',
    showScript: true,
    showTranslit: true,
    sound: true,
    speech: true,
    hearts: true,
    motion: 'full',
    reading: 'normal',
    dailyGoal: 30,
    voiceRate: 0.85,
  },
})

function load(): State {
  if (typeof localStorage === 'undefined') return initial()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return initial()
    const parsed = JSON.parse(raw) as Partial<State>
    const base = initial()
    return { ...base, ...parsed, settings: { ...base.settings, ...(parsed.settings ?? {}) } }
  } catch {
    return initial()
  }
}

let state: State = load()
const listeners = new Set<() => void>()

const emit = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* private mode, a full disk — the session still works, it just forgets */
  }
  listeners.forEach((l) => l())
}

export function setState(next: Partial<State> | ((s: State) => Partial<State>)): void {
  const patch = typeof next === 'function' ? next(state) : next
  state = { ...state, ...patch }
  emit()
}

export const getState = (): State => state

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => void listeners.delete(l)
}

export function useStore<T>(select: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => select(state),
    () => select(state),
  )
}

/* ------------------------------------------------------------------ hearts */

/** Hearts regrow with time; work it out on read rather than on a timer. */
export function heartsNow(s: State = state, now = Date.now()): number {
  if (!s.settings.hearts) return MAX_HEARTS
  if (s.hearts >= MAX_HEARTS) return MAX_HEARTS
  const grown = Math.floor((now - s.heartsAt) / HEART_REFILL_MS)
  return Math.min(MAX_HEARTS, s.hearts + grown)
}

export function msUntilNextHeart(s: State = state, now = Date.now()): number {
  if (heartsNow(s, now) >= MAX_HEARTS) return 0
  const elapsed = (now - s.heartsAt) % HEART_REFILL_MS
  return HEART_REFILL_MS - elapsed
}

export function loseHeart(): void {
  if (!state.settings.hearts) return
  const have = heartsNow()
  setState({ hearts: Math.max(0, have - 1), heartsAt: Date.now() })
}

export function refillHearts(cost = 0): void {
  setState((s) => ({ hearts: MAX_HEARTS, heartsAt: Date.now(), gems: Math.max(0, s.gems - cost) }))
}

/* -------------------------------------------------------------- streak, xp */

export function addXp(amount: number): void {
  const day = today()
  setState((s) => {
    const daily = { ...s.daily, [day]: (s.daily[day] ?? 0) + amount }
    let { streak, bestStreak, freezes } = s
    if (s.lastDay !== day) {
      const continued = s.lastDay === dayBefore(day)
      if (continued) streak += 1
      else if (s.lastDay && freezes > 0 && s.lastDay === dayBefore(dayBefore(day))) {
        freezes -= 1
        streak += 1
      } else streak = 1
      bestStreak = Math.max(bestStreak, streak)
    }
    return { xp: s.xp + amount, daily, streak, bestStreak, freezes, lastDay: day }
  })
}

export const xpToday = (s: State = state): number => s.daily[today()] ?? 0

export const goalMet = (s: State = state): boolean => xpToday(s) >= s.settings.dailyGoal

/** Level curve: each level costs a little more than the one before. */
export function levelOf(xp: number): { level: number; into: number; span: number } {
  let level = 1
  let span = 60
  let into = xp
  while (into >= span) {
    into -= span
    level += 1
    span = Math.round(span * 1.25)
  }
  return { level, into, span }
}

/* -------------------------------------------------------------- vocabulary */

export function gradeWord(wordId: string, grade: Grade): void {
  setState((s) => {
    const card = s.cards[wordId] ?? newCard(wordId)
    return { cards: { ...s.cards, [wordId]: review(card, grade) } }
  })
}

export const knownWordIds = (s: State = state): Set<string> => new Set(Object.keys(s.cards))

export function dueWordIds(s: State = state, now = Date.now()): string[] {
  return Object.values(s.cards)
    .filter((c) => c.due <= now)
    .sort((a, b) => a.strength - b.strength || a.due - b.due)
    .map((c) => c.id)
}

/* ------------------------------------------------------------------ lessons */

export function completeLesson(lessonId: string, score: number, xp: number): void {
  const stars = score >= 0.95 ? 3 : score >= 0.8 ? 2 : 1
  setState((s) => {
    const prev = s.lessons[lessonId]
    return {
      lessons: {
        ...s.lessons,
        [lessonId]: {
          stars: Math.max(stars, prev?.stars ?? 0),
          runs: (prev?.runs ?? 0) + 1,
          bestScore: Math.max(score, prev?.bestScore ?? 0),
          lastDone: Date.now(),
        },
      },
      gems: s.gems + (prev ? 1 : 5),
    }
  })
  addXp(xp)
  awardBadges()
}

export const isDone = (lessonId: string, s: State = state): boolean => !!s.lessons[lessonId]

/** A unit opens once the one before it is finished. The first is always open. */
export function unitUnlocked(unitId: string, s: State = state): boolean {
  const i = UNITS.findIndex((u) => u.id === unitId)
  if (i <= 0) return true
  return UNITS[i - 1]!.lessons.every((l) => isDone(l.id, s))
}

export function lessonUnlocked(lessonId: string, s: State = state): boolean {
  const unit = UNITS.find((u) => u.lessons.some((l) => l.id === lessonId))
  if (!unit || !unitUnlocked(unit.id, s)) return false
  const i = unit.lessons.findIndex((l) => l.id === lessonId)
  return i === 0 || isDone(unit.lessons[i - 1]!.id, s)
}

/** The lesson the “Ga verder” button should open. */
export function nextLesson(s: State = state): string {
  for (const unit of UNITS) {
    if (!unitUnlocked(unit.id, s)) break
    for (const lesson of unit.lessons) if (!isDone(lesson.id, s)) return lesson.id
  }
  return LESSONS.at(-1)!.id
}

export function progressOfUnit(unitId: string, s: State = state): number {
  const unit = UNITS.find((u) => u.id === unitId)
  if (!unit) return 0
  return unit.lessons.filter((l) => isDone(l.id, s)).length / unit.lessons.length
}

/* ------------------------------------------------------------------ badges */

export interface Badge {
  id: string
  name: string
  emoji: string
  hint: string
  earned: (s: State) => boolean
}

export const BADGES: Badge[] = [
  { id: 'eerste-stap', name: 'Eerste stap', emoji: '👣', hint: 'Rond je eerste les af', earned: (s) => Object.keys(s.lessons).length >= 1 },
  { id: 'salam', name: 'Salam!', emoji: '👋', hint: 'Maak de unit Salam! helemaal af', earned: (s) => UNITS[0]!.lessons.every((l) => isDone(l.id, s)) },
  { id: 'vlam-3', name: 'Drie op een rij', emoji: '🔥', hint: 'Leer drie dagen achter elkaar', earned: (s) => s.bestStreak >= 3 },
  { id: 'vlam-7', name: 'Week vol vuur', emoji: '🔥', hint: 'Leer zeven dagen achter elkaar', earned: (s) => s.bestStreak >= 7 },
  { id: 'vlam-30', name: 'Maandheld', emoji: '🏆', hint: 'Dertig dagen op rij', earned: (s) => s.bestStreak >= 30 },
  { id: 'honderd', name: 'Honderd woorden', emoji: '📚', hint: 'Leer 100 woorden', earned: (s) => Object.keys(s.cards).length >= 100 },
  { id: 'alle-woorden', name: 'Woordenjager', emoji: '🎯', hint: 'Kom 250 woorden tegen', earned: (s) => Object.keys(s.cards).length >= 250 },
  { id: 'perfect', name: 'Foutloos', emoji: '💎', hint: 'Rond een les zonder fout af', earned: (s) => Object.values(s.lessons).some((l) => l.bestScore >= 1) },
  { id: 'letters', name: 'Leest Arabisch', emoji: '🔤', hint: 'Doe de letteroefening', earned: (s) => isDone('letters', s) },
  { id: 'verhaal', name: 'Verhalenverteller', emoji: '📖', hint: 'Lees een verhaal uit', earned: (s) => Object.keys(s.lessons).some((id) => id.startsWith('verhaal-')) },
  { id: 'niveau-5', name: 'Niveau 5', emoji: '⭐', hint: 'Bereik niveau 5', earned: (s) => levelOf(s.xp).level >= 5 },
  { id: 'niveau-10', name: 'Niveau 10', emoji: '🌟', hint: 'Bereik niveau 10', earned: (s) => levelOf(s.xp).level >= 10 },
]

/** Returns the badges won by this action, so the UI can celebrate them. */
export function awardBadges(): Badge[] {
  const won = BADGES.filter((b) => !state.badges.includes(b.id) && b.earned(state))
  if (won.length) setState((s) => ({ badges: [...s.badges, ...won.map((b) => b.id)] }))
  return won
}

/* ---------------------------------------------------------------- settings */

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
  setState((s) => ({ settings: { ...s.settings, [key]: value } }))
}

export function markTipSeen(id: string): void {
  if (!state.seenTips.includes(id)) setState((s) => ({ seenTips: [...s.seenTips, id] }))
}

export function resetProgress(): void {
  const keep = state.settings
  state = { ...initial(), settings: keep }
  emit()
}

export function exportProgress(): string {
  return JSON.stringify(state, null, 2)
}

export function importProgress(json: string): boolean {
  try {
    const parsed = JSON.parse(json) as State
    if (parsed.version !== 1) return false
    state = { ...initial(), ...parsed }
    emit()
    return true
  } catch {
    return false
  }
}
