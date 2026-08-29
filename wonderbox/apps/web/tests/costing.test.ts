import { beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/db.ts';
import { PICK_PACK_COST_CENTS, boxEconomics, marginReport, purchasePlan } from '../src/server/costing.ts';
import { VAT_RATE_PERCENT } from '../src/server/pricing.ts';
import { makeBox, resetDatabase } from './helpers/fixtures.ts';

/**
 * Unit economics.
 *
 * The arithmetic here decides whether a box gets manufactured, so the tests
 * are written against the two mistakes that would flatter it: comparing a
 * gross price to a net cost, and forgetting the one-off costs that are spent
 * before the first box ships.
 */
describe('cost and margin', () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  async function pricedBox(options: {
    retailCents: number;
    unitCostCents: number;
    quantity?: number;
    certificationCents?: number;
    artworkCents?: number;
    amortiseOver?: number;
    stock?: number;
    moq?: number;
    leadTimeDays?: number;
  }) {
    const box = await makeBox({ stock: options.stock ?? 100, priceCents: options.retailCents });
    await prisma.inventoryItem.update({
      where: { id: box.inventoryItem.id },
      data: {
        costCents: options.unitCostCents,
        supplierName: 'Test supplier',
        supplierSku: 'TST-1',
        moq: options.moq ?? 1,
        leadTimeDays: options.leadTimeDays ?? 7,
        weightGrams: 100,
      },
    });
    if (options.quantity && options.quantity !== 1) {
      await prisma.kitComponent.updateMany({
        where: { boxProductId: box.product.id },
        data: { quantity: options.quantity },
      });
    }
    await prisma.boxProduct.update({
      where: { id: box.product.id },
      data: {
        certificationCostCents: options.certificationCents ?? 0,
        artworkCostCents: options.artworkCents ?? 0,
        amortiseOverUnits: options.amortiseOver ?? 1000,
      },
    });
    return box;
  }

  it('takes VAT out of the catalogue price before calling anything revenue', async () => {
    const box = await pricedBox({ retailCents: 3495, unitCostCents: 0 });
    const economics = await boxEconomics(box.product.id);

    // €34.95 gross is €28.88 net at 21% — not €34.95.
    expect(economics.retailGross.cents).toBe(3495);
    expect(economics.retailNet.cents).toBe(Math.round((3495 * 100) / (100 + VAT_RATE_PERCENT)));
    expect(economics.retailNet.cents).toBe(2888);
    expect(economics.vat.cents).toBe(607);
    expect(economics.retailNet.cents + economics.vat.cents).toBe(economics.retailGross.cents);
  });

  it('adds up parts, labour and the amortised one-off costs', async () => {
    const box = await pricedBox({
      retailCents: 3995,
      unitCostCents: 200,
      quantity: 3,
      certificationCents: 620_000,
      artworkCents: 140_000,
      amortiseOver: 1500,
    });
    const economics = await boxEconomics(box.product.id);

    expect(economics.componentCost.cents).toBe(600);
    expect(economics.pickPackCost.cents).toBe(PICK_PACK_COST_CENTS);
    // (620000 + 140000) / 1500 = 506.67 → 507
    expect(economics.amortisedSetupCost.cents).toBe(507);
    expect(economics.totalCost.cents).toBe(600 + PICK_PACK_COST_CENTS + 507);
    expect(economics.grossMargin.cents).toBe(economics.retailNet.cents - economics.totalCost.cents);
  });

  it('shows a box that a parts-only calculation would call profitable', async () => {
    // Cheap electronics, expensive certification: the trap this page exists for.
    const box = await pricedBox({
      retailCents: 1495,
      unitCostCents: 300,
      certificationCents: 600_000,
      artworkCents: 100_000,
      amortiseOver: 500,
    });
    const economics = await boxEconomics(box.product.id);

    // Parts alone leave €9.35 of the €12.36 net — looks like a 76% margin.
    const partsOnly = economics.retailNet.cents - economics.componentCost.cents;
    expect(partsOnly).toBeGreaterThan(0);

    // With certification spread over a 500 run it is €14.00 a box, and the
    // whole thing is under water.
    expect(economics.amortisedSetupCost.cents).toBe(1400);
    expect(economics.grossMargin.cents).toBeLessThan(0);
    expect(economics.marginPercent).toBeLessThan(0);
  });

  it('never divides by a zero production run', async () => {
    const box = await pricedBox({ retailCents: 2995, unitCostCents: 100, certificationCents: 50_000 });
    await prisma.boxProduct.update({
      where: { id: box.product.id },
      data: { amortiseOverUnits: 0 },
    });
    const economics = await boxEconomics(box.product.id);
    expect(Number.isFinite(economics.amortisedSetupCost.cents)).toBe(true);
    // Clamped to a run of one rather than dividing by zero: the whole €500.
    expect(economics.amortisedSetupCost.cents).toBe(50_000);
  });

  it('names the components that have no purchase price yet', async () => {
    const box = await pricedBox({ retailCents: 2995, unitCostCents: 0 });
    const economics = await boxEconomics(box.product.id);
    expect(economics.incompleteComponents).toEqual([box.inventoryItem.sku]);
  });

  it('reports every active box, best margin first', async () => {
    await resetDatabase();
    await pricedBox({ retailCents: 3995, unitCostCents: 100 });
    await pricedBox({ retailCents: 2995, unitCostCents: 900 });

    const report = await marginReport('nl');
    expect(report).toHaveLength(2);
    expect(report[0]!.marginPercent).toBeGreaterThan(report[1]!.marginPercent);
  });
});

