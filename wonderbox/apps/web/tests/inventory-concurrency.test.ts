import { beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/db.ts';
import { OutOfStockError } from '../src/lib/errors.ts';
import {
  releaseReservations,
  reserveStock,
  commitReservations,
  restockCommitted,
  sellableBoxes,
  stockLevels,
} from '../src/server/inventory.ts';
import { placeOrder } from '../src/server/orders.ts';
import { makeBox, makeFamily, resetDatabase } from './helpers/fixtures.ts';

/**
 * Stock reservation under concurrency.
 *
 * The invariant under test: available stock never goes negative, however many
 * checkouts land at once. These tests hit a real PostgreSQL instance with real
 * concurrent transactions, because the guarantee comes from row locking — a
 * mocked client would prove nothing.
 */
describe('stock reservation', () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  it('reserves against a batch and reduces what is available', async () => {
    const box = await makeBox({ stock: 10 });
    const { family, address } = await makeFamily();

    const placed = await placeOrder({
      familyId: family.id,
      lines: [{ boxProductId: box.product.id, quantity: 3 }],
      shippingAddressId: address.id,
      idempotencyKey: `t-${box.product.id}`,
    });

    const levels = await stockLevels();
    const level = levels.find((entry) => entry.inventoryItemId === box.inventoryItem.id);
    expect(level?.onHand).toBe(10);
    expect(level?.reserved).toBe(3);
    expect(level?.available).toBe(7);
    expect(await sellableBoxes(box.product.id)).toBe(7);
    expect(placed.order.status).toBe('PENDING_PAYMENT');
  });

  it('never oversells when many checkouts race for the last units', async () => {
    const box = await makeBox({ stock: 5 });
    const families = await Promise.all(
      Array.from({ length: 12 }, (_, index) => makeFamily(`Racer ${index}`)),
    );

    // Twelve simultaneous single-box orders against five units of stock.
    const outcomes = await Promise.allSettled(
      families.map((entry, index) =>
        placeOrder({
          familyId: entry.family.id,
          lines: [{ boxProductId: box.product.id, quantity: 1 }],
          shippingAddressId: entry.address.id,
          idempotencyKey: `race-${box.product.id}-${index}`,
        }),
      ),
    );

    const succeeded = outcomes.filter((outcome) => outcome.status === 'fulfilled');
    const failed = outcomes.filter((outcome) => outcome.status === 'rejected');

    expect(succeeded).toHaveLength(5);
    expect(failed).toHaveLength(7);
    for (const outcome of failed) {
      expect((outcome as PromiseRejectedResult).reason).toBeInstanceOf(OutOfStockError);
    }

    const level = (await stockLevels()).find(
      (entry) => entry.inventoryItemId === box.inventoryItem.id,
    );
    expect(level?.reserved).toBe(5);
    expect(level?.available).toBe(0);
    expect(level?.available).toBeGreaterThanOrEqual(0);

    // A rejected order must leave nothing behind.
    const orphanReservations = await prisma.stockReservation.count({
      where: { inventoryItemId: box.inventoryItem.id, state: 'RESERVED' },
    });
    expect(orphanReservations).toBe(5);
  });

  it('reserves all lines or none of them', async () => {
    const box = await makeBox({ stock: 2 });
    const { family, address } = await makeFamily();

    await expect(
      placeOrder({
        familyId: family.id,
        lines: [{ boxProductId: box.product.id, quantity: 5 }],
        shippingAddressId: address.id,
        idempotencyKey: `partial-${box.product.id}`,
      }),
    ).rejects.toBeInstanceOf(OutOfStockError);

    const level = (await stockLevels()).find(
      (entry) => entry.inventoryItemId === box.inventoryItem.id,
    );
    // Nothing was half-reserved on the way to failing.
    expect(level?.reserved).toBe(0);
    expect(await prisma.order.count({ where: { familyId: family.id } })).toBe(0);
  });

  it('spreads a reservation across batches, oldest first', async () => {
    const box = await makeBox({ stock: 4 });
    await prisma.inventoryBatch.create({
      data: {
        inventoryItemId: box.inventoryItem.id,
        batchCode: 'B2',
        quantityOnHand: 6,
        receivedAt: new Date(Date.now() + 60_000),
      },
    });
    const { family, address } = await makeFamily();

    const placed = await placeOrder({
      familyId: family.id,
      lines: [{ boxProductId: box.product.id, quantity: 7 }],
      shippingAddressId: address.id,
      idempotencyKey: `fifo-${box.product.id}`,
    });

    const reservations = await prisma.stockReservation.findMany({
      where: { orderId: placed.order.id },
      include: { batch: true },
    });
    const byBatch = Object.fromEntries(
      reservations.map((reservation) => [reservation.batch?.batchCode, reservation.quantity]),
    );
    expect(byBatch.B1).toBe(4);
    expect(byBatch.B2).toBe(3);
  });

  it('releases a reservation back to the shelf, and commits only on despatch', async () => {
    const box = await makeBox({ stock: 8 });
    const { family, address } = await makeFamily();

    const keep = await placeOrder({
      familyId: family.id,
      lines: [{ boxProductId: box.product.id, quantity: 2 }],
      shippingAddressId: address.id,
      idempotencyKey: `keep-${box.product.id}`,
    });
    const drop = await placeOrder({
      familyId: family.id,
      lines: [{ boxProductId: box.product.id, quantity: 3 }],
      shippingAddressId: address.id,
      idempotencyKey: `drop-${box.product.id}`,
    });

    await prisma.$transaction((tx) => releaseReservations(tx, drop.order.id));
    let level = (await stockLevels()).find(
      (entry) => entry.inventoryItemId === box.inventoryItem.id,
    );
    expect(level?.onHand).toBe(8);
    expect(level?.reserved).toBe(2);

    await prisma.$transaction((tx) => commitReservations(tx, keep.order.id));
    level = (await stockLevels()).find((entry) => entry.inventoryItemId === box.inventoryItem.id);
    // Committing is when goods actually leave: on hand drops, reserved clears.
    expect(level?.onHand).toBe(6);
    expect(level?.reserved).toBe(0);

    await prisma.$transaction((tx) => restockCommitted(tx, keep.order.id));
    level = (await stockLevels()).find((entry) => entry.inventoryItemId === box.inventoryItem.id);
    expect(level?.onHand).toBe(8);
  });

  it('rolls the whole transaction back when a later line is short', async () => {
    const plenty = await makeBox({ stock: 10 });
    const scarce = await makeBox({ stock: 1 });
    const { family } = await makeFamily();

    await expect(
      prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            number: 'ROLLBACK-1',
            familyId: family.id,
            subtotalCents: 0,
            totalCents: 0,
            shippingAddressId: (await prisma.address.findFirstOrThrow({
              where: { familyId: family.id },
            })).id,
          },
        });
        await reserveStock(tx, order.id, [
          { inventoryItemId: plenty.inventoryItem.id, quantity: 4 },
          { inventoryItemId: scarce.inventoryItem.id, quantity: 4 },
        ]);
      }),
    ).rejects.toBeInstanceOf(OutOfStockError);

    const level = (await stockLevels()).find(
      (entry) => entry.inventoryItemId === plenty.inventoryItem.id,
    );
    expect(level?.reserved).toBe(0);
  });
});
