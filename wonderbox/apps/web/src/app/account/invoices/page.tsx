import { Badge, DataTable, EmptyState, PageHeading } from '../../../components/ui.tsx';
import { prisma } from '../../../lib/db.ts';
import { requireFamilyPage } from '../../../lib/auth/guard.ts';
import { formatCents } from '../../../lib/money.ts';
import { requestTranslator } from '../../../lib/ui/locale.ts';

export default async function InvoicesPage() {
  const actor = await requireFamilyPage('/account/invoices');
  const { locale, t } = await requestTranslator();
  const invoices = await prisma.invoice.findMany({
    where: { familyId: actor.familyId },
    orderBy: { issuedAt: 'desc' },
    include: { order: { select: { number: true } } },
  });
  const dates = new Intl.DateTimeFormat(locale === 'nl' ? 'nl-NL' : 'en-GB', { dateStyle: 'medium' });

  return (
    <>
      <PageHeading
        title={t('account.invoices')}
        description={
          locale === 'nl'
            ? 'Facturen bewaren we zeven jaar, omdat de belastingdienst dat vraagt. Ze blijven staan als je je gegevens laat verwijderen.'
            : 'We keep invoices for seven years because tax law requires it. They stay if you have your data deleted.'
        }
      />
      {invoices.length === 0 ? (
        <EmptyState>{t('order.none')}</EmptyState>
      ) : (
        <DataTable
          caption={t('account.invoices')}
          head={['#', t('order.placed'), t('order.number'), t('order.status'), t('order.total')]}
        >
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="border-b border-[var(--color-line)]">
              <td className="px-3 py-2 font-mono">{invoice.number}</td>
              <td className="px-3 py-2">{dates.format(invoice.issuedAt)}</td>
              <td className="px-3 py-2">{invoice.order?.number ?? '—'}</td>
              <td className="px-3 py-2">
                <Badge tone={invoice.status === 'PAID' ? 'ok' : 'muted'}>{invoice.status}</Badge>
              </td>
              <td className="px-3 py-2">
                {formatCents(invoice.totalCents, 'EUR', locale === 'nl' ? 'nl-NL' : 'en-IE')}
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </>
  );
}
