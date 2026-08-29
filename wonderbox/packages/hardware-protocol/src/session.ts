import type { ChapterLoadedEvent, LoadedNode } from './events.ts';
import type { NarrationSpeed } from './primitives.ts';

/**
 * The dialogue traversal rules, expressed once and shared by the server, the
 * PWA companion and the device emulator. Keeping one implementation is what
 * makes offline play and online play agree about where a child ended up.
 */

export type PlaybackState = 'idle' | 'playing' | 'paused' | 'awaitingChoice' | 'finished';

export interface QueuedProgressEvent {
  clientEventId: string;
  type:
    | 'chapterStarted'
    | 'nodePlayed'
    | 'choiceSelected'
    | 'repeated'
    | 'chapterCompleted'
    | 'journeyCompleted'
    | 'paused'
    | 'resumed';
  chapterId?: string;
  nodeId?: string;
  choiceKey?: string;
  occurredAt: string;
  listenedMs?: number;
}

export interface CompanionSessionSnapshot {
  activatedBoxId: string;
  chapterId: string;
  nodeId: string | null;
  state: PlaybackState;
  speed: NarrationSpeed;
  offsetMs: number;
  visitedNodeIds: string[];
  completed: boolean;
  queue: QueuedProgressEvent[];
}

export interface SessionClock {
  now(): Date;
  newId(): string;
}

