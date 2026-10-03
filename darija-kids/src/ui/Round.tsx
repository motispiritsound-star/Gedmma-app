import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Exercise, Verdict } from '../engine/exercises'
import { isLetterExercise, isScribeExercise, isSentenceExercise } from '../engine/exercises'
import type { Grade } from '../engine/srs'
import { word } from '../content/lexicon'
import { letter } from '../content/alphabet'
import { sentence } from '../content/sentences'
import { sentenceMeaning } from '../content/localise'
import {
  bumpQuest, countSentence, gradeExtra, gradeWord, heartsNow, kanHartenKopen, koopHarten,
  letterKey, loseHeart, msUntilNextHeart, PRIJS_HARTEN, scoreCorrect, sentenceKey, useStore,
} from '../engine/store'
import { useNavigate } from 'react-router-dom'
import { opTerug } from '../engine/terug'
import { sfx } from '../engine/audio'
import { Button, Sheet } from './kit'
import { Mascot } from './Mascot'
import { ExerciseView } from './exercises'
import { useRustig } from './rustig'
import { SpeakButton, useMeaning, useNote } from './WordChip'
import { useLang, useT } from '../i18n'

/**
 * The thing that runs a list of exercises: progress bar, hearts, the feedback
 * bar, and putting a wrong answer back at the end of the queue. Lessons,
 * checkpoints and review sessions are all the same runner with other input.
 *
 * Rewards are paid on the spot. XP and gems land the moment an answer is
 * right, float up off the card so they are impossible to miss, and the run
 * counter in the corner climbs with them — a child should be able to see what
 * an answer was worth without waiting for the end of the lesson.
 */

const GRADE_OF: Record<Verdict, Grade> = { goed: 'goed', bijna: 'moeizaam', fout: 'fout' }

export interface RoundResult {
  score: number
  asked: number
  perfect: boolean
  seconds: number
  /** XP already paid out during the round, answer by answer. */
  xp: number
  /** Gems earned from runs of right answers. */
  gems: number
  /** The longest run of right answers in a row. */
  bestCombo: number
}

/** What the feedback bar shows, whatever kind of thing was being asked. */
interface Subject {
  ar: string
  tr: string
  meaning: string
  note?: string
}

/** One floating reward, on its way up off the card. */
interface Burst {
  id: number
  xp: number
  gems: number
}

/**
 * De grond waar de les op ligt.
 *
 * Op een telefoon van 390 bij 844 stond er boven de vraag bijna driehonderd
 * pixels niets. Dat is geen rust, dat is een gat: de les begon nergens en de
 * kaart hing in de lucht.
 *
 * Hier ligt nu een tegelvloer in. Dezelfde rozet die vóór elke vraag staat en
 * om de afspeelknop -- twee vierkanten onder 45 graden, de vorm uit
 * `Medaillon` -- maar dan als raster, zo flauw dat je hem eerder voelt dan
 * ziet. Nagerekend op de krapste plek, met de eerste (te sterke) waarde van
 * tien procent als bovengrens: de hintregel in `--ink-soft` boven een lijn van
 * het raster haalt dan 5,94 op 1 in de lichte stand en 6,11 in de donkere,
 * waar 4,5 de norm is. Op de waarden die er nu staan is er dus ruimte over.
 *
 * En hij schuift mee. Drie pixels per vraag, met een trage veer: de grond komt
 * langzaam naar je toe terwijl je door de les loopt, en dat is het enige in dit
 * scherm dat zegt dat je ergens heen gaat. Bij "rustig" staat hij stil -- de
 * vloer blijft, de reis niet.
 *
 * Een `<pattern>` in SVG en niet de klasse `.zellige` uit index.css: die tekent
 * zijn stippen met `color-mix()`, en dat kent de WebView van Android 7 niet.
 * Daar zou hier dan niets staan, zonder dat iemand het merkt.
 */
