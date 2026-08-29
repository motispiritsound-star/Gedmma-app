import { PrismaClient } from '@prisma/client';

/**
 * One client per process. Next.js dev-server hot reloads would otherwise open
 * a new pool on every edit until Postgres refuses the connection.
 */
const globalForPrisma = globalThis as unknown as { focusFamilyPrisma?: PrismaClient };

export function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.FOCUSFAMILY_LOG_SQL === '1' ? ['query', 'warn', 'error'] : ['warn', 'error'],
  });
}

export const prisma: PrismaClient = globalForPrisma.focusFamilyPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.focusFamilyPrisma = prisma;
}

export * from '@prisma/client';
