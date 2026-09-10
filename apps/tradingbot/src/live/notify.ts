/**
 * Outbound notifications for a run nobody is watching.
 *
 * Deliberately minimal, and deliberately failure-tolerant: a webhook that is
 * down must never stop the bot or, worse, leave it halfway through a decision.
 * Every send is fire-and-forget with a short timeout, and a failure is logged
 * rather than thrown.
 *
 * Nothing secret is ever sent. The payload carries prices, weights and equity —
 * no keys, no account identifiers, no file paths — because a webhook URL ends up
 * in a chat app, a log aggregator, and whatever sits between.
 */
export interface Notification {
  event: 'fill' | 'kill-switch' | 'started' | 'stopped';
  symbol: string;
  strategy: string;
  message: string;
  equity?: number;
  weight?: number;
  price?: number;
}

export interface Notifier {
  send(notification: Notification): Promise<void>;
}

/** A notifier that does nothing, used when no webhook is configured. */
export const silentNotifier: Notifier = {
  async send(): Promise<void> {
    // Nothing to do. Present so callers need no null checks.
  },
};

export function webhookNotifier(
  url: string,
  log: (line: string) => void,
  timeoutMs = 5_000,
): Notifier {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`--webhook is not a valid URL: ${url}`);
  }
  if (parsed.protocol !== 'https:') {
    throw new Error(`--webhook must be https, got ${parsed.protocol}. Plain HTTP leaks the payload.`);
  }

  return {
    async send(notification: Notification): Promise<void> {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ ...notification, at: new Date().toISOString() }),
          signal: controller.signal,
        });
        if (!response.ok) log(`  webhook answered ${response.status}`);
      } catch (error) {
        log(`  webhook failed: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
