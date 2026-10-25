import { Badge, Card, EmptyState, Notice, PageHeading } from '../../../components/ui.tsx';
import { prisma } from '../../../lib/db.ts';
import { requirePermissionPage } from '../../../lib/auth/guard.ts';
import { formatCents } from '../../../lib/money.ts';
import { requestTranslator } from '../../../lib/ui/locale.ts';
import { replenishmentProposal } from '../../../server/purchasing.ts';
import {
  approvePurchaseOrderAction,
  cancelPurchaseOrderAction,
  raisePurchaseOrdersAction,
  receivePurchaseOrderAction,
} from '../../../server/actions/ops.ts';

const STATUS_TONE: Record<string, 'ok' | 'caution' | 'warn' | 'muted' | 'neutral'> = {
  DRAFT: 'caution',
  APPROVED: 'neutral',
  SENT: 'neutral',
  CONFIRMED: 'neutral',
  PARTIALLY_RECEIVED: 'caution',
  RECEIVED: 'ok',
  CANCELLED: 'muted',
};

/**
 * Purchasing.
 *
 * The proposal comes straight out of the subscription book — known demand, not
 * a moving average — netted against the shelf and against what is already on
 * order. Raising an order is one click; sending one to a supplier is a separate
 * click, because that is the moment money is committed.
 */
