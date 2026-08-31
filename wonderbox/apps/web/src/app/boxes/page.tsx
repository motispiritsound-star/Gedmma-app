import Link from 'next/link';
import { Badge, Card, EmptyState, PageHeading } from '../../components/ui.tsx';
import { catalogue, plans } from '../../server/catalogue.ts';
import { formatCents } from '../../lib/money.ts';
import { requestTranslator } from '../../lib/ui/locale.ts';

export default async function CataloguePage() {
  const { locale, t } = await requestTranslator();
  const [boxes, planList] = await Promise.all([catalogue(locale), plans(locale)]);
  const money = (cents: number) => formatCents(cents, 'EUR', locale === 'nl' ? 'nl-NL' : 'en-IE');

  return (
    <>
      <PageHeading
        title={t('catalogue.title')}
        description={
          locale === 'nl'
            ? 'Elke doos hoort bij een thema en een leeftijdsgroep. Je kunt los bestellen of een abonnement nemen.'
            : 'Every box belongs to a theme and an age band. Order one, or take a subscription.'
        }
      />

      {boxes.length === 0 ? (
        <EmptyState>{t('catalogue.empty')}</EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boxes.map((box) => (
            <Card key={box.id} as="li" className="flex flex-col">
              <div className="mb-2 flex items-center gap-2">
                <Badge>{box.themeName}</Badge>
                {box.inStock ? null : <Badge tone="warn">{t('catalogue.outOfStock')}</Badge>}
              </div>
              <h2 className="text-lg font-bold">
                <Link href={`/boxes/${box.slug}`} className="hover:underline">
                  {box.name}
                </Link>
              </h2>
              <p className="mt-1 flex-1 text-sm text-[var(--color-ink-soft)]">{box.tagline}</p>
              <dl className="mt-3 grid grid-cols-2 gap-1 text-sm">
                <dt className="sr-only-focusable absolute">{t('child.ageBand')}</dt>
                <dd>{t('catalogue.ages', { min: box.ageMin, max: box.ageMax })}</dd>
                <dd className="text-end font-semibold">{money(box.priceCents)}</dd>
                <dd className="text-[var(--color-ink-soft)]">
                  {t('catalogue.chapters', { count: box.chapterCount })}
                </dd>
                <dd className="text-end text-[var(--color-ink-soft)]">
                  {t('catalogue.experiments', { count: box.experimentCount })}
                </dd>
              </dl>
              <Link
                href={`/boxes/${box.slug}`}
                className="wb-button wb-button-secondary mt-4 w-full"
              >
                {locale === 'nl' ? 'Bekijken' : 'View'}
              </Link>
            </Card>
          ))}
        </ul>
      )}

      <section className="mt-12" aria-labelledby="plans">
        <h2 id="plans" className="mb-4 text-xl font-bold">
          {t('catalogue.subscribe')}
        </h2>
        <ul className="grid gap-4 sm:grid-cols-3">
          {planList.map((plan) => (
            <Card key={plan.id} as="li">
              <h3 className="font-bold">{plan.name}</h3>
              <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{plan.description}</p>
              <p className="mt-3 text-lg font-bold">
                {money(plan.priceCents)}{' '}
                <span className="text-sm font-normal text-[var(--color-ink-soft)]">
                  {plan.intervalMonths === 1
                    ? locale === 'nl'
                      ? 'per maand'
                      : 'per month'
                    : locale === 'nl'
                      ? `per ${plan.intervalMonths} maanden`
                      : `per ${plan.intervalMonths} months`}
                </span>
              </p>
              <form action="/api/checkout/subscribe" method="post" className="mt-4">
                <input type="hidden" name="planCode" value={plan.code} />
                <button type="submit" className="wb-button wb-button-primary w-full">
                  {t('catalogue.subscribe')}
                </button>
              </form>
            </Card>
          ))}
        </ul>
      </section>
    </>
  );
}
