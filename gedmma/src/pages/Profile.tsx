import { Link } from 'react-router-dom'
import { UNITS } from '../content/curriculum'
import { allWords } from '../content/lexicon'
import {
  BADGES, levelOf, progressOfUnit, setState, today, useStore,
} from '../engine/store'
import { Button, Card, Progress, SectionTitle, Stat } from '../ui/kit'
import { Mascot } from '../ui/Mascot'

const AVATARS = ['🦊', '🦉', '🐪', '🦁', '🐈', '🦋', '⭐', '🌙', '🫖', '⚽']

/** Everything the learner has built up, on one page. */
export function Profile() {
  const state = useStore((s) => s)
  const { level, into, span } = levelOf(state.xp)
  const seen = Object.keys(state.cards).length
  const solid = Object.values(state.cards).filter((c) => c.strength >= 0.85).length
  const doneLessons = Object.keys(state.lessons).length

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const key = today(d)
    return { key, day: ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'][d.getDay()]!, xp: state.daily[key] ?? 0 }
  })
  const peak = Math.max(state.settings.dailyGoal, ...week.map((w) => w.xp))

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Card className="mb-6 flex flex-wrap items-center gap-5 p-5">
        <div className="relative">
          <div className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-saffron-400 to-terra-500 text-4xl">
            {state.avatar}
          </div>
          <span className="absolute -bottom-2 -end-2 rounded-full bg-zellige-600 px-2 py-0.5 text-xs font-extrabold text-white">
            {level}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-extrabold">{state.name || 'Leerling'}</h1>
          <p className="text-sm text-[var(--ink-soft)]">Niveau {level} · {into}/{span} XP naar het volgende</p>
          <Progress value={into / span} tone="saffron" className="mt-2" />
        </div>
        <Link to="/instellingen"><Button variant="secondary">Aanpassen</Button></Link>
      </Card>

      <div className="mb-4 flex flex-wrap gap-2">
        {AVATARS.map((a) => (
          <button
            key={a}
            onClick={() => setState({ avatar: a })}
            className={`grid h-11 w-11 place-items-center rounded-2xl border-2 text-2xl ${state.avatar === a ? 'border-zellige-500 bg-zellige-500/10' : 'border-[var(--line)]'}`}
            aria-label={`Kies ${a}`}
          >
            {a}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={state.xp} label="XP totaal" emoji="⚡" />
        <Stat value={`${state.streak} / ${state.bestStreak}`} label="reeks / record" emoji="🔥" />
        <Stat value={`${seen}/${allWords.length}`} label="woorden gezien" emoji="📚" />
        <Stat value={solid} label="vastgezet" emoji="🔒" />
      </div>

      <SectionTitle sub="De laatste zeven dagen. De stippellijn is je dagdoel.">
        <span className="mt-8 block">Deze week</span>
      </SectionTitle>
      <Card className="p-5">
        <div className="relative flex h-36 items-end gap-2">
          <div
            className="absolute inset-x-0 border-t-2 border-dashed border-saffron-500/60"
            style={{ bottom: `${(state.settings.dailyGoal / peak) * 100}%` }}
            aria-hidden="true"
          />
          {week.map((d) => (
            <div key={d.key} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={`w-full rounded-t-lg ${d.xp >= state.settings.dailyGoal ? 'bg-mint-500' : 'bg-zellige-500/50'}`}
                style={{ height: `${Math.max(4, (d.xp / peak) * 100)}%` }}
                title={`${d.xp} XP`}
              />
              <span className="text-xs font-bold text-[var(--ink-soft)]">{d.day}</span>
            </div>
          ))}
        </div>
      </Card>

      <SectionTitle><span className="mt-8 block">Beloningen</span></SectionTitle>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {BADGES.map((b) => {
          const earned = state.badges.includes(b.id)
          return (
            <li key={b.id}>
              <Card className={`h-full p-4 text-center ${earned ? '' : 'opacity-55'}`}>
                <div className="text-3xl" aria-hidden="true">{earned ? b.emoji : '🔒'}</div>
                <div className="mt-1 font-display font-extrabold">{b.name}</div>
                <div className="text-xs text-[var(--ink-soft)]">{b.hint}</div>
              </Card>
            </li>
          )
        })}
      </ul>

      <SectionTitle><span className="mt-8 block">Units</span></SectionTitle>
      <ul className="space-y-2">
        {UNITS.map((u) => {
          const pct = progressOfUnit(u.id, state)
          const stars = u.lessons.reduce((sum, l) => sum + (state.lessons[l.id]?.stars ?? 0), 0)
          return (
            <li key={u.id}>
              <Card className="flex items-center gap-3 p-3">
                <span className="text-2xl" aria-hidden="true">{u.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-display font-extrabold">{u.title}</div>
                  <Progress value={pct} className="mt-1 h-2" />
                </div>
                <span className="shrink-0 text-sm font-bold text-saffron-500">★ {stars}</span>
              </Card>
            </li>
          )
        })}
      </ul>

      <Card className="mt-8 flex flex-wrap items-center gap-4 p-5">
        <Mascot mood="blij" size={64} />
        <p className="min-w-0 flex-1 text-sm text-[var(--ink-soft)]">
          {doneLessons === 0
            ? 'Je hebt nog geen les afgerond. Begin bij Salam! — die duurt twee minuten.'
            : `Je hebt ${doneLessons} lessen afgerond. Blijf komen: een korte dag telt net zo goed als een lange.`}
        </p>
        <Link to="/leren"><Button>Verder leren</Button></Link>
      </Card>
    </div>
  )
}
