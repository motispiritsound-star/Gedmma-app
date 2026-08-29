'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * The focus screen.
 *
 * The timer runs entirely on this device. Events are appended to a local queue
 * first and flushed to the server when there is a connection; if the tab is
 * closed and reopened, the queue is restored from localStorage and the elapsed
 * time is recomputed from the events rather than from a counter, so a phone in
 * flight mode produces the same result as one on wifi.
 */
type EventType = 'start' | 'pause' | 'resume' | 'complete' | 'abandon';

interface LocalEvent {
  id: string;
  type: EventType;
  at: string;
  reason?: string | null;
  recordedOffline: boolean;
}

export interface FocusTimerProps {
  readonly sessionId: string;
  readonly plannedMinutes: number;
  readonly title: string;
  readonly labels: {
    start: string;
    pause: string;
    resume: string;
    complete: string;
    abandon: string;
    offlineNote: string;
    pausePrompt: string;
    reasons: Array<{ value: string; label: string }>;
    focused: string;
    paused: string;
    offlineQueued: string;
    synced: string;
  };
  /** Same-origin proxy route; the session cookie never crosses an origin. */
  readonly syncUrl: string;
}

function storageKey(sessionId: string): string {
  return `focusfamily.session.${sessionId}`;
}

function foldEvents(events: readonly LocalEvent[], now: number) {
  const sorted = [...events].sort((a, b) => a.at.localeCompare(b.at));
  let focused = 0;
  let paused = 0;
  let state: 'idle' | 'running' | 'paused' | 'done' = 'idle';
  let since = 0;

  for (const event of sorted) {
    const at = Date.parse(event.at);
    if (state === 'running') focused += at - since;
    if (state === 'paused') paused += at - since;
    switch (event.type) {
      case 'start':
      case 'resume':
        state = 'running';
        since = at;
        break;
      case 'pause':
        state = 'paused';
        since = at;
        break;
      case 'complete':
      case 'abandon':
        state = 'done';
        break;
    }
  }
  if (state === 'running') focused += now - since;
  if (state === 'paused') paused += now - since;
  return { focusedMs: focused, pausedMs: paused, state };
}

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function FocusTimer({
  sessionId,
  plannedMinutes,
  title,
  labels,
  syncUrl,
}: FocusTimerProps) {
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [online, setOnline] = useState(true);
  const [askingReason, setAskingReason] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const flushing = useRef(false);

  // Restore anything this device recorded before, including while offline.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey(sessionId));
      if (raw) {
        const parsed = JSON.parse(raw) as { events: LocalEvent[]; pending: string[] };
        setEvents(parsed.events ?? []);
        setPendingIds(parsed.pending ?? []);
      }
    } catch {
      // A blocked storage API is not a reason to stop the timer.
    }
    setOnline(navigator.onLine);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [sessionId]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        storageKey(sessionId),
        JSON.stringify({ events, pending: pendingIds }),
      );
    } catch {
      // Ignore: the queue still lives in memory for this session.
    }
  }, [events, pendingIds, sessionId]);

  useEffect(() => {
    const handle = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(handle);
  }, []);

  const flush = useCallback(async () => {
    if (flushing.current || pendingIds.length === 0 || !navigator.onLine) return;
    flushing.current = true;
    const queued = events.filter((event) => pendingIds.includes(event.id));
    try {
      const response = await fetch(syncUrl, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ events: queued }),
      });
      if (response.ok) {
        const body = (await response.json()) as { applied: string[]; duplicates: string[] };
        const settled = new Set([...body.applied, ...body.duplicates]);
        setPendingIds((current) => current.filter((id) => !settled.has(id)));
      }
    } catch {
      // Stay queued; the next attempt will pick it up.
    } finally {
      flushing.current = false;
    }
  }, [events, pendingIds, syncUrl]);

  useEffect(() => {
    void flush();
  }, [flush, online]);

  const append = useCallback(
    (type: EventType, reason?: string) => {
      const event: LocalEvent = {
        id: `${sessionId}-${type}-${Date.now()}`,
        type,
        at: new Date().toISOString(),
        reason: reason ?? null,
        recordedOffline: typeof navigator !== 'undefined' && !navigator.onLine,
      };
      setEvents((current) => [...current, event]);
      setPendingIds((current) => [...current, event.id]);
    },
    [sessionId],
  );

  const { focusedMs, pausedMs, state } = foldEvents(events, now);
  const targetMs = plannedMinutes * 60_000;
  const remaining = Math.max(0, targetMs - focusedMs);

  return (
    <div className="timer-shell stack">
      <h1>{title}</h1>

      <p
        className="timer"
        aria-live="polite"
        aria-atomic="true"
        role="timer"
        aria-label={`${labels.focused}: ${formatDuration(focusedMs)}`}
      >
        {formatDuration(state === 'idle' ? targetMs : remaining)}
      </p>

      <p style={{ color: 'var(--ink-soft)', margin: '0 auto' }}>
        {labels.focused}: {formatDuration(focusedMs)} · {labels.paused}:{' '}
        {formatDuration(pausedMs)}
      </p>

      {!online ? (
        <p className="notice notice--warm" style={{ maxWidth: '44ch', margin: '0 auto' }}>
          {labels.offlineNote}
        </p>
      ) : null}

      {pendingIds.length > 0 ? (
        <p className="badge badge--quiet">
          {labels.offlineQueued} ({pendingIds.length})
        </p>
      ) : events.length > 0 ? (
        <p className="badge">{labels.synced}</p>
      ) : null}

      {askingReason ? (
        <div className="card" style={{ maxWidth: '32rem', margin: '0 auto', textAlign: 'left' }}>
          <fieldset style={{ border: 0, padding: 0 }}>
            <legend style={{ fontWeight: 600, padding: 0 }}>{labels.pausePrompt}</legend>
            <div className="stack" style={{ marginTop: '12px' }}>
              {labels.reasons.map((reason) => (
                <button
                  key={reason.value}
                  type="button"
                  className="btn btn--secondary"
                  style={{ width: '100%' }}
                  onClick={() => {
                    append('pause', reason.value);
                    setAskingReason(false);
                  }}
                >
                  {reason.label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      ) : (
        <div className="timer-actions">
          {state === 'idle' ? (
            <button type="button" className="btn btn--big" onClick={() => append('start')}>
              {labels.start}
            </button>
          ) : null}
          {state === 'running' ? (
            <>
              <button
                type="button"
                className="btn btn--big btn--secondary"
                onClick={() => setAskingReason(true)}
              >
                {labels.pause}
              </button>
              <button type="button" className="btn btn--big" onClick={() => append('complete')}>
                {labels.complete}
              </button>
            </>
          ) : null}
          {state === 'paused' ? (
            <>
              <button type="button" className="btn btn--big" onClick={() => append('resume')}>
                {labels.resume}
              </button>
              <button
                type="button"
                className="btn btn--big btn--secondary"
                onClick={() => append('abandon')}
              >
                {labels.abandon}
              </button>
            </>
          ) : null}
          {state === 'done' ? (
            <p className="notice notice--good" style={{ margin: '0 auto' }}>
              {labels.complete}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
