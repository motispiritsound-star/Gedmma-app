import { Mailbox, createMimeMessage } from 'mimetext';

/**
 * Builds the notification. Separated from sending so it can be tested without
 * Cloudflare: this function is where the bug was that lost every notification
 * for a day. `setHeader('Reply-To', someString)` throws — mimetext validates
 * that header against a Mailbox instance, not text — and the throw was being
 * swallowed by the caller, so nothing arrived and nothing complained.
 *
 * `replyTo` is the point of the whole message: pressing reply then writes to
 * the person who filled in the form, not to an address nobody reads. The
 * envelope sender stays this domain, because that is what Email Routing is
 * allowed to send as.
 */
export function buildNotification(options: {
  from: string;
  to: string;
  subject: string;
  lines: string[];
  replyTo?: { name?: string; addr: string };
}): string {
  const message = createMimeMessage();
  message.setSender({ name: 'Buurklus', addr: options.from });
  message.setRecipient(options.to);
  message.setSubject(options.subject);
  if (options.replyTo) message.setHeader('Reply-To', new Mailbox(options.replyTo));
  message.addMessage({ contentType: 'text/plain', data: options.lines.join('\n') });
  return message.asRaw();
}
