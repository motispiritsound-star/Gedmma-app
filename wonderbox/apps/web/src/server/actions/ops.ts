'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requirePermission } from '../../lib/auth/session.ts';
import { money } from '../../lib/money.ts';
import { DomainError } from '../../lib/errors.ts';
import { receiveBatch } from '../inventory.ts';
import { cancelOrder, createShipmentForOrder, refundOrder, applyShipmentStatus } from '../orders.ts';
import { mintActivationCodes } from '../activation.ts';
import { resolveCase } from '../support.ts';
import { runRenewal } from '../subscriptions.ts';

/** Fulfilment and support mutations. None of these can edit content. */

export async function receiveStockAction(formData: FormData): Promise<void> {
  await requirePermission('inventory.write');
  const parsed = z
    .object({
      inventoryItemId: z.string().min(1),
      batchCode: z.string().trim().min(1).max(40),
      quantity: z.coerce.number().int().min(1).max(100000),
      supplier: z.string().trim().max(80).optional(),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect('/ops/inventory?error=invalid');

  await receiveBatch({
    inventoryItemId: parsed.data.inventoryItemId,
    batchCode: parsed.data.batchCode,
    quantity: parsed.data.quantity,
    supplier: parsed.data.supplier,
  });
  revalidatePath('/ops/inventory');
}

export async function createLabelAction(formData: FormData): Promise<void> {
  const actor = await requirePermission('shipment.write');
  const orderId = String(formData.get('orderId') ?? '');
  try {
    await createShipmentForOrder(orderId, actor.id);
  } catch (error) {
    if (error instanceof DomainError) redirect(`/ops/orders?error=${error.code}`);
    throw error;
  }
  revalidatePath('/ops/orders');
}

export async function advanceShipmentAction(formData: FormData): Promise<void> {
  await requirePermission('shipment.write');
  const providerRef = String(formData.get('providerRef') ?? '');
  const status = String(formData.get('status') ?? '');
  const allowed = ['in_transit', 'delivered', 'failed', 'returned'] as const;
  if (!(allowed as readonly string[]).includes(status)) return;
  await applyShipmentStatus(providerRef, status as (typeof allowed)[number], new Date());
  revalidatePath('/ops/shipments');
}

export async function cancelOrderAction(formData: FormData): Promise<void> {
  const actor = await requirePermission('order.read.all');
  const orderId = String(formData.get('orderId') ?? '');
  const reason = String(formData.get('reason') ?? 'Cancelled by operations');
  try {
    await cancelOrder(orderId, reason, actor.id);
  } catch (error) {
    if (error instanceof DomainError) redirect(`/ops/orders?error=${error.code}`);
    throw error;
  }
  revalidatePath('/ops/orders');
}

export async function refundOrderAction(formData: FormData): Promise<void> {
  const actor = await requirePermission('order.read.all');
  const orderId = String(formData.get('orderId') ?? '');
  const cents = Number(formData.get('cents') ?? 0);
  const reason = String(formData.get('reason') ?? 'Refunded by operations');
  if (!Number.isInteger(cents) || cents <= 0) redirect('/ops/orders?error=refundTooLarge');
  try {
    await refundOrder(orderId, money(cents), reason, actor.id);
  } catch (error) {
    if (error instanceof DomainError) redirect(`/ops/orders?error=${error.code}`);
    throw error;
  }
  revalidatePath('/ops/orders');
}

export async function mintCodesAction(formData: FormData): Promise<void> {
  const actor = await requirePermission('activation.mint');
  const boxProductId = String(formData.get('boxProductId') ?? '');
  const count = Math.min(Math.max(Number(formData.get('count') ?? 10), 1), 500);
  await mintActivationCodes(boxProductId, count, actor.id);
  // The plaintext codes go to the print run, not to a screen: only the count
  // is reported back here.
  redirect(`/ops/codes?minted=${count}`);
}

export async function resolveCaseAction(formData: FormData): Promise<void> {
  const actor = await requirePermission('support.write');
  const caseId = String(formData.get('caseId') ?? '');
  const note = String(formData.get('note') ?? '').slice(0, 2000);
  await resolveCase(caseId, actor.id, note);
  revalidatePath('/ops/support');
}

export async function runRenewalAction(formData: FormData): Promise<void> {
  await requirePermission('order.read.all');
  const subscriptionId = String(formData.get('subscriptionId') ?? '');
  await runRenewal(subscriptionId);
  revalidatePath('/ops/renewals');
}
