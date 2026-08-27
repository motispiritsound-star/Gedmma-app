import { z } from 'zod';
import { isValidCin, isValidCnss, isValidIce, isValidRc, isValidTaxId } from '../identifiers.js';
import { paginationSchema, slugSchema } from './common.js';

/** Legal forms a Moroccan service business is registered under. */
export const LEGAL_FORMS = [
  'AUTO_ENTREPRENEUR',
  'PERSONNE_PHYSIQUE',
  'SARL',
  'SARL_AU',
  'SA',
  'SNC',
  'COOPERATIVE',
  'ASSOCIATION',
] as const;
export type LegalForm = (typeof LEGAL_FORMS)[number];

export const iceSchema = z.string().trim().refine(isValidIce, { message: 'ice_invalid' });
export const rcSchema = z.string().trim().refine(isValidRc, { message: 'rc_invalid' });
export const taxIdSchema = z.string().trim().refine(isValidTaxId, { message: 'tax_id_invalid' });
export const cnssSchema = z.string().trim().refine(isValidCnss, { message: 'cnss_invalid' });
export const cinSchema = z.string().trim().refine(isValidCin, { message: 'cin_invalid' });

export const upsertProProfileSchema = z
  .object({
    displayName: z.string().trim().min(2).max(120),
    legalForm: z.enum(LEGAL_FORMS),
    bio: z.string().trim().min(40).max(2000),
    yearsExperience: z.number().int().min(0).max(70),
    teamSize: z.number().int().min(1).max(5000).default(1),
    baseCitySlug: slugSchema,
    /** How far from the base city the pro will travel for a job. */
    serviceRadiusKm: z.number().int().min(1).max(500).default(30),
    categorySlugs: z.array(slugSchema).min(1).max(15),
    citySlugs: z.array(slugSchema).min(1).max(60),
    websiteUrl: z.string().url().max(300).optional().or(z.literal('')),
    logoUrl: z.string().url().max(500).optional(),
    portfolioUrls: z.array(z.string().url().max(500)).max(20).default([]),
    // Registration identifiers. Auto-entrepreneurs and sole traders are
    // identified by CIN; registered companies must supply an ICE.
    ice: iceSchema.optional(),
    rc: rcSchema.optional(),
    taxId: taxIdSchema.optional(),
    cnss: cnssSchema.optional(),
    cin: cinSchema.optional(),
    /** Certificates the pro uploads for manual review by the Khidma team. */
    documentUrls: z.array(z.string().url().max(500)).max(10).default([]),
  })
  .refine((profile) => profile.ice != null || profile.cin != null, {
    message: 'ice_or_cin_required',
    path: ['ice'],
  })
  .refine(
    (profile) =>
      profile.legalForm === 'AUTO_ENTREPRENEUR' ||
      profile.legalForm === 'PERSONNE_PHYSIQUE' ||
      profile.ice != null,
    { message: 'ice_required_for_company', path: ['ice'] },
  );

export const searchProsSchema = paginationSchema.extend({
  categorySlug: slugSchema.optional(),
  citySlug: slugSchema.optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  verifiedOnly: z.coerce.boolean().default(false),
  query: z.string().trim().max(120).optional(),
});

export type UpsertProProfileInput = z.infer<typeof upsertProProfileSchema>;
export type SearchProsInput = z.infer<typeof searchProsSchema>;
