/**
 * Runs the retention sweep once and prints what it did.
 *
 * Storage limitation (Article 5(1)(e)) is not a thing you promise in a privacy
 * statement, it is a thing that has to actually happen on a schedule. This is
 * the schedule's entry point: `node --run retention`, nightly, from cron or
 * whatever runs jobs in the deployment. It is idempotent, so a double run is
 * harmless and a missed night is caught the following one.
 *
 * It exits non-zero if the sweep fails, so a failed night is visible to
 * whatever is watching rather than disappearing into a log nobody reads.
 */
import { PrismaClient } from '@prisma/client';
import { NotificationService } from '../services/notification.service.js';
import { PrivacyService } from '../services/privacy.service.js';

const prisma = new PrismaClient();

// The sweep sends a warning notification before erasing a dormant account, and
// the notification service wants a logger. Console is the right one here: this
// runs from cron, where stdout is the log.
const logger = {
  info: (...args: unknown[]) => console.log(...args),
  warn: (...args: unknown[]) => console.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
  debug: () => {},
  trace: () => {},
  fatal: (...args: unknown[]) => console.error(...args),
  child: () => logger,
  level: 'info',
  silent: () => {},
} as unknown as ConstructorParameters<typeof NotificationService>[1];

async function main() {
  const privacy = new PrivacyService(prisma, new NotificationService(prisma, logger));
  const result = await privacy.sweep();

  console.log('Bewaartermijnen opgeschoond:');
  for (const [key, value] of Object.entries(result)) {
    console.log(`  ${key.padEnd(20)} ${String(value)}`);
  }
}

main()
  .catch((error) => {
    console.error('Opschonen mislukt:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
