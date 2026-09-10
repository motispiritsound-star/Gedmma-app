import { motion } from 'framer-motion'
import type { Word } from '../content/types'
import { say, sfx } from '../engine/audio'
import { useStore } from '../engine/store'

/** The meaning in the language the learner picked in Instellingen. */
export function useMeaning(): (w: Word) => string {
  const lang = useStore((s) => s.settings.lang)
  return (w: Word) => (lang === 'en' ? w.en : w.nl)
}

/** One word, shown the way the learner has chosen to see words. */
export function WordText({ word, size = 'md', showNl = false }: { word: Word; size?: 'sm' | 'md' | 'lg'; showNl?: boolean }) {
  const { showScript, showTranslit } = useStore((s) => s.settings)
  const meaning = useMeaning()
  const ar = size === 'lg' ? 'text-4xl sm:text-5xl' : size === 'md' ? 'text-2xl' : 'text-xl'
  const tr = size === 'lg' ? 'text-xl' : size === 'md' ? 'text-base' : 'text-sm'
  return (
    <div className="flex flex-col items-center gap-1">
      {showScript && <div className={`ar font-bold ${ar}`}>{word.ar}</div>}
      {(showTranslit || !showScript) && <div className={`font-display font-bold text-zellige-600 dark:text-zellige-300 ${tr}`}>{word.tr}</div>}
      {showNl && <div className="text-sm text-[var(--ink-soft)]">{meaning(word)}</div>}
    </div>
  )
}

export function SpeakButton({ ar, tr, className = '', label = 'Luister' }: { ar: string; tr?: string; className?: string; label?: string }) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={() => { sfx.tap(); say(ar, { tr }) }}
      onDoubleClick={() => say(ar, { tr, slow: true })}
      title="Klik om te horen, dubbelklik voor langzaam"
      aria-label={label}
      className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-zellige-500 text-zellige-600 transition hover:bg-zellige-500 hover:text-white dark:text-zellige-300 ${className}`}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
        <path d="M4 9v6h4l5 4V5L8 9H4zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zm-2.5 7.9a8 8 0 0 0 0-15.8v2.06a6 6 0 0 1 0 11.68z" />
      </svg>
    </motion.button>
  )
}
