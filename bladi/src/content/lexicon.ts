import { WORDS } from './words'
import { meaningOf } from './localise'
import type { Lang } from '../i18n/languages'
import type { Topic, Word } from './types'

const index = new Map(WORDS.map((w) => [w.id, w]))

export const allWords = WORDS

/** Throws on an unknown id: a lesson that points at nothing is a content bug. */
export function word(id: string): Word {
  const found = index.get(id)
  if (!found) throw new Error(`Onbekend woord-id: ${id}`)
  return found
}

export const maybeWord = (id: string) => index.get(id)

export const wordsOfTopic = (t: Topic) => WORDS.filter((w) => w.topic === t)

export const TOPIC_EMOJI: Record<Topic, string> = {
  groeten: '👋',
  'ik-en-jij': '🙋',
  familie: '👨‍👩‍👧‍👦',
  cijfers: '🔢',
  kleuren: '🎨',
  eten: '🍽️',
  huis: '🏠',
  school: '🏫',
  dieren: '🐾',
  tijd: '🕰️',
  lichaam: '💛',
  werkwoorden: '⚡',
  vragen: '❓',
  winkelen: '🛍️',
  weg: '🗺️',
  cultuur: '🇲🇦',
}

export const TOPICS = Object.keys(TOPIC_EMOJI) as Topic[]

/** Loose search over every field a learner might type, in their own language. */
export function searchWords(query: string, lang: Lang = 'nl'): Word[] {
  const q = query.trim().toLowerCase()
  if (!q) return WORDS
  const bare = q.replace(/[36792]/g, '').replace(/\s+/g, ' ')
  return WORDS.filter((w) => {
    const hay = `${w.tr} ${meaningOf(w, lang)} ${w.nl} ${w.en} ${w.ar}`.toLowerCase()
    return hay.includes(q) || (bare.length > 1 && hay.replace(/[36792]/g, '').includes(bare))
  })
}
