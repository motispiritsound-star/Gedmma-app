import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'
import { getEnv } from '@/env'

/**
 * Prisma 7 connects through a driver adapter. In development Next.js reloads
 * modules on every edit, so the client is cached on `globalThis` to avoid
 * exhausting the connection pool.
 */

const globalForPrisma = globalThis as unknown as { questlyPrisma?: PrismaClient }

function createClient(): PrismaClient {
  const env = getEnv()
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL })
  return new PrismaClient({
    adapter,
    log: env.LOG_LEVEL === 'debug' ? ['query', 'warn', 'error'] : ['warn', 'error'],
  })
}

export const prisma: PrismaClient = globalForPrisma.questlyPrisma ?? createClient()

if (getEnv().NODE_ENV !== 'production') {
  globalForPrisma.questlyPrisma = prisma
}
