import { describe, expect, it } from 'vitest';
import { requestOtpSchema, verifyOtpSchema } from './auth.js';
import { createJobSchema } from './job.js';
import { upsertProProfileSchema } from './pro.js';
import { moroccoCoordinatesSchema } from './common.js';

describe('auth schemas', () => {
  it('normalises the phone number as part of parsing', () => {
    const parsed = requestOtpSchema.parse({ phone: '06 12 34 56 78' });
    expect(parsed.phone).toBe('+212612345678');
  });

  it('rejects a landline and a malformed code', () => {
    expect(requestOtpSchema.safeParse({ phone: '0522123456' }).success).toBe(false);
    expect(
      verifyOtpSchema.safeParse({ phone: '0612345678', code: '12345' }).success,
    ).toBe(false);
  });
});

describe('job schema', () => {
  const base = {
    categorySlug: 'peinture-interieure',
    title: 'Peindre un salon de 25 m²',
    description:
      "Salon de 25 m² à repeindre en blanc mat, murs et plafond. Les meubles seront déplacés avant l'intervention.",
    citySlug: 'casablanca',
  };

  it('accepts a well-formed job', () => {
    expect(createJobSchema.safeParse(base).success).toBe(true);
  });

  it('rejects a description too short to quote against', () => {
    expect(createJobSchema.safeParse({ ...base, description: 'Peinture' }).success).toBe(false);
  });

  it('rejects an inverted budget range', () => {
    const result = createJobSchema.safeParse({ ...base, budgetMinMad: 5000, budgetMaxMad: 1000 });
    expect(result.success).toBe(false);
  });
});

describe('pro profile schema', () => {
  const base = {
    displayName: 'Atelier Zellige Fès',
    legalForm: 'SARL' as const,
    bio: "Atelier familial spécialisé dans le zellige et le tadelakt depuis trois générations.",
    yearsExperience: 22,
    baseCitySlug: 'fes',
    categorySlugs: ['zellige-tadelakt'],
    citySlugs: ['fes', 'meknes'],
  };

  it('requires an ICE for a registered company', () => {
    expect(upsertProProfileSchema.safeParse(base).success).toBe(false);
    expect(
      upsertProProfileSchema.safeParse({ ...base, ice: '001234567000012' }).success,
    ).toBe(true);
  });

  it('lets an auto-entrepreneur identify with a CIN instead', () => {
    const result = upsertProProfileSchema.safeParse({
      ...base,
      legalForm: 'AUTO_ENTREPRENEUR',
      cin: 'AB123456',
    });
    expect(result.success).toBe(true);
  });
});

describe('coordinates', () => {
  it('keeps jobs inside Morocco', () => {
    expect(moroccoCoordinatesSchema.safeParse({ lat: 33.5731, lng: -7.5898 }).success).toBe(true);
    // Paris — a mis-set device locale should not create a job in France.
    expect(moroccoCoordinatesSchema.safeParse({ lat: 48.8566, lng: 2.3522 }).success).toBe(false);
  });
});
