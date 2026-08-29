import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

// Next.js loads .env itself; scripts and test runners do not. Loading here is
// idempotent and never overrides an already-set variable.
loadDotenv({ override: false, quiet: true });

const boolish = z
  .union([z.boolean(), z.string()])
  .transform((value) => (typeof value === 'boolean' ? value : ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())));

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  SESSION_SECRET: z.string().min(24, 'SESSION_SECRET must be at least 24 characters'),
  MEDIA_SIGNING_SECRET: z.string().min(24, 'MEDIA_SIGNING_SECRET must be at least 24 characters'),

  DATABASE_URL: z.string().min(1),
  TEST_DATABASE_URL: z.string().optional(),

  DEFAULT_CITY_SLUG: z.string().default('utrecht'),
  DEFAULT_LOCALE: z.enum(['nl', 'en']).default('nl'),
  DEFAULT_CURRENCY: z.string().length(3).default('EUR'),

  PAYMENT_PROVIDER: z.enum(['mock', 'stripe']).default('mock'),
  PAYMENT_WEBHOOK_SECRET: z.string().min(8).default('dev-only-webhook-secret-change-me'),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  EMAIL_PROVIDER: z.enum(['mock', 'smtp']).default('mock'),
  EMAIL_FROM: z.string().default('SkillPass <no-reply@skillpass.local>'),
  SMTP_URL: z.string().optional(),

  STORAGE_PROVIDER: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_DIR: z.string().default('./storage/media'),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),

  GEO_PROVIDER: z.enum(['mock', 'osm', 'mapbox']).default('mock'),
  MAPBOX_TOKEN: z.string().optional(),
  NOMINATIM_URL: z.string().default('https://nominatim.openstreetmap.org'),

  RATE_LIMIT_ENABLED: boolish.default(true),
  DATA_RETENTION_DAYS: z.coerce.number().int().positive().default(365),
});

export type AppEnv = z.infer<typeof schema>;

function build(): AppEnv {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}\n\nCopy .env.example to .env to get working defaults.`);
  }
  const value = parsed.data;

  // Fail loudly rather than silently falling back to a mock in production.
  // The build step also runs with NODE_ENV=production but has no real secrets;
  // these checks belong to the running server, so skip them while building.
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
  if (value.NODE_ENV === 'production' && !isBuildPhase) {
    if (value.PAYMENT_PROVIDER === 'stripe' && !value.STRIPE_SECRET_KEY) {
      throw new Error('PAYMENT_PROVIDER=stripe requires STRIPE_SECRET_KEY');
    }
    if (value.SESSION_SECRET.startsWith('dev-only')) {
      throw new Error('SESSION_SECRET still holds the development placeholder');
    }
  }
  return value;
}

let cached: AppEnv | null = null;

export function env(): AppEnv {
  cached ??= build();
  return cached;
}

/** Test helper: forget the memoised configuration. */
export function resetEnvCache(): void {
  cached = null;
}
