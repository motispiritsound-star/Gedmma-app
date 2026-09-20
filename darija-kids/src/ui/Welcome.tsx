import { LANGS, useT, type Lang } from '../i18n'
import { sfx } from '../engine/audio'
import { FREE_LESSONS, planOf, TRIAL_DAYS } from '../engine/billing'
import { setSetting, setState, useStore } from '../engine/store'
import { Button, Sheet } from './kit'
import { Mascot } from './Mascot'

/**
 * Shown once, before anything else: which language do you learn in?
 *
 * The browser's own language is already selected, so a French child sees
 * French straight away and only has to confirm. The price is on this screen
 * too, in one line: a parent should know what the app costs before the first
 * lesson, not at the moment the path runs into a lock.
 */
export function Welcome() {
  const t = useT()
  const picked = useStore((s) => s.langPicked)
  const lang = useStore((s) => s.settings.lang)
  if (picked) return null

  return (
    <Sheet open labelledBy="welcome-title">
      <div className="text-center">
        <Mascot mood="juich" size={90} className="mx-auto" />
        <h2 id="welcome-title" className="mt-2 font-display text-2xl font-extrabold">{t.welcome.titel}</h2>
        <p className="mt-2 text-[var(--ink-soft)]">{t.welcome.body}</p>

        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {LANGS.map((l) => (
            <li key={l.code}>
              <button
                onClick={() => { sfx.nav(); setSetting('lang', l.code as Lang) }}
                aria-pressed={lang === l.code}
                className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-start ${
                  lang === l.code ? 'border-zellige-500 bg-zellige-500/10' : 'border-[var(--line)]'
                }`}
              >
                <span className="font-display text-2xl font-extrabold" aria-hidden="true">{l.badge}</span>
                <span className="min-w-0">
                  <span className="block font-display font-extrabold">{l.name}</span>
                  <span className="block text-xs text-[var(--ink-soft)]">{l.where}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-5 rounded-2xl bg-[var(--surface-sunken)] p-4 text-start">
          <p className="text-sm font-bold">🎁 {t.welcome.plan(TRIAL_DAYS, planOf('jaar').perMonth)}</p>
          <p className="mt-1 text-xs text-[var(--ink-soft)]">{t.welcome.gratisDeel(FREE_LESSONS)}</p>
        </div>

        <Button className="mt-4 w-full" onClick={() => setState({ langPicked: true })}>{t.welcome.knop}</Button>
      </div>
    </Sheet>
  )
}
