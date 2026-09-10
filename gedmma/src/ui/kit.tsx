import type { ReactNode, ButtonHTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import { sfx } from '../engine/audio'

/** The building blocks the whole app is assembled from. */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-saffron-500 text-night-950 border-saffron-600 hover:bg-saffron-400',
  success: 'bg-mint-500 text-white border-mint-600 hover:bg-mint-400',
  secondary: 'bg-[var(--surface-raised)] text-[var(--ink)] border-[var(--line)] hover:border-zellige-500',
  ghost: 'bg-transparent text-[var(--ink-soft)] border-transparent hover:text-[var(--ink)]',
  danger: 'bg-terra-500 text-white border-terra-600 hover:bg-terra-300',
}

export function Button({
  variant = 'primary', className = '', children, onClick, mute, ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; mute?: boolean }) {
  return (
    <button
      {...rest}
      onClick={(e) => {
        if (!mute) sfx.tap()
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
        className="w-full max-w-lg rounded-t-3xl border border-[var(--line)] bg-[var(--surface-raised)] p-6 shadow-2xl sm:rounded-3xl"
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
  return (
    <Card className="p-4 text-center">
      {emoji && <div className="text-2xl">{emoji}</div>}
      <div className="font-display text-3xl font-extrabold">{value}</div>
      <div className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">{label}</div>
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
