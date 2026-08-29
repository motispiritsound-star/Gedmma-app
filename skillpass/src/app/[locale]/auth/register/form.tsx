'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { registerAction, type FormState } from '@/app/actions/auth';
import { translator, type Locale } from '@/lib/i18n';

export function RegisterForm({ locale }: { locale: Locale }) {
  const t = translator(locale);
  const [state, action, pending] = useActionState<FormState, FormData>(registerAction, {});

  if (state.notice === 'verify') {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">{t('auth.verify.title')}</h2>
        <p className="text-sm text-slate-600">{t('auth.verify.sent', { email: '' })}</p>
        <p className="text-xs text-slate-500">{t('auth.verify.devHint')}</p>
        {state.devLink ? (
          <Link href={state.devLink} className="btn-primary" data-testid="dev-verify-link">
            {t('auth.verify.title')}
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />

      {state.error ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.error}
        </p>
      ) : null}

      <div>
        <label className="label" htmlFor="displayName">
          {t('auth.displayName')}
        </label>
        <input id="displayName" name="displayName" required autoComplete="name" className="field" />
      </div>

      <div>
        <label className="label" htmlFor="familyName">
          {t('auth.familyName')}
        </label>
        <input id="familyName" name="familyName" required className="field" />
      </div>

      <div>
        <label className="label" htmlFor="email">
          {t('auth.email')}
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" className="field" />
      </div>

      <div>
        <label className="label" htmlFor="password">
          {t('auth.password')}
        </label>
        <input id="password" name="password" type="password" required autoComplete="new-password" minLength={12} className="field" />
        <p className="hint">{t('auth.passwordHint')}</p>
      </div>

      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input type="checkbox" name="acceptedTerms" required className="mt-1" />
        <span>{t('auth.consent')}</span>
      </label>

      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending ? t('common.loading') : t('auth.submitRegister')}
      </button>
    </form>
  );
}
