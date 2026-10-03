import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { Exercise, LetterForm } from '../engine/exercises'
import { checkTyped, normalise, tokenize, type Verdict } from '../engine/exercises'
import { word } from '../content/lexicon'
import { connects, letter } from '../content/alphabet'
import { sentence } from '../content/sentences'
import { sentenceMeaning } from '../content/localise'
import { maybeWord } from '../content/lexicon'
import { say, sayLetter, sfx } from '../engine/audio'
import { kanOpnemen, neemOp, type Opname } from '../engine/microfoon'
import { useStore } from '../engine/store'
import { ZWEEF } from './zweef'
import { useRustig } from './rustig'
import { Button } from './kit'
import { Scribe } from './Scribe'
import { SpeakButton, useMeaning, useNote, WordText } from './WordChip'
import { useLang, useT } from '../i18n'
import { letterVoice } from '../content/pronunciation'

/**
 * One component per exercise type. Each of them reports a single verdict and
 * then waits: the player decides what happens next.
 */

export interface ExerciseProps {
  exercise: Exercise
  /** Called once, with how well it went. */
  onAnswer: (verdict: Verdict, detail?: string) => void
  /** Set while the feedback bar is showing, to freeze the inputs. */
  locked: boolean
}

/* ----------------------------------------------------- diepte en beweging */



/** De veer waar `Progress` in kit.tsx al op loopt. Eén veer in de hele les. */
const VEER = { type: 'spring', stiffness: 180, damping: 24 } as const

/**
 * De zellige-rozet: twee vierkanten onder 45 graden over elkaar.
 *
 * Dezelfde vorm die `Medaillon` in Motief.tsx om een tekening zet, en de
 * eenvoudigste die er in een tegelpaneel in zit. Hij staat hier op twee
 * plekken en allebei als rand of merkteken, nooit als plaatje: vóór elke vraag
 * en om de afspeelknop. Eén vorm die terugkomt is een ritme; dezelfde vorm op
 * tien plekken is behang.
 */
function Rozet({ size = 16, lijn = 7, className = '' }: { size?: number; lijn?: number; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth={lijn} strokeLinejoin="round">
        <rect x="18" y="18" width="64" height="64" rx="12" />
        <rect x="18" y="18" width="64" height="64" rx="12" transform="rotate(45 50 50)" />
      </g>
    </svg>
  )
}

/**
 * De kaart met de vraag erop.
 *
 * Hetzelfde als `Card` uit kit.tsx, met de schaduw van hierboven in plaats van
 * `shadow-sm`. Een eigen component en geen extra klasse op `Card`, omdat twee
 * schaduwklassen op één element van Tailwind er één maken en welke wint van de
 * volgorde in de stylesheet afhangt -- niet van de volgorde in de JSX.
 */
function Vraagkaart({ children, className = '', ...rest }: { children: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...rest} className={`rounded-3xl border border-[var(--line)] bg-[var(--surface-raised)] ${ZWEEF} ${className}`}>
      {children}
    </div>
  )
}

/**
 * De kaart kantelt naar je vinger.
 *
 * Een antwoordvakje aantikken voelde als aanklikken: er zakte iets vier pixels
 * en dat was het, overal op de knop hetzelfde. Een echt plaatje op een echte
 * tafel kantelt wég van de plek waar je duwt, en dat is wat dit uitrekent --
 * waar in het vakje je landt, en hoe ver het dan wegkantelt. Tweeënhalve graad
 * vanaf het midden, dus vijf van rand tot rand; nagemeten in Chromium gaf een
 * druk linksonder `rotateX(-1.5deg) rotateY(-1.5deg)`. Meer leest als een
 * klepje dat opengaat.
 *
 * Dit rijdt mee op de overgang die `.btn3d` al heeft (`transform 90ms ease`),
 * dus er komt geen framer-motion aan te pas en geen tweede tijdsduur. Dat is
 * ook waarom de verdict-beweging hieronder op het ómhulsel zit: twee dingen die
 * tegelijk aan dezelfde `transform` trekken geven een slepende knop.
 */
function useKantel(uit: boolean) {
  const [vorm, setVorm] = useState('')
  const los = () => setVorm('')
  const pak = (e: React.PointerEvent<HTMLElement>) => {
    if (uit) return
    const vak = e.currentTarget.getBoundingClientRect()
    if (!vak.width || !vak.height) return
    const dx = (e.clientX - vak.left) / vak.width - 0.5
    const dy = (e.clientY - vak.top) / vak.height - 0.5
    // Positieve rotateX brengt de ónderkant naar je toe, dus het minteken: de
    // plek waar je duwt hoort weg te zakken, niet op te komen.
    setVorm(`perspective(700px) translateY(3px) rotateX(${(-dy * 5).toFixed(2)}deg) rotateY(${(dx * 5).toFixed(2)}deg)`)
  }
  return { vorm, pak, los }
}

/**
 * Wat er met een antwoordvakje gebeurt zodra er gekozen is.
 *
 * Eerst kreeg alleen het aangetikte vakje een kleur, en gingen alle vier op
 * halve dekking omdat ze `disabled` werden (`.btn3d:disabled { opacity: .5 }`).
 * Wie het fout had zag dus vier vale regels en één rode, en moest in de balk
 * onderaan lézen welk antwoord het dan wel was -- terwijl dat antwoord gewoon
 * op het scherm stond. Voor een kind van zes dat nog niet vlot leest is dat het
 * verschil tussen leren en doorklikken.
 *
 * Nu zijn er vijf standen in plaats van twee: het goede vakje licht op, ook als
 * je het niet aantikte, en alleen de vakjes die geen van beide zijn zakken weg.
 * `disabled` is daarvoor vervangen door `aria-disabled` -- de dekking is nu een
 * keuze per vakje en niet een regel die alles tegelijk raakt.
 */
type Stand = 'open' | 'gekozen' | 'goed' | 'onthuld' | 'fout' | 'weg'

const standVan = (chosen: string | null, id: string, answer: string, locked: boolean): Stand =>
  !locked ? (chosen === id ? 'gekozen' : 'open')
  : id === answer ? (chosen === id ? 'goed' : 'onthuld')
  : chosen === id ? 'fout'
  : 'weg'

/*
 * `mint-600` en niet `mint-500`, en dat is nagerekend: #22c55e op een witte
 * kaart haalt 2,30 op 1 en de norm voor een rand die betekenis draagt is 3.
 * De rand die zegt "dit was goed" was dus de slechtst zichtbare rand van het
 * hele scherm. #16a34a haalt 3,30 op wit en 5,19 op de donkere kaart.
 * `terra-600` haalt 4,84 en 3,53 -- die kon blijven waar hij stond.
 */
