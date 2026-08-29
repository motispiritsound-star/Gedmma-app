import { notFound } from 'next/navigation';
import Link from 'next/link';
import { isLocale, translator } from '@/lib/i18n';
import { RegisterForm } from './form';

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = translator(locale);

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold tracking-tight">{t('auth.register.title')}</h1>
      <p className="mt-2 text-sm text-slate-600">{t('auth.register.intro')}</p>
      <div className="card mt-6 p-6">
        <RegisterForm locale={locale} />
      </div>
      <p className="mt-4 text-sm text-slate-600">
        {t('auth.hasAccount')}{' '}
        <Link href={`/${locale}/auth/login`} className="text-brand-700 underline">
          {t('nav.login')}
        </Link>
      </p>
    </div>
  );
}
