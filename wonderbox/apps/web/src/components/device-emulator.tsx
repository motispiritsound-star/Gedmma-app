'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CompanionSession,
  LoopbackTransport,
  PROTOCOL_VERSION,
  decodeEnvelope,
  encodeCommand,
  isCompatible,
  normaliseActivationCode,
  type ChapterLoadedEvent,
  type Command,
  type CompanionEvent,
  type Envelope,
} from '@wonderbox/hardware-protocol';

/**
 * Device emulator.
 *
 * Where the companion player is what a *child* sees, this is what an *engineer*
 * sees: the same protocol, with every frame on the wire printed out. It exists
 * so the hardware team can develop firmware against a running host, and so a
 * protocol change that breaks a device breaks this page first.
 *
 * The transport is a loopback: the "device" half runs in this component, and
 * its command handler is the only thing that talks to the server. Swapping in
 * a BLE or WebSocket transport would not change a line below.
 */

interface Props {
  readonly boxes: ReadonlyArray<{ id: string; title: string; chapters: { id: string; title: string }[] }>;
  readonly locale: 'nl' | 'en';
}

interface LogLine {
  readonly id: string;
  readonly direction: 'command' | 'event';
  readonly type: string;
  readonly at: string;
  readonly body: unknown;
}

export function DeviceEmulator({ boxes, locale }: Props) {
  const [log, setLog] = useState<LogLine[]>([]);
  const [boxId, setBoxId] = useState(boxes[0]?.id ?? '');
  const [chapterId, setChapterId] = useState(boxes[0]?.chapters[0]?.id ?? '');
  const [code, setCode] = useState('WB-');
  const [connected, setConnected] = useState(false);
  const [chapter, setChapter] = useState<ChapterLoadedEvent | null>(null);
  const [currentText, setCurrentText] = useState('');
  const [pending, setPending] = useState(0);
  const [simulateOffline, setSimulateOffline] = useState(false);

  const sessionRef = useRef<CompanionSession | null>(null);
  const offlineRef = useRef(false);
  offlineRef.current = simulateOffline;

  const append = useCallback((envelope: Envelope) => {
    const body = envelope.payload.body as { type: string };
    setLog((previous) =>
      [
        {
          id: `${envelope.correlationId}-${envelope.payload.direction}-${body.type}-${previous.length}`,
          direction: envelope.payload.direction,
          type: body.type,
          at: envelope.sentAt,
          body,
        },
        ...previous,
      ].slice(0, 120),
    );
  }, []);

  /**
   * The device side of the loopback. This is deliberately the only place that
   * calls the network — everything else goes through the protocol.
   */
  const handler = useCallback(
    async (command: Command): Promise<CompanionEvent[]> => {
      switch (command.type) {
        case 'hello':
          return [
            {
              type: 'ready',
              protocolVersion: PROTOCOL_VERSION,
              serverTime: new Date().toISOString(),
              accepted: isCompatible(command.protocolVersion),
              ...(isCompatible(command.protocolVersion)
                ? {}
                : { reason: 'Incompatible protocol major version' }),
            },
          ];

        case 'activateBox': {
          const response = await fetch('/api/emulator/activate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: command.code }),
          });
          const result = (await response.json()) as {
            ok: boolean;
            activatedBoxId?: string;
            boxTitle?: string;
            error?: string;
          };
          return [
            {
              type: 'activationResult',
              ok: result.ok,
              ...(result.activatedBoxId ? { activatedBoxId: result.activatedBoxId } : {}),
              ...(result.boxTitle ? { boxTitle: result.boxTitle } : {}),
              ...(result.error
                ? { error: result.error as 'invalidCode' | 'alreadyActivated' | 'notOwned' | 'revoked' | 'rateLimited' }
                : {}),
            },
          ];
        }

        case 'loadChapter': {
          const url = `/api/companion/chapter?activatedBoxId=${encodeURIComponent(command.activatedBoxId)}&chapterId=${encodeURIComponent(command.chapterId)}&locale=${command.locale}`;
          const response = await fetch(url);
          if (!response.ok) {
            const problem = (await response.json()) as { code?: string; message?: string };
            return [
              {
                type: 'error',
                code:
                  problem.code === 'notApproved'
                    ? 'notApproved'
                    : response.status === 404
                      ? 'notFound'
                      : 'badRequest',
                message: problem.message ?? `HTTP ${response.status}`,
              },
            ];
          }
          const payload = (await response.json()) as ChapterLoadedEvent;
          const session = new CompanionSession(command.activatedBoxId);
          session.loadChapter(payload);
          sessionRef.current = session;
          setChapter(payload);
          setCurrentText(session.currentNode?.text ?? '');
          setPending(session.pendingEvents.length);
          return [payload];
        }

        case 'play': {
          const session = sessionRef.current;
          if (!session) return [{ type: 'error', code: 'badRequest', message: 'No chapter loaded' }];
          const node = session.play();
          setCurrentText(node.text);
          setPending(session.pendingEvents.length);
          return [
            {
              type: 'playbackState',
              nodeId: node.id,
              state: 'playing',
              speed: session.speed,
              offsetMs: command.offsetMs,
            },
          ];
        }

        case 'pause': {
          const session = sessionRef.current;
          if (!session) return [{ type: 'error', code: 'badRequest', message: 'No chapter loaded' }];
          session.pause();
          setPending(session.pendingEvents.length);
          return [
            {
              type: 'playbackState',
              nodeId: session.currentNode?.id ?? null,
              state: 'paused',
              speed: session.speed,
              offsetMs: 0,
            },
          ];
        }

        case 'repeat': {
          const session = sessionRef.current;
          if (!session) return [{ type: 'error', code: 'badRequest', message: 'No chapter loaded' }];
          const node = session.repeat(command.mode);
          setCurrentText(node.text);
          setPending(session.pendingEvents.length);
          return [
            { type: 'playbackState', nodeId: node.id, state: 'playing', speed: session.speed, offsetMs: 0 },
          ];
        }

        case 'setSpeed': {
          const session = sessionRef.current;
          if (!session) return [{ type: 'error', code: 'badRequest', message: 'No chapter loaded' }];
          session.setSpeed(command.speed);
          return [
            {
              type: 'playbackState',
              nodeId: session.currentNode?.id ?? null,
              state: session.state === 'playing' ? 'playing' : 'paused',
              speed: command.speed,
              offsetMs: 0,
            },
          ];
        }

        case 'selectChoice': {
          const session = sessionRef.current;
          if (!session) return [{ type: 'error', code: 'badRequest', message: 'No chapter loaded' }];
          const node = session.selectChoice(command.choiceKey);
          setCurrentText(node.text);
          setPending(session.pendingEvents.length);
          return [
            {
              type: 'playbackState',
              nodeId: node.id,
              state: session.state === 'finished' ? 'finished' : 'playing',
              speed: session.speed,
              offsetMs: 0,
            },
          ];
        }

        case 'setProgress': {
          const session = sessionRef.current;
          if (!session) return [{ type: 'error', code: 'badRequest', message: 'No chapter loaded' }];
          const node = session.restore(command.nodeId, command.offsetMs);
          setCurrentText(node.text);
          return [
            {
              type: 'playbackState',
              nodeId: node.id,
              state: 'paused',
              speed: session.speed,
              offsetMs: command.offsetMs,
            },
          ];
        }

        case 'syncWhenOnline': {
          const session = sessionRef.current;
          if (offlineRef.current) {
            return [
              {
                type: 'offlineQueued',
                pending: session?.pendingEvents.length ?? 0,
                oldestQueuedAt: session?.pendingEvents[0]?.occurredAt ?? null,
              },
            ];
          }
          const response = await fetch('/api/companion/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(command),
          });
          if (!response.ok) {
            return [{ type: 'error', code: 'serverError', message: `HTTP ${response.status}` }];
          }
          const result = (await response.json()) as {
            acceptedClientEventIds: string[];
            duplicateClientEventIds: string[];
          };
          session?.acknowledge([
            ...result.acceptedClientEventIds,
            ...result.duplicateClientEventIds,
          ]);
          setPending(session?.pendingEvents.length ?? 0);
          return [result as CompanionEvent];
        }

        case 'setVolume':
          return [
            {
              type: 'playbackState',
              nodeId: sessionRef.current?.currentNode?.id ?? null,
              state: 'idle',
              speed: sessionRef.current?.speed ?? 'normal',
              offsetMs: 0,
              volume: command.level,
            },
          ];

        default:
          return [{ type: 'error', code: 'badRequest', message: 'Unknown command' }];
      }
    },
    [],
  );

  const transport = useMemo(() => new LoopbackTransport(handler), [handler]);

  useEffect(() => {
    const unsubscribe = transport.subscribe(append);
    return () => {
      unsubscribe();
      void transport.close();
    };
  }, [transport, append]);

  const send = useCallback(
    async (command: Command) => {
      const envelope = encodeCommand(command);
      append(envelope);
      const decoded = decodeEnvelope(envelope);
      if (!decoded.ok) return;
      try {
        await transport.send(envelope);
      } catch (error) {
        // Surface transport failures on the wire log rather than the console:
        // this page is the debugging surface, so nothing may fail silently.
        append({
          ...envelope,
          payload: {
            direction: 'event',
            body: {
              type: 'error',
              code: 'serverError',
              message: error instanceof Error ? error.message : 'unknown',
            },
          },
        });
      }
    },
    [transport, append],
  );

  const selectedBox = boxes.find((box) => box.id === boxId);
  const session = sessionRef.current;
  const choices = session?.currentNode?.choices ?? [];

  const label = (nl: string, en: string) => (locale === 'nl' ? nl : en);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <section aria-labelledby="controls" className="space-y-4">
        <h2 id="controls" className="text-lg font-bold">
          {label('Bediening', 'Controls')}
        </h2>

        <div className="wb-card p-4">
          <h3 className="mb-2 font-semibold">1. hello</h3>
          <p className="mb-3 text-sm text-[var(--color-ink-soft)]">
            {label(
              `Handshake. De host weigert een apparaat met een andere hoofdversie dan ${PROTOCOL_VERSION}.`,
              `Handshake. The host refuses a device whose major version differs from ${PROTOCOL_VERSION}.`,
            )}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="wb-button wb-button-primary"
              onClick={async () => {
                await send({
                  type: 'hello',
                  deviceId: 'emulator-0001',
                  protocolVersion: PROTOCOL_VERSION,
                  firmwareVersion: '0.0.0-emulator',
                  capabilities: {
                    offlineStorageBytes: 64 * 1024 * 1024,
                    hasNfc: true,
                    hasButtons: 4,
                    canChangeSpeed: true,
                    hasMicrophone: false,
                  },
                });
                setConnected(true);
              }}
            >
              hello
            </button>
            <button
              type="button"
              className="wb-button wb-button-secondary"
              onClick={() =>
                send({
                  type: 'hello',
                  deviceId: 'emulator-legacy',
                  protocolVersion: '0.9.0',
                  capabilities: {
                    offlineStorageBytes: 0,
                    hasNfc: false,
                    hasButtons: 2,
                    canChangeSpeed: false,
                    hasMicrophone: false,
                  },
                })
              }
            >
              {label('oude firmware', 'old firmware')}
            </button>
          </div>
        </div>

        <div className="wb-card p-4">
          <h3 className="mb-2 font-semibold">2. activateBox</h3>
          <div className="flex gap-2">
            <label htmlFor="code" className="sr-only-focusable absolute">
              {label('Activatiecode', 'Activation code')}
            </label>
            <input
              id="code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              onBlur={() => setCode(normaliseActivationCode(code))}
              className="wb-input font-mono uppercase"
              placeholder="WB-____-____-____"
            />
            <button
              type="button"
              className="wb-button wb-button-secondary"
              onClick={() => send({ type: 'activateBox', code, source: 'nfc' })}
            >
              {label('via NFC', 'via NFC')}
            </button>
          </div>
        </div>

        <div className="wb-card p-4">
          <h3 className="mb-2 font-semibold">3. loadChapter</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            <select
              value={boxId}
              onChange={(event) => {
                setBoxId(event.target.value);
                const next = boxes.find((box) => box.id === event.target.value);
                setChapterId(next?.chapters[0]?.id ?? '');
              }}
              className="wb-input"
              aria-label={label('Doos', 'Box')}
            >
              {boxes.map((box) => (
                <option key={box.id} value={box.id}>
                  {box.title}
                </option>
              ))}
            </select>
            <select
              value={chapterId}
              onChange={(event) => setChapterId(event.target.value)}
              className="wb-input"
              aria-label={label('Hoofdstuk', 'Chapter')}
            >
              {(selectedBox?.chapters ?? []).map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.title}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="wb-button wb-button-primary mt-2"
            disabled={!connected || !boxId || !chapterId}
            onClick={() =>
              send({
                type: 'loadChapter',
                activatedBoxId: boxId,
                chapterId,
                locale,
                prefetchAudio: true,
              })
            }
          >
            loadChapter
          </button>
        </div>

        <div className="wb-card p-4">
          <h3 className="mb-2 font-semibold">4. {label('Afspelen', 'Playback')}</h3>
          <p className="mb-3 min-h-12 text-sm">{currentText || '—'}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="wb-button wb-button-secondary"
              disabled={!chapter}
              onClick={() =>
                send({ type: 'play', nodeId: session?.currentNode?.id ?? '', speed: 'normal', offsetMs: 0 })
              }
            >
              play
            </button>
            <button
              type="button"
              className="wb-button wb-button-secondary"
              disabled={!chapter}
              onClick={() => send({ type: 'pause', reason: 'child' })}
            >
              pause
            </button>
            <button
              type="button"
              className="wb-button wb-button-secondary"
              disabled={!chapter}
              onClick={() => send({ type: 'repeat', mode: 'same' })}
            >
              repeat
            </button>
            <button
              type="button"
              className="wb-button wb-button-secondary"
              disabled={!chapter}
              onClick={() => send({ type: 'repeat', mode: 'slower' })}
            >
              repeat(slower)
            </button>
            <button
              type="button"
              className="wb-button wb-button-secondary"
              disabled={!chapter}
              onClick={() => send({ type: 'setSpeed', speed: 'normal' })}
            >
              setSpeed
            </button>
            <button
              type="button"
              className="wb-button wb-button-secondary"
              disabled={!chapter}
              onClick={() => send({ type: 'setVolume', level: 0.6 })}
            >
              setVolume
            </button>
          </div>
          {choices.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {choices.map((choice) => (
                <button
                  key={choice.key}
                  type="button"
                  className="wb-button wb-button-secondary"
                  onClick={() =>
                    send({
                      type: 'selectChoice',
                      nodeId: session?.currentNode?.id ?? '',
                      choiceKey: choice.key,
                      clientEventId: `emu-${Date.now()}-${choice.key}`,
                      occurredAt: new Date().toISOString(),
                    })
                  }
                >
                  selectChoice · {choice.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="wb-card p-4">
          <h3 className="mb-2 font-semibold">5. syncWhenOnline</h3>
          <label className="mb-3 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={simulateOffline}
              onChange={(event) => setSimulateOffline(event.target.checked)}
            />
            {label('Doe alsof het apparaat offline is', 'Pretend the device is offline')}
          </label>
          <p className="mb-3 text-sm text-[var(--color-ink-soft)]">
            {label(
              `${pending} gebeurtenis(sen) in de wachtrij. Twee keer synchroniseren moet exact hetzelfde resultaat geven — dat is de idempotentie.`,
              `${pending} event(s) queued. Syncing twice must give exactly the same result — that is the idempotency.`,
            )}
          </p>
          <button
            type="button"
            className="wb-button wb-button-primary"
            disabled={!session}
            onClick={() =>
              send({
                type: 'syncWhenOnline',
                activatedBoxId: boxId,
                deviceId: 'emulator-0001',
                events: [...(session?.pendingEvents ?? [])],
              })
            }
          >
            syncWhenOnline
          </button>
        </div>
      </section>

      <section aria-labelledby="wire">
        <h2 id="wire" className="mb-3 text-lg font-bold">
          {label('Op de lijn', 'On the wire')}
        </h2>
        <ol className="max-h-[42rem] space-y-2 overflow-y-auto" aria-live="polite">
          {log.length === 0 ? (
            <li className="text-sm text-[var(--color-ink-soft)]">
              {label('Nog niets verstuurd.', 'Nothing sent yet.')}
            </li>
          ) : null}
          {log.map((line) => (
            <li
              key={line.id}
              className={`rounded-lg border p-3 text-xs ${
                line.direction === 'command'
                  ? 'border-[var(--color-brand)] bg-[var(--color-brand-soft)]'
                  : 'border-[var(--color-line)] bg-[var(--color-card)]'
              }`}
            >
              <p className="mb-1 font-mono font-bold">
                {line.direction === 'command' ? '→' : '←'} {line.type}
              </p>
              <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono">
                {JSON.stringify(line.body, null, 2)}
              </pre>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
