import { notFound } from 'next/navigation';
import Link from 'next/link';
import { isLocale, translator } from '@/lib/i18n';
import { LoginForm } from './form';

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = translator(locale);

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold tracking-tight">{t('auth.login.title')}</h1>
      <div className="card mt-6 p-6">
        <LoginForm locale={locale} />
      </div>
      <p className="mt-4 text-sm text-slate-600">
        {t('auth.noAccount')}{' '}
        <Link href={`/${locale}/auth/register`} className="text-brand-700 underline">
          {t('nav.register')}
        </Link>
      </p>
    </div>
  );
}