function Zelligegrond({ stap, rustig }: { stap: number; rustig: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: -1 }} aria-hidden="true">
      <motion.svg
        /* Hoogte expliciet, niet via `-bottom-24`: een `svg` is een vervangen
           element, en dan telt `bottom` niet mee zodra de hoogte op `auto`
           staat -- hij viel terug op de 150 pixels die SVG als eigen maat
           heeft, en dan staat er alleen bovenaan een strookje tegels. */
        className="absolute inset-x-0 -top-24 h-[calc(100%+12rem)] w-full text-khatim-500 dark:text-zellige-300"
        animate={{ y: rustig ? 0 : -Math.min(stap, 24) * 3 }}
        transition={{ type: 'spring', stiffness: 60, damping: 20 }}
      >
        <defs>
          {/* Op tien procent met een lijn van anderhalf werd dit behang: op de
              schermafdruk las je het raster eerder dan de vraag. En de twee
              standen hebben niet dezelfde waarde nodig -- donkergroen op room
              springt eruit waar lichtgroen op nachtblauw wegvalt, dus de
              donkere stand krijgt bijna het dubbele. */}
          <pattern id="les-zellige" width="48" height="48" patternUnits="userSpaceOnUse">
            <g fill="none" stroke="currentColor" strokeWidth="1" className="opacity-[0.045] dark:opacity-[0.08]">
              <rect x="10" y="10" width="28" height="28" rx="6" />
              <rect x="10" y="10" width="28" height="28" rx="6" transform="rotate(45 24 24)" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#les-zellige)" />
      </motion.svg>
    </div>
  )
}

/**
 * De balk boven de les.
 *
 * `Progress` uit kit.tsx tekende hier een gladde staaf, en die zei twee dingen
 * niet die een kind op dit scherm wil weten: hoevéél vragen er nog komen, en of
 * het antwoord dat het net gaf al geteld is.
 *
 * Dus is het een rij tegels geworden. Eén vakje per vraag, met een voeg ertussen
 * in de kleur van het papier -- dat is wat zellige is, en het is hier geen
 * versiering maar de telling: je ziet in één oogopslag dat er nog zes komen.
 * En de vulling schuift al op het moment dat je goed antwoordt, niet pas als je
 * op Verder drukt; dat is het verschil tussen een balk die meeleeft en een balk
 * die bijhoudt.
 *
 * Erop loopt het dier dat het kind zelf koos, op zijn eigen kleur. Dat is de
 * enige plek in de hele les waar die keuze terugkomt, en hij dóet daar iets:
 * hij staat waar jij bent.
 *
 * Het randje eromheen is `--ink` en geen tweede accenttint, want het bolletje
 * hangt precies op de naad en moet op allebei de helften te zien zijn. Het
 * vlak zelf haalt dat niet: saffraan op de lichte baan is 1,83 op 1 en op de
 * groene vulling 2,35 -- allebei onder de 3. De inktrand haalt er 15 op de
 * baan en 3,5 op de vulling, en die draagt dus de vorm.
 *
 * `mint-700` in plaats van `mint-500`: op de lichte baan (#f4ece1) haalde de
 * oude vulling 1,96 op 1, en de norm voor een grafisch element is 3. Nu 4,31,
 * en in de donkere stand haalt `mint-400` op #080c17 er 11,1.
 */
