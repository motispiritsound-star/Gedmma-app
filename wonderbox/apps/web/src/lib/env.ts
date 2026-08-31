import { z } from 'zod';

/**
 * Environment is parsed once, at module load, and never read from
 * `process.env` anywhere else. A missing or nonsensical value fails the boot
 * rather than surfacing as a mystery at 2am.
 */

const booleanish = z
  .string()
  .default('false')
  .transform((value) => ['1', 'true', 'yes', 'on'].includes(value.toLowerCase()));

const intFromString = (fallback: number) =>
  z
    .string()
    .optional()
    .transform((value) => (value === undefined || value === '' ? fallback : Number(value)))
    .pipe(z.number().int().nonnegative());

const DEV_SESSION_SECRET = 'dev-only-insecure-session-secret-change-me-0000000000';

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    TEST_DATABASE_URL: z.string().optional(),
    APP_URL: z.string().url().default('http://localhost:3000'),
    DEFAULT_LOCALE: z.enum(['nl', 'en']).default('nl'),

    SESSION_SECRET: z.string().min(24, 'SESSION_SECRET must be at least 24 characters'),
    SESSION_TTL_HOURS: intFromString(720),
    ACTIVATION_CODE_PEPPER: z.string().min(8),

    PAYMENT_PROVIDER: z.enum(['mock', 'stripe']).default('mock'),
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    MOCK_PAYMENT_WEBHOOK_SECRET: z.string().default('dev-mock-payment-secret'),

    SHIPPING_PROVIDER: z.enum(['mock', 'postnl']).default('mock'),
    SHIPPING_API_KEY: z.string().optional(),
    SHIPPING_WEBHOOK_SECRET: z.string().default('dev-mock-shipping-secret'),
    SHIPPING_ORIGIN_COUNTRY: z.string().length(2).default('NL'),
    SHIPPING_FLAT_RATE_CENTS: intFromString(495),

    STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
    STORAGE_LOCAL_ROOT: z.string().default('.storage'),
    STORAGE_SIGNING_SECRET: z.string().min(8).default('dev-only-storage-signing-secret'),
    STORAGE_URL_TTL_SECONDS: intFromString(300),
    S3_BUCKET: z.string().optional(),
    S3_REGION: z.string().optional(),
    S3_ENDPOINT: z.string().optional(),
    S3_ACCESS_KEY_ID: z.string().optional(),
    S3_SECRET_ACCESS_KEY: z.string().optional(),

    AI_DRAFT_PROVIDER: z.enum(['mock', 'anthropic']).default('mock'),
    AI_DRAFT_API_KEY: z.string().optional(),
    AI_DRAFT_MODEL: z.string().default('claude-sonnet-5'),

    SPEECH_TO_TEXT_ENABLED: booleanish,
    SPEECH_TO_TEXT_PROVIDER: z.enum(['mock', 'whisper']).default('mock'),
    SPEECH_TO_TEXT_RETENTION_MINUTES: intFromString(0),

    // --- Automation --------------------------------------------------------
    /// Creates shipping labels for paid orders without a human. Off by default:
    /// a label costs money and a mislabelled parcel costs more.
    AUTO_FULFIL: booleanish,
    /// Shared secret an external scheduler presents to /api/jobs/run.
    JOB_RUNNER_TOKEN: z.string().optional(),

    PROGRESS_EVENT_RETENTION_DAYS: intFromString(400),
    AUDIT_LOG_RETENTION_DAYS: intFromString(730),
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV !== 'production') return;
    // `next build` runs with NODE_ENV=production but serves no traffic, and a
    // developer must be able to build from a fresh checkout. The refusals
    // below are about *running* with insecure settings, so skip them while
    // the build is collecting page data.
    if (process.env.NEXT_PHASE === 'phase-production-build') return;
    if (value.SESSION_SECRET === DEV_SESSION_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['SESSION_SECRET'],
        message: 'Refusing to start in production with the development session secret.',
      });
    }
    if (value.PAYMENT_PROVIDER === 'stripe' && !value.STRIPE_SECRET_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['STRIPE_SECRET_KEY'],
        message: 'PAYMENT_PROVIDER=stripe requires STRIPE_SECRET_KEY.',
      });
    }
    if (!value.JOB_RUNNER_TOKEN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JOB_RUNNER_TOKEN'],
        message:
          'JOB_RUNNER_TOKEN is required in production: without it the scheduled ' +
          'jobs endpoint refuses every request and the automation silently stops.',
      });
    }
    if (value.STORAGE_DRIVER === 's3' && !value.S3_BUCKET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['S3_BUCKET'],
        message: 'STORAGE_DRIVER=s3 requires S3_BUCKET.',
      });
    }
  });

export type Env = z.infer<typeof EnvSchema>;

function load(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${detail}\n\nSee .env.example.`);
  }
  return parsed.data;
}

export const env: Env = load();

export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
