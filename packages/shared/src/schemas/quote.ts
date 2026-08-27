import { z } from 'zod';
import { paginationSchema } from './common.js';
import { QUOTE_STATUSES } from '../enums.js';

export const QUOTE_MESSAGE_MIN = 20;
export const QUOTE_MESSAGE_MAX = 2000;

/** A quote stays valid for this long unless the pro sets a shorter window. */
export const QUOTE_DEFAULT_VALIDITY_DAYS = 14;

export const createQuoteSchema = z.object({
  amountMad: z.number().int().min(50).max(5_000_000),
  /** Whether `amountMad` is a fixed price or an estimate pending a site visit. */
  isEstimate: z.boolean().default(false),
  message: z.string().trim().min(QUOTE_MESSAGE_MIN).max(QUOTE_MESSAGE_MAX),
  estimatedDurationDays: z.number().int().min(1).max(365).optional(),
  canStartOn: z.coerce.date().optional(),
  validityDays: z.number().int().min(1).max(90).default(QUOTE_DEFAULT_VALIDITY_DAYS),
  /** Pro offers a free on-site assessment before committing to a price. */
  includesSiteVisit: z.boolean().default(false),
});

export const rejectQuoteSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const listMyQuotesSchema = paginationSchema.extend({
  status: z.enum(QUOTE_STATUSES).optional(),
});

export const sendMessageSchema = z.object({
  body: z.string().trim().min(1).max(2000),
  attachmentUrls: z.array(z.string().url().max(500)).max(5).default([]),
});

export const createReviewSchema = z.object({
  /** Overall score, and the four axes Werkspot-style marketplaces settle on. */
  rating: z.number().int().min(1).max(5),
  qualityRating: z.number().int().min(1).max(5).optional(),
  punctualityRating: z.number().int().min(1).max(5).optional(),
  priceRating: z.number().int().min(1).max(5).optional(),
  communicationRating: z.number().int().min(1).max(5).optional(),
  comment: z.string().trim().min(10).max(1500),
});

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
