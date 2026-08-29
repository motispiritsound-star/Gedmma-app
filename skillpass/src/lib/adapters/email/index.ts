import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { env } from '../../env';

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
  /** Correlates the email with the in-app notification it mirrors. */
  tag?: string;
}

export interface EmailProvider {
  readonly name: string;
  send(message: EmailMessage): Promise<{ id: string }>;
}

/**
 * Writes every message to ./storage/outbox as .eml-ish text and keeps the last
 * 50 in memory so development and tests can assert on them without SMTP.
 */
export class MockEmailProvider implements EmailProvider {
  readonly name = 'mock';
  private static readonly memory: (EmailMessage & { id: string; sentAt: Date })[] = [];

  constructor(private readonly outboxDir = join(process.cwd(), 'storage', 'outbox')) {}

  async send(message: EmailMessage): Promise<{ id: string }> {
    const id = `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    MockEmailProvider.memory.unshift({ ...message, id, sentAt: new Date() });
    MockEmailProvider.memory.length = Math.min(MockEmailProvider.memory.length, 50);
    try {
      await mkdir(this.outboxDir, { recursive: true });
      const body = [
        `From: ${env().EMAIL_FROM}`,
        `To: ${message.to}`,
        `Subject: ${message.subject}`,
        `X-SkillPass-Tag: ${message.tag ?? 'generic'}`,
        '',
        message.text,
      ].join('\n');
      await writeFile(join(this.outboxDir, `${id}.txt`), body, 'utf8');
    } catch (error) {
      // The outbox is a developer convenience; never fail a user journey on it.
      console.warn('[email] could not write to outbox', error);
    }
    return { id };
  }

  static outbox(): readonly (EmailMessage & { id: string; sentAt: Date })[] {
    return MockEmailProvider.memory;
  }

  static clear(): void {
    MockEmailProvider.memory.length = 0;
  }
}

/**
 * SMTP delivery is intentionally not implemented in the MVP: it would add a
 * dependency and a deliverability/compliance surface that has not been
 * reviewed. Configure EMAIL_PROVIDER=mock, or wire your ESP here.
 */
export class SmtpEmailProvider implements EmailProvider {
  readonly name = 'smtp';

  constructor(private readonly url: string) {}

  async send(): Promise<{ id: string }> {
    throw new Error(
      'SMTP delivery is not implemented in the MVP. Set EMAIL_PROVIDER=mock, or implement SmtpEmailProvider against your ESP.',
    );
  }
}

let instance: EmailProvider | null = null;

export function emailProvider(): EmailProvider {
  if (instance) return instance;
  const config = env();
  instance = config.EMAIL_PROVIDER === 'smtp' && config.SMTP_URL ? new SmtpEmailProvider(config.SMTP_URL) : new MockEmailProvider();
  return instance;
}

export function resetEmailProvider(): void {
  instance = null;
}
