import { notFound, redirect } from 'next/navigation';
import { isLocale, translator } from '@/lib/i18n';
import { viewerContext } from '@/lib/auth/context';
import { listIncidents } from '@/modules/safeguarding/service';
import { Alert, Badge, Card, EmptyState, PageHeader } from '@/components/ui';
import { IncidentControls } from './controls';

export const dynamic = 'force-dynamic';

export default async function AdminIncidentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = translator(locale);

  const { user } = await viewerContext();
  if (!user) redirect(`/${locale}/auth/login`);
  if (user.role !== 'ADMIN' && user.role !== 'SAFEGUARDING_OFFICER') notFound();

  const incidents = await listIncidents();
  const isOfficer = user.role === 'SAFEGUARDING_OFFICER';

  return (
    <div className="space-y-6">
      <PageHeader title={t('admin.incidents')} />

      <Alert tone="warning">
        {locale === 'nl'
          ? 'Zorgdossiers zijn alleen inhoudelijk zichtbaar voor de safeguarding officer. Bij een vermoeden van een strafbaar feit volgt altijd melding bij Veilig Thuis of de politie — dit systeem vervangt dat niet.'
          : 'Case notes are only readable by the safeguarding officer. Where a criminal offence is suspected, a report to Veilig Thuis or the police always follows — this system does not replace that.'}
      </Alert>

      {incidents.length === 0 ? (
        <EmptyState>{t('common.none')}</EmptyState>
      ) : (
        <ul className="space-y-4">
          {incidents.map((incident) => (
            <li key={incident.id}>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">
                      {incident.reference} — {incident.summary}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">{incident.details}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {incident.provider?.displayName ?? '—'} ·{' '}
                      {new Intl.DateTimeFormat(locale === 'nl' ? 'nl-NL' : 'en-GB', { dateStyle: 'medium' }).format(
                        incident.occurredAt,
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge tone={incident.severity === 'CRITICAL' || incident.severity === 'HIGH' ? 'danger' : 'warning'}>
                      {incident.severity}
                    </Badge>
                    <Badge>{incident.status}</Badge>
                    {incident.safeguardingCase ? <Badge tone="danger">{incident.safeguardingCase.reference}</Badge> : null}
                  </div>
                </div>

                <IncidentControls
                  locale={locale}
                  incidentId={incident.id}
                  caseId={incident.safeguardingCase?.id ?? null}
                  isOfficer={isOfficer}
                />
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
