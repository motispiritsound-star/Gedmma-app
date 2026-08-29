import { z } from 'zod';
import { DomainError } from './errors.js';
import {
  addDays,
  isClockTime,
  parseClockTime,
  startOfLocalDay,
  weekdayOf,
  type Weekday,
} from './time.js';

/** A named moment the family chooses to be together. */
export const focusKinds = ['dinner', 'homework', 'bedtime', 'family_time', 'custom'] as const;
export type FocusKind = (typeof focusKinds)[number];

export const focusScheduleSchema = z
  .object({
    id: z.string(),
    familyId: z.string(),
    agreementId: z.string().nullable().default(null),
    kind: z.enum(focusKinds),
    title: z.string().min(2).max(60),
    startsAt: z.string().refine(isClockTime, 'time_format'),
    durationMinutes: z.number().int().min(5).max(240),
    weekdays: z.array(z.number().int().min(0).max(6)).min(1),
    /** Who is expected. Adults are included by default, on purpose. */
    participantIds: z.array(z.string()).min(1),
    enabled: z.boolean().default(true),
    createdAt: z.coerce.date(),
  })
  .strict();
export type FocusSchedule = z.infer<typeof focusScheduleSchema>;

/** Next occurrence at or after `from`, or null if the schedule is disabled. */
export function nextOccurrence(schedule: FocusSchedule, from: Date): Date | null {
  if (!schedule.enabled || schedule.weekdays.length === 0) return null;
  const startMinute = parseClockTime(schedule.startsAt);
  for (let offset = 0; offset <= 7; offset += 1) {
    const day = addDays(from, offset);
    if (!schedule.weekdays.includes(weekdayOf(day) as Weekday)) continue;
    const candidate = new Date(startOfLocalDay(day).getTime() + startMinute * 60_000);
    if (candidate.getTime() >= from.getTime()) return candidate;
  }
  return null;
}

export function occurrencesInRange(
  schedule: FocusSchedule,
  from: Date,
  to: Date,
): Date[] {
  const result: Date[] = [];
  let cursor = from;
  for (let guard = 0; guard < 64; guard += 1) {
    const next = nextOccurrence(schedule, cursor);
    if (!next || next.getTime() > to.getTime()) break;
    result.push(next);
    cursor = new Date(next.getTime() + 60_000);
  }
  return result;
}

/* ------------------------------------------------------------------ */
/* Focus sessions: a local-first timer that survives being offline.     */
/* ------------------------------------------------------------------ */

export const pauseReasons = [
  'someone_needed_me',
  'urgent_call',
  'schoolwork',
  'changed_my_mind',
  'other',
] as const;
export type PauseReason = (typeof pauseReasons)[number];

export const focusEventTypes = ['start', 'pause', 'resume', 'complete', 'abandon'] as const;
export type FocusEventType = (typeof focusEventTypes)[number];

export const focusEventSchema = z
  .object({
    /** Client-generated, stable across retries. Duplicates are collapsed. */
    id: z.string().min(1).max(64),
    type: z.enum(focusEventTypes),
    at: z.coerce.date(),
    reason: z.enum(pauseReasons).nullable().default(null),
    /** True when the event was recorded while the device had no connection. */
    recordedOffline: z.boolean().default(false),
  })
  .strict();
export type FocusEvent = z.infer<typeof focusEventSchema>;

export const focusSessionStatuses = ['running', 'paused', 'completed', 'abandoned'] as const;
export type FocusSessionStatus = (typeof focusSessionStatuses)[number];

export const focusSessionSchema = z
  .object({
    id: z.string(),
    familyId: z.string(),
    scheduleId: z.string().nullable().default(null),
    /** Everyone taking part, adults included. */
    participantIds: z.array(z.string()).min(1),
    startedByUserId: z.string(),
    plannedMinutes: z.number().int().min(1).max(240),
    status: z.enum(focusSessionStatuses),
    events: z.array(focusEventSchema).default([]),
    /** Always 'app_observed': the app watched its own timer, nothing else. */
    source: z.literal('app_observed').default('app_observed'),
    createdAt: z.coerce.date(),
  })
  .strict();
export type FocusSession = z.infer<typeof focusSessionSchema>;

export interface SessionProgress {
  readonly status: FocusSessionStatus;
  readonly focusedMinutes: number;
  readonly pausedMinutes: number;
  readonly pauseCount: number;
  readonly reasons: readonly PauseReason[];
  readonly endedAt: Date | null;
}

function sortedEvents(events: readonly FocusEvent[]): FocusEvent[] {
  return events
    .slice()
    .sort((a, b) => a.at.getTime() - b.at.getTime() || a.id.localeCompare(b.id));
}

/**
 * Fold the event log into progress. Deliberately tolerant: a log that is
 * missing a `resume` (app killed while paused) still yields sane numbers
 * rather than throwing at the user.
 */
