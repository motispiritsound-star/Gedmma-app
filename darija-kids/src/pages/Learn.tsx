import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UNITS } from '../content/curriculum'
import { ACCENTS, Button, Card, Progress } from '../ui/kit'
import { Mascot } from '../ui/Mascot'
import { Quests } from '../ui/Quests'
import { BonusCard } from './Bonus'
import {
  dueWordIds, isDone, lessonBehindPaywall, lessonUnlocked, markTipSeen, nextLesson,
  progressOfUnit, unitBehindPaywall, unitUnlocked, useStore,
} from '../engine/store'
import { missingArabicVoice, sfx } from '../engine/audio'
import { useVoices } from '../ui/useVoices'
import { Khatims } from '../ui/Khatim'
import type { Lesson } from '../content/types'
import { useLang, useT } from '../i18n'
import { heeftArabisch, lessonTitle, unitSubtitle } from '../content/localise'

const KIND_ICON: Record<Lesson['kind'], string> = {
  woorden: '📗', zinnen: '💬', letters: '🔤', verhaal: '📖', toets: '🏅',
}

function Node({ lesson, index, accent }: { lesson: Lesson; index: number; accent: string }) {
  const t = useT()
  const lang = useLang()
  const state = useStore((s) => s)
  const title = lessonTitle(lesson, lang)
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
        <div className={`text-xs font-bold ${heeftArabisch(title) ? 'ar' : ''}`}>{title}</div>
        {record && (
          <Khatims stars={record.stars} size={12} label={t.learn.sterren(record.stars)} />
        )}
      </div>
    </div>
  )

  if (!open) {
    return (
      <li className="py-3" aria-disabled="true" title={t.learn.eersteVorige}>
        {body}
      </li>
    )
  }
  return (
    <li className="py-3">
      <Link to={`/les/${lesson.id}`} aria-label={t.learn.lesOpenen(title)}>{body}</Link>
    </li>
  )
}

