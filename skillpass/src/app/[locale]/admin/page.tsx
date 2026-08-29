import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { isLocale, translator } from '@/lib/i18n';
import { viewerContext } from '@/lib/auth/context';
import { platformStats, refundQueue } from '@/modules/admin/service';
import { Card, PageHeader, Stat, formatMoney } from '@/components/ui';
import { RefundForm } from './refund-form';

export const dynamic = 'force-dynamic';

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = translator(locale);

  const { user } = await viewerContext();
  if (!user) redirect(`/${locale}/auth/login`);
  if (user.role !== 'ADMIN' && user.role !== 'SAFEGUARDING_OFFICER') notFound();

  const [stats, payments] = await Promise.all([platformStats(user), refundQueue(user)]);

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('admin.title')}
        action={
          <nav className="flex flex-wrap gap-2 text-sm">
            <Link href={`/${locale}/admin/providers`} className="btn-secondary">
              {t('admin.verificationQueue')} ({stats.providers.pending})
            </Link>
            <Link href={`/${locale}/admin/incidents`} className="btn-secondary">
              {t('admin.incidents')} ({stats.openIncidents})
            </Link>
            <Link href={`/${locale}/admin/audit`} className="btn-secondary">
              {t('admin.audit')}
            </Link>
          </nav>
        }
      />

      <section aria-labelledby="stats">
        <h2 id="stats" className="mb-3 text-lg font-semibold">
          {t('admin.stats')}
        </h2>
        <dl className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <Stat label={locale === 'nl' ? 'Ouders' : 'Guardians'} value={stats.guardians} />
          <Stat label={locale === 'nl' ? 'Kindprofielen' : 'Child profiles'} value={stats.children} />
          <Stat
            label={locale === 'nl' ? 'Aanbieders' : 'Providers'}
            value={`${stats.providers.approved}/${stats.providers.total}`}
            hint={`${stats.providers.pending} ${locale === 'nl' ? 'in behandeling' : 'pending'}`}
          />
          <Stat
            label={locale === 'nl' ? 'Activiteiten' : 'Activities'}
            value={`${stats.activities.published}/${stats.activities.total}`}
          />
          <Stat label={locale === 'nl' ? 'Sessies vooruit' : 'Upcoming sessions'} value={stats.sessions.upcoming} />
          <Stat
            label={t('provider.bookings')}
            value={stats.bookings.total}
            hint={`${stats.bookings.confirmed} ${t('booking.confirmed').toLowerCase()} · ${stats.bookings.cancelled} ${t('booking.cancelled').toLowerCase()}`}
          />
          <Stat
            label={locale === 'nl' ? 'Aanwezigheid' : 'Attendance'}
            value={stats.attendance.attendanceRate !== null ? `${stats.attendance.attendanceRate}%` : '—'}
            hint={`${stats.attendance.attended} / ${stats.attendance.attended + stats.attendance.absent}`}
          />
          <Stat
            label={locale === 'nl' ? 'Credits uitstaand' : 'Outstanding credits'}
            value={stats.credits.outstanding}
            hint={`${stats.credits.granted} ${locale === 'nl' ? 'toegekend' : 'granted'} · ${stats.credits.spent} ${locale === 'nl' ? 'besteed' : 'spent'}`}
          />
          <Stat label={locale === 'nl' ? 'Omzet (test)' : 'Revenue (test)'} value={formatMoney(stats.revenueCents, 'EUR', locale)} />
          <Stat label={locale === 'nl' ? 'Open incidenten' : 'Open incidents'} value={stats.openIncidents} />
          <Stat label={locale === 'nl' ? 'Zorgdossiers' : 'Safeguarding cases'} value={stats.openSafeguardingCases} />
        </dl>
      </section>

      <section aria-labelledby="refunds">
        <h2 id="refunds" className="mb-3 text-lg font-semibold">
          {t('admin.refunds')}
        </h2>
        <ul className="space-y-3">
          {payments.map((payment) => {
            const refunded = payment.refunds.filter((r) => r.status === 'SUCCEEDED').reduce((sum, r) => sum + r.amountCents, 0);
            return (
              <li key={payment.id}>
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {payment.family?.name ?? '—'} · {formatMoney(payment.amountCents, payment.currency, locale)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {payment.externalRef} · {payment.status}
                        {refunded > 0 ? ` · ${locale === 'nl' ? 'terugbetaald' : 'refunded'} ${formatMoney(refunded, payment.currency, locale)}` : ''}
                      </p>
                    </div>
                    <RefundForm
                      locale={locale}
                      paymentId={payment.id}
                      maxCents={payment.amountCents - refunded}
                      familyId={payment.familyId ?? ''}
                    />
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
