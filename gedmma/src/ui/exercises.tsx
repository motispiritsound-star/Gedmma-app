import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { Exercise } from '../engine/exercises'
import { checkSpoken, checkTyped, tokenize, type Verdict } from '../engine/exercises'
import { word } from '../content/lexicon'
import { canListen, listenOnce, say, sfx } from '../engine/audio'
import { useStore } from '../engine/store'
import { Button, Card } from './kit'
import { SpeakButton, useMeaning, WordText } from './WordChip'

/**
 * One component per exercise type. Each of them reports a single verdict and
 * then waits: the player decides what happens next.
 */

export interface ExerciseProps {
  exercise: Exercise
  /** Called once, with how well it went. */
  onAnswer: (verdict: Verdict, detail?: string) => void
  /** Set while the feedback bar is showing, to freeze the inputs. */
  locked: boolean
}

const optionButton = (chosen: string | null, id: string, answer: string, locked: boolean) => {
  const isChosen = chosen === id
  if (!locked || !isChosen) {
    return `border-[var(--line)] bg-[var(--surface-raised)] ${isChosen ? 'border-zellige-500' : 'hover:border-zellige-400'}`
  }
  return id === answer ? 'border-mint-500 bg-mint-500/15' : 'border-terra-500 bg-terra-500/15'
}

function Prompt({ children, hint }: { children: React.ReactNode; hint: string }) {
  return (
    <div className="mb-5">
      <p className="mb-3 font-display text-lg font-extrabold text-[var(--ink-soft)]">{hint}</p>
      {children}
    </div>
  )
}

/* --------------------------------------------------------------- new word */

function NewWord({ exercise, onAnswer }: ExerciseProps) {
  const w = word(exercise.wordId)
  useEffect(() => { say(w.ar) }, [w.ar])
  return (
    <div>
      <Prompt hint="Nieuw woord">
        <Card className="flex flex-col items-center gap-3 p-6">
          <div className="text-5xl" aria-hidden="true">{w.emoji ?? '✨'}</div>
          <WordText word={w} size="lg" />
          <p className="text-center font-display text-xl font-extrabold">{w.nl}</p>
          <SpeakButton text={w.ar} />
          {w.note && (
            <p className="mt-1 rounded-2xl bg-saffron-500/10 px-4 py-2 text-center text-sm text-[var(--ink-soft)]">
              💡 {w.note}
            </p>
          )}
        </Card>
      </Prompt>
      <Button className="w-full" onClick={() => onAnswer('goed')}>Snap ik!</Button>
    </div>
  )
}

/* ----------------------------------------------------------- multiple choice */