export const systemClock: SessionClock = {
  now: () => new Date(),
  newId: () => {
    const globalCrypto = (globalThis as { crypto?: Crypto }).crypto;
    if (globalCrypto?.randomUUID) return globalCrypto.randomUUID();
    return `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  },
};

export class ChapterNotLoadedError extends Error {
  constructor() {
    super('No chapter is loaded in this session');
    this.name = 'ChapterNotLoadedError';
  }
}

export class UnknownChoiceError extends Error {
  constructor(nodeId: string, choiceKey: string) {
    super(`Node ${nodeId} has no choice "${choiceKey}"`);
    this.name = 'UnknownChoiceError';
  }
}

/**
 * Drives one child through one chapter. Every state change appends to an
 * offline queue; the queue is drained with `syncWhenOnline` and is safe to
 * replay because each entry carries a stable clientEventId.
 */
export class CompanionSession {
  private nodes = new Map<string, LoadedNode>();
  private chapter: ChapterLoadedEvent | null = null;
  private current: LoadedNode | null = null;
  private queue: QueuedProgressEvent[] = [];
  private visited: string[] = [];

  state: PlaybackState = 'idle';
  speed: NarrationSpeed = 'normal';
  offsetMs = 0;

  constructor(
    readonly activatedBoxId: string,
    private readonly clock: SessionClock = systemClock,
  ) {}

  get chapterId(): string | null {
    return this.chapter?.chapterId ?? null;
  }

  get currentNode(): LoadedNode | null {
    return this.current;
  }

  get pendingEvents(): readonly QueuedProgressEvent[] {
    return this.queue;
  }

  get visitedNodeIds(): readonly string[] {
    return this.visited;
  }

  /** True once the child has reached a terminal node. */
  get isComplete(): boolean {
    return this.state === 'finished';
  }

  loadChapter(chapter: ChapterLoadedEvent): void {
    this.chapter = chapter;
    this.nodes = new Map(chapter.nodes.map((node) => [node.id, node]));
    this.current = this.nodes.get(chapter.entryNodeId) ?? null;
    if (!this.current) throw new Error(`Entry node ${chapter.entryNodeId} is missing from the chapter`);
    this.state = 'idle';
    this.offsetMs = 0;
    this.visited = [];
    this.enqueue({ type: 'chapterStarted', chapterId: chapter.chapterId, nodeId: this.current.id });
  }

  play(): LoadedNode {
    const node = this.requireCurrent();
    this.state = 'playing';
    if (!this.visited.includes(node.id)) this.visited.push(node.id);
    this.enqueue({ type: 'nodePlayed', nodeId: node.id });
    return node;
  }

  pause(): void {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.enqueue({ type: 'paused', nodeId: this.current?.id });
  }

  resume(): void {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.enqueue({ type: 'resumed', nodeId: this.current?.id });
  }

  /** "Say that again." `slower` also drops narration speed for the rest of the chapter. */
  repeat(mode: 'same' | 'slower' = 'same'): LoadedNode {
    const node = this.requireCurrent();
    if (mode === 'slower') this.speed = 'slow';
    this.offsetMs = 0;
    this.state = 'playing';
    this.enqueue({ type: 'repeated', nodeId: node.id });
    return node;
  }

  setSpeed(speed: NarrationSpeed): void {
    this.speed = speed;
  }

  /**
   * Marks the current narration finished and decides what happens next.
   *
   * A node waits for the child when it asks a question, when it offers more
   * than one way forward, or when it declares a pause — a pause is a child
   * doing something with their hands, and carrying them past it after a fixed
   * number of seconds is exactly the failure this product exists to avoid.
   * Only a plain narrative beat with a single exit flows on by itself.
   */
  narrationEnded(): LoadedNode | null {
    const node = this.requireCurrent();
    if (node.isTerminal) return this.finish();
    const auto = node.choices.filter((choice) => !choice.isRepeat && !choice.isSlower);
    if (auto.length === 0) return this.finish();

    const waitsForChild =
      node.kind === 'question' || auto.length > 1 || (node.pauseSeconds ?? 0) > 0;
    if (waitsForChild) {
      this.state = 'awaitingChoice';
      return node;
    }

    const only = auto[0];
    if (!only?.targetNodeId) return this.finish();
    return this.moveTo(only.targetNodeId);
  }

  /**
   * The choice a pause should fall through to when the child says nothing at
   * all, or null when the child genuinely has to decide. Used to drive the
   * hands-free timer without duplicating the branching rules.
   */
  pauseFallthrough(): string | null {
    const node = this.current;
    if (!node || node.kind === 'question') return null;
    const auto = node.choices.filter((choice) => !choice.isRepeat && !choice.isSlower);
    return auto.length === 1 ? (auto[0]?.key ?? null) : null;
  }

  selectChoice(choiceKey: string): LoadedNode {
    const node = this.requireCurrent();
    const choice = node.choices.find((candidate) => candidate.key === choiceKey);
    if (!choice) throw new UnknownChoiceError(node.id, choiceKey);
    this.enqueue({ type: 'choiceSelected', nodeId: node.id, choiceKey });
    if (choice.isSlower) return this.repeat('slower');
    if (choice.isRepeat) return this.repeat('same');
    if (!choice.targetNodeId) return this.finish() ?? node;
    return this.moveTo(choice.targetNodeId);
  }

  private moveTo(nodeId: string): LoadedNode {
    const next = this.nodes.get(nodeId);
    if (!next) throw new Error(`Chapter is missing node ${nodeId}`);
    this.current = next;
    this.offsetMs = 0;
    this.state = 'playing';
    if (!this.visited.includes(next.id)) this.visited.push(next.id);
    this.enqueue({ type: 'nodePlayed', nodeId: next.id });
    return next;
  }

  private finish(): LoadedNode | null {
    this.state = 'finished';
    this.enqueue({ type: 'chapterCompleted', nodeId: this.current?.id });
    return this.current;
  }

  /** Restores a session from an authoritative `setProgress` command. */
  restore(nodeId: string, offsetMs = 0): LoadedNode {
    const node = this.nodes.get(nodeId);
    if (!node) throw new Error(`Chapter is missing node ${nodeId}`);
    this.current = node;
    this.offsetMs = offsetMs;
    this.state = 'paused';
    if (!this.visited.includes(node.id)) this.visited.push(node.id);
    return node;
  }

  /** Everything the device must persist to survive a power cut. */
  snapshot(): CompanionSessionSnapshot {
    return {
      activatedBoxId: this.activatedBoxId,
      chapterId: this.chapter?.chapterId ?? '',
      nodeId: this.current?.id ?? null,
      state: this.state,
      speed: this.speed,
      offsetMs: this.offsetMs,
      visitedNodeIds: [...this.visited],
      completed: this.state === 'finished',
      queue: [...this.queue],
    };
  }

  /** Rehydrates from a snapshot without replaying the chapter from the top. */
  restoreSnapshot(snapshot: CompanionSessionSnapshot): void {
    this.state = snapshot.state;
    this.speed = snapshot.speed;
    this.offsetMs = snapshot.offsetMs;
    this.visited = [...snapshot.visitedNodeIds];
    this.queue = [...snapshot.queue];
    if (snapshot.nodeId) this.current = this.nodes.get(snapshot.nodeId) ?? this.current;
  }

  /**
   * Called after the host confirms which client event ids it stored. Only the
   * acknowledged ids leave the queue, so a half-delivered batch is retried.
   */
  acknowledge(clientEventIds: readonly string[]): void {
    const acknowledged = new Set(clientEventIds);
    this.queue = this.queue.filter((event) => !acknowledged.has(event.clientEventId));
  }

  private enqueue(event: Omit<QueuedProgressEvent, 'clientEventId' | 'occurredAt'>): void {
    this.queue.push({
      ...event,
      clientEventId: this.clock.newId(),
      occurredAt: this.clock.now().toISOString(),
    });
  }

  private requireCurrent(): LoadedNode {
    if (!this.current) throw new ChapterNotLoadedError();
    return this.current;
  }
}
