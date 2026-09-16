import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Exercise, Verdict } from '../engine/exercises'
import { isLetterExercise, isScribeExercise, isSentenceExercise } from '../engine/exercises'
import type { Grade } from '../engine/srs'
import { word } from '../content/lexicon'
import { letter } from '../content/alphabet'
import { sentence } from '../content/sentences'
import { sentenceMeaning } from '../content/localise'
import {
  bumpQuest, countSentence, gradeExtra, gradeWord, heartsNow, letterKey, loseHeart,
  scoreCorrect, sentenceKey, useStore,
} from '../engine/store'
import { sfx } from '../engine/audio'
import { Button, Progress, Sheet } from './kit'
import { Mascot } from './Mascot'
import { ExerciseView } from './exercises'
import { SpeakButton, useMeaning, useNote } from './WordChip'
import { useLang, useT } from '../i18n'

/**
 * The thing that runs a list of exercises: progress bar, hearts, the feedback
 * bar, and putting a wrong answer back at the end of the queue. Lessons,
 * checkpoints and review sessions are all the same runner with other input.
 *
 * Rewards are paid on the spot. XP and gems land the moment an answer is
 * right, float up off the card so they are impossible to miss, and the run
 * counter in the corner climbs with them — a child should be able to see what
 * an answer was worth without waiting for the end of the lesson.
 */

const GRADE_OF: Record<Verdict, Grade> = { goed: 'goed', bijna: 'moeizaam', fout: 'fout' }

export interface RoundResult {
  score: number
  asked: number
  perfect: boolean
  seconds: number
  /** XP already paid out during the round, answer by answer. */
  xp: number
  /** Gems earned from runs of right answers. */
  gems: number
  /** The longest run of right answers in a row. */
  bestCombo: number
}

/** What the feedback bar shows, whatever kind of thing was being asked. */
interface Subject {
  ar: string
  tr: string
  meaning: string
  note?: string
}

/** One floating reward, on its way up off the card. */
interface Burst {
  id: number
  xp: number
  gems: number
}