function Choice({ exercise, onAnswer, locked, mode }: ExerciseProps & { mode: 'betekenis' | 'darija' | 'luister' | 'script' }) {
  const [chosen, setChosen] = useState<string | null>(null)
  const meaning = useMeaning()
  const w = word(exercise.wordId)
  const options = exercise.options ?? []

  useEffect(() => {
    setChosen(null)
    if (mode === 'luister') say(w.ar)
  }, [exercise.id, mode, w.ar])

  const hint =
    mode === 'betekenis' ? 'Wat betekent dit?'
    : mode === 'darija' ? 'Hoe zeg je dit in het Darija?'
    : mode === 'luister' ? 'Wat hoor je?'
    : 'Welk schrift hoort hierbij?'

  const choose = (id: string) => {
    if (locked) return
    setChosen(id)
    onAnswer(id === w.id ? 'goed' : 'fout')
  }

  return (
    <div>
      <Prompt hint={hint}>
        {mode === 'betekenis' && (
          <Card className="flex items-center justify-center gap-4 p-6">
            <span className="text-4xl" aria-hidden="true">{w.emoji}</span>
            <WordText word={w} size="lg" />
            <SpeakButton text={w.ar} />
          </Card>
        )}
        {mode === 'darija' && (
          <Card className="p-6 text-center">
            <div className="text-4xl" aria-hidden="true">{w.emoji}</div>
            <p className="mt-2 font-display text-2xl font-extrabold">{meaning(w)}</p>
          </Card>
        )}
        {mode === 'luister' && (
          <div className="flex flex-col items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => say(w.ar)}
              onDoubleClick={() => say(w.ar, { slow: true })}
              className="grid h-28 w-28 place-items-center rounded-full bg-gradient-to-br from-zellige-300 to-zellige-700 text-5xl text-white shadow-lg"
              aria-label="Speel het woord af"
            >
              🔊
            </motion.button>
            <button className="text-sm font-bold text-[var(--ink-soft)] underline" onClick={() => say(w.ar, { slow: true })}>
              Langzamer
            </button>
          </div>
        )}
        {mode === 'script' && (
          <Card className="p-6 text-center">
            <p className="font-display text-3xl font-extrabold text-zellige-600 dark:text-zellige-300">{w.tr}</p>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">{meaning(w)}</p>
          </Card>
        )}
      </Prompt>

      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((id) => {
          const o = word(id)
          return (
            <button
              key={id}
              disabled={locked}
              onClick={() => choose(id)}
              className={`btn3d rounded-2xl border-2 p-4 text-start transition ${optionButton(chosen, id, w.id, locked)}`}
            >
              {mode === 'betekenis' && <span className="font-display text-lg font-bold">{o.emoji} {meaning(o)}</span>}
              {mode === 'darija' && <WordText word={o} />}
              {mode === 'luister' && <span className="ar block text-2xl font-bold">{o.ar}</span>}
              {mode === 'script' && <span className="ar block text-center text-3xl font-bold">{o.ar}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ match */

function Match({ exercise, onAnswer }: ExerciseProps) {
  const meaning = useMeaning()
  const ids = exercise.pairIds ?? []
  const words = ids.map(word)
  const right = useMemo(() => [...words].sort((a, b) => a.nl.localeCompare(b.nl)), [exercise.id])
  const [picked, setPicked] = useState<string | null>(null)
  const [solved, setSolved] = useState<string[]>([])
  const [wrong, setWrong] = useState<string | null>(null)
  const misses = useRef(0)

  const tapLeft = (id: string) => {
    if (solved.includes(id)) return
    sfx.tap()
    setPicked(id)
    say(word(id).ar)
  }

  const tapRight = (id: string) => {
    if (solved.includes(id) || !picked) return
    if (picked === id) {
      sfx.correct()
      const next = [...solved, id]
      setSolved(next)
      setPicked(null)
      if (next.length === ids.length) {
        setTimeout(() => onAnswer(misses.current === 0 ? 'goed' : 'bijna'), 350)
      }
    } else {
      misses.current += 1
      sfx.wrong()
      setWrong(id)
      setTimeout(() => setWrong(null), 500)
      setPicked(null)
    }
  }

  const tile = (id: string, active: boolean) =>
    `btn3d rounded-2xl border-2 p-3 text-center transition ${
      solved.includes(id) ? 'border-mint-500 bg-mint-500/15 opacity-60'
      : wrong === id ? 'border-terra-500 bg-terra-500/15'
      : active ? 'border-zellige-500 bg-zellige-500/10'
      : 'border-[var(--line)] bg-[var(--surface-raised)]'
    }`

  return (
    <div>
      <Prompt hint="Koppel de paren">
        <p className="text-sm text-[var(--ink-soft)]">Tik links op een woord en dan rechts op de betekenis.</p>
      </Prompt>
      <div className="grid grid-cols-2 gap-3">
        <ul className="space-y-3">
          {words.map((w) => (
            <li key={w.id}>
              <button className={`w-full ${tile(w.id, picked === w.id)}`} onClick={() => tapLeft(w.id)} disabled={solved.includes(w.id)}>
                <WordText word={w} size="sm" />
              </button>
            </li>
          ))}
        </ul>
        <ul className="space-y-3">
          {right.map((w) => (
            <li key={w.id}>
              <button className={`w-full ${tile(w.id, false)}`} onClick={() => tapRight(w.id)} disabled={solved.includes(w.id)}>
                <span className="font-display font-bold">{w.emoji} {meaning(w)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------- build */

function Build({ exercise, onAnswer, locked }: ExerciseProps) {
  const meaning = useMeaning()
  const w = word(exercise.wordId)
  const answer = tokenize(w.tr)
  const [bank, setBank] = useState<string[]>(exercise.tokens ?? [])
  const [line, setLine] = useState<string[]>([])

  useEffect(() => {
    setBank(exercise.tokens ?? [])
    setLine([])
  }, [exercise.id])

  const take = (i: number) => {
    if (locked) return
    sfx.tap()
    setLine((l) => [...l, bank[i]!])
    setBank((b) => b.filter((_, j) => j !== i))
  }
  const putBack = (i: number) => {
    if (locked) return
    sfx.tap()
    setBank((b) => [...b, line[i]!])
    setLine((l) => l.filter((_, j) => j !== i))
  }

  const submit = () => {
    const got = line.join(' ')
    onAnswer(got === answer.join(' ') ? 'goed' : checkTyped(got, w), got)
  }

  return (
    <div>
      <Prompt hint="Bouw de zin">
        <Card className="p-5 text-center">
          <p className="font-display text-xl font-extrabold">{meaning(w)}</p>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">{w.phrase ? w.tr.replace(/\s+/g, ' · ') : w.en}</p>
        </Card>
      </Prompt>

      <div className="mb-4 min-h-16 rounded-2xl border-2 border-dashed border-[var(--line)] p-3">
        <ul className="flex flex-wrap gap-2">
          {line.map((t, i) => (
            <li key={`${t}-${i}`}>
              <button className="btn3d rounded-xl border-2 border-zellige-500 bg-zellige-500/10 px-3 py-2 font-display font-bold" onClick={() => putBack(i)}>
                {t}
              </button>
            </li>
          ))}
          {line.length === 0 && <li className="px-2 py-2 text-sm text-[var(--ink-soft)]">Tik de woorden hieronder aan…</li>}
        </ul>
      </div>

      <ul className="mb-5 flex flex-wrap gap-2">
        {bank.map((t, i) => (
          <li key={`${t}-${i}`}>
            <button className="btn3d rounded-xl border-2 border-[var(--line)] bg-[var(--surface-raised)] px-3 py-2 font-display font-bold" onClick={() => take(i)}>
              {t}
            </button>
          </li>
        ))}
      </ul>

      <Button className="w-full" disabled={locked || line.length === 0} onClick={submit}>Controleer</Button>
    </div>
  )
}

/* --------------------------------------------------------------------- type */

function Type({ exercise, onAnswer, locked }: ExerciseProps) {
  const meaning = useMeaning()
  const w = word(exercise.wordId)
  const [value, setValue] = useState('')
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setValue('')
    input.current?.focus()
  }, [exercise.id])

  const submit = () => {
    if (locked || !value.trim()) return
    onAnswer(checkTyped(value, w), value)
  }

  return (
    <div>
      <Prompt hint="Schrijf het in Darija">
        <Card className="p-6 text-center">
          <div className="text-4xl" aria-hidden="true">{w.emoji}</div>
          <p className="mt-2 font-display text-2xl font-extrabold">{meaning(w)}</p>
        </Card>
      </Prompt>

      <label className="sr-only" htmlFor="answer">Jouw antwoord</label>
      <input
        id="answer"
        ref={input}
        value={value}
        disabled={locked}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="bijv. khobz of خبز"
        className="w-full rounded-2xl border-2 border-[var(--line)] bg-[var(--surface-raised)] px-4 py-4 text-center font-display text-2xl font-bold outline-none focus:border-zellige-500"
      />
      <p className="mt-2 text-center text-xs text-[var(--ink-soft)]">
        Latijnse letters of Arabisch schrift mag allebei. 3 = ع, 7 = ح, 9 = ق.
      </p>
      <Button className="mt-4 w-full" disabled={locked || !value.trim()} onClick={submit}>Controleer</Button>
    </div>
  )
}

/* -------------------------------------------------------------------- speak */

function Speak({ exercise, onAnswer, locked }: ExerciseProps) {
  const w = word(exercise.wordId)
  const [status, setStatus] = useState<'klaar' | 'luistert' | 'denkt'>('klaar')
  const [heard, setHeard] = useState('')

  const start = async () => {
    if (locked || status !== 'klaar') return
    setStatus('luistert')
    setHeard('')
    try {
      const text = await listenOnce()
      setStatus('denkt')
      setHeard(text)
      onAnswer(text ? checkSpoken(text, w) : 'fout', text)
    } catch {
      setStatus('klaar')
      onAnswer('bijna', 'microfoon werkte niet')
    }
  }

  if (!canListen()) {
    return (
      <div>
        <Prompt hint="Zeg het hardop">
          <Card className="p-6 text-center">
            <WordText word={w} size="lg" showNl />
            <div className="mt-3 flex justify-center"><SpeakButton text={w.ar} /></div>
          </Card>
        </Prompt>
        <p className="mb-4 text-center text-sm text-[var(--ink-soft)]">
          Deze browser kan niet meeluisteren. Zeg het toch hardop — het helpt echt.
        </p>
        <Button className="w-full" onClick={() => onAnswer('goed')}>Gezegd!</Button>
      </div>
    )
  }

  return (
    <div>
      <Prompt hint="Zeg het hardop">
        <Card className="flex flex-col items-center gap-3 p-6">
          <WordText word={w} size="lg" showNl />
          <SpeakButton text={w.ar} />
        </Card>
      </Prompt>

      <div className="flex flex-col items-center gap-3">
        <motion.button
          onClick={start}
          disabled={locked || status !== 'klaar'}
          animate={status === 'luistert' ? { scale: [1, 1.08, 1] } : { scale: 1 }}
          transition={{ repeat: status === 'luistert' ? Infinity : 0, duration: 1 }}
          className={`grid h-28 w-28 place-items-center rounded-full text-5xl text-white shadow-lg ${status === 'luistert' ? 'bg-terra-500' : 'bg-gradient-to-br from-zellige-300 to-zellige-700'}`}
          aria-label="Spreek in"
        >
          🎤
        </motion.button>
        <p className="text-sm text-[var(--ink-soft)]">
          {status === 'luistert' ? 'Ik luister…' : status === 'denkt' ? `Ik hoorde: ${heard || '…'}` : 'Tik en zeg het woord'}
        </p>
        <button className="text-sm font-bold text-[var(--ink-soft)] underline" onClick={() => onAnswer('bijna', 'overgeslagen')} disabled={locked}>
          Sla over
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ router */

export function ExerciseView(props: ExerciseProps) {
  const speechOn = useStore((s) => s.settings.speech)
  switch (props.exercise.kind) {
    case 'nieuw': return <NewWord {...props} />
    case 'kies-betekenis': return <Choice {...props} mode="betekenis" />
    case 'kies-darija': return <Choice {...props} mode="darija" />
    case 'luister': return <Choice {...props} mode="luister" />
    case 'script': return <Choice {...props} mode="script" />
    case 'koppel': return <Match {...props} />
    case 'bouw': return <Build {...props} />
    case 'tik': return <Type {...props} />
    case 'spreek': return speechOn ? <Speak {...props} /> : <Type {...props} />
  }
}
