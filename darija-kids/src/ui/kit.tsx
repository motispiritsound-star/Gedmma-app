import type { ReactNode, ButtonHTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import { sfx } from '../engine/audio'
import { useStore } from '../engine/store'

/** The building blocks the whole app is assembled from. */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-saffron-500 text-night-950 border-saffron-600 hover:bg-saffron-400',
  success: 'bg-mint-500 text-white border-mint-600 hover:bg-mint-400',
  secondary: 'bg-[var(--surface-raised)] text-[var(--ink)] border-[var(--line)] hover:border-zellige-500',
  ghost: 'bg-transparent text-[var(--ink-soft)] border-transparent hover:text-[var(--ink)]',
  danger: 'bg-terra-500 text-white border-terra-600 hover:bg-terra-300',
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

export function Progress({ value, className = '', tone = 'mint' }: { value: number; className?: string; tone?: 'mint' | 'saffron' | 'zellige' }) {
  const bar = tone === 'mint' ? 'bg-mint-500' : tone === 'saffron' ? 'bg-saffron-500' : 'bg-zellige-500'
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

export function Sheet({ open, onClose, children, labelledBy }: { open: boolean; onClose?: () => void; children: ReactNode; labelledBy?: string }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-6" onClick={onClose}>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        initial={{ y: 40, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 240, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-t-3xl border border-[var(--line)] bg-[var(--surface-raised)] px-6 pt-6 shadow-2xl sm:rounded-3xl"
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
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      >
        {children}
      </motion.div>
    </div>
  )
}

export function SectionTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-4">
      <h2 className="font-display text-2xl font-extrabold sm:text-3xl">{children}</h2>
      {sub && <p className="mt-1 text-[var(--ink-soft)]">{sub}</p>}
    </div>
  )
}

/** A big number with a label — used for streaks, XP and the parent report. */
export function Stat({ value, label, emoji }: { value: ReactNode; label: string; emoji?: string }) {
  // Hyphenation needs to know the language, or the browser will not break.
  const lang = useStore((s) => s.settings.lang)
  return (
    // `min-w-0` because a grid cell refuses to shrink below its content, and
    // one long German word — "nachgezeichnet" — was enough to push the whole
    // page sideways on a narrow phone. `hyphens` lets it break instead.
    <Card className="min-w-0 px-2 py-4 text-center">
      {emoji && <div className="text-2xl">{emoji}</div>}
      <div className="font-display text-3xl font-extrabold">{value}</div>
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
    </Card>
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
