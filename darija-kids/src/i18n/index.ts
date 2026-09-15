import { useStore } from '../engine/store'
import { nl, type Strings } from './nl'
import { fr } from './fr'
import { de } from './de'
import { es } from './es'
import { en } from './en'
import type { Lang } from './languages'

export type { Strings } from './nl'
export * from './languages'

export const STRINGS: Record<Lang, Strings> = { nl, fr, de, es, en }

/** The interface strings for the language the learner picked. */
export function useT(): Strings {
  const lang = useStore((s) => s.settings.lang)
  return STRINGS[lang]
}

export function useLang(): Lang {
  return useStore((s) => s.settings.lang)
}
