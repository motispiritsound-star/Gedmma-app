import type { ChapterLoadedEvent } from '../src/events.ts';

/**
 * A chapter shaped like a real one: a narration, a question with two real
 * branches plus a repeat and a slower control, a hint that rejoins the main
 * line, and a terminal celebration.
 */
export function chapterFixture(): ChapterLoadedEvent {
  return {
    type: 'chapterLoaded',
    activatedBoxId: 'box-1',
    chapterId: 'chapter-1',
    title: 'De lancering',
    entryNodeId: 'n-intro',
    locale: 'nl',
    contentVersion: 1,
    audio: [
      {
        nodeId: 'n-intro',
        locale: 'nl',
        servedLocale: 'nl',
        url: '/api/storage?key=a',
        durationMs: 4000,
        checksum: 'aaa',
      },
    ],
    nodes: [
      {
        id: 'n-intro',
        key: 'intro',
        kind: 'narration',
        text: 'Hallo ruimteverkenner.',
        servedLocale: 'nl',
        pauseSeconds: null,
        isTerminal: false,
        choices: [{ key: 'go', label: 'Verder', targetNodeId: 'n-question', isRepeat: false, isSlower: false }],
      },
      {
        id: 'n-question',
        key: 'question',
        kind: 'question',
        text: 'Hoe komt een raket vooruit?',
        servedLocale: 'nl',
        pauseSeconds: 8,
        isTerminal: false,
        choices: [
          { key: 'right', label: 'Hij duwt lucht naar achteren', targetNodeId: 'n-confirm', isRepeat: false, isSlower: false },
          { key: 'unsure', label: 'Geen idee', targetNodeId: 'n-hint', isRepeat: false, isSlower: false },
          { key: 'again', label: 'Nog een keer', targetNodeId: null, isRepeat: true, isSlower: false },
          { key: 'slower', label: 'Langzamer', targetNodeId: null, isRepeat: false, isSlower: true },
        ],
      },
      {
        id: 'n-hint',
        key: 'hint',
        kind: 'hint',
        text: 'Denk aan een ballon die je loslaat.',
        servedLocale: 'nl',
        pauseSeconds: 6,
        isTerminal: false,
        choices: [{ key: 'go', label: 'Aha', targetNodeId: 'n-confirm', isRepeat: false, isSlower: false }],
      },
      {
        id: 'n-confirm',
        key: 'confirm',
        kind: 'celebration',
        text: 'Precies.',
        servedLocale: 'nl',
        pauseSeconds: null,
        isTerminal: true,
        choices: [],
      },
    ],
  };
}

/** Deterministic clock and id source, so assertions can name exact ids. */
export function fakeClock(start = new Date('2026-03-01T10:00:00.000Z')) {
  let tick = 0;
  return {
    now: () => new Date(start.getTime() + tick * 1000),
    newId: () => {
      tick += 1;
      return `evt-${tick}`;
    },
  };
}
