import { useSyncExternalStore } from 'react'
import type { Card } from './srs'
import { newCard, review, type Grade } from './srs'
import { LESSONS, UNITS } from '../content/curriculum'
import { detectLang, isLang, type Lang } from '../i18n/languages'
import type { Strings } from '../i18n/nl'

/**
 * All progress lives in the browser. Nothing is uploaded, there is no account,
 * and a child can use the app without anyone collecting a thing.
 */

const KEY = 'darijakids.v1'
export const MAX_HEARTS = 5

/**
 * How much of the course is free. The alphabet plus the first five units —
 * hello, introducing yourself, family, numbers and colours — are enough to
 * read the script and hold a first conversation; everything past that is the
 * subscription.
 */
export const FREE_UNITS = 6

/** What one right answer is worth, paid out the moment it happens. */
export const XP_PER_CORRECT = 2

/** A gem every time a run reaches another multiple of this. */
export const COMBO_GEM_EVERY = 5
export const HEART_REFILL_MS = 20 * 60_000

export interface Settings {
  theme: 'system' | 'light' | 'dark'
  /** Interface and meanings; the Darija itself never changes. */
  lang: Lang
  showScript: boolean
  showTranslit: boolean
  sound: boolean
  /**
   * Play the effects as little files through the media channel instead of
   * synthesising them live. Slower to react, but an iPhone with the side
   * switch on silent mutes the live mixer and not this.
   */
  mediaSound: boolean
  /** The short animated scene after a finished lesson. */
  film: boolean
  speech: boolean
  hearts: boolean
  /** The voice the learner picked, by voiceURI. Empty means: pick the best. */
  voiceURI: string
  /** Read the Latin spelling with a European voice when there is no Arabic one. */
  fallbackVoice: boolean
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
  /**
   * The scheduler for everything that is not a word: letters as `l:ba`,
   * sentences as `z:groeten-1-a`. Kept apart from `cards` so that "words seen"
   * stays a count of words.
   */
  extraCards: Record<string, Card>
  /** How many sentences have been answered, ever. */
  sentencesDone: number
  quests: QuestProgress
  badges: string[]
  /** True once the full course has been bought, in either store. */
  unlocked: boolean
  unlockedAt: number | null
  langPicked: boolean
  seenTips: string[]
  settings: Settings
}

/**
 * The missions of the day.
 *
 * Counting is the whole trick: a child can see the number go up while they
 * answer, which is a different feeling from a number that only appears at the
 * end of a lesson. The counters reset at midnight; the gems, once claimed, do
 * not.
 */
export interface QuestProgress {
  day: string
  /** Right answers today. */
  goed: number
  /** Answers given in a review round today. */
  herhaald: number
  /** Sentences answered today. */
  zinnen: number
  /** Lessons finished today. */
  lessen: number
  claimed: QuestId[]
}

export type QuestId = 'lessen' | 'goed' | 'herhaald' | 'zinnen'

export interface Quest {
  id: QuestId
  emoji: string
  goal: number
  gems: number
}

/** Four missions, the same four every day: predictable beats surprising. */
export const QUESTS: Quest[] = [
  { id: 'lessen', emoji: '📗', goal: 1, gems: 3 },
  { id: 'goed', emoji: '✅', goal: 20, gems: 5 },
  { id: 'herhaald', emoji: '🔁', goal: 10, gems: 5 },
  { id: 'zinnen', emoji: '💬', goal: 4, gems: 4 },
]

const emptyQuests = (day: string): QuestProgress =>
  ({ day, goed: 0, herhaald: 0, zinnen: 0, lessen: 0, claimed: [] })

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
  extraCards: {},
  sentencesDone: 0,
  quests: emptyQuests(today()),
  badges: [],
  unlocked: false,
  unlockedAt: null,
  /** False until somebody has picked a language on the welcome screen. */
  langPicked: false,
  seenTips: [],
  settings: {
    theme: 'system',
    lang: detectLang(),
    showScript: true,
    showTranslit: true,
    sound: true,
    mediaSound: false,
    film: true,
    speech: true,
    hearts: true,
    voiceURI: '',
    fallbackVoice: true,
    motion: 'full',
    reading: 'normal',
    dailyGoal: 30,
    voiceRate: 0.85,
  },
})

