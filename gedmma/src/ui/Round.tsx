import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Exercise, Verdict } from '../engine/exercises'
import type { Grade } from '../engine/srs'
import { word } from '../content/lexicon'
import { gradeWord, heartsNow, loseHeart, useStore } from '../engine/store'
import { sfx } from '../engine/audio'
import { Button, Progress, Sheet } from './kit'
import { Mascot } from './Mascot'
import { ExerciseView } from './exercises'
import { SpeakButton, useMeaning } from './WordChip'

/**
 * The thing that runs a list of exercises: progress bar, hearts, the feedback
 * bar, and putting a wrong answer back at the end of the queue. Lessons,
 * checkpoints and review sessions are all the same runner with other input.
 */

const GRADE_OF: Record<Verdict, Grade> = { goed: 'goed', bijna: 'moeizaam', fout: 'fout' }
const PRAISE = ['Mzyan!', 'Bravo!', 'Wallah mzyan!', 'Top!', 'Sahit!', 'Perfect!']

export interface RoundResult {
  score: number
  asked: number
  perfect: boolean
  seconds: number
}

export function RoundRunner({
  exercises, onFinish, onQuit, useHearts = true, quitLabel = 'Stoppen met deze les?',
}: {
  exercises: Exercise[]
  onFinish: (result: RoundResult) => void
  onQuit: () => void
  useHearts?: boolean
  quitLabel?: string
}) {
  const state = useStore((s) => s)
  const meaning = useMeaning()
  const heartsOn = useHearts && state.settings.hearts
  const [queue, setQueue] = useState<Exercise[]>(exercises)
  const [index, setIndex] = useState(0)
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [detail, setDetail] = useState('')
  const [quit, setQuit] = useState(false)
  const tally = useRef({ right: 0, asked: 0, perfect: true, start: Date.now() })

  const current = queue[index]
  const hearts = heartsNow(state)

  if (heartsOn && hearts <= 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-14 text-center">
        <Mascot mood="oeps" size={120} className="mx-auto" />
        <h1 className="mt-4 font-display text-2xl font-extrabold">Je hartjes zijn op</h1>
        <p className="mt-2 text-[var(--ink-soft)]">
          Ze groeien vanzelf weer aan. Herhalen kan altijd, en in de instellingen kun je hartjes helemaal uitzetten —
          fouten maken hoort bij leren.
        </p>
        <Button className="mt-6 w-full" onClick={onQuit}>Terug</Button>
      </div>
    )
  }

  if (!current) {
    return <div className="mx-auto max-w-md px-4 py-20 text-center text-[var(--ink-soft)]">Bezig met laden…</div>
  }

  const target = word(current.wordId)

  const finish = () => {
    const { right, asked, perfect, start } = tally.current
    onFinish({
      score: asked === 0 ? 1 : Math.max(0, Math.min(1, right / asked)),
      asked,
      perfect,
      seconds: (Date.now() - start) / 1000,
    })
  }

  const answer = (v: Verdict, d?: string) => {
    if (verdict) return
    const exercise = current

    if (exercise.kind === 'nieuw') {
      gradeWord(exercise.wordId, 'goed')
      if (index + 1 >= queue.length) finish()
      else setIndex((i) => i + 1)
      return
    }

    setVerdict(v)
    setDetail(d ?? '')
    tally.current.asked += 1
    if (v === 'goed') {
      tally.current.right += 1
      sfx.correct()
    } else if (v === 'bijna') {
      tally.current.right += 0.5
      tally.current.perfect = false
      sfx.correct()
    } else {
      tally.current.perfect = false
      sfx.wrong()
      if (heartsOn) loseHeart()
    }

    if (exercise.kind === 'koppel') for (const id of exercise.pairIds ?? []) gradeWord(id, GRADE_OF[v])
    else gradeWord(exercise.wordId, GRADE_OF[v])

    if (v === 'fout') setQueue((q) => [...q, { ...exercise, id: `${exercise.id}-again` }])
  }

  const next = () => {
    setVerdict(null)
    setDetail('')
    if (index + 1 >= queue.length) finish()
    else setIndex((i) => i + 1)
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-4">
      <div className="flex items-center gap-3">
        <button onClick={() => setQuit(true)} aria-label="Sluiten" className="text-2xl text-[var(--ink-soft)] hover:text-[var(--ink)]">✕</button>
        <Progress value={index / Math.max(1, queue.length)} tone="mint" />
        {heartsOn && <span className="shrink-0 font-bold" aria-label={`${hearts} hartjes over`}>❤️ {hearts}</span>}
      </div>

      <div className="flex flex-1 flex-col justify-center py-6">
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
            className={`sticky bottom-0 -mx-4 border-t-2 px-4 py-4 ${
              verdict === 'goed' ? 'border-mint-500 bg-mint-500/15'
              : verdict === 'bijna' ? 'border-saffron-500 bg-saffron-500/15'
              : 'border-terra-500 bg-terra-500/15'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl" aria-hidden="true">{verdict === 'goed' ? '🎉' : verdict === 'bijna' ? '👌' : '💡'}</span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-extrabold">
                  {verdict === 'goed' ? PRAISE[index % PRAISE.length] : verdict === 'bijna' ? 'Bijna goed!' : 'Het juiste antwoord:'}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm">
                  <span className="ar text-xl font-bold">{target.ar}</span>
                  <span className="font-display font-bold text-zellige-600 dark:text-zellige-300">{target.tr}</span>
                  <span className="text-[var(--ink-soft)]">— {meaning(target)}</span>
                </p>
                {detail && verdict !== 'goed' && <p className="mt-0.5 text-xs text-[var(--ink-soft)]">Jij had: “{detail}”</p>}
                {target.note && verdict !== 'goed' && <p className="mt-1 text-xs text-[var(--ink-soft)]">💡 {target.note}</p>}
              </div>
              <SpeakButton text={target.ar} className="mt-1" />
            </div>
            <Button variant={verdict === 'fout' ? 'danger' : 'success'} className="mt-3 w-full" autoFocus onClick={next}>
              {index + 1 >= queue.length ? 'Afronden' : 'Verder'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <Sheet open={quit} onClose={() => setQuit(false)} labelledBy="quit-title">
        <h2 id="quit-title" className="font-display text-xl font-extrabold">{quitLabel}</h2>
        <p className="mt-2 text-[var(--ink-soft)]">Wat je hier deed telt niet mee, geleerde woorden blijven bewaard.</p>
        <div className="mt-5 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setQuit(false)}>Doorgaan</Button>
          <Button variant="danger" className="flex-1" onClick={onQuit}>Stoppen</Button>
        </div>
      </Sheet>
    </div>
  )
}
