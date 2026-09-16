import { useMemo, useState } from 'react'
import { LETTERS } from '../content/alphabet'
import { allWords } from '../content/lexicon'
import { ALL_SENTENCES } from '../content/sentences'
import { letterSpeech, spokenForm } from '../content/pronunciation'
import {
  arabicVoice, latinise, phoneticOf, say, sayLetter, sfx, voicePlan, voices,
} from '../engine/audio'
import { localeOf, useLang, useT } from '../i18n'
import { Card, SectionTitle } from '../ui/kit'

/**
 * The pronunciation sheet: everything the app can say, on one page.
 *
 * Nobody can hear a bug report that says "the letters sound wrong" — you have
 * to find out *which*. So this lists every letter, every word and every
 * sentence next to the exact text that goes to the speech engine, with a
 * button to hear it. Going through it takes ten minutes and turns "the
 * pronunciation is off" into a list of ids that can actually be fixed.
 *
 * It also says, at the top, which voice is doing the talking — because half
 * of what sounds wrong is a device reading Arabic with a French mouth, and
 * that is worth knowing before you file anything.
 *
 * Not part of the app a child sees: it is reachable while developing and in
 * the demo build, the same as the film and the history previews.
 */

type Row = { id: string; ar: string; tr: string; label: string; spoken: string; borrowed: string }

export function Speech() {
  const t = useT()
  const lang = useLang()
  const [tab, setTab] = useState<'letters' | 'woorden' | 'zinnen'>('letters')
  const [filter, setFilter] = useState('')

  const plan = voicePlan()
  const arabic = arabicVoice()
  const target = phoneticOf(plan.mode === 'geen' ? localeOf(lang) : plan.voice.lang)

  const rows: Row[] = useMemo(() => {
    if (tab === 'letters') {
      return LETTERS.map((l) => {
        const speech = letterSpeech(l.id, l.ar, l.name)
        return {
          id: l.id,
          ar: l.ar,
          tr: l.tr,
          label: l.name,
          spoken: speech.ar,
          borrowed: speech.latin[target] ?? speech.tr,
        }
      })
    }
    if (tab === 'woorden') {
      return allWords.map((w) => ({
        id: w.id,
        ar: w.ar,
        tr: w.tr,
        label: w.nl,
        spoken: spokenForm(w.ar),
        borrowed: latinise(w.tr, target),
      }))
    }
    return ALL_SENTENCES.map((z) => ({
      id: z.id,
      ar: z.ar,
      tr: z.tr,
      label: z.nl,
      spoken: spokenForm(z.ar),
      borrowed: latinise(z.tr, target),
    }))
  }, [tab, target])

  const shown = rows.filter((r) => {
    const needle = filter.trim().toLowerCase()
    if (!needle) return true
    return `${r.id} ${r.tr} ${r.label} ${r.ar}`.toLowerCase().includes(needle)
  })

  const speak = (row: Row) => {
    sfx.tap()
    if (tab === 'letters') {
      const letter = LETTERS.find((l) => l.id === row.id)
      if (letter) sayLetter(letter)
      return
    }
    say(row.ar, { tr: row.tr })
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <SectionTitle sub="Elke klank die de app kan maken, met de tekst die naar de stem gaat.">
        Uitspraak nakijken
      </SectionTitle>

      {/* Which mouth is talking. Half of what sounds wrong is this line. */}
      <Card className="mb-5 p-4 text-sm">
        <p>
          <strong className="font-display">Stem:</strong>{' '}
          {plan.mode === 'arabisch' && <>Arabisch — <code>{plan.voice.name}</code> ({plan.voice.lang})</>}
          {plan.mode === 'benadering' && (
            <>geleend — <code>{plan.voice.name}</code> ({plan.voice.lang}). Dit toestel heeft geen Arabische stem,
              dus alles hieronder is een benadering met de regels voor <code>{target}</code>.</>
          )}
          {plan.mode === 'geen' && <>geen. Dit toestel kan niets uitspreken.</>}
        </p>
        <p className="mt-1 text-[var(--ink-soft)]">
          {voices().length} stemmen op dit toestel, waarvan{' '}
          {voices().filter((v) => v.lang.toLowerCase().startsWith('ar')).length} Arabisch
          {arabic ? ` · gekozen: ${arabic.name}` : ''}
        </p>
      </Card>

      <div className="mb-4 flex flex-wrap gap-2">
        {(['letters', 'woorden', 'zinnen'] as const).map((key) => (
          <button
            key={key}
            onClick={() => { sfx.tap(); setTab(key) }}
            className={`rounded-full border-2 px-4 py-1.5 font-display text-sm font-extrabold ${
              tab === key ? 'border-zellige-500 bg-zellige-500/10 text-zellige-700 dark:text-zellige-300' : 'border-[var(--line)]'
            }`}
          >
            {key}
          </button>
        ))}
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="zoek…"
          aria-label="zoek"
          className="min-w-0 flex-1 rounded-full border-2 border-[var(--line)] bg-[var(--surface)] px-4 py-1.5 text-sm"
        />
      </div>

      <p className="mb-3 text-sm text-[var(--ink-soft)]">
        {shown.length} van {rows.length} · {t.lesson.luisterTitel}
      </p>

      <ul className="space-y-2">
        {shown.map((row) => (
          <li key={row.id}>
            <Card className="flex items-center gap-3 p-3">
              <button
                onClick={() => speak(row)}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-zellige-500 text-zellige-600 dark:text-zellige-300"
                aria-label={`spreek ${row.tr} uit`}
              >
                ▶
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="ar text-xl font-bold">{row.ar}</span>
                  <span className="font-display font-bold text-zellige-600 dark:text-zellige-300">{row.tr}</span>
                  <span className="text-sm text-[var(--ink-soft)]">{row.label}</span>
                </div>
                <div className="mt-1 grid gap-0.5 text-xs text-[var(--ink-faint,var(--ink-soft))]">
                  <span>naar een Arabische stem: <span className="ar font-bold">{row.spoken}</span></span>
                  <span>naar een geleende stem ({target}): <code>{row.borrowed}</code></span>
                </div>
              </div>
              <code className="shrink-0 text-[10px] text-[var(--ink-soft)]">{row.id}</code>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}
