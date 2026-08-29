import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { SignInForm } from './SignInForm'
import { getTranslations } from '@/modules/localisation/server'
import { getAuthContext } from '@/modules/auth/session'

export const metadata: Metadata = { title: 'Sign in' }

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; registered?: string }>
}) {
  const [{ d }, context, params] = await Promise.all([
    getTranslations(),
    getAuthContext(),
    searchParams,
  ])
  if (context) redirect(context.user.role === 'PARENT' ? '/home' : '/admin')

  return (
    <div className="q-card p-7 sm:p-9">
      <h1 className="text-2xl font-semibold">{d.auth.signInTitle}</h1>
      <p className="mt-1 text-sm text-ink-soft">{d.auth.signInSubtitle}</p>

      <SignInForm
        next={params.next ?? ''}
        labels={{
          email: d.auth.email,
          password: d.auth.password,
          submit: d.common.signIn,
          submitting: d.common.saving,
        }}
      />

      <p className="mt-6 text-sm text-ink-soft">
        {d.auth.noAccount}{' '}
        <Link href="/register" className="font-semibold text-moss-700 underline">
          {d.common.signUp}
        </Link>
      </p>
    </div>
  )
}
