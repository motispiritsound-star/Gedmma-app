import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { Topic } from '../content/types'
import { allWords, searchWords, TOPIC_LABELS } from '../content/lexicon'
import { strengthLabel } from '../engine/srs'
import { useStore } from '../engine/store'
import { Card, Pill, SectionTitle } from '../ui/kit'
import { SpeakButton, WordText } from '../ui/WordChip'

const TOPICS = Object.keys(TOPIC_LABELS) as Topic[]

/** The dictionary: every word the app knows, searchable in four ways. */
export function Words() {
  const cards = useStore((s) => s.cards)
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState<Topic | 'alles'>('alles')
  const [open, setOpen] = useState<string | null>(null)

  const results = useMemo(() => {
    const base = query ? searchWords(query) : allWords
    return topic === 'alles' ? base : base.filter((w) => w.topic === topic)
  }, [query, topic])

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <SectionTitle sub={`${allWords.length} woorden en zinnen, met uitspraak. Zoek in het Nederlands, in het Darija of in het Arabisch schrift.`}>
        Woordenboek
      </SectionTitle>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Zoek… bijv. brood, khobz of خبز"
        aria-label="Zoek een woord"
        className="w-full rounded-2xl border-2 border-[var(--line)] bg-[var(--surface-raised)] px-4 py-3 text-lg outline-none focus:border-zellige-500"
      />

      <ul className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
        <li>
          <button
            onClick={() => setTopic('alles')}
            className={`whitespace-nowrap rounded-full border-2 px-3 py-1.5 text-sm font-bold ${topic === 'alles' ? 'border-zellige-500 bg-zellige-500/10' : 'border-[var(--line)]'}`}
          >
            Alles
          </button>
        </li>
        {TOPICS.map((t) => (
          <li key={t}>
            <button
              onClick={() => setTopic(t)}
              className={`whitespace-nowrap rounded-full border-2 px-3 py-1.5 text-sm font-bold ${topic === t ? 'border-zellige-500 bg-zellige-500/10' : 'border-[var(--line)]'}`}
            >
              {TOPIC_LABELS[t].emoji} {TOPIC_LABELS[t].nl}
            </button>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-sm text-[var(--ink-soft)]">{results.length} resultaten</p>

      <ul className="mt-2 space-y-2">
        {results.map((w) => {
          const card = cards[w.id]
          const isOpen = open === w.id
          return (
            <li key={w.id}>
              <Card className="overflow-hidden">
                <button className="flex w-full items-center gap-3 p-3 text-start" onClick={() => setOpen(isOpen ? null : w.id)} aria-expanded={isOpen}>
                  <span className="text-2xl" aria-hidden="true">{w.emoji ?? '•'}</span>
                  <span className="min-w-0 flex-1">
                    <span className="ar text-xl font-bold">{w.ar}</span>
                    <span className="block text-sm">
                      <span className="font-display font-bold text-zellige-600 dark:text-zellige-300">{w.tr}</span>
                      <span className="text-[var(--ink-soft)]"> — {w.nl}</span>
                    </span>
                  </span>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-bold ${card ? 'bg-mint-500/15 text-mint-600' : 'bg-[var(--surface-sunken)] text-[var(--ink-soft)]'}`}>
                    {strengthLabel(card?.strength ?? 0)}
                  </span>
                </button>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="border-t border-[var(--line)] p-4">
                    <div className="flex items-center gap-4">
                      <WordText word={w} size="md" />
                      <SpeakButton ar={w.ar} tr={w.tr} />
                      <div className="ms-auto text-end text-sm text-[var(--ink-soft)]">
                        <div>{w.en}</div>
                        <Pill className="mt-1">{TOPIC_LABELS[w.topic].emoji} {TOPIC_LABELS[w.topic].nl}</Pill>
                      </div>
                    </div>
                    {w.note && <p className="mt-3 rounded-2xl bg-saffron-500/10 px-4 py-2 text-sm">💡 {w.note}</p>}
                  </motion.div>
                )}
              </Card>
            </li>
          )
        })}
      </ul>

      {results.length === 0 && (
        <Card className="mt-6 p-6 text-center text-[var(--ink-soft)]">
          Niets gevonden. Probeer een ander woord — of zoek op het Nederlands.
        </Card>
      )}
    </div>
  )
}