const VAKJE: Record<Stand, string> = {
  open: 'border-[var(--line)] bg-[var(--surface-raised)] hover:border-zellige-400',
  gekozen: 'border-zellige-500 bg-zellige-500/10',
  goed: 'border-mint-600 bg-mint-500/20',
  onthuld: 'border-mint-600 bg-mint-500/15',
  fout: 'border-terra-600 bg-terra-500/20',
  /*
    0,6 en niet 0,45. Dekking werkt op de hele groep, dus de tekst gaat mee,
    en nagerekend op de samenstelling kwam 0,45 uit op 2,95 op 1 in de lichte
    stand en 3,97 in de donkere -- allebei onder de 4,5 voor tekst. De oude
    toestand was `disabled` met 0,5 en haalde 3,43 en 4,59, dus in de donkere
    stand ging het van geslaagd naar gezakt.

    En het is precies de tekst die een kind dat het fout had nog wil kunnen
    lezen: wat waren de andere antwoorden ook alweer. Met 0,6 wordt het 4,70
    en 6,10. Noch `kleuren.test.ts` noch `inkt.test.ts` kijkt naar dekking, dus
    1 888 groene tests zeiden hier niets; `lesstand.test.ts` doet het nu.
  */
  weg: 'border-[var(--line)] bg-[var(--surface-raised)] opacity-60',
}

/**
 * Goed en fout als beweging, niet alleen als kleur.
 *
 * Kleur alleen is twee dingen te weinig: een kind dat rood en groen niet uit
 * elkaar houdt ziet geen verschil, en een kind dat wél kleuren ziet moet nog
 * steeds kijken om het te weten. Beweging komt eerder binnen dan kleur, en
 * deze twee bewegingen zijn elkaars tegengestelde -- omhoog tegen heen en weer.
 *
 * Goed groeit en blijft staan, en uit het vakje groeit één ring naar buiten.
 * Fout schudt één keer, kort, en zakt terug: dat is hoofdschudden, niet straf.
 * Het goede antwoord dat je níét aantikte komt rustig omhoog, zodat je oog
 * ernaartoe gaat zonder dat er iets staat te schreeuwen.
 */
const BEWEGING: Record<Stand, Record<string, number | number[]>> = {
  open: { scale: 1, x: 0, y: 0 },
  gekozen: { scale: 1, x: 0, y: 0 },
  goed: { scale: 1.03, x: 0, y: -3 },
  onthuld: { scale: [1, 1.02, 1], x: 0, y: [0, -5, 0] },
  fout: { scale: 1, x: [0, -7, 7, -5, 5, 0], y: 0 },
  weg: { scale: 0.985, x: 0, y: 0 },
}

const STIL = { scale: 1, x: 0, y: 0 }

function Antwoordknop({ stand, rustig, onKies, className = '', children }: {
  stand: Stand
  rustig: boolean
  onKies: () => void
  className?: string
  children: React.ReactNode
}) {
  const vast = stand !== 'open' && stand !== 'gekozen'
  const kantel = useKantel(rustig || vast)
  return (
    <motion.div
      /* `h-full`: zie de knop hieronder. Zonder dit is het omhulsel zo hoog
         als de rij en de knop zo hoog als zijn tekst, en dan trekt de ring bij
         een goed antwoord de rastercel na in plaats van de knop. */
      className="relative h-full"
      animate={rustig ? STIL : BEWEGING[stand]}
      transition={stand === 'fout' ? { duration: 0.26 } : VEER}
    >
      <button
        type="button"
        aria-disabled={vast}
        onClick={onKies}
        onPointerDown={kantel.pak}
        onPointerUp={kantel.los}
        onPointerLeave={kantel.los}
        onPointerCancel={kantel.los}
        style={kantel.vorm ? { transform: kantel.vorm } : undefined}
        // Marks the buttons that are answers, so the camera that films the app
        // knows what to press. Nothing else hangs off it.
        data-answer=""
        /*
          `h-full` erbij. Het omhulsel hieronder is in een raster het
          rasteritem, en dát rekt mee met de rijhoogte -- de knop erbinnen had
          alleen `w-full` en kreeg dus zijn inhoudshoogte. Gemeten met twee
          vakjes naast elkaar, één met een omlopende Duitse regel en één met een
          kort woord: eerst allebei 72 pixels, daarna 72 tegen 54, met een gat
          onder het korte vakje. Dat raakt `Choice` en `LetterChoice` vanaf 640
          pixels, dus elke tablet, en het ondergraaft juist de schaduw: twee
          kaarten naast elkaar op verschillende hoogte lezen niet als één
          lichtbron.
        */
        className={`btn3d h-full w-full rounded-2xl border-2 transition ${VAKJE[stand]} ${className}`}
      >
        {children}
      </button>
      {/* De ring die uit het vakje groeit dat je aantikte. Eén keer, 420 ms, en
          dan weg -- een viering die je bij het derde goede antwoord nog leuk
          vindt is een viering die niet over het scherm gaat. */}
      {stand === 'goed' && !rustig && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-mint-600"
          initial={{ opacity: 0.85, scale: 1 }}
          animate={{ opacity: 0, scale: 1.12 }}
          transition={{ duration: 0.42, ease: 'easeOut' }}
        />
      )}
    </motion.div>
  )
}

/**
 * De knop die het woord afspeelt.
 *
 * Hier stond een bol met een verloop van `zellige-300` naar `zellige-700`. Een
 * verloop van licht naar donker over een rond vlak is een geschilderd bolletje:
 * het suggereert diepte die er niet is, het reageert nergens op, en het is het
 * enige in de app dat glimt. Diepte hoort hier van het licht te komen -- een
 * vlakke schijf die boven het papier hangt -- en van wat er gebeurt als je hem
 * indrukt.
 *
 * De rozet erachter zijn twee vierkanten onder 45 graden over elkaar, dezelfde
 * die `Medaillon` in Motief.tsx om een tekening zet. Hier als lijst om de knop
 * en niet als plaatje erop: zellige is het raster waar iets in staat.
 *
 * `zellige-600` haalt op het lichte vlak 5,29 op 1 en `zellige-500` op het
 * donkere 6,9 -- allebei ruim boven de 3 die een bedieningselement nodig heeft.
 * Het oude verloop begon bij `zellige-300` en dat haalde de norm aan de lichte
 * kant niet.
 */
