'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { LOCALE_COOKIE, isLocale } from '@/modules/localisation'
import { resolveLocale } from '@/modules/localisation/server'
import { checkbox, text, toFormState, type FormState } from '@/lib/form'
import { AUDIT_ACTIONS, recordAudit } from '@/modules/audit'
import { registerSchema, signInSchema } from '@/modules/auth/schemas'
import { registerParent, signIn } from '@/modules/auth/service'
import { destroySession, getAuthContext } from '@/modules/auth/session'

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const locale = await resolveLocale()
  try {
    const input = registerSchema.parse({
      displayName: text(formData, 'displayName'),
      email: text(formData, 'email'),
      password: text(formData, 'password'),
      familyName: text(formData, 'familyName'),
      locale,
      consent: checkbox(formData, 'consent'),
    })
    await registerParent(input)
  } catch (error) {
    return toFormState(error)
  }
  redirect('/onboarding')
}

export async function signInAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const next = text(formData, 'next')
  try {
    const input = signInSchema.parse({
      email: text(formData, 'email'),
      password: text(formData, 'password'),
    })
    const user = await signIn(input)
    const cookieStore = await cookies()
    if (isLocale(user.locale)) {
      cookieStore.set(LOCALE_COOKIE, user.locale, { path: '/', maxAge: 365 * 24 * 60 * 60 })
    }
    // Only ever redirect to a path inside this application.
    const destination =
      next.startsWith('/') && !next.startsWith('//')
        ? next
        : user.role === 'PARENT'
          ? '/home'
          : '/admin'
    redirect(destination)
  } catch (error) {
    if (isRedirectError(error)) throw error
    return toFormState(error)
  }
}

export async function signOutAction(): Promise<void> {
  const context = await getAuthContext()
  await destroySession()
  if (context) {
    await recordAudit({
      action: AUDIT_ACTIONS.userSignedOut,
      entityType: 'user',
      entityId: context.user.id,
      actorUserId: context.user.id,
      actorRole: context.user.role,
    })
  }
  redirect('/')
}

/** `redirect()` works by throwing; that throw must not be swallowed. */
function isRedirectError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    typeof (error as { digest?: unknown }).digest === 'string' &&
    (error as { digest: string }).digest.startsWith('NEXT_REDIRECT')
  )
}
