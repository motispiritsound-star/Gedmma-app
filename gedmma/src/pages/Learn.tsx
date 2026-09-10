import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UNITS } from '../content/curriculum'
import { ACCENTS, Button, Card, Progress } from '../ui/kit'
import { Mascot } from '../ui/Mascot'
import {
  dueWordIds, isDone, lessonUnlocked, markTipSeen, nextLesson, progressOfUnit, unitUnlocked, useStore,
} from '../engine/store'
import { missingArabicVoice } from '../engine/audio'
import { useVoices } from '../ui/useVoices'
import type { Lesson } from '../content/types'

const KIND_ICON: Record<Lesson['kind'], string> = {
  woorden: '📗', zinnen: '💬', letters: '🔤', verhaal: '📖', toets: '🏅',
}

function Node({ lesson, index, accent }: { lesson: Lesson; index: number; accent: string }) {
  const state = useStore((s) => s)
  const done = isDone(lesson.id, state)
  const open = lessonUnlocked(lesson.id, state)
  const record = state.lessons[lesson.id]
  // A gentle zigzag, so the path reads as a road rather than a list.
  const offset = [0, 46, 68, 46, 0, -46, -68, -46][index % 8]!

  const body = (
    <div className="flex flex-col items-center gap-1.5" style={{ transform: `translateX(${offset}px)` }}>
      <motion.div
        whileHover={open ? { scale: 1.06 } : undefined}
        whileTap={open ? { scale: 0.94 } : undefined}
        className={`grid h-[68px] w-[68px] place-items-center rounded-full border-4 text-2xl shadow-md ${
          done
            ? `border-white/60 bg-gradient-to-br ${accent} text-night-950`
            : open
              ? 'border-[var(--line)] bg-[var(--surface-raised)]'
              : 'border-[var(--line)] bg-[var(--surface-sunken)] opacity-55'
        }`}
      >
        <span aria-hidden="true">{open ? KIND_ICON[lesson.kind] : '🔒'}</span>
      </motion.div>
      <div className="text-center">
        <div className="text-xs font-bold">{lesson.title}</div>
        {record && (
          <div className="text-[11px] text-saffron-500" aria-label={`${record.stars} van 3 sterren`}>
            {'★'.repeat(record.stars)}{'☆'.repeat(3 - record.stars)}
          </div>
        )}
      </div>
    </div>
  )

  if (!open) {
    return (
      <li className="py-3" aria-disabled="true" title="Rond eerst de vorige les af">
        {body}
      </li>
    )
  }
  return (
    <li className="py-3">
      <Link to={`/les/${lesson.id}`} aria-label={`${lesson.title} openen`}>{body}</Link>
    </li>
  )
}

export function Learn() {
  const state = useStore((s) => s)
  const due = dueWordIds(state).length
  const next = nextLesson(state)
  // Only worth saying once, and only on a device that actually lacks the voice.
  const installed = useVoices()
  const noArabicVoice = installed.length > 0 && missingArabicVoice() && !state.seenTips.includes('stem')

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Card className="mb-6 flex flex-col items-center gap-4 overflow-hidden p-5 sm:flex-row">
        <Mascot mood={state.streak > 0 ? 'juich' : 'blij'} size={72} />
        <div className="min-w-0 flex-1 text-center sm:text-start">
          <h1 className="font-display text-xl font-extrabold sm:text-2xl">
            {state.name ? `Ahlan, ${state.name}!` : 'Ahlan! Klaar voor Darija?'}
          </h1>
          <p className="text-sm text-[var(--ink-soft)]">
            {due > 0
              ? `${due} ${due === 1 ? 'woord wacht' : 'woorden wachten'} op een herhaling.`
              : 'Alles herhaald. Op naar de volgende les.'}
          </p>
        </div>
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto">
          <Link to={`/les/${next}`}><Button className="w-full">Ga verder</Button></Link>
          {due > 0 && <Link to="/herhalen"><Button variant="secondary" className="w-full">Herhalen</Button></Link>}
        </div>
      </Card>

      {noArabicVoice && (
        <Card className="mb-6 p-5">
          <div className="flex flex-wrap items-start gap-3">
            <span className="text-2xl" aria-hidden="true">🔈</span>
            <div className="min-w-0 flex-1">
              <p className="font-display font-extrabold">Dit apparaat heeft geen Arabische stem</p>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">
                Gedmma leest de woorden nu voor in de Latijnse schrijfwijze met een Franse stem — herkenbaar, maar
                geen echt Marokkaans. Een Arabische stem installeren kan meestal via de instellingen van je apparaat,
                bij spraak of tekst-naar-spraak.
              </p>
            </div>
            <Button variant="ghost" onClick={() => markTipSeen('stem')}>Begrepen</Button>
          </div>
        </Card>
      )}

      <ol className="space-y-10">
        {UNITS.map((unit, ui) => {
          const open = unitUnlocked(unit.id, state)
          const pct = progressOfUnit(unit.id, state)
          return (
            <li key={unit.id}>
              <div className={`rounded-3xl bg-gradient-to-r p-5 text-night-950 shadow-lg ${ACCENTS[unit.accent]} ${open ? '' : 'opacity-60 grayscale'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl" aria-hidden="true">{unit.emoji}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-display text-xl font-extrabold">
                        <span className="opacity-70">{ui + 1}.</span> {unit.title}
                      </h2>
                      <span className="rounded-full bg-night-950/15 px-2 py-0.5 text-[11px] font-bold">{unit.level}</span>
                    </div>
                    <p className="text-sm font-semibold opacity-80">{unit.subtitle}</p>
                  </div>
                  <span className="ar ms-auto hidden text-2xl font-bold opacity-70 sm:block">{unit.ar}</span>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <Progress value={pct} tone="zellige" className="h-2.5 bg-night-950/20" />
                  <span className="shrink-0 text-xs font-bold">{Math.round(pct * 100)}%</span>
                </div>
              </div>

              {open ? (
                <ul className="mt-4 flex flex-col items-center">
                  {unit.lessons.map((lesson, i) => (
                    <Node key={lesson.id} lesson={lesson} index={i} accent={ACCENTS[unit.accent]!} />
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-center text-sm text-[var(--ink-soft)]">
                  🔒 Maak unit {ui} af om deze te openen.
                </p>
              )}
            </li>
          )
        })}
      </ol>

      <Card className="mt-10 p-5 text-center">
        <p className="font-display text-lg font-extrabold">Klaar met het pad?</p>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">
          Ga verder met de verhalen, de letters en de spelletjes — daar komt alles terug.
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Link to="/verhalen"><Button variant="secondary">📖 Verhalen</Button></Link>
          <Link to="/letters"><Button variant="secondary">🔤 Letters</Button></Link>
          <Link to="/spelen"><Button variant="secondary">🎮 Spelen</Button></Link>
        </div>
      </Card>
    </div>
  )
}
