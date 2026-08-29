import { notFound, redirect } from 'next/navigation';
import { Card, Notice, PageHeading } from '../../../../components/ui.tsx';
import { prisma } from '../../../../lib/db.ts';
import { requireFamilyPage } from '../../../../lib/auth/guard.ts';
import { formatCents } from '../../../../lib/money.ts';
import { requestTranslator } from '../../../../lib/ui/locale.ts';
import { payOrderWithMock } from '../../../../server/orders.ts';
import { cancelOrder } from '../../../../server/orders.ts';

/**
 * The mock provider's hosted checkout page.
 *
 * It exists so the whole purchase flow — including the "customer leaves the
 * site and comes back" step — can be walked end to end without a Stripe
 * account. With PAYMENT_PROVIDER=stripe this route is never reached.
 */
export default async function MockCheckoutPage({
  params,
}: {
  params: Promise<{ intent: string }>;
}) {
  const { intent } = await params;
  const actor = await requireFamilyPage('/account/orders');
  const { locale, t } = await requestTranslator();

  const order = await prisma.order.findFirst({
    where: { paymentIntentRef: intent, familyId: actor.familyId },
    include: { items: true, shippingAddress: true },
  });
  if (!order) notFound();

  const money = (cents: number) => formatCents(cents, 'EUR', locale === 'nl' ? 'nl-NL' : 'en-IE');

  async function pay(): Promise<void> {
    'use server';
    await payOrderWithMock(order!.id);
    redirect(`/account/orders/${order!.id}?paid=1`);
  }

  async function abandon(): Promise<void> {
    'use server';
    await cancelOrder(order!.id, 'Abandoned at checkout', actor.id);
    redirect('/boxes?cancelled=1');
  }

  if (order.status !== 'PENDING_PAYMENT') {
    redirect(`/account/orders/${order.id}`);
  }

  return (
    <div className="mx-auto max-w-lg">
      <PageHeading
        title={locale === 'nl' ? 'Betalen (testmodus)' : 'Pay (test mode)'}
        description={
          locale === 'nl'
            ? 'Dit is de nagemaakte betaalpagina. Er wordt niets afgeschreven.'
            : 'This is the simulated payment page. Nothing is charged.'
        }
      />
      <Notice>
        {locale === 'nl'
          ? 'PAYMENT_PROVIDER staat op "mock". Zet hem op "stripe" met een testsleutel voor de echte betaalstroom.'
          : 'PAYMENT_PROVIDER is set to "mock". Set it to "stripe" with a test key for the real payment flow.'}
      </Notice>
      <Card>
        <h2 className="font-bold">
          {t('order.number')}: {order.number}
        </h2>
        <ul className="my-4 space-y-1 text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between">
              <span>
                {item.nameSnapshot} × {item.quantity}
              </span>
              <span>{money(item.totalCents)}</span>
            </li>
          ))}
          <li className="flex justify-between border-t border-[var(--color-line)] pt-1">
            <span>{t('order.shipping')}</span>
            <span>{money(order.shippingCents)}</span>
          </li>
          <li className="flex justify-between text-base font-bold">
            <span>{t('order.total')}</span>
            <span>{money(order.totalCents)}</span>
          </li>
          <li className="flex justify-between text-xs text-[var(--color-ink-soft)]">
            <span>{locale === 'nl' ? 'waarvan btw (21%)' : 'of which VAT (21%)'}</span>
            <span>{money(order.taxCents)}</span>
          </li>
        </ul>
        <address className="mb-4 text-sm not-italic text-[var(--color-ink-soft)]">
          {order.shippingAddress.recipient}
          <br />
          {order.shippingAddress.line1}
          <br />
          {order.shippingAddress.postalCode} {order.shippingAddress.city}
        </address>
        <div className="flex gap-3">
          <form action={pay} className="flex-1">
            <button type="submit" className="wb-button wb-button-primary w-full">
              {locale === 'nl' ? 'Betaling bevestigen' : 'Confirm payment'}
            </button>
          </form>
          <form action={abandon}>
            <button type="submit" className="wb-button wb-button-secondary">
              {t('common.cancel')}
            </button>
          </form>
        </div>
      </Card>
    </div>
  );
}
