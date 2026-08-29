'use client';

import { useActionState } from 'react';
import { loginAction, type FormState } from '@/app/actions/auth';
import { translator, type Locale } from '@/lib/i18n';

export function LoginForm({ locale }: { locale: Locale }) {
  const t = translator(locale);
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, {});

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />

      {state.error ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.error}
        </p>
      ) : null}

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
        <input id="password" name="password" type="password" required autoComplete="current-password" className="field" />
      </div>

      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending ? t('common.loading') : t('auth.submitLogin')}
      </button>
    </form>
  );
}
