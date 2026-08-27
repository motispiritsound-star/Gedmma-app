import { z } from 'zod';
import { BILLING_PERIODS, PAYMENT_METHODS } from '../enums.js';
import { slugSchema } from './common.js';

export const startSubscriptionSchema = z.object({
  planSlug: slugSchema,
  period: z.enum(BILLING_PERIODS).default('MONTHLY'),
  paymentMethod: z.enum(PAYMENT_METHODS).default('CMI_CARD'),
  /** Deep link the payment gateway returns the pro to after checkout. */
  returnUrl: z.string().url().max(500).optional(),
  promoCode: z.string().trim().max(32).optional(),
});

export const changePlanSchema = z.object({
  planSlug: slugSchema,
  period: z.enum(BILLING_PERIODS).optional(),
});

export const cancelSubscriptionSchema = z.object({
  /** Keeps access until the paid period ends rather than cutting off now. */
  atPeriodEnd: z.boolean().default(true),
  reason: z.string().trim().max(500).optional(),
});

/**
 * Callback posted by the payment gateway. CMI returns its own field names; the
 * adapter in the API maps them onto this shape before validation.
 */
export const paymentCallbackSchema = z.object({
  reference: z.string().min(4).max(120),
  providerRef: z.string().min(1).max(160),
  status: z.enum(['PAID', 'FAILED']),
  amountCentimes: z.number().int().min(0),
  signature: z.string().min(8).max(512),
});

export type StartSubscriptionInput = z.infer<typeof startSubscriptionSchema>;
export type PaymentCallbackInput = z.infer<typeof paymentCallbackSchema>;
