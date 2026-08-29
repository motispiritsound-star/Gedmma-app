import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { isLocale, toDbLocale, translator } from '@/lib/i18n';
import { viewerContext } from '@/lib/auth/context';
import { listFamilyBookings, listFamilyWaitlist } from '@/modules/booking/service';
import { Badge, Card, EmptyState, PageHeader, formatDateTime } from '@/components/ui';
import { CancelBookingForm, ReviewForm } from './forms';

export const dynamic = 'force-dynamic';

export default async function BookingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = translator(locale);
  const dbLocale = toDbLocale(locale);

  const { user, familyId } = await viewerContext();
  if (!user) redirect(`/${locale}/auth/login`);
  if (!familyId) redirect(`/${locale}`);

  const [bookings, waitlist] = await Promise.all([listFamilyBookings(familyId), listFamilyWaitlist(familyId)]);
  const now = Date.now();
  const upcoming = bookings.filter((b) => b.session.startsAt.getTime() >= now && b.status === 'CONFIRMED');
  const past = bookings.filter((b) => b.session.startsAt.getTime() < now || b.status !== 'CONFIRMED');

  const title = (booking: (typeof bookings)[number]) =>
    booking.session.activity.translations.find((tr) => tr.locale === dbLocale)?.title ?? booking.session.activity.slug;

  return (
    <div className="space-y-8">
      <PageHeader title={t('booking.title')} />

      <section aria-labelledby="upcoming">
        <h2 id="upcoming" className="mb-3 text-lg font-semibold">
          {t('booking.upcoming')}
        </h2>
        {upcoming.length === 0 ? (
          <EmptyState>{t('common.none')}</EmptyState>
        ) : (
          <ul className="space-y-3">
            {upcoming.map((booking) => (
              <li key={booking.id}>
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{title(booking)}</h3>
                      <p className="text-sm text-slate-600">
                        {booking.session.activity.provider.displayName} · {formatDateTime(booking.session.startsAt, locale)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {booking.childProfile.nickname} · {t('booking.creditsCharged', { count: booking.creditsCharged })}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {t('booking.reference')}: {booking.reference}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge tone="success">{t('booking.confirmed')}</Badge>
                      <CancelBookingForm locale={locale} bookingId={booking.id} />
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      {waitlist.length > 0 ? (
        <section aria-labelledby="waitlist">
          <h2 id="waitlist" className="mb-3 text-lg font-semibold">
            {t('activity.joinWaitlist')}
          </h2>
          <ul className="space-y-2">
            {waitlist.map((entry) => (
              <li key={entry.id} className="card p-4 text-sm">
                {entry.session.activity.translations.find((tr) => tr.locale === dbLocale)?.title} —{' '}
                {formatDateTime(entry.session.startsAt, locale)} · {entry.childProfile.nickname} ·{' '}
                {t('booking.waitlisted', { position: entry.position })}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="past">
        <h2 id="past" className="mb-3 text-lg font-semibold">
          {t('booking.past')}
        </h2>
        {past.length === 0 ? (
          <EmptyState>{t('common.none')}</EmptyState>
        ) : (
          <ul className="space-y-3">
            {past.map((booking) => {
              const attended = booking.attendance?.status === 'ATTENDED';
              return (
                <li key={booking.id}>
                  <Card>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">{title(booking)}</h3>
                        <p className="text-sm text-slate-600">{formatDateTime(booking.session.startsAt, locale)}</p>
                        <p className="mt-1 text-sm text-slate-500">{booking.childProfile.nickname}</p>
                      </div>
                      <Badge tone={booking.status === 'COMPLETED' ? 'success' : 'neutral'}>{booking.status}</Badge>
                    </div>

                    {booking.review ? (
                      <p className="mt-3 text-sm text-emerald-700">
                        {locale === 'nl' ? 'Beoordeling geplaatst.' : 'Review published.'}
                      </p>
                    ) : attended ? (
                      <div className="mt-4 border-t border-slate-100 pt-4">
                        <ReviewForm locale={locale} bookingId={booking.id} />
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-slate-500">{t('review.onlyAfterAttendance')}</p>
                    )}
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="text-sm">
        <Link href={`/${locale}/search`} className="text-brand-700 underline">
          {t('nav.search')}
        </Link>
      </p>
    </div>
  );
}
