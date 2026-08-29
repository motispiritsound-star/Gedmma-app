import { z } from 'zod';
import {
  isValidDutchIban,
  isValidDutchVatId,
  isValidKvk,
  normalizeKvk,
  normalizeVatId,
} from '../identifiers.js';
import { paginationSchema, slugSchema } from './common.js';

/** Legal forms a Dutch business is registered under at the KvK. */
export const LEGAL_FORMS = [
  'EENMANSZAAK',
  'VOF',
  'MAATSCHAP',
  'CV',
  'BV',
  'NV',
  'COOPERATIE',
  'STICHTING',
  'VERENIGING',
] as const;
export type LegalForm = (typeof LEGAL_FORMS)[number];

export const kvkSchema = z
  .string()
  .trim()
  .refine(isValidKvk, { message: 'kvk_invalid' })
  .transform(normalizeKvk);

export const vatIdSchema = z
  .string()
  .trim()
  .refine(isValidDutchVatId, { message: 'vat_id_invalid' })
  .transform(normalizeVatId);

export const ibanSchema = z
  .string()
  .trim()
  .refine(isValidDutchIban, { message: 'iban_invalid' })
  .transform((value) => value.replace(/\s/g, '').toUpperCase());

export const upsertProProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(120),
  legalForm: z.enum(LEGAL_FORMS),
  bio: z.string().trim().min(40).max(2000),
  yearsExperience: z.number().int().min(0).max(70),
  teamSize: z.number().int().min(1).max(5000).default(1),
  baseCitySlug: slugSchema,
  /** How far from the base city the pro will travel for a job. */
  serviceRadiusKm: z.number().int().min(1).max(300).default(30),
  categorySlugs: z.array(slugSchema).min(1).max(15),
  citySlugs: z.array(slugSchema).min(1).max(60),
  websiteUrl: z.string().url().max(300).optional().or(z.literal('')),
  logoUrl: z.string().url().max(500).optional(),
  portfolioUrls: z.array(z.string().url().max(500)).max(20).default([]),

  /**
   * Every business in the Netherlands has a KvK number, including a one-person
   * zzp business, so it is required rather than one of several alternatives.
   * The VAT id is optional: a business under the small-business scheme (KOR)
   * does not charge VAT and may not have one.
   */
  kvk: kvkSchema,
  vatId: vatIdSchema.optional(),
  iban: ibanSchema.optional(),
  /** Certificates the pro uploads for review by the Buurklus team. */
  documentUrls: z.array(z.string().url().max(500)).max(10).default([]),
});

export const searchProsSchema = paginationSchema.extend({
  categorySlug: slugSchema.optional(),
  citySlug: slugSchema.optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  verifiedOnly: z.coerce.boolean().default(false),
  query: z.string().trim().max(120).optional(),
});

export type UpsertProProfileInput = z.infer<typeof upsertProProfileSchema>;
export type SearchProsInput = z.infer<typeof searchProsSchema>;
