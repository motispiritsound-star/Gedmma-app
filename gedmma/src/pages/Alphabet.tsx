import { useState } from 'react'
import { motion } from 'framer-motion'
import { LETTERS } from '../content/alphabet'
import { maybeWord } from '../content/lexicon'
import { say, sfx } from '../engine/audio'
import { completeLesson, useStore } from '../engine/store'
import { shuffle, mulberry32 } from '../engine/random'
import { Button, Card, SectionTitle } from '../ui/kit'
import { Mascot } from '../ui/Mascot'
import { SpeakButton } from '../ui/WordChip'

/**
 * The Arabic script, one letter at a time — plus a short game that asks you to
 * pick the letter you just heard the name of.
 */
export function Alphabet() {
  const [picked, setPicked] = useState(LETTERS[0]!.id)
  const [game, setGame] = useState(false)
  const letter = LETTERS.find((l) => l.id === picked)!
  const example = letter.exampleWordId ? maybeWord(letter.exampleWordId) : undefined
  const done = useStore((s) => !!s.lessons['letters'])

  if (game) return <LetterGame onDone={() => setGame(false)} />

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <SectionTitle sub="28 letters plus drie Marokkaanse extra's. Ze veranderen van vorm aan het begin, in het midden en aan het eind van een woord.">
        Het Arabische schrift
      </SectionTitle>

      <div className="mb-6 grid grid-cols-6 gap-2 sm:grid-cols-8">
        {LETTERS.map((l) => (
          <button
            key={l.id}
            onClick={() => { setPicked(l.id); sfx.tap(); say(l.ar) }}
            className={`ar aspect-square rounded-2xl border-2 text-2xl font-bold transition ${l.id === picked ? 'border-zellige-500 bg-zellige-500/10' : 'border-[var(--line)] bg-[var(--surface-raised)] hover:border-zellige-400'}`}
            aria-label={l.name}
          >
            {l.ar}
          </button>
        ))}
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-5">
          <div className="ar text-7xl font-bold">{letter.ar}</div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-2xl font-extrabold">{letter.name}</h2>
            <p className="text-[var(--ink-soft)]">Klinkt als: {letter.sound}</p>
            <p className="mt-1 text-sm">Schrijfwijze in het Latijn: <strong>{letter.tr}</strong></p>
          </div>
          <SpeakButton text={letter.ar} />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          {(['initial', 'medial', 'final'] as const).map((form) => (
            <div key={form} className="rounded-2xl bg-[var(--surface-sunken)] p-3">
              <div className="ar text-3xl font-bold">{letter.forms[form]}</div>
              <div className="mt-1 text-xs font-bold uppercase text-[var(--ink-soft)]">
                {form === 'initial' ? 'begin' : form === 'medial' ? 'midden' : 'eind'}
              </div>
            </div>
          ))}
        </div>

        {example && (
          <div className="mt-5 flex items-center gap-3 rounded-2xl bg-saffron-500/10 p-4">
            <span className="text-3xl" aria-hidden="true">{example.emoji ?? '📝'}</span>
            <div>
              <div className="ar text-2xl font-bold">{example.ar}</div>
              <div className="text-sm text-[var(--ink-soft)]">{example.tr} — {example.nl}</div>
            </div>
            <SpeakButton text={example.ar} className="ms-auto" />
          </div>
        )}
      </Card>

      <Card className="mt-6 flex flex-wrap items-center gap-4 p-5">
        <Mascot mood="denk" size={64} />
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-extrabold">Letterspel</p>
          <p className="text-sm text-[var(--ink-soft)]">Tien rondes: welke letter hoort bij deze naam? {done && '· al gehaald ✅'}</p>
        </div>
        <Button onClick={() => setGame(true)}>Spelen</Button>
      </Card>

      <p className="mt-6 text-center text-sm text-[var(--ink-soft)]">
        Arabisch schrijf je van rechts naar links. Korte klinkers schrijf je meestal niet op — die hoor je erbij.
      </p>
    </div>
  )
}

function LetterGame({ onDone }: { onDone: () => void }) {
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [chosen, setChosen] = useState<string | null>(null)

  const rnd = mulberry32(1337 + round)
  const target = shuffle(LETTERS, rnd)[0]!
  const options = shuffle([target, ...shuffle(LETTERS.filter((l) => l.id !== target.id), rnd).slice(0, 3)], rnd)

  const pick = (id: string) => {
    if (chosen) return
    setChosen(id)
    if (id === target.id) { setScore((s) => s + 1); sfx.correct() } else sfx.wrong()
    setTimeout(() => {
      setChosen(null)
      if (round + 1 >= 10) {
        completeLesson('letters', (score + (id === target.id ? 1 : 0)) / 10, 15)
        sfx.finish()
        onDone()
      } else setRound((r) => r + 1)
    }, 750)
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10 text-center">
      <p className="text-sm font-bold text-[var(--ink-soft)]">Ronde {round + 1} van 10 · {score} goed</p>
      <h1 className="mt-4 font-display text-3xl font-extrabold">{target.name}</h1>
      <p className="text-[var(--ink-soft)]">Klinkt als: {target.sound}</p>

      <div className="mt-8 grid grid-cols-2 gap-3">
        {options.map((l) => (
          <motion.button
            key={l.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => pick(l.id)}
            className={`ar btn3d aspect-square rounded-3xl border-2 text-5xl font-bold ${
              chosen && l.id === target.id ? 'border-mint-500 bg-mint-500/20'
              : chosen === l.id ? 'border-terra-500 bg-terra-500/20'
              : 'border-[var(--line)] bg-[var(--surface-raised)]'
            }`}
          >
            {l.ar}
          </motion.button>
        ))}
      </div>

      <Button variant="ghost" className="mt-8" onClick={onDone}>Stoppen</Button>
    </div>
  )
}
