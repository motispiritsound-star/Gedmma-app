import { PrismaClient } from '@prisma/client';

/**
 * A single client per process. Kept on `globalThis` so `tsx watch` reloads do
 * not open a new pool on every file change during development.
 */
const globalForPrisma = globalThis as unknown as { buurklusPrisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.buurklusPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.buurklusPrisma = prisma;

export type { Prisma } from '@prisma/client';
