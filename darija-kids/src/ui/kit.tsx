import type { ReactNode, ButtonHTMLAttributes } from 'react'
import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { sfx } from '../engine/audio'
import { useStore } from '../engine/store'
import { Plaat } from './Motief'
import { useRustig } from './rustig'
import { opTerug } from '../engine/terug'

/** The building blocks the whole app is assembled from. */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'

const VARIANTS: Record<Variant, string> = {
  /* De kleur die de gebruiker koos; saffraan als hij niets koos. Zie
     `--accent-*` in index.css en `ACCENTEN` in engine/store.ts. */
  primary: 'bg-[var(--accent-500)] text-[var(--accent-ink)] border-[var(--accent-600)] hover:bg-[var(--accent-400)]',
  success: 'bg-mint-500 text-white border-mint-600 hover:bg-mint-400',
  secondary: 'bg-[var(--surface-raised)] text-[var(--ink)] border-[var(--line)] hover:border-zellige-500',
  ghost: 'bg-transparent text-[var(--ink-soft)] border-transparent hover:text-[var(--ink)]',
  /* Een trede donkerder: wit op `terra-500` haalde 3,52 op 1, op `terra-600`
     4,84. De rand erbij zakt mee zodat de knop zijn reliëf houdt. */
  danger: 'bg-terra-600 text-white border-terra-700 hover:bg-terra-500',
}

/**
 * What a button sounds like, from what it is for. A press that moves you
 * forward should not sound like one that takes you back, and nothing in the
 * app should be pressable in silence.
 */
type Press = 'tap' | 'nav' | 'back' | 'confirm'

const PRESS: Record<Variant, Press> = {
  primary: 'tap',
  success: 'confirm',
  secondary: 'nav',
  ghost: 'nav',
  danger: 'back',
}

export function Button({
  variant = 'primary', className = '', children, onClick, mute, sound, ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; mute?: boolean; sound?: Press }) {
  return (
    <button
      {...rest}
      onClick={(e) => {
        if (!mute) sfx[sound ?? PRESS[variant]]()
        onClick?.(e)
      }}
      className={`btn3d select-none rounded-2xl border-2 px-5 py-3 font-display text-base font-extrabold tracking-wide uppercase disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export function Card({ children, className = '', ...rest }: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...rest} className={`rounded-3xl border border-[var(--line)] bg-[var(--surface-raised)] shadow-sm ${className}`}>
      {children}
    </div>
  )
}

export function Progress({ value, className = '', tone = 'mint' }: { value: number; className?: string; tone?: 'mint' | 'saffron' | 'zellige' | 'accent' }) {
  /* `accent` is de kleur die de gebruiker koos. De andere drie staan vast,
     want ze zeggen iets: mint is vooruitgang, zellige is een reeks. */
  const bar =
    tone === 'accent' ? 'bg-[var(--accent-500)]'
    : tone === 'mint' ? 'bg-mint-500'
    : tone === 'saffron' ? 'bg-saffron-500'
    : 'bg-zellige-500'
  return (
    <div className={`h-3.5 w-full overflow-hidden rounded-full bg-[var(--surface-sunken)] ${className}`}>
      <motion.div
        className={`h-full rounded-full ${bar}`}
        initial={false}
        animate={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}
        transition={{ type: 'spring', stiffness: 180, damping: 24 }}
      />
    </div>
  )
}

export function Pill({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface-raised)] px-3 py-1 text-sm font-semibold ${className}`}>
      {children}
    </span>
  )
}

/** Wat je met Tab kunt bereiken. */
const FOCUSBAAR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), summary, details'

/** Hoeveel panelen er openstaan, zodat het laatste de pagina weer vrijgeeft. */
let openPanelen = 0

