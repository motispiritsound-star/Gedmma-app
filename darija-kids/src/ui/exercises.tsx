import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { Exercise, LetterForm } from '../engine/exercises'
import { checkSpoken, checkTyped, normalise, tokenize, type Verdict } from '../engine/exercises'
import { word } from '../content/lexicon'
import { connects, letter } from '../content/alphabet'
import { sentence } from '../content/sentences'
import { sentenceMeaning } from '../content/localise'
import { maybeWord } from '../content/lexicon'
import { canListen, listenOnce, say, sayLetter, sfx } from '../engine/audio'
import { useStore } from '../engine/store'
import { Button, Card } from './kit'
import { Scribe } from './Scribe'
import { SpeakButton, useMeaning, useNote, WordText } from './WordChip'
import { useLang, useT } from '../i18n'
import { letterVoice } from '../content/pronunciation'

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
  const t = useT()
  const meaning = useMeaning()
  const note = useNote()
  const w = word(exercise.wordId)
  useEffect(() => { say(w.ar, { tr: w.tr }) }, [w.ar, w.tr])
  return (
    <div>
      <Prompt hint={t.lesson.nieuwWoord}>
        <Card className="flex flex-col items-center gap-3 p-6">
          <div className="text-5xl" aria-hidden="true">{w.emoji ?? '✨'}</div>
          <WordText word={w} size="lg" />
          <p className="text-center font-display text-xl font-extrabold">{meaning(w)}</p>
          <SpeakButton ar={w.ar} tr={w.tr} />
          {note(w) && (
            <p className="mt-1 rounded-2xl bg-saffron-500/10 px-4 py-2 text-center text-sm text-[var(--ink-soft)]">
              💡 {note(w)}
            </p>
          )}
        </Card>
      </Prompt>
      <Button className="w-full" sound="confirm" onClick={() => onAnswer('goed')}>{t.lesson.snapIk}</Button>
    </div>
  )
}

/* ----------------------------------------------------------- multiple choice */

