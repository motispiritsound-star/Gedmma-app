import { Prisma } from '@prisma/client';
import { prisma, type Db } from '../lib/db.ts';
import { OutOfStockError } from '../lib/errors.ts';

/**
 * Stock reservation.
 *
 * The invariant: `quantityOnHand - quantityReserved` never goes negative, no
 * matter how many checkouts land at the same millisecond.
 *
 * It is held by a conditional UPDATE rather than by read-then-write. Postgres
 * re-evaluates the WHERE clause after taking the row lock, so two concurrent
 * transactions racing for the last kit serialise on the batch row and exactly
 * one of them wins. No optimistic-retry loop, no SERIALIZABLE, no advisory
 * locks — see COMMERCE_AND_FULFILMENT.md for why this was chosen.
 */

/**
 * How many times a single batch is re-read when another transaction keeps
 * winning the race. Eight is far more than a real contention pattern needs;
 * exhausting it simply moves on to the next batch.
 */
const MAX_ALLOCATION_ATTEMPTS = 8;

export interface Requirement {
  readonly inventoryItemId: string;
  readonly quantity: number;
}

export interface Allocation {
  readonly inventoryItemId: string;
  readonly batchId: string;
  readonly quantity: number;
}

/** What ops sees: on hand, spoken for, and actually sellable. */
export interface StockLevel {
  readonly inventoryItemId: string;
  readonly sku: string;
  readonly name: string;
  readonly onHand: number;
  readonly reserved: number;
  readonly available: number;
  readonly reorderLevel: number;
  readonly belowReorderLevel: boolean;
}

export async function stockLevels(db: Db = prisma): Promise<StockLevel[]> {
  const items = await db.inventoryItem.findMany({
    include: { batches: true },
    orderBy: { sku: 'asc' },
  });
  return items.map((item) => {
    const onHand = item.batches.reduce((total, batch) => total + batch.quantityOnHand, 0);
    const reserved = item.batches.reduce((total, batch) => total + batch.quantityReserved, 0);
    return {
      inventoryItemId: item.id,
      sku: item.sku,
      name: item.name,
      onHand,
      reserved,
      available: onHand - reserved,
      reorderLevel: item.reorderLevel,
      belowReorderLevel: onHand - reserved <= item.reorderLevel,
    };
  });
}

/** How many complete boxes of a product can still be sold. */
export async function sellableBoxes(boxProductId: string, db: Db = prisma): Promise<number> {
  const components = await db.kitComponent.findMany({
    where: { boxProductId },
    include: { inventoryItem: { include: { batches: true } } },
  });
  if (components.length === 0) return 0;
  return components.reduce((limit, component) => {
    const available = component.inventoryItem.batches.reduce(
      (total, batch) => total + batch.quantityOnHand - batch.quantityReserved,
      0,
    );
    return Math.min(limit, Math.floor(available / component.quantity));
  }, Number.POSITIVE_INFINITY);
}

/** Expands "one Junior Space Explorer" into its component requirements. */
export async function requirementsForBox(
  boxProductId: string,
  quantity: number,
  db: Db = prisma,
): Promise<Requirement[]> {
  const components = await db.kitComponent.findMany({ where: { boxProductId } });
  return components.map((component) => ({
    inventoryItemId: component.inventoryItemId,
    quantity: component.quantity * quantity,
  }));
}

/**
 * Reserves every requirement or nothing at all. Must be called inside a
 * transaction; the caller's transaction boundary is what makes it atomic
 * across several items.
 */
