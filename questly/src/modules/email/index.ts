import { getEnv } from '@/env'
import { logger } from '@/lib/logger'

/**
 * E-mail delivery abstraction.
 *
 * The MVP ships two drivers: `console` (writes the message to the structured
 * log, which is how you find the verification link in development) and `noop`
 * (used by the test suite). A transactional provider slots in here without any
 * call-site changes.
 */

export type EmailMessage = {
  to: string
  subject: string
  body: string
}

export interface EmailProvider {
  readonly name: string
  send(message: EmailMessage): Promise<void>
}

class ConsoleEmailProvider implements EmailProvider {
  readonly name = 'console'
  async send(message: EmailMessage): Promise<void> {
    logger.info('email.sent', {
      driver: this.name,
      to: message.to,
      subject: message.subject,
      body: message.body,
    })
  }
}

class NoopEmailProvider implements EmailProvider {
  readonly name = 'noop'
  async send(): Promise<void> {
    /* intentionally empty */
  }
}

let provider: EmailProvider | null = null

export function getEmailProvider(): EmailProvider {
  provider ??= getEnv().EMAIL_DRIVER === 'noop' ? new NoopEmailProvider() : new ConsoleEmailProvider()
  return provider
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  await getEmailProvider().send(message)
}
