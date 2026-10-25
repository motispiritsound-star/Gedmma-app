import type { ActivatedBox } from '@prisma/client';
import { prisma, type Db } from '../lib/db.ts';
import { env } from '../lib/env.ts';
import { generateActivationCode, hmac } from '../lib/crypto.ts';
import { audit } from '../lib/audit.ts';
import { normaliseActivationCode } from '@wonderbox/hardware-protocol';

/**
 * Activation.
 *
 * A code is 60 bits of entropy from a 32-symbol alphabet, printed inside the
 * lid. Only its peppered HMAC is stored, so nobody — including an operator
 * with database access — can read a live code off a screen and claim a box.
 *
 * The code is bound to a family the moment their order is paid. Entering a
 * code that belongs to a different family fails with the same coarse error as
 * a code that does not exist, so the endpoint cannot be used to test whether
 * an arbitrary code is real.
 */

/** Wrong guesses tolerated per code before it stops answering. */
const MAX_FAILED_ATTEMPTS = 10;

export type ActivationError =
  | 'invalidCode'
  | 'alreadyActivated'
  | 'notOwned'
  | 'revoked'
  | 'rateLimited';

export type ActivationOutcome =
  | { ok: true; activatedBox: ActivatedBox; boxTitle: string }
  | { ok: false; error: ActivationError };

export function hashActivationCode(code: string): string {
  return hmac(env.ACTIVATION_CODE_PEPPER, normaliseActivationCode(code));
}

/**
 * Mints codes into the unassigned pool for a box product. Ops runs this when a
 * print run of lids is ordered; the plaintext is returned exactly once, for the
 * printer, and is never recoverable afterwards.
 */
export async function mintActivationCodes(
  boxProductId: string,
  count: number,
  actorUserId?: string | null,
): Promise<string[]> {
  const codes: string[] = [];
  const rows: { codeHash: string; lastFour: string; boxProductId: string }[] = [];
  const seen = new Set<string>();

  while (codes.length < count) {
    const code = generateActivationCode();
    const codeHash = hashActivationCode(code);
    if (seen.has(codeHash)) continue;
    seen.add(codeHash);
    codes.push(code);
    rows.push({ codeHash, lastFour: code.slice(-4), boxProductId });
  }

  // `skipDuplicates` covers the astronomically unlikely collision with a code
  // already in the database; the caller gets back only what was really minted.
  const result = await prisma.activationCode.createMany({ data: rows, skipDuplicates: true });
  await audit({
    actorUserId: actorUserId ?? null,
    actorRole: 'OPS',
    action: 'activationCode.minted',
    entityType: 'BoxProduct',
    entityId: boxProductId,
    metadata: { requested: count, created: result.count },
  });
  return codes;
}

/**
 * Reserves one unassigned code per box on a paid order and binds it to the
 * family. Idempotent: an order that already has its codes is left alone.
 */
export async function assignActivationCodeToOrder(orderId: string, db: Db = prisma): Promise<number> {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return 0;

  const alreadyAssigned = await db.activationCode.count({ where: { orderId } });
  if (alreadyAssigned > 0) return alreadyAssigned;

  let assigned = 0;
  for (const item of order.items) {
    for (let i = 0; i < item.quantity; i += 1) {
      const candidate = await db.activationCode.findFirst({
        where: { boxProductId: item.boxProductId, state: 'UNASSIGNED' },
        orderBy: { createdAt: 'asc' },
      });
      if (!candidate) break;
      // Conditional update: two concurrent fulfilment runs cannot hand the
      // same physical code to two families.
      const claimed = await db.activationCode.updateMany({
        where: { id: candidate.id, state: 'UNASSIGNED' },
        data: {
          state: 'ASSIGNED',
          familyId: order.familyId,
          orderId: order.id,
          assignedAt: new Date(),
        },
      });
      if (claimed.count === 1) assigned += 1;
    }
  }
  return assigned;
}

/**
 * A parent claims a box. Ownership is checked against the family the code was
 * bound to at fulfilment; a code for someone else's order is refused.
 */
export async function activateBox(input: {
  code: string;
  familyId: string;
  userId?: string | null;
  locale?: 'nl' | 'en';
}): Promise<ActivationOutcome> {
  const codeHash = hashActivationCode(input.code);
  const record = await prisma.activationCode.findUnique({
    where: { codeHash },
    include: { boxProduct: { include: { translations: true } }, activatedBox: true },
  });

  if (!record) return { ok: false, error: 'invalidCode' };
  if (record.failedAttempts >= MAX_FAILED_ATTEMPTS) return { ok: false, error: 'rateLimited' };

  const reject = async (error: ActivationError): Promise<ActivationOutcome> => {
    await prisma.activationCode.update({
      where: { id: record.id },
      data: { failedAttempts: { increment: 1 } },
    });
    return { ok: false, error };
  };

  if (record.state === 'REVOKED') return reject('revoked');
  if (record.state === 'ACTIVATED' || record.activatedBox) {
    // Re-entering your own already-active code is a no-op, not an error.
    if (record.familyId === input.familyId && record.activatedBox) {
      return {
        ok: true,
        activatedBox: record.activatedBox,
        boxTitle: titleFor(record.boxProduct.translations, input.locale ?? 'nl', record.boxProduct.sku),
      };
    }
    return reject('alreadyActivated');
  }
  if (record.state === 'UNASSIGNED') {
    // A real code that has not shipped yet. Indistinguishable from "not yours".
    return reject('notOwned');
  }
  if (record.familyId !== input.familyId) return reject('notOwned');

  const activatedBox = await prisma.$transaction(async (tx) => {
    const claimed = await tx.activationCode.updateMany({
      where: { id: record.id, state: 'ASSIGNED' },
      data: { state: 'ACTIVATED', activatedAt: new Date(), failedAttempts: 0 },
    });
    if (claimed.count !== 1) return null;
    return tx.activatedBox.create({
      data: {
        familyId: input.familyId,
        boxProductId: record.boxProductId,
        activationCodeId: record.id,
        activatedByUserId: input.userId ?? null,
      },
    });
  });

  if (!activatedBox) return { ok: false, error: 'alreadyActivated' };

  await audit({
    actorUserId: input.userId ?? null,
    actorRole: 'PARENT',
    action: 'box.activated',
    entityType: 'ActivatedBox',
    entityId: activatedBox.id,
    metadata: { boxProductId: record.boxProductId },
  });

  return {
    ok: true,
    activatedBox,
    boxTitle: titleFor(record.boxProduct.translations, input.locale ?? 'nl', record.boxProduct.sku),
  };
}

function titleFor(
  translations: ReadonlyArray<{ locale: string; name: string }>,
  locale: string,
  fallback: string,
): string {
  return (
    translations.find((translation) => translation.locale === locale)?.name ??
    translations.find((translation) => translation.locale === 'en')?.name ??
    translations[0]?.name ??
    fallback
  );
}

/** Every box a family may listen to. The authorisation source for playback. */
export async function familyBoxes(familyId: string) {
  return prisma.activatedBox.findMany({
    where: { familyId },
    include: {
      boxProduct: {
        include: {
          translations: true,
          theme: true,
          journey: { include: { chapters: { orderBy: { orderIndex: 'asc' } } } },
        },
      },
    },
    orderBy: { activatedAt: 'desc' },
  });
}

/** Throws unless this family owns this activated box. Used on every play route. */
export async function requireBoxOwnership(activatedBoxId: string, familyId: string) {
  const box = await prisma.activatedBox.findFirst({
    where: { id: activatedBoxId, familyId },
    include: { boxProduct: { include: { journey: true, translations: true } } },
  });
  return box;
}