function Lesbalk({ waarde, stappen, vonnis, rustig, avatar, label }: {
  waarde: number
  stappen: number
  vonnis: Verdict | null
  rustig: boolean
  avatar: string
  label: string
}) {
  const deel = Math.max(0, Math.min(1, waarde))
  const pct = deel * 100
  const sprong = vonnis === null ? { y: 0 } : vonnis === 'fout' ? { y: [0, 4, 0] } : { y: [0, -7, 0] }
  return (
    <div
      className="relative h-3.5 min-w-0 flex-1"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={stappen}
      aria-valuenow={Math.round(deel * stappen)}
      aria-label={label}
    >
      <div className="h-full w-full overflow-hidden rounded-full bg-[var(--surface-sunken)] shadow-[inset_0_2px_3px_rgba(84,56,24,0.18)] dark:shadow-[inset_0_2px_3px_rgba(0,0,0,0.7)]">
        <motion.div
          className="h-full rounded-full bg-mint-700 dark:bg-mint-400"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 180, damping: 24 }}
        />
      </div>
      {/* De voegen tussen de tegels. Geen informatie die je moet kúnnen lezen —
          de balk zelf zegt hoe ver je bent — maar wel het ritme waarmee je ziet
          dat er nog iets komt. */}
      <div className="pointer-events-none absolute inset-0 flex overflow-hidden rounded-full" aria-hidden="true">
        {Array.from({ length: Math.max(0, stappen - 1) }, (_, i) => (
          <span key={i} className="flex-1 border-e border-[var(--surface)]" />
        ))}
        <span className="flex-1" />
      </div>
      {/*
        Het middelpunt loopt van 14 tot breedte-min-14, niet van 0 tot 100%:
        anders hangt het bolletje bij de eerste vraag half naast de balk, tegen
        het kruisje aan.
      */}
      <div
        className="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ left: `calc(${pct}% + ${(14 - pct * 0.28).toFixed(2)}px)` }}
      >
        <motion.span
          aria-hidden="true"
          /*
            Twee randen: inkt naar binnen, papier naar buiten.

            De inktrand haalt tegen de baan 15,13 in de lichte stand en 17,17
            in de donkere, dus daar is hij in orde. Maar dit bolletje hangt per
            definitie op de naad tussen gelopen en nog-te-gaan, en aan de
            groene kant klopte het niet: in de donkere stand is `--ink` #f3f0ea
            en de vulling mint-400, en dat is 1,53 op 1. Het accentvlak zelf
            haalt daar 1,23 bij saffraan tot 2,02 bij terracotta, waar 3 de
            norm is. De schijf verdween niet, maar de rand die hem zijn vorm
            geeft was aan die kant niet te zien.

            `ring-2 ring-[var(--surface)]`: papier tegen mint-700 is 4,83 in
            het licht en tegen mint-400 10,72 in het donker. Dan heeft de
            schijf in beide standen aan beide kanten een rand boven de norm.
          */
          className="grid h-7 w-7 place-items-center rounded-full border-2 border-[var(--ink)] bg-[var(--accent-500)] text-base ring-2 ring-[var(--surface)] shadow-[0_2px_4px_-1px_rgba(84,56,24,0.5)]"
          animate={rustig ? { y: 0 } : sprong}
          transition={{ duration: 0.34 }}
        >
          {avatar}
        </motion.span>
      </div>
    </div>
  )
}

