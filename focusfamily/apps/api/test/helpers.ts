import { execFileSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { seedContent, seedDemoFamily } from '@focusfamily/db';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { CSRF_COOKIE, CSRF_HEADER, SESSION_COOKIE } from '../src/security.js';

export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/focusfamily_test?schema=public';

let prisma: PrismaClient | undefined;

/**
 * The suite talks to a real PostgreSQL database, because the interesting bugs
 * in this codebase live in transactions, unique constraints and cascades - not
 * in a hand-written fake. `npm run test:setup` applies the migrations first.
 */
export async function getPrisma(): Promise<PrismaClient> {
  if (!prisma) {
    prisma = new PrismaClient({ datasources: { db: { url: TEST_DATABASE_URL } } });
    await prisma.$connect();
  }
  return prisma;
}

export function applyMigrations(): void {
  execFileSync(
    'npx',
    ['prisma', 'migrate', 'deploy', '--schema', 'packages/db/prisma/schema.prisma'],
    {
      cwd: new URL('../../..', import.meta.url).pathname,
      env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
      stdio: 'pipe',
    },
  );
}

export async function resetDatabase(): Promise<PrismaClient> {
  const client = await getPrisma();
  await client.$executeRawUnsafe(`
    TRUNCATE TABLE
      audit_logs, deletion_requests, data_export_requests, notification_preferences,
      entitlements, subscriptions, achievements, goal_contributions, goals,
      check_ins, focus_session_events, focus_sessions, focus_schedules,
      agreement_rules, family_agreements, consent_records, usage_summaries,
      measurement_sources, devices, child_profiles, invitations, memberships,
      auth_sessions, families, users
    RESTART IDENTITY CASCADE
  `);
  return client;
}

export async function buildTestApp(): Promise<{ app: FastifyInstance; prisma: PrismaClient }> {
  const client = await resetDatabase();
  const config = loadConfig({
    NODE_ENV: 'test',
    DATABASE_URL: TEST_DATABASE_URL,
    SESSION_SECRET: 'test-secret-that-is-long-enough-for-tests',
    ALLOWED_ORIGINS: 'http://localhost:3000',
    WEB_BASE_URL: 'http://localhost:3000',
  } as NodeJS.ProcessEnv);
  const app = await buildApp({ config, prisma: client, logger: false });
  await app.ready();
  return { app, prisma: client };
}

export async function seedDemo(client: PrismaClient) {
  await seedContent(client);
  return seedDemoFamily(client);
}

/** A tiny cookie jar so tests exercise the real session and CSRF handshake. */
export class Client {
  private cookies = new Map<string, string>();

  constructor(private readonly app: FastifyInstance) {}

  private cookieHeader(): string {
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  }

  private absorb(raw: string | string[] | undefined): void {
    if (!raw) return;
    for (const cookie of Array.isArray(raw) ? raw : [raw]) {
      const [pair] = cookie.split(';');
      const index = pair?.indexOf('=') ?? -1;
      if (!pair || index === -1) continue;
      const name = pair.slice(0, index);
      const value = decodeURIComponent(pair.slice(index + 1));
      if (value === '') this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
  }

  get csrf(): string | undefined {
    return this.cookies.get(CSRF_COOKIE);
  }

  get hasSession(): boolean {
    return this.cookies.has(SESSION_COOKIE);
  }

  /** Drop the CSRF cookie to prove the check actually bites. */
  forgetCsrf(): void {
    this.cookies.delete(CSRF_COOKIE);
  }

  async request(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    url: string,
    options: { body?: unknown; csrf?: string | null; origin?: string } = {},
  ) {
    const headers: Record<string, string> = {
      cookie: this.cookieHeader(),
      origin: options.origin ?? 'http://localhost:3000',
    };
    if (method !== 'GET') {
      const token = options.csrf === undefined ? this.csrf : options.csrf;
      if (token) headers[CSRF_HEADER] = token;
    }
    const response = await this.app.inject({
      method,
      url,
      headers,
      ...(options.body === undefined ? {} : { payload: options.body as object }),
    });
    this.absorb(response.headers['set-cookie'] as string | string[] | undefined);
    return response;
  }

  get(url: string) {
    return this.request('GET', url);
  }
  post(url: string, body?: unknown, options?: { csrf?: string | null; origin?: string }) {
    return this.request('POST', url, { body, ...options });
  }
  patch(url: string, body?: unknown) {
    return this.request('PATCH', url, { body });
  }
  delete(url: string) {
    return this.request('DELETE', url);
  }

  async signIn(email: string, password = 'focusfamily-demo-2026') {
    const response = await this.post('/auth/sign-in', { email, password });
    if (response.statusCode !== 200) {
      throw new Error(`sign-in failed: ${response.statusCode} ${response.body}`);
    }
    return response;
  }
}
