import type { EditorLocaleText, EditorQuest } from './quest-editor-types'

const EMPTY_TEXT: EditorLocaleText = {
  title: '',
  shortDescription: '',
  story: '',
  educationalObjective: '',
  expectedResult: '',
  preparation: [],
  reflectionQuestions: [],
}

/**
 * Blank starting point for the quest editor.
 *
 * Kept out of the `'use client'` module on purpose: every export of a client
 * module becomes an opaque client reference on the server, so a server page
 * that spread this constant would receive an empty object.
 */
export const EMPTY_QUEST: EditorQuest = {
  slug: '',
  categorySlug: '',
  ageBands: ['AGE_9_11'],
  durationMinutes: 45,
  difficulty: 'EASY',
  setting: 'BOTH',
  weather: ['ANY'],
  seasons: [],
  minParticipants: 1,
  maxParticipants: 4,
  requiresAdult: false,
  isPremium: false,
  imageKey: 'quest-default',
  skillSlugs: [],
  materials: [],
  safety: [],
  steps: [
    {
      position: 0,
      estimatedMinutes: 10,
      requiresAdult: false,
      en: { title: '', instruction: '' },
      nl: { title: '', instruction: '' },
    },
  ],
  en: EMPTY_TEXT,
  nl: { ...EMPTY_TEXT },
}
