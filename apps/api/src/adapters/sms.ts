import type { FastifyBaseLogger } from 'fastify';
import { type Locale } from '@buurklus/shared';
import type { Env } from '../env.js';

export interface SmsAdapter {
  send(params: { to: string; body: string }): Promise<void>;
}

/**
 * Development adapter: prints the message instead of sending it, so the OTP is
 * visible in the server log and no SMS credit is spent while building.
 */
class LogSmsAdapter implements SmsAdapter {
  constructor(private readonly logger: FastifyBaseLogger) {}

  async send({ to, body }: { to: string; body: string }): Promise<void> {
    this.logger.info({ to, body }, '[sms] would send');
  }
}

/**
 * Generic HTTP adapter. The Dutch SMS aggregators (MessageBird, CM.com,
 * Spryng) all expose a plain REST endpoint taking a sender id, a destination
 * and a body, so one adapter covers them with the endpoint supplied through
 * configuration.
 */
class HttpSmsAdapter implements SmsAdapter {
  constructor(
    private readonly env: Env,
    private readonly logger: FastifyBaseLogger,
  ) {}

  async send({ to, body }: { to: string; body: string }): Promise<void> {
    if (!this.env.SMS_ENDPOINT || !this.env.SMS_API_KEY) {
      throw new Error('SMS_PROVIDER=http requires SMS_ENDPOINT and SMS_API_KEY');
    }
    const response = await fetch(this.env.SMS_ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.env.SMS_API_KEY}`,
      },
      body: JSON.stringify({ sender: this.env.SMS_SENDER_ID, to, message: body }),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      this.logger.error({ status: response.status, text }, '[sms] delivery failed');
      throw new Error(`SMS delivery failed with status ${response.status}`);
    }
  }
}

export function createSmsAdapter(env: Env, logger: FastifyBaseLogger): SmsAdapter {
  return env.SMS_PROVIDER === 'http'
    ? new HttpSmsAdapter(env, logger)
    : new LogSmsAdapter(logger);
}

const OTP_TEMPLATES: Record<Locale, (code: string) => string> = {
  nl: (code) => `Buurklus: je inlogcode is ${code}. De code verloopt over 10 minuten.`,
  en: (code) => `Buurklus: your sign-in code is ${code}. It expires in 10 minutes.`,
};

export function otpMessage(code: string, locale: Locale): string {
  return OTP_TEMPLATES[locale](code);
}
