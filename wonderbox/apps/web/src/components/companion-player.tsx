'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CompanionSession,
  type ChapterLoadedEvent,
  type LoadedNode,
  type QueuedProgressEvent,
} from '@wonderbox/hardware-protocol';

/**
 * The audio companion simulator.
 *
 * This stands in for hardware that does not exist yet, so it is deliberately
 * built like hardware rather than like a web page:
 *
 *   * Four physical-sized controls — play/pause, repeat, slower, and the
 *     choices — and nothing else. No menus, no scrolling required to act.
 *   * The screen is a convenience, not a requirement. Every state change is
 *     announced through an aria-live region, and the text on screen is exactly
 *     what is being spoken, so it works with the display off or covered.
 *   * It assumes it will lose the network. The queue is written to
 *     localStorage after every event and flushed opportunistically; nothing is
 *     dropped because a router rebooted mid-chapter.
 *
 * The traversal itself lives in @wonderbox/hardware-protocol, shared with the
 * emulator and mirrored by the server, so all three agree on where a child is.
 */

interface Props {
  readonly activatedBoxId: string;
  readonly chapterId: string;
  readonly locale: 'nl' | 'en';
  readonly childProfileId: string | null;
  readonly initialNodeId: string | null;
  readonly defaultSlow: boolean;
  readonly extraPauseSeconds: number;
  readonly copy: {
    play: string;
    pause: string;
    repeat: string;
    slower: string;
    download: string;
    downloaded: string;
    offline: string;
    chapterDone: string;
    loading: string;
    error: string;
    resume: string;
    back: string;
  };
}

type Status = 'loading' | 'ready' | 'error';

const SLOW_RATE = 0.75;

function queueKey(activatedBoxId: string, chapterId: string): string {
  return `wb:queue:${activatedBoxId}:${chapterId}`;
}

function snapshotKey(activatedBoxId: string, chapterId: string): string {
  return `wb:snapshot:${activatedBoxId}:${chapterId}`;
}

function chapterCacheKey(activatedBoxId: string, chapterId: string, locale: string): string {
  return `wb:chapter:${activatedBoxId}:${chapterId}:${locale}`;
}

function readJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked (private mode). Playback continues; only the
    // offline safety net is lost, and the server still has everything synced.
  }
}

