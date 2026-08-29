import Link from 'next/link';
import { Card, Field, Notice, PageHeading } from '../../components/ui.tsx';
import { signUpAction } from '../../server/actions/auth.ts';
import { requestTranslator } from '../../lib/ui/locale.ts';

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { locale, t } = await requestTranslator();

  return (
    <div className="mx-auto max-w-md">
      <PageHeading
        title={t('auth.signup.title')}
        description={
          locale === 'nl'
            ? 'Een account is voor jou als ouder. Je kind heeft er geen nodig en krijgt er ook geen.'
            : 'The account is yours as a parent. Your child does not need one and will not get one.'
        }
      />
      {error ? (
        <Notice tone="warn">
          {error === 'exists'
            ? locale === 'nl'
              ? 'Er bestaat al een account met dit e-mailadres.'
              : 'An account with this email already exists.'
            : error}
        </Notice>
      ) : null}
      <Card>
        <form action={signUpAction}>
          <Field label={t('auth.name')} name="displayName">
            <input id="displayName" name="displayName" required className="wb-input" autoComplete="name" />
          </Field>
          <Field label={t('auth.familyName')} name="familyName">
            <input id="familyName" name="familyName" required className="wb-input" />
          </Field>
          <Field label={t('auth.email')} name="email">
            <input id="email" name="email" type="email" required className="wb-input" autoComplete="email" />
          </Field>
          <Field
            label={t('auth.password')}
            name="password"
            hint={locale === 'nl' ? 'Minimaal 10 tekens.' : 'At least 10 characters.'}
          >
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={10}
              className="wb-input"
              autoComplete="new-password"
              aria-describedby="password-hint"
            />
          </Field>
          <label className="mb-4 flex items-start gap-2 text-sm">
            <input type="checkbox" name="consent" required className="mt-1" />
            <span>{t('auth.signup.consent')}</span>
          </label>
          <button type="submit" className="wb-button wb-button-primary w-full">
            {t('auth.signup.submit')}
          </button>
        </form>
      </Card>
      <p className="mt-4 text-sm text-[var(--color-ink-soft)]">
        {locale === 'nl' ? 'Al een account? ' : 'Already have an account? '}
        <Link href="/login" className="underline">
          {t('nav.login')}
        </Link>
      </p>
    </div>
  );
}
