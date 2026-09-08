import { describe, expect, it } from 'vitest';
import { corsOrigins, loadEnv } from '../src/env.js';

/** The smallest environment that parses, for a test to vary one field of. */
const base = {
  DATABASE_URL: 'postgresql://buurklus:buurklus@localhost:5432/buurklus?schema=public',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
};

describe('the environment the server refuses to start on', () => {
  it('will not run in production with the API open to every site', () => {
    // The default is '*' so that building against localhost needs no
    // configuration. Shipping that default is the mistake this catches.
    expect(() => loadEnv({ ...base, NODE_ENV: 'production' } as NodeJS.ProcessEnv)).toThrow(
      /CORS_ORIGINS/,
    );
  });

  it('accepts production once the sites are named', () => {
    const env = loadEnv({
      ...base,
      NODE_ENV: 'production',
      CORS_ORIGINS: 'https://buurklus.nl,https://www.buurklus.nl',
    } as NodeJS.ProcessEnv);
    expect(corsOrigins(env.CORS_ORIGINS)).toEqual([
      'https://buurklus.nl',
      'https://www.buurklus.nl',
    ]);
  });

  it('leaves the wildcard alone in development', () => {
    expect(corsOrigins(loadEnv(base as NodeJS.ProcessEnv).CORS_ORIGINS)).toBe(true);
  });

  it('insists on secrets long enough to be worth having', () => {
    expect(() =>
      loadEnv({ ...base, JWT_ACCESS_SECRET: 'short' } as NodeJS.ProcessEnv),
    ).toThrow(/at least 32 characters/);
  });

  it('will not take a Mollie key without the webhook secret that checks it', () => {
    expect(() =>
      loadEnv({ ...base, PAYMENT_PROVIDER: 'mollie', MOLLIE_API_KEY: 'test' } as NodeJS.ProcessEnv),
    ).toThrow(/PAYMENT_WEBHOOK_SECRET/);
  });
});
