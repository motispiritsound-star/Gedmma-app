import { Badge, Card, DataTable, Notice, PageHeading } from '../../../components/ui.tsx';
import { prisma } from '../../../lib/db.ts';
import { requirePermissionPage } from '../../../lib/auth/guard.ts';
import { formatCents } from '../../../lib/money.ts';
import { requestTranslator } from '../../../lib/ui/locale.ts';
import { PICK_PACK_COST_CENTS, marginReport, purchasePlan } from '../../../server/costing.ts';

/**
 * Unit economics and the purchase plan behind them.
 *
 * This is the page that answers "can we actually deliver these at the price on
 * the catalogue page" — and the one that shows what a run costs before the
 * first box ships.
 */
export default async function CostingPage({
  searchParams,
}: {
  searchParams: Promise<{ run?: string }>;
}) {
  await requirePermissionPage('inventory.read', '/ops/costing');
  const { run } = await searchParams;
  const { locale } = await requestTranslator();

  const runSize = Math.min(Math.max(Number(run ?? 500) || 500, 1), 20_000);
  const [report, boxes] = await Promise.all([
    marginReport(locale),
    prisma.boxProduct.findMany({ where: { status: 'ACTIVE' }, select: { id: true } }),
  ]);
  const plan = await purchasePlan(boxes.map((box) => ({ boxProductId: box.id, quantity: runSize })));

  const m = (cents: number) => formatCents(cents, 'EUR', locale === 'nl' ? 'nl-NL' : 'en-IE');
  const nl = locale === 'nl';
  const incomplete = report.flatMap((row) => row.incompleteComponents);

  /** Below this a box is not worth the shelf space it takes. */
  const HEALTHY_MARGIN = 50;

  return (
    <>
      <PageHeading
        title={nl ? 'Kostprijs en marge' : 'Cost and margin'}
        description={
          nl
            ? 'De catalogusprijs is inclusief btw. Wat je overhoudt is de nettoprijs min de onderdelen, het inpakken en het aandeel keuring en ontwerp dat op deze doos drukt.'
            : 'The catalogue price includes VAT. What you keep is the net price minus parts, pick and pack, and this box’s share of certification and artwork.'
        }
      />

      {incomplete.length > 0 ? (
        <Notice tone="warn" title={nl ? 'Onvolledige inkoopprijzen' : 'Missing purchase prices'}>
          {nl
            ? `Deze onderdelen staan op € 0,00 en maken de marge dus te mooi: ${incomplete.join(', ')}.`
            : `These components are at €0.00 and therefore flatter the margin: ${incomplete.join(', ')}.`}
        </Notice>
      ) : null}

      <section aria-labelledby="marge" className="mb-10">
        <h2 id="marge" className="mb-3 text-xl font-bold">
          {nl ? 'Per doos' : 'Per box'}
        </h2>
        <ul className="grid gap-4 lg:grid-cols-3">
          {report.map((row) => (
            <Card key={row.boxProductId} as="li">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold">{row.name}</h3>
                  <p className="font-mono text-xs text-[var(--color-ink-soft)]">{row.sku}</p>
                </div>
                <Badge tone={row.marginPercent >= HEALTHY_MARGIN ? 'ok' : 'warn'}>
                  {row.marginPercent}%
                </Badge>
              </div>

              <dl className="space-y-1 text-sm tabular-nums">
                <Row label={nl ? 'Verkoop incl. btw' : 'Retail incl. VAT'} value={m(row.retailGross.cents)} />
                <Row
                  label={nl ? `Btw (${21}%)` : 'VAT (21%)'}
                  value={`− ${m(row.vat.cents)}`}
                  muted
                />
                <Row
                  label={nl ? 'Netto omzet' : 'Net revenue'}
                  value={m(row.retailNet.cents)}
                  rule
                />
                <Row label={nl ? 'Onderdelen' : 'Parts'} value={`− ${m(row.componentCost.cents)}`} muted />
                <Row label={nl ? 'Inpakken' : 'Pick and pack'} value={`− ${m(row.pickPackCost.cents)}`} muted />
                <Row
                  label={nl ? 'Keuring en ontwerp' : 'Certification and artwork'}
                  value={`− ${m(row.amortisedSetupCost.cents)}`}
                  muted
                />
                <Row
                  label={nl ? 'Marge' : 'Margin'}
                  value={m(row.grossMargin.cents)}
                  rule
                  strong
                />
              </dl>

              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-semibold">
                  {nl ? 'Stuklijst' : 'Bill of materials'} ({row.components.length})
                </summary>
                <ul className="mt-2 space-y-1 text-xs">
                  {row.components.map((component) => (
                    <li key={component.sku} className="flex justify-between gap-2">
                      <span className="text-[var(--color-ink-soft)]">
                        {component.quantity}× {component.name}
                      </span>
                      <span className="tabular-nums">{m(component.lineCost.cents)}</span>
                    </li>
                  ))}
                </ul>
              </details>

              <p className="mt-3 text-xs text-[var(--color-ink-soft)]">
                {nl ? 'Verzendgewicht' : 'Shipping weight'}: {row.weightGrams} g
              </p>
            </Card>
          ))}
        </ul>
        <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
          {nl
            ? `Inpakken staat op ${m(PICK_PACK_COST_CENTS)} per doos. Verzendkosten zitten hier niet in: die brengt de klant apart in rekening.`
            : `Pick and pack is set to ${m(PICK_PACK_COST_CENTS)} per box. Shipping is not included here: the customer is charged for it separately.`}
        </p>
      </section>

      <section aria-labelledby="inkoop">
        <h2 id="inkoop" className="mb-3 text-xl font-bold">
          {nl ? 'Inkoop voor een oplage' : 'Purchase plan for a run'}
        </h2>

        <form method="get" className="mb-4 flex items-end gap-3">
          <div>
            <label htmlFor="run" className="wb-label">
              {nl ? 'Stuks per doos' : 'Units per box'}
            </label>
            <input
              id="run"
              name="run"
              type="number"
              min={1}
              max={20000}
              defaultValue={runSize}
              className="wb-input w-40"
            />
          </div>
          <button type="submit" className="wb-button wb-button-secondary">
            {nl ? 'Herbereken' : 'Recalculate'}
          </button>
        </form>

        {plan.lines.length === 0 ? (
          <Notice tone="ok">
            {nl
              ? 'Er ligt genoeg op de plank voor deze oplage — je hoeft niets te bestellen.'
              : 'There is enough on the shelf for this run — nothing to order.'}
          </Notice>
        ) : (
          <>
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <Card>
                <p className="text-2xl font-bold tabular-nums">{m(plan.total.cents)}</p>
                <p className="text-sm text-[var(--color-ink-soft)]">
                  {nl ? 'Inkoopwaarde' : 'Purchase value'}
                </p>
              </Card>
              <Card>
                <p className="text-2xl font-bold tabular-nums">{plan.leadTimeDays}</p>
                <p className="text-sm text-[var(--color-ink-soft)]">
                  {nl
                    ? 'Werkdagen tot je kunt inpakken'
                    : 'Working days before you can pack'}
                </p>
              </Card>
              <Card>
                <p className="text-2xl font-bold tabular-nums">{m(plan.moqOverspendCents)}</p>
                <p className="text-sm text-[var(--color-ink-soft)]">
                  {nl
                    ? 'Extra door minimale afname'
                    : 'Extra from minimum order quantities'}
                </p>
              </Card>
            </div>

            <DataTable
              caption={nl ? 'Inkooplijst' : 'Purchase list'}
              head={[
                'SKU',
                nl ? 'Leverancier' : 'Supplier',
                nl ? 'Nodig' : 'Required',
                nl ? 'Op plank' : 'Available',
                nl ? 'Bestellen' : 'Order',
                nl ? 'Bedrag' : 'Amount',
                nl ? 'Levertijd' : 'Lead time',
              ]}
            >
              {plan.lines.map((line) => (
                <tr key={line.sku} className="border-b border-[var(--color-line)]">
                  <td className="px-3 py-2">
                    <span className="font-mono text-xs">{line.sku}</span>
                    <span className="block text-xs text-[var(--color-ink-soft)]">{line.name}</span>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {line.supplierName ?? '—'}
                    {line.supplierSku ? (
                      <span className="block font-mono text-[var(--color-ink-soft)]">
                        {line.supplierSku}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{line.required}</td>
                  <td className="px-3 py-2 tabular-nums text-[var(--color-ink-soft)]">
                    {line.available}
                  </td>
                  <td className="px-3 py-2 font-semibold tabular-nums">
                    {line.orderQuantity}
                    {line.orderQuantity > line.shortfall ? (
                      <span
                        className="ms-1 text-xs font-normal text-[var(--color-ink-soft)]"
                        title={nl ? 'Minimale afname' : 'Minimum order quantity'}
                      >
                        (+{line.orderQuantity - line.shortfall})
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{m(line.lineCost.cents)}</td>
                  <td className="px-3 py-2 tabular-nums">
                    {line.leadTimeDays === plan.leadTimeDays ? (
                      <Badge tone="caution">{line.leadTimeDays} d</Badge>
                    ) : (
                      `${line.leadTimeDays} d`
                    )}
                  </td>
                </tr>
              ))}
            </DataTable>
          </>
        )}
        <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
          {nl
            ? 'Wat al voor lopende bestellingen gereserveerd is telt niet mee als voorraad — anders pak je een doos twee keer in.'
            : 'Stock already reserved for open orders does not count as available — otherwise you would pack a box twice.'}
        </p>
      </section>
    </>
  );
}

function Row({
  label,
  value,
  muted,
  rule,
  strong,
}: {
  label: string;
  value: string;
  muted?: boolean;
  rule?: boolean;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex justify-between gap-3 ${rule ? 'border-t border-[var(--color-line)] pt-1' : ''} ${
        muted ? 'text-[var(--color-ink-soft)]' : ''
      } ${strong ? 'text-base font-bold' : ''}`}
    >
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
