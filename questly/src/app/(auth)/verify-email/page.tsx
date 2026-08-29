import type { Metadata } from 'next'
import Link from 'next/link'
import { fill } from '@/modules/localisation'
import { getTranslations } from '@/modules/localisation/server'
import { getAuthContext } from '@/modules/auth/session'
import { issueVerificationToken, verifyEmailToken } from '@/modules/auth/service'
import { sendEmail } from '@/modules/email'
import { getEnv } from '@/env'
import { Callout } from '@/components/ui/States'
import { Button, ButtonLink } from '@/components/ui/Button'

export const metadata: Metadata = { title: 'Confirm your e-mail address' }

async function resendAction() {
  'use server'
  const context = await getAuthContext()
  if (!context || context.user.emailVerifiedAt) return
  const token = await issueVerificationToken(context.user.id)
  await sendEmail({
    to: context.user.email,
    subject: 'Confirm your Questly account',
    body: `Confirm your e-mail address: ${getEnv().APP_URL}/verify-email?token=${token}`,
  })
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const [{ d }, context, params] = await Promise.all([
    getTranslations(),
    getAuthContext(),
    searchParams,
  ])

  const verified = params.token ? await verifyEmailToken(params.token) : null

  return (
    <div className="q-card p-7 sm:p-9">
      <h1 className="text-2xl font-semibold">{d.auth.verifyTitle}</h1>

      {verified === true ? (
        <Callout tone="success" className="mt-4" role="status">
          {d.auth.verifySuccess}
        </Callout>
      ) : null}
      {verified === false ? (
        <Callout tone="danger" className="mt-4" role="alert">
          {d.auth.verifyInvalid}
        </Callout>
      ) : null}

      {verified !== true ? (
        <p className="mt-3 text-sm text-ink-soft">
          {fill(d.auth.verifyBody, { email: context?.user.email ?? '' })}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        {context ? (
          <ButtonLink href={context.user.role === 'PARENT' ? '/home' : '/admin'}>
            {d.nav.home}
          </ButtonLink>
        ) : (
          <ButtonLink href="/sign-in">{d.common.signIn}</ButtonLink>
        )}
        {context && !context.user.emailVerifiedAt ? (
          <form action={resendAction}>
            <Button type="submit" variant="secondary">
              {d.auth.resend}
            </Button>
          </form>
        ) : null}
      </div>

      <p className="mt-6 text-xs text-ink-muted">
        <Link href="/" className="underline">
          {d.errors.backHome}
        </Link>
      </p>
    </div>
  )
}
