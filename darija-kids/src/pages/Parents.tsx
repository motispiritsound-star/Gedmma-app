import { Link } from 'react-router-dom'
import { UNITS } from '../content/curriculum'
import { allWords } from '../content/lexicon'
import { levelOf, today, useStore } from '../engine/store'
import { useT } from '../i18n'
import { Button, Card, SectionTitle, Stat } from '../ui/kit'
import { Mascot } from '../ui/Mascot'
import { OperatorBlock } from '../ui/Operator'
import { FeedbackButton } from '../ui/Feedback'
import { PostAanmelding } from '../ui/PostAanmelding'

/** For the adult in the room: what the app does, and how the child is doing. */
export function Parents() {
  const t = useT()
  const state = useStore((s) => s)
  const seen = Object.keys(state.cards).length
  const solid = Object.values(state.cards).filter((c) => c.strength >= 0.85).length
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return state.daily[today(d)] ?? 0
  })
  const weekXp = week.reduce((a, b) => a + b, 0)
  const activeDays = week.filter((x) => x > 0).length

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <SectionTitle sub={t.parents.uitleg}>{t.parents.titel}</SectionTitle>

      <Card className="mb-8 p-5">
        <h2 className="font-display text-xl font-extrabold">{t.parents.dezeWeek}</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat value={weekXp} label={t.parents.xpWeek} emoji="⚡" />
          <Stat value={`${activeDays}/7`} label={t.parents.dagenGeoefend} emoji="📅" />
          <Stat value={`${seen}/${allWords.length}`} label={t.parents.woordenGezien} emoji="📚" />
          <Stat value={solid} label={t.parents.woordenVast} emoji="🔒" />
        </div>
        <p className="mt-4 text-sm text-[var(--ink-soft)]">
          {t.parents.samenvatting(levelOf(state.xp).level, Object.keys(state.lessons).length, state.bestStreak)}
        </p>
      </Card>

      <h2 className="mb-3 font-display text-xl font-extrabold">{t.parents.hoeGeleerd}</h2>
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        {t.parents.methode.map((m) => (
          <Card key={m.titel} className="p-5">
            <span className="text-3xl" aria-hidden="true">{m.emoji}</span>
            <h3 className="mt-1 font-display font-extrabold">{m.titel}</h3>
            <p className="text-sm text-[var(--ink-soft)]">{m.body}</p>
          </Card>
        ))}
      </div>

      <PostAanmelding />

      <h2 className="mb-3 font-display text-xl font-extrabold">{t.parents.privacyTitel}</h2>
      <Card className="mb-8 p-5">
        <ul className="space-y-2 text-sm">
          {t.parents.privacy.map((line) => <li key={line}>{line}</li>)}
          <li>
            ✅ <Link to="/instellingen" className="font-bold underline">{t.parents.privacyInstellingen}</Link>
          </li>
          <li>
            📄 <Link to="/privacy" className="font-bold underline">{t.nav.privacy}</Link>
          </li>
        </ul>
      </Card>

      <h2 className="mb-3 font-display text-xl font-extrabold">{t.parents.thuisTitel}</h2>
      <Card className="mb-8 p-5">
        <ul className="space-y-2 text-sm text-[var(--ink-soft)]">
          {t.parents.thuis.map(([lead, body]) => (
            <li key={lead}><strong className="text-[var(--ink)]">{lead}</strong> {body}</li>
          ))}
        </ul>
      </Card>

      <h2 className="mb-3 font-display text-xl font-extrabold">{t.parents.klasTitel}</h2>
      <Card className="mb-8 p-5 text-sm text-[var(--ink-soft)]">
        <p>{t.parents.klas(allWords.length, UNITS.length)}</p>
      </Card>

      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-4">
          <Mascot mood="blij" size={64} />
          <p className="min-w-0 flex-1 text-sm text-[var(--ink-soft)]">
            <strong className="text-[var(--ink)]">{t.parents.eerlijkTitel}</strong> {t.parents.eerlijk}
          </p>
        </div>
      </Card>

      {/* This page doubles as the support URL both stores ask for, so the
          way to reach a human belongs on it — and belongs above the fine
          print, not buried under it. */}
      <h2 className="mb-3 mt-8 font-display text-xl font-extrabold">{t.feedback.titel}</h2>
      <Card className="mb-8 p-5">
        <p className="text-sm text-[var(--ink-soft)]">{t.feedback.uitleg}</p>
        <FeedbackButton className="js-feedback mt-4" />
      </Card>

      <OperatorBlock />

      <div className="mt-8 text-center">
        <Link to="/leren"><Button>{t.parents.naarPad}</Button></Link>
      </div>
    </div>
  )
}
