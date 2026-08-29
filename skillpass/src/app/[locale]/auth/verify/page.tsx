import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isLocale, translator } from '@/lib/i18n';
import { verifyEmailAction } from '@/app/actions/auth';
import { Alert } from '@/components/ui';

export default async function VerifyPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  const { token } = await searchParams;
  if (!isLocale(locale)) notFound();
  const t = translator(locale);

  if (!token) {
    return (
      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-semibold">{t('auth.verify.title')}</h1>
        <p className="mt-3 text-sm text-slate-600">{t('auth.verify.devHint')}</p>
      </div>
    );
  }

  const result = await verifyEmailAction(token);

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-semibold">{t('auth.verify.title')}</h1>
      {result.ok ? (
        <>
          <Alert tone="success">{t('auth.verify.success')}</Alert>
          <Link href={`/${locale}/family`} className="btn-primary" data-testid="verified-continue">
            {t('family.title')}
          </Link>
        </>
      ) : (
        <Alert tone="danger">{result.error}</Alert>
      )}
    </div>
  );
}
