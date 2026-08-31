import { Badge, DataTable, EmptyState, PageHeading } from '../../../components/ui.tsx';
import { prisma } from '../../../lib/db.ts';
import { requirePermissionPage } from '../../../lib/auth/guard.ts';
import { requestTranslator } from '../../../lib/ui/locale.ts';
import { dueSubscriptions } from '../../../server/subscriptions.ts';
import { runRenewalAction } from '../../../server/actions/ops.ts';

/**
 * The renewal work list. In production a scheduled job calls `runRenewal` for
 * each of these; the button is here so the same code path can be driven by
 * hand during an incident.
 */
export default async function RenewalsPage() {
  await requirePermissionPage('order.read.all', '/ops/renewals');
  const { locale, t } = await requestTranslator();

  const dueIds = await dueSubscriptions();
  const due = await prisma.subscription.findMany({
    where: { id: { in: dueIds } },
    include: { plan: true, family: { select: { name: true } } },
    orderBy: { currentPeriodEnd: 'asc' },
  });
  const dates = new Intl.DateTimeFormat(locale === 'nl' ? 'nl-NL' : 'en-GB', { dateStyle: 'medium' });

  return (
    <>
      <PageHeading
        title={locale === 'nl' ? 'Verlengingen' : 'Renewals'}
        description={
          locale === 'nl'
            ? 'Abonnementen waarvan de periode voorbij is. Twee keer draaien is veilig: na de eerste keer staat de periode verder en is het abonnement niet meer aan de beurt.'
            : 'Subscriptions whose period has ended. Running twice is safe: after the first run the period has moved on and the subscription is no longer due.'
        }
      />
      {due.length === 0 ? (
        <EmptyState>{t('common.none')}</EmptyState>
      ) : (
        <DataTable
          caption={locale === 'nl' ? 'Verlengingen' : 'Renewals'}
          head={[
            locale === 'nl' ? 'Gezin' : 'Family',
            t('subscription.plan'),
            t('subscription.status'),
            locale === 'nl' ? 'Periode eindigde' : 'Period ended',
            '',
          ]}
        >
          {due.map((subscription) => (
            <tr key={subscription.id} className="border-b border-[var(--color-line)]">
              <td className="px-3 py-2">{subscription.family.name}</td>
              <td className="px-3 py-2 font-mono text-xs">{subscription.plan.code}</td>
              <td className="px-3 py-2">
                <Badge tone={subscription.status === 'ACTIVE' ? 'ok' : 'caution'}>
                  {subscription.skipNextRenewal ? 'SKIP' : subscription.status}
                </Badge>
              </td>
              <td className="px-3 py-2">{dates.format(subscription.currentPeriodEnd)}</td>
              <td className="px-3 py-2">
                <form action={runRenewalAction}>
                  <input type="hidden" name="subscriptionId" value={subscription.id} />
                  <button type="submit" className="wb-button wb-button-secondary">
                    {locale === 'nl' ? 'Verlengen' : 'Renew'}
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </>
  );
}