export function RoundRunner({
  exercises, onFinish, onQuit, useHearts = true, quitLabel, review = false, quiz = false,
}: {
  exercises: Exercise[]
  onFinish: (result: RoundResult) => void
  onQuit: () => void
  useHearts?: boolean
  /** Defaults to the “stop this lesson?” wording. */
  quitLabel?: string
  /** A review round: right answers also count towards the repetition mission. */
  review?: boolean
  /** A checkpoint: drums at the start, and a pulse under every question. */
  quiz?: boolean
}) {
  const t = useT()
  const lang = useLang()
  const state = useStore((s) => s)
  const meaning = useMeaning()
  const note = useNote()
  const rustig = useRustig()
  const heartsOn = useHearts && state.settings.hearts
  const [queue, setQueue] = useState<Exercise[]>(exercises)
  const [index, setIndex] = useState(0)
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [detail, setDetail] = useState('')
  const [quit, setQuit] = useState(false)

  /*
   * De terugknop van Android stelt dezelfde vraag als het kruisje.
   *
   * Zonder dit liep een veeg vanaf de rand gewoon de les uit -- geen vraag,
   * geen weg terug naar waar je was. Het kruisje rechtsboven vraagt het wél,
   * en dat is niet voor niets: halverwege weglopen is het enige wat in deze
   * app iets kost.
   *
   * Staat de vraag al open, dan doet deze luisteraar niets en sluit het paneel
   * zichzelf -- `Sheet` hangt dan zijn eigen luisteraar op, en die komt na
   * deze. Vandaar de ref: een gewone `quit` zou hier de waarde van de eerste
   * tekening vasthouden.
   */
  const vraagStaat = useRef(false)
  vraagStaat.current = quit
  useEffect(() => opTerug(() => { if (!vraagStaat.current) { sfx.back(); setQuit(true) } }), [])
  // How many right in a row: the sound climbs with it, the counter shows it,
  // and a mistake resets both.
  const [combo, setCombo] = useState(0)
  const [burst, setBurst] = useState<Burst | null>(null)
  const finishRef = useRef(() => {})
  // Every burst needs its own key, or answering the same card twice would
  // reuse the element and the animation would not replay.
  const burstId = useRef(0)
  // One step per card. A teaching card has no feedback bar to sit behind, so
  // two quick taps used to move two places at once — and a round that stepped
  // past its own end simply stopped, with nothing left to press.
  const stepping = useRef(false)
  const tally = useRef({ right: 0, asked: 0, perfect: true, start: Date.now(), xp: 0, gems: 0, best: 0 })

  // The checkpoint announces itself, and then keeps time. The pulse speeds up
  // towards the end, which is the whole difference between a list of questions
  // and something that feels like it is running out.
  useEffect(() => {
    if (quiz) sfx.quizStart()
  }, [quiz])

  useEffect(() => {
    if (quiz && index > 0) sfx.quizTick(index, queue.length)
  }, [quiz, index, queue.length])

  useEffect(() => {
    stepping.current = false
  }, [index])

  const current = queue[index]
  const hearts = heartsNow(state)

  // A round that has run out of cards is a finished round, whatever put it
  // there. Better to hand over the score than to sit on a loading line.
  useEffect(() => {
    if (!current && queue.length > 0) finishRef.current()
  }, [current, queue.length])

  if (heartsOn && hearts <= 0) return <HartjesOp onQuit={onQuit} />

  if (!current) {
    return <div className="mx-auto max-w-md px-4 py-20 text-center text-[var(--ink-soft)]">{t.common.laden}</div>
  }

  const subject: Subject = isLetterExercise(current)
    ? (() => {
        const l = letter(current.letterId!)
        return { ar: l.ar, tr: l.name, meaning: t.alphabet.klinktAls(l.sound) }
      })()
    : isSentenceExercise(current)
      ? (() => {
          const z = sentence(current.sentenceId!)
          return { ar: z.ar, tr: z.tr, meaning: sentenceMeaning(z, lang) }
        })()
      : (() => {
          const w = word(current.wordId)
          return { ar: w.ar, tr: w.tr, meaning: meaning(w), note: note(w) }
        })()

  const finish = () => {
    const { right, asked, perfect, start, xp, gems, best } = tally.current
    onFinish({
      score: asked === 0 ? 1 : Math.max(0, Math.min(1, right / asked)),
      asked,
      perfect,
      seconds: (Date.now() - start) / 1000,
      xp,
      gems,
      bestCombo: best,
    })
  }

  /** Records the answer against whatever kind of thing was being asked. */
  finishRef.current = finish

  /** Moves to the next card, or hands over the score. Once per card. */
  const step = () => {
    if (stepping.current) return
    stepping.current = true
    if (index + 1 >= queue.length) finish()
    else setIndex((i) => i + 1)
  }

  /** Records the answer against whatever kind of thing was being asked. */
  const record = (exercise: Exercise, grade: Grade) => {
    if (isLetterExercise(exercise)) gradeExtra(letterKey(exercise.letterId!), grade)
    else if (isSentenceExercise(exercise)) gradeExtra(sentenceKey(exercise.sentenceId!), grade)
    else if (exercise.kind === 'koppel') for (const id of exercise.pairIds ?? []) gradeWord(id, grade)
    else gradeWord(exercise.wordId, grade)
  }

  const answer = (v: Verdict, d?: string) => {
    if (verdict) return
    const exercise = current

    // Teaching cards are not questions: they cost nothing and are worth nothing.
    if (exercise.kind === 'nieuw' || exercise.kind === 'letter-nieuw' || exercise.kind === 'zin-nieuw') {
      if (stepping.current) return
      record(exercise, 'goed')
      step()
      return
    }

    setVerdict(v)
    setDetail(d ?? '')
    tally.current.asked += 1
    if (isSentenceExercise(exercise)) countSentence()
    if (review) bumpQuest('herhaald')

    if (v === 'fout') {
      tally.current.perfect = false
      setCombo(0)
      sfx.wrong()
      if (heartsOn) loseHeart()
    } else {
      const run = combo + 1
      setCombo(run)
      tally.current.best = Math.max(tally.current.best, run)
      if (v === 'goed') tally.current.right += 1
      else {
        tally.current.right += 0.5
        tally.current.perfect = false
      }
      const paid = scoreCorrect(run, review)
      tally.current.xp += paid.xp
      tally.current.gems += paid.gems
      setBurst({ id: ++burstId.current, xp: paid.xp, gems: paid.gems })
      sfx.correct(v === 'goed' ? run - 1 : Math.min(run - 1, 2))
      if (run % 5 === 0) sfx.streak()
    }

    record(exercise, GRADE_OF[v])
    /*
     * Een gemiste vraag komt één keer terug, niet eindeloos.
     *
     * Hier stond hetzelfde zonder die voorwaarde, en dan hangt de ronde achter
     * elke fout een nieuwe kopie aan de rij -- ook achter de fout op de kopie.
     * Met hartjes loopt dat vanzelf dood, maar `hearts` is een schakelaar die
     * een ouder voor een jonger kind juist uitzet, en dan is er geen bodem
     * meer: wie één woord niet onder de knie krijgt, krijgt het de hele avond
     * terug en kan de les alleen verlaten via het kruisje, dat de les
     * weggooit. Precies het kind dat het 't hardst nodig heeft.
     *
     * Eén herkansing is genoeg. Het antwoord is hierboven al als fout
     * genoteerd, dus de planning zet het woord vanzelf bovenaan de volgende
     * herhaling -- daar hoort het thuis, niet in een ronde zonder eind.
     */
    if (v === 'fout' && !exercise.id.endsWith('-again')) {
      setQueue((q) => [...q, { ...exercise, id: `${exercise.id}-again` }])
    }
  }

  const next = () => {
    // The feedback bar slides out rather than vanishing, and a button that is
    // still on its way off the screen is still a button. Without the verdict
    // check a second tap lands after the card has already changed, and skips
    // the next question without ever asking it.
    if (stepping.current || !verdict) return
    setVerdict(null)
    setDetail('')
    setBurst(null)
    step()
  }

  // Op een tablet mag de kolom breder en de ruimte ruimer: een les die in een
  // telefoonbreedte blijft hangen op een scherm van duizend pixels leest als
  // een uitvergrote telefoon.
  /*
   * Tijdens een les is er geen kopbalk, en het kruisje om te stoppen zit tegen
   * de bovenrand. Met targetSdkVersion 36 tekent Android 15 tot in de hoeken,
   * dus zonder deze opvulling ligt dat kruisje onder de statusbalk en kan een
   * kind de les niet verlaten. Dat is geen schoonheidsfoutje meer.
   *
   * De 1rem en de 1.5rem zijn de `py-4 md:py-6` die hier stonden. Eerst stond
   * dit in een inline stijl, en daarmee viel de md-variant weg: op een tablet
   * werd de bovenmarge 16 in plaats van 24. Een inline stijl kent geen
   * breekpunt. Vandaar de haakjesnotatie van Tailwind, die er wél een tweede
   * regel van maakt; de underscores worden daar spaties, want `calc(1rem+x)`
   * zonder spaties rond de plus is ongeldige CSS.
   */
  return (
    <div
      className="relative mx-auto flex min-h-screen max-w-2xl flex-col px-4 pb-4 pt-[calc(1rem_+_var(--rand-boven))] md:max-w-3xl md:px-6 md:pb-6 md:pt-[calc(1.5rem_+_var(--rand-boven))]"
    >
      <Zelligegrond stap={index} rustig={rustig} />

      <div className="flex items-center gap-3">
        {/*
          Het kruisje is de enige weg uit een les, en het was 20 bij 32 —
          allebei onder de 44 die Apple en Google aanhouden, op het scherm waar
          een kind het slechtst mikt en waar weglopen het enige is wat iets
          kost. Nagemeten in Chromium op 390: nu 44 bij 44.

          De negatieve marges halen die 44 weer van de rij af, zodat er niets
          verschuift: de rij blijft 32 hoog en het kruisje schuift 8 pixels op
          in de breedte. Op 320 in het Duits is er daarna nog niets dat buiten
          beeld loopt (gemeten: scrollWidth 320 van 320).
        */}
        <button
          onClick={() => { sfx.back(); setQuit(true) }}
          aria-label={t.common.sluiten}
          className="-mx-2 -my-1.5 grid h-11 w-11 shrink-0 place-items-center text-2xl text-[var(--ink-soft)] hover:text-[var(--ink)]"
        >
          ✕
        </button>
        {/*
          De balk schuift al bij het antwoord, niet pas bij Verder: een goed
          antwoord hoort meteen ergens te landen. Bij fout blijft hij staan —
          daar komt de vraag zo nog een keer terug.
        */}
        <Lesbalk
          waarde={(index + (verdict && verdict !== 'fout' ? 1 : 0)) / Math.max(1, queue.length)}
          stappen={Math.max(1, queue.length)}
          vonnis={verdict}
          rustig={rustig}
          avatar={state.avatar}
          label={`${Math.min(index + 1, queue.length)} ${t.common.van} ${queue.length}`}
        />
        <AnimatePresence>
          {combo >= 2 && (
            <motion.span
              key={combo}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              className="relative shrink-0 rounded-full bg-saffron-500/20 px-2.5 py-1 font-display text-sm font-extrabold text-saffron-600 dark:text-saffron-300"
              aria-label={t.lesson.opRij(combo)}
            >
              🔥 {combo}
              {/* Elke vijfde klinkt al anders (`sfx.streak`); hier is dat ook
                  te zien. Eén ring van 450 ms uit het pilletje zelf — niet een
                  scherm vol confetti, want dat is na drie keer lawaai. */}
              {combo % 5 === 0 && !rustig && (
                <motion.span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-full border-2 border-saffron-600 dark:border-saffron-300"
                  initial={{ opacity: 0.8, scale: 1 }}
                  animate={{ opacity: 0, scale: 1.5 }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                />
              )}
            </motion.span>
          )}
        </AnimatePresence>
        {heartsOn && <span className="shrink-0 font-bold" aria-label={t.lesson.hartjesOver(hearts)}>❤️ {hearts}</span>}
      </div>

      <div className="relative flex flex-1 flex-col justify-center py-6">
        {/*
          De beloning vloog hier als een pil omhoog, en die is weg.

          Hij vertrok eerst van bovenaan het vraagvak -- een halve telefoon
          boven de knop waar je net op drukte, dus precies waar je op dat
          moment niet kijkt. Daarna van onderen, uit de hoek waar de duim zit,
          en korter: 0,9 seconde in plaats van 1,3.

          Maar die plek was bezet. Nagekeken op schermafdrukken van 390 en van
          320 in het Duits: "+2 XP" lag onderweg midden op het vierde
          antwoordvakje, en bij een omgelopen Duitse regel dwars over de tekst.
          En hij was overbodig geworden -- honderd pixels lager staat op
          hetzelfde moment dezelfde "+2 XP" in de balk eronder.

          Twee keer hetzelfde zeggen en er onderweg een antwoord mee afdekken
          is slechter dan het één keer zeggen op de plek waar het oog al is.
          De edelstenen stonden alleen in de vliegende pil, dus die staan nu
          in die balk, naast de XP. Niets weg, één plek minder.
        */}

        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.18 }}
          >
            <ExerciseView exercise={current} onAnswer={answer} locked={verdict !== null} />
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {verdict && (
          <motion.div
            initial={{ y: 90 }}
            animate={{ y: 0 }}
            exit={{ y: 90 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            role="status"
            // Says how it went, for anyone reading the page rather than
            // looking at it — the camera that films the app included.
            data-verdict={verdict}
            // On its way out it is still on the screen, and a second tap on a
            // button that is leaving used to land on the card behind it and
            // skip a question. Nothing leaving is pressable.
            /*
             * `sticky bottom-0`, dus deze balk plakt tegen de onderkant van
             * het venster -- en die ligt met edge-to-edge onder de
             * gebarenbalk. Hierin staat de knop die je naar de volgende vraag
             * brengt; ligt die eronder, dan loopt de les vast.
             *
             * De 1rem is de py-4 die hier stond. Die is hierheen verhuisd
             * omdat een inline stijl de padding-bottom toch overschrijft.
             */
            style={{
              pointerEvents: verdict ? 'auto' : 'none',
              paddingBottom: 'calc(1rem + var(--rand-onder))',
            }}
            /*
             * De balk hangt boven de bladzijde en ligt er niet op: de schaduw
             * valt omhoog, want het licht komt van boven en dit is het enige
             * vlak in de les dat vóór de rest staat. Zonder die schaduw loopt
             * hij bij een lange lijst antwoorden visueel in de laatste knop
             * over.
             *
             * `mint-600` en niet `mint-500` op de bovenrand, om dezelfde reden
             * als bij de antwoordvakjes: 2,30 op 1 op een licht vlak is te
             * weinig voor een lijn die zegt hoe het ging.
             */
            className={`sticky bottom-0 -mx-4 border-t-2 px-4 pt-4 shadow-[0_-10px_26px_-14px_rgba(84,56,24,0.45)] dark:shadow-[0_-10px_26px_-12px_rgba(0,0,0,0.85)] ${
              verdict === 'goed' ? 'border-mint-600 bg-mint-500/15'
              : verdict === 'bijna' ? 'border-saffron-600 bg-saffron-500/15'
              : 'border-terra-600 bg-terra-500/15'
            }`}
          >
            <div className="flex items-start gap-3">
              {/*
                Het teken komt met een veer binnen bij goed en vervaagt bij
                fout. Dat is het verschil nog een keer, in beweging: een fout
                hoort niet te stuiteren.
              */}
              <motion.span
                className="text-3xl"
                aria-hidden="true"
                initial={rustig ? false : verdict === 'fout' ? { opacity: 0 } : { scale: 0.4, rotate: -14 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={verdict === 'fout' ? { duration: 0.22 } : { type: 'spring', stiffness: 320, damping: 15 }}
              >
                {verdict === 'goed' ? '🎉' : verdict === 'bijna' ? '👌' : '💡'}
              </motion.span>
              <motion.div
                className="min-w-0 flex-1"
                /* Eerst hoe het ging, dan welk woord het was. Zestig
                   milliseconde ertussen is genoeg om er een volgorde van te
                   maken en te weinig om op te wachten. */
                initial={rustig ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06, duration: 0.18 }}
              >
                <p className="flex flex-wrap items-center gap-2 font-display text-lg font-extrabold">
                  {verdict === 'goed' ? t.lesson.lof[index % t.lesson.lof.length] : verdict === 'bijna' ? t.lesson.bijnaGoed : t.lesson.juisteAntwoord}
                  {/*
                    De inkt van de bladzijde op een getinte pil, en niet een
                    tint van dezelfde kleur.

                    Hier stond `text-mint-700 dark:text-mint-200`, en dat is
                    nagerekend op de samenstelling (mint-500 op een kwart
                    dekking over het papier) 3,97 op 1 in de lichte stand --
                    onder de 4,5 die tekst hoort te halen. Dat stond er al en
                    is niet gemeten omdat `kleuren.test.ts` naar tinten kijkt
                    en niet naar wat er bovenop komt. Met `--ink` wordt het
                    14,02 en 9,91, en de pil houdt zijn kleur: die zit in het
                    vlak eronder en niet in de letters.

                    Dezelfde som voor de edelstenen: saffron-700 haalde 4,09 en
                    `--ink` haalt 14,44 en 9,87.
                  */}
                  {verdict !== 'fout' && burst && (
                    <span className="rounded-full bg-mint-500/25 px-2 py-0.5 text-xs font-extrabold text-[var(--ink)]">
                      {t.lesson.xpPlus(burst.xp)}
                    </span>
                  )}
                  {/* De edelstenen stonden alleen in de pil die hierboven
                      wegvloog; zie de toelichting daar voor waarom die weg is. */}
                  {verdict !== 'fout' && burst && burst.gems > 0 && (
                    <span className="rounded-full bg-saffron-500/25 px-2 py-0.5 text-xs font-extrabold text-[var(--ink)]">
                      💎 {t.lesson.gemPlus(burst.gems)}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm">
                  <span className="ar text-xl font-bold">{subject.ar}</span>
                  <span className="font-display font-bold text-zellige-600 dark:text-zellige-300">{subject.tr}</span>
                  <span className="text-[var(--ink-soft)]">— {subject.meaning}</span>
                </p>
                {/* A traced letter has no answer to quote back — the detail is
                    already a sentence about how the line went. */}
                {detail && verdict !== 'goed' && (
                  <p className="mt-0.5 text-xs text-[var(--ink-soft)]">
                    {isScribeExercise(current) ? detail : t.lesson.jijHad(detail)}
                  </p>
                )}
                {subject.note && verdict !== 'goed' && <p className="mt-1 text-xs text-[var(--ink-soft)]">💡 {subject.note}</p>}
              </motion.div>
              <SpeakButton ar={subject.ar} tr={subject.tr} className="mt-1" />
            </div>
            <Button variant={verdict === 'fout' ? 'danger' : 'success'} className="mt-3 w-full" autoFocus onClick={next}>
              {index + 1 >= queue.length ? t.lesson.afronden : t.common.verder}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <Sheet open={quit} onClose={() => setQuit(false)} labelledBy="quit-title">
        <h2 id="quit-title" className="font-display text-xl font-extrabold">{quitLabel ?? t.lesson.stoppenLes}</h2>
        <p className="mt-2 text-[var(--ink-soft)]">{t.lesson.stoppenUitleg}</p>
        <div className="mt-5 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setQuit(false)}>{t.common.doorgaan}</Button>
          <Button variant="danger" className="flex-1" onClick={onQuit}>{t.common.stoppen}</Button>
        </div>
      </Sheet>
    </div>
  )
}

/**
 * Het scherm als de hartjes op zijn.
 *
 * Dit was een doodlopende weg: een mascotte, een zin en één knop terug. Precies
 * het moment waarop een kind de app wegklikt, en precies het moment waarop de
 * grote taalapps iets te bieden hebben.
 *
 * Drie wegen nu, en alle drie bestonden ze al half in de code:
 *
 * - **Aanvullen met edelstenen.** `refillHearts(kosten)` stond er al en werd
 *   nergens aangeroepen; edelstenen werden verdiend en nergens uitgegeven. Dit
 *   is waar die twee elkaar vinden. Niet met geld — edelstenen komen er alleen
 *   in door te spelen.
 * - **Herhalen.** `Review` draait met `useHearts={false}`, dus herhalen kost
 *   echt nooit een hartje. Dat stond al in de uitleg, maar er was geen knop
 *   die je erheen bracht.
 * - **Terug**, zoals eerst.
 *
 * En de tijd tot het volgende hartje staat er nu gewoon. Die stond alleen in
 * een `title` op de kopbalk, en dat is een tooltip — op een telefoon bestaat
 * hij dus niet.
 *
 * De tikker loopt alleen zolang dit scherm er staat, vandaar een eigen
 * component en geen interval in de ronde zelf.
 */
function HartjesOp({ onQuit }: { onQuit: () => void }) {
  const t = useT()
  const nav = useNavigate()
  const state = useStore((s) => s)
  const [, tik] = useState(0)

  useEffect(() => {
    const id = setInterval(() => tik((n) => n + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  const kanKopen = kanHartenKopen(state)
  const minuten = Math.ceil(msUntilNextHeart(state) / 60_000)

  return (
    <div className="mx-auto max-w-md px-4 py-14 text-center">
      <Mascot mood="oeps" size={120} className="mx-auto" />
      <h1 className="mt-4 font-display text-2xl font-extrabold">{t.lesson.hartjesOp}</h1>
      <p className="mt-2 text-[var(--ink-soft)]">{t.lesson.hartjesOpUitleg}</p>

      {minuten > 0 && (
        <p className="mt-4 font-display font-extrabold text-saffron-600 dark:text-saffron-300">
          ⏳ {t.topbar.volgendHartje(minuten)}
        </p>
      )}

      {kanKopen ? (
        <Button
          className="mt-6 w-full py-3"
          onClick={() => { if (koopHarten()) sfx.confirm() }}
        >
          {t.lesson.hartjesKoop(PRIJS_HARTEN)}
        </Button>
      ) : (
        /* Geen knop die niets doet: wie te weinig heeft leest wat het kost, en
           ziet in de kopbalk hoeveel hij er heeft. Een uitgeschakelde knop
           nodigt uit tot drukken en legt niets uit. */
        <p className="mt-6 text-sm text-[var(--ink-soft)]">{t.lesson.hartjesTeWeinig(PRIJS_HARTEN)}</p>
      )}

      <Button
        variant="secondary"
        className="mt-3 w-full py-3"
        onClick={() => { sfx.nav(); nav('/herhalen') }}
      >
        🔁 {t.nav.herhalen}
      </Button>

      <Button variant="ghost" className="mt-3 w-full" onClick={onQuit}>{t.common.terug}</Button>
    </div>
  )
}
