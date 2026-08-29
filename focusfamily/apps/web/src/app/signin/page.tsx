import { redirect } from 'next/navigation';
import { adoptCookies, api } from '@/lib/api';
import { getSiteText } from '@/lib/i18n';
import { translate } from '@focusfamily/domain';

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { s, locale } = await getSiteText();
  const params = await searchParams;

  async function signIn(formData: FormData): Promise<void> {
    'use server';
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');
    const result = await api.post<{ user: { id: string } }>('/auth/sign-in', {
      email,
      password,
    });
    if (!result.ok) {
      redirect(`/signin?error=${encodeURIComponent(result.error?.messageKey ?? 'error.unexpected')}`);
    }
    await adoptCookies(result.setCookies);
    redirect('/app');
  }

  return (
    <div className="stack-lg" style={{ maxWidth: '30rem' }}>
      <div className="stack">
        <h1>{s('signin.title')}</h1>
        {params.error ? (
          <p className="notice notice--warm" role="alert">
            {translate(locale, params.error)}
          </p>
        ) : null}
        <form action={signIn} className="card stack">
          <div className="field">
            <label htmlFor="email">{s('signin.email')}</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              defaultValue="noor@focusfamily.test"
            />
          </div>
          <div className="field">
            <label htmlFor="password">{s('signin.password')}</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <button className="btn" type="submit">
            {s('signin.submit')}
          </button>
        </form>
      </div>

      <div className="card card--quiet">
        <h2 style={{ fontSize: '1.1rem' }}>{s('signin.demo')}</h2>
        <p style={{ marginBottom: 0, color: 'var(--ink-soft)' }}>{s('signin.demo.body')}</p>
      </div>
    </div>
  );
}
