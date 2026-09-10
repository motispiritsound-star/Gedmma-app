import { Link, NavLink } from 'react-router-dom'
import { heartsNow, levelOf, MAX_HEARTS, msUntilNextHeart, useStore, xpToday } from '../engine/store'
import { Progress } from './kit'

const LINKS = [
  { to: '/leren', label: 'Leren' },
  { to: '/herhalen', label: 'Herhalen' },
  { to: '/woorden', label: 'Woorden' },
  { to: '/letters', label: 'Letters' },
  { to: '/verhalen', label: 'Verhalen' },
  { to: '/spelen', label: 'Spelen' },
  { to: '/profiel', label: 'Jij' },
]

function heartHint(ms: number): string {
  if (ms <= 0) return 'Alle hartjes vol'
  const min = Math.ceil(ms / 60_000)
  return `Volgend hartje over ${min} min`
}

export function TopBar() {
  const state = useStore((s) => s)
  const hearts = heartsNow(state)
  const { level, into, span } = levelOf(state.xp)
  const goal = state.settings.dailyGoal
  const done = xpToday(state)

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--surface)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-extrabold">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-saffron-400 to-terra-500 text-night-950">ݣ</span>
          <span className="hidden sm:inline">Gedmma</span>
        </Link>

        <nav className="ms-2 hidden flex-1 items-center gap-1 sm:flex" aria-label="Onderdelen">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `rounded-xl px-3 py-1.5 text-sm font-bold transition ${isActive ? 'bg-[var(--surface-sunken)] text-zellige-600 dark:text-zellige-300' : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2.5 text-sm font-bold">
          <span title={`Niveau ${level}`} className="hidden items-center gap-1 sm:flex">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-zellige-500/15 text-zellige-600 dark:text-zellige-300">{level}</span>
          </span>
          <span title={`${state.streak} dagen op rij`} className="flex items-center gap-1">
            <span aria-hidden="true">🔥</span>{state.streak}
          </span>
          <span title="Edelstenen" className="flex items-center gap-1">
            <span aria-hidden="true">💎</span>{state.gems}
          </span>
          {state.settings.hearts && (
            <span title={heartHint(msUntilNextHeart(state))} className="flex items-center gap-1">
              <span aria-hidden="true">{hearts > 0 ? '❤️' : '🖤'}</span>{hearts}/{MAX_HEARTS}
            </span>
          )}
        </div>
      </div>

      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 pb-2">
        <Progress value={Math.min(1, done / goal)} tone="saffron" className="h-2" />
        <span className="shrink-0 text-xs font-bold text-[var(--ink-soft)]">
          {done}/{goal} XP · niveau {level} ({into}/{span})
        </span>
      </div>
    </header>
  )
}
