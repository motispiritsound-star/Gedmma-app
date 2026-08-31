import { beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/db.ts';
import {
  consentState,
  deleteFamilyData,
  exportFamilyData,
  recordConsent,
  runRetentionSweep,
  speechToTextAllowed,
} from '../src/server/privacy.ts';
import { pruneExpiredSessions } from '../src/lib/auth/session.ts';
import { activateBox, mintActivationCodes } from '../src/server/activation.ts';
import { markOrderPaid, placeOrder } from '../src/server/orders.ts';
import { syncProgress } from '../src/server/progress.ts';
import { sha256 } from '../src/lib/crypto.ts';
import { makeBox, makeFamily, resetDatabase } from './helpers/fixtures.ts';

/**
 * Data deletion and retention.
 *
 * The promise made to parents is specific: profiles and listening history go,
 * invoices stay because tax law requires them, and the account is anonymised
 * rather than dropped so those invoices still point somewhere. Each half of
 * that promise is tested.
 */
describe('privacy, deletion and retention', () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  async function familyWithHistory(name: string) {
    const box = await makeBox({ stock: 5 });
    const { family, address, parent } = await makeFamily(name);
    const child = await prisma.childProfile.create({
      data: { familyId: family.id, displayName: 'Kid', birthYear: 2017, ageBand: 'AGE_7_8' },
    });
    const [code] = await mintActivationCodes(box.product.id, 1);
    const placed = await placeOrder({
      familyId: family.id,
      lines: [{ boxProductId: box.product.id, quantity: 1 }],
      shippingAddressId: address.id,
      idempotencyKey: `privacy-${family.id}`,
    });
    await markOrderPaid(placed.order.id);
    const activated = await activateBox({ code: code!, familyId: family.id, userId: parent.id });
    if (!activated.ok) throw new Error('fixture activation failed');
    await syncProgress({
      activatedBoxId: activated.activatedBox.id,
      familyId: family.id,
      childProfileId: child.id,
      events: [
        {
          clientEventId: `pv-${family.id}-1`,
          type: 'nodePlayed',
          chapterId: box.chapterId!,
          occurredAt: new Date().toISOString(),
          listenedMs: 60_000,
        },
      ],
    });
    return { box, family, parent, child, order: placed.order };
  }

  it('keeps speech to text off until a parent explicitly turns it on', async () => {
    const { family, parent } = await makeFamily('Consent A');
    expect(await speechToTextAllowed(family.id)).toBe(false);

    await recordConsent({
      familyId: family.id,
      type: 'SPEECH_TO_TEXT',
      granted: true,
      grantedByUserId: parent.id,
    });
    // Still false: this deployment has the feature disabled entirely, and a
    // family consent cannot override an operator's kill switch.
    expect(await speechToTextAllowed(family.id)).toBe(false);

    const consents = await consentState(family.id);
    expect(consents.find((entry) => entry.type === 'SPEECH_TO_TEXT')?.granted).toBe(true);
  });

  it('supersedes rather than overwrites a consent, keeping the history', async () => {
    const { family, parent } = await makeFamily('Consent B');
    await recordConsent({
      familyId: family.id,
      type: 'MARKETING_EMAIL',
      granted: true,
      grantedByUserId: parent.id,
    });
    await recordConsent({
      familyId: family.id,
      type: 'MARKETING_EMAIL',
      granted: false,
      grantedByUserId: parent.id,
    });

    const all = await prisma.consentRecord.findMany({
      where: { familyId: family.id, type: 'MARKETING_EMAIL' },
    });
    expect(all).toHaveLength(2);
    expect(all.filter((entry) => entry.revokedAt === null)).toHaveLength(1);

    const active = await consentState(family.id);
    expect(active.find((entry) => entry.type === 'MARKETING_EMAIL')?.granted).toBe(false);
  });

  it('exports everything held about a family, and mentions the absence of recordings', async () => {
    const ctx = await familyWithHistory('Export A');
    const exported = (await exportFamilyData(ctx.family.id, ctx.parent.id)) as {
      note: string;
      family: Record<string, unknown[]>;
    };

    expect(exported.note).toMatch(/Voice recordings are not listed/);
    expect(exported.family.children).toHaveLength(1);
    expect(exported.family.orders).toHaveLength(1);
    expect(exported.family.progressEvents).toHaveLength(1);
    expect(exported.family.invoices).toHaveLength(1);

    const audit = await prisma.auditLog.findFirst({
      where: { entityId: ctx.family.id, action: 'privacy.exported' },
    });
    expect(audit).not.toBeNull();
  });

  it('deletes profiles and listening history, keeps invoices, anonymises the account', async () => {
    const ctx = await familyWithHistory('Delete A');
    const bystander = await familyWithHistory('Bystander');

    const report = await deleteFamilyData(ctx.family.id, ctx.parent.id);

    expect(report.children).toBe(1);
    expect(report.progressEvents).toBe(1);
    expect(report.invoicesRetained).toBe(1);

    expect(await prisma.childProfile.count({ where: { familyId: ctx.family.id } })).toBe(0);
    expect(await prisma.progressEvent.count({ where: { familyId: ctx.family.id } })).toBe(0);
    expect(await prisma.activatedBox.count({ where: { familyId: ctx.family.id } })).toBe(0);
    expect(await prisma.consentRecord.count({ where: { familyId: ctx.family.id } })).toBe(0);

    // Invoices survive, because seven years of bookkeeping is not optional.
    expect(await prisma.invoice.count({ where: { familyId: ctx.family.id } })).toBe(1);

    const user = await prisma.user.findUniqueOrThrow({ where: { id: ctx.parent.id } });
    expect(user.deletedAt).not.toBeNull();
    expect(user.email).not.toContain('@wonderbox.test');
    expect(user.email).toContain('deleted+');
    expect(user.displayName).toBe('Deleted account');
    expect(user.familyId).toBeNull();

    // The codes are revoked so nobody can re-claim the boxes.
    const codes = await prisma.activationCode.findMany({ where: { familyId: ctx.family.id } });
    expect(codes.every((code) => code.state === 'REVOKED')).toBe(true);

    // And nothing at all happened to anyone else.
    expect(await prisma.childProfile.count({ where: { familyId: bystander.family.id } })).toBe(1);
    expect(await prisma.progressEvent.count({ where: { familyId: bystander.family.id } })).toBe(1);
  });

  it('leaves an audit trail of the deletion itself', async () => {
    const ctx = await familyWithHistory('Delete B');
    await deleteFamilyData(ctx.family.id, ctx.parent.id);

    const audit = await prisma.auditLog.findFirst({
      where: { entityId: ctx.family.id, action: 'privacy.deleted' },
    });
    expect(audit).not.toBeNull();
    // The trail records counts, never the content that was removed.
    expect(JSON.stringify(audit?.metadata)).not.toContain('Kid');
  });

  it('drops progress events past the retention window and keeps recent ones', async () => {
    const ctx = await familyWithHistory('Retention A');
    const activated = await prisma.activatedBox.findFirstOrThrow({
      where: { familyId: ctx.family.id },
    });

    const longAgo = new Date(Date.now() - 500 * 24 * 60 * 60 * 1000);
    await prisma.progressEvent.create({
      data: {
        clientEventId: `old-${ctx.family.id}`,
        familyId: ctx.family.id,
        activatedBoxId: activated.id,
        type: 'NODE_PLAYED',
        occurredAt: longAgo,
        receivedAt: longAgo,
      },
    });

    const before = await prisma.progressEvent.count({ where: { familyId: ctx.family.id } });
    expect(before).toBe(2);

    const report = await runRetentionSweep();
    expect(report.progressEvents).toBeGreaterThanOrEqual(1);
    expect(await prisma.progressEvent.count({ where: { familyId: ctx.family.id } })).toBe(1);
  });

  it('clears expired sessions and leaves live ones alone', async () => {
    const { parent } = await makeFamily('Session A');
    await prisma.session.createMany({
      data: [
        {
          userId: parent.id,
          tokenHash: sha256('expired-token'),
          expiresAt: new Date(Date.now() - 60_000),
        },
        {
          userId: parent.id,
          tokenHash: sha256('live-token'),
          expiresAt: new Date(Date.now() + 3_600_000),
        },
      ],
    });

    const removed = await pruneExpiredSessions();
    expect(removed).toBeGreaterThanOrEqual(1);
    const remaining = await prisma.session.findMany({ where: { userId: parent.id } });
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.tokenHash).toBe(sha256('live-token'));
  });

  it('never stores a session token in the clear', async () => {
    const { parent } = await makeFamily('Session B');
    const token = 'a-very-secret-token-value';
    await prisma.session.create({
      data: { userId: parent.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + 1000) },
    });
    const row = await prisma.session.findFirstOrThrow({ where: { userId: parent.id } });
    expect(row.tokenHash).not.toContain(token);
    expect(row.tokenHash).toBe(sha256(token));
  });
});