function Choice({ exercise, onAnswer, locked, mode }: ExerciseProps & { mode: 'betekenis' | 'darija' | 'luister' | 'script' }) {
  const [chosen, setChosen] = useState<string | null>(null)
  const t = useT()
  const meaning = useMeaning()
  const w = word(exercise.wordId)
  const options = exercise.options ?? []

  useEffect(() => {
    setChosen(null)
    if (mode === 'luister') say(w.ar, { tr: w.tr })
  }, [exercise.id, mode, w.ar, w.tr])

  const hint =
    mode === 'betekenis' ? t.lesson.watBetekent
    : mode === 'darija' ? t.lesson.hoeZegJe
    : mode === 'luister' ? t.lesson.watHoorJe
    : t.lesson.welkSchrift

  const choose = (id: string) => {
    if (locked) return
    sfx.pick()
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
            <SpeakButton ar={w.ar} tr={w.tr} />
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
              onClick={() => say(w.ar, { tr: w.tr })}
              onDoubleClick={() => say(w.ar, { tr: w.tr, slow: true })}
              className="grid h-28 w-28 place-items-center rounded-full bg-gradient-to-br from-zellige-300 to-zellige-700 text-5xl text-white shadow-lg"
              aria-label={t.lesson.speelAf}
            >
              🔊
            </motion.button>
            <button className="text-sm font-bold text-[var(--ink-soft)] underline" onClick={() => say(w.ar, { tr: w.tr, slow: true })}>
              {t.lesson.langzamer}
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
              // Marks the buttons that are answers, so the camera that films
              // the app knows what to press. Nothing else hangs off it.
              data-answer=""
              className={`btn3d rounded-2xl border-2 p-4 transition md:p-6 ${mode === 'script' ? 'text-center' : 'text-start'} ${optionButton(chosen, id, w.id, locked)}`}
            >
              {mode === 'betekenis' && <span className="font-display text-lg font-bold md:text-xl">{o.emoji} {meaning(o)}</span>}
              {mode === 'darija' && <WordText word={o} />}
              {mode === 'luister' && <span className="ar text-2xl font-bold md:text-3xl">{o.ar}</span>}
              {mode === 'script' && <span className="ar text-3xl font-bold md:text-4xl">{o.ar}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ match */

function Match({ exercise, onAnswer }: ExerciseProps) {
  const t = useT()
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
    say(word(id).ar, { tr: word(id).tr })
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
      <Prompt hint={t.lesson.koppelParen}>
        <p className="text-sm text-[var(--ink-soft)]">{t.lesson.koppelUitleg}</p>
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
  const t = useT()
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
    sfx.pick()
    const got = line.join(' ')
    onAnswer(got === answer.join(' ') ? 'goed' : checkTyped(got, w), got)
  }

  return (
    <div>
      <Prompt hint={t.lesson.bouwZin}>
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
          {line.length === 0 && <li className="px-2 py-2 text-sm text-[var(--ink-soft)]">{t.lesson.bouwUitleg}</li>}
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

      <Button className="w-full" disabled={locked || line.length === 0} onClick={submit}>{t.lesson.controleer}</Button>
    </div>
  )
}

/* --------------------------------------------------------------------- type */

function Type({ exercise, onAnswer, locked, mode = 'betekenis' }: ExerciseProps & { mode?: 'betekenis' | 'dictee' }) {
  const t = useT()
  const meaning = useMeaning()
  const w = word(exercise.wordId)
  const [value, setValue] = useState('')
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setValue('')
    input.current?.focus()
  }, [exercise.id])

  // Dictation says it once by itself; after that the speaker is there to ask
  // again, as often as it takes.
  useEffect(() => {
    if (mode === 'dictee') say(w.ar, { tr: w.tr })
  }, [mode, w.ar, w.tr])

  const submit = () => {
    if (locked || !value.trim()) return
    sfx.pick()
    onAnswer(checkTyped(value, w), value)
  }

  return (
    <div>
      <Prompt hint={mode === 'dictee' ? t.bonus.dicteeVraag : t.lesson.schrijfDarija}>
        <Card className="p-6 text-center">
          {mode === 'dictee' ? (
            <div className="flex flex-col items-center gap-2">
              <SpeakButton ar={w.ar} tr={w.tr} className="scale-125" />
              <p className="text-sm text-[var(--ink-soft)]">{t.bonus.dicteeHint}</p>
            </div>
          ) : (
            <>
              <div className="text-4xl" aria-hidden="true">{w.emoji}</div>
              <p className="mt-2 font-display text-2xl font-extrabold">{meaning(w)}</p>
            </>
          )}
        </Card>
      </Prompt>

      <label className="sr-only" htmlFor="answer">{t.lesson.jouwAntwoord}</label>
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
        placeholder={t.lesson.schrijfPlaceholder}
        className="w-full rounded-2xl border-2 border-[var(--line)] bg-[var(--surface-raised)] px-4 py-4 text-center font-display text-2xl font-bold outline-none focus:border-zellige-500"
      />
      <p className="mt-2 text-center text-xs text-[var(--ink-soft)]">{t.lesson.schrijfHint}</p>
      <Button className="mt-4 w-full" disabled={locked || !value.trim()} onClick={submit}>{t.lesson.controleer}</Button>
    </div>
  )
}

/* ------------------------------------------------------------------ writing */

/**
 * Trace it.
 *
 * A letter is asked in one of its three shapes — with the little connecting
 * strokes the font draws on either side — because that is the form a child
 * will actually have to write inside a word.
 */
