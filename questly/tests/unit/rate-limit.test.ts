import { beforeEach, describe, expect, it } from "vitest";
import { rateLimiter } from "@/lib/rate-limit";
import { loadEnv, resetEnvCache } from "@/lib/env";

describe("rate limiter", () => {
  beforeEach(() => {
    rateLimiter.reset();
  });

  it("allows requests up to the limit and blocks the next one", () => {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      expect(rateLimiter.consume("signin:1.2.3.4", 3, 60).allowed, `attempt ${attempt}`).toBe(true);
    }
    const blocked = rateLimiter.consume("signin:1.2.3.4", 3, 60);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("keeps buckets separate per key", () => {
    rateLimiter.consume("signin:1.2.3.4", 1, 60);
    expect(rateLimiter.consume("signin:1.2.3.4", 1, 60).allowed).toBe(false);
    expect(rateLimiter.consume("signin:5.6.7.8", 1, 60).allowed).toBe(true);
  });

  it("reports the remaining budget", () => {
    expect(rateLimiter.consume("upload:family", 5, 60).remaining).toBe(4);
    expect(rateLimiter.consume("upload:family", 5, 60).remaining).toBe(3);
  });
});

describe("environment validation", () => {
  const base = {
    DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
    SESSION_SECRET: "a".repeat(32),
    MEDIA_SECRET: "b".repeat(32),
  };

  beforeEach(() => {
    resetEnvCache();
  });

  it("applies safe defaults", () => {
    const env = loadEnv(base);
    expect(env.PAYMENT_PROVIDER).toBe("mock");
    expect(env.MEDIA_DRIVER).toBe("local");
    expect(env.AI_PROVIDER).toBe("none");
    expect(env.RETENTION_DELETION_GRACE_DAYS).toBe(30);
  });

  it("rejects a short session secret", () => {
    expect(() => loadEnv({ ...base, SESSION_SECRET: "short" })).toThrowError(
      /SESSION_SECRET must be at least 32/,
    );
  });

  it("rejects a missing database URL", () => {
    const { DATABASE_URL: _ignored, ...withoutDatabase } = base;
    expect(() => loadEnv(withoutDatabase)).toThrowError(/DATABASE_URL/);
  });

  it("refuses Stripe in production without a secret key", () => {
    expect(() =>
      loadEnv({ ...base, NODE_ENV: "production", PAYMENT_PROVIDER: "stripe" }),
    ).toThrowError(/STRIPE_SECRET_KEY/);
  });

  it("keeps email delivery and the on-screen verification link off in production", () => {
    const production = loadEnv({ ...base, NODE_ENV: "production" });
    expect(production.EMAIL_DRIVER).toBe("none");
    expect(production.AUTH_SHOW_VERIFICATION_LINK).toBe(false);

    const development = loadEnv({ ...base, NODE_ENV: "development" });
    expect(development.EMAIL_DRIVER).toBe("log");
    expect(development.AUTH_SHOW_VERIFICATION_LINK).toBe(true);
  });
});
