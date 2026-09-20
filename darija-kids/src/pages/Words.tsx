import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Topic } from '../content/types'
import { allWords, searchWords, TOPIC_EMOJI, TOPICS } from '../content/lexicon'
import { meaningOf, noteOf } from '../content/localise'
import { useLang, useT } from '../i18n'
import { strengthLabel } from '../engine/srs'
import { sfx } from '../engine/audio'
import { useStore, woordOpSlot } from '../engine/store'
import { Button, Card, Pill, SectionTitle } from '../ui/kit'
import { SpeakButton, WordText } from '../ui/WordChip'
import { WordFeedback } from '../ui/Feedback'

/** The dictionary: every word the app knows, searchable in four ways. */
export function Words() {
  const t = useT()
  const lang = useLang()
  const navigate = useNavigate()
  const state = useStore((s) => s)
  const cards = state.cards
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState<Topic | 'alles'>('alles')
  const [open, setOpen] = useState<string | null>(null)

  const results = useMemo(() => {
    const base = query ? searchWords(query, lang) : allWords
    return topic === 'alles' ? base : base.filter((w) => w.topic === topic)
  }, [query, topic, lang])

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <SectionTitle sub={t.words.uitleg(allWords.length)}>{t.words.titel}</SectionTitle>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t.words.zoek}
        aria-label={t.words.zoekLabel}
        className="w-full rounded-2xl border-2 border-[var(--line)] bg-[var(--surface-raised)] px-4 py-3 text-lg outline-none focus:border-zellige-500"
      />

      <ul className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
        <li>
          <button
            onClick={() => { sfx.nav(); setTopic('alles') }}
            className={`whitespace-nowrap rounded-full border-2 px-3 py-1.5 text-sm font-bold ${topic === 'alles' ? 'border-zellige-500 bg-zellige-500/10' : 'border-[var(--line)]'}`}
          >
            {t.words.alles}
          </button>
        </li>
        {TOPICS.map((topicKey) => (
          <li key={topicKey}>
            <button
              onClick={() => { sfx.nav(); setTopic(topicKey) }}
              className={`whitespace-nowrap rounded-full border-2 px-3 py-1.5 text-sm font-bold ${topic === topicKey ? 'border-zellige-500 bg-zellige-500/10' : 'border-[var(--line)]'}`}
            >
              {TOPIC_EMOJI[topicKey]} {t.topics[topicKey]}
            </button>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-sm text-[var(--ink-soft)]">{t.words.resultaten(results.length)}</p>

      {!state.unlocked && (
        <Card className="mt-3 flex flex-wrap items-center gap-3 p-4">
          <span className="text-xl" aria-hidden="true">🔒</span>
          <p className="min-w-0 flex-1 text-sm">{t.words.slotUitleg}</p>
          <Link to="/volledig"><Button variant="secondary">{t.unlock.slotKnop}</Button></Link>
        </Card>
      )}

      <ul className="mt-2 space-y-2">
        {results.map((w) => {
          const card = cards[w.id]
          const isOpen = open === w.id
          // Het woordenboek toont alles, ook wat nog niet van jou is: zien wat
          // er komt is de beste reden om verder te willen. Horen en openklappen
          // kan alleen bij wat in een gratis les zat.
          const opSlot = woordOpSlot(w.id, state)
          return (
            <li key={w.id}>
              <Card className={`overflow-hidden ${opSlot ? 'opacity-70' : ''}`}>
                <button
                  className="flex w-full items-center gap-3 p-3 text-start"
                  onClick={() => {
                    if (opSlot) { sfx.back(); navigate('/volledig'); return }
                    if (isOpen) sfx.back(); else sfx.tap()
                    setOpen(isOpen ? null : w.id)
                  }}
                  aria-expanded={opSlot ? undefined : isOpen}
                >
                  <span className="text-2xl" aria-hidden="true">{w.emoji ?? '•'}</span>
                  <span className="min-w-0 flex-1">
                    <span className="ar text-xl font-bold">{w.ar}</span>
                    <span className="block text-sm">
                      <span className="font-display font-bold text-zellige-600 dark:text-zellige-300">{w.tr}</span>
                      <span className="text-[var(--ink-soft)]"> — {meaningOf(w, lang)}</span>
                    </span>
                  </span>
                  {opSlot ? (
                    <span className="shrink-0 text-lg" aria-label={t.unlock.slotTitel}>🔒</span>
                  ) : (
                    <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-bold ${card ? 'bg-mint-500/15 text-mint-600' : 'bg-[var(--surface-sunken)] text-[var(--ink-soft)]'}`}>
                      {t.strength[strengthLabel(card?.strength ?? 0)]}
                    </span>
                  )}
                </button>
                {isOpen && !opSlot && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="border-t border-[var(--line)] p-4">
                    <div className="flex items-center gap-4">
                      <WordText word={w} size="md" />
                      <SpeakButton ar={w.ar} tr={w.tr} />
                      <div className="ms-auto text-end text-sm text-[var(--ink-soft)]">
                        <div>{lang === 'en' ? w.nl : w.en}</div>
                        <Pill className="mt-1">{TOPIC_EMOJI[w.topic]} {t.topics[w.topic]}</Pill>
                      </div>
                    </div>
                    {noteOf(w, lang) && <p className="mt-3 rounded-2xl bg-saffron-500/10 px-4 py-2 text-sm">💡 {noteOf(w, lang)}</p>}
                    {/* The feedback that actually improves a language app:
                        somebody whose family says this word differently. */}
                    <WordFeedback word={`${w.tr} (${w.ar})`} />
                  </motion.div>
                )}
              </Card>
            </li>
          )
        })}
      </ul>

      {results.length === 0 && (
        <Card className="mt-6 p-6 text-center text-[var(--ink-soft)]">
          {t.words.nietsGevonden}
        </Card>
      )}
    </div>
  )
}
