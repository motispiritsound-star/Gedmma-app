/**
 * Retention job.
 *
 * Hard-deletes families whose deletion grace period has expired and trims the
 * audit log to its retention window. Intended to run daily from cron:
 *   0 3 * * *  cd /srv/questly && npm run retention:purge
 */
import { purgeExpiredDeletions } from '../src/modules/privacy/service'
import { logger } from '../src/lib/logger'

async function main() {
  const result = await purgeExpiredDeletions()
  logger.info('retention.purge_completed', result)
  console.log(
    `Purged ${result.familiesPurged} families, ${result.mediaPurged} media objects and ${result.auditRowsPurged} audit rows.`,
  )
}

main().catch((error) => {
  logger.error('retention.purge_failed', { error })
  process.exitCode = 1
})
