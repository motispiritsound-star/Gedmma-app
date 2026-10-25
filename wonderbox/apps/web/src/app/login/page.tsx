import Link from 'next/link';
import { Card, Field, Notice, PageHeading } from '../../components/ui.tsx';
import { signInAction } from '../../server/actions/auth.ts';
import { requestTranslator } from '../../lib/ui/locale.ts';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  const { locale, t } = await requestTranslator();

  return (
    <div className="mx-auto max-w-md">
      <PageHeading title={t('auth.login.title')} />
      {error ? <Notice tone="warn">{t('auth.invalid')}</Notice> : null}
      <Card>
        <form action={signInAction}>
          <input type="hidden" name="next" value={next ?? ''} />
          <Field label={t('auth.email')} name="email">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="wb-input"
            />
          </Field>
          <Field label={t('auth.password')} name="password">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="wb-input"
            />
          </Field>
          <button type="submit" className="wb-button wb-button-primary w-full">
            {t('auth.login.submit')}
          </button>
        </form>
      </Card>
      <p className="mt-4 text-sm text-[var(--color-ink-soft)]">
        {locale === 'nl' ? 'Nog geen account? ' : 'No account yet? '}
        <Link href="/signup" className="underline">
          {t('nav.signup')}
        </Link>
      </p>
      <p className="mt-6 rounded-lg bg-[var(--color-brand-soft)] p-4 text-xs text-[var(--color-brand-strong)]">
        {locale === 'nl'
          ? 'Demo: ouder@wonderbox.test / wonderbox-demo. Zie de README voor alle rollen.'
          : 'Demo: ouder@wonderbox.test / wonderbox-demo. See the README for every role.'}
      </p>
    </div>
  );
}
