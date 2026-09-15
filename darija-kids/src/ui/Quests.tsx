import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { claimQuest, QUESTS, questState, useStore, type QuestId } from '../engine/store'
import { sfx } from '../engine/audio'
import { Button, Card, Progress } from './kit'
import { useT } from '../i18n'

/**
 * The missions of the day, on the learning path where they are seen.
 *
 * Three things a child can do today, each with a number that moves while they
 * play and a handful of gems waiting at the end of it. One of them is always
 * about repetition, because that is the part of learning a language that never
 * feels urgent and always is.
 */
export function Quests() {
  const t = useT()
  // Subscribing to the whole state keeps the bars moving as answers come in.
  const state = useStore((s) => s)
  const [won, setWon] = useState<{ id: number; gems: number } | null>(null)
  const [counter, setCounter] = useState(0)

  const rows = QUESTS.map((q) => questState(q, state))
  const done = rows.filter((r) => r.claimed).length

  const collect = (id: QuestId) => {
    const gems = claimQuest(id)
    if (!gems) return
    sfx.badge()
    setCounter((c) => c + 1)
    setWon({ id: counter + 1, gems })
  }

  return (
    <Card className="relative mb-6 overflow-hidden p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-2xl" aria-hidden="true">🎯</span>
        <h2 className="font-display text-lg font-extrabold">{t.quests.titel}</h2>
        <span className="ms-auto rounded-full bg-[var(--surface-sunken)] px-2.5 py-1 text-xs font-bold text-[var(--ink-soft)]">
          {done}/{QUESTS.length}
        </span>
      </div>
      <p className="mt-1 text-sm text-[var(--ink-soft)]">
        {done === QUESTS.length ? t.quests.klaar : t.quests.uitleg}
      </p>

      <ul className="mt-4 space-y-3">
        {rows.map((row) => (
          <li key={row.id} className="flex items-center gap-3">
            <span className="text-xl" aria-hidden="true">{row.emoji}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className={`font-display text-sm font-bold ${row.claimed ? 'text-[var(--ink-soft)] line-through' : ''}`}>
                  {t.quests.taak[row.id](row.goal)}
                </span>
                <span className="shrink-0 text-xs font-bold text-[var(--ink-soft)]">{row.done}/{row.goal}</span>
              </div>
              <Progress
                value={row.done / row.goal}
                tone={row.claimed ? 'mint' : row.claimable ? 'saffron' : 'zellige'}
                className="mt-1.5 h-2"
              />
            </div>
            {row.claimed ? (
              <span className="shrink-0 text-sm font-bold text-mint-600 dark:text-mint-300">{t.quests.binnen}</span>
            ) : row.claimable ? (
              <Button className="shrink-0 px-3 py-1.5 text-sm" onClick={() => collect(row.id)}>
                💎 {row.gems}
              </Button>
            ) : (
              <span className="shrink-0 text-sm font-bold text-[var(--ink-soft)]" aria-label={t.quests.beloning(row.gems)}>
                💎 {row.gems}
              </span>
            )}
          </li>
        ))}
      </ul>

      <AnimatePresence>
        {won && (
          <motion.div
            key={won.id}
            initial={{ opacity: 0, y: 8, scale: 0.8 }}
            animate={{ opacity: [0, 1, 1, 0], y: -40, scale: 1 }}
            transition={{ duration: 1.4, times: [0, 0.15, 0.6, 1] }}
            onAnimationComplete={() => setWon(null)}
            className="pointer-events-none absolute inset-x-0 top-10 flex justify-center"
            role="status"
          >
            <span className="rounded-full bg-saffron-500 px-4 py-1.5 font-display font-extrabold text-night-950 shadow-lg">
              💎 +{won.gems}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
