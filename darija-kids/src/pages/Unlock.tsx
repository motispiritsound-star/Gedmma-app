import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FREE_UNITS, LIST_PRICE, manageSubscription, restorePurchases, subscribe, TRIAL_DAYS, useBilling,
} from '../engine/billing'
import { useStore } from '../engine/store'
import { useT } from '../i18n'
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

  // The price the store quotes, in the buyer's currency; otherwise our own.
  const price = billing.price ?? LIST_PRICE

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
    void subscribe()
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <SectionTitle sub={t.unlock.sub(TRIAL_DAYS, price)}>{t.unlock.titel}</SectionTitle>

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

            <div className="mt-6">
              {billing.available ? (
                <Button className="w-full py-4 text-lg" disabled={billing.busy} onClick={() => { setWrong(false); setGate(true) }}>
                  {billing.busy ? t.unlock.bezig : t.unlock.koop(TRIAL_DAYS)}
                </Button>
              ) : (
                <p className="rounded-2xl bg-saffron-500/10 px-4 py-3 text-sm">{t.unlock.alleenInApp(price)}</p>
              )}
              {/* Both stores require the terms to be visible before buying. */}
              <p className="mt-3 text-xs leading-relaxed text-[var(--ink-soft)]">
                {t.unlock.voorwaarden(TRIAL_DAYS, price)}
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