function Trace({ exercise, onAnswer, locked }: ExerciseProps) {
  const t = useT()
  const meaning = useMeaning()
  const formName = useFormName()
  const isLetter = exercise.kind === 'letter-schrijf'
  const l = isLetter ? letter(exercise.letterId!) : null
  const w = isLetter ? null : word(exercise.wordId)
  const form = exercise.form ?? 'initial'
  const glyph = l ? l.forms[form] : w!.ar
  const spoken = l ? l.name : w!.tr

  return (
    <div>
      <Card className="mb-4 flex items-center gap-3 p-4">
        <div className="ar text-3xl font-bold">{glyph}</div>
        <div className="min-w-0 flex-1">
          <p className="font-display font-extrabold">{spoken}</p>
          <p className="text-sm text-[var(--ink-soft)]">
            {l ? t.bonus.schrijfVorm(formName(form)) : meaning(w!)}
          </p>
        </div>
        <SpeakButton ar={l ? l.ar : w!.ar} tr={spoken} />
      </Card>

      <Scribe
        glyph={glyph}
        hint={l ? t.bonus.schrijfVraag : t.bonus.schrijfVraagWoord}
        locked={locked}
        onDone={(score) => onAnswer(score.verdict, t.bonus.gedekt(Math.round(score.coverage * 100)))}
      />
    </div>
  )
}

/* -------------------------------------------------------------------- speak */

function Speak({ exercise, onAnswer, locked }: ExerciseProps) {
  const t = useT()
  const w = word(exercise.wordId)
  const [status, setStatus] = useState<'klaar' | 'luistert' | 'denkt'>('klaar')
  const [heard, setHeard] = useState('')

  const start = async () => {
    if (locked || status !== 'klaar') return
    sfx.tap()
    setStatus('luistert')
    setHeard('')
    try {
      const text = await listenOnce()
      setStatus('denkt')
      setHeard(text)
      onAnswer(text ? checkSpoken(text, w) : 'fout', text)
    } catch {
      setStatus('klaar')
      onAnswer('bijna', t.lesson.spreekIn)
    }
  }

  if (!canListen()) {
    return (
      <div>
        <Prompt hint={t.lesson.zegHardop}>
          <Card className="p-6 text-center">
            <WordText word={w} size="lg" showNl />
            <div className="mt-3 flex justify-center"><SpeakButton ar={w.ar} tr={w.tr} /></div>
          </Card>
        </Prompt>
        <p className="mb-4 text-center text-sm text-[var(--ink-soft)]">{t.lesson.geenMicrofoon}</p>
        <Button className="w-full" onClick={() => onAnswer('goed')}>{t.lesson.gezegd}</Button>
      </div>
    )
  }

  return (
    <div>
      <Prompt hint={t.lesson.zegHardop}>
        <Card className="flex flex-col items-center gap-3 p-6">
          <WordText word={w} size="lg" showNl />
          <SpeakButton ar={w.ar} tr={w.tr} />
        </Card>
      </Prompt>

      <div className="flex flex-col items-center gap-3">
        <motion.button
          onClick={start}
          disabled={locked || status !== 'klaar'}
          animate={status === 'luistert' ? { scale: [1, 1.08, 1] } : { scale: 1 }}
          transition={{ repeat: status === 'luistert' ? Infinity : 0, duration: 1 }}
          className={`grid h-28 w-28 place-items-center rounded-full text-5xl text-white shadow-lg ${status === 'luistert' ? 'bg-terra-500' : 'bg-gradient-to-br from-zellige-300 to-zellige-700'}`}
          aria-label={t.lesson.spreekIn}
        >
          🎤
        </motion.button>
        <p className="text-sm text-[var(--ink-soft)]">
          {status === 'luistert' ? t.lesson.ikLuister : status === 'denkt' ? t.lesson.ikHoorde(heard) : t.lesson.tikEnZeg}
        </p>
        <button
          className="text-sm font-bold text-[var(--ink-soft)] underline"
          onClick={() => { sfx.back(); onAnswer('bijna', 'overgeslagen') }}
          disabled={locked}
        >
          {t.lesson.slaOver}
        </button>
      </div>
    </div>
  )
}


/* ---------------------------------------------------------------- letters */

/** The name a form goes by on screen. */
function useFormName(): (form: LetterForm) => string {
  const t = useT()
  return (form) => (form === 'initial' ? t.alphabet.begin : form === 'medial' ? t.alphabet.midden : t.alphabet.eind)
}

