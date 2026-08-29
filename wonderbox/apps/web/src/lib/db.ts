import { PrismaClient } from '@prisma/client';
import { env, isProduction } from './env.ts';

/**
 * One Prisma client per process. Next.js hot-reloads modules in development,
 * so the client is parked on globalThis to avoid exhausting the connection
 * pool after a dozen edits.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isProduction ? ['error'] : ['error', 'warn'],
    datasources: { db: { url: env.DATABASE_URL } },
  });

if (!isProduction) globalForPrisma.prisma = prisma;

/** Prisma's transaction client — the type every service accepts. */
export type Tx = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

/** Either a transaction or the root client, so services compose freely. */
export type Db = PrismaClient | Tx;