function Luisterknop({ onSpeel, onTraag, label, rustig }: {
  onSpeel: () => void
  onTraag: () => void
  label: string
  rustig: boolean
}) {
  const [slag, setSlag] = useState(0)
  return (
    <div className="relative">
      {/* Achtentwintig pixels ruimte rondom en niet zestien: op zestien stak
          alleen een hoekje van de rozet onder de schijf uit en leek het een
          vlek. Nu is het een lijst waar de knop in staat. */}
      <Rozet size={168} lijn={2} className="pointer-events-none absolute -inset-7 text-zellige-600 opacity-30 dark:text-zellige-300" />
      {/* De ring die naar buiten loopt als je hem indrukt. `say()` zoekt eerst
          een opname op en valt anders terug op de spraakmotor, en dat duurt
          soms een halve seconde; zonder dit lijkt het of de knop niets deed en
          tikt een kind hem nog een keer aan -- waarna hij twee keer praat. */}
      {slag > 0 && !rustig && (
        <motion.span
          key={slag}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full border-2 border-zellige-500"
          initial={{ opacity: 0.7, scale: 1 }}
          animate={{ opacity: 0, scale: 1.6 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      )}
      <motion.button
        type="button"
        whileTap={{ scale: 0.94 }}
        onClick={() => { setSlag((n) => n + 1); onSpeel() }}
        onDoubleClick={onTraag}
        className={`relative grid h-28 w-28 place-items-center rounded-full bg-zellige-600 text-5xl text-white dark:bg-zellige-500 ${ZWEEF}`}
        aria-label={label}
      >
        🔊
      </motion.button>
    </div>
  )
}

function Prompt({ children, hint }: { children: React.ReactNode; hint: string }) {
  return (
    <div className="mb-5">
      <p className="mb-3 flex items-center gap-2 font-display text-lg font-extrabold text-[var(--ink-soft)]">
        {/* Hetzelfde merkteken voor elke vraag, en alleen voor een vraag: zo
            weet je zonder lezen of dit iets is dat je uitgelegd krijgt of iets
            waar je antwoord op moet geven. */}
        <Rozet className="shrink-0 text-zellige-600 dark:text-zellige-300" size={15} />
        {hint}
      </p>
      {children}
    </div>
  )
}

/* --------------------------------------------------------------- new word */

function NewWord({ exercise, onAnswer }: ExerciseProps) {
  const t = useT()
  const meaning = useMeaning()
  const note = useNote()
  const rustig = useRustig()
  const w = word(exercise.wordId)
  useEffect(() => { say(w.ar, { tr: w.tr }) }, [w.ar, w.tr])
  return (
    <div>
      <Prompt hint={t.lesson.nieuwWoord}>
        <Vraagkaart className="flex flex-col items-center gap-3 p-6">
          {/* Het woord wordt je aangereikt: het plaatje komt er als eerste in
              en de rest staat er al. Eén element dat beweegt is genoeg om te
              zeggen dat hier iets nieuws begint. */}
          <motion.div
            className="text-5xl"
            aria-hidden="true"
            initial={rustig ? false : { scale: 0.6, y: 8 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          >
            {w.emoji ?? '✨'}
          </motion.div>
          <WordText word={w} size="lg" />
          <p className="text-center font-display text-xl font-extrabold">{meaning(w)}</p>
          <SpeakButton ar={w.ar} tr={w.tr} />
          {note(w) && (
            <p className="mt-1 rounded-2xl bg-saffron-500/10 px-4 py-2 text-center text-sm text-[var(--ink-soft)]">
              💡 {note(w)}
            </p>
          )}
        </Vraagkaart>
      </Prompt>
      <Button className="w-full" sound="confirm" onClick={() => onAnswer('goed')}>{t.lesson.snapIk}</Button>
    </div>
  )
}

/* ----------------------------------------------------------- multiple choice */

function Choice({ exercise, onAnswer, locked, mode }: ExerciseProps & { mode: 'betekenis' | 'darija' | 'luister' | 'script' }) {
  const [chosen, setChosen] = useState<string | null>(null)
  const t = useT()
  const meaning = useMeaning()
  const rustig = useRustig()
  const w = word(exercise.wordId)
  const options = exercise.options ?? []

  useEffect(() => {
    setChosen(null)
    if (mode === 'luister') say(w.ar, { tr: w.tr })
  }, [exercise.id, mode, w.ar, w.tr])

  const hint =
    mode === 'betekenis' ? t.lesson.watBetekent
    : mode === 'darija' ? t.lesson.hoeZegJe
    : mode === 'luister' ? t.lesson.watHoorJe
    : t.lesson.welkSchrift

  const choose = (id: string) => {
    if (locked) return
    sfx.pick()
    setChosen(id)
    onAnswer(id === w.id ? 'goed' : 'fout')
  }

  return (
    <div>
      <Prompt hint={hint}>
        {/*
          Geen emoji op de vraag.

          Hier stond er wel een, en daarmee was de oefening op te lossen zonder
          een woord Darija te kennen: de kaart toonde 👍 boven `bikhir`, en het
          juiste antwoord eronder was "👍 prima, goed". Je zocht de bijpassende
          emoji en had het goed — elke keer, want elk woord heeft er één.

          Op de leskaart hierboven staat hij juist wél, want dat is het
          uitleggen: daar horen plaatje, woord en betekenis bij elkaar. Hier
          wordt gevraagd wat het woord betekent, en dan ís de emoji het
          antwoord.

          Bij de antwoorden blijft hij staan. Daar helpt hij een kind dat nog
          niet vlot leest om vier regels uit elkaar te houden, en verraadt hij
          niets: je moet nog steeds weten welk woord erboven staat.
        */}
        {mode === 'betekenis' && (
          <Vraagkaart className="flex items-center justify-center gap-4 p-6">
            <WordText word={w} size="lg" />
            <SpeakButton ar={w.ar} tr={w.tr} />
          </Vraagkaart>
        )}
        {mode === 'darija' && (
          <Vraagkaart className="p-6 text-center">
            <div className="text-4xl" aria-hidden="true">{w.emoji}</div>
            <p className="mt-2 font-display text-2xl font-extrabold">{meaning(w)}</p>
          </Vraagkaart>
        )}
        {mode === 'luister' && (
          <div className="flex flex-col items-center gap-5">
            <Luisterknop
              rustig={rustig}
              onSpeel={() => say(w.ar, { tr: w.tr })}
              onTraag={() => say(w.ar, { tr: w.tr, slow: true })}
              label={t.lesson.speelAf}
            />
            <button className="min-h-11 px-3 text-sm font-bold text-[var(--ink-soft)] underline" onClick={() => say(w.ar, { tr: w.tr, slow: true })}>
              {t.lesson.langzamer}
            </button>
          </div>
        )}
        {mode === 'script' && (
          <Vraagkaart className="p-6 text-center">
            <p className="font-display text-3xl font-extrabold text-zellige-600 dark:text-zellige-300">{w.tr}</p>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">{meaning(w)}</p>
          </Vraagkaart>
        )}
      </Prompt>

      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((id) => {
          const o = word(id)
          return (
            <Antwoordknop
              key={id}
              rustig={rustig}
              stand={standVan(chosen, id, w.id, locked)}
              onKies={() => choose(id)}
              className={`p-4 md:p-6 ${mode === 'script' ? 'text-center' : 'text-start'}`}
            >
              {mode === 'betekenis' && <span className="font-display text-lg font-bold md:text-xl">{o.emoji} {meaning(o)}</span>}
              {mode === 'darija' && <WordText word={o} />}
              {mode === 'luister' && <span className="ar text-2xl font-bold md:text-3xl">{o.ar}</span>}
              {mode === 'script' && <span className="ar text-3xl font-bold md:text-4xl">{o.ar}</span>}
            </Antwoordknop>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ match */

function Match({ exercise, onAnswer }: ExerciseProps) {
  const t = useT()
  const meaning = useMeaning()
  const rustig = useRustig()
  const ids = exercise.pairIds ?? []
  const words = ids.map(word)
  const right = useMemo(() => [...words].sort((a, b) => a.nl.localeCompare(b.nl)), [exercise.id])
  const [picked, setPicked] = useState<string | null>(null)
  const [solved, setSolved] = useState<string[]>([])
  const [wrong, setWrong] = useState<string | null>(null)
  const misses = useRef(0)

  const tapLeft = (id: string) => {
    if (solved.includes(id)) return
    sfx.tap()
    setPicked(id)
    say(word(id).ar, { tr: word(id).tr })
  }

  const tapRight = (id: string) => {
    if (solved.includes(id) || !picked) return
    if (picked === id) {
      sfx.correct()
      const next = [...solved, id]
      setSolved(next)
      setPicked(null)
      if (next.length === ids.length) {
        setTimeout(() => onAnswer(misses.current === 0 ? 'goed' : 'bijna'), 350)
      }
    } else {
      misses.current += 1
      sfx.wrong()
      setWrong(id)
      setTimeout(() => setWrong(null), 500)
      setPicked(null)
    }
  }

  /*
   * Dezelfde vier standen als bij de antwoordvakjes, en dezelfde twee
   * bewegingen: een paar dat klopt zakt weg als iets dat af is, een paar dat
   * niet klopt schudt. `mint-600` om dezelfde reden als daar -- `mint-500` op
   * een witte kaart haalt 2,30 op 1 en een rand die zegt "dit paar is klaar"
   * hoort gezien te worden.
   */
  const stand = (id: string, active: boolean): Stand =>
    solved.includes(id) ? 'goed' : wrong === id ? 'fout' : active ? 'gekozen' : 'open'

  const tile = (id: string, active: boolean) =>
    `btn3d w-full rounded-2xl border-2 p-3 text-center transition ${
      solved.includes(id) ? 'border-mint-600 bg-mint-500/15 opacity-60'
      : wrong === id ? 'border-terra-600 bg-terra-500/20'
      : active ? 'border-zellige-500 bg-zellige-500/10'
      : 'border-[var(--line)] bg-[var(--surface-raised)]'
    }`

  /** Eén tegel: de klasse zegt wat er is, de beweging zegt wat er gebeurde. */
  const tegel = (w: { id: string }, active: boolean, tik: () => void, inhoud: React.ReactNode) => (
    <motion.li
      key={w.id}
      animate={rustig ? STIL : BEWEGING[stand(w.id, active)]}
      transition={wrong === w.id ? { duration: 0.26 } : VEER}
    >
      <button className={tile(w.id, active)} onClick={tik} aria-disabled={solved.includes(w.id)}>
        {inhoud}
      </button>
    </motion.li>
  )

  return (
    <div>
      <Prompt hint={t.lesson.koppelParen}>
        <p className="text-sm text-[var(--ink-soft)]">{t.lesson.koppelUitleg}</p>
      </Prompt>
      <div className="grid grid-cols-2 gap-3">
        <ul className="space-y-3">
          {words.map((w) => tegel(w, picked === w.id, () => tapLeft(w.id), <WordText word={w} size="sm" />))}
        </ul>
        <ul className="space-y-3">
          {right.map((w) => tegel(w, false, () => tapRight(w.id), (
            <span className="font-display font-bold">{w.emoji} {meaning(w)}</span>
          )))}
        </ul>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------- build */

/**
 * De regel waar je de zin in legt.
 *
 * Dit was een vak met een stippellijn eromheen, en een stippellijn is de
 * tekening van een gat: hij zegt "hier hoort iets" en verder niets. Een vak dat
 * écht lager ligt dan het papier zegt hetzelfde zonder lijn -- de schaduw valt
 * naar binnen in plaats van naar buiten, precies andersom dan bij een kaart die
 * zweeft. Dat is dezelfde lichtbron, één verdieping lager.
 */
const TROG = 'rounded-2xl bg-[var(--surface-sunken)] shadow-[inset_0_2px_4px_rgba(84,56,24,0.16),inset_0_-1px_0_rgba(255,255,255,0.5)] dark:shadow-[inset_0_2px_5px_rgba(0,0,0,0.7),inset_0_-1px_0_rgba(255,255,255,0.04)]'

/** Een woordje dat op de regel landt, met de veer van de rest van de les. */
function Blokje({ rustig, children, onClick, className }: {
  rustig: boolean
  children: React.ReactNode
  onClick: () => void
  className: string
}) {
  return (
    <motion.li
      initial={rustig ? false : { scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={VEER}
    >
      <button className={`btn3d rounded-xl border-2 px-3 py-2 font-display font-bold ${className}`} onClick={onClick}>
        {children}
      </button>
    </motion.li>
  )
}

function Build({ exercise, onAnswer, locked }: ExerciseProps) {
  const t = useT()
  const meaning = useMeaning()
  const rustig = useRustig()
  const w = word(exercise.wordId)
  const answer = tokenize(w.tr)
  const [bank, setBank] = useState<string[]>(exercise.tokens ?? [])
  const [line, setLine] = useState<string[]>([])

  useEffect(() => {
    setBank(exercise.tokens ?? [])
    setLine([])
  }, [exercise.id])

  const take = (i: number) => {
    if (locked) return
    sfx.tap()
    setLine((l) => [...l, bank[i]!])
    setBank((b) => b.filter((_, j) => j !== i))
  }
  const putBack = (i: number) => {
    if (locked) return
    sfx.tap()
    setBank((b) => [...b, line[i]!])
    setLine((l) => l.filter((_, j) => j !== i))
  }

  const submit = () => {
    sfx.pick()
    const got = line.join(' ')
    onAnswer(got === answer.join(' ') ? 'goed' : checkTyped(got, w), got)
  }

  return (
    <div>
      <Prompt hint={t.lesson.bouwZin}>
        <Vraagkaart className="p-5 text-center">
          <p className="font-display text-xl font-extrabold">{meaning(w)}</p>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">{w.phrase ? w.tr.replace(/\s+/g, ' · ') : w.en}</p>
        </Vraagkaart>
      </Prompt>

      <div className={`mb-4 min-h-16 p-3 ${TROG}`}>
        <ul className="flex flex-wrap gap-2">
          {line.map((t, i) => (
            <Blokje key={`${t}-${i}`} rustig={rustig} onClick={() => putBack(i)} className="border-zellige-500 bg-zellige-500/10">
              {t}
            </Blokje>
          ))}
          {line.length === 0 && <li className="px-2 py-2 text-sm text-[var(--ink-soft)]">{t.lesson.bouwUitleg}</li>}
        </ul>
      </div>

      <ul className="mb-5 flex flex-wrap gap-2">
        {bank.map((t, i) => (
          <Blokje key={`${t}-${i}`} rustig={rustig} onClick={() => take(i)} className="border-[var(--line)] bg-[var(--surface-raised)]">
            {t}
          </Blokje>
        ))}
      </ul>

      <Button className="w-full" disabled={locked || line.length === 0} onClick={submit}>{t.lesson.controleer}</Button>
    </div>
  )
}

/* --------------------------------------------------------------------- type */

function Type({ exercise, onAnswer, locked, mode = 'betekenis' }: ExerciseProps & { mode?: 'betekenis' | 'dictee' }) {
  const t = useT()
  const meaning = useMeaning()
  const w = word(exercise.wordId)
  const [value, setValue] = useState('')
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setValue('')
    input.current?.focus()
  }, [exercise.id])

  // Dictation says it once by itself; after that the speaker is there to ask
  // again, as often as it takes.
  useEffect(() => {
    if (mode === 'dictee') say(w.ar, { tr: w.tr })
  }, [mode, w.ar, w.tr])

  const submit = () => {
    if (locked || !value.trim()) return
    sfx.pick()
    onAnswer(checkTyped(value, w), value)
  }

  return (
    <div>
      <Prompt hint={mode === 'dictee' ? t.bonus.dicteeVraag : t.lesson.schrijfDarija}>
        <Vraagkaart className="p-6 text-center">
          {mode === 'dictee' ? (
            <div className="flex flex-col items-center gap-2">
              <SpeakButton ar={w.ar} tr={w.tr} className="scale-125" />
              <p className="text-sm text-[var(--ink-soft)]">{t.bonus.dicteeHint}</p>
            </div>
          ) : (
            <>
              <div className="text-4xl" aria-hidden="true">{w.emoji}</div>
              <p className="mt-2 font-display text-2xl font-extrabold">{meaning(w)}</p>
            </>
          )}
        </Vraagkaart>
      </Prompt>

      <label className="sr-only" htmlFor="answer">{t.lesson.jouwAntwoord}</label>
      <input
        id="answer"
        ref={input}
        value={value}
        disabled={locked}
        autoComplete="off"
        autoCorrect="off"
        /* iOS zet de eerste letter met een hoofdletter. Het antwoord wordt
           toch kleingemaakt voor het nakijken -- `normalise` in
           `engine/exercises.ts` -- dus goed blijft goed. Maar wat het kind
           intikt hoort te lijken op wat het overal in de app ziet staan, en
           dat is "salam" en niet "Salam". */
        autoCapitalize="off"
        enterKeyHint="go"
        spellCheck={false}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder={t.lesson.schrijfPlaceholder}
        /* Een invoerveld is een gleuf en geen kaart: het licht valt erín, zoals
           bij de regel van de bouwoefening. Zonder dat verschil stond hier een
           witte balk die niet te onderscheiden was van de kaart erboven. */
        className={`w-full border-2 border-[var(--line)] px-4 py-4 text-center font-display text-2xl font-bold outline-none focus:border-zellige-500 ${TROG}`}
      />
      <p className="mt-2 text-center text-xs text-[var(--ink-soft)]">{t.lesson.schrijfHint}</p>
      <Button className="mt-4 w-full" disabled={locked || !value.trim()} onClick={submit}>{t.lesson.controleer}</Button>
    </div>
  )
}

/* ------------------------------------------------------------------ writing */

/**
 * Trace it.
 *
 * A letter is asked in one of its three shapes — with the little connecting
 * strokes the font draws on either side — because that is the form a child
 * will actually have to write inside a word.
 */
function Trace({ exercise, onAnswer, locked }: ExerciseProps) {
  const t = useT()
  const meaning = useMeaning()
  const formName = useFormName()
  const isLetter = exercise.kind === 'letter-schrijf'
  const l = isLetter ? letter(exercise.letterId!) : null
  const w = isLetter ? null : word(exercise.wordId)
  const form = exercise.form ?? 'initial'
  const glyph = l ? l.forms[form] : w!.ar
  const spoken = l ? l.name : w!.tr

  return (
    <div>
      <Vraagkaart className="mb-4 flex items-center gap-3 p-4">
        <div className="ar text-3xl font-bold">{glyph}</div>
        <div className="min-w-0 flex-1">
          <p className="font-display font-extrabold">{spoken}</p>
          <p className="text-sm text-[var(--ink-soft)]">
            {l ? t.bonus.schrijfVorm(formName(form)) : meaning(w!)}
          </p>
        </div>
        <SpeakButton ar={l ? l.ar : w!.ar} tr={spoken} />
      </Vraagkaart>

      <Scribe
        glyph={glyph}
        hint={l ? t.bonus.schrijfVraag : t.bonus.schrijfVraagWoord}
        locked={locked}
        onDone={(score) => onAnswer(score.verdict, t.bonus.gedekt(Math.round(score.coverage * 100)))}
      />
    </div>
  )
}

/* -------------------------------------------------------------------- speak */

/*
  Hier stond `Speak`: een oefening die de spraakherkenning van de browser
  gebruikte en het antwoord liet nakijken.

  Weg, en niet omdat hij kapot was. Twee redenen.

  De eerste staat al in `NaZeggen` hieronder: er bestaat geen spraakherkenning
  die Darija kent. Elke motor is getraind op Standaardarabisch, en dat is een
  andere taal met dezelfde letters. Een kind dat het goed zei kreeg dus "fout"
  te horen van een computer die de taal niet spreekt — en bij uitspraak is dat
  het ergste wat je kunt doen.

  De tweede is waar het geluid heen ging. `webkitSpeechRecognition` doet de
  herkenning niet op het toestel: Chrome stuurt het fragment naar Google. In de
  app gebeurde dat nooit, want een WKWebView kent die API niet en kreeg dus
  altijd `NaZeggen`. Maar op de website wél, en dan ging de stem van een kind
  naar een derde partij voor een oordeel dat toch niet kon kloppen.

  Nu krijgt iedereen `NaZeggen`: je hoort hoe het hoort, je zegt het zelf, en
  je hoort jezelf er meteen achteraan. Het oordeel is van jou.
*/


/**
 * Zeg het na: horen, jezelf opnemen, en de twee naast elkaar horen.
 *
 * Dit is wat er staat waar geen spraakherkenning is — en dat is overal waar
 * deze app als app draait, want een WKWebView heeft geen `SpeechRecognition`
 * en gaat die ook niet krijgen.
 *
 * Er wordt niets herkend en niets goedgekeurd. Dat zou niet kunnen ook: geen
 * enkele motor kent Darija, ze zijn allemaal getraind op Standaardarabisch.
 * Wat er wel gebeurt is het enige dat werkt: je hoort hoe het hoort, je zegt
 * het zelf, en je hoort jezelf er meteen achteraan. Het oordeel is van jou,
 * en dat is bij uitspraak toch al zo.
 */
function NaZeggen({ exercise, onAnswer, locked }: ExerciseProps) {
  const t = useT()
  const w = word(exercise.wordId)
  const [opname, setOpname] = useState<Opname | null>(null)
  const [mijn, setMijn] = useState('')
  const [fout, setFout] = useState(false)
  const speler = useRef<HTMLAudioElement | null>(null)

  // De microfoon mag nooit open blijven staan als het scherm weggaat, en het
  // adres van een opname is geheugen tot je het teruggeeft.
  useEffect(() => () => {
    opname?.weg()
    if (mijn) URL.revokeObjectURL(mijn)
  }, [opname, mijn])

  const begin = async () => {
    if (locked || opname) return
    sfx.tap()
    setFout(false)
    if (mijn) { URL.revokeObjectURL(mijn); setMijn('') }
    try {
      setOpname(await neemOp())
    } catch {
      setFout(true)
    }
  }

  const stop = async () => {
    if (!opname) return
    sfx.tap()
    const adres = await opname.stop()
    setOpname(null)
    setMijn(adres)
  }

  /**
   * Jezelf terughoren.
   *
   * Twee knoppen en niet één: de stem staat al boven in de kaart. Ze
   * achter elkaar afspelen zou mooier klinken, maar `say` zegt niet wanneer
   * hij klaar is, en een kind dat zichzelf wil horen wil dat meteen en niet
   * na een gok van anderhalve seconde.
   */
  const mijnOpname = () => {
    sfx.tap()
    const el = speler.current
    if (!el) return
    el.currentTime = 0
    void el.play().catch(() => {})
  }

  if (!kanOpnemen()) {
    return (
      <div>
        <Prompt hint={t.lesson.zegHardop}>
          <Vraagkaart className="p-6 text-center">
            <WordText word={w} size="lg" showNl />
            <div className="mt-3 flex justify-center"><SpeakButton ar={w.ar} tr={w.tr} /></div>
          </Vraagkaart>
        </Prompt>
        <p className="mb-4 text-center text-sm text-[var(--ink-soft)]">{t.lesson.geenMicrofoon}</p>
        <Button className="w-full" onClick={() => onAnswer('goed')}>{t.lesson.gezegd}</Button>
      </div>
    )
  }

  return (
    <div>
      <Prompt hint={t.lesson.zegHardop}>
        <Vraagkaart className="flex flex-col items-center gap-3 p-6">
          <WordText word={w} size="lg" showNl />
          <SpeakButton ar={w.ar} tr={w.tr} />
        </Vraagkaart>
      </Prompt>

      <div className="flex flex-col items-center gap-3">
        <motion.button
          onClick={() => void (opname ? stop() : begin())}
          disabled={locked}
          animate={opname ? { scale: [1, 1.08, 1] } : { scale: 1 }}
          transition={{ repeat: opname ? Infinity : 0, duration: 1 }}
          /* Vlak en met de schaduw van de rest van de les, net als de
             afspeelknop: het verloop dat hier stond was het enige bolletje in
             de app dat deed alsof het bol was. */
          className={`grid h-28 w-28 place-items-center rounded-full text-5xl text-white ${ZWEEF} ${opname ? 'bg-terra-600' : 'bg-zellige-600 dark:bg-zellige-500'}`}
          aria-label={opname ? t.lesson.stopOpname : t.lesson.neemOp}
        >
          {opname ? '⏹' : '🎤'}
        </motion.button>
        <p className="text-sm text-[var(--ink-soft)]">
          {fout ? t.lesson.geenToestemming : opname ? t.lesson.neemtOp : mijn ? t.lesson.hoorJezelf : t.lesson.tikEnNeemOp}
        </p>

        {mijn && (
          <>
            <audio ref={speler} src={mijn} preload="auto" />
            <Button variant="secondary" className="w-full" onClick={mijnOpname}>
              {t.lesson.mijnOpname}
            </Button>
            <Button className="w-full" onClick={() => { sfx.confirm(); onAnswer('goed') }} disabled={locked}>
              {t.lesson.gezegd}
            </Button>
          </>
        )}

        <button
          className="text-sm font-bold text-[var(--ink-soft)] underline"
          onClick={() => { sfx.back(); onAnswer('bijna', 'overgeslagen') }}
          disabled={locked}
        >
          {t.lesson.slaOver}
        </button>
      </div>
    </div>
  )
}


/* ---------------------------------------------------------------- letters */

/** The name a form goes by on screen. */
function useFormName(): (form: LetterForm) => string {
  const t = useT()
  return (form) => (form === 'initial' ? t.alphabet.begin : form === 'medial' ? t.alphabet.midden : t.alphabet.eind)
}

/** The same three positions, as they fit into a question. */
function useFormPlace(): (form: LetterForm) => string {
  const t = useT()
  return (form) => (form === 'initial' ? t.alphabet.posBegin : form === 'medial' ? t.alphabet.posMidden : t.alphabet.posEind)
}

function NewLetter({ exercise, onAnswer }: ExerciseProps) {
  const t = useT()
  const lang = useLang()
  const formName = useFormName()
  const l = letter(exercise.letterId!)
  const example = l.exampleWordId ? maybeWord(l.exampleWordId) : undefined
  useEffect(() => { sayLetter(l) }, [l.id])

  return (
    <div>
      <Prompt hint={t.lesson.nieuweLetter}>
        <Vraagkaart className="flex flex-col items-center gap-3 p-6">
          <div className="ar text-7xl font-bold">{l.ar}</div>
          <p className="font-display text-2xl font-extrabold">{l.name}</p>
          <p className="text-center text-[var(--ink-soft)]">{t.alphabet.klinktAls(l.sound)}</p>
          <SpeakButton {...letterVoice(l)} zeg={(traag) => sayLetter(l, { slow: traag })} />

          <ul className="mt-2 grid w-full grid-cols-3 gap-2 text-center">
            {(['initial', 'medial', 'final'] as LetterForm[]).map((form) => (
              <li key={form} className="rounded-2xl bg-[var(--surface-sunken)] p-3">
                <div className="ar text-3xl font-bold">{l.forms[form]}</div>
                <div className="mt-1 text-xs font-bold uppercase text-[var(--ink-soft)]">{formName(form)}</div>
              </li>
            ))}
          </ul>

          {!connects(l.id) && (
            <p className="rounded-2xl bg-saffron-500/10 px-4 py-2 text-center text-sm text-[var(--ink-soft)]">
              ✂️ {t.lesson.plaktNiet}
            </p>
          )}

          {example && (
            <div className="mt-1 flex w-full items-center gap-3 rounded-2xl bg-zellige-500/10 p-3">
              <span className="text-2xl" aria-hidden="true">{example.emoji ?? '📝'}</span>
              <div className="min-w-0 flex-1">
                <div className="ar text-xl font-bold">{example.ar}</div>
                <div className="text-sm text-[var(--ink-soft)]">{example.tr}</div>
              </div>
              <SpeakButton ar={example.ar} tr={example.tr} />
            </div>
          )}
        </Vraagkaart>
      </Prompt>
      <Button className="w-full" sound="confirm" onClick={() => onAnswer('goed')}>{t.lesson.snapIk}</Button>
      <p className="sr-only">{lang}</p>
    </div>
  )
}

/** One question about a letter: which glyph, which name, or which shape. */
function LetterChoice({ exercise, onAnswer, locked, mode }: ExerciseProps & { mode: 'klank' | 'naam' | 'vorm' }) {
  const t = useT()
  const formPlace = useFormPlace()
  const rustig = useRustig()
  const [chosen, setChosen] = useState<string | null>(null)
  const l = letter(exercise.letterId!)
  const form = exercise.form ?? 'initial'
  const ids = exercise.letterOptions ?? []

  useEffect(() => {
    setChosen(null)
    if (mode === 'klank') sayLetter(l)
  }, [exercise.id, mode, l.id])

  const choose = (id: string) => {
    if (locked) return
    sfx.pick()
    setChosen(id)
    onAnswer(id === l.id ? 'goed' : 'fout')
  }

  const hint =
    mode === 'klank' ? t.lesson.welkeLetter
    : mode === 'naam' ? t.lesson.hoeHeetLetter
    : t.lesson.welkeVorm(formPlace(form))

  return (
    <div>
      <Prompt hint={hint}>
        {mode === 'klank' ? (
          <Vraagkaart className="p-6 text-center">
            <p className="font-display text-3xl font-extrabold">{l.name}</p>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">{t.alphabet.klinktAls(l.sound)}</p>
            <div className="mt-3 flex justify-center"><SpeakButton {...letterVoice(l)} zeg={(traag) => sayLetter(l, { slow: traag })} /></div>
          </Vraagkaart>
        ) : (
          <Vraagkaart className="flex items-center justify-center gap-4 p-6">
            <span className="ar text-6xl font-bold">{l.ar}</span>
            <SpeakButton {...letterVoice(l)} zeg={(traag) => sayLetter(l, { slow: traag })} />
          </Vraagkaart>
        )}
      </Prompt>

      <div className={`grid gap-3 ${mode === 'naam' ? 'sm:grid-cols-2' : 'grid-cols-2'}`}>
        {ids.map((id) => {
          const o = letter(id)
          return (
            <Antwoordknop
              key={id}
              rustig={rustig}
              stand={standVan(chosen, id, l.id, locked)}
              onKies={() => choose(id)}
              className="p-4 text-center"
            >
              {mode === 'naam'
                ? <span className="font-display text-lg font-bold">{o.name} <span className="text-[var(--ink-soft)]">· {o.tr}</span></span>
                : <span className="ar text-4xl font-bold">{mode === 'vorm' ? o.forms[form] : o.ar}</span>}
            </Antwoordknop>
          )
        })}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------- sentences */

/** What a sentence means, in the language the learner picked. */
function useSentenceMeaning() {
  const lang = useLang()
  return (id: string) => sentenceMeaning(sentence(id), lang)
}

function NewSentence({ exercise, onAnswer }: ExerciseProps) {
  const t = useT()
  const meaning = useSentenceMeaning()
  const { showScript, showTranslit } = useStore((s) => s.settings)
  const z = sentence(exercise.sentenceId!)
  useEffect(() => { say(z.ar, { tr: z.tr }) }, [z.ar, z.tr])

  return (
    <div>
      <Prompt hint={t.lesson.nieuweZin}>
        <Vraagkaart className="flex flex-col items-center gap-3 p-6 text-center">
          <span className="text-3xl" aria-hidden="true">💬</span>
          {showScript && <p className="ar text-3xl font-bold">{z.ar}</p>}
          {(showTranslit || !showScript) && (
            <p className="font-display text-lg font-bold text-zellige-600 dark:text-zellige-300">{z.tr}</p>
          )}
          <p className="font-display text-xl font-extrabold">{meaning(z.id)}</p>
          <SpeakButton ar={z.ar} tr={z.tr} />
          <p className="text-xs text-[var(--ink-soft)]">{t.lesson.zinLangzaam}</p>
        </Vraagkaart>
      </Prompt>
      <Button className="w-full" sound="confirm" onClick={() => onAnswer('goed')}>{t.lesson.snapIk}</Button>
    </div>
  )
}

function SentenceBuild({ exercise, onAnswer, locked }: ExerciseProps) {
  const t = useT()
  const meaning = useSentenceMeaning()
  const rustig = useRustig()
  const z = sentence(exercise.sentenceId!)
  const answer = tokenize(z.tr)
  const [bank, setBank] = useState<string[]>(exercise.tokens ?? [])
  const [line, setLine] = useState<string[]>([])

  useEffect(() => {
    setBank(exercise.tokens ?? [])
    setLine([])
  }, [exercise.id])

  const take = (i: number) => {
    if (locked) return
    sfx.tap()
    setLine((l) => [...l, bank[i]!])
    setBank((b) => b.filter((_, j) => j !== i))
  }
  const putBack = (i: number) => {
    if (locked) return
    sfx.tap()
    setBank((b) => [...b, line[i]!])
    setLine((l) => l.filter((_, j) => j !== i))
  }

  const submit = () => {
    sfx.pick()
    const got = line.join(' ')
    // Word order is the whole exercise, so the tiles have to be in the right
    // order; the spelling itself is already decided by the tiles.
    const verdict: Verdict =
      got === answer.join(' ') ? 'goed' : normalise(got) === normalise(z.tr) ? 'bijna' : 'fout'
    onAnswer(verdict, got)
  }

  return (
    <div>
      <Prompt hint={t.lesson.bouwZin}>
        <Vraagkaart className="p-5 text-center">
          <p className="font-display text-xl font-extrabold">{meaning(z.id)}</p>
          <div className="mt-2 flex justify-center"><SpeakButton ar={z.ar} tr={z.tr} /></div>
        </Vraagkaart>
      </Prompt>

      <div className={`mb-4 min-h-16 p-3 ${TROG}`}>
        <ul className="flex flex-wrap gap-2">
          {line.map((token, i) => (
            <Blokje key={`${token}-${i}`} rustig={rustig} onClick={() => putBack(i)} className="border-zellige-500 bg-zellige-500/10">
              {token}
            </Blokje>
          ))}
          {line.length === 0 && <li className="px-2 py-2 text-sm text-[var(--ink-soft)]">{t.lesson.bouwUitleg}</li>}
        </ul>
      </div>

      <ul className="mb-5 flex flex-wrap gap-2">
        {bank.map((token, i) => (
          <Blokje key={`${token}-${i}`} rustig={rustig} onClick={() => take(i)} className="border-[var(--line)] bg-[var(--surface-raised)]">
            {token}
          </Blokje>
        ))}
      </ul>

      <Button className="w-full" disabled={locked || line.length === 0} onClick={submit}>{t.lesson.controleer}</Button>
    </div>
  )
}

function SentenceChoice({ exercise, onAnswer, locked, mode }: ExerciseProps & { mode: 'betekenis' | 'luister' }) {
  const t = useT()
  const meaning = useSentenceMeaning()
  const rustig = useRustig()
  const [chosen, setChosen] = useState<string | null>(null)
  const z = sentence(exercise.sentenceId!)
  const ids = exercise.sentenceOptions ?? []

  useEffect(() => {
    setChosen(null)
    if (mode === 'luister') say(z.ar, { tr: z.tr })
  }, [exercise.id, mode, z.ar, z.tr])

  const choose = (id: string) => {
    if (locked) return
    sfx.pick()
    setChosen(id)
    onAnswer(id === z.id ? 'goed' : 'fout')
  }

  return (
    <div>
      <Prompt hint={mode === 'betekenis' ? t.lesson.watBetekentZin : t.lesson.welkeZinHoorJe}>
        {mode === 'betekenis' ? (
          <Vraagkaart className="flex flex-col items-center gap-2 p-6 text-center">
            <p className="ar text-2xl font-bold">{z.ar}</p>
            <p className="font-display font-bold text-zellige-600 dark:text-zellige-300">{z.tr}</p>
            <SpeakButton ar={z.ar} tr={z.tr} />
          </Vraagkaart>
        ) : (
          <div className="flex flex-col items-center gap-5">
            <Luisterknop
              rustig={rustig}
              onSpeel={() => say(z.ar, { tr: z.tr })}
              onTraag={() => say(z.ar, { tr: z.tr, slow: true })}
              label={t.lesson.speelAf}
            />
            <button className="min-h-11 px-3 text-sm font-bold text-[var(--ink-soft)] underline" onClick={() => say(z.ar, { tr: z.tr, slow: true })}>
              {t.lesson.langzamer}
            </button>
          </div>
        )}
      </Prompt>

      <div className="grid gap-3">
        {ids.map((id) => (
          <Antwoordknop
            key={id}
            rustig={rustig}
            stand={standVan(chosen, id, z.id, locked)}
            onKies={() => choose(id)}
            className="p-4 text-start"
          >
            {mode === 'betekenis'
              ? <span className="font-display text-base font-bold">{meaning(id)}</span>
              : <span className="ar text-xl font-bold">{sentence(id).ar}</span>}
          </Antwoordknop>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ router */

/**
 * Een luisteroefening zonder geluid is geen oefening.
 *
 * `say()` doet niets als het geluid uitstaat, en dan staat er een vraag "wat
 * hoor je?" met een knop van 112 bij 112 die zwijgt, een linkje "langzamer"
 * dat ook zwijgt, en vier antwoorden. Je kunt alleen gokken, en gokken kost
 * een hartje en zet het woord verkeerd in de planning. Nagelopen in de code:
 * `luister`, `zin-luister`, `dictee` en `letter-klank` zitten alle vier zo in
 * elkaar, en het leerpad deelt ze gewoon uit.
 *
 * En dat geluid staat niet per ongeluk uit. Het is een schakelaar in de
 * instellingen, en wie hem omzet doet dat met een reden: een slapende broer,
 * een trein, een klas. De app hoort dan door te kunnen.
 *
 * Dus wisselt hij ze om voor de variant die dezelfde antwoorden heeft maar
 * leest in plaats van luistert. Dat kan omdat de opties van beide varianten
 * dezelfde vorm hebben — er wordt niets opnieuw opgebouwd. Precies zoals
 * `spreek` het al deed voor een toestel zonder spraakherkenning.
 */
export function ExerciseView(props: ExerciseProps) {
  const speechOn = useStore((s) => s.settings.speech)
  const soundOn = useStore((s) => s.settings.sound)
  switch (props.exercise.kind) {
    case 'nieuw': return <NewWord {...props} />
    case 'kies-betekenis': return <Choice {...props} mode="betekenis" />
    case 'kies-darija': return <Choice {...props} mode="darija" />
    case 'luister': return <Choice {...props} mode={soundOn ? 'luister' : 'betekenis'} />
    case 'script': return <Choice {...props} mode="script" />
    case 'koppel': return <Match {...props} />
    case 'bouw': return <Build {...props} />
    case 'tik': return <Type {...props} />
    case 'dictee': return soundOn ? <Type {...props} mode="dictee" /> : <Type {...props} />
    case 'schrijf': return <Trace {...props} />
    case 'spreek': return speechOn ? <NaZeggen {...props} /> : <Type {...props} />
    case 'letter-nieuw': return <NewLetter {...props} />
    case 'letter-klank': return <LetterChoice {...props} mode={soundOn ? 'klank' : 'naam'} />
    case 'letter-naam': return <LetterChoice {...props} mode="naam" />
    case 'letter-vorm': return <LetterChoice {...props} mode="vorm" />
    case 'letter-schrijf': return <Trace {...props} />
    case 'zin-nieuw': return <NewSentence {...props} />
    case 'zin-bouw': return <SentenceBuild {...props} />
    case 'zin-betekenis': return <SentenceChoice {...props} mode="betekenis" />
    case 'zin-luister': return <SentenceChoice {...props} mode={soundOn ? 'luister' : 'betekenis'} />
  }
}
