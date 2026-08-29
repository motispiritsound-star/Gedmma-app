import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isLocale, toDbLocale, translator } from '@/lib/i18n';
import { familyMaySeeExactLocation, getActivityDetail } from '@/modules/catalog/activities';
import { viewerContext } from '@/lib/auth/context';
import { prisma } from '@/lib/db';
import { ageBandLabel, categoryLabel, isAgeAppropriate, levelLabel } from '@/lib/i18n/labels';
import { Alert, Badge, Card, formatDateTime, formatMoney } from '@/components/ui';
import { BookingPanel } from './booking-panel';
import { StaticMap } from '@/components/map';

export const dynamic = 'force-dynamic';

export default async function ActivityPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const t = translator(locale);
  const dbLocale = toDbLocale(locale);

  const { user, familyId } = await viewerContext();
  const activity = await getActivityDetail(slug, dbLocale).catch(() => null);
  if (!activity) notFound();

  // A draft or unapproved activity is not discoverable by guessing a slug.
  const visible = activity.status === 'PUBLISHED' && activity.provider.status === 'APPROVED';
  if (!visible && activity.providerId !== (await viewerContext()).providerId) notFound();

  const exact = await familyMaySeeExactLocation(familyId, activity.id);
  const detail = exact ? await getActivityDetail(slug, dbLocale, { exactLocation: true }) : activity;

  const children = familyId
    ? await prisma.childProfile.findMany({
        where: { familyId, archivedAt: null },
        select: { id: true, nickname: true, ageBand: true },
        orderBy: { createdAt: 'asc' },
      })
    : [];

  const eligibleChildren = children.filter((child) =>
    isAgeAppropriate(child.ageBand, activity.minAgeBand, activity.maxAgeBand),
  );

  const translation = detail.translation;

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
      <article className="space-y-6">
        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="info">{categoryLabel(activity.category, locale)}</Badge>
            <Badge>{levelLabel(activity.level, locale)}</Badge>
            <Badge>
              {ageBandLabel(activity.minAgeBand, locale)} – {ageBandLabel(activity.maxAgeBand, locale)}
            </Badge>
            {activity.provider.status === 'APPROVED' ? <Badge tone="success">{t('activity.verifiedProvider')}</Badge> : null}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">{translation?.title}</h1>
          <p className="text-slate-600">{translation?.summary}</p>
          <p className="text-sm text-slate-600">
            {activity.provider.displayName}
            {activity.instructor ? ` · ${t('activity.instructor')}: ${activity.instructor.user.displayName}` : ''}
          </p>
        </header>

        <section aria-labelledby="about">
          <h2 id="about" className="mb-2 text-lg font-semibold">
            {t('activity.about')}
          </h2>
          <p className="whitespace-pre-line text-slate-700">{translation?.description}</p>
        </section>

        <dl className="grid gap-4 sm:grid-cols-2">
          <Card>
            <dt className="text-sm font-medium text-slate-500">{t('activity.equipment')}</dt>
            <dd className="mt-1 text-sm text-slate-800">
              {activity.equipmentProvided ? t('activity.equipmentProvided') : t('activity.bringOwn')}
              {translation?.whatToBring ? ` — ${translation.whatToBring}` : ''}
            </dd>
          </Card>
          <Card>
            <dt className="text-sm font-medium text-slate-500">{t('activity.accessibility')}</dt>
            <dd className="mt-1 text-sm text-slate-800">
              {[
                activity.wheelchairAccessible ? t('search.accessible') : null,
                activity.sensoryFriendly ? t('search.sensory') : null,
                activity.venue.accessibilityNotes,
              ]
                .filter(Boolean)
                .join(' · ') || '—'}
            </dd>
          </Card>
          {translation?.safetyNotes ? (
            <Card>
              <dt className="text-sm font-medium text-slate-500">{t('activity.safety')}</dt>
              <dd className="mt-1 text-sm text-slate-800">{translation.safetyNotes}</dd>
            </Card>
          ) : null}
          <Card>
            <dt className="text-sm font-medium text-slate-500">{t('activity.cancellation')}</dt>
            <dd className="mt-1 text-sm text-slate-800">
              {translation?.cancellationTerms ?? t('activity.cancellationWindow', { hours: activity.cancellationHours })}
            </dd>
          </Card>
        </dl>

        <section aria-labelledby="location">
          <h2 id="location" className="mb-2 text-lg font-semibold">
            {detail.location.exact ? t('booking.exactAddress') : t('search.approxLocation')}
          </h2>
          {detail.location.exact ? (
            <Alert tone="success">
              {detail.location.name}, {detail.location.addressLine1}, {detail.location.postalCode} {detail.location.city}
            </Alert>
          ) : (
            <Alert>{t('search.approxLocation')}</Alert>
          )}
          <div className="mt-3">
            <StaticMap
              locale={locale}
              caption={`${detail.location.name} — ${detail.location.city}`}
              points={[
                {
                  id: activity.id,
                  title: detail.location.name,
                  latitude: detail.location.latitude,
                  longitude: detail.location.longitude,
                  href: `/${locale}/activities/${activity.slug}`,
                },
              ]}
            />
          </div>
        </section>

        <section aria-labelledby="reviews">
          <h2 id="reviews" className="mb-3 text-lg font-semibold">
            {t('activity.reviews')} {detail.averageRating ? `— ★ ${detail.averageRating}` : ''}
          </h2>
          {activity.reviews.length === 0 ? (
            <p className="text-sm text-slate-500">{t('activity.noReviews')}</p>
          ) : (
            <ul className="space-y-3">
              {activity.reviews.map((review) => (
                <li key={review.id} className="card p-4">
                  <p className="text-sm font-medium">
                    ★ {review.rating} {review.title ? `— ${review.title}` : ''}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{review.body}</p>
                  {/* Only the guardian's display name; never a child's. */}
                  <p className="mt-2 text-xs text-slate-500">{review.author.displayName}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </article>

      <aside className="space-y-4">
        <Card>
          <p className="text-2xl font-semibold text-brand-700">
            {activity.creditCost} {activity.creditCost === 1 ? t('common.credit') : t('common.credits')}
          </p>
          <p className="text-sm text-slate-500">
            {t('common.from')} {formatMoney(activity.listPriceCents, activity.currency, locale)}
          </p>
        </Card>

        <section aria-labelledby="sessions">
          <h2 id="sessions" className="mb-3 text-lg font-semibold">
            {t('activity.sessions')}
          </h2>

          {!user ? (
            <Alert>
              <Link href={`/${locale}/auth/login`} className="underline">
                {t('nav.login')}
              </Link>{' '}
              {locale === 'nl' ? 'om te boeken.' : 'to book.'}
            </Alert>
          ) : eligibleChildren.length === 0 ? (
            <Alert tone="warning">
              {locale === 'nl'
                ? 'Geen kindprofiel in de juiste leeftijdsgroep. Voeg er een toe op de gezinspagina.'
                : 'No child profile in the right age band. Add one on the family page.'}
            </Alert>
          ) : (
            <BookingPanel
              locale={locale}
              childProfiles={eligibleChildren}
              sessions={activity.sessions.map((session) => ({
                id: session.id,
                startsAt: formatDateTime(session.startsAt, locale),
                seatsLeft: session.capacity ? session.capacity.totalSeats - session.capacity.seatsTaken : 0,
                waitlistCount: session._count.waitlist,
              }))}
            />
          )}
        </section>
      </aside>
    </div>
  );
}
