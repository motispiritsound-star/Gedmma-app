import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HISTORY } from '../content/history'
import { historyOf } from '../content/localise'
import { useStore } from '../engine/store'
import { sfx } from '../engine/audio'
import { useLang, useT } from '../i18n'
import { Button, Card, Progress, SectionTitle } from '../ui/kit'
import { HistoryFace } from '../ui/HistoryCard'
import { Medaillon } from '../ui/Motief'

/**
 * The collection: fourteen cards, in the order they happened.
 *
 * A card earned once and then gone would be a reward that evaporates, so this
 * is where they are kept. The locked ones are not hidden — a child can see
 * there are eleven more centuries waiting, which is the point.
 */
export function History() {
  const t = useT()
  const lang = useLang()
  const earned = useStore((s) => s.history)
  const [open, setOpen] = useState<string | null>(null)

  const have = HISTORY.filter((c) => earned.includes(c.id)).length

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <SectionTitle sub={t.history.paginaBody}>{t.history.paginaTitel}</SectionTitle>

      <Card className="mb-6 p-5">
        <p className="font-display font-extrabold">{t.history.verzameld(have, HISTORY.length)}</p>
        <Progress value={have / HISTORY.length} className="mt-2 h-3" />
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          {have === HISTORY.length ? t.history.compleet : t.history.hoeKrijgJe}
        </p>
      </Card>

      <ul className="space-y-3">
        {HISTORY.map((card) => {
          const mine = earned.includes(card.id)
          const c = historyOf(card, lang)
          const isOpen = open === card.id
          return (
            <li key={card.id}>
              <Card className="overflow-hidden">
                <button
                  className="flex w-full items-center gap-3 p-3 text-start disabled:opacity-60"
                  disabled={!mine}
                  aria-expanded={mine ? isOpen : undefined}
                  onClick={() => { if (isOpen) sfx.back(); else sfx.tap(); setOpen(isOpen ? null : card.id) }}
                >
                  <Medaillon
                    motief={card.motief}
                    size={54}
                    className={mine ? 'shrink-0 text-khatim-500 dark:text-khatim-400' : 'shrink-0 text-[var(--ink-soft)]'}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-xs font-extrabold uppercase tracking-wide text-alam-500 dark:text-alam-100">
                      {card.jaar}
                    </span>
                    <span className="block font-display font-extrabold">
                      {mine ? c.titel : t.history.nogNiet}
                    </span>
                  </span>
                  <span className="shrink-0 text-lg" aria-hidden="true">{mine ? '' : '🔒'}</span>
                </button>
                {mine && isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="border-t border-[var(--line)] p-4"
                  >
                    <HistoryFace card={card} compact />
                  </motion.div>
                )}
              </Card>
            </li>
          )
        })}
      </ul>

      <div className="mt-8 text-center">
        <Link to="/leren"><Button>{t.profile.verderLeren}</Button></Link>
      </div>
    </div>
  )
}
