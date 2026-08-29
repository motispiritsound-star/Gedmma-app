import { prisma, type Db } from '../lib/db.ts';
import { NotFoundError } from '../lib/errors.ts';
import { money, type Money } from '../lib/money.ts';
import { VAT_RATE_PERCENT } from './pricing.ts';
import type { Locale } from '../lib/i18n/locale.ts';

/**
 * Unit economics.
 *
 * The question this module answers is the one that decides whether a box gets
 * made: at the price on the catalogue page, what is left after everything it
 * actually costs to put in a child's hands?
 *
 * Three traps it is written to avoid.
 *
 *   1. **VAT.** The catalogue price is gross. Revenue is the net figure —
 *      `gross × 100 / 121` — because the VAT belongs to the tax office and was
 *      never yours. Comparing a gross price to a net cost overstates margin by
 *      about a fifth, which is exactly enough to make a bad box look fine.
 *   2. **Purchase cost is net too.** Input VAT is reclaimed, so counting it as
 *      a cost double-punishes the same money.
 *   3. **One-off costs are real costs.** EN 71 testing, a technical file and
 *      the card artwork are spent before the first box ships. Spread over the
 *      run they are often larger than the cheap electronics inside, and a
 *      parts-only calculation simply cannot see them.
 */

/** Pick-and-pack labour per box, in cents. Tune to your own operation. */
export const PICK_PACK_COST_CENTS = 150;

export interface ComponentCost {
  readonly sku: string;
  readonly name: string;
  readonly quantity: number;
  readonly unitCost: Money;
  readonly lineCost: Money;
  readonly supplierName: string | null;
  readonly weightGrams: number;
  /** True when nobody has entered a purchase price yet. */
  readonly missingCost: boolean;
}

export interface BoxEconomics {
  readonly boxProductId: string;
  readonly sku: string;
  readonly name: string;
  /** What the parent pays, VAT included. */
  readonly retailGross: Money;
  /** What you actually keep before costs. */
  readonly retailNet: Money;
  readonly vat: Money;

  readonly components: readonly ComponentCost[];
  readonly componentCost: Money;
  readonly pickPackCost: Money;
  /** (certification + artwork) ÷ amortiseOverUnits. */
  readonly amortisedSetupCost: Money;
  readonly totalCost: Money;

  readonly grossMargin: Money;
  /** Percentage of net revenue kept, to one decimal. */
  readonly marginPercent: number;
  readonly weightGrams: number;

  /** Costs that are zero only because nobody filled them in. */
  readonly incompleteComponents: readonly string[];
}

function netOfVat(grossCents: number): number {
  // gross × 100 / (100 + rate). Rounded once, here.
  return Math.round((grossCents * 100) / (100 + VAT_RATE_PERCENT));
}

export async function boxEconomics(
  boxProductId: string,
  locale: Locale = 'nl',
  db: Db = prisma,
): Promise<BoxEconomics> {
  const product = await db.boxProduct.findUnique({
    where: { id: boxProductId },
    include: { translations: true, kitComponents: { include: { inventoryItem: true } } },
  });
  if (!product) throw new NotFoundError('Box product');

  const components: ComponentCost[] = product.kitComponents.map((component) => {
    const item = component.inventoryItem;
    return {
      sku: item.sku,
      name: item.name,
      quantity: component.quantity,
      unitCost: money(item.costCents),
      lineCost: money(item.costCents * component.quantity),
      supplierName: item.supplierName,
      weightGrams: item.weightGrams * component.quantity,
      missingCost: item.costCents === 0,
    };
  });

  const componentCents = components.reduce((total, entry) => total + entry.lineCost.cents, 0);
  const amortiseOver = Math.max(product.amortiseOverUnits, 1);
  const amortisedCents = Math.round(
    (product.certificationCostCents + product.artworkCostCents) / amortiseOver,
  );
  const totalCents = componentCents + PICK_PACK_COST_CENTS + amortisedCents;
  const netCents = netOfVat(product.priceCents);

  return {
    boxProductId: product.id,
    sku: product.sku,
    name:
      product.translations.find((entry) => entry.locale === locale)?.name ??
      product.translations[0]?.name ??
      product.sku,
    retailGross: money(product.priceCents),
    retailNet: money(netCents),
    vat: money(product.priceCents - netCents),
    components,
    componentCost: money(componentCents),
    pickPackCost: money(PICK_PACK_COST_CENTS),
    amortisedSetupCost: money(amortisedCents),
    totalCost: money(totalCents),
    grossMargin: money(netCents - totalCents),
    marginPercent: netCents === 0 ? 0 : Math.round(((netCents - totalCents) / netCents) * 1000) / 10,
    weightGrams: components.reduce((total, entry) => total + entry.weightGrams, 0),
    incompleteComponents: components.filter((entry) => entry.missingCost).map((entry) => entry.sku),
  };
}