/** The same three positions, as they fit into a question. */
function useFormPlace(): (form: LetterForm) => string {
  const t = useT()
  return (form) => (form === 'initial' ? t.alphabet.posBegin : form === 'medial' ? t.alphabet.posMidden : t.alphabet.posEind)
}

function NewLetter({ exercise, onAnswer }: ExerciseProps) {
  const t = useT()
  const lang = useLang()
  const formName = useFormName()
  const l = letter(exercise.letterId!)
  const example = l.exampleWordId ? maybeWord(l.exampleWordId) : undefined
  useEffect(() => { sayLetter(l) }, [l.id])

  return (
    <div>
      <Prompt hint={t.lesson.nieuweLetter}>
        <Card className="flex flex-col items-center gap-3 p-6">
          <div className="ar text-7xl font-bold">{l.ar}</div>
          <p className="font-display text-2xl font-extrabold">{l.name}</p>
          <p className="text-center text-[var(--ink-soft)]">{t.alphabet.klinktAls(l.sound)}</p>
          <SpeakButton {...letterVoice(l)} />

          <ul className="mt-2 grid w-full grid-cols-3 gap-2 text-center">
            {(['initial', 'medial', 'final'] as LetterForm[]).map((form) => (
              <li key={form} className="rounded-2xl bg-[var(--surface-sunken)] p-3">
                <div className="ar text-3xl font-bold">{l.forms[form]}</div>
                <div className="mt-1 text-xs font-bold uppercase text-[var(--ink-soft)]">{formName(form)}</div>
              </li>
            ))}
          </ul>

          {!connects(l.id) && (
            <p className="rounded-2xl bg-saffron-500/10 px-4 py-2 text-center text-sm text-[var(--ink-soft)]">
              ✂️ {t.lesson.plaktNiet}
            </p>
          )}

          {example && (
            <div className="mt-1 flex w-full items-center gap-3 rounded-2xl bg-zellige-500/10 p-3">
              <span className="text-2xl" aria-hidden="true">{example.emoji ?? '📝'}</span>
              <div className="min-w-0 flex-1">
                <div className="ar text-xl font-bold">{example.ar}</div>
                <div className="text-sm text-[var(--ink-soft)]">{example.tr}</div>
              </div>
              <SpeakButton ar={example.ar} tr={example.tr} />
            </div>
          )}
        </Card>
      </Prompt>
      <Button className="w-full" sound="confirm" onClick={() => onAnswer('goed')}>{t.lesson.snapIk}</Button>
      <p className="sr-only">{lang}</p>
    </div>
  )
}

