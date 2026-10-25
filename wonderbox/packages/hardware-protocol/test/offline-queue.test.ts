import { describe, expect, it } from 'vitest';
import { CompanionSession } from '../src/session.ts';
import { chapterFixture, fakeClock } from './fixtures.ts';

/**
 * Offline reconciliation, device side.
 *
 * The device is offline half the time by design. What makes that safe is that
 * every queued event has a stable id and nothing leaves the queue until the
 * host says it stored it.
 */
describe('offline progress queue', () => {
  function playThrough() {
    const s = new CompanionSession('box-1', fakeClock());
    s.loadChapter(chapterFixture());
    s.play();
    s.narrationEnded();
    s.narrationEnded();
    s.selectChoice('unsure');
    s.selectChoice('go');
    return s;
  }

  it('queues every state change with a stable id', () => {
    const s = playThrough();
    const types = s.pendingEvents.map((event) => event.type);
    expect(types).toEqual([
      'chapterStarted',
      'nodePlayed',
      'nodePlayed',
      'choiceSelected',
      'nodePlayed',
      'choiceSelected',
      'nodePlayed',
    ]);
    const ids = s.pendingEvents.map((event) => event.clientEventId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps timestamps from the device clock, ordered as they happened', () => {
    const s = playThrough();
    const times = s.pendingEvents.map((event) => Date.parse(event.occurredAt));
    expect([...times].sort((a, b) => a - b)).toEqual(times);
  });

  it('drops only what the host confirms it stored', () => {
    const s = playThrough();
    const all = s.pendingEvents.map((event) => event.clientEventId);
    const half = all.slice(0, 3);

    s.acknowledge(half);
    expect(s.pendingEvents.map((event) => event.clientEventId)).toEqual(all.slice(3));

    // A partially delivered batch leaves the rest to be retried, not lost.
    expect(s.pendingEvents.length).toBe(all.length - 3);
  });

  it('is harmless to acknowledge the same ids twice', () => {
    const s = playThrough();
    const all = s.pendingEvents.map((event) => event.clientEventId);
    s.acknowledge(all);
    s.acknowledge(all);
    expect(s.pendingEvents).toHaveLength(0);
  });

  it('ignores acknowledgements for ids it never sent', () => {
    const s = playThrough();
    const before = s.pendingEvents.length;
    s.acknowledge(['evt-from-another-device']);
    expect(s.pendingEvents).toHaveLength(before);
  });

  it('keeps queueing while offline and hands over one batch when it reconnects', () => {
    const s = playThrough();
    // A week in a bedroom with no wifi.
    for (let i = 0; i < 20; i += 1) s.repeat('same');
    expect(s.pendingEvents.length).toBeGreaterThan(20);

    const batch = [...s.pendingEvents];
    s.acknowledge(batch.map((event) => event.clientEventId));
    expect(s.pendingEvents).toHaveLength(0);

    // Replaying the same batch at the host is safe because the ids are stable;
    // the device has nothing left to send either way.
    expect(new Set(batch.map((event) => event.clientEventId)).size).toBe(batch.length);
  });

  it('carries the ids through a snapshot so a reboot does not lose them', () => {
    const s = playThrough();
    const snapshot = s.snapshot();

    const revived = new CompanionSession('box-1', fakeClock());
    revived.loadChapter(chapterFixture());
    revived.restoreSnapshot(snapshot);

    expect(revived.pendingEvents.map((event) => event.clientEventId)).toEqual(
      snapshot.queue.map((event) => event.clientEventId),
    );
  });
});
