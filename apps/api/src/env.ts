import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().min(1),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('60d'),

  SMS_PROVIDER: z.enum(['log', 'http']).default('log'),
  SMS_SENDER_ID: z.string().default('Khidma'),
  SMS_API_KEY: z.string().optional(),
  SMS_ENDPOINT: z.string().url().optional(),

  PAYMENT_PROVIDER: z.enum(['mock', 'cmi']).default('mock'),
  CMI_MERCHANT_ID: z.string().optional(),
  CMI_STORE_KEY: z.string().optional(),
  CMI_GATEWAY_URL: z.string().url().optional(),

  CORS_ORIGINS: z.string().default('*'),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${details}`);
  }
  if (parsed.data.PAYMENT_PROVIDER === 'cmi') {
    const missing = (['CMI_MERCHANT_ID', 'CMI_STORE_KEY', 'CMI_GATEWAY_URL'] as const).filter(
      (key) => !parsed.data[key],
    );
    if (missing.length > 0) {
      throw new Error(`PAYMENT_PROVIDER=cmi requires ${missing.join(', ')}`);
    }
  }
  return parsed.data;
}

export function env(): Env {
  cached ??= loadEnv();
  return cached;
}

export function corsOrigins(value: string): true | string[] {
  return value.trim() === '*' ? true : value.split(',').map((origin) => origin.trim());
}
