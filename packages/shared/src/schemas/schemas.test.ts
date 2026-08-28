import { describe, expect, it } from 'vitest';
import { requestOtpSchema, verifyOtpSchema } from './auth.js';
import { createJobSchema } from './job.js';
import { upsertProProfileSchema } from './pro.js';
import { netherlandsCoordinatesSchema } from './common.js';

describe('auth schemas', () => {
  it('normalises the phone number as part of parsing', () => {
    const parsed = requestOtpSchema.parse({ phone: '06 12345678' });
    expect(parsed.phone).toBe('+31612345678');
  });

  it('rejects a landline and a malformed code', () => {
    expect(requestOtpSchema.safeParse({ phone: '0101234567' }).success).toBe(false);
    expect(verifyOtpSchema.safeParse({ phone: '0612345678', code: '12345' }).success).toBe(false);
  });
});

describe('job schema', () => {
  const base = {
    categorySlug: 'binnenschilderwerk',
    title: 'Woonkamer van 25 m² schilderen',
    description:
      'Woonkamer van 25 m² opnieuw schilderen in gebroken wit, muren en plafond. Kleine reparaties nodig rond de kozijnen.',
    citySlug: 'utrecht',
  };

  it('accepts a well-formed job', () => {
    expect(createJobSchema.safeParse(base).success).toBe(true);
  });

  it('rejects a description too short to quote against', () => {
    expect(createJobSchema.safeParse({ ...base, description: 'Schilderen' }).success).toBe(false);
  });

  it('rejects an inverted budget range', () => {
    const result = createJobSchema.safeParse({ ...base, budgetMinEur: 5000, budgetMaxEur: 1000 });
    expect(result.success).toBe(false);
  });
});

describe('pro profile schema', () => {
  const base = {
    displayName: 'Schildersbedrijf De Vries',
    legalForm: 'BV' as const,
    bio: 'Familiebedrijf uit Utrecht, al drie generaties gespecialiseerd in binnen- en buitenschilderwerk.',
    yearsExperience: 22,
    baseCitySlug: 'utrecht',
    categorySlugs: ['binnenschilderwerk'],
    citySlugs: ['utrecht', 'amersfoort'],
  };

  it('requires a KvK number, which every Dutch business has', () => {
    expect(upsertProProfileSchema.safeParse(base).success).toBe(false);
    expect(upsertProProfileSchema.safeParse({ ...base, kvk: '12345678' }).success).toBe(true);
  });

  it('treats the VAT id as optional, since a KOR business has none', () => {
    const withoutVat = upsertProProfileSchema.safeParse({ ...base, kvk: '12345678' });
    expect(withoutVat.success).toBe(true);

    const withVat = upsertProProfileSchema.safeParse({
      ...base,
      kvk: '12345678',
      vatId: 'NL123456789B01',
    });
    expect(withVat.success).toBe(true);
  });

  it('rejects an invalid KvK number', () => {
    expect(upsertProProfileSchema.safeParse({ ...base, kvk: '1234' }).success).toBe(false);
  });
});

describe('coordinates', () => {
  it('accepts locations across the country, from Zeeland to Groningen', () => {
    for (const point of [
      { lat: 52.3676, lng: 4.9041 }, // Amsterdam
      { lat: 50.8514, lng: 5.691 }, // Maastricht, the southern tip
      { lat: 53.2194, lng: 6.5665 }, // Groningen
      { lat: 51.4988, lng: 3.6136 }, // Middelburg, the western edge
    ]) {
      expect(netherlandsCoordinatesSchema.safeParse(point).success, JSON.stringify(point)).toBe(true);
    }
  });

  it('rejects coordinates from another country entirely', () => {
    // The check is a coarse box, so it catches Paris and Berlin rather than
    // Antwerp — which is the class of error it exists for.
    for (const point of [
      { lat: 48.8566, lng: 2.3522 }, // Paris
      { lat: 52.52, lng: 13.405 }, // Berlin
      { lat: 33.5731, lng: -7.5898 }, // Casablanca
    ]) {
      expect(netherlandsCoordinatesSchema.safeParse(point).success, JSON.stringify(point)).toBe(false);
    }
  });
});
