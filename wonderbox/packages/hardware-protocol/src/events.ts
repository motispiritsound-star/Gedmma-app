import { z } from 'zod';
import {
  ClientEventIdSchema,
  IdSchema,
  LocaleSchema,
  NarrationSpeedSchema,
  TimestampSchema,
} from './primitives.ts';

/**
 * Events flow companion -> host, plus host -> companion for command results.
 * Anything the parent later sees in a learning summary starts life here.
 */

const base = <T extends string>(type: T) => z.object({ type: z.literal(type) });

export const ReadyEventSchema = base('ready').extend({
  protocolVersion: z.string(),
  serverTime: TimestampSchema,
  /** False when the host speaks an incompatible major version. */
  accepted: z.boolean(),
  reason: z.string().optional(),
});

export const ActivationResultEventSchema = base('activationResult').extend({
  ok: z.boolean(),
  activatedBoxId: IdSchema.optional(),
  boxTitle: z.string().optional(),
  /** Reasons are deliberately coarse so a wrong code leaks nothing. */
  error: z
    .enum(['invalidCode', 'alreadyActivated', 'notOwned', 'revoked', 'rateLimited'])
    .optional(),
});

export const AudioTrackSchema = z.object({
  nodeId: IdSchema,
  locale: LocaleSchema,
  /**
   * Locale actually served. Differs from `locale` when the requested locale had
   * no approved recording and the fallback chain kicked in.
   */
  servedLocale: LocaleSchema,
  url: z.string().min(1),
  durationMs: z.number().int().nonnegative(),
  checksum: z.string().min(1),
  bytes: z.number().int().nonnegative().optional(),
});

export const ChapterLoadedEventSchema = base('chapterLoaded').extend({
  activatedBoxId: IdSchema,
  chapterId: IdSchema,
  title: z.string(),
  entryNodeId: IdSchema,
  locale: LocaleSchema,
  nodes: z.array(
    z.object({
      id: IdSchema,
      key: z.string(),
      kind: z.enum([
        'narration',
        'question',
        'hint',
        'pause',
        'experimentStep',
        'safety',
        'celebration',
      ]),
      text: z.string(),
      servedLocale: LocaleSchema,
      pauseSeconds: z.number().int().nonnegative().nullable().default(null),
      isTerminal: z.boolean().default(false),
      choices: z.array(
        z.object({
          key: z.string(),
          label: z.string(),
          targetNodeId: IdSchema.nullable(),
          isRepeat: z.boolean().default(false),
          isSlower: z.boolean().default(false),
        }),
      ),
    }),
  ),
  audio: z.array(AudioTrackSchema),
  /** Every chapter shipped to a device has passed human approval. */
  contentVersion: z.number().int().positive(),
});

export const PlaybackStateEventSchema = base('playbackState').extend({
  nodeId: IdSchema.nullable(),
  state: z.enum(['idle', 'playing', 'paused', 'awaitingChoice', 'finished']),
  speed: NarrationSpeedSchema,
  offsetMs: z.number().int().nonnegative(),
  volume: z.number().min(0).max(1).optional(),
});

export const ProgressRecordedEventSchema = base('progressRecorded').extend({
  activatedBoxId: IdSchema,
  /** Ids the host has now durably stored; the device may drop them. */
  acceptedClientEventIds: z.array(ClientEventIdSchema),
  /** Ids the host had already seen. Also safe to drop — this is the idempotency signal. */
  duplicateClientEventIds: z.array(ClientEventIdSchema).default([]),
  rejected: z
    .array(z.object({ clientEventId: ClientEventIdSchema, reason: z.string() }))
    .default([]),
  chapterCompleted: z.boolean().default(false),
  journeyCompleted: z.boolean().default(false),
});

export const OfflineQueuedEventSchema = base('offlineQueued').extend({
  pending: z.number().int().nonnegative(),
  oldestQueuedAt: TimestampSchema.nullable(),
});

export const DeviceStatusEventSchema = base('deviceStatus').extend({
  batteryPercent: z.number().int().min(0).max(100).optional(),
  online: z.boolean(),
  storageUsedBytes: z.number().int().nonnegative().optional(),
});

export const ProtocolErrorEventSchema = base('error').extend({
  code: z.enum([
    'badRequest',
    'unauthorised',
    'notFound',
    'notApproved',
    'incompatibleVersion',
    'rateLimited',
    'serverError',
  ]),
  message: z.string(),
  /** Echoes the correlationId of the command that failed, when there was one. */
  correlationId: z.string().optional(),
});

export const EventSchema = z.discriminatedUnion('type', [
  ReadyEventSchema,
  ActivationResultEventSchema,
  ChapterLoadedEventSchema,
  PlaybackStateEventSchema,
  ProgressRecordedEventSchema,
  OfflineQueuedEventSchema,
  DeviceStatusEventSchema,
  ProtocolErrorEventSchema,
]);

export type CompanionEvent = z.infer<typeof EventSchema>;
export type EventType = CompanionEvent['type'];
export type EventOf<T extends EventType> = Extract<CompanionEvent, { type: T }>;
export type AudioTrack = z.infer<typeof AudioTrackSchema>;
export type ChapterLoadedEvent = z.infer<typeof ChapterLoadedEventSchema>;
export type LoadedNode = ChapterLoadedEvent['nodes'][number];
