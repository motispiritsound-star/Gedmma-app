import { describe, expect, it } from 'vitest';
import {
  ActivationCodeSchema,
  CommandSchema,
  EventSchema,
  LoopbackTransport,
  PROTOCOL_VERSION,
  decodeEnvelope,
  encodeCommand,
  encodeEvent,
  isCompatible,
  normaliseActivationCode,
  request,
  type Command,
  type CompanionEvent,
} from '../src/index.ts';

/**
 * The wire contract.
 *
 * A device in a child's bedroom cannot be redeployed. So the encoder is strict
 * about what it sends and the decoder never throws on what it receives — a
 * companion that gets a garbled frame has to keep playing, not crash.
 */
describe('protocol versioning', () => {
  it('accepts the same major version and refuses a different one', () => {
    expect(isCompatible(PROTOCOL_VERSION)).toBe(true);
    expect(isCompatible('1.9.3')).toBe(true);
    expect(isCompatible('2.0.0')).toBe(false);
    expect(isCompatible('0.9.0')).toBe(false);
    expect(isCompatible('nonsense')).toBe(false);
  });
});

describe('command validation', () => {
  it('applies documented defaults so a terse device still sends valid frames', () => {
    const parsed = CommandSchema.parse({
      type: 'hello',
      deviceId: 'device-0001',
      protocolVersion: PROTOCOL_VERSION,
    });
    expect(parsed).toMatchObject({
      capabilities: { hasButtons: 4, canChangeSpeed: true, hasMicrophone: false, hasNfc: false },
    });
  });

  it('defaults the microphone to absent, because it is off by default', () => {
    const parsed = CommandSchema.parse({
      type: 'hello',
      deviceId: 'device-0002',
      protocolVersion: PROTOCOL_VERSION,
    });
    expect(parsed.type === 'hello' && parsed.capabilities.hasMicrophone).toBe(false);
  });

  it('normalises an activation code however it was typed or scanned', () => {
    expect(ActivationCodeSchema.parse(' wb-3f7k-22aa-m9x1 ')).toBe('WB-3F7K-22AA-M9X1');
    expect(normaliseActivationCode('wb 3f7k 22aa m9x1')).toBe('WB-3F7K-22AA-M9X1');
    expect(() => ActivationCodeSchema.parse('WB-IIII-LLLL-OOOO')).toThrow();
    expect(() => ActivationCodeSchema.parse('nope')).toThrow();
  });

  it('caps an offline batch so a broken device cannot flood the host', () => {
    const events = Array.from({ length: 501 }, (_, index) => ({
      clientEventId: `evt-${index}-padding`,
      type: 'nodePlayed' as const,
      occurredAt: new Date().toISOString(),
    }));
    expect(() =>
      CommandSchema.parse({ type: 'syncWhenOnline', activatedBoxId: 'box-1', events }),
    ).toThrow();
    expect(() =>
      CommandSchema.parse({
        type: 'syncWhenOnline',
        activatedBoxId: 'box-1',
        events: events.slice(0, 500),
      }),
    ).not.toThrow();
  });

  it('rejects a negative playback offset', () => {
    expect(() => CommandSchema.parse({ type: 'play', nodeId: 'n-1', offsetMs: -1 })).toThrow();
  });

  it('clamps volume to a sane range', () => {
    expect(() => CommandSchema.parse({ type: 'setVolume', level: 1.5 })).toThrow();
    expect(CommandSchema.parse({ type: 'setVolume', level: 0.5 })).toEqual({
      type: 'setVolume',
      level: 0.5,
    });
  });
});

