import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { isLocale, toDbLocale, translator } from '@/lib/i18n';
import { viewerContext } from '@/lib/auth/context';
import { providerDashboard } from '@/modules/catalog/dashboard';
import { prisma } from '@/lib/db';
import { PublishButton } from './publish-button';
import { Alert, Badge, Card, EmptyState, PageHeader, Stat, formatDateTime, formatMoney } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function ProviderPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = translator(locale);
  const dbLocale = toDbLocale(locale);

  const { user, providerId } = await viewerContext();
  if (!user) redirect(`/${locale}/auth/login`);
  if (!providerId) redirect(`/${locale}/provider/onboarding`);

  const dashboard = await providerDashboard(user, providerId);
  const activities = await prisma.activity.findMany({
    where: { providerId },
    include: { translations: true, _count: { select: { sessions: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const approved = dashboard.provider.status === 'APPROVED';

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('provider.dashboard')}
        description={dashboard.provider.displayName}
        action={<Badge tone={approved ? 'success' : 'warning'}>{dashboard.provider.status}</Badge>}
      />

      {!approved ? <Alert tone="warning">{t('provider.pendingApproval')}</Alert> : null}

      <dl className="grid gap-4 sm:grid-cols-4">
        <Stat label={t('provider.activities')} value={`${dashboard.counts.published}/${dashboard.counts.activities}`} />
        <Stat label={t('provider.schedule')} value={dashboard.counts.upcomingSessions} />
        <Stat
          label={t('provider.utilisation')}
          value={dashboard.utilisation.percentage !== null ? `${dashboard.utilisation.percentage}%` : '—'}
          hint={`${dashboard.utilisation.seatsTaken}/${dashboard.utilisation.seatsOffered}`}
        />
        <Stat
          label={t('provider.revenue')}
          value={formatMoney(dashboard.revenue.netCents, dashboard.revenue.currency, locale)}
          hint={
            locale === 'nl'
              ? `Bruto ${formatMoney(dashboard.revenue.grossCents, dashboard.revenue.currency, locale)} − commissie ${(dashboard.provider.commissionBps / 100).toFixed(1)}%`
              : `Gross ${formatMoney(dashboard.revenue.grossCents, dashboard.revenue.currency, locale)} − commission ${(dashboard.provider.commissionBps / 100).toFixed(1)}%`
          }
        />
      </dl>

      <section aria-labelledby="schedule">
        <h2 id="schedule" className="mb-3 text-lg font-semibold">
          {t('provider.schedule')}
        </h2>
        {dashboard.upcoming.length === 0 ? (
          <EmptyState>{t('common.none')}</EmptyState>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">{t('provider.schedule')}</caption>
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-2">{t('provider.activities')}</th>
                  <th scope="col" className="px-4 py-2">{t('search.date')}</th>
                  <th scope="col" className="px-4 py-2">{t('provider.utilisation')}</th>
                  <th scope="col" className="px-4 py-2">{t('activity.joinWaitlist')}</th>
                  <th scope="col" className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dashboard.upcoming.map((session) => (
                  <tr key={session.sessionId}>
                    <td className="px-4 py-2">{locale === 'nl' ? session.activityTitleNl : session.activityTitleEn}</td>
                    <td className="px-4 py-2">{formatDateTime(session.startsAt, locale)}</td>
                    <td className="px-4 py-2">
                      {session.seatsTaken}/{session.totalSeats}
                    </td>
                    <td className="px-4 py-2">{session.waitlist}</td>
                    <td className="px-4 py-2 text-right">
                      <Link href={`/${locale}/provider/sessions/${session.sessionId}`} className="text-brand-700 underline">
                        {t('provider.checkin')}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="activities">
        <h2 id="activities" className="mb-3 text-lg font-semibold">
          {t('provider.activities')}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {activities.map((activity) => (
            <li key={activity.id}>
              <Card>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-medium">
                    {activity.translations.find((tr) => tr.locale === dbLocale)?.title ?? activity.slug}
                  </h3>
                  <Badge tone={activity.status === 'PUBLISHED' ? 'success' : 'neutral'}>{activity.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {activity._count.sessions} {locale === 'nl' ? 'sessies' : 'sessions'} · {activity.creditCost}{' '}
                  {t('common.credits')}
                </p>
                <PublishButton
                  locale={locale}
                  activityId={activity.id}
                  published={activity.status === 'PUBLISHED'}
                  disabled={!approved && activity.status !== 'PUBLISHED'}
                />
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
