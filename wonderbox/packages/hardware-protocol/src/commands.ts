import { z } from 'zod';
import {
  ActivationCodeSchema,
  ClientEventIdSchema,
  DeviceIdSchema,
  IdSchema,
  LocaleSchema,
  NarrationSpeedSchema,
  TimestampSchema,
} from './primitives.ts';

/**
 * Commands flow host -> companion. The host is authoritative about *what*
 * should be playing; the companion is authoritative about *whether it is*
 * (its speaker may be muted, its battery may be flat). Every command is
 * acknowledged with an event.
 */

const base = <T extends string>(type: T) => z.object({ type: z.literal(type) });

/** Handshake. Sent once per connection before anything else. */
export const HelloCommandSchema = base('hello').extend({
  deviceId: DeviceIdSchema,
  protocolVersion: z.string().min(1),
  firmwareVersion: z.string().min(1).optional(),
  capabilities: z
    .object({
      offlineStorageBytes: z.number().int().nonnegative().default(0),
      hasNfc: z.boolean().default(false),
      hasButtons: z.number().int().min(0).max(12).default(4),
      canChangeSpeed: z.boolean().default(true),
      /** Speech-to-text is opt-in per family and off by default. */
      hasMicrophone: z.boolean().default(false),
    })
    .default({}),
});

/**
 * Binds a physical box to the family that owns it. The companion never sees
 * the raw code again after this: the host answers with an `activationResult`
 * carrying an opaque activatedBoxId.
 */
export const ActivateBoxCommandSchema = base('activateBox').extend({
  code: ActivationCodeSchema,
  /** Present when the code arrived from an NFC tag rather than being typed. */
  source: z.enum(['code', 'qr', 'nfc']).default('code'),
  childProfileId: IdSchema.optional(),
});

/** Fetches a chapter's dialogue graph and audio manifest for playback. */
export const LoadChapterCommandSchema = base('loadChapter').extend({
  activatedBoxId: IdSchema,
  chapterId: IdSchema,
  locale: LocaleSchema,
  /** Ask the host to include audio bytes/URLs for offline caching. */
  prefetchAudio: z.boolean().default(true),
});

export const PlayCommandSchema = base('play').extend({
  nodeId: IdSchema,
  speed: NarrationSpeedSchema.default('normal'),
  /** Resume position inside the node's audio, in milliseconds. */
  offsetMs: z.number().int().nonnegative().default(0),
});

export const PauseCommandSchema = base('pause').extend({
  reason: z.enum(['child', 'parent', 'inactivity', 'lowBattery', 'system']).default('child'),
});

/** Replays the current node from the start. The most-used button on the box. */
export const RepeatCommandSchema = base('repeat').extend({
  nodeId: IdSchema.optional(),
  /** `slower` re-narrates at reduced speed, the standard "I didn't catch that". */
  mode: z.enum(['same', 'slower']).default('same'),
});

/** Sets narration speed without restarting the current node. */
export const SetSpeedCommandSchema = base('setSpeed').extend({
  speed: NarrationSpeedSchema,
});

export const SelectChoiceCommandSchema = base('selectChoice').extend({
  nodeId: IdSchema,
  choiceKey: z.string().min(1).max(64),
  clientEventId: ClientEventIdSchema,
  occurredAt: TimestampSchema,
});

/** Host -> device authoritative progress restore (e.g. after a battery swap). */
export const SetProgressCommandSchema = base('setProgress').extend({
  activatedBoxId: IdSchema,
  chapterId: IdSchema,
  nodeId: IdSchema,
  offsetMs: z.number().int().nonnegative().default(0),
  completedChapterIds: z.array(IdSchema).default([]),
});

/**
 * Drains the device's offline queue. Each entry carries its own clientEventId
 * so the host can apply the batch exactly once, however often it is replayed.
 */
export const SyncWhenOnlineCommandSchema = base('syncWhenOnline').extend({
  activatedBoxId: IdSchema,
  deviceId: DeviceIdSchema.optional(),
  events: z
    .array(
      z.object({
        clientEventId: ClientEventIdSchema,
        type: z.enum([
          'chapterStarted',
          'nodePlayed',
          'choiceSelected',
          'repeated',
          'chapterCompleted',
          'journeyCompleted',
          'paused',
          'resumed',
        ]),
        chapterId: IdSchema.optional(),
        nodeId: IdSchema.optional(),
        choiceKey: z.string().max(64).optional(),
        occurredAt: TimestampSchema,
        listenedMs: z.number().int().nonnegative().max(24 * 60 * 60 * 1000).optional(),
      }),
    )
    .max(500),
});

export const SetVolumeCommandSchema = base('setVolume').extend({
  /** 0..1. The device clamps to its own parental maximum. */
  level: z.number().min(0).max(1),
});

export const CommandSchema = z.discriminatedUnion('type', [
  HelloCommandSchema,
  ActivateBoxCommandSchema,
  LoadChapterCommandSchema,
  PlayCommandSchema,
  PauseCommandSchema,
  RepeatCommandSchema,
  SetSpeedCommandSchema,
  SelectChoiceCommandSchema,
  SetProgressCommandSchema,
  SyncWhenOnlineCommandSchema,
  SetVolumeCommandSchema,
]);

export type Command = z.infer<typeof CommandSchema>;
export type CommandType = Command['type'];
export type CommandOf<T extends CommandType> = Extract<Command, { type: T }>;

export const COMMAND_TYPES = [
  'hello',
  'activateBox',
  'loadChapter',
  'play',
  'pause',
  'repeat',
  'setSpeed',
  'selectChoice',
  'setProgress',
  'syncWhenOnline',
  'setVolume',
] as const satisfies readonly CommandType[];
