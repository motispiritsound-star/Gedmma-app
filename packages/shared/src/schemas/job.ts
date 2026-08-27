import { z } from 'zod';
import { JOB_STATUSES, JOB_URGENCIES, PROPERTY_TYPES } from '../enums.js';
import { moroccanMobileSchema } from './auth.js';
import { coordinatesSchema, paginationSchema, slugSchema } from './common.js';

/**
 * A job description short enough to be useless produces bad quotes, so the API
 * enforces the same minimum the posting wizard shows as a hint.
 */
export const JOB_DESCRIPTION_MIN = 30;
export const JOB_DESCRIPTION_MAX = 4000;
export const JOB_MAX_PHOTOS = 8;

/** How many pros may quote before a job stops accepting new quotes. */
export const JOB_MAX_QUOTES = 6;

/** Jobs stop being shown to pros after this many days without an award. */
export const JOB_LIFETIME_DAYS = 30;

export const createJobSchema = z.object({
  categorySlug: slugSchema,
  title: z.string().trim().min(8).max(120),
  description: z.string().trim().min(JOB_DESCRIPTION_MIN).max(JOB_DESCRIPTION_MAX),
  citySlug: slugSchema,
  district: z.string().trim().max(120).optional(),
  /** Street address stays hidden until the customer awards the job. */
  addressLine: z.string().trim().max(240).optional(),
  coordinates: coordinatesSchema.optional(),
  propertyType: z.enum(PROPERTY_TYPES).optional(),
  urgency: z.enum(JOB_URGENCIES).default('WITHIN_WEEK'),
  preferredStartDate: z.coerce.date().optional(),
  budgetMinMad: z.number().int().min(0).max(5_000_000).optional(),
  budgetMaxMad: z.number().int().min(0).max(5_000_000).optional(),
  photoUrls: z.array(z.string().url().max(500)).max(JOB_MAX_PHOTOS).default([]),
  /** Set when the poster wants to be called on a number other than their login. */
  contactPhone: moroccanMobileSchema.optional(),
}).refine(
  (job) => job.budgetMinMad == null || job.budgetMaxMad == null || job.budgetMinMad <= job.budgetMaxMad,
  { message: 'budget_range_inverted', path: ['budgetMaxMad'] },
);

export const updateJobSchema = z.object({
  title: z.string().trim().min(8).max(120).optional(),
  description: z.string().trim().min(JOB_DESCRIPTION_MIN).max(JOB_DESCRIPTION_MAX).optional(),
  urgency: z.enum(JOB_URGENCIES).optional(),
  preferredStartDate: z.coerce.date().optional(),
  budgetMinMad: z.number().int().min(0).max(5_000_000).nullable().optional(),
  budgetMaxMad: z.number().int().min(0).max(5_000_000).nullable().optional(),
  photoUrls: z.array(z.string().url().max(500)).max(JOB_MAX_PHOTOS).optional(),
});

export const cancelJobSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

/** Customer-side listing of their own jobs. */
export const listMyJobsSchema = paginationSchema.extend({
  status: z.enum(JOB_STATUSES).optional(),
});

/** Pro-side lead feed. Defaults come from the pro's own coverage settings. */
export const listLeadsSchema = paginationSchema.extend({
  categorySlugs: z
    .union([z.string(), z.array(z.string())])
    .transform((value) => (Array.isArray(value) ? value : value.split(',')))
    .pipe(z.array(slugSchema).max(20))
    .optional(),
  citySlugs: z
    .union([z.string(), z.array(z.string())])
    .transform((value) => (Array.isArray(value) ? value : value.split(',')))
    .pipe(z.array(slugSchema).max(20))
    .optional(),
  urgency: z.enum(JOB_URGENCIES).optional(),
  minBudgetMad: z.coerce.number().int().min(0).optional(),
  /** Hides jobs the pro has already quoted on. Defaults to true. */
  hideQuoted: z.coerce.boolean().default(true),
  sort: z.enum(['RECENT', 'NEAREST', 'BUDGET']).default('RECENT'),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type ListLeadsInput = z.infer<typeof listLeadsSchema>;
