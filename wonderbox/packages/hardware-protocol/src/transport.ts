import type { Command } from './commands.ts';
import type { CompanionEvent } from './events.ts';
import { decodeEnvelope, encodeCommand, type Envelope } from './envelope.ts';

/**
 * A transport moves envelopes. The MVP ships two implementations: an in-memory
 * one used by the browser emulator and the tests, and an HTTP one used by the
 * PWA companion. A BLE transport can be added without touching callers.
 */
export interface CompanionTransport {
  send(envelope: Envelope): Promise<void>;
  subscribe(listener: (envelope: Envelope) => void): () => void;
  close(): Promise<void>;
}

export type CommandHandler = (command: Command, correlationId: string) => Promise<CompanionEvent[]>;

/**
 * Loopback transport: the "device" and the "host" live in the same process.
 * This is what the browser emulator and the protocol tests drive.
 */
export class LoopbackTransport implements CompanionTransport {
  private listeners = new Set<(envelope: Envelope) => void>();
  private closed = false;

  constructor(private readonly handler: CommandHandler) {}

  async send(envelope: Envelope): Promise<void> {
    if (this.closed) throw new Error('Transport is closed');
    const decoded = decodeEnvelope(envelope);
    if (!decoded.ok) throw new Error(`Refusing to send malformed envelope: ${decoded.error}`);
    if (decoded.envelope.payload.direction !== 'command') return;
    const events = await this.handler(decoded.envelope.payload.body, decoded.envelope.correlationId);
    for (const event of events) {
      this.emit({
        v: decoded.envelope.v,
        correlationId: decoded.envelope.correlationId,
        sentAt: new Date().toISOString(),
        payload: { direction: 'event', body: event },
      });
    }
  }

  private emit(envelope: Envelope): void {
    for (const listener of [...this.listeners]) listener(envelope);
  }

  subscribe(listener: (envelope: Envelope) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async close(): Promise<void> {
    this.closed = true;
    this.listeners.clear();
  }
}

/** Convenience wrapper: send one command, collect the events it produced. */
export async function request(
  transport: CompanionTransport,
  command: Command,
): Promise<CompanionEvent[]> {
  const envelope = encodeCommand(command);
  const collected: CompanionEvent[] = [];
  const unsubscribe = transport.subscribe((incoming) => {
    if (incoming.correlationId !== envelope.correlationId) return;
    if (incoming.payload.direction === 'event') collected.push(incoming.payload.body);
  });
  try {
    await transport.send(envelope);
  } finally {
    unsubscribe();
  }
  return collected;
}
