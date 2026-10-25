import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Badge, Card, Notice, PageHeading } from '../../../../components/ui.tsx';
import { prisma } from '../../../../lib/db.ts';
import { requireFamilyPage } from '../../../../lib/auth/guard.ts';
import { formatCents } from '../../../../lib/money.ts';
import { requestTranslator } from '../../../../lib/ui/locale.ts';

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const { id } = await params;
  const { paid } = await searchParams;
  const actor = await requireFamilyPage('/account/orders');
  const { locale, t } = await requestTranslator();

  const order = await prisma.order.findFirst({
    where: { id, familyId: actor.familyId },
    include: { items: true, shipments: true, shippingAddress: true, invoices: true },
  });
  if (!order) notFound();

  const codes = await prisma.activationCode.findMany({ where: { orderId: order.id } });
  const money = (cents: number) => formatCents(cents, 'EUR', locale === 'nl' ? 'nl-NL' : 'en-IE');
  const dates = new Intl.DateTimeFormat(locale === 'nl' ? 'nl-NL' : 'en-GB', { dateStyle: 'long' });

  return (
    <>
      <PageHeading title={`${t('order.number')} ${order.number}`} />
      {paid ? (
        <Notice tone="ok">
          {locale === 'nl'
            ? 'Betaald. Zodra de doos onderweg is zie je hier de track & trace.'
            : 'Paid. As soon as the box is on its way you will see the tracking here.'}
        </Notice>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-bold">{locale === 'nl' ? 'Inhoud' : 'Contents'}</h2>
          <ul className="space-y-1 text-sm">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between">
                <span>
                  {item.nameSnapshot} × {item.quantity}
                </span>
                <span>{money(item.totalCents)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1 border-t border-[var(--color-line)] pt-3 text-sm">
            <div className="flex justify-between">
              <dt>{t('order.shipping')}</dt>
              <dd>{money(order.shippingCents)}</dd>
            </div>
            <div className="flex justify-between font-bold">
              <dt>{t('order.total')}</dt>
              <dd>{money(order.totalCents)}</dd>
            </div>
            <div className="flex justify-between text-xs text-[var(--color-ink-soft)]">
              <dt>{locale === 'nl' ? 'waarvan btw' : 'of which VAT'}</dt>
              <dd>{money(order.taxCents)}</dd>
            </div>
            {order.refundedCents > 0 ? (
              <div className="flex justify-between text-[var(--color-warn)]">
                <dt>{locale === 'nl' ? 'Terugbetaald' : 'Refunded'}</dt>
                <dd>{money(order.refundedCents)}</dd>
              </div>
            ) : null}
          </dl>
        </Card>

        <div className="space-y-4">
          <Card>
            <h2 className="mb-2 font-bold">{t('order.status')}</h2>
            <Badge>{order.status}</Badge>
            <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
              {t('order.placed')}: {dates.format(order.placedAt)}
            </p>
            {order.shipments.map((shipment) => (
              <p key={shipment.id} className="mt-2 text-sm">
                {t('order.tracking')}:{' '}
                <span className="font-mono">{shipment.trackingCode ?? '—'}</span> ({shipment.status})
              </p>
            ))}
          </Card>

          <Card>
            <h2 className="mb-2 font-bold">{t('account.activate')}</h2>
            {codes.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-soft)]">
                {locale === 'nl'
                  ? 'De code komt in de doos te liggen zodra de bestelling betaald is.'
                  : 'The code goes in the box as soon as the order is paid.'}
              </p>
            ) : (
              <ul className="space-y-1 text-sm">
                {codes.map((code) => (
                  <li key={code.id}>
                    <span className="font-mono">WB-••••-••••-{code.lastFour}</span>{' '}
                    <Badge tone={code.state === 'ACTIVATED' ? 'ok' : 'muted'}>{code.state}</Badge>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
              {locale === 'nl'
                ? 'We bewaren alleen de laatste vier tekens. De hele code staat in de doos.'
                : 'We only store the last four characters. The full code is in the box.'}
            </p>
            <Link href="/account/activate" className="mt-3 inline-block text-sm underline">
              {t('activate.submit')}
            </Link>
          </Card>

          {order.invoices.length > 0 ? (
            <Card>
              <h2 className="mb-2 font-bold">{t('account.invoices')}</h2>
              <ul className="space-y-1 text-sm">
                {order.invoices.map((invoice) => (
                  <li key={invoice.id} className="flex justify-between">
                    <span className="font-mono">{invoice.number}</span>
                    <span>{money(invoice.totalCents)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