/** Every active box, most profitable first. The one-screen viability answer. */
export async function marginReport(locale: Locale = 'nl'): Promise<BoxEconomics[]> {
  const products = await prisma.boxProduct.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true },
    orderBy: { curriculumIndex: 'asc' },
  });
  const rows = await Promise.all(products.map((product) => boxEconomics(product.id, locale)));
  return rows.sort((a, b) => b.marginPercent - a.marginPercent);
}

export interface PurchaseLine {
  readonly sku: string;
  readonly name: string;
  readonly supplierName: string | null;
  readonly supplierSku: string | null;
  /** What the run needs. */
  readonly required: number;
  /** What is free on the shelf right now. */
  readonly available: number;
  /** Shortfall before the supplier's minimum is applied. */
  readonly shortfall: number;
  /** What you actually have to order, respecting MOQ. */
  readonly orderQuantity: number;
  readonly unitCost: Money;
  readonly lineCost: Money;
  readonly leadTimeDays: number;
}

export interface PurchasePlan {
  readonly lines: readonly PurchaseLine[];
  readonly total: Money;
  /** The slowest component decides when you can start packing. */
  readonly leadTimeDays: number;
  /** Ordering more than the shortfall because of a minimum order quantity. */
  readonly moqOverspendCents: number;
}

/**
 * What to buy for a production run, net of what is already on the shelf.
 *
 * Reserved stock is excluded from `available`: it is spoken for by orders that
 * have not shipped yet, and counting it would have you pack a box twice.
 */
export async function purchasePlan(
  runs: ReadonlyArray<{ boxProductId: string; quantity: number }>,
): Promise<PurchasePlan> {
  const required = new Map<string, number>();

  for (const run of runs) {
    const components = await prisma.kitComponent.findMany({
      where: { boxProductId: run.boxProductId },
    });
    for (const component of components) {
      const current = required.get(component.inventoryItemId) ?? 0;
      required.set(component.inventoryItemId, current + component.quantity * run.quantity);
    }
  }

  const items = await prisma.inventoryItem.findMany({
    where: { id: { in: [...required.keys()] } },
    include: { batches: true },
  });

  const lines: PurchaseLine[] = [];
  let moqOverspend = 0;

  for (const item of items) {
    const need = required.get(item.id) ?? 0;
    const available = item.batches.reduce(
      (total, batch) => total + batch.quantityOnHand - batch.quantityReserved,
      0,
    );
    const shortfall = Math.max(need - available, 0);
    if (shortfall === 0) continue;

    // Round up to a whole multiple of the supplier's minimum.
    const moq = Math.max(item.moq, 1);
    const orderQuantity = Math.ceil(shortfall / moq) * moq;
    moqOverspend += (orderQuantity - shortfall) * item.costCents;

    lines.push({
      sku: item.sku,
      name: item.name,
      supplierName: item.supplierName,
      supplierSku: item.supplierSku,
      required: need,
      available,
      shortfall,
      orderQuantity,
      unitCost: money(item.costCents),
      lineCost: money(item.costCents * orderQuantity),
      leadTimeDays: item.leadTimeDays,
    });
  }

  lines.sort((a, b) => b.lineCost.cents - a.lineCost.cents);

  return {
    lines,
    total: money(lines.reduce((sum, line) => sum + line.lineCost.cents, 0)),
    leadTimeDays: lines.reduce((slowest, line) => Math.max(slowest, line.leadTimeDays), 0),
    moqOverspendCents: moqOverspend,
  };
}
