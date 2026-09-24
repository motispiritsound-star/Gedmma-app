import { useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { buildReviewRound } from '../engine/exercises'
import { addXp, dueSentenceIds, dueWordIds, getState, useStore } from '../engine/store'
import { strengthLabel } from '../engine/srs'
import { word } from '../content/lexicon'
import { Button, Card, SectionTitle, Stat } from '../ui/kit'
import { Mascot } from '../ui/Mascot'
import { RoundRunner, type RoundResult } from '../ui/Round'
import { sfx } from '../engine/audio'
import { useLang, useT } from '../i18n'
import { meaningOf } from '../content/localise'

/**
 * Herhalen: whatever the scheduler says is due, in a round without hearts.
 * Review should never be the thing that stops you from practising.
 */
export function Review() {
  const t = useT()
  const lang = useLang()
  const navigate = useNavigate()
  const state = useStore((s) => s)
  const due = dueWordIds(state)
  const dueSentences = dueSentenceIds(state)
  // The round has its own address, so the top bar and the tab bar step aside
  // for it the way they do for a lesson — a question with five tabs under it
  // is a question you can tap your way out of by accident.
  const running = useParams().running === 'bezig'
  const result = (useLocation().state as { klaar?: RoundResult } | null)?.klaar ?? null
  const [seed, setSeed] = useState(() => Date.now())
  const exercises = useMemo(() => buildReviewRound(due, seed, dueSentences), [seed, running])

  if (running && exercises.length === 0) return <Navigate to="/herhalen" replace />

  if (running) {
    return (
      <RoundRunner
        exercises={exercises}
        useHearts={false}
        review
        quitLabel={t.lesson.stoppenHerhalen}
        onQuit={() => navigate('/herhalen', { replace: true })}
        onFinish={(r) => {
          addXp(Math.round(5 + r.score * 10))
          sfx.finish()
          setSeed(Date.now())
          navigate('/herhalen', { replace: true, state: { klaar: r } })
        }}
      />
    )
  }

  const weakest = Object.values(state.cards)
    .sort((a, b) => a.strength - b.strength)
    .slice(0, 8)

  return (
    <div className="mx-auto max-w-3xl lg:max-w-5xl px-4 py-6">
      <SectionTitle sub={t.review.uitleg}>{t.review.titel}</SectionTitle>

      {result && (
        <Card className="mb-6 flex items-center gap-4 p-5">
          <Mascot mood="juich" size={64} />
          <div>
            <p className="font-display text-lg font-extrabold">{t.review.rondeKlaar(Math.round(result.score * 100))}</p>
            <p className="text-sm font-bold text-mint-600 dark:text-mint-300">
              {t.lesson.xpPlus(result.xp + Math.round(5 + result.score * 10))}
              {result.gems > 0 && <> · 💎 {t.lesson.gemPlus(result.gems)}</>}
            </p>
            <p className="text-sm text-[var(--ink-soft)]">{t.review.nogInWachtrij(dueWordIds(getState()).length)}</p>
          </div>
        </Card>
      )}

      <div className="mb-6 grid grid-cols-3 gap-3">
        <Stat value={due.length} label={t.review.nuTeHerhalen} emoji="⏰" />
        <Stat value={Object.keys(state.cards).length} label={t.review.woordenGezien} emoji="📚" />
        <Stat value={Object.values(state.cards).filter((c) => c.strength >= 0.85).length} label={t.review.vastgezet} emoji="🔒" />
      </div>

      {due.length === 0 ? (
        <Card className="p-6 text-center">
          <Mascot mood="slaap" size={90} className="mx-auto" />
          <p className="mt-3 font-display text-xl font-extrabold">{t.review.nietsTeHerhalen}</p>
          <p className="mt-1 text-[var(--ink-soft)]">{t.review.nietsUitleg}</p>
          <Link to="/leren" className="mt-4 inline-block"><Button>{t.review.naarPad}</Button></Link>
        </Card>
      ) : (
        <Card className="p-6 text-center">
          <Mascot mood="denk" size={90} className="mx-auto" />
          <p className="mt-3 font-display text-xl font-extrabold">{t.review.klaarVoor(Math.min(12, due.length))}</p>
          <p className="mt-1 text-[var(--ink-soft)]">{t.review.zonderHartjes}</p>
          {dueSentences.length > 0 && (
            <p className="mt-1 text-sm font-bold text-zellige-600 dark:text-zellige-300">
              {t.review.metZinnen(Math.min(4, dueSentences.length))}
            </p>
          )}
          <Button className="mt-4 w-full sm:w-auto" onClick={() => { setSeed(Date.now()); navigate('/herhalen/bezig') }}>
            {t.review.startHerhaling}
          </Button>
        </Card>
      )}

      {weakest.length > 0 && (
        <>
          <h3 className="mt-8 mb-3 font-display text-lg font-extrabold">{t.review.zwakste}</h3>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {weakest.map((card) => {
              const w = word(card.id)
              return (
                <li key={card.id}>
                  <Card className="flex items-center gap-3 p-3">
                    <span className="text-2xl" aria-hidden="true">{w.emoji ?? '•'}</span>
                    <div className="min-w-0 flex-1">
                      <div className="ar text-lg font-bold">{w.ar}</div>
                      <div className="text-sm text-[var(--ink-soft)]">{w.tr} — {meaningOf(w, lang)}</div>
                    </div>
                    <span className="shrink-0 rounded-full bg-[var(--surface-sunken)] px-2 py-1 text-xs font-bold">
                      {t.strength[strengthLabel(card.strength)]}
                    </span>
                  </Card>
                </li>
              )
            })}
          </ul>
        </>
      )}

      <div className="mt-8 text-center">
        <Button variant="ghost" onClick={() => navigate('/leren')}>{t.lesson.terugNaarPad}</Button>
      </div>
    </div>
  )
}
