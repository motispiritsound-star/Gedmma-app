import { useState } from 'react'
import { LANGS, useT, type Lang } from '../i18n'
import { sfx } from '../engine/audio'
import { FREE_LESSONS, planOf, TRIAL_DAYS } from '../engine/billing'
import { ACCENTEN, ACCENTKLEUR, AVATARS, setSetting, setState, useStore } from '../engine/store'
import { Button, Sheet } from './kit'
import { Mascot } from './Mascot'

/**
 * De eerste minuut, en de enige kans erop.
 *
 * Hier stond één scherm: kies een taal, lees wat het kost, begin. Daarna stond
 * een kind in een app die er voor iedereen hetzelfde uitzag, met een uil als
 * avatar die het niet gekozen had en "Leerling" waar zijn naam hoort. De naam
 * zat in Instellingen en de avatar in Profiel -- twee schermen waar je pas
 * komt als je al weet dat ze bestaan.
 *
 * Nu drie stappen, en ze zijn alle drie over te slaan door door te klikken:
 *
 *   1. Welke taal versta je?
 *   2. Wie ben jij -- een naam en een dier.
 *   3. Hoe lees je mee -- Arabisch schrift, klanken, of allebei.
 *   4. Hoe ziet het eruit -- een kleur en licht of donker.
 *
 * Wat hier gezet wordt zit meteen in de staat, dus wie halverwege afhaakt
 * houdt wat hij al koos. Alleen `langPicked` gaat aan het eind om: dat is de
 * vlag die dit scherm sluit, en hij hoort pas om als iemand echt klaar is.
 *
 * De prijs blijft op de laatste stap staan. Een ouder hoort te weten wat de
 * app kost voordat het eerste lesje begint, niet op het moment dat het pad
 * tegen een slot aan loopt.
 */

