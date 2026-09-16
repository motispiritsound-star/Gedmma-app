import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import type { HistoryCard as Card } from '../content/history'
import { historyOf } from '../content/localise'
import { sfx } from '../engine/audio'
import { useLang, useT } from '../i18n'
import { Medaillon } from './Motief'
import { Khatim } from './Khatim'

/**
 * A card out of Morocco's history, handed over after a checkpoint.
 *
 * Unlike the little film after an ordinary lesson, this one does not run on a
 * timer. There is text on it, and text read at somebody else's pace is text
 * nobody finishes — so it waits for a tap. The music plays once underneath
 * and then leaves it alone.
 *
 * The colours are the flag's: red behind, green in the medallion. It is the
 * one screen in the app that says Morocco outright rather than by way of
 * mint tea and tilework.
 */

/** The card itself, without a screen around it. Also used by the collection. */
export function HistoryFace({ card, compact = false }: { card: Card; compact?: boolean }) {
  const lang = useLang()
  const t = useT()
  const c = historyOf(card, lang)
  return (
    <>
      <div className="flex items-center gap-4">
        <Medaillon motief={c.motief} size={compact ? 78 : 118} className="shrink-0 text-khatim-500 dark:text-khatim-400" />
        <div className="min-w-0">
          <p className="font-display text-sm font-extrabold uppercase tracking-wide text-alam-500 dark:text-alam-100">
            {c.jaar}
          </p>
          <h2 className={`font-display font-extrabold ${compact ? 'text-lg' : 'text-2xl'}`}>{c.titel}</h2>
        </div>
      </div>

      <p className={`mt-4 ${compact ? 'text-sm' : ''} text-[var(--ink-soft)]`}>{c.body}</p>

      <div className="mt-4 flex gap-3 rounded-2xl bg-saffron-500/12 px-4 py-3">
        <Khatim size={18} className="mt-0.5 shrink-0 text-saffron-500" />
        <p className="text-sm">
          <strong className="font-display">{t.history.wistJeDat}</strong> {c.wist}
        </p>
      </div>
    </>
  )
}

/**
 * The full-screen version, straight after a checkpoint.
 *
 * `onDone` is what the lesson does next, so the confetti and the badges wait
 * politely until the reading is over.
 */
export function HistoryFilm({ card, onDone }: { card: Card; onDone: () => void }) {
  const t = useT()
  const lang = useLang()
  const c = historyOf(card, lang)
  // The button sits inside a layer that is itself dismissible, so one tap can
  // arrive twice. A ref closes immediately; state would not.
  const left = useRef(false)

  useEffect(() => {
    sfx.film(2)
  }, [card.id])

  const close = () => {
    if (left.current) return
    left.current = true
    sfx.confirm()
    onDone()
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ background: 'linear-gradient(160deg, #7d1a20, #c1272d 55%, #8a2f22)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label={t.history.kaart}
      // Says which card is on screen, so the camera that plays a checkpoint
      // knows to stop rather than tapping "Verder" straight through it.
      data-card={card.id}
      onKeyDown={(e) => e.key === 'Escape' && close()}
    >
      {/* The tilework, faint, so the red is a wall rather than a colour */}
      <div className="zellige pointer-events-none absolute inset-0 opacity-25" aria-hidden="true" />

      <div className="relative mx-auto flex min-h-full max-w-lg flex-col justify-center px-4 py-10">
        <motion.p
          className="text-center font-display text-sm font-extrabold uppercase tracking-[0.2em] text-white/80"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {t.history.kaart}
        </motion.p>

        <motion.div
          className="mt-4 rounded-3xl bg-[var(--surface)] p-6 shadow-2xl"
          initial={{ opacity: 0, y: 26, rotate: -1.5 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 16 }}
        >
          <HistoryFace card={card} />
        </motion.div>

        <motion.button
          onClick={close}
          className="btn3d mx-auto mt-6 rounded-2xl bg-white px-8 py-3 font-display text-lg font-extrabold text-alam-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
        >
          {t.common.verder}
        </motion.button>

        <motion.p
          className="mt-3 text-center text-sm text-white/75"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          {t.history.bewaard}
        </motion.p>
        <span className="sr-only">{c.titel}</span>
      </div>
    </motion.div>
  )
}