export function Learn() {
  const t = useT()
  const lang = useLang()
  const state = useStore((s) => s)
  const due = dueWordIds(state).length
  const next = nextLesson(state)
  /** Niemand heeft nog iets afgerond: dit is de allereerste keer openen. */
  const eersteKeer = Object.keys(state.lessons).length === 0
  /** De eerste unit waarin een les dichtzit: daar hoort het aanbod te staan. */
  const slotBij = UNITS.findIndex((u) => u.lessons.some((l) => lessonBehindPaywall(l.id, state)))
  // Only worth saying once, and only on a device that actually lacks the voice.
  const installed = useVoices()
  const noArabicVoice = installed.length > 0 && missingArabicVoice() && !state.seenTips.includes('stem')

  /*
   * Een unit die af is, staat dicht.
   *
   * Het pad liet elke vrijgespeelde unit al zijn lessen zien. Voor wie het
   * abonnement heeft zijn dat vierenzeventig knopen onder elkaar, en gemeten
   * bij een leerling die tweederde ver is werd de bladzijde 10 560 pixels
   * lang: zijn volgende les stond op 8 285, dus tien schermen scrollen om te
   * zien waar hij was. Elke sessie opnieuw.
   *
   * Er gaat niets weg -- één tik op de kop zet een unit weer open, en de
   * voortgangsbalk en het percentage staan er nog gewoon. Wat weggaat is het
   * scrollen langs wat je al kent.
   *
   * Een unit die nog loopt of nog moet beginnen blijft open: zien wat eraan
   * komt is de reden om verder te willen, en dat geldt hier net zo goed als in
   * het woordenboek.
   *
   * De keuze blijft binnen deze sessie en wordt niet bewaard. Dat is met opzet:
   * wie morgen terugkomt hoort de app in zijn gewone stand te vinden, en niet
   * in de stand waarin hij hem gisteren even had gezet.
   */
  /*
   * Welke les dat eigenlijk is, waar "Ga verder" naartoe gaat.
   *
   * De knop zei alleen "Ga verder". Wat je verderging stond ergens beneden op
   * het pad, en voor wie een eind op weg is kostte dat drie schermen scrollen
   * om te zien waar hij was. Eén regel hier beantwoordt dat zonder scrollen.
   */
  const volgendeUnit = UNITS.find((u) => u.lessons.some((l) => l.id === next))
  const volgendeLes = volgendeUnit?.lessons.find((l) => l.id === next)

  /*
   * Welke units openstaan.
   *
   * De regel staat helemaal in `toont`: een unit is open tenzij hij af is, en
   * wat je zelf aantikt wint daarvan. Meer niet — en vooral: niets wordt
   * bewaard. `geopend` begint leeg bij elke keer dat je het pad opent, dus een
   * unit die je openklapte om nog eens naar je sterren te kijken staat de
   * volgende keer weer dicht.
   *
   * Dat betekent ook dat de unit die je net hebt afgemaakt dicht staat als je
   * daarna op het pad komt. Dat is de bedoeling: 100% en het aantal lessen
   * blijven staan, de sterren per les heb je een scherm eerder gezien, en
   * eronder staat meteen waar je verder gaat.
   */
  const [geopend, setGeopend] = useState<Record<string, boolean>>({})
  const toont = (id: string, af: boolean): boolean => geopend[id] ?? !af
  const wissel = (id: string, af: boolean): void => {
    sfx.nav()
    setGeopend((g) => ({ ...g, [id]: !toont(id, af) }))
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Card className="mb-6 flex flex-col items-center gap-4 overflow-hidden p-5 sm:flex-row">
        <Mascot mood={state.streak > 0 ? 'juich' : 'blij'} size={72} />
        <div className="min-w-0 flex-1 text-center sm:text-start">
          <h1 className="font-display text-xl font-extrabold sm:text-2xl">
            {state.name ? t.learn.welkomNaam(state.name) : t.learn.welkom}
          </h1>
          <p className="text-sm text-[var(--ink-soft)]">
            {/* Op dag één is er niets herhaald en niets om mee verder te gaan.
                "Alles herhaald. Op naar de volgende les." was het eerste wat
                een nieuwe gebruiker las, boven een knop die "Ga verder" zei. */}
            {eersteKeer ? t.learn.eersteKeer : due > 0 ? t.learn.wachten(due) : t.learn.allesHerhaald}
          </p>
          {volgendeUnit && volgendeLes && (
            <p className="mt-1.5 flex flex-wrap items-center justify-center gap-x-2 text-sm font-bold sm:justify-start">
              <span aria-hidden="true">{KIND_ICON[volgendeLes.kind]}</span>
              <span className={`text-[var(--ink)] ${heeftArabisch(lessonTitle(volgendeLes, lang)) ? 'ar' : ''}`}>{lessonTitle(volgendeLes, lang)}</span>
              <span className="font-semibold text-[var(--ink-soft)]">· {volgendeUnit.title}</span>
            </p>
          )}
        </div>
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto">
          <Link to={`/les/${next}`}>
            <Button className="w-full">{eersteKeer ? t.learn.beginnen : t.learn.gaVerder}</Button>
          </Link>
          {due > 0 && <Link to="/herhalen"><Button variant="secondary" className="w-full">{t.learn.herhalen}</Button></Link>}
        </div>
      </Card>

      <Quests />

      {/* Right under the missions, because the fifth one is a bonus round and
          this is where a child who has finished today's lesson ends up. */}
      <div className="mb-6"><BonusCard /></div>


      {noArabicVoice && (
        <Card className="mb-6 p-5">
          <div className="flex flex-wrap items-start gap-3">
            <span className="text-2xl" aria-hidden="true">🔈</span>
            <div className="min-w-0 grow basis-64">
              <p className="font-display font-extrabold">{t.learn.geenStem}</p>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">{t.learn.geenStemUitleg}</p>
            </div>
            <Button variant="ghost" onClick={() => markTipSeen('stem')}>{t.learn.begrepen}</Button>
          </div>
        </Card>
      )}

      {/*
        Het aanbod hoort op de plek waar iemand tegen het slot loopt, en één
        keer. Dat is nu de eerste unit waarin een les dichtzit — meestal het
        alfabet zelf — en niet meer de eerste unit die helemaal dicht is.
      */}
      <ol className="space-y-10">
        {UNITS.map((unit, ui) => {
          const open = unitUnlocked(unit.id, state)
          const paid = unitBehindPaywall(unit.id, state)
          const pct = progressOfUnit(unit.id, state)
          const af = pct >= 1
          const uit = toont(unit.id, af)
          const kop = (
            <>
              <div className="flex items-center gap-3">
                <span className="text-3xl" aria-hidden="true">{unit.emoji}</span>
                <div className="min-w-0 text-start">
                  {/* `flex-wrap`: bij grote letters past het pilletje niet
                      meer naast de titel en schoof het buiten beeld. */}
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-xl font-extrabold">
                      <span className="opacity-70">{ui + 1}.</span> {unit.title}
                    </h2>
                    <span className="rounded-full bg-night-950/15 px-2 py-0.5 text-[11px] font-bold">{unit.level}</span>
                  </div>
                  <p className="text-sm font-semibold opacity-80">{unitSubtitle(unit, lang)}</p>
                </div>
                {/* De Arabische naam blijft staan, ook bij een unit die je
                    kunt in- en uitklappen — het pijltje komt erachter, niet
                    in de plaats ervan. */}
                <span className="ar ms-auto hidden text-2xl font-bold opacity-70 sm:block">{unit.ar}</span>
                {open && (
                  <span className="shrink-0 text-xl font-bold opacity-70 sm:ms-0 ms-auto" aria-hidden="true">{uit ? '⌃' : '⌄'}</span>
                )}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <Progress value={pct} tone="zellige" className="h-2.5 bg-night-950/20" />
                <span className="shrink-0 text-xs font-bold">{Math.round(pct * 100)}%</span>
                {!uit && open && (
                  <span className="shrink-0 text-xs font-bold opacity-80">· {t.landing.lessenAantal(unit.lessons.length)}</span>
                )}
              </div>
            </>
          )
          const kopKlasse = `w-full rounded-3xl bg-gradient-to-r p-5 text-night-950 shadow-lg ${ACCENTS[unit.accent]} ${open ? '' : 'opacity-60 grayscale'}`
          return (
            <li key={unit.id}>
              {open ? (
                <button type="button" aria-expanded={uit} onClick={() => wissel(unit.id, af)} className={kopKlasse}>
                  {kop}
                </button>
              ) : (
                <div className={kopKlasse}>{kop}</div>
              )}

              {open && uit ? (
                <ul className="mt-4 flex flex-col items-center">
                  {unit.lessons.map((lesson, i) => (
                    <Node key={lesson.id} lesson={lesson} index={i} accent={ACCENTS[unit.accent]!} />
                  ))}
                </ul>
              ) : !open && !paid ? (
                <p className="mt-4 text-center text-sm text-[var(--ink-soft)]">{t.learn.unitSlot(ui)}</p>
              ) : null}

              {ui === slotBij && (
                <Card className="mt-4 flex flex-wrap items-center gap-3 p-5">
                  <span className="text-2xl" aria-hidden="true">🔑</span>
                  <p className="min-w-0 grow basis-48 font-display font-extrabold">{t.unlock.slotTitel}</p>
                  <Link to="/volledig"><Button>{t.unlock.slotKnop}</Button></Link>
                </Card>
              )}
            </li>
          )
        })}
      </ol>

      <Card className="mt-10 p-5 text-center">
        <p className="font-display text-lg font-extrabold">{t.learn.klaarMetPad}</p>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">{t.learn.klaarMetPadUitleg}</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Link to="/verhalen"><Button variant="secondary">📖 {t.nav.verhalen}</Button></Link>
          <Link to="/letters"><Button variant="secondary">🔤 {t.nav.letters}</Button></Link>
          <Link to="/spelen"><Button variant="secondary">🎮 {t.nav.spelen}</Button></Link>
        </div>
      </Card>
    </div>
  )
}