export function Welcome() {
  const t = useT()
  const picked = useStore((s) => s.langPicked)
  const lang = useStore((s) => s.settings.lang)
  const naam = useStore((s) => s.name)
  const avatar = useStore((s) => s.avatar)
  const accent = useStore((s) => s.settings.accent)
  const theme = useStore((s) => s.settings.theme)
  const schrift = useStore((s) => s.settings.showScript)
  const schriftTranslit = useStore((s) => s.settings.showTranslit)
  const [stap, setStap] = useState(0)
  if (picked) return null

  const verder = () => { sfx.nav(); setStap((n) => n + 1) }
  const terug = () => { sfx.tap(); setStap((n) => n - 1) }

  return (
    <Sheet open labelledBy="welcome-title">
      <div className="text-center">
        <Mascot mood="juich" size={stap === 0 ? 90 : 64} className="mx-auto" />

        {/* Drie bolletjes, zodat je ziet dat het er drie zijn en niet tien. */}
        <div className="mt-2 flex justify-center gap-1.5" aria-hidden="true">
          {[0, 1, 2, 3].map((n) => (
            <span
              key={n}
              className={`h-1.5 rounded-full transition-all ${n === stap ? 'w-5 bg-[var(--accent-500)]' : 'w-1.5 bg-[var(--line)]'}`}
            />
          ))}
        </div>

        {stap === 0 && (
          <>
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

            <Button className="mt-5 w-full" onClick={verder}>{t.common.verder}</Button>
          </>
        )}

        {stap === 1 && (
          <>
            <h2 id="welcome-title" className="mt-2 font-display text-2xl font-extrabold">{t.welcome.wieTitel}</h2>
            <p className="mt-2 text-[var(--ink-soft)]">{t.welcome.wieBody}</p>

            <input
              value={naam}
              onChange={(e) => setState({ name: e.target.value.slice(0, 24) })}
              placeholder={t.settings.naamPlaceholder}
              aria-label={t.settings.naam}
              autoComplete="given-name"
              enterKeyHint="next"
              className="mx-auto mt-5 block w-full max-w-xs rounded-xl border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-3 text-center text-lg outline-none focus:border-[var(--accent-500)]"
            />

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  onClick={() => { sfx.tap(); setState({ avatar: a }) }}
                  aria-pressed={avatar === a}
                  aria-label={t.profile.kies(a)}
                  className={`grid h-12 w-12 place-items-center rounded-2xl border-2 text-2xl ${
                    avatar === a ? 'border-[var(--accent-500)] bg-[var(--accent-500)]/10' : 'border-[var(--line)]'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>

            <div className="mt-5 flex gap-2">
              <Button variant="secondary" className="w-28" onClick={terug}>{t.common.terug}</Button>
              <Button className="flex-1" onClick={verder}>{t.common.verder}</Button>
            </div>
          </>
        )}

        {/*
          De enige keuze hier die het leren zelf verandert.
          
          `showScript` en `showTranslit` bepalen wat er op elk woordkaartje en
          in elke oefening staat -- Arabisch schrift, de klanken in ons
          alfabet, of allebei. Een ouder weet meteen wat zijn kind kan lezen,
          dus deze vraag is op minuut nul te beantwoorden.
          
          Het dagdoel staat hier met opzet niet bij. Wat "30 XP per dag"
          betekent weet je pas na een week; dat vragen vóór de eerste les is
          een keuze zonder informatie. Die blijft in Instellingen.
        */}
        {stap === 2 && (
          <>
            <h2 id="welcome-title" className="mt-2 font-display text-2xl font-extrabold">{t.welcome.schriftTitel}</h2>
            <p className="mt-2 text-[var(--ink-soft)]">{t.welcome.schriftBody}</p>

            <div className="mt-5 grid gap-2">
              {([
                ['allebei', true, true, t.welcome.schriftKeuze.allebei, 'الدار · ddar'],
                ['arabisch', true, false, t.welcome.schriftKeuze.arabisch, 'الدار'],
                ['klanken', false, true, t.welcome.schriftKeuze.klanken, 'ddar'],
              ] as const).map(([id, script, translit, label, voorbeeld]) => {
                const aan = schrift === script && schriftTranslit === translit
                return (
                  <button
                    key={id}
                    onClick={() => { sfx.tap(); setSetting('showScript', script); setSetting('showTranslit', translit) }}
                    aria-pressed={aan}
                    className={`flex min-h-14 items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3 text-start ${
                      aan ? 'border-[var(--accent-500)] bg-[var(--accent-500)]/10' : 'border-[var(--line)]'
                    }`}
                  >
                    <span className="font-display font-extrabold">{label}</span>
                    <span className="ar text-lg text-[var(--ink-soft)]" aria-hidden="true">{voorbeeld}</span>
                  </button>
                )
              })}
            </div>

            <div className="mt-5 flex gap-2">
              <Button variant="secondary" className="w-28" onClick={terug}>{t.common.terug}</Button>
              <Button className="flex-1" onClick={verder}>{t.common.verder}</Button>
            </div>
          </>
        )}

        {stap === 3 && (
          <>
            <h2 id="welcome-title" className="mt-2 font-display text-2xl font-extrabold">{t.welcome.kleurTitel}</h2>
            <p className="mt-2 text-[var(--ink-soft)]">{t.welcome.kleurBody}</p>

            <div className="mt-5 flex justify-center gap-3">
              {ACCENTEN.map((a) => (
                <button
                  key={a}
                  onClick={() => { sfx.tap(); setSetting('accent', a) }}
                  aria-pressed={accent === a}
                  aria-label={t.settings.accenten[a]}
                  className={`h-12 w-12 rounded-full border-4 ${accent === a ? 'border-[var(--ink)]' : 'border-transparent'}`}
                  style={{ backgroundColor: ACCENTKLEUR[a] }}
                />
              ))}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              {([['light', t.settings.licht], ['dark', t.settings.donker], ['system', t.settings.systeem]] as const).map(([w, label]) => (
                <button
                  key={w}
                  onClick={() => { sfx.tap(); setSetting('theme', w) }}
                  aria-pressed={theme === w}
                  className={`min-h-11 rounded-xl border-2 px-2 py-2 text-sm font-bold ${
                    theme === w ? 'border-[var(--accent-500)] bg-[var(--accent-500)]/10' : 'border-[var(--line)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-2xl bg-[var(--surface-sunken)] p-4 text-start">
              <p className="text-sm font-bold">🎁 {t.welcome.plan(TRIAL_DAYS, planOf('jaar').perMonth)}</p>
              <p className="mt-1 text-xs text-[var(--ink-soft)]">{t.welcome.gratisDeel(FREE_LESSONS)}</p>
            </div>

            <div className="mt-4 flex gap-2">
              <Button variant="secondary" className="w-28" onClick={terug}>{t.common.terug}</Button>
              <Button className="flex-1" onClick={() => setState({ langPicked: true })}>{t.welcome.knop}</Button>
            </div>
          </>
        )}
      </div>
    </Sheet>
  )
}
