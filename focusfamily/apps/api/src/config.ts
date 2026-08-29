import { z } from 'zod';

/**
 * Configuration is read once, validated, and then treated as immutable.
 * A missing secret in production is a startup failure, not a silent default.
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  HOST: z.string().default('127.0.0.1'),
  DATABASE_URL: z.string().min(1),
  /** Signs session cookies. Must be at least 32 characters outside development. */
  SESSION_SECRET: z.string().default('development-only-session-secret-change-me'),
  /** Comma-separated list of origins allowed to send credentialed requests. */
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
  COOKIE_DOMAIN: z.string().optional(),
  /** 'mock' unless a Stripe test key is present. Never guesses. */
  BILLING_PROVIDER: z.enum(['mock', 'stripe_test']).default('mock'),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PRICE_FAMILY_PREMIUM: z.string().optional(),
  /** Forces the mock screen-time adapter everywhere. */
  FOCUSFAMILY_USE_MOCK: z.enum(['0', '1']).default('1'),
  /** The optional AI advisor. Off unless explicitly switched on. */
  AI_ADVISOR_ENABLED: z.enum(['0', '1']).default('0'),
  WEB_BASE_URL: z.string().default('http://localhost:3000'),
});

export type Config = Readonly<z.infer<typeof schema>> & {
  readonly allowedOrigins: readonly string[];
  readonly isProduction: boolean;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = schema.parse(env);
  const isProduction = parsed.NODE_ENV === 'production';
  if (isProduction && parsed.SESSION_SECRET.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters in production.');
  }
  if (isProduction && parsed.SESSION_SECRET.startsWith('development-only')) {
    throw new Error('Refusing to start in production with the development session secret.');
  }
  if (parsed.BILLING_PROVIDER === 'stripe_test' && !parsed.STRIPE_SECRET_KEY) {
    throw new Error('BILLING_PROVIDER=stripe_test requires STRIPE_SECRET_KEY.');
  }
  return Object.freeze({
    ...parsed,
    allowedOrigins: parsed.ALLOWED_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    isProduction,
  });
}
