import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { lessonById, unitOfLesson } from '../content/curriculum'
import { buildRound } from '../engine/exercises'
import {
  awardBadges, completeLesson, getState, knownWordIds, levelOf, markTipSeen, useStore, type Badge,
} from '../engine/store'
import { sfx } from '../engine/audio'
import { Button, Card, Sheet } from '../ui/kit'
import { Mascot } from '../ui/Mascot'
import { RoundRunner, type RoundResult } from '../ui/Round'
import { useLang, useT } from '../i18n'
import { lessonTitle, tipOf, unitSubtitle } from '../content/localise'

export function LessonPlayer() {
  const t = useT()
  const lang = useLang()
  const { lessonId = '' } = useParams()
  const navigate = useNavigate()
  const lesson = lessonById(lessonId)
  const unit = unitOfLesson(lessonId)
  const seenTip = useStore((s) => s.seenTips.includes(lessonId))
  const streak = useStore((s) => s.streak)

  const [showTip, setShowTip] = useState(false)
  const [result, setResult] = useState<RoundResult | null>(null)
  const [won, setWon] = useState<Badge[]>([])
  const [attempt, setAttempt] = useState(0)

  // The round is built once per attempt, from what the learner already knows.
  const exercises = useMemo(
    () => (lesson ? buildRound(lesson, { known: knownWordIds(getState()), toets: lesson.kind === 'toets' }) : []),
    [lessonId, attempt],
  )

  useEffect(() => {
    if (lesson?.tip && !seenTip) setShowTip(true)
  }, [lessonId])

  if (!lesson) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <Mascot mood="denk" />
        <p className="mt-4 font-display text-xl font-extrabold">{t.lesson.bestaatNiet}</p>
        <Link to="/leren" className="mt-4 inline-block"><Button>{t.lesson.terugNaarPad}</Button></Link>
      </div>
    )
  }

  const finish = (r: RoundResult) => {
    const bonus = (r.perfect ? 5 : 0) + (lesson.kind === 'toets' ? 10 : 0) + (r.seconds < 180 ? 2 : 0)
    const levelBefore = levelOf(getState().xp).level
    completeLesson(lesson.id, r.score, Math.round(10 + r.score * 10 + bonus))
    const badges = awardBadges()
    setWon(badges)
    setResult(r)
    sfx.finish()
    // Stack the rewards in the order they happened, not on top of each other.
    if (levelOf(getState().xp).level > levelBefore) setTimeout(() => sfx.levelUp(), 900)
    if (badges.length) setTimeout(() => sfx.badge(), 1700)
    if (getState().settings.motion === 'full') {
      void confetti({
        particleCount: r.perfect ? 160 : 90,
        spread: 75,
        origin: { y: 0.7 },
        colors: ['#f59e0b', '#14b8a6', '#e2603c', '#22c55e'],
      })
    }
  }

  if (result) {
    const stars = result.score >= 0.95 ? 3 : result.score >= 0.8 ? 2 : 1
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center">
        <Mascot mood="juich" size={130} className="mx-auto" />
        <h1 className="mt-4 font-display text-3xl font-extrabold">{result.perfect ? t.lesson.foutloos : t.lesson.lesKlaar}</h1>
        <p className="mt-1 text-[var(--ink-soft)]">
          {lessonTitle(lesson, lang)} · {unit ? unitSubtitle(unit, lang) : ''}
        </p>
        <div className="my-4 text-3xl text-saffron-500" aria-label={t.learn.sterren(stars)}>
          {'★'.repeat(stars)}{'☆'.repeat(3 - stars)}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3"><div className="font-display text-2xl font-extrabold">{Math.round(result.score * 100)}%</div><div className="text-xs text-[var(--ink-soft)]">{t.common.goed}</div></Card>
          <Card className="p-3"><div className="font-display text-2xl font-extrabold">{lesson.words.length}</div><div className="text-xs text-[var(--ink-soft)]">{t.common.woorden}</div></Card>
          <Card className="p-3"><div className="font-display text-2xl font-extrabold">🔥 {streak}</div><div className="text-xs text-[var(--ink-soft)]">{t.common.dagen}</div></Card>
        </div>

        {won.length > 0 && (
          <Card className="mt-4 p-4">
            <p className="font-display font-extrabold">{t.lesson.nieuweBeloning(won.length)}</p>
            <ul className="mt-2 flex flex-wrap justify-center gap-2">
              {won.map((b) => (
                <li key={b.id} className="rounded-full bg-saffron-500/15 px-3 py-1 text-sm font-bold">{b.emoji} {t.badges[b.id].naam}</li>
              ))}
            </ul>
          </Card>
        )}

        <div className="mt-6 space-y-3">
          <Button className="w-full" onClick={() => navigate('/leren')}>{t.lesson.verderOpPad}</Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => { setResult(null); setWon([]); setAttempt((a) => a + 1) }}
          >
            {t.common.nogEenKeer}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <RoundRunner
        key={attempt}
        exercises={exercises}
        onFinish={finish}
        onQuit={() => navigate('/leren')}
      />
      <Sheet open={showTip} onClose={() => { markTipSeen(lesson.id); setShowTip(false) }} labelledBy="tip-title">
        <div className="text-center">
          <Mascot mood="denk" size={80} className="mx-auto" />
          <h2 id="tip-title" className="mt-2 font-display text-xl font-extrabold">{tipOf(lesson, lang)?.title}</h2>
          <p className="mt-2 text-[var(--ink-soft)]">{tipOf(lesson, lang)?.body}</p>
          <Button className="mt-5 w-full" onClick={() => { markTipSeen(lesson.id); setShowTip(false) }}>{t.lesson.aanDeSlag}</Button>
        </div>
      </Sheet>
    </>
  )
}
