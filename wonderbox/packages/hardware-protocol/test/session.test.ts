import { describe, expect, it } from 'vitest';
import { CompanionSession, UnknownChoiceError } from '../src/session.ts';
import { chapterFixture, fakeClock } from './fixtures.ts';

/**
 * Dialogue branching.
 *
 * The session is the one implementation of "where is this child now", shared
 * by the PWA companion, the emulator and (eventually) the firmware. If these
 * tests pass, all three agree.
 */
describe('dialogue traversal', () => {
  function session() {
    const instance = new CompanionSession('box-1', fakeClock());
    instance.loadChapter(chapterFixture());
    return instance;
  }

  it('starts at the entry node and records that the chapter began', () => {
    const s = session();
    expect(s.currentNode?.key).toBe('intro');
    expect(s.state).toBe('idle');
    expect(s.pendingEvents[0]).toMatchObject({ type: 'chapterStarted', nodeId: 'n-intro' });
  });

  it('advances through a single outgoing edge without asking the child', () => {
    const s = session();
    s.play();
    const next = s.narrationEnded();
    expect(next?.key).toBe('question');
    expect(s.state).toBe('playing');
  });

  it('waits for the child at a question instead of choosing for them', () => {
    const s = session();
    s.play();
    s.narrationEnded();
    s.narrationEnded();
    expect(s.state).toBe('awaitingChoice');
    expect(s.currentNode?.key).toBe('question');
  });

  it('takes the correct branch and finishes', () => {
    const s = session();
    s.play();
    s.narrationEnded();
    s.narrationEnded();

    const confirm = s.selectChoice('right');
    expect(confirm.key).toBe('confirm');
    expect(s.visitedNodeIds).toEqual(['n-intro', 'n-question', 'n-confirm']);

    s.narrationEnded();
    expect(s.state).toBe('finished');
    expect(s.isComplete).toBe(true);
  });

  it('takes the hint branch and rejoins the main line', () => {
    const s = session();
    s.play();
    s.narrationEnded();
    s.narrationEnded();

    expect(s.selectChoice('unsure').key).toBe('hint');
    expect(s.selectChoice('go').key).toBe('confirm');
    // Both routes reach the same place; only the path differs.
    expect(s.visitedNodeIds).toEqual(['n-intro', 'n-question', 'n-hint', 'n-confirm']);
  });

  it('repeats the same node without moving forward', () => {
    const s = session();
    s.play();
    s.narrationEnded();
    s.narrationEnded();

    const repeated = s.selectChoice('again');
    expect(repeated.key).toBe('question');
    expect(s.currentNode?.key).toBe('question');
    expect(s.speed).toBe('normal');
  });

  it('drops to slow narration and stays there for the rest of the chapter', () => {
    const s = session();
    s.play();
    s.narrationEnded();
    s.narrationEnded();

    s.selectChoice('slower');
    expect(s.speed).toBe('slow');
    expect(s.currentNode?.key).toBe('question');

    s.selectChoice('right');
    // Speed is a property of the child, not of the node.
    expect(s.speed).toBe('slow');
  });

  it('refuses a choice the node does not offer', () => {
    const s = session();
    s.play();
    s.narrationEnded();
    s.narrationEnded();
    expect(() => s.selectChoice('sabotage')).toThrow(UnknownChoiceError);
  });

  it('pauses and resumes without losing its place', () => {
    const s = session();
    s.play();
    s.pause();
    expect(s.state).toBe('paused');
    s.resume();
    expect(s.state).toBe('playing');
    expect(s.currentNode?.key).toBe('intro');
  });

  it('restores an authoritative progress point from the host', () => {
    const s = session();
    const node = s.restore('n-hint', 4200);
    expect(node.key).toBe('hint');
    expect(s.offsetMs).toBe(4200);
    expect(s.state).toBe('paused');
  });

  it('survives a power cut through a snapshot', () => {
    const s = session();
    s.play();
    s.narrationEnded();
    s.narrationEnded();
    s.selectChoice('slower');
    const snapshot = s.snapshot();

    const revived = new CompanionSession('box-1', fakeClock());
    revived.loadChapter(chapterFixture());
    revived.restoreSnapshot(snapshot);

    expect(revived.currentNode?.key).toBe('question');
    expect(revived.speed).toBe('slow');
    expect(revived.pendingEvents).toEqual(snapshot.queue);
  });
});
