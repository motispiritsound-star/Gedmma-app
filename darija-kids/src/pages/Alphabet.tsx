import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LETTERS } from '../content/alphabet'
import { maybeWord } from '../content/lexicon'
import { sayLetter, sfx } from '../engine/audio'
import { completeLesson, letterOpSlot, useStore } from '../engine/store'
import { shuffle, mulberry32 } from '../engine/random'
import { Button, Card, SectionTitle } from '../ui/kit'
import { Mascot } from '../ui/Mascot'
import { SpeakButton } from '../ui/WordChip'
import { useLang, useT } from '../i18n'
import { meaningOf } from '../content/localise'
import { letterVoice } from '../content/pronunciation'

/**
 * The Arabic script, one letter at a time — plus a short game that asks you to
 * pick the letter you just heard the name of.
 */
export function Alphabet() {
  const t = useT()
  const lang = useLang()
  const navigate = useNavigate()
  const gekocht = useStore((s) => s.unlocked)
  const [picked, setPicked] = useState(LETTERS[0]!.id)
  const [game, setGame] = useState(false)
  const letter = LETTERS.find((l) => l.id === picked)!
  const example = letter.exampleWordId ? maybeWord(letter.exampleWordId) : undefined
  const done = useStore((s) => !!s.lessons['letters'])

  if (game) return <LetterGame onDone={() => setGame(false)} />

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <SectionTitle sub={t.alphabet.uitleg}>{t.alphabet.titel}</SectionTitle>

      <div className="mb-6 grid grid-cols-6 gap-2 sm:grid-cols-8">
        {LETTERS.map((l) => {
          // Alle achtentwintig staan er; horen en bekijken kan bij de letters
          // uit de gratis lessen. Wat nog komt is zichtbaar, met een slotje.
          const opSlot = letterOpSlot(l.id)
          return (
            <button
              key={l.id}
              onClick={() => {
                if (opSlot) { sfx.back(); navigate('/volledig'); return }
                setPicked(l.id); sayLetter(l)
              }}
              className={`ar relative aspect-square rounded-2xl border-2 text-2xl font-bold transition ${l.id === picked ? 'border-zellige-500 bg-zellige-500/10' : 'border-[var(--line)] bg-[var(--surface-raised)] hover:border-zellige-400'} ${opSlot ? 'opacity-45' : ''}`}
              aria-label={opSlot ? `${l.name} — ${t.unlock.slotTitel}` : l.name}
            >
              {l.ar}
              {opSlot && <span className="absolute end-0.5 top-0.5 text-[10px]" aria-hidden="true">🔒</span>}
            </button>
          )
        })}
      </div>

      {!gekocht && (
        <Card className="mb-6 flex flex-wrap items-center gap-3 p-4">
          <span className="text-xl" aria-hidden="true">🔒</span>
          <p className="min-w-0 flex-1 text-sm">{t.alphabet.slotUitleg}</p>
          <Link to="/volledig"><Button variant="secondary">{t.unlock.slotKnop}</Button></Link>
        </Card>
      )}

      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-5">
          <div className="ar text-7xl font-bold">{letter.ar}</div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-2xl font-extrabold">{letter.name}</h2>
            <p className="text-[var(--ink-soft)]">{t.alphabet.klinktAls(letter.sound)}</p>
            <p className="mt-1 text-sm">{t.alphabet.latijn}: <strong>{letter.tr}</strong></p>
          </div>
          <SpeakButton {...letterVoice(letter)} />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          {(['initial', 'medial', 'final'] as const).map((form) => (
            <div key={form} className="rounded-2xl bg-[var(--surface-sunken)] p-3">
              <div className="ar text-3xl font-bold">{letter.forms[form]}</div>
              <div className="mt-1 text-xs font-bold uppercase text-[var(--ink-soft)]">
                {form === 'initial' ? t.alphabet.begin : form === 'medial' ? t.alphabet.midden : t.alphabet.eind}
              </div>
            </div>
          ))}
        </div>

        {example && (
          <div className="mt-5 flex items-center gap-3 rounded-2xl bg-saffron-500/10 p-4">
            <span className="text-3xl" aria-hidden="true">{example.emoji ?? '📝'}</span>
            <div>
              <div className="ar text-2xl font-bold">{example.ar}</div>
              <div className="text-sm text-[var(--ink-soft)]">{example.tr} — {meaningOf(example, lang)}</div>
            </div>
            <SpeakButton ar={example.ar} tr={example.tr} className="ms-auto" />
          </div>
        )}
      </Card>

      <Card className="mt-6 flex flex-wrap items-center gap-4 p-5">
        <Mascot mood="denk" size={64} />
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-extrabold">{t.alphabet.spel}</p>
          <p className="text-sm text-[var(--ink-soft)]">{t.alphabet.spelUitleg} {done ? `· ${t.alphabet.alGehaald}` : ''}</p>
        </div>
        <Button onClick={() => setGame(true)}>{t.common.spelen}</Button>
      </Card>

      <p className="mt-6 text-center text-sm text-[var(--ink-soft)]">{t.alphabet.voetnoot}</p>
    </div>
  )
}

function LetterGame({ onDone }: { onDone: () => void }) {
  const t = useT()
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [chosen, setChosen] = useState<string | null>(null)

  // Drums first: ten rounds in a row is a quiz, not a page.
  useEffect(() => { sfx.quizStart() }, [])

  const rnd = mulberry32(1337 + round)
  const target = shuffle(LETTERS, rnd)[0]!
  const options = shuffle([target, ...shuffle(LETTERS.filter((l) => l.id !== target.id), rnd).slice(0, 3)], rnd)

  const pick = (id: string) => {
    if (chosen) return
    sfx.pick()
    setChosen(id)
    if (id === target.id) { setScore((s) => s + 1); sfx.correct(score) } else sfx.wrong()
    setTimeout(() => {
      setChosen(null)
      if (round + 1 >= 10) {
        const final = (score + (id === target.id ? 1 : 0)) / 10
        completeLesson('letters', final, 15)
        if (final >= 0.8) sfx.cheer()
        else sfx.finish()
        onDone()
      } else {
        sfx.quizTick(round + 1, 10)
        setRound((r) => r + 1)
      }
    }, 750)
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10 text-center">
      <p className="text-sm font-bold text-[var(--ink-soft)]">{t.alphabet.ronde(round + 1, score)}</p>
      <h1 className="mt-4 font-display text-3xl font-extrabold">{target.name}</h1>
      <p className="text-[var(--ink-soft)]">{t.alphabet.klinktAls(target.sound)}</p>

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

      <Button variant="ghost" className="mt-8" onClick={onDone}>{t.common.stoppen}</Button>
    </div>
  )
}