describe('purchase planning', () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  it('buys only the shortfall, and nothing when the shelf is full', async () => {
    const box = await makeBox({ stock: 400 });
    await prisma.inventoryItem.update({
      where: { id: box.inventoryItem.id },
      data: { costCents: 100, moq: 1, leadTimeDays: 10 },
    });

    const covered = await purchasePlan([{ boxProductId: box.product.id, quantity: 300 }]);
    expect(covered.lines).toHaveLength(0);

    const short = await purchasePlan([{ boxProductId: box.product.id, quantity: 500 }]);
    expect(short.lines[0]?.required).toBe(500);
    expect(short.lines[0]?.available).toBe(400);
    expect(short.lines[0]?.orderQuantity).toBe(100);
    expect(short.total.cents).toBe(100 * 100);
  });

  it('rounds up to the supplier minimum and reports the overspend', async () => {
    const box = await makeBox({ stock: 0 });
    await prisma.inventoryItem.update({
      where: { id: box.inventoryItem.id },
      data: { costCents: 50, moq: 500, leadTimeDays: 21 },
    });

    const plan = await purchasePlan([{ boxProductId: box.product.id, quantity: 120 }]);
    expect(plan.lines[0]?.shortfall).toBe(120);
    expect(plan.lines[0]?.orderQuantity).toBe(500);
    // 380 units you did not need, at 50 cents each.
    expect(plan.moqOverspendCents).toBe(380 * 50);
  });

  it('does not count stock that is already reserved for someone else', async () => {
    const { makeFamily } = await import('./helpers/fixtures.ts');
    const { placeOrder } = await import('../src/server/orders.ts');
    const box = await makeBox({ stock: 100 });
    await prisma.inventoryItem.update({
      where: { id: box.inventoryItem.id },
      data: { costCents: 100, moq: 1 },
    });
    const { family, address } = await makeFamily();

    await placeOrder({
      familyId: family.id,
      lines: [{ boxProductId: box.product.id, quantity: 40 }],
      shippingAddressId: address.id,
      idempotencyKey: `costing-${family.id}`,
    });

    const plan = await purchasePlan([{ boxProductId: box.product.id, quantity: 100 }]);
    // 100 on the shelf, 40 spoken for: 60 free, so 40 must be bought.
    expect(plan.lines[0]?.available).toBe(60);
    expect(plan.lines[0]?.orderQuantity).toBe(40);
  });

  it('reports the slowest component as the date you can start packing', async () => {
    await resetDatabase();
    const fast = await makeBox({ stock: 0 });
    const slow = await makeBox({ stock: 0 });
    await prisma.inventoryItem.update({
      where: { id: fast.inventoryItem.id },
      data: { costCents: 100, leadTimeDays: 10 },
    });
    await prisma.inventoryItem.update({
      where: { id: slow.inventoryItem.id },
      data: { costCents: 100, leadTimeDays: 42 },
    });

    const plan = await purchasePlan([
      { boxProductId: fast.product.id, quantity: 50 },
      { boxProductId: slow.product.id, quantity: 50 },
    ]);
    expect(plan.leadTimeDays).toBe(42);
  });

  it('combines demand for a component shared between two boxes', async () => {
    await resetDatabase();
    const first = await makeBox({ stock: 0 });
    const second = await makeBox({ stock: 0 });
    // A mailer box used by both products.
    await prisma.kitComponent.create({
      data: {
        boxProductId: second.product.id,
        inventoryItemId: first.inventoryItem.id,
        quantity: 1,
      },
    });
    await prisma.inventoryItem.update({
      where: { id: first.inventoryItem.id },
      data: { costCents: 135, moq: 1 },
    });

    const plan = await purchasePlan([
      { boxProductId: first.product.id, quantity: 200 },
      { boxProductId: second.product.id, quantity: 300 },
    ]);
    const shared = plan.lines.find((line) => line.sku === first.inventoryItem.sku);
    expect(shared?.required).toBe(500);
  });
});
