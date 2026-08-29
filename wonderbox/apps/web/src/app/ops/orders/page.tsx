import { Badge, Card, EmptyState, Notice, PageHeading } from '../../../components/ui.tsx';
import { prisma } from '../../../lib/db.ts';
import { requirePermissionPage } from '../../../lib/auth/guard.ts';
import { can } from '../../../lib/auth/roles.ts';
import { formatCents } from '../../../lib/money.ts';
import { requestTranslator } from '../../../lib/ui/locale.ts';
import {
  cancelOrderAction,
  createLabelAction,
  refundOrderAction,
} from '../../../server/actions/ops.ts';

/**
 * The fulfilment queue.
 *
 * Ops needs the delivery address to put a parcel together, so `address.read`
 * is granted to this role — and to no content role. The name and street shown
 * here are the narrowest slice that makes the job possible.
 */
export default async function OpsOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const actor = await requirePermissionPage('order.read.all', '/ops/orders');
  const { error } = await searchParams;
  const { locale, t } = await requestTranslator();
  const mayShip = can(actor.roles, 'shipment.write');
  const mayReadAddress = can(actor.roles, 'address.read');

  const orders = await prisma.order.findMany({
    where: { status: { in: ['PAID', 'FULFILLING', 'SHIPPED', 'PENDING_PAYMENT'] } },
    include: {
      items: true,
      shipments: true,
      family: { select: { name: true } },
      shippingAddress: mayReadAddress,
    },
    orderBy: { placedAt: 'asc' },
    take: 100,
  });

  const money = (cents: number) => formatCents(cents, 'EUR', locale === 'nl' ? 'nl-NL' : 'en-IE');

  return (
    <>
      <PageHeading title={t('ops.orders')} />
      {error ? <Notice tone="warn">{error}</Notice> : null}
      {orders.length === 0 ? (
        <EmptyState>{t('order.none')}</EmptyState>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <Card key={order.id} as="li">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="font-mono font-bold">{order.number}</span>
                <Badge tone={order.status === 'PAID' ? 'ok' : 'muted'}>{order.status}</Badge>
                <span className="text-sm text-[var(--color-ink-soft)]">{order.family.name}</span>
                <span className="ms-auto font-semibold">{money(order.totalCents)}</span>
              </div>

              <ul className="mb-3 text-sm text-[var(--color-ink-soft)]">
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.quantity}× {item.sku} — {item.nameSnapshot}
                  </li>
                ))}
              </ul>

              {mayReadAddress && order.shippingAddress ? (
                <address className="mb-3 text-sm not-italic">
                  {order.shippingAddress.recipient}, {order.shippingAddress.line1},{' '}
                  {order.shippingAddress.postalCode} {order.shippingAddress.city},{' '}
                  {order.shippingAddress.country}
                </address>
              ) : null}

              <div className="flex flex-wrap items-end gap-3">
                {mayShip && (order.status === 'PAID' || order.status === 'FULFILLING') ? (
                  <form action={createLabelAction}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <button type="submit" className="wb-button wb-button-primary">
                      {t('ops.createLabel')}
                    </button>
                  </form>
                ) : null}

                {order.status === 'PENDING_PAYMENT' || order.status === 'PAID' ? (
                  <form action={cancelOrderAction}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="reason" value="Cancelled from the ops console" />
                    <button type="submit" className="wb-button wb-button-secondary">
                      {t('common.cancel')}
                    </button>
                  </form>
                ) : null}

                {order.status !== 'PENDING_PAYMENT' && order.refundedCents < order.totalCents ? (
                  <form action={refundOrderAction} className="flex items-end gap-2">
                    <input type="hidden" name="orderId" value={order.id} />
                    <div>
                      <label className="wb-label" htmlFor={`cents-${order.id}`}>
                        {locale === 'nl' ? 'Terugbetalen (cent)' : 'Refund (cents)'}
                      </label>
                      <input
                        id={`cents-${order.id}`}
                        name="cents"
                        type="number"
                        min={1}
                        max={order.totalCents - order.refundedCents}
                        defaultValue={order.totalCents - order.refundedCents}
                        className="wb-input w-32"
                      />
                    </div>
                    <button type="submit" className="wb-button wb-button-secondary">
                      {locale === 'nl' ? 'Terugbetalen' : 'Refund'}
                    </button>
                  </form>
                ) : null}

                {order.shipments.map((shipment) => (
                  <p key={shipment.id} className="text-sm text-[var(--color-ink-soft)]">
                    {shipment.trackingCode} · {shipment.status}
                  </p>
                ))}
              </div>
            </Card>
          ))}
        </ul>
      )}
    </>
  );
}
