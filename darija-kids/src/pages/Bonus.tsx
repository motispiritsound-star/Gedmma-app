import { useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { BONUS, bonusOfTheDay, bonusTask, poolFrom, type BonusId } from '../engine/bonus'
import { isScribeExercise } from '../engine/exercises'
import {
  addGems, addXp, awardBadges, bonusToday, finishBonus, mastery, today, useStore,
} from '../engine/store'
import { canListen, sfx } from '../engine/audio'
import { kanOpnemen } from '../engine/microfoon'
import { Button, Card, Progress, SectionTitle, Stat } from '../ui/kit'
import { Mascot } from '../ui/Mascot'
import { RoundRunner } from '../ui/Round'
import { useT } from '../i18n'

/**
 * Bonus: the part of the app that is never finished.
 *
 * Seventeen units end. This does not — every round here is built out of what
 * the learner has already met, so it is different every time and there is
 * always one more. It is also where the writing lives, because tracing a
 * letter is the one thing here that uses a hand instead of a tap.
 *
 * The meter at the top is the honest version of "how far am I": it counts what
 * is strong *and* not yet due back, so it slips on its own if nobody comes
 * back. Nothing is taken away for that — it is just never done, which is the
 * truth about a language.
 */
/** What a finished round leaves behind, carried in the address bar's own state. */
interface Finished {
  score: number
  xp: number
  gems: number
  bestCombo: number
}

export function Bonus() {
  const t = useT()
  const state = useStore((s) => s)
  const navigate = useNavigate()
  // The running round lives at its own address, so the tab bar and the top bar
  // step aside for it the way they do for a lesson.
  const running = (useParams().bonusId ?? null) as BonusId | null
  const task = running ? BONUS.find((b) => b.id === running) : undefined
  const [seed, setSeed] = useState(() => Date.now())
  // The score travels back with the navigation rather than in state: leaving a
  // round changes the address, and the page that shows the score is mounted
  // fresh on the other side of that.
  const result = (useLocation().state as { klaar?: Finished } | null)?.klaar ?? null
  const leave = (klaar?: Finished) => navigate('/bonus', { replace: true, state: klaar ? { klaar } : null })

  const pool = useMemo(
    () => poolFrom(state, { canSpeak: canListen() || kanOpnemen() }),
    // A new round when one is started, and whenever progress moves the pool.
    [state, seed],
  )
  // Built once per round on purpose: `pool` moves with every graded answer,
  // and a queue that rebuilt itself halfway through would be a different round
  // than the one that was started.
  const exercises = useMemo(
    () => (task ? task.build(pool, seed) : []),
    [task, seed],
  )

  const counts = bonusToday(state)
  const level = mastery(state)
  const open = BONUS.filter((b) => b.ready(pool))
  const highlight = bonusOfTheDay(today(), open.map((b) => b.id))

  // A made-up address, or one the learner is not ready for yet: back to the menu
  // rather than quietly running something else.
  if (running && (!task || !task.ready(pool) || exercises.length === 0)) {
    return <Navigate to="/bonus" replace />
  }

  if (running && task) {
    return (
      <RoundRunner
        exercises={exercises}
        useHearts={false}
        review
        quiz={running === 'marathon'}
        quitLabel={t.bonus.stoppen}
        onQuit={() => leave()}
        onFinish={(round) => {
          const traced = exercises.filter(isScribeExercise).length
          // Gems only for a round that was actually played, so quitting after
          // one question and starting again is not a way to farm them.
          const earned = round.score >= 0.6 ? task.gems : 0
          addXp(Math.round(4 + round.score * 12))
          addGems(earned)
          finishBonus(round.bestCombo, round.score >= 0.6 ? traced : 0)
          awardBadges()
          sfx.finish()
          setSeed(Date.now())
          leave({ score: round.score, xp: round.xp, gems: earned, bestCombo: round.bestCombo })
        }}
      />
    )
  }

  return (
    <div className="mx-auto max-w-3xl lg:max-w-5xl px-4 py-6">
      <SectionTitle sub={t.bonus.uitleg}>{t.bonus.titel}</SectionTitle>

      {result && (
        <Card className="mb-6 flex items-center gap-4 p-5">
          <Mascot mood="juich" size={64} />
          <div className="min-w-0">
            <p className="font-display text-lg font-extrabold">
              {t.bonus.rondeKlaar(Math.round(result.score * 100))}
            </p>
            <p className="text-sm text-[var(--ink-soft)]">
              {t.bonus.opbrengst(result.xp, result.gems, result.bestCombo)}
            </p>
          </div>
        </Card>
      )}

      {/* The meter that is never full, and says so. */}
      <Card className="mb-6 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-lg font-extrabold">{t.bonus.meesterschap}</h2>
          <span className="font-display text-2xl font-extrabold">{Math.round(level.share * 100)}%</span>
        </div>
        <Progress value={level.share} className="mt-3" tone="zellige" />
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          {t.bonus.meesterschapUitleg(level.strong, level.met)}
        </p>
      </Card>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <Stat emoji="⭐" value={counts.today} label={t.bonus.vandaag} />
        <Stat emoji="⚡" value={counts.reeks} label={t.bonus.reeks} />
        <Stat emoji="✍️" value={counts.getekend} label={t.bonus.getekend} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BONUS.map((task) => {
          const ready = task.ready(pool)
          return (
            <Card key={task.id} className={`flex flex-col p-5 ${ready ? '' : 'opacity-60'}`}>
              <div className="flex items-start gap-3">
                <span className="text-4xl" aria-hidden="true">{task.emoji}</span>
                {task.id === highlight && (
                  <span className="ms-auto rounded-full bg-saffron-500 px-2.5 py-1 text-[11px] font-extrabold text-night-950">
                    {t.bonus.vandaagBadge}
                  </span>
                )}
              </div>
              <h2 className="mt-2 font-display text-xl font-extrabold">{t.bonus.taak[task.id].naam}</h2>
              <p className="flex-1 text-sm text-[var(--ink-soft)]">{t.bonus.taak[task.id].uitleg}</p>
              <p className="mt-2 text-xs font-bold uppercase tracking-wide text-[var(--ink-soft)]">
                {t.bonus.vragenEnEdelstenen(task.size, task.gems)}
              </p>
              {ready ? (
                <Button
                  className="mt-4"
                  // Five buttons that all say "Start" are five identical
                  // buttons to anyone listening rather than looking.
                  aria-label={t.bonus.starten(t.bonus.taak[task.id].naam)}
                  onClick={() => { setSeed(Date.now()); navigate(`/bonus/${task.id}`) }}
                >
                  {t.common.start}
                </Button>
              ) : (
                <p className="mt-4 rounded-2xl bg-[var(--surface-sunken)] px-4 py-3 text-sm text-[var(--ink-soft)]">
                  {t.bonus.nogNiet[task.id]}
                </p>
              )}
            </Card>
          )
        })}
      </div>

      <p className="mt-8 text-center text-sm text-[var(--ink-soft)]">{t.bonus.altijd}</p>
      <div className="mt-4 flex justify-center gap-3">
        <Link to="/leren"><Button variant="ghost">{t.lesson.terugNaarPad}</Button></Link>
        <Link to="/instellingen"><Button variant="ghost">{t.nav.instellingen}</Button></Link>
      </div>
    </div>
  )
}

/** Used by the path and the games page, so the bonus is never hidden away. */
export function BonusCard() {
  const t = useT()
  const state = useStore((s) => s)
  const counts = bonusToday(state)
  const pool = poolFrom(state, { canSpeak: canListen() || kanOpnemen() })
  const open = BONUS.filter((b) => b.ready(pool))
  const highlight = bonusOfTheDay(today(), open.map((b) => b.id))
  if (!highlight) return null

  return (
    <Card className="flex flex-wrap items-center gap-4 p-5">
      <span className="text-4xl" aria-hidden="true">{bonusTask(highlight).emoji}</span>
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-lg font-extrabold">{t.bonus.vandaagTitel}</h2>
        <p className="text-sm text-[var(--ink-soft)]">
          {counts.today > 0 ? t.bonus.alGedaan(counts.today) : t.bonus.taak[highlight].uitleg}
        </p>
      </div>
      <Link to="/bonus"><Button variant={counts.today > 0 ? 'secondary' : 'primary'}>{t.bonus.naarBonus}</Button></Link>
    </Card>
  )
}