export async function reserveStock(
  tx: Db,
  orderId: string,
  requirements: readonly Requirement[],
): Promise<Allocation[]> {
  const allocations: Allocation[] = [];

  for (const requirement of requirements) {
    if (requirement.quantity <= 0) continue;
    let outstanding = requirement.quantity;

    // FIFO across batches so the oldest stock leaves the warehouse first.
    const batches = await tx.inventoryBatch.findMany({
      where: { inventoryItemId: requirement.inventoryItemId },
      orderBy: [{ receivedAt: 'asc' }, { id: 'asc' }],
      select: { id: true },
    });

    for (const batch of batches) {
      if (outstanding === 0) break;

      // Read what the batch has free, then ask for exactly that much (or as
      // much as is still outstanding). The UPDATE re-checks the condition
      // under the row lock, so a racing transaction makes it match zero rows
      // rather than overselling — and then we simply read again.
      for (let attempt = 0; attempt < MAX_ALLOCATION_ATTEMPTS && outstanding > 0; attempt += 1) {
        const current = await tx.inventoryBatch.findUnique({
          where: { id: batch.id },
          select: { quantityOnHand: true, quantityReserved: true },
        });
        if (!current) break;

        const free = current.quantityOnHand - current.quantityReserved;
        if (free <= 0) break;
        const want = Math.min(outstanding, free);

        const affected = await tx.$executeRaw(
          Prisma.sql`
            UPDATE "InventoryBatch"
               SET "quantityReserved" = "quantityReserved" + ${want}
             WHERE "id" = ${batch.id}
               AND "quantityOnHand" - "quantityReserved" >= ${want}
          `,
        );

        if (affected === 1) {
          allocations.push({
            inventoryItemId: requirement.inventoryItemId,
            batchId: batch.id,
            quantity: want,
          });
          outstanding -= want;
          // We took everything this batch had, or everything we needed.
          // Either way there is nothing more to get here.
          break;
        }
        // Someone else moved the row between the read and the write. Loop.
      }
    }

    if (outstanding > 0) {
      const item = await tx.inventoryItem.findUnique({
        where: { id: requirement.inventoryItemId },
        select: { sku: true },
      });
      // Throwing rolls the caller's transaction back, releasing everything
      // reserved so far in this call.
      throw new OutOfStockError(item?.sku ?? requirement.inventoryItemId);
    }
  }

  if (allocations.length > 0) {
    await tx.stockReservation.createMany({
      data: allocations.map((allocation) => ({
        orderId,
        inventoryItemId: allocation.inventoryItemId,
        batchId: allocation.batchId,
        quantity: allocation.quantity,
        state: 'RESERVED' as const,
      })),
    });
  }

  return allocations;
}

/**
 * Stock physically leaves: the reservation becomes a decrement. Called when a
 * shipping label is created, not when the order is paid.
 */
export async function commitReservations(tx: Db, orderId: string): Promise<number> {
  const reservations = await tx.stockReservation.findMany({
    where: { orderId, state: 'RESERVED' },
  });
  for (const reservation of reservations) {
    if (!reservation.batchId) continue;
    await tx.$executeRaw(
      Prisma.sql`
        UPDATE "InventoryBatch"
           SET "quantityOnHand" = "quantityOnHand" - ${reservation.quantity},
               "quantityReserved" = "quantityReserved" - ${reservation.quantity}
         WHERE "id" = ${reservation.batchId}
      `,
    );
  }
  await tx.stockReservation.updateMany({
    where: { orderId, state: 'RESERVED' },
    data: { state: 'COMMITTED', settledAt: new Date() },
  });
  return reservations.length;
}

/** Cancellation and refund both land here: the goods go back on the shelf. */
export async function releaseReservations(tx: Db, orderId: string): Promise<number> {
  const reservations = await tx.stockReservation.findMany({
    where: { orderId, state: 'RESERVED' },
  });
  for (const reservation of reservations) {
    if (!reservation.batchId) continue;
    await tx.$executeRaw(
      Prisma.sql`
        UPDATE "InventoryBatch"
           SET "quantityReserved" = GREATEST("quantityReserved" - ${reservation.quantity}, 0)
         WHERE "id" = ${reservation.batchId}
      `,
    );
  }
  await tx.stockReservation.updateMany({
    where: { orderId, state: 'RESERVED' },
    data: { state: 'RELEASED', settledAt: new Date() },
  });
  return reservations.length;
}

/**
 * Returning goods after they shipped: put the quantity back on hand. Used by
 * the refund path when a parcel comes back.
 */
export async function restockCommitted(tx: Db, orderId: string): Promise<number> {
  const reservations = await tx.stockReservation.findMany({
    where: { orderId, state: 'COMMITTED' },
  });
  for (const reservation of reservations) {
    if (!reservation.batchId) continue;
    await tx.$executeRaw(
      Prisma.sql`
        UPDATE "InventoryBatch"
           SET "quantityOnHand" = "quantityOnHand" + ${reservation.quantity}
         WHERE "id" = ${reservation.batchId}
      `,
    );
  }
  await tx.stockReservation.updateMany({
    where: { orderId, state: 'COMMITTED' },
    data: { state: 'RELEASED', settledAt: new Date() },
  });
  return reservations.length;
}

/** Receiving goods. Ops-only; audited by the caller. */
export async function receiveBatch(
  input: {
    inventoryItemId: string;
    batchCode: string;
    quantity: number;
    supplier?: string;
    expiresAt?: Date | null;
  },
  db: Db = prisma,
): Promise<void> {
  await db.inventoryBatch.upsert({
    where: {
      inventoryItemId_batchCode: {
        inventoryItemId: input.inventoryItemId,
        batchCode: input.batchCode,
      },
    },
    create: {
      inventoryItemId: input.inventoryItemId,
      batchCode: input.batchCode,
      quantityOnHand: input.quantity,
      supplier: input.supplier ?? null,
      expiresAt: input.expiresAt ?? null,
    },
    update: { quantityOnHand: { increment: input.quantity } },
  });
}