/** Keys this app used under its earlier names, newest first. */
const OLD_KEYS = ['bladi.v1', 'gedmma.v1']

function load(): State {
  if (typeof localStorage === 'undefined') return initial()
  try {
    const raw = localStorage.getItem(KEY) ?? OLD_KEYS.map((k) => localStorage.getItem(k)).find(Boolean)
    if (!raw) return initial()
    const parsed = JSON.parse(raw) as Partial<State>
    const base = initial()
    const merged = { ...base, ...parsed, settings: { ...base.settings, ...(parsed.settings ?? {}) } }
    if (!isLang(merged.settings.lang)) merged.settings.lang = base.settings.lang
    return merged
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

/**
 * Selectors must return something stable: a primitive, or a slice of state
 * that keeps its identity between updates. Building a new array or object in
 * the selector makes every render look like a change, and React will loop.
 */
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

/* ------------------------------------------------------------- the missions */

/** Today's counters, rolled over if the app was last open yesterday. */
export function questsToday(s: State = state): QuestProgress {
  return s.quests.day === today() ? s.quests : emptyQuests(today())
}

type Counter = 'goed' | 'herhaald' | 'zinnen' | 'lessen'

export function bumpQuest(counter: Counter, by = 1): void {
  setState((s) => {
    const q = questsToday(s)
    return { quests: { ...q, [counter]: q[counter] + by } }
  })
}

export interface QuestState extends Quest {
  done: number
  claimed: boolean
  /** Reached, and the gems are still on the table. */
  claimable: boolean
}

export function questState(quest: Quest, s: State = state): QuestState {
  const q = questsToday(s)
  const done = Math.min(q[quest.id], quest.goal)
  const claimed = q.claimed.includes(quest.id)
  return { ...quest, done, claimed, claimable: !claimed && q[quest.id] >= quest.goal }
}

/** Hands over the gems of a finished mission. Returns how many, or 0. */
export function claimQuest(id: QuestId): number {
  const quest = QUESTS.find((q) => q.id === id)
  if (!quest || !questState(quest).claimable) return 0
  setState((s) => {
    const q = questsToday(s)
    return { gems: s.gems + quest.gems, quests: { ...q, claimed: [...q.claimed, id] } }
  })
  return quest.gems
}

export const questsLeft = (s: State = state): number =>
  QUESTS.filter((q) => !questState(q, s).claimed).length

export function addGems(n: number): void {
  if (n > 0) setState((s) => ({ gems: s.gems + n }))
}

/**
 * A right answer, paid immediately.
 *
 * Returns the gems this answer happened to earn, so the screen can show them
 * rising off the button rather than quietly adding them to a counter in the
 * corner.
 */
export function scoreCorrect(combo: number, review = false): { xp: number; gems: number } {
  addXp(XP_PER_CORRECT)
  bumpQuest('goed')
  if (review) bumpQuest('herhaald')
  const gems = combo > 0 && combo % COMBO_GEM_EVERY === 0 ? 1 : 0
  addGems(gems)
  return { xp: XP_PER_CORRECT, gems }
}

/** A sentence was answered — for the daily mission and the badge. */
export function countSentence(): void {
  bumpQuest('zinnen')
  setState((s) => ({ sentencesDone: s.sentencesDone + 1 }))
}

/* -------------------------------------------------------------- vocabulary */

export function gradeWord(wordId: string, grade: Grade): void {
  setState((s) => {
    const card = s.cards[wordId] ?? newCard(wordId)
    return { cards: { ...s.cards, [wordId]: review(card, grade) } }
  })
}

/** Letters and sentences share one scheduler, keyed by a prefixed id. */
export const letterKey = (id: string) => `l:${id}`
export const sentenceKey = (id: string) => `z:${id}`

export function gradeExtra(key: string, grade: Grade): void {
  setState((s) => {
    const card = s.extraCards[key] ?? newCard(key)
    return { extraCards: { ...s.extraCards, [key]: review(card, grade) } }
  })
}

export const extraStrength = (key: string, s: State = state): number => s.extraCards[key]?.strength ?? 0

/** The sentences the scheduler wants back, strongest-forgotten first. */
export function dueSentenceIds(s: State = state, now = Date.now()): string[] {
  return Object.values(s.extraCards)
    .filter((c) => c.id.startsWith('z:') && c.due <= now)
    .sort((a, b) => a.strength - b.strength || a.due - b.due)
    .map((c) => c.id.slice(2))
}

export const knownWordIds = (s: State = state): Set<string> => new Set(Object.keys(s.cards))

/**
 * Everything already met, whatever kind of thing it is: words by id, letters
 * and sentences with their prefix stripped back off. A round uses this to
 * decide which teaching cards to skip.
 */
export const knownIds = (s: State = state): Set<string> =>
  new Set([...Object.keys(s.cards), ...Object.keys(s.extraCards).map((k) => k.slice(2))])

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
  bumpQuest('lessen')
  awardBadges()
}

export const isDone = (lessonId: string, s: State = state): boolean => !!s.lessons[lessonId]

/** True when this unit is past the free part and has not been bought. */
export function unitBehindPaywall(unitId: string, s: State = state): boolean {
  const i = UNITS.findIndex((u) => u.id === unitId)
  return i >= FREE_UNITS && !s.unlocked
}

/**
 * A unit opens once the one before it is finished — and, past the free part,
 * once the course has been bought. The first unit is always open.
 */
export function unitUnlocked(unitId: string, s: State = state): boolean {
  if (unitBehindPaywall(unitId, s)) return false
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

/**
 * The lesson the “continue” button should open: the first unfinished one that
 * is actually open. When everything open is finished it points back at the
 * last one rather than at something locked — the path itself offers the way
 * past the paywall.
 */
export function nextLesson(s: State = state): string {
  let last = LESSONS[0]!.id
  for (const unit of UNITS) {
    if (!unitUnlocked(unit.id, s)) break
    for (const lesson of unit.lessons) {
      if (!isDone(lesson.id, s)) return lesson.id
      last = lesson.id
    }
  }
  return last
}

export function progressOfUnit(unitId: string, s: State = state): number {
  const unit = UNITS.find((u) => u.id === unitId)
  if (!unit) return 0
  return unit.lessons.filter((l) => isDone(l.id, s)).length / unit.lessons.length
}

/* ------------------------------------------------------------------ badges */

/** Badge names and hints are interface text; they live in the string files. */
export type BadgeId = keyof Strings['badges']

export interface Badge {
  id: BadgeId
  emoji: string
  earned: (s: State) => boolean
}

export const BADGES: Badge[] = [
  { id: 'eerste-stap', emoji: '👣', earned: (s) => Object.keys(s.lessons).length >= 1 },
  { id: 'salam', emoji: '👋', earned: (s) => UNITS[0]!.lessons.every((l) => isDone(l.id, s)) },
  { id: 'vlam-3', emoji: '🔥', earned: (s) => s.bestStreak >= 3 },
  { id: 'vlam-7', emoji: '🔥', earned: (s) => s.bestStreak >= 7 },
  { id: 'vlam-30', emoji: '🏆', earned: (s) => s.bestStreak >= 30 },
  { id: 'honderd', emoji: '📚', earned: (s) => Object.keys(s.cards).length >= 100 },
  { id: 'alle-woorden', emoji: '🎯', earned: (s) => Object.keys(s.cards).length >= 250 },
  { id: 'perfect', emoji: '💎', earned: (s) => Object.values(s.lessons).some((l) => l.bestScore >= 1) },
  { id: 'letters', emoji: '🔤', earned: (s) => isDone('letters', s) },
  { id: 'alfabet', emoji: '🅰️', earned: (s) => UNITS[0]!.lessons.every((l) => isDone(l.id, s)) },
  { id: 'zinnen-50', emoji: '💬', earned: (s) => s.sentencesDone >= 50 },
  { id: 'missies', emoji: '🎯', earned: (s) => questsToday(s).claimed.length >= QUESTS.length },
  { id: 'verhaal', emoji: '📖', earned: (s) => Object.keys(s.lessons).some((id) => id.startsWith('verhaal-')) },
  { id: 'niveau-5', emoji: '⭐', earned: (s) => levelOf(s.xp).level >= 5 },
  { id: 'niveau-10', emoji: '🌟', earned: (s) => levelOf(s.xp).level >= 10 },
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
  const { settings, unlocked, unlockedAt } = state
  // Starting over is about progress, not about the purchase.
  state = { ...initial(), settings, unlocked, unlockedAt }
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
