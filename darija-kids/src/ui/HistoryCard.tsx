import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HISTORY, type HistoryCard as Card } from '../content/history'
import { historyOf } from '../content/localise'
import { narrate, readingTime, sfx } from '../engine/audio'
import { localeOf, useLang, useT } from '../i18n'
import { HistoryScene } from './HistoryScene'
import { Medaillon } from './Motief'
import { Khatim } from './Khatim'

/**
 * A short film out of Morocco's history, handed over after a checkpoint.
 *
 * It is a fragment rather than a page: a moving backdrop, the card's drawing
 * making itself line by line, and a narrator reading it aloud in the language
 * the app is set to. Three beats, none longer than it needs to be —
 *
 *   1. where and when: the year, the drawing, the title
 *   2. the story, told while it stands there
 *   3. "did you know", which is the part that gets repeated at dinner
 *
 * A beat ends when the narrator finishes it, so the pace is the pace of the
 * telling. On a device with no voice for the language nothing is read aloud
 * and the beats fall back to roughly the speed somebody reads them — the text
 * is on screen either way, and the film never waits for a voice that is not
 * coming.
 */

type Beat = 'opening' | 'verhaal' | 'wist' | 'klaar'

/** The card's own face, without a screen around it. Used by the collection. */
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
 * Tells one run of text and calls back when it is over.
 *
 * Belt and braces on purpose: the narrator's own `onend` is the real signal,
 * and a timer set to about reading speed is the one that fires when a speech
 * engine goes quiet without saying so — which they do, on a tab that lost
 * focus, and on a device with no voice at all.
 */
function useTelling(text: string, locale: string, on: boolean, onDone: () => void) {
  const done = useRef(onDone)
  done.current = onDone

  useEffect(() => {
    if (!on) return
    let over = false
    const finish = () => {
      if (over) return
      over = true
      done.current()
    }
    const stop = narrate(text, locale, { onDone: finish })
    const timer = setTimeout(finish, readingTime(text) + 1400)
    return () => {
      over = true
      clearTimeout(timer)
      stop()
    }
  }, [text, locale, on])
}

