import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { env } from "./env";

const globalForPrisma = globalThis as unknown as { questlyPrisma?: PrismaClient };

function createClient(): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: env().DATABASE_URL }),
    log: env().LOG_LEVEL === "debug" ? ["warn", "error", "query"] : ["warn", "error"],
  });
}

/**
 * A single Prisma client per process. Next.js dev mode re-evaluates modules on
 * every change, so the client is parked on `globalThis` to avoid exhausting the
 * connection pool.
 */
export const prisma: PrismaClient = globalForPrisma.questlyPrisma ?? createClient();

if (env().NODE_ENV !== "production") globalForPrisma.questlyPrisma = prisma;
