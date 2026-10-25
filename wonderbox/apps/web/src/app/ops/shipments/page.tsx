import { Badge, DataTable, EmptyState, Notice, PageHeading } from '../../../components/ui.tsx';
import { prisma } from '../../../lib/db.ts';
import { requirePermissionPage } from '../../../lib/auth/guard.ts';
import { requestTranslator } from '../../../lib/ui/locale.ts';
import { advanceShipmentAction } from '../../../server/actions/ops.ts';
import { env } from '../../../lib/env.ts';

export default async function ShipmentsPage() {
  await requirePermissionPage('shipment.write', '/ops/shipments');
  const { locale, t } = await requestTranslator();
  const shipments = await prisma.shipment.findMany({
    orderBy: { createdAt: 'desc' },
    include: { order: { select: { number: true, status: true } } },
    take: 100,
  });

  return (
    <>
      <PageHeading title={t('ops.shipments')} />
      <Notice>
        {locale === 'nl'
          ? `Vervoerder: ${env.SHIPPING_PROVIDER}. In mock-modus zet je hier de statussen met de hand door; in productie doen de webhooks van de vervoerder dat.`
          : `Carrier: ${env.SHIPPING_PROVIDER}. In mock mode you advance the statuses by hand here; in production the carrier's webhooks do it.`}
      </Notice>
      {shipments.length === 0 ? (
        <EmptyState>{t('common.none')}</EmptyState>
      ) : (
        <DataTable
          caption={t('ops.shipments')}
          head={[t('order.number'), t('order.tracking'), t('order.status'), '']}
        >
          {shipments.map((shipment) => (
            <tr key={shipment.id} className="border-b border-[var(--color-line)]">
              <td className="px-3 py-2 font-mono">{shipment.order.number}</td>
              <td className="px-3 py-2 font-mono text-xs">{shipment.trackingCode ?? '—'}</td>
              <td className="px-3 py-2">
                <Badge tone={shipment.status === 'DELIVERED' ? 'ok' : 'muted'}>
                  {shipment.status}
                </Badge>
              </td>
              <td className="px-3 py-2">
                {shipment.providerRef ? (
                  <form action={advanceShipmentAction} className="flex gap-2">
                    <input type="hidden" name="providerRef" value={shipment.providerRef} />
                    <select
                      name="status"
                      className="wb-input w-40"
                      defaultValue="in_transit"
                      aria-label={`${locale === 'nl' ? 'Nieuwe status voor' : 'New status for'} ${shipment.trackingCode ?? shipment.order.number}`}
                    >
                      <option value="in_transit">in_transit</option>
                      <option value="delivered">delivered</option>
                      <option value="failed">failed</option>
                      <option value="returned">returned</option>
                    </select>
                    <button type="submit" className="wb-button wb-button-secondary">
                      {t('common.save')}
                    </button>
                  </form>
                ) : null}
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </>
  );
}
