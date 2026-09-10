import { WORDS } from './words'
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

export const TOPIC_LABELS: Record<Topic, { nl: string; emoji: string }> = {
  groeten: { nl: 'Groeten', emoji: '👋' },
  'ik-en-jij': { nl: 'Ik en jij', emoji: '🙋' },
  familie: { nl: 'Familie', emoji: '👨‍👩‍👧‍👦' },
  cijfers: { nl: 'Cijfers', emoji: '🔢' },
  kleuren: { nl: 'Kleuren', emoji: '🎨' },
  eten: { nl: 'Eten', emoji: '🍽️' },
  huis: { nl: 'Huis', emoji: '🏠' },
  school: { nl: 'School', emoji: '🏫' },
  dieren: { nl: 'Dieren', emoji: '🐾' },
  tijd: { nl: 'Tijd & weer', emoji: '🕰️' },
  lichaam: { nl: 'Lichaam', emoji: '💛' },
  werkwoorden: { nl: 'Werkwoorden', emoji: '⚡' },
  vragen: { nl: 'Vragen', emoji: '❓' },
  winkelen: { nl: 'Winkelen', emoji: '🛍️' },
  weg: { nl: 'Onderweg', emoji: '🗺️' },
  cultuur: { nl: 'Cultuur', emoji: '🇲🇦' },
}

/** Loose search over every field a learner might type. */
export function searchWords(query: string): Word[] {
  const q = query.trim().toLowerCase()
  if (!q) return WORDS
  const bare = q.replace(/[36792]/g, '').replace(/\s+/g, ' ')
  return WORDS.filter((w) => {
    const hay = `${w.tr} ${w.nl} ${w.en} ${w.ar} ${w.note ?? ''}`.toLowerCase()
    return hay.includes(q) || (bare.length > 1 && hay.replace(/[36792]/g, '').includes(bare))
  })
}
