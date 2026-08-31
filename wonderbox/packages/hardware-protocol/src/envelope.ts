import { z } from 'zod';
import { CommandSchema } from './commands.ts';
import { EventSchema } from './events.ts';
import { PROTOCOL_VERSION } from './version.ts';

/**
 * Every frame on the wire is an envelope. Framing is transport-agnostic: the
 * same JSON travels over the browser emulator's postMessage channel, over the
 * HTTP companion API, and (later) over BLE GATT writes.
 */
export const EnvelopeSchema = z.object({
  v: z.string().min(1).default(PROTOCOL_VERSION),
  /** Unique per frame; a reply echoes it so a device can match request to result. */
  correlationId: z.string().min(1).max(128),
  sentAt: z.string().datetime({ offset: true }),
  payload: z.union([
    z.object({ direction: z.literal('command'), body: CommandSchema }),
    z.object({ direction: z.literal('event'), body: EventSchema }),
  ]),
});

export type Envelope = z.infer<typeof EnvelopeSchema>;

let counter = 0;

/** Correlation ids are random when crypto is available, monotonic otherwise. */
export function newCorrelationId(): string {
  const globalCrypto = (globalThis as { crypto?: Crypto }).crypto;
  if (globalCrypto?.randomUUID) return globalCrypto.randomUUID();
  counter += 1;
  return `cid-${Date.now().toString(36)}-${counter.toString(36)}`;
}

export function encodeCommand(
  body: z.input<typeof CommandSchema>,
  correlationId = newCorrelationId(),
): Envelope {
  return EnvelopeSchema.parse({
    v: PROTOCOL_VERSION,
    correlationId,
    sentAt: new Date().toISOString(),
    payload: { direction: 'command', body },
  });
}

export function encodeEvent(
  body: z.input<typeof EventSchema>,
  correlationId = newCorrelationId(),
): Envelope {
  return EnvelopeSchema.parse({
    v: PROTOCOL_VERSION,
    correlationId,
    sentAt: new Date().toISOString(),
    payload: { direction: 'event', body },
  });
}

export type DecodeResult =
  | { ok: true; envelope: Envelope }
  | { ok: false; error: string };

/**
 * Decodes an untrusted frame. Never throws: a companion that receives garbage
 * must stay playing rather than crash in a child's hands.
 */
export function decodeEnvelope(raw: unknown): DecodeResult {
  const source = typeof raw === 'string' ? safeJson(raw) : raw;
  if (source === undefined) return { ok: false, error: 'Frame is not valid JSON' };
  const parsed = EnvelopeSchema.safeParse(source);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') };
  }
  return { ok: true, envelope: parsed.data };
}

function safeJson(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return undefined;
  }
}