export function RoundRunner({
  exercises, onFinish, onQuit, useHearts = true, quitLabel, review = false, quiz = false,
}: {
  exercises: Exercise[]
  onFinish: (result: RoundResult) => void
  onQuit: () => void
  useHearts?: boolean
  /** Defaults to the “stop this lesson?” wording. */
  quitLabel?: string
  /** A review round: right answers also count towards the repetition mission. */
  review?: boolean
  /** A checkpoint: drums at the start, and a pulse under every question. */
  quiz?: boolean
}) {
  const t = useT()
  const lang = useLang()
  const state = useStore((s) => s)
  const meaning = useMeaning()
  const note = useNote()
  const heartsOn = useHearts && state.settings.hearts
  const [queue, setQueue] = useState<Exercise[]>(exercises)
  const [index, setIndex] = useState(0)
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [detail, setDetail] = useState('')
  const [quit, setQuit] = useState(false)
  // How many right in a row: the sound climbs with it, the counter shows it,
  // and a mistake resets both.
  const [combo, setCombo] = useState(0)
  const [burst, setBurst] = useState<Burst | null>(null)
  const finishRef = useRef(() => {})
  // Every burst needs its own key, or answering the same card twice would
  // reuse the element and the animation would not replay.
  const burstId = useRef(0)
  // One step per card. A teaching card has no feedback bar to sit behind, so
  // two quick taps used to move two places at once — and a round that stepped
  // past its own end simply stopped, with nothing left to press.
  const stepping = useRef(false)
  const tally = useRef({ right: 0, asked: 0, perfect: true, start: Date.now(), xp: 0, gems: 0, best: 0 })

  // The checkpoint announces itself, and then keeps time. The pulse speeds up
  // towards the end, which is the whole difference between a list of questions
  // and something that feels like it is running out.
  useEffect(() => {
    if (quiz) sfx.quizStart()
  }, [quiz])

  useEffect(() => {
    if (quiz && index > 0) sfx.quizTick(index, queue.length)
  }, [quiz, index, queue.length])

  useEffect(() => {
    stepping.current = false
  }, [index])

  const current = queue[index]
  const hearts = heartsNow(state)

  // A round that has run out of cards is a finished round, whatever put it
  // there. Better to hand over the score than to sit on a loading line.
  useEffect(() => {
    if (!current && queue.length > 0) finishRef.current()
  }, [current, queue.length])

  if (heartsOn && hearts <= 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-14 text-center">
        <Mascot mood="oeps" size={120} className="mx-auto" />
        <h1 className="mt-4 font-display text-2xl font-extrabold">{t.lesson.hartjesOp}</h1>
        <p className="mt-2 text-[var(--ink-soft)]">{t.lesson.hartjesOpUitleg}</p>
        <Button className="mt-6 w-full" onClick={onQuit}>{t.common.terug}</Button>
      </div>
    )
  }

  if (!current) {
    return <div className="mx-auto max-w-md px-4 py-20 text-center text-[var(--ink-soft)]">{t.common.laden}</div>
  }

  const subject: Subject = isLetterExercise(current)
    ? (() => {
        const l = letter(current.letterId!)
        return { ar: l.ar, tr: l.name, meaning: t.alphabet.klinktAls(l.sound) }
      })()
    : isSentenceExercise(current)
      ? (() => {
          const z = sentence(current.sentenceId!)
          return { ar: z.ar, tr: z.tr, meaning: sentenceMeaning(z, lang) }
        })()
      : (() => {
          const w = word(current.wordId)
          return { ar: w.ar, tr: w.tr, meaning: meaning(w), note: note(w) }
        })()

  const finish = () => {
    const { right, asked, perfect, start, xp, gems, best } = tally.current
    onFinish({
      score: asked === 0 ? 1 : Math.max(0, Math.min(1, right / asked)),
      asked,
      perfect,
      seconds: (Date.now() - start) / 1000,
      xp,
      gems,
      bestCombo: best,
    })
  }

  /** Records the answer against whatever kind of thing was being asked. */
  finishRef.current = finish

  /** Moves to the next card, or hands over the score. Once per card. */
  const step = () => {
    if (stepping.current) return
    stepping.current = true
    if (index + 1 >= queue.length) finish()
    else setIndex((i) => i + 1)
  }

  /** Records the answer against whatever kind of thing was being asked. */
  const record = (exercise: Exercise, grade: Grade) => {
    if (isLetterExercise(exercise)) gradeExtra(letterKey(exercise.letterId!), grade)
    else if (isSentenceExercise(exercise)) gradeExtra(sentenceKey(exercise.sentenceId!), grade)
    else if (exercise.kind === 'koppel') for (const id of exercise.pairIds ?? []) gradeWord(id, grade)
    else gradeWord(exercise.wordId, grade)
  }

  const answer = (v: Verdict, d?: string) => {
    if (verdict) return
    const exercise = current

    // Teaching cards are not questions: they cost nothing and are worth nothing.
    if (exercise.kind === 'nieuw' || exercise.kind === 'letter-nieuw' || exercise.kind === 'zin-nieuw') {
      if (stepping.current) return
      record(exercise, 'goed')
      step()
      return
    }

    setVerdict(v)
    setDetail(d ?? '')
    tally.current.asked += 1
    if (isSentenceExercise(exercise)) countSentence()
    if (review) bumpQuest('herhaald')

    if (v === 'fout') {
      tally.current.perfect = false
      setCombo(0)
      sfx.wrong()
      if (heartsOn) loseHeart()
    } else {
      const run = combo + 1
      setCombo(run)
      tally.current.best = Math.max(tally.current.best, run)
      if (v === 'goed') tally.current.right += 1
      else {
        tally.current.right += 0.5
        tally.current.perfect = false
      }
      const paid = scoreCorrect(run, review)
      tally.current.xp += paid.xp
      tally.current.gems += paid.gems
      setBurst({ id: ++burstId.current, xp: paid.xp, gems: paid.gems })
      sfx.correct(v === 'goed' ? run - 1 : Math.min(run - 1, 2))
      if (run % 5 === 0) sfx.streak()
    }

    record(exercise, GRADE_OF[v])
    if (v === 'fout') setQueue((q) => [...q, { ...exercise, id: `${exercise.id}-again` }])
  }

  const next = () => {
    // The feedback bar slides out rather than vanishing, and a button that is
    // still on its way off the screen is still a button. Without the verdict
    // check a second tap lands after the card has already changed, and skips
    // the next question without ever asking it.
    if (stepping.current || !verdict) return
    setVerdict(null)
    setDetail('')
    setBurst(null)
    step()
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-4">
      <div className="flex items-center gap-3">
        <button onClick={() => { sfx.back(); setQuit(true) }} aria-label={t.common.sluiten} className="text-2xl text-[var(--ink-soft)] hover:text-[var(--ink)]">✕</button>
        <Progress value={index / Math.max(1, queue.length)} tone="mint" />
        <AnimatePresence>
          {combo >= 2 && (
            <motion.span
              key={combo}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              className="shrink-0 rounded-full bg-saffron-500/20 px-2.5 py-1 font-display text-sm font-extrabold text-saffron-600 dark:text-saffron-300"
              aria-label={t.lesson.opRij(combo)}
            >
              🔥 {combo}
            </motion.span>
          )}
        </AnimatePresence>
        {heartsOn && <span className="shrink-0 font-bold" aria-label={t.lesson.hartjesOver(hearts)}>❤️ {hearts}</span>}
      </div>

      <div className="relative flex flex-1 flex-col justify-center py-6">
        {/* The reward, on its way up. Announced politely, so a screen reader
            hears what an answer was worth without losing its place. */}
        <AnimatePresence>
          {burst && (
            <motion.div
              key={burst.id}
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: [0, 1, 1, 0], y: -64, scale: 1 }}
              transition={{ duration: 1.3, times: [0, 0.15, 0.6, 1] }}
              className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center gap-2"
              role="status"
            >
              <span className="rounded-full bg-mint-500 px-3 py-1 font-display text-sm font-extrabold text-night-950 shadow-lg">
                {t.lesson.xpPlus(burst.xp)}
              </span>
              {burst.gems > 0 && (
                <span className="rounded-full bg-saffron-500 px-3 py-1 font-display text-sm font-extrabold text-night-950 shadow-lg">
                  💎 {t.lesson.gemPlus(burst.gems)}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.18 }}
          >
            <ExerciseView exercise={current} onAnswer={answer} locked={verdict !== null} />
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {verdict && (
          <motion.div
            initial={{ y: 90 }}
            animate={{ y: 0 }}
            exit={{ y: 90 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            role="status"
            // Says how it went, for anyone reading the page rather than
            // looking at it — the camera that films the app included.
            data-verdict={verdict}
            // On its way out it is still on the screen, and a second tap on a
            // button that is leaving used to land on the card behind it and
            // skip a question. Nothing leaving is pressable.
            style={{ pointerEvents: verdict ? 'auto' : 'none' }}
            className={`sticky bottom-0 -mx-4 border-t-2 px-4 py-4 ${
              verdict === 'goed' ? 'border-mint-500 bg-mint-500/15'
              : verdict === 'bijna' ? 'border-saffron-500 bg-saffron-500/15'
              : 'border-terra-500 bg-terra-500/15'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl" aria-hidden="true">{verdict === 'goed' ? '🎉' : verdict === 'bijna' ? '👌' : '💡'}</span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-display text-lg font-extrabold">
                  {verdict === 'goed' ? t.lesson.lof[index % t.lesson.lof.length] : verdict === 'bijna' ? t.lesson.bijnaGoed : t.lesson.juisteAntwoord}
                  {verdict !== 'fout' && burst && (
                    <span className="rounded-full bg-mint-500/25 px-2 py-0.5 text-xs font-extrabold text-mint-700 dark:text-mint-200">
                      {t.lesson.xpPlus(burst.xp)}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm">
                  <span className="ar text-xl font-bold">{subject.ar}</span>
                  <span className="font-display font-bold text-zellige-600 dark:text-zellige-300">{subject.tr}</span>
                  <span className="text-[var(--ink-soft)]">— {subject.meaning}</span>
                </p>
                {/* A traced letter has no answer to quote back — the detail is
                    already a sentence about how the line went. */}
                {detail && verdict !== 'goed' && (
                  <p className="mt-0.5 text-xs text-[var(--ink-soft)]">
                    {isScribeExercise(current) ? detail : t.lesson.jijHad(detail)}
                  </p>
                )}
                {subject.note && verdict !== 'goed' && <p className="mt-1 text-xs text-[var(--ink-soft)]">💡 {subject.note}</p>}
              </div>
              <SpeakButton ar={subject.ar} tr={subject.tr} className="mt-1" />
            </div>
            <Button variant={verdict === 'fout' ? 'danger' : 'success'} className="mt-3 w-full" autoFocus onClick={next}>
              {index + 1 >= queue.length ? t.lesson.afronden : t.common.verder}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <Sheet open={quit} onClose={() => setQuit(false)} labelledBy="quit-title">
        <h2 id="quit-title" className="font-display text-xl font-extrabold">{quitLabel ?? t.lesson.stoppenLes}</h2>
        <p className="mt-2 text-[var(--ink-soft)]">{t.lesson.stoppenUitleg}</p>
        <div className="mt-5 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setQuit(false)}>{t.common.doorgaan}</Button>
          <Button variant="danger" className="flex-1" onClick={onQuit}>{t.common.stoppen}</Button>
        </div>
      </Sheet>
    </div>
  )
}