/** One question about a letter: which glyph, which name, or which shape. */
function LetterChoice({ exercise, onAnswer, locked, mode }: ExerciseProps & { mode: 'klank' | 'naam' | 'vorm' }) {
  const t = useT()
  const formPlace = useFormPlace()
  const [chosen, setChosen] = useState<string | null>(null)
  const l = letter(exercise.letterId!)
  const form = exercise.form ?? 'initial'
  const ids = exercise.letterOptions ?? []

  useEffect(() => {
    setChosen(null)
    if (mode === 'klank') sayLetter(l)
  }, [exercise.id, mode, l.id])

  const choose = (id: string) => {
    if (locked) return
    sfx.pick()
    setChosen(id)
    onAnswer(id === l.id ? 'goed' : 'fout')
  }

  const hint =
    mode === 'klank' ? t.lesson.welkeLetter
    : mode === 'naam' ? t.lesson.hoeHeetLetter
    : t.lesson.welkeVorm(formPlace(form))

  return (
    <div>
      <Prompt hint={hint}>
        {mode === 'klank' ? (
          <Card className="p-6 text-center">
            <p className="font-display text-3xl font-extrabold">{l.name}</p>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">{t.alphabet.klinktAls(l.sound)}</p>
            <div className="mt-3 flex justify-center"><SpeakButton {...letterVoice(l)} /></div>
          </Card>
        ) : (
          <Card className="flex items-center justify-center gap-4 p-6">
            <span className="ar text-6xl font-bold">{l.ar}</span>
            <SpeakButton {...letterVoice(l)} />
          </Card>
        )}
      </Prompt>

      <div className={`grid gap-3 ${mode === 'naam' ? 'sm:grid-cols-2' : 'grid-cols-2'}`}>
        {ids.map((id) => {
          const o = letter(id)
          return (
            <button
              key={id}
              disabled={locked}
              onClick={() => choose(id)}
              // Marks the buttons that are answers, so the camera that films
              // the app knows what to press. Nothing else hangs off it.
              data-answer=""
              className={`btn3d rounded-2xl border-2 p-4 text-center transition ${optionButton(chosen, id, l.id, locked)}`}
            >
              {mode === 'naam'
                ? <span className="font-display text-lg font-bold">{o.name} <span className="text-[var(--ink-soft)]">· {o.tr}</span></span>
                : <span className="ar text-4xl font-bold">{mode === 'vorm' ? o.forms[form] : o.ar}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------- sentences */

/** What a sentence means, in the language the learner picked. */
function useSentenceMeaning() {
  const lang = useLang()
  return (id: string) => sentenceMeaning(sentence(id), lang)
}

function NewSentence({ exercise, onAnswer }: ExerciseProps) {
  const t = useT()
  const meaning = useSentenceMeaning()
  const { showScript, showTranslit } = useStore((s) => s.settings)
  const z = sentence(exercise.sentenceId!)
  useEffect(() => { say(z.ar, { tr: z.tr }) }, [z.ar, z.tr])

  return (
    <div>
      <Prompt hint={t.lesson.nieuweZin}>
        <Card className="flex flex-col items-center gap-3 p-6 text-center">
          <span className="text-3xl" aria-hidden="true">💬</span>
          {showScript && <p className="ar text-3xl font-bold leading-relaxed">{z.ar}</p>}
          {(showTranslit || !showScript) && (
            <p className="font-display text-lg font-bold text-zellige-600 dark:text-zellige-300">{z.tr}</p>
          )}
          <p className="font-display text-xl font-extrabold">{meaning(z.id)}</p>
          <SpeakButton ar={z.ar} tr={z.tr} />
          <p className="text-xs text-[var(--ink-soft)]">{t.lesson.zinLangzaam}</p>
        </Card>
      </Prompt>
      <Button className="w-full" sound="confirm" onClick={() => onAnswer('goed')}>{t.lesson.snapIk}</Button>
    </div>
  )
}

function SentenceBuild({ exercise, onAnswer, locked }: ExerciseProps) {
  const t = useT()
  const meaning = useSentenceMeaning()
  const z = sentence(exercise.sentenceId!)
  const answer = tokenize(z.tr)
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
    sfx.pick()
    const got = line.join(' ')
    // Word order is the whole exercise, so the tiles have to be in the right
    // order; the spelling itself is already decided by the tiles.
    const verdict: Verdict =
      got === answer.join(' ') ? 'goed' : normalise(got) === normalise(z.tr) ? 'bijna' : 'fout'
    onAnswer(verdict, got)
  }

  return (
    <div>
      <Prompt hint={t.lesson.bouwZin}>
        <Card className="p-5 text-center">
          <p className="font-display text-xl font-extrabold">{meaning(z.id)}</p>
          <div className="mt-2 flex justify-center"><SpeakButton ar={z.ar} tr={z.tr} /></div>
        </Card>
      </Prompt>

      <div className="mb-4 min-h-16 rounded-2xl border-2 border-dashed border-[var(--line)] p-3">
        <ul className="flex flex-wrap gap-2">
          {line.map((token, i) => (
            <li key={`${token}-${i}`}>
              <button className="btn3d rounded-xl border-2 border-zellige-500 bg-zellige-500/10 px-3 py-2 font-display font-bold" onClick={() => putBack(i)}>
                {token}
              </button>
            </li>
          ))}
          {line.length === 0 && <li className="px-2 py-2 text-sm text-[var(--ink-soft)]">{t.lesson.bouwUitleg}</li>}
        </ul>
      </div>

      <ul className="mb-5 flex flex-wrap gap-2">
        {bank.map((token, i) => (
          <li key={`${token}-${i}`}>
            <button className="btn3d rounded-xl border-2 border-[var(--line)] bg-[var(--surface-raised)] px-3 py-2 font-display font-bold" onClick={() => take(i)}>
              {token}
            </button>
          </li>
        ))}
      </ul>

      <Button className="w-full" disabled={locked || line.length === 0} onClick={submit}>{t.lesson.controleer}</Button>
    </div>
  )
}

function SentenceChoice({ exercise, onAnswer, locked, mode }: ExerciseProps & { mode: 'betekenis' | 'luister' }) {
  const t = useT()
  const meaning = useSentenceMeaning()
  const [chosen, setChosen] = useState<string | null>(null)
  const z = sentence(exercise.sentenceId!)
  const ids = exercise.sentenceOptions ?? []

  useEffect(() => {
    setChosen(null)
    if (mode === 'luister') say(z.ar, { tr: z.tr })
  }, [exercise.id, mode, z.ar, z.tr])

  const choose = (id: string) => {
    if (locked) return
    sfx.pick()
    setChosen(id)
    onAnswer(id === z.id ? 'goed' : 'fout')
  }

  return (
    <div>
      <Prompt hint={mode === 'betekenis' ? t.lesson.watBetekentZin : t.lesson.welkeZinHoorJe}>
        {mode === 'betekenis' ? (
          <Card className="flex flex-col items-center gap-2 p-6 text-center">
            <p className="ar text-2xl font-bold leading-relaxed">{z.ar}</p>
            <p className="font-display font-bold text-zellige-600 dark:text-zellige-300">{z.tr}</p>
            <SpeakButton ar={z.ar} tr={z.tr} />
          </Card>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => say(z.ar, { tr: z.tr })}
              onDoubleClick={() => say(z.ar, { tr: z.tr, slow: true })}
              className="grid h-28 w-28 place-items-center rounded-full bg-gradient-to-br from-zellige-300 to-zellige-700 text-5xl text-white shadow-lg"
              aria-label={t.lesson.speelAf}
            >
              🔊
            </motion.button>
            <button className="text-sm font-bold text-[var(--ink-soft)] underline" onClick={() => say(z.ar, { tr: z.tr, slow: true })}>
              {t.lesson.langzamer}
            </button>
          </div>
        )}
      </Prompt>

      <div className="grid gap-3">
        {ids.map((id) => (
          <button
            key={id}
            disabled={locked}
            onClick={() => choose(id)}
            data-answer=""
            className={`btn3d rounded-2xl border-2 p-4 text-start transition ${optionButton(chosen, id, z.id, locked)}`}
          >
            {mode === 'betekenis'
              ? <span className="font-display text-base font-bold">{meaning(id)}</span>
              : <span className="ar text-xl font-bold">{sentence(id).ar}</span>}
          </button>
        ))}
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
    case 'dictee': return <Type {...props} mode="dictee" />
    case 'schrijf': return <Trace {...props} />
    case 'spreek': return speechOn ? <Speak {...props} /> : <Type {...props} />
    case 'letter-nieuw': return <NewLetter {...props} />
    case 'letter-klank': return <LetterChoice {...props} mode="klank" />
    case 'letter-naam': return <LetterChoice {...props} mode="naam" />
    case 'letter-vorm': return <LetterChoice {...props} mode="vorm" />
    case 'letter-schrijf': return <Trace {...props} />
    case 'zin-nieuw': return <NewSentence {...props} />
    case 'zin-bouw': return <SentenceBuild {...props} />
    case 'zin-betekenis': return <SentenceChoice {...props} mode="betekenis" />
    case 'zin-luister': return <SentenceChoice {...props} mode="luister" />
  }
}
