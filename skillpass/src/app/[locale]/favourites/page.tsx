import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { isLocale, toDbLocale, translator } from '@/lib/i18n';
import { viewerContext } from '@/lib/auth/context';
import { listFavourites } from '@/modules/reviews/service';
import { toggleFavouriteAction } from '@/app/actions/guardian';
import { Card, EmptyState, PageHeader } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function FavouritesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = translator(locale);
  const dbLocale = toDbLocale(locale);

  const { user, familyId } = await viewerContext();
  if (!user) redirect(`/${locale}/auth/login`);
  if (!familyId) redirect(`/${locale}`);

  const favourites = await listFavourites(familyId);

  return (
    <div className="space-y-6">
      <PageHeader title={t('nav.favourites')} />
      {favourites.length === 0 ? (
        <EmptyState>{t('common.none')}</EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {favourites.map((favourite) => {
            const translation =
              favourite.activity.translations.find((tr) => tr.locale === dbLocale) ?? favourite.activity.translations[0];
            return (
              <li key={favourite.id}>
                <Card>
                  <Link href={`/${locale}/activities/${favourite.activity.slug}`} className="font-semibold text-brand-700 hover:underline">
                    {translation?.title}
                  </Link>
                  <p className="mt-1 text-sm text-slate-600">
                    {favourite.activity.provider.displayName} · {favourite.activity.venue.city.name}
                  </p>
                  {favourite.childProfile ? (
                    <p className="mt-1 text-xs text-slate-500">{favourite.childProfile.nickname}</p>
                  ) : null}
                  <form action={toggleFavouriteAction} className="mt-3">
                    <input type="hidden" name="activityId" value={favourite.activityId} />
                    <button type="submit" className="btn-secondary">
                      {t('activity.unfavourite')}
                    </button>
                  </form>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
