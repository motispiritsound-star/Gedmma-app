import { notFound, redirect } from 'next/navigation';
import { isLocale, translator } from '@/lib/i18n';
import { viewerContext } from '@/lib/auth/context';
import { verificationQueue } from '@/modules/catalog/providers';
import { Alert, Badge, Card, EmptyState, PageHeader } from '@/components/ui';
import { VerificationControls } from './controls';

export const dynamic = 'force-dynamic';

export default async function AdminProvidersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = translator(locale);

  const { user } = await viewerContext();
  if (!user) redirect(`/${locale}/auth/login`);
  if (user.role !== 'ADMIN' && user.role !== 'SAFEGUARDING_OFFICER') notFound();

  const queue = await verificationQueue();

  return (
    <div className="space-y-6">
      <PageHeader title={t('admin.verificationQueue')} />

      <Alert tone="warning">
        {locale === 'nl'
          ? 'Goedkeuring is een menselijk oordeel. Controleer elk document afzonderlijk; het systeem verifieert niets automatisch en levert geen juridisch sluitend bewijs.'
          : 'Approval is a human judgement. Check each document individually; the system verifies nothing automatically and provides no legally conclusive proof.'}
      </Alert>

      {queue.length === 0 ? (
        <EmptyState>{t('common.none')}</EmptyState>
      ) : (
        <ul className="space-y-4">
          {queue.map((provider) => (
            <li key={provider.id}>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{provider.displayName}</h2>
                    <p className="text-sm text-slate-600">{provider.legalName}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      KVK {provider.chamberOfCommerceNo ?? '—'} · {provider.contactPersonName} · {provider.contactEmail}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {locale === 'nl' ? 'VOG verklaard' : 'VOG declared'}: {provider.vogDeclared ? t('common.yes') : t('common.no')}
                    </p>
                  </div>
                  <Badge tone="warning">{provider.status}</Badge>
                </div>

                <p className="mt-3 text-sm text-slate-700">{provider.description}</p>

                <VerificationControls
                  locale={locale}
                  providerId={provider.id}
                  verifications={provider.verifications.map((verification) => ({
                    id: verification.id,
                    documentType: verification.documentType,
                    reference: verification.reference,
                    decision: verification.decision,
                  }))}
                />
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
