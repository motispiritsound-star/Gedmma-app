import Link from 'next/link';
import { Badge, Card, PageHeading } from '../../components/ui.tsx';
import { prisma } from '../../lib/db.ts';
import { requireFamilyPage } from '../../lib/auth/guard.ts';
import { formatCents } from '../../lib/money.ts';
import { requestTranslator } from '../../lib/ui/locale.ts';
import { previewRenewal } from '../../server/subscriptions.ts';

export default async function AccountOverviewPage() {
  const actor = await requireFamilyPage('/account');
  const { locale, t } = await requestTranslator();

  const [family, subscription, orderCount, boxes] = await Promise.all([
    prisma.family.findUniqueOrThrow({
      where: { id: actor.familyId },
      include: { children: true, addresses: true },
    }),
    prisma.subscription.findFirst({
      where: { familyId: actor.familyId, status: { in: ['ACTIVE', 'TRIALING', 'PAUSED', 'PAST_DUE'] } },
      include: { plan: true },
    }),
    prisma.order.count({ where: { familyId: actor.familyId } }),
    prisma.activatedBox.findMany({
      where: { familyId: actor.familyId },
      include: { boxProduct: { include: { translations: true } } },
      orderBy: { activatedAt: 'desc' },
      take: 4,
    }),
  ]);

  const preview = subscription ? await previewRenewal(subscription.id) : null;
  const money = (cents: number) => formatCents(cents, 'EUR', locale === 'nl' ? 'nl-NL' : 'en-IE');
  const dates = new Intl.DateTimeFormat(locale === 'nl' ? 'nl-NL' : 'en-GB', { dateStyle: 'long' });

  return (
    <>
      <PageHeading
        title={`${t('account.title')} — ${family.name}`}
        description={
          locale === 'nl'
            ? `Ingelogd als ${actor.displayName}.`
            : `Signed in as ${actor.displayName}.`
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="font-bold">{t('account.subscription')}</h2>
          {subscription && preview ? (
            <>
              <p className="mt-2 flex items-center gap-2">
                <Badge tone={subscription.status === 'ACTIVE' ? 'ok' : 'caution'}>
                  {subscription.status}
                </Badge>
                <span className="text-sm">{money(subscription.plan.priceCents)}</span>
              </p>
              <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
                {t('subscription.nextRenewal')}: {dates.format(preview.renewsOn)}
                {preview.willRenew ? '' : ` (${preview.reason})`}
              </p>
              <Link href="/account/subscription" className="mt-3 inline-block text-sm underline">
                {t('common.save')} / {t('subscription.skip')}
              </Link>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{t('subscription.none')}</p>
              <Link href="/boxes" className="wb-button wb-button-primary mt-3">
                {t('catalogue.subscribe')}
              </Link>
            </>
          )}
        </Card>

        <Card>
          <h2 className="font-bold">{t('account.children')}</h2>
          {family.children.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{t('common.none')}</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {family.children.map((child) => (
                <li key={child.id}>
                  {child.displayName} —{' '}
                  <span className="text-[var(--color-ink-soft)]">
                    {new Date().getFullYear() - child.birthYear}{' '}
                    {locale === 'nl' ? 'jaar' : 'years'}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/account/children" className="mt-3 inline-block text-sm underline">
            {t('child.add')}
          </Link>
        </Card>

        <Card>
          <h2 className="font-bold">{t('account.orders')}</h2>
          <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
            {orderCount} {locale === 'nl' ? 'bestellingen' : 'orders'}
          </p>
          <Link href="/account/orders" className="mt-3 inline-block text-sm underline">
            {locale === 'nl' ? 'Bekijk bestellingen' : 'View orders'}
          </Link>
        </Card>

        <Card>
          <h2 className="font-bold">{t('play.title')}</h2>
          {boxes.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{t('play.noBoxes')}</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {boxes.map((box) => (
                <li key={box.id}>
                  <Link href={`/play/${box.id}`} className="underline">
                    {box.boxProduct.translations.find((entry) => entry.locale === locale)?.name ??
                      box.boxProduct.sku}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href="/account/activate" className="mt-3 inline-block text-sm underline">
            {t('account.activate')}
          </Link>
        </Card>
      </div>
    </>
  );
}