/** The fragment itself: what plays when a checkpoint has just been passed. */
export function HistoryFilm({ card, onDone }: { card: Card; onDone: () => void }) {
  const t = useT()
  const lang = useLang()
  const locale = localeOf(lang)
  const c = historyOf(card, lang)
  const [beat, setBeat] = useState<Beat>('opening')
  // One tap is one tap: the buttons sit inside a layer that also listens.
  const left = useRef(false)

  useEffect(() => {
    sfx.film(2)
    // Long enough for the drawing to finish making itself, and no longer.
    const opening = setTimeout(() => setBeat('verhaal'), 2400)
    return () => clearTimeout(opening)
  }, [card.id])

  useTelling(c.body, locale, beat === 'verhaal', () => setBeat('wist'))
  useTelling(`${t.history.wistJeDat} ${c.wist}`, locale, beat === 'wist', () => setBeat('klaar'))

  const close = () => {
    if (left.current) return
    left.current = true
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel()
    sfx.confirm()
    onDone()
  }

  /** A tap moves the telling along rather than ending it. */
  const forward = () => {
    if (beat === 'opening') setBeat('verhaal')
    else if (beat === 'verhaal') setBeat('wist')
    else setBeat('klaar')
  }

  const showWist = beat === 'wist' || beat === 'klaar'

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto"
      style={{ background: 'linear-gradient(160deg, #7d1a20, #c1272d 55%, #8a2f22)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label={t.history.kaart}
      // Says which card is on screen and how far it has got, so the camera
      // that plays a checkpoint can watch it instead of tapping through it.
      data-card={card.id}
      data-beat={beat}
      onKeyDown={(e) => e.key === 'Escape' && close()}
    >
      <div className="zellige pointer-events-none absolute inset-0 opacity-20" aria-hidden="true" />

      <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-4 px-4 py-6">
        <p className="text-center font-display text-xs font-extrabold uppercase tracking-[0.2em] text-white/75">
          {t.history.kaart}
        </p>

        {/* ------------------------------------------------------ the film */}
        <div className="w-full overflow-hidden rounded-3xl shadow-2xl" style={{ aspectRatio: '400 / 260' }}>
          <HistoryScene tafereel={card.tafereel} motief={card.motief} beat={beat === 'opening' ? 0 : 1} />
        </div>

        {/* --------------------------------------------------- the telling */}
        <motion.div
          key={showWist ? 'wist' : 'verhaal'}
          className="rounded-3xl bg-[var(--surface)] p-5 shadow-xl"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <p className="font-display text-xs font-extrabold uppercase tracking-wide text-alam-500 dark:text-alam-100">
            {c.jaar}
          </p>
          <h2 className="font-display text-xl font-extrabold">{c.titel}</h2>
          {showWist ? (
            <div className="mt-3 flex gap-3 rounded-2xl bg-saffron-500/12 px-4 py-3">
              <Khatim size={18} className="mt-0.5 shrink-0 text-saffron-500" />
              <p className="text-sm">
                <strong className="font-display">{t.history.wistJeDat}</strong> {c.wist}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-[var(--ink-soft)]">{c.body}</p>
          )}
        </motion.div>

        {/* --------------------------------------------------- the buttons */}
        <div className="flex items-center justify-center gap-3">
          {beat === 'klaar' ? (
            <button
              onClick={close}
              className="btn3d rounded-2xl bg-white px-8 py-3 font-display text-lg font-extrabold text-alam-600"
            >
              {t.common.verder}
            </button>
          ) : (
            <>
              <button
                onClick={forward}
                className="btn3d rounded-2xl bg-white/90 px-6 py-2.5 font-display font-extrabold text-alam-600"
              >
                {t.history.doorvertellen}
              </button>
              <button
                onClick={close}
                className="rounded-2xl px-4 py-2.5 font-display font-bold text-white/80 underline"
              >
                {t.film.overslaan}
              </button>
            </>
          )}
        </div>

        <p className="text-center text-xs text-white/70">{t.history.bewaard}</p>
      </div>
    </motion.div>
  )
}

/**
 * The play button under a card in the collection.
 *
 * A card that was read to you once and can never be read to you again is a
 * card you only half own — and for a child who reads slowly it is the whole
 * difference between a collection and a wall of text.
 */
export function HistoryTeller({ card }: { card: Card }) {
  const t = useT()
  const lang = useLang()
  const c = historyOf(card, lang)
  const [telling, setTelling] = useState(false)
  const stop = useRef<() => void>(() => {})

  useEffect(() => () => stop.current(), [])

  const toggle = () => {
    if (telling) {
      stop.current()
      setTelling(false)
      return
    }
    sfx.tap()
    setTelling(true)
    stop.current = narrate(
      `${c.titel}. ${c.body} ${t.history.wistJeDat} ${c.wist}`,
      localeOf(lang),
      { onDone: () => setTelling(false) },
    )
  }

  return (
    <button
      onClick={toggle}
      className="btn3d mt-4 inline-flex items-center gap-2 rounded-2xl border-2 border-[var(--line)] bg-[var(--surface)] px-4 py-2 font-display text-sm font-extrabold"
    >
      <span aria-hidden="true">{telling ? '◼' : '▶'}</span>
      {telling ? t.history.stopVertellen : t.history.vertelHet}
    </button>
  )
}

/**
 * One fragment on its own, at /kaart/walili … while developing.
 *
 * Fourteen backdrops and fourteen drawings are a long way to walk to when the
 * only way to reach one is to pass a checkpoint. This route exists only in a
 * dev build, exactly like /film/:scene does.
 */
export function HistoryPreview() {
  const { cardId = '' } = useParams()
  const navigate = useNavigate()
  const [round, setRound] = useState(0)
  const index = Math.max(0, HISTORY.findIndex((c) => c.id === cardId))
  return (
    <HistoryFilm
      key={`${cardId}-${round}`}
      card={HISTORY[index]!}
      onDone={() => (index < HISTORY.length - 1
        ? navigate(`/kaart/${HISTORY[index + 1]!.id}`)
        : setRound((r) => r + 1))}
    />
  )
}
