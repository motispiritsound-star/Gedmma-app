import { beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/db.ts';
import { NotFoundError } from '../src/lib/errors.ts';
import {
  buildSummary,
  completedChapterIds,
  resumePoint,
  snapshotSummary,
  syncProgress,
} from '../src/server/progress.ts';
import { activateBox, mintActivationCodes } from '../src/server/activation.ts';
import { markOrderPaid, placeOrder } from '../src/server/orders.ts';
import { makeBox, makeChapter, makeFamily, resetDatabase } from './helpers/fixtures.ts';

/**
 * Progress recording.
 *
 * Two claims: a family can only ever see its own progress, and replaying an
 * offline queue never double-counts. Both are properties of the data, so both
 * are tested against the database rather than against a stub.
 */
describe('progress and offline reconciliation', () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  async function activatedBoxFor(name: string) {
    const box = await makeBox({ stock: 5 });
    const { family, address, parent } = await makeFamily(name);
    const [code] = await mintActivationCodes(box.product.id, 1);
    const placed = await placeOrder({
      familyId: family.id,
      lines: [{ boxProductId: box.product.id, quantity: 1 }],
      shippingAddressId: address.id,
      idempotencyKey: `progress-${family.id}`,
    });
    await markOrderPaid(placed.order.id);
    const outcome = await activateBox({ code: code!, familyId: family.id, userId: parent.id });
    if (!outcome.ok) throw new Error('Activation failed in fixture');
    const child = await prisma.childProfile.create({
      data: { familyId: family.id, displayName: 'Kid', birthYear: 2018, ageBand: 'AGE_7_8' },
    });
    return { box, family, parent, child, activatedBoxId: outcome.activatedBox.id };
  }

  const at = (offsetMinutes: number) =>
    new Date(Date.now() - offsetMinutes * 60_000).toISOString();

  it('stores a queue and reports which ids it accepted', async () => {
    const ctx = await activatedBoxFor('Progress A');
    const result = await syncProgress({
      activatedBoxId: ctx.activatedBoxId,
      familyId: ctx.family.id,
      childProfileId: ctx.child.id,
      events: [
        { clientEventId: 'evt-a1', type: 'chapterStarted', chapterId: ctx.box.chapterId!, occurredAt: at(30) },
        { clientEventId: 'evt-a2', type: 'nodePlayed', chapterId: ctx.box.chapterId!, occurredAt: at(29), listenedMs: 42_000 },
      ],
    });

    expect(result.acceptedClientEventIds).toEqual(['evt-a1', 'evt-a2']);
    expect(result.duplicateClientEventIds).toEqual([]);
    expect(await prisma.progressEvent.count({ where: { activatedBoxId: ctx.activatedBoxId } })).toBe(2);
  });

  it('is idempotent: replaying the whole queue changes nothing', async () => {
    const ctx = await activatedBoxFor('Progress B');
    const queue = [
      { clientEventId: 'evt-b1', type: 'chapterStarted' as const, chapterId: ctx.box.chapterId!, occurredAt: at(20) },
      { clientEventId: 'evt-b2', type: 'nodePlayed' as const, chapterId: ctx.box.chapterId!, occurredAt: at(19), listenedMs: 30_000 },
      { clientEventId: 'evt-b3', type: 'chapterCompleted' as const, chapterId: ctx.box.chapterId!, occurredAt: at(10) },
    ];

    const first = await syncProgress({
      activatedBoxId: ctx.activatedBoxId,
      familyId: ctx.family.id,
      events: queue,
    });
    expect(first.acceptedClientEventIds).toHaveLength(3);

    // The device did not get the response — it was on a train — so it sends
    // exactly the same queue again. And again.
    const second = await syncProgress({
      activatedBoxId: ctx.activatedBoxId,
      familyId: ctx.family.id,
      events: queue,
    });
    const third = await syncProgress({
      activatedBoxId: ctx.activatedBoxId,
      familyId: ctx.family.id,
      events: queue,
    });

    expect(second.acceptedClientEventIds).toEqual([]);
    expect(second.duplicateClientEventIds).toHaveLength(3);
    expect(third.duplicateClientEventIds).toHaveLength(3);
    expect(await prisma.progressEvent.count({ where: { activatedBoxId: ctx.activatedBoxId } })).toBe(3);
  });

  it('deduplicates within a single batch as well as across batches', async () => {
    const ctx = await activatedBoxFor('Progress C');
    const result = await syncProgress({
      activatedBoxId: ctx.activatedBoxId,
      familyId: ctx.family.id,
      events: [
        { clientEventId: 'evt-c1', type: 'nodePlayed', chapterId: ctx.box.chapterId!, occurredAt: at(5) },
        { clientEventId: 'evt-c1', type: 'nodePlayed', chapterId: ctx.box.chapterId!, occurredAt: at(5) },
      ],
    });
    expect(result.acceptedClientEventIds).toEqual(['evt-c1']);
    expect(result.duplicateClientEventIds).toEqual(['evt-c1']);
    expect(await prisma.progressEvent.count({ where: { activatedBoxId: ctx.activatedBoxId } })).toBe(1);
  });

  it('survives two concurrent flushes of the same queue', async () => {
    const ctx = await activatedBoxFor('Progress D');
    const queue = Array.from({ length: 10 }, (_, index) => ({
      clientEventId: `evt-d${index}`,
      type: 'nodePlayed' as const,
      chapterId: ctx.box.chapterId!,
      occurredAt: at(index),
    }));

    // A phone that comes back online while the tab is also retrying.
    await Promise.all([
      syncProgress({ activatedBoxId: ctx.activatedBoxId, familyId: ctx.family.id, events: queue }),
      syncProgress({ activatedBoxId: ctx.activatedBoxId, familyId: ctx.family.id, events: queue }),
    ]);

    expect(await prisma.progressEvent.count({ where: { activatedBoxId: ctx.activatedBoxId } })).toBe(10);
  });

  it('refuses progress for a box that belongs to another family', async () => {
    const mine = await activatedBoxFor('Progress E');
    const theirs = await activatedBoxFor('Progress F');

    await expect(
      syncProgress({
        activatedBoxId: theirs.activatedBoxId,
        familyId: mine.family.id,
        events: [
          { clientEventId: 'evt-x', type: 'nodePlayed', chapterId: theirs.box.chapterId!, occurredAt: at(1) },
        ],
      }),
    ).rejects.toBeInstanceOf(NotFoundError);

    expect(await prisma.progressEvent.count({ where: { activatedBoxId: theirs.activatedBoxId } })).toBe(0);
  });

  it('rejects an event for a chapter that is not in this box', async () => {
    const ctx = await activatedBoxFor('Progress G');
    const other = await makeBox();

    const result = await syncProgress({
      activatedBoxId: ctx.activatedBoxId,
      familyId: ctx.family.id,
      events: [
        { clientEventId: 'evt-wrong', type: 'nodePlayed', chapterId: other.chapterId!, occurredAt: at(1) },
      ],
    });
    expect(result.acceptedClientEventIds).toEqual([]);
    expect(result.rejected).toEqual([{ clientEventId: 'evt-wrong', reason: 'chapterNotInBox' }]);
  });

  it('reports journey completion only when every chapter is finished', async () => {
    const ctx = await activatedBoxFor('Progress H');
    const secondChapter = await makeChapter(ctx.box.journeyId!, 1);

    const partial = await syncProgress({
      activatedBoxId: ctx.activatedBoxId,
      familyId: ctx.family.id,
      events: [
        { clientEventId: 'evt-h1', type: 'chapterCompleted', chapterId: ctx.box.chapterId!, occurredAt: at(5) },
      ],
    });
    expect(partial.chapterCompleted).toBe(true);
    expect(partial.journeyCompleted).toBe(false);

    const complete = await syncProgress({
      activatedBoxId: ctx.activatedBoxId,
      familyId: ctx.family.id,
      events: [
        { clientEventId: 'evt-h2', type: 'chapterCompleted', chapterId: secondChapter, occurredAt: at(1) },
      ],
    });
    expect(complete.journeyCompleted).toBe(true);
    expect(await completedChapterIds(ctx.activatedBoxId)).toEqual(
      new Set([ctx.box.chapterId!, secondChapter]),
    );
  });

  it('recovers where a child left off', async () => {
    const ctx = await activatedBoxFor('Progress I');
    const node = await prisma.dialogueNode.findFirstOrThrow({
      where: { chapterId: ctx.box.chapterId!, key: 'hint' },
    });

    await syncProgress({
      activatedBoxId: ctx.activatedBoxId,
      familyId: ctx.family.id,
      events: [
        { clientEventId: 'evt-i1', type: 'chapterStarted', chapterId: ctx.box.chapterId!, occurredAt: at(9) },
        { clientEventId: 'evt-i2', type: 'nodePlayed', nodeId: node.id, chapterId: ctx.box.chapterId!, occurredAt: at(3) },
      ],
    });

    const resume = await resumePoint(ctx.activatedBoxId);
    expect(resume?.chapterId).toBe(ctx.box.chapterId);
    expect(resume?.nodeId).toBe(node.id);
  });

  it('builds a summary that describes activity and never grades it', async () => {
    const ctx = await activatedBoxFor('Progress J');
    await syncProgress({
      activatedBoxId: ctx.activatedBoxId,
      familyId: ctx.family.id,
      childProfileId: ctx.child.id,
      events: [
        { clientEventId: 'evt-j1', type: 'nodePlayed', chapterId: ctx.box.chapterId!, occurredAt: at(20), listenedMs: 300_000 },
        { clientEventId: 'evt-j2', type: 'chapterCompleted', chapterId: ctx.box.chapterId!, occurredAt: at(10) },
      ],
    });

    const summary = await buildSummary(ctx.activatedBoxId, ctx.family.id, 'nl');
    expect(summary).not.toBeNull();
    expect(summary!.chaptersCompleted).toBe(1);
    expect(summary!.chaptersTotal).toBe(1);
    expect(summary!.minutesListened).toBe(5);
    expect(summary!.childName).toBe('Kid');
    expect(summary!.topics.length).toBeGreaterThan(0);

    // No score, no level, no comparison — the shape simply has nowhere to
    // put one, and this test is here so it stays that way.
    expect(Object.keys(summary!)).not.toContain('score');
    expect(Object.keys(summary!)).not.toContain('level');
    expect(Object.keys(summary!)).not.toContain('percentile');
  });

  it('refuses to build a summary for someone else', async () => {
    const mine = await activatedBoxFor('Progress K');
    const theirs = await activatedBoxFor('Progress L');
    expect(await buildSummary(theirs.activatedBoxId, mine.family.id, 'nl')).toBeNull();
  });

  it('snapshots a summary once per period rather than accumulating rows', async () => {
    const ctx = await activatedBoxFor('Progress M');
    await syncProgress({
      activatedBoxId: ctx.activatedBoxId,
      familyId: ctx.family.id,
      childProfileId: ctx.child.id,
      events: [
        { clientEventId: 'evt-m1', type: 'chapterCompleted', chapterId: ctx.box.chapterId!, occurredAt: at(2) },
      ],
    });

    const start = new Date('2026-01-01T00:00:00.000Z');
    const end = new Date('2026-02-01T00:00:00.000Z');
    await snapshotSummary(ctx.activatedBoxId, ctx.family.id, start, end, 'nl');
    await snapshotSummary(ctx.activatedBoxId, ctx.family.id, start, end, 'nl');

    expect(
      await prisma.parentSummary.count({ where: { activatedBoxId: ctx.activatedBoxId } }),
    ).toBe(1);
  });
});
