import { Link, NavLink } from 'react-router-dom'
import { heartsNow, levelOf, MAX_HEARTS, msUntilNextHeart, useStore, xpToday } from '../engine/store'
import { sfx } from '../engine/audio'
import { Progress } from './kit'
import { useT } from '../i18n'

const LINKS = [
  { to: '/leren', key: 'leren' },
  { to: '/herhalen', key: 'herhalen' },
  { to: '/woorden', key: 'woorden' },
  { to: '/letters', key: 'letters' },
  { to: '/verhalen', key: 'verhalen' },
  { to: '/spelen', key: 'spelen' },
  { to: '/profiel', key: 'jij' },
] as const

export function TopBar() {
  const t = useT()
  const state = useStore((s) => s)
  const heartHint = (ms: number) =>
    ms <= 0 ? t.topbar.hartjesVol : t.topbar.volgendHartje(Math.ceil(ms / 60_000))
  const hearts = heartsNow(state)
  const { level, into, span } = levelOf(state.xp)
  const goal = state.settings.dailyGoal
  const done = xpToday(state)

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--surface)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5">
        <Link to="/" onClick={() => sfx.nav()} className="flex shrink-0 items-center gap-2 font-display text-xl font-extrabold">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-saffron-400 to-terra-500 text-night-950">د</span>
          <span className="hidden sm:inline">Darijaforkids</span>
        </Link>

        {/* The five labels are short in Dutch and long in Spanish, and at
            tablet width the row used to push the counters off the screen —
            the whole page then scrolled sideways. The nav is the part that
            gives: it shrinks, and slides if it has to. */}
        <nav
          className="ms-2 hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto sm:flex [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label={t.nav.onderdelen}
        >
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => sfx.nav()}
              className={({ isActive }) =>
                `shrink-0 whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-bold transition ${isActive ? 'bg-[var(--surface-sunken)] text-zellige-600 dark:text-zellige-300' : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'}`
              }
            >
              {t.nav[l.key]}
            </NavLink>
          ))}
        </nav>

        <div className="ms-auto flex shrink-0 items-center gap-2.5 text-sm font-bold">
          <span title={`${t.common.niveau} ${level}`} className="hidden items-center gap-1 sm:flex">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-zellige-500/15 text-zellige-600 dark:text-zellige-300">{level}</span>
          </span>
          <span title={t.topbar.dagenOpRij(state.streak)} className="flex items-center gap-1">
            <span aria-hidden="true">🔥</span>{state.streak}
          </span>
          <span title={t.topbar.edelstenen} className="flex items-center gap-1">
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
          {t.topbar.voortgang(done, goal, level, into, span)}
        </span>
      </div>
    </header>
  )
}
