import { PrismaClient } from '@prisma/client';
import { env } from './env';

declare global {
  // eslint-disable-next-line no-var
  var __skillpassPrisma: PrismaClient | undefined;
}

function create(): PrismaClient {
  const config = env();
  const url = config.NODE_ENV === 'test' && config.TEST_DATABASE_URL ? config.TEST_DATABASE_URL : config.DATABASE_URL;
  return new PrismaClient({
    datasources: { db: { url } },
    log: config.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

// A single client per process; Next.js dev mode reloads modules constantly.
export const prisma: PrismaClient = globalThis.__skillpassPrisma ?? create();

if (env().NODE_ENV !== 'production') {
  globalThis.__skillpassPrisma = prisma;
}

export type { Prisma } from '@prisma/client';
