import "server-only";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

export type EmailMessage = {
  to: string;
  subject: string;
  body: string;
  /** Set when the message contains a one-time link that must not be logged. */
  sensitiveUrl?: string;
};

/**
 * Outbound email.
 *
 * No SMTP or transactional provider is wired up in this MVP. The interface
 * exists so a real sender can be dropped in without touching the auth module;
 * see README.md, "Known limitations".
 */
export interface EmailSender {
  readonly kind: "log" | "none";
  send(message: EmailMessage): Promise<void>;
}

/**
 * Development and test sender. Writes the message - including the one-time link -
 * to the structured log so a developer can complete the flow locally. Never
 * select this driver in production: the link is a bearer credential.
 */
export class LogEmailSender implements EmailSender {
  readonly kind = "log" as const;

  async send(message: EmailMessage): Promise<void> {
    logger.info("email.sent_to_log", {
      to: message.to,
      subject: message.subject,
      body: message.body,
      url: message.sensitiveUrl ?? null,
    });
  }
}

/** Production default until a real provider is configured: nothing is sent. */
export class NoopEmailSender implements EmailSender {
  readonly kind = "none" as const;

  async send(message: EmailMessage): Promise<void> {
    logger.warn("email.not_delivered_no_provider_configured", { subject: message.subject });
  }
}

let cached: EmailSender | null = null;

export function emailSender(): EmailSender {
  cached ??= env().EMAIL_DRIVER === "log" ? new LogEmailSender() : new NoopEmailSender();
  return cached;
}

export function setEmailSender(sender: EmailSender | null): void {
  cached = sender;
}