describe('envelopes', () => {
  it('round-trips a command', () => {
    const envelope = encodeCommand({ type: 'pause', reason: 'child' });
    const decoded = decodeEnvelope(JSON.stringify(envelope));
    expect(decoded.ok).toBe(true);
    if (!decoded.ok) return;
    expect(decoded.envelope.payload.direction).toBe('command');
    expect(decoded.envelope.payload.body.type).toBe('pause');
    expect(decoded.envelope.v).toBe(PROTOCOL_VERSION);
  });

  it('round-trips an event', () => {
    const envelope = encodeEvent({
      type: 'ready',
      protocolVersion: PROTOCOL_VERSION,
      serverTime: new Date().toISOString(),
      accepted: true,
    });
    const decoded = decodeEnvelope(envelope);
    expect(decoded.ok).toBe(true);
  });

  it('gives every frame its own correlation id', () => {
    const a = encodeCommand({ type: 'pause', reason: 'child' });
    const b = encodeCommand({ type: 'pause', reason: 'child' });
    expect(a.correlationId).not.toBe(b.correlationId);
  });

  it('never throws on a malformed frame', () => {
    for (const bad of ['not json', '{}', '{"v":1}', null, 42, [], { payload: {} }]) {
      const result = decodeEnvelope(bad);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.length).toBeGreaterThan(0);
    }
  });

  it('rejects an envelope carrying an unknown command type', () => {
    const result = decodeEnvelope({
      v: PROTOCOL_VERSION,
      correlationId: 'cid-1',
      sentAt: new Date().toISOString(),
      payload: { direction: 'command', body: { type: 'selfDestruct' } },
    });
    expect(result.ok).toBe(false);
  });
});

describe('transport', () => {
  it('routes a command to the handler and returns its events', async () => {
    const seen: Command[] = [];
    const transport = new LoopbackTransport(async (command): Promise<CompanionEvent[]> => {
      seen.push(command);
      return [
        {
          type: 'ready',
          protocolVersion: PROTOCOL_VERSION,
          serverTime: '2026-03-01T10:00:00.000Z',
          accepted: true,
        },
      ];
    });

    const events = await request(transport, {
      type: 'hello',
      deviceId: 'device-0003',
      protocolVersion: PROTOCOL_VERSION,
      capabilities: {
        offlineStorageBytes: 0,
        hasNfc: false,
        hasButtons: 4,
        canChangeSpeed: true,
        hasMicrophone: false,
      },
    });

    expect(seen).toHaveLength(1);
    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe('ready');
    await transport.close();
  });

  it('echoes the correlation id so a device can match reply to request', async () => {
    const transport = new LoopbackTransport(async () => [
      { type: 'error', code: 'notFound', message: 'nope' },
    ]);
    const received: string[] = [];
    transport.subscribe((envelope) => received.push(envelope.correlationId));

    const envelope = encodeCommand({ type: 'pause', reason: 'child' });
    await transport.send(envelope);

    expect(received).toEqual([envelope.correlationId]);
    await transport.close();
  });

  it('refuses to send a malformed envelope', async () => {
    const transport = new LoopbackTransport(async () => []);
    await expect(
      transport.send({ v: '1', correlationId: '', sentAt: 'nope', payload: {} } as never),
    ).rejects.toThrow(/malformed/);
    await transport.close();
  });

  it('stops delivering after it is closed', async () => {
    const transport = new LoopbackTransport(async () => []);
    await transport.close();
    await expect(transport.send(encodeCommand({ type: 'pause', reason: 'child' }))).rejects.toThrow(
      /closed/,
    );
  });
});

describe('event validation', () => {
  it('records which locale was actually served, so a fallback is visible', () => {
    const parsed = EventSchema.parse({
      type: 'chapterLoaded',
      activatedBoxId: 'box-1',
      chapterId: 'chapter-1',
      title: 'Chapter',
      entryNodeId: 'n-1',
      locale: 'en',
      contentVersion: 3,
      nodes: [
        {
          id: 'n-1',
          key: 'intro',
          kind: 'narration',
          text: 'Hallo',
          servedLocale: 'nl',
          choices: [],
        },
      ],
      audio: [],
    });
    expect(parsed.type === 'chapterLoaded' && parsed.nodes[0]?.servedLocale).toBe('nl');
  });

  it('requires a positive content version, so unversioned content cannot ship', () => {
    expect(() =>
      EventSchema.parse({
        type: 'chapterLoaded',
        activatedBoxId: 'box-1',
        chapterId: 'chapter-1',
        title: 'Chapter',
        entryNodeId: 'n-1',
        locale: 'nl',
        contentVersion: 0,
        nodes: [],
        audio: [],
      }),
    ).toThrow();
  });

  it('carries the duplicate ids that make offline sync idempotent', () => {
    const parsed = EventSchema.parse({
      type: 'progressRecorded',
      activatedBoxId: 'box-1',
      acceptedClientEventIds: ['evt-00000001'],
      duplicateClientEventIds: ['evt-00000002'],
    });
    expect(parsed.type === 'progressRecorded' && parsed.duplicateClientEventIds).toEqual([
      'evt-00000002',
    ]);
  });
});
