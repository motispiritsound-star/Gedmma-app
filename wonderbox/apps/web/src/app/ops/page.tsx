import Link from 'next/link';
import { Card, PageHeading } from '../../components/ui.tsx';
import { prisma } from '../../lib/db.ts';
import { currentActor } from '../../lib/auth/session.ts';
import { can } from '../../lib/auth/roles.ts';
import { requestTranslator } from '../../lib/ui/locale.ts';
import { stockLevels } from '../../server/inventory.ts';

export default async function OpsHomePage() {
  const actor = await currentActor();
  const { locale, t } = await requestTranslator();
  const mayReadInventory = can(actor?.roles ?? [], 'inventory.read');

  const [awaitingFulfilment, openCases, levels] = await Promise.all([
    prisma.order.count({ where: { status: 'PAID' } }),
    prisma.supportCase.count({ where: { status: { in: ['OPEN', 'TRIAGED'] } } }),
    mayReadInventory ? stockLevels() : Promise.resolve([]),
  ]);
  const low = levels.filter((level) => level.belowReorderLevel);

  return (
    <>
      <PageHeading title={t('ops.title')} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-3xl font-bold">{awaitingFulfilment}</p>
          <p className="text-sm text-[var(--color-ink-soft)]">
            {locale === 'nl' ? 'Betaald, wacht op label' : 'Paid, awaiting a label'}
          </p>
          <Link href="/ops/orders" className="mt-2 inline-block text-sm underline">
            {t('ops.orders')}
          </Link>
        </Card>
        <Card>
          <p className="text-3xl font-bold">{low.length}</p>
          <p className="text-sm text-[var(--color-ink-soft)]">
            {locale === 'nl' ? 'Artikelen onder bestelniveau' : 'Items below reorder level'}
          </p>
          {mayReadInventory ? (
            <Link href="/ops/inventory" className="mt-2 inline-block text-sm underline">
              {t('ops.inventory')}
            </Link>
          ) : null}
        </Card>
        <Card>
          <p className="text-3xl font-bold">{openCases}</p>
          <p className="text-sm text-[var(--color-ink-soft)]">
            {locale === 'nl' ? 'Open meldingen' : 'Open cases'}
          </p>
          <Link href="/ops/support" className="mt-2 inline-block text-sm underline">
            {t('support.title')}
          </Link>
        </Card>
      </div>
    </>
  );
}