export default async function PurchasingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requirePermissionPage('inventory.read', '/ops/purchasing');
  const { error } = await searchParams;
  const { locale } = await requestTranslator();
  const nl = locale === 'nl';
  const m = (cents: number) => formatCents(cents, 'EUR', nl ? 'nl-NL' : 'en-IE');
  const dates = new Intl.DateTimeFormat(nl ? 'nl-NL' : 'en-GB', { dateStyle: 'medium' });

  const [proposals, orders] = await Promise.all([
    replenishmentProposal(),
    prisma.purchaseOrder.findMany({
      where: { status: { notIn: ['RECEIVED', 'CANCELLED'] } },
      include: {
        supplier: true,
        lines: { include: { inventoryItem: true } },
        approvedBy: { select: { displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 40,
    }),
  ]);

  const openTotal = orders.reduce((sum, order) => sum + order.subtotalCents, 0);

  return (
    <>
      <PageHeading
        title={nl ? 'Inkoop' : 'Purchasing'}
        description={
          nl
            ? 'Wat er besteld moet worden volgt uit het abonnementenboek: elk lopend abonnement is één doos per periode, en de leerlijn zegt welke. Geen schatting, gewoon optellen.'
            : 'What needs ordering follows from the subscription book: every live subscription is one box per period, and the curriculum says which. Not an estimate — arithmetic.'
        }
        action={
          proposals.length > 0 ? (
            <form action={raisePurchaseOrdersAction}>
              <button type="submit" className="wb-button wb-button-primary">
                {nl ? 'Concepten aanmaken' : 'Raise drafts'}
              </button>
            </form>
          ) : null
        }
      />

      {error ? <Notice tone="warn">{error}</Notice> : null}

      <section aria-labelledby="voorstel" className="mb-10">
        <h2 id="voorstel" className="mb-3 text-xl font-bold">
          {nl ? 'Voorstel' : 'Proposal'}
        </h2>
        {proposals.length === 0 ? (
          <Notice tone="ok">
            {nl
              ? 'Er is niets te bestellen: de voorraad dekt de voorspelde vraag plus de buffer.'
              : 'Nothing to order: stock covers forecast demand plus the buffer.'}
          </Notice>
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {proposals.map((proposal) => (
              <Card key={proposal.supplierId} as="li">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h3 className="font-bold">{proposal.supplierName}</h3>
                  <Badge tone="muted">{proposal.channel}</Badge>
                  <span className="ms-auto font-semibold tabular-nums">
                    {m(proposal.subtotal.cents)}
                  </span>
                </div>
                <p className="mb-3 text-sm text-[var(--color-ink-soft)]">
                  {nl ? 'Levertijd' : 'Lead time'} {proposal.leadTimeDays} d ·{' '}
                  {nl ? 'verwacht' : 'expected'} {dates.format(proposal.expectedAt)}
                </p>

                {proposal.belowMinimumOrderValue ? (
                  <Notice tone="warn">
                    {nl
                      ? 'Onder de minimale orderwaarde van deze leverancier. Wordt niet besteld; wacht tot er meer op de lijst staat.'
                      : 'Below this supplier’s minimum order value. Not ordered; waiting until more accumulates.'}
                  </Notice>
                ) : null}

                <ul className="space-y-1 text-xs">
                  {proposal.lines.map((line) => (
                    <li key={line.inventoryItemId} className="flex justify-between gap-2">
                      <span className="font-mono">{line.sku}</span>
                      <span className="text-[var(--color-ink-soft)] tabular-nums">
                        {nl ? 'vraag' : 'demand'} {line.demand} + {nl ? 'buffer' : 'buffer'}{' '}
                        {line.safetyStock} − {nl ? 'vrij' : 'free'} {line.onHand - line.reserved} −{' '}
                        {nl ? 'onderweg' : 'on order'} {line.onOrder}
                      </span>
                      <span className="font-semibold tabular-nums">→ {line.orderQuantity}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="orders">
        <h2 id="orders" className="mb-3 text-xl font-bold">
          {nl ? 'Lopende inkooporders' : 'Open purchase orders'}{' '}
          <span className="text-base font-normal text-[var(--color-ink-soft)]">
            {orders.length} · {m(openTotal)}
          </span>
        </h2>

        {orders.length === 0 ? (
          <EmptyState>{nl ? 'Geen lopende orders.' : 'No open orders.'}</EmptyState>
        ) : (
          <ul className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} as="li">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold">{order.number}</span>
                  <Badge tone={STATUS_TONE[order.status] ?? 'muted'}>{order.status}</Badge>
                  <span className="text-sm">{order.supplier.name}</span>
                  {order.approvedBy ? (
                    <span className="text-xs text-[var(--color-ink-soft)]">
                      {nl ? 'goedgekeurd door' : 'approved by'} {order.approvedBy.displayName}
                    </span>
                  ) : null}
                  <span className="ms-auto font-semibold tabular-nums">
                    {m(order.subtotalCents)}
                  </span>
                </div>

                <form action={receivePurchaseOrderAction}>
                  <input type="hidden" name="purchaseOrderId" value={order.id} />
                  <ul className="mb-3 space-y-2">
                    {order.lines.map((line) => {
                      const outstanding = line.quantity - line.receivedQuantity;
                      return (
                        <li key={line.id} className="flex flex-wrap items-center gap-3 text-sm">
                          <span className="font-mono text-xs">{line.inventoryItem.sku}</span>
                          <span className="text-[var(--color-ink-soft)]">
                            {line.inventoryItem.name}
                          </span>
                          <span className="ms-auto tabular-nums">
                            {line.receivedQuantity} / {line.quantity}
                          </span>
                          {outstanding > 0 && order.status !== 'DRAFT' ? (
                            <>
                              <label
                                htmlFor={`qty-${line.id}`}
                                className="sr-only-focusable absolute"
                              >
                                {nl ? 'Ontvangen aantal voor' : 'Received quantity for'}{' '}
                                {line.inventoryItem.sku}
                              </label>
                              <input
                                id={`qty-${line.id}`}
                                name={`qty:${line.inventoryItemId}`}
                                type="number"
                                min={0}
                                max={outstanding}
                                placeholder={String(outstanding)}
                                className="wb-input w-24"
                              />
                            </>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                  {order.status !== 'DRAFT' ? (
                    <button type="submit" className="wb-button wb-button-secondary">
                      {nl ? 'Ontvangst boeken' : 'Book in receipt'}
                    </button>
                  ) : null}
                </form>

                {order.status === 'DRAFT' ? (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--color-line)] pt-3">
                    <form action={approvePurchaseOrderAction}>
                      <input type="hidden" name="purchaseOrderId" value={order.id} />
                      <input type="hidden" name="send" value="true" />
                      <button type="submit" className="wb-button wb-button-primary">
                        {nl ? 'Goedkeuren en versturen' : 'Approve and send'}
                      </button>
                    </form>
                    <form action={approvePurchaseOrderAction}>
                      <input type="hidden" name="purchaseOrderId" value={order.id} />
                      <button type="submit" className="wb-button wb-button-secondary">
                        {nl ? 'Alleen goedkeuren' : 'Approve only'}
                      </button>
                    </form>
                    <form action={cancelPurchaseOrderAction}>
                      <input type="hidden" name="purchaseOrderId" value={order.id} />
                      <button type="submit" className="text-sm underline">
                        {nl ? 'Vervallen' : 'Cancel'}
                      </button>
                    </form>
                  </div>
                ) : null}
              </Card>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
