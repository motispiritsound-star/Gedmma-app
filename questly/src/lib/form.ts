import { ZodError } from 'zod'
import { isAppError } from '@/lib/errors'
import { logger } from '@/lib/logger'

/** The shape every server action returns to a `useActionState` form. */
export type FormState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  fieldErrors?: Record<string, string[]>
  /** Optional payload for actions that create something. */
  data?: Record<string, string>
}

export const idleState: FormState = { status: 'idle' }

/** Maps thrown errors onto a form state without leaking internals to the user. */
export function toFormState(error: unknown, fallback = 'Something went wrong.'): FormState {
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of error.issues) {
      const key = issue.path.join('.') || 'form'
      ;(fieldErrors[key] ??= []).push(issue.message)
    }
    return { status: 'error', message: 'Please check the highlighted fields.', fieldErrors }
  }
  if (isAppError(error)) {
    return { status: 'error', message: error.message, fieldErrors: error.details }
  }
  logger.error('action.unhandled_error', { error })
  return { status: 'error', message: fallback }
}

export function firstError(state: FormState, field: string): string | null {
  return state.fieldErrors?.[field]?.[0] ?? null
}

/** Reads a checkbox from a `FormData` payload. */
export function checkbox(formData: FormData, name: string): boolean {
  const value = formData.get(name)
  return value === 'on' || value === 'true' || value === '1'
}

export function text(formData: FormData, name: string): string {
  const value = formData.get(name)
  return typeof value === 'string' ? value : ''
}

export function textList(formData: FormData, name: string): string[] {
  return formData
    .getAll(name)
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
}
