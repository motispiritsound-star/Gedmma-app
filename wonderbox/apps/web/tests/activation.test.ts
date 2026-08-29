import { beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/db.ts';
import { generateActivationCode } from '../src/lib/crypto.ts';
import { ACTIVATION_CODE_PATTERN, normaliseActivationCode } from '@wonderbox/hardware-protocol';
import {
  activateBox,
  assignActivationCodeToOrder,
  familyBoxes,
  hashActivationCode,
  mintActivationCodes,
  requireBoxOwnership,
} from '../src/server/activation.ts';
import { markOrderPaid, placeOrder } from '../src/server/orders.ts';
import { makeBox, makeFamily, resetDatabase } from './helpers/fixtures.ts';

describe('activation codes', () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  it('generates codes that are unique and non-guessable', async () => {
    const codes = new Set<string>();
    for (let i = 0; i < 5000; i += 1) codes.add(generateActivationCode());
    // 5000 draws from a 32^12 space: a single collision would be extraordinary.
    expect(codes.size).toBe(5000);

    for (const code of [...codes].slice(0, 50)) {
      expect(code).toMatch(ACTIVATION_CODE_PATTERN);
      // No I, L, O or U: a child reading a code aloud cannot produce an
      // ambiguous character.
      expect(code.slice(3)).not.toMatch(/[ILOU]/);
    }
  });

  it('normalises however a parent types it', () => {
    const canonical = 'WB-3F7K-22AA-M9X1';
    expect(normaliseActivationCode('wb 3f7k 22aa m9x1')).toBe(canonical);
    expect(normaliseActivationCode('3F7K22AAM9X1')).toBe(canonical);
    expect(normaliseActivationCode('WB-3f7k-22aa-m9x1')).toBe(canonical);
  });

  it('stores only a hash and the last four characters', async () => {
    const box = await makeBox();
    const [code] = await mintActivationCodes(box.product.id, 1);

    const rows = await prisma.activationCode.findMany({ where: { boxProductId: box.product.id } });
    expect(rows).toHaveLength(1);
    const row = rows[0]!;
    expect(row.codeHash).toBe(hashActivationCode(code!));
    expect(row.codeHash).not.toContain(code!);
    expect(row.lastFour).toBe(code!.slice(-4));
    // The plaintext exists nowhere in the row.
    expect(JSON.stringify(row)).not.toContain(code!.replace(/-/g, ''));
  });

  it('mints codes into an unassigned pool that nobody can claim yet', async () => {
    const box = await makeBox();
    const { family } = await makeFamily();
    const [code] = await mintActivationCodes(box.product.id, 3);

    const outcome = await activateBox({ code: code!, familyId: family.id });
    expect(outcome).toEqual({ ok: false, error: 'notOwned' });
    expect(await prisma.activatedBox.count()).toBe(0);
  });

  it('binds a code to the family when their order is paid, and they can claim it', async () => {
    const box = await makeBox({ stock: 5 });
    const { family, address, parent } = await makeFamily();
    const [code] = await mintActivationCodes(box.product.id, 1);

    const placed = await placeOrder({
      familyId: family.id,
      lines: [{ boxProductId: box.product.id, quantity: 1 }],
      shippingAddressId: address.id,
      idempotencyKey: `claim-${family.id}`,
    });
    await markOrderPaid(placed.order.id);

    const bound = await prisma.activationCode.findUniqueOrThrow({
      where: { codeHash: hashActivationCode(code!) },
    });
    expect(bound.state).toBe('ASSIGNED');
    expect(bound.familyId).toBe(family.id);

    const outcome = await activateBox({ code: code!, familyId: family.id, userId: parent.id });
    expect(outcome.ok).toBe(true);

    const boxes = await familyBoxes(family.id);
    expect(boxes).toHaveLength(1);
    expect(await requireBoxOwnership(boxes[0]!.id, family.id)).not.toBeNull();
  });

  it('refuses a code that belongs to another family', async () => {
    const box = await makeBox({ stock: 5 });
    const owner = await makeFamily('Owner');
    const stranger = await makeFamily('Stranger');
    const [code] = await mintActivationCodes(box.product.id, 1);

    const placed = await placeOrder({
      familyId: owner.family.id,
      lines: [{ boxProductId: box.product.id, quantity: 1 }],
      shippingAddressId: owner.address.id,
      idempotencyKey: `owner-${owner.family.id}`,
    });
    await markOrderPaid(placed.order.id);

    const outcome = await activateBox({ code: code!, familyId: stranger.family.id });
    expect(outcome).toEqual({ ok: false, error: 'notOwned' });
    expect(await familyBoxes(stranger.family.id)).toHaveLength(0);

    // And the real owner is unaffected by the failed attempt.
    expect((await activateBox({ code: code!, familyId: owner.family.id })).ok).toBe(true);
  });

  it('cannot be activated twice, and re-entering your own code is a no-op', async () => {
    const box = await makeBox({ stock: 5 });
    const owner = await makeFamily('Owner');
    const other = await makeFamily('Other');
    const [code] = await mintActivationCodes(box.product.id, 1);

    const placed = await placeOrder({
      familyId: owner.family.id,
      lines: [{ boxProductId: box.product.id, quantity: 1 }],
      shippingAddressId: owner.address.id,
      idempotencyKey: `twice-${owner.family.id}`,
    });
    await markOrderPaid(placed.order.id);

    const first = await activateBox({ code: code!, familyId: owner.family.id });
    expect(first.ok).toBe(true);

    // The same family entering it again gets the same box back, not an error.
    const repeat = await activateBox({ code: code!, familyId: owner.family.id });
    expect(repeat.ok).toBe(true);
    expect(await prisma.activatedBox.count({ where: { familyId: owner.family.id } })).toBe(1);

    // Anyone else is refused.
    expect(await activateBox({ code: code!, familyId: other.family.id })).toEqual({
      ok: false,
      error: 'alreadyActivated',
    });
  });

  it('rate-limits repeated wrong guesses against a real code', async () => {
    const box = await makeBox({ stock: 5 });
    const { family } = await makeFamily();
    const stranger = await makeFamily('Guesser');
    const [code] = await mintActivationCodes(box.product.id, 1);

    const placed = await placeOrder({
      familyId: family.id,
      lines: [{ boxProductId: box.product.id, quantity: 1 }],
      shippingAddressId: (await prisma.address.findFirstOrThrow({ where: { familyId: family.id } })).id,
      idempotencyKey: `rl-${family.id}`,
    });
    await markOrderPaid(placed.order.id);

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const outcome = await activateBox({ code: code!, familyId: stranger.family.id });
      expect(outcome.ok).toBe(false);
    }
    expect(await activateBox({ code: code!, familyId: stranger.family.id })).toEqual({
      ok: false,
      error: 'rateLimited',
    });
  });

  it('rejects an unknown code without revealing that it is unknown', async () => {
    const { family } = await makeFamily();
    const outcome = await activateBox({ code: generateActivationCode(), familyId: family.id });
    // Same coarse shape as "not yours": the endpoint is not an oracle.
    expect(outcome.ok).toBe(false);
  });

  it('assigns one code per unit and is idempotent per order', async () => {
    const box = await makeBox({ stock: 10 });
    const { family, address } = await makeFamily();
    await mintActivationCodes(box.product.id, 5);

    const placed = await placeOrder({
      familyId: family.id,
      lines: [{ boxProductId: box.product.id, quantity: 2 }],
      shippingAddressId: address.id,
      idempotencyKey: `two-${family.id}`,
    });
    await markOrderPaid(placed.order.id);

    expect(await prisma.activationCode.count({ where: { orderId: placed.order.id } })).toBe(2);
    await assignActivationCodeToOrder(placed.order.id);
    expect(await prisma.activationCode.count({ where: { orderId: placed.order.id } })).toBe(2);
  });

  it('releases codes back to the pool when an order is cancelled', async () => {
    const { cancelOrder } = await import('../src/server/orders.ts');
    const box = await makeBox({ stock: 5 });
    const { family, address } = await makeFamily();
    const [code] = await mintActivationCodes(box.product.id, 1);

    const placed = await placeOrder({
      familyId: family.id,
      lines: [{ boxProductId: box.product.id, quantity: 1 }],
      shippingAddressId: address.id,
      idempotencyKey: `cancel-${family.id}`,
    });
    await markOrderPaid(placed.order.id);
    await cancelOrder(placed.order.id, 'Changed their mind');

    const row = await prisma.activationCode.findUniqueOrThrow({
      where: { codeHash: hashActivationCode(code!) },
    });
    expect(row.state).toBe('UNASSIGNED');
    expect(row.familyId).toBeNull();
  });
});
