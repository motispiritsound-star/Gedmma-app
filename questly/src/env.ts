import { z } from 'zod'

/**
 * Runtime environment validation.
 *
 * Every process (Next.js server, seed script, tests) imports this module and
 * fails fast with a readable message rather than blowing up later with an
 * `undefined` in a connection string.
 */

const booleanish = z
  .enum(['true', 'false', '1', '0', ''])
  .transform((value) => value === 'true' || value === '1')

const positiveInt = (fallback: number) =>
  z
    .string()
    .optional()
    .transform((value) => (value === undefined || value === '' ? fallback : Number(value)))
    .pipe(z.number().int().positive())

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    SESSION_SECRET: z.string().optional(),
    APP_URL: z.url().default('http://localhost:3000'),
    DEFAULT_LOCALE: z.enum(['nl', 'en']).default('nl'),

    MEDIA_DRIVER: z.enum(['local', 's3']).default('local'),
    MEDIA_LOCAL_DIR: z.string().default('./.data/media'),
    MEDIA_URL_TTL_MINUTES: positiveInt(10),
    MEDIA_MAX_UPLOAD_BYTES: positiveInt(8 * 1024 * 1024),

    PAYMENT_DRIVER: z.enum(['mock', 'stripe']).default('mock'),
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    STRIPE_PREMIUM_PRICE_ID: z.string().optional(),

    EMAIL_DRIVER: z.enum(['console', 'noop']).default('console'),
    EMAIL_FROM: z.string().default('hello@questly.example'),

    AI_DRIVER: z.enum(['none', 'anthropic']).default('none'),
    ANTHROPIC_API_KEY: z.string().optional(),

    RETENTION_DELETION_GRACE_DAYS: positiveInt(30),
    RETENTION_AUDIT_LOG_DAYS: positiveInt(365),

    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'silent']).default('info'),
    // Guarded at the point of use: prisma/seed.ts refuses to run unless this is
    // true *and* NODE_ENV is not production.
    ALLOW_SEED: booleanish.optional().default(false),
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV === 'production') {
      if (!value.SESSION_SECRET || value.SESSION_SECRET.length < 32) {
        ctx.addIssue({
          code: 'custom',
          path: ['SESSION_SECRET'],
          message: 'SESSION_SECRET of at least 32 characters is required in production',
        })
      }
    }
    if (value.PAYMENT_DRIVER === 'stripe' && !value.STRIPE_SECRET_KEY) {
      ctx.addIssue({
        code: 'custom',
        path: ['STRIPE_SECRET_KEY'],
        message: 'STRIPE_SECRET_KEY is required when PAYMENT_DRIVER=stripe',
      })
    }
    if (value.AI_DRIVER === 'anthropic' && !value.ANTHROPIC_API_KEY) {
      ctx.addIssue({
        code: 'custom',
        path: ['ANTHROPIC_API_KEY'],
        message: 'ANTHROPIC_API_KEY is required when AI_DRIVER=anthropic',
      })
    }
  })

export type Env = z.infer<typeof schema>

function load(): Env {
  const parsed = schema.safeParse(process.env)
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n')
    throw new Error(`Invalid environment configuration:\n${details}`)
  }
  return parsed.data
}

let cached: Env | null = null

export function getEnv(): Env {
  cached ??= load()
  return cached
}

/**
 * Development-only fallback so `npm run dev` works straight after `git clone`
 * without generating a secret first. Production is guarded above.
 */
export function getSessionSecret(): string {
  const env = getEnv()
  if (env.SESSION_SECRET && env.SESSION_SECRET.length >= 32) return env.SESSION_SECRET
  return 'questly-development-session-secret-not-for-production'
}

export const env: Env = new Proxy({} as Env, {
  get: (_target, prop: string) => getEnv()[prop as keyof Env],
})
