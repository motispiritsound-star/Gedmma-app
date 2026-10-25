import { Badge, Card, DataTable, Field, PageHeading } from '../../../components/ui.tsx';
import { prisma } from '../../../lib/db.ts';
import { requirePermissionPage } from '../../../lib/auth/guard.ts';
import { requestTranslator } from '../../../lib/ui/locale.ts';
import { sellableBoxes, stockLevels } from '../../../server/inventory.ts';
import { receiveStockAction } from '../../../server/actions/ops.ts';

export default async function InventoryPage() {
  await requirePermissionPage('inventory.read', '/ops/inventory');
  const { locale, t } = await requestTranslator();

  const [levels, items, products] = await Promise.all([
    stockLevels(),
    prisma.inventoryItem.findMany({ orderBy: { sku: 'asc' }, select: { id: true, sku: true, name: true } }),
    prisma.boxProduct.findMany({
      where: { status: 'ACTIVE' },
      include: { translations: true },
      orderBy: { curriculumIndex: 'asc' },
    }),
  ]);
  const buildable = await Promise.all(products.map((product) => sellableBoxes(product.id)));

  return (
    <>
      <PageHeading
        title={t('ops.inventory')}
        description={
          locale === 'nl'
            ? 'Beschikbaar is wat op voorraad ligt min wat al voor bestellingen gereserveerd is.'
            : 'Available is what is on the shelf minus what is already reserved for orders.'
        }
      />

      <Card className="mb-6">
        <h2 className="mb-3 font-bold">
          {locale === 'nl' ? 'Complete dozen te bouwen' : 'Complete boxes buildable'}
        </h2>
        <ul className="grid gap-2 sm:grid-cols-3">
          {products.map((product, index) => (
            <li key={product.id} className="flex items-center justify-between gap-2 text-sm">
              <span>
                {product.translations.find((entry) => entry.locale === locale)?.name ?? product.sku}
              </span>
              <Badge tone={(buildable[index] ?? 0) > 5 ? 'ok' : 'warn'}>{buildable[index] ?? 0}</Badge>
            </li>
          ))}
        </ul>
      </Card>

      <DataTable
        caption={t('ops.inventory')}
        head={['SKU', locale === 'nl' ? 'Naam' : 'Name', t('ops.onHand'), t('ops.reserved'), t('ops.available'), t('ops.reorder')]}
      >
        {levels.map((level) => (
          <tr key={level.inventoryItemId} className="border-b border-[var(--color-line)]">
            <td className="px-3 py-2 font-mono text-xs">{level.sku}</td>
            <td className="px-3 py-2">{level.name}</td>
            <td className="px-3 py-2">{level.onHand}</td>
            <td className="px-3 py-2">{level.reserved}</td>
            <td className="px-3 py-2 font-semibold">
              {level.belowReorderLevel ? (
                <Badge tone="warn">{level.available}</Badge>
              ) : (
                level.available
              )}
            </td>
            <td className="px-3 py-2 text-[var(--color-ink-soft)]">{level.reorderLevel}</td>
          </tr>
        ))}
      </DataTable>

      <Card className="mt-8 max-w-lg">
        <h2 className="mb-4 font-bold">
          {locale === 'nl' ? 'Voorraad ontvangen' : 'Receive stock'}
        </h2>
        <form action={receiveStockAction}>
          <Field label="SKU" name="inventoryItemId">
            <select id="inventoryItemId" name="inventoryItemId" className="wb-input">
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.sku} — {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={locale === 'nl' ? 'Batchcode' : 'Batch code'} name="batchCode">
            <input id="batchCode" name="batchCode" required className="wb-input" />
          </Field>
          <Field label={locale === 'nl' ? 'Aantal' : 'Quantity'} name="quantity">
            <input id="quantity" name="quantity" type="number" min={1} required className="wb-input" />
          </Field>
          <Field label={locale === 'nl' ? 'Leverancier' : 'Supplier'} name="supplier">
            <input id="supplier" name="supplier" className="wb-input" />
          </Field>
          <button type="submit" className="wb-button wb-button-primary">
            {t('common.save')}
          </button>
        </form>
      </Card>
    </>
  );
}