export function Sheet({ open, onClose, onTerug, children, labelledBy }: {
  open: boolean
  /** Sluit met een tik naast het paneel, met Escape en met de terugknop. */
  onClose?: () => void
  /**
   * Sluit met Escape en met de terugknop, maar níét met een tik ernaast.
   *
   * Voor een paneel dat iets te zeggen heeft wat je niet per ongeluk mag
   * kwijtraken: het keuzescherm na de taalkeuze komt één keer voorbij, en een
   * kinderduim die naast het paneel landt zou het voorgoed wegnemen. Escape en
   * de terugknop zijn wél bewuste handelingen.
   */
  onTerug?: () => void
  children: ReactNode
  labelledBy?: string
}) {
  const paneel = useRef<HTMLDivElement>(null)
  /*
   * `onClose` is bij elke gebruiker een pijlfunctie in de JSX, dus hij is bij
   * elke tekening een ander ding. Stond hij in de afhankelijkheden, dan werd
   * de luisteraar continu opnieuw opgehangen en sprong de focus telkens terug
   * naar het begin van het paneel -- middenin het typen van een rekensom.
   */
  const sluit = useRef(onTerug ?? onClose)
  sluit.current = onTerug ?? onClose
  /** Waar de focus vandaan kwam, zodat hij daar weer terugkomt. */
  const kwamVan = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    kwamVan.current = document.activeElement as HTMLElement | null

    /*
     * De pagina eronder staat stil zolang dit openstaat. Zonder dat scrolt een
     * veeg over het donkere vlak de bladzijde erachter weg, en als het paneel
     * dichtgaat staat die ergens anders dan waar je was.
     */
    openPanelen += 1
    const terugNaar = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // De focus hoort binnen het paneel te beginnen: een schermlezer leest
    // anders de bladzijde erachter voor, die niemand meer kan bedienen.
    const eerste = paneel.current?.querySelector<HTMLElement>(FOCUSBAAR)
    ;(eerste ?? paneel.current)?.focus()

    const opToets = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Geen `onClose` betekent: dit paneel heeft zijn eigen knoppen en gaat
        // niet zomaar dicht. De taalkeuze bij de eerste start is zo'n geval.
        if (!sluit.current) return
        e.preventDefault()
        sluit.current()
        return
      }
      if (e.key !== 'Tab' || !paneel.current) return
      const items = [...paneel.current.querySelectorAll<HTMLElement>(FOCUSBAAR)]
        .filter((el) => el.offsetParent !== null || el === document.activeElement)
      if (items.length === 0) return
      const eerst = items[0]!
      const laatst = items[items.length - 1]!
      const nu = document.activeElement
      // Rondlopen in plaats van eruit lopen: Tab op het laatste ding gaat naar
      // het eerste, Shift+Tab op het eerste naar het laatste.
      if (e.shiftKey && (nu === eerst || nu === paneel.current)) { e.preventDefault(); laatst.focus() }
      else if (!e.shiftKey && nu === laatst) { e.preventDefault(); eerst.focus() }
    }

    document.addEventListener('keydown', opToets)
    // Op Android is terug een systeemknop, en die hoort dit paneel te sluiten
    // in plaats van een bladzijde terug te gaan.
    const stopTerug = sluit.current ? opTerug(() => sluit.current?.()) : () => {}

    return () => {
      document.removeEventListener('keydown', opToets)
      stopTerug()
      openPanelen = Math.max(0, openPanelen - 1)
      if (openPanelen === 0) document.body.style.overflow = terugNaar
      kwamVan.current?.focus?.()
    }
  }, [open])

  if (!open) return null
  return (
    /* `niet-op-papier`: een paneel ligt over de bladzijde, en op papier is er
       geen bladzijde om over te liggen. Zonder dit drukt een afdruk die gestart
       wordt terwijl er een paneel openstaat een grijs vlak af met het paneel
       erin. Zie de afdrukstijl onderaan index.css. */
    <div className="niet-op-papier fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-6" onClick={onClose}>
      <motion.div
        ref={paneel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        initial={{ y: 40, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 240, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        /*
          `max-h-full overflow-y-auto`: zonder dat is alles wat boven de
          bovenrand uitkomt onbereikbaar.

          Dit omhulsel staat `fixed inset-0` met `items-end`, en de bladzijde
          eronder staat op `overflow: hidden` zolang er een paneel openstaat --
          met goede reden, zie hierboven. Maar het paneel zelf had geen
          maximale hoogte en geen eigen scroll, dus een paneel dat hoger werd
          dan het scherm groeide de bovenrand uit en daar hielp geen wiel en
          geen veeg meer tegen.

          Nagemeten op het startscherm, 320 bij 568: de kop van drie van de
          vier stappen stond boven de rand (-7, -15 en -91 pixels), en op stap
          drie begon het scherm midden in een zin. De mascotte, de vier ruiten,
          de kop "Wie soll es aussehen?" en twee regels uitleg waren weg en
          niet te bereiken. De knoppen bleven staan, dus de app bleef
          bedienbaar -- wat weg was, is de vraag die de knoppen uitlegt. Op 360
          bij 640, precies de klasse toestel waarvoor er op es2015 gebouwd
          wordt, gold hetzelfde voor stap twee en drie, en op 390 bij 844 met
          een letterstand van 125% voor stap drie.

          Dit raakt elk paneel in de app en niet alleen dat ene: de
          kopieerknop uit Instellingen zet er een veld van 160 pixels in, en
          een tekst die een vertaling langer uitvalt kon elk ander paneel over
          de rand duwen. `overscroll-contain` houdt de veeg binnen het paneel.
        */
        className="max-h-full w-full max-w-lg overflow-y-auto overscroll-contain rounded-t-3xl border border-[var(--line)] bg-[var(--surface-raised)] px-6 pt-6 shadow-2xl sm:rounded-3xl"
        /*
         * Op een telefoon plakt dit paneel tegen de onderrand -- zie
         * `items-end` hierboven. Met targetSdkVersion 36 tekent Android 15 tot
         * in de hoeken, en dan ligt de gebarenbalk over de onderste knop.
         *
         * Juist hier is dat vervelend: dit is het paneel van de taalkeuze bij
         * de eerste start en van de tip vóór een les. De knop eronder is het
         * enige wat je verder brengt.
         *
         * De 1.5rem is de `p-6` die hier stond; die is naar `px-6 pt-6`
         * gegaan omdat een inline stijl de padding-bottom toch overschrijft.
         * Op een breed scherm staat het paneel gecentreerd en is de inset nul,
         * dus daar verandert er niets.
         */
        style={{ paddingBottom: 'calc(1.5rem + var(--rand-onder))' }}
      >
        {children}
      </motion.div>
    </div>
  )
}

export function SectionTitle({ children, sub, kop = 'h2' }: { children: ReactNode; sub?: ReactNode; kop?: 'h1' | 'h2' }) {
  /*
   * `kop="h1"` als dit de titel van de bladzijde is.
   *
   * Nagelopen over vijftien bladzijden: op elf stond helemaal geen `h1`. Een
   * schermlezer springt met één toets naar de kop van een bladzijde, en op
   * die elf landde je dan nergens — je moest je vanaf de kopbalk omlaag
   * werken om te horen waar je was. VoiceOver en TalkBack beginnen allebei
   * bij die kop.
   *
   * Hij blijft `h2` tenzij je het zegt, want op een paar bladzijden is dit
   * een tussenkop onder een titel die er al staat: op /profiel is de `h1` de
   * naam van het kind, en "Beloningen" eronder hoort daaraan vast.
   */
  const Kop = kop
  return (
    <div className="mb-4">
      <Kop className="font-display text-2xl font-extrabold sm:text-3xl">{children}</Kop>
      {sub && <p className="mt-1 text-[var(--ink-soft)]">{sub}</p>}
    </div>
  )
}

/** A big number with a label — used for streaks, XP and the parent report. */
export function Stat({ value, label, emoji, index }: {
  value: ReactNode
  label: string
  emoji?: string
  /**
   * De plek in de rij, als de tegels één voor één binnen horen te komen.
   *
   * Zonder dit staat de tegel er gewoon. Met: vijftig milliseconde later dan
   * de vorige, zodat een rij van vier leest als een rij en niet als een blok
   * dat er ineens staat. Uit in de rustige stand, en dan staan ze er meteen --
   * alle vier, niet alsnog met vertraging.
   */
  index?: number
}) {
  // Hyphenation needs to know the language, or the browser will not break.
  const lang = useStore((s) => s.settings.lang)
  const rustig = useRustig()
  const komtBinnen = index !== undefined && !rustig
  return (
    // `min-w-0` because a grid cell refuses to shrink below its content, and
    // one long German word — "nachgezeichnet" — was enough to push the whole
    // page sideways on a narrow phone. `hyphens` lets it break instead.
    //
    // De schaduw staat in een stijl en niet in een klasse: `Card` draagt zelf
    // `shadow-sm`, en Tailwind zet zijn eigen trede later in het blad, dus een
    // `shadow-[...]`-klasse hiernaast doet niets. Een variabele wel.
    <motion.div
      className="min-w-0 rounded-3xl border border-[var(--line)] bg-[var(--surface-raised)] px-2 py-4 text-center"
      /*
        De schaduw in een stijl en niet in een klasse: zo'n `shadow-[...]`
        verliest van de `shadow-sm` die een `Card` draagt, omdat Tailwind zijn
        eigen trede later in het blad zet. Een variabele niet. Daarom staat de
        rand hier uitgeschreven in plaats van via `Card` te lopen -- het is
        dezelfde rand, met een schaduw die wél aankomt.
      */
      style={{ boxShadow: 'var(--schaduw-laag)' }}
      initial={komtBinnen ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 180, damping: 24, delay: komtBinnen ? index * 0.05 : 0 }}
    >
      {/*
        De emoji ligt op een plaat en zweeft er niet los boven.

        Vier losse emoji's naast elkaar lezen als een rijtje; vier emoji's op
        dezelfde zellige-plaat lezen als een set. Dit stond eerst alleen op
        /profiel, als een eigen `Tegel` naast deze `Stat` -- en dan is de rij
        van vier getallen op /profiel een andere dan die op /herhalen, /bonus en
        /ouders, terwijl het dezelfde rij is.

        Zellige en niet de gekozen kleur: die eigen kleur is op het profiel het
        woord "jij" -- je avatar, je voortgang, vandaag, wat je behaald hebt.
        Zet je hem ook onder elk getal, dan zegt hij niets meer.
      */}
      {emoji && (
        <span className="relative mx-auto block h-10 w-10 text-zellige-500">
          <Plaat vol />
          <span className="absolute inset-0 grid place-items-center text-xl" aria-hidden="true">{emoji}</span>
        </span>
      )}
      <div className="mt-1 font-display text-3xl font-extrabold">{value}</div>
      {/*
        Geen letterspatiëring, en een maat kleiner.

        Er stond `tracking-wide` op, en bij hoofdletters telt dat op: elke
        letter een stukje breder, in een tegel die op een telefoon nog geen
        tachtig pixels binnenwerk heeft. Dan past het woord niet, en dan grijpt
        `break-words` in — die is er als vangnet tegen een bladzijde die
        zijwaarts wegschuift, maar hij knipt waar hij uitkomt. Op het scherm
        stond letterlijk "VASTGEZE" met op de regel eronder "T".

        Gemeten op 320 en 390 pixels in alle zes de talen: zo brak het in vijf
        van de zes. Zonder de spatiëring en op elf pixels past alles.

        `break-words` blijft staan als laatste redmiddel. Komt er ooit een taal
        met een woord dat alsnog niet past, dan is een lelijke afbreking beter
        dan een bladzijde die je opzij kunt schuiven.
      */}
      <div
        lang={lang}
        className="hyphens-auto break-words text-[11px] font-semibold uppercase text-[var(--ink-soft)]"
      >
        {label}
      </div>
    </motion.div>
  )
}

export const ACCENTS: Record<string, string> = {
  saffron: 'from-saffron-400 to-terra-500',
  terra: 'from-terra-300 to-terra-600',
  zellige: 'from-zellige-300 to-zellige-700',
  mint: 'from-mint-400 to-zellige-600',
  violet: 'from-violet-400 to-fuchsia-600',
  sky: 'from-sky-400 to-blue-600',
}
