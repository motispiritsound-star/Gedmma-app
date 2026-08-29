import { z } from "zod";

/**
 * Environment contract for the whole application.
 *
 * Rules:
 *  - every secret has a validated minimum length in production;
 *  - no external service is required for the app to boot (Stripe and the AI
 *    provider both fall back to local implementations);
 *  - validation happens once, lazily, so `next build` does not need a database.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),
  MEDIA_SECRET: z.string().min(32, "MEDIA_SECRET must be at least 32 characters"),

  SESSION_TTL_HOURS: z.coerce.number().int().positive().default(24 * 14),
  MEDIA_URL_TTL_SECONDS: z.coerce.number().int().positive().default(300),

  MEDIA_DRIVER: z.enum(["local", "s3"]).default("local"),
  MEDIA_LOCAL_DIR: z.string().default("./.data/media"),
  MEDIA_MAX_BYTES: z.coerce.number().int().positive().default(8 * 1024 * 1024),

  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),

  PAYMENT_PROVIDER: z.enum(["mock", "stripe"]).default("mock"),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_FAMILY_PREMIUM: z.string().optional(),

  /**
   * "log" writes outbound email to the structured log (development and tests).
   * "none" sends nothing. No real provider is implemented in this MVP.
   */
  EMAIL_DRIVER: z.enum(["log", "none"]).optional(),
  /**
   * Shows the email verification link on screen instead of only sending it.
   * Development and end-to-end convenience only - it turns verification into a
   * formality, so it defaults to off in production.
   */
  AUTH_SHOW_VERIFICATION_LINK: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),

  AI_PROVIDER: z.enum(["none", "anthropic"]).default("none"),
  ANTHROPIC_API_KEY: z.string().optional(),

  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),

  /** Days of inactivity after which a deletion request is purged. */
  RETENTION_DELETION_GRACE_DAYS: z.coerce.number().int().nonnegative().default(30),
  /** Days after which raw evidence media is eligible for deletion (0 = keep). */
  RETENTION_EVIDENCE_DAYS: z.coerce.number().int().nonnegative().default(0),
  RETENTION_AUDIT_LOG_DAYS: z.coerce.number().int().positive().default(365),

  /** Requests allowed per window on authentication endpoints. */
  RATE_LIMIT_AUTH_MAX: z.coerce.number().int().positive().default(10),
  RATE_LIMIT_AUTH_WINDOW_SECONDS: z.coerce.number().int().positive().default(300),
  RATE_LIMIT_UPLOAD_MAX: z.coerce.number().int().positive().default(20),
  RATE_LIMIT_UPLOAD_WINDOW_SECONDS: z.coerce.number().int().positive().default(600),
});

type ParsedEnv = z.infer<typeof schema>;
export type Env = Omit<ParsedEnv, "EMAIL_DRIVER" | "AUTH_SHOW_VERIFICATION_LINK"> & {
  EMAIL_DRIVER: "log" | "none";
  AUTH_SHOW_VERIFICATION_LINK: boolean;
};

const BUILD_PLACEHOLDER_SECRET = "build-time-placeholder-secret-not-for-runtime";

let cached: Env | null = null;

function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

export function loadEnv(source: Record<string, string | undefined> = process.env): Env {
  const candidate: Record<string, unknown> = { ...source };

  // `next build` statically renders pages without a database. Supply inert
  // placeholders so the build succeeds; anything that truly needs the database
  // is dynamic and therefore only evaluated at request time.
  if (isBuildPhase()) {
    candidate.DATABASE_URL ??= "postgresql://build:build@127.0.0.1:5432/build";
    candidate.SESSION_SECRET ??= BUILD_PLACEHOLDER_SECRET;
    candidate.MEDIA_SECRET ??= BUILD_PLACEHOLDER_SECRET;
  }

  const parsed = schema.safeParse(candidate);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}\n\nCopy .env.example to .env and fill in the values.`);
  }

  const env = {
    ...parsed.data,
    EMAIL_DRIVER: parsed.data.EMAIL_DRIVER ?? (parsed.data.NODE_ENV === "production" ? "none" : "log"),
    AUTH_SHOW_VERIFICATION_LINK: parsed.data.AUTH_SHOW_VERIFICATION_LINK ?? parsed.data.NODE_ENV !== "production",
  };

  if (env.NODE_ENV === "production") {
    if (env.SESSION_SECRET === BUILD_PLACEHOLDER_SECRET || env.MEDIA_SECRET === BUILD_PLACEHOLDER_SECRET) {
      throw new Error("Refusing to run in production with placeholder secrets.");
    }
    if (env.PAYMENT_PROVIDER === "stripe" && !env.STRIPE_SECRET_KEY) {
      throw new Error("PAYMENT_PROVIDER=stripe requires STRIPE_SECRET_KEY.");
    }
    if (env.AUTH_SHOW_VERIFICATION_LINK) {
      // Deliberately not fatal: the end-to-end suite runs a production build.
      // It is loud because enabling this on a real deployment hands every
      // registrant a working verification link without checking their inbox.
      console.warn(
        "[questly] AUTH_SHOW_VERIFICATION_LINK is enabled in production. Email verification is not enforced.",
      );
    }
  }

  return env;
}

export function env(): Env {
  cached ??= loadEnv();
  return cached;
}

/** Test helper: forget the memoised configuration. */
export function resetEnvCache(): void {
  cached = null;
}