export function sessionProgress(
  session: Pick<FocusSession, 'events' | 'status'>,
  now: Date,
): SessionProgress {
  const events = sortedEvents(session.events);
  let focusedMs = 0;
  let pausedMs = 0;
  let pauseCount = 0;
  const reasons: PauseReason[] = [];
  let state: FocusSessionStatus | 'idle' = 'idle';
  let since: Date | null = null;
  let endedAt: Date | null = null;

  for (const event of events) {
    if (state === 'running' && since) focusedMs += event.at.getTime() - since.getTime();
    if (state === 'paused' && since) pausedMs += event.at.getTime() - since.getTime();

    switch (event.type) {
      case 'start':
        state = 'running';
        since = event.at;
        break;
      case 'pause':
        if (state === 'running') {
          pauseCount += 1;
          if (event.reason) reasons.push(event.reason);
        }
        state = 'paused';
        since = event.at;
        break;
      case 'resume':
        state = 'running';
        since = event.at;
        break;
      case 'complete':
        state = 'completed';
        since = null;
        endedAt = event.at;
        break;
      case 'abandon':
        state = 'abandoned';
        since = null;
        endedAt = event.at;
        break;
    }
  }

  if (since && (state === 'running' || state === 'paused')) {
    const delta = Math.max(0, now.getTime() - since.getTime());
    if (state === 'running') focusedMs += delta;
    else pausedMs += delta;
  }

  const status: FocusSessionStatus = state === 'idle' ? 'running' : state;
  return {
    status,
    focusedMinutes: Math.round(focusedMs / 60_000),
    pausedMinutes: Math.round(pausedMs / 60_000),
    pauseCount,
    reasons,
    endedAt,
  };
}

export interface ReconciliationResult {
  readonly session: FocusSession;
  readonly appliedEventIds: readonly string[];
  readonly duplicateEventIds: readonly string[];
  readonly rejectedEventIds: readonly string[];
  readonly clampedToServerTime: boolean;
}

const MAX_CLOCK_SKEW_MS = 10 * 60_000;

/**
 * Merge a queue of events recorded offline into the server's copy.
 *
 * Rules, in order of importance:
 *  1. Never lose a completed session because the phone was in flight mode.
 *  2. Never let a device clock invent focus time - events dated more than ten
 *     minutes in the future are clamped to server time and flagged.
 *  3. Duplicate ids (retried uploads) are collapsed, not appended.
 *  4. Events after a terminal event are rejected, so a stale queue cannot
 *     re-open a finished session.
 */
export function reconcileSession(args: {
  server: FocusSession;
  incoming: readonly FocusEvent[];
  serverNow: Date;
}): ReconciliationResult {
  const { server, incoming, serverNow } = args;
  const known = new Set(server.events.map((event) => event.id));
  const duplicates: string[] = [];
  const rejected: string[] = [];
  const applied: string[] = [];
  let clamped = false;

  const terminalAt = sortedEvents(server.events).find(
    (event) => event.type === 'complete' || event.type === 'abandon',
  )?.at;

  const merged = server.events.slice();
  for (const event of sortedEvents(incoming)) {
    if (known.has(event.id)) {
      duplicates.push(event.id);
      continue;
    }
    if (terminalAt && event.at.getTime() >= terminalAt.getTime()) {
      rejected.push(event.id);
      continue;
    }
    let at = event.at;
    if (at.getTime() > serverNow.getTime() + MAX_CLOCK_SKEW_MS) {
      at = serverNow;
      clamped = true;
    }
    if (at.getTime() < server.createdAt.getTime()) {
      at = server.createdAt;
      clamped = true;
    }
    merged.push({ ...event, at });
    known.add(event.id);
    applied.push(event.id);
  }

  const progress = sessionProgress({ events: merged, status: server.status }, serverNow);
  return {
    session: { ...server, events: sortedEvents(merged), status: progress.status },
    appliedEventIds: applied,
    duplicateEventIds: duplicates,
    rejectedEventIds: rejected,
    clampedToServerTime: clamped,
  };
}

export function assertParticipant(session: FocusSession, userId: string): void {
  if (!session.participantIds.includes(userId)) {
    throw DomainError.forbidden('focus.not_a_participant', { sessionId: session.id });
  }
}

/**
 * A focus moment "counts" when the family spent at least 60% of the planned
 * time focused. Pauses with a reason are explicitly fine - the product is not
 * interested in perfection.
 */
export const COMPLETION_RATIO = 0.6;

export function countsAsCompleted(
  session: Pick<FocusSession, 'events' | 'status' | 'plannedMinutes'>,
  now: Date,
): boolean {
  const progress = sessionProgress(session, now);
  if (progress.status !== 'completed') return false;
  return progress.focusedMinutes >= Math.ceil(session.plannedMinutes * COMPLETION_RATIO);
}