export function CompanionPlayer(props: Props) {
  const { activatedBoxId, chapterId, locale, copy } = props;

  const [status, setStatus] = useState<Status>('loading');
  const [chapter, setChapter] = useState<ChapterLoadedEvent | null>(null);
  const [node, setNode] = useState<LoadedNode | null>(null);
  const [playing, setPlaying] = useState(false);
  const [slow, setSlow] = useState(props.defaultSlow);
  const [awaitingChoice, setAwaitingChoice] = useState(false);
  const [finished, setFinished] = useState(false);
  const [online, setOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [cached, setCached] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sessionRef = useRef<CompanionSession | null>(null);
  const pauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const audioByNode = useMemo(() => {
    const map = new Map<string, { url: string; durationMs: number }>();
    for (const track of chapter?.audio ?? []) {
      map.set(track.nodeId, { url: track.url, durationMs: track.durationMs });
    }
    return map;
  }, [chapter]);

  /** Persists the queue and the resume point after every state change. */
  const persist = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    const snapshot = session.snapshot();
    writeJson(queueKey(activatedBoxId, chapterId), snapshot.queue);
    writeJson(snapshotKey(activatedBoxId, chapterId), snapshot);
    setPendingCount(snapshot.queue.length);
  }, [activatedBoxId, chapterId]);

  /**
   * Drains the queue to the server. Only acknowledged ids are removed, so a
   * partially accepted batch is retried rather than silently lost.
   */
  const flush = useCallback(async () => {
    const session = sessionRef.current;
    if (!session) return;
    const queued = [...session.pendingEvents];
    if (queued.length === 0) return;

    try {
      const response = await fetch('/api/companion/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'syncWhenOnline',
          activatedBoxId,
          childProfileId: props.childProfileId ?? undefined,
          events: queued satisfies QueuedProgressEvent[],
        }),
      });
      if (!response.ok) return;
      const result = (await response.json()) as {
        acceptedClientEventIds: string[];
        duplicateClientEventIds: string[];
      };
      session.acknowledge([...result.acceptedClientEventIds, ...result.duplicateClientEventIds]);
      persist();
    } catch {
      // Still offline. The queue stays where it is and we try again later.
    }
  }, [activatedBoxId, props.childProfileId, persist]);

  // Load the chapter: network first, falling back to whatever was cached.
  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      const cacheKey = chapterCacheKey(activatedBoxId, chapterId, locale);
      let payload = null as ChapterLoadedEvent | null;

      try {
        const response = await fetch(
          `/api/companion/chapter?activatedBoxId=${encodeURIComponent(activatedBoxId)}&chapterId=${encodeURIComponent(chapterId)}&locale=${locale}`,
        );
        if (response.ok) {
          payload = (await response.json()) as ChapterLoadedEvent;
          writeJson(cacheKey, payload);
        }
      } catch {
        // Offline: fall through to the cached copy.
      }

      payload ??= readJson<ChapterLoadedEvent>(cacheKey);
      if (cancelled) return;
      if (!payload) {
        setStatus('error');
        return;
      }

      const session = new CompanionSession(activatedBoxId);
      session.loadChapter(payload);
      if (props.defaultSlow) session.setSpeed('slow');

      const saved = readJson<ReturnType<CompanionSession['snapshot']>>(
        snapshotKey(activatedBoxId, chapterId),
      );
      if (saved && !saved.completed) {
        session.restoreSnapshot(saved);
      } else if (props.initialNodeId) {
        session.restore(props.initialNodeId);
      }

      sessionRef.current = session;
      setChapter(payload);
      setNode(session.currentNode);
      setSlow(session.speed === 'slow');
      setPendingCount(session.pendingEvents.length);
      setStatus('ready');
      void flush();
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [activatedBoxId, chapterId, locale, props.defaultSlow, props.initialNodeId, flush]);

  // Connectivity. Coming back online is the trigger to drain the queue.
  useEffect(() => {
    const update = () => {
      const isOnline = navigator.onLine;
      setOnline(isOnline);
      if (isOnline) void flush();
    };
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, [flush]);

  const clearPauseTimer = useCallback(() => {
    if (pauseTimer.current) {
      clearTimeout(pauseTimer.current);
      pauseTimer.current = null;
    }
  }, []);

  /** Mirrors the session's state into React state after any transition. */
  const syncFromSession = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    setNode(session.currentNode);
    setAwaitingChoice(session.state === 'awaitingChoice');
    setFinished(session.state === 'finished');
    setPlaying(session.state === 'playing');
    setSlow(session.speed === 'slow');
    persist();
    void flush();
    if (session.state === 'finished') setAnnouncement(copy.chapterDone);
  }, [copy.chapterDone, persist, flush]);

  /**
   * Plays one node: its narration, then whatever the session says comes next.
   *
   * When the node declares a pause, the session parks in `awaitingChoice` and
   * this schedules the fall-through — so a child who is busy with their hands
   * is carried on automatically, while a child who is ready can press the
   * button and skip the wait. A question never falls through: somebody has to
   * actually answer it.
   */
  const speak = useCallback(
    async (target: LoadedNode) => {
      clearPauseTimer();
      const audio = audioRef.current;
      const track = audioByNode.get(target.id);
      setAnnouncement(target.text);

      const afterNarration = () => {
        const session = sessionRef.current;
        if (!session) return;
        const next = session.narrationEnded();
        syncFromSession();

        if (session.state !== 'awaitingChoice') {
          if (next && session.state === 'playing') void speakRef.current?.(next);
          return;
        }

        const fallthrough = session.pauseFallthrough();
        if (!fallthrough) return;
        const seconds = (target.pauseSeconds ?? 0) + props.extraPauseSeconds;
        pauseTimer.current = setTimeout(
          () => {
            pauseTimer.current = null;
            const moved = session.selectChoice(fallthrough);
            syncFromSession();
            void speakRef.current?.(moved);
          },
          Math.max(seconds, 1) * 1000,
        );
      };

      if (!audio || !track) {
        // No recording for this node: hold for a readable beat, then continue.
        pauseTimer.current = setTimeout(afterNarration, 1200);
        return;
      }

      audio.src = track.url;
      audio.playbackRate = slow ? SLOW_RATE : 1;
      // Keep the narrator's voice recognisable when slowed down.
      (audio as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = true;
      audio.onended = afterNarration;
      try {
        await audio.play();
        setPlaying(true);
      } catch {
        // Autoplay refused until the child presses a button. The words are on
        // screen and the controls still work, so this is not an error state.
        setPlaying(false);
        afterNarration();
      }
    },
    [audioByNode, slow, props.extraPauseSeconds, syncFromSession, clearPauseTimer],
  );

  // `speak` recurses through the pause timer; a ref keeps that from needing a
  // forward declaration or a stale closure.
  const speakRef = useRef(speak);
  useEffect(() => {
    speakRef.current = speak;
  }, [speak]);

  const handlePlay = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    if (playing) {
      audioRef.current?.pause();
      clearPauseTimer();
      session.pause();
      setPlaying(false);
      persist();
      return;
    }
    if (session.state === 'paused') session.resume();
    const current = session.play();
    syncFromSession();
    void speak(current);
  }, [playing, speak, syncFromSession, persist, clearPauseTimer]);

  const handleRepeat = useCallback(
    (mode: 'same' | 'slower') => {
      const session = sessionRef.current;
      if (!session) return;
      clearPauseTimer();
      audioRef.current?.pause();
      const current = session.repeat(mode);
      syncFromSession();
      void speak(current);
    },
    [speak, syncFromSession, clearPauseTimer],
  );

  const handleChoice = useCallback(
    (choiceKey: string) => {
      const session = sessionRef.current;
      if (!session) return;
      clearPauseTimer();
      audioRef.current?.pause();
      const next = session.selectChoice(choiceKey);
      syncFromSession();
      if (session.state === 'finished') return;
      void speak(next);
    },
    [speak, syncFromSession, clearPauseTimer],
  );

  /** Puts every narration file for this chapter into the browser cache. */
  const handleDownload = useCallback(async () => {
    if (!chapter) return;
    try {
      const cache = await caches.open('wonderbox-audio-v1');
      await cache.addAll(chapter.audio.map((track) => track.url));
      setCached(true);
    } catch {
      setCached(false);
    }
  }, [chapter]);

  useEffect(() => clearPauseTimer, [clearPauseTimer]);

  if (status === 'loading') {
    return (
      <p className="p-8 text-center text-lg" role="status">
        {copy.loading}
      </p>
    );
  }
  if (status === 'error' || !chapter || !node) {
    return (
      <p className="p-8 text-center text-lg" role="alert">
        {copy.error}
      </p>
    );
  }

  const choices = node.choices.filter((choice) => !choice.isRepeat && !choice.isSlower);
  // On the physical box the choice buttons are always live — a child does not
  // wait politely for the narrator to finish before pressing one, and being
  // able to press ahead is what makes a re-listen bearable.
  const showChoices = choices.length > 0;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Everything spoken is mirrored here for screen readers and for a
          parent glancing over. The buttons below do not depend on it. */}
      <div aria-live="polite" aria-atomic="true" className="sr-only-focusable absolute">
        {announcement}
        {awaitingChoice
          ? locale === 'nl'
            ? ' — Jouw beurt.'
            : ' — Your turn.'
          : ''}
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="font-semibold">{chapter.title}</p>
        <p className="flex items-center gap-3 text-[var(--color-ink-soft)]">
          {online ? null : <span className="font-semibold text-[var(--color-warn-ink)]">{copy.offline}</span>}
          {pendingCount > 0 ? <span>↑ {pendingCount}</span> : null}
          <button type="button" onClick={handleDownload} className="underline">
            {cached ? copy.downloaded : copy.download}
          </button>
        </p>
      </div>

      <div className="wb-card mb-6 min-h-[14rem] p-8">
        {/* The words being spoken. Mirrored into the live region above for
            screen readers, which is why tests target this by test id rather
            than by text — the same sentence deliberately appears twice. */}
        <p data-testid="companion-text" className="text-2xl leading-relaxed sm:text-3xl">
          {node.text}
        </p>
        {node.kind === 'safety' ? (
          <p className="mt-4 inline-block rounded-full bg-[var(--color-warn-tint)] px-3 py-1 text-sm font-bold text-[var(--color-warn-ink)]">
            ⚠ {locale === 'nl' ? 'Veiligheid' : 'Safety'}
          </p>
        ) : null}
        {node.servedLocale !== locale ? (
          <p className="mt-4 text-sm text-[var(--color-ink-soft)]">
            {locale === 'nl'
              ? 'Deze zin is nog niet vertaald; je hoort de Engelse versie.'
              : 'This line is not translated yet; you are hearing another language.'}
          </p>
        ) : null}
      </div>

      {finished ? (
        <p className="wb-card p-6 text-center text-xl font-bold" role="status">
          {copy.chapterDone}
        </p>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-3 gap-3">
            <button type="button" className="wb-companion-button" onClick={handlePlay}>
              <span aria-hidden="true" className="text-3xl">
                {playing ? '⏸' : '▶'}
              </span>
              {playing ? copy.pause : copy.play}
            </button>
            <button
              type="button"
              className="wb-companion-button"
              onClick={() => handleRepeat('same')}
            >
              <span aria-hidden="true" className="text-3xl">
                ↺
              </span>
              {copy.repeat}
            </button>
            <button
              type="button"
              className="wb-companion-button"
              onClick={() => handleRepeat('slower')}
              aria-pressed={slow}
            >
              <span aria-hidden="true" className="text-3xl">
                🐢
              </span>
              {copy.slower}
            </button>
          </div>

          {showChoices ? (
            <div
              className="grid gap-3 sm:grid-cols-2"
              role="group"
              aria-label={
                awaitingChoice
                  ? locale === 'nl'
                    ? 'Jouw beurt — kies iets'
                    : 'Your turn — pick something'
                  : locale === 'nl'
                    ? 'Wat wil je zeggen?'
                    : 'What do you want to say?'
              }
            >
              {choices.map((choice) => (
                <button
                  key={choice.key}
                  type="button"
                  className="wb-companion-button"
                  onClick={() => handleChoice(choice.key)}
                >
                  {choice.label}
                </button>
              ))}
            </div>
          ) : null}
        </>
      )}

      {/* No <track>: the caption for this audio is the text above, which is the
          same words rendered visibly and mirrored into the live region. */}
      <audio ref={audioRef} preload="auto" className="sr-only-focusable absolute" />
    </div>
  );
}
