import { notFound, redirect } from 'next/navigation';
import { isLocale, translator } from '@/lib/i18n';
import { viewerContext } from '@/lib/auth/context';
import { Alert, Card, PageHeader } from '@/components/ui';
import { OnboardingForm } from './form';

export const dynamic = 'force-dynamic';

export default async function ProviderOnboardingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = translator(locale);

  const { user, providerId } = await viewerContext();
  if (!user) redirect(`/${locale}/auth/login`);
  if (providerId) redirect(`/${locale}/provider`);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title={t('provider.onboarding')}
        description={
          locale === 'nl'
            ? 'Een medewerker beoordeelt je aanmelding handmatig. Publiceren kan pas na goedkeuring.'
            : 'A member of staff reviews your application by hand. Publishing is possible only after approval.'
        }
      />

      <Alert tone="warning">
        {locale === 'nl'
          ? 'Wij controleren de opgegeven gegevens handmatig aan de hand van je documenten. Een ingevuld KVK-nummer of verzekeringsnummer is géén automatisch bewijs van identiteit of dekking. Een geldige VOG voor iedereen die met kinderen werkt blijft je eigen wettelijke verantwoordelijkheid.'
          : 'We check the details you provide manually against your documents. A filled-in chamber of commerce or insurance number is not automatic proof of identity or cover. A valid Dutch VOG (certificate of conduct) for everyone working with children remains your own legal responsibility.'}
      </Alert>

      <Card>
        <OnboardingForm locale={locale} />
      </Card>
    </div>
  );
}
