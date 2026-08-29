import Link from 'next/link';
import { isLocale, translator } from '@/lib/i18n';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { CATEGORY_LABELS } from '@/lib/i18n/labels';
import { Card } from '@/components/ui';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = translator(locale);

  const [activityCount, providerCount, city] = await Promise.all([
    prisma.activity.count({ where: { status: 'PUBLISHED' } }),
    prisma.provider.count({ where: { status: 'APPROVED' } }),
    prisma.city.findFirst({ where: { isLaunchCity: true } }),
  ]);

  const categories = Object.entries(CATEGORY_LABELS).slice(0, 8);

  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-brand-700 px-6 py-12 text-white sm:px-10">
        <p className="text-sm uppercase tracking-wide text-brand-100">{city?.name ?? 'Utrecht'}</p>
        <h1 className="mt-2 max-w-2xl text-4xl font-semibold tracking-tight">{t('app.tagline')}</h1>
        <p className="mt-4 max-w-2xl text-brand-50">{t('app.description')}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/${locale}/search`} className="btn bg-white px-5 py-2.5 text-brand-700 hover:bg-brand-50">
            {t('nav.search')}
          </Link>
          <Link href={`/${locale}/plans`} className="btn border border-white/40 px-5 py-2.5 text-white hover:bg-white/10">
            {t('nav.plans')}
          </Link>
        </div>
        <p className="mt-6 text-sm text-brand-100">
          {locale === 'nl'
            ? `${activityCount} activiteiten van ${providerCount} geverifieerde aanbieders.`
            : `${activityCount} activities from ${providerCount} verified providers.`}
        </p>
      </section>

      <section aria-labelledby="categories">
        <h2 id="categories" className="mb-4 text-lg font-semibold">
          {t('search.category')}
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {categories.map(([key, labels]) => (
            <li key={key}>
              <Link
                href={`/${locale}/search?category=${key}`}
                className="block rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium hover:border-brand-400 hover:text-brand-700"
              >
                {labels[locale]}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <h3 className="font-semibold">{locale === 'nl' ? 'Geverifieerde aanbieders' : 'Verified providers'}</h3>
          <p className="mt-2 text-sm text-slate-600">
            {locale === 'nl'
              ? 'Elke aanbieder wordt handmatig beoordeeld op inschrijving, verzekering en veiligheidsbeleid voordat er iets gepubliceerd wordt.'
              : 'Every provider is reviewed by hand — registration, insurance and safeguarding policy — before anything is published.'}
          </p>
        </Card>
        <Card>
          <h3 className="font-semibold">{locale === 'nl' ? 'Eén abonnement' : 'One subscription'}</h3>
          <p className="mt-2 text-sm text-slate-600">
            {locale === 'nl'
              ? 'Maandelijkse credits die je vrij verdeelt over je kinderen en over verschillende clubs.'
              : 'Monthly credits you spread freely across your children and across different clubs.'}
          </p>
        </Card>
        <Card>
          <h3 className="font-semibold">{locale === 'nl' ? 'Kinderen blijven privé' : 'Children stay private'}</h3>
          <p className="mt-2 text-sm text-slate-600">{t('safety.noChildContact')}</p>
        </Card>
      </section>
    </div>
  );
}
