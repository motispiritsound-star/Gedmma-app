import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isLocale, toDbLocale, translator } from '@/lib/i18n';
import { searchActivities, searchSchema, recommendForFamily } from '@/modules/catalog/search';
import { viewerContext } from '@/lib/auth/context';
import { AGE_BAND_LABELS, CATEGORY_LABELS, ageBandLabel, categoryLabel } from '@/lib/i18n/labels';
import { Badge, EmptyState, PageHeader, formatDateTime } from '@/components/ui';
import { StaticMap } from '@/components/map';

export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  if (!isLocale(locale)) notFound();
  const t = translator(locale);
  const dbLocale = toDbLocale(locale);

  const parsed = searchSchema.safeParse({
    q: first(query.q) || undefined,
    category: first(query.category) || undefined,
    ageBand: first(query.ageBand) || undefined,
    maxCredits: first(query.maxCredits) || undefined,
    language: first(query.language) || undefined,
    wheelchairAccessible: first(query.wheelchairAccessible) === 'on' ? 'true' : undefined,
    sensoryFriendly: first(query.sensoryFriendly) === 'on' ? 'true' : undefined,
    trialAvailable: first(query.trialAvailable) === 'on' ? 'true' : undefined,
    dateFrom: first(query.dateFrom) || undefined,
    dateTo: first(query.dateTo) || undefined,
    radiusKm: first(query.radiusKm) || undefined,
    latitude: first(query.radiusKm) ? '52.0907' : undefined,
    longitude: first(query.radiusKm) ? '5.1214' : undefined,
    page: first(query.page) || '1',
  });

  const input = parsed.success ? parsed.data : searchSchema.parse({ page: 1 });
  const results = await searchActivities(input, dbLocale);

  const { familyId } = await viewerContext();
  const recommendations = familyId ? await recommendForFamily(familyId, dbLocale, 3) : [];
  const view = first(query.view) === 'map' ? 'map' : 'list';

  return (
    <div className="space-y-6">
      <PageHeader title={t('search.title')} description={t('search.approxLocation')} />

      <form className="card grid gap-4 p-5 md:grid-cols-4" role="search">
        <div className="md:col-span-2">
          <label className="label" htmlFor="q">
            {t('search.query')}
          </label>
          <input id="q" name="q" defaultValue={input.q ?? ''} className="field" />
        </div>

        <div>
          <label className="label" htmlFor="category">
            {t('search.category')}
          </label>
          <select id="category" name="category" defaultValue={input.category ?? ''} className="field">
            <option value="">{t('common.all')}</option>
            {Object.entries(CATEGORY_LABELS).map(([key, labels]) => (
              <option key={key} value={key}>
                {labels[locale]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="ageBand">
            {t('search.ageBand')}
          </label>
          <select id="ageBand" name="ageBand" defaultValue={input.ageBand ?? ''} className="field">
            <option value="">{t('common.all')}</option>
            {Object.entries(AGE_BAND_LABELS).map(([key, labels]) => (
              <option key={key} value={key}>
                {labels[locale]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="dateFrom">
            {t('search.date')}
          </label>
          <input id="dateFrom" name="dateFrom" type="date" defaultValue={input.dateFrom ?? ''} className="field" />
        </div>

        <div>
          <label className="label" htmlFor="maxCredits">
            {t('search.maxCredits')}
          </label>
          <input id="maxCredits" name="maxCredits" type="number" min={1} max={20} defaultValue={input.maxCredits ?? ''} className="field" />
        </div>

        <div>
          <label className="label" htmlFor="language">
            {t('search.language')}
          </label>
          <select id="language" name="language" defaultValue={input.language ?? ''} className="field">
            <option value="">{t('common.all')}</option>
            <option value="NL">Nederlands</option>
            <option value="EN">English</option>
          </select>
        </div>

        <div>
          <label className="label" htmlFor="radiusKm">
            {t('search.distance')} (km)
          </label>
          <input id="radiusKm" name="radiusKm" type="number" min={1} max={50} defaultValue={input.radiusKm ?? ''} className="field" />
        </div>

        <fieldset className="md:col-span-3">
          <legend className="label">{t('activity.accessibility')}</legend>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="wheelchairAccessible" defaultChecked={input.wheelchairAccessible} />
              {t('search.accessible')}
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="sensoryFriendly" defaultChecked={input.sensoryFriendly} />
              {t('search.sensory')}
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="trialAvailable" defaultChecked={input.trialAvailable} />
              {t('search.trial')}
            </label>
          </div>
        </fieldset>

        <div className="flex items-end gap-2">
          <button type="submit" className="btn-primary">
            {t('search.apply')}
          </button>
          <Link href={`/${locale}/search`} className="btn-secondary">
            {t('search.reset')}
          </Link>
        </div>
      </form>

      {recommendations.length > 0 ? (
        <section aria-labelledby="recommended">
          <h2 id="recommended" className="mb-3 text-lg font-semibold">
            {t('search.recommended')}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-3">
            {recommendations.map((item) => (
              <li key={item.id} className="card p-4">
                <Link href={`/${locale}/activities/${item.slug}`} className="font-medium text-brand-700 hover:underline">
                  {item.title}
                </Link>
                <p className="mt-1 text-xs text-slate-500">
                  {/* Recommendations are rule-based; show the rules. */}
                  {item.reasons.join(' · ')}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600" aria-live="polite">
          {t('search.results', { count: results.total })}
        </p>
        <div className="flex gap-2 text-sm">
          <Link href={{ pathname: `/${locale}/search`, query: { ...query, view: 'list' } }} className={view === 'list' ? 'btn-primary' : 'btn-secondary'}>
            {t('search.listView')}
          </Link>
          <Link href={{ pathname: `/${locale}/search`, query: { ...query, view: 'map' } }} className={view === 'map' ? 'btn-primary' : 'btn-secondary'}>
            {t('search.mapView')}
          </Link>
        </div>
      </div>

      {results.items.length === 0 ? (
        <EmptyState>{t('search.noResults')}</EmptyState>
      ) : view === 'map' ? (
        <StaticMap
          locale={locale}
          caption={t('search.approxLocation')}
          points={results.items.map((item) => ({
            id: item.id,
            title: item.title,
            latitude: item.approxLatitude,
            longitude: item.approxLongitude,
            href: `/${locale}/activities/${item.slug}`,
          }))}
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {results.items.map((item) => (
            <li key={item.id} className="card flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link href={`/${locale}/activities/${item.slug}`} className="text-lg font-semibold text-brand-700 hover:underline">
                    {item.title}
                  </Link>
                  <p className="text-sm text-slate-600">{item.providerName}</p>
                </div>
                <span className="whitespace-nowrap rounded-lg bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">
                  {item.creditCost} {item.creditCost === 1 ? t('common.credit') : t('common.credits')}
                </span>
              </div>

              <p className="text-sm text-slate-700">{item.summary}</p>

              <div className="flex flex-wrap gap-2">
                <Badge tone="info">{categoryLabel(item.category, locale)}</Badge>
                <Badge>{ageBandLabel(item.minAgeBand, locale)}–{ageBandLabel(item.maxAgeBand, locale)}</Badge>
                {item.trialAvailable ? <Badge tone="success">{t('search.trial')}</Badge> : null}
                {item.wheelchairAccessible ? <Badge tone="success">{t('search.accessible')}</Badge> : null}
                {item.sensoryFriendly ? <Badge tone="success">{t('search.sensory')}</Badge> : null}
                {item.languages.map((language) => (
                  <Badge key={language}>{language}</Badge>
                ))}
              </div>

              <dl className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-600">
                <div>
                  <dt className="inline font-medium">{item.venueName}, {item.cityName}</dt>
                  {item.distanceKm !== null ? <dd className="inline"> · {item.distanceKm} km</dd> : null}
                </div>
                {item.nextSessionAt ? (
                  <div>
                    <dt className="sr-only">{t('activity.sessions')}</dt>
                    <dd>{formatDateTime(item.nextSessionAt, locale)}</dd>
                  </div>
                ) : null}
                {item.seatsLeft !== null ? (
                  <div>
                    <dt className="sr-only">{t('activity.seatsLeft', { count: item.seatsLeft })}</dt>
                    <dd>{item.seatsLeft > 0 ? t('activity.seatsLeft', { count: item.seatsLeft }) : t('activity.full')}</dd>
                  </div>
                ) : null}
                {item.averageRating ? (
                  <div>
                    <dt className="sr-only">{t('activity.reviews')}</dt>
                    <dd>★ {item.averageRating} ({item.reviewCount})</dd>
                  </div>
                ) : null}
              </dl>
            </li>
          ))}
        </ul>
      )}

      {results.pageCount > 1 ? (
        <nav aria-label="Pagination" className="flex gap-2">
          {Array.from({ length: results.pageCount }, (_, index) => index + 1).map((page) => (
            <Link
              key={page}
              href={{ pathname: `/${locale}/search`, query: { ...query, page } }}
              className={page === results.page ? 'btn-primary' : 'btn-secondary'}
              aria-current={page === results.page ? 'page' : undefined}
            >
              {page}
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
