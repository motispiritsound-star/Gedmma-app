import { notFound, redirect } from 'next/navigation';
import { isLocale, toDbLocale, translator } from '@/lib/i18n';
import { viewerContext } from '@/lib/auth/context';
import { sessionRoster } from '@/modules/booking/service';
import { ageBandLabel } from '@/lib/i18n/labels';
import { Alert, Badge, EmptyState, PageHeader, formatDateTime } from '@/components/ui';
import { AttendanceButtons } from './attendance-buttons';

export const dynamic = 'force-dynamic';

export default async function SessionRosterPage({
  params,
}: {
  params: Promise<{ locale: string; sessionId: string }>;
}) {
  const { locale, sessionId } = await params;
  if (!isLocale(locale)) notFound();
  const t = translator(locale);
  const dbLocale = toDbLocale(locale);

  const { user, providerId } = await viewerContext();
  if (!user) redirect(`/${locale}/auth/login`);
  if (!providerId) redirect(`/${locale}/provider/onboarding`);

  const session = await sessionRoster(user, providerId, sessionId).catch(() => null);
  if (!session) notFound();

  const title = session.activity.translations.find((tr) => tr.locale === dbLocale)?.title ?? session.activity.slug;

  return (
    <div className="space-y-6">
      <PageHeader title={t('provider.checkin')} description={`${title} — ${formatDateTime(session.startsAt, locale)}`} />

      <Alert>
        {locale === 'nl'
          ? 'Je ziet alleen de roepnaam, leeftijdsgroep en de informatie die nodig is om de les veilig te geven.'
          : 'You only see the nickname, age band and the information needed to run the session safely.'}
      </Alert>

      {session.bookings.length === 0 ? (
        <EmptyState>{t('common.none')}</EmptyState>
      ) : (
        <ul className="space-y-3">
          {session.bookings.map((booking) => (
            <li key={booking.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {booking.childProfile.nickname}{' '}
                    <span className="text-sm font-normal text-slate-500">
                      ({ageBandLabel(booking.childProfile.ageBand, locale)})
                    </span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {t('booking.reference')}: {booking.reference}
                  </p>
                  {booking.childProfile.accessibilityNeeds ? (
                    <p className="mt-1 text-sm text-slate-700">
                      <span className="font-medium">{t('activity.accessibility')}: </span>
                      {booking.childProfile.accessibilityNeeds}
                    </p>
                  ) : null}
                  {booking.childProfile.medicalNotes ? (
                    <p className="mt-1 text-sm text-amber-800">
                      <span className="font-medium">{t('family.medical')}: </span>
                      {booking.childProfile.medicalNotes}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-slate-500">
                    {locale === 'nl' ? 'Contact via de ouder' : 'Contact via the guardian'}:{' '}
                    {booking.family.memberships[0]?.user.displayName}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge tone={booking.attendance?.status === 'ATTENDED' ? 'success' : 'neutral'}>
                    {booking.attendance?.status ?? 'EXPECTED'}
                  </Badge>
                  <AttendanceButtons locale={locale} bookingId={booking.id} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {session.waitlist.length > 0 ? (
        <section aria-labelledby="waitlist">
          <h2 id="waitlist" className="mb-2 text-lg font-semibold">
            {t('activity.joinWaitlist')} ({session.waitlist.length})
          </h2>
          <ul className="text-sm text-slate-600">
            {session.waitlist.map((entry) => (
              <li key={entry.id}>{entry.childProfile.nickname}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
