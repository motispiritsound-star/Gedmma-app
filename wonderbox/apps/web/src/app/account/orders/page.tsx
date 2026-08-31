import Link from 'next/link';
import { Badge, DataTable, EmptyState, PageHeading } from '../../../components/ui.tsx';
import { prisma } from '../../../lib/db.ts';
import { requireFamilyPage } from '../../../lib/auth/guard.ts';
import { formatCents } from '../../../lib/money.ts';
import { requestTranslator } from '../../../lib/ui/locale.ts';

const TONE: Record<string, 'ok' | 'caution' | 'warn' | 'muted'> = {
  PENDING_PAYMENT: 'caution',
  PAID: 'ok',
  FULFILLING: 'ok',
  SHIPPED: 'ok',
  DELIVERED: 'ok',
  CANCELLED: 'muted',
  REFUNDED: 'warn',
};

export default async function OrdersPage() {
  const actor = await requireFamilyPage('/account/orders');
  const { locale, t } = await requestTranslator();
  const orders = await prisma.order.findMany({
    where: { familyId: actor.familyId },
    orderBy: { placedAt: 'desc' },
    include: { items: true, shipments: true },
  });
  const dates = new Intl.DateTimeFormat(locale === 'nl' ? 'nl-NL' : 'en-GB', { dateStyle: 'medium' });

  return (
    <>
      <PageHeading title={t('account.orders')} />
      {orders.length === 0 ? (
        <EmptyState>{t('order.none')}</EmptyState>
      ) : (
        <DataTable
          caption={t('account.orders')}
          head={[t('order.number'), t('order.placed'), t('order.status'), t('order.total'), '']}
        >
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-[var(--color-line)]">
              <td className="px-3 py-2 font-medium">{order.number}</td>
              <td className="px-3 py-2">{dates.format(order.placedAt)}</td>
              <td className="px-3 py-2">
                <Badge tone={TONE[order.status] ?? 'muted'}>{order.status}</Badge>
              </td>
              <td className="px-3 py-2">
                {formatCents(order.totalCents, 'EUR', locale === 'nl' ? 'nl-NL' : 'en-IE')}
              </td>
              <td className="px-3 py-2 text-end">
                <Link href={`/account/orders/${order.id}`} className="underline">
                  {locale === 'nl' ? 'Details' : 'Details'}
                </Link>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </>
  );
}
