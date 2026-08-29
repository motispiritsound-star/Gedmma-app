import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { RegisterForm } from './RegisterForm'
import { getTranslations } from '@/modules/localisation/server'
import { getAuthContext } from '@/modules/auth/session'

export const metadata: Metadata = { title: 'Create your account' }

export default async function RegisterPage() {
  const [{ d }, context] = await Promise.all([getTranslations(), getAuthContext()])
  if (context) redirect('/home')

  return (
    <div className="q-card p-7 sm:p-9">
      <h1 className="text-2xl font-semibold">{d.auth.registerTitle}</h1>
      <p className="mt-1 text-sm text-ink-soft">{d.auth.registerSubtitle}</p>

      <RegisterForm
        labels={{
          displayName: d.auth.displayName,
          familyName: d.auth.familyName,
          familyNameHint: d.auth.familyNameHint,
          email: d.auth.email,
          password: d.auth.password,
          passwordHint: d.auth.passwordHint,
          consent: d.auth.consentLabel,
          submit: d.common.signUp,
          submitting: d.common.saving,
        }}
      />

      <p className="mt-6 text-sm text-ink-soft">
        {d.auth.alreadyHaveAccount}{' '}
        <Link href="/sign-in" className="font-semibold text-moss-700 underline">
          {d.common.signIn}
        </Link>
      </p>
      <p className="mt-3 text-xs text-ink-muted">
        <Link href="/privacy" className="underline">
          {d.nav.privacy}
        </Link>
      </p>
    </div>
  )
}
