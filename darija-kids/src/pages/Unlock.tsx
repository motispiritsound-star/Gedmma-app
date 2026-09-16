import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FREE_UNITS, manageSubscription, PLANS, planOf, restorePurchases, subscribe, TRIAL_DAYS,
  useBilling, YEAR_SAVING, type PlanId,
} from '../engine/billing'
import { useStore } from '../engine/store'
import { useT } from '../i18n'
import { sfx } from '../engine/audio'
import { Button, Card, SectionTitle, Sheet } from '../ui/kit'
import { Mascot } from '../ui/Mascot'

/**
 * The one thing in this app that costs money.
 *
 * Apple and Google run the trial, the payment and the monthly renewal; this
 * page only asks for it, says plainly what it will cost and when, and puts a
 * question in front of it that a small child cannot answer alone.
 */
export function Unlock() {
  const t = useT()
  const billing = useBilling()
  const subscribed = useStore((s) => s.unlocked)
  const [gate, setGate] = useState(false)
  const [answer, setAnswer] = useState('')
  const [wrong, setWrong] = useState(false)
  // A year up front is the offer, so it is what the screen opens on.
  const [plan, setPlan] = useState<PlanId>('jaar')

  /** The price the store quotes, in the buyer's currency; otherwise our own. */
  const priceOf = (id: PlanId) => billing.prices[id] ?? planOf(id).list
  const price = priceOf(plan)
  const jaar = plan === 'jaar'

  // A different sum each visit, so it cannot be learned by heart.
  const sum = useMemo(() => {
    const a = 3 + Math.floor(Math.random() * 6)
    const b = 4 + Math.floor(Math.random() * 6)
    return { text: `${a} × ${b}`, value: a * b }
  }, [gate])

  useEffect(() => {
    if (subscribed) setGate(false)
  }, [subscribed])

  const confirm = () => {
    if (Number(answer.trim()) !== sum.value) {
      setWrong(true)
      return
    }
    setGate(false)
    setAnswer('')
    setWrong(false)
    void subscribe(plan)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <SectionTitle sub={t.unlock.sub(TRIAL_DAYS, price, jaar)}>{t.unlock.titel}</SectionTitle>

      {subscribed ? (
        <>
          <Card className="p-6 text-center">
            <Mascot mood="juich" size={100} className="mx-auto" />
            <p className="mt-3 font-display text-xl font-extrabold">{t.unlock.alOpen}</p>
            <Link to="/leren" className="mt-4 inline-block"><Button>{t.lesson.verderOpPad}</Button></Link>
          </Card>
          {billing.available && (
            <Card className="mt-4 flex flex-wrap items-center gap-3 p-5">
              <p className="min-w-0 flex-1 text-sm text-[var(--ink-soft)]">{t.unlock.beheerHint}</p>
              <Button variant="secondary" onClick={manageSubscription}>{t.unlock.beheer}</Button>
            </Card>
          )}
        </>
      ) : (
        <>
          {/* What happens and when, in three lines, before anything is asked. */}
          <Card className="mb-4 p-5">
            <ol className="space-y-3">
              {t.unlock.tijdlijn(TRIAL_DAYS, price, jaar).map(([emoji, titel, body]) => (
                <li key={titel} className="flex gap-3">
                  <span className="text-xl" aria-hidden="true">{emoji}</span>
                  <div className="min-w-0">
                    <p className="font-display font-extrabold">{titel}</p>
                    <p className="text-sm text-[var(--ink-soft)]">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="p-6">
            <p className="text-[var(--ink-soft)]">{t.unlock.intro(FREE_UNITS)}</p>
            <ul className="mt-4 space-y-2">
              {t.unlock.krijgt.map((line) => (
                <li key={line} className="flex gap-2 text-sm">
                  <span aria-hidden="true">✅</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>

            {/* Two plans, and the one that is cheaper per month is the one
                the eye lands on. */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {PLANS.map((option) => {
                const picked = plan === option.id
                return (
                  <button
                    key={option.id}
                    onClick={() => { sfx.pick(); setPlan(option.id) }}
                    aria-pressed={picked}
                    className={`btn3d relative rounded-2xl border-2 p-4 text-start transition ${
                      picked ? 'border-zellige-500 bg-zellige-500/10' : 'border-[var(--line)] bg-[var(--surface-raised)]'
                    }`}
                  >
                    {option.best && (
                      <span className="absolute -top-3 end-3 rounded-full bg-saffron-500 px-2.5 py-1 text-[11px] font-extrabold text-night-950">
                        {t.unlock.voordeligst(YEAR_SAVING)}
                      </span>
                    )}
                    <div className="font-display text-lg font-extrabold">{t.unlock.plan[option.id]}</div>
                    <div className="mt-1 font-display text-2xl font-extrabold">{priceOf(option.id)}</div>
                    <div className="mt-0.5 text-xs text-[var(--ink-soft)]">
                      {option.id === 'jaar'
                        ? t.unlock.perMaand(billing.prices.jaar ? '' : option.perMonth)
                        : t.unlock.perMaandLos}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mt-6">
              {billing.available ? (
                <Button className="w-full py-4 text-lg" disabled={billing.busy} onClick={() => { setWrong(false); setGate(true) }}>
                  {billing.busy ? t.unlock.bezig : t.unlock.koop(TRIAL_DAYS)}
                </Button>
              ) : (
                <p className="rounded-2xl bg-saffron-500/10 px-4 py-3 text-sm">{t.unlock.alleenInApp(price, jaar)}</p>
              )}
              {/* Both stores require the terms to be visible before buying. */}
              <p className="mt-3 text-xs leading-relaxed text-[var(--ink-soft)]">
                {jaar
                  ? t.unlock.voorwaardenJaar(TRIAL_DAYS, price)
                  : t.unlock.voorwaarden(TRIAL_DAYS, price)}
              </p>
              {billing.error && (
                <p className="mt-3 text-center text-sm text-terra-500">{t.unlock.mislukt(billing.error)}</p>
              )}
            </div>
          </Card>

          {billing.available && (
            <Card className="mt-4 flex flex-wrap items-center gap-3 p-5">
              <p className="min-w-0 flex-1 text-sm text-[var(--ink-soft)]">{t.unlock.herstelHint}</p>
              <Button variant="secondary" disabled={billing.busy} onClick={() => void restorePurchases()}>
                {t.unlock.herstel}
              </Button>
            </Card>
          )}
        </>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/leren"><Button variant="ghost">{t.lesson.terugNaarPad}</Button></Link>
        {/* Both stores require these two to be reachable before a purchase. */}
        <Link to="/voorwaarden"><Button variant="ghost">{t.nav.voorwaarden}</Button></Link>
        <Link to="/privacy"><Button variant="ghost">{t.nav.privacy}</Button></Link>
      </div>

      <Sheet open={gate} onClose={() => setGate(false)} labelledBy="gate-title">
        <h2 id="gate-title" className="font-display text-xl font-extrabold">{t.unlock.poortTitel}</h2>
        <p className="mt-2 text-[var(--ink-soft)]">{t.unlock.poortBody(sum.text)}</p>
        <label className="sr-only" htmlFor="gate-answer">{t.unlock.poortBody(sum.text)}</label>
        <input
          id="gate-answer"
          inputMode="numeric"
          value={answer}
          onChange={(e) => { setAnswer(e.target.value); setWrong(false) }}
          onKeyDown={(e) => e.key === 'Enter' && confirm()}
          className="mt-4 w-full rounded-2xl border-2 border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-center font-display text-2xl font-bold outline-none focus:border-zellige-500"
        />
        {wrong && <p className="mt-2 text-center text-sm text-terra-500">{t.unlock.poortFout}</p>}
        <div className="mt-5 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setGate(false)}>{t.common.annuleren}</Button>
          <Button className="flex-1" onClick={confirm}>{t.unlock.poortKnop}</Button>
        </div>
      </Sheet>
    </div>
  )
}
