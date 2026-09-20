import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { STORIES, storyById } from '../content/stories'
import { say, sfx } from '../engine/audio'
import { completeLesson, useStore } from '../engine/store'
import { Button, Card, SectionTitle } from '../ui/kit'
import { Mascot } from '../ui/Mascot'
import { useLang, useT } from '../i18n'
import { storyOf } from '../content/localise'

export function Stories() {
  const t = useT()
  const lang = useLang()
  const lessons = useStore((s) => s.lessons)
  // De verhalen horen bij de cursus, niet bij het gratis begin. Ze staan er
  // wel allemaal op: zien wat er komt is de beste reden om verder te willen.
  const gekocht = useStore((s) => s.unlocked)
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <SectionTitle sub={t.stories.uitleg}>{t.stories.titel}</SectionTitle>

      {!gekocht && (
        <Card className="mb-4 flex flex-wrap items-center gap-3 p-4">
          <span className="text-xl" aria-hidden="true">🔒</span>
          <p className="min-w-0 flex-1 text-sm">{t.stories.slotUitleg}</p>
          <Link to="/volledig"><Button variant="secondary">{t.unlock.slotKnop}</Button></Link>
        </Card>
      )}

      <ul className="grid gap-4 sm:grid-cols-2">
        {STORIES.map((s) => {
          const local = storyOf(s, lang)
          return (
          <li key={s.id}>
            <Link to={gekocht ? `/verhalen/${s.id}` : '/volledig'} className={gekocht ? '' : 'opacity-70'}>
              <Card className="flex h-full items-center gap-4 p-5 transition hover:border-zellige-500">
                <span className="text-4xl" aria-hidden="true">{gekocht ? s.emoji : '🔒'}</span>
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-extrabold">{local.title}</h2>
                  <p className="text-sm text-[var(--ink-soft)]">{local.intro}</p>
                  <p className="mt-1 text-xs font-bold uppercase text-zellige-600 dark:text-zellige-300">
                    {s.level} · {t.stories.zinnen(s.lines.length)} {lessons[`verhaal-${s.id}`] ? `· ${t.stories.gelezen}` : ''}
                  </p>
                </div>
              </Card>
            </Link>
          </li>
        )})}
      </ul>
    </div>
  )
}

export function StoryReader() {
  const t = useT()
  const lang = useLang()
  const { storyId = '' } = useParams()
  const navigate = useNavigate()
  const story = storyById(storyId)
  const [shown, setShown] = useState<number[]>([])
  const [quiz, setQuiz] = useState(false)
  const [answers, setAnswers] = useState<number[]>([])

  if (!story) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <Mascot mood="denk" />
        <p className="mt-4 font-display text-xl font-extrabold">{t.stories.bestaatNiet}</p>
        <Link to="/verhalen" className="mt-4 inline-block"><Button>{t.stories.alleVerhalen}</Button></Link>
      </div>
    )
  }

  const local = storyOf(story, lang)
  const speakers = [...new Set(story.lines.map((l) => l.speaker))]

  if (quiz) {
    const finished = answers.length === story.quiz.length
    const right = answers.filter((a, i) => a === story.quiz[i]!.answer).length
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <SectionTitle sub={local.title}>{t.stories.snapteJeHet}</SectionTitle>
        <ol className="space-y-5">
          {local.quiz.map((q, qi) => (
            <li key={q.q}>
              <Card className="p-5">
                <p className="font-display text-lg font-extrabold">{qi + 1}. {q.q}</p>
                <div className="mt-3 grid gap-2">
                  {q.options.map((option, oi) => {
                    const given = answers[qi]
                    const state = given === undefined ? 'open' : oi === q.answer ? 'goed' : given === oi ? 'fout' : 'rest'
                    return (
                      <button
                        key={option}
                        disabled={given !== undefined}
                        onClick={() => {
                          sfx.pick()
                          setAnswers((a) => { const next = [...a]; next[qi] = oi; return next })
                          if (oi === q.answer) sfx.correct(right); else sfx.wrong()
                        }}
                        className={`btn3d rounded-2xl border-2 p-3 text-start font-semibold ${
                          state === 'goed' ? 'border-mint-500 bg-mint-500/15'
                          : state === 'fout' ? 'border-terra-500 bg-terra-500/15'
                          : 'border-[var(--line)] bg-[var(--surface-raised)]'
                        }`}
                      >
                        {option}
                      </button>
                    )
                  })}
                </div>
              </Card>
            </li>
          ))}
        </ol>

        {finished && (
          <Card className="mt-6 p-5 text-center">
            <Mascot mood={right === story.quiz.length ? 'juich' : 'blij'} size={80} className="mx-auto" />
            <p className="mt-2 font-display text-xl font-extrabold">{t.stories.goedVan(right, story.quiz.length)}</p>
            <Button
              className="mt-4"
              onClick={() => {
                completeLesson(`verhaal-${story.id}`, right / story.quiz.length, 12)
                if (right / story.quiz.length >= 0.8) sfx.cheer()
                navigate('/verhalen')
              }}
            >
              {t.common.klaar}
            </Button>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link to="/verhalen" onClick={() => sfx.back()} className="text-sm font-bold text-[var(--ink-soft)]">← {t.stories.alleVerhalen}</Link>
      <h1 className="mt-2 font-display text-2xl font-extrabold">{story.emoji} {local.title}</h1>
      <p className="text-[var(--ink-soft)]">{local.intro}</p>

      <div className="mt-6 space-y-3">
        {local.lines.map((line, i) => {
          const mine = line.speaker === speakers[0]
          const open = shown.includes(i)
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.4) }}
              className={`flex ${mine ? 'justify-start' : 'justify-end'}`}
            >
              <button
                onClick={() => { sfx.tap(); setShown((s) => (open ? s.filter((x) => x !== i) : [...s, i])); say(line.ar, { tr: line.tr }) }}
                className={`max-w-[85%] rounded-3xl border-2 p-4 text-start transition ${
                  mine ? 'rounded-bl-md border-[var(--line)] bg-[var(--surface-raised)]' : 'rounded-br-md border-zellige-500/40 bg-zellige-500/10'
                }`}
              >
                <div className="text-xs font-bold uppercase text-[var(--ink-soft)]">{line.speaker}</div>
                <div className="ar mt-1 text-2xl font-bold">{line.ar}</div>
                <div className="mt-1 text-sm font-semibold text-zellige-600 dark:text-zellige-300">{line.tr}</div>
                {open && <div className="mt-2 border-t border-[var(--line)] pt-2 text-sm">{line.text}</div>}
              </button>
            </motion.div>
          )
        })}
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button variant="secondary" onClick={() => setShown(story.lines.map((_, i) => i))}>{t.stories.allesVertalen}</Button>
        <Button onClick={() => { sfx.quizStart(); setQuiz(true) }}>{t.stories.vragen}</Button>
      </div>
    </div>
  )
}
